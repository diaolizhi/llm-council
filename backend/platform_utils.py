"""Cross-platform utilities for user data directories."""

import os
import sys
import stat
from pathlib import Path

APP_NAME = "LLMCouncil"


def get_user_data_dir() -> Path:
    """
    Get the platform-appropriate user data directory.

    - Windows: %APPDATA%/LLMCouncil
    - macOS: ~/Library/Application Support/LLMCouncil
    - Linux: ~/.config/LLMCouncil
    """
    if sys.platform == "win32":
        base = os.environ.get("APPDATA", os.path.expanduser("~"))
        return Path(base) / APP_NAME
    elif sys.platform == "darwin":
        return Path.home() / "Library" / "Application Support" / APP_NAME
    else:
        # Linux and other Unix-like systems
        xdg_config = os.environ.get("XDG_CONFIG_HOME", os.path.expanduser("~/.config"))
        return Path(xdg_config) / APP_NAME


def ensure_data_dir() -> Path:
    """Ensure the user data directory exists and return its path."""
    data_dir = get_user_data_dir()
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir


def get_config_file_path() -> Path:
    """Get the path to the main configuration file."""
    return ensure_data_dir() / "config.json"


def get_sessions_dir() -> Path:
    """Get the path to the sessions storage directory."""
    sessions_dir = ensure_data_dir() / "sessions"
    sessions_dir.mkdir(parents=True, exist_ok=True)
    return sessions_dir


def secure_file_permissions(file_path: Path) -> None:
    """
    Set secure file permissions (owner read/write only) on Unix systems.
    On Windows, this is a no-op as file permissions work differently.
    """
    if sys.platform != "win32" and file_path.exists():
        os.chmod(file_path, stat.S_IRUSR | stat.S_IWUSR)  # 600


def is_desktop_mode() -> bool:
    """Check if running in desktop mode (PyWebView) vs development mode."""
    return os.environ.get("LLM_COUNCIL_DESKTOP", "").lower() in ("1", "true", "yes")
