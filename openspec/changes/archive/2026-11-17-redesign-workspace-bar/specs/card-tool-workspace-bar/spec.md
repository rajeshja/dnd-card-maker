# Spec Delta

## Purpose

Defines the single-row workspace chrome that hosts the tool's identity, selection status, book actions, and presentation controls, and the guarantees that keep every one of those reachable at any supported viewport width.

## ADDED Requirements

### Requirement: One workspace bar replaces both chrome rows

The card tool SHALL render exactly one chrome row above the sidebar and the preview. That row SHALL span the full width, SHALL contain no wrapping, and SHALL replace the former topbar and the former selection bar. The selection status SHALL NOT occupy a second row at any width.

#### Scenario: A single chrome row

- **WHEN** a card tool has finished loading at any supported width
- **THEN** exactly one chrome row is present above the sidebar and preview
- **AND** no separate selection bar exists

#### Scenario: Preview space reclaimed

- **WHEN** the workspace bar replaces the previous two rows
- **THEN** the preview area is taller than before by the height of the removed row

#### Scenario: Short viewports

- **WHEN** the viewport is 768px tall
- **THEN** the bar keeps its single-row height
- **AND** no height-specific compact chrome rule is applied

### Requirement: Brand mark is visible at every width

The workspace chrome SHALL show a card-pack brand mark at every supported width, including phone. The mark SHALL NOT be hidden, collapsed into an overflow menu, or truncated. On phone the mark SHALL appear in the masthead strip above the preview.

#### Scenario: Wide viewport

- **WHEN** the viewport is 1920x1080
- **THEN** the brand mark appears in the workspace bar

#### Scenario: Narrow viewport

- **WHEN** the viewport is 600x800
- **THEN** the brand mark appears in the workspace bar
- **AND** it is not replaced by an overflow control

#### Scenario: Phone

- **WHEN** the viewport is 390x844
- **THEN** the brand mark appears in the masthead strip above the preview

### Requirement: Page title is shown where it does not displace controls

The page title SHALL appear beside the brand mark when the bar has room for it, SHALL be suppressed only where it would displace a control, and SHALL always be present in the phone masthead. The brand mark SHALL remain visible when the title is suppressed. A title too long for its space SHALL truncate rather than push the mark out.

#### Scenario: Desktop shows the title

- **WHEN** the viewport is 1366x768 with cards selected
- **THEN** the page title is visible in the workspace bar

#### Scenario: Compact desktop keeps the title

- **WHEN** the viewport is 1024x768
- **THEN** the page title is visible in the workspace bar
- **AND** presentation controls are shown in their compact form

#### Scenario: Tablet suppresses the title

- **WHEN** the viewport is 768x1024
- **THEN** the page title is not shown in the workspace bar
- **AND** the brand mark is still shown

#### Scenario: Phone masthead shows the title

- **WHEN** the viewport is 390x844
- **THEN** the masthead strip shows the brand mark and the page title
- **AND** the title truncates at 320px width rather than moving the mark

### Requirement: Selection status is the selection manager trigger

The workspace bar SHALL show the selected-card count, SHALL update it whenever the selection changes, and SHALL open the selection manager when the count is activated. No separate Manage control SHALL exist in the chrome. The bar SHALL NOT render one chip or row per selected card.

#### Scenario: Count opens the manager

- **WHEN** 24 cards are selected and the user activates the count
- **THEN** the selection manager opens showing 24 cards

#### Scenario: No duplicate Manage control

- **WHEN** the chrome is rendered
- **THEN** no standalone Manage control is present

#### Scenario: Empty selection

- **WHEN** the selection becomes empty
- **THEN** the count reads zero
- **AND** the presentation controls are hidden

### Requirement: Presentation controls are dropdowns

The workspace bar SHALL expose the content mode, card layout, and preview density as three dropdown controls. A closed dropdown SHALL show the active value. An open dropdown SHALL list every option of that group as an icon and its full name, and SHALL mark exactly one option as the active one. Choosing an option SHALL apply it and close the dropdown.

