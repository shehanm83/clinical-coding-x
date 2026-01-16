"""Core text normalization logic with abbreviation expansion and LLM analysis."""

from __future__ import annotations

import logging
import re
import time
from typing import Any

from shared.llm_client import LLMClient
from text_normalizer.core.abbreviations import AbbreviationWhitelist
from text_normalizer.core.models import (
    AbbreviationExpansion,
    ClinicalPhrase,
    ClinicalRelationship,
    Modifier,
    NegationSpan,
    NormalizedText,
    SpellingCorrection,
)
from text_normalizer.core.prompts import PromptManager

logger = logging.getLogger(__name__)


class TextNormalizer:
    """Normalizes clinical text by expanding abbreviations and identifying phrases.

    This class combines CSV whitelist-based abbreviation expansion with
    LLM-powered clinical phrase identification. The LLM is used as a "writer"
    to improve readability while all abbreviation expansions are strictly
    controlled by the CSV whitelist (zero-hallucination principle).

    Attributes:
        whitelist: Abbreviation whitelist from CSV.
        llm: LLM client for text processing.
        prompts: Prompt template manager.
    """

    def __init__(
        self,
        whitelist: AbbreviationWhitelist,
        llm: LLMClient | None = None,
        prompts: PromptManager | None = None,
    ) -> None:
        """Initialize the text normalizer.

        Args:
            whitelist: Abbreviation whitelist instance.
            llm: Optional LLM client instance for clinical analysis.
            prompts: Optional prompt manager instance.
        """
        self.whitelist = whitelist
        self.llm = llm
        self.prompts = prompts
        logger.info(
            "TextNormalizer initialized with %d abbreviations, LLM=%s",
            len(whitelist),
            "enabled" if llm else "disabled",
        )

    async def normalize(self, text: str) -> NormalizedText:
        """Normalize clinical text with full LLM analysis.

        This method:
        1. Expands abbreviations using the CSV whitelist (deterministic)
        2. Uses LLM to identify clinical phrases, negations, modifiers, and relationships
        3. Applies spelling corrections identified by LLM
        4. Returns structured output with all transformations tracked

        Args:
            text: Raw clinical text to normalize.

        Returns:
            NormalizedText with expanded text and identified components.
        """
        start_time = time.time()
        total_tokens = 0
        original_text = text

        # Step 1: Expand abbreviations using whitelist (deterministic, no LLM)
        expanded_text, expansions = self._expand_abbreviations(text)

        # Step 2: Use LLM to analyze text (if LLM is configured)
        spelling_corrections: list[SpellingCorrection] = []
        negations: list[NegationSpan] = []
        clinical_phrases: list[ClinicalPhrase] = []
        modifiers: list[Modifier] = []
        relationships: list[ClinicalRelationship] = []
        normalized_text = expanded_text

        if self.llm and self.prompts:
            llm_result = await self._analyze_text_with_llm(expanded_text)
            total_tokens += llm_result.get("tokens_used", 0)

            # Parse LLM response
            llm_json = llm_result.get("json", {})
            spelling_corrections = self._parse_spelling_corrections(llm_json)
            negations = self._parse_negations(llm_json)
            clinical_phrases = self._parse_clinical_phrases(llm_json)
            modifiers = self._parse_modifiers(llm_json)
            relationships = self._parse_relationships(llm_json)

            # Step 3: Apply spelling corrections to the expanded text
            normalized_text = self._apply_spelling_corrections(
                expanded_text, spelling_corrections
            )

        processing_time_ms = int((time.time() - start_time) * 1000)

        return NormalizedText(
            original_text=original_text,
            normalized_text=normalized_text,
            abbreviations_expanded=expansions,
            spelling_corrections=spelling_corrections,
            negations=negations,
            clinical_phrases=clinical_phrases,
            modifiers=modifiers,
            relationships=relationships,
            processing_time_ms=processing_time_ms,
            tokens_used=total_tokens,
        )

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

    async def _analyze_text_with_llm(self, text: str) -> dict[str, Any]:
        """Use LLM to analyze text for clinical phrases and negations.

        Args:
            text: The expanded text to analyze.

        Returns:
            Dict with 'json' (parsed response) and 'tokens_used'.
        """
        if not self.llm or not self.prompts:
            return {"json": {}, "tokens_used": 0}

        prompt = self.prompts.render(
            "normalize.jinja2",
            clinical_text=text,
        )

        try:
            result = await self.llm.complete_json(prompt)
            return {
                "json": result.data,
                "tokens_used": result.tokens_used,
            }
        except Exception as e:
            logger.warning("LLM analysis failed: %s", str(e))
            return {"json": {}, "tokens_used": 0}

    def _parse_negations(self, llm_output: dict[str, Any]) -> list[NegationSpan]:
        """Parse negation spans from LLM output."""
        negations = []
        raw_negations = llm_output.get("negations", [])

        for neg in raw_negations:
            if isinstance(neg, dict):
                try:
                    negations.append(
                        NegationSpan(
                            text=neg.get("text", ""),
                            start=neg.get("start", 0),
                            end=neg.get("end", 0),
                            negated=neg.get("negated", True),
                        )
                    )
                except Exception as e:
                    logger.warning("Failed to parse negation: %s", str(e))

        return negations

    def _parse_clinical_phrases(
        self, llm_output: dict[str, Any]
    ) -> list[ClinicalPhrase]:
        """Parse clinical phrases from LLM output."""
        phrases = []
        raw_phrases = llm_output.get("clinical_phrases", [])

        for phrase in raw_phrases:
            if isinstance(phrase, dict):
                try:
                    phrases.append(
                        ClinicalPhrase(
                            text=phrase.get("text", ""),
                            phrase_type=phrase.get("type", "finding"),
                            start=phrase.get("start", 0),
                            end=phrase.get("end", 0),
                        )
                    )
                except Exception as e:
                    logger.warning("Failed to parse clinical phrase: %s", str(e))

        return phrases

    def _parse_spelling_corrections(
        self, llm_output: dict[str, Any]
    ) -> list[SpellingCorrection]:
        """Parse spelling corrections from LLM output."""
        corrections = []
        raw_corrections = llm_output.get("spelling_corrections", [])

        for correction in raw_corrections:
            if isinstance(correction, dict):
                try:
                    corrections.append(
                        SpellingCorrection(
                            original=correction.get("original", ""),
                            corrected=correction.get("corrected", ""),
                            start=correction.get("start", 0),
                            end=correction.get("end", 0),
                        )
                    )
                except Exception as e:
                    logger.warning("Failed to parse spelling correction: %s", str(e))

        return corrections

    def _parse_modifiers(self, llm_output: dict[str, Any]) -> list[Modifier]:
        """Parse clinical modifiers from LLM output."""
        modifiers = []
        raw_modifiers = llm_output.get("modifiers", [])

        for modifier in raw_modifiers:
            if isinstance(modifier, dict):
                try:
                    modifiers.append(
                        Modifier(
                            modifier_type=modifier.get("modifier_type", ""),
                            value=modifier.get("value", ""),
                            target_phrase=modifier.get("target_phrase", ""),
                        )
                    )
                except Exception as e:
                    logger.warning("Failed to parse modifier: %s", str(e))

        return modifiers

    def _parse_relationships(
        self, llm_output: dict[str, Any]
    ) -> list[ClinicalRelationship]:
        """Parse clinical relationships from LLM output."""
        relationships = []
        raw_relationships = llm_output.get("relationships", [])

        for rel in raw_relationships:
            if isinstance(rel, dict):
                try:
                    relationships.append(
                        ClinicalRelationship(
                            relationship_type=rel.get("relationship_type", ""),
                            source_phrase=rel.get("source_phrase", ""),
                            target_phrase=rel.get("target_phrase", ""),
                            relationship_text=rel.get("relationship_text", ""),
                        )
                    )
                except Exception as e:
                    logger.warning("Failed to parse relationship: %s", str(e))

        return relationships

    def _apply_spelling_corrections(
        self, text: str, corrections: list[SpellingCorrection]
    ) -> str:
        """Apply spelling corrections to text.

        Corrections are applied from end to start to preserve positions.

        Args:
            text: The text to correct.
            corrections: List of spelling corrections to apply.

        Returns:
            Text with spelling corrections applied.
        """
        if not corrections:
            return text

        # Sort by position descending to replace from end to start
        sorted_corrections = sorted(corrections, key=lambda c: c.start, reverse=True)
        result = text

        for correction in sorted_corrections:
            # Verify the original text matches
            actual_text = result[correction.start : correction.end]
            if actual_text.lower() == correction.original.lower():
                result = (
                    result[: correction.start]
                    + correction.corrected
                    + result[correction.end :]
                )
            else:
                logger.warning(
                    "Spelling correction position mismatch: expected '%s', found '%s'",
                    correction.original,
                    actual_text,
                )

        return result
