import grpc
from concurrent import futures
import logging
import os
import re

from app.generated import rag_pb2, rag_pb2_grpc
from app.agent import init_agent, ask, get_course_info as _lookup_course

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RAGServicer(rag_pb2_grpc.RAGServiceServicer):
    """gRPC servicer backed by the ReAct agent."""

    def Health(self, request, context):
        return rag_pb2.HealthResponse(status="ok")

    def Query(self, request, context):
        question = request.question
        logger.info(f"Received query: {question}")

        try:
            answer, status = ask(question)

            return rag_pb2.QueryResponse(
                answer=answer,
                sources=[],
                error_message="" if status == "SUCCESS" else answer,
            )
        except Exception as e:
            logger.error(f"Error processing query: {e}", exc_info=True)
            return rag_pb2.QueryResponse(
                answer="",
                error_message=str(e),
            )

    def GetCourseInfo(self, request, context):
        course_code = request.course_code
        logger.info(f"Getting course info for: {course_code}")

        try:
            result = _lookup_course(course_code)

            if isinstance(result, str):
                # "Course was not found"
                return rag_pb2.CourseInfoResponse(
                    found=False,
                    error_message=result,
                )

            if not result:
                return rag_pb2.CourseInfoResponse(
                    found=False,
                    error_message="Course not found",
                )

            # Take the first matching course
            course = result[0] if isinstance(result, list) else result

            # Extract meeting times from sections JSONB
            meeting_times = []
            sections = course.get("sections", []) or []
            if isinstance(sections, list):
                for section in sections:
                    for mt in section.get("meetTimes", []):
                        meeting_times.append(rag_pb2.MeetingTime(
                            days=mt.get("meetDays", []),
                            time_begin=mt.get("meetTimeBegin", ""),
                            time_end=mt.get("meetTimeEnd", ""),
                            building=mt.get("meetBuilding", ""),
                            room=mt.get("meetRoom", ""),
                        ))

            # Extract unique instructor names from sections
            instructors = []
            if isinstance(sections, list):
                seen = set()
                for section in sections:
                    for inst in section.get("instructors", []):
                        name = inst.get("name", "") if isinstance(inst, dict) else str(inst)
                        if name and name not in seen:
                            seen.add(name)
                            instructors.append(name)

            return rag_pb2.CourseInfoResponse(
                found=True,
                course_code=course.get("course_code", ""),
                course_name=course.get("course_name", ""),
                description=course.get("description", ""),
                prerequisites=course.get("prerequisites", ""),
                credits=course.get("credits", 0) or 0,
                department=course.get("department", ""),
                instructors=instructors,
                meeting_times=meeting_times,
            )
        except Exception as e:
            logger.error(f"Error getting course info: {e}", exc_info=True)
            return rag_pb2.CourseInfoResponse(
                found=False,
                error_message=str(e),
            )


def serve(port: int = 50052):
    logger.info("Initializing ReAct agent...")
    init_agent()

    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    rag_pb2_grpc.add_RAGServiceServicer_to_server(RAGServicer(), server)
    server.add_insecure_port(f"[::]:{port}")
    server.start()
    logger.info(f"Advisor gRPC server started on port {port}")
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
