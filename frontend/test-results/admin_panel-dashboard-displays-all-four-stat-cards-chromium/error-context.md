# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin_panel.spec.js >> dashboard displays all four stat cards
- Location: frontend\e2e\admin_panel.spec.js:231:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('42')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('42')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - img "Nordic Interior Aesthetic" [ref=e5]
    - generic [ref=e7]:
      - paragraph [ref=e8]: Nordic Commerce
      - heading "Quality Over Quantity" [level=2] [ref=e9]:
        - text: Quality
        - text: Over
        - text: Quantity
      - paragraph [ref=e10]:
        - text: Curated selections for the modern minimalist.
        - text: Designed in Stockholm, delivered globally.
  - generic [ref=e12]:
    - link "CURATED" [ref=e13] [cursor=pointer]:
      - /url: /
    - heading "Welcome back." [level=1] [ref=e14]
    - paragraph [ref=e15]: Sign in to your account to continue.
    - generic [ref=e16]:
      - button "Email" [ref=e17] [cursor=pointer]
      - button "Mobile Number" [ref=e18] [cursor=pointer]
    - generic [ref=e19]:
      - generic [ref=e20]:
        - generic [ref=e21]: Email Address
        - textbox "Email Address" [ref=e22]:
          - /placeholder: you@example.com
      - generic [ref=e23]:
        - generic [ref=e24]: Password
        - generic [ref=e25]:
          - textbox "Password" [ref=e26]:
            - /placeholder: ••••••••
          - button [ref=e27] [cursor=pointer]:
            - img [ref=e28]
        - link "Forgot Password?" [ref=e32] [cursor=pointer]:
          - /url: /forgot-password
      - button "Sign In" [ref=e33] [cursor=pointer]
    - generic [ref=e38]: Or continue with
    - paragraph [ref=e40]:
      - text: New to Nordic?
      - link "Create Account" [ref=e41] [cursor=pointer]:
        - /url: /signup
    - generic [ref=e42]:
      - link "Sustainability" [ref=e43] [cursor=pointer]:
        - /url: /login
      - link "Shipping" [ref=e44] [cursor=pointer]:
        - /url: /login
      - link "Returns" [ref=e45] [cursor=pointer]:
        - /url: /login
      - link "Contact" [ref=e46] [cursor=pointer]:
        - /url: /login
      - link "Privacy" [ref=e47] [cursor=pointer]:
        - /url: /login
    - paragraph [ref=e48]: © 2024 Nordic Commerce. All Rights Reserved.
