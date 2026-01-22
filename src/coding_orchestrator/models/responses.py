"""Pydantic response models for REST API."""

from pydantic import BaseModel, Field


# =============================================================================
# Basic Concept Models
# =============================================================================


class ConceptResponse(BaseModel):
    """A SNOMED CT concept."""

    concept_id: str = Field(..., description="SNOMED CT concept ID")
    term: str = Field(..., description="Preferred term")
    fsn: str = Field(default="", description="Fully Specified Name")
    semantic_tag: str = Field(default="", description="Semantic tag from FSN")
    active: bool = Field(default=True, description="Whether concept is active")


class ConceptMatchResponse(BaseModel):
    """A matched SNOMED CT concept with similarity score."""

    concept_id: str = Field(..., description="SNOMED CT concept ID")
    term: str = Field(..., description="Preferred term")
    fsn: str = Field(default="", description="Fully Specified Name")
    semantic_tag: str = Field(default="", description="Semantic tag")
    similarity: float = Field(..., description="Similarity score (0-1)")
    match_type: str = Field(
        default="lexical",
        description="Type of match: 'exact', 'lexical', 'vector'",
    )


# =============================================================================
# Normalization Models
# =============================================================================


class AbbreviationResponse(BaseModel):
    """An expanded abbreviation."""

    original: str = Field(..., description="Original abbreviation")
    expanded: str = Field(..., description="Expanded form")
    start: int = Field(..., description="Start position in original text")
    end: int = Field(..., description="End position in original text")


class SpellingCorrectionResponse(BaseModel):
    """A spelling correction."""

    original: str = Field(..., description="Original misspelled word")
    corrected: str = Field(..., description="Corrected spelling")
    start: int = Field(..., description="Start position")
    end: int = Field(..., description="End position")


class NegationResponse(BaseModel):
    """A negated span in the text."""

    text: str = Field(..., description="Negated text")
    start: int = Field(..., description="Start position")
    end: int = Field(..., description="End position")
    negated: bool = Field(default=True, description="Whether this span is negated")


class ClinicalPhraseResponse(BaseModel):
    """An identified clinical phrase."""

    text: str = Field(..., description="The clinical phrase")
    phrase_type: str = Field(
        ...,
        description="Type: 'finding', 'symptom', 'condition', 'procedure', 'medication', 'body_site'",
    )
    start: int = Field(..., description="Start position")
    end: int = Field(..., description="End position")


class ModifierResponse(BaseModel):
    """A clinical modifier attached to a phrase."""

    modifier_type: str = Field(
        ...,
        description="Type: 'severity', 'onset', 'laterality', 'course', etc.",
    )
    value: str = Field(..., description="Modifier value (e.g., 'severe', 'left')")
    target_phrase: str = Field(..., description="The phrase this modifier applies to")


class RelationshipResponse(BaseModel):
    """A relationship between clinical phrases."""

    relationship_type: str = Field(
        ...,
        description="Type: 'radiates_to', 'caused_by', 'associated_with', etc.",
    )
    source_phrase: str = Field(..., description="Source phrase")
    target_phrase: str = Field(..., description="Target phrase")
    relationship_text: str = Field(
        default="",
        description="Original text describing relationship",
    )


class NormalizeResponse(BaseModel):
    """Response from text normalization."""

    original_text: str = Field(..., description="Original input text")
    normalized_text: str = Field(..., description="Normalized output text")
    abbreviations_expanded: list[AbbreviationResponse] = Field(
        default_factory=list,
        description="List of expanded abbreviations",
    )
    spelling_corrections: list[SpellingCorrectionResponse] = Field(
        default_factory=list,
        description="List of spelling corrections",
    )
    negations: list[NegationResponse] = Field(
        default_factory=list,
        description="Negated spans",
    )
    clinical_phrases: list[ClinicalPhraseResponse] = Field(
        default_factory=list,
        description="Identified clinical phrases",
    )
    modifiers: list[ModifierResponse] = Field(
        default_factory=list,
        description="Clinical modifiers",
    )
    relationships: list[RelationshipResponse] = Field(
        default_factory=list,
        description="Relationships between phrases",
    )
    processing_time_ms: int = Field(..., description="Processing time in milliseconds")
    tokens_used: int = Field(default=0, description="LLM tokens used")


