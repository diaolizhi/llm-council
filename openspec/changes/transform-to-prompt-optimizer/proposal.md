# Change: Transform LLM Council into Prompt Optimizer

## Why

The current LLM Council system is designed for collaborative question-answering through a 3-stage deliberation process. However, the underlying infrastructure (parallel LLM querying, comparative analysis, iterative refinement) is better suited for a different use case: prompt optimization.

The new "Agent Prompt Optimizer" addresses a common pain point: crafting effective prompts requires trial-and-error across multiple LLMs. Users need a systematic way to:
1. Generate or refine prompts based on objectives
2. Test prompts across different LLMs
3. Collect structured feedback on outputs
4. Iteratively improve prompts based on multi-LLM suggestions
5. Track prompt evolution over multiple iterations

This transformation preserves the core technical infrastructure while completely reimagining the user workflow and interaction model.

## What Changes

**BREAKING** - Complete workflow transformation:
- **Remove**: 3-stage council deliberation (Stage 1: responses, Stage 2: rankings, Stage 3: synthesis)
- **Add**: Iterative prompt optimization workflow with unlimited rounds
- **Add**: Initial prompt generation from user objectives
- **Add**: Per-LLM output rating and feedback collection
- **Add**: Multi-LLM collaborative prompt improvement suggestions
- **Add**: Prompt version history tracking with diff visualization
- **Add**: Iteration-based conversation structure (each round = new prompt + tests + feedback)

**UI/UX Changes**:
- Replace "council deliberation" tabs with "prompt evolution" workflow
- Add prompt editor with version comparison
- Add per-output rating system (1-5 stars or similar)
- Add feedback input fields for each LLM output
- Add prompt improvement suggestions aggregation view
- Add version history timeline

**Data Model Changes**:
- Conversation becomes a series of optimization iterations (not Q&A exchanges)
- Each iteration contains: prompt version, test results from all LLMs, user feedback, improvement suggestions
- Add prompt metadata: version number, change rationale, timestamp
- Remove: stage1/stage2/stage3 structure
- Add: iterations array with prompt_version, outputs, feedback, suggestions

**Backend Logic Changes**:
- Replace `run_full_council()` with `run_optimization_iteration()`
- Add prompt generation from objectives
- Replace ranking logic with improvement suggestion logic
- Add version comparison and diff generation
- Add feedback aggregation across iterations

## Impact

**Affected Specs**:
- NEW: `prompt-optimization` - Core optimization loop and version management
- NEW: `llm-testing` - Parallel prompt testing across multiple LLMs
- NEW: `feedback-collection` - User ratings and feedback collection
- REMOVED: Council deliberation specs (if they existed)

**Affected Code**:
- `backend/council.py` → `backend/optimizer.py` (complete rewrite)
- `backend/main.py` - New API endpoints for optimization workflow
- `backend/storage.py` - New data model for iterations and versions
- `frontend/src/App.jsx` - New conversation structure
- `frontend/src/components/` - Complete UI redesign:
  - Remove: Stage1/Stage2/Stage3 components
  - Add: PromptEditor, VersionHistory, OutputRating, FeedbackInput, SuggestionAggregator components
- All existing tests need rewrite for new workflow

**Migration Path**:
- This is a complete product pivot, not a feature addition
- Existing conversation data is incompatible with new schema
- Recommend: Archive existing data, fresh start with new schema
- Optional: Provide one-time migration script to extract historical prompts for reference

**User-Visible Changes**:
- Completely different workflow: from "ask questions" to "optimize prompts"
- New interaction pattern: iterative refinement instead of one-shot answers
- Persistent prompt artifacts instead of ephemeral conversations
- Focus on prompt quality improvement metrics
