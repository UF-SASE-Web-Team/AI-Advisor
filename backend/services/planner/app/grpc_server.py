import grpc
from concurrent import futures
import logging

from app.generated import planner_pb2, planner_pb2_grpc

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

        blacklisted = {}
        for day, periods in preference.blacklisted_periods.items():
            blacklisted[day] = list(periods.periods)

        logger.info(f"Blacklisted periods: {blacklisted}")

        # TODO: Need to acutally make the constraints
        return planner_pb2.SolveResponse(
            status="success",
            scheduled_courses=[],
            total_credits=0,
            error_message=""
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
