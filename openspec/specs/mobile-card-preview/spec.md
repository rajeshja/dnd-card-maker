# mobile-card-preview Specification

## Purpose
Defines the card-level preview surfaces used on phones and other narrow viewports: a gallery of individual cards in print order, a Pages view that still mirrors the print document, and a single-card detail view for reading and inspecting individual cards.

## Requirements

### Requirement: Card gallery is the default mobile preview

On phone viewports the preview SHALL default to a card gallery. The gallery SHALL be derived from the same page plan as the page preview and SHALL preserve plan order. It SHALL group tiles by sheet and label each group with the side it is currently displaying. It SHALL render one tile per logical card, SHALL omit empty padding positions, and SHALL badge a card that occupies more than one panel. A selected card SHALL NOT be repeated once per panel.

#### Scenario: Gallery groups by sheet

- **WHEN** the user selects enough cards to fill two sheets and opens the preview on a phone
- **THEN** the gallery shows the cards of sheet 1 under that sheet's heading
- **AND** it then shows the cards of sheet 2 under that sheet's heading

#### Scenario: One tile per logical card

- **WHEN** a selected card occupies three panels
- **THEN** the gallery shows that card once
- **AND** its tile carries a three-panel badge

#### Scenario: Empty padding is not shown

- **WHEN** a sheet has fewer cards than positions
- **THEN** the gallery shows only the occupied cards

#### Scenario: Gallery follows print order

- **WHEN** the active sort order changes
- **THEN** the gallery order changes to match the new plan order

#### Scenario: Gallery is available below the tablet breakpoint

- **WHEN** the viewport is 390x844 or 360x800
- **THEN** the preview defaults to the card gallery

#### Scenario: Headings name the displayed side

- **WHEN** the gallery is showing backs under the Both layout
- **THEN** every group heading names the back side
- **AND** no heading claims a side that is not displayed

### Requirement: Gallery tiles preserve print geometry

Each gallery tile SHALL render the card at its print geometry and SHALL scale the whole card uniformly to the tile. Tiles SHALL preserve the card's aspect ratio and SHALL NOT reflow, clip, or truncate card content because of viewport width. Tile width SHALL follow the gallery grid and SHALL remain large enough to read card names.

#### Scenario: Narrow phone does not clip card content

- **WHEN** the gallery is shown at 360x800
- **THEN** each tile shows the complete card scaled down proportionally
- **AND** no card text or border is clipped

#### Scenario: Landscape and portrait cards keep their proportions

- **WHEN** spell cards and beast cards are previewed as a gallery
- **THEN** each spell tile keeps the landscape card ratio
- **AND** each beast tile keeps the portrait card ratio

### Requirement: Mobile keeps a Pages view

The mobile preview SHALL offer a Pages view that shows the print pages as sheets, including page labels, bucket headings, layout guides, and the active side for every page. The Pages view SHALL preserve print page order, the active layout semantics, and page geometry, and SHALL support pinch zoom. Switching between Cards and Pages SHALL preserve selection, layout, content mode, sort order, and scroll position within each view.

#### Scenario: Pages view matches print sequence

- **WHEN** the user switches the mobile preview to Pages under the Both layout
- **THEN** pages appear as front, back, front, back in print order

#### Scenario: Pages view shows print chrome

- **WHEN** the user inspects a page in the mobile Pages view
- **THEN** its sheet label, bucket heading, and layout guides are visible

#### Scenario: Switching views preserves state

- **WHEN** the user switches from Cards to Pages and back
- **THEN** the selection count, active layout, content mode, and sort order remain unchanged

### Requirement: Single tap opens the card detail view

Tapping a gallery tile SHALL open a single-card detail view for that card. Opening detail SHALL NOT require a double tap or a long press. Each tile SHALL present an affordance indicating that it can be opened. The detail view SHALL be reachable with a keyboard and SHALL expose an accessible name for every tile.

#### Scenario: Single tap opens detail

- **WHEN** the user taps a card tile once
- **THEN** the detail view opens for that card

#### Scenario: No double-tap dependency

