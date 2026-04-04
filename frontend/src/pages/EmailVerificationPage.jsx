import { useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { getPostLoginRoute } from '../utils/authRedirect';

export default function EmailVerificationPage() {
  const { completeVerification } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const identifier = searchParams.get('identifier') || '';
  const type = searchParams.get('type') || 'email'; // 'email' | 'phone'

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verified, setVerified] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const refs = useRef([]);

  const handleChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const updated = [...otp];
    updated[idx] = val;
    setOtp(updated);
    setError('');
    if (val && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(''));
      refs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter the complete 6-digit code.'); return; }
    setLoading(true);
    try {
      const data = await completeVerification({
        email: type === 'email' ? identifier : undefined,
        phoneNumber: type === 'phone' ? identifier : undefined,
        code,
      });
      setVerifiedUser(data.user);
      setVerified(true);
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Invalid or expired code. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (verified) {
    const nextRoute = getPostLoginRoute(verifiedUser);
    const ctaLabel = verifiedUser?.isStaff ? 'Open Admin Dashboard' : 'Start Shopping';

    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg px-6">
        <div className="w-full max-w-sm text-center">
          <Link to="/" className="font-serif text-xl tracking-widest2 uppercase text-brand-dark block mb-12">
            CURATED
          </Link>
          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={24} className="text-green-600" />
          </div>
          <h1 className="font-serif text-3xl font-light mb-2">Verified.</h1>
          <p className="text-sm text-brand-muted mb-8">
            Your account has been confirmed. Welcome to the collective.
          </p>
          <Button variant="primary" onClick={() => navigate(nextRoute)} className="w-full">
            {ctaLabel}
          </Button>
        </div>
      </div>
    );
  }

  const displayIdentifier = type === 'email' ? identifier : identifier;
  const label = type === 'email' ? 'email address' : 'mobile number';

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg px-6 py-16">
      <div className="w-full max-w-sm">
        <Link to="/" className="font-serif text-xl tracking-widest2 uppercase text-brand-dark block mb-12 text-center">
          CURATED
        </Link>

        <h1 className="font-serif text-3xl font-light text-brand-dark mb-2 text-center">
          Verify your account.
        </h1>
        <p className="text-sm text-brand-muted mb-2 text-center">
          We sent a 6-digit code to your {label}.
        </p>
        <p className="text-sm font-medium text-brand-dark mb-8 text-center">
          {displayIdentifier}
        </p>

        <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (refs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`w-12 h-14 text-center text-xl font-medium border ${
                digit ? 'border-brand-dark' : 'border-brand-border'
              } bg-white focus:outline-none focus:border-brand-dark transition-colors`}
            />
          ))}
        </div>

        {error && <p className="text-xs text-red-500 text-center mb-4">{error}</p>}

        <Button variant="primary" className="w-full" onClick={handleVerify} disabled={loading}>
          {loading ? 'Verifying…' : `Verify ${type === 'email' ? 'Email' : 'Mobile Number'}`}
        </Button>

        <p className="text-center text-sm text-brand-muted mt-6">
          Didn't receive it?{' '}
          <button className="text-brand-dark underline underline-offset-2">
            Resend code
          </button>
        </p>
      </div>
    </div>
  );
}
