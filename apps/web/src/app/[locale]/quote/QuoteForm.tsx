'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export function QuoteForm({ locale }: { locale: string }) {
  const t = useTranslations('quote');
  const tf = useTranslations('quote.fields');
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    projectType: '',
    location: '',
    equipment: '',
    duration: '',
    message: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('loading');
    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, locale }),
      });
      setState(res.ok ? 'success' : 'error');
    } catch {
      setState('error');
    }
  };

  const projectTypes = t.raw('projectTypes') as string[];
  const inputCls =
    'w-full rounded-xl border-2 border-navy/10 bg-white px-4 py-3 text-sm text-navy focus:border-gold focus:outline-none transition-colors font-poppins';

  if (state === 'success') {
    return (
      <div className="rounded-2xl border-2 border-gold/30 bg-white p-10 text-center">
        <div className="mb-4 text-5xl">✅</div>
        <h3 className="font-poppins text-xl font-bold text-navy">{t('success')}</h3>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-navy/8 space-y-5 rounded-3xl border-2 bg-white p-8 shadow-sm"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block font-poppins text-xs font-semibold text-navy">
            {tf('name')} *
          </label>
          <input
            required
            name="name"
            value={form.name}
            onChange={handleChange}
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1.5 block font-poppins text-xs font-semibold text-navy">
            {tf('email')} *
          </label>
          <input
            required
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1.5 block font-poppins text-xs font-semibold text-navy">
            {tf('phone')}
          </label>
          <input name="phone" value={form.phone} onChange={handleChange} className={inputCls} />
        </div>
        <div>
          <label className="mb-1.5 block font-poppins text-xs font-semibold text-navy">
            {tf('company')}
          </label>
          <input name="company" value={form.company} onChange={handleChange} className={inputCls} />
        </div>
        <div>
          <label className="mb-1.5 block font-poppins text-xs font-semibold text-navy">
            {tf('projectType')}
          </label>
          <select
            name="projectType"
            value={form.projectType}
            onChange={handleChange}
            className={inputCls}
          >
            <option value="">—</option>
            {projectTypes.map((pt) => (
              <option key={pt} value={pt}>
                {pt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block font-poppins text-xs font-semibold text-navy">
            {tf('location')}
          </label>
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1.5 block font-poppins text-xs font-semibold text-navy">
            {tf('equipment')}
          </label>
          <input
            name="equipment"
            value={form.equipment}
            onChange={handleChange}
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1.5 block font-poppins text-xs font-semibold text-navy">
            {tf('duration')}
          </label>
          <input
            name="duration"
            value={form.duration}
            onChange={handleChange}
            className={inputCls}
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block font-poppins text-xs font-semibold text-navy">
          {tf('message')}
        </label>
        <textarea
          name="message"
          rows={4}
          value={form.message}
          onChange={handleChange}
          className={inputCls}
        />
      </div>

      {state === 'error' && <p className="font-poppins text-sm text-red-600">{t('error')}</p>}

      <button
        type="submit"
        disabled={state === 'loading'}
        className="w-full rounded-xl bg-gold py-4 font-poppins text-base font-bold text-navy transition-colors hover:bg-gold-soft disabled:opacity-50"
      >
        {state === 'loading' ? '…' : tf('submit')}
      </button>
    </form>
  );
}
