import React from 'react';
import Link from 'next/link';
import { BrandLogo } from '@nazrah/ui';

interface FooterProps {
  locale: string;
}

export function Footer({ locale }: FooterProps) {
  const isAr = locale === 'ar';

  const cols = [
    {
      title: isAr ? 'التنقل' : 'Navigation',
      links: [
        { label: isAr ? 'الرئيسية' : 'Home', href: `/${locale}` },
        { label: isAr ? 'من نحن' : 'About', href: `/${locale}/about` },
        { label: isAr ? 'المعدات' : 'Equipment', href: `/${locale}/equipment` },
        { label: isAr ? 'الخدمات' : 'Services', href: `/${locale}/services` },
        { label: isAr ? 'المشاريع' : 'Projects', href: `/${locale}/projects` },
      ],
    },
    {
      title: isAr ? 'الخدمات' : 'Services',
      links: [
        { label: isAr ? 'الأعمال المدنية' : 'Civil Works', href: `/${locale}/services` },
        { label: isAr ? 'الهندسة الميكانيكية' : 'Mechanical', href: `/${locale}/services` },
        { label: isAr ? 'الأنظمة الكهربائية' : 'Electrical', href: `/${locale}/services` },
        { label: isAr ? 'البنية التحتية' : 'Infrastructure', href: `/${locale}/services` },
        { label: isAr ? 'تأجير المعدات' : 'Equipment Rental', href: `/${locale}/equipment` },
      ],
    },
    {
      title: isAr ? 'تواصل معنا' : 'Contact',
      links: [
        { label: '+966 59 981 0888', href: 'tel:+966599810888' },
        { label: 'Nazaralalam@gmail.com', href: 'mailto:Nazaralalam@gmail.com' },
        {
          label: isAr ? 'جدة، المملكة العربية السعودية' : 'Jeddah, Saudi Arabia',
          href: `/${locale}/contact`,
        },
        { label: isAr ? 'واتساب' : 'WhatsApp', href: 'https://wa.me/966599810888' },
      ],
    },
  ];

  return (
    <footer className="bg-navy-deep text-cloud/80">
      <div className="container-section py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div>
            <BrandLogo theme="dark" size="md" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-cloud/60">
              {isAr
                ? 'شركة مقاولات عامة رائدة في جدة، المملكة العربية السعودية منذ عام 1999.'
                : 'Leading general contracting firm in Jeddah, Saudi Arabia since 1999.'}
            </p>
            <a
              href="https://wa.me/966599810888"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-whatsapp px-4 py-2.5 font-poppins text-sm font-semibold text-white transition-colors hover:bg-whatsapp-hover"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              {isAr ? 'واتساب' : 'WhatsApp'}
            </a>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 font-poppins text-sm font-semibold uppercase tracking-widest text-gold">
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-cloud/60 transition-colors hover:text-gold"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-cloud/40 sm:flex-row">
          <p>
            © 2024 Nazrah Al Alam General Contracting.{' '}
            {isAr ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
          </p>
          <div className="flex gap-4">
            <Link href={`/${locale}`} className="transition-colors hover:text-gold">
              {isAr ? 'الرئيسية' : 'Home'}
            </Link>
            <Link href={`/${locale}/contact`} className="transition-colors hover:text-gold">
              {isAr ? 'اتصل بنا' : 'Contact'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
