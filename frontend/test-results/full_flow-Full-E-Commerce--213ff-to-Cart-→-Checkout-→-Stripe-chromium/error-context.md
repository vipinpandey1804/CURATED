# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: full_flow.spec.js >> Full E-Commerce Flow >> Login → Browse → Add to Cart → Checkout → Stripe
- Location: frontend\e2e\full_flow.spec.js:76:3

# Error details

```
TimeoutError: page.waitForResponse: Timeout 15000ms exceeded while waiting for event "response"
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - banner [ref=e3]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e7]: COMPLIMENTARY SHIPPING ON ORDERS OVER $250
        - generic [ref=e8]: COMPLIMENTARY SHIPPING ON ORDERS OVER $250
        - generic [ref=e9]: COMPLIMENTARY SHIPPING ON ORDERS OVER $250
        - generic [ref=e10]: COMPLIMENTARY SHIPPING ON ORDERS OVER $250
      - generic [ref=e11]:
        - generic [ref=e12]: COMPLIMENTARY SHIPPING ON ORDERS OVER $250
        - generic [ref=e13]: COMPLIMENTARY SHIPPING ON ORDERS OVER $250
        - generic [ref=e14]: COMPLIMENTARY SHIPPING ON ORDERS OVER $250
        - generic [ref=e15]: COMPLIMENTARY SHIPPING ON ORDERS OVER $250
    - generic [ref=e17]:
      - navigation [ref=e18]:
        - link "New Arrivals" [ref=e19] [cursor=pointer]:
          - /url: /new-arrivals
        - link "Collections" [ref=e20] [cursor=pointer]:
          - /url: /collections
        - link "Editorial" [ref=e21] [cursor=pointer]:
          - /url: /editorial
        - link "Lookbook" [ref=e22] [cursor=pointer]:
          - /url: /lookbook
      - link "CURATED" [ref=e23] [cursor=pointer]:
        - /url: /
      - generic [ref=e24]:
        - button "Search" [ref=e25] [cursor=pointer]:
          - img [ref=e26]
        - link "Wishlist" [ref=e29] [cursor=pointer]:
          - /url: /wishlist
          - img [ref=e30]
        - link "Cart" [ref=e32] [cursor=pointer]:
          - /url: /cart
          - img [ref=e33]
        - button "Account" [ref=e37] [cursor=pointer]:
          - img [ref=e38]
          - img [ref=e41]
  - main [ref=e43]:
    - generic [ref=e44]:
      - navigation [ref=e45]:
        - link "Home" [ref=e46] [cursor=pointer]:
          - /url: /
        - generic [ref=e47]: /
        - link "Products" [ref=e48] [cursor=pointer]:
          - /url: /products
        - generic [ref=e49]: /
        - link "c612d99a-f2d2-499c-bc4a-d1934f3889cd" [ref=e50] [cursor=pointer]:
          - /url: /products?cat=c612d99a-f2d2-499c-bc4a-d1934f3889cd
        - generic [ref=e51]: /
        - generic [ref=e52]: Endure Long Run Tee
      - generic [ref=e53]:
        - img "Endure Long Run Tee" [ref=e56]
        - generic [ref=e57]:
          - paragraph [ref=e58]: c612d99a-f2d2-499c-bc4a-d1934f3889cd
          - heading "Endure Long Run Tee" [level=1] [ref=e59]
          - generic [ref=e60]:
            - generic [ref=e61]:
              - img [ref=e62]
              - img [ref=e64]
              - img [ref=e66]
              - img [ref=e68]
              - img [ref=e70]
            - generic [ref=e72]: (0 reviews)
            - link "Write a Review" [ref=e73] [cursor=pointer]:
              - /url: /products/endure-long-run-tee/review
          - paragraph [ref=e74]: $65
          - generic [ref=e75]:
            - paragraph [ref=e76]: Please select a variant
            - button "Choose a variant…" [ref=e78] [cursor=pointer]:
              - generic [ref=e79]: Choose a variant…
              - img [ref=e80]
          - generic [ref=e82]:
            - button "Add to Bag" [active] [ref=e83] [cursor=pointer]
            - button "Save to wishlist" [ref=e84] [cursor=pointer]:
              - img [ref=e85]
          - generic [ref=e87]:
            - generic [ref=e88]:
              - img [ref=e89]
              - generic [ref=e94]: White Glove Delivery — Ships in 4–6 weeks
            - generic [ref=e95]:
              - img [ref=e96]
              - generic [ref=e98]: 10-Year Warranty — Built for longevity
          - generic [ref=e99]:
            - heading "Uncompromising Materiality" [level=3] [ref=e100]
            - paragraph [ref=e101]: Endure Long Run Tee — crafted from 100% Recycled Poly Mesh, made in Portugal.
            - list [ref=e102]:
              - listitem [ref=e103]: "Material: 100% Recycled Poly Mesh"
              - listitem [ref=e104]: "Origin: Portugal"
      - generic [ref=e105]:
        - generic [ref=e107]:
          - paragraph [ref=e108]: You May Also Like
          - heading "Complete the Space." [level=2] [ref=e109]
        - generic [ref=e110]:
          - generic [ref=e111]:
            - generic [ref=e112]:
              - link "Neoprene Swim Bikini Top" [ref=e113] [cursor=pointer]:
                - /url: /products/neoprene-swim-bikini-top
                - img "Neoprene Swim Bikini Top" [ref=e114]
              - button "Add to wishlist" [ref=e115] [cursor=pointer]:
                - img [ref=e116]
              - button "Add to Cart" [ref=e119] [cursor=pointer]:
                - img [ref=e120]
                - text: Add to Cart
            - link "Neoprene Swim Bikini Top $85" [ref=e123] [cursor=pointer]:
              - /url: /products/neoprene-swim-bikini-top
              - paragraph
              - heading "Neoprene Swim Bikini Top" [level=3] [ref=e124]
              - paragraph [ref=e125]: $85
          - generic [ref=e126]:
            - generic [ref=e127]:
              - link "Eco Stretch Jean" [ref=e128] [cursor=pointer]:
                - /url: /products/eco-stretch-jean
                - img "Eco Stretch Jean" [ref=e129]
              - button "Add to wishlist" [ref=e130] [cursor=pointer]:
                - img [ref=e131]
              - button "Add to Cart" [ref=e134] [cursor=pointer]:
                - img [ref=e135]
                - text: Add to Cart
            - link "Eco Stretch Jean $145" [ref=e138] [cursor=pointer]:
              - /url: /products/eco-stretch-jean
              - paragraph
              - heading "Eco Stretch Jean" [level=3] [ref=e139]
              - paragraph [ref=e140]: $145
          - generic [ref=e141]:
            - generic [ref=e142]:
              - link "Ultralight Running Vest New" [ref=e143] [cursor=pointer]:
                - /url: /products/ultralight-running-vest
                - img "Ultralight Running Vest" [ref=e144]
                - generic [ref=e145]: New
              - button "Add to wishlist" [ref=e146] [cursor=pointer]:
                - img [ref=e147]
              - button "Add to Cart" [ref=e150] [cursor=pointer]:
                - img [ref=e151]
                - text: Add to Cart
            - link "Ultralight Running Vest $95" [ref=e154] [cursor=pointer]:
              - /url: /products/ultralight-running-vest
              - paragraph
              - heading "Ultralight Running Vest" [level=3] [ref=e155]
              - paragraph [ref=e156]: $95
          - generic [ref=e157]:
            - generic [ref=e158]:
              - link "Paddle Short" [ref=e159] [cursor=pointer]:
                - /url: /products/paddle-short
                - img "Paddle Short" [ref=e160]
              - button "Add to wishlist" [ref=e161] [cursor=pointer]:
                - img [ref=e162]
              - button "Add to Cart" [ref=e165] [cursor=pointer]:
                - img [ref=e166]
                - text: Add to Cart
            - link "Paddle Short $105" [ref=e169] [cursor=pointer]:
              - /url: /products/paddle-short
              - paragraph
              - heading "Paddle Short" [level=3] [ref=e170]
              - paragraph [ref=e171]: $105
  - contentinfo [ref=e172]:
    - generic [ref=e173]:
      - generic [ref=e174]:
        - generic [ref=e175]:
          - paragraph [ref=e176]: CURATED
          - paragraph [ref=e177]: Premium commerce for the contemporary individual. Curated selections, timeless utility, and mindful design.
          - paragraph [ref=e178]: Follow
          - generic [ref=e179]:
            - link "Instagram" [ref=e180] [cursor=pointer]:
              - /url: "#"
              - img [ref=e181]
            - link "Twitter" [ref=e184] [cursor=pointer]:
              - /url: "#"
              - img [ref=e185]
            - link "Website" [ref=e187] [cursor=pointer]:
              - /url: "#"
              - img [ref=e188]
        - generic [ref=e191]:
          - paragraph [ref=e192]: Company
          - list [ref=e193]:
            - listitem [ref=e194]:
              - link "About Us" [ref=e195] [cursor=pointer]:
                - /url: /about-us
            - listitem [ref=e196]:
              - link "Contact" [ref=e197] [cursor=pointer]:
                - /url: /contact
        - generic [ref=e198]:
          - paragraph [ref=e199]: Shop
          - list [ref=e200]:
            - listitem [ref=e201]:
              - link "New Arrivals" [ref=e202] [cursor=pointer]:
                - /url: /new-arrivals
            - listitem [ref=e203]:
              - link "Collections" [ref=e204] [cursor=pointer]:
                - /url: /collections
            - listitem [ref=e205]:
              - link "Editorial" [ref=e206] [cursor=pointer]:
                - /url: /editorial
        - generic [ref=e207]:
          - paragraph [ref=e208]: Support
          - list [ref=e209]:
            - listitem [ref=e210]:
              - link "FAQ" [ref=e211] [cursor=pointer]:
                - /url: /products/endure-long-run-tee
            - listitem [ref=e212]:
              - link "Shipping" [ref=e213] [cursor=pointer]:
                - /url: /products/endure-long-run-tee
            - listitem [ref=e214]:
              - link "Returns" [ref=e215] [cursor=pointer]:
                - /url: /products/endure-long-run-tee
            - listitem [ref=e216]:
              - link "Contact Us" [ref=e217] [cursor=pointer]:
                - /url: /contact
        - generic [ref=e218]:
          - paragraph [ref=e219]: Legal
          - list [ref=e220]:
            - listitem [ref=e221]:
              - link "Privacy Policy" [ref=e222] [cursor=pointer]:
                - /url: /products/endure-long-run-tee
            - listitem [ref=e223]:
              - link "Terms of Service" [ref=e224] [cursor=pointer]:
                - /url: /products/endure-long-run-tee
      - generic [ref=e225]:
        - generic [ref=e226]:
          - paragraph [ref=e227]: Join the Collective.
          - paragraph [ref=e228]: Early access to seasonal drops and exclusive editorial content.
        - generic [ref=e229]:
          - textbox "Your email address" [ref=e230]
          - button "Subscribe" [ref=e231] [cursor=pointer]
      - generic [ref=e232]:
        - paragraph [ref=e233]: © 2024 CURATED Nordic Commerce. All rights reserved.
        - generic [ref=e234]:
          - generic [ref=e235]: EN
          - generic [ref=e236]: USD
```

