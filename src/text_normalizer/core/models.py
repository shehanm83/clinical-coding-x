"""Data models for text normalization using dataclasses."""

from dataclasses import dataclass, field
from enum import Enum


# =============================================================================
# Enums
# =============================================================================


class ModifierType(str, Enum):
    """Types of clinical modifiers."""

    SEVERITY = "severity"
    ONSET = "onset"
    COURSE = "course"
    LATERALITY = "laterality"
    EPISODICITY = "episodicity"
    TEMPORALITY = "temporality"
    CHARACTER = "character"
    LOCATION = "location"


class RelationshipType(str, Enum):
    """Types of clinical relationships between phrases."""

    RADIATES_TO = "radiates_to"
    ASSOCIATED_WITH = "associated_with"
    ACCOMPANIED_BY = "accompanied_by"
    CAUSED_BY = "caused_by"
    AGGRAVATED_BY = "aggravated_by"
    RELIEVED_BY = "relieved_by"
    PRECEDED_BY = "preceded_by"
    FOLLOWED_BY = "followed_by"


class PhraseType(str, Enum):
    """Types of clinical phrases."""

    FINDING = "finding"
    SYMPTOM = "symptom"
    CONDITION = "condition"
    PROCEDURE = "procedure"
    MEDICATION = "medication"
    BODY_SITE = "body_site"


# =============================================================================
# Abbreviation Models
# =============================================================================


@dataclass
class Abbreviation:
    """Medical abbreviation from CSV whitelist."""

    abbreviation: str
    full_name: str


@dataclass
class AbbreviationExpansion:
    """Record of an abbreviation that was expanded."""

    original: str
    expanded: str
    start: int
    end: int


# =============================================================================
# LLM Analysis Models
# =============================================================================


@dataclass
class SpellingCorrection:
    """A spelling correction made to the text."""

    original: str
    corrected: str
    start: int
    end: int


@dataclass
class NegationSpan:
    """A span of text that contains negation."""

    text: str
    start: int
    end: int
    negated: bool = True


@dataclass
class ClinicalPhrase:
    """An identified clinical phrase in the text."""

    text: str
    phrase_type: str
    start: int
    end: int


@dataclass
class Modifier:
    """A clinical modifier attached to a phrase."""

    modifier_type: str
    value: str
    target_phrase: str


@dataclass
class ClinicalRelationship:
    """A relationship between two clinical phrases."""

    relationship_type: str
    source_phrase: str
    target_phrase: str
    relationship_text: str = ""


# =============================================================================
# Main Output Model
# =============================================================================


@dataclass
class NormalizedText:
    """Result of text normalization.

    Contains the normalized text along with all extracted clinical information.
    """

    original_text: str
    normalized_text: str
    abbreviations_expanded: list[AbbreviationExpansion] = field(default_factory=list)
    spelling_corrections: list[SpellingCorrection] = field(default_factory=list)
    negations: list[NegationSpan] = field(default_factory=list)
    clinical_phrases: list[ClinicalPhrase] = field(default_factory=list)
    modifiers: list[Modifier] = field(default_factory=list)
    relationships: list[ClinicalRelationship] = field(default_factory=list)
    processing_time_ms: int = 0
    tokens_used: int = 0
