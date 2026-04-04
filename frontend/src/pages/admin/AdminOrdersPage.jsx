import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, AlertCircle } from 'lucide-react';
import { adminOrderService } from '../../services/adminOrderService';
import { AdminBadge, statusVariant } from '../../components/admin/ui/AdminBadge';
import { AdminButton } from '../../components/admin/ui/AdminButton';

const STATUSES = ['', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback((q = '', s = '') => {
    setLoading(true);
    adminOrderService
      .getOrders({ search: q, status: s || undefined, page_size: 50 })
      .then((d) => setOrders(d.results || d))
      .catch(() => setError('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleSearch(e) {
    e.preventDefault();
    load(search, statusFilter);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">{orders.length} orders loaded</p>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Order # or email…"
            className="pl-9 pr-3 h-9 border border-gray-300 rounded-md text-sm w-56 focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); load(search, e.target.value); }}
          className="h-9 px-3 border border-gray-300 rounded-md text-sm focus:outline-none"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s || 'All statuses'}</option>)}
        </select>
        <AdminButton type="submit" variant="outline" size="sm">Filter</AdminButton>
      </form>

      {error && <div className="flex items-center gap-2 text-red-600 text-sm"><AlertCircle className="h-4 w-4" />{error}</div>}

      {!loading && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Order #', 'Customer', 'Items', 'Total', 'Status', 'Payment', 'Fulfillment', 'Date'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link to={`/admin-panel/orders/${o.id}`} className="text-blue-600 hover:underline">{o.orderNumber}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-[160px] truncate">
                    <div className="font-medium truncate">{o.userName}</div>
                    <div className="text-xs text-gray-400 truncate">{o.userEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-center">{o.itemCount}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{o.total} {o.totalCurrency}</td>
                  <td className="px-4 py-3"><AdminBadge variant={statusVariant(o.status)}>{o.status}</AdminBadge></td>
                  <td className="px-4 py-3"><AdminBadge variant={statusVariant(o.paymentStatus)}>{o.paymentStatus}</AdminBadge></td>
                  <td className="px-4 py-3"><AdminBadge variant={statusVariant(o.fulfillmentStatus)}>{o.fulfillmentStatus}</AdminBadge></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && <div className="text-center py-12 text-gray-400 text-sm">No orders found.</div>}
        </div>
      )}
    </div>
  );
}
