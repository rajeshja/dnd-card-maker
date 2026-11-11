# Proposal

## Why

The card tools can print fronts or backs, but never both in one document. Producing
double-sided cards requires two separate print passes and manual stack reinsertion, and
the row mirroring baked into the back pages must line up with however the user flips the
paper. A single interleaved document (sheet 1 front, sheet 1 back, sheet 2 front, sheet 2
back) lets a duplex printer produce correctly paired cards in one job and removes the
reinsertion step from the common case.

The current controls also hide state: `Print` prints whichever side the preview last
showed, so clicking `Show backs` silently changes what `Print` will do. Adding a third
print mode on top of that would make the button row harder to reason about, not easier.

## What Changes

- Replace the global front/back preview state with a three-way **card layout**: `Fronts`,
  `Backs`, or `Both`.
  - `Fronts` produces the current front pages.
  - `Backs` produces the current mirrored back pages.
  - `Both` produces pairs: front page for a chunk of cards, then the mirrored back page
    for the same chunk, repeated for every chunk.
- The on-screen preview shows the exact sequence the selected layout will print,
  including paired sheet labels, so `Both` shows front and back pages alternating.
- `Debug Print` renders the same active layout at print geometry. It no longer inspects a
  side that differs from what `Print` would emit.
- Replace the `Print` / `Print backs` / `Show backs` button set with a three-segment
  layout control plus `Print` and `Debug Print`. `Print` always prints the active layout
  and never mutates it.
- Keep the existing per-row back-page mirroring and page padding, and keep `Backs` as a
  standalone layout so the two-pass workflow still works.
- Label preview pages by physical sheet (`Sheet 2 of 3 - Fronts` / `Sheet 2 of 3 - Backs`)
  so the pairing is verifiable before printing.
- Do not change card templates, page geometry, data loading, selection identity, or saved
  cardbooks.

## Capabilities

### New Capabilities

- `card-print-layout`: how the shared card engine selects, previews, and prints front,
  back, and interleaved front/back page layouts, including sheet pairing and the rule
  that preview and print output describe the same document.

### Modified Capabilities

- None. The project has no existing specs; this change introduces the first capability.

## Impact

- `js/card-tool.js`: `state.side` becomes a per-document layout; page construction emits
  front/back pairs; print wiring stops depending on preview state; sheet labels change.
- `spell-cards.html`, `item-cards.html`, `beast-cards.html`: replace the print button
  group with the layout control and the two remaining actions.
- `css/card-tool.css`: style the layout segments (matching existing buttons), support any
  on-screen grouping of paired pages, and keep print page breaks unchanged.
- `docs/card-tool-rendering-and-printing.md` and `docs/card-tool-extension-and-validation.md`:
  describe the layout model and the duplex validation step.
- Tests: page sequencing and back mirroring are currently inside the browser-only engine.
  Expose the pure page-order logic so `npm test` can cover pair generation, padding, and
  mirroring without a DOM.
- Physical validation remains required: the printer's duplex flip axis must match the
  left-right mirror that back pages assume.
