'use client';

import { useState } from 'react';
import { Logo } from './Logo';
import { contacts, whatsappLink, type SiteDict } from '@/content/site';

export function Contact({ t }: { t: SiteDict }) {
  const c = t.contact;
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get('name') ?? '').trim();
    const phone = String(data.get('phone') ?? '').trim();
    const message = String(data.get('message') ?? '').trim();
    const next = {
      name: name ? undefined : c.errors.name,
      phone: phone.replace(/\D/g, '').length >= 6 ? undefined : c.errors.phone,
    };
    setErrors(next);
    if (next.name || next.phone) {
      e.currentTarget.querySelector<HTMLInputElement>(next.name ? '#f-name' : '#f-phone')?.focus();
      return;
    }
    const text = [c.messageIntro, `${c.name}: ${name}`, `${c.phone}: ${phone}`, message && `${c.message} ${message}`]
      .filter(Boolean)
      .join('\n');
    window.open(whatsappLink(text), '_blank', 'noopener');
  }

  const field =
    'mt-2 w-full rounded-[3px] border border-white/15 bg-night/35 px-4 py-3 text-white placeholder:text-haze/60 transition-colors focus:border-glow focus:bg-night/55 focus:outline-none';

  return (
    <section id="contact" className="dusk relative isolate text-glacier">
      {/* the Ala-Too ridge: the page above "sets" into the evening sky of this section */}
      <svg aria-hidden viewBox="0 0 1440 90" preserveAspectRatio="none" className="absolute inset-x-0 top-0 -z-10 h-14 w-full sm:h-20">
        <path d="M0 0h1440v34l-70 18-55-26-80 40-60-22-95 38-70-30-60 18-85-44-75 36-50-14-90 42-70-34-65 20-80-40-65 28-55-12-90 44-60-30-70 24-85-42-55 20-60-14V0Z" fill="#13294a" />
      </svg>
      {/* process */}
      <div className="mx-auto max-w-[90rem] px-4 pt-24 sm:px-8 lg:pt-32">
        <h2 className="text-[clamp(1.75rem,3.2vw,2.75rem)] text-white">{t.process.title}</h2>
        <ol className="mt-10 grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-4 lg:gap-0">
          {t.process.steps.map((s, i) => (
            <li key={s.title} className="relative lg:pr-8">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full border border-glow/70 bg-glow/10 font-display text-sm text-glow shadow-[0_0_24px_-6px_rgba(255,207,143,0.6)]">
                  {i + 1}
                </span>
                {i < t.process.steps.length - 1 && <span aria-hidden className="hidden h-px flex-1 bg-gradient-to-r from-glow/60 to-glow/10 lg:block" />}
              </div>
              <h3 className="mt-4 text-lg text-white">{s.title}</h3>
              <p className="mt-2 max-w-[26ch] text-[0.95rem] text-glacier/75">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* contact */}
      <div className="mx-auto mt-16 grid max-w-[90rem] gap-12 border-t border-white/15 px-4 pt-16 pb-16 sm:px-8 lg:mt-20 lg:grid-cols-2 lg:gap-20">
        <div>
          <h2 className="max-w-[18ch] text-[clamp(1.6rem,2.8vw,2.4rem)] text-white">{c.tagline}</h2>
          <p className="mt-10 text-sm text-glacier/75">{c.direct}</p>
          <a
            href={contacts.phoneHref}
            className="mt-2 block font-display text-[clamp(1.6rem,3.4vw,2.6rem)] font-medium tracking-tight text-white hover:text-larch-light"
          >
            {contacts.phone}
          </a>
          <a href={`mailto:${contacts.email}`} className="mt-3 inline-block text-lg text-glacier underline-offset-4 hover:underline">
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
              {c.whatsapp}
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
              {contacts.instagramHandle}
            </a>
          </div>
        </div>

        <form onSubmit={onSubmit} noValidate className="lg:pt-2">
          <h3 className="text-xl text-white">{c.formTitle}</h3>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="f-name" className="text-sm text-glacier/75">
                {c.name}
              </label>
              <input
                id="f-name"
                name="name"
                autoComplete="name"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'e-name' : undefined}
                className={field}
              />
              {errors.name && (
                <p id="e-name" className="mt-1.5 text-sm text-[#ffb4a1]">
                  {errors.name}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="f-phone" className="text-sm text-glacier/75">
                {c.phone}
              </label>
              <input
                id="f-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="+996"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? 'e-phone' : undefined}
                className={field}
              />
              {errors.phone && (
                <p id="e-phone" className="mt-1.5 text-sm text-[#ffb4a1]">
                  {errors.phone}
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="f-message" className="text-sm text-glacier/75">
                {c.message}
              </label>
              <textarea id="f-message" name="message" rows={4} placeholder={c.messagePlaceholder} className={`${field} resize-y`} />
            </div>
          </div>
          <button
            type="submit"
            className="mt-6 w-full rounded-full bg-glow px-6 py-3.5 font-medium text-night transition-colors hover:bg-larch-light sm:w-auto"
          >
            {c.send}
          </button>
        </form>
      </div>

      <footer className="border-t border-white/10 bg-night/45">
        <div className="mx-auto flex max-w-[90rem] flex-col gap-4 px-4 py-8 text-sm text-haze sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-4 text-white">
            <Logo variant="horizontal" className="h-7 w-auto" />
          </div>
          <p>
            © 2026 Architectonica. {t.footer.role}. {t.footer.rights}
          </p>
        </div>
      </footer>
    </section>
  );
}
