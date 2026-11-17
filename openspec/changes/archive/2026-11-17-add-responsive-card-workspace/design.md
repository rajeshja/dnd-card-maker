# Design

## Context

See `proposal.md` for motivation and `specs/` for the behavior contract.

The current shell is a fixed two-column grid (`300px 1fr`) with a 56px topbar and a selection tray under the topbar on the preview side. `#app` is `100vh` with `overflow:hidden`. The preview is a flat list of `.page-label` and `.screen-page` siblings inside `#screen-pages`, and `.screen-page` is `min(860px, 100%)`. Card content is expressed in `pt`/`mm`, so shrinking the page box reflows instead of scaling. The only proportional scaling is `transform: scale(state.zoom)` applied directly to each `.screen-page`.

`js/card-tool-pages.js` already produces a stable plan: each entry has `sheetIndex`, `side`, `cells`, and `buckets`, and `cells` reference strips with `panelIndex`. Front and back pages are separate plan entries, with back pages mirroring row order. `buildPreview()` renders screen and print DOM from that same plan and then runs `fitRenderedCards()` on both. Print lives in `#print-area` outside `#app`.

Three constraints shape the implementation:

1. The plan is already the single source of ordering truth. Every new presentation must derive from it rather than sort or group independently.
2. Card fitting is DOM-measurement based. Duplicating card rendering risks divergent font fitting between preview, gallery, and print.
3. Card appearance must not depend on the viewport. The one viewport-relative card style, `clamp(9pt, 1.2vw, 14pt)` for entity titles, must stop resolving against the window.

## Goals / Non-Goals

**Goals:**

- One shell that reallocates space across phone, tablet, compact desktop, laptop, and large desktop without scaling chrome.
- A selection status that is O(1) in height and a selection manager that is O(log n) to edit.
- A preview that grows cards to physical print size and then grows page count.
- A mobile reading surface that renders cards at print geometry instead of shrinking paper.
- Zero change to print output, page planning, strip packing, and selection identity.

**Non-Goals:**

- Changing `card-tool-pages.js`, strip packing, bucket assignment, or front/back mirroring.
- Adding URL, history, or cross-page workspace state.
- Making the gallery a second print preview or a second ordering system.
- Redesigning individual card templates, type scales, or back-card art.
- Virtualizing the browse list or selection manager in this change; the current lists are acceptable at 5etools scale.

## Decisions

### 1. Responsive modes are CSS-driven, with JS only for measurements

Width modes are expressed with media queries and CSS custom properties:

| Mode | Width | Sidebar | Preview |
|---|---|---|---|
| Desktop | `>= 1200px` | `clamp(300px, 22vw, 380px)` | remaining |
| Compact desktop | `900-1199px` | `260px` | remaining |
| Tablet | `600-899px` | overlay sheet | full width |
| Phone | `< 600px` | full-screen Browse sheet | full width |

Height compactness uses `@media (max-height: 820px)` to reduce the topbar to 48px and the selection bar to 40px. `100vh` becomes `100dvh` with a `100vh` fallback, plus safe-area padding on phone.

JS reads one `matchMedia("(max-width: 599px)")` (and the compact-height query) to decide which controls to bind and which preview mode to render. It does **not** recompute the layout tree on every resize; CSS owns the shell and JS owns page sizing.

**Alternative considered:** a JS-computed layout tree. Rejected because it duplicates responsive rules, causes a render pass on every resize tick, and cannot react to CSS-only changes such as scrollbars.

### 2. Sidebar: fixed regions, scrollable filters, reserved list height

`#sidebar` becomes a three-part column:

```text
search          auto
#filter-groups  flex: 0 1 auto; overflow-y: auto; max-height: 45%
sort            auto
#result-bar     auto
#entity-list    flex: 1 1 auto; min-height: 240px
```

Filter groups become `<details>`-like accordions built from a header button plus a panel. The collapsed header summarizes state: `Source · all`, `School · 3 of 8`, `Level · all`. `buildFilters()` keeps the existing chip DOM inside the panel so filter semantics, `data-filter-group`, `on` classes, and `filter()` do not change. Only the container and header are new.

