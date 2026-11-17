# Design

## Context

`spellBack()` in `js/spell-cards.js` renders the whole back face as one inline HTML string. Its meta block currently prints School, Level, and Source in three fixed rows, and `prepareSpells()` separately fetches `5etools/data/spells/sources.json` to build `_classes`, which only the Class filter chips use. Source is therefore on the card while the class list is not.

The back content box is 54.25 mm × 85 mm (74.25 × 105 mm card, 10 mm inset on each side). Three meta rows at `min-height: 8.4mm` fill the budget for a normal spell. A concentration or ritual indicator adds a 3.6 mm row plus a 2.2 mm flex gap, so the block overruns and the bottom ornament is the first thing lost — which is the reported symptom.

Screen and print share the same per-card renderer, and `fitRenderedCards()` only fits titles for backs. There is no back fit step to preserve or replace.

`docs/card-tool-rendering-and-printing.md` already claims spell backs render "school, level, classes"; the code has never matched that line.

## Goals / Non-Goals

**Goals:**

- Put the resolved class list on the back in place of Source, with stable ordering and formatting.
- Make subclass-only spells reachable through the existing class chips without changing chip labels.
- Keep the source code visible on every back, regardless of ornament rendering.
- Remove the indicator row as a source of layout variance.
- Ship the content change without touching spacing, geometry, or print planning.

**Non-Goals:**

- Choosing between the A/B alignment options. They stay on throwaway branches (see below).
- Compaction, fit-to-content, truncation, or measurement for the back meta.
- Item and beast backs, which keep their current layout.
- Page grid, orientation, duplex mirroring, sheet packing, or selection identity.

## Decisions

### 1. The generated spell lookup becomes the class source

Use `5etools/data/generated/gendata-spell-source-lookup.json` instead of `spells/sources.json`. It carries `class`, `classVariant`, and `subclass` per spell, keyed by the source file suffix, and its base class sets match `sources.json` exactly for all 936 spells on the loaded page files (verified by diffing every spell).

Alternatives considered:

- **Keep `sources.json` and fetch the lookup as well.** Two sources of truth, 843 KB total, and the filter and card could drift apart.
- **Expand `additionalSpells` from the class JSON files.** That means implementing the filter expression language (`source=EGW`, `all`, class/subclass inheritance) over roughly 2 MB of class data to recover 15 spells.

The lookup is larger (614 KB vs 229 KB) and generated, but it is already vendored, version-pinned with the submodule, and exactly the data this feature needs.

The resolver reads **both** `class` and `classVariant`; XGE and TCE spells frequently appear only under `classVariant`.

Lookup keys are the file suffixes (`xphb`, `aitfr-avt`). `spell.source.toLowerCase()` matches all 17 loaded page files, so the lookup is `lookup[spell.source.toLowerCase()]?.[spell.name.toLowerCase()]`. If a future file breaks that assumption, the spell simply resolves to no class entry; no exception path is needed.

### 2. Two derived fields, not one

`prepareSpells()` attaches:

| Field | Used by | Value |
|---|---|---|
| `_classes` | Class filter chips | Base class names when present, otherwise the distinct owning classes of subclass grants |
| `_classLabel` | Back card | Base names joined, otherwise grouped `Class (Subclass, Subclass)` |

This split is what keeps the chips bare. Merging every subclass grant into `_classes` would be wrong: the lookup records Magical-Secrets-style access, so *Fireball* lists `Bard (Lore)`, `Cleric (Light)`, `Fighter (Eldritch Knight)`, `Warlock (Fiend)`, and more. 747 of 936 spells have both base classes and subclass entries; counting those would put nearly every spell under nearly every chip. Subclass grants fill gaps only.

### 3. Short subclass names, grouped by class

Where a subclass grant is shown, use the lookup's subclass key (`Chronurgy`, `Graviturgy`, `Death`, `Lore`) rather than the display name (`Chronurgy Magic`, `Death Domain`, `College of Lore`), and group by owning class.

- `Wizard (Chronurgy, Graviturgy)` — 35 chars
- `Cleric (Death), Wizard (Chronurgy, Graviturgy)` — 46 chars vs 65 with full names

All 15 subclass-only spells are EGW, so the short forms in practice are only those three, none ambiguous. Full names would add a line to *Sapping Sting* for no comprehension gain.

### 4. Resolution is a pure helper in the content module

`js/card-tool-content.js` already owns spell units, meta, and school mapping, and is covered by unit tests. Add `resolveSpellClasses(entry)` and `spellClassLabel(entry)` there:

- `resolveSpellClasses` returns `{classes, grants}` — base names and grouped subclass grants — after de-duplication of edition twins and alphabetical sorting.
- `spellClassLabel` returns the display string plus whether the label is singular.

