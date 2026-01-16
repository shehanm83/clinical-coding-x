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

from shared.config import LLMConfig, get_settings

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

        # With custom config
        from shared.config import LLMConfig
        config = LLMConfig()
        config.model = "gpt-4o"
        client = LLMClient(config)
    """

    def __init__(self, config: LLMConfig | None = None):
        """Initialize LLM client.

        Args:
            config: LLM configuration. If None, loads from environment.
        """
        self.config = config or get_settings().llm
        self._configure_litellm()

    def _configure_litellm(self) -> None:
        """Configure LiteLLM based on settings."""
        import os

        # Set API key in environment for LiteLLM
        if self.config.api_key:
            provider = self.config.provider
            if provider == "openai":
                os.environ["OPENAI_API_KEY"] = self.config.api_key
            elif provider == "anthropic":
                os.environ["ANTHROPIC_API_KEY"] = self.config.api_key
            elif provider == "azure":
                os.environ["AZURE_API_KEY"] = self.config.api_key

        # Configure request timeout
        litellm.request_timeout = self.config.timeout

    def _get_completion_kwargs(self) -> dict:
        """Build kwargs for litellm completion call."""
        kwargs = {
            "model": self.config.model,
            "temperature": self.config.temperature,
            "max_tokens": self.config.max_tokens,
            "num_retries": self.config.max_retries,
        }

        # Add api_base for custom endpoints
        if self.config.api_base and self.config.provider != "openai":
            kwargs["api_base"] = self.config.api_base

        # Add api_key for providers that need it in the call
        if self.config.api_key and self.config.provider in ("custom", "lm_studio"):
            kwargs["api_key"] = self.config.api_key or "not-needed"

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

        logger.debug(f"Sending completion request to {self.config.model}")

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

        logger.debug(f"Sending sync completion request to {self.config.model}")

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
