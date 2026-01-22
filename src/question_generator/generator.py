"""Main Question Generator - Orchestrates zero-hallucination question generation.

This is the main entry point for the question generator. It coordinates:
1. Gap Detection - Identifying what questions to ask
2. Option Generation - Fetching SNOMED-only options
3. Question Presentation - LLM formatting of question text
4. Answer Processing - Validating user answers
5. Dynamic Drilling - Re-generating questions as user drills down

GOLDEN RULE: Every answer option has a SNOMED CT concept ID.

DYNAMIC WORKFLOW:
- After each answer, check if it was a specificity answer (user chose child concept)
- If so, update focus concept and generate new questions for the new concept
- Continue until no more questions can be generated or user is satisfied
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from question_generator.answer_processor import AnswerProcessor, ProcessedAnswer
from question_generator.gap_detector import GapDetector
from question_generator.models import (
    AnsweredQuestion,
    ConceptWithGaps,
    Gap,
    GapType,
    Question,
    QuestionOption,
    QuestionType,
)
from question_generator.option_generator import OptionGenerator
from question_generator.presenter import QuestionPresenter
from question_generator.session import CodingSession, SessionManager, SessionStatus

if TYPE_CHECKING:
    from concept_extractor import ConceptExtractor
    from coding_orchestrator.services.modifier_mapper import ModifierMapper
    from shared.llm_client import LLMClient

logger = logging.getLogger(__name__)


class QuestionGenerator:
    """Zero-hallucination question generator for clinical coding.

    Generates clarifying questions where ALL answer options come from
    SNOMED CT queries. The LLM is used ONLY for formatting question text.

    Supports dynamic drilling: after each answer, re-evaluates and generates
    new questions based on the updated focus concept.
    """

    def __init__(
        self,
        extractor: ConceptExtractor,
        modifier_mapper: ModifierMapper | None = None,
        llm_client: LLMClient | None = None,
        use_llm_formatting: bool = True,
        max_options_per_question: int = 20,
    ) -> None:
        """Initialize the question generator.

        Args:
            extractor: ConceptExtractor for SNOMED queries.
            modifier_mapper: Optional modifier mapper for attribute mapping.
            llm_client: Optional LLM client for question formatting.
            use_llm_formatting: Whether to use LLM for question text.
            max_options_per_question: Max options per question (for UI).
        """
        self._extractor = extractor
        self._modifier_mapper = modifier_mapper

        # Initialize components
        self._gap_detector = GapDetector(
            extractor,
            max_children_for_specificity=50,  # Increased from 15
            min_children_for_specificity=2,
        )
        self._option_generator = OptionGenerator(extractor, modifier_mapper)
        self._presenter = QuestionPresenter(llm_client, use_llm_formatting)
        self._answer_processor = AnswerProcessor(extractor, modifier_mapper)
        self._session_manager = SessionManager()

        # Configuration - NO LIMIT on number of questions
        self._max_options = max_options_per_question

    async def generate_questions(
        self,
        concept_id: str,
        concept_term: str,
        semantic_tag: str,
        extracted_modifiers: list[dict[str, Any]] | None = None,
        existing_attributes: list[str] | None = None,
        context: dict[str, Any] | None = None,
    ) -> list[Question]:
        """Generate ALL relevant questions for a single concept.

        No artificial limits - generates all questions that can be answered
        with SNOMED-backed options.

        Args:
            concept_id: SNOMED concept ID.
            concept_term: Concept term/name.
            semantic_tag: Semantic tag (finding, disorder, etc.).
            extracted_modifiers: Modifiers already extracted from text.
            existing_attributes: Attribute IDs already answered.
            context: Additional context for formatting.

        Returns:
            List of Question objects with SNOMED-backed options.
        """
        extracted_modifiers = extracted_modifiers or []
        existing_attributes = existing_attributes or []
        context = context or {}

        # Step 1: Detect ALL gaps (no limit)
        gaps = await self._gap_detector.detect_gaps(
            concept_id=concept_id,
            concept_term=concept_term,
            semantic_tag=semantic_tag,
            extracted_modifiers=extracted_modifiers,
            existing_attributes=existing_attributes,
        )

        # Check for severity gap separately (common for findings)
        if semantic_tag in ("finding", "disorder"):
            severity_gap = await self._gap_detector.detect_severity_gap(
                concept_id, concept_term, extracted_modifiers, existing_attributes
            )
            if severity_gap:
                gaps.append(severity_gap)

        # NO LIMIT - generate questions for ALL gaps
        questions = []
        for gap in gaps:
            options = await self._option_generator.generate_options(
                gap=gap,
                max_options=self._max_options,
                extracted_modifiers=extracted_modifiers,
            )

            # Skip if no options available
            if not options:
                logger.debug("No options for gap %s on concept %s", gap.gap_type, concept_id)
                continue

            # Format question with presenter
            question = await self._presenter.format_question(
                gap=gap,
                options=options,
                context=context,
            )

            questions.append(question)

        # Sort by priority (specificity first, then others)
        questions.sort(key=lambda q: (
            0 if q.question_type == QuestionType.SPECIFICITY else 1,
            q.priority
        ))

        return questions

    async def generate_questions_for_concepts(
        self,
        concepts: list[dict[str, Any]],
        extracted_modifiers: list[dict[str, Any]] | None = None,
    ) -> list[ConceptWithGaps]:
        """Generate questions for multiple concepts.

        Args:
            concepts: List of concept dicts with 'concept_id', 'term', etc.
            extracted_modifiers: Modifiers extracted from text.

        Returns:
            List of ConceptWithGaps objects.
        """
        extracted_modifiers = extracted_modifiers or []
        results = []

        for concept in concepts:
            concept_id = concept.get("concept_id", "")
            concept_term = concept.get("term", "")
            semantic_tag = concept.get("semantic_tag", "finding")
            phrase = concept.get("phrase", concept_term)
            negated = concept.get("negated", False)

            # Get modifiers for this concept
            concept_modifiers = [
                m for m in extracted_modifiers
                if m.get("target_phrase", "").lower() == phrase.lower()
                or m.get("target_phrase", "").lower() == concept_term.lower()
            ]

            # Generate questions
            questions = await self.generate_questions(
                concept_id=concept_id,
                concept_term=concept_term,
                semantic_tag=semantic_tag,
                extracted_modifiers=concept_modifiers,
            )

            # Build gaps from questions
            gaps = []
            for q in questions:
                gap_type_value = q.question_type.value
                gap_type = GapType(gap_type_value) if gap_type_value in [gt.value for gt in GapType] else GapType.ATTRIBUTE
                gap = Gap(
                    gap_type=gap_type,
                    source_concept_id=q.source_concept_id,
                    source_concept_term=q.source_concept_term,
                    priority=q.priority,
                    attribute_id=q.attribute_id,
                    attribute_name=q.attribute_name,
                )
                gaps.append(gap)

            results.append(
                ConceptWithGaps(
                    concept_id=concept_id,
                    concept_term=concept_term,
                    semantic_tag=semantic_tag,
                    phrase=phrase,
                    negated=negated,
                    gaps=gaps,
                    questions=questions,
                )
            )

        return results

    async def process_answer(
        self,
        question: Question,
        selected_option_ids: list[str],
        skipped: bool = False,
    ) -> ProcessedAnswer:
        """Process a user's answer to a question.

        Args:
            question: The question being answered.
            selected_option_ids: List of selected concept IDs.
            skipped: Whether the question was skipped.

        Returns:
            ProcessedAnswer with validation results.
        """
        return await self._answer_processor.process_answer(
            question=question,
            selected_option_ids=selected_option_ids,
            skipped=skipped,
        )

    def create_answered_question(
        self,
        question: Question,
        processed: ProcessedAnswer,
    ) -> AnsweredQuestion:
        """Create an AnsweredQuestion record.

        Args:
            question: The original question.
            processed: The processed answer.

        Returns:
            AnsweredQuestion record.
        """
        return self._answer_processor.create_answered_question(question, processed)

    # =========================================================================
    # Session Management
    # =========================================================================

    def create_session(self, original_text: str = "") -> CodingSession:
        """Create a new coding session."""
        return self._session_manager.create_session(original_text)

    def get_session(self, session_id: str) -> CodingSession | None:
        """Get a session by ID."""
        return self._session_manager.get_session(session_id)

    def update_session(self, session: CodingSession) -> None:
        """Update a session."""
        self._session_manager.update_session(session)

    def delete_session(self, session_id: str) -> bool:
        """Delete a session."""
        return self._session_manager.delete_session(session_id)

    # =========================================================================
    # Expression Building
    # =========================================================================

    def build_expression_attributes(
        self,
        answered_questions: list[AnsweredQuestion],
    ) -> list[tuple[str, str, int]]:
        """Build expression attributes from answered questions."""
        return self._answer_processor.build_expression_attributes(answered_questions)

    async def build_final_expression(
        self,
        focus_concept_id: str,
        answered_questions: list[AnsweredQuestion],
    ) -> str | None:
        """Build a final SNOMED expression from answered questions.

        Args:
            focus_concept_id: The FINAL focus concept ID (after all drilling).
            answered_questions: List of answered questions.

        Returns:
            SNOMED CT expression string or None.
        """
        # Get focus concept term
        focus_concept = await self._extractor.get_concept(focus_concept_id)
        if not focus_concept:
            return f"{focus_concept_id}"

        # Build expression parts
        parts = [f"{focus_concept_id} | {focus_concept.term} |"]

        # Get attribute mappings from answered questions
        attributes = self.build_expression_attributes(answered_questions)

        attr_parts = []
        for attr_id, value_id, group in attributes:
            attr_concept = await self._extractor.get_concept(attr_id)
            value_concept = await self._extractor.get_concept(value_id)

            attr_name = attr_concept.term if attr_concept else attr_id
            value_term = value_concept.term if value_concept else value_id

            attr_parts.append(f"{attr_id} | {attr_name} | = {value_id} | {value_term} |")

        if attr_parts:
            parts.append(" : ")
            parts.append(", ".join(attr_parts))

        return "".join(parts)

    # =========================================================================
    # Dynamic Drilling Workflow
    # =========================================================================

    async def answer_session_question(
        self,
        session_id: str,
        question_id: str,
        selected_option_ids: list[str],
        skipped: bool = False,
    ) -> tuple[CodingSession | None, ProcessedAnswer | None]:
        """Answer a question in a session with DYNAMIC drilling support.

        After processing the answer:
        1. If it was a SPECIFICITY answer, drill down to the selected concept
        2. Generate NEW questions for the new focus concept
        3. Replace remaining pending questions with new ones
        4. Continue until no more questions can be generated

        Args:
            session_id: The session ID.
            question_id: The question ID.
            selected_option_ids: Selected option concept IDs.
            skipped: Whether the question was skipped.

        Returns:
            Tuple of (updated session, processed answer) or (None, None) if not found.
        """
        session = self.get_session(session_id)
        if session is None:
            return None, None

        question = session.get_question_by_id(question_id)
        if question is None:
            return None, None

        # Process the answer
        processed = await self.process_answer(question, selected_option_ids, skipped)

        if not processed.valid:
            return session, processed

        # Record the answer
        answered = self.create_answered_question(question, processed)
        session.answer_current_question(answered)

        # DYNAMIC DRILLING: Check if this was a specificity question
        if not skipped and question.question_type == QuestionType.SPECIFICITY:
            # User selected a more specific concept - drill down!
            if len(selected_option_ids) == 1:
                selected_concept_id = selected_option_ids[0]

                # Get the selected concept details
                selected_concept = await self._extractor.get_concept(selected_concept_id)
                if selected_concept:
                    # Drill down to the new concept
                    drilled = session.drill_down(
                        new_concept_id=selected_concept.concept_id,
                        new_concept_term=selected_concept.term,
                        new_semantic_tag=selected_concept.semantic_tag,
                    )

                    if drilled:
                        # Generate NEW questions for the new focus concept
                        new_questions = await self.generate_questions(
                            concept_id=selected_concept.concept_id,
                            concept_term=selected_concept.term,
                            semantic_tag=selected_concept.semantic_tag,
                            extracted_modifiers=session.modifiers,
                            existing_attributes=list(session.answered_attribute_ids),
                        )

                        if new_questions:
                            # Replace remaining questions with new ones
                            session.replace_pending_questions(new_questions)
                            session.status = SessionStatus.PENDING_QUESTIONS

                            logger.info(
                                "Session %s drilled to %s, generated %d new questions",
                                session_id,
                                selected_concept_id,
                                len(new_questions),
                            )

        # Check if we have more questions
        if not session.has_pending_questions():
            # No more questions - check if we should generate more
            # based on the current focus concept
            if session.current_focus:
                new_questions = await self.generate_questions(
                    concept_id=session.current_focus.concept_id,
                    concept_term=session.current_focus.concept_term,
                    semantic_tag=session.current_focus.semantic_tag,
                    extracted_modifiers=session.modifiers,
                    existing_attributes=list(session.answered_attribute_ids),
                )

                if new_questions:
                    session.replace_pending_questions(new_questions)
                    session.status = SessionStatus.PENDING_QUESTIONS
                else:
                    # No more questions - session is complete
                    await self._finalize_session(session)
            else:
                await self._finalize_session(session)

        self.update_session(session)
        return session, processed

    async def _finalize_session(self, session: CodingSession) -> None:
        """Finalize a session - build final expressions."""
        session.mark_complete()

        # Build final expression using the FINAL focus concept
        if session.current_focus:
            expression = await self.build_final_expression(
                focus_concept_id=session.current_focus.concept_id,
                answered_questions=session.answered_questions,
            )
            if expression:
                session.final_expressions = [expression]

    # =========================================================================
    # Full Workflow
    # =========================================================================

    async def start_coding_workflow(
        self,
        text: str,
        normalized_result: dict[str, Any],
        concept_results: list[dict[str, Any]],
    ) -> CodingSession:
        """Start a full coding workflow with question generation.

        Args:
            text: Original clinical text.
            normalized_result: Result from text normalization.
            concept_results: Result from concept extraction.

        Returns:
            CodingSession with questions populated.
        """
        # Create session
        session = self.create_session(text)
        session.normalized_text = normalized_result.get("normalized_text", text)
        session.abbreviations_expanded = normalized_result.get("abbreviations_expanded", [])
        session.clinical_phrases = normalized_result.get("clinical_phrases", [])
        session.modifiers = normalized_result.get("modifiers", [])

        # Generate questions for each concept
        concepts_with_gaps = await self.generate_questions_for_concepts(
            concepts=concept_results,
            extracted_modifiers=session.modifiers,
        )

        session.concepts = concepts_with_gaps

        # Set initial focus to first concept
        if concept_results:
            first_concept = concept_results[0]
            session.set_focus(
                concept_id=first_concept.get("concept_id", ""),
                concept_term=first_concept.get("term", ""),
                semantic_tag=first_concept.get("semantic_tag", "finding"),
                original_phrase=first_concept.get("phrase", first_concept.get("term", "")),
            )

        # Collect all questions
        all_questions = []
        for concept in concepts_with_gaps:
            all_questions.extend(concept.questions)

        # Sort by priority (specificity first)
        all_questions.sort(key=lambda q: (
            0 if q.question_type == QuestionType.SPECIFICITY else 1,
            q.priority
        ))

        session.pending_questions = all_questions
        session.all_questions_asked = list(all_questions)

        # Set status
        if all_questions:
            session.status = SessionStatus.PENDING_QUESTIONS
        else:
            session.status = SessionStatus.COMPLETE

        self.update_session(session)
        return session
