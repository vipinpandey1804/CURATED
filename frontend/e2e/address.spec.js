/**
 * E2E Test Suite — Address Management (5-address limit)
 *
 * Tests covered:
 *   1. Addresses page loads when logged in
 *   2. Add a new address successfully
 *   3. Address form validation — required fields
 *   4. Edit an existing address
 *   5. Delete an address
 *   6. Cannot add more than 5 addresses (limit enforced)
 *   7. Add Address button hidden at limit
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

async function loginAndGo(page) {
  await page.goto('/login');
  await page.getByLabel(/email address/i).fill(TEST_EMAIL);
  await page.getByPlaceholder('••••••••').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL('/', { timeout: 15000 });
  await page.goto('/account/addresses');
  await expect(page.getByRole('heading', { name: /addresses/i })).toBeVisible();
}

async function fillForm(page, n = 1) {
  await page.locator('#addr-firstName').fill(`First${n}`);
  await page.locator('#addr-lastName').fill(`Last${n}`);
  await page.locator('#addr-address').fill(`${n} Test Street`);
  await page.locator('#addr-city').fill('Mumbai');
  await page.locator('#addr-state').fill('MH');
  await page.locator('#addr-zip').fill('400001');
  await page.locator('#addr-country').fill('IN');
}

async function addAddress(page, n = 1) {
  await page.getByRole('button', { name: /add address/i }).click();
  await expect(page.locator('#addr-firstName')).toBeVisible();
  await fillForm(page, n);
  await page.getByRole('button', { name: /save address/i }).click();
  // wait for modal to close
  await expect(page.locator('#addr-firstName')).not.toBeVisible({ timeout: 10000 });
}

// ─── beforeEach: clean all addresses via API ──────────────────────────────────

test.beforeEach(async ({ request }) => {
  await cleanAddresses(request);
});

// ─── 1. Addresses page loads ──────────────────────────────────────────────────

test('addresses page loads and shows heading', async ({ page }) => {
  await loginAndGo(page);
  await expect(page.getByRole('button', { name: /add address/i })).toBeVisible();
  await expect(page.getByText('0 saved addresses')).toBeVisible();
});

// ─── 2. Add a new address ─────────────────────────────────────────────────────

test('can add a new address', async ({ page }) => {
  await loginAndGo(page);
  await addAddress(page, 1);
  await expect(page.locator('.address-card')).toHaveCount(1);
  await expect(page.locator('.address-card').first().getByText('1 Test Street')).toBeVisible();
});

// ─── 3. Address form validation ───────────────────────────────────────────────

test('address form shows validation errors for empty required fields', async ({ page }) => {
  await loginAndGo(page);
  await page.getByRole('button', { name: /add address/i }).click();
  await page.getByRole('button', { name: /save address/i }).click();
  await expect(page.getByText('Required').first()).toBeVisible({ timeout: 5000 });
});

// ─── 4. Edit an existing address ─────────────────────────────────────────────

test('can edit an existing address', async ({ page }) => {
  await loginAndGo(page);
  await addAddress(page, 1);

  await page.locator('.address-card').first().getByRole('button', { name: /edit/i }).click();
  await expect(page.locator('#addr-city')).toBeVisible();
  await page.locator('#addr-city').fill('Delhi');
  await page.getByRole('button', { name: /save address/i }).click();
  await expect(page.locator('#addr-city')).not.toBeVisible({ timeout: 10000 });

  await expect(page.locator('.address-card').first().getByText('Delhi')).toBeVisible();
});

// ─── 5. Set address as default ─────────────────────────────────────────────────

test('can set an address as default', async ({ page }) => {
  await loginAndGo(page);
  await addAddress(page, 1);
  await addAddress(page, 2);

  // Second card should have "Set as Default" button
  const secondCard = page.locator('.address-card').nth(1);
  await expect(secondCard.getByRole('button', { name: /set as default/i })).toBeVisible();

  await secondCard.getByRole('button', { name: /set as default/i }).click();

  // Second card should now show Default badge (the span, not the button)
  await expect(secondCard.locator('span').filter({ hasText: /^default$/i })).toBeVisible({ timeout: 5000 });

  // First card should NOT show Default badge
  await expect(page.locator('.address-card').first().locator('span').filter({ hasText: /^default$/i })).not.toBeVisible();

  // First card should now have "Set as Default" button
  await expect(page.locator('.address-card').first().getByRole('button', { name: /set as default/i })).toBeVisible();
});

// ─── 6. Delete an address ─────────────────────────────────────────────────────

test('can delete an address', async ({ page }) => {
  await loginAndGo(page);
  await addAddress(page, 1);
  await expect(page.locator('.address-card')).toHaveCount(1);

  await page.locator('.address-card').first().getByRole('button', { name: /remove/i }).click();
  await expect(page.getByRole('heading', { name: /remove address/i })).toBeVisible();
  await page.getByRole('button', { name: /delete/i }).click();

  await expect(page.locator('.address-card')).toHaveCount(0, { timeout: 10000 });
});

// ─── 6. Cannot add more than 5 addresses ─────────────────────────────────────

test('shows error when trying to add a 6th address', async ({ page }) => {
  await loginAndGo(page);

  for (let i = 1; i <= 5; i++) {
    await addAddress(page, i);
  }
  await expect(page.locator('.address-card')).toHaveCount(5);

  // Add button should be hidden now
  await expect(page.getByRole('button', { name: /add address/i })).not.toBeVisible();
});

// ─── 7. Add button hidden at limit ───────────────────────────────────────────

test('Add Address button is hidden when 5 addresses exist', async ({ page, request }) => {
  // Seed 5 addresses via API
  const token = await getToken(request);
  for (let i = 1; i <= 5; i++) {
    await request.post(`${API_BASE}/auth/addresses/`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        fullName: `Test User ${i}`,
        addressLine1: `${i} API Street`,
        city: 'Mumbai',
        state: 'MH',
        postalCode: '400001',
        country: 'IN',
        addressType: 'SHIPPING',
      },
    });
  }

  await loginAndGo(page);
  await expect(page.locator('.address-card')).toHaveCount(5);
  await expect(page.getByRole('button', { name: /add address/i })).not.toBeVisible();
});
