# Capability: Prompt Optimization

## ADDED Requirements

### Requirement: Session Test Set Persistence
The system SHALL support a session-scoped test set of named samples that is stored persistently and available across reloads.

#### Scenario: Save and reuse test samples
- **WHEN** a user creates or edits a test sample (title and test input) for a session
- **THEN** the sample SHALL be persisted with that session and remain available after reload
- **AND** the sample SHALL appear in the selection list when starting a test

#### Scenario: Remove obsolete samples
- **WHEN** a user deletes a test sample
- **THEN** it SHALL no longer be offered for selection in that session
- **AND** existing iterations that referenced it SHALL continue to display their recorded test sample name without failing

### Requirement: Dataset-Driven Prompt Testing
The system SHALL run prompt tests using a selected saved test sample and record that association on the iteration.

#### Scenario: Run tests from selected sample
- **WHEN** a user selects a saved test sample and triggers testing
- **THEN** the backend SHALL resolve the sample content and supply it as the test input when querying models
- **AND** the iteration SHALL record the test sample identifier and name alongside the test results and stage
- **AND** the UI SHALL show the selected sample's name and content with the returned results

#### Scenario: Block testing without sample
- **WHEN** no test sample is selected or the test set is empty
- **THEN** the UI SHALL prompt the user to create or select a test sample and prevent triggering a test run
- **AND** the backend SHALL reject test requests that do not provide a valid test sample

#### Scenario: Switching samples resets dependent data
- **WHEN** the user switches to a different test sample for a version and reruns tests
- **THEN** prior test results, feedback, and suggestions for that version SHALL be cleared before the new run to avoid mixing contexts
