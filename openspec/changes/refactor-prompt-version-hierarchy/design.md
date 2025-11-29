## Context
- Users need a clear view of prompts (sessions) with their versions and per-version stages in the sidebar.
- Stage is currently stored at session level; restoring a prior version should overwrite the current prompt/stage in place (per user: restore = 覆盖).
- Prompts are equivalent to sessions; versions can come from initial creation or later iterations.

## Goals / Non-Goals
- Goals: per-version stage metadata, restore action (overwrite), nested prompt→version UI, consistent API shapes for list/detail.
- Non-Goals: branching/version diff UI, collaboration/locking, migration beyond minimal backfill of stage onto iterations.

## Decisions
- Stage lives on iterations (versions); session-level stage derived from latest for backward compatibility.
- Restore overwrites current prompt/stage to the selected version without creating a new version entry.
- Sidebar becomes a two-level tree: prompt/session with nested versions, each showing stage badge and restore affordance.
- API returns versions (iterations) with stage info; restore route uses version number and returns updated session/iteration list.

## Risks / Trade-offs
- Overwrite semantics can drop unsaved work if not guarded; mitigation: confirm in UI and refresh from server after restore.
- Legacy clients relying on session-level stage may see stale data; mitigation: keep session.stage = latest iteration stage.

## Open Questions
- Do we need pagination/virtualization for very large version lists? (Assumed out of scope; simple scroll for now.)
