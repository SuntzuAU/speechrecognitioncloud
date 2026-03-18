# .claude/ — Mandatory Reading for All Claude Sessions

This folder contains the complete instruction set for building and maintaining speechrecognition.cloud.

**Read every file in this folder before writing any code or content.**

After reading this folder, also read these data files:
- `src/data/link-network.json` — the master interlink network config
- `src/site.config.json` — this site's content, colours, products, CTAs
- `src/data/link-usage.json` — what has already been linked from this site
- `src/content/news/` — existing blog posts

## Site type: SaaS product

This is NOT a gateway site. It is the Speech Recognition Cloud SaaS product homepage.
- Multi-page site (homepage, use case pages, support hub, pricing, contact, blog)
- Uses `src/layouts/BaseLayout.astro` for shared header/footer
- Each page is a standalone `.astro` file in `src/pages/`
- `site.config.json` drives homepage content, pricing, testimonials, FAQ
- Use case pages and support pages have their own content within each `.astro` file

## Key differences from gateway sites
- No `[product].astro` dynamic route — each page is its own file
- Layout uses `BaseLayout.astro` with shared header/footer component
- Navigation has a Use Cases dropdown
- Contact form is Name + Email + Message only (no phone, no company)
- Shopify cart URLs for paid tiers, direct download for free tier
- This is cursor-based dictation software, NOT a meeting transcription tool
