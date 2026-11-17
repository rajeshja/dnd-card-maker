# Proposal

## Why

A spell's back card prints School, Level, and Source, while the classes that can actually cast it are absent, even though the class list already drives the Browse filter. Source is the least useful of the three to a player holding the card. The back also loses its bottom ornament whenever `concentration` or `ritual` adds an indicator row, because that row pushes the meta block past the card's height.

## What Changes

- Reorder the spell back meta rows to **Level, School, Classes**.
- Replace the Source row with a **Classes** row:
  - Use the spell's base class names when it has any.
  - Otherwise use its subclass grants in short grouped form, e.g. `Wizard (Chronurgy, Graviturgy)` and `Cleric (Death), Wizard (Chronurgy, Graviturgy)`.
  - Sort alphabetically, de-duplicate, and label `Class` for one, `Classes` for several, `—` when there is neither a base class nor a subclass grant.
- Move the **source code** to a bottom-right stamp rendered as plain text, independent of the ornament: the code remains visible if the bottom ornament is absent or fails to load.
- Move the **concentration and ritual indicators inside the hero**, overlaid on the school art, so they no longer add a row or move the meta block.
- Keep the Class filter chips as bare class names. A chip matches base classes, plus the subclass owner only for spells that have no base class, so the 15 subclass-only EGW spells become reachable without widening any chip.
- Resolve the class data from the generated spell source lookup, whose base class sets are identical to `sources.json` for all 936 loaded spells.
- **Not included:** layout, spacing, compaction, or fit-to-content tuning. The current overflow behaviour is preserved, and the A/B alignment experiments are deferred to separate branches and a later change.

## Capabilities

### New Capabilities

- `spell-card-back`: the printed content and arrangement of a spell card's back face — the Level/School/Classes meta rows, the class-list resolution and formatting rules, the indicator overlay, and the always-visible source code stamp.

### Modified Capabilities

<!-- No durable requirement changes: card-print-layout governs sides, order, and geometry; card-content-flow governs front content amount and fit. This change alters what the back face says, not how pages are planned or printed. -->

## Impact

- `js/spell-cards.js`: back rendering, lookup-driven preparation, filter values from the resolved class names, source stamp.
- `js/card-tool-content.js`: pure class resolver and label formatter shared with the tests.
- `css/card-tool.css`: meta row order and classes row, hero indicator overlay, independent source stamp; no page or card geometry changes.
- `test/cards/SpellCardBack.test.js` (new): alphabetical de-duplication, grouped short subclass form, label pluralisation, empty-list fallback, and the base-vs-subclass precedence rule.
- `docs/card-tool-data-and-state.md`, `docs/card-tool-rendering-and-printing.md`: the class resolution rule, the filter boundary, and the back-face layout contract.
- Deferred: A/B spacing experiments. No files under `5etools/` are touched.
