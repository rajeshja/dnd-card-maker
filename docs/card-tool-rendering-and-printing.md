# Card Tool: Rendering and Printing

## Front Cards

Each card type has a dedicated front-card renderer. Spell and item panels come from `spellPanel()` and `itemPanel()` in `js/card-tool-content.js`; the beast statblock renderer (`beastCard()`) stays in `js/beast-cards.js`. Spell panels include title, school color, casting time, range, duration, components, description blocks, and the optional material line. Item panels include the item meta line and description blocks. Description text is flattened by `js/card-tool-text.js`: `spellText()` strips simple `{@tag ...}` markup, flattens nested entries, and renders tables as `[Table]`; `flattenCardEntries()` does the equivalent for item and beast entries.

## Back Cards and Assets

Back cards are card-specific as well. A spell back renders the spell name in the hero, the concentration and ritual indicators overlaid on the school art inside that hero, a divider, and a meta block whose rows read level, school, and classes, followed by the bottom ornament. The spell's source code is a separate text stamp pinned to the top-right of the card, outside the card's flowing content, so it stays visible when the top or bottom ornament is missing, fails to load, or is hidden, and when the meta block overflows.

Every spell back uses one static vertical rhythm. The top half is a fixed six-piece stack: top ornament, kicker, underline, 24 mm title hero with its school art and indicators, divider, and the start of the meta block. None of it changes with the class list: the hero is never given `flex` or resized. The flow uses a 2 mm card gap, the hero pulls its surrounding gaps in with -1 mm block margins, and the divider uses 0.6/0.4 mm block margins. Only the classes value carries 1 mm of block padding (the row does not), so a one-line row stays at its 8.4 mm minimum while wrapped lists gain space above and below the text. The bottom ornament keeps `margin-top: auto`, which reserves bottom space and leaves it fully visible for one-, two-, and three-line class lists; four lines is the supported maximum and may push the ornament partly below the card, and five-line lists remain a clipped edge case.

The classes row prints the class list resolved by `prepareSpells()` and never truncates it: a long list wraps and is allowed to overflow the card rather than being abbreviated, ellipsized, or fitted. The indicators are absolutely positioned inside the hero, so they add no flow height and never move the meta block. Item and beast backs use a simpler label layout with item or beast metadata. All back-card layouts rely on relative asset paths under the project-local `card-images/` directory, and the repository ships the spell-card art set there. Optional item and beast artwork resolves from the project-local `img/` directory, which is not tracked by the repository. If that directory is removed, renamed, or path casing changes, the back preview and print output will show broken image references.

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

The same pass also builds `buildPagePlan(strips, page, "both")` into `state.inspectPlan`. That plan is never assigned to `state.plan` and never reaches `#print-area`; it exists so the Cards view can offer either side of every card without changing the print layout. Because it always contains a mirrored back cell for every front cell, it carries the same sheet indices and chunk boundaries as any print layout.

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

## Preview Page Grid and Density

`js/card-tool-layout.js` sizes the on-screen page grid from the measured `#preview-wrap` content box. It uses A4 geometry: landscape `297 x 210 mm` with a `4 x 2` card grid, portrait `210 x 297 mm` with a `2 x 2` grid, and `96 / 25.4` CSS pixels per millimetre. Page width is capped at the physical print width (`~1122px` landscape, `~794px` portrait), so preview cards reach print size at large viewports and never exceed it.

For each candidate `(cols, rows)` whose `cols * rows` pages fit the plan, the algorithm takes the smallest of the horizontal budget per page, the vertical budget converted through the page aspect ratio, and the print cap. A candidate is accepted only when its card width stays at or above the `200px` legibility floor. The accepted candidate with the most visible pages wins; ties prefer the larger page. When no candidate qualifies, the preview falls back to the largest single page, which may be below the floor on very small screens. `--grid-cols` and `--page-w` are applied to `#preview-grid`, and `.screen-page` no longer has a fixed `min(860px, 100%)` width.

Density replaces the old transform zoom and never changes print:

- **Auto** follows the responsive page-count algorithm above.
- **Large** forces a single page at the largest size that fits, capped at print size.
- **Grid** maximizes visible pages while still respecting the floor.

`#screen-pages` is a visibility wrapper. `#preview-grid` holds `.page-unit` cells, each containing a page label and a `.screen-page`; bucket headings span the full grid width. A `ResizeObserver` on `#preview-wrap` recomputes the grid once per animation frame.

Under Both, consecutive front/back plan entries are wrapped in one `.sheet-pair` grid item and `--grid-cols` counts pairs rather than pages, so a front page always stays adjacent to its own back page. If no paired candidate can meet the floor, the pair is stacked at the largest single page size. Page labels, sheet numbers, and plan order are unchanged; only the wrapper differs. `#print-area` receives no page units, headings, pair wrappers, or workspace chrome.

## Cards View, Gallery, and Detail

Below 900px the preview can switch between Pages and Cards; phone starts in Cards. Pages is the WYSIWYG print view: it keeps labels, bucket headings, guides, the active side, print page order, and local pinch zoom, which is discarded when the view closes. Only Pages, the desktop page preview, and Debug Print certify print order, page sides, or duplex pairing; the Cards view never substitutes for them.

