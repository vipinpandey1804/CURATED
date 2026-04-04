import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, X, ShoppingBag, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ShoppingCartPage() {
  const { items, subtotal, count, serverCart, remove, updateQty, applyCoupon, removeCoupon, loading } = useCart();
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');

  // Normalise items to a common display shape (local reducer OR server cart)
  const displayItems = serverCart
    ? serverCart.items.map((item) => ({
        key: item.id,
        itemId: item.id,
        slug: item.variant?.product?.slug || '',
        image: item.primaryImage || '',
        category: item.variant?.product?.category?.name || '',
        name: item.productName || '',
        variant: item.variantName || '',
        qty: item.quantity,
        price: parseFloat(item.unitPrice?.amount || item.unitPrice || 0),
        variantId: item.variant,
      }))
    : items.map((item) => ({
        key: `${item.id}-${item.variant}-${item.size}`,
        itemId: null,
        slug: item.slug || item.id,
        image: item.image,
        category: item.category,
        name: item.name,
        variant: item.variant,
        size: item.size,
        qty: item.qty,
        price: item.price,
        variantId: item.variantId || null,
      }));

  const serverSubtotal = serverCart
    ? parseFloat(serverCart.subtotal?.amount || serverCart.subtotal || 0)
    : subtotal;
  const coupon = serverCart?.coupon || null;
  const discount = serverCart
    ? parseFloat(serverCart.discountAmount?.amount || serverCart.discountAmount || 0)
    : 0;
  const shipping = serverSubtotal > 300 ? 0 : 15;
  const total = serverSubtotal - discount + shipping;

  async function applyPromo() {
    setPromoError('');
    try {
      await applyCoupon(promoCode.trim());
    } catch (err) {
      setPromoError(err?.response?.data?.detail || 'Invalid code');
    }
  }

  if (loading) {
    return (
      <main className="pt-[96px] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-brand-muted">
          <div className="w-8 h-8 border-2 border-brand-border border-t-brand-dark rounded-full animate-spin" />
          <p className="text-sm tracking-widest uppercase">Loading your bag…</p>
        </div>
      </main>
    );
  }

  if (!loading && displayItems.length === 0) {
    return (
      <main className="pt-[96px] min-h-screen flex flex-col items-center justify-center gap-6 px-6">
        <ShoppingBag size={40} strokeWidth={1} className="text-brand-border" />
        <h1 className="font-serif text-3xl font-light text-brand-dark">Your Bag is Empty</h1>
        <p className="text-sm text-brand-muted">Add pieces to your bag to continue.</p>
        <Link to="/products" className="btn-primary mt-2">Browse Collection</Link>
      </main>
    );
  }

  return (
    <main className="pt-[96px] min-h-screen">
      {/* Header */}
      <div className="max-w-8xl mx-auto px-6 lg:px-12 py-10 border-b border-brand-border">
        <p className="section-label mb-2">Review</p>
        <h1 className="font-serif text-5xl font-light text-brand-dark">
          Your Bag <span className="text-brand-muted text-2xl">({displayItems.length})</span>
        </h1>
      </div>

      <div className="max-w-8xl mx-auto px-6 lg:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12">
          {/* Items list */}
          <div className="space-y-6">
            {displayItems.map((item) => (
              <div key={item.key} className="flex gap-5 py-6 border-b border-brand-border">
                <Link to={`/products/${item.slug}`} className="flex-shrink-0">
                  <div className="w-28 h-36 bg-brand-border/30 overflow-hidden">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="section-label mb-0.5">{item.category}</p>
                      <Link to={`/products/${item.slug}`} className="font-medium text-brand-dark text-sm hover:opacity-70">
                        {item.name}
                      </Link>
                      <p className="text-xs text-brand-muted mt-1">{item.variant}{item.size ? ` · Size ${item.size}` : ''}</p>
                    </div>
                    <button
                      onClick={() => remove(item.variantId, item.itemId)}
                      className="text-brand-muted hover:text-brand-dark transition-colors p-1"
                      aria-label="Remove item"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    {/* Qty stepper */}
                    <div className="flex items-center border border-brand-border">
                      <button
                        onClick={() => updateQty(item.variantId, item.qty - 1, item.itemId)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-brand-border/40 transition-colors"
                        disabled={item.qty <= 1}
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-sm">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.variantId, item.qty + 1, item.itemId)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-brand-border/40 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <p className="font-medium text-brand-dark text-sm">
                      ${(item.price * item.qty).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="lg:sticky lg:top-[112px] h-fit border border-brand-border p-6 bg-white">
            <h2 className="font-serif text-2xl font-light text-brand-dark mb-6">Order Summary</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-brand-muted">Subtotal</span>
                <span className="text-brand-dark">${serverSubtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Discount ({coupon?.code})</span>
                  <span className="text-green-600">−${discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-brand-muted">Shipping</span>
                <span className="text-brand-dark">{shipping === 0 ? 'Complimentary' : `$${shipping}`}</span>
              </div>
              {shipping === 0 && (
                <p className="text-xs text-green-600">Complimentary shipping on orders over $300</p>
              )}
              <div className="border-t border-brand-border pt-3 flex justify-between font-medium">
                <span className="text-brand-dark">Total</span>
                <span className="text-brand-dark">${total.toLocaleString()}</span>
              </div>
            </div>

            {/* Promo code */}
            {!coupon ? (
              <div className="flex flex-col gap-2 mb-5">
                <div className="flex gap-2">
                  <div className="flex-1 border border-brand-border flex items-center px-3 gap-2">
                    <Tag size={14} className="text-brand-muted flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Promo code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-1 py-2.5 text-sm outline-none bg-transparent placeholder:text-brand-border text-brand-dark"
                      onKeyDown={(e) => e.key === 'Enter' && applyPromo()}
                    />
                  </div>
                  <button onClick={applyPromo} className="btn-secondary text-xs px-4 py-2">Apply</button>
                </div>
                {promoError && <p className="text-xs text-red-500">{promoError}</p>}
              </div>
            ) : (
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <Tag size={12} /> Code "{coupon.code}" applied
                </p>
                <button onClick={removeCoupon} className="text-xs text-brand-muted underline">Remove</button>
              </div>
            )}

            <button
              onClick={() => navigate('/checkout/shipping')}
              className="btn-primary w-full text-center mb-3"
            >
              Proceed to Checkout
            </button>
            <Link to="/products" className="btn-ghost w-full text-center text-xs">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