Expansion state is session-only and starts expanded on desktop; on phone every group starts collapsed inside Browse. Filter values still default to all-on.

**Alternative considered:** a permanent modal filter dialog. Rejected for desktop because the current side-by-side filtering loop is fast and familiar.

### 3. Selection bar and one shared manager

The tray is replaced by a fixed 40px bar:

```text
[ N selected ]                              [ Manage > ]
```

The count comes from `state.selected.size`; the topbar count is removed. The bar never renders chips and never wraps.

The manager is one component rendered into a `<dialog>` so focus trapping, Escape, and backdrop behavior come from the platform. On desktop it is a right-side drawer (`dialog.manager[open]` styled as a drawer); on phone it is a full-height sheet. Contents:

```text
Manage selection (24)                         [x]
[search selected............................]
5 of 24 shown
[card row] [card row] [card row] ...
[Remove shown]                    [Clear all]
```

- Search matches `entity.name`, `entity.source`, and `config.listMeta(entity)`; matching is done on a lowercased tuple so it covers the metadata already visible in the browse list.
- `state.manageQuery` is ephemeral and resets when the dialog closes.
- Removal calls `state.selected.delete(id)` and then a single `updateSelection()`; `updateSelection()` already rerenders the list and preview.
- `Remove shown` iterates the currently matching ids.
- `Clear all` requires a second activation (button label changes to `Confirm clear`) and resets on close.
- Focus moves to the search field on open and returns to the Manage button on close.

**Alternative considered:** rendering chips in a scrollable sub-row. Rejected because it still competes with the preview and cannot scale to hundreds of selected cards.

### 4. Preview DOM: page units inside a sized grid

The flat sibling list becomes:

```html
<div id="preview-wrap">
  <div id="preview-grid" style="--grid-cols:2; --page-w:920px">
    <h2 class="bucket-heading">…</h2>          <!-- grid-column: 1/-1 -->
    <div class="page-unit">                     <!-- one grid cell -->
      <div class="page-label">Sheet 1 of 4 - Fronts</div>
      <div class="screen-page">…</div>
    </div>
    <div class="sheet-pair">                    <!-- Both layout only -->
      <div class="page-unit">…front…</div>
      <div class="page-unit">…back…</div>
    </div>
  </div>
</div>
```

- `buildPreview()` iterates the plan as it does today, but appends headings and page units into `#preview-grid`.
- Under `Both`, consecutive front/back entries are wrapped into one `.sheet-pair` item so a pair can never be split across a row. This is the only structural difference.
- `--page-w` is computed by JS and applied to `.screen-page`; `.screen-page` stops using `min(860px, 100%)`.
- Grid styling is `grid-template-columns: repeat(var(--grid-cols), var(--page-w))` with `justify-content: center` and a fixed gap, so pages never stretch.
- Bucket headings span the full grid width and force a new row, which keeps heading scoping identical to the current flat list.

**Alternative considered:** CSS `auto-fit` with a max width. Rejected because the card legibility floor and the print-size cap need to influence both columns and rows, which CSS cannot express directly.

### 5. Page sizing: maximize pages subject to a print-size cap and a legibility floor

Constants derived from print geometry:

| Quantity | Landscape (spell/item) | Portrait (beast) |
|---|---:|---:|
| Page | 297 × 210 mm | 210 × 297 mm |
| Page in CSS px at 96dpi | ~1122 × 794 | ~794 × 1122 |
| Page columns × rows | 4 × 2 | 2 × 2 |
| Card | 74.25 × 105 mm | 105 × 148.5 mm |
| Card in CSS px | ~281 × 397 | ~397 × 561 |
| Legibility floor | 200px card width | 200px card width |

`computePreviewGrid(available, plan, layout, density)`:

