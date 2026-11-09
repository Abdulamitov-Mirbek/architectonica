'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { photos, type SiteDict } from '@/content/site';

const Blueprint = dynamic(() => import('./scene/Blueprint'), { ssr: false });

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

const tile: Record<string, string> = {
  'facade-front': 'col-span-2 aspect-[16/10] lg:col-span-8 lg:row-span-3 lg:aspect-auto',
  'living-dining': 'aspect-[3/4] lg:col-span-4 lg:row-span-3 lg:aspect-auto',
  kitchen: 'aspect-[3/4] lg:col-span-4 lg:row-span-3 lg:aspect-auto',
  'wardrobe-glass': 'aspect-[3/4] lg:col-span-4 lg:row-span-3 lg:aspect-auto',
  hallway: 'aspect-[3/4] lg:col-span-4 lg:row-span-3 lg:aspect-auto',
  'facade-entrance': 'col-span-2 aspect-[16/10] lg:col-span-8 lg:row-span-3 lg:aspect-auto',
};

export function Projects({ t, cta }: { t: SiteDict['projects']; cta: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const bp = useRef({ visible: false, px: 0, py: 0 });
  const [bpEnv, setBpEnv] = useState<{ mount: boolean; running: boolean; animate: boolean }>({ mount: false, running: false, animate: true });

  // The blueprint loads when the section approaches and renders only while it is on screen.
  useEffect(() => {
    const el = stage.current;
    if (!el || !hasWebGL()) return;
    const animate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setBpEnv((s) => ({ ...s, animate }));
    const near = new IntersectionObserver(([e]) => e.isIntersecting && setBpEnv((s) => ({ ...s, mount: true })), { rootMargin: '500px 0px' });
    const vis = new IntersectionObserver(
      ([e]) => {
        bp.current.visible = e.intersectionRatio > 0.2;
        setBpEnv((s) => ({ ...s, running: e.isIntersecting }));
      },
      { threshold: [0, 0.2] },
    );
    near.observe(el);
    vis.observe(el);
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      bp.current.px = (e.clientX / window.innerWidth) * 2 - 1;
      bp.current.py = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove);
    return () => {
      near.disconnect();
      vis.disconnect();
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open !== null && !d.open) d.showModal();
    if (open === null && d.open) d.close();
  }, [open]);

  const step = (dir: 1 | -1) => setOpen((i) => (i === null ? i : (i + dir + photos.length) % photos.length));

  const current = open !== null ? photos[open] : null;

  return (
    <section id="projects" className="projects-bg relative isolate overflow-hidden py-20 lg:py-28">
      {/* the same house as a self-drawing blueprint */}
      <div
        ref={stage}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[58svh] min-h-[420px] [mask-image:linear-gradient(to_bottom,black_55%,transparent)] lg:h-[86svh]"
      >
        {bpEnv.mount && <Blueprint input={bp} running={bpEnv.running} animate={bpEnv.animate} />}
      </div>
      <div className="mx-auto max-w-[90rem] px-4 sm:px-8">
        <div className="on-scene flex min-h-[52svh] flex-col justify-end lg:min-h-[52svh] lg:justify-center">
          <h2 className="max-w-[20ch] text-[clamp(1.75rem,4.4vw,3.6rem)] text-white">{t.title}</h2>
          <p className="mt-4 max-w-[30rem] text-[0.95rem] text-glacier/80 sm:text-base">{t.blueprintNote}</p>
        </div>

        <ul className="mt-10 grid grid-cols-2 gap-2 sm:gap-3 lg:mt-14 lg:grid-cols-12 lg:auto-rows-[clamp(110px,10.5vw,170px)]">
          {photos.map((p, i) => (
            <li key={p.id} className={`relative overflow-hidden rounded-xl bg-deep ${tile[p.id]}`}>
              <button
                type="button"
                onClick={() => setOpen(i)}
                aria-label={`${t.open}: ${t.photos[p.id]}`}
                className="group absolute inset-0 block text-left"
              >
                <Image
                  src={p.src}
                  alt={t.photos[p.id]}
                  fill
                  sizes={p.w > p.h ? '(min-width: 1024px) 60vw, 100vw' : '(min-width: 1024px) 30vw, 50vw'}
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night/85 to-transparent px-3 pb-3 pt-10 text-sm text-glacier sm:px-4 sm:text-[0.95rem]">
                  {t.photos[p.id]}
                </span>
              </button>
            </li>
          ))}
          <li className="larch-panel col-span-2 flex flex-col justify-between gap-6 rounded-xl p-6 text-night sm:p-8 lg:col-span-4 lg:row-span-3">
            <p className="text-[1.05rem] leading-relaxed text-night/90 sm:text-lg">{t.lead}</p>
            <a
              href="#contact"
              className="self-start rounded-full bg-night px-6 py-3.5 font-medium text-glacier transition-colors hover:bg-deep"
            >
              {cta}
            </a>
          </li>
        </ul>
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
              <button
                type="button"
                onClick={() => setOpen(null)}
                className="rounded-full px-4 py-2 text-sm text-white hover:bg-white/10"
                autoFocus
              >
                {t.close}
              </button>
            </div>
            <div className="relative mx-4 flex-1 sm:mx-20">
              <Image src={current.src} alt={t.photos[current.id]} fill sizes="100vw" className="object-contain" />
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
              <button type="button" onClick={() => step(-1)} className="rounded-full border border-white/25 px-4 py-2 text-sm hover:bg-white/10">
                {t.prev}
              </button>
              <p className="text-center text-[0.95rem]">{t.photos[current.id]}</p>
              <button type="button" onClick={() => step(1)} className="rounded-full border border-white/25 px-4 py-2 text-sm hover:bg-white/10">
                {t.next}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
