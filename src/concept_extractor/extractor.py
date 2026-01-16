"""Clinical concept extraction."""


class ConceptExtractor:
    """Extracts clinical concepts from normalized text."""

    def __init__(self):
        pass

    def extract(self, text: str) -> list[dict]:
        """Extract clinical concepts from text."""
        raise NotImplementedError
