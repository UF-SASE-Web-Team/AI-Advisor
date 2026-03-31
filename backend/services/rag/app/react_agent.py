import logging
from typing import List, Dict, Any, Optional

from langchain_core.tools import Tool
from langgraph.prebuilt import create_react_agent
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain_community.chat_models import ChatOllama
from langchain_core.language_models.chat_models import BaseChatModel

from app.vector_store import VectorStore
from app.course_loader import Course, get_course_by_code
from app.rules import recommend_courses

logger = logging.getLogger(__name__)

# ReAct Prompt Template
REACT_SYSTEM_PROMPT = """You are an academic advisor assistant for the University of Florida.
Your job is to answer questions about courses, prerequisites, and academic planning.
You have access to the following tools:

{tools}

Before diving into the question, take a moment and think about what the question is asking:

```
Thought: Let's think step by step. I need to do something with the {input}, then proceed to find the appropriate tools to use to answer the question and iterate on.
```

To use a tool, please use the following format:

```
Thought: Do I need to use a tool? Yes
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
```

When you have a response to say to the Human, or if you do not need to use a tool, you MUST use the format:

```
Thought: Do I need to use a tool? No
Final Answer: [your response here]
```

Remember to always include course codes when mentioning courses. If you don't know the answer, say so honestly. Do not hallucinate a false answer that does NOT exist.

Begin!

Question: {input}
Thought:{agent_scratchpad}"""


class ReActAgent:
    def __init__(
        self,
        vector_store: VectorStore,
        courses: List[Course],
        chat_model_name: str = "llama3.2",
        llm_provider: str = "ollama",
        ollama_host: str = "http://localhost:11434",
        openai_api_key: Optional[str] = None,
    ):
        self.vector_store = vector_store
        self.courses = courses
        self.llm = self._initialize_llm(
            chat_model_name, llm_provider, ollama_host, openai_api_key
        )
        self.tools = self._create_tools()
        self.agent_executor = self._create_agent_executor()

    def _initialize_llm(
        self,
        chat_model_name: str,
        llm_provider: str,
        ollama_host: str,
        openai_api_key: Optional[str],
    ) -> BaseChatModel:
        if llm_provider.lower() == "openai":
            if not openai_api_key:
                raise ValueError("OPENAI_API_KEY is required for OpenAI provider")
            return ChatOpenAI(model=chat_model_name, api_key=openai_api_key, temperature=0.1)
        else:
            return ChatOllama(model=chat_model_name, base_url=ollama_host, temperature=0.1)

    def _create_tools(self) -> List[Tool]:
        return [
            Tool(
                name="CourseSearchTool",
                description="Search for relevant university course information based on an open-ended question or topic. Input should be a search query string. Returns text describing relevant courses.",
                func=self._tool_course_search,
            ),
            Tool(
                name="CourseInfoTool",
                description="Look up specific detailed information (prerequisites, credits, description) for an exact course code. Input MUST be a valid course code (e.g., 'COP3502').",
                func=self._tool_course_info,
            ),
            Tool(
                name="RecommendationTool",
                description="Get a list of recommended classes based on interests and completed courses. Input should be a comma-separated list of interests. Optional completed courses can be included after a semicolon. Example: 'programming, web; COP1000' or just 'machine learning'.",
                func=self._tool_recommend_courses,
            ),
            Tool(
                name="CourseReviewsTool",
                description="Search for relevant university course reviews with the scraped data from Reddit and Rate my Professors based on questions that specify whether the class is good or not, or if they should add the class to their schedule or not.",
                func=self._tool_course_reviews,
            ),
        ]

    def _create_agent_executor(self):
        # With langgraph we use the pre-built react agent
        # We don't need the custom reasoning prompt, the prebuilt agent handles it
        return create_react_agent(self.llm, tools=self.tools)

    # --- Tool Implementations ---

    def _tool_course_search(self, query: str) -> str:
        """Search the vector store for context."""
        logger.info(f"[Tool] CourseSearchTool called with: {query}")
        results = self.vector_store.search(query, n_results=5)
        if not results:
            return "No relevant course information found in the knowledge base."
        
        context_parts = []
        for i, res in enumerate(results, 1):
            context_parts.append(f"Course {i}:\n{res['content']}")
        return "\n\n".join(context_parts)

    def _tool_course_info(self, course_code: str) -> str:
        """Retrieve exact course info."""
        course_code = course_code.strip()
        logger.info(f"[Tool] CourseInfoTool called with: {course_code}")
        course = get_course_by_code(self.courses, course_code)
        if not course:
            return f"Course '{course_code}' not found."
        
        return (
            f"Code: {course.code}\n"
            f"Name: {course.name}\n"
            f"Description: {course.description}\n"
            f"Prerequisites: {course.prerequisites}\n"
            f"Credits: {course.credits}\n"
            f"Department: {course.department}"
        )

    def _tool_recommend_courses(self, input_str: str) -> str:
        """Run rule-based recommender."""
        logger.info(f"[Tool] RecommendationTool called with: {input_str}")
        
        parts = input_str.split(";")
        interests_str = parts[0].strip()
        completed_str = parts[1].strip() if len(parts) > 1 else ""

        interests = [i.strip() for i in interests_str.split(",")] if interests_str else []
        completed = [c.strip() for c in completed_str.split(",")] if completed_str else []

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

        recommended = recommend_courses(
            courses=courses_dict,
            completed=set(completed),
            interests=interests,
            max_credits=15,
            term="",
            level="undergrad",
        )

        if not recommended:
            return "No recommended courses found matching the criteria."

        res_lines = ["Recommended Courses:"]
        for c in recommended:
            res_lines.append(f"- {c.get('code', '')} ({c.get('name', '')}): {c.get('description', '')[:100]}...")
        
        return "\n".join(res_lines)
    
    def _tool_course_reviews(self, course_code: str) -> str:
        """Retrieve course reviews through searching in scraped Reddit and Rate my Professor data."""
        course_code = course_code.strip()
        logger.info(f"[Tool] CourseReviewsTool called with: {course_code}")
        course = get_course_by_code(self.courses, course_code)
        if not course:
            return f"Course '{course_code}' not found."
        
        return (
            f"Code: {course.code}\n"
            f"Name: {course.name}\n"
            f"Reviews:{course.reviews}\n"
            f"Course Ratings: {course.ratings}\n"
        )

    # --- Public API ---

    def run(self, input_text: str) -> str:
        """Execute the agent on user input."""
        try:
            # LangGraph create_react_agent workflow expects a dict with 'messages'
            system_msg = "You are an academic advisor for the University of Florida. Answer questions about courses. Mention course codes. Say honestly if you do not know."
            
            response = self.agent_executor.invoke({
                "messages": [
                    ("system", system_msg),
                    ("user", input_text)
                ]
            })
            
            # response['messages'] contains the conversation thread, last one is the agent's output
            messages = response.get("messages", [])
            if messages:
                return messages[-1].content
            return "I could not find an answer."
        except Exception as e:
            logger.error(f"Error running ReAct agent: {e}")
            return f"An error occurred while thinking: {str(e)}"
