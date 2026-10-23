# Contributing to start.ng

These rules are official. Every contributor, and every AI a contributor uses, follows them. A PR that breaks them is sent back, however well it works.

## Stick to the styling of the app

Every new page, component or feature must look like it already belongs on start.ng. **Do not step away from how the app looks.** Before you build anything, open the live site and the existing pages and look at how they are laid out, then match them.

- **Use the existing look.** Reuse the colours, fonts, spacing, cards, buttons, pop-ups and tables already in the app. Copy the pattern of the nearest existing page instead of inventing a new one.
- **Use the CSS variables in `src/styles.css`** (`--bg`, `--card`, `--ink`, `--muted`, `--line`, `--lime`, `--danger`, `--ok` and the rest). Do not hard-code hex colours in components or add a second palette.
- **Reuse existing components** (for example `GameCard`, `BoardTable`) before writing your own. If one almost fits, extend it rather than copying it.
- **Add new styles to `src/styles.css`** in the same style as what is there. Do not add a new CSS framework, UI library or font.
- **Dark mode must work.** Every colour has to come from a variable that has a dark value. Check both themes.
- **Phones must work.** Check your page at phone width (about 375px) with no sideways scrolling, except for tables that are meant to scroll.
- **Not sure?** Ask in the team chat and show a screenshot before you open the PR.

A feature that works but looks like a different app will be sent back.

## The rules in detail

### Never do these
1. **No hard-coded colours.** No `#hex`, `rgb()` or named colours in `.tsx` or in new CSS rules. Use a variable. If you truly need a new colour, add it as a variable in **both** `:root` and `:root[data-theme="dark"]` in `src/styles.css`, and say so in the PR.
2. **No new libraries for looks.** No Tailwind, shadcn, MUI, Chakra, Bootstrap, styled-components, emotion, icon packs or web fonts. The app is plain CSS in `src/styles.css`.
3. **No second font.** The body font is the Helvetica stack; the monospace variable `--mono` is for eyebrows, counts and code.
4. **No inline `style={{ }}` for colour, spacing or typography.** Use a class. (A few inline styles exist for values computed at run time, like a width from data. That is the only reason to add one.)
5. **No new page layout.** Pages sit in `.container` (max width 960px, 24px side padding).
6. **No new breakpoints.** The app uses `max-width: 760px` and `max-width: 600px` (and a few older ones). Use those.

### How things look here (copy these)
| Thing | How it is done | Where to look |
| --- | --- | --- |
| Page width | `.container` | `src/styles.css` |
| Hero heading | `.eyebrow` (mono, uppercase), big `h1`, `<mark>` for the lime highlight, `.lead` for the intro | Home in `src/App.tsx` |
| Section heading | `.section-head` with an `h2` and a mono `.count` | the games list in `src/App.tsx` |
| Buttons | `button` / `.btn` (solid), `.ghost` (outlined), `.link` (text). Radius 10px, bold | `src/styles.css` |
| Cards | `--card` background, 1px `--line` border, radius 18px, hover lifts with a lime offset shadow | `.game`, `.card` |
| Game card | `GameCard.tsx`; features add to it through `registerCardPart`, never by editing it | `src/GameCard.tsx` |
| Empty state | `.empty` (dashed border, muted text, a link out) | `src/styles.css` |
| Loading | `Skeleton.tsx` / `.skeleton` shimmer, `aria-busy` on the container | `src/Skeleton.tsx` |
| Not found | `NotFound.tsx` | `src/NotFound.tsx` |
| Tables | `BoardTable.tsx` | `src/BoardTable.tsx` |
| Paging and search | `Pagination.tsx`, `SearchBox.tsx` | `src/` |
| Dark / light | `data-theme` on `<html>`; every colour is a variable | top of `src/styles.css` |
| A new feature | `src/features/<feature>/`, one owner, one flag (see `README.md`) | `src/features/_template` |

### Accessibility and copy
- Real headings in order: one `h1` per page, then `h2`, `h3`. Do not skip levels for looks.
- Links and buttons have text or an `aria-label`. Pictures have `alt`.
- The current page link in the nav has `aria-current="page"`.
- Short, plain English. No jargon on the page. Say what a thing does.

## Pages that search engines read

Some pages are also written by the API as plain HTML, so Google and link previews see real content (`startng-be` `app/routers/pages.py`, routed in `nginx.conf`). When you work on one of them:
- **Anything the API writes into a page must also be visible to people on the real React page.** Never put text on the server version that users cannot see.
- **Keep the server and React versions in step.** Same words, same headings, same links. Use the same class names so the server version looks like the real page while it loads.
- A new address needs: a `location` in `nginx.conf`, a path in `src/main.tsx`, an entry in the sitemap (`pages.py`), and a title and description (`src/seo.ts`).
- Every indexable page has exactly one `h1`, a title, a description and a canonical link.
- Never change a published address without a redirect.

## Before you open a pull request

1. Branch from `dev` and keep the PR to one feature.
2. Run `npx tsc --noEmit` and `npm run build`. CI runs both.
3. Look at your change in light mode, dark mode and at phone width. Put a screenshot in the PR.
4. Fill in the checklist in the PR template.
5. Quick self-check for stray colours in your change:
   ```bash
   git diff origin/dev -U0 -- 'src/*.tsx' 'src/**/*.tsx' | grep -E '^\+.*#[0-9a-fA-F]{3,8}\b'
   ```
   It should print nothing.

## What CI checks

- **CI** (`ci.yml`): typecheck, build, worker tests, dependency audit.
- **CodeQL**: security scan.
- **Malware Scan (CI Gate)**: blocks known malicious code patterns.
- **CodeRabbit**: automatic review. It also flags changes that break the styling rules above.

CI cannot judge how a page looks, so the reviewer and the PR checklist hold that line.

## If you use an AI

Give it this file and `AGENTS.md` first. Ask it to read `src/styles.css` and the nearest existing page before it writes any UI. Check what it gives you against the rules above before you open the PR. The PR is yours, not the AI's.
