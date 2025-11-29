# Capability: LLM Testing

Parallel prompt testing infrastructure that executes the same prompt across multiple LLMs and collects outputs for comparison.

## ADDED Requirements

### Requirement: Multi-LLM Prompt Testing
The system SHALL test a given prompt against multiple LLM models in parallel.

#### Scenario: Test prompt with default models
- **WHEN** user initiates prompt testing
- **THEN** system queries all configured test models simultaneously
- **AND** uses the same prompt text for all models
- **AND** collects outputs with consistent formatting
- **AND** associates each output with its source model identifier

#### Scenario: Test prompt with custom model selection
- **WHEN** user selects specific models to test
- **THEN** system queries only selected models
- **AND** allows deselecting expensive or slow models
- **AND** requires at least 1 model to be selected
- **AND** saves model selection preference for this session

### Requirement: Test Result Collection
The system SHALL capture and store complete test results from each LLM.

#### Scenario: Successful model response
- **WHEN** an LLM successfully responds to the test prompt
- **THEN** system stores: model identifier, full output text, timestamp, response time
- **AND** preserves any structured content (code blocks, lists) in output
- **AND** displays output with proper markdown rendering

#### Scenario: Model failure or timeout
- **WHEN** an LLM fails to respond or times out
- **THEN** system marks that test as failed
- **AND** includes error message in test results
- **AND** continues testing with other models (graceful degradation)
- **AND** notifies user of partial results

### Requirement: Test Configuration
The system SHALL allow configuring test parameters per prompt or globally.

#### Scenario: Configure test timeout
- **WHEN** user sets custom timeout for a test
- **THEN** system waits up to specified duration (default: 120 seconds)
- **AND** cancels request if timeout exceeded
- **AND** returns timeout error in test results

#### Scenario: Configure model parameters
- **WHEN** user sets temperature, max_tokens, or other parameters
- **THEN** system passes parameters to OpenRouter API
- **AND** applies same parameters to all tested models
- **AND** stores parameters with test results for reproducibility

### Requirement: Test Result Comparison
The system SHALL provide tools to compare outputs from different models.

#### Scenario: Side-by-side output view
- **WHEN** user views test results
- **THEN** system displays outputs in grid or tab layout
- **AND** aligns outputs for easy comparison
- **AND** shows model name and response time for each

#### Scenario: Highlight output differences
- **WHEN** comparing outputs for similar prompts
- **THEN** system optionally highlights unique content per model
- **AND** shows overlap/agreement across models
- **AND** helps user identify which model provides most comprehensive response

### Requirement: Test Rerun Capability
The system SHALL allow rerunning tests without creating new iterations.

#### Scenario: Rerun single model test
- **WHEN** user requests rerun for a specific model
- **THEN** system queries only that model
- **AND** replaces previous result for that model
- **AND** preserves results from other models
- **AND** updates timestamp for rerurn test

#### Scenario: Rerun all tests
- **WHEN** user requests full rerun of current iteration
- **THEN** system queries all selected models again
- **AND** replaces all previous results
- **AND** preserves user feedback and ratings (ask for confirmation if feedback exists)

### Requirement: Cost Estimation
The system SHALL provide cost estimates before running tests.

#### Scenario: Display estimated cost
- **WHEN** user initiates a test
- **THEN** system calculates approximate cost based on: selected models, prompt length, estimated output length
- **AND** displays cost in USD or tokens
- **AND** shows per-model breakdown
- **AND** requires confirmation if cost exceeds threshold (e.g., $0.50)

#### Scenario: Track cumulative costs
- **WHEN** multiple tests are run in a session
- **THEN** system tracks total estimated cost
- **AND** displays cumulative spend for current session
- **AND** warns if approaching budget limit (configurable)
