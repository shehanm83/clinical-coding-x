"""Option generation for questions - ALL options from SNOMED CT.

This module generates answer options for questions. EVERY option has a
SNOMED CT concept ID. This is the core of the zero-hallucination approach.

Options are generated from:
- ECL execution
- Hierarchy traversal (children, siblings)
- MRCM attribute ranges
- Modifier mapper values
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from question_generator.models import Gap, GapType, QuestionOption

if TYPE_CHECKING:
    from concept_extractor import ConceptExtractor
    from coding_orchestrator.services.modifier_mapper import ModifierMapper

logger = logging.getLogger(__name__)

# SNOMED CT attribute IDs
SEVERITY_ATTRIBUTE = "246112005"
LATERALITY_ATTRIBUTE = "272741003"
CLINICAL_COURSE_ATTRIBUTE = "263502005"

# Fixed laterality options (SNOMED concept IDs)
LATERALITY_OPTIONS = [
    ("7771000", "Left", "Left (qualifier value)"),
    ("24028007", "Right", "Right (qualifier value)"),
    ("51440002", "Bilateral", "Bilateral (qualifier value)"),
]

# Fixed severity options (SNOMED concept IDs)
SEVERITY_OPTIONS = [
    ("255604002", "Mild", "Mild (qualifier value)"),
    ("6736007", "Moderate", "Moderate (severity modifier)"),
    ("24484000", "Severe", "Severe (severity modifier)"),
]

# Fixed clinical course options (SNOMED concept IDs)
CLINICAL_COURSE_OPTIONS = [
    ("373933003", "Acute", "Acute onset (qualifier value)"),
    ("19939008", "Subacute", "Subacute (qualifier value)"),
    ("90734009", "Chronic", "Chronic (qualifier value)"),
    ("7087005", "Intermittent", "Intermittent (qualifier value)"),
    ("255227004", "Recurrent", "Recurrent (qualifier value)"),
]


class OptionGenerator:
    """Generates SNOMED-backed options for questions.

    Every option returned by this class has a valid SNOMED CT concept ID.
    """

    def __init__(
        self,
        extractor: ConceptExtractor,
        modifier_mapper: ModifierMapper | None = None,
    ) -> None:
        """Initialize the option generator.

        Args:
            extractor: ConceptExtractor for SNOMED queries.
            modifier_mapper: Optional modifier mapper for fixed values.
        """
        self._extractor = extractor
        self._modifier_mapper = modifier_mapper

    async def generate_options(
        self,
        gap: Gap,
        max_options: int = 10,
        extracted_modifiers: list[dict[str, Any]] | None = None,
    ) -> list[QuestionOption]:
        """Generate options for a gap.

        Args:
            gap: The gap to generate options for.
            max_options: Maximum number of options to return.
            extracted_modifiers: Modifiers extracted from text for pre-selection.

        Returns:
            List of QuestionOption objects, ALL with SNOMED concept IDs.
        """
        extracted_modifiers = extracted_modifiers or []

        if gap.gap_type == GapType.SPECIFICITY:
            return await self._generate_specificity_options(
                gap, max_options, extracted_modifiers
            )
        elif gap.gap_type == GapType.LATERALITY:
            return self._generate_laterality_options(extracted_modifiers)
        elif gap.gap_type == GapType.SEVERITY:
            return self._generate_severity_options(extracted_modifiers)
        elif gap.gap_type == GapType.TEMPORAL:
            return self._generate_temporal_options(extracted_modifiers)
        elif gap.gap_type == GapType.ATTRIBUTE:
            return await self._generate_attribute_options(
                gap, max_options, extracted_modifiers
            )
        elif gap.gap_type == GapType.DISAMBIGUATION:
            return await self._generate_disambiguation_options(
                gap, max_options, extracted_modifiers
            )

        return []

    async def _generate_specificity_options(
        self,
        gap: Gap,
        max_options: int,
        extracted_modifiers: list[dict[str, Any]],
    ) -> list[QuestionOption]:
        """Generate options from concept children.

        Source: get_children() or ECL < {concept_id}
        """
        options = []

        try:
            # Get children from gap context if available
            children_data = gap.context.get("children", [])

            if not children_data:
                # Fetch from SNOMED
                children_result = await self._extractor.get_children(
                    gap.source_concept_id
                )
                children_data = [
                    {"id": c.concept_id, "term": c.term, "fsn": c.fsn, "semantic_tag": c.semantic_tag}
                    for c in children_result.concepts[:max_options]
                ]

            for child in children_data[:max_options]:
                # Check if this child matches any extracted modifier
                pre_selected = False
                pre_selection_source = ""
                for mod in extracted_modifiers:
                    mod_value = mod.get("value", "").lower()
                    child_term = child.get("term", child.get("id", "")).lower()
                    if mod_value in child_term or child_term in mod_value:
                        pre_selected = True
                        pre_selection_source = f"text_modifier:{mod.get('modifier_type', mod.get('type', ''))}"
                        break

                options.append(
                    QuestionOption(
                        concept_id=child.get("id", child.get("concept_id")),
                        display_text=child.get("term", ""),
                        fsn=child.get("fsn", ""),
                        semantic_tag=child.get("semantic_tag", ""),
                        pre_selected=pre_selected,
                        pre_selection_source=pre_selection_source,
                    )
                )

        except Exception as e:
            logger.error("Failed to generate specificity options: %s", e)

        return options

    def _generate_laterality_options(
        self,
        extracted_modifiers: list[dict[str, Any]],
    ) -> list[QuestionOption]:
        """Generate fixed laterality options.

        Source: Fixed SNOMED laterality qualifier concepts.
        """
        options = []

        # Check for pre-selection from extracted modifiers
        extracted_lat = None
        for mod in extracted_modifiers:
            mod_type = mod.get("modifier_type", mod.get("type", "")).lower()
            if mod_type in ("laterality", "lat", "side"):
                extracted_lat = mod.get("value", "").lower()
                break

        for concept_id, term, fsn in LATERALITY_OPTIONS:
            pre_selected = False
            pre_selection_source = ""
            if extracted_lat and extracted_lat in term.lower():
                pre_selected = True
                pre_selection_source = "text_modifier:laterality"

            options.append(
                QuestionOption(
                    concept_id=concept_id,
                    display_text=term,
                    fsn=fsn,
                    semantic_tag="qualifier value",
                    pre_selected=pre_selected,
                    pre_selection_source=pre_selection_source,
                )
            )

        return options

    def _generate_severity_options(
        self,
        extracted_modifiers: list[dict[str, Any]],
    ) -> list[QuestionOption]:
        """Generate fixed severity options.

        Source: Fixed SNOMED severity qualifier concepts.
        """
        options = []

        # Check for pre-selection from extracted modifiers
        extracted_sev = None
        for mod in extracted_modifiers:
            mod_type = mod.get("modifier_type", mod.get("type", "")).lower()
            if mod_type in ("severity", "sev"):
                extracted_sev = mod.get("value", "").lower()
                break

        for concept_id, term, fsn in SEVERITY_OPTIONS:
            pre_selected = False
            pre_selection_source = ""
            if extracted_sev and extracted_sev in term.lower():
                pre_selected = True
                pre_selection_source = "text_modifier:severity"

            options.append(
                QuestionOption(
                    concept_id=concept_id,
                    display_text=term,
                    fsn=fsn,
                    semantic_tag="qualifier value",
                    pre_selected=pre_selected,
                    pre_selection_source=pre_selection_source,
                )
            )

        return options

    def _generate_temporal_options(
        self,
        extracted_modifiers: list[dict[str, Any]],
    ) -> list[QuestionOption]:
        """Generate fixed clinical course options.

        Source: Fixed SNOMED clinical course qualifier concepts.
        """
        options = []

        # Check for pre-selection from extracted modifiers
        extracted_course = None
        for mod in extracted_modifiers:
            mod_type = mod.get("modifier_type", mod.get("type", "")).lower()
            if mod_type in ("onset", "course", "clinical_course"):
                extracted_course = mod.get("value", "").lower()
                break

        for concept_id, term, fsn in CLINICAL_COURSE_OPTIONS:
            pre_selected = False
            pre_selection_source = ""
            if extracted_course and extracted_course in term.lower():
                pre_selected = True
                pre_selection_source = "text_modifier:course"

            options.append(
                QuestionOption(
                    concept_id=concept_id,
                    display_text=term,
                    fsn=fsn,
                    semantic_tag="qualifier value",
                    pre_selected=pre_selected,
                    pre_selection_source=pre_selection_source,
                )
            )

        return options

    async def _generate_attribute_options(
        self,
        gap: Gap,
        max_options: int,
        extracted_modifiers: list[dict[str, Any]],
    ) -> list[QuestionOption]:
        """Generate options for a generic MRCM attribute.

        Source: get_attribute_range() or ECL based on attribute constraint.
        """
        options = []

        if not gap.attribute_id:
            return options

        try:
            # Get attribute range values
            range_values = self._extractor.get_attribute_range(gap.attribute_id)

            for value in range_values[:max_options]:
                # Check for pre-selection
                pre_selected = False
                pre_selection_source = ""

                for mod in extracted_modifiers:
                    mod_value = mod.get("value", "").lower()
                    if mod_value in value.term.lower():
                        pre_selected = True
                        pre_selection_source = f"text_modifier:{mod.get('modifier_type', mod.get('type', ''))}"
                        break

                options.append(
                    QuestionOption(
                        concept_id=value.id,
                        display_text=value.term,
                        fsn=value.fsn,
                        semantic_tag=value.semantic_tag if hasattr(value, 'semantic_tag') else "",
                        pre_selected=pre_selected,
                        pre_selection_source=pre_selection_source,
                    )
                )

        except Exception as e:
            logger.error("Failed to generate attribute options for %s: %s", gap.attribute_id, e)

        return options

    async def _generate_disambiguation_options(
        self,
        gap: Gap,
        max_options: int,
        extracted_modifiers: list[dict[str, Any]],
    ) -> list[QuestionOption]:
        """Generate options for disambiguation.

        Source: Search results with different semantic tags.
        """
        options = []

        # Get matches from gap context
        matches = gap.context.get("matches", [])

        for match in matches[:max_options]:
            options.append(
                QuestionOption(
                    concept_id=match.get("concept_id", ""),
                    display_text=match.get("term", ""),
                    fsn=match.get("fsn", ""),
                    semantic_tag=match.get("semantic_tag", ""),
                    pre_selected=False,
                    pre_selection_source="",
                )
            )

        return options

    async def generate_options_from_ecl(
        self,
        ecl: str,
        max_options: int = 10,
    ) -> list[QuestionOption]:
        """Generate options by executing an ECL expression.

        Args:
            ecl: ECL expression to execute.
            max_options: Maximum options to return.

        Returns:
            List of QuestionOption objects from ECL results.
        """
        options = []

        try:
            concepts = await self._extractor.execute_ecl(ecl, max_options, True)
            for concept in concepts:
                options.append(
                    QuestionOption(
                        concept_id=concept.concept_id,
                        display_text=concept.term,
                        fsn=concept.fsn,
                        semantic_tag=concept.semantic_tag,
                        pre_selected=False,
                        pre_selection_source="",
                    )
                )
        except Exception as e:
            logger.error("Failed to generate options from ECL '%s': %s", ecl, e)

        return options

    async def generate_sibling_options(
        self,
        concept_id: str,
        max_options: int = 10,
    ) -> list[QuestionOption]:
        """Generate options from concept siblings.

        Args:
            concept_id: The concept to find siblings for.
            max_options: Maximum options to return.

        Returns:
            List of QuestionOption objects (siblings of the concept).
        """
        options = []

        try:
            # Get parents first
            parents = await self._extractor.get_parents(concept_id)

            sibling_ids = set()
            for parent in parents:
                children_result = await self._extractor.get_children(parent.concept_id)
                for child in children_result.concepts:
                    if child.concept_id != concept_id:
                        sibling_ids.add(child.concept_id)

            # Get details for siblings
            for sib_id in list(sibling_ids)[:max_options]:
                sib = await self._extractor.get_concept(sib_id)
                if sib:
                    options.append(
                        QuestionOption(
                            concept_id=sib.concept_id,
                            display_text=sib.term,
                            fsn=sib.fsn,
                            semantic_tag=sib.semantic_tag,
                            pre_selected=False,
                            pre_selection_source="",
                        )
                    )

        except Exception as e:
            logger.error("Failed to generate sibling options for %s: %s", concept_id, e)

        return options
