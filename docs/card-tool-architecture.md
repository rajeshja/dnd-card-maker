# Card Tool: Architecture

## Page Shape

The shared engine in `js/card-tool.js` powers the standalone card pages used throughout this repository. `spell-cards.html`, `item-cards.html`, and `beast-cards.html` each configure a `state.config` with page-specific data files, filters, sort rules, and renderers. The generic code handles the shared DOM shell, selection tray, preview, and print pipeline without depending on the normal 5etools page shell or shared `Renderer` modules.

The 5etools source is a git submodule at `5etools/`, pinned to `d2a2616867` (`v2.25.4`). The card tool reads its data from `5etools/data/`; all card-tool code, styles, tests, and back-card assets live in this repository. Do not modify the submodule.

The shell is a fixed layout with a top bar, filter sidebar, selected-item tray, and preview area. The hidden `#print-area` contains print-ready pages; `#screen-pages` contains the screen preview. The DOM-free `js/card-tool-pages.js` module owns strip bucketing, sheet packing, final-sheet padding, per-row back mirroring, per-panel back roles, cut/fold guide roles, and front/back pair ordering. The loading overlay remains visible until the page-specific setup completes.

## User Flow

1. `start(config)` initializes the page-specific card type and shared UI.
2. `load()` fetches the configured entity files and de-dupes them by `${type}|${name}|${source}`.
3. `buildFilters()` creates group chips based on each entity's schema.
4. `filter()` applies search, chips, and sort order.
5. `renderList()` creates selectable rows from `filtered`.
6. `toggle()`, `selectVisible()`, and `clearSelection()` mutate the `selected` map.
7. `buildPreview()` converts each selected entity into a strip descriptor, builds one page plan from those strips, and creates matching screen/print markup for the active layout.
8. `Print` calls `window.print()` for the active Fronts, Backs, or Both layout; `Debug Print` renders the same `#print-area` pages.

A page can supply a `flow(entity, context)` adapter. When it does, `buildPreview()` uses the returned strip directly; otherwise it falls back to one single-panel strip per entity, expanding with `config.expand` first when that hook exists. Panel HTML comes from the strip, back art comes from `render("back", strip.entity)`, and `page` back cells reuse the strip panel named by `panelIndex`. This keeps front and back markup, guides, and bucket headings derived from one plan.

The list is filtered independently from selection, so changing filters does not remove already selected cards. Sorting affects both the visible list and selected-card page order.

## State

- `all`: deduplicated loaded entities.
- `filtered`: current list after filtering and sorting.
- `selected`: `Map` keyed by `${type}|${name}|${source}` and storing selected card data.
- `config`: page-specific metadata such as title, files, filters, sort rules, and page geometry.
- `layout`: active preview and print layout, `fronts`, `backs`, or `both`; resets to `fronts` when the preview closes.
- `contentMode`: active content mode, `single` or `overflow`; starts from the page type's default and survives a selection clear.
- `zoom`: screen-only zoom, clamped to 50%-200%.
- `currentBookName`: current saved/imported cardbook label when applicable.

There is no URL, hash, History API, or session-state integration. The card tools are intentionally simple, local-first interfaces that persist only named books via browser storage.

## Main Extension Boundary

The project is now organized around a generic card model rather than a spell-only flow. Keep the page engine entity-neutral and treat each page as a configurable adapter: data loader, identity, filtering, formatting, layout, and persistence. See [card-tool-extension-and-validation.md](card-tool-extension-and-validation.md) for the generalization pattern used by the spell, item, and beast implementations.
