# Spec Delta

## MODIFIED Requirements

### Requirement: Layout selection drives preview and print

The card tool SHALL offer three layouts, Fronts, Backs, and Both, and SHALL start in Fronts. The active layout SHALL determine the page preview and the next print document. All three presentations SHALL derive from the same page plan, and switching presentation SHALL NOT change selection, card content, page sequence, or page geometry. Card-level inspection surfaces MAY show either side, and the layout SHALL set only their default side.

#### Scenario: Initial layout

- **WHEN** a card tool finishes loading and the user selects cards
- **THEN** the page preview shows front pages
- **AND** the layout control indicates Fronts

#### Scenario: Switching to Backs

- **WHEN** the user selects the Backs layout
- **THEN** the page preview shows only mirrored back pages
- **AND** card-level previews default to card backs
- **AND** no front page is visible

#### Scenario: Switching to Both

- **WHEN** the user selects the Both layout
- **THEN** the page preview shows front and back pages in alternating order
- **AND** card-level previews offer both sides of each card

#### Scenario: Layout resets when the preview closes

- **WHEN** the selection becomes empty and the preview is hidden
- **THEN** the active layout returns to Fronts

#### Scenario: Layout is independent of presentation

- **WHEN** the user switches between the page preview, the card gallery, and the card detail view
- **THEN** the active layout remains unchanged
- **AND** the printed document would remain unchanged

#### Scenario: Card-level inspection does not change print

- **WHEN** the user inspects card fronts while the layout is Backs
- **THEN** the next print document still contains back pages only

### Requirement: Preview and Debug Print match the print document

The desktop page preview, the large-screen page grid, the mobile Pages view, and Debug Print SHALL show the same page sequence and the same side for every page as the print document for the active layout, and none SHALL expose a side the print action would not print. A card gallery or card detail view MAY show either side of an individual card without changing the page preview or the print document, but SHALL derive from the same page plan and SHALL NOT substitute for page verification.

#### Scenario: Both layout parity

- **WHEN** the Both layout is active
- **THEN** the page preview page sequence and the print page sequence both read front, back, front, back

#### Scenario: Backs layout parity

- **WHEN** the Backs layout is active and Debug Print is opened
- **THEN** Debug Print shows only back pages in their print order

#### Scenario: Debug Print uses the active layout

- **WHEN** the user opens Debug Print under any layout
- **THEN** it renders that layout at print geometry rather than a different side

#### Scenario: Sixteen pages visible at once

- **WHEN** the large-screen page grid shows multiple pages simultaneously
- **THEN** the visible pages keep the print document's sequence and sides
- **AND** no page is repeated or omitted by the grid

#### Scenario: Paired pages stay adjacent on a large grid

- **WHEN** the Both layout is shown in a multi-column page grid
- **THEN** each front page is displayed beside its paired back page
- **AND** the displayed order matches the print document order

#### Scenario: Mobile Pages view matches the print

- **WHEN** the mobile Pages view is shown under any layout
- **THEN** its page order and page sides match the print document for that layout

#### Scenario: Card gallery does not replace page verification

- **WHEN** the mobile preview shows the card gallery
- **THEN** the Pages view remains available for checking print order and sides
- **AND** the gallery does not introduce a different card order than the page plan

#### Scenario: Preview density does not affect print parity

- **WHEN** the user changes the preview density on a large screen
- **THEN** the print document keeps the same page sequence, sides, and geometry

#### Scenario: Card-level sides do not imply parity

- **WHEN** the layout is Fronts and a card back is shown in the detail view
- **THEN** that back is not presented as part of the print preview
- **AND** the page preview continues to show front pages only
