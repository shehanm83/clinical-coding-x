"""Main coding API routes."""

from fastapi import APIRouter, Depends, HTTPException

from coding_orchestrator.api.dependencies import get_coding_service
from coding_orchestrator.models.requests import (
    CodeRequest,
    ExtractRequest,
    NormalizeRequest,
)
from coding_orchestrator.models.responses import (
    CodeResponse,
    ExtractResponse,
    NormalizeResponse,
)
from coding_orchestrator.services.coding_service import CodingService

router = APIRouter(prefix="/api/v1", tags=["coding"])


@router.post(
    "/code",
    response_model=CodeResponse,
    summary="Code clinical text",
    description="""
    Main coding endpoint that runs the full pipeline:
    1. Text normalization (abbreviation expansion, LLM analysis)
    2. Concept extraction (SNOMED CT matching)
    3. Attribute mapping (MRCM attributes)

    Returns normalized text with matched SNOMED concepts and their attributes.
    """,
)
async def code_text(
    request: CodeRequest,
    service: CodingService = Depends(get_coding_service),
) -> CodeResponse:
    """Process clinical text through the coding pipeline."""
    try:
        return await service.code(request.text, request.options)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/normalize",
    response_model=NormalizeResponse,
    summary="Normalize clinical text",
    description="""
    Normalize clinical text without concept extraction.

    This endpoint:
    - Expands abbreviations using CSV whitelist (deterministic)
    - Identifies clinical phrases, negations, modifiers, relationships using LLM
    - Returns structured normalized output
    """,
)
async def normalize_text(
    request: NormalizeRequest,
    service: CodingService = Depends(get_coding_service),
) -> NormalizeResponse:
    """Normalize clinical text."""
    try:
        return await service.normalize(request.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/extract",
    response_model=ExtractResponse,
    summary="Extract concepts from text",
    description="""
    Extract SNOMED CT concepts from text (without normalization).

    Use this endpoint when you have already-normalized text and want to
    find matching SNOMED concepts.
    """,
)
async def extract_concepts(
    request: ExtractRequest,
    service: CodingService = Depends(get_coding_service),
) -> ExtractResponse:
    """Extract SNOMED concepts from text."""
    try:
        return await service.extract(
            text=request.text,
            limit=request.limit,
            domain=request.domain,
            expand_synonyms=request.expand_synonyms,
            min_similarity=request.min_similarity,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
