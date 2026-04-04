import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { adminMarketingService } from '../../services/adminMarketingService';
import { AdminBadge } from '../../components/admin/ui/AdminBadge';
import { AdminButton } from '../../components/admin/ui/AdminButton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '../../components/admin/ui/AdminDialog';
import { AdminSwitch } from '../../components/admin/ui/AdminSwitch';

const EMPTY = {
  code: '', description: '', discountType: 'PERCENTAGE', discountValue: '',
  maxUses: '', validFrom: '', validUntil: '', isActive: true,
};

function toLocal(dt) {
  if (!dt) return '';
  return new Date(dt).toISOString().slice(0, 16);
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminMarketingService
      .getCoupons({ page_size: 100 })
      .then((d) => setCoupons(d.results || d))
      .catch(() => setError('Failed to load coupons'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setFormOpen(true);
  }

  function openEdit(c) {
    setEditing(c);
    setForm({
      code: c.code,
      description: c.description || '',
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      maxUses: c.maxUses != null ? String(c.maxUses) : '',
      validFrom: toLocal(c.validFrom),
      validUntil: toLocal(c.validUntil),
      isActive: c.isActive,
    });
    setFormOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description,
      discount_type: form.discountType,
      discount_value: parseFloat(form.discountValue),
      max_uses: form.maxUses ? parseInt(form.maxUses, 10) : null,
      valid_from: form.validFrom ? new Date(form.validFrom).toISOString() : null,
      valid_until: form.validUntil ? new Date(form.validUntil).toISOString() : null,
      is_active: form.isActive,
    };
    try {
      if (editing) {
        await adminMarketingService.updateCoupon(editing.id, payload);
      } else {
        await adminMarketingService.createCoupon(payload);
      }
      setFormOpen(false);
      load();
    } catch {
      setError('Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminMarketingService.deleteCoupon(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch {
      setError('Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  function field(key) {
    return { value: form[key], onChange: (e) => setForm((p) => ({ ...p, [key]: e.target.value })) };
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-400';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Coupons</h1>
          <p className="text-sm text-gray-500 mt-1">{coupons.length} coupons</p>
        </div>
        <AdminButton onClick={openCreate}>
          <Plus className="h-4 w-4" /> New Coupon
        </AdminButton>
      </div>

      {error && <div className="flex items-center gap-2 text-red-600 text-sm"><AlertCircle className="h-4 w-4" />{error}</div>}

      {!loading && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Code', 'Type', 'Value', 'Min Order', 'Uses', 'Valid', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.map((c) => {
                const expired = c.validUntil && new Date(c.validUntil) < new Date();
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{c.code}</span>
                      {c.description && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">{c.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <AdminBadge variant={c.discountType === 'PERCENTAGE' ? 'info' : 'purple'}>
                        {c.discountType}
                      </AdminBadge>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {c.minOrderAmount ? `₹${parseFloat(c.minOrderAmountAmount || c.minOrderAmount).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {c.timesUsed}{c.maxUses ? `/${c.maxUses}` : ''}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      <p>{c.validFrom ? new Date(c.validFrom).toLocaleDateString() : '—'}</p>
                      <p>→ {c.validUntil ? new Date(c.validUntil).toLocaleDateString() : '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      {expired
                        ? <AdminBadge variant="destructive">Expired</AdminBadge>
                        : <AdminBadge variant={c.isActive ? 'success' : 'default'}>{c.isActive ? 'Active' : 'Inactive'}</AdminBadge>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <AdminButton size="icon" variant="ghost" onClick={() => openEdit(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </AdminButton>
                        <AdminButton size="icon" variant="ghost" onClick={() => setDeleteTarget(c)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </AdminButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {coupons.length === 0 && <div className="text-center py-12 text-gray-400 text-sm">No coupons found.</div>}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={(o) => !o && setFormOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Coupon' : 'New Coupon'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Code *</label>
                <input {...field('code')} required placeholder="SUMMER20" className={`${inputCls} uppercase`} />
              </div>
              <div>
                <label className={labelCls}>Discount Type *</label>
                <select
                  value={form.discountType}
                  onChange={(e) => setForm((p) => ({ ...p, discountType: e.target.value }))}
                  className={inputCls}
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed (₹)</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Description</label>
              <input {...field('description')} placeholder="Optional description" className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Discount Value *</label>
                <input {...field('discountValue')} type="number" step="0.01" min="0" required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Max Uses</label>
                <input {...field('maxUses')} type="number" min="0" placeholder="Unlimited" className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Valid From *</label>
                <input {...field('validFrom')} type="datetime-local" required className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Valid Until *</label>
                <input {...field('validUntil')} type="datetime-local" required className={inputCls} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <AdminSwitch
                checked={form.isActive}
                onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
              />
              <span className="text-sm text-gray-700">Active</span>
            </div>

            <DialogFooter>
              <AdminButton type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</AdminButton>
              <AdminButton type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Create'}</AdminButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Coupon</DialogTitle>
            <DialogDescription>
              Delete coupon <span className="font-mono font-semibold">{deleteTarget?.code}</span>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <AdminButton variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</AdminButton>
            <AdminButton variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
