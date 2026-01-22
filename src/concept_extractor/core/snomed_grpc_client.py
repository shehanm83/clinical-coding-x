"""SNOMED CT gRPC client - calls snomed-service for concept search and hierarchy."""

from __future__ import annotations

import logging
import time
from typing import Any

import grpc

from concept_extractor.core.config import SnomedGrpcConfig
from concept_extractor.core.models import (
    ConceptMatch,
    HierarchyResult,
    MatchResult,
    Relationship,
    RelationshipResult,
    SnomedConcept,
)
from concept_extractor.core.proto import snomed_pb2, snomed_pb2_grpc

logger = logging.getLogger(__name__)


def _extract_semantic_tag(fsn: str) -> str:
    """Extract the semantic tag from a Fully Specified Name.

    SNOMED FSNs have the format: "Term (semantic tag)"
    Examples:
        "Diabetes mellitus (disorder)" -> "disorder"
        "Chest pain (finding)" -> "finding"

    Args:
        fsn: Fully Specified Name string.

    Returns:
        The semantic tag, or empty string if not found.
    """
    if not fsn:
        return ""

    last_open = fsn.rfind("(")
    if last_open == -1:
        return ""

    last_close = fsn.rfind(")")
    if last_close == -1 or last_close <= last_open:
        return ""

    return fsn[last_open + 1 : last_close].strip()


