# Stage 3: SSR Language Seed and Client Reconciliation

## Goal

Reduce language flicker by splitting responsibilities clearly:

- Server decides the initial language for the request.
- Client store starts from that language immediately.
- A single provider reconciles persisted sources after hydration.
- Pages only consume `useLanguage()` and do not fetch language on their own.

## Why Stage 2 Was Not the End

Stage 2 centralized language and settings state in Jotai, which removed the worst problem:
multiple hooks independently initializing language after render.

That fixed the architecture, but not the full first-paint experience.

The remaining issue is timing:

- Firestore settings are only available after client auth and fetch.
- So Firestore alone cannot guarantee correct language during server render.

## Target Source Priority

Use different sources for different phases.

### Server render

1. `language` cookie
2. fallback to `"en"`

### Client boot

1. server-provided initial language
2. if logged in, reconcile with Firestore `user.settings.language`

### Persistence after language change

When the user changes language, update all relevant layers:

1. client store (immediate UI update)
2. `language` cookie (server can SSR next request correctly)
3. Firestore user settings if authenticated (cross-device persistence)

## Runtime Flow

### Returning user with cookie

1. Browser requests page.
2. Request includes `language` cookie.
3. Next server reads cookie in the root layout.
4. Server passes `initialLanguage` to `SettingsProvider`.
5. Client store is hydrated with that language.
6. Components using `useLanguage()` render immediately with the correct language.
7. After mount, `SettingsProvider` may fetch Firestore settings.
8. If Firestore language differs, the provider reconciles store/cookie.

### New user before Firestore settings exist

1. User chooses language on login page.
2. Client writes:
   - `language` cookie
3. User signs up / enters onboarding.
4. Next request already carries the cookie.
5. Server can SSR the selected language even before Firestore settings exist.
6. After account creation, the same language is written to Firestore.

## Responsibility Split

### Root server layout

- Reads `language` cookie.
- Chooses the request's initial language.
- Passes `initialLanguage` into the client settings provider.

### `SettingsProvider`

- Initializes the Jotai settings atom from `initialLanguage`.
- After hydration, reconciles with Firestore if needed.
- If authenticated, reconciles with Firestore settings.
- If a later source wins, updates:
  - Jotai atom
  - `language` cookie

### Language-changing UI

Examples:

- login page language toggle
- settings page language selector

These do not decide rendering strategy.
They only write the chosen language to the persistence layers.

### Normal pages

Examples:

- `/home`
- `/monthly`
- `/para`

These should not read `localStorage`, cookies, or Firestore for language.
They only call `useLanguage()`.

## Mental Model: SSR vs Client Store

The easiest way to think about it:

- SSR does not persist client state.
- SSR only creates one response for one request.
- The Jotai store lives in the browser runtime after hydration.

So the server's job is only:

- "What language should this request start with?"

The client store's job is:

- "What language is active in this browser session right now?"

The persistence layer's job is:

- "What language should be restored next time?"

## What This Stage Changes Conceptually

Before:

- language came from too many places at inconsistent times
- client hooks tried to discover language after render
- first paint often started in the default language

After:

- server provides an initial language seed
- the client store starts from that seed
- one provider performs post-hydration reconciliation
- pages only consume language, never discover it themselves

## MonthlyGrow-Specific Implementation Plan

1. Add a `language` cookie utility.
2. Read that cookie in `app/layout.tsx`.
3. Pass `initialLanguage` into `SettingsProvider`.
4. Hydrate the Jotai settings atom from that prop.
5. Keep `SettingsProvider` as the only reconciliation point.
6. Update login/settings flows so language changes write both store and cookie.

## Expected Result

If the cookie is present:

- first HTML already matches the chosen language
- hydration starts from the same language
- no default-language flash should appear

If the cookie is missing:

- the app falls back cleanly
- authenticated Firestore settings can still reconcile after mount
