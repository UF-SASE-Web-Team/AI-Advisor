import os
from app.grpc_server import serve


def main():
    port = int(os.environ.get("GRPC_PORT", "50051"))
    serve(port=port)


if __name__ == "__main__":
    main()
