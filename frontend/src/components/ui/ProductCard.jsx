import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export default function ProductCard({ product }) {
  const { add } = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const variant = product.variants?.[0];
    if (!variant?.id) return;
    add(product, variant, 1);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product);
  };

  return (
    <div className="group relative" data-testid="product-card">
      {/* Image */}
      <div className="relative overflow-hidden bg-brand-border/30 aspect-[3/4]">
        <Link to={`/products/${product.slug || product.id}`} className="block w-full h-full">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {product.isNew && (
            <span className="absolute top-3 left-3 bg-brand-darker text-white text-[10px] tracking-widest uppercase px-2 py-1 font-medium">
              New
            </span>
          )}
        </Link>

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className="absolute top-3 right-3 z-10 bg-white rounded-full p-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            size={14}
            className={wishlisted ? 'fill-brand-dark text-brand-dark' : 'text-brand-dark'}
          />
        </button>

        {/* Add to Cart — same as wishlist page */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            data-testid="add-to-cart"
            onClick={handleAddToCart}
            className="w-full btn-primary flex items-center justify-center gap-2 py-2 text-xs"
          >
            <ShoppingBag size={13} />
            Add to Cart
          </button>
        </div>
      </div>

      {/* Text */}
      <Link to={`/products/${product.slug || product.id}`} className="block pt-3 pb-2">
        <p className="section-label mb-1">{product.category}</p>
        <h3 className="text-sm font-medium text-brand-dark leading-snug">{product.name}</h3>
        <p className="text-sm text-brand-muted mt-1">${product.price.toLocaleString()}</p>
      </Link>
    </div>
  );
}
