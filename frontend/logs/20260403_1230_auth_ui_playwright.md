# Auth UI — Email/Phone Signup, Login, OTP Verification + Playwright E2E

**Date**: 03-04-2026 12:30  
**Feature**: Full auth frontend + E2E test suite

## What Was Built
1. **SignUpPage** — full rewrite; email/phone toggle tabs; form validation; on success navigates to `/verify-email?identifier=X&type=email|phone`
2. **LoginPage** — email/phone toggle tabs added to existing page
3. **EmailVerificationPage** — full rewrite; reads `?identifier=&type=` URL params; 6-digit OTP input with auto-focus/backspace/paste support; calls real `POST /auth/otp/verify/`; shows success state then redirects to `/`
4. **authService.js** — `register()` accepts `{email|phoneNumber, password, firstName, lastName}` → returns `{identifier, identifierType}`; `login()` accepts email or phoneNumber
5. **AuthContext.jsx** — updated `signup()` and `login()` signatures; added `completeVerification()` which calls verifyOtp and sets user state
6. **Playwright config** (`playwright.config.js`) — `headless: false`, `slowMo: 400ms` for visible flow; screenshots/video/trace enabled
7. **E2E tests** (`e2e/auth.spec.js`) — 14 scenarios covering full auth flow

## Files Changed
- `src/pages/SignUpPage.jsx`
- `src/pages/LoginPage.jsx`
- `src/pages/EmailVerificationPage.jsx`
- `src/services/authService.js`
- `src/context/AuthContext.jsx`
- `e2e/auth.spec.js` (created)
- `playwright.config.js` (created)
- `package.json` — added `test:e2e` and `test:e2e:headed` scripts

## Key Decisions
- Signup does NOT return JWT; user must complete OTP before getting tokens
- `completeVerification()` in AuthContext calls `verifyOtp` and then sets user + tokens in state
- Playwright uses local `@playwright/test` binary, not global `playwright` package (version conflict)
- Dev server must be started from `e:\ecom-project\frontend` using local vite binary (not global npx vite)

## Test Results
14/14 Playwright E2E tests passing

## Issues Resolved
- `EmailVerificationPage.jsx` had duplicate export default function — removed old stub at bottom
- `SignUpPage.jsx` had duplicate export default function — removed old function body at lines 232–396
- Global `npx playwright` conflicts with local `@playwright/test` — must use `node node_modules/@playwright/test/cli.js`
- Global `npx vite` (v8) used wrong config — must use `node_modules\.bin\vite.cmd` from within `frontend/`
