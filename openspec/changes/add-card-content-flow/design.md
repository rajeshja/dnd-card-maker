# Design

## Context

See `proposal.md` for motivation and `specs/` for the behavior contract. The constraints that shape the approach:

- `CardTool.start(config)` owns one state object and one `buildPreview()` that renders the same page plan into both `#screen-pages` and `#print-area`, so preview and print cannot drift.
- The plan is produced by `buildPagePlan(items, page, layout)` in `js/card-tool-pages.js` and is a flat array of `{side, sheetIndex, cards[]}`. Rows are mirrored with `cards.slice(...).reverse()`. Pages are chunked greedily by `rows * columns`.
- Cards are rendered through `config.render(side, entity)`, which receives a single entity object. Only beasts implement `config.expand`, producing one entity per segment; spells and items render one entity each.
- Page geometry comes from CSS grid variables set from `page.rows` / `page.columns`, with mm-sized `.page` elements in print. Spell and item pages are A4 landscape 4x2; beasts are A4 portrait 2x2.
- Body fitting already exists: `fitRenderedCards()` steps `.entity-body` from `CARD_FIT.description.defaultPt` (9.8) down to `minPt` (8.9) with a matching line-height ramp, and clamps when it cannot win.
- Beast segmentation already measures with a hidden probe page (`beastFits`) and splits by section, entry, and word, but has no panel cap.
- Print guides are currently uniform: `css/card-tool.css` draws `.15mm dashed #777` on every card's right and bottom edge, and `card-tool.js` clears the outer edges inline while rendering.
- Page-plan unit tests are plain JS over the page module (`test/cards/CardToolPages.test.js`), so whatever holds layout logic stays DOM-free.

## Goals / Non-Goals

**Goals:**

- One strip-based plan model that all three card types share, so fronts, backs, guides, buckets, and headings are derived from a single source of truth.
- Bounded content: every card type has an explicit panel cap, a shrink budget, and a truncation outcome.
- Keep the existing preview/print parity, page geometry, selection identity, and Fronts/Backs/Both semantics untouched.
- Make guide roles and bucket order assertable in unit tests rather than only visible in print.

**Non-Goals:**

- No new page sizes, orientations, or mixed-orientation documents.
- No change to card visual design, typography scale, or back-art assets beyond the truncation marker.
- No change to data loading, filtering, selection identity, saved cardbooks, or sort options.
- No new persistence: content mode is session-only, in memory.
- No re-write of the whole renderer into a framework-free component tree.

## Decisions

### D1. The plan's unit becomes a strip descriptor

A rendered card is no longer "one entity in a grid cell"; it is a strip of 1, 2, or 4 panels:

```js
{
  entity,          // selection entity; supplies back art and identity
  span,            // 1..cap content pages
  width,           // 1 | 2 | 4 panels
  bucket,          // "1" | "2" | "3" | "4" | "5" | "truncated"
  truncated,       // boolean
  fontPt,          // default or reduced size used for measurement and render
  panels: [        // length === span
    {index, role: "only" | "first" | "middle" | "last", html, continuation: boolean}
  ]
}
```

Panel fragments carry rendered HTML rather than entity references, because overflow splits one entity across panels and the split is a render-time decision, not a data one.

*Alternative considered:* keep the flat entity list and add a `pages` array to each entity, expanding entities per panel as beasts do today. Rejected: a flat list cannot express that panels 1 and 2 belong to one physical strip, which is exactly what backs, guides, and packing key off.

### D2. Packing is by width class; buckets keep span order

`buildPagePlan(strips, page, layout)` in `js/card-tool-pages.js`:

1. Input strips are already grouped by span bucket in document order (`1, 2, 3, 4, 5, truncated`) and ordered by the active sort inside each bucket. The packer does not sort.
2. Each strip joins a packing class derived from its geometry, not its span: `width: 1`, `width: 2`, `width: 4`, and a separate `truncated` class. Spans 2 and 3 are both width 2; spans 4 and 5 are both width 4. Truncated strips are width 4 on a 4-column page but stay in their own class so over-cap cards remain the last, skippable group.
3. Each class starts on a fresh sheet and is chunked row-major with `stripsPerSheet = floor(columns / width) * rows`, so a 4x2 page gives 8 / 4 / 2 and a 2x2 page gives 4 / 2.
4. `sheetIndex` runs continuously across classes; it is the printed sheet number.

Output entries: `{side, sheetIndex, buckets[], cells[]}` where `buckets` lists the distinct span buckets present on the sheet in front-cell order (structural input for headings, not copy), and each cell is either `null` (padding) or `{strip, panelIndex, back, guides}`.

Because a class is homogeneous, every sheet in it has identical cut geometry: the same fold positions inside each strip, the same cuts between strips and rows. A stack of those sheets still cuts as one guillotine pass, which is what makes the grouping worth having.

*Alternative considered:* keep one class per span. Rejected: span 2 and span 3 produce the same width-2 strip, so a fresh sheet at every span boundary adds paper without adding cut geometry — five 2-page cards plus two 3-page cards need three sheets instead of two.

