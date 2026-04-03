import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { collections, editorialArticles } from '../data/mockData';
import ProductCard from '../components/ui/ProductCard';
import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { catalogService } from '../services/catalogService';
import { normalizeProduct } from '../utils/normalizers';

const heroImg = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCsfmZxq_H9UT2nN21kDpOSHSeU7vdoAjDiLqEEIT0nQtFMeodannKLVLHBXc9aHFJcyFMUvSkxcdyX_h6Cqw0M4oIEdMysjy6Xz6wJJLxCO83g8J8URGzgoraJ_y9dwlV9uwoJJs1U4cAR4BdBrK4AXIp7-Cg0hIZwXjofjeTW7y8SEwpf_I_Ys0eI9hbZxLkFsLCr_9dKmoT_mj5uYBbrxcJYWa3WqwPZ-7MG_AduJ-KsVE0CmHFQbTD-QLFP7Avt60vUWIdCXw';
const basicsImg = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAx6m9YvCLv-qbTXliF8Gf4tIhVRhmcpdnp_SCAH4rJtFsdxblakfby9OPEb4wczrILYJO3OvQerpoPQWT8taEmIr3kCh0zaueiyY6B8RbN303P00GvNyo02Onhsp3VZV15wW7Gcf4zQXSnfAh9bOmKnL0ALWrfvds3DKYQxaf5OYEepTWMkXPGlpoMbz3bLqraKnQ';
const tailoringImg = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCN2yA_BeY2sVMRMA67T0I9JHUaCiQY8Xxu55Gvun5YsjA960jOVWufeyGuDdwQacGdRIJcEvYBYkZyF7j81Wg1QxmWBLFRbHSz8dJQZg0tAh3IfDQDNl-SwxYarj1zbKh-43CUmAmJlj2crgd1M3rzXh0vV8H1G87jjUC0eeWXZUCc0MDZ6wMvBOBnO7L5P7pSthje9XSdY3FCHqLAFbf-0_9fzQlte6P1VTQMTJ96cvvZFaHwUuAoxhEvTbc';
const footwearImg = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBeKOempurRbJUDSiOtu4XqgX8EcJNiN5JDrLnSiV2OM5A-k4n0-btLlJqSyTqTl0-RMwjB_soNsEb124cBUBUo5ufKkX7hs4i2vyxIzLfW_cZlRxjlA3X65GpbWdACeCpFaREW6POJuKA7Y4bw4_57HX9M8CVmPEw4SeRjlbSP5ZX0in4yyb_fJLBJSls7gwYIhsVVXqZJ5Ktkt3iTwFKsJZ7v_t5CKSwIfzPbIBIn-barp4uCMH4r_lfxfFgjee276SP6vALjeg';
const accessoriesImg = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxGc18X7YzBV6nKWWQ1v9AtsgsjIktPuwdCxFZwfj1RxP2XZBWhmZgUN4rkOcucBwWNuU6p-vV__fkP60isz3tL-x6m4rSBHDRQjfJykCSisnem-m5xP8H88K5qk1WpuzOsaqyNoHJbDfnDA7AZQ5k4Zvu1xAJTHBqUD9IEgJpcpWtSHFWKeGL0GA2NZB1NAC4wKl2ZZ4tdM66E2YtJiwIZ9q1B_Mg8zCGHTO0Lgx17n2dVcandadHOk42U9t2zJTBFg9xgv';

