# Design

## Context

See `proposal.md` for motivation. The constraints that shape the approach:

- `#app` is a two-row grid (`56px minmax(0,1fr)`, `48px` under `max-height: 820px`) with `overflow: hidden`. `#topbar` spans both columns and holds the title plus `.topbar-actions`, a flex container with `flex-wrap: wrap`. `#selection-tray` is a second fixed-height row (`44px`, `40px` compact) inside `#main`, so the preview pays for both rows while the sidebar pays for one.
- The action cluster measures roughly 950px before the title: nine buttons plus three segmented groups. With a ~300px title and padding, one line needs roughly 1350px of CSS width. Below that the cluster wraps into a second line, `align-items: center` centers the two-line stack on the 56px row, and `#app` clips both edges. `Save` and `Clear` lose their tops; `Debug Print` is cut off at the bottom.
- `syncTopbarActions()` already moves the `.topbar-actions` node between `#topbar` and `#print-sheet-slot` under the phone media query. `openManager()` already records `document.activeElement` as the return-focus target, so promoting the count to the manager trigger needs no new focus logic.
- `#preview-mode-group` currently lives in the tray and is only displayed below 900px. It has to move into the bar.
- The three HTML pages carry byte-identical bar markup. `js/card-tool-layout.js` is the existing home for pure view math, and unit tests run in Node with no DOM, so width behavior is verified in the browser rather than in Jest.
- Card rendering, page planning, print DOM, and selection identity are out of scope and must not change.

## Goals / Non-Goals

**Goals:**

- One chrome row, 48px, that never clips and never wraps at any supported width.
- Branding present at every width, including phone, without spending a second row.
- Presentation controls that stay one click from a menu and remain legible when label-less.
- A single documented degradation ladder, so future controls have a rule to follow.

**Non-Goals:**

- Any change to `#print-area`, page planning, strip packing, print geometry, or the selection identity.
- Load behaviour; this change only establishes the book zone the cardbook change will use.
- Keyboard shortcuts, URL state, or persisted workspace preferences.
- Redesigning card templates, type scales, or back-card art.

## Decisions

### 1. One full-width 48px row, not a bar inside the preview column

`#app` becomes `grid-template-rows: 48px minmax(0, 1fr)` with no height-based override. The bar spans both columns and hosts four zones: brand, selection, book, presentation, and primary.

Full width rather than preview-column width because at 1024px the preview column is only ~764px after a 260px sidebar, which is below the labelled budget. A full-width bar keeps labels alive one breakpoint longer and lets branding sit above the sidebar where it reads as application chrome rather than preview chrome.

**Alternative considered:** keep the topbar and slim the tray. Rejected because it preserves two rows and therefore preserves the 100px cost the proposal is trying to remove.

### 2. CSS owns the ladder; JS only observes the phone breakpoint

Breakpoints stay media queries, consistent with the existing decision that responsive modes are CSS-driven. JS keeps one `matchMedia("(max-width: 599px)")` for the masthead/sheet handoff and does no width arithmetic at runtime.

**Alternative considered:** a JS-computed composition. Rejected: it duplicates CSS, adds a render pass on resize, and cannot react to scrollbars or zoom the way the cascade does.

**Alternative considered:** container queries on the bar. Rejected because the bar spans the viewport, so a media query is the truthful input; container queries would only help if the bar were embedded in a variable-width column.

### 3. Zones and the degradation ladder

```
+-------------------------------------------------------------------------------+
| [brand] [title] | [count] | [save] [load] | [content v] [layout v] [density v] | [print] [debug] |
+-------------------------------------------------------------------------------+
   zone 0           zone 1     zone 2            zone 3                            zone 4
```

| Width | Title | Control form | Preview mode group |
|---|---|---|---|
| `>= 1200px` | shown | icon + label | hidden (Pages view is the only desktop preview) |
| `900-1199px` | shown | icon only | hidden |
| `600-899px` | hidden | icon only | shown (Cards/Pages) |
| `< 600px` | masthead only | bar hidden | shown in the tray |

Shedding order when space is short: title, then control labels, then the Debug Print label. Never shed: brand mark, selection count, Print. The bar is `flex-wrap: nowrap` with `min-width: 0` on every child, so a miscalculation produces horizontal pressure inside one row rather than a second row that the shell clips.

**Alternative considered:** let the row grow to two lines. Rejected: it reintroduces variable chrome height, costs preview space at exactly the laptop sizes being fixed, and leaves future controls free to re-create the bug.

### 4. Brand mark, and the icon collision rule

