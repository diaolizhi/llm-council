# Capability: Feedback Collection

User feedback collection system for rating and commenting on LLM outputs to guide prompt optimization.

## ADDED Requirements

### Requirement: Output Rating System
The system SHALL allow users to rate each LLM output on a numerical scale.

#### Scenario: Rate output with star rating
- **WHEN** user views an LLM output from a test
- **THEN** system displays 1-5 star rating widget
- **AND** allows selecting rating by clicking stars
- **AND** saves rating immediately upon selection
- **AND** visually indicates current rating

#### Scenario: Update previous rating
- **WHEN** user clicks different star rating
- **THEN** system updates stored rating
- **AND** reflects change in UI immediately
- **AND** triggers recalculation of aggregate metrics (avg rating for this iteration)

### Requirement: Textual Feedback Collection
The system SHALL allow users to provide detailed text feedback for each output.

#### Scenario: Add detailed feedback
- **WHEN** user expands feedback section for an output
- **THEN** system displays text input field
- **AND** allows entering multiple lines of feedback
- **AND** saves feedback on blur or explicit save action
- **AND** shows character count (optional limit: 1000 chars)

#### Scenario: Optional feedback
- **WHEN** user rates output but skips text feedback
- **THEN** system proceeds without text feedback
- **AND** allows continuing to next step
- **AND** does not block workflow

#### Scenario: Pre-filled feedback options
- **WHEN** user clicks quick feedback option
- **THEN** system inserts common feedback templates: "Too verbose", "Lacks examples", "Incorrect information", "Good structure but needs detail"
- **AND** user can edit template or keep as-is
- **AND** reduces friction for providing structured feedback

### Requirement: Comparative Feedback
The system SHALL support comparing outputs to identify best/worst performers.

#### Scenario: Highlight best output
- **WHEN** user marks an output as "best"
- **THEN** system visually distinguishes it (e.g., green border)
- **AND** uses this signal for improvement suggestions
- **AND** allows only one "best" per iteration

#### Scenario: Flag problematic output
- **WHEN** user marks output as "problematic"
- **THEN** system flags it for exclusion from positive examples
- **AND** asks for reason (hallucination, off-topic, too short, etc.)
- **AND** uses feedback to avoid similar issues in next iteration

### Requirement: Aggregate Feedback Metrics
The system SHALL calculate and display aggregate feedback metrics per iteration.

#### Scenario: Display iteration metrics
- **WHEN** user completes feedback for an iteration
- **THEN** system shows: average rating across all outputs, rating distribution (how many 5-star, 4-star, etc.), common feedback themes
- **AND** compares to previous iteration (improvement indicator)

#### Scenario: Per-model performance tracking
- **WHEN** multiple iterations tested same models
- **THEN** system shows model performance trends: average rating over time, consistency score (variance in ratings)
- **AND** helps user identify which models work best for this prompt type

### Requirement: Feedback Export
The system SHALL allow exporting feedback data for external analysis.

#### Scenario: Export feedback as CSV
- **WHEN** user exports feedback data
- **THEN** system generates CSV with columns: iteration, model, rating, feedback_text, timestamp
- **AND** includes aggregate metrics row
- **AND** downloads file to user's device

#### Scenario: Include feedback in session export
- **WHEN** user exports optimization session (JSON/markdown)
- **THEN** feedback is included with test results
- **AND** provides complete audit trail of optimization decisions

### Requirement: Feedback Validation
The system SHALL validate feedback data before using for optimization.

#### Scenario: Require minimum feedback
- **WHEN** user tries to proceed without rating any outputs
- **THEN** system shows warning: "Please rate at least one output to generate improvement suggestions"
- **AND** allows dismissing warning to proceed anyway (no hard block)

#### Scenario: Detect contradictory feedback
- **WHEN** user rates an output highly but provides negative text feedback
- **THEN** system shows gentle prompt: "Your rating (5 stars) and feedback (negative) seem to contradict. Would you like to review?"
- **AND** allows user to confirm or revise

### Requirement: Feedback Privacy
The system SHALL handle user feedback data according to privacy expectations.

#### Scenario: Local storage only
- **WHEN** feedback is saved
- **THEN** system stores it locally in conversation JSON
- **AND** does not send to external analytics without explicit consent
- **AND** includes feedback in LLM prompts only for improvement suggestions (within this session)

#### Scenario: Optional feedback sharing
- **WHEN** user opts in to feedback sharing (future feature)
- **THEN** system can contribute anonymized feedback to aggregate prompt performance database
- **AND** requires explicit consent with clear explanation
- **AND** allows opting out at any time
