/**
 * E2E Test Suite — Admin Panel
 *
 * Uses page.route() to mock all API calls so tests run without a live backend.
 *
 * Tests covered:
 *  1.  Unauthenticated user is redirected to /login
 *  2.  Authenticated non-staff user sees "Access Denied"
 *  3.  Staff user reaches the admin dashboard
 *  4.  Dashboard displays stat cards (products, orders, users, returns)
 *  5.  Dashboard displays revenue widgets
 *  6.  Products page renders the products table
 *  7.  Products page search updates query param
 *  8.  Categories page renders the categories table
 *  9.  Orders page renders the orders table
 * 10.  Orders page status-filter dropdown is present
 * 11.  Order detail page loads full order info
 * 12.  Returns page renders the returns table with Approve/Reject buttons
 * 13.  Coupons page renders coupon rows and "New Coupon" button
 * 14.  Coupons create dialog opens on "New Coupon" click
 * 15.  Users page renders the users table
 * 16.  Sidebar navigation links are all present
 * 17.  Sidebar navigates to Products when clicked
 * 18.  Logout button logs out and redirects to /login
 */

import { test, expect } from '@playwright/test';

// ─── Shared mock data ─────────────────────────────────────────────────────────

const STAFF_USER = {
  id: 1,
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  isStaff: true,
  isActive: true,
  isVerified: true,
  dateJoined: '2026-01-01T00:00:00Z',
};

const REGULAR_USER = {
  id: 2,
  email: 'customer@example.com',
  firstName: 'Jane',
  lastName: 'Doe',
  isStaff: false,
  isActive: true,
  isVerified: true,
  dateJoined: '2026-01-01T00:00:00Z',
};

const MOCK_STATS = {
  totalProducts: 42,
  totalUsers: 128,
  totalOrders: 57,
  pendingReturns: 3,
  newUsersToday: 2,
  ordersByStatus: { PENDING: 5, CONFIRMED: 10, SHIPPED: 20, DELIVERED: 22, CANCELLED: 0, PROCESSING: 0 },
  revenue: { today: 1200.0, last7Days: 8400.0, last30Days: 34500.0 },
};

const MOCK_PRODUCTS = {
  count: 2,
  next: null,
  previous: null,
  results: [
    { id: 1, name: 'Classic White Tee', slug: 'classic-white-tee', category: 1, categoryName: 'Tops', basePriceAmount: '49.99', isActive: true, variantCount: 3, images: [] },
    { id: 2, name: 'Black Denim Jacket', slug: 'black-denim-jacket', category: 1, categoryName: 'Tops', basePriceAmount: '129.99', isActive: false, variantCount: 1, images: [] },
  ],
};

const MOCK_CATEGORIES = {
  count: 1,
  results: [
    { id: 1, name: 'Tops', slug: 'tops', parent: null, isActive: true, sortOrder: 0, productCount: 5 },
  ],
};

const MOCK_ORDERS = {
  count: 1,
  results: [
    {
      id: 'aaaa-1111',
      orderNumber: 'CUR-ABCD1234',
      userEmail: 'customer@example.com',
      userName: 'Jane Doe',
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      fulfillmentStatus: 'UNFULFILLED',
      total: '99.99',
      totalCurrency: 'USD',
      itemCount: 2,
      createdAt: '2026-04-01T10:00:00Z',
    },
  ],
};

const MOCK_ORDER_DETAIL = {
  ...MOCK_ORDERS.results[0],
  shippingFullName: 'Jane Doe',
  shippingAddressLine1: '123 Main St',
  shippingCity: 'New York',
  shippingPostalCode: '10001',
  shippingCountry: 'US',
  subtotal: '89.99',
  subtotalCurrency: 'USD',
  shippingCost: '10.00',
  shippingCostCurrency: 'USD',
  discountAmount: '0.00',
  discountAmountCurrency: 'USD',
  couponCode: '',
  notes: '',
  items: [
    {
      id: 'i1',
      productName: 'Classic White Tee',
      variantName: 'M',
      sku: 'CWT-M',
      unitPrice: '49.99',
      unitPriceCurrency: 'USD',
      quantity: 2,
      lineTotal: '99.98',
      lineTotalCurrency: 'USD',
      productImageUrl: '',
    },
  ],
  statusHistory: [],
};

const MOCK_RETURNS = {
  count: 1,
  results: [
    {
      id: 'rr-1111',
      orderId: 'aaaa-1111',
      orderNumber: 'CUR-ABCD1234',
      userEmail: 'customer@example.com',
      userName: 'Jane Doe',
      status: 'REQUESTED',
      reason: 'Does not fit',
      createdAt: '2026-04-02T10:00:00Z',
      lineItems: [{ id: 'li1', productName: 'Classic White Tee', quantity: 1, reasonCode: 'WRONG_SIZE', sku: 'CWT-M' }],
    },
  ],
};

