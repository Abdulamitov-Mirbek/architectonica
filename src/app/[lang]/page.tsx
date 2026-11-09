import { dict, type Locale } from '@/content/site';
import { Header } from '@/components/Header';
import { Story } from '@/components/Story';
import { Projects } from '@/components/Projects';
import { Contact } from '@/components/Contact';

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const lang = (await params).lang as Locale;
  const t = dict[lang];
  return (
    <>
      <Header lang={lang} t={t.nav} />
      <main>
        <Story hero={t.hero} tech={t.tech} />
        <Projects t={t.projects} cta={t.hero.secondary} />
        <Contact t={t} />
      </main>
    </>
  );
}
