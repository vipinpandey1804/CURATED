import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, AlertCircle, ImageOff } from 'lucide-react';
import { adminCatalogService } from '../../services/adminCatalogService';
import { AdminButton } from '../../components/admin/ui/AdminButton';
import { AdminBadge } from '../../components/admin/ui/AdminBadge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '../../components/admin/ui/AdminDialog';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const load = useCallback((q = '') => {
    setLoading(true);
    adminCatalogService
      .getProducts({ search: q, page_size: 50 })
      .then((data) => setProducts(data.results || data))
      .catch((e) => setError(e.response?.data?.detail || 'Failed to load products'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleSearch(e) {
    e.preventDefault();
    load(search);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminCatalogService.deleteProduct(deleteTarget.id);
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      // keep dialog open on error
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">{products.length} item{products.length !== 1 ? 's' : ''}</p>
        </div>
        <AdminButton onClick={() => navigate('/admin-panel/products/new')}>
          <Plus className="h-4 w-4" />
          New Product
        </AdminButton>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full pl-9 pr-3 h-9 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>
        <AdminButton type="submit" variant="outline" size="sm">Search</AdminButton>
      </form>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="text-gray-400 text-sm">Loading…</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['', 'Name', 'Category', 'Price', 'Variants', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => {
                const img = p.images?.[0];
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 w-12">
                      {img?.url ? (
                        <img src={img.url} alt={img.altText || p.name} className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                          <ImageOff className="h-4 w-4 text-gray-300" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/admin-panel/products/${p.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                        {p.name}
                      </Link>
                      {p.isNew && <span className="ml-2 text-xs text-blue-500">NEW</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.categoryName || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {p.basePrice} <span className="text-xs text-gray-400">{p.basePriceCurrency}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.variantCount ?? p.variants?.length ?? 0}</td>
                    <td className="px-4 py-3">
                      <AdminBadge variant={p.isActive ? 'success' : 'default'}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </AdminBadge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <AdminButton
                          size="icon"
                          variant="ghost"
                          onClick={() => navigate(`/admin-panel/products/${p.id}`)}
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </AdminButton>
                        <AdminButton
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteTarget(p)}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </AdminButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">No products found.</div>
          )}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <AdminButton variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </AdminButton>
            <AdminButton variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
