"""Storage for optimization sessions with iteration-based data model."""

import json
import os
from datetime import datetime
from typing import Dict, List, Any, Optional
from pathlib import Path

# Data directory for session storage
DATA_DIR = "data/sessions"


def _ensure_data_dir():
    """Ensure the data directory exists."""
    Path(DATA_DIR).mkdir(parents=True, exist_ok=True)


def _get_session_path(session_id: str) -> str:
    """Get the file path for a session."""
    return os.path.join(DATA_DIR, f"{session_id}.json")


def create_session(session_id: str, title: str = "New Optimization Session", objective: Optional[str] = None) -> Dict[str, Any]:
    """
    Create a new optimization session.

    Args:
        session_id: Unique identifier for the session
        title: Session title
        objective: Optional objective description

    Returns:
        The created session dict
    """
    _ensure_data_dir()

    session = {
        "id": session_id,
        "created_at": datetime.now().isoformat(),
        "title": title,
        "objective": objective,
        "iterations": []
    }

    with open(_get_session_path(session_id), 'w', encoding='utf-8') as f:
        json.dump(session, f, indent=2, ensure_ascii=False)

    return session


def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a session by ID.

    Args:
        session_id: The session ID

    Returns:
        Session dict or None if not found
    """
    path = _get_session_path(session_id)
    if not os.path.exists(path):
        return None

    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def list_sessions() -> List[Dict[str, Any]]:
    """
    List all sessions with metadata.

    Returns:
        List of session metadata dicts
    """
    _ensure_data_dir()

    sessions = []
    for filename in os.listdir(DATA_DIR):
        if filename.endswith('.json'):
            session_id = filename[:-5]  # Remove .json
            session = get_session(session_id)
            if session:
                # Return metadata only
                sessions.append({
                    "id": session["id"],
                    "created_at": session["created_at"],
                    "title": session["title"],
                    "iteration_count": len(session.get("iterations", [])),
                    "last_modified": session.get("iterations", [{}])[-1].get("timestamp", session["created_at"]) if session.get("iterations") else session["created_at"]
                })

    # Sort by last modified, most recent first
    sessions.sort(key=lambda x: x["last_modified"], reverse=True)
    return sessions


def update_session_title(session_id: str, title: str):
    """
    Update session title.

    Args:
        session_id: The session ID
        title: New title
    """
    session = get_session(session_id)
    if session:
        session["title"] = title
        with open(_get_session_path(session_id), 'w', encoding='utf-8') as f:
            json.dump(session, f, indent=2, ensure_ascii=False)


def add_iteration(
    session_id: str,
    prompt: str,
    change_rationale: str,
    test_results: Optional[List[Dict[str, Any]]] = None,
    suggestions: Optional[List[Dict[str, Any]]] = None,
    user_decision: Optional[str] = None
) -> Dict[str, Any]:
    """
    Add a new iteration to a session.

    Args:
        session_id: The session ID
        prompt: The prompt text for this version
        change_rationale: Why this version was created
        test_results: Optional test results with model outputs, ratings, feedback
        suggestions: Optional improvement suggestions from models
        user_decision: Optional user decision (accepted/modified/rejected)

    Returns:
        The complete updated session
    """
    session = get_session(session_id)
    if not session:
        raise ValueError(f"Session {session_id} not found")

    # Calculate version number
    version = len(session["iterations"]) + 1

    iteration = {
        "version": version,
        "prompt": prompt,
        "timestamp": datetime.now().isoformat(),
        "change_rationale": change_rationale,
        "test_results": test_results or [],
        "suggestions": suggestions or [],
        "user_decision": user_decision
    }

    session["iterations"].append(iteration)

    with open(_get_session_path(session_id), 'w', encoding='utf-8') as f:
        json.dump(session, f, indent=2, ensure_ascii=False)

    return session


def update_iteration_test_results(
    session_id: str,
    version: int,
    test_results: List[Dict[str, Any]]
):
    """
    Update test results for a specific iteration.

    Args:
        session_id: The session ID
        version: The iteration version number
        test_results: Test results with model outputs
    """
    session = get_session(session_id)
    if not session:
        raise ValueError(f"Session {session_id} not found")

    # Find the iteration
    for iteration in session["iterations"]:
        if iteration["version"] == version:
            iteration["test_results"] = test_results
            break
    else:
        raise ValueError(f"Version {version} not found in session {session_id}")

    with open(_get_session_path(session_id), 'w', encoding='utf-8') as f:
        json.dump(session, f, indent=2, ensure_ascii=False)


def update_iteration_feedback(
    session_id: str,
    version: int,
    model: str,
    rating: Optional[int] = None,
    feedback: Optional[str] = None
):
    """
    Update feedback for a specific test result in an iteration.

    Args:
        session_id: The session ID
        version: The iteration version number
        model: The model identifier
        rating: Optional rating (1-5)
        feedback: Optional text feedback
    """
    session = get_session(session_id)
    if not session:
        raise ValueError(f"Session {session_id} not found")

    # Find the iteration and test result
    for iteration in session["iterations"]:
        if iteration["version"] == version:
            for result in iteration["test_results"]:
                if result["model"] == model:
                    if rating is not None:
                        result["rating"] = rating
                    if feedback is not None:
                        result["feedback"] = feedback
                    break
            break
    else:
        raise ValueError(f"Version {version} not found in session {session_id}")

    with open(_get_session_path(session_id), 'w', encoding='utf-8') as f:
        json.dump(session, f, indent=2, ensure_ascii=False)


def update_iteration_suggestions(
    session_id: str,
    version: int,
    suggestions: List[Dict[str, Any]]
):
    """
    Update improvement suggestions for a specific iteration.

    Args:
        session_id: The session ID
        version: The iteration version number
        suggestions: List of suggestions from models
    """
    session = get_session(session_id)
    if not session:
        raise ValueError(f"Session {session_id} not found")

    # Find the iteration
    for iteration in session["iterations"]:
        if iteration["version"] == version:
            iteration["suggestions"] = suggestions
            break
    else:
        raise ValueError(f"Version {version} not found in session {session_id}")

    with open(_get_session_path(session_id), 'w', encoding='utf-8') as f:
        json.dump(session, f, indent=2, ensure_ascii=False)


def get_iteration(session_id: str, version: int) -> Optional[Dict[str, Any]]:
    """
    Get a specific iteration by version number.

    Args:
        session_id: The session ID
        version: The iteration version number

    Returns:
        Iteration dict or None if not found
    """
    session = get_session(session_id)
    if not session:
        return None

    for iteration in session["iterations"]:
        if iteration["version"] == version:
            return iteration

    return None


def get_latest_iteration(session_id: str) -> Optional[Dict[str, Any]]:
    """
    Get the latest iteration for a session.

    Args:
        session_id: The session ID

    Returns:
        Latest iteration dict or None if no iterations
    """
    session = get_session(session_id)
    if not session or not session.get("iterations"):
        return None

    return session["iterations"][-1]
