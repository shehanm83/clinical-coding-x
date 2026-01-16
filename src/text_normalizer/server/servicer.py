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
    """gRPC servicer that wraps the core TextNormalizer component.
    """

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
        """Handle normalize request.
        """        
        result = asyncio.run(self._normalizer.normalize(request.text))
        model_used = self._settings.llm.model

        # Build transformations list
        transformations = []

        # Add abbreviation expansions
        for exp in result.abbreviations_expanded:
            transformations.append(f"[ABBREV] {exp.original} -> {exp.expanded}")

        # Add spelling corrections
        for corr in result.spelling_corrections:
            transformations.append(f"[SPELL] {corr.original} -> {corr.corrected}")

        # Add negations
        for neg in result.negations:
            transformations.append(f"[NEGATION] {neg.text}")

        # Add clinical phrases
        for phrase in result.clinical_phrases:
            transformations.append(f"[{phrase.phrase_type.upper()}] {phrase.text}")

        # Add modifiers
        for mod in result.modifiers:
            transformations.append(
                f"[MODIFIER:{mod.modifier_type}] {mod.value} -> {mod.target_phrase}"
            )

        # Add relationships
        for rel in result.relationships:
            transformations.append(
                f"[RELATION:{rel.relationship_type}] {rel.source_phrase} -> {rel.target_phrase}"
            )

        return text_normalizer_pb2.NormalizeResponse(
            original_text=result.original_text,
            normalized_text=result.normalized_text,
            transformations_applied=transformations,
            model_used=model_used,
        )

    def HealthCheck(self, request, context):
        """Handle health check request."""
        return text_normalizer_pb2.HealthCheckResponse(
            healthy=True,
            service_name="text_normalizer",
            llm_provider=self._settings.llm.provider,
            llm_model=self._settings.llm.model,
        )
