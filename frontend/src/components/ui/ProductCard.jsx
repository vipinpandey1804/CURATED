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
    add(product, product.variants[0], product.sizes[0]);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    toggle(product);
  };

  return (
    <Link to={`/products/${product.slug || product.id}`} className="group block card-hover">
      <div className="relative overflow-hidden bg-brand-border/30 aspect-[3/4]">
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
        {/* Action buttons on hover */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex">
          <button
            onClick={handleAddToCart}
            className="flex-1 bg-brand-dark text-white text-xs tracking-widest uppercase py-3 flex items-center justify-center gap-2 hover:bg-brand-darker transition-colors"
          >
            <ShoppingBag size={14} />
            Add to Cart
          </button>
        </div>
        <button
          onClick={handleWishlist}
          className="absolute top-3 right-3 bg-white rounded-full p-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            size={14}
            className={wishlisted ? 'fill-brand-dark text-brand-dark' : 'text-brand-dark'}
          />
        </button>
      </div>
      <div className="pt-3 pb-1">
        <p className="section-label mb-1">{product.category}</p>
        <h3 className="text-sm font-medium text-brand-dark leading-snug">{product.name}</h3>
        <p className="text-sm text-brand-muted mt-1">${product.price.toLocaleString()}</p>
      </div>
    </Link>
  );
}
