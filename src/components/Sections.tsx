import Image from 'next/image';
import { contacts, whatsappLink, type SiteDict } from '@/content/site';
import { BlueprintStage } from './BlueprintStage';

function Eyebrow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm font-medium text-blue-soft ${className}`}>{children}</p>;
}

export function Market({ t }: { t: SiteDict['market'] }) {
  return (
    <section id="market" className="relative isolate overflow-hidden py-20 lg:py-28">
      <BlueprintStage />
      <div className="mx-auto max-w-[90rem] px-4 sm:px-8">
        <div className="on-scene flex min-h-[38svh] flex-col justify-end lg:min-h-[44svh]">
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <h2 className="mt-3 max-w-[22ch] text-[clamp(1.7rem,3.8vw,3.2rem)] text-white">{t.title}</h2>
        </div>
        <p className="mt-10 max-w-[40ch] font-display text-[clamp(1.25rem,2.4vw,1.9rem)] leading-snug text-white">{t.conclusion}</p>
      </div>
    </section>
  );
}

export function Experience({ t }: { t: SiteDict['world'] }) {
  return (
    <section id="world" className="relative py-20 lg:py-28">
      <div className="mx-auto max-w-[90rem] px-4 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <Eyebrow>{t.eyebrow}</Eyebrow>
            <h2 className="mt-3 max-w-[20ch] text-[clamp(1.7rem,3.8vw,3.2rem)] text-white">{t.title}</h2>
          </div>
          <p className="self-end text-glacier/80 sm:text-lg">{t.lead}</p>
        </div>

        <p className="mt-10 max-w-[62rem] text-glacier/80 sm:text-lg">{t.fact}</p>

        <article className="mt-14 grid overflow-hidden rounded-3xl bg-deep lg:grid-cols-[1fr_1.4fr]">
          <div aria-hidden className="relative min-h-[220px] bg-[#10528f] lg:min-h-full">
            <div className="absolute inset-0 bg-[url('/patterns/marks.svg')] bg-cover bg-center" />
          </div>
          <div className="p-6 sm:p-10">
            <Eyebrow>{t.hEyebrow}</Eyebrow>
            <h3 className="mt-3 text-[clamp(1.3rem,2.4vw,1.9rem)] text-white">{t.hTitle}</h3>
            <p className="mt-4 text-glacier/80">{t.hText}</p>
            <p className="mt-5 border-l-2 border-larch pl-4 text-[0.95rem] text-larch-light">{t.hAward}</p>
          </div>
        </article>

        <p className="mt-14 max-w-[40ch] font-display text-[clamp(1.25rem,2.4vw,1.9rem)] leading-snug text-white">{t.conclusion}</p>
      </div>
    </section>
  );
}

export function Health({ t }: { t: SiteDict['health'] }) {
  return (
    <section id="health" className="relative pb-2 pt-20 lg:pt-28">
      <div className="mx-auto grid max-w-[90rem] gap-8 px-4 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <h2 className="mt-3 max-w-[20ch] text-[clamp(1.7rem,3.8vw,3.2rem)] text-white">{t.title}</h2>
        </div>
        <p className="self-end text-glacier/85 sm:text-lg">{t.climateCaption}</p>
      </div>
    </section>
  );
}

export function Code7({ t }: { t: SiteDict['code'] }) {
  return (
    <section id="code" className="relative isolate overflow-hidden bg-blue-deep py-20 lg:py-28">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[url('/patterns/trapezoids.svg')] bg-cover bg-center opacity-60" />
      <div className="mx-auto grid max-w-[90rem] gap-10 px-4 sm:px-8 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-20">
        <p aria-hidden className="font-display text-[clamp(9rem,30vw,22rem)] font-medium leading-[0.8] tracking-[-0.06em] text-white/95">
          7
        </p>
        <div>
          <p className="text-sm font-medium text-white/75">{t.eyebrow}</p>
          <h2 className="mt-3 max-w-[22ch] text-[clamp(1.6rem,3.4vw,2.8rem)] text-white">{t.title}</h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {t.items.map((c) => (
              <li key={c.a} className="rounded-2xl bg-night/35 p-5 backdrop-blur-sm">
                <p className="font-display text-lg text-white">{c.a}</p>
                <p className="mt-2 text-[0.95rem] text-white/80">— {c.b}</p>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-white/80">{t.lead}</p>
          <p className="mt-2 font-display text-[clamp(1.2rem,2.2vw,1.7rem)] text-white">{t.slogan}</p>
        </div>
      </div>
    </section>
  );
}

export function Founder({ t }: { t: SiteDict['founder'] }) {
  return (
    <section id="founder" className="relative py-20 lg:py-28">
      <div className="mx-auto grid max-w-[90rem] items-center gap-10 px-4 sm:px-8 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-20">
        <div className="relative mx-auto w-full max-w-[22rem]">
          <div aria-hidden className="absolute -inset-4 rounded-full border-2 border-brand/70" />
          <div className="relative aspect-square overflow-hidden rounded-full bg-glacier">
            <Image src="/images/team/adilet.png" alt={t.name} fill sizes="(min-width: 1024px) 26rem, 80vw" className="object-cover" />
          </div>
        </div>
        <div>
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <h2 className="mt-3 text-[clamp(1.7rem,3.6vw,3rem)] text-white">{t.title}</h2>
          <blockquote className="mt-6 text-[1.05rem] leading-relaxed text-glacier/90 sm:text-xl">{t.quote}</blockquote>
          <p className="mt-6 font-display text-lg text-white">{t.name}</p>
          <p className="text-haze">{t.role}</p>
          <a href={contacts.instagramUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-blue-soft underline-offset-4 hover:underline">
            {contacts.instagramHandle}
          </a>
        </div>
      </div>
    </section>
  );
}

export function Faq({ t }: { t: SiteDict['faq'] }) {
  return (
    <section id="faq" className="relative py-20 lg:py-28">
      <div className="mx-auto grid max-w-[90rem] gap-10 px-4 sm:px-8 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <div>
          <Eyebrow>{t.eyebrow}</Eyebrow>
          <h2 className="mt-3 text-[clamp(1.7rem,3.6vw,3rem)] text-white">{t.title}</h2>
          <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block text-blue-soft underline-offset-4 hover:underline">
            {t.more}
          </a>
        </div>
        <div className="divide-y divide-white/10 border-y border-white/10">
          {t.items.map((q) => (
            <details key={q.q} className="group">
              <summary className="flex cursor-pointer list-none items-center gap-4 py-5 text-left text-lg text-white [&::-webkit-details-marker]:hidden">
                <span className="flex-1">{q.q}</span>
                <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-white/8 text-xl leading-none transition-transform duration-300 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pb-6 pr-12 text-glacier/80">{q.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Path({ t }: { t: SiteDict['path'] }) {
  return (
    <section id="path" className="relative py-20 lg:py-24">
      <div className="mx-auto max-w-[90rem] px-4 sm:px-8">
        <h2 className="text-[clamp(1.7rem,3.6vw,3rem)] text-white">{t.title}</h2>
        <ol className="mt-10 grid gap-3 md:grid-cols-4">
          {t.steps.map((s, i) => {
            const done = i < 2;
            const here = i === 1;
            const next = i === 2;
            return (
              <li
                key={s}
                className={`flex flex-col gap-4 rounded-2xl p-5 ${next ? 'bg-brand text-white' : here ? 'bg-deep ring-2 ring-brand' : 'bg-deep/70'}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`grid size-9 place-items-center rounded-full font-display text-sm ${done ? 'bg-brand text-white' : next ? 'bg-white text-blue-deep' : 'bg-white/10 text-glacier'}`}
                  >
                    {done ? '✓' : i + 1}
                  </span>
                  <span className={`text-xs font-medium ${here ? 'text-glow' : next ? 'text-white/85' : 'text-haze'}`}>
                    {here ? t.here : `${t.tag} ${i + 1}`}
                  </span>
                </div>
                <p className={next ? 'text-white' : 'text-glacier/85'}>{s}</p>
              </li>
            );
          })}
        </ol>
        <a href="#form" className="mt-8 inline-block rounded-full bg-glacier px-6 py-3.5 font-medium text-night transition-colors hover:bg-white">
          {t.btn}
        </a>
      </div>
    </section>
  );
}
