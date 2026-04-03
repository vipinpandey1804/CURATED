import { createContext, useContext, useReducer, useState, useEffect, useCallback } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

// ─── Local (guest) cart reducer ───────────────────────────────────────────────

function localCartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const existing = state.find(
        (i) => i.variantId === action.variantId
      );
      if (existing) {
        return state.map((i) =>
          i.variantId === action.variantId ? { ...i, qty: i.qty + (action.qty || 1) } : i
        );
      }
      return [...state, { ...action.item, variantId: action.variantId, qty: action.qty || 1 }];
    }
    case 'REMOVE':
      return state.filter((i) => i.variantId !== action.variantId);
    case 'UPDATE_QTY':
      return state.map((i) =>
        i.variantId === action.variantId ? { ...i, qty: Math.max(1, action.qty) } : i
      );
    case 'CLEAR':
      return [];
    case 'SET':
      return action.items;
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();

  // Server cart state (authenticated)
  const [serverCart, setServerCart] = useState(null);
  const [serverLoading, setServerLoading] = useState(false);

  // Local guest cart
  const [localItems, dispatchLocal] = useReducer(localCartReducer, []);

  // ── Fetch server cart on login ────────────────────────────────────────────
  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) return;
    setServerLoading(true);
    try {
      const cart = await cartService.getCart();
      setServerCart(cart);
    } catch {
      setServerCart(null);
    } finally {
      setServerLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    } else {
      setServerCart(null);
    }
  }, [isAuthenticated, refreshCart]);

  // ── Unified helpers ───────────────────────────────────────────────────────

  /**
   * Add item to cart.
   * Authenticated: calls API, passing variant UUID.
   * Guest: stores locally with item display data.
   */
  const add = async (product, variant, qty = 1) => {
    if (isAuthenticated) {
      try {
        await cartService.addItem(variant.id, qty);
        await refreshCart();
      } catch (err) {
        console.error('Failed to add to cart', err);
      }
    } else {
      dispatchLocal({
        type: 'ADD',
        variantId: variant.id || variant.sku || `${product.id}-${variant.name}`,
        qty,
        item: { product, variant },
      });
    }
  };

  const remove = async (variantId, itemId) => {
    if (isAuthenticated && itemId) {
      try {
        await cartService.removeItem(itemId);
        await refreshCart();
      } catch (err) {
        console.error('Failed to remove cart item', err);
      }
    } else {
      dispatchLocal({ type: 'REMOVE', variantId });
    }
  };

  const updateQty = async (variantId, qty, itemId) => {
    if (isAuthenticated && itemId) {
      try {
        await cartService.updateItem(itemId, qty);
        await refreshCart();
      } catch (err) {
        console.error('Failed to update cart item', err);
      }
    } else {
      dispatchLocal({ type: 'UPDATE_QTY', variantId, qty });
    }
  };

  const clear = async () => {
    if (isAuthenticated) {
      try {
        await cartService.clearCart();
        setServerCart(null);
      } catch (err) {
        console.error('Failed to clear cart', err);
      }
    } else {
      dispatchLocal({ type: 'CLEAR' });
    }
  };

  const applyCoupon = async (code) => {
    if (isAuthenticated) {
      const result = await cartService.applyCoupon(code);
      await refreshCart();
      return result;
    }
    return null;
  };

  const removeCoupon = async () => {
    if (isAuthenticated) {
      await cartService.removeCoupon();
      await refreshCart();
    }
  };

  // ── Derived values ────────────────────────────────────────────────────────

  const items = isAuthenticated
    ? (serverCart?.items ?? [])
    : localItems;

  const subtotal = isAuthenticated
    ? parseFloat(serverCart?.subtotal?.amount ?? serverCart?.subtotal ?? 0)
    : localItems.reduce((sum, i) => sum + (i.product?.price ?? 0) * i.qty, 0);

  const count = isAuthenticated
    ? (serverCart?.itemCount ?? items.reduce((s, i) => s + (i.quantity ?? i.qty ?? 0), 0))
    : localItems.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        subtotal,
        count,
        serverCart,
        loading: serverLoading,
        add,
        remove,
        updateQty,
        clear,
        refreshCart,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}

