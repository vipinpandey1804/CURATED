import { describe, it, expect } from 'vitest';
import { normalizeProduct, formatPrice } from '../utils/normalizers';

// ─── formatPrice ─────────────────────────────────────────────────────────────

describe('formatPrice', () => {
  it('formats a positive number to a USD currency string', () => {
    expect(formatPrice(25)).toBe('$25.00');
  });

  it('formats zero', () => {
    expect(formatPrice(0)).toBe('$0.00');
  });

  it('formats a decimal amount', () => {
    expect(formatPrice(9.99)).toBe('$9.99');
  });

  it('returns an empty string for null', () => {
    expect(formatPrice(null)).toBe('');
  });

  it('returns an empty string for undefined', () => {
    expect(formatPrice(undefined)).toBe('');
  });
});

// ─── normalizeProduct ─────────────────────────────────────────────────────────

describe('normalizeProduct', () => {
  it('returns null for a null input', () => {
    expect(normalizeProduct(null)).toBeNull();
  });

  it('maps basic fields from an API product shape', () => {
    const product = {
      id: 1,
      slug: 'test-shirt',
      name: 'Test Shirt',
      basePrice: { amount: '29.99' },
      compareAtPrice: null,
      category: { name: 'Clothing', slug: 'clothing' },
      images: [],
      variants: [],
      isNew: true,
      isFeatured: false,
    };

    const result = normalizeProduct(product);

    expect(result.id).toBe(1);
    expect(result.slug).toBe('test-shirt');
    expect(result.name).toBe('Test Shirt');
    expect(result.price).toBe(29.99);
    expect(result.originalPrice).toBeNull();
    expect(result.category).toBe('Clothing');
    expect(result.categorySlug).toBe('clothing');
    expect(result.isNew).toBe(true);
    expect(result.isFeatured).toBe(false);
    expect(result.inStock).toBe(false);
    expect(result.variants).toEqual([]);
    expect(result.images).toEqual([]);
  });

  it('extracts originalPrice from compareAtPrice', () => {
    const product = {
      id: 2,
      slug: 'sale-jacket',
      name: 'Sale Jacket',
      basePrice: { amount: '80.00' },
      compareAtPrice: { amount: '160.00' },
      variants: [],
      images: [],
    };

    const result = normalizeProduct(product);

    expect(result.price).toBe(80);
    expect(result.originalPrice).toBe(160);
  });

  it('sets inStock to true when at least one variant is active', () => {
    const product = {
      id: 3,
      slug: 'stocked-item',
      name: 'Stocked Item',
      basePrice: { amount: '50.00' },
      variants: [
        { id: 1, sku: 'SKU-A', effectivePrice: { amount: '50.00' }, isActive: false, attributes: [] },
        { id: 2, sku: 'SKU-B', effectivePrice: { amount: '50.00' }, isActive: true, attributes: [] },
      ],
      images: [],
    };

    expect(normalizeProduct(product).inStock).toBe(true);
  });

  it('sets inStock to false when all variants are inactive', () => {
    const product = {
      id: 4,
      slug: 'oos-item',
      name: 'OOS Item',
      basePrice: { amount: '50.00' },
      variants: [
        { id: 1, sku: 'SKU-A', effectivePrice: { amount: '50.00' }, isActive: false, attributes: [] },
      ],
      images: [],
    };

    expect(normalizeProduct(product).inStock).toBe(false);
  });

  it('extracts unique colors and sizes from variant attributes', () => {
    const product = {
      id: 5,
      slug: 'shirt',
      name: 'Shirt',
      basePrice: { amount: '50.00' },
      variants: [
        {
          id: 1,
          sku: 'SHIRT-BLK-S',
          effectivePrice: { amount: '50.00' },
          isActive: true,
          attributes: [
            { attributeType: { name: 'Color' }, value: 'Black' },
            { attributeType: { name: 'Size' }, value: 'S' },
          ],
        },
        {
          id: 2,
          sku: 'SHIRT-WHT-M',
          effectivePrice: { amount: '50.00' },
          isActive: true,
          attributes: [
            { attributeType: { name: 'Color' }, value: 'White' },
            { attributeType: { name: 'Size' }, value: 'M' },
          ],
        },
        {
          id: 3,
          sku: 'SHIRT-BLK-M',
          effectivePrice: { amount: '50.00' },
          isActive: true,
          attributes: [
            { attributeType: { name: 'Color' }, value: 'Black' },
            { attributeType: { name: 'Size' }, value: 'M' },
          ],
        },
      ],
      images: [],
    };

    const result = normalizeProduct(product);

    expect(result.colors).toEqual(['Black', 'White']);
    expect(result.sizes).toEqual(['S', 'M']);
  });

  it('sets the primary image from the images array when no primaryImage field', () => {
    const product = {
      id: 6,
      slug: 'img-product',
      name: 'Product With Image',
      basePrice: { amount: '10.00' },
      variants: [],
      images: [
        { image: 'https://example.com/first.jpg' },
        { image: 'https://example.com/second.jpg' },
      ],
    };

    const result = normalizeProduct(product);

    expect(result.image).toBe('https://example.com/first.jpg');
    expect(result.images).toEqual([
      'https://example.com/first.jpg',
      'https://example.com/second.jpg',
    ]);
  });

  it('uses the explicit primaryImage field when present', () => {
    const product = {
      id: 7,
      slug: 'explicit-primary',
      name: 'Product',
      basePrice: { amount: '10.00' },
      primaryImage: 'https://example.com/primary.jpg',
      variants: [],
      images: [{ image: 'https://example.com/other.jpg' }],
    };

    expect(normalizeProduct(product).image).toBe('https://example.com/primary.jpg');
  });

  it('defaults description, material, and origin to empty strings', () => {
    const product = {
      id: 8,
      slug: 'minimal',
      name: 'Minimal',
      basePrice: { amount: '5.00' },
      variants: [],
      images: [],
    };

    const result = normalizeProduct(product);

    expect(result.description).toBe('');
    expect(result.material).toBe('');
    expect(result.origin).toBe('');
  });
});
