# Card Tool: Extension and Validation

## Adding Entity Types

The repository now includes spell, item, and beast card printers, all built around a shared browser-only card engine. A scalable design should introduce an entity-type registry/adapter with:

- data loader and source allowlist;
- stable identity, ideally `{type, name, source}`;
- filter definitions and predicates;
- list/tray labels;
- front and back card renderers;
- a `flow(entity, context)` adapter that returns a strip, using the shared ladder with the type's default body size and shrink floor;
- entity-specific fitting rules, including the page cap (5 on a 4x2 page, 3 on a 2x2 page) and truncation behavior;
- asset manifest and fallback behavior;
- versioned export/import references.

Keep the engine entity-neutral. A mixed selection should use a common card interface while allowing entity-specific metadata and templates. Do not assume every card has spell fields such as `school`, `duration`, or `components`. A new card type without a flow adapter still renders one panel per entity, but it cannot shrink, bucket by span, or truncate, so add the adapter before shipping the type.

## Existing 5etools Patterns

The 5etools submodule's generic builder in [makecards.html](../5etools/makecards.html), [js/makecards.js](../5etools/js/makecards.js), and [js/render-card.js](../5etools/js/render-card.js) is a useful reference, not a dependency of the standalone page. It already has item, bestiary, spell, race, background, feat, and optional-feature search adapters, plus a richer `RendererCard` path for entries, lists, tables, variants, and spellcasting blocks. Existing item and bestiary filters are in `5etools/js/filter-items.js` and `5etools/js/filter-bestiary.js`.

Reuse those schemas or shared modules only after checking their browser-loading assumptions. A direct migration would change the standalone page's dependency and rendering model.

## Validation Checklist

`npm test` runs the card-tool unit tests in `test/`: filter helpers, entry text flattening, the DOM-free page plan, and the content flow. The page-plan tests cover strip bucketing, strips per sheet on 4x2 and 2x2 grids, final-sheet padding, per-panel back roles, cut/fold guides, and Both interleaving. The flow tests cover the shrink ladder branches, boundary-only shrinking, the page cap, ellipsis filling, and beast section segmentation. The content tests cover spell and item units, continuation panels, oversized-sentence word fallback, escaping, and single-mode truncation. The inline page JavaScript and print layout still require browser checks.

For changes, manually verify:

- all intended data files load over HTTP;
- search, every filter group, sorting, select-visible, remove, and clear for each page type;
- long titles, long descriptions, tables, missing optional fields, and page-specific edge cases;
- both content modes: defaults per type, mode switch rebuilding the selection, truncation ellipses, and no headings in Single card mode;
- overflow bucket headings, bucket order, fresh sheets per bucket, and the `truncated` bucket last;
- saved books, Add/Replace, malformed JSON, unmatched sources, and export/import round trips;
- Fronts, Backs, and Both previews, including paired sheet labels, cut/fold guides, blank interior accordion backs, page-3 and page-5 continuation backs, final-sheet padding, reset-to-Fronts on clear, zoom, and console cleanliness;
- Debug Print under each layout matches the preview page sequence and sides, plus A4 Print Preview;
- duplex back position alignment and the browser's background-graphics-off behavior;
- presence and correct path/casing of every card-back asset.

Project commands (`npm test`) only run the card-tool unit tests; they do not execute the inline page JavaScript or validate print layout. Use the narrowest relevant command plus browser checks. If a task changes the pinned 5etools data, run the appropriate validation scripts inside `5etools/` (for example `npm run test:json` after installing its dependencies).

## Known Risks

The explicit loader can become stale, data-source failures weaken filtering, flattened entries lose rich content, and missing back assets create broken images. These are documented behavior gaps, not reasons to modify unrelated pre-tag site code.
