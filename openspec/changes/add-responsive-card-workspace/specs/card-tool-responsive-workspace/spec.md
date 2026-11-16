# Spec Delta

## Purpose

Defines how the card tool allocates space across phone, tablet, laptop, and large-desktop viewports, including sidebar and filter sizing, selection management, mobile action surfaces, preview density, and the large-screen page grid.

## ADDED Requirements

### Requirement: Viewport modes govern the workspace

The workspace SHALL select one width mode from desktop (1200px and above), compact desktop (900-1199px), tablet (600-899px), and phone (below 600px), and SHALL apply compact vertical density when the viewport is 820px tall or less. Mode changes SHALL NOT reset selection, filters, sort order, content mode, or the active layout.

#### Scenario: Reference laptop uses desktop and compact vertical modes

- **WHEN** the viewport is 1366x768
- **THEN** the workspace uses the desktop width mode
- **AND** it uses compact vertical density

#### Scenario: Compact desktop at 1024x768

- **WHEN** the viewport is 1024x768
- **THEN** the workspace uses the compact desktop width mode
- **AND** it uses compact vertical density

#### Scenario: Phone uses the phone mode

- **WHEN** the viewport is 390x844
- **THEN** the workspace uses the phone width mode

#### Scenario: Resizing preserves workspace state

- **WHEN** the viewport crosses a width or height mode boundary
- **THEN** the selected cards, active filters, sort order, content mode, and layout remain unchanged

### Requirement: Sidebar width is capped

The sidebar SHALL clamp between 300px and 380px. At the 1366x768 reference it SHALL be 300px; it SHALL reach 380px by 1920px viewport width and SHALL NOT grow further. The preview SHALL receive all remaining width.

#### Scenario: Baseline sidebar at 1366x768

- **WHEN** the viewport is 1366x768
- **THEN** the sidebar is 300px wide
- **AND** the preview receives the remaining width

#### Scenario: Sidebar reaches its cap at 1920

- **WHEN** the viewport is 1920px wide or wider
- **THEN** the sidebar is 380px wide

#### Scenario: Sidebar stops growing at 2560

- **WHEN** the viewport is 2560x1440
- **THEN** the sidebar remains 380px wide
- **AND** the additional width belongs to the preview

### Requirement: Filter groups are collapsible and the list keeps its space

Each filter group SHALL be a collapsible accordion that summarizes its active values when collapsed. The sidebar result list SHALL keep at least 240px of height when the viewport allows, and the filter area SHALL scroll rather than grow without bound. Filter values SHALL remain all-on by default.

#### Scenario: Expanded filters do not squeeze out the list

- **WHEN** the viewport is 1366x768 and every filter group is expanded
- **THEN** the result list retains at least 240px of height
- **AND** the filter area scrolls within its own space

#### Scenario: Collapsing filters gives space back to the list

- **WHEN** the user collapses one or more filter groups
- **THEN** the result list grows into the released space

#### Scenario: Mobile filters collapse inside Browse

- **WHEN** the user opens Browse on a phone
- **THEN** filter groups start collapsed
- **AND** the result list occupies the remaining sheet height

#### Scenario: Filters default to all values

- **WHEN** a card tool finishes loading
- **THEN** every filter value is active
- **AND** each collapsed group summarizes that all values are active

### Requirement: Selection status is a fixed single line

The selection area SHALL be one fixed-height line showing the selected count and a Manage action. It SHALL NOT render per-card chips, SHALL NOT wrap, and SHALL NOT grow with the number of selected cards. The topbar SHALL NOT repeat the count.

#### Scenario: Large selections do not consume preview space

- **WHEN** the user selects 1 card or 200 cards
- **THEN** the selection line keeps the same height
- **AND** no per-card chips appear in it

#### Scenario: Count updates with selection

- **WHEN** the user adds or removes a selected card
- **THEN** the selection line shows the new count

#### Scenario: Empty selection

- **WHEN** no cards are selected
- **THEN** the selection line shows zero selected
- **AND** the preview is hidden

### Requirement: Selection manager searches and edits the selection

