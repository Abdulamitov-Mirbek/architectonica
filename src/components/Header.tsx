'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Logo } from './Logo';
import { contacts, locales, type Locale, type SiteDict } from '@/content/site';

const SECTIONS = ['projects', 'market', 'world', 'faq'] as const;
type Section = (typeof SECTIONS)[number];

export function Header({ lang, t }: { lang: Locale; t: SiteDict }) {
  const [active, setActive] = useState<Section | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const els = SECTIONS.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id as Section);
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('lenis-stopped', open);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const links = SECTIONS.map((id) => ({ id, label: t.nav[id] }));

  const langSwitch = (
    <div className="flex items-center gap-1 text-sm">
      {locales.map((l) => (
        <Link
          key={l}
          href={`/${l}`}
          hrefLang={l === 'kg' ? 'ky' : 'ru'}
          aria-current={l === lang ? 'true' : undefined}
          className={`rounded px-2.5 py-1.5 font-medium transition-colors ${l === lang ? 'bg-white/12 text-white' : 'text-haze hover:text-white'}`}
        >
          {l.toUpperCase()}
        </Link>
      ))}
    </div>
  );

  return (
    <header className="roofline fixed inset-x-0 top-0 z-50 text-white">
      {/* top bar from the landing: what the company is + direct contacts */}
      <div className="hidden border-b border-white/8 lg:block">
        <div className="mx-auto flex h-8 max-w-[90rem] items-center gap-6 px-8 text-[0.8rem] text-haze">
          <span>{t.topbar}</span>
          <span className="ml-auto flex items-center gap-5">
            <a href={contacts.phoneHref} className="hover:text-white">
              {contacts.phone}
            </a>
            <a href={`mailto:${contacts.email}`} className="hover:text-white">
              {contacts.email}
            </a>
            <a href={contacts.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">
              {contacts.instagramHandle}
            </a>
          </span>
        </div>
      </div>

      <div className="mx-auto flex h-16 max-w-[90rem] items-center gap-6 px-4 pb-0.5 sm:px-8">
        <a href="#home" className="shrink-0 text-white" aria-label="7A Architectonica">
          <Logo variant="horizontal" className="h-7 w-auto sm:h-8" />
        </a>

        <nav className="ml-auto hidden lg:block" aria-label="Main">
          <ul className="flex items-center gap-1">
            {links.map((l) => (
              <li key={l.id}>
                <a
                  href={`#${l.id}`}
                  aria-current={active === l.id ? 'location' : undefined}
                  className={`relative block px-3 py-2 text-[0.95rem] transition-colors ${active === l.id ? 'text-white' : 'text-haze hover:text-white'}`}
                >
                  {l.label}
                  <span
                    className={`absolute inset-x-3 -bottom-0.5 h-0.5 bg-brand transition-transform duration-300 ${active === l.id ? 'scale-x-100' : 'scale-x-0'}`}
                  />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto hidden items-center gap-5 lg:ml-0 lg:flex">
          {langSwitch}
          <a href="#form" className="rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-ink">
            {t.nav.cta}
          </a>
        </div>

        {/* phones: the language switch stays on screen, like on desktop */}
        <div className="ml-auto lg:hidden">{langSwitch}</div>

        <button
          type="button"
          className="-mr-2 grid size-11 place-items-center lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? t.ui.close : t.ui.menu}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="relative block h-3 w-6">
            <span className={`absolute left-0 top-0 h-0.5 w-6 bg-white transition-transform duration-300 ${open ? 'translate-y-[5px] rotate-45' : ''}`} />
            <span className={`absolute bottom-0 left-0 h-0.5 w-6 bg-white transition-transform duration-300 ${open ? '-translate-y-[5px] -rotate-45' : ''}`} />
          </span>
        </button>
      </div>

      <div id="mobile-menu" hidden={!open} data-lenis-prevent className="fixed inset-x-0 bottom-0 top-16 overflow-y-auto bg-night px-4 pb-10 pt-8 sm:px-8 lg:hidden">
        <nav aria-label="Main">
          <ul className="space-y-1">
            {links.map((l) => (
              <li key={l.id}>
                <a
                  href={`#${l.id}`}
                  onClick={() => setOpen(false)}
                  className={`block py-3 font-display text-2xl ${active === l.id ? 'text-white' : 'text-haze'}`}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a
          href="#form"
          onClick={() => setOpen(false)}
          className="mt-8 block rounded-full bg-brand px-6 py-3.5 text-center font-medium text-white"
        >
          {t.nav.cta}
        </a>
        <div className="mt-8 space-y-4 border-t border-white/10 pt-8">
          <p className="text-sm text-haze">{t.topbar}</p>
          <a href={contacts.phoneHref} className="block font-display text-xl text-white">
            {contacts.phone}
          </a>
        </div>
      </div>
    </header>
  );
}
