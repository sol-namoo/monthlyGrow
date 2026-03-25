# TypeScript Cleanup Stage 1

Date: 2026-03-25
Branch: `refactor/i18n-centralization`

## Goal

Before touching the i18n architecture, make the root app TypeScript check pass again so the i18n refactor can be reviewed on a clean base.

## What Was Broken

The root `tsconfig.json` was compiling `functions/` together with the Next.js app even though `functions/` is a separate package with its own `package.json` and `tsconfig.json`.

The app layer also had several stale type mismatches:

- `Monthly.connectedProjects` had become `ConnectedProjectGoal[]`, but some UI code still treated it as `Project[]`.
- `Monthly.objectiveDescription` had replaced `monthly.description` in some views.
- `LoadingOverlay` was being used with both `isLoading` and `isVisible`.
- `UnifiedArchive` requires `parentType`, but some archive creation paths did not provide it.
- A few components referenced fields that do not exist on current shared types, such as `Area.title`, `Project.progressPercentage`, and `Project.areaName`.

## Fixes Applied

- Excluded `functions/` from the root app `tsconfig.json`.
- Normalized `LoadingOverlay` props so both `isLoading` and `isVisible` work.
- Fixed the infinite query typing in `PastMonthliesTab`.
- Stopped treating `monthly.connectedProjects` as `Project[]` in monthly detail flows.
- Switched monthly detail description rendering to `objectiveDescription`.
- Added missing `parentType` values to archive creation calls.
- Replaced stale field references with current ones:
  - `Area.title` -> `Area.name`
  - `Project.progressPercentage` -> computed progress
  - `Project.areaName` -> `Project.area`
- Removed an invalid `Retrospective` import.

## Result

`./node_modules/.bin/tsc --noEmit` now passes at the repository root for the app workspace.

## Why This Matters For The Next Step

The upcoming Jotai centralization should be isolated to i18n/settings behavior, not mixed with unrelated red TypeScript output. This cleanup makes the next refactor easier to review, test, and revert if needed.
