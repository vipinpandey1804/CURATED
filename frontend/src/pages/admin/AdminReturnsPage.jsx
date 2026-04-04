import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { adminReturnService } from '../../services/adminOrderService';
import { AdminBadge, statusVariant } from '../../components/admin/ui/AdminBadge';
import { AdminButton } from '../../components/admin/ui/AdminButton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '../../components/admin/ui/AdminDialog';

const STATUSES = ['', 'REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED'];

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionTarget, setActionTarget] = useState(null); // { returnRequest, action: 'approve'|'reject' }
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const load = useCallback((s = '') => {
    setLoading(true);
    adminReturnService
      .getReturns({ status: s || undefined, page_size: 50 })
      .then((d) => setReturns(d.results || d))
      .catch(() => setError('Failed to load returns'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAction() {
    if (!actionTarget) return;
    setProcessing(true);
    try {
      const { returnRequest, action } = actionTarget;
      if (action === 'approve') {
        await adminReturnService.approveReturn(returnRequest.id, { admin_notes: adminNotes });
      } else {
        await adminReturnService.rejectReturn(returnRequest.id, { admin_notes: adminNotes });
      }
      setActionTarget(null);
      setAdminNotes('');
      load(statusFilter);
    } catch {
      setError('Action failed');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Returns</h1>
        <p className="text-sm text-gray-500 mt-1">{returns.length} returns loaded</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); load(e.target.value); }}
          className="h-9 px-3 border border-gray-300 rounded-md text-sm focus:outline-none"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s || 'All statuses'}</option>)}
        </select>
      </div>

      {error && <div className="flex items-center gap-2 text-red-600 text-sm"><AlertCircle className="h-4 w-4" />{error}</div>}

      {!loading && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Order #', 'Customer', 'Items', 'Reason', 'Status', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {returns.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link to={`/admin-panel/orders/${r.orderId}`} className="text-blue-600 hover:underline">
                      {r.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <p className="font-medium">{r.userName}</p>
                    <p className="text-xs text-gray-400">{r.userEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      {r.lineItems?.map((li) => (
                        <p key={li.id} className="text-xs text-gray-500">
                          {li.quantity}× {li.productName} <span className="text-gray-300">({li.reasonCode})</span>
                        </p>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-[160px]">
                    <p className="truncate text-xs">{r.reason || '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <AdminBadge variant={statusVariant(r.status)}>{r.status}</AdminBadge>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {r.status === 'REQUESTED' && (
                      <div className="flex gap-1">
                        <AdminButton
                          size="sm"
                          variant="success"
                          onClick={() => { setActionTarget({ returnRequest: r, action: 'approve' }); setAdminNotes(''); }}
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Approve
                        </AdminButton>
                        <AdminButton
                          size="sm"
                          variant="destructive"
                          onClick={() => { setActionTarget({ returnRequest: r, action: 'reject' }); setAdminNotes(''); }}
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </AdminButton>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {returns.length === 0 && <div className="text-center py-12 text-gray-400 text-sm">No returns found.</div>}
        </div>
      )}

      {/* Action confirmation dialog */}
      <Dialog open={!!actionTarget} onOpenChange={(o) => !o && setActionTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {actionTarget?.action === 'approve' ? 'Approve Return' : 'Reject Return'}
            </DialogTitle>
            <DialogDescription>
              Order {actionTarget?.returnRequest?.orderNumber}
              {actionTarget?.action === 'approve' && ' — Inventory will be restocked automatically.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-xs font-medium text-gray-600 block">Admin Notes (optional)</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 min-h-[72px]"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add notes for the customer or internal team…"
            />
          </div>
          <DialogFooter>
            <AdminButton variant="outline" onClick={() => setActionTarget(null)} disabled={processing}>Cancel</AdminButton>
            <AdminButton
              variant={actionTarget?.action === 'approve' ? 'success' : 'destructive'}
              onClick={handleAction}
              disabled={processing}
            >
              {processing ? 'Processing…' : actionTarget?.action === 'approve' ? 'Approve' : 'Reject'}
            </AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