export default function HomePage() {
  const [email, setEmail] = useState('');

  const { data: newArrivalsData } = useApi(
    () => catalogService.getNewArrivals().then((d) => (d.results || d).slice(0, 4).map(normalizeProduct)),
    []
  );
  const newArrivals = newArrivalsData || [];

  const { data: seasonalData } = useApi(
    () => catalogService.getProducts({ isFeatured: true }).then((d) => (d.results || d).slice(0, 3).map(normalizeProduct)),
    []
  );
  const seasonal = seasonalData || [];

  const handleNewsletter = async (e) => {
    e.preventDefault();
    try {
      await import('../services/api').then(({ default: api }) =>
        api.post('/marketing/newsletter/', { email })
      );
    } catch { /* silent */ }
    setEmail('');
  };

  return (
    <main className="pt-[96px]">
      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <img
          src={heroImg}
          alt="The New Minimalism"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-darker/60 via-brand-darker/20 to-transparent" />
        <div className="relative max-w-8xl mx-auto px-6 lg:px-12 w-full">
          <div className="max-w-lg">
            <p className="section-label text-white/70 mb-4">A/W 2024 Collection</p>
            <h1 className="font-serif text-6xl lg:text-8xl font-light text-white leading-none mb-6">
              The New<br />Minimalism.
            </h1>
            <p className="text-white/80 text-sm leading-relaxed mb-10 max-w-xs">
              Curated selections for the modern silhouette. Precision-cut garments designed for timeless utility.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/new-arrivals" className="btn-primary bg-white text-brand-dark hover:bg-gray-100">
                Shop New Arrivals
              </Link>
              <Link to="/lookbook" className="btn-ghost text-white hover:text-white/70 flex items-center gap-2">
                View Lookbook <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
        {/* Featured item */}
        <div className="absolute right-12 bottom-12 hidden xl:block text-white text-right">
          <p className="section-label text-white/50 mb-1">Featured Item</p>
          <p className="font-serif text-lg font-light">Sculpted Wool Overcoat</p>
          <p className="text-sm text-white/70">$495.00</p>
        </div>
      </section>

      {/* ── Modern Essentials ─────────────────────────── */}
      <section className="max-w-8xl mx-auto px-6 lg:px-12 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="section-label mb-2">Shop by Category</p>
            <h2 className="font-serif text-4xl font-light text-brand-dark">Modern Essentials.</h2>
            <p className="text-sm text-brand-muted mt-2">Core pieces that define the contemporary wardrobe.</p>
          </div>
          <Link to="/collections" className="btn-ghost hidden md:flex items-center gap-2">
            Explore Collections <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'The Base Layer', sub: 'Supima cotton essentials.', img: basicsImg, to: '/products?cat=Ready-to-Wear' },
            { label: 'Tailoring', sub: 'Sharp lines, soft feel.', img: tailoringImg, to: '/products?cat=Outerwear' },
            { label: 'Footwear', sub: 'Grounded in craft.', img: footwearImg, to: '/products?cat=Footwear' },
            { label: 'Accessories', sub: 'The defining details.', img: accessoriesImg, to: '/products?cat=Accessories' },
          ].map((cat) => (
            <Link key={cat.label} to={cat.to} className="group relative aspect-[3/4] overflow-hidden bg-brand-border/30 card-hover">
              <img src={cat.img} alt={cat.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-darker/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <p className="font-serif text-lg font-light">{cat.label}</p>
                <p className="text-xs text-white/70">{cat.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── New Arrivals ──────────────────────────────── */}
      <section className="bg-brand-cream py-20">
        <div className="max-w-8xl mx-auto px-6 lg:px-12">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="section-label mb-2">Just Landed</p>
              <h2 className="font-serif text-4xl font-light text-brand-dark">New Arrivals.</h2>
            </div>
            <Link to="/new-arrivals" className="btn-ghost hidden md:flex items-center gap-2">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Seasonal Highlights ───────────────────────── */}
      <section className="max-w-8xl mx-auto px-6 lg:px-12 py-20">
        <div className="mb-10">
          <p className="section-label mb-2">Seasonal Edit</p>
          <h2 className="font-serif text-4xl font-light text-brand-dark">Seasonal Highlights.</h2>
          <p className="text-sm text-brand-muted mt-2">A focused look at the textures and silhouettes defining this season's narrative.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {seasonal.map((product, i) => (
            <div key={product.id} className="group">
              <div className="relative aspect-square overflow-hidden bg-brand-border/30 mb-4">
                <img
                  src={product.image || tailoringImg}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3">
                  <span className="section-label bg-white/90 px-2 py-1">0{i + 1} / {product.category.toUpperCase()}</span>
                </div>
              </div>
              <p className="font-serif text-xl font-light text-brand-dark mb-1">{product.name}</p>
              <p className="text-sm text-brand-muted mb-1">${product.price.toLocaleString()}</p>
              <p className="text-xs text-brand-muted leading-relaxed mb-3">{product.description.slice(0, 100)}…</p>
              <Link to={`/products/${product.slug}`} className="btn-ghost flex items-center gap-2">
                Discover Details <ArrowRight size={13} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Editorial banner ─────────────────────────── */}
      <section className="relative py-32 overflow-hidden">
        <img
          src={tailoringImg}
          alt="Editorial"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-brand-darker/70" />
        <div className="relative max-w-8xl mx-auto px-6 lg:px-12 text-center text-white">
          <p className="section-label text-white/60 mb-4">Editorial Selection</p>
          <h2 className="font-serif text-5xl lg:text-7xl font-light mb-6 max-w-2xl mx-auto">
            Crafted for the Contemporary Individual.
          </h2>
          <Link to="/editorial" className="btn-secondary border-white text-white hover:bg-white hover:text-brand-dark">
            Read the Journal
          </Link>
        </div>
      </section>

      {/* ── Newsletter ────────────────────────────────── */}
      <section className="max-w-8xl mx-auto px-6 lg:px-12 py-20 text-center">
        <p className="section-label mb-3">Inner Circle</p>
        <h2 className="font-serif text-4xl font-light text-brand-dark mb-3">Join the Collective.</h2>
        <p className="text-sm text-brand-muted mb-8 max-w-md mx-auto">
          Receive early access to seasonal drops and exclusive editorial content directly in your inbox.
        </p>
        <form
          onSubmit={handleNewsletter}
          className="flex max-w-md mx-auto"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            required
            className="flex-1 border border-brand-border px-4 py-3 text-sm text-brand-dark placeholder:text-brand-muted focus:outline-none focus:border-brand-dark"
          />
          <button type="submit" className="btn-primary flex-shrink-0">
            Subscribe
          </button>
        </form>
      </section>
    </main>
  );
}
