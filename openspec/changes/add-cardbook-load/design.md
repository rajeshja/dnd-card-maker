# Design

## Context

See `proposal.md` for motivation. The constraints:

- `saveBook()` is the only cardbook code: it prompts for a name, reads `card-tool-${type}-books`, writes `{ "<name>": [{name, source}] }`, and alerts. There is no read path anywhere.
- `docs/card-tool-cardbooks.md` documents a Load dialog with `Add` and `Replace`, a `5etools-cardbook-v1` envelope, a legacy `5etools-spellbook-v1` format, and an older `spell-cards-spellbooks` key. None of it is implemented, so the doc currently describes a contract the code contradicts.
- Selection is a `Map` keyed by `${type}|${name}|${source}`; `selectedEntities()` sorts at render time from `config.sort`, so a loaded book inherits the active sort with no extra work. `updateSelection()` re-renders the list, the bar count, the preview, and the gallery.
- `openManager()` already establishes the dialog pattern this change reuses: capture `document.activeElement` as the return target, `showModal()`, move focus inside, close on Escape, return focus on close.
- Unit tests run in Node with no DOM, so the storage format, matching, and dedupe belong in a pure module; dialog wiring is verified in the browser.

## Goals / Non-Goals

**Goals:**

- Every saved book readable, with Add and Replace semantics that never lose work silently.
- One stored shape that a future exporter can serialize without a migration.
- Legacy spell books readable without guessing entity types.
- A themed Save flow that replaces `prompt()` and `alert()`.

**Non-Goals:**

- File import, file export, sharing, sync, or any server call.
- Deleting or renaming books, and any dedicated "manage cardbooks" surface.
- Changing selection identity, sort behavior, print order, or the cardbook key naming.
- Reading legacy books as anything other than spells.

## Decisions

### 1. One envelope per stored book, keyed by name

```
localStorage["card-tool-spell-books"] = {
  "Curse of Strahd": {
    "format": "5etools-cardbook-v1",
    "name": "Curse of Strahd",
    "cards": [{"type": "spell", "name": "Magic Missile", "source": "PHB"}]
  }
}
```

The value is the documented portable envelope, stored per book. The key duplicates the name so listing never has to parse a value to show a label. A future exporter writes the envelope as a file unchanged, which is the whole point of adopting the typed shape now even though files are out of scope.

**Alternative considered:** keep the current bare array and add a type field. Rejected: it invents a third shape, and the documented envelope already exists.

**Alternative considered:** one flat list of books with ids. Rejected: it changes the storage key and forces a migration for no benefit.

### 2. Legacy data is read explicitly, never coerced

```
raw value is an envelope            -> accept if format is known and cards validate
raw value is a bare array           -> spell page: treat entries as spell references
                                       other pages: report unreadable
raw value is anything else          -> report unreadable, leave it alone
```

The legacy key `spell-cards-spellbooks` is also read on the spell page. When the same name exists in both keys, the modern key wins and the conflict is not surfaced. Storage is never rewritten by a read, so a failed experiment cannot destroy the old copy.

This is the explicit compatibility logic the project's invariants require: old spell-only data is never silently treated as a broader schema.

### 3. Matching is a lookup, and unmatched refs are counted

Resolution builds a map of the loaded entity set by `${type}|${name}|${source}` and looks each reference up. Anything not found is an unmatched reference, reported as a count after the load. Nothing is fuzzy-matched by name alone, because a name can exist in several sources.

### 4. Add and Replace mutate the selection map once

```
Add:      for each resolved card, state.selected.set(id, entity)
Replace:  state.selected.clear(), then Add
then      updateSelection()
```

`updateSelection()` already re-renders everything that depends on the selection, so there is no second refresh path. Sort order comes from `selectedEntities()` at render, so a loaded book is ordered by the active sort without touching it.

### 5. Replace confirms only when it would discard cards

`Replace` is explicit, but replacing a 200-card hand-picked selection with a 3-card book by a mis-tap is worth preventing. The confirmation appears only when the current selection contains a card that is not in the book, and uses the existing two-step button pattern already used by `Clear all` (label changes to `Confirm replace`, resets on close or on a different row). Replace into an empty or fully-contained selection proceeds on the first activation.

