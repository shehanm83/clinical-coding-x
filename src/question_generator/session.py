"""Session management for multi-turn coding interactions.

Maintains state across question-answer cycles with dynamic drilling support.
The session tracks the current focus concept which can change as users
drill down through the SNOMED hierarchy.
"""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any

from question_generator.models import AnsweredQuestion, ConceptWithGaps, Question, QuestionType

logger = logging.getLogger(__name__)


class SessionStatus(str, Enum):
    """Status of a coding session."""

    ACTIVE = "active"  # Initial processing
    PENDING_QUESTIONS = "pending_questions"  # Waiting for user answers
    COMPLETE = "complete"  # All questions answered / user finished
    EXPIRED = "expired"  # Session timed out
    CANCELLED = "cancelled"  # User cancelled


@dataclass
class FocusConcept:
    """Tracks the current focus concept that can change during drilling."""

    concept_id: str
    concept_term: str
    semantic_tag: str
    original_phrase: str  # The original clinical phrase this came from
    depth: int = 0  # How many times we've drilled down
    parent_concept_id: str | None = None  # The parent we drilled from

    def to_dict(self) -> dict[str, Any]:
        return {
            "concept_id": self.concept_id,
            "concept_term": self.concept_term,
            "semantic_tag": self.semantic_tag,
            "original_phrase": self.original_phrase,
            "depth": self.depth,
            "parent_concept_id": self.parent_concept_id,
        }


@dataclass
class CodingSession:
    """A multi-turn coding session with dynamic drilling support.

    Maintains state for the coding workflow including:
    - Original input text and normalization
    - Current focus concept (can change as user drills down)
    - Answered attributes (to avoid re-asking)
    - Pending and answered questions
    - Drilling history
    """

    session_id: str
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    status: SessionStatus = SessionStatus.ACTIVE

    # Input
    original_text: str = ""

    # Normalized output
    normalized_text: str = ""
    abbreviations_expanded: list[dict[str, Any]] = field(default_factory=list)
    clinical_phrases: list[dict[str, Any]] = field(default_factory=list)
    modifiers: list[dict[str, Any]] = field(default_factory=list)

    # Current focus - this changes as user drills down
    current_focus: FocusConcept | None = None

    # Drilling history - tracks all focus concepts we've been through
    focus_history: list[FocusConcept] = field(default_factory=list)

    # Answered attributes - attribute IDs that have been answered
    # These won't be asked again even if focus changes
    answered_attribute_ids: set[str] = field(default_factory=set)

    # Coding results (initial concepts before drilling)
    concepts: list[ConceptWithGaps] = field(default_factory=list)

    # Questions - dynamically generated and updated
    pending_questions: list[Question] = field(default_factory=list)
    answered_questions: list[AnsweredQuestion] = field(default_factory=list)
    current_question_index: int = 0

    # All questions ever asked in this session (for history)
    all_questions_asked: list[Question] = field(default_factory=list)

    # Final output
    final_expressions: list[str] = field(default_factory=list)

    # Metadata
    processing_times: dict[str, int] = field(default_factory=dict)
    max_depth: int = 10  # Maximum drilling depth to prevent infinite loops

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "session_id": self.session_id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "status": self.status.value,
            "original_text": self.original_text,
            "normalized_text": self.normalized_text,
            "current_focus": self.current_focus.to_dict() if self.current_focus else None,
            "focus_history": [f.to_dict() for f in self.focus_history],
            "answered_attribute_ids": list(self.answered_attribute_ids),
            "concepts": [c.to_dict() for c in self.concepts],
            "pending_questions": [q.to_dict() for q in self.pending_questions],
            "answered_questions": [a.to_dict() for a in self.answered_questions],
            "current_question_index": self.current_question_index,
            "final_expressions": self.final_expressions,
            "processing_times": self.processing_times,
        }

    def set_focus(
        self,
        concept_id: str,
        concept_term: str,
        semantic_tag: str,
        original_phrase: str,
    ) -> None:
        """Set the initial focus concept."""
        self.current_focus = FocusConcept(
            concept_id=concept_id,
            concept_term=concept_term,
            semantic_tag=semantic_tag,
            original_phrase=original_phrase,
            depth=0,
        )
        self.focus_history.append(self.current_focus)

    def drill_down(
        self,
        new_concept_id: str,
        new_concept_term: str,
        new_semantic_tag: str,
    ) -> bool:
        """Drill down to a more specific concept.

        Returns True if drill was successful, False if max depth reached.
        """
        if self.current_focus is None:
            return False

        if self.current_focus.depth >= self.max_depth:
            logger.warning("Max drilling depth reached for session %s", self.session_id)
            return False

        # Save current focus as parent
        old_focus = self.current_focus

        # Create new focus
        self.current_focus = FocusConcept(
            concept_id=new_concept_id,
            concept_term=new_concept_term,
            semantic_tag=new_semantic_tag,
            original_phrase=old_focus.original_phrase,
            depth=old_focus.depth + 1,
            parent_concept_id=old_focus.concept_id,
        )

        self.focus_history.append(self.current_focus)
        self.updated_at = datetime.now()

        logger.info(
            "Session %s drilled from %s to %s (depth %d)",
            self.session_id,
            old_focus.concept_id,
            new_concept_id,
            self.current_focus.depth,
        )

        return True

    def add_answered_attribute(self, attribute_id: str) -> None:
        """Record that an attribute has been answered."""
        self.answered_attribute_ids.add(attribute_id)

    def get_next_question(self) -> Question | None:
        """Get the next unanswered question."""
        if self.current_question_index < len(self.pending_questions):
            return self.pending_questions[self.current_question_index]
        return None

    def answer_current_question(self, answered: AnsweredQuestion) -> None:
        """Record answer and advance to next question.

        Note: Does NOT set status to COMPLETE - that's done by the generator
        after checking if more questions need to be generated.
        """
        self.answered_questions.append(answered)
        self.current_question_index += 1
        self.updated_at = datetime.now()

        # Track answered attribute
        if answered.resulting_attribute:
            self.add_answered_attribute(answered.resulting_attribute[0])

    def replace_pending_questions(self, new_questions: list[Question]) -> None:
        """Replace remaining pending questions with new ones.

        Used when drilling down to a new concept - old questions are replaced
        with questions for the new focus concept.
        """
        # Keep already answered questions in pending (for history)
        answered_portion = self.pending_questions[:self.current_question_index]

        # Add new questions
        self.pending_questions = answered_portion + new_questions

        # Track all questions for history
        self.all_questions_asked.extend(new_questions)

        self.updated_at = datetime.now()

    def has_pending_questions(self) -> bool:
        """Check if there are unanswered questions."""
        return self.current_question_index < len(self.pending_questions)

    def get_question_by_id(self, question_id: str) -> Question | None:
        """Find a question by ID."""
        for q in self.pending_questions:
            if q.id == question_id:
                return q
        return None

    def mark_complete(self) -> None:
        """Mark session as complete."""
        self.status = SessionStatus.COMPLETE
        self.updated_at = datetime.now()

    def get_drilling_summary(self) -> dict[str, Any]:
        """Get a summary of the drilling path."""
        return {
            "current_depth": self.current_focus.depth if self.current_focus else 0,
            "max_depth": self.max_depth,
            "path": [
                {"concept_id": f.concept_id, "term": f.concept_term, "depth": f.depth}
                for f in self.focus_history
            ],
            "answered_attributes": list(self.answered_attribute_ids),
            "total_questions_asked": len(self.all_questions_asked),
            "total_questions_answered": len(self.answered_questions),
        }


