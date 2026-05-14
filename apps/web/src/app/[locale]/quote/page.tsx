import { getTranslations } from 'next-intl/server';
import { QuoteForm } from './QuoteForm';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'quote' });
  return { title: t('title') };
}

export default async function QuotePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'quote' });

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
        <div className="container-section mx-auto max-w-3xl">
          <QuoteForm locale={locale} />
        </div>
      </section>
    </>
  );
}