The mark is a **card pack with one card rising out**: a rounded pack body in gold outline with a paper-white card edge emerging from the top. It is visually distinct from the control icons on purpose:

| Element | Silhouette | Treatment |
|---|---|---|
| Brand | pack with a card emerging | filled paper card + gold outline |
| `Single card` | one card | thin outline |
| `Overflow` | two offset cards + continuation arrow | thin outline + arrow |
| `Fronts` / `Backs` / `Both` | pages, with text lines / art block / a pair arrow | thin outline |

Icons are inline SVG at 16px with `stroke: currentColor`, and the mark at 24px inside a 32px slot, so both follow the gold/active colors from CSS. The mark is not interactive: it is a `role="img"` span whose `aria-label` is set from the page config title at startup, and it carries no `tabindex`. A focusable non-control is worse than no focus target. The same artwork becomes `favicon.svg`.

**Alternative considered:** a fanned deck. Rejected because at 16-24px it is nearly indistinguishable from the `Overflow` content icon.

### 5. Title visibility is driven by contention, not priority

The title is shown wherever it does not displace a control: `>= 1200px`, `900-1199px`, and in the phone masthead. It is suppressed only in the `600-899px` band, where its ~300px would cost the Browse button or force the icon row itself to compact further. The title keeps `min-width: 0; overflow: hidden; text-overflow: ellipsis`, so at 320px the name truncates before the mark moves.

**Alternative considered:** drop labels instead of the title at 900-1199px. That is the opposite trade and is a one-rule swap; it is rejected here only because persistent branding was an explicit requirement and a label's meaning is always recoverable from the closed menu and tooltip.

### 6. The count is the manager trigger; Clear leaves the bar

`[85 selected]` becomes a button that calls `openManager()`. `#selection-count` keeps its id so `updateSelection()` is unchanged apart from the element's new parent. The standalone `Manage` button and the bar-level `Clear` button are removed; `Clear all` remains inside the manager with its existing two-step confirmation, which the bar button never had.

**Alternative considered:** keep `Manage` and make the count static. Rejected: it costs ~80px to duplicate a trigger and leaves two adjacent controls with the same destination.

### 7. Dropdowns are menus with a visible active value

Each group keeps its container id (`#content-group`, `#layout-group`, `#density-group`) and its `data-content` / `data-layout` / `data-density` option buttons, so the existing `update*Buttons()` functions keep working with `aria-checked` instead of `aria-pressed`. Each group also gains one trigger button with a label span.

- Semantics: `aria-haspopup="menu"`, `aria-expanded`, `role="menu"` with `role="menuitemradio"` and `aria-checked`. The trigger's accessible name is `"<Group>: <Active value>"`.
- Behavior: Enter/Space or click opens; arrows move between options; Enter/Space selects; Escape closes and returns focus to the trigger; a pointer press outside closes.
- Rendering: the menu is a `popover` element so it is promoted to the top layer and cannot be clipped by `#app`. Where the Popover API is unavailable, it is a fixed-position element positioned from the trigger rect.
- The menu is rendered once per group and reused; only `aria-checked`, the label span, and the icon swap on change.

**Alternative considered:** native `<select>`. Rejected: it cannot show icons, cannot be styled to the tool's typography, and cannot show the icon + full name requirement.

**Alternative considered:** keep segments but icon-only. Cheaper in clicks, but the closed label is what makes a three-state control self-documenting; the design notes icon segments as the fallback if dropdown clicks prove annoying in use.

### 8. Icon-only is a CSS mode over the same buttons

Below the label threshold, CSS hides the label span inside each control and the trigger keeps its icon. Accessibility does not depend on the breakpoint: `aria-label` always carries the group and active value, and tooltips come from `data-tip` rendered by a `::after` rule that appears on `:hover` and `:focus-visible`. Native `title` is not used because its delay and styling are not controllable.

### 9. The no-clip invariant is enforced by construction and verified by measurement

`flex-wrap: nowrap` removes the failure mode that produced the current bug. The ladder keeps content within the row, and the verification task measures every control's bounding rect against the bar's client rect at each matrix width rather than judging by eye. If a breakpoint fails, the ladder threshold moves — the spec pins behavior at named widths, so any adjustment must keep the 1024px and 600px scenarios true.

### 10. Phone keeps the masthead and the existing node-move

`#topbar` is replaced by `#workspace-bar`, and below 600px a separate 48px masthead row (`#masthead`) shows the brand mark and title. The action cluster is renamed `.workspace-actions` and continues to be moved as a single node into `#print-sheet-slot` on phone; the selection cluster simply hides with the bar, since the bottom bar already owns Browse/Selected/Print. Moving the same nodes keeps exactly one interactive copy of each control, as the responsive design requires.

