import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { editorialArticles } from '../data/mockData';
import { useApi } from '../hooks/useApi';
import { catalogService } from '../services/catalogService';
import { normalizeProduct } from '../utils/normalizers';

export default function EditorialPage() {
  const [featured, ...rest] = editorialArticles;
  const { data } = useApi(
    () => catalogService.getFeatured().then((d) => (d.results || d).slice(0, 4).map(normalizeProduct)),
    [],
  );
  const editorialProducts = data || [];

  return (
    <main className="pt-[96px] min-h-screen">
      {/* Header */}
      <div className="max-w-8xl mx-auto px-6 lg:px-12 py-12 border-b border-brand-border">
        <p className="section-label mb-3">The Journal</p>
        <h1 className="font-serif text-5xl lg:text-7xl font-light text-brand-dark">Editorial.</h1>
        <p className="text-sm text-brand-muted mt-3 max-w-lg">
          Long-form explorations of craft, material culture, and the considered life.
        </p>
      </div>

      {/* Featured article */}
      <div className="max-w-8xl mx-auto px-6 lg:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 pb-16 border-b border-brand-border">
          <div className="relative aspect-[4/3] overflow-hidden bg-brand-border/30">
            <img
              src={featured.image}
              alt={featured.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center">
            <p className="section-label mb-3">{featured.category}</p>
            <h2 className="font-serif text-4xl lg:text-5xl font-light text-brand-dark mb-4 leading-tight">
              {featured.title}
            </h2>
            <p className="text-sm text-brand-muted leading-relaxed mb-4">{featured.subtitle}</p>
            <p className="text-sm text-brand-muted leading-relaxed mb-6">{featured.excerpt}</p>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-xs text-brand-muted">{featured.date}</span>
              <span className="text-brand-border">·</span>
              <span className="text-xs text-brand-muted">{featured.readTime}</span>
            </div>
            <Link to="#" className="btn-ghost flex items-center gap-2">
              Read Article <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Other articles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {rest.map((article) => (
            <article key={article.id} className="group">
              <div className="relative aspect-[4/3] overflow-hidden bg-brand-border/30 mb-4">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <p className="section-label mb-2">{article.category}</p>
              <h3 className="font-serif text-2xl font-light text-brand-dark mb-2 leading-tight">{article.title}</h3>
              <p className="text-sm text-brand-muted leading-relaxed mb-3 line-clamp-2">{article.excerpt}</p>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs text-brand-muted">{article.date}</span>
                <span className="text-brand-border">·</span>
                <span className="text-xs text-brand-muted">{article.readTime}</span>
              </div>
              <Link to="#" className="btn-ghost flex items-center gap-2 text-xs">
                Read <ArrowRight size={12} />
              </Link>
            </article>
          ))}
        </div>

        {/* Selected Products */}
        <div className="border-t border-brand-border pt-16">
          <p className="section-label mb-3">Featured Pieces</p>
          <h2 className="font-serif text-3xl font-light text-brand-dark mb-8">Editorial Selection.</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {editorialProducts.map((p) => (
              <Link key={p.id} to={`/products/${p.slug}`} className="group block card-hover">
                <div className="aspect-[3/4] overflow-hidden bg-brand-border/30 mb-3">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <p className="section-label mb-1">{p.category}</p>
                <p className="text-sm font-medium text-brand-dark">{p.name}</p>
                <p className="text-sm text-brand-muted">${p.price.toLocaleString()}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
