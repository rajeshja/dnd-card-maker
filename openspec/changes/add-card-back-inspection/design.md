# Design

## Context

See `proposal.md` for motivation. The constraints:

- `galleryGroups(plan, layout)` filters plan entries by layout (`fronts` → front entries only, `backs` → back entries, `both` → both) and labels each group with the layout. `detailSequence(plan, layout)` does the same filtering and dedupes by strip. Both consume `state.plan`, which is the **print** plan.
- Under `Fronts`, `buildPagePlan()` never emits back entries, so no argument to those functions can produce back tiles or a back side.
- `buildPreview()` already renders a side that is not being printed in one narrow case: when the layout is Fronts and some card has more than one panel, it builds the `backs` plan, marks the pages `data-recordOnly`, fits them, records the cards in `state.printCards`, then removes the pages. The mechanism for "render a side for records only" exists and is proven.
- `renderDetail()` decides `canFlip` from the plan's `sides` flags and hides the flip unless the layout is `both`. `openDetail()` sets `detailSide` from the layout. Gallery headings read `Sheet N of M - Fronts | Backs | Both` from the layout.
- Unit tests run in Node with no DOM, so side selection, grouping, and ordering are testable as pure functions; visual and gesture behavior is verified in the browser.

## Goals / Non-Goals

**Goals:**

- Either side of any card inspectable in the gallery and detail view, under every layout.
- Print document, page preview, Pages view, and Debug Print byte-identical to today.
- One ordering rule: inspection order equals print order.

**Non-Goals:**

- Changing page planning, strip packing, bucket assignment, mirroring, or card content.
- Making the inspection side a persisted preference or a saved-cardbook field.
- Adding a desktop card-level preview.
- Changing how backs are drawn.

## Decisions

### 1. Two plans: print stays, inspection is added

```
strips ──► buildPagePlan(strips, page, state.layout)  = state.plan        (print, Pages view, Debug Print)
strips ──► buildPagePlan(strips, page, "both")        = state.inspectPlan (gallery, detail)
```

The `"both"` plan is chosen because it always contains a mirrored back cell for every front cell, so both sides exist for every card, with the same sheet indices and the same chunk boundaries as any other layout. Deduping it by strip in first-appearance order yields exactly the print sequence for Fronts, Backs, and Both.

**Alternative considered:** build one plan at `"both"` and filter it for printing. Rejected: it puts a filter between the plan and `#print-area`, which is precisely where a parity regression would hide.

**Alternative considered:** keep one plan and infer the opposite side from the strips. Rejected: it cannot produce sheet indices or mirrored placement without re-implementing the planner.

### 2. Inspection side is its own state

```js
state.view.inspectSide = "front";   // gallery toggle; default follows layout
state.view.detailSide  = "front";   // per open; initialized from inspectSide
```

- Changing the layout sets `inspectSide` to the layout's implied side (Fronts → front, Backs → back, Both → front), so the layout control always has a visible effect.
- Flipping in detail mutates only `detailSide`, so closing the detail view returns to the gallery exactly as it was.
- Both reset with the layout when the preview closes.

### 3. The opposite side is recorded lazily and cached

`buildPreview()` generalizes the existing record-only pass:

```
if the inspection plan references a side the print plan did not render:
    build that side's pages into a detached container
    mark them record-only
    fitRenderedCards(container)
    record strips into state.printCards
    remove the pages
```

It runs on first demand (first flip or first switch to a side not yet recorded), not on every selection change. A signature — selected ids, active sort, content mode, page config — invalidates the cache; `buildPreview()` clears the flag when it rebuilds, so the next demand rebuilds once.

This is the same trick the code already uses for continuation panels, widened from "a multi-panel card needs its last panel" to "a requested side is missing". The narrow condition can then be deleted, since the general rule subsumes it.

**Alternative considered:** always record both sides on every build. Rejected: it roughly doubles card DOM work on phone for users who never flip.

**Alternative considered:** render only the requested card's back on demand. Rejected for now: it needs a per-strip renderer that does not exist, whereas the whole-side pass reuses the planner and the fitter unchanged.

### 4. Availability comes from records, not the plan

`canFlip` becomes a lookup in `state.printCards` for the opened strip's opposite side. Plan `sides` flags describe which sides the **print** plan happened to include and are the wrong question once inspection is independent.

