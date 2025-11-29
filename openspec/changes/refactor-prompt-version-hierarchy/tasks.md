## 1. Implementation
- [x] 1.1 Add per-version stage/state to storage model and responses (keep session-level stage backward compatible).
- [x] 1.2 Add backend restore endpoint that overwrites current prompt/stage from a selected version; include error handling.
- [x] 1.3 Extend frontend API client for nested prompt/version data and restore action.
- [x] 1.4 Refactor sidebar UI to render prompt→version hierarchy with stage badges and restore controls.
- [x] 1.5 Update iteration/detail view to respect selected version and show per-version stage metadata.
- [x] 1.6 Add manual new-version creation for existing prompts from the detail view.

## 2. Validation
- [x] 2.1 Run `openspec validate refactor-prompt-version-hierarchy --strict`.
- [ ] 2.2 Manual check: empty prompts list, prompt with no versions, restore failure path surfaces error.
- [ ] 2.3 Manual check: restore overwrites current prompt/stage and UI refreshes nested list.
