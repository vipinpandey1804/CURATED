# Frontend Context — Nordic Commerce
**Last Updated**: 07-04-2026  
**Status**: Active Development

---

## Tech Stack
- **Framework**: React 18 + Vite 6.4.1
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios (with JWT interceptors + camelCase transform)
- **Styling**: Tailwind CSS (custom brand tokens) + shadcn/ui-style components (admin panel)
- **Admin UI**: Radix UI primitives (`@radix-ui/react-dialog/select/switch/tabs`) + CVA + clsx + tailwind-merge + `tailwindcss-animate`
- **Icons**: Lucide React
- **Unit Tests**: Vitest + Testing Library
- **E2E Tests**: Playwright 1.59.1
- **Dev Port**: `5174` (5173 occupied; use `cmd /c "cd /d e:\ecom-project\frontend && node_modules\.bin\vite.cmd"`)
- **API Base**: `http://localhost:8000/api/v1` (via `VITE_API_URL` env or default)

---

## Running the Dev Server
```powershell
cmd /c "cd /d e:\ecom-project\frontend && node_modules\.bin\vite.cmd"
# Starts at http://localhost:5174/
```

## Running Unit Tests
```powershell
Set-Location e:\ecom-project\frontend
npx vitest run
```

## Running E2E Tests (Playwright — visible browser, slowMo 400ms)
```powershell
node "e:\ecom-project\frontend\node_modules\@playwright\test\cli.js" test --config "e:\ecom-project\frontend\playwright.config.js"
```
**Current result**: 68 passed, 13 pre-existing failures (address/checkout/full_flow/phone_otp specs require running backend with Twilio/Redis)

---

## Project Structure
```
frontend/
├── src/
│   ├── pages/               ← Route-level page components
│   │   └── admin/           ← Admin panel pages (10 pages)
│   ├── components/          ← Shared UI components
│   │   ├── ui/              ← Storefront: Button, Input, etc.
│   │   └── admin/           ← Admin: AdminRoute, AdminLayout, AdminSidebar, ui/
│   ├── context/
│   │   ├── AuthContext.jsx  ← Auth state + login/signup/completeVerification (exposes is_staff)
│   │   ├── CartContext.jsx
│   │   └── WishlistContext.jsx
│   ├── services/
│   │   ├── api.js                    ← Axios instance (JWT attach, 401 refresh, camelCase)
│   │   ├── authService.js            ← register(), login(), verifyOtp(), getMe()
│   │   ├── cartService.js
│   │   ├── catalogService.js
│   │   ├── orderService.js
│   │   ├── miscServices.js
│   │   ├── adminCatalogService.js    ← Admin: Catalog CRUD + image upload
│   │   ├── adminOrderService.js      ← Admin: Orders + returns actions
│   │   ├── adminMarketingService.js  ← Admin: Coupon CRUD
│   │   └── adminUserService.js       ← Admin: User list/update + stats
│   ├── lib/
│   │   └── utils.js         ← cn() utility (clsx + tailwind-merge)
│   ├── hooks/
│   ├── utils/
│   ├── data/                ← Static mock data (to be replaced by API calls)
│   ├── tests/               ← Vitest unit tests
│   ├── App.jsx              ← Router + route definitions (admin panel at /admin-panel/*)
│   └── main.jsx
│   ├── tests/               ← Vitest unit tests
│   ├── App.jsx              ← Router + route definitions
│   └── main.jsx
├── e2e/
│   └── auth.spec.js         ← 14 Playwright E2E scenarios
├── playwright.config.js     ← headless:false, slowMo:400, baseURL:5174
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## Pages Inventory
| Page | Route | Status |
|------|-------|--------|
| `HomePage` | `/` | ✅ Built (static/mock data) |
| `SignUpPage` | `/signup` | ✅ Email/phone toggle tabs |
| `LoginPage` | `/login` | ✅ Email/phone toggle tabs |
| `EmailVerificationPage` | `/verify-email` | ✅ Reads `?identifier=&type=`, calls real OTP API |
| `ForgotPasswordPage` | `/forgot-password` | Built (no API wired) |
| `ResetPasswordPage` | `/reset-password` | Built (no API wired) |
| `ProductListingPage` | `/products` | Built (mock data) |
| `ProductDetailPage` | `/products/:slug` | Built (mock data) |
| `CollectionsPage` | `/collections` | Built (mock data) |
| `NewArrivalsPage` | `/new-arrivals` | Built (mock data) |
| `ShoppingCartPage` | `/cart` | Built (mock data) |
| `CheckoutShippingPage` | `/checkout/shipping` | Built (mock data) |
| `CheckoutPaymentPage` | `/checkout/payment` | Built (mock data) |
| `OrderConfirmationPage` | `/order-confirmation` | Built (mock data) |
| `OrderHistoryPage` | `/orders` | Built (mock data) |
| `WishlistPage` | `/wishlist` | Built (mock data) |
| `AccountSettingsPage` | `/account` | Built (mock data) |
| `EditPersonalInfoPage` | `/account/edit` | Built (mock data) |
| `ProfileAddressPage` | `/account/addresses` | Built (mock data) |
| `EditorialPage` | `/editorial` | Built (static) |
| `LookbookPage` | `/lookbook` | Built (static) |
| `TrackPackagePage` | `/track` | Built (mock data) |
| `WriteReviewPage` | `/review` | Built (mock data) |
| **Admin panel** | `/admin-panel/` | ✅ **IMPLEMENTED** |
| `AdminDashboardPage` | `/admin-panel/` | ✅ Stat cards + revenue + recent orders |
| `AdminProductsPage` | `/admin-panel/products` | ✅ Table + search + delete |
| `AdminProductFormPage` | `/admin-panel/products/:id` | ✅ Create/edit + image upload |
| `AdminCategoriesPage` | `/admin-panel/categories` | ✅ Table + dialog CRUD |
| `AdminAttributesPage` | `/admin-panel/attributes` | ✅ Two-panel attributes + values |
| `AdminOrdersPage` | `/admin-panel/orders` | ✅ Table + status filter |
| `AdminOrderDetailPage` | `/admin-panel/orders/:id` | ✅ Detail + status update + history |
| `AdminReturnsPage` | `/admin-panel/returns` | ✅ Queue + approve/reject dialogs |
| `AdminCouponsPage` | `/admin-panel/coupons` | ✅ Full CRUD dialog |
| `AdminUsersPage` | `/admin-panel/users` | ✅ Table + staff/active toggles |

---

## Completed Features

### Auth Flow (fully wired to backend API)
- **Register with email**: fills form → POST `/auth/register/` → redirected to `/verify-email?identifier=EMAIL&type=email`
- **Register with phone**: phone tab → POST `/auth/register/` → redirected to `/verify-email?identifier=PHONE&type=phone`
- **OTP Verification**: 6-digit input → POST `/auth/otp/verify/` → `user.is_verified=true` → navigate to `/`
- **Login with email**: email tab → POST `/auth/login/` → JWT stored → navigate to `/`
- **Login with phone**: phone tab → POST `/auth/login/` with `phoneNumber` field
- **AuthContext** exposes: `user`, `login()`, `signup()`, `logout()`, `completeVerification()`

### `authService.js`
```js
register({ email, phoneNumber, password, firstName, lastName })
  → POST /auth/register/ → { detail, identifier, identifierType }