### 5. Gallery functions take a side instead of a layout

```
galleryGroups(plan, side)   // side: "front" | "back"; groups labelled with that side
detailSequence(plan)        // dedupe by strip, first-appearance order
```

`detailSequence` no longer needs a layout because the inspection plan contains both sides and the order is the dedupe order. Existing tests that assert layout-derived grouping are rewritten; new tests assert that the sequence and grouping equal print order for every layout, and that a displayed side never changes order.

### 6. Headings describe what is displayed

Group headings read the displayed side, and the `paired` badge is dropped: once backs are recorded for every card, "paired" is always true and carries no information. Headings remain `Sheet N of M - <Displayed side>` so the existing sheet-label contract still holds.

### 7. The toggle lives with the other preview controls

The `Fronts | Backs` toggle sits beside `Cards | Pages` in the mobile selection tray and is only rendered in Cards view. It uses the same icon and label conventions as the workspace bar's dropdowns. It also appears at tablet widths, where the gallery exists.

At 360px the tray fits count, `Cards | Pages`, and `Fronts | Backs` only after the workspace-bar change collapses `Manage` into the count. If this change lands first, the toggle must be sized accordingly — a documented ordering note, not a code dependency.

### 8. Print isolation is unchanged and explicit

The inspection plan is never assigned to `state.plan`; record-only pages are built in a detached container and removed; `state.printCards` holds fitted nodes that can be cloned. `#print-area` keeps deriving from `state.plan` exactly as before. `body.print-debug` and `@media print` continue to hide `#app`, and an open detail dialog is not part of the print DOM.

## Risks / Trade-offs

- **[Recording a whole side costs a render pass on phone]** → Lazy plus cached; verify with 200 selected cards that the first flip stays responsive.
- **[Fitted record cards hold memory]** → Only occupied cells are recorded, the same shape as the existing gallery records; revisit only if profiling shows a problem.
- **[Cache invalidation can show a stale side]** → Clear the recorded flag inside `buildPreview()` and rebuild on the next demand; never reuse records across a new strip list.
- **[Changing heading semantics affects the sheet-label contract]** → Headings keep the `Sheet N of M - <side>` shape; record the change in the rendering doc and cover it with a test.
- **[Two plans could drift apart]** → Both come from the same `strips` and `page` in the same `buildPreview()` pass; add a test asserting sequence equality between the print plan and the inspection plan.
- **[The unarchived responsive change still requires Fronts to hide the flip]** → Resolve before archiving either change; noted in the proposal's impact.

## Migration Plan

1. Add `inspectPlan` and expose `state.view.inspectSide`, without changing any surface yet; verify print output is unchanged.
2. Change `galleryGroups` and `detailSequence` to take a side, update their callers and tests.
3. Generalize the record-only pass and delete the continuation-panel special case; verify multi-panel cards still show all panels.
4. Switch availability to record lookups and show the flip under every layout.
5. Add the gallery toggle and the displayed-side headings.
6. Verify the matrix, update docs, and run `npm test`.

Rollback is a normal revert; no persisted data or print geometry changes.

## Validation Matrix

| Case | Expected |
|---|---|
| 390x844, layout Fronts | gallery shows fronts; toggle offers Backs; flipping a card shows its back; print still fronts |
| 390x844, layout Backs | gallery defaults to backs; toggle offers Fronts; detail opens on the back |
| 390x844, layout Both | gallery toggle switches sides; Pages view still reads front, back, front, back |
| 768x1024 | toggle present beside `Cards | Pages`; headings name the displayed side |
| 360x800 | tray fits count, view mode, and side toggle without clipping |
| Three-panel card, any layout | one tile, badge intact, detail reaches the continuation panel by flipping |
| 200 cards, first flip | recording finishes without a visible stall |
| any | print and Debug Print unchanged in page count, order, and sides |

## Open Questions

None blocking. Two details can be tuned during implementation without changing the specs or the approach:

- Whether the gallery side toggle should be a two-button segmented control or a compact switch; both satisfy the requirement, and the segmented form matches `Cards | Pages`.
- Whether the detail view should remember the flip for the next card opened in the same session. Current decision: no; each open starts from the gallery side.
