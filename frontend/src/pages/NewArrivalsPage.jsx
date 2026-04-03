import { useApi } from '../hooks/useApi';
import { catalogService } from '../services/catalogService';
import { normalizeProduct } from '../utils/normalizers';
import ProductCard from '../components/ui/ProductCard';

export default function NewArrivalsPage() {
  const { data, loading } = useApi(
    () => catalogService.getNewArrivals().then((d) => (d.results || d).map(normalizeProduct)),
    [],
  );

  const newProducts = data ?? [];

  return (
    <main className="pt-[96px] min-h-screen">
      {/* Header */}
      <div className="max-w-8xl mx-auto px-6 lg:px-12 py-12 border-b border-brand-border">
        <p className="section-label mb-3">Latest Additions</p>
        <h1 className="font-serif text-5xl lg:text-6xl font-light text-brand-dark">New Arrivals.</h1>
        <p className="text-sm text-brand-muted mt-3 max-w-lg">
          The latest additions to our curated selection. Updated weekly with considered pieces from our network of artisans and designers.
        </p>
      </div>

      {/* Products */}
      <div className="max-w-8xl mx-auto px-6 lg:px-12 py-12">
        <div className="flex items-center justify-between mb-8">
          <p className="text-xs text-brand-muted">{loading ? 'Loading…' : `${newProducts.length} new pieces`}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {newProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>

        {!loading && newProducts.length === 0 && (
          <div className="py-20 text-center">
            <p className="font-serif text-2xl font-light text-brand-dark mb-2">More arriving soon.</p>
            <p className="text-sm text-brand-muted">
              Subscribe to our newsletter to be first to know about new arrivals.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
