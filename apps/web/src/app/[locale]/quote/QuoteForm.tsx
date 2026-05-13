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
      <div
        role="alert"
        aria-live="polite"
        className="flex items-center gap-3 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3 text-gold"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5 shrink-0"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>{t('success')}</span>
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
          <label
            htmlFor="name"
            className="mb-1.5 block font-poppins text-xs font-semibold text-navy"
          >
            {tf('name')} *
          </label>
          <input
            id="name"
            required
            name="name"
            value={form.name}
            onChange={handleChange}
            className={inputCls}
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block font-poppins text-xs font-semibold text-navy"
          >
            {tf('email')} *
          </label>
          <input
            id="email"
            required
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className={inputCls}
          />
        </div>
        <div>
          <label
            htmlFor="phone"
            className="mb-1.5 block font-poppins text-xs font-semibold text-navy"
          >
            {tf('phone')}
          </label>
          <input
            id="phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className={inputCls}
          />
        </div>
        <div>
          <label
            htmlFor="company"
            className="mb-1.5 block font-poppins text-xs font-semibold text-navy"
          >
            {tf('company')}
          </label>
          <input
            id="company"
            name="company"
            value={form.company}
            onChange={handleChange}
            className={inputCls}
          />
        </div>
        <div>
          <label
            htmlFor="projectType"
            className="mb-1.5 block font-poppins text-xs font-semibold text-navy"
          >
            {tf('projectType')}
          </label>
          <select
            id="projectType"
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
          <label
            htmlFor="location"
            className="mb-1.5 block font-poppins text-xs font-semibold text-navy"
          >
            {tf('location')}
          </label>
          <input
            id="location"
            name="location"
            value={form.location}
            onChange={handleChange}
            className={inputCls}
          />
        </div>
        <div>
          <label
            htmlFor="equipment"
            className="mb-1.5 block font-poppins text-xs font-semibold text-navy"
          >
            {tf('equipment')}
          </label>
          <input
            id="equipment"
            name="equipment"
            value={form.equipment}
            onChange={handleChange}
            className={inputCls}
          />
        </div>
        <div>
          <label
            htmlFor="duration"
            className="mb-1.5 block font-poppins text-xs font-semibold text-navy"
          >
            {tf('duration')}
          </label>
          <input
            id="duration"
            name="duration"
            value={form.duration}
            onChange={handleChange}
            className={inputCls}
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="message"
          className="mb-1.5 block font-poppins text-xs font-semibold text-navy"
        >
          {tf('message')}
        </label>
        <textarea
          id="message"
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
