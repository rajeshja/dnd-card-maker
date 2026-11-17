# card-print-layout Specification

## Purpose

Lets the shared card tool preview and print card fronts, card backs, or interleaved front/back page pairs, so a double-sided card set can be produced in a single print job with the same document visible before printing.

## Requirements

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

### Requirement: Interleaved page order

Under the Both layout, the tool SHALL emit the front page of a sheet followed immediately by the back page of that same sheet, repeated for every sheet in document order. The two pages of a pair SHALL contain the same panels in corresponding positions. Sheets SHALL be grouped by strip width, so every strip on a sheet occupies the same number of columns, and each width class SHALL begin on a new sheet.

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

#### Scenario: Width boundary starts a new pair

- **WHEN** a width class ends partway through its last sheet and another class follows
- **THEN** the next class starts on a new front page paired with its own back page
- **AND** the partially filled sheet keeps its empty positions

#### Scenario: Pages never mix widths

- **WHEN** strips of different widths are selected
- **THEN** every printed page contains strips of exactly one width
- **AND** consecutive span buckets of the same width may share a page

### Requirement: Back pages mirror each row

Every back page SHALL reverse the panel order within each row of its paired front page, so that a duplex flip aligns each back with its own panel. Back content SHALL be derived per panel from that panel's role in its strip rather than from a flat reversed card list.

#### Scenario: Landscape row mirroring

- **WHEN** a front page holds cards A B C D on the first row and E F G H on the second row
- **THEN** the paired back page holds D C B A on the first row and H G F E on the second row

#### Scenario: Portrait row mirroring

- **WHEN** a 2x2 portrait front page holds cards A B on the first row and C D on the second row
- **THEN** the paired back page holds B A on the first row and D C on the second row

#### Scenario: Two-panel strip backs

- **WHEN** a two-panel strip holds pages 1 and 2 on two adjacent front panels
- **THEN** the mirrored back position behind page 1 holds back art
- **AND** the mirrored back position behind page 2 holds back art or, for a three-page card, page 3

#### Scenario: Four-panel strip backs

- **WHEN** a four-panel accordion strip fills one row with pages 1 through 4
- **THEN** the mirrored back position behind page 1 holds back art
- **AND** the mirrored back positions behind pages 2 and 3 are blank
- **AND** the mirrored back position behind page 4 holds back art or, for a five-page card, page 5

#### Scenario: Single panel backs

- **WHEN** a card occupies one front panel
- **THEN** the mirrored back position behind it holds back art

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

The card tool SHALL expose the layout as one three-state dropdown control whose closed label is the active layout, plus a Print action and a Debug Print action. The dropdown SHALL offer exactly Fronts, Backs, and Both, and SHALL mark the active one. The separate Print backs and Show backs controls SHALL remain removed.

#### Scenario: Control set

- **WHEN** at least one card is selected
- **THEN** the workspace bar shows the layout dropdown, Print, and Debug Print
- **AND** no Print backs or Show backs control is present

#### Scenario: Active layout is the closed label

- **WHEN** the layout is Both
- **THEN** the closed layout control shows Both

#### Scenario: All three layouts remain available

- **WHEN** the user opens the layout dropdown
- **THEN** Fronts, Backs, and Both are all offered
- **AND** exactly one is marked as active

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

### Requirement: Cut and fold guides mark strip boundaries

The print output SHALL draw a solid cut guide at every boundary between separate strips and between rows, and a dashed fold guide at every boundary between two panels of the same strip. The tool SHALL NOT draw guides along sheet outer edges or around empty padding cells. Guide geometry SHALL be mirror-symmetric so a back page shows the same guide roles as its paired front page.

#### Scenario: Single-panel sheets only show cuts

- **WHEN** every card on a sheet occupies one panel
- **THEN** solid cut guides separate all adjacent cards
- **AND** no fold guide appears

#### Scenario: Two-panel strips show folds and cuts

- **WHEN** a sheet holds two-panel strips
- **THEN** a dashed fold guide separates the two panels inside each strip
- **AND** a solid cut guide separates neighbouring strips and rows

#### Scenario: Accordion strips show three folds

- **WHEN** a sheet holds four-panel accordion strips
- **THEN** dashed fold guides separate pages 1-2, 2-3, and 3-4 within each strip
- **AND** a solid cut guide separates the two rows

#### Scenario: Guides appear on both sides

- **WHEN** the Backs or Both layout prints
- **THEN** back pages carry the same guide roles as their paired front pages
- **AND** a sheet printed back-only still shows its cut and fold guides

#### Scenario: No guides at sheet edges

- **WHEN** a strip touches a sheet edge
- **THEN** no guide is drawn along that edge

#### Scenario: Padding cells stay unguided

- **WHEN** a sheet is only partly filled
- **THEN** empty positions show no guide lines or card art

### Requirement: Preview bucket headings

Under Overflow mode the on-screen preview SHALL show a heading before the first sheet on which each populated bucket appears, naming the bucket, its card count, and the sheets its cards occupy. A bucket that begins partway through a sheet shared with a previous bucket SHALL still get its heading at that sheet, and when two buckets begin on the same sheet the preview SHALL show both headings above that sheet in bucket order. These headings SHALL NOT appear in the print document or in Debug Print.

#### Scenario: Headings in overflow preview

- **WHEN** the selection produces span 1 and span 2 buckets in Overflow mode
- **THEN** the preview shows a heading before the first span 1 sheet
- **AND** a heading before the first span 2 sheet
- **AND** each heading states the bucket's card count and sheet range

#### Scenario: Heading for a bucket that begins mid-sheet

- **WHEN** a span 2 bucket ends partway through a sheet and span 3 cards begin on that same sheet
- **THEN** the preview shows the span 2 heading and then the span 3 heading above that sheet
- **AND** the span 3 heading's sheet range begins at that sheet

#### Scenario: Shared sheet ranges overlap

- **WHEN** two buckets share a sheet
- **THEN** each heading states only its own card count and the sheets its own cards occupy
- **AND** the two sheet ranges overlap on the shared sheet

#### Scenario: Headings stay out of print

- **WHEN** the user prints or opens Debug Print
- **THEN** no bucket heading appears in the output

#### Scenario: No headings in single card mode

- **WHEN** Single card mode is active
- **THEN** the preview shows no bucket headings
