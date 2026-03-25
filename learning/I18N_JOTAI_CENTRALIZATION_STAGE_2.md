# I18n Jotai Centralization Stage 2

Date: 2026-03-25
Branch: `refactor/i18n-centralization`

## Goal

Remove per-component settings bootstrapping and move language/settings initialization to a single root-level store.

## The Original Problem

`useLanguage()` was calling `useSettings()`, and `useSettings()` was not a passive selector hook.

It contained:

- its own `useState`
- its own `useEffect` bootstrap logic
- `localStorage` reads
- Firestore reads
- theme synchronization

That meant every component using `useLanguage()` was indirectly spinning up a fresh settings lifecycle.

## Why The UI Felt Sloppy

The app rendered with a default language first, then later switched after client-side effects completed.

The root cause was:

1. default language was available immediately
2. actual language was loaded later from `localStorage` or Firestore
3. many components repeated that process independently

So the problem was not just "missing translation files". It was duplicated initialization.

## Changes Applied

- Added a dedicated settings store with Jotai atoms.
- Added a root `SettingsProvider` that hydrates an initial snapshot and performs the one-time async bootstrap.
- Moved saved-language lookup into shared helpers.
- Refactored `useSettings()` so it reads and updates the centralized atom instead of owning its own state machine.
- Refactored `useLanguage()` so it reads the centralized atom directly.
- Wrapped the app root with `SettingsProvider`.
- Updated the README so the i18n stack description matches the actual implementation.

## Result

Language/settings state now has one initialization path per app session instead of one initialization path per hook call site.

This does not magically give the app full server-driven locale rendering, but it removes the biggest structural source of client-side language flicker.

## Next Logical Step

If needed later, the next improvement would be server-aware language persistence such as cookies or route-based locale handling. That would be the point where a full `react-i18next` migration becomes more compelling.
