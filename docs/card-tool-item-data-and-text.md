# Card Tool: Item Data and Text

## Data Sources

The normal item page is `5etools/items/index.html`. Its `ItemsPage` adapter in `5etools/js/items.js` uses `DataUtil.item.loadJSON()` for the merged item dataset, with separate loaders for prerelease and homebrew data. The standard data files are `5etools/data/items.json` and `5etools/data/items-base.json`; the base file is used for the base item catalog and the main file contains the broader item data. Item records are selected from the `item` array and retain fields such as `name`, `source`, `type`, `rarity`, and `entries`.

The standalone item card page is `item-cards.html`. Unlike the normal page, it is intentionally self-contained: `js/item-cards.js` fetches the explicit `5etools/data/items-base.json` and `5etools/data/items.json` allowlist through the shared `js/card-tool.js` loader, de-duplicates records by `${type}|${name}|${source}`, and optionally adds image paths from `5etools/data/fluff-items.json`. Those image paths resolve under the project-local `img/` directory, which is not tracked by this repository or by the 5etools source repository.

## Normal Item-Page Rendering

The normal item page passes item entries through `Renderer.item.getRenderedEntries()`. The shared renderer understands the full 5etools entry schema and recursively renders rich entries, lists, tables, and inline tags. The table view requests compact rendered text, while the item detail view requests the normal rendered form. This path should be used as the reference for the complete item presentation.

## Card Text Rendering

The standalone card renderer cannot load the normal page shell and `Renderer`, so `js/card-tool-text.js` deliberately produces a compact plain-text representation:

- string entries are joined with spaces;
- nested `entries`, `entry`, and `items` values are recursively flattened;
- entry names are prefixed when present;
- tables and unsupported rich structures are omitted by the current flattening policy;
- inline tags are converted to readable short form before HTML escaping in the entity renderer.

For a tag such as `{@action Utilize|XPHB}`, the first pipe-delimited segment is the display text (`Utilize`); later segments carry source or other metadata. If a tag has a third segment, that segment is an explicit display override and takes precedence. Card text must therefore use the display segment, not the source segment. The XPHB Healer's Kit entry in `5etools/data/items.json` uses the two-segment form for `action`, `condition`, `variantrule`, and `skill`, so its card text becomes:

> A Healer's Kit has ten uses. As a Utilize action, you can expend one of its uses to stabilize an Unconscious creature that has 0 Hit Points without needing to make a Wisdom (Medicine) check.

This is a card-specific compact rendering rule. Do not rewrite the source JSON to remove tags, and do not change the normal item renderer to accommodate the card layout. Keep escaping after formatting so data text cannot become card markup.

## Card Content Units and Truncation

The item card flow in `js/card-tool-content.js` splits flattened item text with `sentenceUnits()`: each sentence is a unit with its own block id, so each sentence renders as a paragraph. The spell adapter uses the same units and appends the material component line as a final `material` unit.

If one item sentence is too long to fit a panel at the default body size, `itemFlow()` explodes that sentence into `wordUnits()` with the same block id. The flow can then fill panels at word boundaries without breaking the paragraph, so a single oversized sentence still flows onto a strip instead of looping or clipping.

Under Single card mode the flow shrinks to the floor and then truncates, marking the last visible block with the `card-ellipsis` marker. Under Overflow mode the flow assigns the smallest strip that fits and puts over-cap content in the final `truncated` bucket. See [card-tool-rendering-and-printing.md](card-tool-rendering-and-printing.md) for the shared ladder and cap rules.

## Placeholder UI

When no item is selected, `item-cards.html` shows the `#placeholder` element with the message "Select entries to preview cards". `js/card-tool.js` hides that placeholder when `buildPreview()` creates screen and print cards, and restores it when the selection is cleared. This placeholder is UI state, not item data and should not be added to JSON entries.
