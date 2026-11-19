# Tasks

## 1. Static back rhythm

- [x] 1.1 In `css/card-tool.css`, add `position: relative` and change `.back-card-inner` padding to `4.5mm 5mm 5mm`; verify in the Backs preview that the top ornament sits about 0.5 mm higher and the card border, inner frame, and 74.25 × 105 mm card size are unchanged.
- [x] 1.2 Set `.back-card` gap to `2mm`, `.back-hero` `margin-block: -1mm` (keeping `min-height: 24mm` and no `flex`), and `.back-ornament-divider` `margin-block: .6mm .4mm`; verify the hero measures 24 mm and the school art is not resized on any back.
- [x] 1.3 Add `padding-block: 1mm` to `.back-meta-row--classes .back-meta-value` only, not to the row; verify a one-line Classes row stays at its 8.4 mm minimum and a three-line row gains clear space above and below its text.
- [x] 1.4 Update the back-card spacing description in `docs/card-tool-rendering-and-printing.md` to cover the fixed 24 mm hero, the six-piece top half, the 1 mm class-value padding, and the bottom-ornament reserve for one to three lines; verify the document matches the rendered markup and CSS.

## 2. Top-right source stamp

- [x] 2.1 In `spellBack()` in `js/spell-cards.js`, move the `<span class="back-source">` out of `<article class="back-card">` so it is a direct child of `.back-card-inner` after the article; verify the back renders with one source stamp and no console errors.
- [x] 2.2 In `css/card-tool.css`, change `.back-source` to `right: 1.5mm; top: 1mm; bottom: auto`, keeping `z-index: 2`; verify the stamp sits in the top padding strip, outside the class-list flow, and that removing the top ornament in the browser inspector leaves the stamp visible.
- [x] 2.3 Verify clearance for the longest loaded code `AitFR-AVT` and for a typical code such as `XPHB`: the stamp stays inside the border, clears the top ornament by roughly 0.85 mm, and does not overlap the kicker or title.
- [x] 2.4 Update the source-stamp sentence and the back-face fitting note in `docs/card-tool-rendering-and-printing.md` to state top-right placement and that the back meta is still never measured or fitted; verify the document matches the code and the still-true "no measurement" rule in `fitRenderedCards()`.

## 3. Integration checks

- [x] 3.1 Run `npm test` and verify the full suite passes without changes to test expectations.
- [x] 3.2 Run `npm run serve` and inspect backs with one, two, three, and four class lines, including *Dispel Magic* PHB (four lines), *Enhance Ability*, *Sapping Sting*, and a long-title card such as *Mordenkainen's Magnificent Mansion*; verify the top ornament, hero, divider, and meta start are identical, the one- to three-line backs keep a fully visible bottom ornament, and the four-line back prints every class name.
- [x] 3.3 Inspect *Detect Magic* XPHB (74 characters, five lines) and confirm the class list still prints every name, the top half is unchanged, and the residual final-line/ornament clip is no worse than today.
- [x] 3.4 Check Backs, Both, and Debug Print, plus the phone gallery and detail views; verify no page geometry, sheet order, duplex pairing, heading, or gallery/detail navigation changed.
- [x] 3.5 Confirm the diff adds no line-count measurement, `flex` on the hero, per-card class-list variants, truncation, or meta fitting; verify `fitRenderedCards()` still fits back titles only.
- [x] 3.6 Confirm `git status` shows only project files, with no changes inside `5etools/` and no changes to selection identity, cardbooks, or print planning.

## Workflow follow-up

- Archive this change after the project's review requirements are satisfied.
- If five-line lists later need support, open a separate change; do not add a per-card hero or font shrink here.
