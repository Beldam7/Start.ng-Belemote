# Instructions for AI assistants working on startng-fe

Read `CONTRIBUTING.md` in full before you change anything, and follow it exactly. It is the design system for start.ng.

The short version:

- The look of the app lives in `src/styles.css`. Use its CSS variables for every colour (never `#hex`), reuse its classes, and match the nearest existing page.
- Add no UI library, CSS framework, font or icon pack. Add no inline styles for colour, spacing or type. Add no new breakpoints (use `760px` and `600px`).
- Dark mode, light mode and phone width (about 375px) must all work.
- Reuse components in `src/` (`GameCard`, `BoardTable`, `Pagination`, `SearchBox`, `Skeleton`, `NotFound`) before writing new ones. New features go in `src/features/<feature>/` (see `README.md`).
- Pages that search engines read (`/`, `/games`, `/games/<name>`, `/creators/<id>`) are also written by the API (`startng-be`, `app/routers/pages.py`). Google must be served exactly what people see, or it ranks the site down. Keep the words, data, order, counts, links, headings, title, description, canonical and robots tags the same in both, change both together, and never write anything for bots only. Follow "Pages that search engines read" in `CONTRIBUTING.md` to the letter.
- Before you say a change is done, run `npx tsc --noEmit` and `npm run build`, and report what they printed. If you could not run something, say so.
- Branch from `dev`. One feature per PR. Never push to `main` or `dev` directly.
