import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { getPostLoginRoute } from '../utils/authRedirect';

export default function LoginPage() {
  const { login, googleLogin, user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('email'); // 'email' | 'phone'
  const [form, setForm] = useState({ email: '', phoneNumber: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.id]: e.target.value });

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(getPostLoginRoute(user), { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate, user]);

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      const data = await googleLogin(credentialResponse.credential);
      navigate(getPostLoginRoute(data.user), { replace: true });
    } catch {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const identifier = mode === 'email' ? form.email : form.phoneNumber;
    if (!identifier || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await login({
        email: mode === 'email' ? form.email : undefined,
        phoneNumber: mode === 'phone' ? form.phoneNumber : undefined,
        password: form.password,
      });
      navigate(getPostLoginRoute(data.user), { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.detail
        || err?.response?.data?.nonFieldErrors?.[0]
        || 'Invalid credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — editorial image */}
      <div className="hidden lg:block w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=80"
          alt="Nordic Interior Aesthetic"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-brand-darker/30" />
        <div className="absolute bottom-12 left-12 text-white">
          <p className="section-label text-white/60 mb-2">Nordic Commerce</p>
          <h2 className="font-serif text-4xl font-light leading-tight">
            Quality<br/>Over<br/>Quantity
          </h2>
          <p className="text-sm text-white/70 mt-3">
            Curated selections for the modern minimalist.<br />Designed in Stockholm, delivered globally.
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-16 bg-brand-bg">
        <div className="w-full max-w-sm">
          <Link to="/" className="font-serif text-xl tracking-widest2 uppercase text-brand-dark block mb-10">
            CURATED
          </Link>

          <h1 className="font-serif text-3xl font-light text-brand-dark mb-1">Welcome back.</h1>
          <p className="text-sm text-brand-muted mb-6">Sign in to your account to continue.</p>

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

          {error && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'email' ? (
              <Input
                id="email"
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
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
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  className="input-box w-full pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="text-right">
                <Link to="/forgot-password" className="text-xs text-brand-muted hover:text-brand-dark transition-colors">
                  Forgot Password?
                </Link>
              </div>
            </div>

            <Button variant="primary" type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
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

          <div className="flex flex-col items-center gap-3">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign-in failed. Please try again.')}
              width="100%"
              text="continue_with"
              shape="rectangular"
              theme="outline"
            />
          </div>

          <p className="text-center text-sm text-brand-muted mt-8">
            New to Nordic?{' '}
            <Link to="/signup" className="text-brand-dark underline underline-offset-2">
              Create Account
            </Link>
          </p>

          <div className="flex items-center justify-center gap-4 mt-10">
            {['Sustainability', 'Shipping', 'Returns', 'Contact', 'Privacy'].map((item) => (
              <Link key={item} to="#" className="text-[10px] text-brand-muted hover:text-brand-dark transition-colors">
                {item}
              </Link>
            ))}
          </div>
          <p className="text-center text-[10px] text-brand-muted mt-3">
            © 2024 Nordic Commerce. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
