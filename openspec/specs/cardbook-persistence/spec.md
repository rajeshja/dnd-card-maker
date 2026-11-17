# cardbook-persistence Specification

## Purpose

Lets a user keep named selections in browser storage, reopen them later, and decide whether a saved book adds to or replaces the current selection, without any server, file, or cross-device transfer.

## Requirements

### Requirement: A selection can be saved under a name

The tool SHALL save the current selection as a named cardbook in browser storage, SHALL list it afterwards, and SHALL warn before overwriting an existing name.

#### Scenario: Saving a selection

- **WHEN** 12 cards are selected and the user saves the book as "Curse of Strahd"
- **THEN** the book is stored under that name
- **AND** it contains exactly those 12 card references

#### Scenario: Overwriting an existing name

- **WHEN** the user saves a book under a name that already exists
- **THEN** the tool asks for confirmation before replacing it
- **AND** declining leaves the stored book unchanged

#### Scenario: Empty selection

- **WHEN** no card is selected and the user opens Save
- **THEN** the tool explains that at least one card must be selected
- **AND** nothing is stored

### Requirement: Saved books can be listed and loaded

The tool SHALL list the saved books for the current entity type, SHALL show each book's name and card count, and SHALL offer exactly two load actions per book: Add and Replace.

#### Scenario: Listing

- **WHEN** the user opens Load
- **THEN** every saved book for the current entity type is listed with its name and card count

#### Scenario: No saved books

- **WHEN** no book has been saved for the current entity type
- **THEN** the dialog states that there is nothing to load
- **AND** offers no load actions

#### Scenario: Books are scoped by entity type

- **WHEN** a spell book exists and the user opens Load on the item page
- **THEN** the spell book is not listed

### Requirement: Add merges and Replace substitutes

`Add` SHALL insert the book's matching cards without removing any current selection and without duplicating a card already selected. `Replace` SHALL clear the selection first and then insert the book's matching cards. Both SHALL preserve the active sort order in the result and SHALL NOT change the active layout.

#### Scenario: Add keeps the current selection

- **WHEN** 5 cards are selected and the user loads a book with Add
- **THEN** the selection contains the original 5 plus the book's cards
- **AND** a card present in both appears once

#### Scenario: Replace discards the current selection

- **WHEN** 5 cards are selected and the user loads a book with Replace
- **THEN** the selection contains only the book's matching cards

#### Scenario: Order follows the active sort

- **WHEN** a book is loaded with any sort order active
- **THEN** the resulting selection is ordered by that sort

#### Scenario: Identity is the card reference

- **WHEN** the same card exists in the selection and in the book
- **THEN** it is identified by `${type}|${name}|${source}` for deduplication

### Requirement: Unmatched references are reported

Loading SHALL resolve references only against the entity set currently loaded. References that do not resolve SHALL NOT be inserted, SHALL be counted, and SHALL be reported to the user after the load completes.

#### Scenario: Partial match

- **WHEN** a book contains 20 references and 3 do not exist in the loaded entity set
- **THEN** 17 cards are inserted
- **AND** the tool reports that 3 could not be found

#### Scenario: No matches

- **WHEN** none of a book's references resolve
- **THEN** the selection is unchanged for Add
- **AND** the tool reports that no cards were found

### Requirement: Stored books use a typed format with legacy compatibility

Stored books SHALL record each card as a typed reference carrying `type`, `name`, and `source`. The tool SHALL also read the legacy untyped `{name, source}` shape on the spell page and treat those references as spell references. It SHALL NOT silently reinterpret legacy data as another entity type.

#### Scenario: Writing the typed format

- **WHEN** a book is saved on any page
- **THEN** every stored reference includes its entity type, name, and source

#### Scenario: Reading a legacy spell book

- **WHEN** a stored book contains only `{name, source}` references on the spell page
- **THEN** the book is listed and loads normally as spell references

#### Scenario: Legacy data on another page

- **WHEN** a stored book contains only `{name, source}` references on the item or beast page
- **THEN** the tool does not guess an entity type for it
- **AND** reports that the book cannot be read

### Requirement: Unreadable stored data does not break the tool

If a stored entry is not valid JSON, lacks a usable name, or lacks a reference list, the tool SHALL keep the remaining books usable and SHALL report the unreadable entry without throwing or clearing storage.

#### Scenario: Corrupt entry among valid books

- **WHEN** one stored entry is corrupt and others are valid
- **THEN** the valid books are still listed and loadable
- **AND** the corrupt entry is reported

#### Scenario: Malformed reference list

- **WHEN** a book stores a reference list containing non-object entries
- **THEN** those entries are skipped
- **AND** the remaining references still load

### Requirement: Saved books persist locally only

Saved books SHALL persist in browser storage across reloads and SHALL remain on the current device only. The tool SHALL NOT upload, download, import from a file, or export to a file.

#### Scenario: Survives a reload

- **WHEN** a book is saved and the page is reloaded
- **THEN** the book is still listed and loadable

#### Scenario: No file transfer

- **WHEN** the user opens Save or Load
- **THEN** no file picker, download, or network request is offered or made for cardbooks

### Requirement: Cardbook actions live in the workspace chrome

The tool SHALL expose Save and Load as controls in the workspace chrome, and both SHALL open a dialog that is operable by keyboard alone, traps focus while open, closes on Escape, and returns focus to the control that opened it.

#### Scenario: Both controls present

- **WHEN** the tool has loaded
- **THEN** a Save control and a Load control are present in the workspace chrome

#### Scenario: Keyboard operation

- **WHEN** a keyboard user opens Load, chooses a book, and activates Add
- **THEN** the load completes without a pointer
- **AND** focus returns to the Load control
