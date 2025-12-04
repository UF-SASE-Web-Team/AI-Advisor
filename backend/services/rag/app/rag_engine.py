import logging
import os
import ollama
from openai import OpenAI

from app.vector_store import VectorStore
from app.course_loader import Course, get_course_by_code
from app.rules import recommend_courses

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
        llm_provider: str = "ollama",  # "ollama" or "openai"
        openai_api_key: str | None = None,
    ):
        self.vector_store = vector_store
        self.courses = courses
        self.chat_model = chat_model
        self.llm_provider = llm_provider.lower()

        if self.llm_provider == "openai":
            api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY is required when using OpenAI provider")
            self.openai_client = OpenAI(api_key=api_key)
            logger.info(f"Using OpenAI with model: {chat_model}")
        else:
            self.ollama_host = ollama_host
            self.ollama_client = ollama.Client(host=ollama_host)
            logger.info(f"Using Ollama with model: {chat_model}")

    def _chat(self, system_prompt: str, user_prompt: str) -> str:
        """Unified chat method that works with both Ollama and OpenAI."""
        if self.llm_provider == "openai":
            response = self.openai_client.chat.completions.create(
                model=self.chat_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            )
            return response.choices[0].message.content
        else:
            response = self.ollama_client.chat(
                model=self.chat_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            )
            return response['message']['content']

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

        # Call LLM (Ollama or OpenAI)
        try:
            answer = self._chat(SYSTEM_PROMPT, user_prompt)
        except Exception as e:
            logger.error(f"Error calling LLM: {e}")
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

    def recommend(
        self,
        completed_courses: list[str],
        interests: list[str],
        max_credits: int = 15,
        term: str = "",
        level: str = "undergrad",
    ) -> dict:
        # Convert courses to dict format for rules engine
        courses_dict = []
        for course in self.courses:
            courses_dict.append({
                "code": course.code,
                "name": course.name,
                "title": course.name,
                "description": course.description,
                "prerequisites": course.prerequisites,
                "credits": course.credits,
                "department": course.department,
            })

        # Get recommendations using rules engine
        recommended = recommend_courses(
            courses=courses_dict,
            completed=set(completed_courses),
            interests=interests,
            max_credits=max_credits,
            term=term,
            level=level,
        )

        if not recommended:
            return {
                "courses": [],
                "total_credits": 0,
                "explanation": "No courses found matching your criteria.",
            }

        # Calculate total credits
        total_credits = sum(c.get("credits", 3) for c in recommended)

        # Generate explanation using LLM
        explanation = self._generate_recommendation_explanation(
            recommended, completed_courses, interests
        )

        return {
            "courses": recommended,
            "total_credits": total_credits,
            "explanation": explanation,
        }

    def _generate_recommendation_explanation(
        self,
        recommended: list[dict],
        completed: list[str],
        interests: list[str],
    ) -> str:
        course_list = "\n".join([
            f"- {c.get('code', '')} {c.get('name', '')}: {c.get('description', '')[:100]}..."
            for c in recommended[:5]
        ])

        prompt = f"""As an academic advisor, briefly explain why these courses are recommended for a student.

Student has completed: {', '.join(completed) if completed else 'No courses yet'}
Student interests: {', '.join(interests) if interests else 'General'}

Recommended courses:
{course_list}

Provide a brief (2-3 sentences) explanation of why these courses are a good fit:"""

        try:
            return self._chat(SYSTEM_PROMPT, prompt)
        except Exception as e:
            logger.error(f"Error generating explanation: {e}")
            return "These courses were selected based on your interests and completed prerequisites."
