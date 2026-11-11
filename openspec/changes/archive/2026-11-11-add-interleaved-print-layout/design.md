# Design

## Context

See `proposal.md` for motivation and `specs/card-print-layout/spec.md` for the behavior
contract.

The shared engine in `js/card-tool.js` currently holds a single `state.side` value. Every
`buildPreview()` call reads it once, chunks the selected items into pages of
`page.rows * page.columns`, pads the last page with `null`, optionally mirrors each back
row, and writes the same page sequence into both `#screen-pages` and `#print-area`. All
three pages (`spell-cards.html`, `item-cards.html`, `beast-cards.html`) repeat the same
markup for the print buttons, and `CardTool.start(config)` wires them by ID. Card
renderers already accept `(side, entity)`, so a back page can be rendered for any chunk
without changing entity modules.

Constraints that shape the design:

- The screen and print DOMs must stay derived from one page plan; Debug Print depends on
  that parity.
- Page geometry is per tool and must not change.
- `js/card-tool.js` is a browser-only IIFE with DOM dependencies, while `npm test` only
  loads ES modules from `test/`. Pure sequencing logic must live outside the IIFE to be
  testable.
- Print CSS already breaks pages per `.page` element; interleaving only changes document
  order, not layout.

## Goals / Non-Goals

**Goals:**

- One layout state that fully describes both preview and print output.
- A pure, testable page-plan function covering chunking, padding, mirroring, and
  pair ordering.
- Screen and print DOMs generated from the same plan entries, so `Both` is verifiable in
  preview and Debug Print.
- A toolbar with three concepts: layout, print, inspect.

**Non-Goals:**

- Detecting or configuring the printer's duplex flip axis in code.
- Persisting layout choice across reloads or in cardbooks.
- Changing card templates, fitting rules, page geometry, data loading, or identity.
- Reworking the print CSS or introducing browser-based print tests.
- Extracting the shared toolbar markup into a template system.

## Decisions

### 1. Replace `state.side` with `state.layout`

Use a single enum: `"fronts" | "backs" | "both"`, default `"fronts"`, reset on
`hidePreview()`. `state.side` disappears.

Rationale: `side` plus an `interleaved` boolean creates four states, one of which
(back-only interleaved) is meaningless, and leaves two variables to keep in sync. A
per-page side without a document-level layout loses the user's intent when the preview is
rebuilt.

Alternative considered: keep `side` and add a separate print-mode variable. Rejected
because preview and print would diverge again, which is the bug this change removes.

### 2. Introduce a pure page-plan module

Add `js/card-tool-pages.js` exporting a function that takes the expanded item list, the
page config, and the layout, and returns ordered entries:

```
{ side: "front" | "back", sheetIndex: number, cards: Array<entity | null> }
```

- Chunk items by `rows * columns` in selection order.
- Pad each chunk to a full page with `null` once, then derive the back from a copy.
- Fronts layout: one entry per chunk, in order.
- Backs layout: one entry per chunk, mirrored, in order.
- Both layout: front entry followed by its paired back entry per chunk.

The function has no DOM access. `js/card-tool.js` assigns it to `globalThis`, matching the
existing `CardToolUtils` / `CardToolText` pattern, and `test/cards/` imports it directly.

Alternatives considered: compute pairs inside `buildPreview()` (untestable, and duplicates
mirroring logic across screen and print); emit DOM nodes from the pure module (couples
logic to markup).

### 3. One plan, two DOMs

`buildPreview()` loops the plan once. For each entry it creates one screen page and one
print page with the same cards and side, then appends both. Total pages = plan length;
sheet total = number of chunks. `applyPageLayout()` and the card border trimming stay
unchanged.

Rationale: preserves the engine's existing invariant that preview and print describe the
same document. Debug Print renders `#print-area`, which now contains interleaved pages
automatically.

### 4. Sheet numbers come from the plan

Each entry carries its chunk index as `sheetIndex`; labels read
`Sheet ${sheetIndex} of ${chunkCount} - ${Fronts|Backs}`. In `Both`, the two entries of a
pair share the index, which is the visible pairing cue. In single layouts, page order and
sheet order coincide.

### 5. Toolbar: segmented layout control plus two actions

Replace the contents of `#print-actions` in all three HTML files with:

```
Layout: [Fronts][Backs][Both]   [Print]   [Debug Print]
```

- The three segments are buttons with `data-layout` values and `aria-pressed`, grouped in
  a `role="group"` with an accessible name.
- `start()` wires the group through one delegated listener; selecting a segment sets
  `state.layout` and calls `buildPreview()`.
- `Print` calls `window.print()` only. It must not read or write layout state.
- `Debug Print` is unchanged.
- Remove the `print-fronts`, `print-backs`, and `toggle-side` controls and their
  listeners.
- Keep the layout control visible at narrow widths. It must not use `.btn` if that would
  let the existing `@media(max-width:850px)` rule hide it; segments get their own
  class that mirrors `.btn` styling.

Rationale: three targets map directly to the three user intents. Alternatives considered:
a native `<select>` (hides current state, extra click for the common side flip), a
dropdown on `Print` (decouples the choice from the preview), and a cycling toggle
(unpredictable third state).

### 6. Keep print CSS untouched

Interleaved placement is achieved through DOM order. `.page { page-break-after: always }`
already emits one sheet per page, and `.page:last-child` still avoids a trailing blank.
Only the toolbar and preview labels need CSS additions.

## Risks / Trade-offs

- **Duplex flip axis mismatch** -> back pages assume a left-right row mirror. The printer's
  long-edge/short-edge duplex setting must reproduce that flip. Mitigation: a `title` hint
  on the `Both` segment and an explicit physical print check in the validation tasks; no
  code-level auto-detection.
- **Preview and print cost roughly double in `Both`** -> each chunk builds two pages into
  two DOMs, and fitting measures overflow synchronously whenever selection changes.
  Mitigation: benchmark a large selection (for example 100 spell cards) during validation;
  if fitting becomes noticeably slow, a follow-up can defer fitting for off-screen pages.
  This change does not add virtualization.
- **Three HTML pages repeat the new markup** -> drift risk. Mitigation: keep the markup
  identical and verify all three pages manually; extracting a shared toolbar remains out
  of scope.
- **Removed controls break muscle memory** -> `Print backs` and `Show backs` disappear.
  Mitigation: document the new flow in the printing docs; the two-pass workflow is still
  reachable through `Backs` + `Print`.
- **Pure module drift from the engine** -> the plan function is only useful if
  `buildPreview()` actually consumes it. Mitigation: unit tests assert ordering, padding,
  and mirroring; browser checks compare labels and page counts against the plan.

## Migration Plan

No data or storage migration. The change is static HTML/CSS/JS: deploy the updated files,
and reloading clears any layout choice because layout is ephemeral.

Rollback is a revert of the change commit; no saved data depends on the layout state.
Update `docs/card-tool-rendering-and-printing.md` (layout model, labels, duplex test) and
`docs/card-tool-extension-and-validation.md` (page-plan unit tests now exist) in the same
change.