```

# Test source

```ts
  136 |       orderId: 'aaaa-1111',
  137 |       orderNumber: 'CUR-ABCD1234',
  138 |       userEmail: 'customer@example.com',
  139 |       userName: 'Jane Doe',
  140 |       status: 'REQUESTED',
  141 |       reason: 'Does not fit',
  142 |       createdAt: '2026-04-02T10:00:00Z',
  143 |       lineItems: [{ id: 'li1', productName: 'Classic White Tee', quantity: 1, reasonCode: 'WRONG_SIZE', sku: 'CWT-M' }],
  144 |     },
  145 |   ],
  146 | };
  147 | 
  148 | const MOCK_COUPONS = {
  149 |   count: 1,
  150 |   results: [
  151 |     { id: 1, code: 'SUMMER20', discountType: 'PERCENTAGE', discountValue: '20.00', isActive: true, timesUsed: 5, maxUses: null, validFrom: '2026-01-01T00:00:00Z', validUntil: '2026-12-31T00:00:00Z', description: '' },
  152 |   ],
  153 | };
  154 | 
  155 | const MOCK_USERS = {
  156 |   count: 1,
  157 |   results: [
  158 |     { id: 2, email: 'customer@example.com', firstName: 'Jane', lastName: 'Doe', phoneNumber: null, isStaff: false, isActive: true, isVerified: true, dateJoined: '2026-01-01T00:00:00Z', fullName: 'Jane Doe' },
  159 |   ],
  160 | };
  161 | 
  162 | // ─── Helpers ──────────────────────────────────────────────────────────────────
  163 | 
  164 | /**
  165 |  * Set access_token in localStorage so AuthContext skips the login redirect.
  166 |  * Also intercept /auth/me/ to return the given user.
  167 |  */
  168 | async function mockAuth(page, user) {
  169 |   await page.addInitScript((u) => {
  170 |     localStorage.setItem('access_token', 'mock-access-token');
  171 |     localStorage.setItem('refresh_token', 'mock-refresh-token');
  172 |   }, user);
  173 | 
  174 |   await page.route('**/api/v1/auth/me/**', (route) =>
  175 |     route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) })
  176 |   );
  177 | }
  178 | 
  179 | /** Intercept the standard admin API endpoints that a page will call. */
  180 | async function mockAdminAPIs(page) {
  181 |   const routes = [
  182 |     ['**/api/v1/admin/stats/**', MOCK_STATS],
  183 |     ['**/api/v1/admin/orders/**', MOCK_ORDERS],
  184 |     ['**/api/v1/admin/catalog/products/**', MOCK_PRODUCTS],
  185 |     ['**/api/v1/admin/catalog/categories/**', MOCK_CATEGORIES],
  186 |     ['**/api/v1/admin/returns/**', MOCK_RETURNS],
  187 |     ['**/api/v1/admin/marketing/coupons/**', MOCK_COUPONS],
  188 |     ['**/api/v1/admin/users/**', MOCK_USERS],
  189 |     ['**/api/v1/admin/catalog/attributes/**', { count: 0, results: [] }],
  190 |     ['**/api/v1/admin/catalog/attribute-values/**', { count: 0, results: [] }],
  191 |   ];
  192 |   for (const [pattern, body] of routes) {
  193 |     await page.route(pattern, (route) =>
  194 |       route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  195 |     );
  196 |   }
  197 | }
  198 | 
  199 | 
  200 | // ═════════════════════════════════════════════════════════════════════════════
  201 | // 1 — Auth guards
  202 | // ═════════════════════════════════════════════════════════════════════════════
  203 | 
  204 | test('unauthenticated user is redirected to /login when accessing /admin-panel', async ({ page }) => {
  205 |   // No token set — AuthContext will redirect
  206 |   await page.goto('/admin-panel');
  207 |   await page.waitForURL('**/login**');
  208 |   await expect(page).toHaveURL(/\/login/);
  209 | });
  210 | 
  211 | test('non-staff authenticated user sees Access Denied', async ({ page }) => {
  212 |   await mockAuth(page, REGULAR_USER);
  213 |   await page.goto('/admin-panel');
  214 |   await expect(page.getByText('Access Denied')).toBeVisible();
  215 |   await expect(page.getByText('staff privileges')).toBeVisible();
  216 | });
  217 | 
  218 | 
  219 | // ═════════════════════════════════════════════════════════════════════════════
  220 | // 2 — Dashboard
  221 | // ═════════════════════════════════════════════════════════════════════════════
  222 | 
  223 | test('staff user reaches admin dashboard', async ({ page }) => {
  224 |   await mockAuth(page, STAFF_USER);
  225 |   await mockAdminAPIs(page);
  226 |   await page.goto('/admin-panel');
  227 |   // Sidebar should be visible
  228 |   await expect(page.getByText('Dashboard').first()).toBeVisible();
  229 | });
  230 | 
  231 | test('dashboard displays all four stat cards', async ({ page }) => {
  232 |   await mockAuth(page, STAFF_USER);
  233 |   await mockAdminAPIs(page);
  234 |   await page.goto('/admin-panel');
  235 |   // Stat values from MOCK_STATS
> 236 |   await expect(page.getByText('42')).toBeVisible();   // totalProducts
      |                                      ^ Error: expect(locator).toBeVisible() failed
  237 |   await expect(page.getByText('128')).toBeVisible();  // totalUsers
  238 |   await expect(page.getByText('57')).toBeVisible();   // totalOrders
  239 |   await expect(page.getByText('3').first()).toBeVisible();    // pendingReturns
  240 | });
  241 | 
  242 | test('dashboard displays revenue section', async ({ page }) => {
  243 |   await mockAuth(page, STAFF_USER);
  244 |   await mockAdminAPIs(page);
  245 |   await page.goto('/admin-panel');
  246 |   await expect(page.getByText(/revenue/i).first()).toBeVisible();
  247 | });
  248 | 
  249 | test('dashboard shows recent orders table with order number', async ({ page }) => {
  250 |   await mockAuth(page, STAFF_USER);
  251 |   await mockAdminAPIs(page);
  252 |   await page.goto('/admin-panel');
  253 |   await expect(page.getByText('CUR-ABCD1234')).toBeVisible();
  254 | });
  255 | 
  256 | 
  257 | // ═════════════════════════════════════════════════════════════════════════════
  258 | // 3 — Products page
  259 | // ═════════════════════════════════════════════════════════════════════════════
  260 | 
  261 | test('products page renders product names in table', async ({ page }) => {
  262 |   await mockAuth(page, STAFF_USER);
  263 |   await mockAdminAPIs(page);
  264 |   await page.goto('/admin-panel/products');
  265 |   await expect(page.getByText('Classic White Tee')).toBeVisible();
  266 |   await expect(page.getByText('Black Denim Jacket')).toBeVisible();
  267 | });
  268 | 
  269 | test('products page has Add Product link', async ({ page }) => {
  270 |   await mockAuth(page, STAFF_USER);
  271 |   await mockAdminAPIs(page);
  272 |   await page.goto('/admin-panel/products');
  273 |   await expect(page.getByRole('button', { name: /new product/i })).toBeVisible();
  274 | });
  275 | 
  276 | test('products page search input is present', async ({ page }) => {
  277 |   await mockAuth(page, STAFF_USER);
  278 |   await mockAdminAPIs(page);
  279 |   await page.goto('/admin-panel/products');
  280 |   await expect(page.getByPlaceholder(/search/i)).toBeVisible();
  281 | });
  282 | 
  283 | 
  284 | // ═════════════════════════════════════════════════════════════════════════════
  285 | // 4 — Categories page
  286 | // ═════════════════════════════════════════════════════════════════════════════
  287 | 
  288 | test('categories page renders category names', async ({ page }) => {
  289 |   await mockAuth(page, STAFF_USER);
  290 |   await mockAdminAPIs(page);
  291 |   await page.goto('/admin-panel/categories');
  292 |   await expect(page.getByRole('cell', { name: 'Tops', exact: true })).toBeVisible();
  293 | });
  294 | 
  295 | test('categories page has New Category button', async ({ page }) => {
  296 |   await mockAuth(page, STAFF_USER);
  297 |   await mockAdminAPIs(page);
  298 |   await page.goto('/admin-panel/categories');
  299 |   await expect(page.getByRole('button', { name: /new category/i })).toBeVisible();
  300 | });
  301 | 
  302 | test('categories page create dialog opens', async ({ page }) => {
  303 |   await mockAuth(page, STAFF_USER);
  304 |   await mockAdminAPIs(page);
  305 |   await page.goto('/admin-panel/categories');
  306 |   await page.getByRole('button', { name: /new category/i }).click();
  307 |   await expect(page.getByRole('dialog')).toBeVisible();
  308 |   await expect(page.getByRole('dialog').locator('input').first()).toBeVisible();
  309 | });
  310 | 
  311 | 
  312 | // ═════════════════════════════════════════════════════════════════════════════
  313 | // 5 — Orders page
  314 | // ═════════════════════════════════════════════════════════════════════════════
  315 | 
  316 | test('orders page renders order numbers', async ({ page }) => {
  317 |   await mockAuth(page, STAFF_USER);
  318 |   await mockAdminAPIs(page);
  319 |   await page.goto('/admin-panel/orders');
  320 |   await expect(page.getByText('CUR-ABCD1234')).toBeVisible();
  321 | });
  322 | 
  323 | test('orders page has status filter dropdown', async ({ page }) => {
  324 |   await mockAuth(page, STAFF_USER);
  325 |   await mockAdminAPIs(page);
  326 |   await page.goto('/admin-panel/orders');
  327 |   // The status select element
  328 |   await expect(page.locator('select').first()).toBeVisible();
  329 | });
  330 | 
  331 | test('orders page has search input', async ({ page }) => {
  332 |   await mockAuth(page, STAFF_USER);
  333 |   await mockAdminAPIs(page);
  334 |   await page.goto('/admin-panel/orders');
  335 |   await expect(page.getByPlaceholder(/order/i)).toBeVisible();
  336 | });
```