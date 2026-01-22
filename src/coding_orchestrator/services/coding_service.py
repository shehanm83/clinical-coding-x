"""Main coding service that orchestrates text normalization and concept extraction."""

from __future__ import annotations

import logging
import time
from pathlib import Path

from concept_extractor import ConceptExtractor
from concept_extractor.core.config import SnomedGrpcConfig
from shared.config import get_settings as get_shared_settings
from shared.llm_client import LLMClient
from text_normalizer import TextNormalizer
from text_normalizer.core.abbreviations import AbbreviationWhitelist
from text_normalizer.core.prompts import PromptManager

from coding_orchestrator.models.requests import CodeOptions
from coding_orchestrator.models.responses import (
    AbbreviationResponse,
    AnsweredQuestionResponse,
    AnswerResponse,
    AttributeResponse,
    AttributeValueResponse,
    ClinicalPhraseResponse,
    CodeResponse,
    CodeWithQuestionsResponse,
    ConceptMatchResponse,
    ConceptRelationshipResponse,
    ConceptResponse,
    ConceptResultResponse,
    ConceptWithQuestionsResponse,
    EclResponse,
    EnhancedCodeResponse,
    EnhancedConceptResult,
    ExpressionAttribute,
    ExpressionComponents,
    ExpressionResponse,
    ExpressionValidationResponse,
    ExtractResponse,
    GenerateQuestionsResponse,
    HierarchyResponse,
    MappedModifierResponse,
    MapModifiersResponse,
    ModifierResponse,
    MrcmAttributeResponse,
    MrcmAttributesResponse,
    NegationResponse,
    NormalizeResponse,
    PostCoordinatedConcept,
    QuestionOptionResponse,
    QuestionResponse,
    RefinementSuggestion,
    RefineResponse,
    RefsetInfo,
    RefsetMembershipResponse,
    RelationshipResponse,
    RelationshipValidationResponse,
    RelationshipsResponse,
    SessionResponse,
    SpellingCorrectionResponse,
    SubsumptionResponse,
    SuggestionResponse,
)
from coding_orchestrator.services.modifier_mapper import ModifierMapper

logger = logging.getLogger(__name__)


