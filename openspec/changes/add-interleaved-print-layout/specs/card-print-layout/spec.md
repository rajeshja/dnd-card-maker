# Spec Delta

## Purpose

Lets the shared card tool preview and print card fronts, card backs, or interleaved front/back page pairs, so a double-sided card set can be produced in a single print job with the same document visible before printing.

## ADDED Requirements

### Requirement: Layout selection drives preview and print

The card tool SHALL offer exactly three card layouts: Fronts, Backs, and Both. The active layout SHALL determine both the on-screen preview and the next print document. Every card tool SHALL start in the Fronts layout.

#### Scenario: Initial layout

- **WHEN** a card tool finishes loading and the user selects cards
- **THEN** the preview shows front pages
- **AND** the layout control indicates Fronts

#### Scenario: Switching to Backs

- **WHEN** the user selects the Backs layout
- **THEN** the preview shows only mirrored back pages
- **AND** no front page is visible

#### Scenario: Switching to Both

- **WHEN** the user selects the Both layout
- **THEN** the preview shows front and back pages in alternating order

#### Scenario: Layout resets when the preview closes

- **WHEN** the selection becomes empty and the preview is hidden
- **THEN** the active layout returns to Fronts

### Requirement: Interleaved page order

Under the Both layout, the tool SHALL emit the front page of a card chunk followed immediately by the back page of that same chunk, repeated for every chunk in selection order. The two pages of a pair SHALL contain the same cards in corresponding positions.

#### Scenario: Multiple chunks alternate

- **WHEN** the user selects 10 cards with a page capacity of 8 and chooses Both
- **THEN** the document order is: front page 1, back page 1, front page 2, back page 2

#### Scenario: Partial final chunk stays paired

- **WHEN** the final chunk contains fewer cards than the page capacity
- **THEN** its front page is padded with empty positions
- **AND** its back page mirrors that same padded page so the real back cards sit behind their real front cards

#### Scenario: Empty positions stay empty

- **WHEN** a padded position has no card
- **THEN** both the front and the back page leave that position empty
- **AND** no card art or text appears there

### Requirement: Back pages mirror each row

Every back page SHALL reverse the card order within each row of its paired front page, so that a duplex flip aligns each back with its own card.

#### Scenario: Landscape row mirroring

- **WHEN** a front page holds cards A B C D on the first row and E F G H on the second row
- **THEN** the paired back page holds D C B A on the first row and H G F E on the second row

#### Scenario: Portrait row mirroring

- **WHEN** a 2x2 portrait front page holds cards A B on the first row and C D on the second row
- **THEN** the paired back page holds B A on the first row and D C on the second row

### Requirement: Preview and Debug Print match the print document

The on-screen preview and Debug Print SHALL show the same page sequence and the same side for every page as the print document generated for the active layout. The tool SHALL NOT expose a preview state that shows a side the print action would not print.

#### Scenario: Both layout parity

- **WHEN** the Both layout is active
- **THEN** the preview page sequence and the print page sequence both read front, back, front, back

#### Scenario: Backs layout parity

- **WHEN** the Backs layout is active and Debug Print is opened
- **THEN** Debug Print shows only back pages in their print order

#### Scenario: Debug Print uses the active layout

- **WHEN** the user opens Debug Print under any layout
- **THEN** it renders that layout at print geometry rather than a different side

### Requirement: Sheet labels express front/back pairing

Each preview page SHALL be labeled with a physical sheet number and its side so pairing can be checked before printing. Front and back pages belonging to the same chunk SHALL carry the same sheet number.

#### Scenario: Paired labels in Both

- **WHEN** the Both layout produces two sheets
- **THEN** the labels read `Sheet 1 of 2 - Fronts`, `Sheet 1 of 2 - Backs`, `Sheet 2 of 2 - Fronts`, `Sheet 2 of 2 - Backs`

#### Scenario: Single-sided labels

- **WHEN** the Fronts layout produces three pages
- **THEN** the labels read `Sheet 1 of 3 - Fronts` through `Sheet 3 of 3 - Fronts`

### Requirement: Print action is deterministic

The print action SHALL print the active layout and SHALL NOT change the active layout, the preview order, or the preview side. The result of printing SHALL NOT depend on any previously toggled preview state.

#### Scenario: Printing backs

- **WHEN** the Backs layout is active and the user prints
- **THEN** the print document contains only back pages
- **AND** the layout remains Backs

#### Scenario: Printing a paired document

- **WHEN** the Both layout is active and the user prints
- **THEN** the print document contains interleaved front and back pages
- **AND** the layout remains Both

#### Scenario: Two-pass workflow remains available

- **WHEN** the user prints with Fronts active and later prints with Backs active
- **THEN** each document contains only its own side in chunk order
- **AND** the two documents can still be combined by manual reinsertion

### Requirement: Single layout control and two print actions

The card tool SHALL expose the layout as one three-state control labeled Fronts, Backs, and Both, plus a Print action and a Debug Print action. The separate Print backs and Show backs controls SHALL be removed.

#### Scenario: Control set

- **WHEN** at least one card is selected
- **THEN** the toolbar shows the three-state layout control, Print, and Debug Print
- **AND** no Print backs or Show backs control is present

### Requirement: Card rendering and page geometry stay fixed

Changing layout SHALL NOT alter card content, card fitting, page grid dimensions, page orientation, or selection identity. Spell and item cards SHALL keep an A4 landscape 4x2 grid and beast cards SHALL keep an A4 portrait 2x2 grid.

#### Scenario: Geometry is layout-independent

- **WHEN** a user switches a spell card tool from Fronts to Both
- **THEN** each page keeps four columns and two rows in A4 landscape
- **AND** the same cards appear on the same sheet numbers as in the Fronts layout

#### Scenario: Selection identity is layout-independent

- **WHEN** the user changes layout
- **THEN** selected cards stay selected
- **AND** deduplication still uses `${type}|${name}|${source}`
