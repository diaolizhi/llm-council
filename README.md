# Prompt Optimizer

**Iteratively improve your prompts with multi-LLM feedback and suggestions.**

Prompt Optimizer is a local web application that helps you craft better prompts through systematic testing and refinement. Instead of trial-and-error, you get a structured workflow:

1. **Generate or provide** an initial prompt
2. **Test** it across multiple LLMs simultaneously
3. **Rate and provide feedback** on each output
4. **Generate improvement suggestions** from all tested LLMs
5. **Accept suggestions** and create a new prompt version
6. **Iterate** until you have an optimized prompt

The tool uses OpenRouter to access dozens of LLMs, allowing you to see how different models respond to the same prompt and collaboratively improve it based on their collective insights.

[中文文档](README_CN.md)

## How It Works

### The Optimization Loop

1. **Initialization**: Either describe your objective (e.g., "Create a code review prompt") and let an LLM generate the initial prompt, or paste an existing prompt to refine.

2. **Testing**: Your prompt is sent to multiple LLMs in parallel. Provide test input (e.g., a code snippet, question, or scenario) to see how the prompt performs in context. You can test with multiple models simultaneously.

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
- **Test Samples**: Create and manage reusable test inputs for consistent testing
- **Customizable Prompts**: Configure built-in prompts for title generation, initial prompt generation, and improvement suggestions
- **i18n Support**: Interface available in multiple languages
- **Export**: Save optimized prompts as text, markdown, or JSON with full metadata

## Setup

### 1. Install Dependencies

The project uses [uv](https://docs.astral.sh/uv/) for Python package management.

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

You can configure the OpenRouter API key in two ways:

**Option 1: Via Settings UI (Recommended)**

Launch the application and click the settings icon to configure your API key directly in the interface.

**Option 2: Via Environment Variable**

Create a `.env` file in the project root:

```bash
OPENROUTER_API_KEY=sk-or-v1-...
```

Get your API key at [openrouter.ai](https://openrouter.ai/).

### 3. Configure Models (Optional)

Models can be configured via the Settings UI, or by editing `backend/config.py`:

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
GENERATOR_MODEL = "x-ai/grok-4.1-fast:free"
```

## Running the Application

### Desktop Mode (Recommended)

Run as a standalone desktop application:

```bash
# Build frontend first (one-time)
cd frontend && npm run build && cd ..

# Launch desktop app
uv run python desktop.py
```

The desktop app:
- Opens in a native window (no browser needed)
- Automatically finds an available port
- Stores settings in platform-appropriate location:
  - Windows: `%APPDATA%/LLMCouncil/`
  - macOS: `~/Library/Application Support/LLMCouncil/`
  - Linux: `~/.config/LLMCouncil/`

### Development Mode

For development with hot-reload:

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

### Building Standalone Executable

To create distributable applications, see **[BUILD.md](BUILD.md)** for detailed instructions.

**Quick build:**
```bash
# macOS/Linux
./scripts/build.sh

# Windows
scripts\build.bat
```

## Tech Stack

- **Backend:** FastAPI (Python 3.10+), async httpx, OpenRouter API
- **Frontend:** React + Vite, react-markdown for rendering
- **Storage:** JSON files in `data/sessions/`
- **Package Management:** uv for Python, npm for JavaScript

## Usage Tips

1. **Start Simple**: Begin with a basic prompt, get baseline feedback, then iterate
2. **Use Specific Feedback**: The more specific your ratings and comments, the better the suggestions
3. **Test Diverse Models**: Different model architectures notice different issues
4. **Create Test Samples**: Build a library of test inputs for consistent evaluation
5. **Compare Versions**: Use the version history to see what changes improved performance
6. **Export Final Prompts**: Save your optimized prompts for reuse in production

## Project Structure

```
backend/
  ├── optimizer.py      # Core optimization logic
  ├── storage.py        # Session and iteration data model
  ├── settings.py       # Application settings management
  ├── config.py         # Default model configuration
  ├── openrouter.py     # OpenRouter API integration
  └── main.py           # FastAPI endpoints

frontend/src/
  ├── components/
  │   ├── PromptEditor.jsx          # Prompt editing
  │   ├── TestResults.jsx           # Output viewing & rating
  │   ├── OutputRating.jsx          # Star rating + feedback
  │   ├── SuggestionAggregator.jsx  # Improvement suggestions
  │   ├── SettingsView.jsx          # Settings configuration
  │   └── IterationView.jsx         # Main workflow orchestration
  ├── i18n/                         # Internationalization
  └── App.jsx                       # Session management
```

## License

MIT
