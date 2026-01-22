"""Gap detection for clinical coding.

Detects gaps in coding data that need clarification through questions.
All gaps lead to questions with SNOMED-backed options.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from question_generator.models import Gap, GapType

if TYPE_CHECKING:
    from concept_extractor import ConceptExtractor

logger = logging.getLogger(__name__)

# SNOMED CT constants
CHRONIC_DISEASE_ANCESTOR = "27624003"  # Chronic disease (disorder)
LATERALIZABLE_BODY_STRUCTURE = "91723000"  # Anatomical structure (body structure)
CLINICAL_FINDING = "404684003"  # Clinical finding (finding)

# Attribute IDs
SEVERITY_ATTRIBUTE = "246112005"
LATERALITY_ATTRIBUTE = "272741003"
CLINICAL_COURSE_ATTRIBUTE = "263502005"
FINDING_SITE_ATTRIBUTE = "363698007"


class GapDetector:
    """Detects gaps in coding data that need clarification.

    Each detected gap leads to a question with SNOMED-backed options.
    """

    def __init__(
        self,
        extractor: ConceptExtractor,
        max_children_for_specificity: int = 15,
        min_children_for_specificity: int = 2,
    ) -> None:
        """Initialize the gap detector.

        Args:
            extractor: ConceptExtractor for SNOMED queries.
            max_children_for_specificity: Max children to consider for specificity question.
            min_children_for_specificity: Min children required to ask specificity question.
        """
        self._extractor = extractor
        self._max_children = max_children_for_specificity
        self._min_children = min_children_for_specificity

    async def detect_gaps(
        self,
        concept_id: str,
        concept_term: str,
        semantic_tag: str,
        extracted_modifiers: list[dict[str, Any]] | None = None,
        existing_attributes: list[str] | None = None,
    ) -> list[Gap]:
        """Detect all gaps for a concept.

        Args:
            concept_id: SNOMED concept ID.
            concept_term: Concept term/name.
            semantic_tag: Semantic tag (finding, disorder, etc.).
            extracted_modifiers: Modifiers already extracted from text.
            existing_attributes: Attribute IDs already defined.

        Returns:
            List of detected gaps, sorted by priority.
        """
        extracted_modifiers = extracted_modifiers or []
        existing_attributes = existing_attributes or []

        gaps = []

        # Run all gap detection in parallel
        specificity_gap = await self._detect_specificity_gap(
            concept_id, concept_term
        )
        if specificity_gap:
            gaps.append(specificity_gap)

        # Detect attribute gaps based on MRCM
        attribute_gaps = await self._detect_attribute_gaps(
            concept_id, concept_term, semantic_tag, extracted_modifiers, existing_attributes
        )
        gaps.extend(attribute_gaps)

        # Detect laterality gap
        laterality_gap = await self._detect_laterality_gap(
            concept_id, concept_term, extracted_modifiers, existing_attributes
        )
        if laterality_gap:
            gaps.append(laterality_gap)

        # Detect temporal gap (for non-chronic conditions)
        temporal_gap = await self._detect_temporal_gap(
            concept_id, concept_term, semantic_tag, extracted_modifiers, existing_attributes
        )
        if temporal_gap:
            gaps.append(temporal_gap)

        # Sort by priority (lower number = higher priority)
        gaps.sort(key=lambda g: g.priority)

        return gaps

    async def _detect_specificity_gap(
        self,
        concept_id: str,
        concept_term: str,
    ) -> Gap | None:
        """Detect if concept can be made more specific.

        A specificity gap exists if:
        - Concept has children
        - Number of children is between min and max threshold
        """
        try:
            children_result = await self._extractor.get_children(concept_id)
            child_count = children_result.total_count

            if self._min_children <= child_count <= self._max_children:
                return Gap(
                    gap_type=GapType.SPECIFICITY,
                    source_concept_id=concept_id,
                    source_concept_term=concept_term,
                    priority=2,  # High priority - specificity is important
                    context={
                        "child_count": child_count,
                        "children": [
                            {"id": c.concept_id, "term": c.term}
                            for c in children_result.concepts[:self._max_children]
                        ],
                    },
                )
        except Exception as e:
            logger.warning("Failed to detect specificity gap for %s: %s", concept_id, e)

        return None

    async def _detect_attribute_gaps(
        self,
        concept_id: str,
        concept_term: str,
        semantic_tag: str,
        extracted_modifiers: list[dict[str, Any]],
        existing_attributes: list[str],
    ) -> list[Gap]:
        """Detect gaps for MRCM attributes.

        Checks which MRCM attributes are valid for this concept
        but not yet defined.
        """
        gaps = []

        try:
            # Get valid attributes from MRCM
            valid_attrs = await self._extractor.get_valid_attributes(
                concept_id, semantic_tag, concept_term
            )

            # Extract modifier types that have been identified
            extracted_types = {
                m.get("modifier_type", m.get("type", "")).lower()
                for m in extracted_modifiers
            }

            for attr in valid_attrs:
                # Skip if already defined
                if attr.id in existing_attributes:
                    continue

                # Map attribute to modifier type
                attr_type = self._attr_to_modifier_type(attr.id)
                if attr_type and attr_type in extracted_types:
                    # Already extracted from text, no need to ask
                    continue

                # Determine priority based on attribute type
                priority = self._get_attribute_priority(attr.id)

                # Skip severity and laterality (handled separately)
                if attr.id in (SEVERITY_ATTRIBUTE, LATERALITY_ATTRIBUTE):
                    continue

                gaps.append(
                    Gap(
                        gap_type=GapType.ATTRIBUTE,
                        source_concept_id=concept_id,
                        source_concept_term=concept_term,
                        priority=priority,
                        attribute_id=attr.id,
                        attribute_name=attr.name,
                        context={"is_qualifier": attr.is_qualifier},
                    )
                )

        except Exception as e:
            logger.warning("Failed to detect attribute gaps for %s: %s", concept_id, e)

        return gaps

    async def _detect_laterality_gap(
        self,
        concept_id: str,
        concept_term: str,
        extracted_modifiers: list[dict[str, Any]],
        existing_attributes: list[str],
    ) -> Gap | None:
        """Detect if laterality should be specified.

        A laterality gap exists if:
        - Laterality attribute is not already defined
        - No laterality modifier was extracted from text
        - The finding site is a lateralizable body structure
        """
        # Check if laterality already defined
        if LATERALITY_ATTRIBUTE in existing_attributes:
            return None

        # Check if laterality was extracted from text
        for mod in extracted_modifiers:
            mod_type = mod.get("modifier_type", mod.get("type", "")).lower()
            if mod_type in ("laterality", "lat", "side"):
                return None

        # Check if concept has a lateralizable finding site
        try:
            relationships = await self._extractor.get_relationships(concept_id)
            for rel in relationships.relationships:
                if rel.type_id == FINDING_SITE_ATTRIBUTE:
                    # Check if the finding site is lateralizable
                    # (descendant of paired structure or specific lateralizable sites)
                    is_lateralizable = await self._is_lateralizable_site(
                        rel.destination_id
                    )
                    if is_lateralizable:
                        return Gap(
                            gap_type=GapType.LATERALITY,
                            source_concept_id=concept_id,
                            source_concept_term=concept_term,
                            priority=2,
                            attribute_id=LATERALITY_ATTRIBUTE,
                            attribute_name="Laterality",
                            context={
                                "finding_site_id": rel.destination_id,
                                "finding_site_term": rel.destination_term,
                            },
                        )
        except Exception as e:
            logger.warning("Failed to detect laterality gap for %s: %s", concept_id, e)

        return None

    async def _detect_temporal_gap(
        self,
        concept_id: str,
        concept_term: str,
        semantic_tag: str,
        extracted_modifiers: list[dict[str, Any]],
        existing_attributes: list[str],
    ) -> Gap | None:
        """Detect if temporal/course should be specified.

        A temporal gap exists if:
        - Clinical course attribute is not defined
        - No onset/course modifier was extracted
        - The concept is NOT inherently chronic
        - The semantic tag is 'finding' or 'disorder'
        """
        # Only for findings and disorders
        if semantic_tag not in ("finding", "disorder"):
            return None

        # Check if course already defined
        if CLINICAL_COURSE_ATTRIBUTE in existing_attributes:
            return None

        # Check if course/onset was extracted from text
        for mod in extracted_modifiers:
            mod_type = mod.get("modifier_type", mod.get("type", "")).lower()
            if mod_type in ("onset", "course", "clinical_course"):
                return None

        # Check if concept is inherently chronic
        try:
            is_chronic = await self._extractor.is_descendant_of(
                concept_id, CHRONIC_DISEASE_ANCESTOR
            )
            if is_chronic:
                # Chronic conditions don't need temporal question
                return None

            return Gap(
                gap_type=GapType.TEMPORAL,
                source_concept_id=concept_id,
                source_concept_term=concept_term,
                priority=3,
                attribute_id=CLINICAL_COURSE_ATTRIBUTE,
                attribute_name="Clinical course",
                context={},
            )

        except Exception as e:
            logger.warning("Failed to detect temporal gap for %s: %s", concept_id, e)

        return None

    async def detect_severity_gap(
        self,
        concept_id: str,
        concept_term: str,
        extracted_modifiers: list[dict[str, Any]],
        existing_attributes: list[str],
    ) -> Gap | None:
        """Detect if severity should be specified.

        This is called separately as severity is commonly applicable
        to clinical findings.
        """
        # Check if severity already defined
        if SEVERITY_ATTRIBUTE in existing_attributes:
            return None

        # Check if severity was extracted from text
        for mod in extracted_modifiers:
            mod_type = mod.get("modifier_type", mod.get("type", "")).lower()
            if mod_type in ("severity", "sev"):
                return None

        # Check if severity is valid for this concept
        try:
            valid_attrs = await self._extractor.get_valid_attributes(
                concept_id, "finding", concept_term
            )
            for attr in valid_attrs:
                if attr.id == SEVERITY_ATTRIBUTE:
                    return Gap(
                        gap_type=GapType.SEVERITY,
                        source_concept_id=concept_id,
                        source_concept_term=concept_term,
                        priority=3,
                        attribute_id=SEVERITY_ATTRIBUTE,
                        attribute_name="Severity",
                        context={},
                    )
        except Exception as e:
            logger.warning("Failed to detect severity gap for %s: %s", concept_id, e)

        return None

    async def _is_lateralizable_site(self, site_id: str) -> bool:
        """Check if a body site is lateralizable (paired structure)."""
        # Common lateralizable structures
        PAIRED_STRUCTURES = {
            "15497006",  # Ovary
            "64033007",  # Kidney
            "39607008",  # Lung
            "80891009",  # Heart
            "53840002",  # Leg
            "40983000",  # Upper arm
            "8205005",   # Wrist
            "29836001",  # Hip
            "72696002",  # Knee
            "34402009",  # Rectum (for sides)
            "89644007",  # Shoulder
            "54066008",  # Elbow
            "7569003",   # Finger
            "29092000",  # Hand
            "56459004",  # Foot
            "76752008",  # Breast
            "81745001",  # Eye
            "1910005",   # Ear
            "45206002",  # Nasal structure
        }

        if site_id in PAIRED_STRUCTURES:
            return True

        # Check if descendant of "paired structure" via ECL
        try:
            # 91723000 is the general body structure, we check for specific lateralizable ancestors
            is_limb = await self._extractor.is_descendant_of(site_id, "53840002")  # Leg
            if is_limb:
                return True
            is_arm = await self._extractor.is_descendant_of(site_id, "40983000")  # Upper arm
            if is_arm:
                return True
        except Exception:
            pass

        return False

    def _attr_to_modifier_type(self, attr_id: str) -> str | None:
        """Map attribute ID to modifier type."""
        mapping = {
            SEVERITY_ATTRIBUTE: "severity",
            LATERALITY_ATTRIBUTE: "laterality",
            CLINICAL_COURSE_ATTRIBUTE: "course",
        }
        return mapping.get(attr_id)

    def _get_attribute_priority(self, attr_id: str) -> int:
        """Get priority for an attribute type."""
        priorities = {
            SEVERITY_ATTRIBUTE: 3,
            LATERALITY_ATTRIBUTE: 2,
            CLINICAL_COURSE_ATTRIBUTE: 3,
            FINDING_SITE_ATTRIBUTE: 2,
        }
        return priorities.get(attr_id, 4)
