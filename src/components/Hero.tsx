import Image from 'next/image';
import { whatsappLink, type SiteDict } from '@/content/site';
import { Logo } from './Logo';

export function Hero({ t }: { t: SiteDict }) {
  const h = t.hero;
  return (
    <section id="home" className="relative isolate flex min-h-svh flex-col overflow-hidden pt-20 lg:pt-28">
      <div className="absolute inset-0 -z-20 overflow-hidden">
        <Image src="/images/projects/villa-street-hd.jpg" alt={h.alt} fill priority quality={90} sizes="100vw" className="kenburns object-cover object-[60%_50%]" />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/70 via-45% to-night/20 lg:bg-gradient-to-r lg:from-night/95 lg:via-night/70 lg:via-40% lg:to-night/10" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-night to-transparent" />

      <div className="mx-auto flex w-full max-w-[90rem] flex-1 flex-col justify-end px-4 pb-10 sm:px-8 lg:justify-center lg:pb-16">
        <div className="on-scene max-w-[46rem]">
          <p className="hero-fade flex items-baseline gap-3 text-white" style={{ animationDelay: '0.1s' }}>
            <span className="font-display text-[clamp(4rem,min(15vw,17svh),10rem)] font-medium leading-[0.9] tracking-[-0.04em]">{h.big}</span>
            <span className="font-display text-[clamp(1.4rem,3.4vw,2.4rem)] text-glow">{h.unit}</span>
          </p>
          <p className="hero-fade mt-3 max-w-[30rem] text-lg text-glacier/90 sm:text-xl" style={{ animationDelay: '0.35s' }}>
            {h.bigSub}
          </p>
          <h1 className="mt-5 text-[clamp(1.6rem,min(4.4vw,6svh),3.3rem)] text-white">
            <span className="hero-line">
              <span style={{ animationDelay: '0.55s' }}>{h.q}</span>
            </span>
          </h1>
          <p className="hero-fade mt-5 max-w-[36rem] text-[1.02rem] leading-relaxed text-glacier/85 sm:text-lg" style={{ animationDelay: '0.9s' }}>
            {h.sub}
          </p>
          <p className="hero-fade mt-4 font-display text-sm text-larch-light sm:text-base" style={{ animationDelay: '1s' }}>
            {t.slogan}
          </p>
          <div className="hero-fade mt-7 flex flex-col gap-3 min-[460px]:flex-row" style={{ animationDelay: '1.1s' }}>
            <a href="#form" className="rounded-full bg-brand px-6 py-3.5 text-center font-medium text-white transition-colors hover:bg-brand-ink">
              {t.cta}
            </a>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-night/30 px-6 py-3.5 text-center font-medium text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4)] backdrop-blur-sm transition-colors hover:bg-night/60"
            >
              {t.waBtn}
            </a>
          </div>
        </div>
      </div>

      {/* ticker from the landing */}
      <div className="relative border-y border-white/10 bg-night/70 py-3 backdrop-blur-md">
        <div className="flex w-max ticker" aria-hidden>
          {[...t.ticker, ...t.ticker].map((item, i) => (
            <span key={i} className="flex shrink-0 items-center gap-6 pr-6 font-display text-sm text-glacier/85 sm:text-[0.95rem]">
              {item}
              <Logo variant="mark" className="size-5" />
            </span>
          ))}
        </div>
        <p className="sr-only">{t.ticker.join('. ')}</p>
      </div>
    </section>
  );
}
