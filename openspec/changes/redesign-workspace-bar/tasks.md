# Tasks

## 1. Icon and option registry

- [x] 1.1 Add `js/card-tool-icons.js` exporting an inline SVG sprite plus an option registry for content (`single`, `overflow`), layout (`fronts`, `backs`, `both`), and density (`auto`, `large`, `grid`), each option carrying a value, a full name, and an icon id; verify every registry option names an icon that exists in the sprite.
- [x] 1.2 Load `js/card-tool-icons.js` before `js/card-tool.js` on `spell-cards.html`, `item-cards.html`, and `beast-cards.html`, and hydrate icon placeholders at `start()`; verify no page logs a missing-icon warning and each page renders the same icon set.
- [x] 1.3 Add `test/cards/CardToolIcons.test.js` covering registry completeness, the full-name of every option, and rejection of an unknown icon id; run `npm test` and verify the suite passes.

## 2. Presentation dropdowns

- [x] 2.1 Replace the three segmented groups with a trigger button plus a menu, keeping `#content-group`, `#layout-group`, `#density-group` and their `data-content` / `data-layout` / `data-density` option buttons; verify choosing any option applies it to the preview and to the layout's print document.
- [x] 2.2 Implement menu semantics and keyboard behavior: `aria-haspopup`, `aria-expanded`, `role="menu"` with `menuitemradio` and `aria-checked`, arrow navigation, Enter/Space selection, Escape, outside-press close, and focus return to the trigger; verify the layout can be changed with the keyboard alone and the trigger's accessible name reads `"Card layout: Fronts"`.
- [x] 2.3 Render each menu as a top-layer popover with a fixed-position fallback, and open every menu at 600px width; verify no menu item is clipped by the workspace boundary.
- [x] 2.4 Switch `updateContentButtons()`, `updateLayoutButtons()`, and `updateDensityButtons()` to `aria-checked` and update the closed trigger label to the active option's icon and name; verify the closed control reads the new value after every change and add unit coverage for the active-option lookup helper.
- [x] 2.5 Document the dropdown contract — closed state, open state, icon-only form, accessible names, and tooltips — in `docs/card-tool-architecture.md`; verify the document matches the implemented attributes.

## 3. Workspace shell

- [x] 3.1 Add the workspace bar markup and delete `#topbar` and `#selection-tray` in all three pages, setting `#app` to `48px minmax(0,1fr)`; verify exactly one chrome row is present at 1366x768 and 1024x768.
- [x] 3.2 Place the brand zone, count, book zone, presentation group, Print, and Debug Print in the bar; bind the count to `openManager()` and remove the `Manage` and `Clear` controls with their listeners; verify the manager opens from the count, returns focus to it on close, and its confirmed `Clear all` still empties the selection.
- [x] 3.3 Add the card-pack brand mark with a config-derived `aria-label` and ship it as `favicon.svg`; verify the mark renders at 1920x1080, 768x1024, and 390x844, and that the mark is not focusable.
- [x] 3.4 Apply the degradation ladder: title shown at `>=1200px`, `900-1199px`, and below 600px; suppressed at `600-899px`; labels shown only at `>=1200px`; `flex-wrap: nowrap` and `min-width: 0` on bar children; delete the `max-height: 820px` rules and the tray CSS; verify by measuring each control's bounding rect against the bar's client rect at 1366, 1200, 1024, 900, 768, and 600 with cards selected, and confirm nothing is clipped and Print, Save, and the count stay visible.
- [x] 3.5 Add the phone masthead row with the brand mark and title, hide the bar below 600px, and scope the node-move to the action cluster so the selection cluster simply hides; verify at 390x844 and 360x800 that each control has exactly one interactive copy in the document and the title truncates without moving the mark.
- [x] 3.6 Update `docs/card-tool-architecture.md` with the bar zones, the shedding order, the never-shed set (brand, count, Print), and the rule that a new control must respect the ladder; verify the documented breakpoints match the CSS.

## 4. Integration checks

- [x] 4.1 Run `npm test` and verify the full suite passes, including the new icon and dropdown-helper tests.
- [x] 4.2 Run `npm run serve` and exercise the validation matrix: one row, correct composition, no clipping, working menus, and correct title/mark visibility at 1366x768, 1200x900, 1024x768, 900x768, 768x1024, 600x800, 390x844, and 360x800.
- [x] 4.3 Verify print parity is untouched: Fronts, Backs, and Both in Print Preview and Debug Print show the same pages as before, and no bar, masthead, menu, or bottom bar appears in either.
- [x] 4.4 Diff the three page headers and confirm the bar structure, icon placeholders, and script order are identical; verify `git status` shows no changes inside `5etools/`.
- [x] 4.5 Update `docs/card-tool-extension-and-validation.md` with the manual width checks a future control or breakpoint change must run; verify the listed viewports match the validation matrix.

## Workflow follow-up

- `add-responsive-card-workspace` is archived; this change modifies its durable `card-tool-responsive-workspace` requirements, so no reconciliation is pending.
- Archive this change after the project's review requirements are satisfied.
