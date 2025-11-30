# API Key Management Capability

## ADDED Requirements

### Requirement: UI-based API Key Configuration
The system SHALL provide a settings interface for users to configure API keys through the UI.

#### Scenario: Access settings page
- **WHEN** user clicks the settings icon in the main interface
- **THEN** a settings page or modal opens
- **AND** the current API key configuration is displayed (masked)

#### Scenario: Save API key
- **WHEN** user enters an API key and clicks save
- **THEN** the key is persisted to the configuration file
- **AND** a success message is displayed

#### Scenario: Validate API key
- **WHEN** user clicks the validate button
- **THEN** the system tests the API key against the provider
- **AND** displays whether the key is valid or invalid

#### Scenario: Mask sensitive input
- **WHEN** API key input field is displayed
- **THEN** the value is masked by default (password field)
- **AND** user can toggle visibility

### Requirement: Persistent Configuration Storage
The system SHALL store API keys in a platform-appropriate configuration file.

#### Scenario: Platform-specific storage location
- **WHEN** running on Windows
- **THEN** config is stored at `%APPDATA%/LLMCouncil/config.json`
- **WHEN** running on macOS
- **THEN** config is stored at `~/Library/Application Support/LLMCouncil/config.json`
- **WHEN** running on Linux
- **THEN** config is stored at `~/.config/LLMCouncil/config.json`

#### Scenario: Config file permissions
- **WHEN** the configuration file is created
- **THEN** file permissions SHALL be set to owner-only read/write (600 on Unix)

#### Scenario: Backward compatibility with environment variables
- **WHEN** no API key is configured in the config file
- **AND** an API key exists in environment variables
- **THEN** the system SHALL use the environment variable value

### Requirement: First-run Setup Guidance
The system SHALL guide users to configure API keys on first launch.

#### Scenario: Detect missing API key
- **WHEN** the application starts without a configured API key
- **THEN** the settings page opens automatically
- **AND** a message explains that an API key is required

#### Scenario: Skip guidance if configured
- **WHEN** the application starts with a valid API key
- **THEN** the main interface loads directly
- **AND** no setup prompt is shown
