# Build Rules — Architecture, Deployment, Images

## Astro (non-negotiable)
Static HTML, zero client-side JS on content pages. Fast Core Web Vitals = better ranking. No React/Vue runtime.

## Architecture
- Multi-page site: each page is a standalone `.astro` file in `src/pages/`
- Content from `src/site.config.json` (homepage, pricing, FAQ, testimonials)
- Use case pages and support pages have own content within each `.astro` file
- Layout uses `src/layouts/BaseLayout.astro` with shared header/footer
- Images from R2 via `PUBLIC_R2_BASE`
- Blog: `src/content/news/` (never `blog/`)

## CSS
Never use `var(--primary)` for background-color on dark sections. Use inline styles with frontmatter JS variables.

## Deployment
Cloudflare Pages. Both apex + www as custom domains.
`PUBLIC_R2_BASE`: `https://pub-c7a09e1ddb7c45e6a38fcdca1e4b6897.r2.dev`

## Images — NEVER Autonomous
3 per post. Show prompts to owner. Wait for approval. Call Worker. Commit together.
```
POST https://master-image-generator.speech-recognition-cloud.workers.dev/generate
{ "prompt": "...", "name": "seo-slug-here", "sitePrefix": "speechrecognitioncloud" }
```

## SEO Strategy
SRC targets international users searching for speech-to-text software. Pricing in USD.
- Meta titles should be question/answer focused for AI search
- Target long-tail queries: "best free speech to text", "dictation software for [profession]"
- Do NOT target head terms owned by voicerecognition.com.au (e.g. "Dragon", "voice recognition Australia")
- SRC competes on its own merits as an independent product, not as a Dragon alternative page

## Gotchas
- No emoji in site.config.json — GitHub API base64 encoding corrupts them
- YAML needs spaces after colons
- push_files cannot touch .github/workflows/ — paste manually via GitHub web editor
- @astrojs/sitemap pinned to exact 3.1.6 (newer versions crash with Astro 4.x)
- GA4: G-5JQ8BG0E6T

## Content Review Workflow
Drafts go via GitHub Pull Requests on a `draft/` branch. Claude opens PR with full content in description. Cloudflare builds preview deployment. Owner reviews via GitHub email notification or web UI. Merge = deploy.