**Alternative considered:** always confirm. Rejected: it makes the common `Replace` path two clicks every time.

### 6. Save becomes a dialog, and status text replaces `alert()`

The Save dialog holds a name field prefilled with the entity collection default, shows an inline note when the name already exists, and disables the action for an empty or whitespace-only name. Result and error messages render as inline status text inside the dialog (for example a storage quota failure) rather than an `alert()`, which also removes the last blocking native dialog from the cardbook flow.

### 7. Both dialogs follow the manager pattern

`<dialog>` with `showModal()`, a focus target on open (name field or the book list), focus capture and return, Escape via the platform `cancel`, and a close button. The list is a plain list of rows rather than a table, so it degrades on phone. Reuse the manager/sheet CSS already present.

### 8. Format handling lives in a pure module

`js/card-tool-cardbooks.js` exports the DOM-free pieces so they are testable in the existing Node setup:

```
parseBook(rawText, {pageType})   -> {ok, book} | {ok:false, reason}
normalizeBook(value, {pageType}) -> typed envelope | null
resolveCards(book, lookup)       -> {resolved, unmatched}
mergeSelectionRefs(current, resolved) -> new refs, deduped
```

`card-tool.js` keeps storage access, dialog state, and rendering.

### 9. The Load control joins the book zone

Both Save and Load are icon-plus-label controls in the workspace bar's book zone, or icon-only in the compact form. If `redesign-workspace-bar` has not landed, they sit beside each other in the existing topbar and the bar's overflow is accepted as a known intermediate state — which is another reason the bar change is the recommended predecessor.

## Risks / Trade-offs

- **[A user's existing saved books use the legacy shape]** → Read both; never rewrite on read; test the legacy path on the spell page and its rejection on other pages.
- **[Replace destroys a large selection]** → Conditional confirmation on discard only.
- **[localStorage quota or disabled storage]** → Catch write failures and report inline; reads treat a failed `getItem` the same as empty.
- **[A corrupt entry could hide every book]** → Validation is per book; one bad entry is reported while the rest list normally.
- **[Books reference sources not loaded on this page]** → Unmatched counting is the specified outcome, surfaced with a count rather than silently dropping cards.
- **[The doc currently promises import/export]** → Correct the doc in this change so the next reader implements the real contract.
- **[Duplicate entry points if the bar change lands later]** → The control set is Save plus Load; no third surface is introduced.

## Migration Plan

1. Add `js/card-tool-cardbooks.js` with the pure parse/normalize/resolve/dedupe helpers and their tests.
2. Replace `saveBook()` with the Save dialog writing the typed envelope, leaving the legacy read path for step 3.
3. Add the Load dialog, listing modern and legacy keys, with Add and Replace.
4. Add unmatched reporting and the conditional replace confirmation.
5. Add the Load control to the chrome and wire focus return.
6. Correct `docs/card-tool-cardbooks.md`, update the architecture and data/state docs, and run the manual checks.

Rollback is a normal revert. Old books remain readable because reads never rewrite storage.

## Validation Matrix

| Case | Expected |
|---|---|
| Save 12 cards, reload, Load | book listed with count 12; Add restores exactly those cards |
| Add into a partially overlapping selection | union, no duplicates, active sort preserved |
| Replace over a 200-card selection from a small book | confirmation required; accepting leaves only the book's cards |
| Replace into an empty selection | no confirmation |
| Legacy bare-array book on the spell page | listed and loadable |
| Legacy bare-array book on the item page | reported unreadable; other books still list |
| Book referencing an unloaded source | resolved cards load; unmatched count reported |
| Corrupt JSON in one entry | other books usable; corrupt entry reported |
| Empty selection + Save | explained, nothing stored |
| Existing name + Save | overwrite warning; declining leaves the book intact |
| Keyboard only | open Load, choose a book, Add, focus returns to Load |
| Any | no file picker, download, or network request |

## Open Questions

None blocking. Deferred deliberately:

- Deleting and renaming books is out of scope; a follow-up "manage cardbooks" surface can own it.
- Whether to write an envelope version bump for mixed-entity books is unnecessary today because storage is per entity type.
