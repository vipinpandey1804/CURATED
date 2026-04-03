import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Package, CheckCircle2, Truck, MapPin, Search } from 'lucide-react';
import { orderService } from '../services/orderService';

const STEP_ICONS = { confirmed: CheckCircle2, processing: Package, shipped: Truck, delivered: MapPin };

export default function TrackPackagePage() {
  const location = useLocation();
  const initialOrderId = location.state?.orderId || '';
  const [query, setQuery] = useState(initialOrderId);
  const [tracked, setTracked] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [searching, setSearching] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setNotFound(false);
    setTracked(null);
    try {
      const shipments = await orderService.getShipments(query.trim());
      const list = shipments.results || shipments;
      if (list.length > 0) {
        setTracked({ orderRef: query.trim(), shipments: list });
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setSearching(false);
    }
  }

  return (
    <main className="pt-[96px] min-h-screen">
      {/* Header */}
      <div className="max-w-3xl mx-auto px-6 lg:px-12 py-12 border-b border-brand-border">
        <p className="section-label mb-2">Fulfilment</p>
        <h1 className="font-serif text-5xl font-light text-brand-dark">Track Package</h1>
      </div>

      <div className="max-w-3xl mx-auto px-6 lg:px-12 py-10">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-10">
          <div className="flex-1 flex border border-brand-border items-center px-3 gap-2">
            <Search size={14} className="text-brand-muted flex-shrink-0" />
            <input
              type="text"
              placeholder="Enter order number (e.g. CRTD-001)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 py-3 text-sm outline-none bg-transparent placeholder:text-brand-border text-brand-dark"
            />
          </div>
          <button type="submit" disabled={searching} className="btn-primary px-6">{searching ? '…' : 'Track'}</button>
        </form>

        {notFound && (
          <p className="text-sm text-red-500 mb-6">No order found with that number.</p>
        )}

        {tracked && tracked.shipments.map((shipment, si) => (
          <div key={si} className="border border-brand-border bg-white p-8 mb-4">
            {/* Shipment info */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-8 pb-8 border-b border-brand-border">
              <div>
                <p className="section-label mb-0.5">Order</p>
                <p className="font-medium text-brand-dark">{tracked.orderRef}</p>
              </div>
              <div>
                <p className="section-label mb-0.5">Carrier</p>
                <p className="text-sm text-brand-dark">{shipment.carrier || '—'}</p>
              </div>
              <div>
                <p className="section-label mb-0.5">Tracking #</p>
                <p className="text-sm text-brand-dark font-mono">{shipment.trackingNumber || '—'}</p>
              </div>
              <div>
                <p className="section-label mb-0.5">Est. Delivery</p>
                <p className="text-sm text-brand-dark">
                  {shipment.estimatedDelivery
                    ? new Date(shipment.estimatedDelivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—'}
                </p>
              </div>
            </div>

            {/* Tracking steps */}
            <div className="space-y-0">
              {(shipment.trackingEvents || [
                { status: 'confirmed', label: 'Order Confirmed', date: shipment.createdAt, done: true },
                { status: 'shipped', label: 'Dispatched', date: shipment.shippedAt, done: !!shipment.shippedAt },
                { status: 'delivered', label: 'Delivered', date: shipment.deliveredAt, done: !!shipment.deliveredAt },
              ]).map((step, i, arr) => {
                const Icon = STEP_ICONS[step.status] || Package;
                const dateStr = step.date
                  ? new Date(step.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : step.time || 'Pending';
                return (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${step.done ? 'border-brand-dark bg-brand-dark' : 'border-brand-border bg-white'}`}>
                        <Icon size={14} className={step.done ? 'text-white' : 'text-brand-muted'} />
                      </div>
                      {i < arr.length - 1 && (
                        <div className={`w-0.5 h-10 mt-1 ${step.done ? 'bg-brand-dark' : 'bg-brand-border'}`} />
                      )}
                    </div>
                    <div className="pb-10">
                      <p className={`text-sm font-medium ${step.done ? 'text-brand-dark' : 'text-brand-muted'}`}>{step.label}</p>
                      <p className="text-xs text-brand-muted">{dateStr}</p>
                      {step.location && <p className="text-xs text-brand-muted">{step.location}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {!tracked && !notFound && (
          <div className="text-center py-16">
            <Truck size={40} strokeWidth={1} className="text-brand-border mx-auto mb-4" />
            <p className="text-brand-muted text-sm">Enter your order number above to track your delivery.</p>
          </div>
        )}
      </div>
    </main>
  );
}
