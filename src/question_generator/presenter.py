"""Question Presenter - LLM formatting of question text.

The LLM is used ONLY for presentation:
- Formatting question text naturally
- Adapting tone and language
- Providing context

The LLM CANNOT:
- Generate answer options (options come from SNOMED only)
- Add clinical content
- Suggest diagnoses
"""

from __future__ import annotations

import logging
import uuid
from typing import TYPE_CHECKING, Any

from question_generator.models import Gap, GapType, Question, QuestionOption, QuestionType

if TYPE_CHECKING:
    from shared.llm_client import LLMClient

logger = logging.getLogger(__name__)


# Default question templates (used when LLM is not available)
DEFAULT_TEMPLATES = {
    QuestionType.SPECIFICITY: "Can you specify the type of {concept_term}?",
    QuestionType.LATERALITY: "Which side is affected for {concept_term}?",
    QuestionType.SEVERITY: "How severe is the {concept_term}?",
    QuestionType.TEMPORAL: "What is the clinical course of {concept_term}?",
    QuestionType.ATTRIBUTE: "What is the {attribute_name} of {concept_term}?",
    QuestionType.DISAMBIGUATION: "What do you mean by '{concept_term}'?",
    QuestionType.LOCATION: "Where is the {concept_term} located?",
    QuestionType.CONFIRMATION: "Is this correct: {concept_term}?",
}


class QuestionPresenter:
    """Formats questions using LLM for natural language.

    The LLM is used ONLY for formatting question text.
    Options are passed through unchanged - they come from SNOMED only.
    """

    def __init__(
        self,
        llm_client: LLMClient | None = None,
        use_llm: bool = True,
    ) -> None:
        """Initialize the presenter.

        Args:
            llm_client: Optional LLM client for natural formatting.
            use_llm: Whether to use LLM for formatting (vs templates).
        """
        self._llm = llm_client
        self._use_llm = use_llm and llm_client is not None

    async def format_question(
        self,
        gap: Gap,
        options: list[QuestionOption],
        context: dict[str, Any] | None = None,
    ) -> Question:
        """Format a question from a gap and its options.

        Args:
            gap: The gap to create a question for.
            options: SNOMED-backed options (passed through unchanged).
            context: Additional context for formatting.

        Returns:
            Question object with formatted text and SNOMED-backed options.
        """
        context = context or {}

        # Map gap type to question type
        question_type = self._gap_to_question_type(gap.gap_type)

        # Generate question ID
        question_id = str(uuid.uuid4())[:8]

        # Format question text
        if self._use_llm:
            question_text = await self._format_with_llm(
                gap, question_type, options, context
            )
        else:
            question_text = self._format_with_template(gap, question_type, context)

        return Question(
            id=question_id,
            question_type=question_type,
            priority=gap.priority,
            source_concept_id=gap.source_concept_id,
            source_concept_term=gap.source_concept_term,
            attribute_id=gap.attribute_id,
            attribute_name=gap.attribute_name,
            text=question_text,
            options=options,  # Options are UNCHANGED - they have SNOMED IDs
            ecl_source=gap.context.get("ecl_source"),
            skip_option=True,
            multi_select=question_type == QuestionType.DISAMBIGUATION,
        )

    async def _format_with_llm(
        self,
        gap: Gap,
        question_type: QuestionType,
        options: list[QuestionOption],
        context: dict[str, Any],
    ) -> str:
        """Format question text using LLM.

        IMPORTANT: The LLM only formats the question TEXT.
        Options are NOT modified by the LLM.
        """
        # Build a prompt for natural question formatting
        prompt = self._build_formatting_prompt(gap, question_type, options, context)

        try:
            response = await self._llm.generate(
                prompt,
                max_tokens=100,
                temperature=0.3,  # Low temperature for consistent formatting
            )
            return response.strip()
        except Exception as e:
            logger.warning("LLM formatting failed, using template: %s", e)
            return self._format_with_template(gap, question_type, context)

    def _format_with_template(
        self,
        gap: Gap,
        question_type: QuestionType,
        context: dict[str, Any],
    ) -> str:
        """Format question text using templates."""
        template = DEFAULT_TEMPLATES.get(
            question_type,
            "Please specify the {concept_term}.",
        )

        return template.format(
            concept_term=gap.source_concept_term,
            attribute_name=gap.attribute_name or "value",
            **context,
        )

    def _build_formatting_prompt(
        self,
        gap: Gap,
        question_type: QuestionType,
        options: list[QuestionOption],
        context: dict[str, Any],
    ) -> str:
        """Build a prompt for LLM question formatting.

        The prompt asks the LLM to format the question naturally,
        but NOT to generate or modify the options.
        """
        option_summary = ", ".join(opt.display_text for opt in options[:5])
        if len(options) > 5:
            option_summary += f", and {len(options) - 5} more"

        prompt = f"""Format a clinical coding clarification question naturally.

Concept: {gap.source_concept_term}
Question Type: {question_type.value}
Available Options: {option_summary}

Rules:
1. Write a clear, professional question
2. Keep it concise (one sentence)
3. Do not mention SNOMED or coding
4. Do not list the options in the question

Example for specificity: "Can you specify the type of diabetes?"
Example for laterality: "Which side is affected?"
Example for severity: "How would you rate the severity of the pain?"

Write ONLY the question text (no options, no explanation):"""

        return prompt

    def _gap_to_question_type(self, gap_type: GapType) -> QuestionType:
        """Map gap type to question type."""
        mapping = {
            GapType.SPECIFICITY: QuestionType.SPECIFICITY,
            GapType.ATTRIBUTE: QuestionType.ATTRIBUTE,
            GapType.LATERALITY: QuestionType.LATERALITY,
            GapType.DISAMBIGUATION: QuestionType.DISAMBIGUATION,
            GapType.TEMPORAL: QuestionType.TEMPORAL,
            GapType.LOCATION: QuestionType.LOCATION,
            GapType.SEVERITY: QuestionType.SEVERITY,
        }
        return mapping.get(gap_type, QuestionType.ATTRIBUTE)

    async def format_question_batch(
        self,
        gaps_and_options: list[tuple[Gap, list[QuestionOption]]],
        context: dict[str, Any] | None = None,
    ) -> list[Question]:
        """Format multiple questions.

        Args:
            gaps_and_options: List of (gap, options) tuples.
            context: Shared context for formatting.

        Returns:
            List of formatted Question objects.
        """
        questions = []
        for gap, options in gaps_and_options:
            question = await self.format_question(gap, options, context)
            questions.append(question)
        return questions

    def format_question_group_intro(
        self,
        concept_term: str,
        question_count: int,
    ) -> str:
        """Generate an intro text for a group of questions about a concept.

        This can be used by the UI to provide context before showing questions.
        """
        if question_count == 1:
            return f"Please clarify the following about {concept_term}:"
        return f"Please answer {question_count} questions about {concept_term}:"
