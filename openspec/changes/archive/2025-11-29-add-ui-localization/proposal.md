# Change: Add UI Localization (English + Chinese)

## Why
- Users need the interface in both English and Chinese to improve usability and accessibility.
- Current UI strings are hard-coded in English with no translation mechanism or persistence.
- A lightweight i18n layer enables future locales without large refactors.

## What Changes
- Add a frontend i18n provider with auto-detection (browser language), manual locale switching, and English fallback.
- Externalize all user-facing UI copy into translation catalogs for English and Chinese, including placeholders and empty/error states.
- Persist user locale choice across reloads (localStorage) without altering user/LLM content.

## Impact
- Affected specs: new `localization` capability.
- Affected code: `frontend/src/App.jsx`, `frontend/src/components/*`, new `frontend/src/i18n/*` files.
