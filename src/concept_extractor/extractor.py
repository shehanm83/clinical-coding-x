"""Clinical concept extraction - main orchestrator class."""

from __future__ import annotations

import logging
from pathlib import Path

from concept_extractor.core.config import SnomedApiConfig, get_settings
from concept_extractor.core.models import (
    AttributeDefinition,
    AttributeValue,
    ConceptMatch,
    HierarchyResult,
    MatchResult,
    RelationshipResult,
)
from concept_extractor.core.mrcm import MrcmConfigProvider
from concept_extractor.core.snomed_client import SnomedClient
from concept_extractor.core.synonyms import SynonymLookup

logger = logging.getLogger(__name__)


class ConceptExtractor:
    """Extracts clinical concepts from text using SNOMED CT.

    This class orchestrates:
    - Synonym expansion (lay terms -> SNOMED preferred terms)
    - Vector similarity search via snomed-service
    - Hierarchy traversal (children, descendants, ancestors)
    - Relationship queries
    - MRCM attribute validation

    NO LLM is used - all operations are deterministic database queries
    or vector similarity search.
    """

    def __init__(
        self,
        snomed_config: SnomedApiConfig | None = None,
        synonyms_path: Path | str | None = None,
        mrcm_path: Path | str | None = None,
    ) -> None:
        """Initialize the concept extractor.

        Args:
            snomed_config: SNOMED API configuration. If None, loads from env.
            synonyms_path: Path to synonyms CSV. If None, uses default.
            mrcm_path: Path to MRCM JSON config. If None, uses default.
        """
        settings = get_settings()

        # Initialize SNOMED client
        self._snomed_config = snomed_config or settings.snomed_api
        self._snomed_client = SnomedClient(self._snomed_config)

        # Initialize synonym lookup
        self._synonyms = SynonymLookup(synonyms_path or settings.synonyms_path)

        # Initialize MRCM provider
        self._mrcm = MrcmConfigProvider(mrcm_path or settings.mrcm_path)
        self._mrcm.set_snomed_client(self._snomed_client)

        logger.info(
            "ConceptExtractor initialized: SNOMED API=%s, synonyms=%d",
            self._snomed_config.base_url,
            len(self._synonyms),
        )

    async def match_concepts(
        self,
        text: str,
        limit: int = 10,
        domain: str | None = None,
        min_similarity: float = 0.0,
        expand_synonyms: bool = True,
    ) -> MatchResult:
        """Match clinical text to SNOMED CT concepts.

        Args:
            text: Clinical text/phrase to match.
            limit: Maximum number of results.
            domain: Optional domain filter (e.g., 'finding', 'disorder').
            min_similarity: Minimum similarity threshold (0-1).
            expand_synonyms: Whether to expand lay terms to SNOMED terms.

        Returns:
            MatchResult with matched concepts.
        """
        # Optionally expand synonyms for better matching
        search_text = text
        if expand_synonyms:
            search_text = self._synonyms.expand_query(text)

        return await self._snomed_client.match_concepts(
            text=search_text,
            limit=limit,
            domain=domain,
            min_similarity=min_similarity,
        )

    async def get_children(self, concept_id: str) -> HierarchyResult:
        """Get direct children of a concept.

        Args:
            concept_id: Parent concept ID.

        Returns:
            HierarchyResult with child concepts.
        """
        return await self._snomed_client.get_children(concept_id)

    async def get_descendants(
        self,
        concept_id: str,
        depth: int = 1,
    ) -> HierarchyResult:
        """Get descendants of a concept.

        Args:
            concept_id: Ancestor concept ID.
            depth: Maximum depth to traverse.

        Returns:
            HierarchyResult with descendant concepts.
        """
        return await self._snomed_client.get_descendants(concept_id, depth)

    async def get_ancestors(self, concept_id: str) -> set[str]:
        """Get all ancestors of a concept.

        Args:
            concept_id: Concept to get ancestors for.

        Returns:
            Set of ancestor concept IDs.
        """
        return await self._snomed_client.get_ancestors(concept_id)

    async def get_relationships(
        self,
        concept_id: str,
        exclude_is_a: bool = False,
    ) -> RelationshipResult:
        """Get relationships for a concept.

        Args:
            concept_id: Source concept ID.
            exclude_is_a: Whether to exclude IS_A relationships.

        Returns:
            RelationshipResult with relationships.
        """
        return await self._snomed_client.get_relationships(concept_id, exclude_is_a)

    async def get_valid_attributes(
        self,
        concept_id: str,
        semantic_tag: str | None = None,
        concept_term: str | None = None,
    ) -> list[AttributeDefinition]:
        """Get valid MRCM attributes for a concept.

        Uses dynamic SNOMED hierarchy checks when possible.

        Args:
            concept_id: SNOMED concept ID.
            semantic_tag: Semantic tag from FSN.
            concept_term: Preferred term for the concept.

        Returns:
            List of applicable attribute definitions.
        """
        return await self._mrcm.get_valid_attributes_async(
            concept_id, semantic_tag, concept_term
        )

    def get_attribute_range(self, attribute_id: str) -> list[AttributeValue]:
        """Get valid range values for an attribute.

        Args:
            attribute_id: SNOMED attribute concept ID.

        Returns:
            List of valid value concepts.
        """
        return self._mrcm.get_attribute_range(attribute_id)

    def get_synonym_expansions(self, text: str) -> list[tuple[str, str]]:
        """Get synonym expansions for text.

        Args:
            text: Input text to check for lay terms.

        Returns:
            List of (lay_term, snomed_term) tuples.
        """
        expansions = self._synonyms.get_expansions(text)
        return [(e.lay_term, e.snomed_term) for e in expansions]

    @property
    def snomed_api_url(self) -> str:
        """Get the SNOMED API base URL."""
        return self._snomed_config.base_url

    @property
    def synonym_count(self) -> int:
        """Get the number of loaded synonyms."""
        return len(self._synonyms)

    @property
    def mrcm_attribute_count(self) -> int:
        """Get the number of MRCM attributes."""
        return self._mrcm.attribute_count

    async def close(self) -> None:
        """Close the extractor and release resources."""
        await self._snomed_client.close()
