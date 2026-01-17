"""Tests for synonym lookup functionality."""

import tempfile
from pathlib import Path

import pytest

from concept_extractor.core.synonyms import SynonymLookup


@pytest.fixture
def sample_csv_content():
    """Sample CSV content for testing."""
    return """Lay_Term,SNOMED_Preferred
# Comments should be ignored
shortness of breath,Dyspnea
SOB,Dyspnea
heart attack,Myocardial infarction
MI,Myocardial infarction
the runs,Diarrhea
"""


@pytest.fixture
def synonym_lookup(sample_csv_content):
    """Create a SynonymLookup with sample data."""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
        f.write(sample_csv_content)
        f.flush()
        lookup = SynonymLookup(f.name)
    return lookup


def test_load_synonyms(synonym_lookup):
    """Test that synonyms are loaded correctly."""
    assert synonym_lookup.is_loaded
    assert synonym_lookup.synonym_count == 5


def test_get_snomed_term(synonym_lookup):
    """Test direct lookup of SNOMED terms."""
    assert synonym_lookup.get_snomed_term("SOB") == "Dyspnea"
    assert synonym_lookup.get_snomed_term("sob") == "Dyspnea"  # Case insensitive
    assert synonym_lookup.get_snomed_term("heart attack") == "Myocardial infarction"
    assert synonym_lookup.get_snomed_term("unknown term") is None


def test_get_expansions(synonym_lookup):
    """Test finding lay terms in text."""
    expansions = synonym_lookup.get_expansions("Patient has SOB and chest pain")

    assert len(expansions) == 1
    assert expansions[0].lay_term == "sob"
    assert expansions[0].snomed_term == "Dyspnea"


def test_get_expansions_multiple(synonym_lookup):
    """Test finding multiple lay terms in text."""
    expansions = synonym_lookup.get_expansions("Patient had MI and now has the runs")

    assert len(expansions) == 2
    terms = {e.lay_term for e in expansions}
    snomed = {e.snomed_term for e in expansions}

    assert "mi" in terms
    assert "the runs" in terms
    assert "Myocardial infarction" in snomed
    assert "Diarrhea" in snomed


def test_get_expansions_deduplicates_snomed(synonym_lookup):
    """Test that duplicate SNOMED terms are deduplicated."""
    # Both SOB and shortness of breath map to Dyspnea
    expansions = synonym_lookup.get_expansions("SOB, shortness of breath")

    # Should only get one Dyspnea expansion
    snomed_terms = [e.snomed_term for e in expansions]
    assert snomed_terms.count("Dyspnea") == 1


def test_expand_query(synonym_lookup):
    """Test query expansion with SNOMED terms."""
    expanded = synonym_lookup.expand_query("Patient has SOB and MI")

    # Original text should be preserved
    assert "Patient has SOB and MI" in expanded
    # SNOMED terms should be appended
    assert "Dyspnea" in expanded
    assert "Myocardial infarction" in expanded


def test_expand_query_no_matches(synonym_lookup):
    """Test query expansion with no matching terms."""
    text = "Patient has headache and fever"
    expanded = synonym_lookup.expand_query(text)

    # Should return original text unchanged
    assert expanded == text


def test_word_boundary_matching(synonym_lookup):
    """Test that matching respects word boundaries."""
    # "MI" should not match in "FAMILY" or "MILD"
    expansions = synonym_lookup.get_expansions("FAMILY history, MILD pain")

    assert len(expansions) == 0


def test_missing_file():
    """Test handling of missing CSV file."""
    lookup = SynonymLookup("/nonexistent/path.csv")

    assert not lookup.is_loaded
    assert lookup.synonym_count == 0
    assert lookup.get_snomed_term("SOB") is None


def test_empty_file():
    """Test handling of empty CSV file."""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
        f.write("Lay_Term,SNOMED_Preferred\n")  # Header only
        f.flush()
        lookup = SynonymLookup(f.name)

    assert lookup.is_loaded
    assert lookup.synonym_count == 0
