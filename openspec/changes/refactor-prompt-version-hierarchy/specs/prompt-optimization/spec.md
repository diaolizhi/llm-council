# Capability: Prompt Optimization

## ADDED Requirements

### Requirement: Prompt Version Hierarchy Display
The system SHALL present prompts (sessions) with nested versions in the left panel, showing per-version stage/status.

#### Scenario: Show prompt with versions and stages
- **WHEN** the user opens the app
- **THEN** the sidebar SHALL list each prompt with its versions ordered by most recent first
- **AND** each version SHALL display its stage (e.g., init, prompt_ready, title_ready, tested)
- **AND** the user SHALL be able to select a version to view its details

#### Scenario: Prompt without versions
- **WHEN** a prompt has no versions yet
- **THEN** the sidebar SHALL render the prompt entry with an empty-state indicator
- **AND** provide an affordance to create the first version

### Requirement: Per-Version Stage Persistence
The system SHALL store and return stage metadata per version, including versions created from new prompts or iterations.

#### Scenario: Persist stage on version
- **WHEN** a version is created (from initial prompt or an iteration result)
- **THEN** the system SHALL store its stage on the version record
- **AND** list/detail APIs SHALL return the stage for each version
- **AND** the session-level stage SHALL mirror the latest version’s stage for backward compatibility

#### Scenario: Versions from multiple origins
- **WHEN** a version originates from a brand-new prompt or from an iteration result
- **THEN** it SHALL be included in the prompt’s version list with correct stage and timestamp
- **AND** it SHALL be selectable in the sidebar the same way as any other version

### Requirement: Version Restore Overwrite
The system SHALL allow restoring a selected version’s prompt/stage by overwriting the current state (no new version creation).

#### Scenario: Restore selected version in place
- **WHEN** the user triggers restore on a specific version
- **THEN** the system SHALL overwrite the current prompt and stage with that version’s data
- **AND** SHALL NOT create a new version entry
- **AND** SHALL refresh the prompt/version list to reflect the restored stage

#### Scenario: Restore failure handling
- **WHEN** a restore operation fails (e.g., missing version, backend error)
- **THEN** the system SHALL keep the current prompt/stage unchanged
- **AND** SHALL surface an error to the user
