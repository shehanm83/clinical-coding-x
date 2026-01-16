"""Configuration management using pydantic-settings.

Supports loading configuration from:
1. Environment variables
2. .env file in project root
3. Default values

Provider-specific prefixes for LiteLLM:
- OpenAI: openai/gpt-4o, openai/gpt-4o-mini, openai/gpt-3.5-turbo
- Ollama: ollama/llama3, ollama/mistral, ollama/codellama
- LM Studio: lm_studio/local-model or openai/local-model (with api_base)
- Azure: azure/deployment-name
- Anthropic: anthropic/claude-3-opus, anthropic/claude-3-sonnet
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class LLMProviderSettings(BaseSettings):
    """Settings for a specific LLM provider."""

    model_config = SettingsConfigDict(
        env_prefix="LLM_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Provider selection
    provider: Literal["openai", "ollama", "lm_studio", "azure", "anthropic", "custom"] = Field(
        default="openai",
        description="LLM provider to use",
    )

    # Model configuration
    model: str = Field(
        default="openai/gpt-4o-mini",
        description="Model identifier with provider prefix (e.g., openai/gpt-4o, ollama/llama3)",
    )

    # API configuration
    api_key: str | None = Field(
        default=None,
        description="API key for the provider (not needed for local providers)",
    )

    api_base: str | None = Field(
        default=None,
        description="Base URL for API (required for Ollama, LM Studio, custom endpoints)",
    )

    # Request settings
    temperature: float = Field(
        default=0.0,
        ge=0.0,
        le=2.0,
        description="Sampling temperature (0.0 = deterministic)",
    )

    max_tokens: int = Field(
        default=1024,
        gt=0,
        description="Maximum tokens in response",
    )

    timeout: float = Field(
        default=30.0,
        gt=0,
        description="Request timeout in seconds",
    )

    # Retry settings
    max_retries: int = Field(
        default=3,
        ge=0,
        description="Maximum number of retries on failure",
    )

    @field_validator("api_base", mode="before")
    @classmethod
    def normalize_api_base(cls, v: str | None) -> str | None:
        """Ensure api_base doesn't have trailing slash."""
        if v is not None:
            return v.rstrip("/")
        return v


class Settings(BaseSettings):
    """Main application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application settings
    app_name: str = Field(default="clinical-coding-x")
    debug: bool = Field(default=False)
    log_level: str = Field(default="INFO")

    # gRPC server settings
    grpc_host: str = Field(default="0.0.0.0")
    grpc_port: int = Field(default=50051)

    # LLM settings (nested)
    llm: LLMProviderSettings = Field(default_factory=LLMProviderSettings)

    def __init__(self, **kwargs):
        # Handle nested LLM settings from environment
        super().__init__(**kwargs)


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance.

    Returns cached settings for performance. Call Settings() directly
    if you need fresh settings (e.g., in tests).
    """
    return Settings()


# Provider-specific configuration helpers
PROVIDER_DEFAULTS = {
    "openai": {
        "api_base": None,  # Uses default OpenAI endpoint
        "models": ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    },
    "ollama": {
        "api_base": "http://localhost:11434",
        "models": ["llama3", "llama3.1", "mistral", "codellama", "phi3"],
    },
    "lm_studio": {
        "api_base": "http://localhost:1234/v1",
        "models": [],  # Dynamic based on loaded models
    },
    "azure": {
        "api_base": None,  # Set via AZURE_API_BASE
        "models": [],  # Deployment names
    },
    "anthropic": {
        "api_base": None,
        "models": ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
    },
}


def get_provider_model_string(provider: str, model: str) -> str:
    """Get the full model string with provider prefix for LiteLLM.

    Args:
        provider: Provider name (openai, ollama, lm_studio, etc.)
        model: Model name without prefix

    Returns:
        Full model string (e.g., "ollama/llama3")
    """
    # If model already has prefix, return as-is
    if "/" in model:
        return model

    # Map provider to LiteLLM prefix
    prefix_map = {
        "openai": "openai",
        "ollama": "ollama",
        "lm_studio": "lm_studio",
        "azure": "azure",
        "anthropic": "anthropic",
        "custom": "openai",  # Custom endpoints use openai prefix
    }

    prefix = prefix_map.get(provider, "openai")
    return f"{prefix}/{model}"
