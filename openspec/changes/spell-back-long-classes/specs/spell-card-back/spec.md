# Spec Delta

## ADDED Requirements

### Requirement: Class list length changes only the bottom space

The back's top half SHALL hold one position for every spell: the top ornament, kicker, title hero at 24 mm with its school art and indicators, the divider, and the start of the meta block. The Classes value SHALL have clear space above and below its text. The bottom ornament SHALL stay anchored to the bottom of the card and remain fully visible when the class list occupies one, two, or three lines.

#### Scenario: Uniform top half

- **WHEN** backs whose class lists wrap to one, two, and three lines are compared
- **THEN** the top ornament, hero height, divider, and meta block start are at the same position on all three
- **AND** the school art is not resized

#### Scenario: Three-line list keeps the ornament

- **WHEN** a spell's class list wraps to three lines
- **THEN** the bottom ornament is fully visible at the same position as on a one-line back

#### Scenario: Wrapped list gets vertical padding

- **WHEN** the class list wraps to three or more lines
- **THEN** there is clear space above and below the class text inside its row
- **AND** no class name touches the row borders

#### Scenario: Four-line list is the exception

- **WHEN** the class list wraps to four lines
- **THEN** every class name prints
- **AND** the top half stays in its fixed position
- **AND** the bottom ornament may move below the card's content box

#### Scenario: Five-line list is out of scope

- **WHEN** a class list wraps to five lines
- **THEN** it is still printed without truncation
- **AND** the final line or the bottom ornament may be clipped

## MODIFIED Requirements

### Requirement: Source code is always visible

The spell source SHALL appear as a short code at the top-right of the back, inside the card border and clear of the top ornament. It SHALL be rendered as text independent of any ornament image, and SHALL remain visible at that position when the top or bottom ornament is absent, fails to load, or is hidden, and when the class list wraps or the meta block overflows.

#### Scenario: Ornament unavailable

- **WHEN** the top or bottom ornament image is missing or fails to load
- **THEN** the source code is still visible at the top-right

#### Scenario: Content overflow

- **WHEN** the class list makes the meta block overflow
- **THEN** the source code is still visible at the top-right
- **AND** no wrapped class name covers it or pushes it

#### Scenario: Longest source code

- **WHEN** the back uses the longest loaded source code
- **THEN** the stamp stays inside the card border
- **AND** it does not overlap the top ornament

#### Scenario: Source code prints

- **WHEN** the back is printed or opened in Debug Print
- **THEN** the source code appears as text in the output
