# Accessibility evidence (WCAG 2.2 AAA-oriented)

## Automated enforcement

- `tests/e2e/accessibility.spec.ts` runs **axe-core** (tags: `wcag2a, wcag2aa, wcag21aa,
  wcag22aa, best-practice`) across `/login`, `/`, `/preview/home`, `/studio/home`.
- The gate **fails CI on any `critical` or `serious` violation** and writes `a11y-report.json`
  (uploaded as a CI artefact).
- Per-page axe assertions also live in `preview.spec.ts` and `studio.spec.ts`.

## Hard requirements (Brief §7) → where they're met

| Requirement                          | Implementation |
| ------------------------------------ | -------------- |
| **Full keyboard operability**        | All controls are native `<button>`/`<a>`/form elements. Section **reordering** works via the dnd-kit `KeyboardSensor` (focus grip → Space → Arrows → Space) **and** explicit Up/Down buttons. Dialogs (Radix) trap focus and restore it on close. |
| **Visible focus states**             | Global `:focus-visible` ring (`--ring`, 2px + offset) in `globals.css`; never removed. |
| **Logical heading hierarchy**        | Exactly one `<h1>` per page (the page title); every section heading is `<h2>`. Predictable regardless of section order/mix. |
| **prefers-reduced-motion respected** | Global media query zeroes animation/transition durations; section hover transforms use `motion-reduce:` utilities. |
| **Forms fully labelled + a11y errors** | Every field has a `<Label htmlFor>`; errors use `role="alert"` + `aria-describedby` + `aria-invalid`; hints linked via `aria-describedby`. Login + inspector both follow this. |

## Toward AAA specifically

- **1.4.6 Contrast (Enhanced, 7:1):** body text tokens exceed 7:1 in both themes (`--foreground`
  on `--background`, `--muted-foreground` ≈ 8:1). Brand gradients are reserved for large text /
  non-text UI where the AAA threshold is 3:1.
- **2.4.1 Bypass Blocks:** skip-to-content link (`.skip-link`).
- **2.4.7 / 2.4.11–13 Focus:** persistent, high-contrast, non-obscured focus indicators.
- **3.3 Inputs:** required fields marked (`*` + `aria-required`), inline recoverable errors.
- **1.4.13 / 2.5 Motion & target size:** reduced-motion honoured; icon controls are ≥28–40px hit areas.
- **Live regions:** "Unsaved/Saved" status (`aria-live="polite"`), toasts via Radix Toast.

## Manual checklist (run before submission)

- [ ] Tab through `/studio/home`: reach every control; focus always visible.
- [ ] Reorder a section using only the keyboard (grip + arrows, and Up/Down buttons).
- [ ] Submit `/login` empty → error announced by screen reader.
- [ ] Toggle OS reduced-motion → hover/transition motion stops.
- [ ] Toggle dark mode → contrast remains strong; focus rings visible.
- [ ] Zoom to 200% → no loss of content/function (responsive layout reflows).