```text
aspect = pageWidthMm / pageHeightMm
printMax = pageWidthMm * 96 / 25.4

for each candidate (cols, rows) with cols*rows <= plannedPageCount:
    if layout == both: candidateColumnsArePairs(cols, rows)   # cols counts pairs
    pairGap = cols > 1 ? gap : 0
    pageW = min(
        (available.width - gap*(cols-1) - pairGap) / (cols * pagesPerItem),
        ((available.height - gap*(rows-1)) / rows) * aspect,
        printMax
    )
    cardW = pageW / page.pageColumns
    score = cols * rows * pagesPerItem
    accept if cardW >= FLOOR

choose the accepted candidate with the largest score
tie-break: larger pageW
if none accepted: single page at min(available.width, available.height*aspect, printMax)
```

Measured values for the reference matrix with the sidebar cap applied:

| Viewport | Preview area | Layout | Grid | Page width | Card width |
|---|---|---|---:|---:|---:|
| 1366×768 | ~1066 × 680 | 1×1 | 1 | ~905 | ~226 |
| 1600×900 | ~1248 × 812 | 1×1 | 1 | ~1100 (capped 1122) | ~275 |
| 1920×1080 | ~1540 × 992 | 1×1 | 1 | 1122 (cap) | ~281 |
| 2560×1080 | ~2180 × 992 | 2×1 | 2 | ~1060 | ~265 |
| 2560×1440 | ~2180 × 1352 | 2×2 | 4 | ~920 | ~230 |
| 1366×768 beast | ~1066 × 680 | 2×1 | 2 | ~452 | ~226 |
| 2560×1440 beast | ~2180 × 1352 | 3×2 | 6 | ~452 | ~226 |

Density changes the candidate preference, not the geometry math:

- `Auto` follows the table above: grow page size to the print cap first, then add pages.
- `Large` forces `1×1` and the largest page that fits, capped at print size.
- `Grid` starts from the maximum `cols × rows` the plan allows and walks down until the card floor is met.

`Auto` is the default. This is the direct replacement for the old zoom buttons and label.

### 6. Preview density replaces transform zoom

Remove `state.zoom`, `setZoom()`, the zoom buttons, and the per-page `transform: scale(...)`. Add a three-state segmented control (`Auto | Large | Grid`) next to the content control. Because page size is now assigned through `--page-w`, the page grid composes correctly; the old per-page transform would overlap grid cells.

On phone, `Pages` mode keeps pinch zoom, implemented as a CSS transform on a single `.pages-canvas` wrapper with `transform-origin` at the gesture midpoint. That zoom is local to the Pages view and is discarded when the view closes.

### 7. `Both` pairing is structural

Under `Both`, the pair wrapper guarantees adjacency at every grid size:

```text
2 pair columns: [ F1 B1 ] [ F2 B2 ]
1 pair column:  [ F1 ]
                [ B1 ]
                [ F2 ]
                [ B2 ]
```

Each grid item is one sheet pair. `--grid-cols` counts pairs, not pages. For beasts at 2560×1440 this yields two pair columns and two rows: four pages, matching the spec's paired-grid constraint. Page labels, sheet numbers, and plan order are untouched; only the wrapper changes.

### 8. Mobile surfaces

```html
<nav id="mobile-bar">
  <button data-surface="browse">Browse</button>
  <button data-surface="selected">Selected <span>24</span></button>
  <button data-surface="print">Print</button>
</nav>
```

- The bar is visible below 600px and hidden otherwise.
- Browse and Selected use the same `<dialog>` manager/sheet component with `data-surface`, rendered as a full-height sheet. Print options use a smaller sheet containing the existing content group, layout group, Print, and Debug Print controls.
- Opening a sheet sets `document.body.dataset.surface`, which hides the preview from interaction but keeps it mounted so scroll position and card DOM survive.
- The topbar action groups are hidden on phone; the sheet is the single place those controls live, so there is exactly one interactive copy of each control. To achieve this without duplicating IDs, the sheet markup is a single set of controls and CSS moves them between the topbar and sheet via a `.topbar-actions` host that becomes `display:contents` inside the sheet on phone. If DOM order makes that fragile, move the groups into the sheet at `start()` and leave placeholders in the topbar.
- Closing any sheet restores the previous preview mode; no workspace state is reset.

