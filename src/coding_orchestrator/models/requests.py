"""Pydantic request models for REST API."""

from pydantic import BaseModel, Field


class CodeOptions(BaseModel):
    """Options for the coding endpoint."""

    expand_synonyms: bool = Field(
        default=True,
        description="Expand lay terms to SNOMED preferred terms",
    )
    include_hierarchy: bool = Field(
        default=False,
        description="Include parent/child concepts in response",
    )
    ecl_filter: str | None = Field(
        default=None,
        description="ECL expression to filter concepts (e.g., '<< 404684003' for clinical findings)",
    )
    max_concepts: int = Field(
        default=10,
        ge=1,
        le=100,
        description="Maximum number of concept matches per phrase",
    )
    min_similarity: float = Field(
        default=0.5,
        ge=0.0,
        le=1.0,
        description="Minimum similarity score for concept matches",
    )
    include_attributes: bool = Field(
        default=True,
        description="Include MRCM attributes for matched concepts",
    )


class CodeRequest(BaseModel):
    """Request for the main coding endpoint."""

    text: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Clinical text to code",
        examples=["Pt presents with severe CP radiating to L arm, SOB x 2 days"],
    )
    options: CodeOptions | None = Field(
        default=None,
        description="Coding options",
    )


class NormalizeRequest(BaseModel):
    """Request for text normalization only."""

    text: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Clinical text to normalize",
        examples=["Pt c/o SOB and CP"],
    )


class ExtractRequest(BaseModel):
    """Request for concept extraction only."""

    text: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="Text to extract concepts from (ideally already normalized)",
        examples=["severe chest pain radiating to left arm"],
    )
    limit: int = Field(
        default=10,
        ge=1,
        le=100,
        description="Maximum number of concept matches",
    )
    domain: str | None = Field(
        default=None,
        description="Filter by semantic tag (e.g., 'finding', 'disorder', 'procedure')",
    )
    expand_synonyms: bool = Field(
        default=True,
        description="Expand lay terms to SNOMED preferred terms",
    )
    min_similarity: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Minimum similarity score",
    )


class EclRequest(BaseModel):
    """Request for ECL execution."""

    ecl: str = Field(
        ...,
        min_length=1,
        description="ECL expression to execute",
        examples=["<< 73211009", "<< 404684003 : 363698007 = << 80891009"],
    )
    limit: int = Field(
        default=100,
        ge=1,
        le=10000,
        description="Maximum number of results",
    )
    include_details: bool = Field(
        default=True,
        description="Include full concept details (term, FSN, semantic tag)",
    )


class EclMatchRequest(BaseModel):
    """Request to check if a concept matches an ECL expression."""

    concept_id: str = Field(
        ...,
        description="SNOMED CT concept ID to test",
        examples=["44054006"],
    )
    ecl: str = Field(
        ...,
        description="ECL expression to match against",
        examples=["<< 73211009"],
    )


class SubsumptionRequest(BaseModel):
    """Request to check subsumption (is-a relationship)."""

    concept_id: str = Field(
        ...,
        description="Concept ID to check (potential descendant)",
        examples=["44054006"],
    )
    ancestor_id: str = Field(
        ...,
        description="Potential ancestor concept ID",
        examples=["73211009"],
    )


class ConceptSearchRequest(BaseModel):
    """Request for concept search."""

    query: str = Field(
        ...,
        min_length=1,
        description="Search query",
        examples=["diabetes"],
    )
    limit: int = Field(
        default=10,
        ge=1,
        le=100,
        description="Maximum number of results",
    )
    active_only: bool = Field(
        default=True,
        description="Only return active concepts",
    )


# =============================================================================
# Phase 2: Expression Building & Validation Requests
# =============================================================================


class ExpressionAttributeRequest(BaseModel):
    """An attribute to add to an expression."""

    attribute_id: str = Field(
        ...,
        description="Attribute type concept ID (e.g., '246112005' for Severity)",
        examples=["246112005"],
    )
    value_id: str = Field(
        ...,
        description="Value concept ID (e.g., '24484000' for Severe)",
        examples=["24484000"],
    )
    group: int = Field(
        default=0,
        ge=0,
        description="Relationship group (0 = ungrouped)",
    )


class BuildExpressionRequest(BaseModel):
    """Request to build a SNOMED CT post-coordinated expression."""

    focus_concept_id: str = Field(
        ...,
        description="Focus concept ID",
        examples=["29857009"],
    )
    attributes: list[ExpressionAttributeRequest] = Field(
        default_factory=list,
        description="Attributes to add to the expression",
    )
    include_terms: bool = Field(
        default=True,
        description="Include human-readable terms in the expression",
    )


class ValidateExpressionRequest(BaseModel):
    """Request to validate a SNOMED CT expression."""

    expression: str = Field(
        ...,
        min_length=1,
        description="SNOMED CT expression to validate",
        examples=[
            "29857009 | Chest pain | : 246112005 | Severity | = 24484000 | Severe |",
            "29857009:246112005=24484000",
        ],
    )
    check_mrcm: bool = Field(
        default=True,
        description="Validate against MRCM rules",
    )


# =============================================================================
# Phase 2: Refinement & Suggestion Requests
# =============================================================================


