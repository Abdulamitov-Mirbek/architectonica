'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SiteDict } from '@/content/site';
import { PARTS, type PartId, type Season } from './scene/ModelScene';

const ModelScene = dynamic(() => import('./scene/ModelScene'), { ssr: false });

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** "Free climate control underfoot": the house model the visitor turns by hand. */
export function Earth({ t, ui }: { t: SiteDict['earth']; ui: SiteDict['ui'] }) {
  const stage = useRef<HTMLDivElement>(null);
  const markers = useRef<(HTMLElement | null)[]>([]);
  const [season, setSeason] = useState<Season>('summer');
  const [focus, setFocus] = useState<{ id: PartId | null; n: number }>({ id: null, n: 0 });
  const [env, setEnv] = useState<{ webgl: boolean; reduced: boolean; hq: boolean } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [running, setRunning] = useState(false);
  const [ready, setReady] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    setEnv({
      webgl: hasWebGL(),
      reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      hq: fine && window.innerWidth >= 1024 && (navigator.hardwareConcurrency ?? 8) >= 4,
    });
    const el = stage.current;
    if (!el) return;
    const near = new IntersectionObserver(([e]) => e.isIntersecting && setMounted(true), { rootMargin: '700px 0px' });
    const vis = new IntersectionObserver(([e]) => setRunning(e.isIntersecting), { rootMargin: '80px 0px' });
    near.observe(el);
    vis.observe(el);
    return () => {
      near.disconnect();
      vis.disconnect();
    };
  }, []);

  const pick = useCallback((id: PartId) => setFocus((f) => (f.id === id ? { id: null, n: f.n + 1 } : { id, n: f.n + 1 })), []);
  const onReady = useCallback(() => setReady(true), []);

  const seasonSwitch = (
    <fieldset>
      <legend className="sr-only">{ui.season}</legend>
      <div className="inline-flex rounded-full bg-night/60 p-1 shadow-[inset_0_0_0_1px_rgba(233,238,241,0.14)] backdrop-blur-md">
        {(['summer', 'winter'] as const).map((s) => (
          <label
            key={s}
            className={`flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-glow ${
              season === s ? 'bg-glacier text-night' : 'text-glacier hover:bg-white/10'
            }`}
          >
            <input type="radio" name="season" value={s} checked={season === s} onChange={() => setSeason(s)} className="sr-only" />
            {s === 'summer' ? (
              <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <circle cx="10" cy="10" r="3.6" />
                <path d="M10 1.5v2.2M10 16.3v2.2M1.5 10h2.2M16.3 10h2.2M4 4l1.6 1.6M14.4 14.4 16 16M4 16l1.6-1.6M14.4 5.6 16 4" />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <path d="M10 1.5v17M2.6 5.75l14.8 8.5M2.6 14.25l14.8-8.5M7.6 2.8 10 4.6l2.4-1.8M7.6 17.2 10 15.4l2.4 1.8" />
              </svg>
            )}
            {s === 'summer' ? ui.summer : ui.winter}
          </label>
        ))}
      </div>
    </fieldset>
  );

  return (
    <section id="earth" className="relative py-20 lg:py-28">
      <div className="mx-auto grid max-w-[90rem] gap-8 px-4 sm:px-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.5fr)] lg:items-center lg:gap-14">
        <div>
          <h2 className="text-[clamp(1.7rem,3.6vw,3rem)] text-white">{t.title}</h2>
          <p className="mt-5 text-glacier/85 sm:text-lg">{t.text}</p>
          <p className="mt-5 border-l-2 border-glow pl-4 text-glow">{t.accent}</p>
          <ul className="mt-8 flex flex-wrap gap-2">
            {PARTS.map((id, i) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => pick(id)}
                  aria-pressed={focus.id === id}
                  className={`flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-sm transition-colors ${
                    focus.id === id ? 'bg-glow text-night' : 'bg-white/8 text-glacier hover:bg-white/14'
                  }`}
                >
                  <span className={`grid size-6 place-items-center rounded-full font-display text-[0.7rem] ${focus.id === id ? 'bg-night text-glow' : 'bg-white/12'}`}>{i + 1}</span>
                  {t.parts[id]}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div
          ref={stage}
          onPointerDown={() => setTouched(true)}
          className="relative -mx-4 h-[64svh] min-h-[380px] overflow-hidden bg-[linear-gradient(180deg,#3f78b0,#e9d7bc)] sm:mx-0 sm:rounded-3xl lg:h-[78svh]"
        >
          {env?.webgl && mounted && (
            <div className={`absolute inset-0 transition-opacity duration-1000 ${ready ? 'opacity-100' : 'opacity-0'}`}>
              <ModelScene season={season} running={running} reducedMotion={env.reduced} hq={env.hq} focus={focus} markers={markers} onReady={onReady} />
            </div>
          )}
          {env && !env.webgl && <Image src="/images/concept/eco-house-scheme.jpg" alt={t.alt} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />}
          {env?.webgl && !ready && <p className="absolute inset-0 grid place-items-center text-sm text-white/90">{ui.loading}</p>}

          {/* hotspots that follow the model */}
          {env?.webgl &&
            PARTS.map((id, i) => (
              <button
                key={id}
                ref={(el) => {
                  markers.current[i] = el;
                }}
                type="button"
                onClick={() => pick(id)}
                aria-label={t.parts[id]}
                aria-pressed={focus.id === id}
                className="group absolute left-0 top-0 opacity-0 transition-opacity duration-300"
              >
                <span
                  className={`absolute -left-4 -top-4 grid size-8 place-items-center rounded-full font-display text-[0.8rem] shadow-[0_0_20px_rgba(255,207,143,0.7)] transition-transform group-hover:scale-110 ${
                    focus.id === id ? 'bg-glow text-night' : 'bg-white text-night'
                  }`}
                >
                  {i + 1}
                </span>
                <span
                  className={`absolute left-6 top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-full bg-night/80 px-3 py-1 text-xs text-white backdrop-blur sm:block ${
                    focus.id === id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  } transition-opacity`}
                >
                  {t.parts[id]}
                </span>
              </button>
            ))}

          <div className="absolute right-3 top-3 sm:right-4 sm:top-4">{seasonSwitch}</div>
          {env?.webgl && ready && (
            <p
              className={`pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-night/65 px-4 py-2 text-sm text-white backdrop-blur transition-opacity duration-500 ${
                touched ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M3 12a9 9 0 0 1 15.5-6.2M21 12a9 9 0 0 1-15.5 6.2M18.5 2v4h-4M5.5 22v-4h4" />
              </svg>
              {ui.rotate}
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto mt-20 max-w-[90rem] px-4 sm:px-8">
        <h3 className="text-[clamp(1.4rem,2.6vw,2.1rem)] text-white">{t.whoTitle}</h3>
        <ol className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          {t.who.map((w, i) => (
            <li key={w} className="rounded-2xl bg-deep/80 p-5">
              <span className="font-display text-sm text-glow">{String(i + 1).padStart(2, '0')}</span>
              <p className="mt-3 text-glacier/90">{w}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
