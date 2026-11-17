# Spec Delta

## REMOVED Requirements

### Requirement: Detail view follows the active layout

**Reason**: The detail view no longer takes its side from the print layout as a constraint; the print layout now only sets the default inspection side, and the flip is offered whenever a back exists.

**Migration**: Use `card-back-inspection` / `Detail view offers both sides of a card`, which states the default side, the flip under every layout, and the guarantee that flipping never changes what is printed.

## MODIFIED Requirements

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
