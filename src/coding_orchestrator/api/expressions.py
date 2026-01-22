"""Expression building, validation, and concept refinement API routes."""

from fastapi import APIRouter, Depends, HTTPException

from coding_orchestrator.api.dependencies import get_coding_service
from coding_orchestrator.models.requests import (
    BuildExpressionRequest,
    RefineConceptRequest,
    SuggestConceptsRequest,
    ValidateExpressionRequest,
)
from coding_orchestrator.models.responses import (
    ExpressionResponse,
    ExpressionValidationResponse,
    RefineResponse,
    SuggestionResponse,
)
from coding_orchestrator.services.coding_service import CodingService

router = APIRouter(prefix="/api/v1", tags=["expressions"])


# =============================================================================
# Expression Building & Validation
# =============================================================================


@router.post(
    "/build-expression",
    response_model=ExpressionResponse,
    summary="Build SNOMED CT expression",
    description="""
    Build a SNOMED CT post-coordinated expression from a focus concept and attributes.

    **Example:**
    - Focus: 29857009 (Chest pain)
    - Attributes: [{attribute_id: "246112005", value_id: "24484000"}] (Severity = Severe)
    - Result: "29857009 | Chest pain | : 246112005 | Severity | = 24484000 | Severe |"

    The expression follows SNOMED CT Compositional Grammar (SCG).
    """,
)
async def build_expression(
    request: BuildExpressionRequest,
    service: CodingService = Depends(get_coding_service),
) -> ExpressionResponse:
    """Build a SNOMED CT post-coordinated expression."""
    try:
        # Convert request attributes to tuples
        attributes = [
            (attr.attribute_id, attr.value_id, attr.group)
            for attr in request.attributes
        ]
        return await service.build_expression(
            focus_concept_id=request.focus_concept_id,
            attributes=attributes,
            include_terms=request.include_terms,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/validate/expression",
    response_model=ExpressionValidationResponse,
    summary="Validate SNOMED CT expression",
    description="""
    Validate a SNOMED CT post-coordinated expression.

    Checks:
    - Focus concept exists and is active
    - All attribute types exist
    - All value concepts exist
    - Optionally validates against MRCM rules (attribute applicability)

    **Supported formats:**
    - Simple: `29857009:246112005=24484000`
    - With terms: `29857009 | Chest pain | : 246112005 | Severity | = 24484000 | Severe |`
    """,
)
async def validate_expression(
    request: ValidateExpressionRequest,
    service: CodingService = Depends(get_coding_service),
) -> ExpressionValidationResponse:
    """Validate a SNOMED CT expression."""
    try:
        return await service.validate_expression(
            expression=request.expression,
            check_mrcm=request.check_mrcm,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# Concept Refinement & Suggestions
# =============================================================================


@router.post(
    "/refine",
    response_model=RefineResponse,
    summary="Refine concept selection",
    description="""
    Get refinement suggestions for a concept based on context.

    Use this when:
    - You have a general concept and need a more specific one
    - You have modifiers that should narrow down the concept
    - You want alternative concepts that might be better matches

    **Example:**
    - Concept: 73211009 (Diabetes mellitus)
    - Modifiers: ["type 2", "insulin dependent"]
    - Returns: More specific diabetes concepts matching the modifiers
    """,
)
async def refine_concept(
    request: RefineConceptRequest,
    service: CodingService = Depends(get_coding_service),
) -> RefineResponse:
    """Get refinement suggestions for a concept."""
    try:
        return await service.refine_concept(
            concept_id=request.concept_id,
            context=request.context,
            modifiers=request.modifiers,
            max_suggestions=request.max_suggestions,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/suggest/children",
    response_model=SuggestionResponse,
    summary="Suggest more specific concepts",
    description="""
    Get direct children of a concept as more specific alternatives.

    Use this when you want to offer the user more specific options
    for a selected concept.

    **Example:**
    - Concept: 73211009 (Diabetes mellitus)
    - Suggestions: Type 1, Type 2, Gestational, Secondary diabetes, etc.
    """,
)
async def suggest_children(
    request: SuggestConceptsRequest,
    service: CodingService = Depends(get_coding_service),
) -> SuggestionResponse:
    """Get child concepts as suggestions."""
    try:
        return await service.suggest_concepts(
            concept_id=request.concept_id,
            suggestion_type="children",
            limit=request.limit,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/suggest/siblings",
    response_model=SuggestionResponse,
    summary="Suggest alternative concepts",
    description="""
    Get sibling concepts (same parent) as alternatives.

    Use this when you want to offer the user alternative options
    at the same level of specificity.

    **Example:**
    - Concept: 44054006 (Type 2 diabetes mellitus)
    - Suggestions: Type 1 diabetes, Gestational diabetes, etc. (other children of Diabetes mellitus)
    """,
)
async def suggest_siblings(
    request: SuggestConceptsRequest,
    service: CodingService = Depends(get_coding_service),
) -> SuggestionResponse:
    """Get sibling concepts as suggestions."""
    try:
        return await service.suggest_concepts(
            concept_id=request.concept_id,
            suggestion_type="siblings",
            limit=request.limit,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
