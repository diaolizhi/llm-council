"""Prompt optimization orchestration logic."""

from typing import List, Dict, Any, Optional
from .openrouter import query_models_parallel, query_model
from .config import TEST_MODELS, SYNTHESIZER_MODEL, GENERATOR_MODEL
from .settings import get_settings, get_builtin_prompt


async def generate_prompt_title(prompt: str) -> str:
    """
    Generate a concise title for a prompt.

    Args:
        prompt: The prompt content to summarize

    Returns:
        A short title string
    """
    # Truncate prompt to reduce tokens and speed up generation
    truncated = prompt[:300] if len(prompt) > 300 else prompt

    template = get_builtin_prompt("title-generator") or "用3-8个字概括以下内容，只输出标题："

    messages = [{"role": "user", "content": f"{template}\n{truncated}"}]

    settings = get_settings()
    generator_model = settings.get("generator_model") or GENERATOR_MODEL

    try:
        response = await query_model(generator_model, messages, timeout=15.0)
    except Exception:
        response = None

    if not response:
        # Fallback: truncate the prompt text to form a title
        return (prompt or "Prompt").strip()[:20] or "Prompt"

    title = response.get("content", "").strip()
    if not title:
        return (prompt or "Prompt").strip()[:20] or "Prompt"

    return title


async def generate_initial_prompt(objective: str) -> str:
    """
    Generate an initial prompt based on user objective.

    Args:
        objective: User description of what they want the prompt to do

    Returns:
        Generated prompt text
    """
    template = get_builtin_prompt("initial-prompt-generator") or """You are a prompt engineering expert. The user wants to create a prompt for the following purpose:
{OBJECTIVE}
Generate a well-structured, effective prompt that accomplishes this goal. The prompt should be:
- Clear and specific
- Include relevant context and instructions
- Use effective prompt engineering techniques
- Be ready to use with various LLMs
Return ONLY the generated prompt text, without any meta-commentary or explanation."""

    generation_prompt = template.replace("{OBJECTIVE}", objective)

    messages = [{"role": "user", "content": generation_prompt}]

    # Use fast, cheap model for generation
    settings = get_settings()
    generator_model = settings.get("generator_model") or GENERATOR_MODEL
    response = await query_model(generator_model, messages, timeout=60.0)

    # If generation fails, bubble up so caller can handle stage rollback/retry
    if response is None:
        raise RuntimeError("Initial prompt generation failed: No response from model")
    if 'error' in response:
        raise RuntimeError(f"Initial prompt generation failed: {response['error']}")
    if not response.get('content'):
        raise RuntimeError("Initial prompt generation failed: Empty response from model")

    return response.get('content', '').strip()


