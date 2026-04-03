import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Package, Truck, Mail } from 'lucide-react';

export default function OrderConfirmationPage() {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order') || searchParams.get('order_number') || '—';
  return (
    <main className="pt-[96px] min-h-screen bg-brand-bg">
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-dark/10 mb-6">
          <CheckCircle2 size={32} strokeWidth={1.5} className="text-brand-dark" />
        </div>

        <p className="section-label mb-3">Order Confirmed</p>
        <h1 className="font-serif text-4xl lg:text-5xl font-light text-brand-dark mb-3">Thank You.</h1>
        <p className="text-sm text-brand-muted mb-2">
          Your order has been placed successfully.
        </p>
        <p className="text-xs text-brand-muted mb-8">Order number: <span className="font-medium text-brand-dark">{orderNumber}</span></p>

        {/* What happens next */}
        <div className="border border-brand-border bg-white p-8 text-left mb-8">
          <h2 className="font-serif text-xl font-light text-brand-dark mb-6">What Happens Next</h2>
          <div className="space-y-5">
            {[
              { icon: Mail, step: '01', title: 'Order Confirmation', body: 'A confirmation email is on its way with your full order summary.' },
              { icon: Package, step: '02', title: 'Processing & Dispatch', body: 'Your order will be carefully packed and dispatched within 1–2 business days.' },
              { icon: Truck, step: '03', title: 'Delivery', body: 'Standard delivery takes 5–7 business days. You\'ll receive a tracking link once dispatched.' },
            ].map(({ icon: Icon, step, title, body }) => (
              <div key={step} className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 border border-brand-border flex items-center justify-center">
                  <Icon size={16} className="text-brand-dark" />
                </div>
                <div>
                  <p className="section-label text-[10px] mb-0.5">{step}</p>
                  <p className="text-sm font-medium text-brand-dark mb-0.5">{title}</p>
                  <p className="text-xs text-brand-muted">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/track" state={{ orderId: orderNumber }} className="btn-primary">Track Order</Link>
          <Link to="/orders" className="btn-secondary">View Order History</Link>
          <Link to="/" className="btn-ghost">Continue Shopping</Link>
        </div>

        <p className="text-xs text-brand-muted mt-8">
          Questions? <a href="mailto:help@curated.com" className="underline hover:text-brand-dark">Contact support</a>
        </p>
      </div>
    </main>
  );
}
