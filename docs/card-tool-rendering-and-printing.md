# Card Tool: Rendering and Printing

## Front Cards

Each card type has a dedicated front-card renderer. The spell renderer (`cardHTML(spell)`) includes title, school color, level, casting time, range, duration, components, flattened description, and optional material text. `fmtEntries()` recursively handles strings, `entries`, and `list`; it strips simple `{@tag ...}` markup, flattens paragraphs into text, and renders tables as `[Table]`. Item and beast renderers follow their own layout logic without assuming spell fields exist.

## Back Cards and Assets

Back cards are card-specific as well. Spell backs render school, level, classes, concentration/ritual indicators, and the spell name. Item and beast backs use a simpler label layout with item or beast metadata. All back-card layouts rely on relative asset paths under the project-local `card-images/` directory, and the repository ships the spell-card art set there. Optional item and beast artwork resolves from the project-local `img/` directory, which is not tracked by the repository. If that directory is removed, renamed, or path casing changes, the back preview and print output will show broken image references.

## Page Construction

`buildPreview()` sorts selected cards, chunks them using the configured `page.rows * page.columns`, pads the final page with null cards, and renders each page twice: once into `#print-area` and once into `#screen-pages`. The shared engine supports varying page layouts: spell and item cards use A4 landscape layouts, beast cards use A4 portrait, and the page geometry is set per tool in each page config.

For back previews/prints, each row is reversed to preserve duplex-printing alignment. A physical test is required after changing grid dimensions, browser print settings, or this mapping.

## Fitting

`fitRenderedCards()` waits for fonts unless invoked with `{sync: true}`. Card-specific fitting logic reduces titles and body text while preserving readable layout inside each card. Print fitting temporarily applies `#print-area.fit-measure` when print markup is hidden.

These values are layout policy, not data; adjust only with preview and print checks.

## Print Modes

`@media print` hides the app and shows `#print-area` at the configured A4 orientation with zero page margins. Each page config can set a different card grid and orientation. Debug Print exposes the print DOM in the browser and can simulate background graphics being disabled. `beforeprint` performs synchronous fitting.
