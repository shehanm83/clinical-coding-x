"""Script to generate Python code from proto files."""

import sys
from pathlib import Path

from grpc_tools import protoc


def generate_protos():
    """Generate Python gRPC code from proto files."""
    project_root = Path(__file__).parent.parent
    proto_dir = project_root / "src" / "text_normalizer" / "server" / "proto"
    proto_file = proto_dir / "text_normalizer.proto"

    if not proto_file.exists():
        print(f"Proto file not found: {proto_file}")
        return

    args = [
        "grpc_tools.protoc",
        f"--proto_path={proto_dir}",
        f"--python_out={proto_dir}",
        f"--grpc_python_out={proto_dir}",
        str(proto_file),
    ]

    print(f"Running protoc with args: {args}")
    result = protoc.main(args)

    if result != 0:
        print(f"protoc failed with exit code {result}")
        sys.exit(result)

    # Fix imports in generated files
    grpc_file = proto_dir / "text_normalizer_pb2_grpc.py"
    if grpc_file.exists():
        content = grpc_file.read_text()
        content = content.replace(
            "import text_normalizer_pb2",
            "from text_normalizer.server.proto import text_normalizer_pb2",
        )
        grpc_file.write_text(content)

    print("Proto files generated successfully!")


if __name__ == "__main__":
    generate_protos()
