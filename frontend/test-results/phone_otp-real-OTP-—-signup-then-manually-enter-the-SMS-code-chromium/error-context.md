# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phone_otp.spec.js >> real OTP — signup then manually enter the SMS code
- Location: frontend\e2e\phone_otp.spec.js:85:1

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/verify-email.*type=phone/
Received string:  "http://localhost:5173/signup"
Timeout: 15000ms

Call log:
  - Expect "toHaveURL" with timeout 15000ms
    18 × unexpected value "http://localhost:5173/signup"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - img "Curated editorial" [ref=e5]
    - generic [ref=e7]:
      - paragraph [ref=e8]: A/W 2024
      - heading "The New Minimalism." [level=2] [ref=e9]:
        - text: The New
        - text: Minimalism.
      - paragraph [ref=e10]: Join the collective and receive early access to seasonal drops and exclusive editorial content.
  - generic [ref=e12]:
    - link "CURATED" [ref=e13] [cursor=pointer]:
      - /url: /
    - heading "Create Account." [level=1] [ref=e14]
    - paragraph [ref=e15]: Join the collective today.
    - generic [ref=e16]:
      - button "Email" [ref=e17] [cursor=pointer]
      - button "Mobile Number" [ref=e18] [cursor=pointer]
    - generic [ref=e19]: A user with this phone number already exists.
    - generic [ref=e20]:
      - generic [ref=e21]:
        - generic [ref=e22]:
          - generic [ref=e23]: First Name
          - textbox "First Name" [ref=e24]:
            - /placeholder: Alex
            - text: Real
        - generic [ref=e25]:
          - generic [ref=e26]: Last Name
          - textbox "Last Name" [ref=e27]:
            - /placeholder: Harrison
            - text: OTP
      - generic [ref=e28]:
        - generic [ref=e29]: Mobile Number
        - textbox "Mobile Number" [ref=e30]:
          - /placeholder: +1 555 000 0000
          - text: "+919536618243"
      - generic [ref=e31]:
        - generic [ref=e32]: Password
        - generic [ref=e33]:
          - textbox "Password" [ref=e34]:
            - /placeholder: Min. 8 characters
            - text: Playwright@123
          - button [ref=e35] [cursor=pointer]:
            - img [ref=e36]
      - generic [ref=e39]:
        - generic [ref=e40]: Confirm Password
        - textbox "Confirm Password" [ref=e41]:
          - /placeholder: ••••••••
          - text: Playwright@123
      - paragraph [ref=e42]:
        - text: By creating an account, you agree to our
        - link "Terms of Service" [ref=e43] [cursor=pointer]:
          - /url: /signup
        - text: and
        - link "Privacy Policy" [ref=e44] [cursor=pointer]:
          - /url: /signup
        - text: .
      - button "Create Account" [ref=e45] [cursor=pointer]
    - generic [ref=e50]: Or continue with
    - generic [ref=e53]:
      - button "Continue with Google. Opens in new tab" [ref=e55] [cursor=pointer]:
        - generic [ref=e57]:
          - img [ref=e59]
          - generic [ref=e66]: Continue with Google
      - iframe
    - paragraph [ref=e67]:
      - text: Already have an account?
      - link "Sign In" [ref=e68] [cursor=pointer]:
        - /url: /login
