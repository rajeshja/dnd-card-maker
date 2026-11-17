# Tasks

## 1. Class resolution

- [x] 1.1 Replace the `prepareSpells()` fetch in `js/spell-cards.js` with `5etools/data/generated/gendata-spell-source-lookup.json`, read both `class` and `classVariant`, and attach `_classes` and `_classLabel` to each spell; verify a page load makes one lookup request and logs no console errors.
- [x] 1.2 Add `resolveSpellClasses()` and `spellClassLabel()` to `js/card-tool-content.js`: base classes first, subclass grants only when there is no base class, edition duplicates collapsed, alphabetical sorting, subclasses grouped by class using short names, `Class`/`Classes` label, em dash for none; verify each rule by calling the helpers on the fixture entries.
- [x] 1.3 Add `test/cards/SpellCardBack.test.js` covering *Fireball* (base list), *Detect Magic* XPHB (alphabetical order and 9 classes), *Magnify Gravity* (subclass-only group), *Sapping Sting* (two owning classes), *Encode Thoughts* (empty list) and a duplicated 2014/2024 subclass grant; run `npm test` and verify the suite passes.

## 2. Back face

- [x] 2.1 Reorder the meta rows to Level, School, Classes and delete the Source row in `spellBack()`, keeping the existing row shape with the classes icon, label, and a single wrapping text run; verify in the Backs preview that a multi-class spell shows Level then School then Classes and no Source row.
- [x] 2.2 Move `.back-indicators` inside `.back-hero` as an absolutely positioned overlay above the school art; verify a concentration spell, a ritual spell, and a spell that is both show indicators over the art and that their meta rows start at the same position as a card without indicators.
- [x] 2.3 Add `.back-source` as an absolutely positioned text stamp at the bottom-right of `.back-card`, outside the ornament's flow; verify the code stays bottom-right when the meta block overflows and when the bottom ornament image is removed in the browser inspector.
- [x] 2.4 Update `docs/card-tool-rendering-and-printing.md` to state the back-face order, the indicator overlay, the independent source stamp, and that the class list is not truncated; verify the document matches the rendered markup and that the existing "school, level, classes" claim is now true.

## 3. Class filter

- [x] 3.1 Point the Class chip values at the resolved `_classes` in `js/spell-cards.js`; verify the 15 EGW subclass-only spells appear under Wizard, *Sapping Sting* appears under both Cleric and Wizard, *Fireball* does not appear under Cleric, and *Encode Thoughts* appears under no class chip.
- [x] 3.2 Extend `test/cards/SpellCardBack.test.js` with the filter-membership cases (base list unchanged, subclass owner added, no widening when a base class exists, no grant listed); run `npm test` and verify the suite passes.
- [x] 3.3 Update `docs/card-tool-data-and-state.md` with the class resolution rule, the two derived fields, and the subclass-grants-fill-gaps boundary; verify the documented behavior matches the chips in the running page.

## 4. Integration checks

- [x] 4.1 Run `npm test` and verify the full suite passes, including the new back-face cases.
- [x] 4.2 Run `npm run serve` and check the backs of *Fireball*, *Detect Magic* XPHB, *Dispel Magic* XPHB, *Enhance Ability*, *Sapping Sting*, *Encode Thoughts*, and a spell whose source is `AitFR-AVT`; verify every class name is present, the source code is visible, the ornament is still drawn, and no page geometry, sheet order, or duplex pairing changed under Fronts, Backs, Both, or Debug Print.
- [x] 4.3 Verify the change adds no compaction, measurement, or fit step for the back meta and that the 74-character lists still overflow as they do today; inspect `fitRenderedCards()` and the diff for any `back-compact` or meta measurement code.
- [x] 4.4 Confirm `git status` shows only project files and no changes inside `5etools/`, and that selection identity, cardbooks, and print planning are untouched.

## Workflow follow-up

- Archive this change after the project's review requirements are satisfied.
- After archive, run the deferred A/B layout experiments on separate throwaway branches from the merged core; record the Debug Print measurements before choosing.
- Capture the winning layout as a separate change with its own budget and requirements; do not add A/B variants to this change or to the durable `spell-card-back` spec.
