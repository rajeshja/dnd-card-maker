# Card Tool: Architecture

## Page Shape

The shared engine in `js/card-tool.js` powers the standalone card pages used throughout this repository. `spell-cards.html`, `item-cards.html`, and `beast-cards.html` each configure a `state.config` with page-specific data files, filters, sort rules, and renderers. The generic code handles the shared DOM shell, workspace bar, preview, and print pipeline without depending on the normal 5etools page shell or shared `Renderer` modules.

The 5etools source is a git submodule at `5etools/`, pinned to `d2a2616867` (`v2.25.4`). The card tool reads its data from `5etools/data/`; all card-tool code, styles, tests, and back-card assets live in this repository. Do not modify the submodule.

The shell is a responsive workspace with one 48px workspace bar, a filter sidebar, and a preview area. The hidden `#print-area` contains print-ready pages; `#screen-pages` contains the screen preview, which can present either the page grid (`#preview-grid`) or the card gallery (`#cards-gallery`). The DOM-free `js/card-tool-pages.js` module owns strip bucketing, sheet packing, final-sheet padding, per-row back mirroring, per-panel back roles, cut/fold guide roles, and front/back pair ordering. The DOM-free `js/card-tool-layout.js` module owns preview page sizing, gallery and detail derivation, and selection search. The DOM-free `js/card-tool-cardbooks.js` module owns the stored cardbook format, legacy normalisation, reference identity, dedupe, and unmatched resolution. The loading overlay remains visible until the page-specific setup completes.

### Responsive workspace modes

Width modes are CSS-driven and JS reads the same `matchMedia` breakpoints only to decide which surface to bind:

| Mode | Width | Sidebar | Preview |
|---|---|---|---|
| Desktop | `>= 1200px` | `clamp(300px, 22vw, 380px)` | remaining width |
| Compact desktop | `900-1199px` | `260px` | remaining width |
| Tablet | `600-899px` | overlay Browse surface | full width |
| Phone | `< 600px` | full-screen Browse surface | full width |

`#app` uses `100dvh` with a `100vh` fallback and a two-row grid, `48px minmax(0, 1fr)`. Row one is the workspace bar (the phone masthead below 600px), so there is no height-specific compact-chrome rule: one row is one row at every viewport height. The sidebar never grows past 380px; on tablet and phone it leaves the normal flow and slides over the preview. The bar's Browse control opens it on tablet, and the bottom bar's Browse surface opens it on phone.

The sidebar is a three-part column: a search/sort header, a bounded `#filter-groups` region capped at 45% of the sidebar, and `#entity-list`, which keeps a `240px` minimum height and receives all space released by collapsed filters. The list uses a zero flex basis so its very large row count cannot shrink the filter region to a sliver; expanded filters stay scrollable inside their cap. Every filter group is an accordion built from a header button plus the existing `.chips` panel. The header summarizes active state (`all`, `3 of 8`, `none`) while collapsed; chips keep their `data-filter-group`, `data-value`, and `on` semantics, so filtering stays conjunctive and defaults to all values.

### Workspace bar zones

`#workspace-bar` is the only chrome row. It spans both grid columns, stays 48px tall, never wraps, and keeps `min-width: 0` on its children. From left to right:

| Zone | Contents |
|---|---|
| Identity | `.brand-mark` (the card-pack symbol from `js/card-tool-icons.js`, `role="img"` labelled with the page title) and `#page-title` |
| Selection | `#selection-count-trigger`, showing `N selected`; activating it opens the selection manager |
| Book | `#save-book` and `#load-book` |
| Actions | `.workspace-actions`: Browse (900px and wider), the three presentation dropdowns, the `Cards \| Pages` preview-mode group, the Cards-only `Fronts \| Backs` inspection toggle, Print, and Debug Print |

The brand mark's `aria-label`, `#page-title`, and `#masthead-title` all come from `state.config.title`, so a new page config needs no shell edits. `favicon.svg` ships the same mark for the browser tab. The count is the manager trigger: there is no separate Manage control and no per-card chip row. With an empty selection the count reads `0` and `#print-actions` is hidden, so the presentation and print controls disappear with it.

### Degradation ladder

The bar never wraps, scrolls, or clips a control. It sheds in this order, and only then tightens spacing:

| Width | Title | Labels | Additional compaction |
|---|---|---|---|
| `>= 1200px` | shown | button and dropdown labels shown | none |
| `900-1199px` | shown | icon-only (`.btn-label` and `.dropdown-label` hidden) | — |
| `600-899px` | suppressed | icon-only | the count loses its `selected` suffix; dropdown carets and the Cards/Pages segment text hide |
| `< 600px` | masthead only | — | the bar hides; the masthead shows the brand and title |

