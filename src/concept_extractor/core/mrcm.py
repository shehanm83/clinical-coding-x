"""MRCM configuration-based provider with dynamic SNOMED hierarchy checks.

Loads attribute ranges from pre-extracted JSON config file.
Uses SNOMED client for dynamic attribute applicability checks based on
the actual SNOMED CT hierarchy - no hardcoded concept lists.

This provider enables question generation by providing:
- get_valid_attributes_async(): Returns clinically relevant attributes for a concept
- get_attribute_range(): Returns valid SNOMED values for an attribute
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import TYPE_CHECKING, Any

from concept_extractor.core.models import AttributeDefinition, AttributeValue

if TYPE_CHECKING:
    from concept_extractor.core.snomed_client import SnomedClient

logger = logging.getLogger(__name__)

# Well-known SNOMED CT concept IDs - these are stable identifiers in SNOMED
# See: https://browser.ihtsdotools.org/
#
# These IDs are used for querying the SNOMED hierarchy, NOT for hardcoding
# business logic. All validation is done by querying snomed-service.
CHRONIC_DISEASE_CONCEPT = "27624003"  # Chronic disease (disorder)
FINDING_SITE_ATTR = "363698007"  # Finding site (attribute)
LATERALITY_ATTR_ID = "272741003"  # Laterality (attribute)
CLINICAL_COURSE_ATTR_ID = "263502005"  # Clinical course (attribute)
OCCURRENCE_ATTR_ID = "246454002"  # Occurrence (attribute)
SEVERITY_ATTR_ID = "246112005"  # Severity (attribute)
PATHOLOGICAL_PROCESS_ATTR_ID = "370135005"  # Pathological process (attribute)


class MrcmConfigProvider:
    """Provides MRCM attribute data from config file with dynamic SNOMED checks.

    This provider loads pre-extracted MRCM attribute ranges from a JSON
    config file. When a SNOMED client is provided, it also makes dynamic
    checks against the SNOMED hierarchy to determine attribute applicability.
    """

    def __init__(self, config_path: Path | str) -> None:
        """Initialize provider with config file path.

        Args:
            config_path: Path to mrcm-ranges.json file.
        """
        self._config_path = Path(config_path)
        self._data: dict[str, Any] = {}
        self._loaded = False
        self._snomed_client: SnomedClient | None = None

    def set_snomed_client(self, client: SnomedClient) -> None:
        """Set SNOMED client for dynamic hierarchy checks.

        Args:
            client: Initialized SnomedClient instance.
        """
        self._snomed_client = client
        logger.info("MRCM provider: SNOMED client set, dynamic checks enabled")

    def load(self) -> None:
        """Load config file into memory."""
        if self._loaded:
            return

        if not self._config_path.exists():
            logger.warning(
                "MRCM config not found at %s, using empty config.",
                self._config_path,
            )
            self._data = {"metadata": {}, "attributes": {}}
            self._loaded = True
            return

        try:
            with open(self._config_path, encoding="utf-8") as f:
                self._data = json.load(f)

            attr_count = len(self._data.get("attributes", {}))
            logger.info(
                "Loaded MRCM config with %d attributes from %s",
                attr_count,
                self._config_path,
            )
            self._loaded = True

        except json.JSONDecodeError as e:
            logger.error("Failed to parse MRCM config: %s", e)
            self._data = {"metadata": {}, "attributes": {}}
            self._loaded = True

    async def get_valid_attributes_async(
        self,
        concept_id: str,
        semantic_tag: str | None = None,
        concept_term: str | None = None,
    ) -> list[AttributeDefinition]:
        """Get valid MRCM attributes using dynamic SNOMED hierarchy checks.

        Args:
            concept_id: SNOMED concept ID.
            semantic_tag: Semantic tag from FSN (e.g., "disorder", "finding").
            concept_term: Preferred term for the concept.

        Returns:
            List of applicable attribute definitions.
        """
        self.load()

        # If no SNOMED client, fall back to keyword-based rules
        if not self._snomed_client:
            logger.debug("No SNOMED client, using keyword-based attribute rules")
            return self.get_valid_attributes(concept_id, semantic_tag, concept_term)

        # Normalize inputs
        tag_lower = (semantic_tag or "").lower().strip()

        # Semantic tags that should NOT get any qualifier questions
        excluded_tags = {
            "body structure",
            "substance",
            "qualifier value",
            "organism",
            "physical object",
            "attribute",
        }

        if tag_lower and any(excl in tag_lower for excl in excluded_tags):
            return []

        result: list[AttributeDefinition] = []

        try:
            # Get attributes already defined on this concept
            defined_attrs = await self._snomed_client.get_defined_attributes(concept_id)

            # Get concept's relationships to check Finding site
            rels_result = await self._snomed_client.get_relationships(
                concept_id, exclude_is_a=True
            )
            finding_site_id = None
            for rel in rels_result.relationships:
                if rel.type_id == FINDING_SITE_ATTR:
                    finding_site_id = rel.destination_id
                    break

            # Check if chronic disease via SNOMED hierarchy
            is_chronic = await self._is_descendant_of_chronic(concept_id)

            # Build attribute list based on dynamic checks
            for attr_id, attr_data in self._data.get("attributes", {}).items():
                # Skip if already defined on concept
                if attr_id in defined_attrs:
                    continue

                # Severity - always applicable for clinical findings
                if attr_id == SEVERITY_ATTR_ID:
                    result.append(self._build_attr_def(attr_id, attr_data))
                    continue

                # Laterality - only if Finding site is a lateralizable body part
                if attr_id == LATERALITY_ATTR_ID:
                    if finding_site_id:
                        is_lateralizable = await self._is_lateralizable_site(
                            finding_site_id
                        )
                        if is_lateralizable:
                            result.append(self._build_attr_def(attr_id, attr_data))
                    continue

                # Clinical course - only if NOT a chronic disease
                if attr_id == CLINICAL_COURSE_ATTR_ID:
                    if not is_chronic:
                        result.append(self._build_attr_def(attr_id, attr_data))
                    continue

                # Occurrence - only for finding semantic tag
                if attr_id == OCCURRENCE_ATTR_ID:
                    if tag_lower and "finding" in tag_lower:
                        result.append(self._build_attr_def(attr_id, attr_data))
                    continue

            return result

        except Exception as e:
            logger.warning(
                "Dynamic attribute check failed for %s: %s, falling back to keywords",
                concept_id,
                e,
            )
            return self.get_valid_attributes(concept_id, semantic_tag, concept_term)

    async def _is_descendant_of_chronic(self, concept_id: str) -> bool:
        """Check if concept is a chronic disease using SNOMED hierarchy.

        Queries the actual SNOMED CT hierarchy to determine if the concept
        is a descendant of "Chronic disease (disorder)" (27624003).

        Args:
            concept_id: SNOMED concept ID to check.

        Returns:
            True if the concept is a chronic disease.
        """
        if not self._snomed_client:
            return False

        try:
            ancestors = await self._snomed_client.get_ancestors(concept_id)
            return CHRONIC_DISEASE_CONCEPT in ancestors

        except Exception as e:
            logger.debug("Failed to check chronic ancestry for %s: %s", concept_id, e)
            return False

    async def _is_lateralizable_site(self, body_site_id: str) -> bool:
        """Check if a body site can have laterality using SNOMED MRCM.

        Queries snomed-service to determine if laterality is a valid attribute
        for this body structure according to MRCM rules.

        Args:
            body_site_id: SNOMED concept ID of the body structure.

        Returns:
            True if laterality is applicable to this body site.
        """
        if not self._snomed_client:
            return False

        try:
            # Check via MRCM if laterality is a valid attribute for this body site
            return await self._snomed_client.is_valid_attribute(
                body_site_id, LATERALITY_ATTR_ID
            )
        except Exception as e:
            logger.debug("Failed to check lateralizable site %s: %s", body_site_id, e)
            return False

    def _build_attr_def(
        self, attr_id: str, attr_data: dict[str, Any]
    ) -> AttributeDefinition:
        """Build attribute definition from data."""
        return AttributeDefinition(
            id=attr_id,
            name=attr_data.get("name", ""),
            is_qualifier=attr_data.get("is_qualifier", False),
            value_count=len(attr_data.get("values", [])),
        )

    def get_valid_attributes(
        self,
        concept_id: str,
        semantic_tag: str | None = None,
        concept_term: str | None = None,
    ) -> list[AttributeDefinition]:
        """Synchronous fallback - returns empty list when SNOMED client unavailable.

        For proper MRCM attribute validation, use get_valid_attributes_async()
        with a configured SNOMED client. This method exists only as a fallback
        when the async method cannot query SNOMED.

        Args:
            concept_id: SNOMED concept ID.
            semantic_tag: Semantic tag from the concept's FSN.
            concept_term: The concept's preferred term.

        Returns:
            Empty list - SNOMED client is required for proper attribute validation.
        """
        logger.warning(
            "get_valid_attributes called without SNOMED client for concept %s. "
            "SNOMED client is required for proper MRCM validation. Returning empty list.",
            concept_id,
        )
        return []

    def get_attribute_range(self, attribute_id: str) -> list[AttributeValue]:
        """Get valid range values for an attribute.

        Args:
            attribute_id: SNOMED attribute concept ID.

        Returns:
            List of valid value concepts.
        """
        self.load()

        attr_data = self._data.get("attributes", {}).get(attribute_id)
        if not attr_data:
            return []

        values = attr_data.get("values", [])
        return [
            AttributeValue(
                id=v.get("id", ""),
                term=v.get("term", ""),
                fsn=v.get("fsn", ""),
                semantic_tag=v.get("semantic_tag", ""),
            )
            for v in values
        ]

    def has_attribute(self, attribute_id: str) -> bool:
        """Check if we have range data for an attribute."""
        self.load()
        return attribute_id in self._data.get("attributes", {})

    def get_attribute_name(self, attribute_id: str) -> str | None:
        """Get the human-readable name for an attribute."""
        self.load()
        attr_data = self._data.get("attributes", {}).get(attribute_id)
        return attr_data.get("name") if attr_data else None

    @property
    def metadata(self) -> dict[str, Any]:
        """Get config metadata."""
        self.load()
        return self._data.get("metadata", {})

    @property
    def attribute_count(self) -> int:
        """Get number of attributes in the config."""
        self.load()
        return len(self._data.get("attributes", {}))

    @property
    def attribute_ids(self) -> list[str]:
        """Get list of available attribute IDs."""
        self.load()
        return list(self._data.get("attributes", {}).keys())
