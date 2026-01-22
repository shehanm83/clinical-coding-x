"""Answer Processor - Validates and processes user answers.

Ensures that all answers correspond to valid SNOMED concept IDs.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

from question_generator.models import AnsweredQuestion, Question, QuestionOption, QuestionType

if TYPE_CHECKING:
    from concept_extractor import ConceptExtractor
    from coding_orchestrator.services.modifier_mapper import ModifierMapper

logger = logging.getLogger(__name__)

# Attribute IDs
SEVERITY_ATTRIBUTE = "246112005"
LATERALITY_ATTRIBUTE = "272741003"
CLINICAL_COURSE_ATTRIBUTE = "263502005"


@dataclass
class ProcessedAnswer:
    """Result of processing an answer."""

    question_id: str
    valid: bool
    selected_concept_ids: list[str]
    selected_concept_terms: list[str]
    attribute_mapping: tuple[str, str] | None  # (attribute_id, value_id)
    error_message: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "question_id": self.question_id,
            "valid": self.valid,
            "selected_concept_ids": self.selected_concept_ids,
            "selected_concept_terms": self.selected_concept_terms,
            "attribute_mapping": self.attribute_mapping,
            "error_message": self.error_message,
        }


class AnswerProcessor:
    """Processes and validates user answers to questions.

    Ensures all answers correspond to valid SNOMED concepts.
    """

    def __init__(
        self,
        extractor: ConceptExtractor,
        modifier_mapper: ModifierMapper | None = None,
    ) -> None:
        """Initialize the answer processor.

        Args:
            extractor: ConceptExtractor for SNOMED validation.
            modifier_mapper: Optional modifier mapper.
        """
        self._extractor = extractor
        self._modifier_mapper = modifier_mapper

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
            ProcessedAnswer with validation and attribute mapping.
        """
        if skipped:
            return ProcessedAnswer(
                question_id=question.id,
                valid=True,
                selected_concept_ids=[],
                selected_concept_terms=[],
                attribute_mapping=None,
            )

        # Validate that selected IDs are in the question's options
        valid_option_ids = {opt.concept_id for opt in question.options}
        invalid_ids = [sid for sid in selected_option_ids if sid not in valid_option_ids]

        if invalid_ids:
            return ProcessedAnswer(
                question_id=question.id,
                valid=False,
                selected_concept_ids=[],
                selected_concept_terms=[],
                attribute_mapping=None,
                error_message=f"Invalid option IDs: {invalid_ids}. Must be one of the provided options.",
            )

        # Get selected options
        selected_options = [
            opt for opt in question.options if opt.concept_id in selected_option_ids
        ]

        selected_terms = [opt.display_text for opt in selected_options]

        # Determine attribute mapping if applicable
        attribute_mapping = None
        if question.attribute_id and len(selected_options) == 1:
            attribute_mapping = (question.attribute_id, selected_options[0].concept_id)

        return ProcessedAnswer(
            question_id=question.id,
            valid=True,
            selected_concept_ids=selected_option_ids,
            selected_concept_terms=selected_terms,
            attribute_mapping=attribute_mapping,
        )

    def create_answered_question(
        self,
        question: Question,
        processed: ProcessedAnswer,
    ) -> AnsweredQuestion:
        """Create an AnsweredQuestion record from processed answer.

        Args:
            question: The original question.
            processed: The processed answer.

        Returns:
            AnsweredQuestion record.
        """
        selected_options = [
            opt for opt in question.options if opt.concept_id in processed.selected_concept_ids
        ]

        return AnsweredQuestion(
            question_id=question.id,
            question_type=question.question_type,
            selected_options=selected_options,
            skipped=len(processed.selected_concept_ids) == 0,
            resulting_attribute=processed.attribute_mapping,
        )

    async def validate_concept_id(self, concept_id: str) -> bool:
        """Validate that a concept ID exists in SNOMED.

        Args:
            concept_id: The concept ID to validate.

        Returns:
            True if concept exists, False otherwise.
        """
        try:
            concept = await self._extractor.get_concept(concept_id)
            return concept is not None
        except Exception as e:
            logger.warning("Failed to validate concept %s: %s", concept_id, e)
            return False

    def get_attribute_for_question_type(
        self,
        question_type: QuestionType,
    ) -> str | None:
        """Get the SNOMED attribute ID for a question type.

        Args:
            question_type: The type of question.

        Returns:
            Attribute ID or None if not applicable.
        """
        mapping = {
            QuestionType.SEVERITY: SEVERITY_ATTRIBUTE,
            QuestionType.LATERALITY: LATERALITY_ATTRIBUTE,
            QuestionType.TEMPORAL: CLINICAL_COURSE_ATTRIBUTE,
        }
        return mapping.get(question_type)

    def build_expression_attributes(
        self,
        answered_questions: list[AnsweredQuestion],
    ) -> list[tuple[str, str, int]]:
        """Build expression attributes from answered questions.

        Args:
            answered_questions: List of answered questions.

        Returns:
            List of (attribute_id, value_id, group) tuples for expression building.
        """
        attributes = []

        for answered in answered_questions:
            if answered.skipped or not answered.selected_options:
                continue

            # Get attribute from resulting_attribute or infer from question type
            if answered.resulting_attribute:
                attr_id, value_id = answered.resulting_attribute
                attributes.append((attr_id, value_id, 0))
            else:
                # For specificity questions, the answer becomes the focus concept
                # (handled separately in expression building)
                attr_id = self.get_attribute_for_question_type(answered.question_type)
                if attr_id and len(answered.selected_options) == 1:
                    attributes.append((attr_id, answered.selected_options[0].concept_id, 0))

        return attributes
