'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Logo } from './Logo';
import { contacts, locales, type Locale, type SiteDict } from '@/content/site';

const SECTIONS = ['home', 'tech', 'projects', 'contact'] as const;

export function Header({ lang, t }: { lang: Locale; t: SiteDict['nav'] }) {
  const [active, setActive] = useState<(typeof SECTIONS)[number]>('home');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const els = SECTIONS.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id as (typeof SECTIONS)[number]);
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const links = SECTIONS.map((id) => ({ id, label: t[id] }));

  const langSwitch = (
    <div className="flex items-center gap-1 text-sm">
      {locales.map((l) => (
        <Link
          key={l}
          href={`/${l}`}
          hrefLang={l === 'kg' ? 'ky' : 'ru'}
          aria-current={l === lang ? 'true' : undefined}
          className={`rounded px-2 py-1 font-medium transition-colors ${
            l === lang ? 'bg-white/12 text-white' : 'text-haze hover:text-white'
          }`}
        >
          {l.toUpperCase()}
        </Link>
      ))}
    </div>
  );

  return (
    <header className="roofline fixed inset-x-0 top-0 z-50 text-white">
      <div className="mx-auto flex h-16 max-w-[90rem] items-center gap-6 px-4 pb-1 sm:px-8">
        <a href="#home" className="shrink-0 text-white" aria-label="Architectonica">
          <Logo variant="horizontal" className="h-7 w-auto sm:h-8" />
        </a>

        <nav className="ml-auto hidden lg:block" aria-label="Main">
          <ul className="flex items-center gap-1">
            {links.map((l) => (
              <li key={l.id}>
                <a
                  href={`#${l.id}`}
                  aria-current={active === l.id ? 'location' : undefined}
                  className={`relative block px-3 py-2 text-[0.95rem] transition-colors ${
                    active === l.id ? 'text-white' : 'text-haze hover:text-white'
                  }`}
                >
                  {l.label}
                  <span
                    className={`absolute inset-x-3 -bottom-0.5 h-0.5 bg-larch transition-transform duration-300 ${
                      active === l.id ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto hidden items-center gap-5 lg:ml-0 lg:flex">
          {langSwitch}
          <a
            href={contacts.phoneHref}
            className="rounded-full bg-glacier px-4 py-2 text-sm font-medium text-night transition-colors hover:bg-white"
          >
            {contacts.phone}
          </a>
        </div>

        <button
          type="button"
          className="ml-auto -mr-2 grid size-11 place-items-center lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? t.close : t.menu}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="relative block h-3 w-6">
            <span
              className={`absolute left-0 top-0 h-0.5 w-6 bg-white transition-transform duration-300 ${open ? 'translate-y-[5px] rotate-45' : ''}`}
            />
            <span
              className={`absolute bottom-0 left-0 h-0.5 w-6 bg-white transition-transform duration-300 ${open ? '-translate-y-[5px] -rotate-45' : ''}`}
            />
          </span>
        </button>
      </div>

      <div
        id="mobile-menu"
        hidden={!open}
        className="fixed inset-x-0 bottom-0 top-16 overflow-y-auto bg-night px-4 pb-10 pt-8 sm:px-8 lg:hidden"
      >
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
        <div className="mt-10 space-y-6 border-t border-white/10 pt-8">
          <a href={contacts.phoneHref} className="block font-display text-xl text-white">
            {contacts.phone}
          </a>
          {langSwitch}
        </div>
      </div>
    </header>
  );
}
