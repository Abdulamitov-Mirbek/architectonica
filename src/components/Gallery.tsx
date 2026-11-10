'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { contacts, photos, type Locale, type SiteDict } from '@/content/site';

/** Second screen: a dense wall of project photos with a full-screen viewer. */
export function Gallery({ t, lang }: { t: SiteDict; lang: Locale }) {
  const p = t.projects;
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open !== null && !d.open) d.showModal();
    if (open === null && d.open) d.close();
    document.documentElement.classList.toggle('lenis-stopped', open !== null);
  }, [open]);

  const step = (dir: 1 | -1) => setOpen((i) => (i === null ? i : (i + dir + photos.length) % photos.length));
  const current = open !== null ? photos[open] : null;
  const indexed = photos.map((ph, i) => ({ ph, i }));
  const rows = [indexed.filter((_, k) => k % 2 === 0), indexed.filter((_, k) => k % 2 === 1)];

  return (
    <section id="projects" className="projects-bg relative py-16 lg:py-24">
      <div className="mx-auto max-w-[90rem] px-4 sm:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-soft">{p.eyebrow}</p>
            <h2 className="mt-3 max-w-[18ch] text-[clamp(1.9rem,4.6vw,3.8rem)] text-white">{p.title}</h2>
            <p className="mt-4 max-w-[34rem] text-glacier/80 sm:text-lg">{p.sub}</p>
          </div>
          <a
            href={contacts.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-[linear-gradient(45deg,#f09433_0%,#e6683c_25%,#dc2743_50%,#cc2366_75%,#bc1888_100%)] px-5 py-3 font-medium text-white shadow-[0_8px_24px_-10px_rgba(220,39,67,0.7)] transition-opacity hover:opacity-90 md:self-end"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
            </svg>
            {p.btn}
          </a>
        </div>

      </div>

      {/* two rows of photos running in opposite directions; hover pauses, click opens */}
      <div className="mt-10 flex flex-col gap-2 sm:gap-3">
        {[rows[0], rows[1]].map((row, r) => (
          <div key={r} className="marquee group/row overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
            <ul className={`marquee-track flex w-max gap-2 sm:gap-3 ${r === 1 ? 'marquee-reverse' : ''}`}>
              {[0, 1, 2, 3].flatMap((copy) =>
                row.map(({ ph, i }) => {
                  const wide = ph.w > ph.h;
                  const clone = copy > 0;
                  return (
                    <li key={`${copy}-${ph.id}`} aria-hidden={clone || undefined} className="shrink-0">
                      <button
                        type="button"
                        tabIndex={clone ? -1 : undefined}
                        onClick={() => setOpen(i)}
                        aria-label={`${t.ui.open}: ${ph.alt[lang]}`}
                        className={`group relative block h-[clamp(200px,30svh,320px)] overflow-hidden rounded-xl bg-deep ${wide ? 'aspect-[16/10]' : 'aspect-[3/4]'}`}
                      >
                        <Image
                          src={ph.src}
                          alt={clone ? '' : ph.alt[lang]}
                          fill
                          sizes={wide ? '(min-width: 768px) 520px, 80vw' : '(min-width: 768px) 260px, 40vw'}
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                        />
                        <span className="absolute inset-0 bg-night/0 transition-colors duration-500 group-hover:bg-night/15" />
                      </button>
                    </li>
                  );
                }),
              )}
            </ul>
          </div>
        ))}
      </div>
      <dialog
        ref={dialog}
        onClose={() => setOpen(null)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') step(1);
          if (e.key === 'ArrowLeft') step(-1);
        }}
        onClick={(e) => e.target === e.currentTarget && setOpen(null)}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-night/95 p-0 text-white backdrop:bg-transparent"
      >
        {current && (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between px-4 py-3 sm:px-8">
              <p className="text-sm text-haze">
                {open! + 1} / {photos.length}
              </p>
              <button type="button" onClick={() => setOpen(null)} className="rounded-full px-4 py-2 text-sm text-white hover:bg-white/10" autoFocus>
                {t.ui.close}
              </button>
            </div>
            <div className="relative mx-4 flex-1 sm:mx-20">
              <Image src={current.src} alt={current.alt[lang]} fill sizes="100vw" className="object-contain" />
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
              <button type="button" onClick={() => step(-1)} aria-label={t.ui.prev} className="grid size-12 place-items-center rounded-full border border-white/25 hover:bg-white/10">
                <svg viewBox="0 0 24 24" className="size-5 rotate-180" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
              <button type="button" onClick={() => step(1)} aria-label={t.ui.next} className="grid size-12 place-items-center rounded-full border border-white/25 hover:bg-white/10">
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
