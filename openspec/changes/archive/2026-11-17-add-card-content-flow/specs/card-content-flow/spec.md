# Spec Delta

## Purpose

Defines how much of a selected card's content prints, on how many panels, and in what order, including the Single card and Overflow modes, bounded strip constructions, font shrinking at construction boundaries, and truncation at the cap.

## ADDED Requirements

### Requirement: Content control is selection-wide

The card tool SHALL offer exactly two content modes, Single card and Overflow, through one selection-wide control. The active mode SHALL apply to every selected card and SHALL start from the page type's default: Single card for spells and items, Overflow for beasts. The chosen mode SHALL persist for that card type for the browser session and SHALL reset on reload.

#### Scenario: Default mode per card type

- **WHEN** a card tool finishes loading and the user selects cards
- **THEN** the content control shows the page type's default mode
- **AND** spell and item pages start in Single card
- **AND** beast pages start in Overflow

#### Scenario: Switching applies to the whole selection

- **WHEN** several cards are selected and the user switches the content mode
- **THEN** every selected card is rebuilt under the new mode
- **AND** exactly one content mode is marked active

#### Scenario: Mode survives a selection clear

- **WHEN** the user clears the selection, keeps the page open, and selects cards again
- **THEN** the content mode from before the clear is still active

#### Scenario: Reload restores the default

- **WHEN** the page is reloaded
- **THEN** the content control returns to the page type's default mode

### Requirement: Single card mode fits one panel

Under Single card mode the tool SHALL render each selected card on one panel. It SHALL reduce body text from the card type's default body size down to that type's shrink floor, which is the higher of 8.9pt and 90 percent of the default, until the content fits. If the content still does not fit, the tool SHALL truncate it and SHALL show an ellipsis at the end of the visible content.

#### Scenario: Content shrinks to fit

- **WHEN** content overflows one panel at the default body size but fits at a smaller size above the shrink floor
- **THEN** the card prints on one panel at the reduced size
- **AND** no ellipsis appears

#### Scenario: Content truncates at the floor

- **WHEN** content does not fit one panel even at the shrink floor
- **THEN** the card prints on one panel with the remainder removed
- **AND** the visible content ends with an ellipsis

#### Scenario: Content fits without shrinking

- **WHEN** content fits one panel at the default body size
- **THEN** the card prints at that size
- **AND** no ellipsis appears

### Requirement: Single card mode keeps selection order

Under Single card mode the tool SHALL print cards in the active sort order on single-panel sheets. It SHALL NOT create span buckets or bucket headings in this mode.

#### Scenario: Mixed lengths stay in sort order

- **WHEN** the selection mixes short and long cards in Single card mode
- **THEN** the cards print in the active sort order without span buckets
- **AND** long cards truncate in place

### Requirement: Overflow mode assigns a bounded strip

Under Overflow mode the tool SHALL flow content at the card type's default body size onto the smallest strip construction that holds it: one panel for one page, two adjacent panels for two or three pages, and a four-panel row for four or five pages. A 2x2 layout SHALL support at most three pages and a 4x2 layout at most five.

#### Scenario: Two pages use two panels

- **WHEN** content requires two pages
- **THEN** it prints on two adjacent front panels
- **AND** both panel backs show back art

#### Scenario: Three pages use the second panel back

- **WHEN** content requires three pages
- **THEN** pages 1 and 2 print on two adjacent front panels
- **AND** page 3 prints on the back of the second panel

#### Scenario: Four pages use a four-panel row

- **WHEN** content requires four pages on a 4x2 layout
- **THEN** the tool uses the four-panel accordion construction
- **AND** pages 1 through 4 print on its front panels

#### Scenario: Five pages use the fourth panel back

- **WHEN** content requires five pages on a 4x2 layout
- **THEN** pages 1 through 4 print on the four front panels
- **AND** page 5 prints on the back of the fourth panel

#### Scenario: 2x2 layouts stop at three

- **WHEN** content requires more than three pages on a 2x2 layout
- **THEN** the tool does not create a four-panel construction

### Requirement: Overflow shrinks only at construction boundaries

When content exceeds the next construction, the tool SHALL first reduce the content font from its default down to the shrink floor to remain on the smaller construction at the 1, 3, and 5 boundaries. It SHALL NOT reduce the font to move from two to three pages or from four to five pages.

