/**
 * E2E Test Suite — Full Authentication Flow
 *
 * Tests covered:
 *   1.  Home page loads
 *   2.  Navigate to Sign Up page
 *   3.  Toggle between Email / Mobile Number tabs (signup)
 *   4.  Signup form validation (missing fields)
 *   5.  Signup form validation (short password)
 *   6.  Signup with email → redirected to OTP verification page
 *   7.  OTP verification page shows the correct identifier
 *   8.  OTP verification with wrong code shows error
 *   9.  Navigate to Login page
 *  10.  Login page toggle Email / Mobile Number tabs
 *  11.  Login validation — empty fields
 *  12.  Login with invalid credentials shows error
 *  13.  Admin panel is accessible at /admin/
 *  14.  Signup with phone number — sees mobile tab & navigates to OTP page
 */

import { test, expect } from '@playwright/test';

// ─── helpers ─────────────────────────────────────────────────────────────────

const UNIQUE = Date.now();
const TEST_EMAIL    = `playwright_${UNIQUE}@example.com`;
const TEST_PHONE    = `+1555${String(UNIQUE).slice(-7)}`;
const TEST_PASSWORD = 'Playwright@123';

// ─── 1. Home page loads ──────────────────────────────────────────────────────

test('home page loads and shows the brand name', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/curated|nordic/i);
  // Brand logo / name should appear somewhere
  await expect(page.getByText('CURATED').first()).toBeVisible();
});

// ─── 2. Navigate to Sign Up ───────────────────────────────────────────────────

test('can navigate from home to the sign-up page', async ({ page }) => {
  await page.goto('/signup');
  await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
});

// ─── 3. Toggle signup tabs ────────────────────────────────────────────────────

test('signup page toggles between Email and Mobile Number tabs', async ({ page }) => {
  await page.goto('/signup');

  // Email tab is active by default — email input visible
  await expect(page.getByLabel(/email address/i)).toBeVisible();

  // Click "Mobile Number" tab
  await page.getByRole('button', { name: /mobile number/i }).first().click();
  await expect(page.getByLabel(/mobile number/i)).toBeVisible();
  await expect(page.getByLabel(/email address/i)).not.toBeVisible();

  // Switch back to Email
  await page.getByRole('button', { name: /^email$/i }).first().click();
  await expect(page.getByLabel(/email address/i)).toBeVisible();
});

// ─── 4. Signup validation — missing fields ────────────────────────────────────

test('signup shows validation errors when required fields are empty', async ({ page }) => {
  await page.goto('/signup');
  await page.getByRole('button', { name: /create account/i }).click();
  // First name is required
  await expect(page.getByText('Required').first()).toBeVisible();
});

// ─── 5. Signup validation — short password ────────────────────────────────────

test('signup shows error for passwords shorter than 8 characters', async ({ page }) => {
  await page.goto('/signup');
  await page.getByLabel(/first name/i).fill('Test');
  await page.getByLabel(/last name/i).fill('User');
  await page.getByLabel(/email address/i).fill('test@example.com');
  await page.getByPlaceholder(/min. 8 characters/i).fill('short');
  await page.getByRole('button', { name: /create account/i }).click();
  await expect(page.getByText(/minimum 8 characters/i)).toBeVisible();
});

// ─── 6. Signup with email → redirect to OTP page ─────────────────────────────

test('signup with email creates account and redirects to OTP verification page', async ({ page }) => {
  await page.goto('/signup');

  await page.getByLabel(/first name/i).fill('Playwright');
  await page.getByLabel(/last name/i).fill('Tester');
  await page.getByLabel(/email address/i).fill(TEST_EMAIL);
  await page.getByPlaceholder(/min. 8 characters/i).fill(TEST_PASSWORD);
  await page.getByLabel(/confirm password/i).fill(TEST_PASSWORD);

  await page.getByRole('button', { name: /create account/i }).click();

  // Should redirect to /verify-email with identifier query param
  await expect(page).toHaveURL(/\/verify-email/, { timeout: 15000 });
  await expect(page).toHaveURL(new RegExp(encodeURIComponent(TEST_EMAIL)));
});