- **WHEN** the user taps a card tile and waits
- **THEN** the detail view opens immediately without waiting for a second tap

#### Scenario: Tile affordance is visible

- **WHEN** the gallery is displayed
- **THEN** every tile shows an indicator that it can be opened

#### Scenario: Keyboard access

- **WHEN** a keyboard user focuses a tile and activates it
- **THEN** the detail view opens for that card

### Requirement: Detail view navigates cards in print order

The detail view SHALL show one logical card at a time in the plan's print order. It SHALL support horizontal swipe to move to the previous or next card, SHALL provide previous and next controls that do not depend on swipe, and SHALL show the current card's position among the preview cards. Reaching the first or last card SHALL stop rather than wrap.

#### Scenario: Swipe moves to the next card

- **WHEN** the user swipes left on a card that is not the last card
- **THEN** the detail view shows the next card in print order

#### Scenario: Previous and next controls

- **WHEN** the user activates the next control
- **THEN** the detail view advances one card without requiring a gesture

#### Scenario: Position indicator

- **WHEN** the detail view shows the 12th of 24 cards
- **THEN** it states that position

#### Scenario: No wrapping at the ends

- **WHEN** the last card is shown and the user swipes forward
- **THEN** the detail view stays on the last card

#### Scenario: Navigation follows sort order

- **WHEN** the active sort order changes and detail is reopened
- **THEN** the detail sequence matches the new print order

### Requirement: Detail view stacks panels vertically

A multi-panel card SHALL stack its panels vertically in the detail view, each at print geometry. The detail view SHALL label each panel with its position among the card's panels. Vertical scrolling SHALL move within the card's panels, and horizontal swipe SHALL remain card navigation.

#### Scenario: Three-panel card

- **WHEN** a card with three panels is opened in detail
- **THEN** all three panels appear one below another
- **AND** they are labeled as panel 1 of 3 through panel 3 of 3

#### Scenario: Scroll stays panel-level

- **WHEN** the user scrolls vertically inside a multi-panel card
- **THEN** the panels scroll within the card's own region
- **AND** the view does not move to another card

#### Scenario: Horizontal gesture stays card-level

- **WHEN** the user swipes horizontally on a multi-panel card
- **THEN** the detail view moves to the previous or next card

### Requirement: Detail view supports inspection zoom

The detail view SHALL support pinch zoom and panning so small print can be inspected. The detail view SHALL NOT depend on double-tap zoom. Zoom state SHALL apply only to the current detail presentation and SHALL NOT affect preview density, selection, layout, content mode, or print.

#### Scenario: Pinch zooms the card

- **WHEN** the user pinches out on a card in the detail view
- **THEN** the card scales up for inspection

#### Scenario: Zoom does not leak to the print

- **WHEN** the user closes detail after zooming
- **THEN** the print document and the gallery layout are unchanged

### Requirement: Closing detail restores the gallery position

Closing the detail view SHALL return to the card gallery at the same scroll position and SHALL keep the selection, layout, content mode, sort order, and view mode unchanged. The detail view SHALL provide an explicit close control and SHALL close on the Escape key.

#### Scenario: Return to the same position

- **WHEN** the user opens a card from a scrolled gallery position and closes it
- **THEN** the gallery is still scrolled to that position

#### Scenario: Explicit close control

- **WHEN** the detail view is open
- **THEN** a close control is visible

#### Scenario: Closing changes no workspace state

- **WHEN** the user closes the detail view
- **THEN** no card is added or removed from the selection
- **AND** the active layout and content mode are unchanged

### Requirement: Mobile preview surfaces stay out of print

The card gallery, detail view, and mobile preview controls SHALL be screen-only. The print document SHALL contain only card pages in the active layout, and mobile browsing state SHALL NOT alter printed content or geometry.

#### Scenario: Print from the gallery

- **WHEN** the user prints while the card gallery is the active preview
- **THEN** the print document contains the normal card pages
- **AND** no gallery tile or detail chrome is printed

#### Scenario: Print while detail is open

- **WHEN** the user prints from an open detail view
- **THEN** the print document contains the full active layout in print order
