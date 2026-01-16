"""Test client for text normalizer gRPC service."""

import grpc

from text_normalizer.server.proto import text_normalizer_pb2, text_normalizer_pb2_grpc


def main():
    channel = grpc.insecure_channel("localhost:50051")
    stub = text_normalizer_pb2_grpc.TextNormalizerServiceStub(channel)

    # Test health check
    print("=" * 60)
    print("Testing HealthCheck...")
    print("=" * 60)
    health_response = stub.HealthCheck(text_normalizer_pb2.HealthCheckRequest())
    print(f"  Healthy: {health_response.healthy}")
    print(f"  Service: {health_response.service_name}")
    print(f"  LLM Provider: {health_response.llm_provider}")
    print(f"  LLM Model: {health_response.llm_model}")

    # Test normalize - BASIC mode
    print("\n" + "=" * 60)
    print("Testing Normalize (BASIC mode)...")
    print("=" * 60)
    test_text = "  Hello   WORLD  this is   a TEST  "
    normalize_response = stub.Normalize(
        text_normalizer_pb2.NormalizeRequest(
            text=test_text,
            mode=text_normalizer_pb2.NormalizationMode.BASIC,
        )
    )
    print(f"  Original: '{normalize_response.original_text}'")
    print(f"  Normalized: '{normalize_response.normalized_text}'")
    print(f"  Transformations: {list(normalize_response.transformations_applied)}")
    print(f"  Mode: {'LLM' if normalize_response.mode == 1 else 'BASIC'}")
    print(f"  Model Used: {normalize_response.model_used or 'N/A'}")

    # Test normalize - LLM mode (clinical text)
    print("\n" + "=" * 60)
    print("Testing Normalize (LLM mode)...")
    print("=" * 60)
    clinical_text = "pt c/o ha x 3d, hx of htn, no n/v"
    try:
        normalize_response = stub.Normalize(
            text_normalizer_pb2.NormalizeRequest(
                text=clinical_text,
                mode=text_normalizer_pb2.NormalizationMode.LLM,
            )
        )
        print(f"  Original: '{normalize_response.original_text}'")
        print(f"  Normalized: '{normalize_response.normalized_text}'")
        print(f"  Transformations: {list(normalize_response.transformations_applied)}")
        print(f"  Mode: {'LLM' if normalize_response.mode == 1 else 'BASIC'}")
        print(f"  Model Used: {normalize_response.model_used or 'N/A'}")
    except grpc.RpcError as e:
        print(f"  LLM mode failed (expected if no LLM configured): {e.details()}")

    print("\n" + "=" * 60)
    print("All tests completed!")
    print("=" * 60)


if __name__ == "__main__":
    main()
