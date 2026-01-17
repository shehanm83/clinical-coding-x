"""SNOMED CT API client - calls snomed-service for concept search and hierarchy."""

from __future__ import annotations

import logging
import time
from typing import Any

import httpx

from concept_extractor.core.config import SnomedApiConfig
from concept_extractor.core.models import (
    ConceptMatch,
    HierarchyResult,
    MatchResult,
    Relationship,
    RelationshipResult,
    SnomedConcept,
)

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


class SnomedClient:
    """Client for SNOMED CT operations via snomed-service.

    This client calls the snomed-service HTTP server for:
    - Vector similarity search (match_concepts)
    - Hierarchy traversal (get_children, get_descendants)
    - Relationship queries (get_relationships)

    NO LLM is used - all operations are deterministic database queries
    or vector similarity search.
    """

    def __init__(self, config: SnomedApiConfig) -> None:
        """Initialize the SNOMED client.

        Args:
            config: SNOMED API configuration.
        """
        self.config = config
        self._base_url = config.base_url.rstrip("/")
        self._client = httpx.AsyncClient(timeout=config.timeout)

    async def match_concepts(
        self,
        text: str,
        limit: int = 10,
        domain: str | None = None,
        min_similarity: float = 0.0,
    ) -> MatchResult:
        """Match clinical text to SNOMED CT concepts using vector search.

        Args:
            text: Clinical text/phrase to match.
            limit: Maximum number of results.
            domain: Optional domain filter (e.g., 'finding', 'disorder').
            min_similarity: Minimum similarity threshold (0-1).

        Returns:
            MatchResult with matched concepts.
        """
        start_time = time.time()

        payload: dict[str, Any] = {
            "text": text,
            "top_k": limit,
        }
        if domain:
            payload["domain"] = domain
        if min_similarity > 0:
            payload["min_similarity"] = min_similarity

        try:
            response = await self._client.post(
                f"{self._base_url}/api/v1/search",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

            # Parse snomed-service response format
            focus_concepts = data.get("data", {}).get("focusConcepts", [])
            matches = []

            for fc in focus_concepts:
                confidence = fc.get("confidence", {})
                evidence = fc.get("evidence", {})

                # Extract confidence scores (snomed-service returns 0-100, normalize to 0-1)
                overall_score = confidence.get("overall", 0) / 100.0
                semantic_score = confidence.get("semantic", 0) / 100.0
                lexical_score = confidence.get("lexical", 0) / 100.0

                # Extract lexical match evidence
                lexical_match = evidence.get("lexicalMatch", "none")

                # Use overall confidence as similarity
                similarity = overall_score if overall_score > 0 else semantic_score

                if similarity >= min_similarity:
                    # Determine match type based on lexical evidence
                    if lexical_match == "exact" and lexical_score >= 0.90:
                        match_type = "exact"
                    elif lexical_match == "partial" and lexical_score >= 0.70:
                        match_type = "lexical"
                    else:
                        match_type = "vector"

                    fsn = fc.get("fullySpecifiedName", "")
                    matches.append(
                        ConceptMatch(
                            concept_id=str(fc.get("id", "")),
                            term=fc.get("term", ""),
                            fsn=fsn,
                            semantic_tag=_extract_semantic_tag(fsn),
                            similarity=similarity,
                            semantic_score=semantic_score,
                            lexical_score=lexical_score,
                            lexical_match=lexical_match,
                            match_type=match_type,
                            state=fc.get("state", "primary"),
                        )
                    )

            processing_time_ms = int((time.time() - start_time) * 1000)

            return MatchResult(
                query=text,
                matches=matches,
                processing_time_ms=processing_time_ms,
            )

        except httpx.HTTPError as e:
            logger.error("SNOMED search failed: %s", str(e))
            processing_time_ms = int((time.time() - start_time) * 1000)
            return MatchResult(
                query=text,
                matches=[],
                processing_time_ms=processing_time_ms,
            )

    async def get_children(self, concept_id: str) -> HierarchyResult:
        """Get direct children of a concept in the SNOMED hierarchy.

        Args:
            concept_id: Parent concept ID.

        Returns:
            HierarchyResult with child concepts.
        """
        start_time = time.time()

        try:
            response = await self._client.get(
                f"{self._base_url}/api/v1/concepts/{concept_id}/children",
            )
            response.raise_for_status()
            data = response.json()

            # Parse response
            children_data = data.get("data", data)
            if isinstance(children_data, dict):
                children_list = children_data.get("children", [])
            else:
                children_list = children_data if isinstance(children_data, list) else []

            concepts = []
            for c in children_list:
                fsn = c.get("fsn", c.get("fullySpecifiedName", ""))
                concepts.append(
                    SnomedConcept(
                        concept_id=str(c.get("id", c.get("conceptId", ""))),
                        term=c.get("term", c.get("preferredTerm", "")),
                        fsn=fsn,
                        semantic_tag=_extract_semantic_tag(fsn),
                        active=c.get("active", True),
                    )
                )

            processing_time_ms = int((time.time() - start_time) * 1000)

            return HierarchyResult(
                concept_id=concept_id,
                concepts=concepts,
                total_count=len(concepts),
                processing_time_ms=processing_time_ms,
            )

        except httpx.HTTPError as e:
            logger.error("Get children failed for %s: %s", concept_id, str(e))
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
    ) -> HierarchyResult:
        """Get descendants of a concept up to specified depth.

        Args:
            concept_id: Ancestor concept ID.
            depth: Maximum depth to traverse (1 = children only).

        Returns:
            HierarchyResult with descendant concepts.
        """
        start_time = time.time()

        try:
            response = await self._client.get(
                f"{self._base_url}/api/v1/concepts/{concept_id}/descendants",
                params={"depth": depth},
            )
            response.raise_for_status()
            data = response.json()

            # Parse response
            descendants_data = data.get("data", data)
            if isinstance(descendants_data, dict):
                descendants_list = descendants_data.get("descendants", [])
            else:
                descendants_list = (
                    descendants_data if isinstance(descendants_data, list) else []
                )

            concepts = []
            for c in descendants_list:
                fsn = c.get("fsn", c.get("fullySpecifiedName", ""))
                concepts.append(
                    SnomedConcept(
                        concept_id=str(c.get("id", c.get("conceptId", ""))),
                        term=c.get("term", c.get("preferredTerm", "")),
                        fsn=fsn,
                        semantic_tag=_extract_semantic_tag(fsn),
                        active=c.get("active", True),
                    )
                )

            processing_time_ms = int((time.time() - start_time) * 1000)

            return HierarchyResult(
                concept_id=concept_id,
                concepts=concepts,
                total_count=len(concepts),
                processing_time_ms=processing_time_ms,
            )

        except httpx.HTTPError as e:
            logger.error("Get descendants failed for %s: %s", concept_id, str(e))
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
            response = await self._client.get(
                f"{self._base_url}/api/v1/concepts/{concept_id}/ancestors",
            )
            response.raise_for_status()
            data = response.json()

            # Parse response
            ancestors_data = data.get("data", data)
            if isinstance(ancestors_data, dict):
                ancestors_list = ancestors_data.get("ancestors", [])
            else:
                ancestors_list = (
                    ancestors_data if isinstance(ancestors_data, list) else []
                )

            return {str(c.get("id", c.get("conceptId", ""))) for c in ancestors_list}

        except httpx.HTTPError as e:
            logger.debug("Get ancestors failed for %s: %s", concept_id, str(e))
            # Fallback: try ECL endpoint
            try:
                response = await self._client.post(
                    f"{self._base_url}/api/v1/ecl/execute",
                    json={"ecl": f"> {concept_id}", "limit": 200},
                )
                response.raise_for_status()
                data = response.json()

                ecl_data = data.get("data", data)
                if isinstance(ecl_data, dict):
                    concept_ids = ecl_data.get("conceptIds", [])
                    if concept_ids:
                        return {str(cid) for cid in concept_ids}

                    results = ecl_data.get("results", ecl_data.get("concepts", []))
                    return {str(c.get("id", c.get("conceptId", ""))) for c in results}

                return set()
            except Exception as ecl_error:
                logger.debug("ECL fallback for ancestors failed: %s", ecl_error)
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

        try:
            params = {}
            if exclude_is_a:
                params["excludeIsA"] = "true"

            response = await self._client.get(
                f"{self._base_url}/api/v1/concepts/{concept_id}/relationships",
                params=params,
            )
            response.raise_for_status()
            data = response.json()

            # Parse response
            rels_data = data.get("data", data)
            if isinstance(rels_data, dict):
                rels_list = rels_data.get("relationships", [])
            else:
                rels_list = rels_data if isinstance(rels_data, list) else []

            relationships = [
                Relationship(
                    source_id=concept_id,
                    type_id=str(r.get("typeId", r.get("attributeId", ""))),
                    type_name=r.get("typeName", r.get("attributeName", "")),
                    destination_id=str(r.get("destinationId", r.get("valueId", ""))),
                    destination_term=r.get(
                        "destinationName",
                        r.get("destinationTerm", r.get("valueTerm", "")),
                    ),
                    group=r.get("group", r.get("roleGroup", 0)),
                )
                for r in rels_list
            ]

            processing_time_ms = int((time.time() - start_time) * 1000)

            return RelationshipResult(
                concept_id=concept_id,
                relationships=relationships,
                processing_time_ms=processing_time_ms,
            )

        except httpx.HTTPError as e:
            logger.error("Get relationships failed for %s: %s", concept_id, str(e))
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

    async def is_valid_attribute(
        self,
        concept_id: str,
        attribute_id: str,
    ) -> bool:
        """Check if an attribute is valid for a concept according to MRCM.

        Args:
            concept_id: The concept to check.
            attribute_id: The attribute type to check validity for.

        Returns:
            True if the attribute is valid for this concept per MRCM.
        """
        try:
            response = await self._client.get(
                f"{self._base_url}/api/v1/mrcm/attributes/{concept_id}",
            )
            response.raise_for_status()
            data = response.json()

            # Check if attribute_id is in the valid attributes list
            valid_attrs = data.get("data", {}).get("validAttributes", [])
            for attr in valid_attrs:
                if str(attr.get("id", attr.get("attributeId", ""))) == attribute_id:
                    return True

            return False

        except httpx.HTTPError as e:
            logger.debug(
                "MRCM check failed for concept %s, attribute %s: %s",
                concept_id,
                attribute_id,
                e,
            )
            return False

    async def is_descendant_of(self, concept_id: str, ancestor_id: str) -> bool:
        """Check if a concept is a descendant of another concept.

        Args:
            concept_id: The concept to check.
            ancestor_id: The potential ancestor concept.

        Returns:
            True if concept_id is a descendant of ancestor_id.
        """
        ancestors = await self.get_ancestors(concept_id)
        return ancestor_id in ancestors

    async def close(self) -> None:
        """Close the HTTP client."""
        await self._client.aclose()