# Test source

```ts
  28  | 
  29  | async function getToken(request) {
  30  |   const res = await request.post(`${API_BASE}/auth/login/`, {
  31  |     data: { email: USER_EMAIL, password: USER_PASSWORD },
  32  |   });
  33  |   const json = await res.json();
  34  |   return json.tokens?.access;
  35  | }
  36  | 
  37  | // ─── helper: ensure at least one shipping address exists ─────────────────────
  38  | 
  39  | async function ensureShippingAddress(request) {
  40  |   const token = await getToken(request);
  41  |   const res = await request.get(`${API_BASE}/auth/addresses/`, {
  42  |     headers: { Authorization: `Bearer ${token}` },
  43  |   });
  44  |   const json = await res.json();
  45  |   const addresses = json.results ?? json;
  46  |   if (addresses.length === 0) {
  47  |     await request.post(`${API_BASE}/auth/addresses/`, {
  48  |       headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  49  |       data: {
  50  |         fullName: 'Vipin Pandey',
  51  |         addressLine1: '123 Main Street',
  52  |         city: 'New York',
  53  |         state: 'NY',
  54  |         postalCode: '10001',
  55  |         country: 'US',
  56  |         addressType: 'SHIPPING',
  57  |         isDefault: true,
  58  |         phone: '+11234567890',
  59  |       },
  60  |     });
  61  |     console.log('   Seeded default shipping address');
  62  |   } else {
  63  |     console.log('   Shipping address already exists:', addresses[0].addressLine1);
  64  |   }
  65  | }
  66  | 
  67  | // ─── Full flow test ───────────────────────────────────────────────────────────
  68  | 
  69  | test.describe('Full E-Commerce Flow', () => {
  70  |   test.setTimeout(300_000);
  71  | 
  72  |   test.beforeAll(async ({ request }) => {
  73  |     await ensureShippingAddress(request);
  74  |   });
  75  | 
  76  |   test('Login → Browse → Add to Cart → Checkout → Stripe', async ({ page }) => {
  77  | 
  78  |     // ── 1. LOGIN ──────────────────────────────────────────────────────────────
  79  |     await page.goto('/login');
  80  |     await page.getByLabel(/email address/i).fill(USER_EMAIL);
  81  |     await page.getByPlaceholder('••••••••').fill(USER_PASSWORD);
  82  | 
  83  |     const loginRespPromise = page.waitForResponse(
  84  |       r => r.url().includes('/auth/login/') && r.request().method() === 'POST'
  85  |     );
  86  |     await page.getByRole('button', { name: /sign in/i }).click();
  87  |     const loginResp = await loginRespPromise;
  88  |     expect(loginResp.status(), 'Login should return 200').toBe(200);
  89  | 
  90  |     await page.waitForURL('/', { timeout: 15000 });
  91  |     console.log('✓ 1. Login successful');
  92  | 
  93  |     // ── 2. BROWSE PRODUCTS ────────────────────────────────────────────────────
  94  |     await page.goto('/products');
  95  |     await page.waitForLoadState('networkidle');
  96  |     const productCards = page.locator('a[href^="/products/"]');
  97  |     await expect(productCards.first()).toBeVisible({ timeout: 10000 });
  98  |     const productCount = await productCards.count();
  99  |     console.log(`✓ 2. Products page — ${productCount} products visible`);
  100 | 
  101 |     // ── 3. PRODUCT DETAIL ─────────────────────────────────────────────────────
  102 |     const firstCard = productCards.first();
  103 |     const productUrl = await firstCard.getAttribute('href');
  104 |     await firstCard.click();
  105 |     await page.waitForLoadState('networkidle');
  106 |     await expect(page).toHaveURL(new RegExp(productUrl), { timeout: 10000 });
  107 |     console.log(`✓ 3. Product detail — ${page.url()}`);
  108 | 
  109 |     // ── 4. SELECT VARIANT ─────────────────────────────────────────────────────
  110 |     const variantTrigger = page.locator('button').filter({ hasText: /choose a variant/i });
  111 |     const hasDropdown = await variantTrigger.isVisible({ timeout: 3000 }).catch(() => false);
  112 | 
  113 |     if (hasDropdown) {
  114 |       await variantTrigger.click();
  115 |       const firstOption = page.locator('div[class*="absolute"] button').first();
  116 |       await firstOption.waitFor({ state: 'visible', timeout: 5000 });
  117 |       const variantName = await firstOption.textContent();
  118 |       await firstOption.click();
  119 |       console.log(`✓ 4. Variant selected — ${variantName?.trim()}`);
  120 |     } else {
  121 |       console.log('✓ 4. One-size product — no variant selection needed');
  122 |     }
  123 | 
  124 |     // ── 5. ADD TO BAG ─────────────────────────────────────────────────────────
  125 |     const addBtn = page.getByRole('button', { name: /add to bag/i });
  126 |     await expect(addBtn).toBeVisible({ timeout: 5000 });
  127 | 
> 128 |     const cartRespPromise = page.waitForResponse(
      |                                  ^ TimeoutError: page.waitForResponse: Timeout 15000ms exceeded while waiting for event "response"
  129 |       r => r.url().includes('/cart/items/') && r.request().method() === 'POST',
  130 |       { timeout: 15000 }
  131 |     );
  132 |     await addBtn.click();
  133 |     const cartResp = await cartRespPromise;
  134 |     expect(cartResp.status(), 'Add to cart should succeed').toBeLessThan(400);
  135 |     const cartBody = await cartResp.json().catch(() => ({}));
  136 |     console.log(`✓ 5. Added to bag — items: ${cartBody.itemCount ?? cartBody.items?.length}`);
  137 | 
  138 |     // ── 6. CART PAGE ──────────────────────────────────────────────────────────
  139 |     await page.waitForURL('/cart', { timeout: 10000 });
  140 |     await page.waitForLoadState('networkidle');
  141 | 
  142 |     // Wait for spinner to disappear
  143 |     await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 10000 });
  144 |     await expect(page.getByRole('heading', { name: /your bag/i })).toBeVisible({ timeout: 10000 });
  145 |     console.log('✓ 6. Cart page loaded');
  146 | 
  147 |     // ── 7. PROCEED TO CHECKOUT ────────────────────────────────────────────────
  148 |     await page.getByRole('button', { name: /proceed to checkout/i }).click();
  149 |     await page.waitForURL('/checkout/shipping', { timeout: 10000 });
  150 |     await page.waitForLoadState('networkidle');
  151 |     await expect(page.getByRole('heading', { name: /shipping/i })).toBeVisible({ timeout: 8000 });
  152 |     console.log('✓ 7. Checkout shipping page');
  153 | 
  154 |     // ── 8. SHIPPING ADDRESS ───────────────────────────────────────────────────
  155 |     // If saved address is pre-filled, just continue. Otherwise fill manually.
  156 |     const continueBtn = page.getByRole('button', { name: /continue to payment/i });
  157 |     await expect(continueBtn).toBeVisible({ timeout: 8000 });
  158 | 
  159 |     const firstNameInput = page.locator('input').first();
  160 |     const firstNameVal = await firstNameInput.inputValue().catch(() => '');
  161 |     if (!firstNameVal) {
  162 |       // Fill manually
  163 |       const inputs = page.locator('input[type="text"], input[type="tel"]');
  164 |       await inputs.nth(0).fill('Vipin');
  165 |       await inputs.nth(1).fill('Pandey');
  166 |       await inputs.nth(2).fill('123 Main Street');
  167 |       await inputs.nth(3).fill('New York');
  168 |       await inputs.nth(4).fill('NY');
  169 |       await inputs.nth(5).fill('10001');
  170 |       const countrySelect = page.locator('select').first();
  171 |       if (await countrySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
  172 |         await countrySelect.selectOption('US');
  173 |       }
  174 |       console.log('✓ 8. Shipping form filled manually');
  175 |     } else {
  176 |       console.log(`✓ 8. Shipping form pre-filled — ${firstNameVal}`);
  177 |     }
  178 | 
  179 |     // ── 9. CONTINUE TO PAYMENT ────────────────────────────────────────────────
  180 |     await continueBtn.click();
  181 |     await page.waitForURL('/checkout/payment', { timeout: 10000 });
  182 |     await page.waitForLoadState('networkidle');
  183 |     console.log('✓ 9. Payment page');
  184 | 
  185 |     // ── 10. CLICK PAY ─────────────────────────────────────────────────────────
  186 |     const payBtn = page.locator('button').filter({ hasText: /pay/i }).first();
  187 |     await expect(payBtn).toBeVisible({ timeout: 8000 });
  188 | 
  189 |     const orderRespPromise = page.waitForResponse(
  190 |       r => r.url().includes('/orders/create/') && r.request().method() === 'POST',
  191 |       { timeout: 20000 }
  192 |     ).catch(() => null);
  193 | 
  194 |     // Intercept Stripe session before redirect
  195 |     let stripeBody = null;
  196 |     let stripeStatus = null;
  197 |     await page.route('**/payments/**', async (route) => {
  198 |       const response = await route.fetch();
  199 |       stripeBody = await response.json().catch(() => ({}));
  200 |       stripeStatus = response.status();
  201 |       await route.fulfill({ response });
  202 |     });
  203 | 
  204 |     await payBtn.click();
  205 |     console.log('   Clicked Pay — waiting for API responses...');
  206 | 
  207 |     const orderResp = await orderRespPromise;
  208 |     if (orderResp) {
  209 |       const orderBody = await orderResp.json().catch(() => ({}));
  210 |       expect(orderResp.status(), 'Order creation should succeed').toBeLessThan(400);
  211 |       console.log(`✓ 10a. Order created — #${orderBody.orderNumber ?? orderBody.order_number}`);
  212 |     } else {
  213 |       console.log('⚠ 10a. Order API response not captured');
  214 |     }
  215 | 
  216 |     await page.waitForTimeout(4000);
  217 | 
  218 |     if (stripeBody) {
  219 |       const checkoutUrl = stripeBody.checkoutUrl ?? stripeBody.checkout_url ?? stripeBody.url;
  220 |       expect(stripeStatus, 'Stripe session should succeed').toBeLessThan(400);
  221 |       expect(checkoutUrl, 'Should have Stripe checkout URL').toBeTruthy();
  222 |       console.log(`✓ 10b. Stripe session created — ${String(checkoutUrl).substring(0, 60)}...`);
  223 |     } else {
  224 |       console.log('⚠ 10b. Stripe session not captured via route intercept');
  225 |     }
  226 | 
  227 |     // ── 11. STRIPE CHECKOUT PAGE ──────────────────────────────────────────────
  228 |     await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 });
```