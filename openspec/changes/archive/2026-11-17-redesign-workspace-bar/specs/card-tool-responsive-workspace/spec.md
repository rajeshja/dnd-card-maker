# Spec Delta

## REMOVED Requirements

### Requirement: Viewport modes govern the workspace

**Reason**: The workspace chrome is a single fixed-height row at every viewport height after this change, so there is no height-based mode left to govern.

**Migration**: Use `Width modes govern the workspace`, which keeps the four width modes and the state-preservation guarantee and drops the 820px compact vertical density.

## ADDED Requirements

### Requirement: Width modes govern the workspace

The workspace SHALL select one width mode from desktop (1200px and above), compact desktop (900-1199px), tablet (600-899px), and phone (below 600px). The workspace chrome SHALL keep one row and the same height at every viewport height. Mode changes SHALL NOT reset selection, filters, sort order, content mode, or the active layout.

#### Scenario: Reference laptop uses the desktop mode

- **WHEN** the viewport is 1366x768
- **THEN** the workspace uses the desktop width mode
- **AND** the chrome is one row

#### Scenario: Compact desktop at 1024x768

- **WHEN** the viewport is 1024x768
- **THEN** the workspace uses the compact desktop width mode

#### Scenario: Phone uses the phone mode

- **WHEN** the viewport is 390x844
- **THEN** the workspace uses the phone width mode

#### Scenario: Short viewport keeps the same chrome

- **WHEN** the viewport is 1366x700 or 1366x1000
- **THEN** the workspace keeps the same single-row chrome height

#### Scenario: Resizing preserves workspace state

- **WHEN** the viewport crosses a width boundary
- **THEN** the selected cards, active filters, sort order, content mode, and layout remain unchanged

## MODIFIED Requirements

### Requirement: Selection status is a fixed single line

Selection status SHALL be one fixed-height element in the workspace bar showing the selected count, and the chrome SHALL NOT repeat the count in a second row. The count SHALL be the control that opens the selection manager; no separate Manage action SHALL exist. The selection status SHALL NOT render per-card chips, SHALL NOT wrap, and SHALL NOT grow with the number of selected cards.

#### Scenario: Large selections do not consume preview space

- **WHEN** the user selects 1 card or 200 cards
- **THEN** the selection status keeps the same height
- **AND** no per-card chips appear in it

#### Scenario: Count updates with selection

- **WHEN** the user adds or removes a selected card
- **THEN** the workspace bar shows the new count

#### Scenario: Count opens the manager

- **WHEN** 24 cards are selected and the user activates the count
- **THEN** the selection manager opens showing 24 cards

#### Scenario: No duplicate Manage action

- **WHEN** the chrome is rendered
- **THEN** no standalone Manage action is present

#### Scenario: Empty selection

- **WHEN** no cards are selected
- **THEN** the workspace bar shows zero selected
- **AND** the preview is hidden

### Requirement: Selection manager searches and edits the selection

The selected count in the workspace bar SHALL open a selection manager listing the selected cards with a search field matching name, source, and entity metadata. It SHALL show the number of matching cards and support removing one card, removing all matching cards, and clearing the selection. Changes SHALL update the workspace bar count, browse list, and preview while preserving print order.

#### Scenario: Search narrows the selected list

- **WHEN** 24 cards are selected and the user searches for a term matching 3 of them
- **THEN** the manager shows those 3 cards
- **AND** it states that 3 of 24 are shown

#### Scenario: Remove one selected card

- **WHEN** the user removes a card from the manager
- **THEN** that card leaves the selection
- **AND** the workspace bar count decreases by one

#### Scenario: Remove matching cards

- **WHEN** a search is active and the user chooses to remove the matching cards
- **THEN** only the matching selected cards are removed
- **AND** the search remains active for the remaining selection

#### Scenario: Clear the whole selection

- **WHEN** the user chooses to clear the selection
- **THEN** no cards remain selected
- **AND** the preview is hidden

#### Scenario: Print order is preserved

- **WHEN** the user removes cards through the manager
- **THEN** the remaining cards keep the active sort order used by the preview and print document

#### Scenario: No matching selected cards

- **WHEN** the search matches no selected cards
- **THEN** the manager shows an empty result state
- **AND** it reports that zero of the selected cards match

### Requirement: Large-screen preview grows cards before page count

The preview SHALL size pages from the available width and height and SHALL cap page and card size at physical print size. It SHALL then add pages while every card stays at or above a 200px legibility floor; when no page count qualifies, it SHALL show the largest single page. Workspace chrome, controls, typography, and the capped sidebar SHALL NOT scale with the viewport.

#### Scenario: One page at the 1366x768 baseline

- **WHEN** a spell or item selection is previewed at 1366x768
- **THEN** one landscape page is visible
- **AND** its cards are approximately 226px wide

#### Scenario: Cards reach print size at 1920x1080

- **WHEN** a spell or item selection is previewed at 1920x1080
- **THEN** one landscape page is visible at approximately physical print size
- **AND** its cards are approximately 280px wide

#### Scenario: More pages at 2560x1440

- **WHEN** a spell or item selection is previewed at 2560x1440
- **THEN** four landscape pages are visible in a 2x2 grid
- **AND** the cards remain above the legibility floor

#### Scenario: Vertical space limits page count

- **WHEN** a spell or item selection is previewed at 2560x1080
- **THEN** two landscape pages are visible side by side

#### Scenario: Portrait pages fit more per row earlier

- **WHEN** a beast selection is previewed at 1366x768
- **THEN** two portrait pages are visible side by side

### Requirement: Responsive chrome is screen-only

The workspace bar, selection manager, mobile action bar and sheets, density control, and page-grid layout SHALL remain screen-only. They SHALL NOT appear in the print document or Debug Print and SHALL NOT alter page sequence, side, or geometry.

#### Scenario: Large-screen grid does not change print

- **WHEN** the page grid shows four pages at 2560x1440 and the user prints
- **THEN** the print document keeps its normal page sequence and geometry

#### Scenario: Mobile surfaces stay out of print

- **WHEN** the user prints from a phone
- **THEN** the print document contains only card pages
- **AND** no action bar, sheet, or detail view appears

#### Scenario: Debug Print remains print-only

- **WHEN** the user opens Debug Print
- **THEN** it shows the print pages without responsive workspace chrome
