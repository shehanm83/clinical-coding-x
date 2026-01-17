"""Script to generate Python code from proto files."""

import sys
from pathlib import Path

from grpc_tools import protoc


# Proto file configurations: (module_name, proto_file_name)
PROTO_CONFIGS = [
    ("text_normalizer", "text_normalizer.proto"),
    ("concept_extractor", "concept_extractor.proto"),
]


def generate_proto(module_name: str, proto_file_name: str) -> bool:
    """Generate Python gRPC code from a single proto file.

    Args:
        module_name: Module name (e.g., 'text_normalizer').
        proto_file_name: Proto file name (e.g., 'text_normalizer.proto').

    Returns:
        True if successful, False otherwise.
    """
    project_root = Path(__file__).parent.parent
    proto_dir = project_root / "src" / module_name / "server" / "proto"
    proto_file = proto_dir / proto_file_name

    if not proto_file.exists():
        print(f"Proto file not found: {proto_file}")
        return False

    # Base name for generated files (e.g., 'text_normalizer' from 'text_normalizer.proto')
    base_name = proto_file_name.replace(".proto", "")

    args = [
        "grpc_tools.protoc",
        f"--proto_path={proto_dir}",
        f"--python_out={proto_dir}",
        f"--grpc_python_out={proto_dir}",
        str(proto_file),
    ]

    print(f"Generating {module_name} proto...")
    result = protoc.main(args)

    if result != 0:
        print(f"protoc failed for {module_name} with exit code {result}")
        return False

    # Fix imports in generated files
    grpc_file = proto_dir / f"{base_name}_pb2_grpc.py"
    if grpc_file.exists():
        content = grpc_file.read_text()
        content = content.replace(
            f"import {base_name}_pb2",
            f"from {module_name}.server.proto import {base_name}_pb2",
        )
        grpc_file.write_text(content)

    print(f"  {module_name} proto generated successfully!")
    return True


def generate_protos():
    """Generate Python gRPC code from all proto files."""
    failed = []

    for module_name, proto_file_name in PROTO_CONFIGS:
        if not generate_proto(module_name, proto_file_name):
            failed.append(module_name)

    if failed:
        print(f"\nFailed to generate protos for: {', '.join(failed)}")
        sys.exit(1)

    print("\nAll proto files generated successfully!")


if __name__ == "__main__":
    generate_protos()
