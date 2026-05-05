import { getDirection } from '@nazrah/i18n';
import type { Locale } from '@nazrah/types';
import { RTLProvider, BrandLogo, LangSwitcher, ChevronArrow } from '@nazrah/ui';
import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { DashboardPage } from './pages/DashboardPage';

export function App() {
  const [locale, setLocale] = useState<Locale>('en');
  const dir = getDirection(locale);

  // Sync dir on html element for Tailwind RTL utilities
  document.documentElement.lang = locale;
  document.documentElement.dir = dir;

  return (
    <RTLProvider locale={locale}>
      <div dir={dir} className="min-h-screen bg-stone">
        {/* Sidebar */}
        <aside className="portal-sidebar flex flex-col">
          <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
            <BrandLogo theme="dark" size="sm" />
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {[
              {
                label: locale === 'ar' ? 'لوحة التحكم' : 'Dashboard',
                icon: '⬡',
                href: '/dashboard',
              },
              { label: locale === 'ar' ? 'المشاريع' : 'Projects', icon: '⬡', href: '/projects' },
              { label: locale === 'ar' ? 'الخدمات' : 'Services', icon: '⬡', href: '/services' },
              { label: locale === 'ar' ? 'المعدات' : 'Equipment', icon: '⬡', href: '/equipment' },
              { label: locale === 'ar' ? 'الفريق' : 'Team', icon: '⬡', href: '/team' },
              { label: locale === 'ar' ? 'الإعدادات' : 'Settings', icon: '⬡', href: '/settings' },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-poppins text-sm font-medium text-cloud/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <ChevronArrow size={14} colorClass="text-gold" />
                {label}
              </a>
            ))}
          </nav>

          <div className="border-t border-white/10 p-4">
            <LangSwitcher
              currentLocale={locale}
              onSwitch={setLocale}
              className="w-full justify-center border-white/30 text-white"
            />
          </div>
        </aside>

        {/* Main content */}
        <main className="portal-main">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage locale={locale} />} />
          </Routes>
        </main>
      </div>
    </RTLProvider>
  );
}
