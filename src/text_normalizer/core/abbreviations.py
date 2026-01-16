"""CSV abbreviation whitelist loader and manager."""

from __future__ import annotations

import csv
import io
import logging
from pathlib import Path

from mcp_text_normalizer.types.models import Abbreviation

logger = logging.getLogger(__name__)


class AbbreviationWhitelist:
    """Manages the medical abbreviation whitelist from CSV.

    This class loads abbreviations from a CSV file and provides lookup
    functionality for expanding medical abbreviations in clinical text.

    The CSV file must have headers: Abbreviation,Full_Name

    Attributes:
        csv_path: Path to the CSV file containing abbreviations.
        case_sensitive: Whether matching should be case-sensitive.
    """

    def __init__(
        self,
        csv_path: str | Path,
        *,
        case_sensitive: bool = False,
    ) -> None:
        """Initialize the abbreviation whitelist.

        Args:
            csv_path: Path to the CSV file.
            case_sensitive: Whether abbreviation lookup is case-sensitive.

        Raises:
            FileNotFoundError: If the CSV file doesn't exist.
        """
        self.csv_path = Path(csv_path)
        self.case_sensitive = case_sensitive
        self._abbreviations: dict[str, Abbreviation] = {}
        self._load_abbreviations()

    def _load_abbreviations(self) -> None:
        """Load abbreviations from CSV file."""
        if not self.csv_path.exists():
            raise FileNotFoundError(f"Abbreviations CSV not found: {self.csv_path}")

        with self.csv_path.open("r", encoding="utf-8") as f:
            # Filter out comment lines (starting with #) before parsing
            lines = [line for line in f if not line.strip().startswith("#")]

        # Parse filtered lines as CSV
        reader = csv.DictReader(io.StringIO("".join(lines)))
        for row in reader:
            abbrev = row.get("Abbreviation", "").strip()
            full_name = row.get("Full_Name", "").strip()

            if not abbrev or not full_name:
                continue

            # Skip placeholder entries like "Finding_1"
            if abbrev.startswith("Finding_"):
                continue

            # Store with consistent key format
            key = abbrev if self.case_sensitive else abbrev.lower()
            self._abbreviations[key] = Abbreviation(
                abbreviation=abbrev,
                full_name=full_name,
            )

        logger.info(
            "Loaded %d medical abbreviations from %s",
            len(self._abbreviations),
            self.csv_path,
        )

    def lookup(self, abbrev: str) -> Abbreviation | None:
        """Look up an abbreviation.

        Args:
            abbrev: The abbreviation to look up.

        Returns:
            Abbreviation object if found, None otherwise.
        """
        key = abbrev if self.case_sensitive else abbrev.lower()
        return self._abbreviations.get(key)

    def expand(self, abbrev: str) -> str | None:
        """Get the expansion for an abbreviation.

        Args:
            abbrev: The abbreviation to expand.

        Returns:
            The full name if found, None otherwise.
        """
        result = self.lookup(abbrev)
        return result.full_name if result else None

    def get_all(self) -> list[Abbreviation]:
        """Get all abbreviations in the whitelist.

        Returns:
            List of all Abbreviation objects.
        """
        return list(self._abbreviations.values())

    def contains(self, abbrev: str) -> bool:
        """Check if an abbreviation is in the whitelist.

        Args:
            abbrev: The abbreviation to check.

        Returns:
            True if the abbreviation is in the whitelist.
        """
        return self.lookup(abbrev) is not None

    def __len__(self) -> int:
        """Return the number of abbreviations."""
        return len(self._abbreviations)

    def __contains__(self, abbrev: str) -> bool:
        """Support 'in' operator."""
        return self.contains(abbrev)
