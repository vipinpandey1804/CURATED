import { Link } from 'react-router-dom';
import { FileText, Truck } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { orderService } from '../services/orderService';

const STATUS_STYLES = {
  delivered: 'bg-green-50 text-green-700 border border-green-200',
  processing: 'bg-amber-50 text-amber-700 border border-amber-200',
  confirmed: 'bg-amber-50 text-amber-700 border border-amber-200',
  shipped: 'bg-blue-50 text-blue-700 border border-blue-200',
  cancelled: 'bg-red-50 text-red-700 border border-red-200',
};

function AccountNav({ active }) {
  return (
    <nav className="w-44 flex-shrink-0 pt-1">
      <ul className="flex flex-col gap-0.5">
        {[
          { label: 'Profile', href: '/account/profile' },
          { label: 'Addresses', href: '/account/addresses' },
          { label: 'Orders', href: '/orders' },
          { label: 'Settings', href: '/account/settings' },
        ].map((n) => (
          <li key={n.label}>
            <Link to={n.href} className={`block py-2 pl-3 border-l-2 text-xs transition-colors ${
              n.label === active
                ? 'border-brand-dark text-brand-dark font-semibold'
                : 'border-transparent text-brand-muted hover:text-brand-dark hover:border-brand-border'
            }`}>
              {n.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function OrderHistoryPage() {
  const { data, loading } = useApi(
    () => orderService.getOrders().then((d) => d.results || d),
    [],
  );
  const orders = data || [];

  if (loading) {
    return (
      <main className="pt-[96px] min-h-screen flex items-center justify-center">
        <p className="text-sm text-brand-muted">Loading orders…</p>
      </main>
    );
  }

  if (!loading && orders.length === 0) {
    return (
      <main className="pt-[96px] min-h-screen">
        <div className="max-w-3xl mx-auto px-6 lg:px-12 py-12 border-b border-brand-border">
          <p className="section-label mb-2">Account</p>
          <h1 className="font-serif text-5xl font-light text-brand-dark">Order History</h1>
        </div>
        <div className="max-w-5xl mx-auto px-6 lg:px-12 py-10">
          <div className="flex gap-12">
            <AccountNav active="Orders" />
            <div className="flex-1 min-w-0 flex flex-col items-center justify-center gap-6 py-20">
              <p className="font-serif text-3xl font-light text-brand-dark">No orders yet</p>
              <p className="text-sm text-brand-muted">Your past orders will appear here.</p>
              <Link to="/products" className="btn-primary">Shop Now</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-[96px] min-h-screen">
      {/* Header */}
      <div className="max-w-3xl mx-auto px-6 lg:px-12 py-12 border-b border-brand-border">
        <p className="section-label mb-2">Account</p>
        <h1 className="font-serif text-5xl font-light text-brand-dark">Order History</h1>
      </div>

      <div className="max-w-5xl mx-auto px-6 lg:px-12 py-10">
        <div className="flex gap-12">
          <AccountNav active="Orders" />
          <div className="flex-1 min-w-0">
            <div className="space-y-5">
              {orders.map((order) => {
            const status = (order.status || 'processing').toLowerCase();
            const placedDate = order.createdAt
              ? new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
              : order.date || '—';
            const total = parseFloat(order.total?.amount || order.total || 0);
            const orderRef = order.orderNumber || order.id;
            const lineItems = order.items || order.lineItems || [];
            return (
              <div key={order.id} className="border border-brand-border bg-white p-6">
                {/* Order header */}
                <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                  <div>
                    <p className="text-xs text-brand-muted mb-0.5">Order</p>
                    <p className="font-medium text-brand-dark text-sm">{orderRef}</p>
                  </div>
                  <div>
                    <p className="text-xs text-brand-muted mb-0.5">Date</p>
                    <p className="text-sm text-brand-dark">{placedDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-brand-muted mb-0.5">Total</p>
                    <p className="text-sm font-medium text-brand-dark">${total.toLocaleString()}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full capitalize ${STATUS_STYLES[status] || STATUS_STYLES.processing}`}>
                    {status}
                  </span>
                </div>

                {/* Items */}
                {lineItems.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto pb-2 mb-5">
                    {lineItems.map((item, i) => {
                      const itemName = item.variant?.product?.name || item.productName || item.name || '';
                      const itemImage = item.variant?.product?.primaryImage || item.image || '';
                      const qty = item.quantity || item.qty || 1;
                      return (
                        <div key={i} className="flex-shrink-0 flex items-center gap-2">
                          <div className="w-12 h-16 bg-brand-border/30 overflow-hidden">
                            <img src={itemImage} alt={itemName} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-brand-dark max-w-[120px] truncate">{itemName}</p>
                            <p className="text-xs text-brand-muted">×{qty}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 flex-wrap pt-4 border-t border-brand-border">
                  <Link to={`/orders/${orderRef}/invoice`} className="btn-secondary flex items-center gap-1.5 text-xs py-2">
                    <FileText size={13} /> View Invoice
                  </Link>
                  <Link to="/track" state={{ orderId: orderRef }} className="btn-ghost flex items-center gap-1.5 text-xs">
                    <Truck size={13} /> Track Package
                  </Link>
                </div>
              </div>
            );
          })}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
