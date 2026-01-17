"""Dataclass models for concept extraction."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class SnomedConcept:
    """A SNOMED CT concept."""

    concept_id: str
    term: str
    fsn: str = ""
    semantic_tag: str = ""
    active: bool = True


@dataclass
class ConceptMatch:
    """A matched SNOMED CT concept with similarity score."""

    concept_id: str
    term: str
    similarity: float
    fsn: str = ""
    semantic_tag: str = ""
    semantic_score: float = 0.0
    lexical_score: float = 0.0
    lexical_match: str = "none"  # 'exact', 'partial', 'none'
    match_type: str = "vector"  # 'vector', 'exact', 'fuzzy'
    state: str = "primary"  # 'primary' or 'secondary' from synonym expansion


@dataclass
class Relationship:
    """A SNOMED CT relationship."""

    source_id: str
    type_id: str
    destination_id: str
    type_name: str = ""
    destination_term: str = ""
    group: int = 0


@dataclass
class HierarchyResult:
    """Result of hierarchy traversal."""

    concept_id: str
    concepts: list[SnomedConcept] = field(default_factory=list)
    total_count: int = 0
    processing_time_ms: int = 0


@dataclass
class MatchResult:
    """Result of concept matching."""

    query: str
    matches: list[ConceptMatch] = field(default_factory=list)
    processing_time_ms: int = 0


@dataclass
class RelationshipResult:
    """Result of relationship query."""

    concept_id: str
    relationships: list[Relationship] = field(default_factory=list)
    processing_time_ms: int = 0


@dataclass
class SynonymExpansion:
    """Result of synonym expansion."""

    lay_term: str  # Original lay term that matched
    snomed_term: str  # SNOMED preferred term to search for


@dataclass
class AttributeDefinition:
    """An MRCM attribute definition."""

    id: str
    name: str
    is_qualifier: bool = False
    value_count: int = 0


@dataclass
class AttributeValue:
    """A valid value for an MRCM attribute."""

    id: str
    term: str
    fsn: str = ""
    semantic_tag: str = ""