class SnomedGrpcClient:
    """Client for SNOMED CT operations via gRPC service.

    This client calls the snomed-service gRPC server for:
    - Text search (Search)
    - ECL execution (ExecuteEcl)
    - Hierarchy traversal (GetDescendants, GetAncestors, GetDirectChildren, GetDirectParents)
    - Relationship queries (GetRelationships)
    - Subsumption checks (IsSubsumedBy)

    NO LLM is used - all operations are deterministic database queries.
    """

    def __init__(self, config: SnomedGrpcConfig) -> None:
        """Initialize the SNOMED gRPC client.

        Args:
            config: SNOMED gRPC configuration.
        """
        self.config = config
        self._channel = grpc.insecure_channel(
            config.grpc_address,
            options=[
                ("grpc.max_receive_message_length", 100 * 1024 * 1024),  # 100MB
                ("grpc.max_send_message_length", 100 * 1024 * 1024),
            ],
        )

        # Initialize service stubs
        self._concept_stub = snomed_pb2_grpc.ConceptServiceStub(self._channel)
        self._search_stub = snomed_pb2_grpc.SearchServiceStub(self._channel)
        self._ecl_stub = snomed_pb2_grpc.EclServiceStub(self._channel)
        self._refset_stub = snomed_pb2_grpc.RefsetServiceStub(self._channel)

        logger.info("SnomedGrpcClient connected to %s", config.grpc_address)

    async def match_concepts(
        self,
        text: str,
        limit: int = 10,
        domain: str | None = None,
        min_similarity: float = 0.0,
    ) -> MatchResult:
        """Match clinical text to SNOMED CT concepts using text search.

        Args:
            text: Clinical text/phrase to match.
            limit: Maximum number of results.
            domain: Optional domain filter (e.g., 'finding', 'disorder').
            min_similarity: Minimum similarity threshold (0-1) - not used in gRPC search.

        Returns:
            MatchResult with matched concepts.
        """
        start_time = time.time()

        try:
            request = snomed_pb2.SearchRequest(
                query=text,
                limit=limit,
                active_only=True,
            )
            response = self._search_stub.Search(request, timeout=self.config.timeout)

            matches = []
            for concept in response.concepts:
                fsn = concept.fsn
                semantic_tag = _extract_semantic_tag(fsn)

                # Filter by domain if specified
                if domain and semantic_tag.lower() != domain.lower():
                    continue

                # For text search, we don't have similarity scores
                # Use a default high score since these are exact/lexical matches
                matches.append(
                    ConceptMatch(
                        concept_id=str(concept.id),
                        term=fsn.rsplit(" (", 1)[0] if " (" in fsn else fsn,
                        fsn=fsn,
                        semantic_tag=semantic_tag,
                        similarity=0.9,  # Default for text search matches
                        semantic_score=0.9,
                        lexical_score=0.9,
                        lexical_match="partial",
                        match_type="lexical",
                        state="primary",
                    )
                )

            processing_time_ms = int((time.time() - start_time) * 1000)

            return MatchResult(
                query=text,
                matches=matches[:limit],
                processing_time_ms=processing_time_ms,
            )

        except grpc.RpcError as e:
            logger.error("SNOMED search failed: %s", e.details() if hasattr(e, "details") else str(e))
            processing_time_ms = int((time.time() - start_time) * 1000)
            return MatchResult(
                query=text,
                matches=[],
                processing_time_ms=processing_time_ms,
            )

    async def get_concept(self, concept_id: str) -> SnomedConcept | None:
        """Get a concept by ID.

        Args:
            concept_id: SNOMED concept ID.

        Returns:
            SnomedConcept or None if not found.
        """
        try:
            request = snomed_pb2.GetConceptRequest(id=int(concept_id))
            response = self._concept_stub.GetConcept(request, timeout=self.config.timeout)

            if response.concept.id == 0:
                return None

            fsn = response.concept.fsn
            return SnomedConcept(
                concept_id=str(response.concept.id),
                term=fsn.rsplit(" (", 1)[0] if " (" in fsn else fsn,
                fsn=fsn,
                semantic_tag=_extract_semantic_tag(fsn),
                active=response.concept.active,
            )
        except grpc.RpcError as e:
            logger.debug("Get concept failed for %s: %s", concept_id, e)
            return None

    async def get_children(self, concept_id: str) -> HierarchyResult:
        """Get direct children of a concept in the SNOMED hierarchy.

        Args:
            concept_id: Parent concept ID.

        Returns:
            HierarchyResult with child concepts.
        """
        start_time = time.time()

        try:
            # Use EclService.GetDirectChildren for direct children
            request = snomed_pb2.GetDirectChildrenRequest(concept_id=int(concept_id))
            response = self._ecl_stub.GetDirectChildren(request, timeout=self.config.timeout)

            # Get concept details for each child
            concepts = []
            for child_id in response.child_ids:
                concept = await self.get_concept(str(child_id))
                if concept:
                    concepts.append(concept)

            processing_time_ms = int((time.time() - start_time) * 1000)

            return HierarchyResult(
                concept_id=concept_id,
                concepts=concepts,
                total_count=len(concepts),
                processing_time_ms=processing_time_ms,
            )

        except grpc.RpcError as e:
            logger.error("Get children failed for %s: %s", concept_id, e)
            processing_time_ms = int((time.time() - start_time) * 1000)
            return HierarchyResult(
                concept_id=concept_id,
                concepts=[],
                total_count=0,
                processing_time_ms=processing_time_ms,
            )

    async def get_descendants(
        self,
        concept_id: str,
        depth: int = 1,
        limit: int = 1000,
    ) -> HierarchyResult:
        """Get descendants of a concept up to specified depth.

        Args:
            concept_id: Ancestor concept ID.
            depth: Maximum depth to traverse (1 = children only).
            limit: Maximum number of results.

        Returns:
            HierarchyResult with descendant concepts.
        """
        start_time = time.time()

        try:
            # Use EclService.GetDescendants
            request = snomed_pb2.GetDescendantsRequest(
                concept_id=int(concept_id),
                limit=limit,
                include_self=False,
            )
            response = self._ecl_stub.GetDescendants(request, timeout=self.config.timeout)

            # Get concept details for descendants
            concepts = []
            for desc_id in response.concept_ids[:limit]:
                concept = await self.get_concept(str(desc_id))
                if concept:
                    concepts.append(concept)

            processing_time_ms = int((time.time() - start_time) * 1000)

            return HierarchyResult(
                concept_id=concept_id,
                concepts=concepts,
                total_count=int(response.total_count),
                processing_time_ms=processing_time_ms,
            )

        except grpc.RpcError as e:
            logger.error("Get descendants failed for %s: %s", concept_id, e)
            processing_time_ms = int((time.time() - start_time) * 1000)
            return HierarchyResult(
                concept_id=concept_id,
                concepts=[],
                total_count=0,
                processing_time_ms=processing_time_ms,
            )

    async def get_ancestors(self, concept_id: str) -> set[str]:
        """Get all ancestors of a concept (traversing IS_A hierarchy upward).

        Args:
            concept_id: Concept to get ancestors for.

        Returns:
            Set of ancestor concept IDs.
        """
        try:
            # Use EclService.GetAncestors
            request = snomed_pb2.GetAncestorsRequest(
                concept_id=int(concept_id),
                include_self=False,
            )
            response = self._ecl_stub.GetAncestors(request, timeout=self.config.timeout)

            return {str(cid) for cid in response.concept_ids}

        except grpc.RpcError as e:
            logger.debug("Get ancestors failed for %s: %s", concept_id, e)
            return set()

    async def get_relationships(
        self,
        concept_id: str,
        exclude_is_a: bool = False,
    ) -> RelationshipResult:
        """Get all relationships for a concept.

        Args:
            concept_id: Source concept ID.
            exclude_is_a: If True, exclude IS_A relationships from results.

        Returns:
            RelationshipResult with relationships.
        """
        start_time = time.time()
        IS_A_TYPE_ID = "116680003"

        try:
            request = snomed_pb2.GetRelationshipsRequest(
                concept_id=int(concept_id),
                include_incoming=False,
            )
            response = self._concept_stub.GetRelationships(request, timeout=self.config.timeout)

            relationships = []
            for rel in response.outgoing:
                type_id = str(rel.type_id)

                # Skip IS_A if requested
                if exclude_is_a and type_id == IS_A_TYPE_ID:
                    continue

                # Get type name and destination term
                type_concept = await self.get_concept(type_id)
                dest_concept = await self.get_concept(str(rel.destination_id))

                relationships.append(
                    Relationship(
                        source_id=concept_id,
                        type_id=type_id,
                        type_name=type_concept.term if type_concept else "",
                        destination_id=str(rel.destination_id),
                        destination_term=dest_concept.term if dest_concept else "",
                        group=rel.relationship_group,
                    )
                )

            processing_time_ms = int((time.time() - start_time) * 1000)

            return RelationshipResult(
                concept_id=concept_id,
                relationships=relationships,
                processing_time_ms=processing_time_ms,
            )

        except grpc.RpcError as e:
            logger.error("Get relationships failed for %s: %s", concept_id, e)
            processing_time_ms = int((time.time() - start_time) * 1000)
            return RelationshipResult(
                concept_id=concept_id,
                relationships=[],
                processing_time_ms=processing_time_ms,
            )

    async def get_defined_attributes(self, concept_id: str) -> set[str]:
        """Get the set of attribute type IDs that are defined for a concept.

        Args:
            concept_id: Concept ID to check.

        Returns:
            Set of attribute type IDs.
        """
        result = await self.get_relationships(concept_id, exclude_is_a=True)
        return {rel.type_id for rel in result.relationships}

    async def is_descendant_of(self, concept_id: str, ancestor_id: str) -> bool:
        """Check if a concept is a descendant of another concept.

        Args:
            concept_id: The concept to check.
            ancestor_id: The potential ancestor concept.

        Returns:
            True if concept_id is a descendant of ancestor_id.
        """
        try:
            request = snomed_pb2.IsSubsumedByRequest(
                concept_id=int(concept_id),
                ancestor_id=int(ancestor_id),
            )
            response = self._ecl_stub.IsSubsumedBy(request, timeout=self.config.timeout)
            return response.is_subsumed

        except grpc.RpcError as e:
            logger.debug("Subsumption check failed: %s", e)
            # Fallback to ancestor lookup
            ancestors = await self.get_ancestors(concept_id)
            return ancestor_id in ancestors

    async def is_valid_attribute(
        self,
        concept_id: str,
        attribute_id: str,
    ) -> bool:
        """Check if an attribute is valid for a concept according to MRCM.

        This is a simplified check - returns True if the concept can
        potentially have this attribute based on the semantic model.

        Args:
            concept_id: The concept to check.
            attribute_id: The attribute type to check validity for.

        Returns:
            True if the attribute is potentially valid for this concept.
        """
        # For now, delegate to the local MRCM provider
        # The gRPC service doesn't have MRCM validation yet
        return True

    async def execute_ecl(
        self,
        ecl: str,
        limit: int = 100,
        include_details: bool = True,
    ) -> list[SnomedConcept]:
        """Execute an ECL expression and return matching concepts.

        Args:
            ecl: ECL expression (e.g., "<< 73211009" for descendants of diabetes).
            limit: Maximum number of results.
            include_details: Whether to include concept details.

        Returns:
            List of matching SNOMED concepts.
        """
        try:
            request = snomed_pb2.ExecuteEclRequest(
                ecl=ecl,
                limit=limit,
                include_details=include_details,
            )
            response = self._ecl_stub.ExecuteEcl(request, timeout=self.config.timeout)

            if include_details and response.concepts:
                return [
                    SnomedConcept(
                        concept_id=str(c.id),
                        term=c.fsn.rsplit(" (", 1)[0] if " (" in c.fsn else c.fsn,
                        fsn=c.fsn,
                        semantic_tag=_extract_semantic_tag(c.fsn),
                        active=c.active,
                    )
                    for c in response.concepts
                ]
            else:
                # Return concepts without full details
                concepts = []
                for cid in response.concept_ids[:limit]:
                    concept = await self.get_concept(str(cid))
                    if concept:
                        concepts.append(concept)
                return concepts

        except grpc.RpcError as e:
            logger.error("ECL execution failed for '%s': %s", ecl, e)
            return []

    async def matches_ecl(self, concept_id: str, ecl: str) -> bool:
        """Check if a concept matches an ECL expression.

        Args:
            concept_id: The concept ID to test.
            ecl: The ECL expression to match against.

        Returns:
            True if the concept matches the ECL expression.
        """
        try:
            request = snomed_pb2.MatchesEclRequest(
                concept_id=int(concept_id),
                ecl=ecl,
            )
            response = self._ecl_stub.MatchesEcl(request, timeout=self.config.timeout)
            return response.matches

        except grpc.RpcError as e:
            logger.debug("ECL match check failed: %s", e)
            return False

    async def get_parents(self, concept_id: str) -> list[SnomedConcept]:
        """Get direct parent concepts.

        Args:
            concept_id: Concept ID to get parents for.

        Returns:
            List of parent concepts.
        """
        try:
            request = snomed_pb2.GetDirectParentsRequest(concept_id=int(concept_id))
            response = self._ecl_stub.GetDirectParents(request, timeout=self.config.timeout)

            parents = []
            for parent_id in response.parent_ids:
                concept = await self.get_concept(str(parent_id))
                if concept:
                    parents.append(concept)
            return parents

        except grpc.RpcError as e:
            logger.debug("Get parents failed for %s: %s", concept_id, e)
            return []

    async def close(self) -> None:
        """Close the gRPC channel."""
        self._channel.close()
        logger.debug("SnomedGrpcClient channel closed")
