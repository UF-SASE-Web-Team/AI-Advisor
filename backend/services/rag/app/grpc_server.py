import grpc
from concurrent import futures
import logging
import os
from pathlib import Path

from app.generated import rag_pb2, rag_pb2_grpc
from app.course_loader import load_courses_from_json
from app.vector_store import VectorStore
from app.rag_engine import RAGEngine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RAGServicer(rag_pb2_grpc.RAGServiceServicer):
    def __init__(self, rag_engine: RAGEngine, courses: list):
        self.rag_engine = rag_engine
        self.courses = courses

    def Health(self, request, context):
        return rag_pb2.HealthResponse(status="ok")

    def Query(self, request, context):
        question = request.question
        max_results = request.max_results or 5

        logger.info(f"Received query: {question}")

        try:
            result = self.rag_engine.query(question, max_results=max_results)

            sources = []
            for source in result.get("sources", []):
                sources.append(rag_pb2.SourceDocument(
                    course_code=source.get("course_code", ""),
                    course_name=source.get("course_name", ""),
                    content=source.get("content", ""),
                    relevance_score=source.get("relevance_score", 0.0),
                ))

            return rag_pb2.QueryResponse(
                answer=result.get("answer", ""),
                sources=sources,
            )
        except Exception as e:
            logger.error(f"Error processing query: {e}")
            return rag_pb2.QueryResponse(
                answer="",
                error_message=str(e),
            )

    def GetCourseInfo(self, request, context):
        course_code = request.course_code

        logger.info(f"Getting course info for: {course_code}")

        try:
            result = self.rag_engine.get_course_info(course_code)

            if not result.get("found"):
                return rag_pb2.CourseInfoResponse(
                    found=False,
                    error_message=result.get("error_message", "Course not found"),
                )

            # Convert meeting times
            meeting_times = []
            for mt in result.get("meeting_times", []):
                meeting_times.append(rag_pb2.MeetingTime(
                    days=mt.get("days", []),
                    time_begin=mt.get("time_begin", ""),
                    time_end=mt.get("time_end", ""),
                    building=mt.get("building", ""),
                    room=mt.get("room", ""),
                ))

            return rag_pb2.CourseInfoResponse(
                found=True,
                course_code=result.get("course_code", ""),
                course_name=result.get("course_name", ""),
                description=result.get("description", ""),
                prerequisites=result.get("prerequisites", ""),
                credits=result.get("credits", 0),
                department=result.get("department", ""),
                instructors=result.get("instructors", []),
                meeting_times=meeting_times,
            )
        except Exception as e:
            logger.error(f"Error getting course info: {e}")
            return rag_pb2.CourseInfoResponse(
                found=False,
                error_message=str(e),
            )

    def Recommend(self, request, context):
        completed_courses = list(request.completed_courses)
        interests = list(request.interests)
        max_credits = request.max_credits or 15
        term = request.term or ""
        level = request.level or "undergrad"

        logger.info(f"Recommend request - completed: {completed_courses}, interests: {interests}, max_credits: {max_credits}")

        try:
            result = self.rag_engine.recommend(
                completed_courses=completed_courses,
                interests=interests,
                max_credits=max_credits,
                term=term,
                level=level,
            )

            courses = []
            for course in result.get("courses", []):
                courses.append(rag_pb2.RecommendedCourse(
                    course_code=course.get("code", ""),
                    course_name=course.get("name", "") or course.get("title", ""),
                    credits=course.get("credits", 3),
                    description=course.get("description", "")[:500],
                    score=course.get("_score", 0.0),
                    prerequisites=course.get("prerequisites", ""),
                ))

            return rag_pb2.RecommendResponse(
                courses=courses,
                total_credits=result.get("total_credits", 0),
                explanation=result.get("explanation", ""),
            )
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return rag_pb2.RecommendResponse(
                error_message=str(e),
            )


def serve(port: int = 50052):
    # Get configuration from environment
    ollama_host = os.environ.get("OLLAMA_HOST", "http://ollama:11434")
    embedding_model = os.environ.get("EMBEDDING_MODEL", "nomic-embed-text")
    chat_model = os.environ.get("CHAT_MODEL", "llama3.2")
    course_data_path = os.environ.get("COURSE_DATA_PATH", "/app/data/courses.json")
    chroma_path = os.environ.get("CHROMA_PATH", "/app/data/chroma")

    logger.info(f"Ollama host: {ollama_host}")
    logger.info(f"Embedding model: {embedding_model}")
    logger.info(f"Chat model: {chat_model}")
    logger.info(f"Course data path: {course_data_path}")

    # Load course data
    course_file = Path(course_data_path)
    if not course_file.exists():
        logger.error(f"Course data file not found: {course_data_path}")
        raise FileNotFoundError(f"Course data file not found: {course_data_path}")

    logger.info("Loading course data...")
    courses = load_courses_from_json(course_file)
    logger.info(f"Loaded {len(courses)} courses")

    # Initialize vector store
    logger.info("Initializing vector store...")
    vector_store = VectorStore(
        ollama_host=ollama_host,
        embedding_model=embedding_model,
        persist_directory=chroma_path,
    )

    # Add courses to vector store
    logger.info("Ingesting courses into vector store...")
    vector_store.add_courses(courses)

    # Initialize RAG engine
    rag_engine = RAGEngine(
        vector_store=vector_store,
        courses=courses,
        ollama_host=ollama_host,
        chat_model=chat_model,
    )

    # Start gRPC server
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    rag_pb2_grpc.add_RAGServiceServicer_to_server(
        RAGServicer(rag_engine, courses), server
    )
    server.add_insecure_port(f"[::]:{port}")
    server.start()
    logger.info(f"RAG gRPC server started on port {port}")
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
