# Change: Persisted test sets for prompt testing

## Why
- Prompt testing currently relies on ad-hoc text input, so test context is lost between runs and cannot be reused.
- The user flow should shift to selecting a saved test sample instead of typing freeform input, with the test set stored persistently.
- Iteration history needs to record which test sample was used so results and feedback stay traceable.

## What Changes
- Add session-scoped test set management (create/edit/delete) with persistent storage.
- Update the testing flow to require choosing a saved test sample and run models against that sample.
- Persist the link between an iteration's test results and the selected sample so UI can show which case was exercised.

## Impact
- Affected specs: prompt-optimization (testing workflow, test-set persistence).
- Affected code: backend `storage.py`/`main.py`/`optimizer.py` (test set CRUD, test execution input resolution), frontend `IterationView`/testing UI and related API client methods, data format under `data/sessions/*.json`.
