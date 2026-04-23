from supabase import create_client, Client
import os
from dotenv import load_dotenv
from uuid import uuid4
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

load_dotenv()

url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def parse_history(history: list[dict]):
    admin_prompt: str = """
      Make sure to use the tools strictly and use only data from there. Do not hallucinate data or use other info.
      Only answer academic inquiries. If the answer to the user's question is already present in the conversation history, 
      use that information directly rather than calling tools again. Only respond using the results from the tools you called for this specific query. 
      Do not repeat or summarize information from previous tool calls or prior messages 
      unless the user explicitly asks for a summary.
      Some basic info about user is:
        STUDENT UNIVERSITY: University of Florida
    """
    parsed_history= [
        SystemMessage(content=admin_prompt)
    ]
    for item in history.data: # type: ignore
        if item["role"] == "user":
            parsed_history.append(HumanMessage(content=item["content"])) # type: ignore
        elif item["role"] == "llm":
            parsed_history.append(AIMessage(content=item["content"])) # type: ignore
    return parsed_history

def get_conversation_history(session_id: str):
    # Get the history of the converation
    convo_data = (
        supabase.table("chat_messages")
        .select("*")
        .eq("session_id", session_id)
        .execute()
    )
    return parse_history(convo_data)

def update_conversation_history(session_id: str, role: str, content: str):
    data: dict = {
        "session_id": session_id,
        "role": role,
        "content": content
    }
    response = (
        supabase.table("chat_messages")
        .insert(data)
        .execute()
    )
    return response

def create_session(user_id: str, title: str):
    data: dict = {
        "user_id": user_id,
        "title": title
    }
    response = (
        supabase.table("chat_sessions")
        .insert(data)
        .execute()
    )
    return response

# def get_conversation_history(session_id: str):
#     # Get the history of the converation
#     convo_data = (
#         supabase.table("chat_messages")
#         .select("*")
#         .eq("session_id", session_id)
#         .execute()
#     )
#     return convo_data

def get_professor_rating(professor_name: str):
    """  Get professor rating and other info given a professor name """
    professor_data = (
        supabase.table("professors")
        .select("*")
        .filter("name", "wfts", f"'{professor_name}'")
        .execute()
    )
    return professor_data

def get_course_info(course_name: str):
    """ Gets course info given a course name or course code """
    query: str = f"%{course_name}%"
    course_data = (
        supabase.table("courses")
        .select("*")
        .or_(f"course_code.ilike.{query}, course_name.ilike.{query}")
        .execute()
    )
    return course_data

def get_reddit_data_professor(professor_name: str):
    """ Gets insight from reddit data for a professor"""
    reddit_data = (
        supabase.table("reddit_posts")
        .select("*")
        .filter("professor", "wfts", f"'{professor_name}'")
        .execute()
    )
    return reddit_data

def get_reddit_data_topics(topic: str):
    """ Gets insight from reddit data for a topic or question"""
    reddit_data = (
        supabase.table("reddit_posts")
        .select("*")
        .filter("title", "wfts", f"'{topic}'")
        .execute()
    )
    return reddit_data

if __name__ == "__main__":
    
    # Generates session
    example_user = "56d89bb8-a856-4939-81bd-43bb6f2380a8"
    test = create_session(
        user_id=example_user,
        title="test convo"
    )
    print(test.data[0]['id']) # gives id of created session

    # Updates conversation history
    # example_session = "9c8ee11f-2a94-4bbf-8177-cd24840a13ae"
    # update_conversation_history(
    #     session_id=example_session,
    #     role="assistant",
    #     content="Its a good class again"
    # )

    # Gets conversation history
    # history = get_conversation_history(example_session)
    # print(history)