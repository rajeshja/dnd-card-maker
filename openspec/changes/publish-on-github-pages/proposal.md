# Proposal

## Why

The card printers are separate static pages with no common entry point, and the repository does not publish updates automatically. A themed landing page and a deployment workflow will make the tools easy to discover and keep the GitHub Pages site current after each commit to `main`.

## What Changes

- Add a themed home page linking to the spell, item, and beast card printers.
- Allow long spell front titles containing `/` and no spaces to wrap after the slash instead of being clipped.
- Add a GitHub Actions workflow that runs on every push to `main`, checks out the pinned 5etools submodule, validates the project, assembles only the static site and data it uses, and deploys that artifact to GitHub Pages.

## Capabilities

### New Capabilities

- `card-tool-homepage`: A themed landing page that directs users to each card printer.
- `spell-card-title-layout`: Spell front titles can wrap after a slash when a long name has no spaces.
- `github-pages-deployment`: Automated publishing of the static application from `main` with only runtime assets.

### Modified Capabilities

None.

## Impact

Adds a root `index.html` and a GitHub Actions Pages workflow; changes spell title styling and its focused tests; updates directly related project documentation. The site remains static and uses the existing `5etools/` submodule and its data at runtime. No production bundler currently exists, so the workflow will validate with the existing test command and assemble a deployable static artifact rather than introduce a JavaScript build tool. The submodule itself remains unchanged.
