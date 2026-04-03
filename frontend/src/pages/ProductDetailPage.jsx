import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Star, ChevronLeft, ChevronRight, Truck, Shield, ChevronDown } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { catalogService } from '../services/catalogService';
import { normalizeProduct } from '../utils/normalizers';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ui/ProductCard';
import Button from '../components/ui/Button';

export default function ProductDetailPage() {
  const { id: slug } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { toggle, isWishlisted } = useWishlist();

  const { data: raw, loading, error } = useApi(
    () => catalogService.getProduct(slug).then(normalizeProduct),
    [slug],
  );

  const { data: relatedData } = useApi(
    () => {
      if (!raw) return Promise.resolve([]);
      return catalogService.getProducts({ category__slug: raw.categorySlug, page_size: 5 })
        .then((d) => (d.results || d).map(normalizeProduct).filter((p) => p.slug !== slug).slice(0, 4));
    },
    [raw?.id, slug],
  );

  const product = raw;
  const related = relatedData || [];

  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [variantError, setVariantError] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const variants = product?.variants || [];
  const activeVariant = variants.find((v) => v.id === selectedVariantId) || null;
  const displayPrice = activeVariant ? activeVariant.effectivePrice : product?.price;

  if (loading) {
    return (
      <main className="pt-[96px] flex items-center justify-center min-h-screen">
        <p className="text-sm text-brand-muted">Loading product…</p>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="pt-[96px] flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="font-serif text-2xl font-light mb-4">Product not found.</p>
          <Button variant="primary" onClick={() => navigate('/products')}>Browse Products</Button>
        </div>
      </main>
    );
  }

  const wishlisted = isWishlisted(product.id);

  const handleAddToBag = () => {
    if (!activeVariant) {
      setVariantError(true);
      return;
    }
    add(product, activeVariant, 1);
    navigate('/cart');
  };

  return (
    <main className="pt-[96px] min-h-screen">
      <div className="max-w-8xl mx-auto px-6 lg:px-12 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-brand-muted mb-8">
          <Link to="/" className="hover:text-brand-dark transition-colors">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-brand-dark transition-colors">Products</Link>
          <span>/</span>
          <Link to={`/products?cat=${product.category}`} className="hover:text-brand-dark transition-colors">{product.category}</Link>
          <span>/</span>
          <span className="text-brand-dark">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20">
          {/* Image gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[4/5] bg-brand-border/30 overflow-hidden">
              <img
                src={product.images[activeImg]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImg((i) => (i - 1 + product.images.length) % product.images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 p-2 hover:bg-white transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setActiveImg((i) => (i + 1) % product.images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 p-2 hover:bg-white transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>
            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImg(idx)}
                    className={`w-16 h-20 overflow-hidden border-2 transition-colors ${
                      activeImg === idx ? 'border-brand-dark' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="flex flex-col">
            <p className="section-label mb-2">{product.category}</p>
            <h1 className="font-serif text-4xl font-light text-brand-dark mb-2">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={i < Math.floor(product.rating) ? 'fill-brand-dark text-brand-dark' : 'text-brand-border'}
                  />
                ))}
              </div>
              <span className="text-xs text-brand-muted">{product.rating} ({product.reviewCount} reviews)</span>
              <Link to={`/products/${slug}/review`} className="text-xs text-brand-dark underline underline-offset-2 ml-2">
                Write a Review
              </Link>
            </div>

            <p className="text-2xl font-light text-brand-dark mb-6">${displayPrice?.toLocaleString?.() ?? displayPrice}</p>

            {/* Variant selector */}
            <div className="mb-4">
              <p className={`text-xs tracking-widest uppercase font-medium mb-2 ${
                variantError ? 'text-red-500' : 'text-brand-muted'
              }`}>
                {variantError ? 'Please select a variant' : 'Select Variant'}
              </p>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((o) => !o)}
                  className={`w-full flex items-center justify-between px-4 py-3 border text-sm transition-colors ${
                    variantError ? 'border-red-400' : dropdownOpen ? 'border-brand-dark' : 'border-brand-border hover:border-brand-dark'
                  }`}
                >
                  <span className={activeVariant ? 'text-brand-dark' : 'text-brand-muted'}>
                    {activeVariant ? activeVariant.name : 'Choose a variant…'}
                  </span>
                  <ChevronDown size={14} className={`text-brand-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {dropdownOpen && (
                  <div className="absolute z-20 top-full left-0 right-0 border border-t-0 border-brand-dark bg-white shadow-sm max-h-60 overflow-y-auto">
                    {variants.filter((v) => v.isActive).map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => { setSelectedVariantId(v.id); setVariantError(false); setDropdownOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors hover:bg-brand-border/20 ${
                          activeVariant?.id === v.id ? 'bg-brand-dark text-white' : 'text-brand-dark'
                        }`}
                      >
                        <span>{v.name}</span>
                        {v.effectivePrice !== product?.price && (
                          <span className={`text-xs ${activeVariant?.id === v.id ? 'text-white/70' : 'text-brand-muted'}`}>
                            ${v.effectivePrice}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {activeVariant?.attributes?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {activeVariant.attributes.map((a) => (
                    <span key={a.id} className="text-xs border border-brand-border px-2 py-1 text-brand-muted">
                      {a.typeName}: <span className="text-brand-dark font-medium">{a.value}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* CTA row */}
            <div className="flex gap-3 mb-6">
              <Button variant="primary" onClick={handleAddToBag} className="flex-1">
                Add to Bag
              </Button>
              <button
                onClick={() => toggle(product)}
                className={`border border-brand-border p-4 hover:border-brand-dark transition-colors ${wishlisted ? 'bg-brand-dark' : ''}`}
                aria-label="Save to wishlist"
              >
                <Heart size={18} className={wishlisted ? 'fill-white text-white' : 'text-brand-dark'} />
              </button>
            </div>

            {/* Shipping info */}
            <div className="space-y-3 border-t border-brand-border pt-5 mb-6">
              <div className="flex items-center gap-3 text-sm text-brand-muted">
                <Truck size={16} className="text-brand-dark flex-shrink-0" />
                <span>White Glove Delivery — Ships in 4–6 weeks</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-brand-muted">
                <Shield size={16} className="text-brand-dark flex-shrink-0" />
                <span>10-Year Warranty — Built for longevity</span>
              </div>
            </div>

            {/* Description */}
            <div className="border-t border-brand-border pt-5">
              <h3 className="text-xs tracking-widest uppercase font-medium text-brand-dark mb-3">
                Uncompromising Materiality
              </h3>
              <p className="text-sm text-brand-muted leading-relaxed mb-4">{product.description}</p>
              <ul className="space-y-1.5 text-sm text-brand-muted">
                <li><span className="font-medium text-brand-dark">Material:</span> {product.material}</li>
                <li><span className="font-medium text-brand-dark">Origin:</span> {product.origin}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-20 border-t border-brand-border pt-16">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="section-label mb-1">You May Also Like</p>
                <h2 className="font-serif text-3xl font-light text-brand-dark">Complete the Space.</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
