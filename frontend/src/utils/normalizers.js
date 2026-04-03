/**
 * Normalize a product from the API to a flat shape the UI components expect.
 * Backend uses camelCase (djangorestframework-camel-case) so field names are already camelCase.
 */
export function normalizeProduct(p) {
  if (!p) return null;

  // Primary image: first from images array or null
  const primaryImage = p.primaryImage || (p.images?.[0]?.url) || (p.images?.[0]?.image) || null;

  // Variants: normalize to { id, sku, name, color, size, effectivePrice, isActive }
  const variants = (p.variants || []).map((v) => {
    const color = v.attributes.find((a) => a?.typeName === 'Color')?.value || '';
    const size = v.attributes.find((a) => a?.typeName === 'Size' || a?.typeName === 'Shoe Size')?.value || 'One Size';
    return {
      id: v.id,
      sku: v.sku,
      name: v.name || v.sku,
      color,
      size,
      effectivePrice: parseFloat(v.effectivePrice?.amount ?? v.effectivePrice ?? p.basePrice?.amount ?? p.basePrice ?? 0),
      isActive: v.isActive ?? true,
      attributes: v.attributes || [],
    };
  });

  // Derive unique color and size options from variant attributes
  // Serializer returns { typeName, value } (camelCase of type_name)
  const colors = [...new Set(
    variants.flatMap((v) => v.attributes.filter((a) => a?.typeName === 'Color').map((a) => a.value))
  )];
  const sizes = [...new Set(
    variants.flatMap((v) => v.attributes.filter((a) =>
      a?.typeName === 'Size' || a?.typeName === 'Shoe Size' || a?.typeName === 'One Size'
    ).map((a) => a.value))
  )];

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category?.name || p.category || '',
    categorySlug: p.category?.slug || '',
    price: parseFloat(p.basePrice?.amount ?? p.basePrice ?? 0),
    originalPrice: p.compareAtPrice ? parseFloat(p.compareAtPrice.amount ?? p.compareAtPrice) : null,
    image: primaryImage,
    images: (p.images || []).map((img) => img.url || img.image || img),
    variants,
    colors: colors.length ? colors : (variants.map((v) => v.name).slice(0, 3)),
    sizes,
    description: p.description || '',
    material: p.material || '',
    origin: p.origin || '',
    isNew: p.isNew ?? false,
    isFeatured: p.isFeatured ?? false,
    inStock: variants.some((v) => v.isActive),
    variantCount: p.variantCount || variants.length,
    rating: null,      // Will come from reviews API
    reviewCount: 0,
  };
}

/**
 * Format a money value for display.
 */
export function formatPrice(amount) {
  if (amount == null) return '';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}
