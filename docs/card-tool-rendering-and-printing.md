# Card Tool: Rendering and Printing

## Front Cards

Each card type has a dedicated front-card renderer. Spell and item panels come from `spellPanel()` and `itemPanel()` in `js/card-tool-content.js`; the beast statblock renderer (`beastCard()`) stays in `js/beast-cards.js`. Spell panels include title, school color, casting time, range, duration, components, description blocks, and the optional material line. Item panels include the item meta line and description blocks. Description text is flattened by `js/card-tool-text.js`: `spellText()` strips simple `{@tag ...}` markup, flattens nested entries, and renders tables as `[Table]`; `flattenCardEntries()` does the equivalent for item and beast entries.

## Back Cards and Assets

Back cards are card-specific as well. Spell backs render school, level, classes, concentration/ritual indicators, and the spell name. Item and beast backs use a simpler label layout with item or beast metadata. All back-card layouts rely on relative asset paths under the project-local `card-images/` directory, and the repository ships the spell-card art set there. Optional item and beast artwork resolves from the project-local `img/` directory, which is not tracked by the repository. If that directory is removed, renamed, or path casing changes, the back preview and print output will show broken image references.

## Content Flow

Each card type registers a `flow(entity, context)` adapter that turns one selected entity into a strip. Spell and item adapters live in `js/card-tool-content.js`; the beast adapter lives in `js/beast-cards.js`. All of them use the shared ladder and filler in `js/card-tool-flow.js` and measure candidate panels with `createMeasure(page)`, an offscreen probe that renders one card at print page geometry and reports whether the content overflows.

The toolbar content control applies one mode to the whole selection:

- **Single card** is the default for spells and items. The adapter tries the type's default body size and steps down in `0.15pt` increments to the shrink floor, which is `max(8.9, defaultPt * 0.9)`. If the content still overflows, the adapter truncates it and ends the last visible block with an ellipsis. Single-mode strips always use bucket `1`, so cards keep the active sort order and never produce bucket headings.
- **Overflow** is the default for beasts. The adapter searches spans in ascending order up to the page cap: `5` for a 4x2 page, `3` for a 2x2 page. It shrinks only at the `1`, `3`, and `5` boundaries, so spans `2` and `4` are used at the default size only. Content beyond the cap keeps the largest construction, truncates the remainder, ends its last content panel with an ellipsis, and sorts into the final `truncated` bucket.

Spell and item content is split into sentence units keyed by block id, so each sentence renders as its own paragraph and the material component line is the spell's final unit. Items fall back to word-level units inside the same block when one sentence cannot fit even one panel at the default size, and that block still renders as one paragraph. Beast content keeps the section/entry/word fill, so a statblock splits at section then entry boundaries before it reaches word fragments.

Every adapter records the chosen `fontPt` on the strip and writes it to `data-content-pt` on the card inner element. The print and screen fitter starts from that size instead of the type default, so a flow-chosen size is preserved at print time.

Bucket headings are screen-only. Under Overflow, `buildPreview()` walks each plan entry's `buckets` and writes one heading before the sheet where a bucket's first card appears, even when that start is partway through a sheet shared with the previous bucket. When two buckets start on the same sheet, both headings appear above that sheet in bucket order. Each heading names the bucket, its card count, the sheets its own cards occupy, and, under Both, printed page numbers; the paired back page of a shared sheet gets no duplicate heading. `#print-area` never receives headings.

## Page Construction and Layouts

`buildPreview()` sorts selected cards, converts each selected entity into a **strip** descriptor, then calls the DOM-free `buildPagePlan(strips, page, layout)` in `js/card-tool-pages.js`. A strip is one physical construction: `{entity, span, width, bucket, truncated, fontPt, panels}`. `span` is the number of content pages, `width` is the number of front panels in the construction (1, 2, or 4), and `panels` holds the rendered panel fragments. The same entries generate both `#screen-pages` and `#print-area`, so preview and print always describe the same document.

The packer orders strips by span bucket (`1, 2, 3, 4, 5, truncated`) without sorting inside a bucket, then groups them into packing classes by strip geometry: `width-1`, `width-2` (spans 2 and 3), `width-4` (spans 4 and 5), and a separate `truncated` class. Each class starts on a fresh sheet and uses `floor(columns / width) * rows` strips per sheet, so a 4x2 page holds 8 / 4 / 2 strips for widths 1 / 2 / 4, and a 2x2 page holds 4 / 2. Consecutive same-width buckets continue on the current sheet, while a change of width starts a fresh sheet. The final sheet of a class is padded with `null` cells. `sheetIndex` runs continuously across classes and is the printed sheet number.

Plan entries are `{side, sheetIndex, buckets, cells}`. `buckets` lists the distinct span buckets present on that sheet in front-cell document order, before row mirroring, so a sheet shared by the end of a span 2 bucket and the start of a span 3 bucket reports `["2", "3"]`. Every cell is either `null` (padding: no paper, no guides, no art) or `{strip, panelIndex, back, guides}`. On a front page, `back` is `null`. On a back page, `back` is `"art"`, `"blank"`, or `"page"`:

- `art` renders the entity's normal back-card art.
- `blank` is a real sheet cell with paper and guides but no content, used behind interior accordion panels.
- `page` renders the strip panel named by `panelIndex`, carrying a continuation page onto the back of the last front panel.

Back cells are placed by mirroring the front cell columns: a front panel at printed column `c` puts its back role at column `columns + 1 - c` in the same row. Per-panel roles are:

| Span | Panel 1 | Panel 2 | Panel 3 | Panel 4 |
|---|---|---|---|---|
| 1 | art | — | — | — |
| 2 | art | art | — | — |
| 3 | art | page 3 | — | — |
| 4 | art | blank | blank | art |
| 5 | art | blank | blank | page 5 |

Three layouts are available from the toolbar:

- **Fronts** is the default: one front page per sheet.
- **Backs** emits only the mirrored back page for each sheet, keeping the two-pass workflow available.
- **Both** emits each sheet's front page followed immediately by its back page, so a duplex job alternates front, back, front, back.

Back pages reverse cell order within each row of the paired front page. With a 4x2 landscape grid, front row `A B C D` becomes back row `D C B A`; the same rule applies to a 2x2 portrait beast page. Padded positions stay empty on both sides. Preview page labels read `Sheet N of M - Fronts` or `Sheet N of M - Backs`, and paired pages in Both share the same sheet number.

The printer must flip the sheet left-to-right for backs to land behind their own fronts. In print-dialog terms this is normally short-edge duplex for A4 landscape and long-edge duplex for A4 portrait. The Backs and Both previews render that mirrored page directly, so back cell placement is checked in the plan tests and the preview rather than on paper.

## Fitting

`fitRenderedCards()` measures screen and print cards after every preview build, reducing titles and body text while preserving readable layout inside each card. Body fitting starts at the card's `data-content-pt` size when the flow adapter set one, so the chosen ladder size is not silently undone. Print fitting temporarily applies `#print-area.fit-measure` when print markup is hidden, and Debug Print refits `#print-area` when it opens. The fitter never grows text above the flow size; the smaller screen preview may shrink a card further when it cannot reproduce the print box at print size.

These values are layout policy, not data; adjust only with preview and print checks.

## Print Actions

`@media print` hides the app and shows `#print-area` at the configured A4 orientation with zero page margins. Each page config can set a different card grid and orientation.

- `Print` prints the active layout and does not read or change layout state.
- `Debug Print` exposes the same `#print-area` pages in the browser and can simulate background graphics being disabled.
- Closing the preview resets the layout to Fronts.