*Alternative considered:* fill rows greedily across classes so only the final sheet is partial. Rejected: a sheet would then hold a width-4 row above a width-2 row, which is still cuttable but forces a horizontal cut per sheet before any row can be trimmed, giving up stack-and-guillotine cutting for the run. The remaining waste is bounded by one partial sheet per class, at most four on a landscape page and usually fewer because the truncated class is often empty.

### D3. Back pages derive from front cells by mirroring columns

For a front cell at printed column `c` (1-based) of row `r`, its back role is placed at printed column `columns + 1 - c` in the same row. Back roles per panel:

| Span | Panel 1 | Panel 2 | Panel 3 | Panel 4 |
|---|---|---|---|---|
| 1 | art | — | — | — |
| 2 | art | art | — | — |
| 3 | art | page 3 content | — | — |
| 4 | art | blank | blank | art |
| 5 | art | blank | blank | page 5 content |

`blank` is a real sheet cell with no art and no text, but with guide roles, because the paper exists. `null` is padding: no paper role, no guides, no art. The distinction is what lets the spec say "blank behind interior panels" and "no guides around padding" without contradiction.

*Alternative considered:* reverse the front cell list per row and reuse each front card. Rejected: interior accordion cells have no front counterpart to reuse, and span-3/5 continuations live on the back of a panel that already has art on its other neighbours.

### D4. Guides are computed in the plan and drawn by CSS attributes

Each occupied cell gets `guides: {right, bottom}` where each value is `"cut" | "fold" | null`:

- `right = "fold"` when the cell immediately to the right belongs to the same strip; `right = "cut"` when the right neighbour belongs to a different strip or the cell is the last occupied cell before padding; `right = null` at the page's last column.
- `bottom = "cut"` when the cell directly below is occupied; otherwise `null` (page edge, or padding below).

CSS then renders by attribute:

```css
.card[data-guide-right="cut"]  { border-right: .15mm solid #777; }
.card[data-guide-right="fold"] { border-right: .15mm dashed #777; }
.card[data-guide-bottom="cut"] { border-bottom: .15mm solid #777; }
```

The blanket dashed rule and the inline `style.borderRight = "0"` / `borderBottom = "0"` clearing in `buildPreview()` are removed.

*Alternative considered:* derive guide type from bucket in CSS with sibling selectors. Rejected: two span buckets can now share a sheet, so bucket identity says nothing about whether two neighbours belong to one strip; only the plan knows, and encoding it there keeps one implementation and makes it unit-testable.

### D5. Bucket headings are built in the preview, not in the plan

Headings follow buckets, not sheets. `buildPreview()` walks plan entries and, for each bucket in `entry.buckets` it has not seen yet, inserts one heading before that page in `#screen-pages` only:

- A bucket gets its heading on the sheet where its first card appears, even when that is partway through a sheet shared with the previous bucket.
- Two buckets can start on the same sheet; both headings are inserted, in bucket order, above that sheet's page.
- Under Both, the heading sits before the front page of the sheet; the paired back page gets none because every bucket on it is already seen.
- Because sheets are homogeneous per width class, only the two transition sheets (span 2 to 3 and span 4 to 5) can carry more than one bucket.

Label shape is unchanged because it is per bucket:

- `2-page cards — 12 cards, sheets 1-2`
- `Truncated — 1 card, sheets 6 of 9`
- Both layout appends printed page numbers: `…, pages 11-12`

A bucket's sheet range covers only the sheets its cards appear on, so two headings for a shared sheet overlap on that sheet. That is the honest description of the stack.

Headings are never appended to `#print-area`, so print and Debug Print exclude them without filtering logic.

*Alternative considered:* put the heading text itself in the plan. Rejected: it drags copy and sheet-range formatting into the DOM-free module and would have to be stripped again for print. The ordered `buckets` list is structural, and the preview still owns every word.

*Alternative considered:* label by width class (`2-column cards — 7 cards (4 two-page, 3 three-page)`). Rejected: it hides the page count that decides the fold, and it would rewrite heading copy for a saving nobody asked for.

### D6. Measurement uses a probe page and per-type flow adapters

A new shared module (working name `js/card-tool-flow.js`) owns measurement and the shrink ladder; each card page supplies a `flow` adapter:

```js
flow(entity, {mode, maxPanels, fontPt, page}) -> {span, truncated, fontPt, panels}
```

Measurement reuses the existing `beastFits` pattern: build an offscreen `.page` at the real print size in CSS pixels, place one card cell, render the candidate fragment set with the same classes used for print, and compare `scrollHeight` against `clientHeight` with a small tolerance. Fill is a binary search over atomic content units for the panel, then a forward walk across panels.

Atomic units per type:

- **Spell** — paragraphs from the existing `spellText` sentence split; the title and meta header are fixed to panel 1; the material component line is the final unit.
- **Item** — sentences of `flattenCardEntries` output, falling back to word fill for a single oversized sentence.
- **Beast** — the existing section → entry → word fill in `beastSegments`, wrapped with the cap and per-panel `segmentSections`.

