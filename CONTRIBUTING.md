# Contributing to start.ng

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

## Before you open a pull request

1. Branch from `dev` and keep the PR to one feature.
2. Run `npx tsc --noEmit` and `npm run build`. CI runs both.
3. Look at your change in light mode, dark mode and at phone width. Put a screenshot in the PR.
4. Fill in the checklist in the PR template.

## What CI checks

- **CI** (`ci.yml`): typecheck, build, worker tests, dependency audit.
- **CodeQL**: security scan.
- **Malware Scan (CI Gate)**: blocks known malicious code patterns.
- **CodeRabbit**: automatic review. It also flags changes that break the styling rules above.

CI cannot judge how a page looks, so the reviewer and the PR checklist hold that line.
