'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SiteDict } from '@/content/site';
import { OverhangDiagram } from './OverhangDiagram';
import type { Season, StoryInput } from './scene/StoryScene';

const StoryScene = dynamic(() => import('./scene/StoryScene'), { ssr: false });

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

type Env = { webgl: boolean; reduced: boolean; hq: boolean; fine: boolean };

/**
 * Hero + technology as one scroll story over a pinned 3D stage.
 * Chapter 0 is the hero, 1 the overview, 2–6 the five systems.
 */
export function Story({ hero, tech }: { hero: SiteDict['hero']; tech: SiteDict['tech'] }) {
  const root = useRef<HTMLDivElement>(null);
  const chapters = useRef<(HTMLElement | null)[]>([]);
  const marker = useRef<HTMLDivElement>(null);
  const input = useRef<StoryInput>({ p: 0, px: 0, py: 0 });
  const [season, setSeason] = useState<Season>('summer');
  const [chapter, setChapter] = useState(0);
  const [env, setEnv] = useState<Env | null>(null);
  const [running, setRunning] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    setEnv({
      webgl: hasWebGL(),
      reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      fine,
      hq: fine && window.innerWidth >= 1024 && (navigator.hardwareConcurrency ?? 8) >= 4,
    });
  }, []);

  // Scroll position → fractional chapter index, measured between chapter centres.
  useEffect(() => {
    let centres: number[] = [];
    const measure = () => {
      centres = chapters.current.map((el) => {
        if (!el) return 0;
        const r = el.getBoundingClientRect();
        return r.top + window.scrollY + r.height / 2;
      });
    };
    const update = () => {
      const c = window.scrollY + window.innerHeight / 2;
      let p = 0;
      if (c <= centres[0]) p = 0;
      else if (c >= centres[centres.length - 1]) p = centres.length - 1;
      else
        for (let i = 0; i < centres.length - 1; i++)
          if (c < centres[i + 1]) {
            p = i + (c - centres[i]) / (centres[i + 1] - centres[i]);
            break;
          }
      input.current.p = p;
      setChapter(Math.round(p));
    };
    measure();
    update();
    const onResize = () => {
      measure();
      update();
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(onResize);
    if (root.current) ro.observe(root.current);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
  }, []);

  // Pause rendering when the story is off screen; gentle parallax with a mouse.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setRunning(e.isIntersecting), { rootMargin: '50px 0px' });
    io.observe(el);
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      input.current.px = (e.clientX / window.innerWidth) * 2 - 1;
      input.current.py = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove);
    return () => {
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  const goTo = useCallback((i: number) => {
    chapters.current[i]?.scrollIntoView({ block: 'center' });
  }, []);

  const onReady = useCallback(() => setReady(true), []);
  const featureIndex = chapter - 2; // −1 on overview, < −1 on hero

  return (
    <div ref={root} className="relative">
      {/* ---- pinned stage ---- */}
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        <div
          aria-hidden
          className={`absolute inset-0 transition-opacity duration-[1400ms] ${ready ? 'opacity-0' : 'opacity-100'}`}
          style={{ background: 'linear-gradient(180deg, #2f5a86 0%, #8aa0b4 55%, #e9c49c 100%)' }}
        />
        {env?.webgl && (
          <div className={`absolute inset-0 transition-opacity duration-[1400ms] ${ready ? 'opacity-100' : 'opacity-0'}`}>
            <StoryScene
              input={input}
              season={season}
              running={running}
              reducedMotion={env.reduced}
              hq={env.hq}
              marker={marker}
              onReady={onReady}
            />
          </div>
        )}
        {env && !env.webgl && (
          <Image src="/images/exterior/facade-front.jpg" alt="" fill priority sizes="100vw" className="object-cover object-[62%_70%]" />
        )}

        {/* legibility: a dusk wash behind the text column (left on desktop, bottom on phones) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night/90 via-night/45 via-35% to-transparent to-60% lg:bg-gradient-to-r lg:from-night/80 lg:via-night/35 lg:via-30% lg:to-transparent lg:to-50%"
        />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-night/50 to-transparent" />

        {/* marker on the feature in focus */}
        <div ref={marker} aria-hidden className="pointer-events-none absolute left-0 top-0 opacity-0 will-change-transform">
          <span className="absolute -left-5 -top-5 block size-10 animate-ping rounded-full border border-glow/70 [animation-duration:2.2s]" />
          <span className="absolute -left-4 -top-4 grid size-8 place-items-center rounded-full bg-glow font-display text-[0.8rem] text-night shadow-[0_0_24px_rgba(255,207,143,0.8)]">
            {featureIndex >= 0 ? featureIndex + 1 : ''}
          </span>
        </div>

        {/* season switch */}
        <fieldset className="absolute right-4 top-[4.75rem] z-10 sm:right-8 lg:bottom-8 lg:top-auto">
          <legend className="sr-only">{tech.seasonLabel}</legend>
          <div className="flex rounded-full bg-night/55 p-1 shadow-[inset_0_0_0_1px_rgba(233,238,241,0.14)] backdrop-blur-md">
            {(['summer', 'winter'] as const).map((s) => (
              <label
                key={s}
                className={`flex cursor-pointer items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-glow sm:px-4 ${
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
                {s === 'summer' ? tech.summer : tech.winter}
              </label>
            ))}
          </div>
        </fieldset>

        {/* chapter rail */}
        <nav
          aria-label={tech.railLabel}
          className={`absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 transition-opacity duration-500 sm:right-8 lg:block ${
            chapter >= 1 ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <ol className="flex flex-col items-end gap-2">
            {tech.features.map((f, i) => {
              const on = featureIndex === i;
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => goTo(i + 2)}
                    aria-current={on ? 'step' : undefined}
                    className="group flex items-center gap-3 py-1 text-right"
                  >
                    <span
                      className={`text-sm transition-all duration-300 ${
                        on ? 'text-glacier opacity-100' : 'translate-x-1 text-haze opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                      }`}
                    >
                      {f.title}
                    </span>
                    <span
                      className={`grid size-8 place-items-center rounded-full font-display text-[0.75rem] transition-colors ${
                        on ? 'bg-glow text-night' : 'bg-night/50 text-glacier shadow-[inset_0_0_0_1px_rgba(233,238,241,0.25)] backdrop-blur group-hover:bg-night/80'
                      }`}
                    >
                      {i + 1}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {env?.webgl && !ready && (
          <p className="absolute bottom-6 right-4 text-sm text-glacier/80 sm:right-8 lg:bottom-24">{tech.loading}</p>
        )}
      </div>

      {/* ---- chapters scroll over the stage ---- */}
      <div className="pointer-events-none relative z-10 -mt-[100svh]">
        <section
          id="home"
          ref={(el) => {
            chapters.current[0] = el;
          }}
          className="relative mx-auto flex h-svh min-h-[560px] max-w-[90rem] flex-col justify-end px-4 pb-8 pt-28 sm:px-8 lg:justify-center lg:pb-16"
        >
          <div className="pointer-events-auto on-scene max-w-[52rem]">
            <h1 className="text-[clamp(1.75rem,7.4vw,4.3rem)] text-white">
              {hero.title.map((line, i) => (
                <span key={i} className="hero-line">
                  <span style={{ animationDelay: `${0.25 + i * 0.12}s` }}>{line}</span>
                </span>
              ))}
            </h1>
            <p className="hero-fade mt-5 max-w-[34rem] text-[1.02rem] leading-relaxed text-glacier/90 sm:text-lg" style={{ animationDelay: '0.8s' }}>
              {hero.lead}
            </p>
            <div className="hero-fade mt-7 flex flex-col gap-3 min-[420px]:flex-row" style={{ animationDelay: '1s' }}>
              <a
                href="#tech"
                className="rounded-full bg-glacier px-6 py-3.5 text-center font-medium text-night transition-colors hover:bg-white"
              >
                {hero.primary}
              </a>
              <a
                href="#contact"
                className="rounded-full bg-night/30 px-6 py-3.5 text-center font-medium text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)] backdrop-blur-sm transition-colors hover:bg-night/60"
              >
                {hero.secondary}
              </a>
            </div>
          </div>
          <div className="hero-fade mt-8 flex items-center gap-3 text-sm text-glacier/75 lg:absolute lg:bottom-8" style={{ animationDelay: '1.4s' }}>
            <span className="inline-block h-px w-8 bg-larch" />
            <span>{hero.caption}</span>
            <span className="hidden text-glacier/50 sm:inline">/ {hero.scrollHint}</span>
          </div>
        </section>

        <section id="tech" aria-labelledby="tech-title">
          <div
            ref={(el) => {
              chapters.current[1] = el;
            }}
            className="mx-auto flex min-h-svh max-w-[90rem] items-end px-4 pb-10 pt-28 sm:px-8 lg:items-center lg:pb-0"
          >
            <div className="pointer-events-auto max-w-[34rem] max-lg:rounded-2xl max-lg:bg-[linear-gradient(160deg,rgb(26_56_94/0.42),rgb(14_32_54/0.5))] max-lg:ring-1 max-lg:ring-white/10 max-lg:p-4 max-lg:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.5)] max-lg:backdrop-blur-md on-scene">
              <h2 id="tech-title" className="text-[clamp(1.4rem,4vw,3.4rem)] text-white">
                {tech.title}
              </h2>
              <p className="mt-2 text-[0.92rem] leading-snug text-glacier/95 sm:mt-4 sm:text-lg sm:leading-normal">{tech.lead}</p>
              <ol className="mt-3 flex flex-wrap gap-1.5 lg:mt-6 lg:grid lg:gap-1">
                {tech.features.map((f, i) => (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => goTo(i + 2)}
                      className="flex items-center gap-2 rounded-full bg-white/8 py-1 pl-1 pr-3 text-left text-[0.82rem] text-glacier transition-colors hover:text-glow lg:w-full lg:gap-3 lg:bg-transparent lg:py-1.5 lg:pl-0 lg:text-base"
                    >
                      <span className="grid size-5 shrink-0 place-items-center rounded-full font-display text-[0.6rem] shadow-[inset_0_0_0_1px_rgba(233,238,241,0.35)] lg:size-7 lg:text-[0.7rem]">
                        {i + 1}
                      </span>
                      {f.title}
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {tech.features.map((f, i) => (
            <article
              key={f.id}
              ref={(el) => {
                chapters.current[i + 2] = el;
              }}
              aria-labelledby={`f-${f.id}`}
              className="mx-auto flex min-h-svh max-w-[90rem] items-end px-4 pb-8 pt-28 sm:px-8 lg:items-center lg:pb-0"
            >
              <div className="pointer-events-auto w-full max-w-[30rem] max-lg:rounded-2xl max-lg:bg-[linear-gradient(160deg,rgb(26_56_94/0.42),rgb(14_32_54/0.5))] max-lg:ring-1 max-lg:ring-white/10 max-lg:p-4 max-lg:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.5)] max-lg:backdrop-blur-md on-scene">
                <p className="font-display text-sm text-larch-light">
                  {String(i + 1).padStart(2, '0')}
                  <span className="text-glacier/40"> / {String(tech.features.length).padStart(2, '0')}</span>
                </p>
                <h3 id={`f-${f.id}`} className="mt-2 text-[clamp(1.3rem,3.4vw,2.8rem)] text-white sm:mt-3">
                  {f.title}
                </h3>
                <p className="mt-2 text-[0.92rem] leading-snug text-glacier/95 sm:mt-4 sm:text-lg sm:leading-normal">{f.text}</p>
                {f.id === 'overhang' && (
                  <div className="mt-3 flex items-center gap-3 sm:mt-5 sm:gap-5">
                    <div className="w-[46%] max-w-[16rem] shrink-0 rounded-xl bg-night/40 p-1.5 sm:w-[55%] sm:p-2">
                      <OverhangDiagram season={season} label={tech.seasonNote[season]} />
                    </div>
                    <p className="text-[0.8rem] leading-snug text-glow sm:text-[0.95rem]" aria-live="polite">
                      {tech.seasonNote[season]}
                    </p>
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
