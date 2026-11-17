# Proposal

## Why

Saved cardbooks are write-only. `Save` puts a named book into localStorage, but nothing in the tool ever reads one back: there is no Load control, no book list, and no way to restore a selection after a reload. The behaviour was specified in `docs/card-tool-cardbooks.md` — a Load dialog offering `Add` and `Replace`, plus a typed `5etools-cardbook-v1` format — but that contract has never existed in code, and the current `Save` writes a different, untyped shape through a native `prompt()`. Every saved book is currently unreachable data.

## What Changes

- Add a **Load** dialog that lists the saved cardbooks for the current entity type and offers `Add` and `Replace` for each.
  - `Add` merges the book into the current selection, deduplicating by `${type}|${name}|${source}`.
  - `Replace` clears the current selection and then inserts the book's matching cards.
- Report references that no longer match a loaded entity, because a book can be saved while a source file is available and opened when it is not.
- Replace the `Save` prompt and its `alert()` with a themed **Save** dialog in the same component, including an overwrite warning when the name already exists.
- Write books in the documented **typed** shape (`{type, name, source}`) from now on, and read the legacy `{name, source}` shape on the spell page with explicit compatibility logic.
- Show a **Load** control beside Save in the workspace chrome.
- Correct `docs/card-tool-cardbooks.md` so it stops promising JSON import/export, which is explicitly out of scope.

## Capabilities

### New Capabilities

- `cardbook-persistence`: naming and saving a selection to browser storage, listing saved books, loading one by adding or replacing, resolving references against the loaded entity set, and reporting unmatched references under a stable typed storage format.

## Impact

- `js/card-tool.js`: save and load flows, book listing, matching and dedupe, dialogs, focus handling, replacement of `prompt()` and `alert()`.
- `js/card-tool-cardbooks.js` (new): pure helpers for the stored format — parse, validate, typed/legacy normalisation, dedupe, and unmatched resolution.
- `spell-cards.html`, `item-cards.html`, `beast-cards.html`: save and load dialog markup and the Load control.
- `css/card-tool.css`: dialog styling reused from the existing manager and sheet patterns.
- `test/cards/CardbookPersistence.test.js` (new): format validation, legacy compatibility, dedupe, unmatched reporting, and name handling.
- `docs/card-tool-cardbooks.md`, `docs/card-tool-data-and-state.md`, `docs/card-tool-architecture.md`: the real storage contract, the dialog behaviour, and the removal of the import/export promise.
- Sequencing: the Load control belongs in the workspace bar's book zone from `redesign-workspace-bar`. If this change lands first, the control goes beside Save in the current topbar, which widens the already-overflowing action cluster; the bar change is therefore the recommended predecessor.
- No files under `5etools/` are touched, and no network, file-system, or cross-device storage is involved.
