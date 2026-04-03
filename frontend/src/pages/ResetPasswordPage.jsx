import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { authService } from '../services/authService';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.id]: e.target.value });

  const requirements = [
    { label: 'At least 8 characters', met: form.password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(form.password) },
    { label: 'One number', met: /\d/.test(form.password) },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (form.password.length < 8) errs.password = 'Minimum 8 characters';
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    
    const uidb64 = searchParams.get('uidb64');
    const token = searchParams.get('token');
    
    if (!uidb64 || !token) {
      setErrors({ form: 'Invalid reset link. Missing parameters.' });
      return;
    }
    
    setLoading(true);
    try {
      await authService.resetPassword(uidb64, token, form.password);
      setDone(true);
    } catch (err) {
      setErrors({ form: err?.response?.data?.detail || 'Failed to reset password. Link may be expired.' });
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg px-6">
        <div className="w-full max-w-sm text-center">
          <Link to="/" className="font-serif text-xl tracking-widest2 uppercase text-brand-dark block mb-12">
            CURATED
          </Link>
          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={24} className="text-green-600" />
          </div>
          <h1 className="font-serif text-3xl font-light mb-2">Password Reset.</h1>
          <p className="text-sm text-brand-muted mb-8">
            Your password has been successfully updated. You can now sign in with your new password.
          </p>
          <Button variant="primary" onClick={() => navigate('/login')} className="w-full">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg px-6 py-16">
      <div className="w-full max-w-sm">
        <Link to="/" className="font-serif text-xl tracking-widest2 uppercase text-brand-dark block mb-12 text-center">
          CURATED
        </Link>

        <h1 className="font-serif text-3xl font-light text-brand-dark mb-2 text-center">Reset Password.</h1>
        <p className="text-sm text-brand-muted mb-8 text-center">
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs tracking-widest uppercase text-brand-muted font-medium">
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                className={`input-box w-full pr-12 ${errors.password ? 'border-red-400' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>

          {/* Password requirements */}
          <ul className="space-y-1">
            {requirements.map((r) => (
              <li key={r.label} className={`flex items-center gap-2 text-xs ${r.met ? 'text-green-600' : 'text-brand-muted'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${r.met ? 'bg-green-500' : 'bg-brand-border'}`} />
                {r.label}
              </li>
            ))}
          </ul>

          <Input
            id="confirm"
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            value={form.confirm}
            onChange={handleChange}
            error={errors.confirm}
          />
          {errors.form && <p className="text-xs text-red-500 text-center mt-2">{errors.form}</p>}

          <Button variant="primary" type="submit" className="w-full" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}
