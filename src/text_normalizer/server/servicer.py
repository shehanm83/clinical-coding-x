"""gRPC servicer implementation - wraps the core TextNormalizer."""

import asyncio
import logging
from pathlib import Path

from shared.config import get_settings
from shared.llm_client import LLMClient
from text_normalizer.core.abbreviations import AbbreviationWhitelist
from text_normalizer.core.normalizer import TextNormalizer
from text_normalizer.core.prompts import PromptManager
from text_normalizer.server.proto import text_normalizer_pb2, text_normalizer_pb2_grpc

logger = logging.getLogger(__name__)

# Default paths (relative to project root)
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
DEFAULT_ABBREVIATIONS_PATH = PROJECT_ROOT / "config" / "abbreviations.csv"
DEFAULT_PROMPTS_DIR = PROJECT_ROOT / "prompts"


class TextNormalizerServicer(text_normalizer_pb2_grpc.TextNormalizerServiceServicer):
    """gRPC servicer that wraps the core TextNormalizer component."""

    def __init__(
        self,
        normalizer: TextNormalizer | None = None,
        abbreviations_path: str | Path | None = None,
        prompts_dir: str | Path | None = None,
    ):
        """Initialize the servicer with a TextNormalizer instance.

        Args:
            normalizer: Optional TextNormalizer instance. Creates new one if not provided.
            abbreviations_path: Path to abbreviations CSV file.
            prompts_dir: Path to prompts directory.
        """
        self._settings = get_settings()

        if normalizer:
            self._normalizer = normalizer
        else:
            # Create components
            csv_path = abbreviations_path or DEFAULT_ABBREVIATIONS_PATH
            whitelist = AbbreviationWhitelist(csv_path)

            # Create LLM client and prompt manager if enabled
            llm_client = None
            prompt_manager = None

            try:
                llm_client = LLMClient(self._settings.llm)
                prompts_path = prompts_dir or DEFAULT_PROMPTS_DIR
                prompt_manager = PromptManager(prompts_path)
                logger.info(
                    "LLM enabled with provider=%s, model=%s",
                    self._settings.llm.provider,
                    self._settings.llm.model,
                )
            except Exception as e:
                logger.warning("Failed to initialize LLM: %s.", e)

            self._normalizer = TextNormalizer(
                whitelist=whitelist,
                llm=llm_client,
                prompts=prompt_manager,
            )

        logger.info("TextNormalizerServicer initialized")

    def Normalize(self, request, context):
        """Handle normalize request."""
        result = asyncio.run(self._normalizer.normalize(request.text))

        # Build structured response
        abbreviations = [
            text_normalizer_pb2.AbbreviationExpansion(
                original=exp.original,
                expanded=exp.expanded,
                start=exp.start,
                end=exp.end,
            )
            for exp in result.abbreviations_expanded
        ]

        spelling_corrections = [
            text_normalizer_pb2.SpellingCorrection(
                original=corr.original,
                corrected=corr.corrected,
                start=corr.start,
                end=corr.end,
            )
            for corr in result.spelling_corrections
        ]

        negations = [
            text_normalizer_pb2.Negation(
                text=neg.text,
                start=neg.start,
                end=neg.end,
                negated=neg.negated,
            )
            for neg in result.negations
        ]

        clinical_phrases = [
            text_normalizer_pb2.ClinicalPhrase(
                text=phrase.text,
                phrase_type=phrase.phrase_type,
                start=phrase.start,
                end=phrase.end,
            )
            for phrase in result.clinical_phrases
        ]

        modifiers = [
            text_normalizer_pb2.Modifier(
                modifier_type=mod.modifier_type,
                value=mod.value,
                target_phrase=mod.target_phrase,
            )
            for mod in result.modifiers
        ]

        relationships = [
            text_normalizer_pb2.Relationship(
                relationship_type=rel.relationship_type,
                source_phrase=rel.source_phrase,
                target_phrase=rel.target_phrase,
                relationship_text=rel.relationship_text,
            )
            for rel in result.relationships
        ]

        return text_normalizer_pb2.NormalizeResponse(
            original_text=result.original_text,
            normalized_text=result.normalized_text,
            abbreviations_expanded=abbreviations,
            spelling_corrections=spelling_corrections,
            negations=negations,
            clinical_phrases=clinical_phrases,
            modifiers=modifiers,
            relationships=relationships,
            processing_time_ms=result.processing_time_ms,
            tokens_used=result.tokens_used,
            model_used=self._settings.llm.model,
        )

    def HealthCheck(self, request, context):
        """Handle health check request."""
        return text_normalizer_pb2.HealthCheckResponse(
            healthy=True,
            service_name="text_normalizer",
            llm_provider=self._settings.llm.provider,
            llm_model=self._settings.llm.model,
        )
