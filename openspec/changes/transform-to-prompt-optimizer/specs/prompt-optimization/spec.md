# Capability: Prompt Optimization

Core iterative prompt improvement workflow that enables users to generate, test, and refine prompts based on multi-LLM feedback.

## ADDED Requirements

### Requirement: Prompt Initialization from Objectives
The system SHALL generate an initial prompt when the user provides an objective description.

#### Scenario: Generate prompt from objective
- **WHEN** user submits an objective like "Create a code review prompt"
- **THEN** system calls an LLM to generate a detailed initial prompt
- **AND** creates iteration 1 with generated prompt
- **AND** displays generated prompt in editor for user review/editing

#### Scenario: Start with existing prompt
- **WHEN** user submits a complete prompt text directly
- **THEN** system uses the provided text as-is for iteration 1
- **AND** skips generation step
- **AND** proceeds to prompt testing phase

### Requirement: Iterative Prompt Refinement
The system SHALL support unlimited optimization iterations for a single prompt.

#### Scenario: Create new iteration from suggestions
- **WHEN** user accepts improvement suggestions from previous iteration
- **THEN** system creates new iteration with version number = previous + 1
- **AND** stores change rationale (why this version was created)
- **AND** preserves previous iteration in version history
- **AND** allows user to edit merged suggestions before testing

#### Scenario: Manual prompt editing between iterations
- **WHEN** user modifies prompt text in editor
- **THEN** system tracks changes as draft (not saved iteration)
- **AND** user can test modified prompt without committing to new version
- **AND** successful test with user approval creates new iteration

### Requirement: Improvement Suggestion Generation
The system SHALL collect improvement suggestions from all tested LLMs based on user feedback.

#### Scenario: Generate suggestions after feedback collection
- **WHEN** user completes feedback for tested outputs
- **THEN** system prompts each tested LLM to suggest prompt improvements
- **AND** provides each LLM with: current prompt, all test outputs, user ratings and feedback
- **AND** collects suggestions in parallel (same infrastructure as testing)
- **AND** displays all suggestions individually for user review

#### Scenario: Aggregate suggestions into single improved prompt
- **WHEN** multiple LLMs provide suggestions
- **THEN** system optionally uses a synthesizer LLM to merge suggestions
- **AND** user can choose between: merged version, individual suggestions, or manual edit
- **AND** merged suggestion is presented as editable text (not auto-applied)

### Requirement: Version History Management
The system SHALL maintain complete history of all prompt versions within an optimization session.

#### Scenario: Display version timeline
- **WHEN** user views version history
- **THEN** system shows all iterations with: version number, timestamp, change rationale, average rating
- **AND** allows clicking any version to view details
- **AND** highlights current active version

#### Scenario: Compare prompt versions
- **WHEN** user selects two versions to compare
- **THEN** system displays side-by-side diff view
- **AND** highlights additions (green) and deletions (red)
- **AND** shows metadata: which version performed better (by avg rating)

#### Scenario: Restore previous version
- **WHEN** user chooses to restore an older version
- **THEN** system creates new iteration with restored prompt text
- **AND** change rationale indicates "Restored from version X"
- **AND** preserves all intervening versions (no deletion)

### Requirement: Optimization Session Persistence
The system SHALL save optimization sessions with all iterations and metadata.

#### Scenario: Resume optimization session
- **WHEN** user reopens a saved optimization session
- **THEN** system loads all iterations chronologically
- **AND** displays latest iteration as active
- **AND** allows continuing optimization from current state
- **AND** preserves all test results and feedback from previous sessions

#### Scenario: Session metadata display
- **WHEN** user views session list
- **THEN** each session shows: title, objective (if provided), iteration count, last modified timestamp
- **AND** indicates optimization status (active, completed, archived)
- **AND** allows sorting by recency or iteration count

### Requirement: Prompt Export and Sharing
The system SHALL allow exporting optimized prompts in multiple formats.

#### Scenario: Export final prompt
- **WHEN** user exports an optimized prompt
- **THEN** system provides formats: plain text, markdown (with version history), JSON (with all metadata)
- **AND** includes: final prompt text, optimization rationale, performance metrics (avg ratings per version)

#### Scenario: Copy prompt to clipboard
- **WHEN** user clicks "copy prompt"
- **THEN** system copies current prompt version to clipboard
- **AND** shows confirmation message
- **AND** optionally includes attribution comment (configurable)
