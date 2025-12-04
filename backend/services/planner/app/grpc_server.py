import grpc
from concurrent import futures
import logging

from . import solver as solver
from .generated import planner_pb2, planner_pb2_grpc

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PlannerServicer(planner_pb2_grpc.PlannerServiceServicer):
    def Health(self, request, context):
        return planner_pb2.HealthResponse(status="ok")

    def Solve(self, request, context):
        preference = request.preference
        logger.info(
            f"Received solve request: x={preference.x}, y={preference.y}, "
            f"z={preference.z}, min_credits={preference.min_credits}, "
            f"max_credits={preference.max_credits}"
        )

        blacklisted = set()
        for day, periods in preference.blacklisted_periods.items():
            for p in periods.periods:
                blacklisted.add((day, int(p)))

        user_prefs = {
            "X_major": preference.x,
            "Y_minor": preference.y,
            "Z_elective": preference.z,
            "min_credits": preference.min_credits,
            "max_credits": preference.max_credits,
        }

        all_courses = solver.get_all_courses_data()
        completed_courses = solver.get_completed_courses()
        eligible_courses, eligible_sections = solver.filter_eligible_data(
            all_courses, completed_courses, blacklisted
        )

        if not eligible_courses:
            return planner_pb2.SolveResponse(
                status="error",
                scheduled_courses=[],
                total_credits=0,
                error_message="No eligible courses found based on prerequisites/blacklist."
            )
        
        schedule_ids, total_credits = solver.solve_schedule(
            eligible_courses, eligible_sections, user_prefs, completed_courses
        )

        if not schedule_ids:
            return planner_pb2.SolveResponse(
                status="error",
                scheduled_courses=[],
                total_credits=0,
                error_message="No feasible schedule found. Try loosening constraints."
            )
        
        pb_courses = []
        for s_id in schedule_ids:
            sec_data = eligible_sections[s_id] # {'course_code': '...', 'slots': [...]}
            course_code = sec_data['course_code']
            course_info = eligible_courses[course_code]

            for slot in sec_data['slots']:
                day_char = slot[0]  # 'M'
                period_num = slot[1] # 2
                
                pb_courses.append(planner_pb2.ScheduledCourse(
                    course_id=course_code,
                    course_name=course_info['name'],
                    credits=course_info['credits'],
                    course_type=course_info['type'],
                    day=day_char,
                    period=period_num
                ))

        return planner_pb2.SolveResponse(
            status="success",
            scheduled_courses=pb_courses,
            total_credits=total_credits
        )


def serve(port: int = 50051):
    # Starts the gRPC server
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    planner_pb2_grpc.add_PlannerServiceServicer_to_server(
        PlannerServicer(), server
    )
    server.add_insecure_port(f"[::]:{port}")
    server.start()
    logger.info(f"Planner gRPC server started on port {port}")
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
