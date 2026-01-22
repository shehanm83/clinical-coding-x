"""Service for mapping clinical modifiers to SNOMED CT attributes.

This module provides deterministic mapping of extracted modifiers
(severity, laterality, onset, course) to SNOMED CT attribute/value pairs.

All mappings are from SNOMED CT - NO LLM-generated values.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from concept_extractor.extractor import ConceptExtractor

logger = logging.getLogger(__name__)


# =============================================================================
# SNOMED CT Attribute Constants
# =============================================================================

# Core attribute type IDs
SEVERITY_ATTRIBUTE = "246112005"  # Severity (attribute)
LATERALITY_ATTRIBUTE = "272741003"  # Laterality (attribute)
CLINICAL_COURSE_ATTRIBUTE = "263502005"  # Clinical course (attribute)
FINDING_SITE_ATTRIBUTE = "363698007"  # Finding site (attribute)
ASSOCIATED_MORPHOLOGY_ATTRIBUTE = "116676008"  # Associated morphology (attribute)
OCCURRENCE_ATTRIBUTE = "246454002"  # Occurrence (attribute)
EPISODICITY_ATTRIBUTE = "246456000"  # Episodicity (attribute)


# =============================================================================
# Modifier Value Mappings (SNOMED CT concept IDs)
# =============================================================================

SEVERITY_MAPPINGS = {
    # Severity values
    "severe": ("24484000", "Severe (severity modifier)"),
    "moderate": ("6736007", "Moderate (severity modifier)"),
    "mild": ("255604002", "Mild (qualifier value)"),
    "minimal": ("255605001", "Minimal (qualifier value)"),
    "slight": ("255510006", "Slight (qualifier value)"),
    "marked": ("46998006", "Marked (qualifier value)"),
    "profound": ("12565001", "Profound (severity modifier)"),
    "extreme": ("12565001", "Profound (severity modifier)"),  # Map to profound
}

LATERALITY_MAPPINGS = {
    # Laterality values
    "left": ("7771000", "Left (qualifier value)"),
    "right": ("24028007", "Right (qualifier value)"),
    "bilateral": ("51440002", "Bilateral (qualifier value)"),
    "unilateral": ("66459002", "Unilateral (qualifier value)"),
    "l": ("7771000", "Left (qualifier value)"),  # Abbreviation
    "r": ("24028007", "Right (qualifier value)"),  # Abbreviation
    "b/l": ("51440002", "Bilateral (qualifier value)"),  # Abbreviation
}

CLINICAL_COURSE_MAPPINGS = {
    # Onset/course values
    "acute": ("373933003", "Acute onset (qualifier value)"),
    "chronic": ("90734009", "Chronic (qualifier value)"),
    "subacute": ("19939008", "Subacute (qualifier value)"),
    "sudden": ("385315009", "Sudden onset (qualifier value)"),
    "gradual": ("61751001", "Gradual onset (qualifier value)"),
    "intermittent": ("7087005", "Intermittent (qualifier value)"),
    "persistent": ("262012006", "Persistent (qualifier value)"),
    "recurrent": ("255227004", "Recurrent (qualifier value)"),
    "progressive": ("255314001", "Progressive (qualifier value)"),
    "stable": ("58158008", "Stable (qualifier value)"),
    "improving": ("385633008", "Improving (qualifier value)"),
    "worsening": ("230993007", "Worsening (qualifier value)"),
}

EPISODICITY_MAPPINGS = {
    # Episodicity values
    "first": ("255217005", "First episode (qualifier value)"),
    "new": ("7147002", "New (qualifier value)"),
    "recurrent": ("255227004", "Recurrent (qualifier value)"),
}

OCCURRENCE_MAPPINGS = {
    # Occurrence timing
    "prenatal": ("276879009", "Prenatal period (qualifier value)"),
    "perinatal": ("79197007", "Perinatal period (qualifier value)"),
    "neonatal": ("255399007", "Neonatal period (qualifier value)"),
    "congenital": ("255399007", "Congenital (qualifier value)"),
    "childhood": ("68315003", "Childhood (qualifier value)"),
    "adult": ("133936004", "Adult (qualifier value)"),
}


@dataclass
class AttributeMapping:
    """A mapped SNOMED CT attribute with its value."""

    attribute_id: str
    attribute_name: str
    value_id: str
    value_term: str
    original_modifier_type: str
    original_modifier_value: str
    confidence: float = 1.0


class ModifierMapper:
    """Maps clinical modifiers to SNOMED CT attributes.

    This service provides deterministic mapping from extracted text
    modifiers to SNOMED CT attribute/value pairs. All mappings are
    derived from SNOMED CT - no LLM generation.
    """

    def __init__(self, extractor: ConceptExtractor | None = None) -> None:
        """Initialize the modifier mapper.

        Args:
            extractor: Optional ConceptExtractor for validation.
        """
        self._extractor = extractor

    def map_modifier(
        self,
        modifier_type: str,
        modifier_value: str,
    ) -> AttributeMapping | None:
        """Map a single modifier to a SNOMED CT attribute.

        Args:
            modifier_type: Type of modifier (severity, laterality, onset, course).
            modifier_value: Value of the modifier (severe, left, acute, etc.).

        Returns:
            AttributeMapping or None if no mapping found.
        """
        modifier_type = modifier_type.lower().strip()
        modifier_value = modifier_value.lower().strip()

        # Map based on modifier type
        if modifier_type in ("severity", "sev"):
            return self._map_severity(modifier_value)
        elif modifier_type in ("laterality", "lat", "side"):
            return self._map_laterality(modifier_value)
        elif modifier_type in ("onset", "course", "clinical_course"):
            return self._map_clinical_course(modifier_value)
        elif modifier_type in ("episodicity", "episode"):
            return self._map_episodicity(modifier_value)
        elif modifier_type in ("occurrence", "timing"):
            return self._map_occurrence(modifier_value)

        # Try to infer type from value
        return self._infer_mapping(modifier_value)

    def map_modifiers(
        self,
        modifiers: list[dict[str, str]],
    ) -> list[AttributeMapping]:
        """Map multiple modifiers to SNOMED CT attributes.

        Args:
            modifiers: List of dicts with 'type' and 'value' keys.

        Returns:
            List of AttributeMapping objects.
        """
        mappings = []
        for mod in modifiers:
            mod_type = mod.get("type", mod.get("modifier_type", ""))
            mod_value = mod.get("value", mod.get("modifier_value", ""))

            mapping = self.map_modifier(mod_type, mod_value)
            if mapping:
                mappings.append(mapping)

        return mappings

    def _map_severity(self, value: str) -> AttributeMapping | None:
        """Map severity modifier to SNOMED attribute."""
        if value in SEVERITY_MAPPINGS:
            concept_id, term = SEVERITY_MAPPINGS[value]
            return AttributeMapping(
                attribute_id=SEVERITY_ATTRIBUTE,
                attribute_name="Severity",
                value_id=concept_id,
                value_term=term,
                original_modifier_type="severity",
                original_modifier_value=value,
            )
        return None

    def _map_laterality(self, value: str) -> AttributeMapping | None:
        """Map laterality modifier to SNOMED attribute."""
        if value in LATERALITY_MAPPINGS:
            concept_id, term = LATERALITY_MAPPINGS[value]
            return AttributeMapping(
                attribute_id=LATERALITY_ATTRIBUTE,
                attribute_name="Laterality",
                value_id=concept_id,
                value_term=term,
                original_modifier_type="laterality",
                original_modifier_value=value,
            )
        return None

    def _map_clinical_course(self, value: str) -> AttributeMapping | None:
        """Map clinical course/onset modifier to SNOMED attribute."""
        if value in CLINICAL_COURSE_MAPPINGS:
            concept_id, term = CLINICAL_COURSE_MAPPINGS[value]
            return AttributeMapping(
                attribute_id=CLINICAL_COURSE_ATTRIBUTE,
                attribute_name="Clinical course",
                value_id=concept_id,
                value_term=term,
                original_modifier_type="course",
                original_modifier_value=value,
            )
        return None

    def _map_episodicity(self, value: str) -> AttributeMapping | None:
        """Map episodicity modifier to SNOMED attribute."""
        if value in EPISODICITY_MAPPINGS:
            concept_id, term = EPISODICITY_MAPPINGS[value]
            return AttributeMapping(
                attribute_id=EPISODICITY_ATTRIBUTE,
                attribute_name="Episodicity",
                value_id=concept_id,
                value_term=term,
                original_modifier_type="episodicity",
                original_modifier_value=value,
            )
        return None

    def _map_occurrence(self, value: str) -> AttributeMapping | None:
        """Map occurrence modifier to SNOMED attribute."""
        if value in OCCURRENCE_MAPPINGS:
            concept_id, term = OCCURRENCE_MAPPINGS[value]
            return AttributeMapping(
                attribute_id=OCCURRENCE_ATTRIBUTE,
                attribute_name="Occurrence",
                value_id=concept_id,
                value_term=term,
                original_modifier_type="occurrence",
                original_modifier_value=value,
            )
        return None

    def _infer_mapping(self, value: str) -> AttributeMapping | None:
        """Try to infer the modifier type from the value."""
        # Check each mapping dict
        if value in SEVERITY_MAPPINGS:
            return self._map_severity(value)
        if value in LATERALITY_MAPPINGS:
            return self._map_laterality(value)
        if value in CLINICAL_COURSE_MAPPINGS:
            return self._map_clinical_course(value)
        if value in EPISODICITY_MAPPINGS:
            return self._map_episodicity(value)
        if value in OCCURRENCE_MAPPINGS:
            return self._map_occurrence(value)
        return None

    def get_available_values(self, modifier_type: str) -> list[tuple[str, str]]:
        """Get all available values for a modifier type.

        Args:
            modifier_type: Type of modifier.

        Returns:
            List of (concept_id, term) tuples.
        """
        modifier_type = modifier_type.lower().strip()

        if modifier_type in ("severity", "sev"):
            return list(SEVERITY_MAPPINGS.values())
        elif modifier_type in ("laterality", "lat", "side"):
            return list(LATERALITY_MAPPINGS.values())
        elif modifier_type in ("onset", "course", "clinical_course"):
            return list(CLINICAL_COURSE_MAPPINGS.values())
        elif modifier_type in ("episodicity", "episode"):
            return list(EPISODICITY_MAPPINGS.values())
        elif modifier_type in ("occurrence", "timing"):
            return list(OCCURRENCE_MAPPINGS.values())

        return []
