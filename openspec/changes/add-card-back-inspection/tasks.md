# Tasks

## 1. Inspection plan and state

- [ ] 1.1 Build `state.inspectPlan` from the same strips and page config with the `both` layout inside `buildPreview()`, and add `state.view.inspectSide` and `state.view.detailSide`; verify by diffing Print Preview and Debug Print before and after that no page, side, or order changes.
- [ ] 1.2 Add a pure helper that compares the deduped inspection sequence with the print sequence for Fronts, Backs, and Both, and cover it in `test/cards/CardToolLayout.test.js`; run `npm test` and verify all three layouts produce identical order.

## 2. Gallery and detail derived by side

- [ ] 2.1 Change `galleryGroups(plan, side)` to group the inspection plan by the requested side and `detailSequence(plan)` to dedupe without a layout argument, and update their callers; verify Fronts, Backs, and Both still produce the same sheet grouping and tile order as before.
- [ ] 2.2 Rewrite the layout-derived gallery and detail cases in `test/cards/CardToolLayout.test.js` for the new signatures and add cases for side selection, multi-panel dedupe, and padding omission; run `npm test`.
- [ ] 2.3 Label gallery headings with the displayed side and remove the `paired` badge; verify no heading names a side other than the one displayed and that the `Sheet N of M - <side>` shape is preserved.
- [ ] 2.4 Update `docs/card-tool-rendering-and-printing.md` with the Cards-versus-Pages distinction, the inspection side, and the boundary that only page previews certify print order; verify the document matches the implemented headings.

## 3. Rendering the missing side

- [ ] 3.1 Generalize the record-only pass so it renders whichever side the inspection plan needs but the print plan did not render, and delete the continuation-panel special case; verify a three-panel beast card still shows one tile and reaches its continuation panel.
- [ ] 3.2 Determine flip availability from the recorded cards rather than the plan's side flags, and show the flip under every layout; verify Fronts, Backs, and Both each offer a working flip on a single-panel card.
- [ ] 3.3 Cache the recorded side per plan signature and clear it whenever `buildPreview()` rebuilds; verify a second flip does no additional rendering and that changing the selection or content mode produces the correct side.

## 4. Inspection surfaces

- [ ] 4.1 Add the `Fronts | Backs` gallery toggle beside `Cards | Pages`, rendered only in Cards view; verify it is absent in Pages view and that switching sides keeps grouping and order.
- [ ] 4.2 Make the detail view open on the gallery's side, keep flipping local to the open card, and reset both values with the layout; verify closing detail returns to the gallery unchanged and that the position indicator never moves on flip.
- [ ] 4.3 Verify the tray at 360x800 fits the count, view mode, and side toggle without clipping once `Manage` is collapsed into the count; if the workspace-bar change has not landed, record the sizing constraint in the task notes rather than shipping a clipped tray.
- [ ] 4.4 Update `docs/card-tool-architecture.md` with the inspection state, its ephemerality, and the ordering rule that inspection order equals print order; verify the document names the surfaces that own each value.

## 5. Integration checks

- [ ] 5.1 Run `npm test` and verify the full suite passes with the rewritten gallery and detail tests.
- [ ] 5.2 Run `npm run serve` and exercise the matrix at 390x844, 768x1024, and 360x800 under Fronts, Backs, and Both, including a three-panel card and 200 selected cards.
- [ ] 5.3 Verify page preview, Pages view, Print Preview, and Debug Print are unchanged in page count, order, sides, and duplex mirroring, and that no inspection control appears in print.
- [ ] 5.4 Verify `git status` shows no changes inside `5etools/` and only the intended project and OpenSpec files changed.

## Workflow follow-up

- `add-responsive-card-workspace` is archived; this change applies its deltas on top of the durable `card-print-layout` and `mobile-card-preview` text, so no reconciliation is pending.
- Archive this change after the project's review requirements are satisfied.
