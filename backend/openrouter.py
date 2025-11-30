"""OpenRouter API client for making LLM requests."""

import httpx
import json
from typing import List, Dict, Any, Optional, AsyncGenerator
from .config import OPENROUTER_API_URL, DEFAULT_TIMEOUT
from .settings import get_settings


async def query_model(
    model: str,
    messages: List[Dict[str, str]],
    timeout: float = DEFAULT_TIMEOUT
) -> Optional[Dict[str, Any]]:
    """
    Query a single model via OpenRouter API.

    Args:
        model: OpenRouter model identifier (e.g., "openai/gpt-4o")
        messages: List of message dicts with 'role' and 'content'
        timeout: Request timeout in seconds

    Returns:
        Response dict with 'content' and optional 'reasoning_details', or None if failed
    """
    settings = get_settings()
    api_key = settings.get("openrouter_api_key")
    if not api_key:
        print("OpenRouter API key is not configured.")
        return None

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "messages": messages,
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                headers=headers,
                json=payload
            )
            response.raise_for_status()

            data = response.json()
            message = data['choices'][0]['message']

            return {
                'content': message.get('content'),
                'reasoning_details': message.get('reasoning_details')
            }

    except httpx.HTTPStatusError as e:
        # Extract detailed error from API response
        error_detail = str(e)
        try:
            error_data = e.response.json()
            if 'error' in error_data:
                err = error_data['error']
                if isinstance(err, dict):
                    error_detail = err.get('message', str(err))
                else:
                    error_detail = str(err)
        except Exception:
            pass
        print(f"Error querying model {model}: {error_detail}")
        return {'error': error_detail, 'model': model}
    except httpx.TimeoutException:
        error_detail = f"Request timed out after {timeout}s"
        print(f"Error querying model {model}: {error_detail}")
        return {'error': error_detail, 'model': model}
    except Exception as e:
        error_detail = str(e)
        print(f"Error querying model {model}: {error_detail}")
        return {'error': error_detail, 'model': model}


async def query_models_parallel(
    models: List[str],
    messages: List[Dict[str, str]]
) -> Dict[str, Optional[Dict[str, Any]]]:
    """
    Query multiple models in parallel.

    Args:
        models: List of OpenRouter model identifiers
        messages: List of message dicts to send to each model

    Returns:
        Dict mapping model identifier to response dict (or None if failed)
    """
    import asyncio

    # Create tasks for all models
    tasks = [query_model(model, messages) for model in models]

    # Wait for all to complete
    responses = await asyncio.gather(*tasks)

    # Map models to their responses
    return {model: response for model, response in zip(models, responses)}


async def query_model_stream(
    model: str,
    messages: List[Dict[str, str]],
    timeout: float = DEFAULT_TIMEOUT
) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Query a single model via OpenRouter API with streaming.

    Args:
        model: OpenRouter model identifier (e.g., "openai/gpt-4o")
        messages: List of message dicts with 'role' and 'content'
        timeout: Request timeout in seconds

    Yields:
        Dict with 'type' ('delta', 'done', 'error') and 'content' or 'error'
    """
    settings = get_settings()
    api_key = settings.get("openrouter_api_key")
    if not api_key:
        yield {"type": "error", "error": "OpenRouter API key is not configured."}
        return

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "messages": messages,
        "stream": True,
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            async with client.stream(
                "POST",
                OPENROUTER_API_URL,
                headers=headers,
                json=payload
            ) as response:
                if response.status_code != 200:
                    error_text = ""
                    async for chunk in response.aiter_text():
                        error_text += chunk
                    try:
                        error_data = json.loads(error_text)
                        if 'error' in error_data:
                            err = error_data['error']
                            error_detail = err.get('message', str(err)) if isinstance(err, dict) else str(err)
                        else:
                            error_detail = error_text
                    except Exception:
                        error_detail = error_text or f"HTTP {response.status_code}"
                    yield {"type": "error", "error": error_detail}
                    return

                async for line in response.aiter_lines():
                    if not line:
                        continue
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str.strip() == "[DONE]":
                            yield {"type": "done"}
                            return
                        try:
                            data = json.loads(data_str)
                            choices = data.get("choices", [])
                            if choices:
                                delta = choices[0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    yield {"type": "delta", "content": content}
                        except json.JSONDecodeError:
                            continue

    except httpx.TimeoutException:
        yield {"type": "error", "error": f"Request timed out after {timeout}s"}
    except Exception as e:
        yield {"type": "error", "error": str(e)}
