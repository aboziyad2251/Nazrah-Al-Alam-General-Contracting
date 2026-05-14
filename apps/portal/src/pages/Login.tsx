import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Phone, Mail, ArrowRight, Loader2 } from 'lucide-react';

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

type Mode = 'phone' | 'email';
type Step = 'input' | 'otp';

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('email');
  const [step, setStep] = useState<Step>('input');
  const [value, setValue] = useState('');
  const [otp, setOtp] = useState('');
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
    const res =
      mode === 'email'
        ? await supabase.auth.signInWithOtp({ email: value })
        : await supabase.auth.signInWithOtp({
            phone: value.startsWith('+') ? value : `+966${value}`,
          });
    setLoading(false);
    if (res.error) {
      toast.error(res.error.message);
      return;
    }
    toast.success('OTP sent! Check your ' + mode);
    setStep('otp');
  };

  const verifyOtp = async () => {
    setLoading(true);
    const res =
      mode === 'email'
        ? await supabase.auth.verifyOtp({ email: value, token: otp, type: 'email' })
        : await supabase.auth.verifyOtp({
            phone: value.startsWith('+') ? value : `+966${value}`,
            token: otp,
            type: 'sms',
          });
    setLoading(false);
    if (res.error) {
      toast.error(res.error.message);
      return;
    }
    navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen bg-[#D9DCE0]">
      {/* Left panel */}
      <div className="hidden w-1/2 flex-col justify-between bg-[#0E1F3A] p-12 lg:flex">
        <div>
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8B339]">
            <span className="text-lg font-bold text-[#0E1F3A]">NA</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight text-white">Client Portal</h1>
          <p className="mt-3 text-lg text-white/60">
            Manage your equipment rentals, quotes, and invoices — all in one place.
          </p>
        </div>
        <div className="space-y-4">
          {['Active Rentals', 'Real-time Tracking', 'Instant Quotes'].map((f) => (
            <div key={f} className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-[#E8B339]" />
              <span className="text-sm text-white/80">{f}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-white/30">نظرة العالم للمقاولات العامة · جدة</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl border border-[#E8EAED] bg-white p-8 shadow-sm"
        >
          <h2 className="mb-1 text-2xl font-bold text-[#0F1117]">
            {step === 'input' ? 'Sign In' : 'Enter OTP'}
          </h2>
          <p className="mb-6 text-sm text-[#5A6573]">
            {step === 'input'
              ? 'Enter your email or phone to receive a one-time code.'
              : `We sent a code to ${value}. It expires in 10 minutes.`}
          </p>

          {step === 'input' && (
            <>
              {/* Google OAuth */}
              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={googleLoading}
                className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl border border-[#E8EAED] bg-white py-3 text-sm font-medium text-[#0F1117] transition-colors hover:bg-[#F5F6F7] disabled:opacity-50"
              >
                {googleLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                Continue with Google
              </button>

              <div className="mb-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-[#E8EAED]" />
                <span className="text-xs text-[#9AA3AF]">or</span>
                <div className="h-px flex-1 bg-[#E8EAED]" />
              </div>

              {/* Mode toggle */}
              <div className="mb-5 flex gap-2 rounded-lg bg-[#D9DCE0] p-1">
                {(['email', 'phone'] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-all ${
                      mode === m ? 'bg-white text-[#0E1F3A] shadow-sm' : 'text-[#5A6573]'
                    }`}
                  >
                    {m === 'email' ? <Mail size={14} /> : <Phone size={14} />}
                    {m === 'email' ? 'Email' : 'Phone'}
                  </button>
                ))}
              </div>

              <input
                type={mode === 'email' ? 'email' : 'tel'}
                placeholder={mode === 'email' ? 'you@company.com' : '05x xxx xxxx'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
                className="mb-4 w-full rounded-xl border border-[#E8EAED] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0E1F3A]"
              />

              <button
                onClick={sendOtp}
                disabled={loading || !value}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0E1F3A] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0A1628] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <span>Send Code</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </>
          )}

          {step === 'otp' && (
            <>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && verifyOtp()}
                className="mb-4 w-full rounded-xl border border-[#E8EAED] px-4 py-3 text-center text-sm tracking-widest outline-none focus:ring-2 focus:ring-[#0E1F3A]"
              />
              <button
                onClick={verifyOtp}
                disabled={loading || otp.length < 6}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0E1F3A] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0A1628] disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Verify & Sign In'}
              </button>
              <button
                onClick={() => setStep('input')}
                className="mt-3 w-full text-center text-sm text-[#5A6573] hover:text-[#0E1F3A]"
              >
                ← Back
              </button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
