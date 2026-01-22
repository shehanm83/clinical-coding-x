"""Entry point for the coding orchestrator API server."""

import uvicorn


def main():
    """Run the API server."""
    uvicorn.run(
        "coding_orchestrator.app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )


if __name__ == "__main__":
    main()
