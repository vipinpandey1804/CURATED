import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { normalizeProduct } from '../utils/normalizers';

export default function WishlistPage() {
  const { items, remove } = useWishlist();
  const { add } = useCart();

  // Normalise: server items have a `product` field; local items are flat product objects
  const displayItems = items.map((item) => {
    const p = item.product ? normalizeProduct(item.product) : item;
    return { ...p, wishlistItemId: item.id || p.id };
  });

  function handleAddToCart(product) {
    const variant = product.variants?.[0] || { id: null };
    add(product, variant, product.sizes?.[0] || 'One Size');
  }

  if (displayItems.length === 0) {
    return (
      <main className="pt-[96px] min-h-screen flex flex-col items-center justify-center gap-6 px-6">
        <Heart size={40} strokeWidth={1} className="text-brand-border" />
        <h1 className="font-serif text-3xl font-light text-brand-dark">Your Wishlist is Empty</h1>
        <p className="text-sm text-brand-muted">Save pieces you love — discover them again later.</p>
        <Link to="/products" className="btn-primary mt-2">Browse Collection</Link>
      </main>
    );
  }

  return (
    <main className="pt-[96px] min-h-screen">
      {/* Header */}
      <div className="max-w-8xl mx-auto px-6 lg:px-12 py-12 border-b border-brand-border">
        <p className="section-label mb-2">Saved Items</p>
        <h1 className="font-serif text-5xl font-light text-brand-dark">
          My Wishlist <span className="text-brand-muted text-2xl">({displayItems.length})</span>
        </h1>
      </div>

      <div className="max-w-8xl mx-auto px-6 lg:px-12 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {displayItems.map((product) => (
            <div key={product.id} className="group relative">
              {/* Remove button */}
              <button
                onClick={() => remove(product.id)}
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                aria-label="Remove from wishlist"
              >
                <Trash2 size={14} className="text-red-500" />
              </button>

              <Link to={`/products/${product.slug || product.id}`} className="block">
                <div className="relative aspect-[3/4] overflow-hidden bg-brand-border/30 mb-3">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Add to bag overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <button
                      onClick={(e) => { e.preventDefault(); handleAddToCart(product); }}
                      className="w-full btn-primary flex items-center justify-center gap-2 py-2 text-xs"
                    >
                      <ShoppingBag size={13} />
                      Add to Bag
                    </button>
                  </div>
                </div>
              </Link>

              <p className="section-label mb-1">{product.category}</p>
              <Link to={`/products/${product.slug || product.id}`} className="text-sm font-medium text-brand-dark hover:opacity-70 transition-opacity">
                {product.name}
              </Link>
              <p className="text-sm text-brand-muted mt-0.5">${product.price?.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
