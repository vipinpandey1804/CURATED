/**
 * E2E Test Suite — Checkout Shipping Auto-fill
 *
 * Tests covered:
 *   1. Checkout shipping form auto-fills from default address
 *   2. Saved addresses selector is visible on checkout page
 *   3. Clicking a saved address fills the form
 *   4. No saved addresses — form is empty
 *   5. Default address shows "Default" badge in selector
 */

import { test, expect } from '@playwright/test';

const TEST_EMAIL    = 'vipinpandey1804@gmail.com';
const TEST_PASSWORD = 'Admin@123';
const API_BASE      = 'http://localhost:8000/api/v1';

// ─── helpers ─────────────────────────────────────────────────────────────────

async function getToken(request) {
  const res = await request.post(`${API_BASE}/auth/login/`, {
    data: { email: TEST_EMAIL, password: TEST_PASSWORD },
  });
  const json = await res.json();
  return json.tokens.access;
}

async function cleanAddresses(request) {
  const token = await getToken(request);
  const res = await request.get(`${API_BASE}/auth/addresses/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  for (const addr of (json.results || json)) {
    await request.delete(`${API_BASE}/auth/addresses/${addr.id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}

async function seedAddress(request, overrides = {}) {
  const token = await getToken(request);
  const res = await request.post(`${API_BASE}/auth/addresses/`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: {
      fullName: 'Vipin Pandey',
      addressLine1: '42 Marine Drive',
      city: 'Mumbai',
      state: 'MH',
      postalCode: '400001',
      country: 'IN',
      addressType: 'SHIPPING',
      isDefault: false,
      ...overrides,
    },
  });
  return res.json();
}

async function loginAndGoToCheckout(page) {
  await page.goto('/login');
  await page.getByLabel(/email address/i).fill(TEST_EMAIL);
  await page.getByPlaceholder('••••••••').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL('/', { timeout: 15000 });
  await page.goto('/checkout/shipping');
  await expect(page.getByRole('heading', { name: /shipping details/i })).toBeVisible();
}

// ─── beforeEach: clean addresses ─────────────────────────────────────────────

test.beforeEach(async ({ request }) => {
  await cleanAddresses(request);
});

// ─── 1. Auto-fill from default address ───────────────────────────────────────

test('checkout form auto-fills from default address', async ({ page, request }) => {
  await seedAddress(request, { isDefault: true, fullName: 'Vipin Pandey', addressLine1: '42 Marine Drive', city: 'Mumbai' });

  await loginAndGoToCheckout(page);

  // Form should be pre-filled — check city and address fields
  await expect(page.locator('input[type="text"][value="42 Marine Drive"], input[type="text"]').nth(2)).toHaveValue('42 Marine Drive', { timeout: 8000 });
  await expect(page.locator('input[type="text"]').nth(3)).toHaveValue('Mumbai');
});

// ─── 2. Saved addresses selector visible ─────────────────────────────────────

test('saved addresses selector is shown on checkout page', async ({ page, request }) => {
  await seedAddress(request, { isDefault: true });

  await loginAndGoToCheckout(page);

  await expect(page.getByText('Saved Addresses')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('button').filter({ hasText: '42 Marine Drive' })).toBeVisible();
});

// ─── 3. Clicking saved address fills form ────────────────────────────────────

test('clicking a saved address fills the form fields', async ({ page, request }) => {
  // Seed two addresses — neither default so first auto-fills
  await seedAddress(request, { fullName: 'Addr One', addressLine1: '10 First Street', city: 'Delhi', isDefault: false });
  await seedAddress(request, { fullName: 'Addr Two', addressLine1: '20 Second Street', city: 'Pune', isDefault: false });

  await loginAndGoToCheckout(page);

  // Wait for saved addresses to load
  await expect(page.locator('button').filter({ hasText: '20 Second Street' })).toBeVisible({ timeout: 8000 });

  // Click second address card
  await page.locator('button').filter({ hasText: '20 Second Street' }).click();

  // Wait for form to update
  await expect(page.locator('input[type="text"]').nth(2)).toHaveValue('20 Second Street', { timeout: 5000 });
  await expect(page.locator('input[type="text"]').nth(3)).toHaveValue('Pune');
});

// ─── 4. No saved addresses — form is empty ───────────────────────────────────

test('form is empty when no saved addresses exist', async ({ page }) => {
  await loginAndGoToCheckout(page);

  // Saved addresses section should not appear
  await expect(page.getByText('Saved Addresses')).not.toBeVisible();

  // Form fields should be empty (except email)
  const firstNameInput = page.locator('input[value=""]').first();
  await expect(firstNameInput).toBeVisible();
});

// ─── 5. Default badge shown in selector ──────────────────────────────────────

test('default address shows Default badge in saved addresses selector', async ({ page, request }) => {
  await seedAddress(request, { isDefault: true, addressLine1: '42 Marine Drive' });
  await seedAddress(request, { isDefault: false, addressLine1: '99 Other Road' });

  await loginAndGoToCheckout(page);

  // The default address card in selector should show Default badge
  const defaultCard = page.locator('button').filter({ hasText: '42 Marine Drive' });
  await expect(defaultCard).toBeVisible({ timeout: 8000 });
  await expect(defaultCard.getByText(/default/i)).toBeVisible();
});
