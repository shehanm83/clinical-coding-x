"""Synonym lookup for lay term to SNOMED preferred term mapping.

This module provides functionality to map lay/consumer health terms
to their SNOMED CT preferred terms. The actual concept IDs are then
looked up from the SNOMED database via snomed-service.

Flow:
1. lay term → SNOMED preferred term (this module)
2. SNOMED preferred term → concept ID (via snomed-service exact search)
"""

from __future__ import annotations

import csv
import io
import logging
import re
from pathlib import Path

from concept_extractor.core.models import SynonymExpansion

logger = logging.getLogger(__name__)


class SynonymLookup:
    """Lookup table for lay term to SNOMED preferred term mapping.

    Maps lay/consumer health terms and abbreviations to their SNOMED CT
    preferred terms. This is used for:
    1. Direct lookup: lay term → SNOMED term → exact search in snomed-service
    2. Query expansion: append SNOMED terms to improve embedding search

    CSV Format:
        Lay_Term,SNOMED_Preferred
        shortness of breath,Dyspnea
        the runs,Diarrhea
        SOB,Dyspnea
    """

    def __init__(self, csv_path: Path | str | None = None) -> None:
        """Initialize the synonym lookup.

        Args:
            csv_path: Path to the synonyms CSV file. If None, uses default path.
        """
        self._synonyms: dict[str, str] = {}  # lay_term -> snomed_preferred
        self._loaded = False

        if csv_path is None:
            # Default to config/synonyms.csv relative to project root
            csv_path = (
                Path(__file__).parent.parent.parent.parent / "config" / "synonyms.csv"
            )

        self._csv_path = Path(csv_path)
        self._load_synonyms()

    def _load_synonyms(self) -> None:
        """Load synonyms from CSV file."""
        if not self._csv_path.exists():
            logger.warning("Synonyms file not found: %s", self._csv_path)
            return

        try:
            with open(self._csv_path, encoding="utf-8") as f:
                # Filter out comment lines and empty lines
                lines = [
                    line for line in f
                    if line.strip() and not line.strip().startswith("#")
                ]

            # Parse CSV from filtered lines
            reader = csv.DictReader(io.StringIO("".join(lines)))
            for row in reader:
                lay_term = row.get("Lay_Term", "").strip().lower()
                snomed_term = row.get("SNOMED_Preferred", "").strip()

                if lay_term and snomed_term:
                    self._synonyms[lay_term] = snomed_term

            self._loaded = True
            logger.info(
                "Loaded %d synonyms from %s", len(self._synonyms), self._csv_path
            )

        except Exception as e:
            logger.error("Failed to load synonyms: %s", str(e))

    def get_expansions(self, text: str) -> list[SynonymExpansion]:
        """Get SNOMED preferred terms for lay terms found in text.

        Scans the input text for lay terms and returns the SNOMED
        preferred terms that should be searched in snomed-service.

        Args:
            text: The input clinical text/query.

        Returns:
            List of SynonymExpansion objects for all matched lay terms.
        """
        if not self._loaded or not self._synonyms:
            return []

        text_lower = text.lower()
        expansions: list[SynonymExpansion] = []
        matched_snomed_terms: set[str] = set()  # Avoid duplicate searches

        # Sort by length (longest first) to match longer phrases first
        sorted_terms = sorted(self._synonyms.keys(), key=len, reverse=True)

        for lay_term in sorted_terms:
            # Use word boundary matching to avoid partial matches
            pattern = r"\b" + re.escape(lay_term) + r"\b"
            if re.search(pattern, text_lower):
                snomed_term = self._synonyms[lay_term]

                # Only add if we haven't already added this SNOMED term
                if snomed_term.lower() not in matched_snomed_terms:
                    expansions.append(
                        SynonymExpansion(
                            lay_term=lay_term,
                            snomed_term=snomed_term,
                        )
                    )
                    matched_snomed_terms.add(snomed_term.lower())

        return expansions

    def get_snomed_term(self, lay_term: str) -> str | None:
        """Get the SNOMED preferred term for a lay term.

        Args:
            lay_term: The lay term to look up.

        Returns:
            The SNOMED preferred term, or None if not found.
        """
        return self._synonyms.get(lay_term.strip().lower())

    def expand_query(self, text: str) -> str:
        """Expand a query by appending SNOMED preferred terms.

        Used to improve embedding search accuracy by adding medical
        terminology alongside lay terms.

        Args:
            text: The input clinical text/query.

        Returns:
            The expanded query with SNOMED terms appended.
        """
        expansions = self.get_expansions(text)

        if expansions:
            # Append unique SNOMED terms to original query
            snomed_terms = sorted(set(e.snomed_term for e in expansions))
            expanded = text + ", " + ", ".join(snomed_terms)
            logger.debug("Expanded query: '%s' -> '%s'", text, expanded)
            return expanded

        return text

    @property
    def synonym_count(self) -> int:
        """Return the number of loaded synonyms."""
        return len(self._synonyms)

    @property
    def is_loaded(self) -> bool:
        """Return whether synonyms were successfully loaded."""
        return self._loaded

    def __len__(self) -> int:
        """Return the number of loaded synonyms."""
        return len(self._synonyms)
