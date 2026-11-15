# Spec Delta

## MODIFIED Requirements

### Requirement: Interleaved page order

Under the Both layout, the tool SHALL emit the front page of a sheet followed immediately by the back page of that same sheet, repeated for every sheet in document order. The two pages of a pair SHALL contain the same panels in corresponding positions. Sheets SHALL be grouped by span bucket, so no sheet carries panels from two buckets, and a bucket SHALL begin on a new sheet.

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

#### Scenario: Bucket boundary starts a new pair

- **WHEN** a span bucket ends partway through its last sheet and another bucket follows
- **THEN** the next bucket starts on a new front page paired with its own back page
- **AND** the partially filled sheet keeps its empty positions

#### Scenario: Pages never mix buckets

- **WHEN** several span buckets exist
- **THEN** every printed page contains panels from exactly one bucket

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

## ADDED Requirements

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

Under Overflow mode the on-screen preview SHALL show a heading before the first sheet of each populated bucket, naming the bucket and its sheet range. These headings SHALL NOT appear in the print document or in Debug Print.

#### Scenario: Headings in overflow preview

- **WHEN** the selection produces span 1 and span 2 buckets in Overflow mode
- **THEN** the preview shows a heading before the first span 1 sheet
- **AND** a heading before the first span 2 sheet
- **AND** each heading states the bucket's card count and sheet range

#### Scenario: Headings stay out of print

- **WHEN** the user prints or opens Debug Print
- **THEN** no bucket heading appears in the output

#### Scenario: No headings in single card mode

- **WHEN** Single card mode is active
- **THEN** the preview shows no bucket headings
