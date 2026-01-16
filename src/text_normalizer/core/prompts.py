"""Prompt template management using Jinja2."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

from jinja2 import Environment, FileSystemLoader, TemplateNotFound, select_autoescape

logger = logging.getLogger(__name__)

REQUIRED_TEMPLATES = [
    "normalize.jinja2",
]


class PromptManager:
    """Manages Jinja2 prompt templates for text normalization.

    Attributes:
        templates_dir: Path to the directory containing Jinja2 templates.
    """

    def __init__(
        self,
        templates_dir: str | Path,
        *,
        validate_on_init: bool = True,
    ) -> None:
        """Initialize the prompt manager.

        Args:
            templates_dir: Directory containing Jinja2 template files.
            validate_on_init: If True, validate required templates exist.

        Raises:
            FileNotFoundError: If the templates directory does not exist.
            ValueError: If required templates are missing.
        """
        self.templates_dir = Path(templates_dir)

        if not self.templates_dir.exists():
            raise FileNotFoundError(f"Templates directory not found: {templates_dir}")

        if not self.templates_dir.is_dir():
            raise NotADirectoryError(f"Path is not a directory: {templates_dir}")

        self._env = Environment(
            loader=FileSystemLoader(self.templates_dir),
            autoescape=select_autoescape(["html", "xml"]),
            trim_blocks=True,
            lstrip_blocks=True,
        )

        self._env.filters["json_escape"] = self._json_escape
        self._env.filters["format_list"] = self._format_list

        logger.info("Loaded prompt templates from %s", self.templates_dir)

        if validate_on_init:
            self.validate_templates()

    def render(self, template_name: str, **kwargs: Any) -> str:
        """Render a prompt template with the provided variables.

        Args:
            template_name: Name of the template file.
            **kwargs: Variables to pass to the template.

        Returns:
            The rendered prompt string.
        """
        try:
            template = self._env.get_template(template_name)
            rendered = template.render(**kwargs)
            logger.debug(
                "Rendered template '%s' with %d variables",
                template_name,
                len(kwargs),
            )
            return rendered
        except TemplateNotFound:
            logger.error("Template not found: %s", template_name)
            raise

    def validate_templates(self, required: list[str] | None = None) -> dict[str, bool]:
        """Validate that required templates exist."""
        templates_to_check = required or REQUIRED_TEMPLATES
        results: dict[str, bool] = {}
        missing: list[str] = []

        for template_name in templates_to_check:
            try:
                self._env.get_template(template_name)
                results[template_name] = True
            except TemplateNotFound:
                results[template_name] = False
                missing.append(template_name)

        if missing:
            raise ValueError(
                f"Required templates missing from {self.templates_dir}: {missing}"
            )

        return results

    def list_templates(self) -> list[str]:
        """List all available template files."""
        return list(self._env.list_templates())

    @staticmethod
    def _json_escape(text: str) -> str:
        """Escape a string for JSON."""
        if not isinstance(text, str):
            text = str(text)
        return json.dumps(text)[1:-1]

    @staticmethod
    def _format_list(items: list[Any], separator: str = ", ") -> str:
        """Format a list as a string."""
        if not items:
            return ""
        return separator.join(str(item) for item in items)
