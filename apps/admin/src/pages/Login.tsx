import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const signInWithGoogle = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
    }
  };

  const sendOtp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    toast.success('OTP sent to ' + email);
    setStep('otp');
    setLoading(false);
  };

  const verifyOtp = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user!.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      await supabase.auth.signOut();
      toast.error('Access denied. Admin role required.');
      setLoading(false);
      setStep('email');
      return;
    }

    navigate('/overview', { replace: true });
  };

  return (
    <div className="bg-sidebar flex h-screen items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy">
            <span className="text-xl font-black text-gold">N</span>
          </div>
        </div>
        <h1 className="text-center text-xl font-bold text-ink-900">Admin Access</h1>
        <p className="mb-6 mt-1 text-center text-sm text-ink-500">
          Nazrah Al Alam — Internal Panel
        </p>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={googleLoading}
          className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl border border-cloud bg-white py-3 text-sm font-medium text-ink-900 transition-colors hover:bg-cloud disabled:opacity-50"
        >
          {googleLoading ? <Loader2 size={16} className="animate-spin" /> : <GoogleIcon />}
          Continue with Google
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-cloud" />
          <span className="text-xs text-ink-400">or use email OTP</span>
          <div className="h-px flex-1 bg-cloud" />
        </div>

        {step === 'email' ? (
          <div>
            <label className="text-ink-700 mb-1 block text-xs font-semibold">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
              placeholder="admin@nazrahalalam.sa"
              className="mb-4 w-full rounded-xl border border-cloud px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
            />
            <button
              onClick={sendOtp}
              disabled={!email || loading}
              className="hover:bg-navy-light w-full rounded-xl bg-navy py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-3 text-sm text-ink-500">
              Enter the 6-digit code sent to <strong>{email}</strong>
            </p>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => e.key === 'Enter' && verifyOtp()}
              placeholder="000000"
              maxLength={6}
              className="mb-4 w-full rounded-xl border border-cloud px-4 py-3 text-center text-sm text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-navy/30"
            />
            <button
              onClick={verifyOtp}
              disabled={otp.length < 6 || loading}
              className="hover:bg-navy-light w-full rounded-xl bg-navy py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying…' : 'Verify & Enter'}
            </button>
            <button
              onClick={() => setStep('email')}
              className="mt-2 w-full py-2 text-sm text-ink-500 hover:text-ink-900"
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
