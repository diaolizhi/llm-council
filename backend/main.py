"""FastAPI backend for Prompt Optimizer."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uuid

from . import storage
from .optimizer import (
    generate_initial_prompt,
    generate_prompt_title,
    test_prompt_with_models,
    collect_improvement_suggestions,
    merge_suggestions,
    calculate_iteration_metrics,
    create_version_diff
)
from .config import TEST_MODELS

app = FastAPI(title="Prompt Optimizer API")

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models
class CreateSessionRequest(BaseModel):
    """Request to create a new optimization session."""
    title: Optional[str] = "New Optimization Session"
    objective: Optional[str] = None


class InitializePromptRequest(BaseModel):
    """Request to initialize a prompt (either generate or use provided)."""
    mode: str  # "generate" or "provide"
    objective: Optional[str] = None  # For generate mode
    prompt: Optional[str] = None  # For provide mode


class TestPromptRequest(BaseModel):
    """Request to test a prompt with models."""
    models: Optional[List[str]] = None
    test_input: Optional[str] = None


class SubmitFeedbackRequest(BaseModel):
    """Request to submit feedback for a test result."""
    model: str
    rating: Optional[int] = None
    feedback: Optional[str] = None


class GenerateSuggestionsRequest(BaseModel):
    """Request to generate improvement suggestions."""
    models: Optional[List[str]] = None


class CreateIterationRequest(BaseModel):
    """Request to create a new iteration."""
    prompt: str
    change_rationale: str
    user_decision: Optional[str] = None


class MergeSuggestionsRequest(BaseModel):
    """Request to merge suggestions into improved prompt."""
    user_preference: Optional[str] = None


class RestoreVersionRequest(BaseModel):
    """Request to restore a specific version as current."""
    version: int


class SessionMetadata(BaseModel):
    """Session metadata for list view."""
    id: str
    created_at: str
    title: str
    prompt_title: Optional[str] = None
    current_version: int
    stage: str
    iteration_count: int
    version_count: int
    last_modified: str


class Session(BaseModel):
    """Full session with all iterations."""
    id: str
    created_at: str
    title: str
    objective: Optional[str]
    prompt_title: Optional[str] = None
    current_version: int = 0
    stage: str = "init"
    iterations: List[Dict[str, Any]]


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "service": "Prompt Optimizer API"}


@app.get("/api/sessions", response_model=List[SessionMetadata])
async def list_sessions():
    """List all optimization sessions (metadata only)."""
    return storage.list_sessions()


@app.post("/api/sessions", response_model=Session)
async def create_session(request: CreateSessionRequest):
    """Create a new optimization session."""
    session_id = str(uuid.uuid4())
    session = storage.create_session(
        session_id,
        title=request.title or "New Optimization Session",
        objective=request.objective
    )
    return session


@app.get("/api/sessions/{session_id}", response_model=Session)
async def get_session(session_id: str):
    """Get a specific session with all its iterations."""
    session = storage.get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@app.post("/api/sessions/{session_id}/initialize")
async def initialize_prompt(session_id: str, request: InitializePromptRequest):
    """
    Initialize the first prompt for a session.
    Either generate from objective or use provided prompt.
    """
    # Check if session exists
    session = storage.get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    # Check if already initialized
    if session.get("iterations"):
        raise HTTPException(status_code=400, detail="Session already has iterations")

    # Generate or use provided prompt
    if request.mode == "generate":
        if not request.objective:
            raise HTTPException(status_code=400, detail="Objective required for generate mode")
        try:
            prompt = await generate_initial_prompt(request.objective)
        except Exception:
            # Do not advance stage; allow user to retry generation
            raise HTTPException(status_code=502, detail="Failed to generate initial prompt. Please retry.")
        change_rationale = f"Generated from objective: {request.objective}"
    elif request.mode == "provide":
        if not request.prompt:
            raise HTTPException(status_code=400, detail="Prompt required for provide mode")
        prompt = request.prompt
        change_rationale = "Initial prompt provided by user"
    else:
        raise HTTPException(status_code=400, detail="Mode must be 'generate' or 'provide'")

    # Generate title (with fallback) and create first version
    try:
        prompt_title = await generate_prompt_title(prompt)
    except Exception:
        prompt_title = (prompt or "Prompt")[:20] or "Prompt"

    session = storage.add_iteration(
        session_id,
        prompt=prompt,
        change_rationale=change_rationale,
        metadata={"prompt_title": prompt_title},
        stage="title_ready"
    )

    return {
        "prompt": prompt,
        "version": 1,
        "title": session.get("prompt_title"),
        "stage": session.get("stage"),
        "session": session
    }


@app.post("/api/sessions/{session_id}/test")
async def test_prompt(session_id: str, request: TestPromptRequest):
    """
    Test the current prompt with selected models.
    """
    # Get the latest iteration
    iteration = storage.get_active_iteration(session_id)
    if iteration is None:
        raise HTTPException(status_code=404, detail="No iterations found. Initialize prompt first.")

    # Use provided models or default to TEST_MODELS
    models = request.models if request.models else TEST_MODELS

    # Test the prompt
    test_results = await test_prompt_with_models(
        iteration["prompt"],
        models=models,
        test_input=request.test_input
    )

    # Update the iteration with test results
    storage.update_iteration_test_results(
        session_id,
        iteration["version"],
        test_results,
        stage="tested",
        clear_feedback=True,
        clear_suggestions=True
    )

    # Advance stage after successful testing
    session = storage.update_session_meta(session_id, stage="tested", current_version=iteration["version"])

    return {
        "version": iteration["version"],
        "test_results": test_results,
        "stage": session.get("stage")
    }


@app.post("/api/sessions/{session_id}/feedback")
async def submit_feedback(session_id: str, request: SubmitFeedbackRequest):
    """
    Submit rating and/or feedback for a specific test result.
    """
    # Get the latest iteration
    iteration = storage.get_active_iteration(session_id)
    if iteration is None:
        raise HTTPException(status_code=404, detail="No iterations found")

    # Update the feedback
    storage.update_iteration_feedback(
        session_id,
        iteration["version"],
        request.model,
        rating=request.rating,
        feedback=request.feedback
    )

    # Get updated iteration to return current state
    updated_iteration = storage.get_active_iteration(session_id)

    return {
        "version": updated_iteration["version"],
        "test_results": updated_iteration["test_results"]
    }


@app.post("/api/sessions/{session_id}/suggest")
async def generate_suggestions(session_id: str, request: GenerateSuggestionsRequest):
    """
    Generate improvement suggestions based on test results and feedback.
    """
    # Get the latest iteration
    iteration = storage.get_active_iteration(session_id)
    if iteration is None:
        raise HTTPException(status_code=404, detail="No iterations found")

    # Check if there are test results
    if not iteration.get("test_results"):
        raise HTTPException(status_code=400, detail="No test results available. Run tests first.")

    # Collect suggestions
    suggestions = await collect_improvement_suggestions(
        iteration["prompt"],
        iteration["test_results"],
        models=request.models
    )

    # Update the iteration with suggestions
    storage.update_iteration_suggestions(
        session_id,
        iteration["version"],
        suggestions
    )

    return {
        "version": iteration["version"],
        "suggestions": suggestions
    }


@app.post("/api/sessions/{session_id}/merge")
async def merge_improvement_suggestions(session_id: str, request: MergeSuggestionsRequest):
    """
    Merge improvement suggestions into a single improved prompt.
    """
    # Get the latest iteration
    iteration = storage.get_active_iteration(session_id)
    if iteration is None:
        raise HTTPException(status_code=404, detail="No iterations found")

    # Check if there are suggestions
    suggestions = iteration.get("suggestions", [])
    if not suggestions:
        raise HTTPException(status_code=400, detail="No suggestions available. Generate suggestions first.")

    # Merge suggestions
    improved_prompt = await merge_suggestions(
        iteration["prompt"],
        suggestions,
        user_preference=request.user_preference
    )

    return {
        "improved_prompt": improved_prompt,
        "original_prompt": iteration["prompt"]
    }


@app.post("/api/sessions/{session_id}/iterate")
async def create_new_iteration(session_id: str, request: CreateIterationRequest):
    """
    Create a new iteration with an improved prompt.
    """
    # Get current session
    session = storage.get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    # Create new iteration
    session = storage.add_iteration(
        session_id,
        prompt=request.prompt,
        change_rationale=request.change_rationale,
        user_decision=request.user_decision,
        metadata={
            "prompt_title": session.get("prompt_title"),
        },
        stage="title_ready"
    )

    # Get the new iteration
    new_iteration = session["iterations"][-1]

    return {
        "version": new_iteration["version"],
        "stage": session.get("stage"),
        "title": session.get("prompt_title"),
        "iteration": new_iteration,
        "session": session
    }


@app.get("/api/sessions/{session_id}/metrics")
async def get_session_metrics(session_id: str):
    """
    Get metrics for all iterations in a session.
    """
    session = storage.get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    # Calculate metrics for each iteration
    metrics = []
    for iteration in session.get("iterations", []):
        iteration_metrics = calculate_iteration_metrics(iteration)
        metrics.append({
            "version": iteration["version"],
            "metrics": iteration_metrics
        })

    return {
        "session_id": session_id,
        "total_iterations": len(session.get("iterations", [])),
        "iteration_metrics": metrics
    }


@app.get("/api/sessions/{session_id}/versions")
async def get_version_history(session_id: str):
    """
    Get version history with diffs between consecutive versions.
    """
    session = storage.get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    iterations = session.get("iterations", [])
    if not iterations:
        return {"versions": []}

    # Build version history with diffs
    versions = []
    for i, iteration in enumerate(iterations):
        version_info = {
            "version": iteration["version"],
            "timestamp": iteration["timestamp"],
            "change_rationale": iteration["change_rationale"],
            "prompt": iteration["prompt"],
            "metrics": calculate_iteration_metrics(iteration),
            "stage": iteration.get("stage", session.get("stage"))
        }

        # Add diff if not the first version
        if i > 0:
            prev_iteration = iterations[i - 1]
            diff = create_version_diff(prev_iteration["prompt"], iteration["prompt"])
            version_info["diff"] = diff

        versions.append(version_info)

    return {"versions": versions}


@app.post("/api/sessions/{session_id}/export")
async def export_session(session_id: str, format: str = "json"):
    """
    Export the session in various formats.
    """
    session = storage.get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    if format == "json":
        return session
    elif format == "text":
        # Export as plain text
        latest_iteration = session["iterations"][-1] if session.get("iterations") else None
        if latest_iteration:
            return {
                "format": "text",
                "content": latest_iteration["prompt"]
            }
        else:
            return {
                "format": "text",
                "content": ""
            }
    elif format == "markdown":
        # Export as markdown with history
        content = f"# {session['title']}\n\n"
        if session.get("objective"):
            content += f"**Objective:** {session['objective']}\n\n"

        content += "## Version History\n\n"
        for iteration in session.get("iterations", []):
            content += f"### Version {iteration['version']}\n"
            content += f"**Rationale:** {iteration['change_rationale']}\n\n"
            content += f"```\n{iteration['prompt']}\n```\n\n"

            # Add metrics if available
            metrics = calculate_iteration_metrics(iteration)
            if metrics.get("avg_rating"):
                content += f"**Average Rating:** {metrics['avg_rating']}/5\n\n"

        return {
            "format": "markdown",
            "content": content
        }
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {format}")


@app.post("/api/sessions/{session_id}/restore")
async def restore_version(session_id: str, request: RestoreVersionRequest):
    """
    Restore a specific version as the current active version (overwrite).
    """
    session = storage.get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        session = storage.restore_iteration(session_id, request.version)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    active_iteration = storage.get_active_iteration(session_id)

    return {
        "session": session,
        "active_iteration": active_iteration
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
