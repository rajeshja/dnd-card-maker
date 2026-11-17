# Tasks

## 1. Storage helpers

- [ ] 1.1 Add `js/card-tool-cardbooks.js` with `parseBook`, `normalizeBook`, `resolveCards`, and dedupe/merge helpers for the typed `5etools-cardbook-v1` envelope; verify each helper is DOM-free and importable in the Node test run.
- [ ] 1.2 Add `test/cards/CardbookPersistence.test.js` covering envelope validation, malformed JSON, non-object references, missing name, and empty card lists; run `npm test` and verify each failure mode returns a reportable reason instead of throwing.
- [ ] 1.3 Add legacy coverage: a bare `{name, source}` array normalises to spell references on the spell page, is rejected as unreadable on the item and beast pages, and an unknown format string is rejected; run `npm test`.
- [ ] 1.4 Add resolution coverage for matched references, unmatched references, duplicate references, and a lookup with multiple sources for the same name; run `npm test`.

## 2. Save

- [ ] 2.1 Add the Save dialog markup to all three pages, reusing the manager dialog styles, with a name field, inline status area, save and cancel actions; verify it opens from the Save control, traps focus, closes on Escape, and returns focus to the control.
- [ ] 2.2 Wire Save to write the typed envelope under the existing per-type key, warn when the name already exists, and refuse an empty or whitespace-only name; verify a saved book appears in storage with typed references and that declining an overwrite leaves the previous book intact.
- [ ] 2.3 Replace the save `alert()` calls with inline dialog status, including a caught storage failure; verify a forced write failure reports in the dialog without closing it.

## 3. Load

- [ ] 3.1 Add the Load dialog listing the modern key and the legacy spell key with name and card count, plus an empty state; verify books are scoped to the current entity type and a legacy-only book is listed on the spell page.
- [ ] 3.2 Wire Add to union the resolved cards into the selection and Replace to clear then insert, both through a single `updateSelection()`; verify no duplicate cards, identity still `${type}|${name}|${source}`, and the active sort order applied to the result.
- [ ] 3.3 Report unmatched references after a load, including the all-unmatched case, and leave the selection untouched when Add resolves nothing; verify the count and message against a book referencing an unloaded source.
- [ ] 3.4 Add the conditional Replace confirmation so it appears only when the current selection contains a card absent from the book, resets on close and on row change, and does not appear for an empty or fully contained selection; verify both paths.

## 4. Chrome control

- [ ] 4.1 Add the Load control beside Save in the workspace bar's book zone, using the same icon-plus-label and compact icon-only forms as Save; verify it is present and keyboard operable at 1366x768 and 768x1024, and that no third cardbook surface is introduced.
- [ ] 4.2 Verify the control pair does not clip when the bar is in its compact form; if `redesign-workspace-bar` has not landed, record the resulting topbar overflow as a known intermediate state rather than adjusting the old layout.

## 5. Documentation and integration

- [ ] 5.1 Rewrite `docs/card-tool-cardbooks.md` to describe only what exists: the stored envelope, the per-type key, legacy compatibility, Add and Replace, unmatched reporting, and the explicit exclusion of file import and export; verify no section promises a feature outside the spec.
- [ ] 5.2 Update `docs/card-tool-data-and-state.md` and `docs/card-tool-architecture.md` with the cardbook dialog state, focus handling, and the rule that loading never changes layout or print order; verify the documented identity matches `${type}|${name}|${source}`.
- [ ] 5.3 Run `npm test` and verify the full suite passes with the new persistence tests.
- [ ] 5.4 Run `npm run serve` and exercise the validation matrix, including a reload between save and load, a legacy book on the spell page, a corrupt entry alongside valid ones, and an unmatched-source book; verify behaviour matches the matrix.
- [ ] 5.5 Verify `git status` shows no changes inside `5etools/`, and that no file picker, download, or network request is triggered by either dialog.

## Workflow follow-up

- Archive this change after the project's review requirements are satisfied; `redesign-workspace-bar` is the recommended predecessor so the Load control lands in the book zone rather than the old topbar.
