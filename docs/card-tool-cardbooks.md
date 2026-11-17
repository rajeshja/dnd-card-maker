# Card Tool: Cardbooks

## Local Storage

A cardbook is a named selection kept in browser storage. Each entity type has its own key:

| Page | Key |
|---|---|
| Spells | `card-tool-spell-books` |
| Items | `card-tool-item-books` |
| Beasts | `card-tool-beast-books` |

Every key holds one JSON object whose properties are book names. Each value is a typed `5etools-cardbook-v1` envelope:

```json
{
  "Curse of Strahd": {
    "format": "5etools-cardbook-v1",
    "name": "Curse of Strahd",
    "cards": [
      {"type": "spell", "name": "Magic Missile", "source": "PHB"},
      {"type": "spell", "name": "Shield", "source": "PHB"}
    ]
  }
}
```

The stored card list carries the selection identity, `${type}|${name}|${source}`. The object key repeats the book name so the Load dialog can list a label without parsing every value. Books are scoped by entity type: the spell page never shows item books and the item page never shows spell books.

Storage is the only persistence. Cardbooks survive a reload on the same device, and nothing is uploaded, downloaded, imported from a file, or exported to a file. There is no server call and no cross-device sync.

## Legacy Compatibility

Older saved data is read explicitly, never reinterpreted:

- The spell page also reads the legacy `spell-cards-spellbooks` key.
- A bare array of `{name, source}` references is treated as spell references on the spell page, and the legacy `5etools-spellbook-v1` envelope is accepted the same way.
- The item and beast pages do not guess an entity type for untyped references. Such an entry is listed as unreadable on those pages.
- An unknown `format` value, a missing name, a missing card list, or a list with no usable references is reported as unreadable.
- When the same name exists in both the modern and legacy spell keys, the modern key wins and the conflict is not surfaced.
- Reads never rewrite storage, so a failed experiment cannot destroy the old copy.

## Saving

Save opens a themed dialog instead of a native prompt:

- The name field is prefilled with the entity collection default.
- With no cards selected, the dialog explains that at least one card is required and nothing is stored.
- An empty or whitespace-only name disables Save and shows the reason.
- When the name already exists, the first activation warns and changes the action to Confirm replace. A second activation overwrites; closing the dialog leaves the stored book unchanged.
- Storage write failures (for example a quota error) are reported as inline dialog status and the dialog stays open.

A successful save writes the typed envelope under the per-type key and reports the saved name and card count inline.

## Loading

Load opens a dialog that lists every readable book for the current entity type, with its name and card count. On the spell page, readable legacy books are marked as a legacy spellbook. Entries with unusable data are listed with their reason, so a corrupt entry never hides the valid books. With no saved books the dialog says there is nothing to load and offers no load actions.

Each listed book offers exactly two actions:

- **Add** inserts the book's matching cards without removing the current selection and without duplicating a card. A card already selected by the same identity appears once.
- **Replace** clears the selection and then inserts the book's matching cards.

Loading only resolves references against the entity set currently loaded on the page. References that do not resolve are not inserted, are counted, and are reported in the dialog after the load. When Add resolves nothing, the selection is left untouched. Replace asks for a second confirmation only when it would discard a selected card that is not in the book; replacing into an empty or fully contained selection proceeds on the first activation.

Both actions apply the active sort order and rebuild the preview through the normal selection update. Loading never changes the layout, content mode, density, or print order, and it does not rewrite storage.

A load with no unmatched references closes the dialog and returns focus to Load. A load with unmatched references keeps the dialog open so the report is visible.

## Dialogs and Chrome

Save and Load are controls in the workspace chrome (the book zone from `redesign-workspace-bar` when it lands; beside each other in the current topbar until then). Both dialogs are modal `<dialog>` elements:

- opening moves focus into the dialog (the name field, or the first book action);
- focus stays inside the dialog while it is open;
- Escape closes the dialog through the platform cancel behaviour;
- closing returns focus to the control that opened it.

The current topbar puts both controls side by side in the legacy action cluster as icon-plus-label buttons. At 1200px and wider the label is visible; below that the label is withdrawn and only the icon remains, so the pair stays inside the bar at tablet widths such as 768x1024. Until `redesign-workspace-bar` lands, the surrounding cluster still overflows below roughly 1350px of CSS width; that pre-existing topbar overflow is a recorded intermediate state owned by `redesign-workspace-bar`, and the old layout is intentionally left unchanged.
