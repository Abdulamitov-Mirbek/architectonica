import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { Onest, Unbounded } from 'next/font/google';
import { dict, htmlLang, locales, type Locale } from '@/content/site';
import '../globals.css';

const unbounded = Unbounded({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'],
  variable: '--font-unbounded',
  display: 'swap',
});
const onest = Onest({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'],
  variable: '--font-onest',
  display: 'swap',
});

export const dynamicParams = false;
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

/**
 * Absolute base for Open Graph images and alternate links.
 * Set NEXT_PUBLIC_SITE_URL once the domain is known; on Vercel the production URL is used until then.
 */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

const isLocale = (v: string): v is Locale => (locales as readonly string[]).includes(v);

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = dict[lang].meta;
  return {
    metadataBase: new URL(siteUrl),
    title: t.title,
    description: t.description,
    alternates: { languages: { ru: '/ru', ky: '/kg' } },
    openGraph: { title: t.title, description: t.description, images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Architectonica' }] },
    twitter: { card: 'summary_large_image', images: ['/og.png'] },
  };
}

export const viewport: Viewport = { themeColor: '#0e2036' };

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return (
    <html lang={htmlLang[lang]} className={`${unbounded.variable} ${onest.variable}`}>
      <body>{children}</body>
    </html>
  );
}
