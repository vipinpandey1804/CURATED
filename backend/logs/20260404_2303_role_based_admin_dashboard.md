# 20260404_2303_role_based_admin_dashboard

## What was built
- Kept a single shared login experience for both admin and normal users.
- Added role-based post-login redirects so staff users land on `/admin-panel` and other users land on `/`.
- Extended OTP verification and Google-auth success paths to respect the same redirect rule.
- Upgraded the admin dashboard with graphical widgets: revenue trend, customer growth, order mix, and returns queue.
- Expanded `/api/v1/admin/stats/` to return chart-ready 7-day sales and user-growth series plus return-status breakdowns.

## Files changed
- `backend/apps/accounts/admin_views.py`
- `backend/tests/test_admin.py`
- `frontend/src/utils/authRedirect.js`
- `frontend/src/pages/LoginPage.jsx`
- `frontend/src/pages/SignUpPage.jsx`
- `frontend/src/pages/EmailVerificationPage.jsx`
- `frontend/src/pages/admin/AdminDashboardPage.jsx`
- `frontend/src/tests/authService.test.js`
- `frontend/src/tests/LoginPage.test.jsx`

## Verification
- `backend\\venv\\Scripts\\pytest.exe backend/tests/test_admin.py -q` -> 62 passed
- `npm run build` -> passed
- `npx vitest run src/tests/authService.test.js src/tests/LoginPage.test.jsx` -> authService suite passed, LoginPage suite blocked because `@testing-library/dom` is missing from local dependencies

## Notes
- Frontend build reports an existing chunk-size warning from Vite after minification.
- The Vitest failure is environment/dependency-related, not a compile error in the updated pages.

## Follow-up update
- Dashboard converted to graph-only layout.
- Added dashboard filters for period, order status, and return status.
- Backend stats endpoint now accepts period, order_status, and return_status query params.
- Verification update: backend admin tests now 64 passed and frontend build passed after filter work.

