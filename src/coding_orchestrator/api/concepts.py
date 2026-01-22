"""Concept lookup API routes."""

from fastapi import APIRouter, Depends, HTTPException, Query

from coding_orchestrator.api.dependencies import get_coding_service
from coding_orchestrator.models.responses import (
    ConceptResponse,
    HierarchyResponse,
    MrcmAttributesResponse,
    RelationshipsResponse,
)
from coding_orchestrator.services.coding_service import CodingService

router = APIRouter(prefix="/api/v1/concepts", tags=["concepts"])


@router.get(
    "/{concept_id}",
    response_model=ConceptResponse,
    summary="Get concept by ID",
    description="Retrieve a SNOMED CT concept by its concept ID.",
)
async def get_concept(
    concept_id: str,
    service: CodingService = Depends(get_coding_service),
) -> ConceptResponse:
    """Get a concept by ID."""
    try:
        concept = await service.get_concept(concept_id)
        if concept is None:
            raise HTTPException(status_code=404, detail=f"Concept {concept_id} not found")
        return concept
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/{concept_id}/children",
    response_model=HierarchyResponse,
    summary="Get direct children",
    description="Get direct children of a concept in the SNOMED CT hierarchy.",
)
async def get_children(
    concept_id: str,
    service: CodingService = Depends(get_coding_service),
) -> HierarchyResponse:
    """Get direct children of a concept."""
    try:
        return await service.get_children(concept_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/{concept_id}/descendants",
    response_model=HierarchyResponse,
    summary="Get descendants",
    description="Get all descendants of a concept in the SNOMED CT hierarchy.",
)
async def get_descendants(
    concept_id: str,
    limit: int = Query(default=100, ge=1, le=1000, description="Maximum results"),
    service: CodingService = Depends(get_coding_service),
) -> HierarchyResponse:
    """Get descendants of a concept."""
    try:
        return await service.get_descendants(concept_id, limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/{concept_id}/ancestors",
    response_model=HierarchyResponse,
    summary="Get ancestors",
    description="Get all ancestors of a concept (IS_A hierarchy upward).",
)
async def get_ancestors(
    concept_id: str,
    service: CodingService = Depends(get_coding_service),
) -> HierarchyResponse:
    """Get ancestors of a concept."""
    try:
        return await service.get_ancestors(concept_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/{concept_id}/parents",
    response_model=HierarchyResponse,
    summary="Get direct parents",
    description="Get direct parents of a concept (one level up in IS_A hierarchy).",
)
async def get_parents(
    concept_id: str,
    service: CodingService = Depends(get_coding_service),
) -> HierarchyResponse:
    """Get direct parents of a concept."""
    try:
        return await service.get_parents(concept_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/{concept_id}/attributes",
    response_model=MrcmAttributesResponse,
    summary="Get MRCM attributes",
    description="""
    Get valid MRCM (Machine Readable Concept Model) attributes for a concept.

    Returns attributes that can be used to refine the concept, along with
    their valid value ranges. This is useful for building post-coordinated
    expressions.
    """,
)
async def get_attributes(
    concept_id: str,
    service: CodingService = Depends(get_coding_service),
) -> MrcmAttributesResponse:
    """Get MRCM attributes for a concept."""
    try:
        return await service.get_attributes(concept_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/{concept_id}/relationships",
    response_model=RelationshipsResponse,
    summary="Get concept relationships",
    description="""
    Get all relationships for a concept (Finding site, Associated morphology, etc.).

    By default, excludes IS_A relationships (use /parents or /ancestors for hierarchy).
    Set include_is_a=true to include them.
    """,
)
async def get_relationships(
    concept_id: str,
    include_is_a: bool = Query(
        default=False,
        description="Include IS_A relationships (hierarchy)",
    ),
    service: CodingService = Depends(get_coding_service),
) -> RelationshipsResponse:
    """Get relationships for a concept."""
    try:
        return await service.get_relationships(concept_id, exclude_is_a=not include_is_a)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