const MOCK_COUPONS = {
  count: 1,
  results: [
    { id: 1, code: 'SUMMER20', discountType: 'PERCENTAGE', discountValue: '20.00', isActive: true, timesUsed: 5, maxUses: null, validFrom: '2026-01-01T00:00:00Z', validUntil: '2026-12-31T00:00:00Z', description: '' },
  ],
};

const MOCK_USERS = {
  count: 1,
  results: [
    { id: 2, email: 'customer@example.com', firstName: 'Jane', lastName: 'Doe', phoneNumber: null, isStaff: false, isActive: true, isVerified: true, dateJoined: '2026-01-01T00:00:00Z', fullName: 'Jane Doe' },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Set access_token in localStorage so AuthContext skips the login redirect.
 * Also intercept /auth/me/ to return the given user.
 */
async function mockAuth(page, user) {
  await page.addInitScript((u) => {
    localStorage.setItem('access_token', 'mock-access-token');
    localStorage.setItem('refresh_token', 'mock-refresh-token');
  }, user);

  await page.route('**/api/v1/auth/me/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) })
  );
}

/** Intercept the standard admin API endpoints that a page will call. */
async function mockAdminAPIs(page) {
  const routes = [
    ['**/api/v1/admin/stats/**', MOCK_STATS],
    ['**/api/v1/admin/orders/**', MOCK_ORDERS],
    ['**/api/v1/admin/catalog/products/**', MOCK_PRODUCTS],
    ['**/api/v1/admin/catalog/categories/**', MOCK_CATEGORIES],
    ['**/api/v1/admin/returns/**', MOCK_RETURNS],
    ['**/api/v1/admin/marketing/coupons/**', MOCK_COUPONS],
    ['**/api/v1/admin/users/**', MOCK_USERS],
    ['**/api/v1/admin/catalog/attributes/**', { count: 0, results: [] }],
    ['**/api/v1/admin/catalog/attribute-values/**', { count: 0, results: [] }],
  ];
  for (const [pattern, body] of routes) {
    await page.route(pattern, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    );
  }
}


// ═════════════════════════════════════════════════════════════════════════════
// 1 — Auth guards
// ═════════════════════════════════════════════════════════════════════════════

test('unauthenticated user is redirected to /login when accessing /admin-panel', async ({ page }) => {
  // No token set — AuthContext will redirect
  await page.goto('/admin-panel');
  await page.waitForURL('**/login**');
  await expect(page).toHaveURL(/\/login/);
});

test('non-staff authenticated user sees Access Denied', async ({ page }) => {
  await mockAuth(page, REGULAR_USER);
  await page.goto('/admin-panel');
  await expect(page.getByText('Access Denied')).toBeVisible();
  await expect(page.getByText('staff privileges')).toBeVisible();
});


// ═════════════════════════════════════════════════════════════════════════════
// 2 — Dashboard
// ═════════════════════════════════════════════════════════════════════════════

test('staff user reaches admin dashboard', async ({ page }) => {
  await mockAuth(page, STAFF_USER);
  await mockAdminAPIs(page);
  await page.goto('/admin-panel');
  // Sidebar should be visible
  await expect(page.getByText('Dashboard').first()).toBeVisible();
});

test('dashboard displays all four stat cards', async ({ page }) => {
  await mockAuth(page, STAFF_USER);
  await mockAdminAPIs(page);
  await page.goto('/admin-panel');
  // Stat values from MOCK_STATS
  await expect(page.getByText('42')).toBeVisible();   // totalProducts
  await expect(page.getByText('128')).toBeVisible();  // totalUsers
  await expect(page.getByText('57')).toBeVisible();   // totalOrders
  await expect(page.getByText('3').first()).toBeVisible();    // pendingReturns
});

test('dashboard displays revenue section', async ({ page }) => {
  await mockAuth(page, STAFF_USER);
  await mockAdminAPIs(page);
  await page.goto('/admin-panel');
  await expect(page.getByText(/revenue/i).first()).toBeVisible();
});

test('dashboard shows recent orders table with order number', async ({ page }) => {
  await mockAuth(page, STAFF_USER);
  await mockAdminAPIs(page);
  await page.goto('/admin-panel');
  await expect(page.getByText('CUR-ABCD1234')).toBeVisible();
});


// ═════════════════════════════════════════════════════════════════════════════
// 3 — Products page
// ═════════════════════════════════════════════════════════════════════════════

test('products page renders product names in table', async ({ page }) => {
  await mockAuth(page, STAFF_USER);
  await mockAdminAPIs(page);
  await page.goto('/admin-panel/products');
  await expect(page.getByText('Classic White Tee')).toBeVisible();
  await expect(page.getByText('Black Denim Jacket')).toBeVisible();
});

test('products page has Add Product link', async ({ page }) => {
  await mockAuth(page, STAFF_USER);
  await mockAdminAPIs(page);
  await page.goto('/admin-panel/products');
  await expect(page.getByRole('button', { name: /new product/i })).toBeVisible();
});

test('products page search input is present', async ({ page }) => {
  await mockAuth(page, STAFF_USER);
  await mockAdminAPIs(page);
  await page.goto('/admin-panel/products');
  await expect(page.getByPlaceholder(/search/i)).toBeVisible();
});


// ═════════════════════════════════════════════════════════════════════════════
// 4 — Categories page
// ═════════════════════════════════════════════════════════════════════════════

test('categories page renders category names', async ({ page }) => {
  await mockAuth(page, STAFF_USER);
  await mockAdminAPIs(page);
  await page.goto('/admin-panel/categories');
  await expect(page.getByRole('cell', { name: 'Tops', exact: true })).toBeVisible();
});

test('categories page has New Category button', async ({ page }) => {
  await mockAuth(page, STAFF_USER);
  await mockAdminAPIs(page);
  await page.goto('/admin-panel/categories');
  await expect(page.getByRole('button', { name: /new category/i })).toBeVisible();
});

test('categories page create dialog opens', async ({ page }) => {
  await mockAuth(page, STAFF_USER);
  await mockAdminAPIs(page);
  await page.goto('/admin-panel/categories');
  await page.getByRole('button', { name: /new category/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').locator('input').first()).toBeVisible();
});


// ═════════════════════════════════════════════════════════════════════════════
// 5 — Orders page
// ═════════════════════════════════════════════════════════════════════════════

test('orders page renders order numbers', async ({ page }) => {
  await mockAuth(page, STAFF_USER);
  await mockAdminAPIs(page);
  await page.goto('/admin-panel/orders');
  await expect(page.getByText('CUR-ABCD1234')).toBeVisible();
});

test('orders page has status filter dropdown', async ({ page }) => {
  await mockAuth(page, STAFF_USER);
  await mockAdminAPIs(page);
  await page.goto('/admin-panel/orders');
  // The status select element
  await expect(page.locator('select').first()).toBeVisible();
});

test('orders page has search input', async ({ page }) => {
  await mockAuth(page, STAFF_USER);
  await mockAdminAPIs(page);
  await page.goto('/admin-panel/orders');
  await expect(page.getByPlaceholder(/order/i)).toBeVisible();
});


// ═════════════════════════════════════════════════════════════════════════════
// 6 — Order detail page
// ═════════════════════════════════════════════════════════════════════════════

test('order detail page loads full order data', async ({ page }) => {
  await mockAuth(page, STAFF_USER);
  await mockAdminAPIs(page);
  // Override with detail response for specific order route
  await page.route('**/api/v1/admin/orders/aaaa-1111/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_ORDER_DETAIL) })
  );
  await page.goto('/admin-panel/orders/aaaa-1111');
  await expect(page.getByText('CUR-ABCD1234')).toBeVisible();
  await expect(page.getByText('Classic White Tee')).toBeVisible();
  await expect(page.getByText('Jane Doe').first()).toBeVisible();
});

test('order detail page has status update section', async ({ page }) => {
  await mockAuth(page, STAFF_USER);
  await mockAdminAPIs(page);
  await page.route('**/api/v1/admin/orders/aaaa-1111/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_ORDER_DETAIL) })
  );
  await page.goto('/admin-panel/orders/aaaa-1111');
  await expect(page.getByRole('heading', { name: /update status/i })).toBeVisible();
});


// ═════════════════════════════════════════════════════════════════════════════
// 7 — Returns page
// ═════════════════════════════════════════════════════════════════════════════

test('returns page renders return entries', async ({ page }) => {
  await mockAuth(page, STAFF_USER);
  await mockAdminAPIs(page);
  await page.goto('/admin-panel/returns');
  await expect(page.getByText('CUR-ABCD1234')).toBeVisible();
  await expect(page.getByText('Jane Doe')).toBeVisible();
});

test('returns page shows Approve and Reject buttons for REQUESTED returns', async ({ page }) => {
  await mockAuth(page, STAFF_USER);
  await mockAdminAPIs(page);
  await page.goto('/admin-panel/returns');
  await expect(page.getByRole('button', { name: /approve/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /reject/i })).toBeVisible();
});

test('returns approve dialog opens with notes field', async ({ page }) => {
  await mockAuth(page, STAFF_USER);
  await mockAdminAPIs(page);
  await page.goto('/admin-panel/returns');
  await page.getByRole('button', { name: /approve/i }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText(/approve return/i)).toBeVisible();
  await expect(page.getByPlaceholder(/notes/i)).toBeVisible();
});

test('returns status filter dropdown is present', async ({ page }) => {
  await mockAuth(page, STAFF_USER);
  await mockAdminAPIs(page);
  await page.goto('/admin-panel/returns');
  await expect(page.locator('select').first()).toBeVisible();
});


// ═════════════════════════════════════════════════════════════════════════════
// 8 — Coupons page
// ═════════════════════════════════════════════════════════════════════════════

test('coupons page renders coupon codes', async ({ page }) => {
  await mockAuth(page, STAFF_USER);
  await mockAdminAPIs(page);
  await page.goto('/admin-panel/coupons');
  await expect(page.getByText('SUMMER20')).toBeVisible();
});

test('coupons page has New Coupon button', async ({ page }) => {
  await mockAuth(page, STAFF_USER);
  await mockAdminAPIs(page);
  await page.goto('/admin-panel/coupons');
  await expect(page.getByRole('button', { name: /new coupon/i })).toBeVisible();
});

test('coupons create dialog opens with form fields', async ({ page }) => {
  await mockAuth(page, STAFF_USER);
  await mockAdminAPIs(page);
  await page.goto('/admin-panel/coupons');
  await page.getByRole('button', { name: /new coupon/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByPlaceholder(/SUMMER20/i)).toBeVisible();
});


// ═════════════════════════════════════════════════════════════════════════════
// 9 — Users page
// ═════════════════════════════════════════════════════════════════════════════

test('users page renders user email addresses', async ({ page }) => {
  await mockAuth(page, STAFF_USER);
  await mockAdminAPIs(page);
  await page.goto('/admin-panel/users');
  await expect(page.getByText('customer@example.com')).toBeVisible();
});

test('users page has search input', async ({ page }) => {
  await mockAuth(page, STAFF_USER);
  await mockAdminAPIs(page);
  await page.goto('/admin-panel/users');
  await expect(page.getByPlaceholder(/search/i)).toBeVisible();
});

test('users page staff toggle triggers confirmation dialog', async ({ page }) => {
  await mockAuth(page, STAFF_USER);
  await mockAdminAPIs(page);
  await page.goto('/admin-panel/users');
  // Click the Staff switch for the non-staff user row
  const staffSwitches = page.locator('button[role="switch"]');
  // First switch in the Staff column
  await staffSwitches.first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText(/grant staff access|revoke staff access/i)).toBeVisible();
});


// ═════════════════════════════════════════════════════════════════════════════
// 10 — Sidebar navigation
// ═════════════════════════════════════════════════════════════════════════════

test('admin sidebar shows all navigation links', async ({ page }) => {
  await mockAuth(page, STAFF_USER);
  await mockAdminAPIs(page);
  await page.goto('/admin-panel');
  const nav = page.locator('nav').first();
  for (const label of ['Products', 'Categories', 'Orders', 'Returns', 'Coupons', 'Users']) {
    await expect(nav.getByText(label)).toBeVisible();
  }
});

test('clicking Products in sidebar navigates to /admin-panel/products', async ({ page }) => {
  await mockAuth(page, STAFF_USER);
  await mockAdminAPIs(page);
  await page.goto('/admin-panel');
  await page.getByRole('link', { name: /^products$/i }).click();
  await expect(page).toHaveURL(/\/admin-panel\/products/);
});

test('clicking Orders in sidebar navigates to /admin-panel/orders', async ({ page }) => {
  await mockAuth(page, STAFF_USER);
  await mockAdminAPIs(page);
  await page.goto('/admin-panel');
  await page.getByRole('link', { name: /^orders$/i }).click();
  await expect(page).toHaveURL(/\/admin-panel\/orders/);
});


// ═════════════════════════════════════════════════════════════════════════════
// 11 — Logout
// ═════════════════════════════════════════════════════════════════════════════

test('logout button redirects to /login and clears auth', async ({ page }) => {
  await mockAuth(page, STAFF_USER);
  await mockAdminAPIs(page);
  await page.goto('/admin-panel');
  // Click the Logout button in the sidebar
  await page.getByRole('button', { name: /logout/i }).click();
  await page.waitForURL('**/login**');
  await expect(page).toHaveURL(/\/login/);
  // Token should be gone from localStorage
  const token = await page.evaluate(() => localStorage.getItem('access_token'));
  expect(token).toBeNull();
});
