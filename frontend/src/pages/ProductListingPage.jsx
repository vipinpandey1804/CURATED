import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { catalogService } from '../services/catalogService';
import { normalizeProduct } from '../utils/normalizers';
import ProductCard from '../components/ui/ProductCard';
const SIZES = ['XS', 'S', 'M', 'L', 'XL'];
const SORT_OPTIONS = [
  { label: 'Newest', value: 'new' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
];

function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-brand-border pb-4 mb-4">
      <button
        className="flex items-center justify-between w-full text-xs tracking-widest uppercase font-medium text-brand-dark mb-3"
        onClick={() => setOpen(!open)}
      >
        {title}
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && children}
    </div>
  );
}

export default function ProductListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCats, setSelectedCats] = useState(() => {
    const cat = searchParams.get('cat');
    return cat ? [cat] : [];
  });
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [maxPrice, setMaxPrice] = useState(2000);
  const [sort, setSort] = useState('new');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 12;

  // Sync category filter from URL params
  useEffect(() => {
    const cat = searchParams.get('cat');
    setSelectedCats(cat ? [cat] : []);
    setPage(1);
  }, [searchParams.get('cat')]);

  const { data: categoriesData } = useApi(() => catalogService.getCategories(), []);
  const categories = categoriesData || [];

  const q = searchParams.get('q') || '';

  const apiParams = {
    ...(q && { search: q }),
    ...(selectedCats.length > 0 && { 'category__slug__in': selectedCats.join(',') }),
    ...(selectedSizes.length > 0 && { size: selectedSizes.join(',') }),
    ...(maxPrice < 2000 && { max_price: maxPrice }),
    ordering:
      sort === 'price_asc' ? 'base_price' :
      sort === 'price_desc' ? '-base_price' :
      '-created_at',
    page,
    page_size: PER_PAGE,
  };

  const { data: apiData, loading } = useApi(
    () => catalogService.getProducts(apiParams).then((d) => ({
      results: (d.results || d).map(normalizeProduct),
      count: d.count || (d.results || d).length,
    })),
    [q, selectedCats.join(), maxPrice, sort, page, selectedSizes.join()],
  );

  const products = apiData?.results || [];
  const totalCount = apiData?.count || 0;
  const totalPages = Math.ceil(totalCount / PER_PAGE);

  const toggleCat = (cat) => {
    setPage(1);
    setSelectedCats((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
  };

  const toggleSize = (size) => {
    setPage(1);
    setSelectedSizes((prev) => prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]);
  };

  const FiltersContent = (
    <div>
      <FilterSection title="Category">
        <div className="space-y-2">
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedCats.includes(cat.slug)}
                onChange={() => toggleCat(cat.slug)}
                className="w-3.5 h-3.5 border-brand-border accent-brand-dark"
              />
              <span className="text-sm text-brand-dark group-hover:text-brand-muted transition-colors">{cat.name}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Price Range">
        <div className="px-1">
          <input
            type="range"
            min={0}
            max={2000}
            step={50}
            value={maxPrice}
            onChange={(e) => setMaxPrice(+e.target.value)}
            className="w-full accent-brand-dark"
          />
          <div className="flex justify-between text-xs text-brand-muted mt-1">
            <span>$0</span>
            <span className="font-medium text-brand-dark">${maxPrice.toLocaleString()}</span>
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Size">
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className={`text-xs px-3 py-1 border transition-colors ${
                selectedSizes.includes(size)
                  ? 'border-brand-dark bg-brand-dark text-white'
                  : 'border-brand-border text-brand-dark hover:border-brand-dark'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </FilterSection>

      {(selectedCats.length > 0 || selectedSizes.length > 0) && (
        <button
          onClick={() => { setSelectedCats([]); setSelectedSizes([]); }}
          className="text-xs text-brand-muted hover:text-brand-dark underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <main className="pt-[96px] min-h-screen">
      {/* Header */}
      <div className="max-w-8xl mx-auto px-6 lg:px-12 py-10 border-b border-brand-border">
        <p className="section-label mb-2">
          {selectedCats.length === 1 ? selectedCats[0] : 'All Products'}
          {q && ` — "${q}"`}
        </p>
        <h1 className="font-serif text-4xl font-light text-brand-dark">
          {selectedCats.length === 1 ? selectedCats[0] : 'Summer Collections'}
        </h1>
        <p className="text-sm text-brand-muted mt-2">
          Explore our meticulously selected range — artisanal craftsmanship meets contemporary editorial aesthetics.
        </p>
      </div>

      <div className="max-w-8xl mx-auto px-6 lg:px-12 py-8">
        <div className="flex gap-10">
          {/* Sidebar filters — desktop */}
          <aside className="hidden lg:block w-52 flex-shrink-0">
            {FiltersContent}
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <button
                className="lg:hidden flex items-center gap-2 text-xs tracking-widest uppercase text-brand-dark"
                onClick={() => setFiltersOpen(true)}
              >
                <SlidersHorizontal size={14} /> Filter
              </button>
              <p className="text-xs text-brand-muted hidden lg:block">
                {loading ? 'Loading…' : `Showing ${products.length} of ${totalCount} results`}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-brand-muted hidden sm:block">Sort by:</span>
                <select
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); setPage(1); }}
                  className="text-xs border border-brand-border px-2 py-1.5 text-brand-dark focus:outline-none focus:border-brand-dark bg-transparent"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="py-20 text-center">
                <p className="text-sm text-brand-muted">Loading products…</p>
              </div>
            ) : products.length === 0 ? (
              <div className="py-20 text-center">
                <p className="font-serif text-2xl font-light text-brand-dark mb-2">No results found.</p>
                <p className="text-sm text-brand-muted">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="text-xs text-brand-muted disabled:opacity-30 hover:text-brand-dark transition-colors px-2 py-1"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`text-xs w-8 h-8 border transition-colors ${
                      n === page
                        ? 'border-brand-dark bg-brand-dark text-white'
                        : 'border-brand-border text-brand-dark hover:border-brand-dark'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="text-xs text-brand-muted disabled:opacity-30 hover:text-brand-dark transition-colors px-2 py-1"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filters drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white px-6 py-8 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs tracking-widest uppercase font-medium">Filters</p>
              <button onClick={() => setFiltersOpen(false)}>
                <X size={18} className="text-brand-muted" />
              </button>
            </div>
            {FiltersContent}
          </div>
        </div>
      )}
    </main>
  );
}
