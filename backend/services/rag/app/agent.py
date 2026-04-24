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
    ])

    logger.info("ReAct agent initialized (model=gpt-oss-120b)")


# ---------------------------------------------------------------------------
# Chat history helpers
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """\
You are an academic advisor at the University of Florida.

Rules:
- Use ONLY data returned by your tools. Never invent course names, professor ratings, or requirements.
- If a tool returns no result, say "I don't have information on that."
- Only answer questions related to academics, courses, professors, or degree planning at UF.
- If the answer to the user's question is already present in the conversation history, \
use that information directly rather than calling tools again.
"""


def _parse_history(raw_rows: list[dict]) -> list:
    """Convert Supabase chat_messages rows into LangChain message objects."""
    messages = [SystemMessage(content=SYSTEM_PROMPT)]
    for row in raw_rows:
        role = row.get("role", "")
        content = row.get("content", "")
        if role == "user":
            messages.append(HumanMessage(content=content))
        elif role in ("assistant", "llm"):
            messages.append(AIMessage(content=content))
    return messages


def _get_or_create_session(session_id: str | None) -> str:
    """Return an existing session_id, or create a temporary one."""
    sb = _get_supabase()
    if session_id:
        return session_id

    # Create a throw-away session for stateless gRPC calls
    resp = sb.table("chat_sessions").insert({
        "title": "gRPC session",
    }).execute()
    return resp.data[0]["id"]


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


# ---------------------------------------------------------------------------
# Main entry point — called by gRPC handler
# ---------------------------------------------------------------------------

def ask(question: str, session_id: str | None = None) -> tuple[str, str, str]:
    """
    Ask the ReAct agent a question.

    Args:
        question: The user's question.
        session_id: Optional chat session ID for history persistence.

    Returns:
        (answer_text, status, session_id) tuple.
    """
    if _agent is None:
        raise RuntimeError("Agent not initialized — call init_agent() first")

    try:
        sid = _get_or_create_session(session_id)

        # Save user message
        _save_message(sid, "user", question)

        # Fetch full history (includes the message we just saved)
        raw_history = _fetch_history(sid)
        messages = _parse_history(raw_history)

        # Invoke agent
        res = _agent.invoke({"messages": messages})
        answer = res["messages"][-1].content

        # Save assistant response
        _save_message(sid, "assistant", answer)

        return answer, "SUCCESS", sid

    except Exception as e:
        logger.error(f"Agent error: {e}", exc_info=True)
        return f"I encountered an error processing your request: {e}", "ERROR", ""
