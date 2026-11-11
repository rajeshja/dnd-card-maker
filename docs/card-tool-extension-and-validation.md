# Card Tool: Extension and Validation

## Adding Entity Types

The repository now includes spell, item, and beast card printers, all built around a shared browser-only card engine. A scalable design should introduce an entity-type registry/adapter with:

- data loader and source allowlist;
- stable identity, ideally `{type, name, source}`;
- filter definitions and predicates;
- list/tray labels;
- front and back card renderers;
- entity-specific fitting rules;
- asset manifest and fallback behavior;
- versioned export/import references.

Keep the engine entity-neutral. A mixed selection should use a common card interface while allowing entity-specific metadata and templates. Do not assume every card has spell fields such as `school`, `duration`, or `components`.

## Existing 5etools Patterns

The 5etools submodule's generic builder in [makecards.html](../5etools/makecards.html), [js/makecards.js](../5etools/js/makecards.js), and [js/render-card.js](../5etools/js/render-card.js) is a useful reference, not a dependency of the standalone page. It already has item, bestiary, spell, race, background, feat, and optional-feature search adapters, plus a richer `RendererCard` path for entries, lists, tables, variants, and spellcasting blocks. Existing item and bestiary filters are in `5etools/js/filter-items.js` and `5etools/js/filter-bestiary.js`.

Reuse those schemas or shared modules only after checking their browser-loading assumptions. A direct migration would change the standalone page's dependency and rendering model.

## Validation Checklist

`npm test` runs the card-tool unit tests in `test/`: filter helpers, entry text flattening, and the DOM-free page plan. The page plan tests cover chunking, final-page padding, front ordering, per-row back mirroring on 4x2 and 2x2 grids, and Both interleaving for full and partial chunks. The inline page JavaScript and print layout still require browser checks.

For changes, manually verify:

- all intended data files load over HTTP;
- search, every filter group, sorting, select-visible, remove, and clear for each page type;
- long titles, long descriptions, tables, missing optional fields, and page-specific edge cases;
- saved books, Add/Replace, malformed JSON, unmatched sources, and export/import round trips;
- Fronts, Backs, and Both previews, including paired sheet labels, final-page padding, reset-to-Fronts on clear, zoom, and console cleanliness;
- Debug Print under each layout matches the preview page sequence and sides, plus A4 Print Preview;
- duplex back position alignment and the browser's background-graphics-off behavior;
- presence and correct path/casing of every card-back asset.

Project commands (`npm test`) only run the card-tool unit tests; they do not execute the inline page JavaScript or validate print layout. Use the narrowest relevant command plus browser checks. If a task changes the pinned 5etools data, run the appropriate validation scripts inside `5etools/` (for example `npm run test:json` after installing its dependencies).

## Known Risks

The explicit loader can become stale, data-source failures weaken filtering, flattened entries lose rich content, and missing back assets create broken images. These are documented behavior gaps, not reasons to modify unrelated pre-tag site code.
