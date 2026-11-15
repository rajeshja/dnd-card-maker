# Tasks

## 1. Strip-based page plan

- [x] 1.1 Define the strip descriptor and cell descriptor in `js/card-tool-pages.js` (`entity`, `span`, `width`, `bucket`, `truncated`, `fontPt`, `panels`; cells carry `strip`, `panelIndex`, `back`, `guides`), and verify with a unit test that a one-panel strip maps to exactly one occupied cell.
- [x] 1.2 Replace greedy chunking with bucket packing: group input strips by bucket in the order given, compute `stripsPerSheet = floor(columns / width) * rows`, chunk each bucket into fresh sheets, pad the last sheet, and keep `sheetIndex` continuous across buckets. Verify with `npm test` cases asserting 8/4/4/2/2 strips per sheet for widths 1/2/2/4/4 on a 4x2 page and 4/2/2 on a 2x2 page.
- [x] 1.3 Derive back pages per cell by placing each front panel's back role at printed column `columns + 1 - column`, with roles art/art/page-3/blank/blank/page-5 per span. Verify with tests for spans 1 through 5 on both page geometries, including that padding stays `null` and interior accordion backs are `blank` rather than absent.
- [x] 1.4 Compute guide roles per cell (`right` and `bottom` as `cut`, `fold`, or `null`) for strip-internal folds, strip and row cuts, page edges, and padding. Verify with tests asserting a 4x2 span-2 sheet has folds inside each strip and cuts between strips and rows, while a 4x2 span-4 sheet has three folds and no interior horizontal cut.
- [x] 1.5 Rewrite `test/cards/CardToolPages.test.js` for the new input and output shape, replacing the flat-`cards` assertions with cell and back-role assertions, and verify the full file passes with `npm test`.
- [x] 1.6 Update the page-plan and back-mapping sections of `docs/card-tool-rendering-and-printing.md` to describe strips, buckets, and per-panel back roles, and verify the documented shapes match the exported signatures and the tests.

## 2. Measurement, shrink ladder, and truncation marker

- [ ] 2.1 Add a shared flow module with an offscreen probe that renders one card at print page geometry and reports whether a candidate content set fits, modelled on the existing `beastFits` probe. Verify by checking that a deliberately oversized fragment reports overflow and a short one does not.
- [ ] 2.2 Implement the shrink ladder and floor: `max(8.9, defaultPt * 0.9)`, ascending span search, shrink only at the 1, 3, and 5 boundaries, and truncation at the page cap. Verify with unit tests using an injected measure function that assert the chosen span, size, and truncation flag for each ladder branch.
- [ ] 2.3 Implement ellipsis-aware filling so the marker is measured with the content and rendered inside the last block. Verify with a unit test where the last fitting block plus `…` fits while one more block does not, asserting the marker is present and no extra block is emitted.
- [ ] 2.4 Document the shrink budget and truncation rule in `docs/card-tool-rendering-and-printing.md`, and verify the documented floor matches the tested constant.

## 3. Spell and item flow adapters

- [ ] 3.1 Add a spell flow adapter that uses sentence-level paragraphs as content units, keeps the title and meta block on the first panel, and treats the material component line as the final unit. Verify with a unit test that a long spell splits across the expected number of panels and that continuation panels omit the meta block.
- [ ] 3.2 Add an item flow adapter that splits flattened entries by sentence and falls back to word-level filling for a single oversized sentence. Verify with unit tests for a long multi-sentence item and for one very long sentence.
- [ ] 3.3 Route spell and item single-card rendering through the ellipsis filler instead of a silent clamp. Verify in the browser over `npm run serve` that a spell which previously clipped now ends with a visible ellipsis and that a fitting spell shows none.
- [ ] 3.4 Update `docs/card-tool-item-data-and-text.md` to describe the item flow units and truncation behavior, and verify the doc matches the adapter's tested units.

## 4. Beast flow adapter and statblock shrink

