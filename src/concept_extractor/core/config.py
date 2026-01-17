"""Configuration for concept extractor."""

from dataclasses import dataclass, field
from functools import lru_cache
from os import environ
from pathlib import Path

from dotenv import load_dotenv

# Load .env file from project root
_project_root = Path(__file__).parent.parent.parent.parent
_env_file = _project_root / ".env"
if _env_file.exists():
    load_dotenv(_env_file)


@dataclass
class SnomedApiConfig:
    """SNOMED API configuration."""

    base_url: str = field(
        default_factory=lambda: environ.get("SNOMED_API_BASE_URL", "http://localhost:8010")
    )
    timeout: float = field(
        default_factory=lambda: float(environ.get("SNOMED_API_TIMEOUT", "30.0"))
    )


@dataclass
class ConceptExtractorSettings:
    """Concept extractor settings."""

    snomed_api: SnomedApiConfig = field(default_factory=SnomedApiConfig)

    # Paths (relative to project root)
    project_root: Path = field(default_factory=lambda: _project_root)
    config_dir: Path = field(default_factory=lambda: _project_root / "config")
    synonyms_path: Path = field(
        default_factory=lambda: _project_root / "config" / "synonyms.csv"
    )
    mrcm_path: Path = field(
        default_factory=lambda: _project_root / "config" / "mrcm-ranges.json"
    )


@lru_cache
def get_settings() -> ConceptExtractorSettings:
    """Get cached settings instance."""
    return ConceptExtractorSettings()
