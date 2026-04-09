from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

def get_professor_rating(professor_name: str):
    """  Get professor rating and other info given a professor name """
    print(professor_name)
    professor_data = (
        supabase.table("professors")
        .select("*")
        .ilike("name", f"%{professor_name}%")
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
        .text_search("professor", professor_name, options={"config": "english"})
        .execute()
    )
    return reddit_data

def get_reddit_data_topics(topic: str):
    """ Gets insight from reddit data for a topic or question"""
    reddit_data = (
        supabase.table("reddit_posts")
        .select("*")
        .text_search("title", topic, options={"config": "english"})
        .execute()
    )
    return reddit_data