**Alternative considered:** duplicating controls in a sheet and syncing state. Rejected because duplicate IDs, duplicate listeners, and `aria-pressed` drift are easy to introduce.

### 9. Gallery derives from print DOM, not a second renderer

The strongest fidelity choice is to clone the already-fitted print cards instead of calling `cellHtml()` again:

1. During `buildPreview()`, keep a `Map<strip, {front: HTMLElement, back: HTMLElement}>` populated while building `#print-area`. Keying by the strip object and panel is stable because the plan owns those references.
2. After `fitRenderedCards(print)`, clone the relevant `.card` nodes for the gallery.
3. A gallery tile is a wrapper with explicit print dimensions and an inner clone scaled by `transform: scale(k)` with `transform-origin: top left`:

```html
<button class="gallery-card" style="--tile-w:170px; --tile-h:240px">
  <span class="gallery-scale">
    <div class="card">…print-fitted clone…</div>
  </span>
  <span class="gallery-badge">3 panels</span>
</button>
```

4. The clone keeps inline font sizes produced by fitting, and CSS gives it `width: var(--card-w); height: var(--card-h)` in print pixels. Scaling the wrapper therefore scales the exact print rendering.
5. `fitRenderedCards()` measures layout size, which CSS transforms do not change, so cloning after fitting is correct. Clones must not be re-fitted with a different card width.

Gallery structure:

- Groups come from plan entries in order. Under `Fronts` use front entries; under `Backs` use back entries; under `Both` use each sheet's front entry and mark each tile as paired.
- Within a group, deduplicate by strip so a multi-panel card appears once; its badge shows `strip.panels.length`.
- Empty cells are skipped.
- Grid is `grid-template-columns: repeat(auto-fill, minmax(150px, 1fr))` with tiles preserving the card aspect ratio. On 360px phones this yields two columns; on 390px it yields two comfortable columns.

This also solves the mobile clipping problem: the card is laid out at 281×397 px and then uniformly scaled, so 5mm padding and 8.5pt text stay proportional.

**Alternative considered:** rendering the page at phone width and letting cards reflow. Rejected: `pt`/`mm` content does not reflow, so it clips.

### 10. Detail view

- A full-screen `<dialog>` containing a scroll container, a header (`close`, position, side label), and a footer with previous/next.
- The card stack is built from print clones for the logical card's panels, in `panelIndex` order, one clone per panel, each at print size and scaled to `min(1, availableWidth / cardWidth)`. A multi-panel card is a vertical stack with `Panel n of m` labels.
- Navigation sequence is the flattened, deduplicated gallery sequence, so it follows print order and never invents a new one.
- Under `Both`, front and back clones are both available; flip swaps the stack for the same strip. Under `Fronts`/`Backs` only one side exists and the flip is hidden.
- Swipe uses pointer events with a horizontal threshold and `touch-action: pan-y` on the card so vertical scrolling stays native. Previous/next buttons provide the same action for keyboard and screen-reader users.
- Escape, close button, and dialog `cancel` close the view.
- Scroll position is preserved by not unmounting the gallery; returning simply hides the dialog.
- No zoom state is persisted and none reaches `#print-area`.

### 11. Card styles become viewport-independent

Replace `clamp(9pt, 1.2vw, 14pt)` on `.entity-card h1` with a container-relative value. `.screen-page`, `.card`, and gallery/detail card hosts become `container-type: inline-size`; the title uses `clamp(9pt, 2cqw, 14pt)` resolved against the card width. Because galleries and detail render at print width, the computed title size matches print at every viewport.

This is required for the gallery to be a faithful miniature; without it, titles would shrink to their 9pt floor on a phone while body text stayed at 8.5pt.

### 12. State and print isolation

New ephemeral state, all reset on reload:

```js
state.view = {
  previewMode: "pages",      // "pages" | "cards"
  density: "auto",           // "auto" | "large" | "grid"
  surface: null,             // "browse" | "selected" | "print" | "detail"
  manageQuery: "",
  detailIndex: null,
  detailSide: "front",
}
state.grid = { cols, rows, pageW, cardW }
```

