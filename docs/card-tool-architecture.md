# Card Tool: Architecture

## Page Shape

The shared engine in `js/card-tool.js` powers the standalone card pages used throughout this repository. `spell-cards.html`, `item-cards.html`, and `beast-cards.html` each configure a `state.config` with page-specific data files, filters, sort rules, and renderers. The generic code handles the shared DOM shell, selection tray, preview, and print pipeline without depending on the normal 5etools page shell or shared `Renderer` modules.

The 5etools source is a git submodule at `5etools/`, pinned to `d2a2616867` (`v2.25.4`). The card tool reads its data from `5etools/data/`; all card-tool code, styles, tests, and back-card assets live in this repository. Do not modify the submodule.

The shell is a responsive workspace with a top bar, filter sidebar, a fixed one-line selection bar, and a preview area. The hidden `#print-area` contains print-ready pages; `#screen-pages` contains the screen preview, which can present either the page grid (`#preview-grid`) or the card gallery (`#cards-gallery`). The DOM-free `js/card-tool-pages.js` module owns strip bucketing, sheet packing, final-sheet padding, per-row back mirroring, per-panel back roles, cut/fold guide roles, and front/back pair ordering. The DOM-free `js/card-tool-layout.js` module owns preview page sizing, gallery and detail derivation, and selection search. The DOM-free `js/card-tool-cardbooks.js` module owns the stored cardbook format, legacy normalisation, reference identity, dedupe, and unmatched resolution. The loading overlay remains visible until the page-specific setup completes.

### Responsive workspace modes

Width modes are CSS-driven and JS reads the same `matchMedia` breakpoints only to decide which surface to bind:

| Mode | Width | Sidebar | Preview |
|---|---|---|---|
| Desktop | `>= 1200px` | `clamp(300px, 22vw, 380px)` | remaining width |
| Compact desktop | `900-1199px` | `260px` | remaining width |
| Tablet | `600-899px` | overlay Browse surface | full width |
| Phone | `< 600px` | full-screen Browse surface | full width |

`#app` uses `100dvh` with a `100vh` fallback. `@media (max-height: 820px)` compacts the topbar to 48px and the selection bar to 40px. The sidebar never grows past 380px; on tablet and phone it leaves the normal flow and slides over the preview, and below 900px a topbar Browse button (tablet) or the bottom bar (phone) opens it.

The sidebar is a three-part column: a search/sort header, a bounded `#filter-groups` region capped at 45% of the sidebar, and `#entity-list`, which keeps a `240px` minimum height and receives all space released by collapsed filters. The list uses a zero flex basis so its very large row count cannot shrink the filter region to a sliver; expanded filters stay scrollable inside their cap. Every filter group is an accordion built from a header button plus the existing `.chips` panel. The header summarizes active state (`all`, `3 of 8`, `none`) while collapsed; chips keep their `data-filter-group`, `data-value`, and `on` semantics, so filtering stays conjunctive and defaults to all values.

The selection area is a 44px bar (40px when vertically compact) showing only the selected count and a Manage action. It never renders per-card chips and never wraps. The topbar no longer repeats the count. Manage opens one `<dialog>` selection manager, styled as a right-side drawer on desktop and a full-height sheet on phone, with search, `N of M shown`, per-card removal, Remove shown, and a two-step Clear all.

Save and Load open cardbook dialogs from the topbar's book controls. Until `redesign-workspace-bar` lands they sit side by side in the legacy action cluster as a recorded intermediate state rather than a new layout rule. Above 1200px both controls show an icon plus label; below that the labels are withdrawn and only the icons remain, with the `aria-label` keeping the accessible name. Measured in headless Chrome at default zoom with a selection active on all three pages, the pair does not clip and the bar does not scroll horizontally from 900px to 1440px of CSS width. Both dialogs follow the manager pattern: the opener is recorded as the return target, `showModal()` traps focus, Escape closes, and focus returns to the opening control on close.

On phone a fixed bottom action bar exposes Browse, Selected, and Print. Browse uses the sidebar as a full-screen sheet; Selected reuses the selection manager; Print opens a sheet that owns the moved `.topbar-actions` node (content mode, layout, density, Print, Debug Print, Save, Load, Clear). Controls are moved, never cloned, so listeners and `aria-pressed` state stay single-instance. Below 900px the preview can switch between Cards and Pages; phone starts in Cards.

