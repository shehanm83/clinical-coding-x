"""gRPC server for text normalizer service."""

import logging
from concurrent import futures

import grpc

from text_normalizer.core.normalizer import TextNormalizer
from text_normalizer.server.proto import text_normalizer_pb2_grpc
from text_normalizer.server.servicer import TextNormalizerServicer

logger = logging.getLogger(__name__)


class TextNormalizerServer:
    """gRPC server wrapper for TextNormalizer."""

    def __init__(
        self,
        host: str = "0.0.0.0",
        port: int = 50051,
        max_workers: int = 10,
        normalizer: TextNormalizer | None = None,
    ):
        """
        Initialize the gRPC server.

        Args:
            host: Host to bind to.
            port: Port to listen on.
            max_workers: Maximum number of worker threads.
            normalizer: Optional TextNormalizer instance to use.
        """
        self._host = host
        self._port = port
        self._max_workers = max_workers
        self._normalizer = normalizer or TextNormalizer()
        self._server: grpc.Server | None = None

    @property
    def address(self) -> str:
        """Get the server address."""
        return f"{self._host}:{self._port}"

    def start(self) -> None:
        """Start the gRPC server."""
        self._server = grpc.server(futures.ThreadPoolExecutor(max_workers=self._max_workers))

        servicer = TextNormalizerServicer(self._normalizer)
        text_normalizer_pb2_grpc.add_TextNormalizerServiceServicer_to_server(
            servicer, self._server
        )

        self._server.add_insecure_port(self.address)
        self._server.start()

        logger.info(f"TextNormalizer gRPC server started on {self.address}")

    def stop(self, grace: float = 5.0) -> None:
        """Stop the gRPC server."""
        if self._server:
            self._server.stop(grace)
            logger.info("TextNormalizer gRPC server stopped")

    def wait_for_termination(self) -> None:
        """Block until the server terminates."""
        if self._server:
            self._server.wait_for_termination()
