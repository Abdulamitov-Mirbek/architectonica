'use client';

import { Logo } from './Logo';
import { contacts, whatsappLink, type SiteDict } from '@/content/site';

/** Step 3 of 4: the request form. It opens WhatsApp with the answers filled in. */
export function LeadForm({ t }: { t: SiteDict }) {
  const f = t.form;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const line = (label: string, key: string) => {
      const v = String(data.get(key) ?? '').trim();
      return v ? `${label}: ${v}` : '';
    };
    const text = [f.card, line(f.name, 'name'), line(f.phone, 'phone'), line(f.city, 'city'), line(f.role, 'role')].filter(Boolean).join('\n');
    window.open(whatsappLink(text), '_blank', 'noopener');
  }

  const field =
    'mt-2 w-full rounded-xl border border-white/15 bg-night/40 px-4 py-3 text-white placeholder:text-haze/60 transition-colors focus:border-glow focus:bg-night/60 focus:outline-none';

  return (
    <section id="form" className="dusk relative isolate text-glacier">
      <div className="pattern-band opacity-40" aria-hidden />
      <div className="mx-auto grid max-w-[90rem] gap-12 px-4 py-20 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:py-24">
        <div>
          <p className="text-sm font-medium text-glow">{f.eyebrow}</p>
          <h2 className="mt-3 max-w-[16ch] text-[clamp(1.8rem,3.8vw,3.2rem)] text-white">{f.title}</h2>
          <p className="mt-5 max-w-[34rem] text-glacier/85 sm:text-lg">{f.text}</p>
          <p className="mt-6 font-display text-larch-light">{t.slogan}</p>

          <p className="mt-10 text-sm text-glacier/75">{f.direct}</p>
          <a href={contacts.phoneHref} className="mt-2 block font-display text-[clamp(1.6rem,3.4vw,2.6rem)] font-medium tracking-tight text-white hover:text-glow">
            {contacts.phone}
          </a>
          <a href={`mailto:${contacts.email}`} className="mt-3 inline-block text-lg underline-offset-4 hover:underline">
            {contacts.email}
          </a>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#25d366] px-5 py-3 font-medium text-night transition-opacity hover:opacity-90"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
                <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.7 11.7 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3Z" />
              </svg>
              WhatsApp
            </a>
            <a
              href={contacts.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(45deg,#f09433_0%,#e6683c_25%,#dc2743_50%,#cc2366_75%,#bc1888_100%)] px-5 py-3 font-medium text-white shadow-[0_8px_24px_-10px_rgba(220,39,67,0.7)] transition-opacity hover:opacity-90"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
              </svg>
              Instagram {contacts.instagramHandle}
            </a>
          </div>
        </div>

        <form onSubmit={onSubmit} className="self-start rounded-3xl bg-night/45 p-6 ring-1 ring-white/10 backdrop-blur-md sm:p-8">
          <h3 className="text-xl text-white">{f.card}</h3>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="block text-sm text-glacier/80">
              {f.name}
              <input name="name" required autoComplete="name" placeholder={f.namePh} className={field} />
            </label>
            <label className="block text-sm text-glacier/80">
              {f.phone}
              <input name="phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="+996" className={field} />
            </label>
            <label className="block text-sm text-glacier/80 sm:col-span-2">
              {f.city}
              <input name="city" autoComplete="address-level2" placeholder={f.cityPh} className={field} />
            </label>
            <fieldset className="sm:col-span-2">
              <legend className="text-sm text-glacier/80">{f.role}</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {f.roles.map((r) => (
                  <label
                    key={r}
                    className="cursor-pointer rounded-full border border-white/15 px-4 py-2 text-sm text-glacier transition-colors has-[:checked]:border-glow has-[:checked]:bg-glow has-[:checked]:text-night has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-glow"
                  >
                    <input type="radio" name="role" value={r} className="sr-only" />
                    {r}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <button type="submit" className="mt-7 w-full rounded-full bg-glow px-6 py-3.5 font-medium text-night transition-colors hover:bg-larch-light sm:w-auto">
            {f.submit}
          </button>
        </form>
      </div>

      <footer className="border-t border-white/10 bg-night/45">
        <div className="mx-auto flex max-w-[90rem] flex-col gap-4 px-4 py-8 text-sm text-haze sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4 text-white">
            <Logo variant="horizontal" className="h-7 w-auto" />
          </div>
          <p>{t.footerTag}</p>
          <p>
            {contacts.phone} · {contacts.email} · {contacts.instagramHandle}
          </p>
        </div>
      </footer>
    </section>
  );
}
