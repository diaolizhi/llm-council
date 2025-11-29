# Design: Prompt Optimizer Architecture

## Context

Transforming from a deliberation-based Q&A system (LLM Council) to an iterative prompt optimization tool requires fundamental changes to:
- User interaction model (single-shot → iterative refinement)
- Data structure (messages → optimization iterations)
- Backend orchestration (3-stage pipeline → flexible optimization loop)
- Frontend UX (result viewing → active editing and feedback)

The current system's strengths (parallel LLM querying, result comparison) can be preserved, but the orchestration and presentation must change completely.

## Goals / Non-Goals

**Goals**:
- Enable unlimited optimization iterations (not fixed 3 stages)
- Support both prompt generation (from objectives) and refinement (from existing prompts)
- Collect structured feedback (ratings + text) per LLM output
- Aggregate improvement suggestions from all tested LLMs
- Track prompt evolution with version history and diffs
- Maintain fast parallel LLM querying
- Keep OpenRouter flexibility for model selection

**Non-Goals**:
- Automated prompt optimization without user feedback (this is user-driven)
- Real-time collaborative editing (single-user workflow)
- Advanced prompt engineering techniques (DSPy, etc.) - keep it simple
- Prompt marketplace or sharing features (future consideration)
- Migration of old council conversation data (archive and start fresh)

## Decisions

### 1. Iteration-Based Data Model

**Decision**: Each conversation becomes a series of optimization iterations, not message exchanges.

**Structure**:
```json
{
  "id": "conv-uuid",
  "created_at": "timestamp",
  "title": "Code Review Prompt Optimization",
  "objective": "Create a comprehensive code review prompt", // optional
  "iterations": [
    {
      "version": 1,
      "prompt": "Review this code...",
      "timestamp": "...",
      "change_rationale": "Initial version from user objective",
      "test_results": [
        {
          "model": "gpt-4",
          "output": "...",
          "rating": 4, // user rating 1-5
          "feedback": "Too verbose, needs code examples" // user text feedback
        }
      ],
      "suggestions": [
        {
          "model": "gpt-4",
          "suggestion": "Add specific code example placeholders..."
        }
      ],
      "user_decision": "accepted" // or "modified" or "rejected"
    }
  ]
}
```

**Rationale**:
- Clear version lineage for prompt evolution
- Structured feedback enables better suggestion generation
- Can calculate metrics (avg rating per version, improvement trends)
- Easy to implement version comparison (diff v1 vs v2)

**Alternatives Considered**:
- Git-like branching for prompt variants → Too complex for initial version
- Flat message list with type markers → Loses version structure and history clarity

### 2. Two-Mode Prompt Initialization

**Decision**: Support both "generate from objective" and "start with existing prompt"

**Flow**:
```
User Input (first message):
├─ If "objective" → Call LLM to generate initial prompt → Iteration 1
└─ If "prompt text" → Use directly as Iteration 1
```

**Rationale**:
- Flexibility for different user workflows
- "Generate from objective" helps users who don't know where to start
- "Start with prompt" supports users refining existing prompts
- Backend can detect intent based on phrasing or explicit UI choice

**Implementation**:
- Frontend has toggle: "Describe your goal" vs "Paste your prompt"
- Backend `initialize_prompt()` function handles both cases
- Use fast model (gemini-flash) for generation to reduce latency

### 3. Feedback Collection: Ratings + Text

**Decision**: Collect both numerical ratings (1-5) and optional text feedback per LLM output

**Rationale**:
- Ratings provide quantitative comparison across versions
- Text feedback gives LLMs context for improvement suggestions
- Optional text reduces friction (users can just rate and continue)
- Structured data enables analytics (which models perform better per prompt type)

**UI**:
- Star rating widget (1-5) below each output
- Expandable text area for detailed feedback
- "Skip feedback" option to proceed with just ratings or no feedback

### 4. Collaborative Improvement Suggestions

**Decision**: All tested LLMs generate improvement suggestions based on user feedback, then aggregate

**Prompt Template**:
```
Current prompt: [version N]
Test outputs: [all LLM outputs]
User feedback: [ratings + text for each]

Your task: Suggest improvements to the prompt that would address the feedback.
Focus on: [issues mentioned in feedback]
```

**Aggregation**:
- Show all suggestions individually (like current Stage 2)
- Optionally: Use "synthesizer" LLM to merge suggestions into one improved prompt
- User can accept merged suggestion, pick one suggestion, or manually edit

**Rationale**:
- Leverages existing parallel query infrastructure
- Multiple perspectives on improvements (different LLMs notice different issues)
- User retains control (not fully automated)

**Alternatives Considered**:
- Single "optimizer" LLM → Loses diversity of suggestions
- Fully automated selection → Removes user agency and learning opportunity

### 5. Version History and Diff Visualization

**Decision**: Track all prompt versions and provide side-by-side diff view

**Features**:
- Version list with timestamps and change rationales
- Click any version to compare with current
- Text diff highlighting (additions green, deletions red)
- "Restore version" option to rollback

