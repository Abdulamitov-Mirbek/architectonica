import { dict, type Locale } from '@/content/site';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { Gallery } from '@/components/Gallery';
import { Market, Experience, Health, Code7, Founder, Faq, Path } from '@/components/Sections';
import { Earth } from '@/components/Earth';
import { LeadForm } from '@/components/LeadForm';
import { SmoothScroll } from '@/components/SmoothScroll';

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const lang = (await params).lang as Locale;
  const t = dict[lang];
  return (
    <>
      <SmoothScroll />
      <Header lang={lang} t={t} />
      <main>
        <Hero t={t} />
        <Gallery t={t} />
        <Market t={t.market} />
        <Experience t={t.world} />
        <Health t={t.health} />
        <Earth t={t.earth} ui={t.ui} />
        <Code7 t={t.code} />
        <Founder t={t.founder} />
        <Faq t={t.faq} />
        <Path t={t.path} />
        <LeadForm t={t} />
      </main>
    </>
  );
}
