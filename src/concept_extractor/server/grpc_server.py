"""gRPC server for concept extractor service."""

import logging
from concurrent import futures

import grpc

from concept_extractor.server.proto import concept_extractor_pb2_grpc
from concept_extractor.server.servicer import ConceptExtractorServicer

logger = logging.getLogger(__name__)


class ConceptExtractorServer:
    """gRPC server wrapper for ConceptExtractor."""

    def __init__(
        self,
        host: str = "0.0.0.0",
        port: int = 50052,
        max_workers: int = 10,
    ) -> None:
        """Initialize the gRPC server.

        Args:
            host: Host to bind to.
            port: Port to listen on.
            max_workers: Maximum number of worker threads.
        """
        self._host = host
        self._port = port
        self._max_workers = max_workers
        self._server: grpc.Server | None = None

    @property
    def address(self) -> str:
        """Get the server address."""
        return f"{self._host}:{self._port}"

    def start(self) -> None:
        """Start the gRPC server."""
        self._server = grpc.server(
            futures.ThreadPoolExecutor(max_workers=self._max_workers)
        )

        # Create servicer (it handles ConceptExtractor initialization internally)
        servicer = ConceptExtractorServicer()
        concept_extractor_pb2_grpc.add_ConceptExtractorServiceServicer_to_server(
            servicer, self._server
        )

        self._server.add_insecure_port(self.address)
        self._server.start()

        logger.info(f"ConceptExtractor gRPC server started on {self.address}")

    def stop(self, grace: float = 5.0) -> None:
        """Stop the gRPC server."""
        if self._server:
            self._server.stop(grace)
            logger.info("ConceptExtractor gRPC server stopped")

    def wait_for_termination(self) -> None:
        """Block until the server terminates."""
        if self._server:
            self._server.wait_for_termination()
