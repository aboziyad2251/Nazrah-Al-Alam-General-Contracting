import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);

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
