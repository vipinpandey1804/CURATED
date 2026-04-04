import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Lock, ExternalLink } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { authService } from '../services/authService';
import { orderService } from '../services/orderService';

const STEPS = ['Cart', 'Shipping', 'Payment', 'Confirmation'];

function StepBar({ current }) {
  return (
    <nav className="flex items-center gap-2 text-xs mb-10">
      {STEPS.map((step, i) => {
        const idx = i + 1;
        const active = idx === current;
        const done = idx < current;
        return (
          <span key={step} className="flex items-center gap-2">
            {i > 0 && <ChevronRight size={12} className="text-brand-border" />}
            <span className={active ? 'text-brand-dark font-medium' : done ? 'text-brand-muted' : 'text-brand-border'}>
              {step}
            </span>
          </span>
        );
      })}
    </nav>
  );
}

export default function CheckoutPaymentPage() {
  const { items, subtotal, serverCart, clear } = useCart();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const shipping = (() => {
    try { return JSON.parse(sessionStorage.getItem('checkoutShipping') || '{}'); } catch { return {}; }
  })();
  const shippingCost = shipping.shippingCost ?? (subtotal > 300 ? 0 : 15);
  const cartSubtotal = serverCart
    ? parseFloat(serverCart.subtotal?.amount || serverCart.subtotal || 0)
    : subtotal;
  const discount = serverCart
    ? parseFloat(serverCart.discountAmount?.amount || serverCart.discountAmount || 0)
    : 0;
  const total = cartSubtotal - discount + shippingCost;

  async function handleCheckout() {
    setProcessing(true);
    setError('');
    try {
      // 1. Ensure address is created in backend
      const shippingData = shipping.form || {};
      // Map country display names to ISO 3166-1 alpha-2
      const COUNTRY_MAP = {
        'United States': 'US', 'Canada': 'CA', 'Sweden': 'SE',
        'Norway': 'NO', 'United Kingdom': 'GB', 'India': 'IN',
      };
      const addrPayload = {
        fullName: `${shippingData.firstName || ''} ${shippingData.lastName || ''}`.trim(),
        addressLine1: shippingData.address,
        city: shippingData.city,
        state: shippingData.state,
        postalCode: shippingData.zip,
        country: COUNTRY_MAP[shippingData.country] || shippingData.country || 'US',
        phone: shippingData.phone || '',
      };
      const newAddr = await authService.createAddress(addrPayload);

      // 2. Create the order
      const orderPayload = {
        shippingAddressId: newAddr.id,
        billingAddressId: newAddr.id,
        shippingMethod: shipping.shipping || 'standard',
      };
      const order = await orderService.createOrder(orderPayload);
      // 3. Get Stripe Checkout URL
      const session = await orderService.createCheckoutSession(order.order_number || order.orderNumber || order.id);
      const checkoutUrl = session.checkout_url || session.checkoutUrl || session.url;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        // Fallback: navigate to confirmation if no Stripe URL (dev mode)
        clear();
        navigate(`/order/confirmation?order=${order.orderNumber || order.id}`);
      }
    } catch (err) {
      setError(err?.response?.data?.detail || 'Unable to process checkout. Please try again.');
      setProcessing(false);
    }
  }

  const displayItems = serverCart
    ? serverCart.items.map((item) => ({
        key: item.id,
        name: item.productName || '',
        image: item.primaryImage || '',
        detail: `${item.variantName || ''} · ×${item.quantity}`,
        linePrice: parseFloat(item.lineTotal?.amount || item.lineTotal || 0),
      }))
    : items.map((item) => ({
        key: `${item.id}-${item.variant}-${item.size}`,
        name: item.name,
        image: item.image,
        detail: `${item.variant} · ${item.size} · ×${item.qty}`,
        linePrice: item.price * item.qty,
      }));

  return (
    <main className="pt-[96px] min-h-screen">
      <div className="max-w-8xl mx-auto px-6 lg:px-12 py-10">
        <StepBar current={3} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12">
          {/* Payment CTA */}
          <div>
            <h1 className="font-serif text-3xl font-light text-brand-dark mb-2">Payment</h1>
            <p className="text-xs text-brand-muted mb-8 flex items-center gap-1">
              <Lock size={11} /> Payments are encrypted and processed securely by Stripe
            </p>

            <div className="border border-brand-border p-8 mb-6 text-center">
              <p className="text-sm text-brand-muted mb-2">You will be redirected to Stripe's secure checkout page.</p>
              <p className="text-xs text-brand-muted mb-6">Supports credit card, debit card, and other local payment methods.</p>
              <div className="flex items-center justify-center gap-3 mb-6">
                {['Visa', 'Mastercard', 'Amex', 'Link'].map((b) => (
                  <span key={b} className="px-3 py-1.5 border border-brand-border text-xs text-brand-muted rounded">{b}</span>
                ))}
              </div>
              {error && <p className="text-xs text-red-500 mb-4">{error}</p>}
              <button
                onClick={handleCheckout}
                disabled={processing}
                className="btn-primary flex items-center justify-center gap-2 mx-auto px-10"
              >
                <ExternalLink size={15} />
                {processing ? 'Redirecting to Stripe…' : `Pay $${total.toLocaleString()} — Secure Checkout`}
              </button>
            </div>

            <p className="text-xs text-brand-muted text-center">
              By placing your order you agree to our{' '}
              <a href="#" className="underline hover:text-brand-dark">Terms of Service</a> and{' '}
              <a href="#" className="underline hover:text-brand-dark">Privacy Policy</a>.
            </p>
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-[112px] h-fit border border-brand-border p-6 bg-white">
            <h2 className="font-serif text-xl font-light text-brand-dark mb-4">
              Order Summary ({displayItems.length})
            </h2>
            <div className="space-y-3 mb-4">
              {displayItems.map((item) => (
                <div key={item.key} className="flex gap-3 items-center">
                  <div className="w-14 h-18 flex-shrink-0 bg-brand-border/30 overflow-hidden">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-brand-dark truncate">{item.name}</p>
                    <p className="text-xs text-brand-muted">{item.detail}</p>
                  </div>
                  <span className="text-xs text-brand-dark">${item.linePrice.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-brand-border pt-3 space-y-2">
              <div className="flex justify-between text-xs text-brand-muted">
                <span>Subtotal</span><span>${cartSubtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-xs text-green-600">
                  <span>Discount</span><span>−${discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-brand-muted">
                <span>Shipping</span>
                <span>{shippingCost === 0 ? 'Complimentary' : `$${shippingCost}`}</span>
              </div>
              <div className="flex justify-between text-sm font-medium text-brand-dark pt-1">
                <span>Total</span><span>${total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
