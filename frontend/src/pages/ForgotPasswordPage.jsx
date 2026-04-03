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

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg px-6 py-16">
      <div className="w-full max-w-sm">
        <Link to="/" className="font-serif text-xl tracking-widest2 uppercase text-brand-dark block mb-12 text-center">
          CURATED
        </Link>

        {!sent ? (
          <>
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-brand-dark/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={20} className="text-brand-dark" />
              </div>
              <h1 className="font-serif text-3xl font-light text-brand-dark mb-2">Forgot Password?</h1>
              <p className="text-sm text-brand-muted leading-relaxed">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

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
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
              <Button variant="primary" type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={20} className="text-green-600" />
            </div>
            <h1 className="font-serif text-3xl font-light text-brand-dark mb-2">Check your inbox.</h1>
            <p className="text-sm text-brand-muted leading-relaxed mb-6">
              We sent a password reset link to <span className="font-medium text-brand-dark">{email}</span>.
              Check your spam folder if you don't see it.
            </p>
            <Button
              variant="outline"
              type="button"
              className="w-full mb-4"
              onClick={() => setSent(false)}
            >
              Try a different email
            </Button>
          </div>
        )}

        <div className="text-center mt-8">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-brand-muted hover:text-brand-dark transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