The detail view is a full-screen `<dialog>` fed by the same print-card clones as the gallery. It opens on the side the gallery is inspecting, and its flip is offered under every layout whenever the card's other side has been prepared, so inspecting a back never requires changing the print layout. It is presentation-only: opening, flipping, zooming, or navigating never writes `#print-area`, selection, layout, content mode, density, or sort order, and its state (`detailIndex`, `detailSide`, pinch zoom) is discarded when it closes. A side the print plan did not render is recorded on first demand by a detached pass that is fitted, copied into `state.printCards`, and removed before printing.

## Cardbook Dialogs

Save and Load are modal `<dialog>` elements beside the workspace actions. Both follow the selection manager pattern: capture the control that opened the dialog, call `showModal()`, move focus inside, close on Escape through the platform `cancel`, and return focus to the opener on `close`. Shared dialog state lives in `state.view`:

- `saveConfirm`: the book name waiting for a second activation before an overwrite.
- `loadConfirm`: the book name whose Replace is waiting for confirmation.

The Save dialog owns the name field and all inline status, replacing the old `prompt()` and `alert()`. The Load dialog lists the current type's stored books, marks legacy spellbooks, reports unreadable entries, and resolves references against `state.all` through `js/card-tool-cardbooks.js`. Add and Replace mutate `state.selected` and then call `updateSelection()` once, so the bar, browse list, preview, and print document rebuild from the same page plan. Loading never changes layout, content mode, density, sort, or print order, and it never rewrites storage. A clean load closes the dialog; a load with unmatched references keeps it open for the report. See [card-tool-cardbooks.md](card-tool-cardbooks.md) for the storage contract.

`js/card-tool-flow.js` is the shared content-flow module: it owns the offscreen page probe, the shrink ladder, panel filling, the ellipsis filler, and the beast section segmenter. `js/card-tool-content.js` holds the spell and item content units, panel templates, and flow adapters. Page scripts keep only data loading, filters, sort rules, back-card art, and page configuration. The flow module also publishes its helpers on `globalThis.CardToolFlow` for `buildPreview()` and `beast-cards.js`, so each page loads it before the page script.

## User Flow

1. `start(config)` initializes the page-specific card type and shared UI.
2. `load()` fetches the configured entity files and de-dupes them by `${type}|${name}|${source}`.
3. `buildFilters()` creates group chips based on each entity's schema.
4. `filter()` applies search, chips, and sort order.
5. `renderList()` creates selectable rows from `filtered`.
6. `toggle()`, `selectVisible()`, and `clearSelection()` mutate the `selected` map.
7. `updateSelection()` updates the count, browse checkmarks, the optional manager list, and rebuilds or hides the preview.
8. `buildPreview()` converts each selected entity into a strip descriptor, builds the print page plan from those strips, and builds the both-sides inspection plan from the same strips and page config. Screen markup is grouped into `.page-unit` cells inside `#preview-grid`, with `.sheet-pair` wrappers under Both, and the same pass records each strip's print card elements for the gallery and detail view.
9. The card gallery and detail view are derived from those print-card clones after fitting, so they never re-render or re-fit card text. The gallery reads the inspection plan for the side chosen in the `Fronts | Backs` toggle and records the missing side on first demand; the detail view opens on that side and flips locally.
10. `Save` opens the Save dialog and writes a typed `5etools-cardbook-v1` envelope under the per-type storage key. `Load` lists the stored books for the current entity type and applies Add or Replace through `updateSelection()`.
11. `Print` calls `window.print()` for the active Fronts, Backs, or Both layout; `Debug Print` renders the same `#print-area` pages.

A page can supply a `flow(entity, context)` adapter. When it does, `buildPreview()` creates one measurement probe for the build, passes `mode`, `page`, `maxPanels`, and `measure` in the context, and uses each returned strip directly. It disposes the probe after all strips are built. Without a `flow` hook, `buildPreview()` falls back to one single-panel strip per entity, expanding with `config.expand` first when that legacy hook exists. Panel HTML comes from the strip, back art comes from `render("back", strip.entity)`, and `page` back cells reuse the strip panel named by `panelIndex`. This keeps front and back markup, guides, and bucket headings derived from one plan.