A page module cannot be unit tested because it calls `CardTool.start()` at import time; a pure helper can. No new file is needed, and the rendering code only consumes the result.

### 5. The classes row keeps the existing meta-row shape

The row is a normal `.back-meta-row` containing the classes icon, the `Class`/`Classes` label, and a single text run. The text run wraps; nothing else changes. The default row order becomes Level, School, Classes, and the Source row is deleted.

The classes value is **not** truncated, clamped, or ellipsized. A long list wraps and, if it still exceeds the card, overflows the way the indicators do today. That is deliberate: the A/B experiment owns the fitting decision, and this change must not pre-empt it.

### 6. Indicators move into the hero

`.back-indicators` becomes an absolutely positioned child of `.back-hero` (`bottom: 0`, full width, `z-index` above the art, which is already `position: absolute; inset: 0; opacity: .18`). It contributes no flow height, so an indicator card has exactly the same meta position as any other card. The hero stays 24 mm; the title is 6.4 mm at one line, leaving room for the 3.6 mm indicator line.

Alternative rejected: a taller hero reserved for indicators. That would keep the row out of the meta but reintroduce per-card variance in the hero itself.

### 7. Source is its own text node, pinned to the card

`.back-card` becomes `position: relative`; `.back-source` is `position: absolute; right: 0; bottom: 0; z-index: 2`, at ~6.5 pt Cinzel with a small letter-spacing. It is not a child of the ornament row and not an image, so it survives:

- a missing or failed bottom ornament,
- overflow of the meta block,
- `print-debug` background toggles (which only reset backgrounds, not images).

A footer grid was rejected because it couples the code's placement to the ornament's presence and width.

Longest loaded code is `AitFR-AVT`, about 11 mm at 6.5 pt; the ornament's centre 60% leaves ~10.9 mm per side, so that one card may graze the art by a fraction of a millimetre. A paper-tinted backdrop behind the text is the fallback if the print check shows it.

### 8. Fetch failure behaves as today

If the lookup fetch fails, `prepareSpells()` returns the spells unchanged, so `_classes` is empty and the Class chips have no values — the current failure mode with `sources.json`. A fallback second fetch would add a second data path for a case that already degrades visibly. The source stamp does not depend on the lookup.

## Risks / Trade-offs

- **Worst-case lists still overflow in this change.** Two cards (*Detect Magic* XPHB, *Dispel Magic* XPHB, 74 chars) wrap to four lines at the default layout. Accepted by the proposal; the A/B branches decide the fit. → Validate them explicitly so the intermediate state is known.
- **Long source codes can graze the ornament.** → 6.5 pt and a backdrop if needed; check `Antagonize`/`AitFR-AVT` in Debug Print.
- **The generated lookup can change with a submodule update.** → Unit tests use fixtures for the resolver rules, and a data check re-diffs base class sets against `sources.json` when the submodule moves.
- **Class chip counts change.** Fifteen spells become reachable under Wizard and Cleric. → Intended; call it out in the change notes so it is not mistaken for a filter bug.
- **Indicator contrast over art.** → 18% art opacity and a dark text colour; verify in Debug Print before adding a shadow or pill.
- **A subclass short name can be ambiguous outside EGW.** → Only subclass-only spells use the fallback, and today that is one book; full names remain available if a future book makes short names unclear.

## Migration Plan

No persisted state changes: cardbooks keep `{type, name, source}`, selection identity stays `${type}|${name}|${source}`, and no data is rewritten. Rollback is a code revert.

Sequence: merge this change, then run the A/B experiments on branches. The winning layout becomes a separate change with its own measured budget; nothing in this change's spec or tasks depends on that outcome.

## Deferred layout alternatives

Recorded here as rationale, not requirements:

| | A | B |
|---|---|---|
| Label | inline, list wraps below it | caption above the list, still `Class`/`Classes` |
| Line budget | 4 lines | 3 lines |
| Gap | 2.2 → 1.6 mm | 2.2 → 1.8 mm |
| Hero | 24 → 21 mm | 24 → 23 mm |
| Divider margins | 1.5/1.1 → 1.0/0.6 mm | unchanged |
| Effect | all lists fit; short lists gain air above the footer | all lists fit; labels stay adjacent |

Both start from this change and change only CSS. The line estimates assume ~28 characters per line at the 43.25 mm wrap width; the decision gate is Debug Print with *Detect Magic* XPHB, *Dispel Magic* XPHB, *Enhance Ability*, *Sapping Sting*, *Cure Wounds*, *Fireball*, and *Encode Thoughts*.

## Open Questions

- Whether item and beast backs should later carry the same source stamp.
- Whether the Browse list meta should hint at a subclass-only grant (e.g. `Wizard (Chronurgy)`) so the chip membership is self-explanatory.
- The final source-stamp size and whether it needs a backdrop; resolved during the print check.
