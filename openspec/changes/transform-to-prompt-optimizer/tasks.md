# Implementation Tasks: Transform to Prompt Optimizer

## 1. Backend Data Model and Storage

- [ ] 1.1 Create new iteration-based schema in `backend/storage.py`
  - [ ] Define `OptimizationSession` structure with iterations array
  - [ ] Define `Iteration` structure with version, prompt, test_results, feedback, suggestions
  - [ ] Add functions: `create_session()`, `add_iteration()`, `get_session()`, `list_sessions()`
- [ ] 1.2 Archive old storage implementation
  - [ ] Rename current `storage.py` functions to `storage_legacy.py`
  - [ ] Update imports to use new storage functions
- [ ] 1.3 Create migration script (optional, for data preservation)
  - [ ] Script to read old conversations and extract any prompts
  - [ ] Script to create archive directory with old data
  - [ ] Document migration process in MIGRATION.md

## 2. Backend Optimizer Logic

- [ ] 2.1 Create `backend/optimizer.py` to replace `council.py`
  - [ ] Implement `generate_initial_prompt(objective: str) -> str`
  - [ ] Implement `test_prompt_with_models(prompt: str, models: list) -> list[dict]`
  - [ ] Implement `collect_improvement_suggestions(prompt, outputs, feedback) -> list[dict]`
  - [ ] Implement `merge_suggestions(suggestions: list) -> str` using synthesizer LLM
- [ ] 2.2 Add version management functions
  - [ ] Implement `create_version_diff(old_prompt, new_prompt) -> dict`
  - [ ] Implement `calculate_iteration_metrics(iteration) -> dict` (avg rating, etc.)
- [ ] 2.3 Preserve and reuse parallel query infrastructure
  - [ ] Keep `openrouter.py` unchanged (already supports parallel queries)
  - [ ] Update imports in optimizer.py to use existing `query_models_parallel()`

## 3. Backend API Endpoints

- [ ] 3.1 Create new API routes in `backend/main.py`
  - [ ] `POST /api/sessions` - Create new optimization session
  - [ ] `GET /api/sessions` - List all sessions with metadata
  - [ ] `GET /api/sessions/{id}` - Get full session with all iterations
  - [ ] `POST /api/sessions/{id}/initialize` - Generate or set initial prompt
  - [ ] `POST /api/sessions/{id}/test` - Test current prompt with selected models
  - [ ] `POST /api/sessions/{id}/feedback` - Submit ratings and feedback
  - [ ] `POST /api/sessions/{id}/suggest` - Generate improvement suggestions
  - [ ] `POST /api/sessions/{id}/iterate` - Create new iteration with updated prompt
  - [ ] `GET /api/sessions/{id}/versions` - Get version history with diffs
  - [ ] `POST /api/sessions/{id}/export` - Export prompt in various formats
- [ ] 3.2 Add streaming support (optional, for progressive updates)
  - [ ] Stream test results as they complete (like current `/message/stream`)
  - [ ] Stream suggestions as LLMs respond
- [ ] 3.3 Remove or deprecate old endpoints
  - [ ] Mark `/api/conversations/*` as deprecated
  - [ ] Add deprecation warnings in responses
  - [ ] Plan removal date after migration period

## 4. Frontend Component Development

- [ ] 4.1 Create new React components
  - [ ] `PromptEditor.jsx` - Editable textarea with version selector, character count, syntax highlighting (optional)
  - [ ] `TestResults.jsx` - Grid/tab view of LLM outputs with model names and response times
  - [ ] `OutputRating.jsx` - Star rating widget + text feedback input per output
  - [ ] `FeedbackPanel.jsx` - Aggregated feedback view with metrics
  - [ ] `SuggestionAggregator.jsx` - Display suggestions from all LLMs, merge option, accept/edit controls
  - [ ] `VersionHistory.jsx` - Timeline of iterations with version numbers, timestamps, rationales
  - [ ] `VersionDiff.jsx` - Side-by-side diff view with highlighted changes
  - [ ] `IterationView.jsx` - Container component orchestrating one complete iteration cycle
- [ ] 4.2 Create main workflow component
  - [ ] `OptimizationWorkflow.jsx` - Step-by-step wizard for: initialize → test → feedback → suggest → iterate
  - [ ] Handle state transitions between workflow steps
  - [ ] Show progress indicators (e.g., "Step 2 of 5: Testing prompt")
- [ ] 4.3 Update App.jsx for new routing
  - [ ] Replace conversation-based routing with session-based routing
  - [ ] Update sidebar to show optimization sessions instead of conversations
  - [ ] Add session creation flow (modal or dedicated page)

## 5. Frontend UI/UX Implementation

- [ ] 5.1 Design and implement new layout
  - [ ] Left sidebar: Session list with metadata (iteration count, last modified)
  - [ ] Main area: Active iteration view with prompt editor, test results, feedback, suggestions
  - [ ] Right panel (optional): Version history and metrics
