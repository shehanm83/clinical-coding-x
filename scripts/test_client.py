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

    # Test normalize - clinical text
    print("\n" + "=" * 60)
    print("Testing Normalize...")
    print("=" * 60)
    clinical_text = "patient with diabatic have a pain in left leg"
    try:
        response = stub.Normalize(
            text_normalizer_pb2.NormalizeRequest(text=clinical_text)
        )
        print(f"  Original: '{response.original_text}'")
        print(f"  Normalized: '{response.normalized_text}'")
        print(f"  Model Used: {response.model_used}")
        print(f"  Processing Time: {response.processing_time_ms}ms")
        print(f"  Tokens Used: {response.tokens_used}")

        print("\n  Abbreviations Expanded:")
        for abbrev in response.abbreviations_expanded:
            print(f"    - {abbrev.original} -> {abbrev.expanded}")

        print("\n  Spelling Corrections:")
        for corr in response.spelling_corrections:
            print(f"    - {corr.original} -> {corr.corrected}")

        print("\n  Clinical Phrases:")
        for phrase in response.clinical_phrases:
            print(f"    - [{phrase.phrase_type}] {phrase.text}")

        print("\n  Modifiers:")
        for mod in response.modifiers:
            print(f"    - [{mod.modifier_type}] {mod.value} -> {mod.target_phrase}")

        print("\n  Relationships:")
        for rel in response.relationships:
            print(f"    - [{rel.relationship_type}] {rel.source_phrase} -> {rel.target_phrase}")

        print("\n  Negations:")
        for neg in response.negations:
            print(f"    - {neg.text} (negated={neg.negated})")

    except grpc.RpcError as e:
        print(f"  Error: {e.details()}")

    # Test with more complex clinical text
    print("\n" + "=" * 60)
    print("Testing with complex clinical text...")
    print("=" * 60)
    clinical_text2 = "Patient has severe CP radiating to left arm, accompanied by SOB"
    try:
        response = stub.Normalize(
            text_normalizer_pb2.NormalizeRequest(text=clinical_text2)
        )
        print(f"  Original: '{response.original_text}'")
        print(f"  Normalized: '{response.normalized_text}'")

        print("\n  Clinical Phrases:")
        for phrase in response.clinical_phrases:
            print(f"    - [{phrase.phrase_type}] {phrase.text}")

        print("\n  Modifiers:")
        for mod in response.modifiers:
            print(f"    - [{mod.modifier_type}] {mod.value} -> {mod.target_phrase}")

        print("\n  Relationships:")
        for rel in response.relationships:
            print(f"    - [{rel.relationship_type}] {rel.source_phrase} -> {rel.target_phrase}")

    except grpc.RpcError as e:
        print(f"  Error: {e.details()}")

    print("\n" + "=" * 60)
    print("All tests completed!")
    print("=" * 60)


if __name__ == "__main__":
    main()