# =============================================================================
# Attribute Models
# =============================================================================


class AttributeValueResponse(BaseModel):
    """A valid value for a SNOMED attribute."""

    value_id: str = Field(..., description="SNOMED concept ID for the value")
    term: str = Field(..., description="Preferred term")
    fsn: str = Field(default="", description="Fully Specified Name")


class AttributeResponse(BaseModel):
    """A SNOMED CT attribute with its valid values."""

    attribute_id: str = Field(..., description="SNOMED attribute concept ID")
    attribute_name: str = Field(..., description="Attribute name")
    is_qualifier: bool = Field(default=False, description="Whether this is a qualifier")
    suggested_value: AttributeValueResponse | None = Field(
        default=None,
        description="Suggested value based on extracted modifiers",
    )
    available_values: list[AttributeValueResponse] = Field(
        default_factory=list,
        description="All available values for this attribute",
    )


# =============================================================================
# Concept Result Models (for coding response)
# =============================================================================


class ConceptResultResponse(BaseModel):
    """Result of concept extraction for a clinical phrase."""

    phrase: str = Field(..., description="The clinical phrase")
    phrase_type: str = Field(..., description="Type of phrase")
    negated: bool = Field(default=False, description="Whether the phrase is negated")
    matches: list[ConceptMatchResponse] = Field(
        default_factory=list,
        description="Matched SNOMED concepts",
    )
    modifiers: list[ModifierResponse] = Field(
        default_factory=list,
        description="Modifiers for this phrase",
    )
    relationships: list[RelationshipResponse] = Field(
        default_factory=list,
        description="Relationships involving this phrase",
    )
    attributes: list[AttributeResponse] = Field(
        default_factory=list,
        description="Valid MRCM attributes for top match",
    )


# =============================================================================
# Main Coding Response
# =============================================================================


class CodeResponse(BaseModel):
    """Response from the main coding endpoint."""

    session_id: str | None = Field(
        default=None,
        description="Session ID for multi-turn interactions (future)",
    )
    normalized: NormalizeResponse = Field(
        ...,
        description="Text normalization results",
    )
    concepts: list[ConceptResultResponse] = Field(
        default_factory=list,
        description="Concept extraction results per phrase",
    )
    processing_time_ms: int = Field(..., description="Total processing time")
    status: str = Field(
        default="complete",
        description="Status: 'complete' or 'pending_questions' (future)",
    )


# =============================================================================
# Extract Response
# =============================================================================


class ExtractResponse(BaseModel):
    """Response from concept extraction endpoint."""

    query: str = Field(..., description="The search query")
    matches: list[ConceptMatchResponse] = Field(
        default_factory=list,
        description="Matched concepts",
    )
    processing_time_ms: int = Field(..., description="Processing time")


# =============================================================================
# ECL Responses
# =============================================================================


class EclResponse(BaseModel):
    """Response from ECL execution."""

    ecl: str = Field(..., description="The ECL expression")
    total_count: int = Field(..., description="Total number of matching concepts")
    concepts: list[ConceptResponse] = Field(
        default_factory=list,
        description="Matching concepts (up to limit)",
    )
    execution_time_ms: int = Field(..., description="Execution time")
    truncated: bool = Field(
        default=False,
        description="Whether results were truncated due to limit",
    )


class EclMatchResponse(BaseModel):
    """Response from ECL match check."""

    concept_id: str = Field(..., description="The concept ID tested")
    ecl: str = Field(..., description="The ECL expression")
    matches: bool = Field(..., description="Whether the concept matches the ECL")


class SubsumptionResponse(BaseModel):
    """Response from subsumption check."""

    concept_id: str = Field(..., description="The concept ID tested")
    ancestor_id: str = Field(..., description="The potential ancestor")
    is_descendant: bool = Field(
        ...,
        description="Whether concept_id is a descendant of ancestor_id",
    )


# =============================================================================
# Hierarchy Responses
# =============================================================================


class HierarchyResponse(BaseModel):
    """Response for hierarchy queries (children, descendants, ancestors)."""

    concept_id: str = Field(..., description="The source concept ID")
    concepts: list[ConceptResponse] = Field(
        default_factory=list,
        description="Related concepts",
    )
    total_count: int = Field(..., description="Total count")
    processing_time_ms: int = Field(..., description="Processing time")