`#print-area` remains outside `#app`, is still built in the same `buildPreview()` pass, and is never affected by `previewMode`, `density`, gallery state, sheet state, or detail state. `body.print-debug` and `@media print` continue to hide `#app`, which will now include the mobile bar, dialogs, and gallery.

## Risks / Trade-offs

- **[Gallery clones duplicate card DOM]** → Memory grows with selection size. Mitigation: clone only occupied cells, skip empty cells, and render gallery lazily per group with `content-visibility: auto` on group sections. Revisit virtualization only if profiling shows a real problem.
- **[Print-card clones can drift if the print DOM changes after cloning]** → `buildPreview()` is the only writer and rebuilds both sides on every selection/layout/content change. Cloning happens at the end of that pass, before any later mutation.
- **[`Both` pairing reduces page count]** → Two pages per grid item means fewer pages visible than an unpaired grid could fit. This is intentional for duplex verification; `Large` and `Grid` still help users choose size versus count.
- **[Container queries may not support every target browser]** → Fall back to a fixed `12pt` title and drop `cqw` if needed. Print is already viewport-independent at page width, so the fallback preserves parity, at the cost of slightly different title sizing on screen.
- **[Sheet controls move between topbar and sheet]** → Moving DOM nodes can drop event listeners if re-created. Bind listeners once in `start()` and move the same nodes; never clone controls.
- **[Phone gallery tap versus scroll]** → A tap threshold is needed so scroll gestures do not open detail. Use `pointerup` within a small movement/time budget and do not attach `click` to the whole tile.
- **[Zoom removal may surprise existing users]** → Keep `Auto` behavior close to today at 1366×768 and label the control clearly. Browser zoom remains available.

## Migration Plan

1. Add the new markup hooks (`#preview-grid`, `#mobile-bar`, manager/sheet dialogs, density control) to the three HTML pages without removing existing IDs used by JS.
2. Introduce CSS custom properties and responsive rules behind the new classes, leaving `.screen-page` width rule in place until the sizing code lands.
3. Refactor `buildPreview()` to build page units and the strip→card map, then switch `.screen-page` width to the computed `--page-w` and delete transform zoom.
4. Add the selection manager and filter accordion structure, reusing existing selection and filter functions.
5. Add gallery and detail derivations from the print DOM.
6. Run unit tests and the manual matrix below; only then remove obsolete tray/zoom markup.

Rollback is a normal revert: no data format, saved-cardbook, or print geometry changes are involved.

## Validation Matrix

| Viewport | Mode under test | Expected |
|---|---|---|
| 1366×768 | desktop + compact vertical | 300px sidebar, one ~905px page, ~226px cards, >=240px list |
| 1600×900 | desktop | ~352px sidebar, one page near print size |
| 1920×1080 | desktop | 380px sidebar, one page at 1122px, ~281px cards |
| 2560×1080 | desktop | 380px sidebar, two pages side by side |
| 2560×1440 | desktop | 380px sidebar, four pages in 2×2, ~230px cards, `Large` gives one page |
| 1366×768 | Both | front/back pair stacked or adjacent, labels unchanged |
| 1366×768 | Backs | only back pages, same order as print |
| 768×1024 | tablet | sidebar overlay, Cards preview available, list usable |
| 390×844 | phone | bottom bar, gallery default, two-column tiles, Pages toggle, detail swipe |
| 360×800 | phone | two-column gallery, no clipped tiles, detail fits card width |
| 390×844 | multi-panel card | one tile with panel badge, vertically stacked panels in detail |
| any | print / Debug Print | unchanged page sequence and geometry; no workspace chrome |

## Open Questions

None blocking. Two items can be tuned during implementation without changing specs or task structure:

- Exact gallery column minimum (150px vs 160px) after testing tile legibility at 360px.
- Whether `Grid` density should allow cards slightly below the 200px floor when the user explicitly selects it. Current decision: no, it respects the floor.
