# Card Tool: Rendering and Printing

## Front Cards

Each card type has a dedicated front-card renderer. The spell renderer (`cardHTML(spell)`) includes title, school color, level, casting time, range, duration, components, flattened description, and optional material text. `fmtEntries()` recursively handles strings, `entries`, and `list`; it strips simple `{@tag ...}` markup, flattens paragraphs into text, and renders tables as `[Table]`. Item and beast renderers follow their own layout logic without assuming spell fields exist.

## Back Cards and Assets

Back cards are card-specific as well. Spell backs render school, level, classes, concentration/ritual indicators, and the spell name. Item and beast backs use a simpler label layout with item or beast metadata. All back-card layouts rely on relative asset paths under the project-local `card-images/` directory, and the repository ships the spell-card art set there. Optional item and beast artwork resolves from the project-local `img/` directory, which is not tracked by the repository. If that directory is removed, renamed, or path casing changes, the back preview and print output will show broken image references.

## Page Construction and Layouts

`buildPreview()` sorts selected cards, converts each selected entity into a **strip** descriptor, then calls the DOM-free `buildPagePlan(strips, page, layout)` in `js/card-tool-pages.js`. A strip is one physical construction: `{entity, span, width, bucket, truncated, fontPt, panels}`. `span` is the number of content pages, `width` is the number of front panels in the construction (1, 2, or 4), and `panels` holds the rendered panel fragments. The same entries generate both `#screen-pages` and `#print-area`, so preview and print always describe the same document.

The packer groups strips by `bucket` and processes buckets in the order `1, 2, 3, 4, 5, truncated`. It does not sort inside a bucket; the caller supplies the active sort order. Each bucket starts on a fresh sheet and uses `floor(columns / width) * rows` strips per sheet, so a 4x2 page holds 8 / 4 / 4 / 2 / 2 strips for widths 1 / 2 / 2 / 4 / 4, and a 2x2 page holds 4 / 2 / 2. The final sheet of a bucket is padded with `null` cells. `sheetIndex` runs continuously across buckets and is the printed sheet number.

Plan entries are `{side, sheetIndex, bucket, cells}`. Every cell is either `null` (padding: no paper, no guides, no art) or `{strip, panelIndex, back, guides}`. On a front page, `back` is `null`. On a back page, `back` is `"art"`, `"blank"`, or `"page"`:

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

The printer must flip the sheet left-to-right for backs to land behind their own fronts. In print-dialog terms this is normally short-edge duplex for A4 landscape and long-edge duplex for A4 portrait. Run a physical alignment test after changing orientation, grid dimensions, browser print settings, or the mirroring rule.

## Fitting

`fitRenderedCards()` measures screen and print cards after every preview build, reducing titles and body text while preserving readable layout inside each card. Print fitting temporarily applies `#print-area.fit-measure` when print markup is hidden, and Debug Print refits `#print-area` when it opens.

These values are layout policy, not data; adjust only with preview and print checks.

## Print Actions

`@media print` hides the app and shows `#print-area` at the configured A4 orientation with zero page margins. Each page config can set a different card grid and orientation.

- `Print` prints the active layout and does not read or change layout state.
- `Debug Print` exposes the same `#print-area` pages in the browser and can simulate background graphics being disabled.
- Closing the preview resets the layout to Fronts.