class CodingService:
    """Orchestrates the clinical coding pipeline.

    This service coordinates:
    1. Text Normalization (abbreviation expansion, LLM analysis)
    2. Concept Extraction (SNOMED CT matching, ECL queries)
    3. Attribute mapping (MRCM attributes for concepts)

    The question generation is not yet implemented.
    """

    def __init__(
        self,
        normalizer: TextNormalizer | None = None,
        extractor: ConceptExtractor | None = None,
    ) -> None:
        """Initialize the coding service.

        Args:
            normalizer: Optional TextNormalizer instance.
            extractor: Optional ConceptExtractor instance.
        """
        self._normalizer = normalizer
        self._extractor = extractor
        self._modifier_mapper: ModifierMapper | None = None
        self._initialized = False

    async def initialize(self) -> None:
        """Initialize all services lazily."""
        if self._initialized:
            return

        logger.info("Initializing CodingService...")

        # Initialize Text Normalizer if not provided
        if self._normalizer is None:
            self._normalizer = self._create_normalizer()

        # Initialize Concept Extractor if not provided
        if self._extractor is None:
            self._extractor = ConceptExtractor()

        # Initialize Modifier Mapper
        if self._modifier_mapper is None:
            self._modifier_mapper = ModifierMapper(self._extractor)

        self._initialized = True
        logger.info("CodingService initialized successfully")

    def _create_normalizer(self) -> TextNormalizer:
        """Create a TextNormalizer instance with default configuration."""
        settings = get_shared_settings()
        project_root = Path(__file__).parent.parent.parent.parent

        # Load abbreviation whitelist
        abbrev_path = project_root / "config" / "abbreviations.csv"
        whitelist = AbbreviationWhitelist(abbrev_path)

        # Initialize LLM client
        llm = LLMClient(settings.llm)

        # Initialize prompt manager
        prompts_dir = project_root / "prompts"
        prompts = PromptManager(prompts_dir)

        return TextNormalizer(whitelist=whitelist, llm=llm, prompts=prompts)

    async def code(
        self,
        text: str,
        options: CodeOptions | None = None,
    ) -> CodeResponse:
        """Run the full coding pipeline on clinical text.

        Args:
            text: Clinical text to code.
            options: Coding options.

        Returns:
            CodeResponse with normalized text and matched concepts.
        """
        await self.initialize()
        start_time = time.time()
        options = options or CodeOptions()

        # Step 1: Normalize text
        normalized = await self._normalizer.normalize(text)

        # Step 2: Extract concepts for each clinical phrase
        concept_results = []
        for phrase in normalized.clinical_phrases:
            # Check if phrase is negated
            is_negated = self._is_phrase_negated(phrase.text, normalized.negations)

            # Get modifiers for this phrase
            phrase_modifiers = [
                m for m in normalized.modifiers if m.target_phrase == phrase.text
            ]

            # Get relationships for this phrase
            phrase_relationships = [
                r
                for r in normalized.relationships
                if r.source_phrase == phrase.text or r.target_phrase == phrase.text
            ]

            # Match concepts
            match_result = await self._extractor.match_concepts(
                text=phrase.text,
                limit=options.max_concepts,
                expand_synonyms=options.expand_synonyms,
                min_similarity=options.min_similarity,
            )

            # Filter by ECL if specified
            matches = match_result.matches
            if options.ecl_filter and matches:
                matches = await self._filter_by_ecl(matches, options.ecl_filter)

            # Get attributes for the top match
            attributes = []
            if matches and options.include_attributes:
                top_match = matches[0]
                attrs = await self._extractor.get_valid_attributes(
                    concept_id=top_match.concept_id,
                    semantic_tag=top_match.semantic_tag,
                    concept_term=top_match.term,
                )
                for attr in attrs:
                    attr_values = self._extractor.get_attribute_range(attr.id)
                    # Try to map modifier to suggested value
                    suggested = self._map_modifier_to_value(
                        phrase_modifiers, attr.name, attr_values
                    )
                    attributes.append(
                        AttributeResponse(
                            attribute_id=attr.id,
                            attribute_name=attr.name,
                            is_qualifier=attr.is_qualifier,
                            suggested_value=suggested,
                            available_values=[
                                AttributeValueResponse(
                                    value_id=v.id,
                                    term=v.term,
                                    fsn=v.fsn,
                                )
                                for v in attr_values[:10]  # Limit values
                            ],
                        )
                    )

            concept_results.append(
                ConceptResultResponse(
                    phrase=phrase.text,
                    phrase_type=phrase.phrase_type,
                    negated=is_negated,
                    matches=[
                        ConceptMatchResponse(
                            concept_id=m.concept_id,
                            term=m.term,
                            fsn=m.fsn,
                            semantic_tag=m.semantic_tag,
                            similarity=m.similarity,
                            match_type=m.match_type,
                        )
                        for m in matches
                    ],
                    modifiers=[
                        ModifierResponse(
                            modifier_type=m.modifier_type,
                            value=m.value,
                            target_phrase=m.target_phrase,
                        )
                        for m in phrase_modifiers
                    ],
                    relationships=[
                        RelationshipResponse(
                            relationship_type=r.relationship_type,
                            source_phrase=r.source_phrase,
                            target_phrase=r.target_phrase,
                            relationship_text=r.relationship_text,
                        )
                        for r in phrase_relationships
                    ],
                    attributes=attributes,
                )
            )

        processing_time_ms = int((time.time() - start_time) * 1000)

        return CodeResponse(
            session_id=None,  # Session management not implemented yet
            normalized=self._to_normalize_response(normalized),
            concepts=concept_results,
            processing_time_ms=processing_time_ms,
            status="complete",
        )

    async def normalize(self, text: str) -> NormalizeResponse:
        """Normalize clinical text only.

        Args:
            text: Clinical text to normalize.

        Returns:
            NormalizeResponse with normalized text and extracted components.
        """
        await self.initialize()
        normalized = await self._normalizer.normalize(text)
        return self._to_normalize_response(normalized)

    async def extract(
        self,
        text: str,
        limit: int = 10,
        domain: str | None = None,
        expand_synonyms: bool = True,
        min_similarity: float = 0.0,
    ) -> ExtractResponse:
        """Extract concepts from text.

        Args:
            text: Text to extract concepts from.
            limit: Maximum number of matches.
            domain: Filter by semantic tag.
            expand_synonyms: Whether to expand lay terms.
            min_similarity: Minimum similarity score.

        Returns:
            ExtractResponse with matched concepts.
        """
        await self.initialize()
        start_time = time.time()

        result = await self._extractor.match_concepts(
            text=text,
            limit=limit,
            domain=domain,
            expand_synonyms=expand_synonyms,
            min_similarity=min_similarity,
        )

        processing_time_ms = int((time.time() - start_time) * 1000)

        return ExtractResponse(
            query=text,
            matches=[
                ConceptMatchResponse(
                    concept_id=m.concept_id,
                    term=m.term,
                    fsn=m.fsn,
                    semantic_tag=m.semantic_tag,
                    similarity=m.similarity,
                    match_type=m.match_type,
                )
                for m in result.matches
            ],
            processing_time_ms=processing_time_ms,
        )

    # =========================================================================
    # ECL Operations
    # =========================================================================

    async def execute_ecl(
        self,
        ecl: str,
        limit: int = 100,
        include_details: bool = True,
    ) -> EclResponse:
        """Execute an ECL expression.

        Args:
            ecl: ECL expression.
            limit: Maximum results.
            include_details: Whether to include concept details.

        Returns:
            EclResponse with matching concepts.
        """
        await self.initialize()
        start_time = time.time()

        concepts = await self._extractor.execute_ecl(ecl, limit, include_details)
        execution_time_ms = int((time.time() - start_time) * 1000)

        return EclResponse(
            ecl=ecl,
            total_count=len(concepts),  # Note: May be more than limit
            concepts=[
                ConceptResponse(
                    concept_id=c.concept_id,
                    term=c.term,
                    fsn=c.fsn,
                    semantic_tag=c.semantic_tag,
                    active=c.active,
                )
                for c in concepts
            ],
            execution_time_ms=execution_time_ms,
            truncated=len(concepts) >= limit,
        )

    async def matches_ecl(self, concept_id: str, ecl: str) -> bool:
        """Check if a concept matches an ECL expression.

        Args:
            concept_id: Concept ID to test.
            ecl: ECL expression.

        Returns:
            True if concept matches ECL.
        """
        await self.initialize()
        return await self._extractor.matches_ecl(concept_id, ecl)

    async def is_descendant_of(
        self, concept_id: str, ancestor_id: str
    ) -> SubsumptionResponse:
        """Check if a concept is a descendant of another.

        Args:
            concept_id: Potential descendant.
            ancestor_id: Potential ancestor.

        Returns:
            SubsumptionResponse with result.
        """
        await self.initialize()
        is_desc = await self._extractor.is_descendant_of(concept_id, ancestor_id)
        return SubsumptionResponse(
            concept_id=concept_id,
            ancestor_id=ancestor_id,
            is_descendant=is_desc,
        )

    # =========================================================================
    # Hierarchy Operations
    # =========================================================================

    async def get_concept(self, concept_id: str) -> ConceptResponse | None:
        """Get a concept by ID.

        Args:
            concept_id: SNOMED concept ID.

        Returns:
            ConceptResponse or None if not found.
        """
        await self.initialize()
        concept = await self._extractor.get_concept(concept_id)
        if concept is None:
            return None
        return ConceptResponse(
            concept_id=concept.concept_id,
            term=concept.term,
            fsn=concept.fsn,
            semantic_tag=concept.semantic_tag,
            active=concept.active,
        )

    async def get_children(self, concept_id: str) -> HierarchyResponse:
        """Get direct children of a concept.

        Args:
            concept_id: Parent concept ID.

        Returns:
            HierarchyResponse with children.
        """
        await self.initialize()
        result = await self._extractor.get_children(concept_id)
        return HierarchyResponse(
            concept_id=concept_id,
            concepts=[
                ConceptResponse(
                    concept_id=c.concept_id,
                    term=c.term,
                    fsn=c.fsn,
                    semantic_tag=c.semantic_tag,
                    active=c.active,
                )
                for c in result.concepts
            ],
            total_count=result.total_count,
            processing_time_ms=result.processing_time_ms,
        )

    async def get_descendants(
        self, concept_id: str, limit: int = 100
    ) -> HierarchyResponse:
        """Get descendants of a concept.

        Args:
            concept_id: Ancestor concept ID.
            limit: Maximum results.

        Returns:
            HierarchyResponse with descendants.
        """
        await self.initialize()
        result = await self._extractor.get_descendants(concept_id, depth=10)
        return HierarchyResponse(
            concept_id=concept_id,
            concepts=[
                ConceptResponse(
                    concept_id=c.concept_id,
                    term=c.term,
                    fsn=c.fsn,
                    semantic_tag=c.semantic_tag,
                    active=c.active,
                )
                for c in result.concepts[:limit]
            ],
            total_count=result.total_count,
            processing_time_ms=result.processing_time_ms,
        )

    async def get_ancestors(self, concept_id: str) -> HierarchyResponse:
        """Get ancestors of a concept.

        Args:
            concept_id: Concept ID.

        Returns:
            HierarchyResponse with ancestors.
        """
        await self.initialize()
        start_time = time.time()
        ancestor_ids = await self._extractor.get_ancestors(concept_id)

        # Get concept details for each ancestor
        concepts = []
        for aid in list(ancestor_ids)[:100]:  # Limit to 100
            concept = await self._extractor.get_concept(aid)
            if concept:
                concepts.append(
                    ConceptResponse(
                        concept_id=concept.concept_id,
                        term=concept.term,
                        fsn=concept.fsn,
                        semantic_tag=concept.semantic_tag,
                        active=concept.active,
                    )
                )

        processing_time_ms = int((time.time() - start_time) * 1000)

        return HierarchyResponse(
            concept_id=concept_id,
            concepts=concepts,
            total_count=len(ancestor_ids),
            processing_time_ms=processing_time_ms,
        )

    async def get_parents(self, concept_id: str) -> HierarchyResponse:
        """Get direct parents of a concept.

        Args:
            concept_id: Concept ID.

        Returns:
            HierarchyResponse with parents.
        """
        await self.initialize()
        start_time = time.time()
        parents = await self._extractor.get_parents(concept_id)
        processing_time_ms = int((time.time() - start_time) * 1000)

        return HierarchyResponse(
            concept_id=concept_id,
            concepts=[
                ConceptResponse(
                    concept_id=p.concept_id,
                    term=p.term,
                    fsn=p.fsn,
                    semantic_tag=p.semantic_tag,
                    active=p.active,
                )
                for p in parents
            ],
            total_count=len(parents),
            processing_time_ms=processing_time_ms,
        )

    # =========================================================================
    # Phase 2: MRCM Attributes & Relationships
    # =========================================================================

    async def get_attributes(self, concept_id: str) -> MrcmAttributesResponse:
        """Get MRCM attributes for a concept.

        Args:
            concept_id: SNOMED concept ID.

        Returns:
            MrcmAttributesResponse with applicable attributes.
        """
        await self.initialize()
        start_time = time.time()

        # Get concept to get semantic tag
        concept = await self._extractor.get_concept(concept_id)
        semantic_tag = concept.semantic_tag if concept else ""

        # Get valid attributes
        attrs = await self._extractor.get_valid_attributes(
            concept_id=concept_id,
            semantic_tag=semantic_tag,
            concept_term=concept.term if concept else None,
        )

        # Build response
        attr_responses = []
        for attr in attrs:
            # Get sample values for each attribute
            values = self._extractor.get_attribute_range(attr.id)
            attr_responses.append(
                MrcmAttributeResponse(
                    attribute_id=attr.id,
                    attribute_name=attr.name,
                    is_qualifier=attr.is_qualifier,
                    cardinality_min=0,
                    cardinality_max=None,
                    range_constraint=None,
                    available_values=[
                        AttributeValueResponse(
                            value_id=v.id,
                            term=v.term,
                            fsn=v.fsn,
                        )
                        for v in values[:15]  # Limit sample values
                    ],
                )
            )

        processing_time_ms = int((time.time() - start_time) * 1000)

        return MrcmAttributesResponse(
            concept_id=concept_id,
            semantic_tag=semantic_tag,
            attributes=attr_responses,
            processing_time_ms=processing_time_ms,
        )

    async def get_relationships(
        self, concept_id: str, exclude_is_a: bool = True
    ) -> RelationshipsResponse:
        """Get relationships for a concept.

        Args:
            concept_id: SNOMED concept ID.
            exclude_is_a: Whether to exclude IS_A relationships.

        Returns:
            RelationshipsResponse with relationships.
        """
        await self.initialize()
        start_time = time.time()

        result = await self._extractor.get_relationships(concept_id, exclude_is_a)
        processing_time_ms = int((time.time() - start_time) * 1000)

        return RelationshipsResponse(
            concept_id=concept_id,
            relationships=[
                ConceptRelationshipResponse(
                    source_id=r.source_id,
                    type_id=r.type_id,
                    type_name=r.type_name,
                    destination_id=r.destination_id,
                    destination_term=r.destination_term,
                    group=r.group,
                )
                for r in result.relationships
            ],
            processing_time_ms=processing_time_ms,
        )

    # =========================================================================
    # Phase 2: Expression Building & Validation
    # =========================================================================

    async def build_expression(
        self,
        focus_concept_id: str,
        attributes: list[tuple[str, str, int]],
        include_terms: bool = True,
    ) -> ExpressionResponse:
        """Build a SNOMED CT post-coordinated expression.

        Args:
            focus_concept_id: Focus concept ID.
            attributes: List of (attribute_id, value_id, group) tuples.
            include_terms: Whether to include terms in the expression.

        Returns:
            ExpressionResponse with the built expression.
        """
        await self.initialize()

        # Get focus concept term
        focus_concept = await self._extractor.get_concept(focus_concept_id)
        focus_term = focus_concept.term if focus_concept else ""

        # Build attribute components
        attr_components = []
        attr_strings = []
        attr_readable = []

        for attr_id, value_id, group in attributes:
            # Get attribute and value terms
            attr_concept = await self._extractor.get_concept(attr_id)
            value_concept = await self._extractor.get_concept(value_id)

            attr_name = attr_concept.term if attr_concept else ""
            value_term = value_concept.term if value_concept else ""

            attr_components.append(
                ExpressionAttribute(
                    attribute_id=attr_id,
                    attribute_name=attr_name,
                    value_id=value_id,
                    value_term=value_term,
                    group=group,
                )
            )

            if include_terms:
                attr_strings.append(f"{attr_id} | {attr_name} | = {value_id} | {value_term} |")
                attr_readable.append(f"{attr_name} = {value_term}")
            else:
                attr_strings.append(f"{attr_id}={value_id}")
                attr_readable.append(f"{attr_id}={value_id}")

        # Build expression string
        if include_terms:
            expression = f"{focus_concept_id} | {focus_term} |"
            if attr_strings:
                expression += " : " + ", ".join(attr_strings)
            human_readable = focus_term
            if attr_readable:
                human_readable += " with " + ", ".join(attr_readable)
        else:
            expression = focus_concept_id
            if attr_strings:
                expression += ":" + ",".join(attr_strings)
            human_readable = expression

        return ExpressionResponse(
            expression=expression,
            human_readable=human_readable,
            components=ExpressionComponents(
                focus_concept_id=focus_concept_id,
                focus_concept_term=focus_term,
                attributes=attr_components,
            ),
        )

    async def validate_expression(
        self,
        expression: str,
        check_mrcm: bool = True,
    ) -> ExpressionValidationResponse:
        """Validate a SNOMED CT expression.

        Args:
            expression: The expression to validate.
            check_mrcm: Whether to check MRCM constraints.

        Returns:
            ExpressionValidationResponse with validation results.
        """
        await self.initialize()

        errors = []
        warnings = []
        components = None

        # Parse expression (simplified parser)
        try:
            parsed = self._parse_expression(expression)
            focus_id = parsed["focus_concept_id"]
            attrs = parsed["attributes"]

            # Verify focus concept exists
            focus_concept = await self._extractor.get_concept(focus_id)
            if not focus_concept:
                errors.append(f"Focus concept {focus_id} not found")
            else:
                # Check each attribute
                attr_components = []
                for attr in attrs:
                    attr_id = attr["attribute_id"]
                    value_id = attr["value_id"]
                    group = attr.get("group", 0)

                    # Check attribute type exists
                    attr_concept = await self._extractor.get_concept(attr_id)
                    if not attr_concept:
                        errors.append(f"Attribute type {attr_id} not found")
                        continue

                    # Check value exists
                    value_concept = await self._extractor.get_concept(value_id)
                    if not value_concept:
                        errors.append(f"Value concept {value_id} not found")
                        continue

                    # MRCM validation
                    if check_mrcm:
                        valid_attrs = await self._extractor.get_valid_attributes(
                            focus_id, focus_concept.semantic_tag, focus_concept.term
                        )
                        valid_attr_ids = {a.id for a in valid_attrs}
                        if attr_id not in valid_attr_ids:
                            warnings.append(
                                f"Attribute {attr_concept.term} may not be valid for {focus_concept.term}"
                            )

                    attr_components.append(
                        ExpressionAttribute(
                            attribute_id=attr_id,
                            attribute_name=attr_concept.term if attr_concept else "",
                            value_id=value_id,
                            value_term=value_concept.term if value_concept else "",
                            group=group,
                        )
                    )

                if not errors:
                    components = ExpressionComponents(
                        focus_concept_id=focus_id,
                        focus_concept_term=focus_concept.term,
                        attributes=attr_components,
                    )

        except Exception as e:
            errors.append(f"Failed to parse expression: {str(e)}")

        # Build normalized form
        normalized = ""
        if components:
            normalized = components.focus_concept_id
            if components.attributes:
                attr_strs = [
                    f"{a.attribute_id}={a.value_id}" for a in components.attributes
                ]
                normalized += ":" + ",".join(attr_strs)

        return ExpressionValidationResponse(
            expression=expression,
            valid=len(errors) == 0,
            normalized=normalized,
            errors=errors,
            warnings=warnings,
            components=components,
        )

    def _parse_expression(self, expression: str) -> dict:
        """Parse a SNOMED CT expression (simplified).

        Supports formats:
        - "123456789" (concept only)
        - "123456789:attr=val" (simple)
        - "123456789 | Term | : attr | Name | = val | Name |" (with terms)
        """
        import re

        # Remove whitespace around operators
        expr = expression.strip()

        # Extract focus concept (first number, optionally with term)
        focus_match = re.match(r"^(\d+)(?:\s*\|\s*([^|]+)\s*\|)?", expr)
        if not focus_match:
            raise ValueError("Invalid expression: cannot find focus concept")

        focus_id = focus_match.group(1)
        result = {"focus_concept_id": focus_id, "attributes": []}

        # Check for refinement
        rest = expr[focus_match.end() :].strip()
        if not rest or not rest.startswith(":"):
            return result

        # Parse attributes
        attr_part = rest[1:].strip()  # Remove leading ":"

        # Split by comma (but not inside pipes)
        attr_strings = re.split(r",\s*(?=\d)", attr_part)

        for attr_str in attr_strings:
            attr_str = attr_str.strip()
            if not attr_str:
                continue

            # Match: attr_id [| term |] = value_id [| term |]
            attr_match = re.match(
                r"(\d+)(?:\s*\|\s*[^|]+\s*\|)?\s*=\s*(\d+)(?:\s*\|\s*[^|]+\s*\|)?",
                attr_str,
            )
            if attr_match:
                result["attributes"].append(
                    {
                        "attribute_id": attr_match.group(1),
                        "value_id": attr_match.group(2),
                        "group": 0,
                    }
                )

        return result

    # =========================================================================
    # Phase 2: Refinement & Suggestions
    # =========================================================================

    async def refine_concept(
        self,
        concept_id: str,
        context: str | None = None,
        modifiers: list[str] | None = None,
        max_suggestions: int = 10,
    ) -> RefineResponse:
        """Get refinement suggestions for a concept.

        Args:
            concept_id: The concept to refine.
            context: Clinical context text.
            modifiers: Modifiers to consider.
            max_suggestions: Maximum suggestions.

        Returns:
            RefineResponse with suggestions.
        """
        await self.initialize()
        start_time = time.time()

        suggestions = []
        modifiers = modifiers or []

        # Get original concept
        original = await self._extractor.get_concept(concept_id)
        if not original:
            processing_time_ms = int((time.time() - start_time) * 1000)
            return RefineResponse(
                original_concept_id=concept_id,
                original_term="",
                context=context,
                suggestions=[],
                processing_time_ms=processing_time_ms,
            )

        # 1. Get children as more specific options
        children_result = await self._extractor.get_children(concept_id)
        for child in children_result.concepts[:max_suggestions]:
            # Check if any modifier matches child term
            confidence = 0.7
            reason = "More specific type"

            for mod in modifiers:
                if mod.lower() in child.term.lower():
                    confidence = 0.9
                    reason = f"Matches modifier '{mod}'"
                    break

            suggestions.append(
                RefinementSuggestion(
                    refinement_type="more_specific",
                    concept=ConceptResponse(
                        concept_id=child.concept_id,
                        term=child.term,
                        fsn=child.fsn,
                        semantic_tag=child.semantic_tag,
                        active=child.active,
                    ),
                    reason=reason,
                    confidence=confidence,
                )
            )

        # 2. If modifiers provided, search for matching concepts
        if modifiers and len(suggestions) < max_suggestions:
            search_text = f"{original.term} {' '.join(modifiers)}"
            match_result = await self._extractor.match_concepts(
                text=search_text,
                limit=max_suggestions - len(suggestions),
                expand_synonyms=True,
            )

            for match in match_result.matches:
                # Skip the original concept
                if match.concept_id == concept_id:
                    continue

                # Check if it's related (descendant of same parent)
                is_related = await self._extractor.is_descendant_of(
                    match.concept_id, concept_id
                )

                suggestions.append(
                    RefinementSuggestion(
                        refinement_type="more_specific" if is_related else "alternative",
                        concept=ConceptResponse(
                            concept_id=match.concept_id,
                            term=match.term,
                            fsn=match.fsn,
                            semantic_tag=match.semantic_tag,
                            active=True,
                        ),
                        reason=f"Search match for '{search_text}'",
                        confidence=match.similarity,
                    )
                )

        # Sort by confidence
        suggestions.sort(key=lambda s: s.confidence, reverse=True)

        processing_time_ms = int((time.time() - start_time) * 1000)

        return RefineResponse(
            original_concept_id=concept_id,
            original_term=original.term,
            context=context,
            suggestions=suggestions[:max_suggestions],
            processing_time_ms=processing_time_ms,
        )

    async def suggest_concepts(
        self,
        concept_id: str,
        suggestion_type: str = "children",
        limit: int = 20,
    ) -> SuggestionResponse:
        """Get concept suggestions (children or siblings).

        Args:
            concept_id: Source concept ID.
            suggestion_type: 'children' or 'siblings'.
            limit: Maximum suggestions.

        Returns:
            SuggestionResponse with suggested concepts.
        """
        await self.initialize()
        start_time = time.time()

        concepts = []
        total_count = 0

        if suggestion_type == "children":
            result = await self._extractor.get_children(concept_id)
            concepts = result.concepts[:limit]
            total_count = result.total_count

        elif suggestion_type == "siblings":
            # Get parents first, then get children of each parent
            parents = await self._extractor.get_parents(concept_id)
            sibling_ids = set()

            for parent in parents:
                children_result = await self._extractor.get_children(parent.concept_id)
                for child in children_result.concepts:
                    if child.concept_id != concept_id:
                        sibling_ids.add(child.concept_id)

            # Get concept details for siblings
            for sib_id in list(sibling_ids)[:limit]:
                sib = await self._extractor.get_concept(sib_id)
                if sib:
                    concepts.append(sib)

            total_count = len(sibling_ids)

        processing_time_ms = int((time.time() - start_time) * 1000)

        return SuggestionResponse(
            concept_id=concept_id,
            suggestion_type=suggestion_type,
            concepts=[
                ConceptResponse(
                    concept_id=c.concept_id,
                    term=c.term,
                    fsn=c.fsn,
                    semantic_tag=c.semantic_tag,
                    active=c.active,
                )
                for c in concepts
            ],
            total_count=total_count,
            processing_time_ms=processing_time_ms,
        )

    # =========================================================================
    # Phase 3: Enhanced Coding Features
    # =========================================================================

    async def map_modifiers(
        self,
        modifiers: list[dict[str, str]],
    ) -> MapModifiersResponse:
        """Map clinical modifiers to SNOMED CT attributes.

        Args:
            modifiers: List of modifiers with 'type' and 'value' keys.

        Returns:
            MapModifiersResponse with mapped and unmapped modifiers.
        """
        await self.initialize()
        start_time = time.time()

        mappings = []
        unmapped = []

        for mod in modifiers:
            mod_type = mod.get("modifier_type", mod.get("type", ""))
            mod_value = mod.get("value", "")

            mapping = self._modifier_mapper.map_modifier(mod_type, mod_value)
            if mapping:
                mappings.append(
                    MappedModifierResponse(
                        attribute_id=mapping.attribute_id,
                        attribute_name=mapping.attribute_name,
                        value_id=mapping.value_id,
                        value_term=mapping.value_term,
                        original_modifier_type=mapping.original_modifier_type,
                        original_modifier_value=mapping.original_modifier_value,
                        confidence=mapping.confidence,
                    )
                )
            else:
                unmapped.append(f"{mod_type}:{mod_value}")

        processing_time_ms = int((time.time() - start_time) * 1000)

        return MapModifiersResponse(
            mappings=mappings,
            unmapped=unmapped,
            processing_time_ms=processing_time_ms,
        )

    async def validate_relationship(
        self,
        source_concept_id: str,
        relationship_type_id: str,
        target_concept_id: str,
    ) -> RelationshipValidationResponse:
        """Validate that a relationship is valid between two concepts.

        Checks:
        1. If the relationship already exists in SNOMED
        2. If the relationship type is valid for the source concept (MRCM)
        3. If the target is in the valid range for the relationship type

        Args:
            source_concept_id: Source concept ID.
            relationship_type_id: Relationship type concept ID.
            target_concept_id: Target concept ID.

        Returns:
            RelationshipValidationResponse with validation result.
        """
        await self.initialize()

        # Get concept details
        source = await self._extractor.get_concept(source_concept_id)
        rel_type = await self._extractor.get_concept(relationship_type_id)
        target = await self._extractor.get_concept(target_concept_id)

        source_term = source.term if source else ""
        rel_type_name = rel_type.term if rel_type else ""
        target_term = target.term if target else ""

        # Check if relationship already exists
        existing_rels = await self._extractor.get_relationships(
            source_concept_id, exclude_is_a=False
        )

        for rel in existing_rels.relationships:
            if (
                rel.type_id == relationship_type_id
                and rel.destination_id == target_concept_id
            ):
                return RelationshipValidationResponse(
                    source_concept_id=source_concept_id,
                    source_term=source_term,
                    relationship_type_id=relationship_type_id,
                    relationship_type_name=rel_type_name,
                    target_concept_id=target_concept_id,
                    target_term=target_term,
                    is_valid=True,
                    validation_method="existing",
                    message="Relationship exists in SNOMED CT",
                )

        # Check if this relationship type is valid for source concept (via MRCM)
        valid_attrs = await self._extractor.get_valid_attributes(
            source_concept_id,
            source.semantic_tag if source else "",
            source_term,
        )
        valid_attr_ids = {a.id for a in valid_attrs}

        if relationship_type_id not in valid_attr_ids:
            return RelationshipValidationResponse(
                source_concept_id=source_concept_id,
                source_term=source_term,
                relationship_type_id=relationship_type_id,
                relationship_type_name=rel_type_name,
                target_concept_id=target_concept_id,
                target_term=target_term,
                is_valid=False,
                validation_method="mrcm",
                message=f"Relationship type '{rel_type_name}' is not valid for '{source_term}'",
            )

        # Relationship type is valid - the target validity would need
        # the MRCM range constraint to fully validate
        return RelationshipValidationResponse(
            source_concept_id=source_concept_id,
            source_term=source_term,
            relationship_type_id=relationship_type_id,
            relationship_type_name=rel_type_name,
            target_concept_id=target_concept_id,
            target_term=target_term,
            is_valid=True,
            validation_method="mrcm",
            message=f"Relationship type is valid for source concept",
        )

    async def get_refset_membership(
        self,
        concept_id: str,
        refset_id: str | None = None,
    ) -> RefsetMembershipResponse:
        """Check which reference sets a concept belongs to.

        Args:
            concept_id: Concept ID to check.
            refset_id: Optional specific refset to check.

        Returns:
            RefsetMembershipResponse with membership info.
        """
        await self.initialize()
        start_time = time.time()

        # Get concept details
        concept = await self._extractor.get_concept(concept_id)
        concept_term = concept.term if concept else ""

        # Note: The gRPC service has RefsetService but we don't have
        # a method in the client yet. For now, return empty list.
        # TODO: Implement refset membership check in gRPC client
        refsets = []

        processing_time_ms = int((time.time() - start_time) * 1000)

        return RefsetMembershipResponse(
            concept_id=concept_id,
            concept_term=concept_term,
            refsets=refsets,
            processing_time_ms=processing_time_ms,
        )

    async def enhanced_code(
        self,
        text: str,
        auto_map_modifiers: bool = True,
        include_post_coordination: bool = True,
        options: CodeOptions | None = None,
    ) -> EnhancedCodeResponse:
        """Enhanced coding with automatic modifier mapping and post-coordination.

        This endpoint:
        1. Normalizes the text (expands abbreviations, extracts modifiers)
        2. Extracts SNOMED concepts for each clinical phrase
        3. Maps extracted modifiers to SNOMED attributes
        4. Builds post-coordinated expressions

        Args:
            text: Clinical text to code.
            auto_map_modifiers: Whether to map modifiers to attributes.
            include_post_coordination: Whether to build post-coordinated expressions.
            options: Additional coding options.

        Returns:
            EnhancedCodeResponse with concepts and post-coordination.
        """
        await self.initialize()
        start_time = time.time()
        options = options or CodeOptions()

        # Step 1: Normalize text
        normalized = await self._normalizer.normalize(text)
        normalize_response = self._to_normalize_response(normalized)

        # Step 2: Extract concepts for each clinical phrase
        enhanced_results = []

        for phrase in normalized.clinical_phrases:
            # Find modifiers for this phrase
            phrase_modifiers = [
                m for m in normalized.modifiers if m.target_phrase == phrase.text
            ]

            # Match concepts
            match_result = await self._extractor.match_concepts(
                text=phrase.text,
                limit=options.max_concepts,
                expand_synonyms=options.expand_synonyms,
            )

            matches = [
                ConceptMatchResponse(
                    concept_id=m.concept_id,
                    term=m.term,
                    fsn=m.fsn,
                    semantic_tag=m.semantic_tag,
                    similarity=m.similarity,
                    match_type=m.match_type,
                )
                for m in match_result.matches
            ]

            # Map modifiers if enabled
            mapped_modifiers = []
            if auto_map_modifiers and phrase_modifiers:
                for mod in phrase_modifiers:
                    mapping = self._modifier_mapper.map_modifier(
                        mod.modifier_type, mod.value
                    )
                    if mapping:
                        mapped_modifiers.append(
                            MappedModifierResponse(
                                attribute_id=mapping.attribute_id,
                                attribute_name=mapping.attribute_name,
                                value_id=mapping.value_id,
                                value_term=mapping.value_term,
                                original_modifier_type=mapping.original_modifier_type,
                                original_modifier_value=mapping.original_modifier_value,
                                confidence=mapping.confidence,
                            )
                        )

            # Build post-coordinated expression if enabled
            post_coord = None
            if include_post_coordination and matches and mapped_modifiers:
                top_match = matches[0]
                focus_concept = await self._extractor.get_concept(top_match.concept_id)

                # Build expression
                attr_tuples = [
                    (m.attribute_id, m.value_id, 0) for m in mapped_modifiers
                ]
                expr_response = await self.build_expression(
                    focus_concept_id=top_match.concept_id,
                    attributes=attr_tuples,
                    include_terms=True,
                )

                post_coord = PostCoordinatedConcept(
                    focus_concept_id=top_match.concept_id,
                    focus_concept_term=top_match.term,
                    expression=expr_response.expression,
                    human_readable=expr_response.human_readable,
                    attributes=mapped_modifiers,
                )

            # Check if negated
            is_negated = any(
                neg.start <= phrase.start < neg.end or neg.start < phrase.end <= neg.end
                for neg in normalized.negations
            )

            enhanced_results.append(
                EnhancedConceptResult(
                    phrase=phrase.text,
                    phrase_type=phrase.phrase_type,
                    negated=is_negated,
                    matches=matches,
                    mapped_modifiers=mapped_modifiers,
                    post_coordinated=post_coord,
                )
            )

        processing_time_ms = int((time.time() - start_time) * 1000)

        return EnhancedCodeResponse(
            session_id=None,
            normalized=normalize_response,
            concepts=enhanced_results,
            processing_time_ms=processing_time_ms,
            status="complete",
        )

    # =========================================================================
    # Helper Methods
    # =========================================================================

    def _to_normalize_response(self, normalized) -> NormalizeResponse:
        """Convert NormalizedText to NormalizeResponse."""
        return NormalizeResponse(
            original_text=normalized.original_text,
            normalized_text=normalized.normalized_text,
            abbreviations_expanded=[
                AbbreviationResponse(
                    original=a.original,
                    expanded=a.expanded,
                    start=a.start,
                    end=a.end,
                )
                for a in normalized.abbreviations_expanded
            ],
            spelling_corrections=[
                SpellingCorrectionResponse(
                    original=s.original,
                    corrected=s.corrected,
                    start=s.start,
                    end=s.end,
                )
                for s in normalized.spelling_corrections
            ],
            negations=[
                NegationResponse(
                    text=n.text,
                    start=n.start,
                    end=n.end,
                    negated=n.negated,
                )
                for n in normalized.negations
            ],
            clinical_phrases=[
                ClinicalPhraseResponse(
                    text=p.text,
                    phrase_type=p.phrase_type,
                    start=p.start,
                    end=p.end,
                )
                for p in normalized.clinical_phrases
            ],
            modifiers=[
                ModifierResponse(
                    modifier_type=m.modifier_type,
                    value=m.value,
                    target_phrase=m.target_phrase,
                )
                for m in normalized.modifiers
            ],
            relationships=[
                RelationshipResponse(
                    relationship_type=r.relationship_type,
                    source_phrase=r.source_phrase,
                    target_phrase=r.target_phrase,
                    relationship_text=r.relationship_text,
                )
                for r in normalized.relationships
            ],
            processing_time_ms=normalized.processing_time_ms,
            tokens_used=normalized.tokens_used,
        )

    def _is_phrase_negated(self, phrase_text: str, negations: list) -> bool:
        """Check if a phrase is within a negation span."""
        phrase_lower = phrase_text.lower()
        for neg in negations:
            if phrase_lower in neg.text.lower():
                return True
        return False

    async def _filter_by_ecl(self, matches: list, ecl_filter: str) -> list:
        """Filter matches by ECL expression."""
        filtered = []
        for match in matches:
            try:
                if await self._extractor.matches_ecl(match.concept_id, ecl_filter):
                    filtered.append(match)
            except Exception as e:
                logger.debug("ECL filter check failed for %s: %s", match.concept_id, e)
        return filtered

    def _map_modifier_to_value(
        self, modifiers: list, attr_name: str, attr_values: list
    ) -> AttributeValueResponse | None:
        """Try to map an extracted modifier to an attribute value."""
        attr_name_lower = attr_name.lower()

        for modifier in modifiers:
            mod_type = modifier.modifier_type.lower()
            mod_value = modifier.value.lower()

            # Check if modifier type matches attribute name
            if mod_type in attr_name_lower or attr_name_lower in mod_type:
                # Try to find matching value
                for val in attr_values:
                    if mod_value in val.term.lower():
                        return AttributeValueResponse(
                            value_id=val.id,
                            term=val.term,
                            fsn=val.fsn,
                        )

        return None

    # =========================================================================
    # Phase 4: Question Generation Methods
    # =========================================================================

    async def _get_question_generator(self):
        """Get or create the question generator."""
        if not hasattr(self, "_question_generator") or self._question_generator is None:
            from question_generator import QuestionGenerator

            self._question_generator = QuestionGenerator(
                extractor=self._extractor,
                modifier_mapper=self._modifier_mapper,
                llm_client=None,  # Can be set for LLM formatting
                use_llm_formatting=False,  # Use templates by default
            )
        return self._question_generator

    async def code_with_questions(
        self,
        text: str,
        auto_map_modifiers: bool = True,
        generate_questions: bool = True,
        max_questions_per_concept: int = 5,
        use_llm_formatting: bool = False,
        options: CodeOptions | None = None,
    ) -> CodeWithQuestionsResponse:
        """Perform coding with question generation.

        Args:
            text: Clinical text to code.
            auto_map_modifiers: Automatically map modifiers.
            generate_questions: Generate clarifying questions.
            max_questions_per_concept: Max questions per concept.
            use_llm_formatting: Use LLM for question formatting.
            options: Coding options.

        Returns:
            CodeWithQuestionsResponse with concepts and questions.
        """
        await self.initialize()
        start_time = time.time()
        options = options or CodeOptions()

        # Step 1: Normalize text
        normalized = await self._normalizer.normalize(text)
        normalize_response = self._to_normalize_response(normalized)

        # Step 2: Extract concepts
        concept_results = []
        for phrase in normalized.clinical_phrases:
            match_result = await self._extractor.match_concepts(
                text=phrase.text,
                limit=options.max_concepts,
                expand_synonyms=options.expand_synonyms,
            )
            if match_result.matches:
                top_match = match_result.matches[0]
                concept_results.append({
                    "concept_id": top_match.concept_id,
                    "term": top_match.term,
                    "fsn": top_match.fsn,
                    "semantic_tag": top_match.semantic_tag,
                    "phrase": phrase.text,
                    "negated": self._is_phrase_negated(phrase.text, normalized.negations),
                })

        # Step 3: Generate questions if enabled
        concepts_with_questions = []
        all_questions = []

        if generate_questions and concept_results:
            question_gen = await self._get_question_generator()
            question_gen._max_questions = max_questions_per_concept

            # Convert modifiers to dict format
            modifiers = [
                {
                    "modifier_type": m.modifier_type,
                    "value": m.value,
                    "target_phrase": m.target_phrase,
                }
                for m in normalized.modifiers
            ]

            concepts_with_gaps = await question_gen.generate_questions_for_concepts(
                concepts=concept_results,
                extracted_modifiers=modifiers,
            )

            for cwg in concepts_with_gaps:
                questions_response = [
                    self._question_to_response(q) for q in cwg.questions
                ]
                all_questions.extend(questions_response)

                concepts_with_questions.append(
                    ConceptWithQuestionsResponse(
                        concept_id=cwg.concept_id,
                        concept_term=cwg.concept_term,
                        semantic_tag=cwg.semantic_tag,
                        phrase=cwg.phrase,
                        negated=cwg.negated,
                        questions=questions_response,
                        answered=[],
                        final_expression=None,
                    )
                )
        else:
            # No questions - just return concepts
            for cr in concept_results:
                concepts_with_questions.append(
                    ConceptWithQuestionsResponse(
                        concept_id=cr["concept_id"],
                        concept_term=cr["term"],
                        semantic_tag=cr.get("semantic_tag", ""),
                        phrase=cr.get("phrase", cr["term"]),
                        negated=cr.get("negated", False),
                        questions=[],
                        answered=[],
                        final_expression=None,
                    )
                )

        # Sort questions by priority
        all_questions.sort(key=lambda q: q.priority)

        # Create and populate session
        question_gen = await self._get_question_generator()
        session = question_gen.create_session(text)
        session.normalized_text = normalize_response.normalized_text

        # Populate session with concepts and questions
        if generate_questions and concept_results:
            # Set initial focus to first concept
            first_concept = concept_results[0]
            session.set_focus(
                concept_id=first_concept.get("concept_id", ""),
                concept_term=first_concept.get("term", ""),
                semantic_tag=first_concept.get("semantic_tag", "finding"),
                original_phrase=first_concept.get("phrase", first_concept.get("term", "")),
            )

            # Store the original Question objects in session
            all_question_objects = []
            for cwg in concepts_with_gaps:
                session.concepts.append(cwg)
                all_question_objects.extend(cwg.questions)

            # Sort by priority (specificity first, then others)
            from question_generator.models import QuestionType
            all_question_objects.sort(key=lambda q: (
                0 if q.question_type == QuestionType.SPECIFICITY else 1,
                q.priority
            ))
            session.pending_questions = all_question_objects
            session.all_questions_asked = list(all_question_objects)

            # Set status
            from question_generator.session import SessionStatus
            session.status = SessionStatus.PENDING_QUESTIONS if all_question_objects else SessionStatus.COMPLETE

        question_gen.update_session(session)

        processing_time_ms = int((time.time() - start_time) * 1000)

        return CodeWithQuestionsResponse(
            session_id=session.session_id,
            status="pending_questions" if all_questions else "complete",
            normalized=normalize_response,
            concepts=concepts_with_questions,
            pending_questions=all_questions,
            next_question=all_questions[0] if all_questions else None,
            processing_time_ms=processing_time_ms,
        )

    async def create_coding_session(
        self,
        text: str,
        generate_questions: bool = True,
        options: CodeOptions | None = None,
    ) -> SessionResponse:
        """Create a new coding session.

        Args:
            text: Clinical text to code.
            generate_questions: Whether to generate questions.
            options: Coding options.

        Returns:
            SessionResponse with session state.
        """
        result = await self.code_with_questions(
            text=text,
            generate_questions=generate_questions,
            options=options,
        )

        # Get session for focus concept info
        question_gen = await self._get_question_generator()
        session = question_gen.get_session(result.session_id)

        focus_response = None
        drilling_summary = None
        if session and session.current_focus:
            focus_response = self._focus_to_response(session.current_focus)
            drilling_summary = self._drilling_summary_to_response(session)

        return SessionResponse(
            session_id=result.session_id,
            status=result.status,
            created_at=time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            updated_at=time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            original_text=text,
            normalized_text=result.normalized.normalized_text,
            current_focus=focus_response,
            drilling_summary=drilling_summary,
            concept_count=len(result.concepts),
            pending_question_count=len(result.pending_questions),
            answered_question_count=0,
            next_question=result.next_question,
            final_expressions=[],
        )

    async def get_session_state(self, session_id: str) -> SessionResponse | None:
        """Get the state of a coding session.

        Args:
            session_id: Session ID.

        Returns:
            SessionResponse or None if not found.
        """
        await self.initialize()
        question_gen = await self._get_question_generator()
        session = question_gen.get_session(session_id)

        if session is None:
            return None

        next_question = session.get_next_question()

        # Get focus and drilling info
        focus_response = None
        drilling_summary = None
        if session.current_focus:
            focus_response = self._focus_to_response(session.current_focus)
            drilling_summary = self._drilling_summary_to_response(session)

        return SessionResponse(
            session_id=session.session_id,
            status=session.status.value,
            created_at=session.created_at.isoformat(),
            updated_at=session.updated_at.isoformat(),
            original_text=session.original_text,
            normalized_text=session.normalized_text,
            current_focus=focus_response,
            drilling_summary=drilling_summary,
            concept_count=len(session.concepts),
            pending_question_count=len(session.pending_questions) - session.current_question_index,
            answered_question_count=len(session.answered_questions),
            next_question=self._question_to_response(next_question) if next_question else None,
            final_expressions=session.final_expressions,
        )

    async def answer_session_question(
        self,
        session_id: str,
        question_id: str,
        selected_option_ids: list[str],
        skipped: bool = False,
    ) -> AnswerResponse:
        """Answer a question in a session with dynamic drilling support.

        Args:
            session_id: Session ID.
            question_id: Question ID.
            selected_option_ids: Selected SNOMED concept IDs.
            skipped: Whether the question was skipped.

        Returns:
            AnswerResponse with result and drilling info.
        """
        await self.initialize()
        question_gen = await self._get_question_generator()

        # Get the question and check if it's a specificity question
        session_before = question_gen.get_session(session_id)
        if session_before is None:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Session not found")

        question = session_before.get_question_by_id(question_id)
        if question is None:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Question not found")

        # Get focus depth before answering
        depth_before = session_before.current_focus.depth if session_before.current_focus else 0
        questions_before = len(session_before.pending_questions) - session_before.current_question_index

        # Process the answer
        session, processed = await question_gen.answer_session_question(
            session_id=session_id,
            question_id=question_id,
            selected_option_ids=selected_option_ids,
            skipped=skipped,
        )

        if session is None or processed is None:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Session or question not found")

        # Check if we drilled down
        depth_after = session.current_focus.depth if session.current_focus else 0
        drilled_down = depth_after > depth_before
        questions_after = len(session.pending_questions) - session.current_question_index
        new_questions = max(0, questions_after - (questions_before - 1))

        next_question = session.get_next_question()

        # Build answered question response
        answered_response = None
        if processed.valid and session.answered_questions:
            last_answered = session.answered_questions[-1]
            answered_response = AnsweredQuestionResponse(
                question_id=last_answered.question_id,
                question_type=last_answered.question_type.value,
                selected_options=[
                    QuestionOptionResponse(
                        concept_id=opt.concept_id,
                        display_text=opt.display_text,
                        fsn=opt.fsn,
                        semantic_tag=opt.semantic_tag,
                        pre_selected=opt.pre_selected,
                        pre_selection_source=opt.pre_selection_source,
                    )
                    for opt in last_answered.selected_options
                ],
                skipped=last_answered.skipped,
                resulting_attribute=last_answered.resulting_attribute,
            )

        # Get focus response
        focus_response = None
        if session.current_focus:
            focus_response = self._focus_to_response(session.current_focus)

        return AnswerResponse(
            valid=processed.valid,
            error_message=processed.error_message,
            session_id=session_id,
            session_status=session.status.value,
            drilled_down=drilled_down,
            current_focus=focus_response,
            new_questions_generated=new_questions if drilled_down else 0,
            answered_question=answered_response,
            next_question=self._question_to_response(next_question) if next_question else None,
            final_expressions=session.final_expressions,
        )

    async def delete_session(self, session_id: str) -> bool:
        """Delete a coding session.

        Args:
            session_id: Session ID.

        Returns:
            True if deleted, False if not found.
        """
        await self.initialize()
        question_gen = await self._get_question_generator()
        return question_gen.delete_session(session_id)

    async def generate_questions_for_concept(
        self,
        concept_id: str,
        concept_term: str = "",
        semantic_tag: str = "finding",
        extracted_modifiers: list[dict] | None = None,
        existing_attributes: list[str] | None = None,
    ) -> GenerateQuestionsResponse:
        """Generate questions for a single concept.

        Args:
            concept_id: SNOMED concept ID.
            concept_term: Concept term.
            semantic_tag: Semantic tag.
            extracted_modifiers: Modifiers from text.
            existing_attributes: Already defined attributes.

        Returns:
            GenerateQuestionsResponse with questions.
        """
        await self.initialize()
        start_time = time.time()

        # Get concept term if not provided
        if not concept_term:
            concept = await self._extractor.get_concept(concept_id)
            concept_term = concept.term if concept else ""

        question_gen = await self._get_question_generator()
        questions = await question_gen.generate_questions(
            concept_id=concept_id,
            concept_term=concept_term,
            semantic_tag=semantic_tag,
            extracted_modifiers=extracted_modifiers or [],
            existing_attributes=existing_attributes or [],
        )

        processing_time_ms = int((time.time() - start_time) * 1000)

        return GenerateQuestionsResponse(
            concept_id=concept_id,
            concept_term=concept_term,
            questions=[self._question_to_response(q) for q in questions],
            processing_time_ms=processing_time_ms,
        )

    def _question_to_response(self, question) -> QuestionResponse:
        """Convert Question model to QuestionResponse."""
        return QuestionResponse(
            id=question.id,
            question_type=question.question_type.value,
            priority=question.priority,
            source_concept_id=question.source_concept_id,
            source_concept_term=question.source_concept_term,
            attribute_id=question.attribute_id,
            attribute_name=question.attribute_name,
            text=question.text,
            options=[
                QuestionOptionResponse(
                    concept_id=opt.concept_id,
                    display_text=opt.display_text,
                    fsn=opt.fsn,
                    semantic_tag=opt.semantic_tag,
                    pre_selected=opt.pre_selected,
                    pre_selection_source=opt.pre_selection_source,
                )
                for opt in question.options
            ],
            ecl_source=question.ecl_source,
            skip_option=question.skip_option,
            multi_select=question.multi_select,
        )

    def _focus_to_response(self, focus) -> "FocusConceptResponse":
        """Convert FocusConcept to FocusConceptResponse."""
        from coding_orchestrator.models.responses import FocusConceptResponse
        return FocusConceptResponse(
            concept_id=focus.concept_id,
            concept_term=focus.concept_term,
            semantic_tag=focus.semantic_tag,
            original_phrase=focus.original_phrase,
            depth=focus.depth,
            parent_concept_id=focus.parent_concept_id,
        )

    def _drilling_summary_to_response(self, session) -> "DrillingSummaryResponse":
        """Convert session drilling info to DrillingSummaryResponse."""
        from coding_orchestrator.models.responses import DrillingSummaryResponse
        summary = session.get_drilling_summary()
        return DrillingSummaryResponse(
            current_depth=summary["current_depth"],
            max_depth=summary["max_depth"],
            path=summary["path"],
            answered_attributes=summary["answered_attributes"],
            total_questions_asked=summary["total_questions_asked"],
            total_questions_answered=summary["total_questions_answered"],
        )

    async def close(self) -> None:
        """Close all resources."""
        if self._extractor:
            await self._extractor.close()
        logger.info("CodingService closed")
