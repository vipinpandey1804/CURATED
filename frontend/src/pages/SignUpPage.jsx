import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function SignUpPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('email'); // 'email' | 'phone'
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phoneNumber: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.id]: e.target.value });

  const validate = () => {
    const errs = {};
    if (!form.firstName) errs.firstName = 'Required';
    if (!form.lastName) errs.lastName = 'Required';
    if (mode === 'email' && !form.email) errs.email = 'Required';
    if (mode === 'phone' && !form.phoneNumber) errs.phoneNumber = 'Required';
    if (form.password.length < 8) errs.password = 'Minimum 8 characters';
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const result = await signup({
        email: mode === 'email' ? form.email : undefined,
        phoneNumber: mode === 'phone' ? form.phoneNumber : undefined,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
      });
      // Navigate to OTP verification page with identifier in URL
      const identifier = result.identifier;
      const type = result.identifierType;
      navigate(`/verify-email?identifier=${encodeURIComponent(identifier)}&type=${type}`);
    } catch (err) {
      const data = err?.response?.data ?? {};
      const msg = data.email?.[0] || data.phoneNumber?.[0] || data.nonFieldErrors?.[0] || data.detail || 'Registration failed. Please try again.';
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left */}
      <div className="hidden lg:block w-1/2 relative overflow-hidden">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsfmZxq_H9UT2nN21kDpOSHSeU7vdoAjDiLqEEIT0nQtFMeodannKLVLHBXc9aHFJcyFMUvSkxcdyX_h6Cqw0M4oIEdMysjy6Xz6wJJLxCO83g8J8URGzgoraJ_y9dwlV9uwoJJs1U4cAR4BdBrK4AXIp7-Cg0hIZwXjofjeTW7y8SEwpf_I_Ys0eI9hbZxLkFsLCr_9dKmoT_mj5uYBbrxcJYWa3WqwPZ-7MG_AduJ-KsVE0CmHFQbTD-QLFP7Avt60vUWIdCXw"
          alt="Curated editorial"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-brand-darker/30" />
        <div className="absolute bottom-12 left-12 text-white">
          <p className="section-label text-white/60 mb-2">A/W 2024</p>
          <h2 className="font-serif text-4xl font-light leading-tight">
            The New<br/>Minimalism.
          </h2>
          <p className="text-sm text-white/70 mt-3 max-w-xs">
            Join the collective and receive early access to seasonal drops and exclusive editorial content.
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-16 bg-brand-bg overflow-y-auto">
        <div className="w-full max-w-sm">
          <Link to="/" className="font-serif text-xl tracking-widest2 uppercase text-brand-dark block mb-10">
            CURATED
          </Link>

          <h1 className="font-serif text-3xl font-light text-brand-dark mb-1">Create Account.</h1>
          <p className="text-sm text-brand-muted mb-6">Join the collective today.</p>

          {/* Mode toggle */}
          <div className="flex rounded border border-brand-border mb-6 overflow-hidden">
            <button
              type="button"
              onClick={() => setMode('email')}
              className={`flex-1 py-2 text-xs font-medium tracking-widest uppercase transition-colors ${
                mode === 'email' ? 'bg-brand-dark text-white' : 'bg-transparent text-brand-muted hover:text-brand-dark'
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setMode('phone')}
              className={`flex-1 py-2 text-xs font-medium tracking-widest uppercase transition-colors ${
                mode === 'phone' ? 'bg-brand-dark text-white' : 'bg-transparent text-brand-muted hover:text-brand-dark'
              }`}
            >
              Mobile Number
            </button>
          </div>

          {errors.general && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-sm text-red-600">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="firstName"
                label="First Name"
                placeholder="Alex"
                value={form.firstName}
                onChange={handleChange}
                error={errors.firstName}
              />
              <Input
                id="lastName"
                label="Last Name"
                placeholder="Harrison"
                value={form.lastName}
                onChange={handleChange}
                error={errors.lastName}
              />
            </div>

            {mode === 'email' ? (
              <Input
                id="email"
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                error={errors.email}
                autoComplete="email"
              />
            ) : (
              <Input
                id="phoneNumber"
                label="Mobile Number"
                type="tel"
                placeholder="+1 555 000 0000"
                value={form.phoneNumber}
                onChange={handleChange}
                error={errors.phoneNumber}
                autoComplete="tel"
              />
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs tracking-widest uppercase text-brand-muted font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
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

            <Input
              id="confirm"
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={form.confirm}
              onChange={handleChange}
              error={errors.confirm}
            />

            <p className="text-xs text-brand-muted leading-relaxed">
              By creating an account, you agree to our{' '}
              <Link to="#" className="underline">Terms of Service</Link> and{' '}
              <Link to="#" className="underline">Privacy Policy</Link>.
            </p>

            <Button variant="primary" type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-brand-bg px-4 text-xs text-brand-muted">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" type="button">Google</Button>
            <Button variant="outline" type="button">Apple</Button>
          </div>

          <p className="text-center text-sm text-brand-muted mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-dark underline underline-offset-2">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
