# Tasks

## 1. Shared layout and derivation helpers

- [x] 1.1 Add `js/card-tool-layout.js` with page geometry constants (A4 landscape/portrait in millimetres and CSS pixels, page grid, card size, 200px legibility floor) and a DOM-free `computePreviewGrid({availableWidth, availableHeight, page, layout, density, pageCount})`; verify it returns one page at 1366x768, a print-capped page at 1920x1080, 2x1 pages at 2560x1080, and 2x2 pages at 2560x1440.
- [x] 1.2 Add `galleryGroups(plan, layout)` and `detailSequence(plan, layout)` to `js/card-tool-layout.js`; verify a multi-panel strip appears once per sheet, empty cells are omitted, `Backs` groups use back entries, and `Both` pairs each sheet's front and back without duplicating logical cards.
- [x] 1.3 Add `test/cards/CardToolLayout.test.js` covering the reference viewport table, print-size caps, the legibility floor fallback, portrait beast sizing, `Both` pair-aware grids, and `Large`/`Grid` density overrides; run `npm test` and verify all cases pass.
- [x] 1.4 Load `js/card-tool-layout.js` in `spell-cards.html`, `item-cards.html`, and `beast-cards.html` before `js/card-tool.js`; verify each page loads without console errors and `globalThis.CardToolLayout` is defined.

## 2. Responsive shell and sidebar

- [x] 2.1 Replace the fixed `#app` grid with width-mode custom properties and media queries for desktop, compact desktop, tablet, and phone, switch `100vh` to `100dvh` with a `100vh` fallback, and apply `clamp(300px, 22vw, 380px)` to the sidebar; verify 300px at 1366x768, 380px at 1920x1080, and unchanged 1366x768 shell geometry after a resize round trip.
- [x] 2.2 Add `@media (max-height: 820px)` compact vertical rules for a 48px topbar and 40px selection bar; verify 1366x768 uses compact vertical density and 1600x900 does not.
- [x] 2.3 Convert filter groups to accordions that keep the existing chip DOM and `data-filter-group` semantics, summarize active state when collapsed, and scroll inside a bounded `#filter-groups`; verify filters still default to all-on and multiple active chips remain conjunctive.
- [x] 2.4 Reserve at least 240px for `#entity-list` and let collapsed filters release height to it; verify at 1366x768 with every filter group expanded that the list still shows at least six rows.
- [x] 2.5 Add tablet and phone rules that turn the sidebar into an overlay/full-screen Browse surface and hide it from the normal flow below 600px; verify selection, filters, and scroll position survive opening and closing it.
- [x] 2.6 Update `docs/card-tool-architecture.md` with the mode ladder, sidebar cap, and filter accordion layout; verify the documented widths and breakpoints match the CSS.

## 3. Selection bar and selection manager

- [x] 3.1 Replace `#selection-tray` chip rendering with a fixed one-line bar showing the count and a Manage action, and remove the count from the topbar; verify the bar height is identical with 1 and 200 selected cards and contains no per-card chips.
- [x] 3.2 Add a shared selection manager `<dialog>` rendered as a right-side drawer on desktop, with a search field, live `N of M shown` count, and the current selection list; verify focus enters the search field on open and returns to Manage on close.
- [x] 3.3 Implement manager search over name, source, and `config.listMeta(entity)`; verify a query matching three of twenty-four cards shows exactly those three and reports `3 of 24 shown`, and a non-matching query shows the empty state.
- [x] 3.4 Implement per-card removal, remove-matching, and clear-all with a confirm step; verify each removal updates the bar count, browse checkmarks, and preview immediately, and that remaining cards keep the active sort order and print order.
- [x] 3.5 Add Escape handling, focus trapping, dialog labeling, and button accessible names; verify the manager is fully operable by keyboard and screen reader without a mouse.
- [x] 3.6 Add a pure selection-search helper to `js/card-tool-layout.js` and unit tests in `test/cards/CardToolLayout.test.js` for name, source, metadata, case-insensitivity, and no-match results; run `npm test`.
- [x] 3.7 Update `docs/card-tool-architecture.md` and `docs/card-tool-data-and-state.md` for the selection bar and manager contract; verify the documentation states that the manager search does not change print order.

## 4. Preview page grid and density

- [x] 4.1 Restructure `buildPreview()` to emit `.page-unit` wrappers containing a page label and `.screen-page`, append bucket headings as full-width grid rows, and record a `Map<strip, {front, back}>` of print card elements while building `#print-area`; verify page labels, headings, and page order match the pre-change output.
- [x] 4.2 Apply the computed `--page-w` and `--grid-cols` to `#preview-grid`, add a `ResizeObserver` on `#preview-wrap` that recomputes once per animation frame, and remove `.screen-page`'s `min(860px, 100%)` width; verify 1 page at 1366x768, 1 print-size page at 1920x1080, 2 pages at 2560x1080, and 4 pages at 2560x1440.
- [x] 4.3 Wrap consecutive front/back plan entries in a `.sheet-pair` item under `Both`, count grid columns in pairs, and keep bucket headings full-width; verify every front page is adjacent to its back page at 1, 2, and 4 page grids without changing labels or plan order.
- [x] 4.4 Replace `state.zoom`, `setZoom()`, and the zoom buttons with an Auto/Large/Grid density control; verify Auto matches the responsive table, Large always shows one page, Grid maximizes pages above the floor, and switching density leaves selection, layout, content mode, and print unchanged.
- [x] 4.5 Verify Debug Print and `window.print()` still match the page preview under Fronts, Backs, and Both after the grid refactor, including beast portrait pages.
- [x] 4.6 Update `docs/card-tool-rendering-and-printing.md` with the sizing algorithm, print-size caps, density modes, and pairing rules; verify the documented caps match `js/card-tool-layout.js`.

