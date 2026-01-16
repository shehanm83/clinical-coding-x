"""Configuration management using python-dotenv and dataclasses."""

from dataclasses import dataclass, field
from functools import lru_cache
from os import environ
from pathlib import Path

from dotenv import load_dotenv

# Load .env file from project root
_project_root = Path(__file__).parent.parent.parent
_env_file = _project_root / ".env"
if _env_file.exists():
    load_dotenv(_env_file)


@dataclass
class LLMConfig:
    """LLM provider configuration."""

    provider: str = field(default_factory=lambda: environ.get("LLM_PROVIDER", "openai"))
    model: str = field(default_factory=lambda: environ.get("LLM_MODEL", "gpt-4o-mini"))
    api_key: str = field(default_factory=lambda: environ.get("LLM_API_KEY", ""))
    api_base: str = field(default_factory=lambda: environ.get("LLM_API_BASE", "https://api.openai.com/v1"))
    temperature: float = field(default_factory=lambda: float(environ.get("LLM_TEMPERATURE", "0.1")))
    max_tokens: int = field(default_factory=lambda: int(environ.get("LLM_MAX_TOKENS", "4096")))
    context_length: int = field(default_factory=lambda: int(environ.get("LLM_CONTEXT_LENGTH", "128000")))
    timeout: float = field(default_factory=lambda: float(environ.get("LLM_TIMEOUT", "30.0")))
    max_retries: int = field(default_factory=lambda: int(environ.get("LLM_MAX_RETRIES", "3")))


@dataclass
class Settings:
    """Application settings."""

    llm: LLMConfig = field(default_factory=LLMConfig)

    # Paths (relative to project root)
    project_root: Path = field(default_factory=lambda: _project_root)
    config_dir: Path = field(default_factory=lambda: _project_root / "config")
    prompts_dir: Path = field(default_factory=lambda: _project_root / "prompts")
    abbreviations_path: Path = field(default_factory=lambda: _project_root / "config" / "abbreviations.csv")


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# For backwards compatibility
LLMProviderSettings = LLMConfig