The list is filtered independently from selection, so changing filters does not remove already selected cards. Sorting affects both the visible list and selected-card page order.

## State

- `all`: deduplicated loaded entities.
- `filtered`: current list after filtering and sorting.
- `selected`: `Map` keyed by `${type}|${name}|${source}` and storing selected card data.
- `config`: page-specific metadata such as title, files, filters, sort rules, and page geometry.
- `layout`: active preview and print layout, `fronts`, `backs`, or `both`; resets to `fronts` when the preview closes.
- `contentMode`: active content mode, `single` or `overflow`; starts from the page type's default and survives a selection clear.
- `plan`: the print page plan from `buildPagePlan(strips, page, layout)`, used by the preview grid, the Pages view, `#print-area`, and Debug Print only.
- `inspectPlan`: the both-sides page plan built from the same strips and page config, used by the gallery and detail view only. It is never assigned to `state.plan`, so inspection cannot change print order, page count, page sides, or duplex mirroring.
- `strips`: the strip descriptors of the current build, kept so a missing inspection side can be recorded lazily without rebuilding the flow.
- `printCards`: `Map<strip, {front, back}>` of the print card elements per panel, recorded while building `#print-area` and extended by `recordSide()` when the inspection plan needs a side the print plan skipped. Recorded pages are fitted in a detached pass and removed before print/Debug Print runs.
- `recorded`: `{signature, side}` cache for that detached pass. The signature covers selected ids, sort, content mode, and page config, and the cache is cleared on every `buildPreview()`.
- `view`: ephemeral presentation state: `previewMode` (`pages` or `cards`), `density` (`auto`, `large`, or `grid`), `inspectSide` (`front` or `back`, the gallery side toggle), `detailSide` (per open, initialized from `inspectSide`), the active mobile `surface`, the manager query, the detail index/side, and the cardbook dialog confirmations (`saveConfirm`, `loadConfirm`). Pending confirmations reset when a dialog closes, when the save name changes, or when a different book row is chosen.
- `grid`: the last computed `{cols, rows, pageW, cardW}` preview metrics.

Cardbook dialogs keep their return-focus target outside `state` (`saveReturnFocus`, `loadReturnFocus`) so the detail and manager surfaces can keep their own targets. Loading a book never writes `state.layout`, `state.contentMode`, `state.view.density`, or the page plan directly: it changes only `state.selected`, then calls `updateSelection()` once. The active sort therefore applies to the loaded cards at render, and the front/back print order is rebuilt through the normal `buildPreview()` path. Selecting, sorting, printing, and pagination behave exactly as they do for a hand-picked selection.

Inspection order equals print order. The gallery and detail view dedupe `state.inspectPlan` in plan order, which is the card sequence the print plan packs onto its sheets; duplex mirroring changes only where a back cell sits, never which cards are inspected. The inspection side is ephemeral screen state: `state.view.inspectSide` is owned by the gallery side toggle in the selection tray, `state.view.detailSide` by the open detail view, both reset from `state.layout` when the layout changes and when the preview closes, and neither is written to a cardbook or to the print document.

There is no URL, hash, History API, or session-state integration. The card tools are intentionally simple, local-first interfaces that persist only named books via browser storage. Preview mode, density, filter expansion, manager search, open surfaces, and detail position are reload-scoped.

### Manual mobile checks

The responsive surfaces are not covered by the unit suite. After a layout change, verify in a browser at 390x844 and 360x800:

- the bottom bar opens one surface at a time and safe-area padding keeps it tappable;
- Browse retains filters, selection, and scroll position across open/close;
- the gallery shows one tile per logical card and taps open detail without breaking scroll;
- detail swipes, arrows, flip, and close behave as specified;
- Print from the gallery or detail still produces only card pages.

## Main Extension Boundary

The project is now organized around a generic card model rather than a spell-only flow. Keep the page engine entity-neutral and treat each page as a configurable adapter: data loader, identity, filtering, formatting, layout, and persistence. See [card-tool-extension-and-validation.md](card-tool-extension-and-validation.md) for the generalization pattern used by the spell, item, and beast implementations.
