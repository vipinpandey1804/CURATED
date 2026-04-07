# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: address.spec.js >> can delete an address
- Location: frontend\e2e\address.spec.js:144:1

# Error details

```
TypeError: Cannot read properties of undefined (reading 'access')
```

# Test source

```ts
  1   | /**
  2   |  * E2E Test Suite — Address Management (5-address limit)
  3   |  *
  4   |  * Tests covered:
  5   |  *   1. Addresses page loads when logged in
  6   |  *   2. Add a new address successfully
  7   |  *   3. Address form validation — required fields
  8   |  *   4. Edit an existing address
  9   |  *   5. Delete an address
  10  |  *   6. Cannot add more than 5 addresses (limit enforced)
  11  |  *   7. Add Address button hidden at limit
  12  |  */
  13  | 
  14  | import { test, expect } from '@playwright/test';
  15  | 
  16  | const TEST_EMAIL    = 'vipinpandey1804@gmail.com';
  17  | const TEST_PASSWORD = 'Admin@123';
  18  | const API_BASE      = 'http://localhost:8000/api/v1';
  19  | 
  20  | // ─── helpers ─────────────────────────────────────────────────────────────────
  21  | 
  22  | async function getToken(request) {
  23  |   const res = await request.post(`${API_BASE}/auth/login/`, {
  24  |     data: { email: TEST_EMAIL, password: TEST_PASSWORD },
  25  |   });
  26  |   const json = await res.json();
> 27  |   return json.tokens.access;
      |                      ^ TypeError: Cannot read properties of undefined (reading 'access')
  28  | }
  29  | 
  30  | async function cleanAddresses(request) {
  31  |   const token = await getToken(request);
  32  |   const res = await request.get(`${API_BASE}/auth/addresses/`, {
  33  |     headers: { Authorization: `Bearer ${token}` },
  34  |   });
  35  |   const json = await res.json();
  36  |   for (const addr of (json.results || json)) {
  37  |     await request.delete(`${API_BASE}/auth/addresses/${addr.id}/`, {
  38  |       headers: { Authorization: `Bearer ${token}` },
  39  |     });
  40  |   }
  41  | }
  42  | 
  43  | async function loginAndGo(page) {
  44  |   await page.goto('/login');
  45  |   await page.getByLabel(/email address/i).fill(TEST_EMAIL);
  46  |   await page.getByPlaceholder('••••••••').fill(TEST_PASSWORD);
  47  |   await page.getByRole('button', { name: /sign in/i }).click();
  48  |   await expect(page).toHaveURL('/', { timeout: 15000 });
  49  |   await page.goto('/account/addresses');
  50  |   await expect(page.getByRole('heading', { name: /addresses/i })).toBeVisible();
  51  | }
  52  | 
  53  | async function fillForm(page, n = 1) {
  54  |   await page.locator('#addr-firstName').fill(`First${n}`);
  55  |   await page.locator('#addr-lastName').fill(`Last${n}`);
  56  |   await page.locator('#addr-address').fill(`${n} Test Street`);
  57  |   await page.locator('#addr-city').fill('Mumbai');
  58  |   await page.locator('#addr-state').fill('MH');
  59  |   await page.locator('#addr-zip').fill('400001');
  60  |   await page.locator('#addr-country').fill('IN');
  61  | }
  62  | 
  63  | async function addAddress(page, n = 1) {
  64  |   await page.getByRole('button', { name: /add address/i }).click();
  65  |   await expect(page.locator('#addr-firstName')).toBeVisible();
  66  |   await fillForm(page, n);
  67  |   await page.getByRole('button', { name: /save address/i }).click();
  68  |   // wait for modal to close
  69  |   await expect(page.locator('#addr-firstName')).not.toBeVisible({ timeout: 10000 });
  70  | }
  71  | 
  72  | // ─── beforeEach: clean all addresses via API ──────────────────────────────────
  73  | 
  74  | test.beforeEach(async ({ request }) => {
  75  |   await cleanAddresses(request);
  76  | });
  77  | 
  78  | // ─── 1. Addresses page loads ──────────────────────────────────────────────────
  79  | 
  80  | test('addresses page loads and shows heading', async ({ page }) => {
  81  |   await loginAndGo(page);
  82  |   await expect(page.getByRole('button', { name: /add address/i })).toBeVisible();
  83  |   await expect(page.getByText('0 saved addresses')).toBeVisible();
  84  | });
  85  | 
  86  | // ─── 2. Add a new address ─────────────────────────────────────────────────────
  87  | 
  88  | test('can add a new address', async ({ page }) => {
  89  |   await loginAndGo(page);
  90  |   await addAddress(page, 1);
  91  |   await expect(page.locator('.address-card')).toHaveCount(1);
  92  |   await expect(page.locator('.address-card').first().getByText('1 Test Street')).toBeVisible();
  93  | });
  94  | 
  95  | // ─── 3. Address form validation ───────────────────────────────────────────────
  96  | 
  97  | test('address form shows validation errors for empty required fields', async ({ page }) => {
  98  |   await loginAndGo(page);
  99  |   await page.getByRole('button', { name: /add address/i }).click();
  100 |   await page.getByRole('button', { name: /save address/i }).click();
  101 |   await expect(page.getByText('Required').first()).toBeVisible({ timeout: 5000 });
  102 | });
  103 | 
  104 | // ─── 4. Edit an existing address ─────────────────────────────────────────────
  105 | 
  106 | test('can edit an existing address', async ({ page }) => {
  107 |   await loginAndGo(page);
  108 |   await addAddress(page, 1);
  109 | 
  110 |   await page.locator('.address-card').first().getByRole('button', { name: /edit/i }).click();
  111 |   await expect(page.locator('#addr-city')).toBeVisible();
  112 |   await page.locator('#addr-city').fill('Delhi');
  113 |   await page.getByRole('button', { name: /save address/i }).click();
  114 |   await expect(page.locator('#addr-city')).not.toBeVisible({ timeout: 10000 });
  115 | 
  116 |   await expect(page.locator('.address-card').first().getByText('Delhi')).toBeVisible();
  117 | });
  118 | 
  119 | // ─── 5. Set address as default ─────────────────────────────────────────────────
  120 | 
  121 | test('can set an address as default', async ({ page }) => {
  122 |   await loginAndGo(page);
  123 |   await addAddress(page, 1);
  124 |   await addAddress(page, 2);
  125 | 
  126 |   // Second card should have "Set as Default" button
  127 |   const secondCard = page.locator('.address-card').nth(1);
```