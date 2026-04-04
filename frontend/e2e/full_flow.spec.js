/**
 * E2E Full Flow — Login → Browse → Add to Cart → Checkout → Stripe
 *
 * Steps:
 *   1.  Login with real credentials
 *   2.  Browse products page
 *   3.  Open first product detail
 *   4.  Select a variant (if dropdown exists)
 *   5.  Add to bag
 *   6.  Cart page loads with item
 *   7.  Proceed to checkout shipping
 *   8.  Fill / confirm shipping address
 *   9.  Continue to payment
 *  10.  Click Pay → order created + Stripe session created
 *  11.  Redirected to Stripe checkout
 *  12.  Fill test card details
 *  13.  Submit payment
 *  14.  Redirected to order confirmation
 */

import { test, expect } from '@playwright/test';

const USER_EMAIL    = 'vipinpandey1804@gmail.com';
const USER_PASSWORD = 'Admin@9808';
const API_BASE      = 'http://localhost:8000/api/v1';

// ─── helper: get JWT token via API ───────────────────────────────────────────

async function getToken(request) {
  const res = await request.post(`${API_BASE}/auth/login/`, {
    data: { email: USER_EMAIL, password: USER_PASSWORD },
  });
  const json = await res.json();
  return json.tokens?.access;
}

// ─── helper: ensure at least one shipping address exists ─────────────────────

