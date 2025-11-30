import logging
import ollama

from app.vector_store import VectorStore
from app.course_loader import Course, get_course_by_code

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a helpful academic advisor assistant for University of Florida students.
Your role is to answer questions about courses, prerequisites, and academic planning.

Use the provided course information to answer questions accurately.
If the information isn't in the context, say so honestly.
Be concise but thorough. When mentioning courses, include the course code."""


class RAGEngine:
    def __init__(
        self,
        vector_store: VectorStore,
        courses: list[Course],
        ollama_host: str = "http://localhost:11434",
        chat_model: str = "llama3.2",
    ):
        self.vector_store = vector_store
        self.courses = courses
        self.ollama_host = ollama_host
        self.chat_model = chat_model
        self.ollama_client = ollama.Client(host=ollama_host)

    def query(self, question: str, max_results: int = 5) -> dict:
        # Search for relevant courses
        search_results = self.vector_store.search(question, n_results=max_results)

        if not search_results:
            return {
                "answer": "I couldn't find any relevant course information to answer your question.",
                "sources": [],
            }

        # Building the context from search results
        context_parts = []
        for i, result in enumerate(search_results, 1):
            context_parts.append(f"[Course {i}]\n{result['content']}")

        context = "\n\n".join(context_parts)

        # Building up the prompt
        user_prompt = f"""Based on the following course information, please answer the question.

Course Information:
{context}

Question: {question}

Answer:"""

        # Call Ollama
        try:
            response = self.ollama_client.chat(
                model=self.chat_model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
            )
            answer = response['message']['content']
        except Exception as e:
            logger.error(f"Error calling Ollama: {e}")
            return {
                "answer": f"Error generating response: {str(e)}",
                "sources": search_results,
            }

        return {
            "answer": answer,
            "sources": search_results,
        }

    def get_course_info(self, course_code: str) -> dict:
        course = get_course_by_code(self.courses, course_code)

        if not course:
            return {
                "found": False,
                "error_message": f"Course {course_code} not found",
            }

        return {
            "found": True,
            "course_code": course.code,
            "course_name": course.name,
            "description": course.description,
            "prerequisites": course.prerequisites,
            "credits": course.credits,
            "department": course.department,
            "instructors": course.instructors,
            "meeting_times": course.meeting_times,
        }