login({ email, phoneNumber, password })
  → POST /auth/login/ → stores tokens, returns user data

verifyOtp({ email, phoneNumber, code })
  → POST /auth/otp/verify/ → { user, tokens }
```

### `api.js`
- Auto-attaches `Authorization: Bearer <token>` from localStorage
- Auto-refresh on 401 using refresh token
- Response camelCase transform via `djangoRestFramework-camelCase` compatible interceptor

---

## E2E Test Coverage (`e2e/auth.spec.js`)
| # | Test | Status |
|---|------|--------|
| 1 | Home page loads, shows CURATED brand | ✅ |
| 2 | Navigate from home to sign-up page | ✅ |
| 3 | Signup: toggle Email ↔ Mobile Number tabs | ✅ |
| 4 | Signup: validation errors when fields empty | ✅ |
| 5 | Signup: password shorter than 8 chars shows error | ✅ |
| 6 | Signup with email → redirects to `/verify-email` with identifier in URL | ✅ |
| 7 | OTP verification page shows correct identifier | ✅ |
| 8 | Wrong OTP code shows error message | ✅ |
| 9 | Navigate to login page | ✅ |
| 10 | Login: toggle Email ↔ Mobile Number tabs | ✅ |
| 11 | Login: empty form shows "fill in all fields" error | ✅ |
| 12 | Login: invalid credentials shows error | ✅ |
| 13 | Django admin panel (`/admin/`) accessible — shows Unfold login | ✅ |
| 14 | Signup with phone → redirects to `/verify-email?type=phone` | ✅ |

**Playwright config**: `headless: false`, `slowMo: 400ms`, `screenshot/video/trace: on`

---

## In Progress
- Nothing active

## Next Steps (Planned)
- Wire `ProductListingPage` + `ProductDetailPage` to real catalog API
- Wire `ShoppingCartPage` to real cart API
- Wire `OrderHistoryPage` to orders API
- Implement password reset flow (forgot/reset pages already built, need API)
- Wire `WishlistPage` to wishlist API
- Add protected route wrapper (redirect to `/login` if unauthenticated)
- Wire `AccountSettingsPage` / `EditPersonalInfoPage` to `/auth/me/` PATCH

---

## Key Files Changed in Last Session
| File | Change |
|------|--------|
| `src/services/authService.js` | `register()` accepts email/phone; returns `{identifier, identifierType}`; `login()` accepts email/phone |
| `src/context/AuthContext.jsx` | Updated `login`/`signup` signatures; added `completeVerification()` |
| `src/pages/SignUpPage.jsx` | Full rewrite — email/phone toggle tabs, navigate to OTP page on success |
| `src/pages/LoginPage.jsx` | Added email/phone toggle tabs |
| `src/pages/EmailVerificationPage.jsx` | Full rewrite — reads URL params, calls real API, success/error states |
| `e2e/auth.spec.js` | Created — 14 E2E test scenarios |
| `playwright.config.js` | Created — headless:false, slowMo:400, baseURL:5174 |
| `package.json` | Added `test:e2e` and `test:e2e:headed` scripts |

---

## Environment Variables (`.env`)
```
VITE_API_URL=http://localhost:8000/api/v1
```

---

## Session Update — 04-04-2026
- Shared login page now redirects staff users to `/admin-panel` and normal users to `/`.
- Signup/login/OTP success flows now use a common role-based redirect helper.
- Admin dashboard now includes graphical widgets for revenue trend, customer growth, order mix, and returns queue.
- Frontend verification this session: `npm run build` passed.
- Vitest note: `LoginPage.test.jsx` could not execute locally because `@testing-library/dom` is missing from installed dependencies.
- Dashboard follow-up: graph-only layout with period/order/return filters is now in place.

## Session Update — 07-04-2026
- Backend catalog fully seeded: 10 categories × 30 products = 300 products with variants + images.
- No new frontend pages needed — existing `ProductListingPage` + `ProductDetailPage` render the seeded data automatically.
- Playwright: 68 passed (stable), 13 pre-existing failures in address/checkout/full_flow/phone_otp (require Twilio/Redis).
- No frontend code changes made this session.
