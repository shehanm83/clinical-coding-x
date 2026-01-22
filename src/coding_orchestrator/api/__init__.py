"""API routes for coding orchestrator."""

from coding_orchestrator.api.coding import router as coding_router
from coding_orchestrator.api.concepts import router as concepts_router
from coding_orchestrator.api.ecl import router as ecl_router
from coding_orchestrator.api.enhanced import router as enhanced_router
from coding_orchestrator.api.expressions import router as expressions_router
from coding_orchestrator.api.health import router as health_router
from coding_orchestrator.api.questions import router as questions_router

__all__ = [
    "coding_router",
    "concepts_router",
    "ecl_router",
    "enhanced_router",
    "expressions_router",
    "health_router",
    "questions_router",
]
