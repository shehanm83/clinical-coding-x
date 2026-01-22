"""Clinical concept extraction - main orchestrator class."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Protocol, runtime_checkable

from concept_extractor.core.config import SnomedApiConfig, SnomedGrpcConfig, get_settings
from concept_extractor.core.models import (
    AttributeDefinition,
    AttributeValue,
    ConceptMatch,
    HierarchyResult,
    MatchResult,
    RelationshipResult,
    SnomedConcept,
)
from concept_extractor.core.mrcm import MrcmConfigProvider
from concept_extractor.core.snomed_client import SnomedClient
from concept_extractor.core.snomed_grpc_client import SnomedGrpcClient
from concept_extractor.core.synonyms import SynonymLookup

logger = logging.getLogger(__name__)


@runtime_checkable
class SnomedClientProtocol(Protocol):
    """Protocol for SNOMED client implementations."""

    async def match_concepts(
        self,
        text: str,
        limit: int = 10,
        domain: str | None = None,
        min_similarity: float = 0.0,
    ) -> MatchResult: ...

    async def get_children(self, concept_id: str) -> HierarchyResult: ...

    async def get_descendants(
        self, concept_id: str, depth: int = 1
    ) -> HierarchyResult: ...

    async def get_ancestors(self, concept_id: str) -> set[str]: ...

    async def get_relationships(
        self, concept_id: str, exclude_is_a: bool = False
    ) -> RelationshipResult: ...

    async def is_descendant_of(self, concept_id: str, ancestor_id: str) -> bool: ...

    async def close(self) -> None: ...


class ConceptExtractor:
    """Extracts clinical concepts from text using SNOMED CT.

    This class orchestrates:
    - Synonym expansion (lay terms -> SNOMED preferred terms)
    - Text search and ECL queries via SNOMED gRPC service
    - Hierarchy traversal (children, descendants, ancestors)
    - Relationship queries
    - MRCM attribute validation

    NO LLM is used - all operations are deterministic database queries.
    """

    def __init__(
        self,
        snomed_config: SnomedApiConfig | None = None,
        grpc_config: SnomedGrpcConfig | None = None,
        synonyms_path: Path | str | None = None,
        mrcm_path: Path | str | None = None,
        use_grpc: bool = True,
    ) -> None:
        """Initialize the concept extractor.

        Args:
            snomed_config: SNOMED HTTP API configuration (legacy).
            grpc_config: SNOMED gRPC configuration. If None, loads from env.
            synonyms_path: Path to synonyms CSV. If None, uses default.
            mrcm_path: Path to MRCM JSON config. If None, uses default.
            use_grpc: If True (default), use gRPC client. If False, use HTTP client.
        """
        settings = get_settings()

        # Initialize SNOMED client (gRPC by default)
        self._use_grpc = use_grpc
        if use_grpc:
            self._grpc_config = grpc_config or settings.snomed_grpc
            self._snomed_client: SnomedClientProtocol = SnomedGrpcClient(self._grpc_config)
            client_info = f"gRPC={self._grpc_config.grpc_address}"
        else:
            self._snomed_config = snomed_config or settings.snomed_api
            self._snomed_client = SnomedClient(self._snomed_config)
            client_info = f"HTTP={self._snomed_config.base_url}"

        # Initialize synonym lookup
        self._synonyms = SynonymLookup(synonyms_path or settings.synonyms_path)

        # Initialize MRCM provider
        self._mrcm = MrcmConfigProvider(mrcm_path or settings.mrcm_path)
        self._mrcm.set_snomed_client(self._snomed_client)

        logger.info(
            "ConceptExtractor initialized: SNOMED %s, synonyms=%d",
            client_info,
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
        """Get the SNOMED API base URL or gRPC address."""
        if self._use_grpc:
            return self._grpc_config.grpc_address
        return self._snomed_config.base_url

    @property
    def synonym_count(self) -> int:
        """Get the number of loaded synonyms."""
        return len(self._synonyms)

    @property
    def mrcm_attribute_count(self) -> int:
        """Get the number of MRCM attributes."""
        return self._mrcm.attribute_count

    @property
    def is_grpc(self) -> bool:
        """Check if using gRPC client."""
        return self._use_grpc

    # =========================================================================
    # Enhanced gRPC-specific methods
    # =========================================================================

    async def get_concept(self, concept_id: str) -> SnomedConcept | None:
        """Get a concept by ID.

        Args:
            concept_id: SNOMED concept ID.

        Returns:
            SnomedConcept or None if not found.
        """
        if self._use_grpc and hasattr(self._snomed_client, "get_concept"):
            return await self._snomed_client.get_concept(concept_id)
        return None

    async def execute_ecl(
        self,
        ecl: str,
        limit: int = 100,
        include_details: bool = True,
    ) -> list[SnomedConcept]:
        """Execute an ECL expression and return matching concepts.

        This method is only available when using the gRPC client.

        Args:
            ecl: ECL expression (e.g., "<< 73211009" for descendants of diabetes).
            limit: Maximum number of results.
            include_details: Whether to include concept details.

        Returns:
            List of matching SNOMED concepts.

        Raises:
            NotImplementedError: If not using gRPC client.
        """
        if not self._use_grpc:
            raise NotImplementedError("ECL execution requires gRPC client")

        if hasattr(self._snomed_client, "execute_ecl"):
            return await self._snomed_client.execute_ecl(ecl, limit, include_details)
        return []

    async def matches_ecl(self, concept_id: str, ecl: str) -> bool:
        """Check if a concept matches an ECL expression.

        This method is only available when using the gRPC client.

        Args:
            concept_id: The concept ID to test.
            ecl: The ECL expression to match against.

        Returns:
            True if the concept matches the ECL expression.

        Raises:
            NotImplementedError: If not using gRPC client.
        """
        if not self._use_grpc:
            raise NotImplementedError("ECL matching requires gRPC client")

        if hasattr(self._snomed_client, "matches_ecl"):
            return await self._snomed_client.matches_ecl(concept_id, ecl)
        return False

    async def is_descendant_of(self, concept_id: str, ancestor_id: str) -> bool:
        """Check if a concept is a descendant of another concept.

        Args:
            concept_id: The concept to check.
            ancestor_id: The potential ancestor concept.

        Returns:
            True if concept_id is a descendant of ancestor_id.
        """
        if hasattr(self._snomed_client, "is_descendant_of"):
            return await self._snomed_client.is_descendant_of(concept_id, ancestor_id)

        # Fallback to ancestor lookup
        ancestors = await self.get_ancestors(concept_id)
        return ancestor_id in ancestors

    async def get_parents(self, concept_id: str) -> list[SnomedConcept]:
        """Get direct parent concepts.

        Args:
            concept_id: Concept ID to get parents for.

        Returns:
            List of parent concepts.
        """
        if self._use_grpc and hasattr(self._snomed_client, "get_parents"):
            return await self._snomed_client.get_parents(concept_id)
        return []

    async def close(self) -> None:
        """Close the extractor and release resources."""
        await self._snomed_client.close()
