"""Storage for optimization sessions with iteration-based data model."""

import json
import os
import uuid
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
        "prompt_title": None,
        "current_version": 0,
        "stage": "init",
        "iterations": [],
        "test_set": []
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
        session = json.load(f)

    # Backfill defaults for older sessions
    session.setdefault("prompt_title", None)
    session.setdefault("current_version", len(session.get("iterations", [])))
    session.setdefault("stage", "init")
    session.setdefault("test_set", [])

    # Ensure iterations have stage metadata; default to session stage if missing
    for iteration in session.get("iterations", []):
        iteration.setdefault("stage", session.get("stage", "init"))
        iteration.setdefault("test_sample_id", None)
        iteration.setdefault("test_sample_title", None)
        iteration.setdefault("test_sample_input", None)

    return session


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
                iterations = session.get("iterations", [])
                iteration_count = len(iterations)
                last_modified = iterations[-1].get("timestamp", session["created_at"]) if iterations else session["created_at"]
                # Derive active iteration stage based on current_version; fallback to latest/session stage
                active_iteration = get_iteration(session_id, session.get("current_version", iteration_count))
                derived_stage = (
                    (active_iteration or (iterations[-1] if iterations else {})).get("stage")
                    or session.get("stage", "init")
                )
                sessions.append({
                    "id": session["id"],
                    "created_at": session["created_at"],
                    "title": session["title"],
                    "prompt_title": session.get("prompt_title"),
                    "current_version": session.get("current_version", iteration_count),
                    "stage": derived_stage,
                    "iteration_count": iteration_count,
                    "version_count": iteration_count,
                    "last_modified": last_modified
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


def list_test_samples(session_id: str) -> List[Dict[str, Any]]:
    """
    List test samples for a session.
    """
    session = get_session(session_id)
    if not session:
        raise ValueError(f"Session {session_id} not found")

    return session.get("test_set", [])


def add_test_sample(
    session_id: str,
    title: str,
    test_input: str,
    notes: Optional[str] = None
) -> Dict[str, Any]:
    """
    Add a test sample to a session.
    """
    session = get_session(session_id)
    if not session:
        raise ValueError(f"Session {session_id} not found")

    sample = {
        "id": str(uuid.uuid4()),
        "title": title or "Untitled sample",
        "input": test_input or "",
        "notes": notes,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
    }

    session.setdefault("test_set", []).append(sample)

    with open(_get_session_path(session_id), 'w', encoding='utf-8') as f:
        json.dump(session, f, indent=2, ensure_ascii=False)

    return sample


def update_test_sample(
    session_id: str,
    sample_id: str,
    title: Optional[str] = None,
    test_input: Optional[str] = None,
    notes: Optional[str] = None
) -> Dict[str, Any]:
    """
    Update an existing test sample.
    """
    session = get_session(session_id)
    if not session:
        raise ValueError(f"Session {session_id} not found")

    for sample in session.setdefault("test_set", []):
        if sample["id"] == sample_id:
            if title is not None:
                sample["title"] = title
            if test_input is not None:
                sample["input"] = test_input
            if notes is not None:
                sample["notes"] = notes
            sample["updated_at"] = datetime.now().isoformat()
            break
    else:
        raise ValueError(f"Test sample {sample_id} not found in session {session_id}")

    with open(_get_session_path(session_id), 'w', encoding='utf-8') as f:
        json.dump(session, f, indent=2, ensure_ascii=False)

    return sample


def delete_test_sample(session_id: str, sample_id: str):
    """
    Delete a test sample from a session.
    """
    session = get_session(session_id)
    if not session:
        raise ValueError(f"Session {session_id} not found")

    original_count = len(session.get("test_set", []))
    session["test_set"] = [s for s in session.get("test_set", []) if s["id"] != sample_id]

    if len(session["test_set"]) == original_count:
        raise ValueError(f"Test sample {sample_id} not found in session {session_id}")

    with open(_get_session_path(session_id), 'w', encoding='utf-8') as f:
        json.dump(session, f, indent=2, ensure_ascii=False)


def get_test_sample(session_id: str, sample_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a single test sample by id.
    """
    session = get_session(session_id)
    if not session:
        return None

    for sample in session.get("test_set", []):
        if sample["id"] == sample_id:
            return sample

    return None


def add_iteration(
    session_id: str,
    prompt: str,
    change_rationale: str,
    test_results: Optional[List[Dict[str, Any]]] = None,
    suggestions: Optional[List[Dict[str, Any]]] = None,
    user_decision: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    stage: str = "title_ready",
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
        metadata: Optional session-level metadata to update (e.g., prompt_title, stage)

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
        "user_decision": user_decision,
        "stage": stage,
        "test_sample_id": None,
        "test_sample_title": None,
        "test_sample_input": None,
    }

    session["iterations"].append(iteration)

    # Update session-level metadata
    session["current_version"] = version
    session["stage"] = stage
    if metadata:
        session.update(metadata)

    with open(_get_session_path(session_id), 'w', encoding='utf-8') as f:
        json.dump(session, f, indent=2, ensure_ascii=False)

    return session


def update_iteration_test_results(
    session_id: str,
    version: int,
    test_results: List[Dict[str, Any]],
    test_sample_id: Optional[str] = None,
    test_sample_title: Optional[str] = None,
    test_sample_input: Optional[str] = None,
    stage: Optional[str] = None,
    clear_feedback: bool = False,
    clear_suggestions: bool = False,
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
            if clear_feedback:
                for result in iteration["test_results"]:
                    result["rating"] = None
                    result["feedback"] = None
            if clear_suggestions:
                iteration["suggestions"] = []
            if stage:
                iteration["stage"] = stage
            if test_sample_id is not None:
                iteration["test_sample_id"] = test_sample_id
            if test_sample_title is not None:
                iteration["test_sample_title"] = test_sample_title
            if test_sample_input is not None:
                iteration["test_sample_input"] = test_sample_input
            break
    else:
        raise ValueError(f"Version {version} not found in session {session_id}")

    # Keep session-level stage in sync with active iteration
    if stage:
        session["stage"] = stage

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


def get_active_iteration(session_id: str) -> Optional[Dict[str, Any]]:
    """
    Get the active iteration based on current_version, falling back to latest.
    """
    session = get_session(session_id)
    if not session or not session.get("iterations"):
        return None

    current_version = session.get("current_version")
    if current_version:
        for iteration in session["iterations"]:
            if iteration["version"] == current_version:
                return iteration

    return session["iterations"][-1]


def update_session_meta(session_id: str, **fields) -> Dict[str, Any]:
    """
    Update session-level metadata fields.

    Args:
        session_id: The session ID
        fields: Key/value pairs to merge into the session

    Returns:
        Updated session dict
    """
    session = get_session(session_id)
    if not session:
        raise ValueError(f"Session {session_id} not found")

    for key, value in fields.items():
        session[key] = value

    with open(_get_session_path(session_id), 'w', encoding='utf-8') as f:
        json.dump(session, f, indent=2, ensure_ascii=False)

    return session


def restore_iteration(session_id: str, version: int) -> Dict[str, Any]:
    """
    Restore session state to a specific iteration/version (overwrite current).

    Args:
        session_id: The session ID
        version: The iteration version number to restore

    Returns:
        Updated session dict
    """
    session = get_session(session_id)
    if not session:
        raise ValueError(f"Session {session_id} not found")

    target_iteration = get_iteration(session_id, version)
    if not target_iteration:
        raise ValueError(f"Version {version} not found in session {session_id}")

    # Update session to point to restored version
    session["current_version"] = version
    session["stage"] = target_iteration.get("stage", session.get("stage", "init"))

    with open(_get_session_path(session_id), 'w', encoding='utf-8') as f:
        json.dump(session, f, indent=2, ensure_ascii=False)

    return session