async function ensureShippingAddress(request) {
  const token = await getToken(request);
  const res = await request.get(`${API_BASE}/auth/addresses/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  const addresses = json.results ?? json;
  if (addresses.length === 0) {
    await request.post(`${API_BASE}/auth/addresses/`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        fullName: 'Vipin Pandey',
        addressLine1: '123 Main Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
        addressType: 'SHIPPING',
        isDefault: true,
        phone: '+11234567890',
      },
    });
    console.log('   Seeded default shipping address');
  } else {
    console.log('   Shipping address already exists:', addresses[0].addressLine1);
  }
}

// ─── Full flow test ───────────────────────────────────────────────────────────

test.describe('Full E-Commerce Flow', () => {
  test.setTimeout(300_000);

  test.beforeAll(async ({ request }) => {
    await ensureShippingAddress(request);
  });

  test('Login → Browse → Add to Cart → Checkout → Stripe', async ({ page }) => {

    // ── 1. LOGIN ──────────────────────────────────────────────────────────────
    await page.goto('/login');
    await page.getByLabel(/email address/i).fill(USER_EMAIL);
    await page.getByPlaceholder('••••••••').fill(USER_PASSWORD);

    const loginRespPromise = page.waitForResponse(
      r => r.url().includes('/auth/login/') && r.request().method() === 'POST'
    );
    await page.getByRole('button', { name: /sign in/i }).click();
    const loginResp = await loginRespPromise;
    expect(loginResp.status(), 'Login should return 200').toBe(200);

    await page.waitForURL('/', { timeout: 15000 });
    console.log('✓ 1. Login successful');

    // ── 2. BROWSE PRODUCTS ────────────────────────────────────────────────────
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    const productCards = page.locator('a[href^="/products/"]');
    await expect(productCards.first()).toBeVisible({ timeout: 10000 });
    const productCount = await productCards.count();
    console.log(`✓ 2. Products page — ${productCount} products visible`);

    // ── 3. PRODUCT DETAIL ─────────────────────────────────────────────────────
    const firstCard = productCards.first();
    const productUrl = await firstCard.getAttribute('href');
    await firstCard.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(new RegExp(productUrl), { timeout: 10000 });
    console.log(`✓ 3. Product detail — ${page.url()}`);

    // ── 4. SELECT VARIANT ─────────────────────────────────────────────────────
    const variantTrigger = page.locator('button').filter({ hasText: /choose a variant/i });
    const hasDropdown = await variantTrigger.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasDropdown) {
      await variantTrigger.click();
      const firstOption = page.locator('div[class*="absolute"] button').first();
      await firstOption.waitFor({ state: 'visible', timeout: 5000 });
      const variantName = await firstOption.textContent();
      await firstOption.click();
      console.log(`✓ 4. Variant selected — ${variantName?.trim()}`);
    } else {
      console.log('✓ 4. One-size product — no variant selection needed');
    }

    // ── 5. ADD TO BAG ─────────────────────────────────────────────────────────
    const addBtn = page.getByRole('button', { name: /add to bag/i });
    await expect(addBtn).toBeVisible({ timeout: 5000 });

    const cartRespPromise = page.waitForResponse(
      r => r.url().includes('/cart/items/') && r.request().method() === 'POST',
      { timeout: 15000 }
    );
    await addBtn.click();
    const cartResp = await cartRespPromise;
    expect(cartResp.status(), 'Add to cart should succeed').toBeLessThan(400);
    const cartBody = await cartResp.json().catch(() => ({}));
    console.log(`✓ 5. Added to bag — items: ${cartBody.itemCount ?? cartBody.items?.length}`);

    // ── 6. CART PAGE ──────────────────────────────────────────────────────────
    await page.waitForURL('/cart', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Wait for spinner to disappear
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /your bag/i })).toBeVisible({ timeout: 10000 });
    console.log('✓ 6. Cart page loaded');

    // ── 7. PROCEED TO CHECKOUT ────────────────────────────────────────────────
    await page.getByRole('button', { name: /proceed to checkout/i }).click();
    await page.waitForURL('/checkout/shipping', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /shipping/i })).toBeVisible({ timeout: 8000 });
    console.log('✓ 7. Checkout shipping page');

    // ── 8. SHIPPING ADDRESS ───────────────────────────────────────────────────
    // If saved address is pre-filled, just continue. Otherwise fill manually.
    const continueBtn = page.getByRole('button', { name: /continue to payment/i });
    await expect(continueBtn).toBeVisible({ timeout: 8000 });

    const firstNameInput = page.locator('input').first();
    const firstNameVal = await firstNameInput.inputValue().catch(() => '');
    if (!firstNameVal) {
      // Fill manually
      const inputs = page.locator('input[type="text"], input[type="tel"]');
      await inputs.nth(0).fill('Vipin');
      await inputs.nth(1).fill('Pandey');
      await inputs.nth(2).fill('123 Main Street');
      await inputs.nth(3).fill('New York');
      await inputs.nth(4).fill('NY');
      await inputs.nth(5).fill('10001');
      const countrySelect = page.locator('select').first();
      if (await countrySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await countrySelect.selectOption('US');
      }
      console.log('✓ 8. Shipping form filled manually');
    } else {
      console.log(`✓ 8. Shipping form pre-filled — ${firstNameVal}`);
    }

    // ── 9. CONTINUE TO PAYMENT ────────────────────────────────────────────────
    await continueBtn.click();
    await page.waitForURL('/checkout/payment', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    console.log('✓ 9. Payment page');

    // ── 10. CLICK PAY ─────────────────────────────────────────────────────────
    const payBtn = page.locator('button').filter({ hasText: /pay/i }).first();
    await expect(payBtn).toBeVisible({ timeout: 8000 });

    const orderRespPromise = page.waitForResponse(
      r => r.url().includes('/orders/create/') && r.request().method() === 'POST',
      { timeout: 20000 }
    ).catch(() => null);

    // Intercept Stripe session before redirect
    let stripeBody = null;
    let stripeStatus = null;
    await page.route('**/payments/**', async (route) => {
      const response = await route.fetch();
      stripeBody = await response.json().catch(() => ({}));
      stripeStatus = response.status();
      await route.fulfill({ response });
    });

    await payBtn.click();
    console.log('   Clicked Pay — waiting for API responses...');

    const orderResp = await orderRespPromise;
    if (orderResp) {
      const orderBody = await orderResp.json().catch(() => ({}));
      expect(orderResp.status(), 'Order creation should succeed').toBeLessThan(400);
      console.log(`✓ 10a. Order created — #${orderBody.orderNumber ?? orderBody.order_number}`);
    } else {
      console.log('⚠ 10a. Order API response not captured');
    }

    await page.waitForTimeout(4000);

    if (stripeBody) {
      const checkoutUrl = stripeBody.checkoutUrl ?? stripeBody.checkout_url ?? stripeBody.url;
      expect(stripeStatus, 'Stripe session should succeed').toBeLessThan(400);
      expect(checkoutUrl, 'Should have Stripe checkout URL').toBeTruthy();
      console.log(`✓ 10b. Stripe session created — ${String(checkoutUrl).substring(0, 60)}...`);
    } else {
      console.log('⚠ 10b. Stripe session not captured via route intercept');
    }

    // ── 11. STRIPE CHECKOUT PAGE ──────────────────────────────────────────────
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(3000);
    console.log(`✓ 11. Redirected to Stripe — ${page.url().substring(0, 80)}`);

    // ── 12. FILL STRIPE TEST CARD ─────────────────────────────────────────────
    await page.locator('#cardNumber').waitFor({ state: 'visible', timeout: 20000 });
    await page.locator('#cardNumber').fill('4242424242424242');
    await page.locator('#cardExpiry').fill('12 / 26');
    await page.locator('#cardCvc').fill('123');
    await page.locator('#billingName').fill('Vipin Pandey');
    console.log('✓ 12. Test card filled — 4242 4242 4242 4242');

    // ── 13. SUBMIT STRIPE PAYMENT ─────────────────────────────────────────────
    await page.getByRole('button', { name: /pay|subscribe|confirm/i }).click();
    console.log('✓ 13. Stripe Pay clicked');

    // ── 14. ORDER CONFIRMATION ────────────────────────────────────────────────
    await page.waitForURL(/order[-/]confirmation|success/, { timeout: 60000 });
    await page.waitForLoadState('networkidle');
    console.log(`✓ 14. Order confirmation — ${page.url()}`);
    console.log('\n✅ Full flow complete!');
  });
});