- [ ] 5.2 Add interactive feedback widgets
  - [ ] Star rating component (1-5 stars, interactive, immediate save)
  - [ ] Expandable text feedback areas
  - [ ] Quick feedback buttons ("Too verbose", "Lacks examples", etc.)
  - [ ] "Best output" checkbox or highlight mechanism
- [ ] 5.3 Implement version comparison UI
  - [ ] Diff visualization library integration (e.g., `react-diff-viewer`)
  - [ ] Version selector dropdown
  - [ ] "Restore this version" action button
- [ ] 5.4 Add export functionality UI
  - [ ] Export button with format dropdown (text, markdown, JSON)
  - [ ] Copy to clipboard button with confirmation toast

## 6. Testing and Validation

- [ ] 6.1 Write backend unit tests
  - [ ] Test `generate_initial_prompt()` with various objectives
  - [ ] Test `collect_improvement_suggestions()` with different feedback inputs
  - [ ] Test version diff generation
  - [ ] Test storage functions (CRUD operations for sessions and iterations)
- [ ] 6.2 Write API integration tests
  - [ ] Test complete workflow: create session → initialize → test → feedback → suggest → iterate
  - [ ] Test error handling (model failures, invalid inputs)
  - [ ] Test concurrent requests and race conditions
- [ ] 6.3 Write frontend component tests
  - [ ] Test PromptEditor editing and saving
  - [ ] Test OutputRating state updates
  - [ ] Test SuggestionAggregator merge logic
  - [ ] Test VersionDiff rendering
- [ ] 6.4 End-to-end testing
  - [ ] Manual test complete optimization flow with real OpenRouter models
  - [ ] Test with slow/failing models to verify graceful degradation
  - [ ] Test data persistence across browser refresh

## 7. Documentation and Migration

- [ ] 7.1 Update README.md
  - [ ] Change project name and description
  - [ ] Update screenshots/demos
  - [ ] Add usage examples for prompt optimization workflow
- [ ] 7.2 Create MIGRATION.md
  - [ ] Document breaking changes
  - [ ] Provide data migration instructions
  - [ ] Explain differences between old and new workflows
- [ ] 7.3 Update CLAUDE.md
  - [ ] Replace council architecture notes with optimizer architecture
  - [ ] Document new data model and workflow
  - [ ] Update API endpoint reference
- [ ] 7.4 Create user guide
  - [ ] Quick start guide for new users
  - [ ] Best practices for effective prompt optimization
  - [ ] Example optimization sessions (e.g., code review prompt, creative writing prompt)

## 8. Cleanup and Refactoring

- [ ] 8.1 Remove obsolete code
  - [ ] Delete `backend/council.py` (after confirming optimizer.py works)
  - [ ] Delete `frontend/src/components/Stage*.jsx` components
  - [ ] Remove old API endpoint handlers from `main.py`
- [ ] 8.2 Update configuration
  - [ ] Rename `COUNCIL_MODELS` to `TEST_MODELS` in `config.py`
  - [ ] Rename `CHAIRMAN_MODEL` to `SYNTHESIZER_MODEL`
  - [ ] Add new config: `DEFAULT_GENERATOR_MODEL` (for initial prompt generation)
- [ ] 8.3 Update project metadata
  - [ ] Change package name in `pyproject.toml` if needed
  - [ ] Update license/author info
  - [ ] Add new keywords: "prompt-engineering", "llm-optimization"
- [ ] 8.4 Archive old data
  - [ ] Move `data/conversations/` to `data/archive/council-conversations/`
  - [ ] Create fresh `data/sessions/` directory for optimization sessions
  - [ ] Add `.gitkeep` or README in archive explaining old data

## 9. Performance and Cost Optimization

- [ ] 9.1 Implement cost estimation
  - [ ] Calculate token counts for prompts and estimated outputs
  - [ ] Look up pricing per model from OpenRouter API or config
  - [ ] Display cost before running tests, require confirmation if high
- [ ] 9.2 Add caching (optional)
  - [ ] Cache test results for identical (prompt, model) pairs
  - [ ] TTL-based invalidation (e.g., 1 hour)
  - [ ] Clear cache option for users
- [ ] 9.3 Optimize parallel queries
  - [ ] Reuse existing `asyncio.gather()` for concurrent model queries
  - [ ] Add timeout per model (don't let one slow model block others)
  - [ ] Display progress indicator (e.g., "3/5 models completed")

## 10. Deployment and Release

- [ ] 10.1 Version bump and changelog
  - [ ] Bump version to 2.0.0 (major breaking change)
  - [ ] Write comprehensive CHANGELOG.md entry
  - [ ] Tag release: `git tag v2.0.0`
- [ ] 10.2 Update deployment scripts
  - [ ] Ensure backend starts with new endpoints
  - [ ] Rebuild frontend with new components
  - [ ] Test production build locally before deploying
- [ ] 10.3 Backup and rollback plan
  - [ ] Create backup of production data before deployment
  - [ ] Document rollback steps (restore v1.x tag)
  - [ ] Test rollback procedure in staging environment
- [ ] 10.4 User communication
  - [ ] Announce breaking changes to users (if applicable)
  - [ ] Provide migration guide and support
  - [ ] Offer office hours or Q&A for transition period
