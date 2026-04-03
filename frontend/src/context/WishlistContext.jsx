import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { wishlistService } from '../services/miscServices';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) { setItems([]); return; }
    try {
      const data = await wishlistService.getWishlist();
      setItems(data);
    } catch {
      setItems([]);
    }
  }, [isAuthenticated]);

  useEffect(() => { refresh(); }, [refresh]);

  const toggle = async (product) => {
    if (isAuthenticated) {
      try {
        await wishlistService.toggle(product.id);
        await refresh();
      } catch (err) {
        console.error('Wishlist toggle failed', err);
      }
    } else {
      setItems((prev) =>
        prev.find((p) => p.id === product.id)
          ? prev.filter((p) => p.id !== product.id)
          : [...prev, product]
      );
    }
  };

  const isWishlisted = (id) => items.some((p) => (p.productId ?? p.id) === id);

  const remove = async (id) => {
    if (isAuthenticated) {
      const item = items.find((p) => (p.productId ?? p.product?.id ?? p.id) === id);
      if (item) await wishlistService.toggle(id);
      await refresh();
    } else {
      setItems((prev) => prev.filter((p) => p.id !== id));
    }
  };

  return (
    <WishlistContext.Provider value={{ items, toggle, isWishlisted, remove, refresh }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider');
  return ctx;
}