#### Scenario: Closed control shows the active value

- **WHEN** the layout is Backs and the layout dropdown is closed
- **THEN** the control shows the Backs icon and the name Backs

#### Scenario: Open control lists full names

- **WHEN** the layout dropdown is opened in its icon-only form
- **THEN** all three options are listed
- **AND** each option shows its icon together with its full name

#### Scenario: Choosing an option applies it

- **WHEN** the user chooses Both from the layout dropdown
- **THEN** the preview and the next print document use the Both layout
- **AND** the closed control shows Both

### Requirement: Compact form preserves meaning

When the bar must compact, each dropdown SHALL replace its label with an icon while keeping its active state visible, and each icon-only button SHALL carry an accessible name and a tooltip that names the control and its active value.

#### Scenario: Icon-only dropdown

- **WHEN** the viewport is 768x1024
- **THEN** each presentation dropdown shows an icon without a text label
- **AND** its accessible name includes the control name and the active value

#### Scenario: Tooltip on focus

- **WHEN** a keyboard user focuses an icon-only control
- **THEN** its tooltip is shown

### Requirement: Every toolbar action stays reachable at every supported width

The workspace bar SHALL NOT clip, hide, or require horizontal scrolling to reach any control that is available at a wider width. The brand mark, the selection count, and the Print action SHALL remain present at every width where the bar is shown. When space is insufficient, the bar SHALL shed elements in this order: the page title, control labels, then the Debug Print label.

#### Scenario: Desktop composition

- **WHEN** the viewport is 1366x768 with cards selected
- **THEN** the brand, title, count, Save, Load, all three dropdowns, Print, and Debug Print are fully visible

#### Scenario: No clipped control

- **WHEN** the viewport width is reduced from 1366px to 600px with cards selected
- **THEN** no control is partly clipped at any point
- **AND** Save, Load, Print, and Debug Print remain reachable

#### Scenario: Debug Print survives compaction

- **WHEN** the viewport is 600px wide
- **THEN** the Debug Print action is present and activatable

### Requirement: Dropdown menus are not clipped by the shell

An open dropdown menu SHALL render above the workspace rather than inside a clipped container, and SHALL remain fully visible at the narrowest supported width. It SHALL close on Escape and return focus to its trigger.

#### Scenario: Menu escapes the shell

- **WHEN** the user opens a presentation dropdown at 600px width
- **THEN** the full menu is visible
- **AND** no menu item is clipped by the workspace boundary

#### Scenario: Keyboard dismissal

- **WHEN** the menu is open and the user presses Escape
- **THEN** the menu closes
- **AND** focus returns to the control that opened it

### Requirement: Phone uses a masthead strip and the existing action surfaces

Below the phone breakpoint, the workspace bar SHALL be replaced by a masthead strip containing only the brand mark and the page title. The bottom action bar and its sheets SHALL remain the only action surfaces on phone, and each control that the bar holds on wider widths SHALL have exactly one interactive copy inside those sheets.

#### Scenario: Masthead replaces the bar

- **WHEN** the viewport is 390x844
- **THEN** the masthead strip is shown above the preview
- **AND** the workspace bar is not shown

#### Scenario: No duplicate control

- **WHEN** the Print sheet is open on phone
- **THEN** each presentation control appears exactly once in the document
- **AND** the topbar action group is not also rendered in the masthead

### Requirement: Workspace chrome is screen-only

The workspace bar, masthead strip, dropdown menus, and mobile action bar SHALL NOT appear in the print document or in Debug Print.

#### Scenario: Printing

- **WHEN** the user prints under any layout
- **THEN** the print document contains card pages only
- **AND** no bar, masthead, menu, or bottom action bar is printed

#### Scenario: Debug Print

- **WHEN** the user opens Debug Print
- **THEN** the workspace chrome is hidden
- **AND** only print-geometry pages are shown
