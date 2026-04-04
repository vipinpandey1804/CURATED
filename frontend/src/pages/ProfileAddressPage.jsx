import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Check } from 'lucide-react';
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

const BLANK = { firstName: '', lastName: '', address: '', city: '', state: '', zip: '', country: 'IN', phone: '' };

function AddressModal({ title, initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || BLANK);
  const [errors, setErrors] = useState({});

  function validate() {
    const errs = {};
    ['firstName', 'lastName', 'address', 'city', 'state', 'zip', 'country'].forEach((f) => { if (!form[f].trim()) errs[f] = 'Required'; });
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-brand-muted hover:text-brand-dark text-xl leading-none">×</button>
        <h2 className="font-serif text-2xl font-light text-brand-dark mb-6">{title}</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              { name: 'firstName', label: 'First Name' },
              { name: 'lastName', label: 'Last Name' },
              { name: 'address', label: 'Street Address', full: true },
              { name: 'city', label: 'City' },
              { name: 'state', label: 'State' },
              { name: 'zip', label: 'Postal Code' },
              { name: 'country', label: 'Country (2-letter)' },
              { name: 'phone', label: 'Phone (optional)', full: true },
            ].map(({ name, label, full }) => (
              <div key={name} className={full ? 'col-span-full' : ''}>
                <label htmlFor={`addr-${name}`} className="block text-xs text-brand-muted mb-1">{label}</label>
                <input
                  id={`addr-${name}`}
                  type="text"
                  value={form[name]}
                  onChange={(e) => { setForm({ ...form, [name]: e.target.value }); if (errors[name]) setErrors({ ...errors, [name]: undefined }); }}
                  className={`input-box w-full ${errors[name] ? 'border-red-400' : ''}`}
                />
                {errors[name] && <p className="text-xs text-red-500 mt-0.5">{errors[name]}</p>}
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary">Save Address</button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ address, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={20} className="text-red-500" />
        </div>
        <h2 className="font-serif text-xl font-light text-brand-dark mb-2">Remove Address</h2>
        <p className="text-sm text-brand-muted mb-6">
          Are you sure you want to delete the address at <span className="text-brand-dark">{address.address}</span>? This cannot be undone.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={onConfirm} className="bg-red-600 text-white text-xs tracking-widest uppercase px-5 py-3 hover:bg-red-700 transition-colors">Delete</button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function ProfileAddressPage() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    authService.getAddresses()
      .then((d) => setAddresses(d.results || d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(form) {
    const payload = {
      fullName: `${form.firstName} ${form.lastName}`.trim(),
      addressLine1: form.address,
      addressLine2: '',
      city: form.city,
      state: form.state,
      postalCode: form.zip,
      country: form.country,
      phone: form.phone,
      addressType: 'SHIPPING',
    };
    try {
      setError(null);
      const created = await authService.createAddress(payload);
      setAddresses((prev) => [...prev, created]);
      setModal(null);
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.response?.data?.[0] || 'Failed to save address.';
      setError(msg);
    }
  }

  async function handleEdit(form) {
    const payload = {
      fullName: `${form.firstName} ${form.lastName}`.trim(),
      addressLine1: form.address,
      addressLine2: '',
      city: form.city,
      state: form.state,
      postalCode: form.zip,
      country: form.country,
      phone: form.phone,
    };
    const updated = await authService.updateAddress(modal.addr.id, payload);
    setAddresses((prev) => prev.map((a) => a.id === modal.addr.id ? updated : a));
    setModal(null);
  }

  async function handleDelete() {
    await authService.deleteAddress(modal.addr.id);
    setAddresses((prev) => prev.filter((a) => a.id !== modal.addr.id));
    setModal(null);
  }

  async function handleSetDefault(addr) {
    const updated = await authService.updateAddress(addr.id, { isDefault: true });
    setAddresses((prev) => prev.map((a) => ({
      ...a,
      isDefault: a.id === addr.id,
    })));
  }

  // Normalise address field names (API returns line1/postalCode, modal uses address/zip)
  function toFormShape(addr) {
    const nameParts = (addr.fullName || '').split(' ');
    return {
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      address: addr.addressLine1 || '',
      city: addr.city || '',
      state: addr.state || '',
      zip: addr.postalCode || '',
      country: addr.country || 'IN',
      phone: addr.phone || '',
    };
  }

  const defaultId = addresses.find((a) => a.isDefault)?.id;

  return (
    <main className="pt-[96px] min-h-screen">
      <div className="max-w-3xl mx-auto px-6 lg:px-12 py-12 border-b border-brand-border">
        <p className="section-label mb-2">Account</p>
        <h1 className="font-serif text-5xl font-light text-brand-dark">Addresses</h1>
      </div>

      <div className="max-w-5xl mx-auto px-6 lg:px-12 py-10">
        <div className="flex gap-12">
          <AccountNav active="Addresses" />
          <div className="flex-1 min-w-0">

        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-brand-muted">{addresses.length} saved address{addresses.length !== 1 ? 'es' : ''}</p>
          {addresses.length < 5 && (
            <button onClick={() => { setError(null); setModal('add'); }} className="btn-primary flex items-center gap-2 text-xs py-2">
              <Plus size={13} /> Add Address
            </button>
          )}
        </div>
        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        {addresses.length === 0 && (
          <div className="text-center py-16 border border-dashed border-brand-border">
            <p className="text-brand-muted text-sm">No addresses saved yet.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {addresses.map((addr) => {
            const zip = addr.postalCode || '';
            return (
              <div key={addr.id} className={`address-card border p-5 relative ${addr.isDefault ? 'border-brand-dark' : 'border-brand-border'}`}>
                {addr.isDefault && (
                  <span className="absolute top-3 right-3 text-[10px] bg-brand-dark text-white px-2 py-0.5 tracking-widest uppercase">Default</span>
                )}
                <p className="text-sm font-medium text-brand-dark mb-1">{addr.fullName}</p>
                <p className="text-xs text-brand-muted">{addr.addressLine1}</p>
                <p className="text-xs text-brand-muted">{addr.city}, {addr.state} {zip}</p>
                <p className="text-xs text-brand-muted">{addr.country}</p>
                {addr.phone && <p className="text-xs text-brand-muted">{addr.phone}</p>}

                <div className="flex gap-3 mt-4 pt-4 border-t border-brand-border">
                  <button onClick={() => setModal({ type: 'edit', addr })} className="flex items-center gap-1 text-xs text-brand-muted hover:text-brand-dark transition-colors">
                    <Edit2 size={11} /> Edit
                  </button>
                  {!addr.isDefault && (
                    <button onClick={() => handleSetDefault(addr)} className="flex items-center gap-1 text-xs text-brand-muted hover:text-brand-dark transition-colors">
                      <Check size={11} /> Set as Default
                    </button>
                  )}
                  <button onClick={() => setModal({ type: 'delete', addr })} className="flex items-center gap-1 text-xs text-brand-muted hover:text-red-500 transition-colors">
                    <Trash2 size={11} /> Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
          </div>
        </div>
      </div>

      {modal === 'add' && (
        <AddressModal title="Add New Address" onSave={handleAdd} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'edit' && (
        <AddressModal title="Edit Address" initial={toFormShape(modal.addr)} onSave={handleEdit} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'delete' && (
        <DeleteConfirmModal address={{ address: modal.addr.line1 || modal.addr.address || '' }} onConfirm={handleDelete} onClose={() => setModal(null)} />
      )}
    </main>
  );
}