**Implementation**:
- Store full prompt text per version (storage is cheap)
- Use diff library (e.g., `diff-match-patch`, `jsdiff`) for visualization
- Lazy-load version history (don't fetch all iterations upfront)

**Rationale**:
- Users learn what changes improved prompt performance
- Easy rollback if optimization goes wrong
- Transparency in prompt evolution

### 6. Backend Refactoring Strategy

**Decision**: Rename and restructure, don't try to preserve council abstractions

**Changes**:
- `backend/council.py` → `backend/optimizer.py`
- Remove: `stage1_collect_responses`, `stage2_collect_rankings`, `stage3_synthesize_final`
- Add: `generate_initial_prompt`, `test_prompt_with_models`, `collect_improvement_suggestions`, `merge_suggestions`
- Keep: `query_models_parallel` (no changes needed)
- Update: `storage.py` for new iteration-based schema

**Rationale**:
- Clean break from old architecture avoids confusion
- New names reflect new purpose
- Parallel querying infrastructure is reusable as-is

### 7. Frontend Component Architecture

**New Components**:
- `PromptEditor.jsx` - Editable prompt with version selector
- `TestResults.jsx` - Grid of LLM outputs with rating widgets
- `FeedbackPanel.jsx` - Per-output feedback collection
- `SuggestionAggregator.jsx` - Display and merge improvement suggestions
- `VersionHistory.jsx` - Timeline with diff visualization
- `IterationView.jsx` - Container for single iteration (prompt → test → feedback → suggestions)

**Remove**:
- `Stage1.jsx`, `Stage2.jsx`, `Stage3.jsx`

**Rationale**:
- Component names match new domain concepts
- Clearer separation of concerns
- Easier to add features (e.g., export prompts, analytics)

## Risks / Trade-offs

### Risk 1: Increased Complexity for Users
**Mitigation**:
- Provide default workflow: generate → test → feedback → accept suggestion → repeat
- Add "guided mode" with step-by-step prompts
- Include examples and templates for common prompt types

### Risk 2: More API Calls = Higher Cost
**Observation**: Each iteration requires N+1 calls (N tests + 1 synthesizer or N suggestion generators)

**Mitigation**:
- Let users select which models to test (don't require all)
- Use cheaper models for suggestions (gemini-flash, grok-fast)
- Add cost estimation before each iteration
- Optional: Cache test results (same prompt + model = same output)

### Risk 3: Feedback Fatigue
**Observation**: Requiring feedback for every output in every iteration is tedious

**Mitigation**:
- Make detailed feedback optional
- Support "quick actions": thumbs up/down instead of 1-5 ratings
- Allow proceeding to next iteration without rating all outputs
- Pre-fill feedback with common issues (dropdown: "too verbose", "lacks examples", etc.)

### Risk 4: Breaking Change for Existing Users
**Impact**: All existing conversation data becomes obsolete

**Mitigation**:
- Clearly communicate this is a major version change
- Archive old data with read-only viewer
- Optional: Export old conversations to markdown
- Fresh start might be acceptable if user base is small

## Migration Plan

### Phase 1: Backend Transformation
1. Create new `optimizer.py` with iteration-based logic
2. Update `storage.py` for new schema (keep old code temporarily)
3. Add new API endpoints (`POST /api/iterations/{id}/test`, `POST /api/iterations/{id}/suggest`)
4. Keep old endpoints functional for now

### Phase 2: Frontend Rebuild
1. Create new components (PromptEditor, TestResults, etc.)
2. Build new conversation view using new components
3. Update App.jsx routing for new workflow
4. Test with new API endpoints

### Phase 3: Data Migration
1. Add migration script: `scripts/migrate_to_optimizer.py`
2. Script reads old conversations, extracts prompts (if any), creates new format
3. Archive old data directory: `data/conversations` → `data/archive/council-conversations`
4. Initialize fresh `data/iterations` directory

### Phase 4: Cleanup
1. Remove old components (Stage1, Stage2, Stage3)
2. Remove `backend/council.py`
3. Remove old API endpoints
4. Update README and documentation
5. Update project name references

### Rollback Strategy
- Keep old code in `archive/` branch before deletion
- Tag last working council version: `git tag v1-council-final`
- Document rollback steps in MIGRATION.md
- If critical issues arise, can restore from tag and branch

## Open Questions

1. **Should we support A/B testing of prompt variants?**
   - Pro: Users could explore multiple optimization paths
   - Con: Adds significant complexity
   - Decision: Defer to future version, start with linear optimization

2. **How to handle very long prompts (>4000 chars)?**
   - Textarea vs rich editor?
   - Diff visualization performance?
   - Decision: Start with plain textarea, add rich editor if needed

3. **Should suggestions be pre-applied or require user action?**
   - Auto-apply: Faster iteration, less control
   - Manual apply: More control, slower iteration
   - Decision: Manual with "quick accept" button

4. **How many models should be tested by default?**
   - Current council uses 3 models
   - More models = more comprehensive, but slower and costlier
   - Decision: Default to 3, allow user to configure 1-10

5. **Should we track prompt performance metrics over time?**
   - E.g., "prompts optimized", "avg improvement score", "most effective models"
   - Pro: Interesting insights, gamification
   - Con: Scope creep
   - Decision: Add basic metrics (iteration count, avg rating trend), defer advanced analytics
