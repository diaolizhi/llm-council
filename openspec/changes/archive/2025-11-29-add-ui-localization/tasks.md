# Implementation Tasks: Add UI Localization

## 1. I18n Foundation
- [x] 1.1 Create i18n constants, translation catalogs (EN/CH), and provider/hook with English fallback and auto-detect (browser language) + persisted choice (localStorage).

## 2. UI Integration
- [x] 2.1 Wrap app in i18n provider and render a language switcher in the global UI.
- [x] 2.2 Replace hard-coded UI strings with translation keys across current components (App, Sidebar, IterationView, PromptEditor, TestResults, OutputRating, SuggestionAggregator). Leave user inputs/LLM outputs untouched.

## 3. Validation
- [x] 3.1 Manual verify: initial load auto-detects locale, switcher toggles language immediately, preference persists after reload, missing keys fall back to English without breaking UI.
