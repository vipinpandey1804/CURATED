# Admin Panel Implementation Log
**Date**: 04-04-2026  
**Feature**: React CMS Admin Panel at `/admin-panel/`  
**Status**: ✅ Complete

---

## Summary

Full implementation of a staff-facing admin CMS inside the existing React/Vite frontend. The admin panel is accessible at `/admin-panel/` and requires `is_staff=true` on the JWT user. All management operations are backed by dedicated DRF ViewSets under `/api/v1/admin/`.

---

## Backend Changes

### New Files
| File | Purpose |
|------|---------|
| `config/admin_urls.py` | Central URL include — routes to all app-level admin_urls |
| `apps/catalog/admin_urls.py` | DRF router: categories, products, images, variants, attributes |
| `apps/catalog/admin_views.py` | Full CRUD ViewSets for catalog models (IsAdminUser) |
| `apps/orders/admin_urls.py` | Orders router + `{id}/status/` URL |
| `apps/orders/admin_views.py` | ReadOnly order ViewSet + status update APIView |
| `apps/returns/admin_urls.py` | Returns router + `{id}/approve/` + `{id}/reject/` |
| `apps/returns/admin_views.py` | ReadOnly return ViewSet + approve/reject APIViews |
| `apps/marketing/admin_urls.py` | Coupons router |
| `apps/marketing/admin_views.py` | Full CRUD CouponCode ViewSet |
| `apps/accounts/admin_urls.py` | Users router + stats URL |
| `apps/accounts/admin_views.py` | User ViewSet (GET+PATCH only) + stats aggregation APIView |

### Modified Files
| File | Change |
|------|--------|
| `config/urls.py` | Added `path("api/v1/admin/", include("config.admin_urls"))` |
| `apps/accounts/serializers.py` | Added `is_staff` to UserSerializer fields + read_only_fields |

### Key Design Decisions
- All admin endpoints use DRF `IsAdminUser` permission (is_staff=True + is_active=True)
- `AdminOrderStatusUpdateView` creates `OrderStatusHistory` records with `changed_by`
- `AdminReturnApproveView` creates `InventoryMovement(movement_type=RETURN, +quantity)` per line item
- No user deletion endpoint — only `is_active` toggling
- `times_used` is read-only on coupons

---

## Frontend Changes

### New Packages Installed
```
clsx, tailwind-merge, class-variance-authority,
@radix-ui/react-slot, @radix-ui/react-dialog, @radix-ui/react-dropdown-menu,
@radix-ui/react-select, @radix-ui/react-label, @radix-ui/react-separator,
@radix-ui/react-switch, @radix-ui/react-toast, @radix-ui/react-tabs,
tailwindcss-animate
```

### Modified Files
| File | Change |
|------|--------|
| `tailwind.config.js` | Added tailwindcss-animate plugin, darkMode: 'class' |
| `src/index.css` | Added `:root { --radius: 0.5rem; }` |
| `src/App.jsx` | Added admin imports, `AdminApp` component, `/admin-panel/*` route |

### New Files
| File | Purpose |
|------|---------|
| `src/lib/utils.js` | `cn()` utility (clsx + tailwind-merge) |
| `src/components/admin/AdminRoute.jsx` | is_staff guard + redirect |
| `src/components/admin/AdminLayout.jsx` | Sidebar + topbar + Outlet |
| `src/components/admin/AdminSidebar.jsx` | Dark collapsible nav |
| `src/components/admin/ui/AdminButton.jsx` | CVA button variants |
| `src/components/admin/ui/AdminBadge.jsx` | Status badge + statusVariant() |
| `src/components/admin/ui/AdminDialog.jsx` | Radix UI dialog |
| `src/components/admin/ui/AdminSelect.jsx` | Radix UI select |
| `src/components/admin/ui/AdminSwitch.jsx` | Radix UI switch |
| `src/services/adminCatalogService.js` | Catalog CRUD API calls |
| `src/services/adminOrderService.js` | Orders + returns API calls |
| `src/services/adminMarketingService.js` | Coupon CRUD API calls |
| `src/services/adminUserService.js` | User list/update + stats |
| `src/pages/admin/AdminDashboardPage.jsx` | Stat cards + revenue + recent orders |
| `src/pages/admin/AdminProductsPage.jsx` | Products table + search + delete |
| `src/pages/admin/AdminProductFormPage.jsx` | Create/edit product + image gallery |
| `src/pages/admin/AdminCategoriesPage.jsx` | Categories table + dialog CRUD |
| `src/pages/admin/AdminAttributesPage.jsx` | Two-panel attribute type + values |
| `src/pages/admin/AdminOrdersPage.jsx` | Orders table + status filter |
| `src/pages/admin/AdminOrderDetailPage.jsx` | Full detail + status update + history |
| `src/pages/admin/AdminReturnsPage.jsx` | Returns queue + approve/reject dialogs |
| `src/pages/admin/AdminCouponsPage.jsx` | Coupons CRUD + create/edit dialog |
| `src/pages/admin/AdminUsersPage.jsx` | Users table + staff/active toggles |

---

## Router Structure

```
/admin-panel/           → AdminDashboardPage
/admin-panel/products   → AdminProductsPage
/admin-panel/products/new → AdminProductFormPage (create)
/admin-panel/products/:id → AdminProductFormPage (edit)
/admin-panel/categories → AdminCategoriesPage
/admin-panel/attributes → AdminAttributesPage
/admin-panel/orders     → AdminOrdersPage
/admin-panel/orders/:id → AdminOrderDetailPage
/admin-panel/returns    → AdminReturnsPage
/admin-panel/coupons    → AdminCouponsPage
/admin-panel/users      → AdminUsersPage
```

`<Route path="/admin-panel/*" element={<AdminApp />} />` in `App.jsx` handles the sub-router. All admin routes are wrapped in `AdminRoute` which checks `user.isStaff`.

---

## Issues Encountered & Resolved

| Issue | Resolution |
|-------|-----------|
| `src/components/ui/button.jsx` already existed with different storefront styles | Placed all admin UI components in `src/components/admin/ui/` — zero conflict |
| shadcn/ui CLI is interactive (can't run headless) | Manually installed Radix packages + manually created components |
| `tailwindcss-animate` ESM import | Used `import tailwindAnimate from 'tailwindcss-animate'` to match Vite ESM config |
| CouponCode lives in `apps.marketing`, not `apps.carts` | Admin endpoint at `/admin/marketing/coupons/` — confirmed from model file |

---

## Test Status
- Backend: 49/49 PASSED (unchanged — admin endpoints are new, not replacing existing)
- Frontend Playwright: 14/14 PASSED (admin panel not covered, new E2E tests pending)
