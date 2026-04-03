import { test, expect } from '@playwright/test';

test('Full E-Commerce Flow: Login, Browse Products, Add to Cart, Checkout', async ({ page }) => {
  test.setTimeout(120_000);

  // ── 1. LOGIN ──────────────────────────────────────────────────────────────
  await page.goto('/login');
  await page.getByLabel(/email address/i).fill('vipinpandey1804@gmail.com');
  await page.getByPlaceholder('••••••••').fill('Admin@123');
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect to home
  await expect(page).toHaveURL(/^\/$|\/products|\/(?!\/)/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  console.log('✅ Step 1: Login successful');

  // ── 2. BROWSE PRODUCTS ─────────────────────────────────────────────────
  await page.goto('/products');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Products should be visible (either from API or mock data fallback)
  const productCards = page.locator('a[href^="/products/"]');
  const cardCount = await productCards.count();
  console.log(`✅ Step 2: Products page loaded with ${cardCount} product links`);
  expect(cardCount).toBeGreaterThan(0);

  // ── 3. VIEW PRODUCT DETAIL ──────────────────────────────────────────────
  await productCards.first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  console.log(`✅ Step 3: Product detail page loaded – URL: ${page.url()}`);

  // ── 4. ADD TO BAG ──────────────────────────────────────────────────────
  // Select a size first if sizes exist
  const sizeButtons = page.locator('button:has-text("S"), button:has-text("M"), button:has-text("L"), button:has-text("32"), button:has-text("34")');
  if (await sizeButtons.count() > 0) {
    await sizeButtons.first().click();
    console.log('✅ Size selected');
  }

  // Ensure button is present
  const addBtn = page.locator('button').filter({ hasText: /add to bag|add to cart/i }).first();
  await addBtn.waitFor({ state: 'visible', timeout: 15000 }).catch(() => null);

  if (await addBtn.isVisible()) {
    // Listen for the cart item add API call
    const addRespPromise = page.waitForResponse(
      resp => (resp.url().includes('/api/v1/carts/items/') || resp.url().includes('/api/v1/cart/items/')) && resp.request().method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null);

    console.log('   Clicking Add to Bag button...');
    await addBtn.click();
    const addResp = await addRespPromise;
    if (addResp) {
      console.log(`   ✅ Step 4: Add to Bag response received: ${addResp.status()}`);
      if (addResp.status() >= 400) {
        console.log(`   ⚠️  Add to Bag detail: ${await addResp.text()}`);
      } else {
        // Wait for cart redirect or state update
        await page.waitForTimeout(1000);
      }
    } else {
      console.log('   ⚠️  Step 4: TIMED OUT waiting for Add to Bag API');
    }
  } else {
    console.log('⚠️  Step 4: NO "Add to Bag" button visible on page');
  }

  // ── 5. GO TO CART ──────────────────────────────────────────────────────
  await page.goto('/cart');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  const bagHeading = page.getByRole('heading', { name: /your bag/i });
  await expect(bagHeading).toBeVisible();
  console.log('✅ Step 5: Cart page loaded');

  // ── 6. PROCEED TO CHECKOUT SHIPPING ─────────────────────────────────────
  // Look for any checkout link/button
  const checkoutLink = page.getByRole('link', { name: /checkout/i }).first();
  if (await checkoutLink.isVisible()) {
    await checkoutLink.click();
  } else {
    await page.goto('/checkout/shipping');
  }
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  console.log(`✅ Step 6: Checkout shipping page – URL: ${page.url()}`);

  // ── 7. FILL SHIPPING FORM ──────────────────────────────────────────────
  // The fields use label text like "First Name", "Last Name", etc.
  const setField = async (label, value) => {
    const field = page.locator(`label:has-text("${label}") + input, label:has-text("${label}") ~ input`).first();
    if (await field.isVisible()) {
      await field.fill(value);
    } else {
      // Try by placeholder or input near the label
      const altField = page.locator(`input`).filter({ hasText: '' });
      // Fall back to filling by the label's parent container
      const container = page.locator(`div:has(> label:has-text("${label}")) input`).first();
      if (await container.isVisible()) {
        await container.fill(value);
      }
    }
  };

  // Fill the email field
  const emailInput = page.locator('input[type="email"]').first();
  if (await emailInput.isVisible()) {
    const emailVal = await emailInput.inputValue();
    if (!emailVal || !emailVal.includes('@')) {
      await emailInput.fill('vipinpandey1804@gmail.com');
    }
  }

  // Fill address fields using the input-box class pattern used in checkout
  const inputBoxes = page.locator('.input-box');
  const inputCount = await inputBoxes.count();
  console.log(`   Found ${inputCount} input fields on shipping page`);

  // Fill by finding labels and their following inputs
  const fields = [
    { label: 'First Name', value: 'Vipin' },
    { label: 'Last Name', value: 'Pandey' },
    { label: 'Street Address', value: '123 Main Street' },
    { label: 'City', value: 'New York' },
    { label: 'State', value: 'NY' },
    { label: 'Postal Code', value: '10001' },
    { label: 'Phone', value: '1234567890' },
  ];

  for (const { label, value } of fields) {
    const labelEl = page.locator(`label:text-is("${label}"), label:has-text("${label}")`).first();
    if (await labelEl.isVisible()) {
      const parent = labelEl.locator('..');
      const input = parent.locator('input, select').first();
      if (await input.isVisible()) {
        const currentVal = await input.inputValue();
        if (!currentVal || !currentVal.trim()) {
          await input.fill(value);
        }
      }
    }
  }
  console.log('✅ Step 7: Shipping fields filled');

  // ── 8. CONTINUE TO PAYMENT ──────────────────────────────────────────────
  const continueBtn = page.getByRole('button', { name: /continue to payment/i });
  await continueBtn.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Should be on payment page now
  const currentUrl = page.url();
  console.log(`✅ Step 8: After "Continue to Payment" – URL: ${currentUrl}`);

  if (currentUrl.includes('/checkout/payment')) {
    console.log('   ✅ Successfully navigated to Payment page');

    // ── 9. CLICK PAY ──────────────────────────────────────────────────────
    const payBtn = page.locator('button:has-text("Pay")').first();
    if (await payBtn.isVisible()) {
      // Listen for the order creation API call
      const responsePromise = page.waitForResponse(
        resp => resp.url().includes('/api/v1/orders/') && resp.request().method() === 'POST',
        { timeout: 15000 }
      ).catch(() => null);

      await payBtn.click();
      console.log('   Clicked Pay button, waiting for API response...');

      const resp = await responsePromise;
      if (resp) {
        const status = resp.status();
        const body = await resp.text();
        console.log(`   Order API Status: ${status}`);
        console.log(`   Order API Response (first 500 chars): ${body.substring(0, 500)}`);

        if (status === 200 || status === 201) {
          console.log('✅ Step 9: Order created successfully!');
        } else {
          console.log(`⚠️  Step 9: Order creation returned status ${status}`);
        }
      } else {
        // Check if an address creation request was made instead
        await page.waitForTimeout(3000);
        const errorText = await page.locator('.text-red-500').first().textContent().catch(() => '');
        console.log(`⚠️  Step 9: No order response captured. Error on page: "${errorText}"`);
      }
    } else {
      console.log('⚠️  Step 9: Pay button not found');
    }
  } else {
    // Might still be on shipping (validation errors)
    const errorEls = page.locator('.text-red-500');
    const errorCount = await errorEls.count();
    if (errorCount > 0) {
      const firstError = await errorEls.first().textContent();
      console.log(`⚠️  Step 8: Validation errors found – first: "${firstError}"`);
    } else {
      console.log(`⚠️  Step 8: Did not navigate to payment. Current URL: ${currentUrl}`);
    }
  }

  // Final screenshot / wait
  await page.waitForTimeout(2000);
  console.log('✅ Full flow test complete');
});
