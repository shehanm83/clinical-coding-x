"""Data models for Question Generator.

All models ensure that answer options have SNOMED CT concept IDs.
This is the core of the zero-hallucination approach.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any


class GapType(str, Enum):
    """Types of gaps that can be detected in coding data."""

    SPECIFICITY = "specificity"  # Concept has children - can be more specific
    ATTRIBUTE = "attribute"  # MRCM attribute is valid but not defined
    LATERALITY = "laterality"  # Finding site is lateralizable but no laterality
    DISAMBIGUATION = "disambiguation"  # Multiple semantic tags in search results
    TEMPORAL = "temporal"  # Non-chronic finding without course defined
    LOCATION = "location"  # Finding without finding site
    SEVERITY = "severity"  # Finding that can have severity but not defined


class QuestionType(str, Enum):
    """Types of questions that can be generated."""

    SPECIFICITY = "specificity"  # "Can you specify the type of X?"
    ATTRIBUTE = "attribute"  # "What is the Y of X?"
    LATERALITY = "laterality"  # "Which side is affected?"
    DISAMBIGUATION = "disambiguation"  # "What do you mean by X?"
    TEMPORAL = "temporal"  # "What is the clinical course?"
    LOCATION = "location"  # "Where is the X located?"
    SEVERITY = "severity"  # "How severe is the X?"
    CONFIRMATION = "confirmation"  # "Is this correct: X?"


@dataclass
class QuestionOption:
    """A single answer option - ALWAYS backed by SNOMED CT.

    This is the core of zero-hallucination: every option has a SNOMED concept ID.
    """

    concept_id: str  # REQUIRED - SNOMED CT concept ID
    display_text: str  # Human-readable term
    fsn: str = ""  # Fully Specified Name
    semantic_tag: str = ""  # e.g., "finding", "qualifier value"
    pre_selected: bool = False  # Pre-selected from text extraction
    pre_selection_source: str = ""  # How it was determined (e.g., "text_modifier")

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "concept_id": self.concept_id,
            "display_text": self.display_text,
            "fsn": self.fsn,
            "semantic_tag": self.semantic_tag,
            "pre_selected": self.pre_selected,
            "pre_selection_source": self.pre_selection_source,
        }


@dataclass
class Gap:
    """A detected gap in the coding data that needs clarification."""

    gap_type: GapType
    source_concept_id: str  # The concept this gap relates to
    source_concept_term: str
    priority: int = 3  # 1=critical, 5=optional
    attribute_id: str | None = None  # For attribute gaps
    attribute_name: str | None = None
    context: dict[str, Any] = field(default_factory=dict)  # Additional context

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "gap_type": self.gap_type.value,
            "source_concept_id": self.source_concept_id,
            "source_concept_term": self.source_concept_term,
            "priority": self.priority,
            "attribute_id": self.attribute_id,
            "attribute_name": self.attribute_name,
            "context": self.context,
        }


@dataclass
class Question:
    """A clarifying question with SNOMED-backed options.

    Every option in this question has a SNOMED CT concept ID.
    The question text can be formatted by LLM, but options are from SNOMED only.
    """

    id: str
    question_type: QuestionType
    priority: int  # 1=critical, 5=optional

    # Source
    source_concept_id: str
    source_concept_term: str
    attribute_id: str | None = None
    attribute_name: str | None = None

    # Content
    text: str = ""  # LLM-formatted question text
    options: list[QuestionOption] = field(default_factory=list)  # ALL have SNOMED IDs

    # Metadata
    ecl_source: str | None = None  # ECL used to generate options
    skip_option: bool = True  # Whether "Skip/Not specified" is available
    multi_select: bool = False  # Can select multiple options
    created_at: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "question_type": self.question_type.value,
            "priority": self.priority,
            "source_concept_id": self.source_concept_id,
            "source_concept_term": self.source_concept_term,
            "attribute_id": self.attribute_id,
            "attribute_name": self.attribute_name,
            "text": self.text,
            "options": [opt.to_dict() for opt in self.options],
            "ecl_source": self.ecl_source,
            "skip_option": self.skip_option,
            "multi_select": self.multi_select,
        }


@dataclass
class AnsweredQuestion:
    """Record of an answered question."""

    question_id: str
    question_type: QuestionType
    selected_options: list[QuestionOption]  # ALL have SNOMED IDs
    skipped: bool = False
    answered_at: datetime = field(default_factory=datetime.now)

    # The resulting attribute if applicable (attr_id, value_id)
    resulting_attribute: tuple[str, str] | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "question_id": self.question_id,
            "question_type": self.question_type.value,
            "selected_options": [opt.to_dict() for opt in self.selected_options],
            "skipped": self.skipped,
            "answered_at": self.answered_at.isoformat(),
            "resulting_attribute": self.resulting_attribute,
        }


@dataclass
class ConceptWithGaps:
    """A concept along with its detected gaps."""

    concept_id: str
    concept_term: str
    semantic_tag: str
    phrase: str  # Original clinical phrase
    negated: bool = False
    gaps: list[Gap] = field(default_factory=list)
    questions: list[Question] = field(default_factory=list)
    answered: list[AnsweredQuestion] = field(default_factory=list)

    # Final expression after all questions answered
    final_expression: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "concept_id": self.concept_id,
            "concept_term": self.concept_term,
            "semantic_tag": self.semantic_tag,
            "phrase": self.phrase,
            "negated": self.negated,
            "gaps": [g.to_dict() for g in self.gaps],
            "questions": [q.to_dict() for q in self.questions],
            "answered": [a.to_dict() for a in self.answered],
            "final_expression": self.final_expression,
        }
