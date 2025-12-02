import subprocess
import sys
from pathlib import Path


def main():
    service_dir = Path(__file__).parent
    proto_dir = service_dir / "proto"
    output_dir = service_dir / "app" / "generated"

    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "__init__.py").touch()

    proto_file = proto_dir / "rag.proto"

    if not proto_file.exists():
        print(f"Proto file not found: {proto_file}")
        sys.exit(1)

    cmd = [
        sys.executable,
        "-m",
        "grpc_tools.protoc",
        f"--proto_path={proto_dir}",
        f"--python_out={output_dir}",
        f"--grpc_python_out={output_dir}",
        f"--pyi_out={output_dir}",
        str(proto_file),
    ]

    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"Error generating proto: {result.stderr}")
        sys.exit(1)

    # fix the import in the generated grpc file
    grpc_file = output_dir / "rag_pb2_grpc.py"
    if grpc_file.exists():
        content = grpc_file.read_text()
        content = content.replace(
            "import rag_pb2 as rag__pb2",
            "from . import rag_pb2 as rag__pb2"
        )
        grpc_file.write_text(content)

    print(f"Generated Python gRPC stubs in {output_dir}")


if __name__ == "__main__":
    main()
