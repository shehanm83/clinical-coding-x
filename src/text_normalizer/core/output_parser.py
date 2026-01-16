"""Output parsing utilities for LLM responses."""

from __future__ import annotations

import re


def fix_json(text: str) -> str:
    """Attempt to fix common JSON issues in LLM output.

    Handles several common problems:
    1. JSON wrapped in markdown code blocks
    2. Trailing commas before closing braces/brackets
    3. Unclosed braces and brackets
    4. Truncated markdown blocks

    Args:
        text: Raw text potentially containing malformed JSON.

    Returns:
        Fixed JSON string ready for parsing.
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
            extracted = extract_json_object(text)
            if extracted:
                text = extracted
        elif arr_start >= 0:
            extracted = extract_json_array(text)
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


def extract_json_object(text: str) -> str | None:
    """Extract a JSON object from text.

    Args:
        text: Text containing a JSON object.

    Returns:
        Extracted JSON object string or None if not found.
    """
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


def extract_json_array(text: str) -> str | None:
    """Extract a JSON array from text.

    Args:
        text: Text containing a JSON array.

    Returns:
        Extracted JSON array string or None if not found.
    """
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
