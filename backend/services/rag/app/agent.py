"""
ReAct Agent for AI Advisor — replaces legacy RAG engine.

Queries Supabase directly for course, professor, and Reddit data.
Manages chat history via Supabase chat_messages table.
Uses LangChain create_agent with gpt-oss-20b via UF API.
"""

import os
import logging
from supabase import create_client, Client
from langchain_openai import ChatOpenAI
from langchain.agents import create_agent
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Globals — initialized once at import time
# ---------------------------------------------------------------------------

_supabase: Client | None = None
_agent = None


def _get_supabase() -> Client:
    global _supabase
    if _supabase is None:
        url = os.environ.get("SUPABASE_URL", "")
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
        if not url or not key:
            raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
        _supabase = create_client(url, key)
    return _supabase


def init_agent():
    """Initialize the LLM + agent. Call once at server startup."""
    global _agent

    llm = ChatOpenAI(
        model="gpt-oss-120b",
        max_retries=2,
        api_key=os.environ.get("LLM_API_KEY", ""),  # type: ignore
        base_url="https://api.ai.it.ufl.edu",
    )

    _agent = create_agent(llm, tools=[
        get_professor_rating,
        get_course_info,
        get_reddit_data_professor,
        get_reddit_data_topics,
        get_transcript,
    ])

    logger.info("ReAct agent initialized (model=gpt-oss-120b)")


# ---------------------------------------------------------------------------
# Chat history helpers
# ---------------------------------------------------------------------------

SYSTEM_PROMPT_TEMPLATE = """\
You are an academic advisor at the University of Florida.

Rules:
- Use ONLY data returned by your tools. Never invent course names, professor ratings, or requirements.
- If a tool returns no result, say "I don't have information on that."
- Only answer questions related to academics, courses, professors, or degree planning at UF.
- If the answer to the user's question is already present in the conversation history, \
use that information directly rather than calling tools again.
- Only respond using the results from the tools you called for this specific query. \
- Ensure response is sufficient but as concise as possible. \
Do not repeat or summarize information from previous tool calls or prior messages \
unless the user explicitly asks for a summary.
{user_context}
"""


def _parse_history(raw_rows: list[dict], user_id: str | None = None) -> list:
    """Convert Supabase chat_messages rows into LangChain message objects."""
    user_context = ""
    if user_id:
        user_context = f"\nSome basic info about the user:\n  STUDENT USER ID: {user_id}\n  STUDENT UNIVERSITY: University of Florida"
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(user_context=user_context)
    messages = [SystemMessage(content=system_prompt)]
    for row in raw_rows:
        role = row.get("role", "")
        content = row.get("content", "")
        if role == "user":
            messages.append(HumanMessage(content=content))
        elif role in ("assistant", "llm"):
            messages.append(AIMessage(content=content))
    return messages


def _get_or_create_session(session_id: str | None, title: str = "gRPC session", user_id: str | None = None) -> str:
    """Return an existing session_id, or create a new one."""
    sb = _get_supabase()
    if session_id:
        return session_id

    row: dict = {"title": title}
    if user_id:
        row["user_id"] = user_id

    resp = sb.table("chat_sessions").insert(row).execute()
    return resp.data[0]["id"]


def get_sessions(user_id: str) -> list[dict]:
    """Get all chat sessions for a user, most recent first."""
    sb = _get_supabase()
    resp = (
        sb.table("chat_sessions")
        .select("id, title, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return resp.data


def get_messages(session_id: str) -> list[dict]:
    """Get all messages for a session, newest first."""
    sb = _get_supabase()
    resp = (
        sb.table("chat_messages")
        .select("role, content, created_at")
        .eq("session_id", session_id)
        .order("created_at", desc=True)
        .execute()
    )
    return resp.data


def _save_message(session_id: str, role: str, content: str):
    sb = _get_supabase()
    sb.table("chat_messages").insert({
        "session_id": session_id,
        "role": role,
        "content": content,
    }).execute()


def _fetch_history(session_id: str) -> list[dict]:
    sb = _get_supabase()
    resp = (
        sb.table("chat_messages")
        .select("role, content")
        .eq("session_id", session_id)
        .order("created_at", desc=False)
        .execute()
    )
    return resp.data


# ---------------------------------------------------------------------------
# Tools — these query Supabase directly
# ---------------------------------------------------------------------------

def get_professor_rating(professor_name: str):
    """Get professor rating and other info given a professor name."""
    sb = _get_supabase()
    resp = (
        sb.table("professors")
        .select("*")
        .filter("name", "wfts", f"'{professor_name}'")
        .execute()
    )
    if not resp.data:
        return "Professor was not found"
    return resp.data


def get_course_info(course_name: str):
    """Gets course info given a course name or course code."""
    sb = _get_supabase()
    query = f"%{course_name}%"
    resp = (
        sb.table("courses")
        .select("*")
        .or_(f"course_code.ilike.{query}, course_name.ilike.{query}")
        .execute()
    )
    if not resp.data:
        return "Course was not found"
    return resp.data


def get_reddit_data_professor(professor_name: str):
    """Gets insight from reddit data for a professor."""
    sb = _get_supabase()
    resp = (
        sb.table("reddit_posts")
        .select("*")
        .filter("professor", "wfts", f"'{professor_name}'")
        .execute()
    )
    if not resp.data:
        return "Professor was not found on Reddit"
    return resp.data


def get_reddit_data_topics(topic: str):
    """Gets insight from reddit data for a topic or question."""
    sb = _get_supabase()
    resp = (
        sb.table("reddit_posts")
        .select("*")
        .filter("title", "wfts", f"'{topic}'")
        .execute()
    )
    if not resp.data:
        return "Topic was not found on Reddit"
    return resp.data


def get_transcript(user_id: str):
    """Get a user's transcript complete with course data relevant to that user."""
    sb = _get_supabase()
    resp = (
        sb.table("transcript")
        .select("*")
        .eq("id", user_id)
        .execute()
    )
    if not resp.data:
        return "No transcript found for this user"
    return resp.data


# ---------------------------------------------------------------------------
# Main entry point — called by gRPC handler
# ---------------------------------------------------------------------------

def ask(question: str, session_id: str | None = None, user_id: str | None = None) -> tuple[str, str, str]:
    """
    Ask the ReAct agent a question.

    Args:
        question: The user's question.
        session_id: Optional chat session ID for history persistence.
        user_id: Optional user ID for transcript lookups and context.

    Returns:
        (answer_text, status, session_id) tuple.
    """
    if _agent is None:
        raise RuntimeError("Agent not initialized — call init_agent() first")

    sid = ""

    try:
        sid = _get_or_create_session(session_id, user_id=user_id)

        # Save user message
        _save_message(sid, "user", question)

        # Fetch full history (includes the message we just saved)
        raw_history = _fetch_history(sid)
        messages = _parse_history(raw_history, user_id=user_id)

        # Invoke agent
        res = _agent.invoke({"messages": messages})
        answer = res["messages"][-1].content

        # Save assistant response
        _save_message(sid, "assistant", answer)

        return answer, "SUCCESS", sid

    except Exception as e:
        logger.error(f"Agent error: {e}", exc_info=True)
        answer = f"I encountered an error processing your request: {e}"
        if sid:
            try:
                _save_message(sid, "assistant", answer)
            except Exception:
                logger.error("Failed to save assistant error response", exc_info=True)
        return answer, "ERROR", sid
