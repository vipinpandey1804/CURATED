import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { authService } from '../services/authService';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      await authService.requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to send password reset link.');
    } finally {
      setLoading(false);
    }
  };

  const leftPanel = (
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
  );

  return (
    <div className="min-h-screen flex">
      {leftPanel}

      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 py-16 bg-brand-bg">
        <div className="w-full max-w-sm">
          <Link to="/" className="font-serif text-xl tracking-widest2 uppercase text-brand-dark block mb-10">CURATED</Link>

          {!sent ? (
            <>
              <div className="mb-8">
                <div className="w-12 h-12 bg-brand-dark/5 rounded-full flex items-center justify-center mb-4">
                  <Mail size={20} className="text-brand-dark" />
                </div>
                <h1 className="font-serif text-3xl font-light text-brand-dark mb-1">Forgot Password?</h1>
                <p className="text-sm text-brand-muted leading-relaxed">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              {error && (
                <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  id="email"
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  required
                />
                <Button variant="primary" type="submit" className="w-full mt-2" disabled={loading}>
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4">
                <Mail size={20} className="text-green-600" />
              </div>
              <h1 className="font-serif text-3xl font-light text-brand-dark mb-1">Check your inbox.</h1>
              <p className="text-sm text-brand-muted leading-relaxed mb-8">
                We sent a password reset link to <span className="font-medium text-brand-dark">{email}</span>.
                Check your spam folder if you don't see it.
              </p>
              <Button variant="outline" type="button" className="w-full" onClick={() => setSent(false)}>
                Try a different email
              </Button>
            </>
          )}

          <div className="mt-8">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-brand-muted hover:text-brand-dark transition-colors"
            >
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>

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
