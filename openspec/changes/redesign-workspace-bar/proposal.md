# Proposal

## Why

The chrome costs too much and fails silently. Two stacked rows (a 56px topbar plus a 44px selection bar) consume ~100px above the preview, and the topbar's action cluster wraps inside a fixed-height grid row clipped by `#app { overflow: hidden }`. Below roughly 1350px of CSS width with a selection active, `Save` and `Clear` are pushed halfway out of the top and `Debug Print` disappears below the bottom edge. The same cluster is now over 950px wide, so adding the missing Load action would widen the failure. The tool also loses its identity below 1200px, because the page title is the only branding and it is the first thing squeezed out.

## What Changes

- Replace `#topbar` and `#selection-tray` with one 48px, full-width **workspace bar** as the only chrome row above the sidebar and preview.
- Give the workspace bar a **card-pack brand mark at every width**, including phone. Show the page title beside it where it fits and hide only the title when controls need the room.
- Convert the three segmented control groups into **dropdowns**: Content (`Single card`, `Overflow`), Layout (`Fronts`, `Backs`, `Both`), Density (`Auto`, `Large`, `Grid`). Each closed button shows the active value as icon plus label; each open menu lists every option as **icon plus full name**. Popovers render in the top layer.
- **BREAKING (internal UI):** collapse the controls to icons with tooltips when the bar is tight. Nothing is removed from the tool; only labels are withdrawn.
- Make the selection count itself the trigger for the selection manager, and remove the now-duplicate `Manage` button. Remove `Clear` from the bar, since the manager already offers a confirmed `Clear all`.
- Reserve slots for `Save` and `Load` in the bar. Load's behaviour is delivered by a separate change; this change only guarantees both have a place that never overflows.
- Add a **no-clip invariant** and an explicit degradation ladder so every control available at a wider width stays reachable at every supported width.
- On phone, keep a 44px masthead strip containing the brand mark and the page title above the preview, and keep the existing bottom Browse/Selected/Print bar and sheets as the only action surfaces.
- Remove the `max-height: 820px` compact vertical rules. One row is one row at every height.

## Capabilities

### New Capabilities

- `card-tool-workspace-bar`: the single-row workspace chrome — brand mark and title visibility, selection status and manager trigger, book-action slots, presentation dropdowns and their icon/label/icon-only forms, the degradation ladder, and the no-clip guarantee.

### Modified Capabilities

- `card-print-layout`: the layout control becomes one dropdown that shows the active layout as its label rather than three simultaneously labelled segments; the toolbar requirement now names the workspace bar and keeps the Print and Debug Print actions.
- `card-tool-responsive-workspace`: viewport modes lose the height-based compact chrome; selection status moves into the workspace bar with the count as the manager trigger and no Manage action; the selection-manager wording follows the count; the large-screen and screen-only requirements name the workspace bar instead of the topbar and selection bar.

## Impact

- `spell-cards.html`, `item-cards.html`, `beast-cards.html`: bar markup, brand mark, dropdown buttons, removal of the tray and the topbar.
- `css/card-tool.css`: one chrome row, bar zones, dropdown and popover styling, brand strip, removal of the compact-height rules and the tray.
- `js/card-tool.js`: dropdown wiring and `aria-checked` state, manager trigger on the count, top-layer menu behaviour, icon hydration, removal of tray/`Manage`/`Clear` wiring, `syncTopbarActions()` scoped to the action cluster.
- `js/card-tool-icons.js` (new): shared inline-SVG icon sprite hydrated from `data-icon` placeholders.
- `test/`: dropdown state selection, icon availability, and the degradation decisions that can be expressed as pure helpers.
- `docs/card-tool-architecture.md`, `docs/card-tool-rendering-and-printing.md`, `docs/card-tool-extension-and-validation.md`: the workspace bar contract, the no-clip invariant, and the rule that new controls must respect the ladder.
- Sequencing: `add-responsive-card-workspace` is archived as `2026-11-17-add-responsive-card-workspace`, so its requirements are now durable in `card-tool-responsive-workspace` and `mobile-card-preview`. This change modifies the durable `card-tool-responsive-workspace` requirements that describe the two-row chrome, so archiving it replaces those requirements instead of leaving a contradiction. No files under `5etools/` are touched.
