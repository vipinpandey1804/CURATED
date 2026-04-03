import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { catalogService } from '../services/catalogService';

export default function CollectionsPage() {
  const { data, loading } = useApi(() => catalogService.getCategories(), []);
  const collections = data || [];

  return (
    <main className="pt-[96px] min-h-screen">
      {/* Hero */}
      <div className="max-w-8xl mx-auto px-6 lg:px-12 py-16 border-b border-brand-border">
        <p className="section-label mb-3">Our World</p>
        <h1 className="font-serif text-5xl lg:text-7xl font-light text-brand-dark max-w-2xl leading-tight">
          Collections.
        </h1>
        <p className="text-sm text-brand-muted mt-4 max-w-lg">
          Each collection is the result of a focused creative vision — exploring a specific material story, silhouette philosophy, or cultural reference.
        </p>
      </div>

      {/* Collections grid */}
      <div className="max-w-8xl mx-auto px-6 lg:px-12 py-12">
        {loading ? (
          <p className="text-sm text-brand-muted">Loading collections…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((col) => (
              <Link
                key={col.id}
                to={`/products?cat=${encodeURIComponent(col.slug)}`}
                className="group block card-hover"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-brand-border/30 mb-4">
                  {col.image ? (
                    <img
                      src={col.image}
                      alt={col.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-brand-border/30" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-darker/50 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <p className="font-serif text-xl font-light">{col.name}</p>
                    <p className="text-xs text-white/70">{col.productCount} pieces</p>
                  </div>
                </div>
                <p className="text-xs text-brand-muted leading-relaxed mb-2 line-clamp-2">{col.description}</p>
                <span className="btn-ghost flex items-center gap-1 text-xs">
                  Explore <ArrowRight size={12} />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}