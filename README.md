# Prompt Optimizer

![prompt-optimizer](header.jpg)

**Iteratively improve your prompts with multi-LLM feedback and suggestions.**

Prompt Optimizer is a local web application that helps you craft better prompts through systematic testing and refinement. Instead of trial-and-error, you get a structured workflow:

1. **Generate or provide** an initial prompt
2. **Test** it across multiple LLMs simultaneously
3. **Rate and provide feedback** on each output
4. **Generate improvement suggestions** from all tested LLMs
5. **Accept suggestions** and create a new prompt version
6. **Iterate** until you have an optimized prompt

The tool uses OpenRouter to access dozens of LLMs, allowing you to see how different models respond to the same prompt and collaboratively improve it based on their collective insights.

## How It Works

### The Optimization Loop

1. **Initialization**: Either describe your objective (e.g., "Create a code review prompt") and let an LLM generate the initial prompt, or paste an existing prompt to refine.

2. **Testing**: Your prompt is sent to multiple LLMs in parallel. Optionally provide test input (e.g., a code snippet, question, or scenario) to see how the prompt performs in context. You can test with 3-10 models simultaneously.

3. **Feedback Collection**: Rate each output (1-5 stars) and optionally provide detailed feedback on what works and what doesn't.

4. **Improvement Suggestions**: Based on your feedback, all tested LLMs analyze the prompt and suggest specific improvements. Each model brings a different perspective.

5. **Merge & Iterate**: Review individual suggestions or merge them into a single improved prompt. Accept the changes to create a new version and continue the cycle.

6. **Version History**: Track all iterations with diffs, rationales, and performance metrics. Compare versions and roll back if needed.

## Key Features

- **Multi-LLM Testing**: Test prompts with any OpenRouter-supported models in parallel
- **Structured Feedback**: Star ratings + text feedback for quantitative and qualitative analysis
- **Collaborative Improvement**: Get suggestions from multiple LLMs, each noticing different issues
- **Version Control**: Full history with diffs, change rationales, and performance tracking
- **Iterative Workflow**: Unlimited optimization cycles until you're satisfied
- **Export**: Save optimized prompts as text, markdown, or JSON with full metadata

## Origin Note

This is a complete transformation of the original "LLM Council" project. The core infrastructure (parallel LLM querying via OpenRouter) proved more valuable for prompt optimization than Q&A deliberation. The codebase has been redesigned from the ground up for this new purpose while preserving the battle-tested API integration layer.

## Setup

### 1. Install Dependencies

The project uses [uv](https://docs.astral.sh/uv/) for project management.

**Backend:**
```bash
uv sync
```

**Frontend:**
```bash
cd frontend
npm install
cd ..
```

### 2. Configure API Key

Create a `.env` file in the project root:

```bash
OPENROUTER_API_KEY=sk-or-v1-...
```

Get your API key at [openrouter.ai](https://openrouter.ai/). Make sure to purchase the credits you need, or sign up for automatic top up.

### 3. Configure Models (Optional)

Edit `backend/config.py` to customize test models:

```python
# Models used to test your prompts
TEST_MODELS = [
    "x-ai/grok-4.1-fast:free",
    "tngtech/deepseek-r1t2-chimera:free",
    "kwaipilot/kat-coder-pro:free",
]

# Model used to merge improvement suggestions
SYNTHESIZER_MODEL = "x-ai/grok-4.1-fast:free"

# Model used to generate initial prompts from objectives
GENERATOR_MODEL = "google/gemini-2.0-flash-exp:free"
```

## Running the Application

**Option 1: Use the start script**
```bash
./start.sh
```

**Option 2: Run manually**

Terminal 1 (Backend):
```bash
uv run python -m backend.main
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

Then open http://localhost:5173 in your browser.

## Tech Stack

- **Backend:** FastAPI (Python 3.10+), async httpx, OpenRouter API
- **Frontend:** React + Vite, react-markdown for rendering
- **Storage:** JSON files in `data/sessions/` (iteration-based schema)
- **Package Management:** uv for Python, npm for JavaScript

## Usage Tips

1. **Start Simple**: Begin with a basic prompt, get baseline feedback, then iterate
2. **Use Specific Feedback**: The more specific your ratings and comments, the better the suggestions
3. **Test Diverse Models**: Different model architectures notice different issues
4. **Compare Versions**: Use the version history to see what changes improved performance
5. **Export Final Prompts**: Save your optimized prompts for reuse in production

## Migration from v1.x (LLM Council)

If you were using the original LLM Council system:

- Old conversation data is archived in `data/archive/council-conversations/`
- The new system uses a completely different data model (iterations vs messages)
- Legacy API endpoints and components are preserved in `*_legacy.py` files
- To roll back: `git checkout v1-council-final` (tag not yet created)

## Project Structure

```
backend/
  ├── optimizer.py      # Core optimization logic
  ├── storage.py        # Iteration-based data model
  ├── config.py         # Model configuration
  └── main.py           # FastAPI endpoints

frontend/src/
  ├── components/
  │   ├── PromptEditor.jsx          # Prompt editing
  │   ├── TestResults.jsx           # Output viewing & rating
  │   ├── OutputRating.jsx          # Star rating + feedback
  │   ├── SuggestionAggregator.jsx  # Improvement suggestions
  │   └── IterationView.jsx         # Main workflow orchestration
  └── App.jsx           # Session management
```
