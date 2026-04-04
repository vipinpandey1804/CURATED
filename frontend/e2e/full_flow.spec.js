import { test, expect } from '@playwright/test';

const USER_EMAIL    = 'vipinpandey1804@gmail.com';
const USER_PASSWORD = 'Admin@123';

test.describe('Full E-Commerce Flow', () => {
  test.setTimeout(300_000);

  test('Login -> Browse -> Add to Cart -> Checkout -> Stripe', async ({ page }) => {

    // ── 1. LOGIN ────────────────────────────────────────────────────────────
    await page.goto('/login');
    await page.getByLabel(/email address/i).fill(USER_EMAIL);
    await page.getByPlaceholder('••••••••').fill(USER_PASSWORD);

    const loginResp = page.waitForResponse(
      r => r.url().includes('/auth/') && r.request().method() === 'POST'
    );
    await page.getByRole('button', { name: /sign in/i }).click();
    const lr = await loginResp;
    expect(lr.status(), 'Login should return 200').toBe(200);
    await page.waitForURL(u => ['/', '/products'].includes(new URL(u).pathname), { timeout: 15000 });
    console.log('OK 1. Login -', page.url());

    // ── 2. BROWSE PRODUCTS ──────────────────────────────────────────────────
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    const cards = page.locator('a[href^="/products/"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
    console.log('OK 2. Products page -', await cards.count(), 'products');

    // ── 3. PRODUCT DETAIL ───────────────────────────────────────────────────
    await cards.first().click();
    await page.waitForLoadState('networkidle');
    console.log('OK 3. Product detail -', page.url());

    // ── 4. SELECT VARIANT (if dropdown exists) ──────────────────────────────
    const variantTrigger = page.locator('button').filter({ hasText: /choose a variant/i });
    const hasDropdown = await variantTrigger.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasDropdown) {
      await variantTrigger.click();
      const firstOption = page.locator('div[class*="absolute"] button').first();
      await firstOption.waitFor({ state: 'visible', timeout: 5000 });
      const variantName = await firstOption.textContent();
      await firstOption.click();
      console.log('OK 4. Variant selected -', variantName?.trim());
    } else {
      // One Size product - first variant is auto-used
      console.log('OK 4. One Size product - no dropdown needed');
    }

    // ── 5. ADD TO BAG ───────────────────────────────────────────────────────
    const addBtn = page.getByRole('button', { name: /add to bag/i });
    await expect(addBtn).toBeVisible({ timeout: 5000 });

    // listener BEFORE click
    const cartRespPromise = page.waitForResponse(
      r => r.url().includes('/cart/items/') && r.request().method() === 'POST',
      { timeout: 15000 }
    );
    await addBtn.click();
    const cr = await cartRespPromise;
    const crBody = await cr.json().catch(() => ({}));
    console.log('OK 5. Add to Bag - status:', cr.status(), 'items:', crBody.itemCount ?? crBody.items?.length);
    expect(cr.status(), 'Add to cart should succeed').toBeLessThan(400);

    // ── 6. CART PAGE ────────────────────────────────────────────────────────
    await page.waitForURL('/cart', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /your bag/i })).toBeVisible();
    console.log('OK 6. Cart page loaded');

    // ── 7. PROCEED TO CHECKOUT ──────────────────────────────────────────────
    await page.getByRole('button', { name: /proceed to checkout/i }).click();
    await page.waitForURL('/checkout/shipping', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    console.log('OK 7. Checkout shipping page');

    // ── 8. FILL SHIPPING FORM ───────────────────────────────────────────────
    const fill = async (label, value) => {
      const el = page.locator(`label:has-text("${label}")`).locator('..').locator('input').first();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) await el.fill(value);
    };

    await fill('First Name', 'Vipin');
    await fill('Last Name', 'Pandey');
    await fill('Street Address', '123 Main Street');
    await fill('City', 'New York');
    await fill('State', 'NY');
    await fill('Postal Code', '10001');
    await fill('Phone', '+11234567890');

    const countrySelect = page.locator('select').first();
    if (await countrySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await countrySelect.selectOption({ label: 'United States' });
    }
    console.log('OK 8. Shipping form filled');

    // ── 9. CONTINUE TO PAYMENT ──────────────────────────────────────────────
    await page.getByRole('button', { name: /continue to payment/i }).click();
    await page.waitForURL('/checkout/payment', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    console.log('OK 9. Payment page');

    // ── 10. CLICK PAY ───────────────────────────────────────────────────────
    const payBtn = page.locator('button:has-text("Pay")');
    await expect(payBtn).toBeVisible({ timeout: 5000 });

    // listeners BEFORE click
    const orderRespPromise = page.waitForResponse(
      r => r.url().includes('/orders/create/') && r.request().method() === 'POST',
      { timeout: 20000 }
    ).catch(() => null);

    // Intercept Stripe session response before page navigates away
    let stripeBodyCapture = null;
    let stripeStatusCapture = null;
    await page.route('**/payments/create-session/**', async (route) => {
      const response = await route.fetch();
      const body = await response.json().catch(() => ({}));
      stripeBodyCapture = body;
      stripeStatusCapture = response.status();
      await route.fulfill({ response });
    });

    await payBtn.click();
    console.log('   Clicked Pay - waiting for API calls...');

    const orderResp = await orderRespPromise;
    if (orderResp) {
      const orderBody = await orderResp.json().catch(() => ({}));
      console.log('OK 10a. Order created - status:', orderResp.status(), 'order_number:', orderBody.order_number || orderBody.orderNumber);
      expect(orderResp.status(), 'Order creation should succeed').toBeLessThan(400);
    } else {
      const errText = await page.locator('.text-red-500').first().textContent().catch(() => '');
      console.log('WARN 10a. Order API not captured. Page error:', errText);
    }

    // Wait for the route intercept to fire
    await page.waitForTimeout(5000);

    if (stripeBodyCapture !== null) {
      const checkoutUrl = stripeBodyCapture.checkout_url ?? stripeBodyCapture.checkoutUrl ?? stripeBodyCapture.url;
      console.log('OK 10b. Stripe session - status:', stripeStatusCapture, 'body:', JSON.stringify(stripeBodyCapture).substring(0, 150));
      expect(stripeStatusCapture, 'Stripe session should succeed').toBeLessThan(400);
      expect(checkoutUrl, 'Should have checkout URL').toBeTruthy();
    } else {
      console.log('WARN 10b. Stripe session API not captured');
    }

    // ── 11. STRIPE CHECKOUT PAGE ────────────────────────────────────────────
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 20000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(3000); // let Stripe JS fully render
    console.log('OK 11. Redirected to Stripe -', page.url().substring(0, 80));

    // ── 12. FILL STRIPE TEST CARD ───────────────────────────────────────────
    // Card fields are in the main page DOM (no iframe needed)
    await page.locator('#cardNumber').waitFor({ state: 'visible', timeout: 20000 });
    await page.locator('#cardNumber').fill('4242424242424242');
    await page.locator('#cardExpiry').fill('12 / 26');
    await page.locator('#cardCvc').fill('123');
    await page.locator('#billingName').fill('Vipin Pandey');
    console.log('OK 12. Test card filled (4242 4242 4242 4242)');

    // ── 13. SUBMIT STRIPE PAYMENT ───────────────────────────────────────────
    await page.getByRole('button', { name: /pay|subscribe|confirm/i }).click();
    console.log('OK 13. Stripe Pay button clicked');

    // ── 14. ORDER CONFIRMATION ──────────────────────────────────────────────
    await page.waitForURL(/order-confirmation|order\/confirmation|success/, { timeout: 60000 });
    await page.waitForLoadState('networkidle');
    console.log('OK 14. Order confirmation -', page.url());

    console.log('\nFull flow test complete!');
  });
});
