"""Configuration for the Prompt Optimizer."""

import os
from dotenv import load_dotenv

load_dotenv()

# OpenRouter API key
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Test models - LLMs used to test prompts
TEST_MODELS = [
    "x-ai/grok-4.1-fast:free",
    "tngtech/deepseek-r1t2-chimera:free",
    "kwaipilot/kat-coder-pro:free",
]

# Synthesizer model - merges improvement suggestions
SYNTHESIZER_MODEL = "x-ai/grok-4.1-fast:free"

# Generator model - generates initial prompts from objectives
GENERATOR_MODEL = "x-ai/grok-4.1-fast:free"

# OpenRouter API endpoint
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Data directory for session storage
DATA_DIR = "data/sessions"

# Legacy: Keep old config names for backward compatibility (will be removed)
COUNCIL_MODELS = TEST_MODELS  # Deprecated
CHAIRMAN_MODEL = SYNTHESIZER_MODEL  # Deprecated