The Manage action SHALL open a selection manager listing the selected cards with a search field matching name, source, and entity metadata. It SHALL show the number of matching cards and support removing one card, removing all matching cards, and clearing the selection. Changes SHALL update the selection bar, browse list, and preview while preserving print order.

#### Scenario: Search narrows the selected list

- **WHEN** 24 cards are selected and the user searches for a term matching 3 of them
- **THEN** the manager shows those 3 cards
- **AND** it states that 3 of 24 are shown

#### Scenario: Remove one selected card

- **WHEN** the user removes a card from the manager
- **THEN** that card leaves the selection
- **AND** the selection line count decreases by one

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

### Requirement: Mobile workspace uses action surfaces

On phone, a bottom action bar SHALL expose Browse, Selected, and Print. Browse SHALL open search, filter, sort, result-count, select-visible, and list controls. Selected SHALL open the selection manager. Print SHALL expose content mode, layout, Print, and Debug Print. Closing any surface SHALL return to the preview with workspace state intact.

#### Scenario: Browse sheet contains the library controls

- **WHEN** the user opens Browse on a phone
- **THEN** the sheet provides search, filters, sort, result count, select-visible, and the entity list

#### Scenario: Selected opens the selection manager

- **WHEN** the user opens Selected on a phone
- **THEN** the selection manager opens as a full-screen or bottom sheet

#### Scenario: Print options are reachable on mobile

- **WHEN** the user opens Print on a phone
- **THEN** content mode, layout, Print, and Debug Print are available

#### Scenario: Closing a surface preserves state

- **WHEN** the user closes Browse, Selected, or Print
- **THEN** the preview returns with selection and layout unchanged

### Requirement: Large-screen preview grows cards before page count

The preview SHALL size pages from the available width and height and SHALL cap page and card size at physical print size. It SHALL then add pages while every card stays at or above a 200px legibility floor; when no page count qualifies, it SHALL show the largest single page. Topbar, controls, typography, and the capped sidebar SHALL NOT scale with the viewport.

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

### Requirement: Both layout keeps page pairs adjacent

Under Both, the page grid SHALL keep each front page and its paired back page adjacent. Pairs SHALL appear side by side when the grid has two or more columns and in immediate sequence otherwise. Page sequence and sheet labels SHALL remain unchanged.

#### Scenario: Paired pages on a large grid

- **WHEN** the Both layout is previewed at 2560x1440
- **THEN** each sheet's front page appears immediately beside its back page

#### Scenario: Paired pages on a single-column grid

- **WHEN** the Both layout is previewed at 1366x768
- **THEN** each front page is followed immediately by its back page

#### Scenario: Pairing limits beast page count

- **WHEN** a beast selection uses Both at 2560x1440
- **THEN** the preview keeps front and back pages paired
- **AND** it uses a paired grid even when an unpaired grid could show more pages

### Requirement: Preview density replaces screen zoom

The workspace SHALL replace transform-based screen zoom with Auto, Large, and Grid preview densities. Auto SHALL apply responsive page sizing, Large SHALL show one page at the largest size that fits, and Grid SHALL maximize visible pages while respecting the legibility floor. Density SHALL NOT affect print, selection, layout, or content mode.

#### Scenario: Auto follows the responsive layout

- **WHEN** Auto is active at 2560x1440
- **THEN** the preview uses the responsive page grid

#### Scenario: Large shows one page

- **WHEN** Large is active
- **THEN** the preview shows one page at the largest size that fits

#### Scenario: Grid maximizes visible pages

- **WHEN** Grid is active
- **THEN** the preview shows as many pages as fit while each card stays above the legibility floor

#### Scenario: Density does not change print

- **WHEN** the user switches preview density
- **THEN** the print document, active layout, selection, and content mode remain unchanged

### Requirement: Responsive chrome is screen-only

The selection bar, selection manager, mobile action bar and sheets, density control, and page-grid layout SHALL remain screen-only. They SHALL NOT appear in the print document or Debug Print and SHALL NOT alter page sequence, side, or geometry.

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
