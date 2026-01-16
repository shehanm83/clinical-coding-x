"""Core text normalization logic with abbreviation expansion."""

from __future__ import annotations

import logging
import re
import time

from text_normalizer.core.abbreviations import AbbreviationWhitelist
from text_normalizer.core.models import (
    AbbreviationExpansion,
    NormalizedText,
)

logger = logging.getLogger(__name__)


class TextNormalizer:
    """Normalizes clinical text by expanding abbreviations.

    This class uses CSV whitelist-based abbreviation expansion with
    regex word-boundary matching. The whitelist ensures zero-hallucination -
    only abbreviations explicitly defined in the CSV are expanded.

    The LLM-powered clinical phrase identification will be added later.

    Attributes:
        whitelist: Abbreviation whitelist from CSV.
    """

    def __init__(
        self,
        whitelist: AbbreviationWhitelist,
    ) -> None:
        """Initialize the text normalizer.

        Args:
            whitelist: Abbreviation whitelist instance.
        """
        self.whitelist = whitelist
        logger.info(
            "TextNormalizer initialized with %d abbreviations",
            len(whitelist),
        )

    def normalize(self, text: str) -> NormalizedText:
        """Normalize clinical text by expanding abbreviations.

        This method:
        1. Expands abbreviations using the CSV whitelist (deterministic)
        2. Tracks all expansions with character positions

        Args:
            text: Raw clinical text to normalize.

        Returns:
            NormalizedText with expanded text and tracked expansions.
        """
        start_time = time.time()
        original_text = text

        # Step 1: Expand abbreviations using whitelist (deterministic, no LLM)
        expanded_text, expansions = self._expand_abbreviations(text)

        processing_time_ms = int((time.time() - start_time) * 1000)

        return NormalizedText(
            original_text=original_text,
            normalized_text=expanded_text,
            abbreviations_expanded=expansions,
            processing_time_ms=processing_time_ms,
        )

    async def normalize_async(self, text: str) -> NormalizedText:
        """Normalize clinical text asynchronously.

        Currently just calls the sync version. Will be updated when
        LLM integration is added.

        Args:
            text: Raw clinical text to normalize.

        Returns:
            NormalizedText with expanded text and tracked expansions.
        """
        return self.normalize(text)

    def _expand_abbreviations(
        self, text: str
    ) -> tuple[str, list[AbbreviationExpansion]]:
        """Expand abbreviations using the CSV whitelist.

        This is a deterministic operation - only abbreviations in the
        whitelist are expanded, ensuring zero hallucination.

        Uses regex word-boundary matching to find abbreviations and
        replaces from end to start to preserve character positions.

        Args:
            text: Input text to process.

        Returns:
            Tuple of (expanded text, list of expansions made).
        """
        expansions: list[AbbreviationExpansion] = []

        all_abbrevs = self.whitelist.get_all()
        if not all_abbrevs:
            return text, expansions

        # First, find all matches with their positions
        # Format: (start, end, original_text, expanded_text)
        all_matches: list[tuple[int, int, str, str]] = []

        for abbrev in all_abbrevs:
            # Create regex pattern with smart boundaries
            # Standard \b doesn't work for abbreviations ending in / like "w/"
            # Use lookbehind/lookahead for more flexible matching
            escaped = re.escape(abbrev.abbreviation)

            # Check if abbreviation starts/ends with non-word characters
            starts_with_word_char = abbrev.abbreviation[0].isalnum()
            ends_with_word_char = abbrev.abbreviation[-1].isalnum()

            # Build pattern with appropriate boundaries
            if starts_with_word_char:
                pattern_start = r'\b'  # Word boundary works
            else:
                pattern_start = r'(?<!\w)'  # Negative lookbehind for word char

            if ends_with_word_char:
                pattern_end = r'\b'  # Word boundary works
            else:
                pattern_end = r'(?!\w)'  # Negative lookahead for word char

            pattern = re.compile(
                pattern_start + escaped + pattern_end,
                re.IGNORECASE,
            )
            for match in pattern.finditer(text):
                all_matches.append((
                    match.start(),
                    match.end(),
                    match.group(),  # Original text as it appears
                    abbrev.full_name,
                ))

        if not all_matches:
            return text, expansions

        # Sort by position (start), then by length descending for overlaps
        all_matches.sort(key=lambda m: (m[0], -(m[1] - m[0])))

        # Remove overlapping matches (keep first/longest at each position)
        filtered_matches: list[tuple[int, int, str, str]] = []
        last_end = -1
        for start, end, original, expanded in all_matches:
            if start >= last_end:
                filtered_matches.append((start, end, original, expanded))
                last_end = end

        # Sort by position DESCENDING to replace from end to start
        # This way earlier positions don't shift when we replace
        filtered_matches.sort(key=lambda m: m[0], reverse=True)

        result_text = text
        for start, end, original, expanded in filtered_matches:
            result_text = result_text[:start] + expanded + result_text[end:]
            expansions.append(
                AbbreviationExpansion(
                    original=original,
                    expanded=expanded,
                    start=start,
                    end=end,
                )
            )

        # Sort expansions by position for output (ascending order)
        expansions.sort(key=lambda e: e.start)

        logger.debug("Expanded %d abbreviations in text", len(expansions))
        return result_text, expansions
