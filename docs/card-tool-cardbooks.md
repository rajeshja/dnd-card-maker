# Card Tool: Cardbooks

## Local Storage

Saved books are stored in per-type localStorage entries keyed by the page configuration. The generic logic can store each saved book under a `card-tool-${type}-books` key, where `type` is the entity family such as `spell`, `item`, or `beast`. Existing spell books may still use the older `spell-cards-spellbooks` key for compatibility.

Load dialog actions are `Add` and `Replace`. Add preserves the current selection and inserts matching cards that are not already selected. Replace clears the current selection first, then inserts matches. Loading only matches against the currently loaded entity set, so an exported book can report unmatched cards when its source file is not in the current allowlist or failed to load.

## JSON Contract

The typed portable format is:

```json
{
  "format": "5etools-cardbook-v1",
  "name": "My Collection",
  "cards": [
    {"type": "spell", "name": "Magic Missile", "source": "PHB"},
    {"type": "item", "name": "Bag of Holding", "source": "DMG"}
  ]
}
```

Legacy spell-only files may still use `format: "5etools-spellbook-v1"` with `{name, source}` references, but the preferred long-term shape is the typed card reference. Export serializes selected card references only and does not embed card data. Import requires the matching format string, a truthy name, and an array of references. Do not silently change this contract; add a new format version if entity types, metadata, or semantics need to change.

## Future Generalization

The repository is now explicitly multi-card and should prefer discriminated references such as `{type, name, source}` rather than inferring card type from fields. Decide whether old spell-only books remain accepted and whether a book may mix types before changing the storage key or import validation.
