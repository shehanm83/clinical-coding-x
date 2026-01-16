"""gRPC servicer implementation - wraps the core TextNormalizer."""

import logging

from shared.config import get_settings
from text_normalizer.core.models import NormalizationMode
from text_normalizer.core.normalizer import TextNormalizer
from text_normalizer.server.proto import text_normalizer_pb2, text_normalizer_pb2_grpc

logger = logging.getLogger(__name__)


class TextNormalizerServicer(text_normalizer_pb2_grpc.TextNormalizerServiceServicer):
    """gRPC servicer that wraps the core TextNormalizer component.

    Supports both basic and LLM-powered normalization modes.
    The mode can be specified per-request or defaults to server configuration.
    """

    def __init__(
        self,
        normalizer: TextNormalizer | None = None,
    ):
        """Initialize the servicer with a TextNormalizer instance.

        Args:
            normalizer: Optional TextNormalizer instance. Creates new one if not provided.
        """
        self._settings = get_settings()

        # Create normalizers for both modes
        self._basic_normalizer = TextNormalizer()
        self._llm_normalizer = normalizer        

        logger.info(
            f"TextNormalizerServicer initialized. "
            f"LLM provider: {self._settings.llm.provider}, "
            f"LLM model: {self._settings.llm.model}"
        )

    def _get_normalizer(self) -> tuple[TextNormalizer]:
        """Get the appropriate normalizer based on request mode.

        Returns:
            Tuple of (normalizer)
        """
        if self._llm_normalizer is None:
            self._llm_normalizer = TextNormalizer()
            return self._llm_normalizer


    def Normalize(self, request, context):
        """Handle normalize request (synchronous)."""
        normalizer = self._get_normalizer(request.mode)

        result = normalizer.normalize(request.text)


        return text_normalizer_pb2.NormalizeResponse(
            original_text=result.original_text,
            normalized_text=result.normalized_text,
            transformations_applied=result.transformations_applied,
            model_used=result.model_used or "",
        )

    def HealthCheck(self, request, context):
        """Handle health check request."""
        return text_normalizer_pb2.HealthCheckResponse(
            healthy=True,
            service_name="text_normalizer",
            llm_provider=self._settings.llm.provider,
            llm_model=self._settings.llm.model,
        )
