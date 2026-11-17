# Proposal

## Why

The current card tool uses a fixed three-region shell with no upper bounds on its chrome: the selection tray grows with every selected card until the preview is squeezed out, sidebar filters consume the list on a 768px-tall screen, and the 860px page preview leaves large monitors mostly empty. Phones have no usable preview at all. The tool needs one responsive workspace that keeps selection, filtering, and card inspection usable from a 360px phone through a 2560px desktop without scaling the whole interface up or down.

## What Changes

- Add a responsive breakpoint ladder for desktop, compact desktop, tablet, and phone, plus a height-based compact mode so a 1366x768 laptop gets denser chrome automatically.
- Cap the sidebar at a reasonable maximum and make filter groups collapsible accordions. Give the result list a guaranteed minimum height so filters can never squeeze it out.
- Replace the wrapping selection tray with a fixed one-line selection bar containing only the selected count and a Manage action. Remove the duplicate topbar count.
- Add a searchable selection manager (desktop drawer, mobile sheet) with live result counts, per-card removal, remove-matching, and clear-all.
- Add a large-screen preview page grid. The sidebar grows only to its cap; page and card size grow to physical print size, then additional pages appear. Keep front/back pages adjacent under the Both layout.
- Replace the transform-based screen zoom with a preview density control: Auto, Large, and Grid.
- Make mobile a first-class workspace with a bottom action bar for Browse, Selected, and Print, and full-screen sheets for browsing, selection management, and print options.
- Default the mobile preview to a card gallery grouped by sheet. Keep a Pages view for WYSIWYG print verification. Add a single-card detail view opened by a single tap, with multi-panel stacking, swipe navigation between cards, front/back flipping, pinch zoom, and return to the same grid position.
- Preserve the existing print document, selection identity, filter defaults, sort behavior, and Fronts/Backs/Both semantics.

## Capabilities

### New Capabilities

- `card-tool-responsive-workspace`: the responsive shell and workspace behavior, including breakpoints, sidebar and filter sizing, selection bar and selection manager, mobile action surfaces, the large-screen page grid, and preview density.
- `mobile-card-preview`: the mobile card gallery, the Pages view, the single-card detail view, and navigation between cards and panels.

### Modified Capabilities

- `card-print-layout`: preview parity is scoped to the page preview and Pages view, while the card gallery is an additional reading presentation derived from the same plan; the page grid changes how many pages are visible without changing their order or side.

## Impact

- `spell-cards.html`, `item-cards.html`, `beast-cards.html`: responsive shell controls, mobile action bar, sheet markup.
- `css/card-tool.css`: breakpoints, sidebar and preview grid sizing, selection manager and mobile surfaces, detail view.
- `js/card-tool.js`: selection manager, filter accordions, responsive preview sizing, page grid, density control, mobile surface wiring.
- `js/card-tool-pages.js`: read-only consumer of the existing plan; no change to page planning or strip packing is expected.
- `test/`: responsive sizing, page-grid ordering, front/back pairing, selection-manager search, and mobile detail navigation tests.
- `docs/`: architecture, rendering/printing, and extension/validation notes for the responsive workspace and mobile preview.
