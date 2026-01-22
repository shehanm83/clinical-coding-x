"""Question Generator module for zero-hallucination clinical coding questions.

This module provides intelligent question generation where ALL answer options
come from SNOMED CT queries. The LLM is used ONLY for presentation - formatting
question text, not generating clinical content.

Golden Rule: Every answer option MUST have a SNOMED CT concept ID.

Dynamic Workflow:
- Questions are generated dynamically based on user answers
- When user selects a more specific concept (child), drill down to that concept
- Generate new questions for the new focus concept
- Continue until no more questions can be generated
"""

from question_generator.generator import QuestionGenerator
from question_generator.models import (
    AnsweredQuestion,
    ConceptWithGaps,
    Gap,
    GapType,
    Question,
    QuestionOption,
    QuestionType,
)
from question_generator.session import (
    CodingSession,
    FocusConcept,
    SessionManager,
    SessionStatus,
)

__all__ = [
    "QuestionGenerator",
    "Question",
    "QuestionOption",
    "Gap",
    "GapType",
    "QuestionType",
    "AnsweredQuestion",
    "ConceptWithGaps",
    "CodingSession",
    "FocusConcept",
    "SessionManager",
    "SessionStatus",
]