class RefineConceptRequest(BaseModel):
    """Request to refine a concept with context."""

    concept_id: str = Field(
        ...,
        description="The concept to refine",
        examples=["73211009"],
    )
    context: str | None = Field(
        default=None,
        description="Clinical context to help refine (e.g., 'patient is 8 years old')",
    )
    modifiers: list[str] = Field(
        default_factory=list,
        description="Modifiers to consider (e.g., ['type 2', 'insulin dependent'])",
    )
    max_suggestions: int = Field(
        default=10,
        ge=1,
        le=50,
        description="Maximum number of suggestions",
    )


class SuggestConceptsRequest(BaseModel):
    """Request for concept suggestions."""

    concept_id: str = Field(
        ...,
        description="The concept to get suggestions for",
        examples=["73211009"],
    )
    suggestion_type: str = Field(
        default="children",
        description="Type of suggestions: 'children', 'siblings'",
    )
    limit: int = Field(
        default=20,
        ge=1,
        le=100,
        description="Maximum number of suggestions",
    )


# =============================================================================
# Phase 3: Enhanced Coding Requests
# =============================================================================


class ModifierInput(BaseModel):
    """A modifier to map to SNOMED attributes."""

    modifier_type: str = Field(
        ...,
        description="Type: 'severity', 'laterality', 'onset', 'course', 'episodicity'",
        examples=["severity"],
    )
    value: str = Field(
        ...,
        description="Modifier value",
        examples=["severe"],
    )


class MapModifiersRequest(BaseModel):
    """Request to map modifiers to SNOMED attributes."""

    modifiers: list[ModifierInput] = Field(
        ...,
        min_length=1,
        description="Modifiers to map",
    )


class ValidateRelationshipRequest(BaseModel):
    """Request to validate a relationship between concepts."""

    source_concept_id: str = Field(
        ...,
        description="Source concept ID",
        examples=["29857009"],
    )
    relationship_type_id: str = Field(
        ...,
        description="Relationship type concept ID",
        examples=["363698007"],
    )
    target_concept_id: str = Field(
        ...,
        description="Target concept ID",
        examples=["51185008"],
    )


class RefsetMembershipRequest(BaseModel):
    """Request to check refset membership."""

    concept_id: str = Field(
        ...,
        description="Concept ID to check",
        examples=["29857009"],
    )
    refset_id: str | None = Field(
        default=None,
        description="Specific refset ID to check (null = all refsets)",
    )


class EnhancedCodeRequest(BaseModel):
    """Request for enhanced coding with automatic modifier mapping."""

    text: str = Field(
        ...,
        min_length=1,
        description="Clinical text to code",
        examples=["Patient has severe left-sided chest pain with acute onset"],
    )
    auto_map_modifiers: bool = Field(
        default=True,
        description="Automatically map modifiers to SNOMED attributes",
    )
    include_post_coordination: bool = Field(
        default=True,
        description="Build post-coordinated expressions",
    )
    options: CodeOptions | None = Field(
        default=None,
        description="Additional coding options",
    )


# =============================================================================
# Phase 4: Question Generation Requests
# =============================================================================


class CodeWithQuestionsRequest(BaseModel):
    """Request for coding with question generation."""

    text: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Clinical text to code",
        examples=["Patient has chest pain radiating to left arm"],
    )
    auto_map_modifiers: bool = Field(
        default=True,
        description="Automatically map extracted modifiers",
    )
    generate_questions: bool = Field(
        default=True,
        description="Generate clarifying questions",
    )
    max_questions_per_concept: int = Field(
        default=5,
        ge=1,
        le=10,
        description="Maximum questions per concept",
    )
    use_llm_formatting: bool = Field(
        default=True,
        description="Use LLM for natural question formatting",
    )
    options: CodeOptions | None = Field(
        default=None,
        description="Additional coding options",
    )


class CreateSessionRequest(BaseModel):
    """Request to create a new coding session."""

    text: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Clinical text to code",
        examples=["Patient presents with severe headache"],
    )
    generate_questions: bool = Field(
        default=True,
        description="Generate clarifying questions",
    )
    options: CodeOptions | None = Field(
        default=None,
        description="Coding options",
    )


class AnswerQuestionRequest(BaseModel):
    """Request to answer a question in a session."""

    question_id: str = Field(
        ...,
        description="ID of the question being answered",
    )
    selected_option_ids: list[str] = Field(
        default_factory=list,
        description="List of selected option concept IDs (SNOMED IDs)",
    )
    skipped: bool = Field(
        default=False,
        description="Whether the question was skipped",
    )


class GenerateQuestionsRequest(BaseModel):
    """Request to generate questions for a concept."""

    concept_id: str = Field(
        ...,
        description="SNOMED concept ID",
        examples=["29857009"],
    )
    concept_term: str = Field(
        default="",
        description="Concept term (for display)",
    )
    semantic_tag: str = Field(
        default="finding",
        description="Semantic tag: finding, disorder, procedure, etc.",
    )
    extracted_modifiers: list[dict] = Field(
        default_factory=list,
        description="Modifiers already extracted from text",
    )
    existing_attributes: list[str] = Field(
        default_factory=list,
        description="Attribute IDs already defined",
    )