Continuation panels set `continuation: true`, reuse the type's continuation header (beasts already do `contd.`), and omit the front-matter block.

*Alternative considered:* render, inspect overflow, then re-render with a smaller split. Rejected: every retry is a synchronous layout pass over a full page and the intermediate frames are visible; the probe does the same work without touching the preview.

### D7. The shrink ladder is one explicit table

```
cap = maxPanels(page)                  // 5 on 4 columns, 3 on 2 columns
single:  span 1 at default -> span 1 at floor -> truncate span 1
overflow:
  boundaries = [1, 3, 5] filtered to <= cap
  for each boundary b:
      if fits(b, default) -> use b at default
      if fits(b, floor)   -> use b at floor
  otherwise -> truncate at cap
```

`fits(span, fontPt)` steps through spans in ascending order, so the common case measures once at the default size and stops. Step size is `CARD_FIT.description.stepPt` (0.15pt), giving at most 7 probes per boundary and at most 3 boundaries per card.

Shrink floor: `max(8.9, typeDefaultPt * 0.9)`.

| Type | Default body size | Floor |
|---|---|---|
| Spell, item | 9.8pt | 8.9pt |
| Beast | 11pt statblock | 9.9pt |

This keeps the existing 8.9pt spell/item behaviour, honours the "no more than 10 percent" budget, and stops applying a 9.8pt assumption to beast statblocks, which are authored larger.

### D8. Truncation reserves room for the ellipsis

`fillWithEllipsis(units, measure)` finds the largest prefix where `units[0..n) + marker` still fits, then renders the marker inside the last block:

```html
<span class="card-ellipsis">…</span>
```

The marker is part of the measured content, never appended after a clip, and is not produced with `text-overflow`, so it cannot be swallowed by an overflow-hidden container.

### D9. Content mode is in-memory state with a per-type default

- Markup: `#content-group` with two buttons `data-content="single" | "overflow"`, placed beside `#layout-group` in `spell-cards.html`, `item-cards.html`, and `beast-cards.html`.
- State: `state.contentMode`, initialised from `config.defaultContentMode` (`"single"` for spell and item, `"overflow"` for beast).
- `updateContentButtons()` mirrors `updateLayoutButtons()`; changing mode calls `buildPreview()`.
- `hidePreview()` keeps resetting `layout` to `fronts` but leaves `contentMode` alone.

*Alternatives considered:* `localStorage` (wrong: must reset on reload) and `sessionStorage` (unnecessary: in-memory state already survives selection clears and layout switches, and dies on reload).

### D10. Single card mode supersedes silent clipping, including for beasts

Spells and items keep their current single-panel path, but body fitting ends in `fillWithEllipsis` instead of a silent clamp. Beasts get a new single-panel path: render the first segment, scale the statblock through one CSS variable (`--beast-body-pt`, default 11pt) down to the floor, then truncate with the ellipsis.

Beast CSS currently hardcodes several sizes (title, subtitle, abilities, details). The implementation should drive them from one multiplier so the shrink budget stays coherent; individual rule edits would drift.

## Risks / Trade-offs

- **Probe/final mismatch** (fonts, print scaling, background art) → Mitigation: the probe renders the same card markup at print geometry inside a `.page`, and `fitRenderedCards()` still runs afterwards as a guard that may only shrink within the floor.
- **Measurement cost on large selections** → Mitigation: ascending span search, short-circuit at the default size, and a per-entity cache keyed by mode and size.
- **Beast behaviour change** — very long statblocks now truncate instead of expanding indefinitely → Mitigation: ellipsis, truncated bucket last, and documentation; this is an intended breaking change recorded in the proposal.
- **Guide geometry drifting from the physical cut** → Mitigation: guide roles live only in the packer and are unit-tested; CSS only maps attribute values to line styles.
- **Residual paper waste at class boundaries** → Accepted: only the last sheet of each class is partial — one each for width 1, width 2, width 4, and truncated, though the truncated class is usually empty — and every sheet still cuts as one homogeneous stack. Filling leftover rows across classes would recover at most those partial sheets at the cost of a horizontal cut before every row trim.
- **Blank interior accordion backs may surprise users** → Mitigation: they are visible in the preview before printing and explained in `docs/card-tool-rendering-and-printing.md`.
- **Heading leakage into print** → Mitigation: headings are appended to `#screen-pages` only, and a test asserts `#print-area` contains no heading element.
- **Screen/print ellipsis disagreement** → Mitigation: the flow result is computed once per entity and drives both render targets.

## Migration Plan

No persisted data changes; cardbooks and selection identity are untouched. The change takes effect on reload, so rollback is a revert with no cleanup. Existing multi-segment beast cards lose their unbounded extra panels, which is the intended behavior change.

## Open Questions

- Whether a truncated card should also be reported in the tray or preview chrome, beyond its heading. Deferrable: the heading and print range already make it skippable.
- Whether the beast `.beast-compact` path should be attempted before truncating at the cap. Deferrable: it is a measurement-order tweak inside D7 and changes no spec outcome.
