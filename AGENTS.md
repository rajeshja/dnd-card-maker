# Agent Guide

## Scope

This repository is a standalone card-printing toolkit for 5etools content, with dedicated pages for spells, items, and beasts. The relevant entry points are `spell-cards.html`, `item-cards.html`, and `beast-cards.html`, backed by the shared engine in `js/card-tool.js` and entity-specific renderers such as `js/beast-cards.js` and `js/item-cards.js`.

The 5etools source code is vendored as a git submodule at `5etools/`, pinned to `d2a2616867` (`v2.25.4`). Treat everything under `5etools/` as read-only: do not edit files or commit changes inside the submodule. All project code lives outside it.

The pages are intentionally self-contained: inline HTML, CSS, and JavaScript; no normal 5etools page shell; no shared `Renderer`; and no bundled page module. They load standard data from `5etools/data/` and use the local `card-images/` directory for back-card art. The 5etools source repository does not track its `img/` directory, so optional entity artwork is resolved from the project-local `img/` directory only when a separate image pack is supplied.

## First Reads

Choose only the topic needed for the change:

- [Architecture](docs/card-tool-architecture.md): shared DOM state, page shell, and entity-specific page flow.
- [Data and state](docs/card-tool-data-and-state.md): source files, source/type allowlists, schema assumptions, filters, and selection identity.
- [Item data and text](docs/card-tool-item-data-and-text.md): item JSON sources, normal item-page rendering, card flattening, and tagged short-form text.
- [Rendering and print](docs/card-tool-rendering-and-printing.md): card templates, fitting, page geometry, duplex ordering, and assets.
- [Cardbooks](docs/card-tool-cardbooks.md): localStorage and import/export contracts for saved selections.
- [Extension and validation](docs/card-tool-extension-and-validation.md): adding new card types, reusing 5etools patterns, risks, and checks.

## Non-Negotiable Invariants

- Existing selection identity is `${type}|${name}|${source}`; preserve it for deduplication, selection, tray removal, and saved-card files.
- The current loader uses explicit per-page `FILES` allowlists and page `base` paths under `5etools/data/`. Update them deliberately when adding or removing sources.
- Filters default to all available values for each entity type. Multiple active chip filters are conjunctive.
- Card page geometry comes from each tool's `page` configuration (`rows`, `columns`, and `orientation`). Spell and item cards use A4 landscape with a 4x2 or 2x4 grid; beast cards use A4 portrait with a 2x2 grid.
- Back pages mirror each row for duplex printing. Do not change this without updating the page-plan mirroring tests and the Backs preview.
- Keep front and back rendering synchronized: `buildPreview()` generates both screen and print DOM from the same page items.
- Preserve the versioned cardbook format and typed references when changing persistence; do not silently coerce old spell-only data into a broader schema without explicit compatibility logic.
- Escape user/data text before inserting it into generated card HTML. Do not interpolate untrusted values into attributes without escaping.
- Keep the `5etools` submodule pointer pinned unless the task is explicitly a data update. To update it, fetch and check out the desired ref inside `5etools/`, then commit the changed gitlink.

## Working Rules

- Preserve the inline, dependency-light style unless an extraction is needed for a clearly reusable card abstraction.
- Never modify files under `5etools/`; the submodule must stay clean so `git status` reflects only project changes.
- For new entity types, separate entity data access, filtering/selection identity, card formatting, and print layout. Do not copy spell-specific names through the whole tool.
- Keep rich 5etools entry handling in mind: the current `flattenCardEntries()` intentionally flattens content and omits tables.
- Back-card image paths are relative to the page and must be shipped with the deployment. The repository includes a `card-images/` asset set for the per-school back-card art used by `spellBack()`, and those files must remain present with the correct path and casing.
- The page has no URL state. Only named saved cardbooks persist across refreshes.

## Validation

Run `npm test` from the project root for the card-tool unit tests. After behavior or layout changes, serve the project over HTTP with `npm run serve`, exercise loading/filtering/selection, inspect front and back previews, and use Print Preview or Debug Print at the relevant A4 orientation.

The 5etools data validation scripts still live in the submodule and can be run there when a task changes the pinned data version, e.g. `cd 5etools && npm run test:json`. They do not validate the inline page code, print geometry, asset availability, or duplex ordering.