```

# Test source

```ts
  1   | /**
  2   |  * E2E Test Suite — Phone OTP (Real Device)
  3   |  *
  4   |  * Tests covered:
  5   |  *   1.  Signup with +919536618243 → redirects to OTP verification page
  6   |  *   2.  OTP page shows the phone number correctly
  7   |  *   3.  OTP page blocks submission when code is incomplete
  8   |  *   4.  Real OTP entry — you type the code, test verifies success
  9   |  *   5.  After verification — success screen is shown
  10  |  *   6.  After verification — redirects to home on "Start Shopping"
  11  |  */
  12  | 
  13  | import { test, expect } from '@playwright/test';
  14  | 
  15  | const PHONE     = '+919536618243';
  16  | const PASSWORD  = 'Playwright@123';
  17  | const UNIQUE    = Date.now();
  18  | // Use a unique phone per run if you want to re-register;
  19  | // for a real device test we use the fixed number above.
  20  | 
  21  | // ─── 1. Signup with phone number redirects to OTP page ───────────────────────
  22  | 
  23  | test('signup with phone +919536618243 redirects to OTP verification page', async ({ page }) => {
  24  |   await page.goto('/signup');
  25  | 
  26  |   // Switch to Mobile Number tab
  27  |   await page.getByRole('button', { name: /mobile number/i }).first().click();
  28  | 
  29  |   await page.getByLabel(/first name/i).fill('Phone');
  30  |   await page.getByLabel(/last name/i).fill('Tester');
  31  |   await page.getByLabel(/mobile number/i).fill(PHONE);
  32  |   await page.getByPlaceholder(/min. 8 characters/i).fill(PASSWORD);
  33  |   await page.getByLabel(/confirm password/i).fill(PASSWORD);
  34  | 
  35  |   await page.getByRole('button', { name: /create account/i }).click();
  36  | 
  37  |   // Either redirects to OTP page (new account) or shows already-registered error (existing account)
  38  |   await expect(
  39  |     page.locator('text=/verify-email/').or(
  40  |       page.getByText(/already registered|already exists|account.*exist/i)
  41  |     ).or(
  42  |       page.locator('[class*="red"]')
  43  |     )
  44  |   ).toBeAttached({ timeout: 15000 });
  45  | 
  46  |   const url = page.url();
  47  |   const hasError = await page.locator('[class*="red-"]').isVisible().catch(() => false);
  48  | 
  49  |   if (!hasError) {
  50  |     expect(url).toMatch(/\/verify-email.*type=phone/);
  51  |   } else {
  52  |     // Phone already registered — that's expected for a fixed real number
  53  |     console.log('Phone already registered — skipping redirect assertion');
  54  |   }
  55  | });
  56  | 
  57  | // ─── 2. OTP page shows the phone number ──────────────────────────────────────
  58  | 
  59  | test('OTP verification page displays the phone number', async ({ page }) => {
  60  |   await page.goto(`/verify-email?identifier=${encodeURIComponent(PHONE)}&type=phone`);
  61  | 
  62  |   await expect(page.getByText(PHONE)).toBeVisible();
  63  |   await expect(page.getByText(/verify your account/i)).toBeVisible();
  64  |   await expect(page.getByText(/we sent a 6-digit code to your mobile number/i)).toBeVisible();
  65  | });
  66  | 
  67  | // ─── 3. OTP page blocks submission with incomplete code ───────────────────────
  68  | 
  69  | test('OTP page shows error when fewer than 6 digits are entered', async ({ page }) => {
  70  |   await page.goto(`/verify-email?identifier=${encodeURIComponent(PHONE)}&type=phone`);
  71  | 
  72  |   // Fill only 3 digits
  73  |   const inputs = page.locator('input[inputmode="numeric"]');
  74  |   await inputs.nth(0).fill('1');
  75  |   await inputs.nth(1).fill('2');
  76  |   await inputs.nth(2).fill('3');
  77  | 
  78  |   await page.getByRole('button', { name: /verify mobile number/i }).click();
  79  | 
  80  |   await expect(page.getByText(/please enter the complete 6-digit code/i)).toBeVisible();
  81  | });
  82  | 
  83  | // ─── 4. Real OTP entry — you type the code, Playwright waits ─────────────────
  84  | 
  85  | test('real OTP — signup then manually enter the SMS code', async ({ page }) => {
  86  |   // ── Step 1: Register the phone number ──
  87  |   await page.goto('/signup');
  88  |   await page.getByRole('button', { name: /mobile number/i }).first().click();
  89  | 
  90  |   await page.getByLabel(/first name/i).fill('Real');
  91  |   await page.getByLabel(/last name/i).fill('OTP');
  92  |   await page.getByLabel(/mobile number/i).fill(PHONE);
  93  |   await page.getByPlaceholder(/min. 8 characters/i).fill(PASSWORD);
  94  |   await page.getByLabel(/confirm password/i).fill(PASSWORD);
  95  | 
  96  |   await page.getByRole('button', { name: /create account/i }).click();
  97  | 
  98  |   // Wait for redirect to OTP page
> 99  |   await expect(page).toHaveURL(/\/verify-email.*type=phone/, { timeout: 15000 });
      |                      ^ Error: expect(page).toHaveURL(expected) failed
  100 |   await expect(page.getByText(PHONE)).toBeVisible();
  101 | 
  102 |   // ── Step 2: Pause — enter the OTP you receive on +919536618243 ──
  103 |   // The browser will stay open. Type the 6-digit code into the boxes,
  104 |   // then click "Verify Mobile Number". Playwright resumes automatically.
  105 |   await page.pause();
  106 | 
  107 |   // ── Step 3: Assert success screen ──
  108 |   await expect(
  109 |     page.getByRole('heading', { name: /verified/i }).or(page.getByText(/your account has been confirmed/i))
  110 |   ).toBeVisible({ timeout: 30000 });
  111 | });
  112 | 
  113 | // ─── 5. After verification — success screen is shown ─────────────────────────
  114 | 
  115 | test('OTP success screen shows "Verified." heading and Start Shopping button', async ({ page }) => {
  116 |   // Mock the OTP verify endpoint to simulate a successful verification
  117 |   await page.route('**/api/v1/auth/otp/verify/', (route) =>
  118 |     route.fulfill({
  119 |       status: 200,
  120 |       contentType: 'application/json',
  121 |       body: JSON.stringify({
  122 |         user: { id: 99, email: '', firstName: 'Real', lastName: 'OTP' },
  123 |         tokens: { access: 'mock-access', refresh: 'mock-refresh' },
  124 |       }),
  125 |     })
  126 |   );
  127 | 
  128 |   await page.goto(`/verify-email?identifier=${encodeURIComponent(PHONE)}&type=phone`);
  129 | 
  130 |   // Fill all 6 digits
  131 |   const inputs = page.locator('input[inputmode="numeric"]');
  132 |   for (let i = 0; i < 6; i++) {
  133 |     await inputs.nth(i).fill(String(i + 1));
  134 |   }
  135 | 
  136 |   await page.getByRole('button', { name: /verify mobile number/i }).click();
  137 | 
  138 |   await expect(page.getByRole('heading', { name: /verified/i })).toBeVisible({ timeout: 10000 });
  139 |   await expect(page.getByText(/your account has been confirmed/i)).toBeVisible();
  140 |   await expect(page.getByRole('button', { name: /start shopping/i })).toBeVisible();
  141 | });
  142 | 
  143 | // ─── 6. After verification — "Start Shopping" navigates to home ──────────────
  144 | 
  145 | test('clicking Start Shopping after verification navigates to home page', async ({ page }) => {
  146 |   // Mock verify endpoint
  147 |   await page.route('**/api/v1/auth/otp/verify/', (route) =>
  148 |     route.fulfill({
  149 |       status: 200,
  150 |       contentType: 'application/json',
  151 |       body: JSON.stringify({
  152 |         user: { id: 99, email: '', firstName: 'Real', lastName: 'OTP' },
  153 |         tokens: { access: 'mock-access', refresh: 'mock-refresh' },
  154 |       }),
  155 |     })
  156 |   );
  157 | 
  158 |   // Mock /auth/me/ so AuthContext rehydration doesn't fail after token is set
  159 |   await page.route('**/api/v1/auth/me/', (route) =>
  160 |     route.fulfill({
  161 |       status: 200,
  162 |       contentType: 'application/json',
  163 |       body: JSON.stringify({ id: 99, email: '', firstName: 'Real', lastName: 'OTP' }),
  164 |     })
  165 |   );
  166 | 
  167 |   await page.goto(`/verify-email?identifier=${encodeURIComponent(PHONE)}&type=phone`);
  168 | 
  169 |   const inputs = page.locator('input[inputmode="numeric"]');
  170 |   for (let i = 0; i < 6; i++) {
  171 |     await inputs.nth(i).fill(String(i + 1));
  172 |   }
  173 | 
  174 |   await page.getByRole('button', { name: /verify mobile number/i }).click();
  175 |   await expect(page.getByRole('button', { name: /start shopping/i })).toBeVisible({ timeout: 10000 });
  176 | 
  177 |   await page.getByRole('button', { name: /start shopping/i }).click();
  178 |   await expect(page).toHaveURL('/', { timeout: 8000 });
  179 | });
  180 | 
```