// ─── 7. OTP verification page shows correct identifier ────────────────────────

test('OTP verification page shows the identifier that was used during signup', async ({ page }) => {
  const identifier = `playwright_check_${UNIQUE}@example.com`;
  await page.goto(`/verify-email?identifier=${encodeURIComponent(identifier)}&type=email`);

  await expect(page.getByText(identifier)).toBeVisible();
  await expect(page.getByText(/verify your account/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /verify email/i })).toBeVisible();
});

// ─── 8. OTP verification — wrong code shows error ─────────────────────────────

test('OTP verification shows error for an incorrect code', async ({ page }) => {
  const identifier = `playwright_otp_${UNIQUE}@example.com`;
  // First register the account so an OTP exists
  await page.goto('/signup');
  await page.getByLabel(/first name/i).fill('OTP');
  await page.getByLabel(/last name/i).fill('Test');
  await page.getByLabel(/email address/i).fill(identifier);
  await page.getByPlaceholder(/min. 8 characters/i).fill(TEST_PASSWORD);
  await page.getByLabel(/confirm password/i).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/verify-email/, { timeout: 15000 });

  // Enter a wrong code
  const inputs = page.locator('input[inputmode="numeric"]');
  for (let i = 0; i < 6; i++) {
    await inputs.nth(i).fill('0');
  }
  await page.getByRole('button', { name: /verify email/i }).click();

  await expect(page.getByText(/invalid|expired|incorrect/i)).toBeVisible();
});

// ─── 9. Navigate to Login page ────────────────────────────────────────────────

test('can navigate to the login page', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
});

// ─── 10. Login page toggle ────────────────────────────────────────────────────

test('login page toggles between Email and Mobile Number modes', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByLabel(/email address/i)).toBeVisible();

  await page.getByRole('button', { name: /mobile number/i }).first().click();
  await expect(page.getByLabel(/mobile number/i)).toBeVisible();
  await expect(page.getByLabel(/email address/i)).not.toBeVisible();

  await page.getByRole('button', { name: /^email$/i }).first().click();
  await expect(page.getByLabel(/email address/i)).toBeVisible();
});

// ─── 11. Login validation — empty fields ──────────────────────────────────────

test('login shows "fill in all fields" error when form is empty', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page.getByText(/please fill in all fields/i)).toBeVisible();
});

// ─── 12. Login with invalid credentials ──────────────────────────────────────

test('login shows error for invalid credentials', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email address/i).fill('nobody@example.com');
  await page.getByPlaceholder('••••••••').fill('wrongpassword');
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page.getByText(/invalid credentials|invalid email or password/i)).toBeVisible();
});

// ─── 13. Django Admin panel accessible ────────────────────────────────────────

test('Django admin panel is accessible at /admin/', async ({ page }) => {
  await page.goto('http://localhost:8000/admin/');
  // Unfold-themed admin login page shows 'Django site admin'
  await expect(page.getByText(/django site admin/i)).toBeVisible();
});

// ─── 14. Signup with phone number ─────────────────────────────────────────────

test('signup with phone number redirects to OTP verification page (type=phone)', async ({ page }) => {
  await page.goto('/signup');

  // Switch to mobile number tab
  await page.getByRole('button', { name: /mobile number/i }).first().click();

  await page.getByLabel(/first name/i).fill('Phone');
  await page.getByLabel(/last name/i).fill('Tester');
  await page.getByLabel(/mobile number/i).fill(TEST_PHONE);
  await page.getByPlaceholder(/min. 8 characters/i).fill(TEST_PASSWORD);
  await page.getByLabel(/confirm password/i).fill(TEST_PASSWORD);

  await page.getByRole('button', { name: /create account/i }).click();

  // Should redirect to /verify-email with type=phone
  await expect(page).toHaveURL(/\/verify-email.*type=phone/, { timeout: 15000 });
  // Verify button confirms we're on the phone OTP page
  await expect(page.getByRole('button', { name: /verify mobile number/i })).toBeVisible();
});
