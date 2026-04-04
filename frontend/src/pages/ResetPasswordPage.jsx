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

    const token = searchParams.get('token');
    if (!token) { setErrors({ form: 'Invalid reset link. Missing token.' }); return; }

    setLoading(true);
    try {
      await authService.resetPassword(token, form.password);
      setDone(true);
    } catch (err) {
      setErrors({ form: err?.response?.data?.detail || 'Failed to reset password. Link may be expired.' });
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex">
        <div className="hidden lg:block w-1/2 relative overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=80"
            alt="Editorial"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-brand-darker/30" />
          <div className="absolute bottom-12 left-12 text-white">
            <p className="section-label text-white/60 mb-2">Nordic Commerce</p>
            <h2 className="font-serif text-4xl font-light leading-tight">Quality<br />Over<br />Quantity</h2>
          </div>
        </div>
        <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-16 bg-brand-bg">
          <div className="w-full max-w-sm text-center">
            <Link to="/" className="font-serif text-xl tracking-widest2 uppercase text-brand-dark block mb-10">CURATED</Link>
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <h1 className="font-serif text-3xl font-light mb-2">Password Reset.</h1>
            <p className="text-sm text-brand-muted mb-8">
              Your password has been successfully updated. You can now sign in with your new password.
            </p>
            <Button variant="primary" onClick={() => navigate('/login')} className="w-full">Sign In</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — editorial image */}
      <div className="hidden lg:block w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=80"
          alt="Editorial"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-brand-darker/30" />
        <div className="absolute bottom-12 left-12 text-white">
          <p className="section-label text-white/60 mb-2">Nordic Commerce</p>
          <h2 className="font-serif text-4xl font-light leading-tight">Quality<br />Over<br />Quantity</h2>
          <p className="text-sm text-white/70 mt-3">Curated selections for the modern minimalist.<br />Designed in Stockholm, delivered globally.</p>
        </div>
      </div>

      {/* Right — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-16 bg-brand-bg">
        <div className="w-full max-w-sm">
          <Link to="/" className="font-serif text-xl tracking-widest2 uppercase text-brand-dark block mb-10">CURATED</Link>

          <h1 className="font-serif text-3xl font-light text-brand-dark mb-1">Reset Password.</h1>
          <p className="text-sm text-brand-muted mb-8">Enter your new password below.</p>

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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>

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

            {errors.form && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 text-sm text-red-600">
                {errors.form}
              </div>
            )}

            <Button variant="primary" type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? 'Resetting…' : 'Reset Password'}
            </Button>
          </form>

          <p className="text-center text-sm text-brand-muted mt-8">
            Remember your password?{' '}
            <Link to="/login" className="text-brand-dark underline underline-offset-2">Sign In</Link>
          </p>

          <div className="flex items-center justify-center gap-4 mt-10">
            {['Sustainability', 'Shipping', 'Returns', 'Contact', 'Privacy'].map((item) => (
              <Link key={item} to="#" className="text-[10px] text-brand-muted hover:text-brand-dark transition-colors">{item}</Link>
            ))}
          </div>
          <p className="text-center text-[10px] text-brand-muted mt-3">© 2024 Nordic Commerce. All Rights Reserved.</p>
        </div>
      </div>
    </div>
  );
}
