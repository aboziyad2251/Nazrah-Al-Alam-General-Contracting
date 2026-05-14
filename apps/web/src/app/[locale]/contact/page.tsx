import { getTranslations } from 'next-intl/server';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return { title: t('title') };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });

  const items = [
    { icon: '📞', label: t('phone'), href: 'tel:+966599810888', value: '+966 59 981 0888' },
    {
      icon: '✉️',
      label: 'Email',
      href: 'mailto:Nazaralalam@gmail.com',
      value: 'Nazaralalam@gmail.com',
    },
    {
      icon: '✉️',
      label: 'Email 2',
      href: 'mailto:Chaudharyjaber@gmail.com',
      value: 'Chaudharyjaber@gmail.com',
    },
    {
      icon: '📍',
      label: locale === 'ar' ? 'العنوان' : 'Address',
      href: '#map',
      value: t('address'),
    },
  ];

  return (
    <>
      <div className="bg-navy pb-20 pt-32">
        <div className="container-section">
          <p className="mb-4 font-poppins text-xs font-bold uppercase tracking-[0.25em] text-gold">
            {t('eyebrow')}
          </p>
          <h1 className="font-poppins text-4xl font-extrabold text-white md:text-5xl">
            {t('title')}
            <span className="mt-3 block h-1.5 w-16 rounded-full bg-gold" />
          </h1>
          <p className="mt-4 text-cloud/70">{t('subtitle')}</p>
        </div>
      </div>

      <section className="section-padding bg-cloud">
        <div className="container-section grid gap-12 lg:grid-cols-2">
          {/* Contact info */}
          <div className="space-y-5">
            {items.map((item) => (
              <a
                key={item.value}
                href={item.href}
                className="border-navy/8 group flex items-start gap-4 rounded-2xl border-2 bg-white p-6 shadow-sm transition-colors hover:border-gold/50"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy text-xl">
                  {item.icon}
                </div>
                <div>
                  <p className="font-poppins text-xs font-semibold text-ink-500">{item.label}</p>
                  <p className="font-poppins font-bold text-navy transition-colors group-hover:text-gold">
                    {item.value}
                  </p>
                </div>
              </a>
            ))}

            {/* WhatsApp */}
            <a
              href="https://wa.me/966599810888"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl bg-[#25D366] px-6 py-4 font-poppins font-bold text-white shadow-sm transition-colors hover:bg-[#1ebe5d]"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              {t('whatsapp')}
            </a>
          </div>

          {/* Map */}
          <div
            id="map"
            className="min-h-[400px] overflow-hidden rounded-3xl border-2 border-navy/10 shadow-navy-md"
          >
            <iframe
              title={t('mapTitle')}
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3711.123456789!2d39.1728!3d21.5433!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x15c3cf5a0b0b0b0b%3A0x0!2sAl+Aqsa+Business+Park%2C+Jeddah!5e0!3m2!1sen!2ssa!4v1700000000000!5m2!1sen!2ssa"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: 400 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>
    </>
  );
}