class ConceptRelationshipResponse(BaseModel):
    """A SNOMED CT relationship."""

    source_id: str = Field(..., description="Source concept ID")
    type_id: str = Field(..., description="Relationship type ID")
    type_name: str = Field(default="", description="Relationship type name")
    destination_id: str = Field(..., description="Destination concept ID")
    destination_term: str = Field(default="", description="Destination term")
    group: int = Field(default=0, description="Relationship group")


class RelationshipsResponse(BaseModel):
    """Response for concept relationships."""

    concept_id: str = Field(..., description="The source concept ID")
    relationships: list[ConceptRelationshipResponse] = Field(
        default_factory=list,
        description="Concept relationships",
    )
    processing_time_ms: int = Field(..., description="Processing time")


# =============================================================================
# Health & Error Responses
# =============================================================================


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = Field(..., description="Service status")
    version: str = Field(..., description="Service version")
    services: dict[str, str] = Field(
        default_factory=dict,
        description="Status of dependent services",
    )


class ErrorResponse(BaseModel):
    """Error response."""

    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    detail: str | None = Field(default=None, description="Additional details")


# =============================================================================
# Phase 2: MRCM Attributes Response
# =============================================================================


class MrcmAttributeResponse(BaseModel):
    """An MRCM attribute applicable to a concept."""

    attribute_id: str = Field(..., description="Attribute type concept ID")
    attribute_name: str = Field(..., description="Attribute name")
    is_qualifier: bool = Field(default=False, description="Whether this is a qualifier attribute")
    cardinality_min: int = Field(default=0, description="Minimum cardinality")
    cardinality_max: int | None = Field(default=None, description="Maximum cardinality (null = unlimited)")
    range_constraint: str | None = Field(
        default=None,
        description="ECL constraint for valid values",
    )
    available_values: list[AttributeValueResponse] = Field(
        default_factory=list,
        description="Sample valid values for this attribute",
    )


class MrcmAttributesResponse(BaseModel):
    """Response for MRCM attributes query."""

    concept_id: str = Field(..., description="The concept ID")
    semantic_tag: str = Field(default="", description="Concept semantic tag")
    attributes: list[MrcmAttributeResponse] = Field(
        default_factory=list,
        description="Applicable MRCM attributes",
    )
    processing_time_ms: int = Field(..., description="Processing time")


# =============================================================================
# Phase 2: Expression Building & Validation
# =============================================================================


class ExpressionAttribute(BaseModel):
    """An attribute in a SNOMED CT expression."""

    attribute_id: str = Field(..., description="Attribute type concept ID")
    attribute_name: str = Field(default="", description="Attribute name")
    value_id: str = Field(..., description="Value concept ID")
    value_term: str = Field(default="", description="Value term")
    group: int = Field(default=0, description="Relationship group")


class ExpressionComponents(BaseModel):
    """Parsed components of a SNOMED CT expression."""

    focus_concept_id: str = Field(..., description="Focus concept ID")
    focus_concept_term: str = Field(default="", description="Focus concept term")
    attributes: list[ExpressionAttribute] = Field(
        default_factory=list,
        description="Expression attributes",
    )


class ExpressionResponse(BaseModel):
    """Response for expression building."""

    expression: str = Field(..., description="The SNOMED CT expression string")
    human_readable: str = Field(
        default="",
        description="Human-readable form with terms",
    )
    components: ExpressionComponents = Field(
        ...,
        description="Parsed expression components",
    )


class ExpressionValidationResponse(BaseModel):
    """Response for expression validation."""

    expression: str = Field(..., description="The input expression")
    valid: bool = Field(..., description="Whether the expression is valid")
    normalized: str = Field(
        default="",
        description="Normalized expression form",
    )
    errors: list[str] = Field(
        default_factory=list,
        description="Validation errors if any",
    )
    warnings: list[str] = Field(
        default_factory=list,
        description="Validation warnings",
    )
    components: ExpressionComponents | None = Field(
        default=None,
        description="Parsed components if valid",
    )


# =============================================================================
# Phase 2: Refinement & Suggestions
# =============================================================================


