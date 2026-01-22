"""FastAPI application for the coding orchestrator."""

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from coding_orchestrator.api import (
    coding_router,
    concepts_router,
    ecl_router,
    enhanced_router,
    expressions_router,
    health_router,
    questions_router,
)
from coding_orchestrator.api.dependencies import shutdown_coding_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle."""
    logger.info("Starting Clinical Coding API...")
    yield
    logger.info("Shutting down Clinical Coding API...")
    await shutdown_coding_service()


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title="Clinical Coding API",
        description="""
# Clinical Coding Orchestrator

REST API for clinical text coding using SNOMED CT.

## Features

- **Text Normalization**: Expand abbreviations, identify clinical phrases, extract modifiers
- **Concept Extraction**: Match text to SNOMED CT concepts
- **ECL Queries**: Execute SNOMED Expression Constraint Language expressions
- **Hierarchy Navigation**: Browse SNOMED CT concept hierarchy
- **MRCM Attributes**: Get valid attributes for concepts

## Main Endpoints

- `POST /api/v1/code` - Full coding pipeline
- `POST /api/v1/normalize` - Text normalization only
- `POST /api/v1/extract` - Concept extraction only
- `POST /api/v1/ecl/execute` - Execute ECL expression
- `GET /api/v1/concepts/{id}` - Get concept details

## Zero Hallucination

This API uses deterministic SNOMED CT queries and CSV-based abbreviation expansion.
No LLM-generated concept codes or invented clinical information.
        """,
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure appropriately for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(health_router)
    app.include_router(coding_router)
    app.include_router(concepts_router)
    app.include_router(ecl_router)
    app.include_router(expressions_router)
    app.include_router(enhanced_router)
    app.include_router(questions_router)

    return app


# Create the app instance
app = create_app()
