"""Core text normalization logic - placeholder for implementation."""

from text_normalizer.core.models import NormalizedText


class TextNormalizer:
    """Placeholder - will be implemented with full pipeline."""

    def __init__(self):
        pass

    def normalize(self, text: str) -> NormalizedText:
        """Placeholder normalize method."""
        raise NotImplementedError("TextNormalizer not yet implemented")

    async def normalize_async(self, text: str) -> NormalizedText:
        """Placeholder async normalize method."""
        raise NotImplementedError("TextNormalizer not yet implemented")
