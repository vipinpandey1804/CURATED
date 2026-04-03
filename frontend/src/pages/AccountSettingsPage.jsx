import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/authService';

function AccountNav({ active }) {
  return (
    <nav className="w-44 flex-shrink-0 pt-1">
      <ul className="flex flex-col gap-0.5">
        {[
          { label: 'Profile', href: '/account/profile' },
          { label: 'Addresses', href: '/account/addresses' },
          { label: 'Orders', href: '/orders' },
          { label: 'Settings', href: '/account/settings' },
        ].map((n) => (
          <li key={n.label}>
            <Link to={n.href} className={`block py-2 pl-3 border-l-2 text-xs transition-colors ${
              n.label === active ? 'border-brand-dark text-brand-dark font-semibold' : 'border-transparent text-brand-muted hover:text-brand-dark hover:border-brand-border'
            }`}>
              {n.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function AccountSettingsPage() {
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaved, setPwSaved] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotions: false,
    newArrivals: true,
    editorialContent: false,
  });

  const NOTIFICATION_LABELS = {
    orderUpdates: 'Order & delivery updates',
    promotions: 'Promotions and offers',
    newArrivals: 'New arrivals and collections',
    editorialContent: 'Editorial and journal content',
  };

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!pwForm.current) errs.current = 'Required';
    if (pwForm.newPw.length < 8) errs.newPw = 'Minimum 8 characters';
    if (pwForm.newPw !== pwForm.confirm) errs.confirm = 'Passwords do not match';
    if (Object.keys(errs).length) { setPwErrors(errs); return; }
    setPwSaving(true);
    try {
      await authService.changePassword(pwForm.current, pwForm.newPw);
      setPwForm({ current: '', newPw: '', confirm: '' });
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 3000);
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.response?.data?.oldPassword?.[0] || 'Failed to update password.';
      setPwErrors({ current: detail });
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <main className="pt-[96px] min-h-screen">
      <div className="max-w-3xl mx-auto px-6 lg:px-12 py-12 border-b border-brand-border">
        <p className="section-label mb-2">Account</p>
        <h1 className="font-serif text-5xl font-light text-brand-dark">Settings</h1>
      </div>

      <div className="max-w-5xl mx-auto px-6 lg:px-12 py-10">
        <div className="flex gap-12">
          <AccountNav active="Settings" />
          <div className="flex-1 min-w-0">

        {/* Password section */}
        <section className="mb-12">
          <h2 className="font-serif text-2xl font-light text-brand-dark mb-6">Change Password</h2>
          <form onSubmit={handlePasswordSubmit} noValidate className="max-w-md space-y-4">
            {[
              { name: 'current', label: 'Current Password' },
              { name: 'newPw', label: 'New Password' },
              { name: 'confirm', label: 'Confirm New Password' },
            ].map(({ name, label }) => (
              <div key={name}>
                <label className="block text-xs text-brand-muted mb-1">{label}</label>
                <div className="relative">
                  <input
                    type={showPw[name] ? 'text' : 'password'}
                    value={pwForm[name]}
                    onChange={(e) => { setPwForm({ ...pwForm, [name]: e.target.value }); if (pwErrors[name]) setPwErrors({ ...pwErrors, [name]: undefined }); }}
                    className={`input-box w-full pr-10 ${pwErrors[name] ? 'border-red-400' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw({ ...showPw, [name]: !showPw[name] })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark"
                  >
                    {showPw[name] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {pwErrors[name] && <p className="text-xs text-red-500 mt-0.5">{pwErrors[name]}</p>}
              </div>
            ))}
            <div className="flex items-center gap-4 pt-2">
              <button type="submit" disabled={pwSaving} className="btn-primary">
                {pwSaving ? 'Updating…' : 'Update Password'}
              </button>
              {pwSaved && <p className="text-xs text-green-600">Password updated.</p>}
            </div>
          </form>
        </section>

        {/* Notifications section */}
        <section className="mb-12">
          <h2 className="font-serif text-2xl font-light text-brand-dark mb-2">Email Preferences</h2>
          <p className="text-xs text-brand-muted mb-6">Choose which emails you'd like to receive from CURATED.</p>
          <div className="divide-y divide-brand-border">
            {Object.keys(notifications).map((key) => (
              <div key={key} className="flex items-center justify-between py-4">
                <span className="text-sm text-brand-dark">{NOTIFICATION_LABELS[key]}</span>
                <button
                  onClick={() => setNotifications({ ...notifications, [key]: !notifications[key] })}
                  className={`relative w-9 h-5 rounded-full transition-colors ${notifications[key] ? 'bg-brand-dark' : 'bg-brand-border'}`}
                  role="switch"
                  aria-checked={notifications[key]}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifications[key] ? 'translate-x-4' : ''}`} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Danger zone */}
        <section>
          <h2 className="font-serif text-2xl font-light text-red-600 mb-4">Danger Zone</h2>
          <p className="text-xs text-brand-muted mb-4">Deleting your account is permanent and cannot be undone.</p>
          <button className="border border-red-300 text-red-500 text-xs px-4 py-2 hover:bg-red-50 transition-colors">
            Delete Account
          </button>
        </section>
          </div>
        </div>
      </div>
    </main>
  );
}
