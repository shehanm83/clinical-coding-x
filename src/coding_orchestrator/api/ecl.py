"""ECL (Expression Constraint Language) API routes."""

from fastapi import APIRouter, Depends, HTTPException

from coding_orchestrator.api.dependencies import get_coding_service
from coding_orchestrator.models.requests import (
    EclMatchRequest,
    EclRequest,
    SubsumptionRequest,
)
from coding_orchestrator.models.responses import (
    EclMatchResponse,
    EclResponse,
    SubsumptionResponse,
)
from coding_orchestrator.services.coding_service import CodingService

router = APIRouter(prefix="/api/v1/ecl", tags=["ecl"])


@router.post(
    "/execute",
    response_model=EclResponse,
    summary="Execute ECL expression",
    description="""
    Execute a SNOMED CT Expression Constraint Language (ECL) query.

    Examples:
    - `<< 73211009` - All descendants of diabetes (including self)
    - `< 73211009` - Descendants only (excluding self)
    - `>> 73211009` - All ancestors (including self)
    - `<< 404684003 : 363698007 = << 80891009` - Findings with site in heart
    """,
)
async def execute_ecl(
    request: EclRequest,
    service: CodingService = Depends(get_coding_service),
) -> EclResponse:
    """Execute an ECL expression."""
    try:
        return await service.execute_ecl(
            ecl=request.ecl,
            limit=request.limit,
            include_details=request.include_details,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/match",
    response_model=EclMatchResponse,
    summary="Check ECL match",
    description="""
    Check if a concept matches an ECL expression.

    This is useful for validating that a selected concept belongs to
    a specific category (e.g., is it a clinical finding? is it a type of diabetes?).
    """,
)
async def check_ecl_match(
    request: EclMatchRequest,
    service: CodingService = Depends(get_coding_service),
) -> EclMatchResponse:
    """Check if a concept matches an ECL expression."""
    try:
        matches = await service.matches_ecl(request.concept_id, request.ecl)
        return EclMatchResponse(
            concept_id=request.concept_id,
            ecl=request.ecl,
            matches=matches,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/subsumption",
    response_model=SubsumptionResponse,
    summary="Check subsumption",
    description="""
    Check if a concept is subsumed by (is a descendant of) another concept.

    This is equivalent to checking the IS_A relationship in the SNOMED hierarchy.
    """,
)
async def check_subsumption(
    request: SubsumptionRequest,
    service: CodingService = Depends(get_coding_service),
) -> SubsumptionResponse:
    """Check if a concept is a descendant of another."""
    try:
        return await service.is_descendant_of(request.concept_id, request.ancestor_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
