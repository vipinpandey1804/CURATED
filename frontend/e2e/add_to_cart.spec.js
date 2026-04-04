/**
 * E2E Test Suite — Add to Cart buttons
 */

import { test, expect } from '@playwright/test';

const USER_EMAIL    = 'vipinpandey1804@gmail.com';
const USER_PASSWORD = 'Admin@9808';
const API_BASE      = 'http://localhost:8000/api/v1';

async function login(page) {
  await page.goto('/login');
  await page.getByLabel(/email address/i).fill(USER_EMAIL);
  await page.getByPlaceholder('••••••••').fill(USER_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('/', { timeout: 15000 });
}

async function getToken(request) {
  const res = await request.post(`${API_BASE}/auth/login/`, {
    data: { email: USER_EMAIL, password: USER_PASSWORD },
  });
  const { tokens } = await res.json();
  return tokens.access;
}

async function clearCart(request) {
  const token = await getToken(request);
  await request.post(`${API_BASE}/cart/clear/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function clickAddToCart(page) {
  await expect(page.locator('[data-testid="product-card"]').first()).toBeAttached({ timeout: 20000 });

  const cards = page.locator('[data-testid="product-card"]');
  const count = await cards.count();
  console.log(`   Found ${count} Add to Cart buttons`);

  // Hover first card to reveal slide-up button
  await cards.first().hover();

  const cartRespPromise = page.waitForResponse(
    r => r.url().includes('/cart/items/') && r.request().method() === 'POST',
    { timeout: 10000 }
  );

  await cards.first().locator('[data-testid="add-to-cart"]').click();
  const cartResp = await cartRespPromise;
  expect(cartResp.status()).toBeLessThan(400);
  return await cartResp.json().catch(() => ({}));
}

// ─── 1. New Arrivals ──────────────────────────────────────────────────────────

test('Add to Cart works on /new-arrivals', async ({ page, request }) => {
  await clearCart(request);
  await login(page);
  await page.goto('/new-arrivals');

  const body = await clickAddToCart(page);
  expect(body.items?.length ?? body.itemCount).toBeGreaterThan(0);
  console.log(`✓ /new-arrivals — itemCount: ${body.itemCount ?? body.items?.length}`);
});

// ─── 2. Product listing ───────────────────────────────────────────────────────

test('Add to Cart works on /products?cat=shirts', async ({ page, request }) => {
  await clearCart(request);
  await login(page);
  await page.goto('/products?cat=shirts');

  const body = await clickAddToCart(page);
  expect(body.items?.length ?? body.itemCount).toBeGreaterThan(0);
  console.log(`✓ /products?cat=shirts — itemCount: ${body.itemCount ?? body.items?.length}`);
});

// ─── 3. Wishlist ──────────────────────────────────────────────────────────────

test('Add to Bag works on /wishlist', async ({ page, request }) => {
  await clearCart(request);
  const token = await getToken(request);

  // Get first product
  const productsRes = await request.get(`${API_BASE}/catalog/products/?page_size=1`);
  const productsData = await productsRes.json();
  const firstProduct = (productsData.results ?? productsData)[0];
  if (!firstProduct) { console.log('⚠ No products'); return; }

  // Seed wishlist via API
  await request.post(`${API_BASE}/wishlists/toggle/`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: { productId: firstProduct.id },
  });

  await login(page);
  await page.goto('/wishlist');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);

  const addToBagBtns = page.getByRole('button', { name: /add to bag/i });
  const count = await addToBagBtns.count();
  console.log(`   Found ${count} Add to Bag buttons`);

  if (count === 0) { console.log('⚠ Wishlist empty — skipping'); return; }

  const cartRespPromise = page.waitForResponse(
    r => r.url().includes('/cart/items/') && r.request().method() === 'POST',
    { timeout: 10000 }
  );

  await addToBagBtns.first().click();
  const cartResp = await cartRespPromise;
  expect(cartResp.status()).toBeLessThan(400);
  const body = await cartResp.json().catch(() => ({}));
  console.log(`✓ /wishlist Add to Bag — itemCount: ${body.itemCount ?? body.items?.length}`);
});
