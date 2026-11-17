# card-back-inspection Specification

## Purpose

Lets someone inspect either side of a card in the mobile gallery and detail view without changing the print layout, so looking at a back never alters what the printer will produce.

## Requirements

### Requirement: Inspection side is independent of print layout

The card gallery and the card detail view SHALL show the side chosen for inspection, regardless of the active layout. Changing the inspection side SHALL NOT change the active layout, the page preview, the Pages view, the print document, or Debug Print.

#### Scenario: Backs while printing fronts

- **WHEN** the layout is Fronts and the user chooses to inspect backs
- **THEN** the gallery shows card backs
- **AND** the active layout still reads Fronts
- **AND** the next print document contains front pages only

#### Scenario: Fronts while printing backs

- **WHEN** the layout is Backs and the user chooses to inspect fronts
- **THEN** the gallery shows card fronts
- **AND** the next print document contains back pages only

### Requirement: Gallery offers both sides of every sheet

In Cards view the gallery SHALL offer a side toggle with exactly Fronts and Backs. The gallery SHALL show one tile per logical card for the chosen side, SHALL keep the print order, and SHALL label each group with the side actually displayed.

#### Scenario: Toggle shows backs

- **WHEN** the user selects Backs in the gallery side toggle
- **THEN** every group heading names Backs
- **AND** every tile shows a back card

#### Scenario: Headings describe the display

- **WHEN** the layout is Fronts and the gallery is showing backs
- **THEN** no heading claims Fronts

#### Scenario: Order is unchanged by side

- **WHEN** the user switches the gallery side
- **THEN** tiles keep the same card order and sheet grouping

#### Scenario: Toggle is confined to Cards view

- **WHEN** the preview is in Pages view
- **THEN** the gallery side toggle is not offered
- **AND** the Pages view continues to follow the print layout

### Requirement: Detail view offers both sides of a card

The detail view SHALL offer a flip control whenever the opened card has a back, under every layout. It SHALL open on the side the gallery is displaying. Flipping SHALL NOT change the card's position in the sequence, and SHALL NOT change any print output.

#### Scenario: Flip under Fronts

- **WHEN** the layout is Fronts and the user opens a card and flips it
- **THEN** the same card's back is shown
- **AND** the position indicator is unchanged

#### Scenario: Flip under Both

- **WHEN** the layout is Both and the user flips the open card
- **THEN** the other side of that card is shown

#### Scenario: Opens on the gallery side

- **WHEN** the gallery is showing backs and the user opens a card
- **THEN** the detail view opens on the back

### Requirement: Side availability comes from rendered cards, not the print plan

A card SHALL be treated as having both sides whenever its front and back cards have been prepared for display. Availability SHALL NOT be inferred from which sides appear in the print plan. A multi-panel card's panels SHALL remain one logical card across both sides.

#### Scenario: Availability under Fronts

- **WHEN** the layout is Fronts and a single-panel card is opened
- **THEN** the flip control is offered

#### Scenario: Multi-panel card across sides

- **WHEN** a three-panel card places its last panel on the back
- **THEN** the gallery shows the card once
- **AND** flipping in detail reaches the continuation panel

### Requirement: Inspection state is ephemeral

The inspection side SHALL be screen state only. It SHALL reset to the side implied by the layout when the layout changes, and SHALL reset with the layout when the preview closes. It SHALL NOT appear in saved cardbooks or in the print document.

#### Scenario: Layout change resets inspection

- **WHEN** the gallery is showing fronts and the user changes the layout to Backs
- **THEN** the gallery shows backs
- **AND** the detail view opens on the back for the next card it shows

#### Scenario: Closing the preview resets

- **WHEN** the selection becomes empty
- **THEN** the inspection side resets with the layout to Fronts

### Requirement: Inspection never becomes a second print preview

The page preview and the Pages view SHALL remain the only surfaces that certify print order, page sides, and duplex pairing. The gallery and detail view MAY show either side of a card, but SHALL remain derived from the same page plan as the print document.

#### Scenario: Page verification still follows print

- **WHEN** the layout is Both and the user inspects backs in the gallery
- **THEN** the page preview still reads front, back, front, back

#### Scenario: Print contains both sides as before

- **WHEN** the user prints under the Both layout after inspecting backs
- **THEN** the print document contains every front and back page in print order
