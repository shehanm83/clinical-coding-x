"""LLM client wrapper using LiteLLM for multi-provider support.

Supports:
- OpenAI (GPT-4, GPT-3.5, etc.)
- Ollama (local models)
- LM Studio (local models)
- Azure OpenAI
- Anthropic Claude
- Any OpenAI-compatible endpoint
"""

import logging
from dataclasses import dataclass

import litellm
from litellm import acompletion, completion

from shared.config import LLMProviderSettings, get_settings

logger = logging.getLogger(__name__)

# Suppress LiteLLM's verbose logging
litellm.suppress_debug_info = True


@dataclass
class LLMResponse:
    """Standardized response from LLM."""

    content: str
    model: str
    usage: dict | None = None
    finish_reason: str | None = None


class LLMClient:
    """Unified LLM client supporting multiple providers via LiteLLM.

    Example usage:
        # Using default settings from .env
        client = LLMClient()
        response = await client.complete("Normalize this text: HELLO WORLD")

        # With custom settings
        from shared.config import LLMProviderSettings
        settings = LLMProviderSettings(
            provider="ollama",
            model="ollama/llama3",
            api_base="http://localhost:11434"
        )
        client = LLMClient(settings)
        response = await client.complete("Hello!")
    """

    def __init__(self, settings: LLMProviderSettings | None = None):
        """Initialize LLM client.

        Args:
            settings: Provider settings. If None, loads from environment.
        """
        self.settings = settings or get_settings().llm
        self._configure_litellm()

    def _configure_litellm(self) -> None:
        """Configure LiteLLM based on settings."""
        # Set API key if provided
        if self.settings.api_key:
            # LiteLLM reads from environment, so set it there
            import os

            provider = self.settings.provider
            if provider == "openai":
                os.environ["OPENAI_API_KEY"] = self.settings.api_key
            elif provider == "anthropic":
                os.environ["ANTHROPIC_API_KEY"] = self.settings.api_key
            elif provider == "azure":
                os.environ["AZURE_API_KEY"] = self.settings.api_key

        # Configure request timeout
        litellm.request_timeout = self.settings.timeout

    def _get_completion_kwargs(self) -> dict:
        """Build kwargs for litellm completion call."""
        kwargs = {
            "model": self.settings.model,
            "temperature": self.settings.temperature,
            "max_tokens": self.settings.max_tokens,
            "num_retries": self.settings.max_retries,
        }

        # Add api_base for local/custom providers
        if self.settings.api_base:
            kwargs["api_base"] = self.settings.api_base

        # Add api_key if set (for providers that need it in the call)
        if self.settings.api_key and self.settings.provider in ("custom", "lm_studio"):
            kwargs["api_key"] = self.settings.api_key or "not-needed"

        return kwargs

    async def complete(
        self,
        prompt: str,
        system_prompt: str | None = None,
        **kwargs,
    ) -> LLMResponse:
        """Send async completion request to LLM.

        Args:
            prompt: User prompt/message
            system_prompt: Optional system prompt
            **kwargs: Additional kwargs passed to litellm

        Returns:
            LLMResponse with generated content
        """
        messages = []

        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        messages.append({"role": "user", "content": prompt})

        completion_kwargs = self._get_completion_kwargs()
        completion_kwargs.update(kwargs)
        completion_kwargs["messages"] = messages

        logger.debug(f"Sending completion request to {self.settings.model}")

        try:
            response = await acompletion(**completion_kwargs)

            return LLMResponse(
                content=response.choices[0].message.content,
                model=response.model,
                usage=dict(response.usage) if response.usage else None,
                finish_reason=response.choices[0].finish_reason,
            )
        except Exception as e:
            logger.error(f"LLM completion failed: {e}")
            raise

    def complete_sync(
        self,
        prompt: str,
        system_prompt: str | None = None,
        **kwargs,
    ) -> LLMResponse:
        """Send sync completion request to LLM.

        Args:
            prompt: User prompt/message
            system_prompt: Optional system prompt
            **kwargs: Additional kwargs passed to litellm

        Returns:
            LLMResponse with generated content
        """
        messages = []

        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        messages.append({"role": "user", "content": prompt})

        completion_kwargs = self._get_completion_kwargs()
        completion_kwargs.update(kwargs)
        completion_kwargs["messages"] = messages

        logger.debug(f"Sending sync completion request to {self.settings.model}")

        try:
            response = completion(**completion_kwargs)

            return LLMResponse(
                content=response.choices[0].message.content,
                model=response.model,
                usage=dict(response.usage) if response.usage else None,
                finish_reason=response.choices[0].finish_reason,
            )
        except Exception as e:
            logger.error(f"LLM completion failed: {e}")
            raise

    async def complete_with_history(
        self,
        messages: list[dict],
        **kwargs,
    ) -> LLMResponse:
        """Send completion with full message history.

        Args:
            messages: List of message dicts with 'role' and 'content'
            **kwargs: Additional kwargs passed to litellm

        Returns:
            LLMResponse with generated content
        """
        completion_kwargs = self._get_completion_kwargs()
        completion_kwargs.update(kwargs)
        completion_kwargs["messages"] = messages

        try:
            response = await acompletion(**completion_kwargs)

            return LLMResponse(
                content=response.choices[0].message.content,
                model=response.model,
                usage=dict(response.usage) if response.usage else None,
                finish_reason=response.choices[0].finish_reason,
            )
        except Exception as e:
            logger.error(f"LLM completion failed: {e}")
            raise


# Factory functions for common provider configurations
def create_openai_client(
    model: str = "gpt-4o-mini",
    api_key: str | None = None,
) -> LLMClient:
    """Create an OpenAI client.

    Args:
        model: OpenAI model name (without prefix)
        api_key: OpenAI API key (or set OPENAI_API_KEY env var)
    """
    settings = LLMProviderSettings(
        provider="openai",
        model=f"openai/{model}",
        api_key=api_key,
    )
    return LLMClient(settings)


def create_ollama_client(
    model: str = "llama3",
    api_base: str = "http://localhost:11434",
) -> LLMClient:
    """Create an Ollama client.

    Args:
        model: Ollama model name (without prefix)
        api_base: Ollama server URL
    """
    settings = LLMProviderSettings(
        provider="ollama",
        model=f"ollama/{model}",
        api_base=api_base,
    )
    return LLMClient(settings)


def create_lm_studio_client(
    model: str = "local-model",
    api_base: str = "http://localhost:1234/v1",
) -> LLMClient:
    """Create an LM Studio client.

    Args:
        model: Model name in LM Studio
        api_base: LM Studio server URL
    """
    settings = LLMProviderSettings(
        provider="lm_studio",
        model=f"lm_studio/{model}",
        api_base=api_base,
        api_key="not-needed",  # LM Studio doesn't require API key
    )
    return LLMClient(settings)


def create_custom_openai_compatible_client(
    model: str,
    api_base: str,
    api_key: str | None = None,
) -> LLMClient:
    """Create a client for any OpenAI-compatible endpoint.

    Args:
        model: Model name
        api_base: Server URL (e.g., http://localhost:8000/v1)
        api_key: API key if required
    """
    settings = LLMProviderSettings(
        provider="custom",
        model=f"openai/{model}",
        api_base=api_base,
        api_key=api_key or "not-needed",
    )
    return LLMClient(settings)