class SessionManager:
    """Manages coding sessions.

    For now uses in-memory storage. Can be extended to use Redis
    or other persistent storage for production.
    """

    def __init__(self, session_timeout_minutes: int = 30) -> None:
        """Initialize the session manager.

        Args:
            session_timeout_minutes: Session expiry timeout.
        """
        self._sessions: dict[str, CodingSession] = {}
        self._timeout_minutes = session_timeout_minutes

    def create_session(self, original_text: str = "") -> CodingSession:
        """Create a new coding session.

        Args:
            original_text: The original clinical text.

        Returns:
            New CodingSession object.
        """
        session_id = str(uuid.uuid4())
        session = CodingSession(
            session_id=session_id,
            original_text=original_text,
        )
        self._sessions[session_id] = session
        logger.info("Created session %s", session_id)
        return session

    def get_session(self, session_id: str) -> CodingSession | None:
        """Get a session by ID.

        Args:
            session_id: The session ID.

        Returns:
            CodingSession or None if not found/expired.
        """
        session = self._sessions.get(session_id)
        if session is None:
            return None

        # Check for expiry
        if self._is_expired(session):
            session.status = SessionStatus.EXPIRED
            return session

        return session

    def update_session(self, session: CodingSession) -> None:
        """Update a session in storage.

        Args:
            session: The session to update.
        """
        session.updated_at = datetime.now()
        self._sessions[session.session_id] = session

    def delete_session(self, session_id: str) -> bool:
        """Delete a session.

        Args:
            session_id: The session ID.

        Returns:
            True if deleted, False if not found.
        """
        if session_id in self._sessions:
            del self._sessions[session_id]
            logger.info("Deleted session %s", session_id)
            return True
        return False

    def get_active_sessions(self) -> list[CodingSession]:
        """Get all active (non-expired) sessions.

        Returns:
            List of active sessions.
        """
        active = []
        for session in self._sessions.values():
            if not self._is_expired(session) and session.status not in (
                SessionStatus.EXPIRED,
                SessionStatus.CANCELLED,
            ):
                active.append(session)
        return active

    def cleanup_expired(self) -> int:
        """Remove expired sessions.

        Returns:
            Number of sessions removed.
        """
        expired_ids = [
            sid
            for sid, session in self._sessions.items()
            if self._is_expired(session)
        ]
        for sid in expired_ids:
            del self._sessions[sid]

        if expired_ids:
            logger.info("Cleaned up %d expired sessions", len(expired_ids))

        return len(expired_ids)

    def _is_expired(self, session: CodingSession) -> bool:
        """Check if a session has expired."""
        from datetime import timedelta

        expiry_time = session.updated_at + timedelta(minutes=self._timeout_minutes)
        return datetime.now() > expiry_time

    def get_session_count(self) -> int:
        """Get total number of sessions."""
        return len(self._sessions)

    def get_session_summary(self, session_id: str) -> dict[str, Any] | None:
        """Get a summary of a session.

        Args:
            session_id: The session ID.

        Returns:
            Summary dict or None if not found.
        """
        session = self.get_session(session_id)
        if session is None:
            return None

        return {
            "session_id": session.session_id,
            "status": session.status.value,
            "created_at": session.created_at.isoformat(),
            "original_text": session.original_text[:100] + "..."
            if len(session.original_text) > 100
            else session.original_text,
            "current_focus": session.current_focus.to_dict() if session.current_focus else None,
            "drilling_depth": session.current_focus.depth if session.current_focus else 0,
            "concept_count": len(session.concepts),
            "pending_question_count": len(session.pending_questions)
            - session.current_question_index,
            "answered_question_count": len(session.answered_questions),
            "has_final_expressions": len(session.final_expressions) > 0,
        }
