import { useParams, Link } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { orderService } from '../services/orderService';

export default function OrderInvoicePage() {
  const { id: orderRef } = useParams();
  const { data: order, loading } = useApi(
    () => orderService.getOrder(orderRef),
    [orderRef],
  );

  if (loading) {
    return (
      <main className="pt-[96px] min-h-screen flex items-center justify-center">
        <p className="text-sm text-brand-muted">Loading invoice…</p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="pt-[96px] min-h-screen flex items-center justify-center">
        <p className="text-sm text-brand-muted">Order not found.</p>
      </main>
    );
  }

  const total = parseFloat(order.total?.amount || order.total || 0);
  const shippingCost = parseFloat(order.shippingCost?.amount || order.shippingCost || 0);
  const subtotalAmt = total - shippingCost;
  const lineItems = order.items || order.lineItems || [];
  const shippingAddr = order.shippingAddress || {};
  const placedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : order.date || '—';
  const addrName = [shippingAddr.firstName, shippingAddr.lastName].filter(Boolean).join(' ') || 'Customer';
  const addrLine = [shippingAddr.line1, shippingAddr.city, shippingAddr.state, shippingAddr.postalCode, shippingAddr.country].filter(Boolean);

  return (
    <main className="pt-[96px] min-h-screen">
      <div className="max-w-3xl mx-auto px-6 lg:px-12 py-10">
        {/* Back + Print */}
        <div className="flex items-center justify-between mb-10">
          <Link to="/orders" className="flex items-center gap-2 text-xs text-brand-muted hover:text-brand-dark transition-colors">
            <ArrowLeft size={13} /> Back to Orders
          </Link>
          <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2 text-xs py-2">
            <Printer size={13} /> Print Invoice
          </button>
        </div>

        <div className="border border-brand-border bg-white p-8 print:border-none print:shadow-none" id="invoice">
          {/* Brand header */}
          <div className="flex items-start justify-between mb-10 pb-8 border-b border-brand-border">
            <div>
              <p className="font-serif text-3xl font-light text-brand-dark tracking-widest">CURATED</p>
              <p className="text-xs text-brand-muted mt-1">curated.com · hello@curated.com</p>
            </div>
            <div className="text-right">
              <p className="section-label mb-1">Invoice</p>
              <p className="font-medium text-brand-dark text-sm">{order.orderNumber || orderRef}</p>
              <p className="text-xs text-brand-muted mt-1">{placedDate}</p>
            </div>
          </div>

          {/* Bill-to */}
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div>
              <p className="section-label mb-2">Bill To</p>
              <p className="text-sm text-brand-dark">{addrName}</p>
              {addrLine.map((l, i) => <p key={i} className="text-xs text-brand-muted">{l}</p>)}
            </div>
            <div>
              <p className="section-label mb-2">Ship To</p>
              <p className="text-sm text-brand-dark">{addrName}</p>
              {addrLine.map((l, i) => <p key={i} className="text-xs text-brand-muted">{l}</p>)}
            </div>
          </div>

          {/* Line items */}
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b border-brand-border">
                <th className="text-left section-label py-2 pr-4">Item</th>
                <th className="text-center section-label py-2 px-2">Qty</th>
                <th className="text-right section-label py-2 pl-2">Unit</th>
                <th className="text-right section-label py-2 pl-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, i) => {
                const itemName = item.variant?.product?.name || item.productName || item.name || '';
                const itemDetail = [item.variant?.colorName, item.variant?.size].filter(Boolean).join(' · ');
                const qty = item.quantity || item.qty || 1;
                const unitPrice = parseFloat(item.unitPrice?.amount || item.unitPrice || 0);
                const lineTotal = parseFloat(item.lineTotal?.amount || item.lineTotal || unitPrice * qty);
                return (
                  <tr key={i} className="border-b border-brand-border/50">
                    <td className="py-3 pr-4">
                      <p className="text-sm text-brand-dark">{itemName}</p>
                      {itemDetail && <p className="text-xs text-brand-muted">{itemDetail}</p>}
                    </td>
                    <td className="py-3 text-center text-sm text-brand-dark">{qty}</td>
                    <td className="py-3 text-right text-sm text-brand-dark">${unitPrice.toLocaleString()}</td>
                    <td className="py-3 text-right text-sm font-medium text-brand-dark">${lineTotal.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-56 space-y-2">
              <div className="flex justify-between text-xs text-brand-muted">
                <span>Subtotal</span><span>${subtotalAmt.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-brand-muted">
                <span>Shipping</span><span>{shippingCost === 0 ? 'Complimentary' : `$${shippingCost}`}</span>
              </div>
              <div className="flex justify-between text-xs text-brand-muted">
                <span>Tax (0%)</span><span>$0</span>
              </div>
              <div className="border-t border-brand-border pt-2 flex justify-between font-medium text-sm text-brand-dark">
                <span>Total</span><span>${total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-brand-muted text-center mt-12 pt-8 border-t border-brand-border">
            Thank you for shopping with CURATED. For questions, contact hello@curated.com
          </p>
        </div>
      </div>
    </main>
  );
}
