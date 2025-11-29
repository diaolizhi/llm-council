## 1. Implementation
- [x] 1.1 Add session-scoped test set persistence in `backend/storage.py` with CRUD helpers and backfill defaults.
- [x] 1.2 Expose API routes in `backend/main.py` to manage test samples and update `/api/sessions/{id}/test` to require a selected sample and record it with results.
- [x] 1.3 Adjust optimizer/test execution to resolve test input from the selected sample and attach sample metadata to iteration history.
- [x] 1.4 Update frontend testing UI to manage/select test samples, drive test actions from the selection, and surface which sample was used in results.

## 2. Validation
- [x] 2.1 Run `openspec validate update-prompt-testing-with-dataset --strict`.
- [ ] 2.2 Manual check: create/edit/delete test samples persist across reloads and are session-scoped.
- [ ] 2.3 Manual check: testing without a selected sample is blocked; running with a selected sample displays its name/content with the results and clears stale feedback/suggestions.
