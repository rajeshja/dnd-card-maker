# Design

## Context

See proposal.md for the motivation and the capability specs for required behavior. The three printer pages are root-level static HTML documents. Their scripts and styles use relative paths, and they fetch data from explicit file lists under `5etools/data/`. The project has no production build script; `npm test` is its existing validation command. The 5etools checkout is a pinned submodule, and `img/` is optional, ignored, and not part of the repository.

## Goals / Non-Goals

**Goals:**
- Keep the published pages' existing relative script, style, image, and data paths working under the GitHub Pages project URL.
- Make the deployment artifact an explicit allowlist of the runtime pages, app assets, and data files the pages request.
- Keep the card-printer application dependency-light and the submodule pinned and unmodified.

**Non-Goals:**
- Add a bundler, server-side component, or application runtime.
- Publish the full 5etools source tree, tests, documentation, package files, or `node_modules`.
- Publish optional artwork from the ignored `img/` image pack.

## Decisions

1. **Use a static artifact as the build output.** The workflow will check out the repository with submodules recursively, install the locked Node development dependencies, run `npm test`, and stage an explicit set of runtime files. There is no app compilation step to run: the browser executes the existing HTML and JavaScript directly. A generated artifact is preferable to publishing the repository root because it makes exclusions reviewable and prevents development files from being uploaded.

2. **Keep the data allowlist aligned with page configuration.** Stage the spell JSON files named in `js/spell-cards.js`, the spell-source lookup used during preparation, `items-base.json`, `items.json`, `fluff-items.json`, the three bestiary JSON files and matching bestiary fluff files, preserving their paths under `5etools/data/`. Stage the three card pages, `index.html`, `favicon.svg`, `css/`, `js/`, and `card-images/`. Do not copy the full submodule, its HTML or scripts, package manifests, tests, docs, or `node_modules`. Review the allowlist when a page's configured files or fetches change.

3. **Use GitHub Pages artifact deployment on pushes to `main`.** A workflow without path filters will validate and deploy each push, including commits that update the submodule gitlink. Use the Pages artifact/deploy actions and the required Pages deployment permissions. Keep the workflow's deploy step after validation and artifact assembly so a failed check cannot publish a new version.

4. **Limit slash wrapping to spell front titles.** The shared `.entity-title` currently forces one line and ellipsizes overflow, while the spell back title does not use that rule. Add a break opportunity after `/` and enable wrapping for eligible spell front titles without changing item/beast title behavior or the existing spell back layout.

5. **Keep the home page standalone and path-relative.** Build it from a small root HTML document using the card pages' typography and visual palette, with ordinary relative links to the three root-level printer pages. Avoid loading the card-tool engine on the landing page.

## Risks / Trade-offs

- **A data fetch is omitted from the artifact allowlist** → derive the initial set from the page configurations and `prepare` fetches, then test all three pages against the staged artifact; update the allowlist alongside future data-file changes.
- **Pages deployment is not enabled for the repository** → configure GitHub Pages to use GitHub Actions before relying on the first workflow deployment.
- **Optional 5etools image-pack artwork is unavailable** → do not publish ignored, non-versioned `img/`; retain the existing optional-image behavior, while publishing the tracked `card-images/` assets required by spell backs.
- **A title wraps but overlaps neighboring card content** → validate representative slash-containing spell titles in both screen and print previews and adjust only the spell title layout if needed.

## Migration Plan

Enable GitHub Pages with GitHub Actions as its source in the repository settings, then merge the workflow and site changes to `main`. The first successful workflow publishes the staged artifact; subsequent pushes replace the deployment. To roll back, revert the triggering change or redeploy a prior successful Pages workflow run.

## Open Questions

None.
