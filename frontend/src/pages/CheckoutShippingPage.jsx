import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
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
            <span className={active ? 'text-brand-dark font-medium section-label text-xs' : done ? 'text-brand-muted' : 'text-brand-border'}>
              {step}
            </span>
          </span>
        );
      })}
    </nav>
  );
}

export default function CheckoutShippingPage() {
  const { items, subtotal, serverCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [form, setForm] = useState({
    email: user?.email || '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    phone: '',
  });
  const [shipping, setShipping] = useState('standard');
  const [errors, setErrors] = useState({});

  // Load saved addresses
  useEffect(() => {
    if (user) {
      authService.getAddresses().then((data) => {
        setAddresses(data.results || data);
        const def = (data.results || data).find((a) => a.isDefault);
        if (def) {
          const nameParts = (def.fullName || '').split(' ');
          setSelectedAddressId(def.id);
          setForm((f) => ({
            ...f,
            email: user.email || f.email,
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            address: def.addressLine1 || def.line1 || '',
            city: def.city || '',
            state: def.state || '',
            zip: def.postalCode || '',
            country: def.country || 'United States',
            phone: def.phone || '',
          }));
        }
      }).catch(() => {});
    }
  }, [user]);

  const cartSubtotal = serverCart
    ? parseFloat(serverCart.subtotal?.amount || serverCart.subtotal || 0)
    : subtotal;
  const shippingCost = shipping === 'express' ? 25 : cartSubtotal > 300 ? 0 : 15;

  function validate() {
    const errs = {};
    ['firstName', 'lastName', 'address', 'city', 'state', 'zip'].forEach((f) => {
      if (!form[f].trim()) errs[f] = 'Required';
    });
    if (!form.email.includes('@')) errs.email = 'Valid email required';
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    // Store shipping info in sessionStorage for the payment step
    sessionStorage.setItem('checkoutShipping', JSON.stringify({ form, shipping, shippingCost }));
    navigate('/checkout/payment');
  }

  function field(name, label, opts = {}) {
    return (
      <div className={opts.full ? 'col-span-full' : ''}>
        <label className="block text-xs text-brand-muted mb-1">{label}</label>
        {opts.select ? (
          <select
            value={form[name]}
            onChange={(e) => setForm({ ...form, [name]: e.target.value })}
            className="input-box w-full"
          >
            <option>United States</option>
            <option>Canada</option>
            <option>Sweden</option>
            <option>Norway</option>
            <option>United Kingdom</option>
            <option>India</option>
          </select>
        ) : (
          <input
            type={opts.type || 'text'}
            value={form[name]}
            onChange={(e) => { setForm({ ...form, [name]: e.target.value }); if (errors[name]) setErrors({ ...errors, [name]: undefined }); }}
            className={`input-box w-full ${errors[name] ? 'border-red-400' : ''}`}
            placeholder={opts.placeholder || ''}
          />
        )}
        {errors[name] && <p className="text-xs text-red-500 mt-0.5">{errors[name]}</p>}
      </div>
    );
  }

  return (
    <main className="pt-[96px] min-h-screen">
      <div className="max-w-8xl mx-auto px-6 lg:px-12 py-10">
        <StepBar current={2} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12">
          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <h1 className="font-serif text-3xl font-light text-brand-dark mb-8">Shipping Details</h1>

            {/* Contact */}
            <section className="mb-8">
              <p className="section-label mb-4">Contact</p>
              <div className="grid grid-cols-1 gap-4">
                {field('email', 'Email Address', { type: 'email', full: true })}
                {field('phone', 'Phone (optional)', { type: 'tel', full: true })}
              </div>
            </section>

            {/* Address */}
            <section className="mb-8">
              <p className="section-label mb-4">Delivery Address</p>
              <div className="grid grid-cols-2 gap-4">
                {field('firstName', 'First Name')}
                {field('lastName', 'Last Name')}
                {field('address', 'Street Address', { full: true })}
                {field('city', 'City')}
                {field('state', 'State / Province')}
                {field('zip', 'Postal Code')}
                {field('country', 'Country', { select: true, full: true })}
              </div>
            </section>

            {/* Shipping method */}
            <section className="mb-10">
              <p className="section-label mb-4">Shipping Method</p>
              <div className="space-y-3">
                {[
                  { id: 'standard', label: 'Standard Shipping', detail: '5–7 business days', cost: subtotal > 300 ? 'Complimentary' : '$15' },
                  { id: 'express', label: 'Express Shipping', detail: '2–3 business days', cost: '$25' },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-center justify-between p-4 border cursor-pointer transition-colors ${shipping === opt.id ? 'border-brand-dark bg-brand-dark/5' : 'border-brand-border hover:border-brand-muted'}`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping"
                        value={opt.id}
                        checked={shipping === opt.id}
                        onChange={() => setShipping(opt.id)}
                        className="accent-brand-dark"
                      />
                      <div>
                        <p className="text-sm font-medium text-brand-dark">{opt.label}</p>
                        <p className="text-xs text-brand-muted">{opt.detail}</p>
                      </div>
                    </div>
                    <span className="text-sm text-brand-dark">{opt.cost}</span>
                  </label>
                ))}
              </div>
            </section>

            <button type="submit" className="btn-primary w-full">Continue to Payment</button>
          </form>

          {/* Order summary */}
          <div className="lg:sticky lg:top-[112px] h-fit border border-brand-border p-6 bg-white">
            <h2 className="font-serif text-xl font-light text-brand-dark mb-4">
              Order Summary ({serverCart ? serverCart.itemCount : items.length})
            </h2>
            <div className="space-y-3 mb-4">
              {(serverCart ? serverCart.items : items).map((item, idx) => {
                const name = serverCart ? (item.variant?.product?.name || item.productName || '') : item.name;
                const image = serverCart ? (item.variant?.product?.primaryImage || '') : item.image;
                const detail = serverCart
                  ? `${item.variant?.colorName || ''} · ×${item.quantity}`
                  : `${item.variant} · ${item.size} · ×${item.qty}`;
                const linePrice = serverCart
                  ? parseFloat(item.lineTotal?.amount || item.lineTotal || 0)
                  : item.price * item.qty;
                const key = serverCart ? item.id : `${item.id}-${item.variant}-${item.size}`;
                return (
                  <div key={key} className="flex gap-3 items-center">
                    <div className="w-14 h-18 flex-shrink-0 bg-brand-border/30 overflow-hidden">
                      <img src={image} alt={name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-brand-dark truncate">{name}</p>
                      <p className="text-xs text-brand-muted">{detail}</p>
                    </div>
                    <span className="text-xs text-brand-dark">${linePrice.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-brand-border pt-3 space-y-2">
              <div className="flex justify-between text-xs text-brand-muted">
                <span>Subtotal</span><span>${cartSubtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-brand-muted">
                <span>Shipping</span>
                <span>{shippingCost === 0 ? 'Complimentary' : `$${shippingCost}`}</span>
              </div>
              <div className="flex justify-between text-sm font-medium text-brand-dark pt-1">
                <span>Estimated Total</span><span>${(cartSubtotal + shippingCost).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
