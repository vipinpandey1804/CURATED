import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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

export default function EditPersonalInfoPage() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    firstName: user?.firstName || 'Alex',
    lastName: user?.lastName || 'Johnson',
    email: user?.email || 'alex@example.com',
    phone: user?.phone || '',
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  function validate() {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'Required';
    if (!form.lastName.trim()) errs.lastName = 'Required';
    if (!form.email.includes('@')) errs.email = 'Valid email required';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await updateProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setErrors({ email: err?.response?.data?.detail || 'Failed to save changes.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="pt-[96px] min-h-screen">
      <div className="max-w-3xl mx-auto px-6 lg:px-12 py-12 border-b border-brand-border">
        <p className="section-label mb-2">Account</p>
        <h1 className="font-serif text-5xl font-light text-brand-dark">Profile</h1>
      </div>

      <div className="max-w-5xl mx-auto px-6 lg:px-12 py-10">
        <div className="flex gap-12">
          <AccountNav active="Profile" />
          <div className="flex-1 min-w-0">

        <form onSubmit={handleSubmit} noValidate className="max-w-lg">
          <h2 className="font-serif text-2xl font-light text-brand-dark mb-6">Personal Information</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {[
              { name: 'firstName', label: 'First Name' },
              { name: 'lastName', label: 'Last Name' },
            ].map(({ name, label }) => (
              <div key={name}>
                <label className="block text-xs text-brand-muted mb-1">{label}</label>
                <input
                  type="text"
                  value={form[name]}
                  onChange={(e) => { setForm({ ...form, [name]: e.target.value }); if (errors[name]) setErrors({ ...errors, [name]: undefined }); }}
                  className={`input-box w-full ${errors[name] ? 'border-red-400' : ''}`}
                />
                {errors[name] && <p className="text-xs text-red-500 mt-0.5">{errors[name]}</p>}
              </div>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-xs text-brand-muted mb-1">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => { setForm({ ...form, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: undefined }); }}
              className={`input-box w-full ${errors.email ? 'border-red-400' : ''}`}
            />
            {errors.email && <p className="text-xs text-red-500 mt-0.5">{errors.email}</p>}
          </div>

          <div className="mb-8">
            <label className="block text-xs text-brand-muted mb-1">Phone (optional)</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              className="input-box w-full"
            />
          </div>

          <div className="flex items-center gap-4">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            {saved && <p className="text-xs text-green-600">Changes saved successfully.</p>}
          </div>
        </form>
          </div>
        </div>
      </div>
    </main>
  );
}
