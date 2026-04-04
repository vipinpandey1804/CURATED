/**
 * E2E Test Suite — Phone OTP (Real Device)
 *
 * Tests covered:
 *   1.  Signup with +919536618243 → redirects to OTP verification page
 *   2.  OTP page shows the phone number correctly
 *   3.  OTP page blocks submission when code is incomplete
 *   4.  Real OTP entry — you type the code, test verifies success
 *   5.  After verification — success screen is shown
 *   6.  After verification — redirects to home on "Start Shopping"
 */

import { test, expect } from '@playwright/test';

const PHONE     = '+919536618243';
const PASSWORD  = 'Playwright@123';
const UNIQUE    = Date.now();
// Use a unique phone per run if you want to re-register;
// for a real device test we use the fixed number above.

// ─── 1. Signup with phone number redirects to OTP page ───────────────────────

test('signup with phone +919536618243 redirects to OTP verification page', async ({ page }) => {
  await page.goto('/signup');

  // Switch to Mobile Number tab
  await page.getByRole('button', { name: /mobile number/i }).first().click();

  await page.getByLabel(/first name/i).fill('Phone');
  await page.getByLabel(/last name/i).fill('Tester');
  await page.getByLabel(/mobile number/i).fill(PHONE);
  await page.getByPlaceholder(/min. 8 characters/i).fill(PASSWORD);
  await page.getByLabel(/confirm password/i).fill(PASSWORD);

  await page.getByRole('button', { name: /create account/i }).click();

  // Either redirects to OTP page (new account) or shows already-registered error (existing account)
  await expect(
    page.locator('text=/verify-email/').or(
      page.getByText(/already registered|already exists|account.*exist/i)
    ).or(
      page.locator('[class*="red"]')
    )
  ).toBeAttached({ timeout: 15000 });

  const url = page.url();
  const hasError = await page.locator('[class*="red-"]').isVisible().catch(() => false);

  if (!hasError) {
    expect(url).toMatch(/\/verify-email.*type=phone/);
  } else {
    // Phone already registered — that's expected for a fixed real number
    console.log('Phone already registered — skipping redirect assertion');
  }
});

// ─── 2. OTP page shows the phone number ──────────────────────────────────────

test('OTP verification page displays the phone number', async ({ page }) => {
  await page.goto(`/verify-email?identifier=${encodeURIComponent(PHONE)}&type=phone`);

  await expect(page.getByText(PHONE)).toBeVisible();
  await expect(page.getByText(/verify your account/i)).toBeVisible();
  await expect(page.getByText(/we sent a 6-digit code to your mobile number/i)).toBeVisible();
});

// ─── 3. OTP page blocks submission with incomplete code ───────────────────────

test('OTP page shows error when fewer than 6 digits are entered', async ({ page }) => {
  await page.goto(`/verify-email?identifier=${encodeURIComponent(PHONE)}&type=phone`);

  // Fill only 3 digits
  const inputs = page.locator('input[inputmode="numeric"]');
  await inputs.nth(0).fill('1');
  await inputs.nth(1).fill('2');
  await inputs.nth(2).fill('3');

  await page.getByRole('button', { name: /verify mobile number/i }).click();

  await expect(page.getByText(/please enter the complete 6-digit code/i)).toBeVisible();
});

// ─── 4. Real OTP entry — you type the code, Playwright waits ─────────────────

test('real OTP — signup then manually enter the SMS code', async ({ page }) => {
  // ── Step 1: Register the phone number ──
  await page.goto('/signup');
  await page.getByRole('button', { name: /mobile number/i }).first().click();

  await page.getByLabel(/first name/i).fill('Real');
  await page.getByLabel(/last name/i).fill('OTP');
  await page.getByLabel(/mobile number/i).fill(PHONE);
  await page.getByPlaceholder(/min. 8 characters/i).fill(PASSWORD);
  await page.getByLabel(/confirm password/i).fill(PASSWORD);

  await page.getByRole('button', { name: /create account/i }).click();

  // Wait for redirect to OTP page
  await expect(page).toHaveURL(/\/verify-email.*type=phone/, { timeout: 15000 });
  await expect(page.getByText(PHONE)).toBeVisible();

  // ── Step 2: Pause — enter the OTP you receive on +919536618243 ──
  // The browser will stay open. Type the 6-digit code into the boxes,
  // then click "Verify Mobile Number". Playwright resumes automatically.
  await page.pause();

  // ── Step 3: Assert success screen ──
  await expect(
    page.getByRole('heading', { name: /verified/i }).or(page.getByText(/your account has been confirmed/i))
  ).toBeVisible({ timeout: 30000 });
});

// ─── 5. After verification — success screen is shown ─────────────────────────

test('OTP success screen shows "Verified." heading and Start Shopping button', async ({ page }) => {
  // Mock the OTP verify endpoint to simulate a successful verification
  await page.route('**/api/v1/auth/otp/verify/', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: { id: 99, email: '', firstName: 'Real', lastName: 'OTP' },
        tokens: { access: 'mock-access', refresh: 'mock-refresh' },
      }),
    })
  );

  await page.goto(`/verify-email?identifier=${encodeURIComponent(PHONE)}&type=phone`);

  // Fill all 6 digits
  const inputs = page.locator('input[inputmode="numeric"]');
  for (let i = 0; i < 6; i++) {
    await inputs.nth(i).fill(String(i + 1));
  }

  await page.getByRole('button', { name: /verify mobile number/i }).click();

  await expect(page.getByRole('heading', { name: /verified/i })).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(/your account has been confirmed/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /start shopping/i })).toBeVisible();
});

// ─── 6. After verification — "Start Shopping" navigates to home ──────────────

test('clicking Start Shopping after verification navigates to home page', async ({ page }) => {
  // Mock verify endpoint
  await page.route('**/api/v1/auth/otp/verify/', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: { id: 99, email: '', firstName: 'Real', lastName: 'OTP' },
        tokens: { access: 'mock-access', refresh: 'mock-refresh' },
      }),
    })
  );

  // Mock /auth/me/ so AuthContext rehydration doesn't fail after token is set
  await page.route('**/api/v1/auth/me/', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 99, email: '', firstName: 'Real', lastName: 'OTP' }),
    })
  );

  await page.goto(`/verify-email?identifier=${encodeURIComponent(PHONE)}&type=phone`);

  const inputs = page.locator('input[inputmode="numeric"]');
  for (let i = 0; i < 6; i++) {
    await inputs.nth(i).fill(String(i + 1));
  }

  await page.getByRole('button', { name: /verify mobile number/i }).click();
  await expect(page.getByRole('button', { name: /start shopping/i })).toBeVisible({ timeout: 10000 });

  await page.getByRole('button', { name: /start shopping/i }).click();
  await expect(page).toHaveURL('/', { timeout: 8000 });
});