class RefinementSuggestion(BaseModel):
    """A suggested refinement for a concept."""

    refinement_type: str = Field(
        ...,
        description="Type: 'more_specific', 'add_attribute', 'alternative'",
    )
    concept: ConceptResponse = Field(..., description="The suggested concept")
    reason: str = Field(default="", description="Reason for suggestion")
    confidence: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Confidence score",
    )


class RefineResponse(BaseModel):
    """Response for concept refinement."""

    original_concept_id: str = Field(..., description="The original concept ID")
    original_term: str = Field(default="", description="Original term")
    context: str | None = Field(default=None, description="Context text provided")
    suggestions: list[RefinementSuggestion] = Field(
        default_factory=list,
        description="Refinement suggestions",
    )
    processing_time_ms: int = Field(..., description="Processing time")


class SuggestionResponse(BaseModel):
    """Response for concept suggestions (children/siblings)."""

    concept_id: str = Field(..., description="Source concept ID")
    suggestion_type: str = Field(
        ...,
        description="Type: 'children', 'siblings', 'alternatives'",
    )
    concepts: list[ConceptResponse] = Field(
        default_factory=list,
        description="Suggested concepts",
    )
    total_count: int = Field(default=0, description="Total available suggestions")
    processing_time_ms: int = Field(..., description="Processing time")


# =============================================================================
# Phase 3: Enhanced Coding Responses
# =============================================================================


class MappedModifierResponse(BaseModel):
    """A modifier mapped to SNOMED CT attribute."""

    attribute_id: str = Field(..., description="SNOMED attribute concept ID")
    attribute_name: str = Field(..., description="Attribute name")
    value_id: str = Field(..., description="SNOMED value concept ID")
    value_term: str = Field(..., description="Value term")
    original_modifier_type: str = Field(..., description="Original modifier type")
    original_modifier_value: str = Field(..., description="Original modifier value")
    confidence: float = Field(default=1.0, description="Mapping confidence")


class MapModifiersResponse(BaseModel):
    """Response for modifier mapping."""

    mappings: list[MappedModifierResponse] = Field(
        default_factory=list,
        description="Successfully mapped modifiers",
    )
    unmapped: list[str] = Field(
        default_factory=list,
        description="Modifiers that could not be mapped",
    )
    processing_time_ms: int = Field(..., description="Processing time")


class RelationshipValidationResponse(BaseModel):
    """Response for relationship validation."""

    source_concept_id: str = Field(..., description="Source concept ID")
    source_term: str = Field(default="", description="Source concept term")
    relationship_type_id: str = Field(..., description="Relationship type ID")
    relationship_type_name: str = Field(default="", description="Relationship type name")
    target_concept_id: str = Field(..., description="Target concept ID")
    target_term: str = Field(default="", description="Target concept term")
    is_valid: bool = Field(..., description="Whether relationship is valid")
    validation_method: str = Field(
        default="existing",
        description="How validation was performed: 'existing', 'mrcm', 'ecl'",
    )
    message: str = Field(default="", description="Validation message")


class RefsetInfo(BaseModel):
    """Information about a reference set."""

    refset_id: str = Field(..., description="Refset concept ID")
    refset_name: str = Field(..., description="Refset name")
    is_member: bool = Field(..., description="Whether concept is a member")


class RefsetMembershipResponse(BaseModel):
    """Response for refset membership check."""

    concept_id: str = Field(..., description="The concept ID checked")
    concept_term: str = Field(default="", description="Concept term")
    refsets: list[RefsetInfo] = Field(
        default_factory=list,
        description="Refset membership information",
    )
    processing_time_ms: int = Field(..., description="Processing time")


class PostCoordinatedConcept(BaseModel):
    """A post-coordinated SNOMED CT concept."""

    focus_concept_id: str = Field(..., description="Focus concept ID")
    focus_concept_term: str = Field(..., description="Focus concept term")
    expression: str = Field(..., description="Full SNOMED expression")
    human_readable: str = Field(..., description="Human-readable form")
    attributes: list[MappedModifierResponse] = Field(
        default_factory=list,
        description="Mapped attributes",
    )


