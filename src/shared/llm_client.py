"""LLM client wrapper using LiteLLM for multi-provider support.

Supports:
- OpenAI (GPT-4, GPT-3.5, etc.)
- Ollama (local models)
- LM Studio (local models)
- Azure OpenAI
- Anthropic Claude
- Any OpenAI-compatible endpoint
"""

import json
import logging
import re
import time
from dataclasses import dataclass
from typing import Any

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


@dataclass
class LLMJsonResponse:
    """Standardized JSON response from LLM."""

    data: dict[str, Any]
    model: str
    tokens_used: int = 0
    generation_time_ms: int = 0


def _fix_json(text: str) -> str:
    """Attempt to fix common JSON issues in LLM output.

    Handles:
    1. JSON wrapped in markdown code blocks
    2. Trailing commas before closing braces/brackets
    3. Unclosed braces and brackets
    """
    text = text.strip()

    # Extract JSON from markdown code blocks if present
    json_match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if json_match:
        text = json_match.group(1).strip()
    else:
        if text.startswith("```json"):
            text = text[7:].strip()
        elif text.startswith("```"):
            text = text[3:].strip()
        if text.endswith("```"):
            text = text[:-3].strip()

    # Extract JSON object or array
    if text:
        obj_start = text.find("{")
        arr_start = text.find("[")

        if obj_start >= 0 and (arr_start < 0 or obj_start < arr_start):
            extracted = _extract_json_object(text)
            if extracted:
                text = extracted
        elif arr_start >= 0:
            extracted = _extract_json_array(text)
            if extracted:
                text = extracted

    # Remove trailing commas
    text = re.sub(r",\s*([}\]])", r"\1", text)

    # Close unclosed brackets/braces
    open_braces = text.count("{") - text.count("}")
    open_brackets = text.count("[") - text.count("]")

    if open_brackets > 0:
        text += "]" * open_brackets
    if open_braces > 0:
        text += "}" * open_braces

    return text


def _extract_json_object(text: str) -> str | None:
    """Extract a JSON object from text."""
    start = text.find("{")
    if start == -1:
        return None

    depth = 0
    in_string = False
    escape_next = False

    for i, char in enumerate(text[start:], start):
        if escape_next:
            escape_next = False
            continue

        if char == "\\":
            escape_next = True
            continue

        if char == '"' and not escape_next:
            in_string = not in_string
            continue

        if in_string:
            continue

        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return text[start : i + 1]

    return None


def _extract_json_array(text: str) -> str | None:
    """Extract a JSON array from text."""
    start = text.find("[")
    if start == -1:
        return None

    depth = 0
    in_string = False
    escape_next = False

    for i, char in enumerate(text[start:], start):
        if escape_next:
            escape_next = False
            continue

        if char == "\\":
            escape_next = True
            continue

        if char == '"' and not escape_next:
            in_string = not in_string
            continue

        if in_string:
            continue

        if char == "[":
            depth += 1
        elif char == "]":
            depth -= 1
            if depth == 0:
                return text[start : i + 1]

    return None


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

    async def complete_json(
        self,
        prompt: str,
        system_prompt: str | None = None,
        **kwargs,
    ) -> LLMJsonResponse:
        """Send async completion request and parse JSON response.

        Args:
            prompt: User prompt (should request JSON output)
            system_prompt: Optional system prompt
            **kwargs: Additional kwargs passed to litellm

        Returns:
            LLMJsonResponse with parsed JSON data
        """
        start_time = time.time()

        response = await self.complete(prompt, system_prompt, **kwargs)

        raw_text = response.content
        fixed_text = _fix_json(raw_text)

        try:
            parsed_data = json.loads(fixed_text)
        except json.JSONDecodeError as e:
            logger.warning(
                "JSON parsing failed after fix attempt: %s (first 200 chars: %s)",
                str(e),
                raw_text[:200],
            )
            raise

        end_time = time.time()
        generation_time_ms = int((end_time - start_time) * 1000)

        tokens_used = 0
        if response.usage:
            tokens_used = response.usage.get("total_tokens", 0)

        return LLMJsonResponse(
            data=parsed_data,
            model=response.model,
            tokens_used=tokens_used,
            generation_time_ms=generation_time_ms,
        )

    def complete_json_sync(
        self,
        prompt: str,
        system_prompt: str | None = None,
        **kwargs,
    ) -> LLMJsonResponse:
        """Send sync completion request and parse JSON response.

        Args:
            prompt: User prompt (should request JSON output)
            system_prompt: Optional system prompt
            **kwargs: Additional kwargs passed to litellm

        Returns:
            LLMJsonResponse with parsed JSON data
        """
        start_time = time.time()

        response = self.complete_sync(prompt, system_prompt, **kwargs)

        raw_text = response.content
        fixed_text = _fix_json(raw_text)

        try:
            parsed_data = json.loads(fixed_text)
        except json.JSONDecodeError as e:
            logger.warning(
                "JSON parsing failed after fix attempt: %s (first 200 chars: %s)",
                str(e),
                raw_text[:200],
            )
            raise

        end_time = time.time()
        generation_time_ms = int((end_time - start_time) * 1000)

        tokens_used = 0
        if response.usage:
            tokens_used = response.usage.get("total_tokens", 0)

        return LLMJsonResponse(
            data=parsed_data,
            model=response.model,
            tokens_used=tokens_used,
            generation_time_ms=generation_time_ms,
        )
