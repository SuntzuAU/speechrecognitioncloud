# Content Guidelines — Legal Compliance and Voice

Applies to all content on speechrecognition.cloud.

## Australian Consumer Law (ACL) Compliance

- All content must comply with Australian Consumer Law
- No misleading or deceptive statements
- All factual claims must be reasonably supportable
- If a claim cannot be verified, mark it with `[VERIFY]` — never present it as fact
- When discussing pricing, features, or capabilities, language must reflect that information may change

## Pricing Rules

- SRC pricing is in USD (international product, not Australia-only)
- All pricing claims require verification and a date
- Indicate that pricing may change
- Standard disclaimer: "Pricing accurate at time of publication. Verify current pricing before purchasing."

## Competitor Comparisons

- Competitors may be named in factual comparisons
- Focus on features, licensing models, workflows, or documented differences
- No defamatory, insulting, or disparaging language
- No absolute superiority claims — use conditional language
- CRITICAL: PaperCut Hive is cloud-native (as of 2026) — never misrepresent it as lacking cloud capability
- Good: "Some users may prefer SRC because it offers a free tier with no account required."
- Bad: "SRC is better than [competitor]."

## Healthcare and Medical Content

SRC has dedicated /medical and /healthcare pages. Content must NOT imply that software:
- Improves patient outcomes
- Provides clinical advice
- Is a medical device
- Is clinically validated

Preferred wording: "Designed to assist documentation workflows." / "Often used to support administrative documentation."

## Product Accuracy

- SRC is cursor-based dictation software, NOT a meeting transcription tool
- Never describe it as a meeting notetaker, ambient listener, or audio file transcriber
- It converts live speech to text at the cursor position in any application

## Evidence and Statistics

- Never invent statistics, research findings, survey results, quotes, testimonials, or case studies
- If a statistic is used, cite a credible source
- If source cannot be confirmed, mark with `[VERIFY SOURCE]`

## Voice and Tone

Authoritative, friendly, direct, honest.

**Avoid:** best, ultimate, guaranteed, revolutionary, perfect, proven, world-class, supercharge, game-changing

**Prefer:** may help, can assist, commonly used for, designed to support, often chosen for, practical, straightforward, reliable

## Content Approval Workflow

1. Owner instructs Claude to draft content
2. Claude drafts in chat — does NOT commit
3. Claude flags any `[VERIFY]` items
4. Owner reviews and approves
5. Owner says "commit it"
6. Claude commits — Cloudflare deploys automatically

**Claude must NEVER:**
- Commit content without explicit owner approval
- Delete files without explicit owner confirmation
- Modify pricing without owner-verified sources
- Generate images autonomously
- Invent statistics, quotes, or testimonials
