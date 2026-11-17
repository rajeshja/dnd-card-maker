# Spec Delta

## Purpose

Defines what a printed spell card's back face says: the Level/School/Classes meta rows, how a spell's classes are resolved and formatted, the concentration and ritual indicator overlay, and the always-visible source code stamp.

## ADDED Requirements

### Requirement: Meta rows show Level, School, and Classes

The spell card back SHALL show three meta rows in the order Level, School, Classes. It SHALL NOT show the spell source as a meta row. The Level row SHALL use the spell's ordinal level, the School row its mapped school name, and the Classes row the resolved class list.

#### Scenario: Standard back

- **WHEN** a spell with a class list is rendered on its back
- **THEN** the meta rows read Level, then School, then Classes
- **AND** no meta row is labeled Source

#### Scenario: Cantrip level

- **WHEN** a level 0 spell's back is rendered
- **THEN** the Level row reads `Cantrip`

### Requirement: Base classes take precedence over subclass grants

The class list SHALL use the spell's base class names when it has at least one. Only when the spell has no base class SHALL the list use the classes that own its subclass grants. A subclass grant SHALL be shown as a class name with its subclass in parentheses; a base class SHALL be shown without a parenthetical.

#### Scenario: Spell with base classes

- **WHEN** the spell has base classes Sorcerer and Wizard
- **THEN** the Classes row reads `Sorcerer, Wizard`
- **AND** no subclass appears

#### Scenario: Spell with only subclass grants

- **WHEN** the spell has no base class but is granted by the Chronurgy and Graviturgy subclasses of Wizard
- **THEN** the Classes row reads `Wizard (Chronurgy, Graviturgy)`

#### Scenario: Grants from two owning classes

- **WHEN** the spell is granted by the Death subclass of Cleric and by the Chronurgy and Graviturgy subclasses of Wizard
- **THEN** the Classes row reads `Cleric (Death), Wizard (Chronurgy, Graviturgy)`

#### Scenario: Base classes suppress unrelated grants

- **WHEN** a spell has base classes and also appears on a subclass spell list of another class
- **THEN** the Classes row shows only the base classes

### Requirement: Class names are sorted, unique, and short

The class list SHALL contain each class once, sorted alphabetically by class name. Multiple subclasses of the same class SHALL be grouped under that class, de-duplicated, and sorted alphabetically using their short names.

#### Scenario: Edition duplicates collapse

- **WHEN** the same subclass is granted through both the 2014 and 2024 class entries
- **THEN** it appears once in the Classes row

#### Scenario: Alphabetical order

- **WHEN** the spell's data lists classes in a different order
- **THEN** the Classes row is sorted alphabetically
- **AND** the order does not change with the spell's source book

#### Scenario: Grouped subclasses

- **WHEN** a class grants the spell through two subclasses
- **THEN** both names appear inside one pair of parentheses for that class
- **AND** the class name is not repeated

### Requirement: Class label reflects the class count

The Classes row label SHALL read `Class` when the resolved list contains exactly one entry and `Classes` otherwise. When the list is empty, the row value SHALL read an em dash.

#### Scenario: Single class

- **WHEN** the resolved list is `Warlock`
- **THEN** the row is labeled `Class`

#### Scenario: Several classes

- **WHEN** the resolved list contains two or more entries
- **THEN** the row is labeled `Classes`

#### Scenario: No class or subclass grant

- **WHEN** the spell has no base class and no subclass grant
- **THEN** the row is labeled `Classes`
- **AND** its value is `—`

### Requirement: Class filter chips keep bare class names

The Class filter SHALL continue to offer bare class names. A class chip SHALL match the resolved class names for spells that have a base class, and the owning class of the subclass grants for spells that have none. Subclass access SHALL NOT add a spell to a class chip when the spell already has base classes.

#### Scenario: Subclass-only spell is reachable by its class

- **WHEN** the user selects the Wizard class chip
- **THEN** a spell granted only by the Chronurgy and Graviturgy Wizard subclasses is included
- **AND** the chip still reads `Wizard`

#### Scenario: Two owning classes

- **WHEN** a subclass-only spell is granted through Cleric and Wizard subclasses
- **THEN** it is included under both the Cleric and Wizard chips

#### Scenario: Base-list spell is not widened

- **WHEN** a spell with base classes Sorcerer and Wizard also appears on a Cleric subclass list
- **THEN** it is not included under the Cleric chip

#### Scenario: No grant stays unlisted

- **WHEN** a spell has neither a base class nor a subclass grant
- **THEN** it appears under no class chip

### Requirement: The class list is never truncated

The class list SHALL wrap onto as many lines as it needs and SHALL NOT be truncated, clamped, abbreviated, or ellipsized. Content that exceeds the available space SHALL be allowed to overflow rather than be shortened or fitted to the card.

#### Scenario: Long list stays complete

- **WHEN** a spell's class list is the longest in the loaded data
- **THEN** every class name is printed
- **AND** no ellipsis, abbreviation, or hidden remainder appears

#### Scenario: Wrapping preserves all names

- **WHEN** the class list wraps onto multiple lines
- **THEN** all names are present in alphabetical order

### Requirement: Indicators overlay the school art

The concentration and ritual indicators SHALL render inside the hero above the school background art. They SHALL NOT add a row to, or change the position of, the meta block.

#### Scenario: Indicator card keeps meta position

- **WHEN** a back with a concentration or ritual indicator is compared with one without
- **THEN** the meta rows begin at the same position on both

#### Scenario: Both indicators

- **WHEN** a spell is both concentration and ritual
- **THEN** both indicators appear together in the hero

#### Scenario: Indicators print

- **WHEN** the back is printed or opened in Debug Print
- **THEN** the indicators appear over the school art

### Requirement: Source code is always visible

The spell source SHALL appear as a short code at the bottom-right of the back. It SHALL be rendered as text independent of any ornament image, and SHALL remain visible when the bottom ornament is absent, fails to load, or is hidden.

#### Scenario: Ornament unavailable

- **WHEN** the bottom ornament image is missing or fails to load
- **THEN** the source code is still visible at the bottom-right

#### Scenario: Content overflow

- **WHEN** the class list makes the meta block overflow
- **THEN** the source code is still visible at the bottom-right

#### Scenario: Source code prints

- **WHEN** the back is printed or opened in Debug Print
- **THEN** the source code appears as text in the output
