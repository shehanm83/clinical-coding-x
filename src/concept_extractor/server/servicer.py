"""gRPC servicer implementation - wraps the core ConceptExtractor."""

import asyncio
import logging

from concept_extractor.extractor import ConceptExtractor
from concept_extractor.server.proto import (
    concept_extractor_pb2,
    concept_extractor_pb2_grpc,
)

logger = logging.getLogger(__name__)


class ConceptExtractorServicer(concept_extractor_pb2_grpc.ConceptExtractorServiceServicer):
    """gRPC servicer that wraps the core ConceptExtractor component."""

    def __init__(self, extractor: ConceptExtractor | None = None) -> None:
        """Initialize the servicer with a ConceptExtractor instance.

        Args:
            extractor: Optional ConceptExtractor instance. Creates new one if not provided.
        """
        if extractor:
            self._extractor = extractor
        else:
            self._extractor = ConceptExtractor()

        logger.info("ConceptExtractorServicer initialized")

    def MatchConcepts(self, request, context):
        """Handle concept matching request."""
        # Set defaults (proto3 scalar fields default to zero/empty values)
        limit = request.limit if request.limit > 0 else 10
        min_sim = request.min_similarity if request.min_similarity > 0 else 0.0
        # disable_synonym_expansion: False (default) = expand, True = don't expand
        expand = not request.disable_synonym_expansion
        domain = request.domain if request.domain else None

        result = asyncio.run(
            self._extractor.match_concepts(
                text=request.text,
                limit=limit,
                domain=domain,
                min_similarity=min_sim,
                expand_synonyms=expand,
            )
        )

        matches = [
            concept_extractor_pb2.ConceptMatch(
                concept_id=m.concept_id,
                term=m.term,
                similarity=m.similarity,
                fsn=m.fsn,
                semantic_tag=m.semantic_tag,
                semantic_score=m.semantic_score,
                lexical_score=m.lexical_score,
                lexical_match=m.lexical_match,
                match_type=m.match_type,
                state=m.state,
            )
            for m in result.matches
        ]

        return concept_extractor_pb2.MatchConceptsResponse(
            query=result.query,
            matches=matches,
            processing_time_ms=result.processing_time_ms,
        )

    def GetChildren(self, request, context):
        """Handle get children request."""
        result = asyncio.run(self._extractor.get_children(request.concept_id))

        concepts = [
            concept_extractor_pb2.SnomedConcept(
                concept_id=c.concept_id,
                term=c.term,
                fsn=c.fsn,
                semantic_tag=c.semantic_tag,
                active=c.active,
            )
            for c in result.concepts
        ]

        return concept_extractor_pb2.HierarchyResponse(
            concept_id=result.concept_id,
            concepts=concepts,
            total_count=result.total_count,
            processing_time_ms=result.processing_time_ms,
        )

    def GetDescendants(self, request, context):
        """Handle get descendants request."""
        depth = request.depth if request.depth > 0 else 1

        result = asyncio.run(
            self._extractor.get_descendants(request.concept_id, depth)
        )

        concepts = [
            concept_extractor_pb2.SnomedConcept(
                concept_id=c.concept_id,
                term=c.term,
                fsn=c.fsn,
                semantic_tag=c.semantic_tag,
                active=c.active,
            )
            for c in result.concepts
        ]

        return concept_extractor_pb2.HierarchyResponse(
            concept_id=result.concept_id,
            concepts=concepts,
            total_count=result.total_count,
            processing_time_ms=result.processing_time_ms,
        )

    def GetAncestors(self, request, context):
        """Handle get ancestors request."""
        ancestors = asyncio.run(self._extractor.get_ancestors(request.concept_id))

        return concept_extractor_pb2.AncestorsResponse(
            concept_id=request.concept_id,
            ancestor_ids=list(ancestors),
        )

    def GetRelationships(self, request, context):
        """Handle get relationships request."""
        result = asyncio.run(
            self._extractor.get_relationships(
                request.concept_id,
                exclude_is_a=request.exclude_is_a,
            )
        )

        relationships = [
            concept_extractor_pb2.Relationship(
                source_id=r.source_id,
                type_id=r.type_id,
                destination_id=r.destination_id,
                type_name=r.type_name,
                destination_term=r.destination_term,
                group=r.group,
            )
            for r in result.relationships
        ]

        return concept_extractor_pb2.RelationshipsResponse(
            concept_id=result.concept_id,
            relationships=relationships,
            processing_time_ms=result.processing_time_ms,
        )

    def GetValidAttributes(self, request, context):
        """Handle get valid MRCM attributes request."""
        semantic_tag = request.semantic_tag if request.semantic_tag else None
        concept_term = request.concept_term if request.concept_term else None

        attributes = asyncio.run(
            self._extractor.get_valid_attributes(
                concept_id=request.concept_id,
                semantic_tag=semantic_tag,
                concept_term=concept_term,
            )
        )

        attrs = [
            concept_extractor_pb2.AttributeDefinition(
                id=a.id,
                name=a.name,
                is_qualifier=a.is_qualifier,
                value_count=a.value_count,
            )
            for a in attributes
        ]

        return concept_extractor_pb2.AttributesResponse(attributes=attrs)

    def GetAttributeRange(self, request, context):
        """Handle get attribute range request."""
        values = self._extractor.get_attribute_range(request.attribute_id)

        attr_values = [
            concept_extractor_pb2.AttributeValue(
                id=v.id,
                term=v.term,
                fsn=v.fsn,
                semantic_tag=v.semantic_tag,
            )
            for v in values
        ]

        # Get attribute name from MRCM
        attr_name = self._extractor._mrcm.get_attribute_name(request.attribute_id) or ""

        return concept_extractor_pb2.AttributeRangeResponse(
            attribute_id=request.attribute_id,
            attribute_name=attr_name,
            values=attr_values,
        )

    def HealthCheck(self, request, context):
        """Handle health check request."""
        return concept_extractor_pb2.HealthCheckResponse(
            healthy=True,
            service_name="concept_extractor",
            snomed_api_url=self._extractor.snomed_api_url,
            synonym_count=self._extractor.synonym_count,
            mrcm_attribute_count=self._extractor.mrcm_attribute_count,
        )