The Cards view is a reading surface for the **inspection plan**, not a second print preview. In Cards view the workspace bar's action cluster gains a `Fronts | Backs` side toggle beside `Cards | Pages`; it is not rendered in Pages view. The inspection side is screen state only: it resets to the side implied by the layout (Fronts and Both to fronts, Backs to backs) when the layout changes and when the preview closes, and it never reaches the print document or saved cardbooks. Changing the inspection side never changes the layout, the page preview, the Pages view, the print document, or Debug Print.

`galleryGroups(plan, side)` groups the inspection plan by sheet for the requested side. Tile order follows the plan's front cells, so switching sides changes the displayed face without reordering or regrouping the gallery. Empty padding is omitted, and each strip appears once, so a three-panel card is one tile with a `3 panels` badge. Headings read `Sheet N of M - <displayed side>` from the side actually displayed, never from the layout, and the old `paired` badge is gone. `detailSequence(plan)` dedupes the inspection plan by strip in first-appearance order; detail navigation uses that sequence and stops at the first and last card instead of wrapping. Inspection order equals print order: deduping the inspection plan yields the same card sequence the print plan packs onto its sheets, and duplex mirroring changes only where a back cell sits on its sheet, never which cards are inspected.

Gallery tiles clone the fitted print `.card` nodes. The clone is laid out at print dimensions (`~281 x 397px` landscape, `~397 x 561px` portrait) and scaled uniformly by `transform: scale(k)`, so 5mm padding, borders, body text, and fitted title sizes stay exactly as printed. Tiles are native buttons with accessible names, a visible expand affordance, and a movement threshold so a scroll drag does not open detail. The gallery never substitutes for the Pages view when verifying print output.

The detail `<dialog>` shows one logical card at a time from the same print clones and opens on the side the gallery is displaying. The flip control is offered whenever the opened card's other side has been prepared, under every layout; availability is answered by the recorded cards and the inspection plan, not by the print plan's side flags. Multi-panel cards stack panels vertically at print geometry with `Panel n of m` labels; a continuation panel assigned to the sheet back is still included in the front stack, because it belongs to the same logical card. Flipping mutates only `detailSide`, so it never changes the card's position, the gallery side, the layout, or any print state. Horizontal swipe, previous/next, and arrow keys navigate cards; vertical scrolling stays inside the detail region. Pinch zoom is local to the open detail view. Closing via the control, Escape, or dialog cancel returns to the gallery unchanged and leaves selection, layout, content mode, sort, gallery scroll, and `#print-area` untouched.

### Lazy opposite-side records

The print plan renders one or both sides; the inspection plan needs both. When the displayed inspection side is absent from the print plan, `buildPreview()` leaves it unrendered until the Cards view or detail view asks for it. `recordSide()` then builds that side's pages in a detached pass, marks them `data-recordOnly`, fits them at print geometry, clones the card nodes into `state.printCards`, and removes the pages before printing or Debug Print. The recorded side is cached per plan signature (selection ids, sort, content mode, page config), and the cache is cleared on every `buildPreview()`, so a second flip costs no extra rendering and a changed selection cannot reuse stale cards. The same pass subsumes the former continuation-panel special case: any requested side that the print plan skipped is recorded the same way.

The printer must flip the sheet left-to-right for backs to land behind their own fronts. In print-dialog terms this is normally short-edge duplex for A4 landscape and long-edge duplex for A4 portrait. The Backs and Both previews render that mirrored page directly, so back cell placement is checked in the plan tests and the preview rather than on paper.

## Fitting

`fitRenderedCards()` measures screen and print cards after every preview build, reducing titles and body text while preserving readable layout inside each card. Body fitting starts at the card's `data-content-pt` size when the flow adapter set one, so the chosen ladder size is not silently undone. Back faces have no body fit step: only their titles are fitted, and the back meta block is never measured, compacted, or truncated. The top-right source stamp is plain text outside that flow, so it is never measured or fitted either. Print fitting temporarily applies `#print-area.fit-measure` when print markup is hidden, and Debug Print refits `#print-area` when it opens. The fitter never grows text above the flow size; the smaller screen preview may shrink a card further when it cannot reproduce the print box at print size.

Spell front and back titles that contain `/` break immediately after the slash, including in Debug Print and browser Print. Spell slash titles do not wrap elsewhere; item and beast titles retain their existing layout behavior.

Card typography is viewport-independent. `.screen-page`, `.card`, and the gallery/detail card hosts establish an inline-size container, and the entity title clamp resolves against the card width (`clamp(9pt, 2cqw, 14pt)`) with a `12pt` fallback for browsers without container queries. Because gallery and detail clones keep the print card width before scaling, their computed title size matches print at every viewport.

These values are layout policy, not data; adjust only with preview and print checks.

## Print Actions

`@media print` hides the app and shows `#print-area` at the configured A4 orientation with zero page margins. Each page config can set a different card grid and orientation.

- `Print` prints the active layout and does not read or change layout state.
- `Debug Print` exposes the same `#print-area` pages in the browser and can simulate background graphics being disabled.
- Closing the preview resets the layout to Fronts.
