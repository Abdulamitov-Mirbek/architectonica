import { contacts, type SiteDict } from '@/content/site';

/** Second screen: the projects heading with a link to more work on Instagram. */
export function Gallery({ t }: { t: SiteDict }) {
  const p = t.projects;

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
    </section>
  );
}
