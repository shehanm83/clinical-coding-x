"""FastAPI dependencies for dependency injection."""

from coding_orchestrator.services.coding_service import CodingService

# Global service instance (singleton pattern for FastAPI)
_coding_service: CodingService | None = None


def get_coding_service() -> CodingService:
    """Get the coding service instance.

    This is used as a FastAPI dependency to inject the service into routes.
    The service is lazily initialized on first use.
    """
    global _coding_service
    if _coding_service is None:
        _coding_service = CodingService()
    return _coding_service


async def shutdown_coding_service() -> None:
    """Shutdown the coding service (called on app shutdown)."""
    global _coding_service
    if _coding_service is not None:
        await _coding_service.close()
        _coding_service = None
