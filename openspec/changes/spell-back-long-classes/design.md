# Design

## Context

See `proposal.md` - Why. The mechanics that constrain the approach:

- `spellBack()` in `js/spell-cards.js` renders the entire back face as one inline HTML string. Today the source span is the last child of `<article class="back-card">`.
- `.back-card-inner` has a 5 mm margin and 5 mm padding, so the content box is 54.25 mm × 85 mm inside a 74.25 mm × 105 mm card.
- Inside `.back-card` the flow is: top ornament, kicker, underline, 24 mm hero, divider, three meta rows with an 8.4 mm minimum height, then the bottom ornament with `margin-top: auto`.
- `fitRenderedCards()` fits back titles only. The back meta block is never measured, compacted, or truncated.
- The longest class label in the loaded data is *Detect Magic* XPHB at 74 characters (nine classes). At the print wrap width it occupies five lines. *Dispel Magic* PHB at 66 characters (eight classes) occupies four.

Baseline measurements at print geometry in a scratch Chrome harness using the real stylesheet and assets:

| Class lines | Class row | Bottom ornament |
|---|---|---|
| 1 | 8.4 mm | full |
| 2 | 8.4 mm | full |
| 3 | 11.4 mm | only ~1.3 mm visible |
| 4 | 15.1 mm | fully pushed below the card |
| 5 | 18.8 mm | fully below; class text overflows |

The 24 mm hero, 2.2 mm card gap, and 1.5/1.1 mm divider margins consume roughly 32 mm before the meta block starts; that is where the headroom has to come from.

## Goals / Non-Goals

**Goals:**

- One top-half composition for every spell, including the 24 mm hero and its school art.
- Three class lines fit with clear space above and below the text while the bottom ornament stays fully visible in its current place.
- Four class lines print completely, with the ornament as the only element allowed to move.
- Keep the back-meta "no measurement, no fit, no truncation" policy intact.

**Non-Goals:**

- Supporting five-line lists.
- Reducing the hero, shrinking the school art, or resizing class text per spell.
- Changing class resolution, filters, print geometry, duplex ordering, cardbooks, or item/beast backs.
- Extracting the back renderer or converting the template to DOM construction.

## Decisions

### 1. Keep the hero and all spacing static

No `flex` on the hero, no `min-height` floor, no line-count tagging, and no per-card CSS class. The hero stays at 24 mm and the top half is identical on every card.

Alternatives rejected:

- **Let the hero yield (`flex: 0 1 24mm; min-height: 16mm`).** It works, but the hero and the school art visibly change size between cards, which is exactly what this change is meant to remove.
- **Measure the class value after render and tag three-plus-line cards.** It would preserve 1-2 line cards pixel-for-pixel, but it adds a measurement step to `fitRenderedCards()` and breaks the documented rule that the back meta is never measured. The static version already keeps the top half fixed, so the only difference is extra space at the bottom of short cards.

### 2. Reclaim height from four fixed spacing values

| Property | Current | New | Saving |
|---|---|---|---|
| `.back-card-inner` padding top | 5 mm | 4.5 mm | 0.5 mm |
| `.back-card` gap | 2.2 mm | 2 mm | ~0.6 mm over three gaps |
| `.back-hero` margin block | 0 | −1 mm each side | 2 mm |
| `.back-ornament-divider` margin block | 1.5 / 1.1 mm | 0.6 / 0.4 mm | 1.6 mm |

That is roughly 4 mm of static reclaim. The hero box is untouched; `margin-block: -1mm` only pulls the surrounding gaps in, it does not change the 24 mm height or the art.

The 4.5 mm top inset is not arbitrary: it is the smallest inset that lets the top-right source stamp clear the top ornament for `AitFR-AVT` (see decision 4).

### 3. Put the padding on the class value, not the row

```css
.back-meta-row--classes .back-meta-value {
    padding-block: 1mm;
}
```

The row contains a 7.2 mm icon and has an 8.4 mm minimum height. Padding on the row would push even a one-line row to about 9.4 mm because the icon and padding no longer fit, moving the bottom ornament on every short card. Padding on the value is absorbed by the row's minimum height for one line, so only wrapped lists grow:

| Class lines | Row before | Row after |
|---|---|---|
| 1 | 8.4 mm | 8.4 mm |
| 2 | 8.4 mm | 9.7 mm |
| 3 | 11.4 mm | 13.4 mm |
| 4 | 15.1 mm | 17.1 mm |
| 5 | 18.8 mm | 20.8 mm |

