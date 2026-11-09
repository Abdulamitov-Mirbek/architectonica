# Architectonica website

A frontend-only Next.js site (App Router, TypeScript, Tailwind CSS v4, three.js via React Three Fiber). The site is available in Russian (`/ru`) and Kyrgyz (`/kg`). Visiting `/` redirects to `/ru`.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## Where things are

| What | Where |
|---|---|
| All text (RU + KG), contacts, photo list | `src/content/site.ts` |
| Sections | `src/components/` (Header, Story, Projects, Contact) |
| Scroll story (hero + technology over a pinned 3D stage) | `src/components/Story.tsx` |
| 3D scene: camera path, light, post-processing | `src/components/scene/StoryScene.tsx` |
| House model (built from the facade photos) | `src/components/scene/House.tsx` |
| Sky, ground, mountains, trees, grass, snowfall | `src/components/scene/World.tsx` |
| Procedural textures and the snow shader | `src/components/scene/textures.ts`, `shaders.ts` |
| Overhang section diagram | `src/components/OverhangDiagram.tsx` |
| Logo (vector, from the PDF) | `src/components/Logo.tsx`, `public/brand/*.svg` |
| Photos | `public/images/exterior/`, `public/images/interior/` |
| Colours and fonts | `src/app/globals.css` (`@theme`), `src/app/[lang]/layout.tsx` |

## Before launch

- Replace the 1080 px WhatsApp photos with the original camera files (same file names) so the full-screen hero looks sharp.
- Have a native speaker review the Kyrgyz text in `src/content/site.ts`.
- Add real figures and services when the client provides them.
- Set `metadataBase` in `src/app/[lang]/layout.tsx` to the production domain.

## Deploying to Vercel

The repo is ready for Vercel (`vercel.json`):

1. On vercel.com, choose **Add New → Project** and import `Abdulamitov-Mirbek/architectonica`. Vercel detects Next.js; no settings need changing.
2. Optional: once the domain is known, add the environment variable `NEXT_PUBLIC_SITE_URL` (for example `https://architectonica.kg`) so link previews use it. Until then the Vercel production URL is used.
3. Every push to the production branch deploys automatically; other branches get preview links.

From the terminal instead: `npx vercel` (preview) and `npx vercel --prod` (production).

`vercel.json` pins the Frankfurt region (`fra1`), adds caching for `/images` and `/brand`, and sets basic security headers. `.vercelignore` keeps the client's original files (logo PDF, WhatsApp photos in `src/assets/originals`) out of CLI uploads.
