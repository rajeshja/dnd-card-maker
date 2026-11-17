# Proposal

## Why

Card backs are unreachable from the only surface a phone user has. The mobile gallery and the detail view both derive their side from the print layout: under the default Fronts layout the gallery shows fronts and the detail view hides the flip control, and switching to Backs changes what will come out of the printer. Under Fronts no back cards are rendered at all, so inspecting a back is not merely hidden — it is impossible. A printing tool should not force someone to alter their print job in order to look at the other side of a card.

## What Changes

- Separate **what is being inspected** from **what is being printed**. The card gallery and the detail view gain an inspection side that the print layout no longer dictates.
- Add a gallery `Fronts | Backs` view toggle, shown in Cards view, so a whole sheet's backs can be scanned without touching the print setting.
- Make the detail view's flip control available whenever a back exists, under every layout, and let it open on whatever side the gallery is showing.
- Derive card-level surfaces from an **inspection plan** that always contains both sides, while the page preview, Pages view, print document, and Debug Print keep deriving from the print plan.
- Render the missing side lazily, on first use, reusing the existing record-only rendering path that today only serves multi-panel continuation panels.
- Label gallery groups with the **displayed side** rather than the layout name, so a heading cannot claim Fronts while showing backs.
- Keep the inspection side ephemeral: it resets when the layout changes and when the preview closes, and it never reaches the print document.

## Capabilities

### New Capabilities

- `card-back-inspection`: inspecting either side of a card in the mobile gallery and detail view independently of the print layout, including side availability, the gallery side toggle, the detail flip, and the isolation guarantees that keep inspection out of print.

### Modified Capabilities

- `card-print-layout`: the active layout governs the page preview and the print document, but no longer exclusively governs card-level preview sides; the "must not show a side the print action would not print" rule is narrowed to page-level surfaces so inspection cannot be mistaken for a second print preview.
- `mobile-card-preview`: the gallery labels the side it displays instead of naming both sides under Both, and the detail view offers a flip under every layout while taking its default side from the layout and the gallery's inspection side.

## Impact

- `js/card-tool.js`: inspection plan, lazy opposite-side records, gallery side state, detail flip availability, heading labels.
- `js/card-tool-layout.js`: `galleryGroups()` and `detailSequence()` take a side instead of inferring one from the layout.
- `css/card-tool.css`: gallery side toggle and heading treatment; no page or card geometry changes.
- `test/cards/CardToolLayout.test.js`: existing layout-derived gallery/detail cases are rewritten, with new cases for display order stability and side selection.
- `docs/card-tool-rendering-and-printing.md`, `docs/card-tool-architecture.md`: inspection-versus-print boundary and the ephemeral inspection state.
- Sequencing: `add-responsive-card-workspace` is archived as `2026-11-17-add-responsive-card-workspace`, so its requirements are durable. This change modifies the durable `card-print-layout` and `mobile-card-preview` requirements that tied card-level sides to the print layout, applying the deltas on top of the archived text rather than reverting it. No files under `5etools/` are touched.
