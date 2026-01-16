"""gRPC servicer implementation - wraps the core TextNormalizer."""

import logging
from pathlib import Path

from text_normalizer.core.abbreviations import AbbreviationWhitelist
from text_normalizer.core.normalizer import TextNormalizer
from text_normalizer.server.proto import text_normalizer_pb2, text_normalizer_pb2_grpc

logger = logging.getLogger(__name__)

# Default config path (relative to project root)
DEFAULT_ABBREVIATIONS_PATH = Path(__file__).parent.parent.parent.parent / "config" / "abbreviations.csv"


class TextNormalizerServicer(text_normalizer_pb2_grpc.TextNormalizerServiceServicer):
    """gRPC servicer that wraps the core TextNormalizer component."""

    def __init__(
        self,
        normalizer: TextNormalizer | None = None,
        abbreviations_path: str | Path | None = None,
    ):
        """Initialize the servicer with a TextNormalizer instance.

        Args:
            normalizer: Optional TextNormalizer instance. Creates new one if not provided.
            abbreviations_path: Path to abbreviations CSV file.
        """
        if normalizer:
            self._normalizer = normalizer
        else:
            # Create normalizer with default whitelist
            csv_path = abbreviations_path or DEFAULT_ABBREVIATIONS_PATH
            whitelist = AbbreviationWhitelist(csv_path)
            self._normalizer = TextNormalizer(whitelist)

        logger.info("TextNormalizerServicer initialized")

    def Normalize(self, request, context):
        """Handle normalize request."""
        result = self._normalizer.normalize(request.text)

        # Convert abbreviation expansions to repeated string format
        # Format: "original -> expanded"
        transformations = [
            f"{exp.original} -> {exp.expanded}"
            for exp in result.abbreviations_expanded
        ]

        return text_normalizer_pb2.NormalizeResponse(
            original_text=result.original_text,
            normalized_text=result.normalized_text,
            transformations_applied=transformations,
            model_used="",  # No LLM yet
        )

    def HealthCheck(self, request, context):
        """Handle health check request."""
        return text_normalizer_pb2.HealthCheckResponse(
            healthy=True,
            service_name="text_normalizer",
            llm_provider="none",  # No LLM configured yet
            llm_model="none",
        )