class EnhancedConceptResult(BaseModel):
    """Enhanced concept result with post-coordination."""

    phrase: str = Field(..., description="The clinical phrase")
    phrase_type: str = Field(..., description="Type of phrase")
    negated: bool = Field(default=False, description="Whether negated")
    matches: list[ConceptMatchResponse] = Field(
        default_factory=list,
        description="Matched pre-coordinated concepts",
    )
    mapped_modifiers: list[MappedModifierResponse] = Field(
        default_factory=list,
        description="Modifiers mapped to attributes",
    )
    post_coordinated: PostCoordinatedConcept | None = Field(
        default=None,
        description="Post-coordinated expression if applicable",
    )


class EnhancedCodeResponse(BaseModel):
    """Response for enhanced coding with post-coordination."""

    session_id: str | None = Field(default=None, description="Session ID")
    normalized: NormalizeResponse = Field(
        ...,
        description="Text normalization results",
    )
    concepts: list[EnhancedConceptResult] = Field(
        default_factory=list,
        description="Enhanced concept results",
    )
    processing_time_ms: int = Field(..., description="Total processing time")
    status: str = Field(default="complete", description="Processing status")


# =============================================================================
# Phase 4: Question Generation Responses
# =============================================================================


class QuestionOptionResponse(BaseModel):
    """A single answer option - ALWAYS backed by SNOMED CT.

    Every option has a SNOMED concept ID - this is the zero-hallucination guarantee.
    """

    concept_id: str = Field(..., description="SNOMED CT concept ID (REQUIRED)")
    display_text: str = Field(..., description="Human-readable option text")
    fsn: str = Field(default="", description="Fully Specified Name")
    semantic_tag: str = Field(default="", description="Semantic tag")
    pre_selected: bool = Field(
        default=False,
        description="Pre-selected based on text extraction",
    )
    pre_selection_source: str = Field(
        default="",
        description="Source of pre-selection (e.g., 'text_modifier:severity')",
    )


class QuestionResponse(BaseModel):
    """A clarifying question with SNOMED-backed options.

    All options have SNOMED CT concept IDs.
    """

    id: str = Field(..., description="Unique question ID")
    question_type: str = Field(
        ...,
        description="Type: specificity, laterality, severity, temporal, attribute, disambiguation",
    )
    priority: int = Field(..., description="Priority (1=critical, 5=optional)")

    # Source
    source_concept_id: str = Field(..., description="Concept this question is about")
    source_concept_term: str = Field(..., description="Concept term")
    attribute_id: str | None = Field(
        default=None,
        description="Attribute ID if this is an attribute question",
    )
    attribute_name: str | None = Field(default=None, description="Attribute name")

    # Content
    text: str = Field(..., description="Question text (may be LLM-formatted)")
    options: list[QuestionOptionResponse] = Field(
        ...,
        description="Answer options - ALL have SNOMED IDs",
    )

    # Metadata
    ecl_source: str | None = Field(
        default=None,
        description="ECL used to generate options",
    )
    skip_option: bool = Field(
        default=True,
        description="Whether 'Skip/Not specified' is available",
    )
    multi_select: bool = Field(
        default=False,
        description="Whether multiple options can be selected",
    )


class AnsweredQuestionResponse(BaseModel):
    """Record of an answered question."""

    question_id: str = Field(..., description="Question ID")
    question_type: str = Field(..., description="Question type")
    selected_options: list[QuestionOptionResponse] = Field(
        default_factory=list,
        description="Selected options (all have SNOMED IDs)",
    )
    skipped: bool = Field(default=False, description="Whether question was skipped")
    resulting_attribute: tuple[str, str] | None = Field(
        default=None,
        description="Resulting attribute (attribute_id, value_id)",
    )


class ConceptWithQuestionsResponse(BaseModel):
    """A concept with its generated questions."""

    concept_id: str = Field(..., description="SNOMED concept ID")
    concept_term: str = Field(..., description="Concept term")
    semantic_tag: str = Field(default="", description="Semantic tag")
    phrase: str = Field(..., description="Original clinical phrase")
    negated: bool = Field(default=False, description="Whether phrase is negated")
    questions: list[QuestionResponse] = Field(
        default_factory=list,
        description="Generated questions for this concept",
    )
    answered: list[AnsweredQuestionResponse] = Field(
        default_factory=list,
        description="Answered questions",
    )
    final_expression: str | None = Field(
        default=None,
        description="Final SNOMED expression after all questions answered",
    )


