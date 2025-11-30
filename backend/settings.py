"""Persistent settings storage for Prompt Optimizer."""

import json
import os
from copy import deepcopy
from pathlib import Path
from typing import Dict, Any, List

from .config import (
    OPENROUTER_API_KEY,
    TEST_MODELS,
    SYNTHESIZER_MODEL,
    GENERATOR_MODEL,
)
from .platform_utils import get_user_data_dir, ensure_data_dir, secure_file_permissions, is_desktop_mode

# Use platform-appropriate data directory in desktop mode, otherwise use local data/
def _get_data_dir() -> str:
    if is_desktop_mode():
        return str(ensure_data_dir())
    return "data"

def _get_settings_file() -> str:
    if is_desktop_mode():
        return str(get_user_data_dir() / "settings.json")
    return os.path.join("data", "settings.json")

DEFAULT_BUILTIN_PROMPTS = [
    {
        "id": "title-generator",
        "title": "Generate Prompt Title",
        "description": "System prompt used to summarize a prompt into a short title.",
        "prompt": (
            "You are a prompt titling assistant. Generate a concise, 4-12 character (or word-equivalent) "
            "title that summarizes the following prompt. Return ONLY the title text without quotes or explanations."
        ),
    },
    {
        "id": "initial-prompt-generator",
        "title": "Generate Initial Prompt",
        "description": "System prompt used when creating a prompt from the user's objective.",
        "prompt": (
            "You are a prompt engineering expert. The user wants to create a prompt for the following purpose:\n"
            "{OBJECTIVE}\n"
            "Generate a well-structured, effective prompt that accomplishes this goal. The prompt should be clear, "
            "specific, include relevant context/instructions, and be ready to use with various LLMs. Return ONLY the prompt."
        ),
    },
    {
        "id": "improvement-suggestion",
        "title": "Generate Optimization Suggestions",
        "description": "System prompt used when asking models to suggest prompt improvements.",
        "prompt": (
            "You are a prompt engineering expert. Given the current prompt and recent test outputs/feedback, suggest "
            "specific improvements that address feedback, improve clarity, and boost effectiveness. Return only the improved "
            "prompt wrapped in <prompt>...</prompt>."
        ),
    },
]

DEFAULT_SETTINGS = {
    "openrouter_api_key": OPENROUTER_API_KEY,
    "built_in_prompts": DEFAULT_BUILTIN_PROMPTS,
    "test_models": TEST_MODELS,
    "synthesizer_model": SYNTHESIZER_MODEL,
    "generator_model": GENERATOR_MODEL,
}


def _ensure_data_dir():
    data_dir = _get_data_dir()
    Path(data_dir).mkdir(parents=True, exist_ok=True)


def _write_settings(settings: Dict[str, Any]):
    settings_file = _get_settings_file()
    with open(settings_file, "w", encoding="utf-8") as f:
        json.dump(settings, f, indent=2, ensure_ascii=False)
    # Set secure permissions in desktop mode
    if is_desktop_mode():
        secure_file_permissions(Path(settings_file))


def get_settings() -> Dict[str, Any]:
    """
    Load settings from disk, falling back to defaults when needed.
    """
    _ensure_data_dir()
    settings_file = _get_settings_file()
    raw = {}
    if os.path.exists(settings_file):
        try:
            with open(settings_file, "r", encoding="utf-8") as f:
                raw = json.load(f) or {}
        except json.JSONDecodeError:
            raw = {}

    settings = deepcopy(DEFAULT_SETTINGS)
    for key in DEFAULT_SETTINGS:
        if key in raw:
            settings[key] = raw[key]

    # Ensure built-in prompts are populated even if prior settings were empty
    if not settings.get("built_in_prompts"):
        settings["built_in_prompts"] = deepcopy(DEFAULT_BUILTIN_PROMPTS)

    if not os.path.exists(settings_file):
        _write_settings(settings)

    return deepcopy(settings)


def get_builtin_prompt(prompt_id: str) -> str:
    """
    Retrieve a built-in prompt text by id.
    """
    settings = get_settings()
    for prompt in settings.get("built_in_prompts", []):
        if prompt.get("id") == prompt_id:
            return prompt.get("prompt", "")
    return ""


def save_settings(updates: Dict[str, Any]) -> Dict[str, Any]:
    """
    Persist the provided settings updates.
    """
    settings = get_settings()
    for key, value in updates.items():
        if key in DEFAULT_SETTINGS:
            settings[key] = value

    _write_settings(settings)
    return deepcopy(settings)
