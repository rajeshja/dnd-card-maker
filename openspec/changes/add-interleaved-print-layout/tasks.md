# Tasks

## 1. Page-plan module

- [x] 1.1 Add `js/card-tool-pages.js` exporting a DOM-free `buildPagePlan(items, page, layout)` that returns ordered `{side, sheetIndex, cards}` entries, assign it to `globalThis` alongside the existing util modules, and verify `node -e` can import it without a browser
- [x] 1.2 Add unit tests in `test/cards/` covering chunking, final-page padding, front ordering, per-row back mirroring (4x2 and 2x2), and Both interleaving for full and partial chunks, and verify `npm test` passes
- [x] 1.3 Assert in the unit tests that a partial final chunk keeps its real back cards behind their real front cards and leaves padded positions empty on both sides, and verify those cases fail if mirroring or padding is removed

## 2. Engine integration

- [x] 2.1 Replace `state.side` with `state.layout` (`fronts` / `backs` / `both`), build screen and print DOMs from the same plan entries in `buildPreview()`, and verify a spell preview shows front, back, and paired sequences when the layout changes
- [x] 2.2 Label pages as `Sheet N of M - Fronts/Backs` from the plan entry's `sheetIndex`, and verify Both pairs share a number while single layouts number sheets sequentially
- [x] 2.3 Make `Print` call `window.print()` without reading or writing layout state, keep Debug Print rendering `#print-area`, and verify printing from Backs leaves the preview on Backs
- [x] 2.4 Reset the layout to `fronts` in `hidePreview()` and verify clearing the selection returns the next preview to fronts
- [x] 2.5 Confirm item and beast renderers work unchanged in Both by switching both pages to paired pages and checking fronts and backs render for every card

## 3. Toolbar

- [x] 3.1 Replace the `#print-actions` contents in `spell-cards.html`, `item-cards.html`, and `beast-cards.html` with the Fronts/Backs/Both segment group plus Print and Debug Print, and verify a grep finds no `print-backs`, `toggle-side`, or `print-fronts` references
- [x] 3.2 Wire the layout group in `start()` with one delegated listener, set `aria-pressed` on the active segment, and verify each segment switches the preview and leaves exactly one segment active
- [x] 3.3 Style the layout segments like the existing buttons, keep the control visible under the `max-width:850px` rule, and verify the toolbar wraps without clipping above and below 850px on all three pages

## 4. Documentation

- [x] 4.1 Update `docs/card-tool-rendering-and-printing.md` to describe the three layouts, sheet labels, and the duplex flip-axis check, correct statements in the print section that no longer match the engine, and verify the document names no removed controls
- [x] 4.2 Update `docs/card-tool-extension-and-validation.md` so the validation checklist covers Both preview/print and the new page-plan unit tests, and verify the stated `npm test` coverage matches `test/`

## 5. Integration validation

- [x] 5.1 Run `npm test` and confirm the full suite, including the new page-plan tests, passes
- [x] 5.2 Serve with `npm run serve` and on all three pages check load, filter, select, layout switching, sheet labels, page padding, zoom, and console cleanliness
- [x] 5.3 Open Debug Print in each layout and confirm its page sequence and sides match the on-screen preview and the browser's A4 Print Preview
- [x] 5.4 Build a large selection (about 100 spell cards) in Both and confirm preview building and fitting stay usable, recording the observed timing before deciding whether a follow-up is needed

## Workflow follow-up

- Archive the change after review.
