# Change: Refactor prompt version hierarchy and restore flow

## Why
- The current UI lists sessions flatly and shows only the latest iteration, making it hard to navigate prompt versions or see their stage/state.
- Stage is tracked at the session level, so restoring or inspecting a specific version’s stage is impossible.
- Users need a clear prompt→version hierarchy with per-version stage visibility and an explicit restore action (overwrite) to manage prompt evolution.

## What Changes
- Add a prompt list UI that nests versions under each prompt (session), showing per-version stage/status and restore controls.
- Store stage metadata on each version and expose it via list/detail APIs to keep UI and data aligned.
- Provide a restore endpoint/action that overwrites the current prompt/stage with the selected version (no new version creation).
- Ensure versions can originate from both brand-new prompts and iteration outputs, surfaced consistently in the UI.

## Impact
- Affected specs: prompt-optimization (version hierarchy, per-version stage, restore semantics).
- Affected code: backend `storage.py` (per-version stage, restore), backend `main.py` (restore endpoint, responses), frontend `api.js` (restore/list shape), `Sidebar`/version list UI, `IterationView`/selection handling.
