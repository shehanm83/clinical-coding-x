"""Phase 3: Enhanced coding API routes."""

from fastapi import APIRouter, Depends, HTTPException

from coding_orchestrator.api.dependencies import get_coding_service
from coding_orchestrator.models.requests import (
    EnhancedCodeRequest,
    MapModifiersRequest,
    RefsetMembershipRequest,
    ValidateRelationshipRequest,
)
from coding_orchestrator.models.responses import (
    EnhancedCodeResponse,
    MapModifiersResponse,
    RefsetMembershipResponse,
    RelationshipValidationResponse,
)
from coding_orchestrator.services.coding_service import CodingService

router = APIRouter(prefix="/api/v1", tags=["enhanced"])


# =============================================================================
# Modifier Mapping
# =============================================================================


@router.post(
    "/map-modifiers",
    response_model=MapModifiersResponse,
    summary="Map modifiers to SNOMED attributes",
    description="""
    Map clinical modifiers to SNOMED CT attribute/value pairs.

    **Supported modifier types:**
    - **severity**: mild, moderate, severe, marked, profound
    - **laterality**: left, right, bilateral, unilateral
    - **course**: acute, chronic, subacute, sudden, gradual, intermittent, persistent
    - **episodicity**: first, new, recurrent
    - **occurrence**: prenatal, perinatal, neonatal, congenital, childhood, adult

    **Example:**
    ```json
    {
      "modifiers": [
        {"modifier_type": "severity", "value": "severe"},
        {"modifier_type": "laterality", "value": "left"}
      ]
    }
    ```

    **Returns:**
    - Severity → 246112005 (Severity) = 24484000 (Severe)
    - Laterality → 272741003 (Laterality) = 7771000 (Left)
    """,
)
async def map_modifiers(
    request: MapModifiersRequest,
    service: CodingService = Depends(get_coding_service),
) -> MapModifiersResponse:
    """Map clinical modifiers to SNOMED CT attributes."""
    try:
        modifiers = [
            {"modifier_type": m.modifier_type, "value": m.value}
            for m in request.modifiers
        ]
        return await service.map_modifiers(modifiers)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# Relationship Validation
# =============================================================================


@router.post(
    "/validate/relationship",
    response_model=RelationshipValidationResponse,
    summary="Validate relationship between concepts",
    description="""
    Validate that a relationship is valid between two SNOMED CT concepts.

    Checks:
    1. If the relationship already exists in SNOMED CT (definitive)
    2. If the relationship type is valid for the source concept (MRCM rules)
    3. If the target concept is in the valid range for the relationship type

    **Example:**
    ```json
    {
      "source_concept_id": "29857009",
      "relationship_type_id": "363698007",
      "target_concept_id": "51185008"
    }
    ```

    Checks if "Chest pain" can have "Finding site" = "Thoracic structure"
    """,
)
async def validate_relationship(
    request: ValidateRelationshipRequest,
    service: CodingService = Depends(get_coding_service),
) -> RelationshipValidationResponse:
    """Validate a relationship between concepts."""
    try:
        return await service.validate_relationship(
            source_concept_id=request.source_concept_id,
            relationship_type_id=request.relationship_type_id,
            target_concept_id=request.target_concept_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# Refset Membership
# =============================================================================


@router.post(
    "/refsets/membership",
    response_model=RefsetMembershipResponse,
    summary="Check refset membership",
    description="""
    Check which reference sets a concept belongs to.

    Reference sets are used to group concepts for specific purposes,
    such as:
    - GP/Family Practice health issues
    - ICD-10 mappings
    - Country-specific subsets

    **Note:** This endpoint requires the SNOMED service to support
    refset queries. Returns empty list if not available.
    """,
)
async def get_refset_membership(
    request: RefsetMembershipRequest,
    service: CodingService = Depends(get_coding_service),
) -> RefsetMembershipResponse:
    """Check refset membership for a concept."""
    try:
        return await service.get_refset_membership(
            concept_id=request.concept_id,
            refset_id=request.refset_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# Enhanced Coding
# =============================================================================


@router.post(
    "/code/enhanced",
    response_model=EnhancedCodeResponse,
    summary="Enhanced coding with post-coordination",
    description="""
    Enhanced clinical coding that automatically:
    1. Normalizes the text (expands abbreviations, identifies phrases)
    2. Extracts modifiers (severity, laterality, onset)
    3. Maps modifiers to SNOMED CT attributes
    4. Matches clinical phrases to SNOMED concepts
    5. Builds post-coordinated expressions

    **Example input:**
    ```json
    {
      "text": "Patient has severe left-sided chest pain with acute onset"
    }
    ```

    **Example output:**
    - Phrase: "chest pain"
    - Match: 29857009 | Chest pain |
    - Modifiers: severe → Severity=Severe, left → Laterality=Left, acute → Course=Acute
    - Post-coordinated: `29857009 | Chest pain | : 246112005 | Severity | = 24484000 | Severe |, 272741003 | Laterality | = 7771000 | Left |`
    """,
)
async def enhanced_code(
    request: EnhancedCodeRequest,
    service: CodingService = Depends(get_coding_service),
) -> EnhancedCodeResponse:
    """Perform enhanced coding with automatic modifier mapping."""
    try:
        return await service.enhanced_code(
            text=request.text,
            auto_map_modifiers=request.auto_map_modifiers,
            include_post_coordination=request.include_post_coordination,
            options=request.options,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