The masthead replaces the topbar rather than adding a row: `#app` becomes `48px minmax(0,1fr)` on phone with the masthead occupying row one.

### 11. Icon data and option lists live in one shared module

`js/card-tool-icons.js` exports an SVG sprite string plus a registry of the three option groups (`{value, label, icon}` per option). The sprite is hydrated into each page from `data-icon` placeholders at `start()`, and the menus are built from the registry. This keeps the three HTML pages from carrying three copies of fifteen SVGs, and gives the tests a DOM-free source of truth for option labels and icon names.

### 12. Print isolation is inherited, not re-implemented

The bar lives inside `#app`; `@media print` and `body.print-debug` already hide `#app`, the overlay, the mobile bar, and dialogs. Top-layer popovers are closed before printing by the existing print path, and the print DOM is untouched.

## Risks / Trade-offs

- **[Dropdown costs one extra click per switch]** → Acceptable for disclosure of three options; if duplex checking makes it painful, the icon-only segmented fallback fits the same footprint. Measure in the browser before declaring it settled.
- **[Width estimates derive from screenshots, not measurement]** → The tasks measure real control widths at the matrix before finalizing thresholds; the ladder lives in one commented CSS block so it is adjustable in one place.
- **[Popover support and positioning]** → Feature-detect; fall back to fixed positioning computed from the trigger rect. Verify in every browser used for the manual matrix.
- **[Icon ambiguity for Fronts/Backs and Auto]** → Fronts/Backs are distinguished by content (text lines vs art block) rather than geometry, and Auto uses a sparkle rather than a letter; menus always show full names and tooltips name the active value.
- **[Removing Clear and Manage may surprise existing habits]** → Both destinations remain: the count opens the manager, and the manager's confirmed `Clear all` is the only clear path. Document it in the architecture doc.
- **[The bar becomes load-bearing]** → Any future control must respect the ladder; the four zones, the shedding order, and the never-shed set become part of `docs/card-tool-architecture.md`.
- **[Three duplicated page headers drift]** → Shared option/icon module, identical bar structure across pages, and a task that diffs the three headers.

## Migration Plan

1. Add `js/card-tool-icons.js`, load it before `js/card-tool.js` on all three pages, and hydrate icons at `start()`. No visual change yet.
2. Replace the three segmented groups with dropdown triggers plus menus, keeping container ids and `data-*` values, and switch `update*Buttons()` to `aria-checked`. Verify each layout, content, and density change still takes effect.
3. Restructure the shell: add the workspace bar, move the count, Save, preview-mode group, and action cluster into it, delete `#topbar` and `#selection-tray`, and set `grid-template-rows: 48px minmax(0,1fr)`.
4. Bind the count to `openManager()`, remove the `Manage` and `Clear` controls and their listeners, and keep the manager's clear confirmation.
5. Apply the ladder rules, the masthead row, and the scoped node-move; delete the `max-height: 820px` rules and the tray CSS.
6. Add the brand mark and favicon, including the config-derived accessible name.
7. Verify the width matrix, update the three docs, and run `npm test`.

Rollback is a normal revert: no stored data, saved cardbook format, page plan, or print geometry is involved.

## Validation Matrix

| Viewport | Expected |
|---|---|
| 1366x768 | one 48px bar; brand + title + count + Save + three labelled dropdowns + Print + Debug, all fully visible; preview ~52px taller than before |
| 1200x900 | same composition, no wrapping |
| 1024x768 | title + count + Save + icon-only dropdowns + Print + Debug; nothing clipped |
| 900x768 | same as 1024 with the tightest horizontal slack in the matrix |
| 768x1024 | no title; icon-only controls; Browse visible; Cards/Pages shown; open menus fully visible |
| 600x800 | same as 768; Debug Print reachable |
| 390x844 | masthead strip with mark + title; no bar; bottom bar intact; sheets contain the only controls |
| 360x800 | masthead title truncates cleanly; mark stays put |
| any | print and Debug Print contain no bar, masthead, menu, or bottom bar |
| any | opening a menu shows icon + full name for every option, with the active one checked |

## Open Questions

- The exact `600-899px` treatment is chosen but not yet measured against real control widths; if the icon row still overflows at 600px, the fallback is dropping the preview-mode group from the bar at that width while keeping it in the phone sheet. This does not change the specs as written, which only require the named controls to remain reachable.
