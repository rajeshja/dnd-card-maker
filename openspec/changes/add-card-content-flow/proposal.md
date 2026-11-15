# Proposal

## Why

Long card content has no consistent or printable resolution today. Spell and item cards shrink to a floor and then silently clip the remainder, while beast cards split into an unbounded number of independent panels with no alignment, folding story, or cap. Users cannot print a multi-page card as a single foldable artifact, and content loss is invisible. A bounded, predictable overflow model makes long content printable as 1-, 2-, or 3-panel fold cards (2x2) and up to 5-panel accordions (4x2), with explicit truncation only at the cap.

## What Changes

- Add a selection-wide **Content** control with two modes for every card type:
  - **Single card** (default for spell and item): one panel, shrink no lower than 8.9pt, then truncate and append an ellipsis.
  - **Overflow** (default for beast): flow content across a bounded strip, at 9.8pt, up to 3 panels on a 2x2 layout and up to 5 panels on a 4x2 layout.
- Define three physical constructions: W1 (one panel), W2 (two adjacent panels, spans 2-3, with page 3 on the back of the second panel), and W4 (a full row of four panels, spans 4-5, accordion style, with page 5 on the back of the fourth panel).
- Allow the content font to shrink from 9.8pt down to 8.9pt only where it avoids a construction change or truncation: the 1, 3, and 5 boundaries. Do not shrink at the 2-to-3 or 4-to-5 steps.
- Order overflow content into span buckets 1, 2, 3, 4, 5 and a final truncated bucket, each keeping the active sort order. Pack sheets by strip width instead of by bucket: width-1, width-2 (spans 2-3), and width-4 (spans 4-5) classes each start on a fresh sheet, so same-width buckets share sheets rather than wasting one.
- Print cards that exceed the cap with the largest construction and an ellipsis at the end of their last content panel, in the final bucket, so they can be excluded with a print page range.
- Derive back pages from strip panels rather than from a flat mirror of front cards: back art behind the first panel, blank behind interior accordion panels, and back art or continuation content behind the last panel.
- Print cut guides as solid lines at strip and row boundaries and fold guides as dashed lines between panels of the same strip, on both sides of the sheet with mirror-symmetric geometry.
- Show screen-only bucket headings in overflow mode, including sheet ranges, above the sheet where each bucket begins even when that is mid-sheet, and both headings when two buckets begin on the same sheet. Headings do not appear in print or Debug Print.
- Behavior change for beasts: overflow now stops at 3 panels and truncates beyond that instead of producing an unbounded sequence of cards.

Out of scope: page geometry, selection identity, data loading, saved cardbooks, and the existing Fronts/Backs/Both layout behavior.

## Capabilities

### New Capabilities

- `card-content-flow`: how a selected card's content is measured, assigned to a strip construction, ordered into span buckets, shrunk, and truncated under the Single card and Overflow modes.

### Modified Capabilities

- `card-print-layout`: back pages become derived from strip panels instead of a flat mirrored card list, and the print document gains cut/fold guides plus screen-only bucket headings.

## Impact

- `js/card-tool-pages.js`: page plan input and output change from flat entities to strip descriptors; greedily chunked pages become width-class stacks that keep span order and let same-width buckets share sheets.
- `js/card-tool.js`: content-mode state and control wiring, span measurement, panel-aware rendering, bucket headings, guide metadata, and revised fitting.
- `js/spell-cards.js`, `js/item-cards.js`: overflow content splitting; single-mode ellipsis on truncation.
- `js/beast-cards.js`: cap segmentation at 3 panels, and add a single-mode shrink-then-truncate path.
- `css/card-tool.css`: solid cut and dashed fold guide styles, bucket heading styles, and the content-mode control.
- `spell-cards.html`, `item-cards.html`, `beast-cards.html`: content-mode control markup in the preview toolbar.
- `test/`: strip descriptor, bucket, back-mapping, and guide tests, plus updated page-plan tests.
- `docs/`: rendering/printing, architecture, data/state, and extension/validation notes.
