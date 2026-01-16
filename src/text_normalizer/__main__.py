"""Entry point for running the text normalizer gRPC server."""

import logging
import signal
import sys

from text_normalizer.server.grpc_server import TextNormalizerServer


def main():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    server = TextNormalizerServer(host="0.0.0.0", port=50051)

    def shutdown(signum, frame):
        print("\nShutting down...")
        server.stop()
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    server.start()
    print("Server is running. Press Ctrl+C to stop.")
    server.wait_for_termination()


if __name__ == "__main__":
    main()
