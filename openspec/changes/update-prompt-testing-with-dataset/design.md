## Context
- Prompt testing currently uses one-off `test_input` strings provided ad hoc by the user; nothing is persisted, so retesting requires retyping and iterations don't capture which context was exercised.
- The request is to change testing to draw from a saved test set and to persist that set, implying new storage, API, and UI flows plus iteration metadata linking tests to samples.
- Backend uses JSON session files under `data/sessions/`; frontend runs the testing step inside `IterationView` with a freeform textarea.

## Goals / Non-Goals
- Goals: persist session-scoped test samples; require selecting a saved sample to run tests; surface which sample was used alongside results; allow basic CRUD on test samples.
- Non-Goals: global/shared test libraries across sessions; advanced dataset features (tags, versioning, attachments), model-specific overrides, or batch-running multiple samples at once.

## Decisions
- **Data model**: store a `test_set` array on each session JSON with entries `{id, title, input, notes?, created_at, updated_at}`; backfill existing sessions with an empty array and keep references in iterations via `test_sample_id` plus optional `test_sample_title`.
- **APIs**: add RESTful CRUD under `/api/sessions/{id}/test-samples` (list/create/update/delete) and change `/api/sessions/{id}/test` to accept `test_sample_id` (optionally allow ad-hoc `test_input` only for backward compatibility if needed, but prefer strict sample selection).
- **Execution flow**: resolve the test input by fetching the selected sample before calling `test_prompt_with_models`; store the `test_sample_id` (and title) alongside `test_results` in the iteration so UI can display context and stale data can be cleared when the sample changes.
- **Frontend UX**: replace the freeform test textarea with a selector + lightweight editor for test samples; block running tests until a sample is chosen; show the selected sample's name/content near results and clear prior feedback/suggestions when switching samples.
- **Persistence**: reuse the existing session file to persist the test set to avoid new storage locations; ensure CRUD updates write back to disk and survive reloads.

## Risks / Trade-offs
- Introducing CRUD endpoints increases UI complexity; keeping the editor minimal (title + input + optional notes) avoids scope creep.
- Storing the test set inside the session file can bloat the JSON if users add many large samples; keep samples text-only and small, with a warning in UI if size becomes an issue.
- Backward compatibility with any previously saved `test_input` is unclear; providing a temporary ad-hoc path or migration avoids blocking old sessions.

## Migration Plan
- Backfill `test_set` to `[]` on session load when missing; tolerate iterations that lack `test_sample_id`.
- Consider an optional one-time mapping: if an iteration has recent `test_results` but no sample reference, allow the first new sample save to be linked manually by the user rather than auto-assigning.

## Open Questions
- Should ad-hoc (unsaved) test input remain allowed, or must all tests use a saved sample?
- Are test samples strictly per session, or should there be a reusable/global library?
- Do samples need extra metadata (expected output, tags) beyond title/input/notes for MVP?
