"""Tests for MRCM config provider."""

import json
import tempfile
from pathlib import Path

import pytest

from concept_extractor.core.mrcm import (
    CLINICAL_COURSE_ATTR_ID,
    LATERALITY_ATTR_ID,
    SEVERITY_ATTR_ID,
    MrcmConfigProvider,
)


@pytest.fixture
def sample_mrcm_config():
    """Sample MRCM config for testing."""
    return {
        "metadata": {
            "description": "Test MRCM config",
        },
        "attributes": {
            SEVERITY_ATTR_ID: {
                "name": "Severity",
                "is_qualifier": True,
                "values": [
                    {"id": "255604002", "term": "Mild", "fsn": "Mild (qualifier value)", "semantic_tag": "qualifier value"},
                    {"id": "6736007", "term": "Moderate", "fsn": "Moderate (severity modifier)", "semantic_tag": "severity modifier"},
                    {"id": "24484000", "term": "Severe", "fsn": "Severe (severity modifier)", "semantic_tag": "severity modifier"},
                ],
            },
            LATERALITY_ATTR_ID: {
                "name": "Laterality",
                "is_qualifier": True,
                "values": [
                    {"id": "7771000", "term": "Left", "fsn": "Left (qualifier value)", "semantic_tag": "qualifier value"},
                    {"id": "24028007", "term": "Right", "fsn": "Right (qualifier value)", "semantic_tag": "qualifier value"},
                ],
            },
            CLINICAL_COURSE_ATTR_ID: {
                "name": "Clinical course",
                "is_qualifier": True,
                "values": [
                    {"id": "373933003", "term": "Acute", "fsn": "Acute (qualifier value)", "semantic_tag": "qualifier value"},
                    {"id": "90734009", "term": "Chronic", "fsn": "Chronic (qualifier value)", "semantic_tag": "qualifier value"},
                ],
            },
        },
    }


@pytest.fixture
def mrcm_provider(sample_mrcm_config):
    """Create an MrcmConfigProvider with sample data."""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
        json.dump(sample_mrcm_config, f)
        f.flush()
        provider = MrcmConfigProvider(f.name)
    return provider


def test_load_config(mrcm_provider):
    """Test that config is loaded correctly."""
    mrcm_provider.load()
    assert mrcm_provider.attribute_count == 3


def test_get_attribute_range(mrcm_provider):
    """Test getting attribute range values."""
    values = mrcm_provider.get_attribute_range(SEVERITY_ATTR_ID)

    assert len(values) == 3
    terms = [v.term for v in values]
    assert "Mild" in terms
    assert "Moderate" in terms
    assert "Severe" in terms


def test_get_attribute_range_nonexistent(mrcm_provider):
    """Test getting range for nonexistent attribute."""
    values = mrcm_provider.get_attribute_range("999999999")
    assert len(values) == 0


def test_has_attribute(mrcm_provider):
    """Test checking attribute existence."""
    assert mrcm_provider.has_attribute(SEVERITY_ATTR_ID)
    assert not mrcm_provider.has_attribute("999999999")


def test_get_attribute_name(mrcm_provider):
    """Test getting attribute name."""
    assert mrcm_provider.get_attribute_name(SEVERITY_ATTR_ID) == "Severity"
    assert mrcm_provider.get_attribute_name(LATERALITY_ATTR_ID) == "Laterality"
    assert mrcm_provider.get_attribute_name("999999999") is None


def test_attribute_ids(mrcm_provider):
    """Test getting list of attribute IDs."""
    ids = mrcm_provider.attribute_ids
    assert SEVERITY_ATTR_ID in ids
    assert LATERALITY_ATTR_ID in ids
    assert CLINICAL_COURSE_ATTR_ID in ids


def test_metadata(mrcm_provider):
    """Test accessing metadata."""
    metadata = mrcm_provider.metadata
    assert "description" in metadata
    assert metadata["description"] == "Test MRCM config"


def test_get_valid_attributes_requires_snomed_client(mrcm_provider):
    """Test that get_valid_attributes returns empty without SNOMED client.

    Proper MRCM validation requires querying the SNOMED hierarchy via
    get_valid_attributes_async(). The sync method is a fallback that
    returns empty to indicate SNOMED client is needed.
    """
    # Without SNOMED client, should return empty list
    attrs = mrcm_provider.get_valid_attributes(
        concept_id="12345",
        semantic_tag="finding",
        concept_term="Chest pain",
    )
    assert len(attrs) == 0


def test_missing_file():
    """Test handling of missing config file."""
    provider = MrcmConfigProvider("/nonexistent/path.json")
    provider.load()

    assert provider.attribute_count == 0
    assert provider.get_attribute_range(SEVERITY_ATTR_ID) == []
