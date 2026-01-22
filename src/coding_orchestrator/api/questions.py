"""Phase 4: Question generation and session management API routes.

Zero-Hallucination Question Generator:
- All answer options have SNOMED CT concept IDs
- LLM is used ONLY for formatting question text
- Options come from SNOMED queries (ECL, hierarchy, MRCM)
"""

from fastapi import APIRouter, Depends, HTTPException

from coding_orchestrator.api.dependencies import get_coding_service
from coding_orchestrator.models.requests import (
    AnswerQuestionRequest,
    CodeWithQuestionsRequest,
    CreateSessionRequest,
    GenerateQuestionsRequest,
)
from coding_orchestrator.models.responses import (
    AnsweredQuestionResponse,
    AnswerResponse,
    CodeWithQuestionsResponse,
    ConceptWithQuestionsResponse,
    GenerateQuestionsResponse,
    QuestionOptionResponse,
    QuestionResponse,
    SessionResponse,
)
from coding_orchestrator.services.coding_service import CodingService

router = APIRouter(prefix="/api/v1", tags=["questions"])


# =============================================================================
# Code with Questions Endpoint
# =============================================================================


@router.post(
    "/code-with-questions",
    response_model=CodeWithQuestionsResponse,
    summary="Code clinical text with question generation",
    description="""
    Full coding pipeline with zero-hallucination question generation.

    **Workflow:**
    1. Normalize text (expand abbreviations, extract modifiers)
    2. Extract SNOMED concepts for each clinical phrase
    3. Detect gaps (specificity, laterality, severity, temporal)
    4. Generate questions with SNOMED-backed options
    5. Return session for follow-up interactions

    **Zero-Hallucination Guarantee:**
    - Every answer option has a SNOMED CT concept ID
    - Options come from ECL queries, hierarchy, or MRCM
    - LLM is used ONLY for formatting question text

    **Example Input:**
    ```json
    {
      "text": "Patient has severe chest pain radiating to left arm"
    }
    ```

    **Returns:**
    - Normalized text with extracted phrases and modifiers
    - Matched SNOMED concepts
    - Generated questions with pre-selected options (from extracted modifiers)
    """,
)
async def code_with_questions(
    request: CodeWithQuestionsRequest,
    service: CodingService = Depends(get_coding_service),
) -> CodeWithQuestionsResponse:
    """Perform coding with question generation."""
    try:
        return await service.code_with_questions(
            text=request.text,
            auto_map_modifiers=request.auto_map_modifiers,
            generate_questions=request.generate_questions,
            max_questions_per_concept=request.max_questions_per_concept,
            use_llm_formatting=request.use_llm_formatting,
            options=request.options,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# Session Management Endpoints
# =============================================================================


@router.post(
    "/sessions",
    response_model=SessionResponse,
    summary="Create a new coding session",
    description="""
    Create a new coding session for multi-turn question answering.

    The session maintains state across multiple API calls, allowing
    users to answer questions one at a time.
    """,
)
async def create_session(
    request: CreateSessionRequest,
    service: CodingService = Depends(get_coding_service),
) -> SessionResponse:
    """Create a new coding session."""
    try:
        return await service.create_coding_session(
            text=request.text,
            generate_questions=request.generate_questions,
            options=request.options,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/sessions/{session_id}",
    response_model=SessionResponse,
    summary="Get session state",
    description="Get the current state of a coding session.",
)
async def get_session(
    session_id: str,
    service: CodingService = Depends(get_coding_service),
) -> SessionResponse:
    """Get session state."""
    try:
        result = await service.get_session_state(session_id)
        if result is None:
            raise HTTPException(status_code=404, detail="Session not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/sessions/{session_id}/answer",
    response_model=AnswerResponse,
    summary="Answer a question in a session",
    description="""
    Answer a question in a coding session.

    **Requirements:**
    - `selected_option_ids` must contain valid SNOMED concept IDs from the question's options
    - Set `skipped: true` to skip a question

    **Returns:**
    - Validation result
    - Next question (if any)
    - Final expressions (if all questions answered)
    """,
)
async def answer_question(
    session_id: str,
    request: AnswerQuestionRequest,
    service: CodingService = Depends(get_coding_service),
) -> AnswerResponse:
    """Answer a question in a session."""
    try:
        return await service.answer_session_question(
            session_id=session_id,
            question_id=request.question_id,
            selected_option_ids=request.selected_option_ids,
            skipped=request.skipped,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete(
    "/sessions/{session_id}",
    summary="Delete a session",
    description="Delete a coding session and release resources.",
)
async def delete_session(
    session_id: str,
    service: CodingService = Depends(get_coding_service),
) -> dict:
    """Delete a session."""
    try:
        deleted = await service.delete_session(session_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Session not found")
        return {"deleted": True, "session_id": session_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# Question Generation Endpoint
# =============================================================================


@router.post(
    "/generate-questions",
    response_model=GenerateQuestionsResponse,
    summary="Generate questions for a concept",
    description="""
    Generate clarifying questions for a single SNOMED concept.

    **Use cases:**
    - Generate questions on demand for a specific concept
    - Test question generation without full coding pipeline

    **Returns:**
    - Questions with SNOMED-backed options
    - Pre-selected options based on provided modifiers
    """,
)
async def generate_questions(
    request: GenerateQuestionsRequest,
    service: CodingService = Depends(get_coding_service),
) -> GenerateQuestionsResponse:
    """Generate questions for a concept."""
    try:
        return await service.generate_questions_for_concept(
            concept_id=request.concept_id,
            concept_term=request.concept_term,
            semantic_tag=request.semantic_tag,
            extracted_modifiers=request.extracted_modifiers,
            existing_attributes=request.existing_attributes,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
