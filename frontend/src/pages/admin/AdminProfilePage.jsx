import { useEffect, useState } from 'react';
import { AlertCircle, LockKeyhole } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { AdminButton } from '../../components/admin/ui/AdminButton';

export default function AdminProfilePage() {
  const { user, updateProfile } = useAuth();
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
  });
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setProfileForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || user?.profile?.phoneNumber || '',
      dateOfBirth: user?.profile?.dateOfBirth || '',
    });
  }, [user]);

  async function handleProfileSave(e) {
    e.preventDefault();
    setSavingProfile(true);
    setError('');
    setProfileMessage('');
    try {
      await updateProfile({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phoneNumber: profileForm.phoneNumber,
        dateOfBirth: profileForm.dateOfBirth || null,
      });
      setProfileMessage('Profile updated successfully.');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSave(e) {
    e.preventDefault();
    if (passwordForm.next.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setError('New password and confirm password must match.');
      return;
    }
    setSavingPassword(true);
    setError('');
    setPasswordMessage('');
    try {
      await authService.changePassword(passwordForm.current, passwordForm.next);
      setPasswordForm({ current: '', next: '', confirm: '' });
      setPasswordMessage('Password updated successfully.');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your admin account details and password.</p>
      </div>

      {error && <div className="flex items-center gap-2 text-sm text-red-600"><AlertCircle className="h-4 w-4" />{error}</div>}
      {profileMessage && <div className="text-sm text-emerald-600">{profileMessage}</div>}
      {passwordMessage && <div className="text-sm text-emerald-600">{passwordMessage}</div>}

      <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
        <form onSubmit={handleProfileSave} className="rounded-xl border border-gray-200 bg-white p-5 space-y-5">
          <h2 className="text-sm font-semibold text-gray-900">Profile Information</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-gray-600">
              <span>First name</span>
              <input
                value={profileForm.firstName}
                onChange={(e) => setProfileForm((current) => ({ ...current, firstName: e.target.value }))}
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </label>
            <label className="space-y-2 text-sm text-gray-600">
              <span>Last name</span>
              <input
                value={profileForm.lastName}
                onChange={(e) => setProfileForm((current) => ({ ...current, lastName: e.target.value }))}
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </label>
          </div>

          <label className="block space-y-2 text-sm text-gray-600">
            <span>Email</span>
            <input value={profileForm.email} disabled className="h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500" />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-gray-600">
              <span>Phone number</span>
              <input
                value={profileForm.phoneNumber}
                onChange={(e) => setProfileForm((current) => ({ ...current, phoneNumber: e.target.value }))}
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </label>
            <label className="space-y-2 text-sm text-gray-600">
              <span>Date of birth</span>
              <input
                type="date"
                value={profileForm.dateOfBirth || ''}
                onChange={(e) => setProfileForm((current) => ({ ...current, dateOfBirth: e.target.value }))}
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </label>
          </div>

          <AdminButton type="submit" disabled={savingProfile}>
            {savingProfile ? 'Saving...' : 'Save My Profile'}
          </AdminButton>
        </form>

        <form onSubmit={handlePasswordSave} className="rounded-xl border border-gray-200 bg-white p-5 space-y-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <LockKeyhole className="h-4 w-4" /> Password
          </div>

          <label className="block space-y-2 text-sm text-gray-600">
            <span>Current password</span>
            <input
              type="password"
              value={passwordForm.current}
              onChange={(e) => setPasswordForm((current) => ({ ...current, current: e.target.value }))}
              className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </label>

          <label className="block space-y-2 text-sm text-gray-600">
            <span>New password</span>
            <input
              type="password"
              value={passwordForm.next}
              onChange={(e) => setPasswordForm((current) => ({ ...current, next: e.target.value }))}
              className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </label>

          <label className="block space-y-2 text-sm text-gray-600">
            <span>Confirm password</span>
            <input
              type="password"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm((current) => ({ ...current, confirm: e.target.value }))}
              className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </label>

          <AdminButton type="submit" variant="outline" disabled={savingPassword}>
            {savingPassword ? 'Updating...' : 'Update Password'}
          </AdminButton>
        </form>
      </div>
    </div>
  );
}
