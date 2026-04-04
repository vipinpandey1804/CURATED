import { useEffect, useState, useCallback } from 'react';
import { AlertCircle, Search } from 'lucide-react';
import { adminUserService } from '../../services/adminUserService';
import { AdminBadge } from '../../components/admin/ui/AdminBadge';
import { AdminButton } from '../../components/admin/ui/AdminButton';
import { AdminSwitch } from '../../components/admin/ui/AdminSwitch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '../../components/admin/ui/AdminDialog';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null); // { user, field: 'isStaff'|'isActive', value }
  const [saving, setSaving] = useState(false);

  const load = useCallback((q = '') => {
    setLoading(true);
    adminUserService
      .getUsers({ search: q || undefined, page_size: 50 })
      .then((d) => setUsers(d.results || d))
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleSearch(e) {
    e.preventDefault();
    load(query);
  }

  function requestToggle(user, field, value) {
    if (field === 'isStaff') {
      setConfirmTarget({ user, field, value });
    } else {
      applyUpdate(user.id, { [field === 'isActive' ? 'is_active' : field]: value });
    }
  }

  async function applyUpdate(userId, patch) {
    setSaving(true);
    try {
      await adminUserService.updateUser(userId, patch);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, ...Object.fromEntries(Object.entries(patch).map(([k, v]) => [k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), v])) } : u));
      setConfirmTarget(null);
    } catch {
      setError('Update failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm() {
    if (!confirmTarget) return;
    const { user, field, value } = confirmTarget;
    const snakeKey = field === 'isStaff' ? 'is_staff' : 'is_active';
    await applyUpdate(user.id, { [snakeKey]: value });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500 mt-1">{users.length} users loaded</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 h-9 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            placeholder="Search by name or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <AdminButton type="submit" variant="outline" size="sm">Search</AdminButton>
        {query && (
          <AdminButton type="button" variant="ghost" size="sm" onClick={() => { setQuery(''); load(); }}>Clear</AdminButton>
        )}
      </form>

      {error && <div className="flex items-center gap-2 text-red-600 text-sm"><AlertCircle className="h-4 w-4" />{error}</div>}

      {!loading && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'Email', 'Phone', 'Verified', 'Staff', 'Active', 'Joined'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">
                      {[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{u.email}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{u.phoneNumber || '—'}</td>
                  <td className="px-4 py-3">
                    <AdminBadge variant={u.isVerified ? 'success' : 'default'}>
                      {u.isVerified ? 'Yes' : 'No'}
                    </AdminBadge>
                  </td>
                  <td className="px-4 py-3">
                    <AdminSwitch
                      checked={!!u.isStaff}
                      onCheckedChange={(v) => requestToggle(u, 'isStaff', v)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <AdminSwitch
                      checked={!!u.isActive}
                      onCheckedChange={(v) => requestToggle(u, 'isActive', v)}
                    />
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {u.dateJoined ? new Date(u.dateJoined).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <div className="text-center py-12 text-gray-400 text-sm">No users found.</div>}
        </div>
      )}

      {/* Staff toggle confirmation */}
      <Dialog open={!!confirmTarget} onOpenChange={(o) => !o && setConfirmTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {confirmTarget?.value ? 'Grant Staff Access' : 'Revoke Staff Access'}
            </DialogTitle>
            <DialogDescription>
              {confirmTarget?.value
                ? `${confirmTarget?.user?.email} will gain admin panel access.`
                : `${confirmTarget?.user?.email} will lose admin panel access.`}
              {' '}Are you sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <AdminButton variant="outline" onClick={() => setConfirmTarget(null)} disabled={saving}>Cancel</AdminButton>
            <AdminButton
              variant={confirmTarget?.value ? 'default' : 'destructive'}
              onClick={handleConfirm}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Confirm'}
            </AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