class CodeWithQuestionsResponse(BaseModel):
    """Response for coding with question generation."""

    session_id: str = Field(..., description="Session ID for follow-up interactions")
    status: str = Field(
        ...,
        description="Status: 'pending_questions', 'complete'",
    )
    normalized: NormalizeResponse = Field(
        ...,
        description="Text normalization results",
    )
    concepts: list[ConceptWithQuestionsResponse] = Field(
        default_factory=list,
        description="Concepts with generated questions",
    )
    pending_questions: list[QuestionResponse] = Field(
        default_factory=list,
        description="All pending questions (sorted by priority)",
    )
    next_question: QuestionResponse | None = Field(
        default=None,
        description="The next question to answer",
    )
    processing_time_ms: int = Field(..., description="Processing time")


class FocusConceptResponse(BaseModel):
    """Current focus concept in a drilling workflow."""

    concept_id: str = Field(..., description="Current focus SNOMED concept ID")
    concept_term: str = Field(..., description="Concept term")
    semantic_tag: str = Field(default="", description="Semantic tag")
    original_phrase: str = Field(..., description="Original clinical phrase")
    depth: int = Field(default=0, description="Drilling depth (0=initial)")
    parent_concept_id: str | None = Field(
        default=None,
        description="Parent concept we drilled from",
    )


class DrillingSummaryResponse(BaseModel):
    """Summary of the drilling path in a session."""

    current_depth: int = Field(default=0, description="Current drilling depth")
    max_depth: int = Field(default=10, description="Maximum allowed depth")
    path: list[dict] = Field(
        default_factory=list,
        description="Drilling path (list of concept_id, term, depth)",
    )
    answered_attributes: list[str] = Field(
        default_factory=list,
        description="Attribute IDs that have been answered",
    )
    total_questions_asked: int = Field(default=0, description="Total questions asked")
    total_questions_answered: int = Field(default=0, description="Total answered")


class SessionResponse(BaseModel):
    """Response for session state with drilling support."""

    session_id: str = Field(..., description="Session ID")
    status: str = Field(..., description="Session status")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")
    original_text: str = Field(..., description="Original input text")
    normalized_text: str = Field(default="", description="Normalized text")

    # Focus concept - changes as user drills down
    current_focus: FocusConceptResponse | None = Field(
        default=None,
        description="Current focus concept (changes during drilling)",
    )
    drilling_summary: DrillingSummaryResponse | None = Field(
        default=None,
        description="Summary of drilling path",
    )

    concept_count: int = Field(default=0, description="Number of initial concepts")
    pending_question_count: int = Field(default=0, description="Pending questions")
    answered_question_count: int = Field(default=0, description="Answered questions")
    next_question: QuestionResponse | None = Field(
        default=None,
        description="Next question to answer",
    )
    final_expressions: list[str] = Field(
        default_factory=list,
        description="Final SNOMED expressions",
    )


class AnswerResponse(BaseModel):
    """Response for answering a question with drilling support."""

    valid: bool = Field(..., description="Whether the answer was valid")
    error_message: str | None = Field(default=None, description="Error if invalid")
    session_id: str = Field(..., description="Session ID")
    session_status: str = Field(..., description="Updated session status")

    # Drilling information
    drilled_down: bool = Field(
        default=False,
        description="True if this answer caused a drill-down to more specific concept",
    )
    current_focus: FocusConceptResponse | None = Field(
        default=None,
        description="Current focus concept (may have changed after answer)",
    )
    new_questions_generated: int = Field(
        default=0,
        description="Number of new questions generated after drilling",
    )

    answered_question: AnsweredQuestionResponse | None = Field(
        default=None,
        description="The answered question record",
    )
    next_question: QuestionResponse | None = Field(
        default=None,
        description="Next question to answer (if any)",
    )
    final_expressions: list[str] = Field(
        default_factory=list,
        description="Final expressions (if session complete)",
    )


class GenerateQuestionsResponse(BaseModel):
    """Response for question generation."""

    concept_id: str = Field(..., description="Source concept ID")
    concept_term: str = Field(default="", description="Concept term")
    questions: list[QuestionResponse] = Field(
        default_factory=list,
        description="Generated questions",
    )
    processing_time_ms: int = Field(..., description="Processing time")
