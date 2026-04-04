import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, AlertCircle } from 'lucide-react';
import { adminCatalogService } from '../../services/adminCatalogService';
import { AdminButton } from '../../components/admin/ui/AdminButton';
import { AdminBadge } from '../../components/admin/ui/AdminBadge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/admin/ui/AdminDialog';

const inputClass = 'w-full h-9 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-400';

const emptyForm = { name: '', slug: '', description: '', parent: '', isActive: true, sortOrder: 0 };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    adminCatalogService.getCategories({ page_size: 200 })
      .then((d) => setCategories(d.results || d))
      .catch(() => setError('Failed to load categories'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(cat) {
    setEditTarget(cat);
    setForm({
      name: cat.name || '',
      slug: cat.slug || '',
      description: cat.description || '',
      parent: cat.parent || '',
      isActive: cat.isActive ?? cat.is_active ?? true,
      sortOrder: cat.sortOrder ?? cat.sort_order ?? 0,
    });
    setOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug || undefined,
        description: form.description,
        parent: form.parent || null,
        is_active: form.isActive,
        sort_order: form.sortOrder,
      };
      if (editTarget) {
        await adminCatalogService.updateCategory(editTarget.id, payload);
      } else {
        await adminCatalogService.createCategory(payload);
      }
      setOpen(false);
      load();
    } catch (e) {
      const d = e.response?.data;
      setError(typeof d === 'string' ? d : JSON.stringify(d));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await adminCatalogService.deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch {
      setError('Failed to delete category');
    }
  }

  const rootCategories = categories.filter((c) => !c.parent);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">{categories.length} total</p>
        </div>
        <AdminButton onClick={openCreate}><Plus className="h-4 w-4" /> New Category</AdminButton>
      </div>

      {error && <div className="flex items-center gap-2 text-red-600 text-sm"><AlertCircle className="h-4 w-4" />{error}</div>}

      {!loading && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'Slug', 'Parent', 'Products', 'Status', 'Sort', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((cat) => {
                const parent = categories.find((c) => c.id === cat.parent);
                return (
                  <tr key={cat.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {cat.parent && <span className="text-gray-300 mr-2">└</span>}
                      {cat.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{cat.slug}</td>
                    <td className="px-4 py-3 text-gray-500">{parent?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{cat.productCount ?? cat.product_count ?? '—'}</td>
                    <td className="px-4 py-3">
                      <AdminBadge variant={(cat.isActive ?? cat.is_active) ? 'success' : 'default'}>
                        {(cat.isActive ?? cat.is_active) ? 'Active' : 'Inactive'}
                      </AdminBadge>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{cat.sortOrder ?? cat.sort_order}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <AdminButton size="icon" variant="ghost" onClick={() => openEdit(cat)}><Pencil className="h-3.5 w-3.5" /></AdminButton>
                        <AdminButton size="icon" variant="ghost" onClick={() => setDeleteTarget(cat)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></AdminButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Category' : 'New Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Name *</label>
              <input className={inputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Slug</label>
              <input className={inputClass} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="auto-generated" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Parent Category</label>
              <select className={inputClass} value={form.parent} onChange={(e) => setForm((f) => ({ ...f, parent: e.target.value }))}>
                <option value="">— None (root) —</option>
                {categories.filter((c) => !editTarget || c.id !== editTarget.id).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Sort Order</label>
                <input type="number" className={inputClass} value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))} />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input type="checkbox" id="cat-active" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="rounded" />
                <label htmlFor="cat-active" className="text-sm text-gray-700">Active</label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <AdminButton variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</AdminButton>
            <AdminButton onClick={handleSave} disabled={saving || !form.name}>
              {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create'}
            </AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete "{deleteTarget?.name}"?</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500">This cannot be undone.</p>
          <DialogFooter className="pt-2">
            <AdminButton variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</AdminButton>
            <AdminButton variant="destructive" onClick={handleDelete}>Delete</AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
