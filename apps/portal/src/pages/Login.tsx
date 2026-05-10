import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Phone, Mail, ArrowRight, Loader2 } from 'lucide-react';

type Mode = 'phone' | 'email';
type Step = 'input' | 'otp';

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('email');
  const [step, setStep] = useState<Step>('input');
  const [value, setValue] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

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