- [ ] 4.1 Cap beast segmentation at three panels, mark overflow beyond the cap as truncated, and keep the existing section/entry/word fill for spans within the cap. Verify with a unit test that a statblock requiring four segments produces three plus a truncated flag.
- [ ] 4.2 Add the beast single-card path: render the first segment, shrink through a single statblock size variable down to the floor, then truncate with the ellipsis. Verify by comparing a short and a very long beast in Single card mode in the browser.
- [ ] 4.3 Drive the beast statblock sizes from one CSS variable in `css/card-tool.css` so the shrink stays proportional, and verify no hardcoded statblock size overrides the variable.
- [ ] 4.4 Record the new beast cap in `docs/card-tool-rendering-and-printing.md`, and verify the documented cap matches the tested limit.

## 5. Preview and print integration

- [x] 5.1 Change `buildPreview()` in `js/card-tool.js` to consume strip plans and render panel fragments, blank interior backs, and padding cells from cell roles instead of `config.render(side, entity)` per grid position. Verify over `npm run serve` that a three-panel spell shows page 3 on the back of its second panel and that interior accordion backs are blank.
- [x] 5.2 Replace the uniform dashed card borders and the inline `borderRight` / `borderBottom` clearing with guide attributes from the plan. Verify in the preview and in Print Preview that strip-internal boundaries are dashed, strip and row boundaries are solid, and sheet edges have no line.
- [x] 5.3 Keep preview and Debug Print page parity and page labels after the new plan shape, including sheet counts that span buckets. Verify that Debug Print shows the same sequence as the preview under Fronts, Backs, and Both.
- [ ] 5.4 Update `docs/card-tool-architecture.md` for the strip plan and shared flow module, and verify the documented call path matches `buildPreview()` as implemented.

## 6. Content mode control

- [ ] 6.1 Add the two-state content control markup beside the layout control in `spell-cards.html`, `item-cards.html`, and `beast-cards.html`. Verify all three files render the control with the same structure and `data-content` values.
- [ ] 6.2 Add per-type default mode configuration and in-memory state with `aria-pressed` wiring, rebuilding the preview on change while leaving the mode untouched when the preview hides. Verify that switching modes rebuilds, that clearing the selection keeps the mode, and that reloading restores the type default.
- [ ] 6.3 Style the control consistently with the layout group, including the existing narrow-screen media query, and verify at a width below 850px that the control stays visible and usable.
- [ ] 6.4 Update `docs/card-tool-data-and-state.md` for the content mode state and defaults, and verify the documented defaults match each page configuration.

## 7. Preview bucket headings

- [ ] 7.1 Emit a heading before the first page of each bucket in `#screen-pages` only, with the bucket name, card count, and sheet range, plus printed page numbers under the Both layout. Verify in the preview that heading ranges match the labeled sheets.
- [ ] 7.2 Style bucket headings as a heavier variant of the existing page label, and verify they read clearly at the default zoom.
- [ ] 7.3 Verify that no heading appears in `#print-area`, in Debug Print, or in a printed page, and that Single card mode shows no headings.

## 8. Integration verification

- [ ] 8.1 Run `npm test` and verify the full suite passes with no skipped page-plan cases.
- [ ] 8.2 Over `npm run serve`, load each of the three pages, select a mixed selection, and verify layout switching, mode switching, filtering, and tray removal still behave as before.
- [ ] 8.3 Use Print Preview and Debug Print at A4 landscape and A4 portrait to verify guide styles, visible ellipses, truncated cards last, and absent headings.
- [ ] 8.4 Print or simulate a duplex pass for a multi-bucket selection and verify the back page aligns with its front page, interior accordion backs are blank, and each bucket starts on a fresh sheet.
- [ ] 8.5 Update `docs/card-tool-extension-and-validation.md` to require a flow adapter and page cap for new card types, and verify the checklist matches the modules added in this change.

## Workflow follow-up

- Archive the change after review and manual print verification are complete.
- Verify the archived main specs contain the new `card-content-flow` capability and the updated `card-print-layout` requirements.