The two-line case grows by 1.3 mm because the padded value now exceeds the row minimum. That is below the ornament, so the top half is unaffected.

### 4. The source stamp must leave `.back-card`

The stamp must sit 1 mm from the card border. Inside `.back-card`, `top: 1mm` is measured from the padded content edge, which is already 4.5 mm in, so the stamp would land on the top ornament. Move `<span class="back-source">` out of the article and make it a direct child of `.back-card-inner`:

```html
<div class="card-inner back-card-inner ...">
    <article class="back-card">...</article>
    <span class="back-source">XPHB</span>
</div>
```

```css
.back-card-inner {
    position: relative;
    padding: 4.5mm 5mm 5mm;
}
.back-source {
    right: 1.5mm;
    top: 1mm;
    bottom: auto;
    z-index: 2;
}
```

This also places the stamp in the padding strip, outside `.back-card`'s `overflow: hidden` flow, so wrapped class text can never reach it.

Clearance check for the longest loaded code, `AitFR-AVT` at 6.5 pt:

- stamp height ≈ 2.65 mm, so its bottom sits at 3.65 mm from the border;
- content (and therefore the top ornament) starts at 4.5 mm;
- measured clearance ≈ 0.85 mm, no overlap.

If a future source code is longer, shrink the stamp's letter-spacing or font size rather than moving it back to the bottom-right.

### 5. The bottom ornament stays in flow

`.back-ornament-bottom` keeps `margin-top: auto`, so it is anchored to the bottom of the card and the space above it absorbs whatever the class list does not use. With the static reclaim and the value padding:

| Class lines | Bottom ornament |
|---|---|
| 1 | fully visible, flush to the bottom |
| 2 | fully visible, same position |
| 3 | fully visible, same position |
| 4 | moves down; about 1 mm of it remains visible |
| 5 | entirely below the content box |

A four-line list is the documented exception in the spec. The class text still prints completely; only the ornament is clipped.

### 6. Four lines is the supported maximum

The longest real label is five lines, so the supported maximum does not cover every loaded spell. This is deliberate and accepted for this change: the alternative would be to shrink the class font or split the list into columns, both of which are per-card layout changes the user rejected. The change still improves the five-line case, from roughly 3.6 mm of class-text overflow to about 0.5 mm.

Measured result with the final values, print geometry, title *Mordenkainen's Magnificent Mansion* for the long-title case and *AitFR-AVT* as the source:

```text
lines   class row   top half   ornament            source
1        8.4 mm    fixed      full, flush bottom   top-right, 0.85 mm clear
2        9.7 mm    fixed      full, flush bottom   same
3       13.4 mm    fixed      full, flush bottom   same
4       17.1 mm    fixed      ~1 mm visible        same
5       20.8 mm    fixed      off-card             same
```

The hero measures 90.7 px (24 mm) and the top ornament, divider, and meta start are identical across all five cases. Because the top half moved up by ~4 mm relative to today, one- and two-line cards gain that much extra space above the bottom ornament. That is the visible cost of a uniform top half.

## Risks / Trade-offs

- **Four-line lists clip most of the bottom ornament.** → Accepted and written into the spec as the one exception; the class list itself stays complete.
- **The longest loaded label is five lines.** → Documented as out of scope; validate *Detect Magic* XPHB explicitly so the residual clip is known and not mistaken for a regression.
- **One- and two-line cards shift ~4 mm upward.** → Intentional consequence of the static top half; compare against the current Backs preview before merge.
- **The 1 mm hero margin could look cramped at print size.** → The hero box and art are unchanged; check the divider gap in Debug Print and reduce the negative margin first if it reads tight.
- **Top-right stamp clearance depends on source-code length.** → `AitFR-AVT` is measured with 0.85 mm to spare; a longer future code needs a smaller stamp, not a different corner.
- **Screen and print can differ.** → All fitting remains title-only; verify both the on-screen card and Debug Print at A4 landscape, since no page geometry or duplex logic is touched.

## Migration Plan

No persisted state changes: cardbooks keep `{type, name, source}`, selection identity stays `${type}|${name}|${source}`, and no data is rewritten. Rollback is a CSS and template revert. Archive after the visual checks pass.

## Open Questions

- Whether five-line lists should get a deliberate treatment later (smaller class text, two-column list, or a slightly taller card reserve) if a future data update adds more long lists.