Never shed while the bar is shown: the brand mark, the selection count, and Print. Debug Print stays present and activatable at 600px; only its label is withdrawn with the other control labels. A new control must go inside one of the four zones and opt into a rung: it either carries a `.btn-label` that participates in the 1200px rule, or it must be added to the never-shed set deliberately. Fixed controls take `flex: none`, and the identity zone absorbs the remaining width so a long title truncates instead of pushing the mark out.

The selection manager opens from the bar's count, styled as a right-side drawer on desktop and a full-height sheet on phone, with search, `N of M shown`, per-card removal, Remove shown, and a two-step Clear all. The bar never renders one chip per selected card, and the manager returns focus to the count when it closes.

Save and Load open cardbook dialogs from the bar's book zone. At 1200px and wider both controls show an icon plus label; below that the labels are withdrawn and only the icons remain, with the `aria-label` keeping the accessible name. Measured in headless Edge at default zoom with a selection active on all three pages, the bar fits without clipping a control or scrolling horizontally from 600px to 1920px of CSS width; below 600px the action cluster moves into the Print sheet. Both dialogs follow the manager pattern: the opener is recorded as the return target, `showModal()` traps focus, Escape closes, and focus returns to the opening control on close.

On phone a fixed bottom action bar exposes Browse, Selected, and Print. Browse uses the sidebar as a full-screen sheet; Selected reuses the selection manager; Print opens a sheet that owns the moved `.workspace-actions` node (content mode, layout, density, `Cards | Pages`, `Fronts | Backs`, Print, Debug Print, Save, Load). Only the action cluster is moved: the brand and title become `#masthead`, and the selection cluster simply hides with the bar. Controls are moved, never cloned, so listeners and `aria-pressed` state stay single-instance. Below 900px the preview can switch between Cards and Pages; phone starts in Cards.

The detail view is a full-screen `<dialog>` fed by the same print-card clones as the gallery. It opens on the side the gallery is inspecting, and its flip is offered under every layout whenever the card's other side has been prepared, so inspecting a back never requires changing the print layout. It is presentation-only: opening, flipping, zooming, or navigating never writes `#print-area`, selection, layout, content mode, density, or sort order, and its state (`detailIndex`, `detailSide`, pinch zoom) is discarded when it closes. A side the print plan did not render is recorded on first demand by a detached pass that is fitted, copied into `state.printCards`, and removed before printing.

## Presentation Dropdowns

Content mode, card layout, and preview density are menus, not segmented groups. Each group keeps its container id (`#content-group`, `#layout-group`, `#density-group`), its `data-content` / `data-layout` / `data-density` option buttons, and gains one trigger (`[data-dropdown-trigger]`) plus one menu (`#content-menu`, `#layout-menu`, `#density-menu`). Option values, full names, and icon ids come from `js/card-tool-icons.js`, so the menu markup, the closed trigger, and the unit tests cannot drift.

- **Closed:** the trigger shows the active option's icon and name and carries `aria-haspopup="menu"`, `aria-expanded="false"`, and an accessible name of `<Group>: <Active name>`, for example `Card layout: Fronts`. `data-tip` mirrors that name for the CSS tooltip.
- **Open:** `aria-expanded="true"`, the menu has `role="menu"`, and every option is a `role="menuitemradio"` button with `aria-checked`; exactly one option is checked. Choosing an option applies it, updates the trigger, and closes the menu.
- **Icon-only form:** below 1200px CSS hides `.dropdown-label`. The trigger keeps its icon, accessible name, and tooltip, so the visible label is never the only carrier of the active value.
- **Keyboard:** Enter/Space opens on the active option, ArrowDown/ArrowUp open and move between options, Home/End jump to the first and last, Enter/Space chooses the focused option, Escape closes and returns focus to the trigger, and a pointer press outside closes the menu.
- **Rendering:** each menu is a `popover="manual"` element, so the top layer escapes `#app`'s clipping. Without the Popover API the same element is shown as a fixed-position box positioned from the trigger rect and clamped to the viewport; `openDropdown()` feature-detects and both paths keep the menu fully visible at 600px.

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

Inspection order equals print order. The gallery and detail view dedupe `state.inspectPlan` in plan order, which is the card sequence the print plan packs onto its sheets; duplex mirroring changes only where a back cell sits, never which cards are inspected. The inspection side is ephemeral screen state: `state.view.inspectSide` is owned by the `Fronts | Backs` toggle in the workspace bar's action cluster, `state.view.detailSide` by the open detail view, both reset from `state.layout` when the layout changes and when the preview closes, and neither is written to a cardbook or to the print document.

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
