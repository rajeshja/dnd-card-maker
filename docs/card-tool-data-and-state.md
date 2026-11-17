# Card Tool: Data and State

## Loading

The repository now includes multiple card pages with different source roots and allowlists:

- `spell-cards.html` loads from `./5etools/data/spells/` and fetches the spell files configured in its `FILES` list.
- `item-cards.html` loads from `./5etools/data/` and reads the item payloads configured for that page.
- `beast-cards.html` loads from `./5etools/data/bestiary/` and reads the beast payloads configured for that page.

These paths are relative to the project pages, which live one level above the `5etools/` submodule. Keep them in sync if the submodule directory is renamed.

Each page fetches its dataset with `Promise.allSettled`; failed files are ignored. Successful payloads are appended, deduplicated by `${type}|${name}|${source}`, and sorted by name. Any new source must be added to the page's explicit allowlist intentionally and tested in a browser.

## Expected Entity Fields

The shared formatter and filters assume entity-specific 5etools fields, not a single universal spell schema:

- Spell cards: `name`, `source`, `level`, `school`, `time`, `range`, `components`, `duration`, `entries`, and `classes` metadata.
- Item cards: `name`, `source`, `type`, `rarity`, and `entries`.
- Beast cards: `name`, `source`, `type`, `size`, `alignment`, `ac`, `hp`, `speed`, `cr`, and `trait`/`action` entries.

The generic card engine should not assume that every entity has spell-only fields such as `school`, `duration`, or `components`.

## Filters

The generic filter model is page-specific but consistent:

- Search is a case-insensitive substring match on `name`.
- Source and type chips are exact matches.
- Additional filters such as spell schools, item rarities, and beast creature types vary per page.
- Active chip filters are conjunctive.
- Sort choices are page-configured and may include name, source, type, and legacy spell-specific ordering.

The list is independent from selection; changing filters does not remove already selected cards.

## Content Mode

The content mode is selection-wide and held only in memory as `state.contentMode`.

- `single`: one panel per card, shrinking to the floor and then truncating with an ellipsis.
- `overflow`: bounded multi-panel strips in span buckets, with over-cap content truncated into a final bucket.

Each page configuration sets `defaultContentMode`: spells and items use `single`, beasts use `overflow`. The mode is not saved in cardbooks and has no URL state, so a reload restores the page type's default. `hidePreview()` resets only the layout to Fronts, so clearing the selection keeps the current mode.

## Identity and Selection

Use a stable entity identifier throughout selection, de-duplication, rendering, and persistence. The shared engine uses `${type}|${name}|${source}` and should preserve this even when the page is spell-only or loaded from legacy saved data.

Cardbook saves write typed references (`type`, `name`, `source`) using the same identity. A legacy `{name, source}` book is normalised to spell references on the spell page only, so it dedupes against the spell selection with the same `${type}|${name}|${source}` key; the item and beast pages report it as unreadable instead of guessing a type. Loading resolves each reference against the loaded entity map built from that same identity, then mutates only `state.selected`. It never changes `state.layout`, `state.contentMode`, `state.view.density`, or filter state, so a loaded book follows the active sort and print order exactly like a hand-picked selection.

Generated list rows should still escape name, source labels, and generated attributes before injecting HTML. Prefer DOM APIs for user-provided values where possible.

### Selection bar and manager

The selection bar is status only: it renders `state.selected.size` and a Manage action, and it never renders one element per selected card. Adding or removing a card updates the same fixed-height line, so a 1-card and a 200-card selection consume identical preview space. The topbar does not show a second count.

The manager reads the selected map in the active sort order and filters it with `filterSelection(entities, query, listMeta)` from `js/card-tool-layout.js`. Search is a case-insensitive substring match over `entity.name`, `entity.source`, and `config.listMeta(entity)`; it changes only which rows the manager shows. It does not mutate selection, reorder the selected map, or change the print plan. Per-card removal and Remove shown delete from `state.selected` and then call `updateSelection()` once, so the bar, browse checkmarks, preview, and print document all rebuild in the existing order. Clear all requires a second activation while the manager is open. The manager query and confirmation are ephemeral and reset when the dialog closes.

Remaining cards always keep the active sort order and therefore the same print order; removing a card never promotes or reorders the rest.

## Cardbooks

Saved books live in `localStorage` under one key per entity type: `card-tool-${type}-books`. The spell page also reads the legacy `spell-cards-spellbooks` key. The stored value is a name-keyed object of `5etools-cardbook-v1` envelopes; each card is a typed `{type, name, source}` reference. See [card-tool-cardbooks.md](card-tool-cardbooks.md) for the full contract and legacy rules.

Dialog state is ephemeral and lives in `state.view`:

- `saveConfirm`: the name whose overwrite has been confirmed; reset when the name changes or the dialog closes.
- `loadConfirm`: the book whose replace action is awaiting confirmation; reset when another row is chosen or the dialog closes.
- The return-focus targets (`saveReturnFocus`, `loadReturnFocus`) stay outside `state` and are consumed by the dialogs' `close` handlers.

Save writes the selection in the active sort order. Load's `Add` unions resolved cards into `state.selected`; `Replace` clears it first. Both then call `updateSelection()` once, so the selection bar, browse checkmarks, gallery, page plan, and print pages rebuild together. Loading never changes filters, layout, content mode, density, or page geometry, and unmatched references are counted and reported rather than silently dropped.

