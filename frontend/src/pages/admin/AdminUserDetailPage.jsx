import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, KeyRound, Trash2 } from 'lucide-react';
import { adminUserService } from '../../services/adminUserService';
import { AdminButton } from '../../components/admin/ui/AdminButton';
import { AdminSwitch } from '../../components/admin/ui/AdminSwitch';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '../../components/admin/ui/AdminDialog';

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ next: '', confirm: '' });

  useEffect(() => {
    setLoading(true);
    adminUserService.getUser(id)
      .then((data) => {
        setForm({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phoneNumber: data.phoneNumber || '',
          dateOfBirth: data.dateOfBirth || '',
          isVerified: !!data.isVerified,
          isStaff: !!data.isStaff,
          isActive: !!data.isActive,
          dateJoined: data.dateJoined || '',
        });
      })
      .catch(() => setError('Failed to load user profile.'))
      .finally(() => setLoading(false));
  }, [id]);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    setPasswordMessage('');
    try {
      const updated = await adminUserService.updateUser(id, {
        first_name: form.firstName,
        last_name: form.lastName,
        phone_number: form.phoneNumber || null,
        date_of_birth: form.dateOfBirth || null,
        is_verified: form.isVerified,
        is_staff: form.isStaff,
        is_active: form.isActive,
      });
      setForm((current) => ({
        ...current,
        firstName: updated.firstName || '',
        lastName: updated.lastName || '',
        phoneNumber: updated.phoneNumber || '',
        dateOfBirth: updated.dateOfBirth || '',
        isVerified: !!updated.isVerified,
        isStaff: !!updated.isStaff,
        isActive: !!updated.isActive,
      }));
      setSaved(true);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to save user profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    if (passwordForm.next.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setError('New password and confirm password must match.');
      return;
    }

    setPasswordSaving(true);
    setError('');
    setSaved(false);
    setPasswordMessage('');
    try {
      const response = await adminUserService.setUserPassword(id, {
        new_password: passwordForm.next,
      });
      setPasswordForm({ next: '', confirm: '' });
      setPasswordMessage(response.detail || 'Password updated successfully.');
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.newPassword?.[0] || 'Failed to update password.');
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleDeleteUser() {
    setDeleting(true);
    setError('');
    try {
      await adminUserService.deleteUser(id);
      navigate('/admin-panel/users', { replace: true });
    } catch (err) {
      setDeleteOpen(false);
      setError(err?.response?.data?.detail || 'Failed to delete user.');
      setDeleting(false);
    }
  }

  if (loading) return <div className="text-sm text-gray-400">Loading user profile...</div>;
  if (!form) return <div className="text-sm text-red-600">Unable to load user.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link to="/admin-panel/users" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
            <ArrowLeft className="h-4 w-4" /> Back to users
          </Link>
          <h1 className="mt-3 text-xl font-semibold text-gray-900">User Profile</h1>
          <p className="mt-1 text-sm text-gray-500">View and edit the selected user's profile information.</p>
        </div>
      </div>

      {error && <div className="flex items-center gap-2 text-sm text-red-600"><AlertCircle className="h-4 w-4" />{error}</div>}
      {saved && <div className="text-sm text-emerald-600">User profile saved successfully.</div>}
      {passwordMessage && <div className="text-sm text-emerald-600">{passwordMessage}</div>}

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-5">
          <h2 className="text-sm font-semibold text-gray-900">Personal Details</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-gray-600">
              <span>First name</span>
              <input
                value={form.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </label>
            <label className="space-y-2 text-sm text-gray-600">
              <span>Last name</span>
              <input
                value={form.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </label>
          </div>

          <label className="space-y-2 text-sm text-gray-600 block">
            <span>Email</span>
            <input value={form.email} disabled className="h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500" />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-gray-600">
              <span>Phone number</span>
              <input
                value={form.phoneNumber}
                onChange={(e) => updateField('phoneNumber', e.target.value)}
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </label>
            <label className="space-y-2 text-sm text-gray-600">
              <span>Date of birth</span>
              <input
                type="date"
                value={form.dateOfBirth || ''}
                onChange={(e) => updateField('dateOfBirth', e.target.value)}
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-5">
          <h2 className="text-sm font-semibold text-gray-900">Permissions & Status</h2>

          <div className="space-y-4">
            {[
              ['Verified Account', 'isVerified'],
              ['Admin Access', 'isStaff'],
              ['Active User', 'isActive'],
            ].map(([label, key]) => (
              <div key={key} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3">
                <span className="text-sm text-gray-700">{label}</span>
                <AdminSwitch checked={!!form[key]} onCheckedChange={(value) => updateField(key, value)} />
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500">
            Joined: {form.dateJoined ? new Date(form.dateJoined).toLocaleDateString() : '-'}
          </div>

          <AdminButton type="submit" disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Save Profile'}
          </AdminButton>
        </div>
      </form>

      <div className="grid gap-6 lg:grid-cols-[1fr,0.75fr]">
        <form onSubmit={handlePasswordSubmit} className="rounded-xl border border-gray-200 bg-white p-5 space-y-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <KeyRound className="h-4 w-4" /> Security
          </div>
          <p className="text-sm text-gray-500">
            Set a temporary password for this user. {form.email ? 'A notification email will be sent automatically.' : 'This user has no email on file, so notification email cannot be sent.'}
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-gray-600">
              <span>New password</span>
              <input
                type="password"
                value={passwordForm.next}
                onChange={(e) => setPasswordForm((current) => ({ ...current, next: e.target.value }))}
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </label>
            <label className="space-y-2 text-sm text-gray-600">
              <span>Confirm password</span>
              <input
                type="password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm((current) => ({ ...current, confirm: e.target.value }))}
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </label>
          </div>

          <AdminButton type="submit" variant="outline" disabled={passwordSaving}>
            {passwordSaving ? 'Updating...' : 'Change Password'}
          </AdminButton>
        </form>

        <div className="rounded-xl border border-red-200 bg-white p-5 space-y-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-red-600">
            <Trash2 className="h-4 w-4" /> Danger Zone
          </div>
          <p className="text-sm text-gray-500">
            Deleting this user removes their account access. This action cannot be undone.
          </p>
          <AdminButton type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
            Delete User
          </AdminButton>
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              {form.email || 'This user'} will be removed permanently. Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <AdminButton type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </AdminButton>
            <AdminButton type="button" variant="destructive" onClick={handleDeleteUser} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete User'}
            </AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