async def test_prompt_with_models(
    prompt: str,
    models: Optional[List[str]] = None,
    test_input: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Test a prompt with multiple LLMs in parallel.

    Args:
        prompt: The prompt to test
        models: List of model identifiers (defaults to TEST_MODELS)
        test_input: Optional test input to use with the prompt

    Returns:
        List of test results with model, output, response_time
    """
    if models is None:
        settings = get_settings()
        models = settings.get("test_models") or TEST_MODELS

    # Prepare messages
    if test_input:
        # If test input provided, use prompt as system and input as user message
        messages = [
            {"role": "system", "content": prompt},
            {"role": "user", "content": test_input}
        ]
    else:
        # Otherwise, just use the prompt as a user message
        messages = [{"role": "user", "content": prompt}]

    # Query all models in parallel
    responses = await query_models_parallel(models, messages)

    # Format results
    test_results = []
    for model, response in responses.items():
        if response is not None and 'error' not in response:
            test_results.append({
                "model": model,
                "output": response.get('content', ''),
                "response_time": response.get('response_time', 0),
                "rating": None,  # Will be filled in by user
                "feedback": None  # Will be filled in by user
            })
        else:
            # Include failures for transparency with detailed error message
            error_detail = response.get('error', 'Model failed to respond') if response else 'Model failed to respond'
            test_results.append({
                "model": model,
                "output": f"[Error: {error_detail}]",
                "response_time": 0,
                "rating": None,
                "feedback": None,
                "error": True,
                "error_detail": error_detail
            })

    return test_results


async def collect_improvement_suggestions(
    current_prompt: str,
    test_results: List[Dict[str, Any]],
    models: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    """
    Collect improvement suggestions from LLMs based on test results and user feedback.

    Args:
        current_prompt: The current prompt being optimized
        test_results: Test results with user ratings and feedback
        models: Models to ask for suggestions (defaults to models that were tested)

    Returns:
        List of suggestions with model and suggestion text
    """
    if models is None:
        # Use the models that were successfully tested
        models = [r["model"] for r in test_results if not r.get("error")]

    # Build context about test results and feedback
    results_summary = []
    for result in test_results:
        if result.get("error"):
            continue

        model = result["model"]
        rating = result.get("rating")
        feedback = result.get("feedback")

        summary = f"Model: {model}"
        if rating is not None:
            summary += f"\nRating: {rating}/5 stars"
        if feedback:
            summary += f"\nFeedback: {feedback}"
        summary += f"\nOutput preview: {result['output'][:200]}..."

        results_summary.append(summary)

    results_text = "\n\n".join(results_summary)

    template = get_builtin_prompt("improvement-suggestion") or """You are a prompt engineering expert. You are helping optimize a prompt based on test results and feedback. Return ONLY the improved prompt text wrapped in <prompt>...</prompt> XML tags with no explanation outside the tag."""

    suggestion_prompt = f"""{template}

CURRENT PROMPT:
{current_prompt}

This prompt was tested with multiple LLMs. Here are the results and user feedback:

{results_text}

Based on the test results and user feedback, suggest specific improvements to the prompt."""

    messages = [{"role": "user", "content": suggestion_prompt}]

    # Query models for suggestions in parallel
    responses = await query_models_parallel(models, messages)

    # Format suggestions
    suggestions = []
    for model, response in responses.items():
        if response is not None:
            suggestions.append({
                "model": model,
                "suggestion": response.get('content', '')
            })

    return suggestions


async def merge_suggestions(
    current_prompt: str,
    suggestions: List[Dict[str, Any]],
    user_preference: Optional[str] = None
) -> str:
    """
    Merge multiple improvement suggestions into a single improved prompt.

    Args:
        current_prompt: The current prompt
        suggestions: List of suggestions from different models
        user_preference: Optional user guidance on what to prioritize

    Returns:
        Merged improved prompt
    """
    if not suggestions:
        return current_prompt

    # Build suggestions text
    suggestions_text = "\n\n".join([
        f"Suggestion from {s['model']}:\n{s['suggestion']}"
        for s in suggestions
    ])

    merge_prompt = f"""You are a prompt engineering expert. You need to create an improved version of a prompt by synthesizing multiple suggestions.

CURRENT PROMPT:
{current_prompt}

IMPROVEMENT SUGGESTIONS:
{suggestions_text}"""

    if user_preference:
        merge_prompt += f"\n\nUSER PREFERENCE:\n{user_preference}"

    merge_prompt += """

Your task:
1. Analyze all the suggestions
2. Identify common themes and valuable improvements
3. Create a single, improved version of the prompt that incorporates the best ideas
4. Ensure the improved prompt is cohesive and well-structured

Return your response in the following format:
<analysis>
原因分析：[分析当前 prompt 存在的问题]
改进措施：[说明你做了哪些改进]
</analysis>
<prompt>
[改进后的完整 prompt]
</prompt>"""

    messages = [{"role": "user", "content": merge_prompt}]

    # Use synthesizer model
    settings = get_settings()
    synthesizer_model = settings.get("synthesizer_model") or SYNTHESIZER_MODEL
    response = await query_model(synthesizer_model, messages, timeout=60.0)

    if response is None:
        # Fallback: return first suggestion's content
        return suggestions[0]["suggestion"] if suggestions else current_prompt

    if 'error' in response:
        # Fallback with error info: return first suggestion's content
        return suggestions[0]["suggestion"] if suggestions else current_prompt

    return response.get('content', '').strip()


def calculate_iteration_metrics(iteration: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate metrics for an iteration based on test results.

    Args:
        iteration: The iteration dict with test_results

    Returns:
        Dict with metrics: avg_rating, rating_distribution, feedback_count
    """
    test_results = iteration.get("test_results", [])

    # Filter out errors and results without ratings
    rated_results = [r for r in test_results if not r.get("error") and r.get("rating") is not None]

    if not rated_results:
        return {
            "avg_rating": None,
            "rating_distribution": {},
            "feedback_count": 0,
            "total_tests": len([r for r in test_results if not r.get("error")])
        }

    # Calculate average rating
    ratings = [r["rating"] for r in rated_results]
    avg_rating = sum(ratings) / len(ratings)

    # Calculate rating distribution
    rating_distribution = {}
    for i in range(1, 6):
        rating_distribution[i] = ratings.count(i)

    # Count feedback entries
    feedback_count = len([r for r in rated_results if r.get("feedback")])

    return {
        "avg_rating": round(avg_rating, 2),
        "rating_distribution": rating_distribution,
        "feedback_count": feedback_count,
        "total_tests": len([r for r in test_results if not r.get("error")])
    }


def create_version_diff(old_prompt: str, new_prompt: str) -> Dict[str, Any]:
    """
    Create a diff between two prompt versions.

    Args:
        old_prompt: The previous prompt text
        new_prompt: The new prompt text

    Returns:
        Dict with diff information
    """
    # Simple word-level diff (can be enhanced with difflib)
    old_words = old_prompt.split()
    new_words = new_prompt.split()

    # Basic metrics
    words_added = len(new_words) - len(old_words)
    chars_added = len(new_prompt) - len(old_prompt)

    # Calculate similarity (simple Jaccard similarity)
    old_set = set(old_words)
    new_set = set(new_words)

    if old_set or new_set:
        intersection = len(old_set & new_set)
        union = len(old_set | new_set)
        similarity = intersection / union if union > 0 else 0
    else:
        similarity = 1.0

    return {
        "old_length": len(old_prompt),
        "new_length": len(new_prompt),
        "words_added": words_added,
        "chars_added": chars_added,
        "similarity": round(similarity, 2),
        "old_prompt": old_prompt,
        "new_prompt": new_prompt
    }
