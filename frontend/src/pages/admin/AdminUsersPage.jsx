import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
  const [confirmTarget, setConfirmTarget] = useState(null);
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
        <p className="mt-1 text-sm text-gray-500">{users.length} users loaded</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            className="h-9 w-full rounded-md border border-gray-300 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            placeholder="Search by name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <AdminButton type="submit" variant="outline" size="sm">Search</AdminButton>
        {query && (
          <AdminButton type="button" variant="ghost" size="sm" onClick={() => { setQuery(''); load(); }}>Clear</AdminButton>
        )}
      </form>

      {error && <div className="flex items-center gap-2 text-sm text-red-600"><AlertCircle className="h-4 w-4" />{error}</div>}

      {!loading && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                {['Name', 'Email', 'Phone', 'Verified', 'Staff', 'Active', 'Joined', 'Actions'].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/admin-panel/users/${user.id}`} className="font-medium text-gray-800 hover:text-blue-600">
                      {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'Unnamed User'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{user.email}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{user.phoneNumber || '-'}</td>
                  <td className="px-4 py-3">
                    <AdminBadge variant={user.isVerified ? 'success' : 'default'}>
                      {user.isVerified ? 'Yes' : 'No'}
                    </AdminBadge>
                  </td>
                  <td className="px-4 py-3">
                    <AdminSwitch checked={!!user.isStaff} onCheckedChange={(value) => requestToggle(user, 'isStaff', value)} />
                  </td>
                  <td className="px-4 py-3">
                    <AdminSwitch checked={!!user.isActive} onCheckedChange={(value) => requestToggle(user, 'isActive', value)} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {user.dateJoined ? new Date(user.dateJoined).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/admin-panel/users/${user.id}`}>
                      <AdminButton variant="outline" size="sm">View / Edit</AdminButton>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <div className="py-12 text-center text-sm text-gray-400">No users found.</div>}
        </div>
      )}

      <Dialog open={!!confirmTarget} onOpenChange={(open) => !open && setConfirmTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {confirmTarget?.value ? 'Grant Staff Access' : 'Revoke Staff Access'}
            </DialogTitle>
            <DialogDescription>
              {confirmTarget?.value
                ? `${confirmTarget?.user?.email} will gain admin panel access.`
                : `${confirmTarget?.user?.email} will lose admin panel access.`}{' '}
              Are you sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <AdminButton variant="outline" onClick={() => setConfirmTarget(null)} disabled={saving}>Cancel</AdminButton>
            <AdminButton variant={confirmTarget?.value ? 'default' : 'destructive'} onClick={handleConfirm} disabled={saving}>
              {saving ? 'Saving...' : 'Confirm'}
            </AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
