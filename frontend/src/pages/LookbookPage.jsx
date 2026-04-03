import { Link } from 'react-router-dom';
import { lookbookItems } from '../data/mockData';

export default function LookbookPage() {
  return (
    <main className="pt-[96px] min-h-screen">
      {/* Header */}
      <div className="max-w-8xl mx-auto px-6 lg:px-12 py-12 border-b border-brand-border">
        <p className="section-label mb-3">Visual Stories</p>
        <h1 className="font-serif text-5xl lg:text-7xl font-light text-brand-dark">Lookbook.</h1>
        <p className="text-sm text-brand-muted mt-3 max-w-lg">
          A visual exploration of how our pieces live in the world.
        </p>
      </div>

      {/* Masonry grid */}
      <div className="max-w-8xl mx-auto px-6 lg:px-12 py-12">
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
          {lookbookItems.map((item) => (
            <div key={item.id} className="group relative break-inside-avoid overflow-hidden bg-brand-border/30">
              <img
                src={item.image}
                alt={item.title}
                className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-brand-dark/0 group-hover:bg-brand-dark/40 transition-colors duration-300 flex flex-col justify-end p-5">
                <div className="translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <p className="section-label text-white/70 mb-1">{item.category}</p>
                  <p className="font-serif text-white text-xl font-light leading-tight mb-1">{item.title}</p>
                  {item.productId && (
                    <Link
                      to={`/products/${item.productId}`}
                      className="text-xs text-white/80 hover:text-white underline underline-offset-2"
                    >
                      Shop the look →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA banner */}
        <div className="mt-16 py-16 text-center border-t border-brand-border">
          <p className="section-label mb-4">Ready to wear</p>
          <h2 className="font-serif text-4xl font-light text-brand-dark mb-6">
            Find Your Signature Piece.
          </h2>
          <Link to="/products" className="btn-primary">
            Shop All
          </Link>
        </div>
      </div>
    </main>
  );
}
