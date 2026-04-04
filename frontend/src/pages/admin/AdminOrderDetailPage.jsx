import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { adminOrderService } from '../../services/adminOrderService';
import { AdminBadge, statusVariant } from '../../components/admin/ui/AdminBadge';
import { AdminButton } from '../../components/admin/ui/AdminButton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/admin/ui/AdminSelect';

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const PAYMENT_STATUSES = ['UNPAID', 'PAID', 'PARTIALLY_REFUNDED', 'FULLY_REFUNDED', 'FAILED'];
const FULFILLMENT_STATUSES = ['UNFULFILLED', 'PARTIALLY_FULFILLED', 'FULFILLED'];

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: '', paymentStatus: '', fulfillmentStatus: '', note: '' });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    adminOrderService.getOrder(id)
      .then((o) => {
        setOrder(o);
        setStatusForm({
          status: o.status,
          paymentStatus: o.paymentStatus,
          fulfillmentStatus: o.fulfillmentStatus,
          note: '',
        });
      })
      .catch(() => setError('Failed to load order'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleStatusUpdate(e) {
    e.preventDefault();
    setUpdating(true);
    try {
      const updated = await adminOrderService.updateOrderStatus(id, {
        status: statusForm.status,
        payment_status: statusForm.paymentStatus,
        fulfillment_status: statusForm.fulfillmentStatus,
        note: statusForm.note,
      });
      setOrder(updated);
    } catch {
      setError('Failed to update status');
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return <div className="text-gray-400 text-sm">Loading…</div>;
  if (error) return <div className="flex items-center gap-2 text-red-600 text-sm"><AlertCircle className="h-4 w-4" />{error}</div>;
  if (!order) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link to="/admin-panel/orders">
          <AdminButton variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></AdminButton>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Order {order.orderNumber}</h1>
          <p className="text-sm text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <div className="ml-4 flex gap-2 flex-wrap">
          <AdminBadge variant={statusVariant(order.status)}>{order.status}</AdminBadge>
          <AdminBadge variant={statusVariant(order.paymentStatus)}>{order.paymentStatus}</AdminBadge>
          <AdminBadge variant={statusVariant(order.fulfillmentStatus)}>{order.fulfillmentStatus}</AdminBadge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Customer + Shipping */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Customer</h2>
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-medium text-gray-900">{order.userName}</p>
            <p className="text-gray-400">{order.userEmail}</p>
          </div>
          <h2 className="text-sm font-semibold text-gray-700 pt-2">Shipping Address</h2>
          <div className="text-sm text-gray-600 space-y-0.5">
            <p>{order.shippingFullName}</p>
            <p>{order.shippingAddressLine1}{order.shippingAddressLine2 ? `, ${order.shippingAddressLine2}` : ''}</p>
            <p>{order.shippingCity}, {order.shippingState} {order.shippingPostalCode}</p>
            <p>{order.shippingCountry}</p>
            {order.shippingPhone && <p>{order.shippingPhone}</p>}
          </div>
        </div>

        {/* Financial summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Order Summary</h2>
          <div className="space-y-1.5 text-sm">
            {[
              ['Subtotal', `${order.subtotal} ${order.subtotalCurrency}`],
              ['Shipping', `${order.shippingCost} ${order.shippingCostCurrency}`],
              ['Discount', `${order.discountAmount} ${order.discountAmountCurrency}`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-gray-600">
                <span>{label}</span><span>{value}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-100 pt-1.5 mt-1.5">
              <span>Total</span><span>{order.total} {order.totalCurrency}</span>
            </div>
          </div>
          {order.couponCode && (
            <p className="text-xs text-gray-400">Coupon: <span className="font-mono">{order.couponCode}</span></p>
          )}
        </div>
      </div>

      {/* Order items */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Items</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Image', 'Product', 'SKU', 'Qty', 'Unit Price', 'Line Total'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {order.items?.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 w-12">
                  {item.productImageUrl ? (
                    <img src={item.productImageUrl} alt="" className="h-10 w-10 rounded object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-gray-100" />
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{item.productName}</p>
                  {item.variantName && <p className="text-xs text-gray-400">{item.variantName}</p>}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-400">{item.sku}</td>
                <td className="px-4 py-3 text-gray-600">{item.quantity}</td>
                <td className="px-4 py-3 text-gray-600">{item.unitPrice} {item.unitPriceCurrency}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{item.lineTotal} {item.lineTotalCurrency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status update form */}
      <form onSubmit={handleStatusUpdate} className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Update Status</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Order Status</label>
            <Select value={statusForm.status} onValueChange={(v) => setStatusForm((f) => ({ ...f, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Payment Status</label>
            <Select value={statusForm.paymentStatus} onValueChange={(v) => setStatusForm((f) => ({ ...f, paymentStatus: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Fulfillment Status</label>
            <Select value={statusForm.fulfillmentStatus} onValueChange={(v) => setStatusForm((f) => ({ ...f, fulfillmentStatus: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FULFILLMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 font-medium block mb-1">Note (optional)</label>
          <input
            className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            value={statusForm.note}
            onChange={(e) => setStatusForm((f) => ({ ...f, note: e.target.value }))}
            placeholder="Reason for status change…"
          />
        </div>
        <div className="flex justify-end">
          <AdminButton type="submit" disabled={updating} size="sm">
            {updating ? 'Updating…' : 'Update Status'}
          </AdminButton>
        </div>
      </form>

      {/* Status history */}
      {order.statusHistory?.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Status History</h2>
          <div className="space-y-3">
            {order.statusHistory.map((h) => (
              <div key={h.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                <div>
                  <p className="text-gray-700">
                    <AdminBadge variant={statusVariant(h.oldStatus)} className="mr-1">{h.oldStatus || 'Initial'}</AdminBadge>
                    → <AdminBadge variant={statusVariant(h.newStatus)} className="ml-1">{h.newStatus}</AdminBadge>
                  </p>
                  {h.note && <p className="text-gray-400 text-xs mt-0.5">{h.note}</p>}
                  <p className="text-gray-400 text-xs mt-0.5">
                    {h.changedByEmail || 'System'} · {new Date(h.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
