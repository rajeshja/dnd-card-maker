# Proposal

## Why

Spell card backs have no vertical room to spare. The 85 mm content box is consumed by a fixed 24 mm hero, three 8.4 mm meta rows, and the gaps between them, so a class list that wraps to three lines already squeezes the bottom ornament and a four-line list pushes it out of the card. The bottom-right source stamp sits in the same corner the class list grows into.

## What Changes

- **Freeze the top half of the back.** Keep the hero at exactly 24 mm on every card. Do not shrink it, measure line counts, or branch on class-list length. The top ornament, kicker, title hero, school art, indicators, divider, and meta row start keep one position for every spell.
- **Reclaim about 4 mm of static headroom** from spacing rather than from the hero: reduce the card gap from 2.2 mm to 2 mm, pull the hero's outer margins in by 1 mm on each side, reduce the divider margins from 1.5/1.1 mm to 0.6/0.4 mm, and reduce the content top inset from 5 mm to 4.5 mm.
- **Give the class value vertical padding.** Add 1 mm of padding above and below the class-list text, applied to the value, so three- and four-line lists get breathing room while the one-line row stays at its minimum height.
- **Keep the bottom ornament put for one to three lines.** The ornament stays anchored to the bottom of the card and remains fully visible with the same offset for one-, two-, and three-line lists. A four-line list is the accepted exception: the ornament moves down and is partially clipped, while every class name still prints.
- **Move the source code to the top-right.** Render it as a text stamp in the top padding strip, outside the flowing card content, so it can never be reached by a wrapped class list. The stamp clears the top ornament for the longest loaded source code.
- **Declare the boundary.** Four class-list lines is the supported maximum. A five-line list (the single 74-character *Detect Magic* XPHB label) is out of scope and remains a clipped edge case, slightly improved from today.
- **Not included:** truncation, abbreviation, ellipsis, fit-to-content, per-card hero sizing, class resolution rules, class filter behavior, page grid or duplex planning, and item or beast backs.

## Capabilities

### New Capabilities

<!-- None: this change adjusts the existing spell back-face contract. -->

### Modified Capabilities

- `spell-card-back`: the source stamp moves from bottom-right to top-right, and a new requirement fixes the top half of the back while reserving bottom space for class lists of up to three lines, with a four-line exception.

## Impact

- `js/spell-cards.js`: `spellBack()` moves the source span out of the card article and into the inner frame.
- `css/card-tool.css`: back-card inner padding, card gap, hero margins, divider margins, class-value padding, source position.
- `docs/card-tool-rendering-and-printing.md`: back-face spacing, the bottom ornament reserve, and the top-right source stamp.
- No changes to class resolution, `test/` expectations, data files, selection identity, cardbooks, print geometry, or anything under `5etools/`; `npm test` should pass unchanged.