#### Scenario: One-page boundary

- **WHEN** content slightly exceeds one panel but fits one panel at a size between the shrink floor and the default
- **THEN** the card prints on one panel at the reduced size

#### Scenario: Three-page boundary fits

- **WHEN** content slightly exceeds three pages but fits three at a size between the shrink floor and the default
- **THEN** the tool keeps the two-panel strip with three pages

#### Scenario: Three-page boundary fails

- **WHEN** content exceeds three pages even at the shrink floor
- **THEN** the tool moves to the four-panel construction

#### Scenario: Two-to-three step does not shrink

- **WHEN** content requires more than two pages but no more than three
- **THEN** the tool uses three pages at the default size
- **AND** it does not reduce the font to fit two pages

#### Scenario: Four-to-five step does not shrink

- **WHEN** content requires more than four pages but no more than five
- **THEN** the tool uses five pages at the default size
- **AND** it does not reduce the font to fit four pages

### Requirement: Overflow cards are ordered by span bucket

Under Overflow mode the tool SHALL order cards into span buckets 1, 2, 3, 4, and 5, followed by a truncated bucket. Each bucket SHALL preserve the active sort order, and empty buckets SHALL be skipped.

#### Scenario: Mixed spans order by bucket

- **WHEN** the selection contains cards of spans 1, 2, 3, 4, and 5
- **THEN** the document prints span 1 cards first, then span 2, then span 3, then span 4, then span 5

#### Scenario: Active sort applies within a bucket

- **WHEN** the user changes the sort order
- **THEN** cards reorder within each bucket without changing bucket order

### Requirement: Sheets are packed by strip width

The tool SHALL pack strips into sheets by strip width rather than by span bucket: width-1 strips occupy their own sheets, width-2 strips (spans 2 and 3) share sheets, and width-4 strips (spans 4 and 5) share sheets. Each width class SHALL start on a fresh sheet, a span bucket SHALL NOT start a fresh sheet when the preceding bucket has the same strip width, and truncated cards SHALL keep their own class after every fitting card.

#### Scenario: Same-width buckets share a sheet

- **WHEN** a span 2 bucket ends partway through a sheet and span 3 cards follow
- **THEN** the span 3 cards continue on that sheet
- **AND** the sheet keeps any empty positions after the last card

#### Scenario: A width change starts a new sheet

- **WHEN** a span 3 bucket ends partway through a sheet and span 4 cards follow
- **THEN** the span 4 cards start on a new sheet
- **AND** the partially filled sheet keeps its empty positions

#### Scenario: Both layout pairs class sheets

- **WHEN** the Both layout is active
- **THEN** every sheet's front page is immediately followed by its own back page
- **AND** no sheet mixes strips of different widths

### Requirement: Over-cap content truncates last

Under Overflow mode, content that still exceeds the cap after the boundary shrink SHALL use the largest construction for the page, SHALL truncate the remainder, and SHALL end with an ellipsis on its last content panel. Such cards SHALL appear only in the final truncated bucket, after every card that fits.

#### Scenario: 4x2 content beyond five pages

- **WHEN** content does not fit five pages even at 8.9pt on a 4x2 layout
- **THEN** it prints on the four-panel construction with page 5 truncated
- **AND** an ellipsis ends the visible content

#### Scenario: 2x2 content beyond three pages

- **WHEN** content does not fit three pages even at 8.9pt on a 2x2 layout
- **THEN** it prints on the two-panel construction with page 3 truncated
- **AND** an ellipsis ends the visible content

#### Scenario: Truncated cards sort last

- **WHEN** the selection mixes fitting and over-cap cards
- **THEN** the over-cap cards print only after every fitting bucket
- **AND** the truncated bucket starts on a fresh sheet

### Requirement: Truncation is visibly marked

When content is truncated in either mode, the ellipsis SHALL appear inside the card's visible content area and SHALL NOT be clipped by overflow.

#### Scenario: Single card truncation

- **WHEN** Single card mode truncates a card
- **THEN** the ellipsis is visible at the end of the printed text

#### Scenario: Overflow cap truncation

- **WHEN** Overflow mode truncates a card at the cap
- **THEN** the ellipsis is visible at the end of the last content panel

#### Scenario: No marker without truncation

- **WHEN** content fits its construction
- **THEN** no ellipsis appears
