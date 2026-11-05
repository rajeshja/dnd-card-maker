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

## Identity and Selection

Use a stable entity identifier throughout selection, de-duplication, rendering, and persistence. The shared engine uses `${type}|${name}|${source}` and should preserve this even when the page is spell-only or loaded from legacy saved data.

Generated list rows should still escape name, source labels, and generated attributes before injecting HTML. Prefer DOM APIs for user-provided values where possible.