## 5. Mobile workspace surfaces

- [x] 5.1 Add the phone bottom action bar with Browse, Selected and Print, hidden at 600px and above; verify it is reachable with safe-area insets at 390x844 and 360x800 and that each action opens one surface.
- [x] 5.2 Build the Browse sheet with name search, collapsed filter accordions, sort, result count, select-visible, and the entity list; verify filtering and selection work inside the sheet and that the list uses the remaining sheet height.
- [x] 5.3 Build the Print sheet exposing content mode, layout, Print, and Debug Print; verify Print opens the browser dialog with the same pages as desktop and Debug Print shows print geometry only.
- [x] 5.4 Reuse the selection manager for the Selected sheet and keep its search and removal behavior identical to desktop; verify changes made in the sheet update the bottom-bar count and preview on close.
- [x] 5.5 Make card styles viewport-independent by replacing the `1.2vw` entity-title clamp with a container-relative size on `.screen-page` and `.card`; verify a spell title renders at the same computed size in print, the desktop preview, and a 360px gallery.
- [x] 5.6 Update `docs/card-tool-architecture.md` with the mobile bar and sheet ownership; verify no control is duplicated in the topbar and a sheet on phone.

## 6. Mobile card gallery and Pages view

- [x] 6.1 Add the Cards preview as the phone default, grouped by sheet and labeled with the active side, with one tile per logical card, a panel-count badge, and no empty cells; verify card order matches the page plan for Fronts, Backs, and Both.
- [x] 6.2 Render each tile from the print card clone at print dimensions and scale it uniformly; verify the complete card, including borders and body text, is visible at 360x800 with no clipping or reflow.
- [x] 6.3 Add the Cards/Pages toggle, keep the Pages view as the print-matching sheet preview with labels, bucket headings, guides, and pinch zoom, and preserve scroll position in each view across switches; verify Both still reads front, back, front, back in Pages.
- [x] 6.4 Make tiles native buttons with accessible names and a visible expand affordance, and separate taps from scroll gestures with a movement threshold; verify keyboard activation opens a tile and a scroll drag does not.
- [x] 6.5 Add gallery derivation tests in `test/cards/CardToolLayout.test.js` for group order, group side labels, multi-panel dedupe, padding omission, and Both handling; run `npm test`.
- [x] 6.6 Update `docs/card-tool-rendering-and-printing.md` with the Cards-versus-Pages distinction and the print-parity boundary; verify the documentation states the gallery does not replace page verification.

## 7. Single-card detail view

- [x] 7.1 Add the full-screen detail dialog with close control, position indicator, and print-clone card rendering scaled to the viewport; verify it opens on the tapped card and the counter matches the gallery sequence.
- [x] 7.2 Stack multi-panel cards vertically at print geometry with `Panel n of m` labels and keep vertical scrolling inside the card while horizontal swipe changes cards; verify a three-panel beast renders all panels without truncation.
- [x] 7.3 Implement previous/next controls, horizontal swipe, arrow-key navigation, and non-wrapping ends; verify the sequence follows the active sort order and stops at the first and last card.
- [x] 7.4 Implement the front/back flip under Both, open on the back under Backs, and hide the flip under Fronts; verify flipping does not change the card position and prints both sides normally.
- [x] 7.5 Close on the explicit control, Escape, and dialog cancel, restore the gallery scroll position, and leave selection, layout, content mode, sort, and print unchanged; verify closing a zoomed card has no effect on print.
- [x] 7.6 Add `detailSequence` tests in `test/cards/CardToolLayout.test.js` for print order, no wrapping, Backs-only sequences, and Both side availability; run `npm test`.
- [x] 7.7 Update `docs/card-tool-architecture.md` and `docs/card-tool-extension-and-validation.md` with the detail-view state and its ephemeral nature; verify the documents list the manual mobile checks.

## 8. Integration verification

- [x] 8.1 Run `npm test` and verify the full suite passes with the new layout, gallery, and selection-search tests.
- [x] 8.2 Run `npm run serve` and exercise the matrix at 1366x768, 1600x900, 1920x1080, 2560x1080, 2560x1440, 768x1024, 390x844, and 360x800; verify the documented page grid, card size, and list height at each size.
- [x] 8.3 Verify print parity for spell, item, and beast pages under Fronts, Backs, and Both in both Print Preview and Debug Print, including duplex row mirroring and sheet labels.
- [x] 8.4 Verify with 200 selected cards that the selection bar stays one line, the manager search and remove-matching remain responsive, and gallery rendering does not block interaction for more than a moment.
- [x] 8.5 Confirm `git status` shows no changes inside `5etools/` and only intended project and OpenSpec files changed.

## Workflow follow-up

- Review the change artifacts, then archive the change with the project's archive workflow after implementation is complete and verified.
