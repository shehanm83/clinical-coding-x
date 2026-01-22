"""Health check API routes."""

from fastapi import APIRouter

from coding_orchestrator.models.responses import HealthResponse

router = APIRouter(tags=["health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description="Check the health status of the service.",
)
async def health_check() -> HealthResponse:
    """Return health status."""
    return HealthResponse(
        status="healthy",
        version="0.1.0",
        services={
            "text_normalizer": "available",
            "concept_extractor": "available",
            "snomed_grpc": "available",
        },
    )


@router.get(
    "/",
    summary="Root endpoint",
    description="Welcome message and API information.",
)
async def root() -> dict:
    """Root endpoint with API info."""
    return {
        "service": "Clinical Coding Orchestrator",
        "version": "0.1.0",
        "docs": "/docs",
        "openapi": "/openapi.json",
    }
