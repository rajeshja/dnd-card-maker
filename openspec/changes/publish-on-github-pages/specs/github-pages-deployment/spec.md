# Spec Delta

## Purpose

Publishes the card-printing application as a static GitHub Pages site, keeping runtime assets available while leaving development-only files out of the deployed artifact.

## ADDED Requirements

### Requirement: Main branch commits publish the site
The deployment workflow SHALL run for every commit pushed to `main` and publish the resulting static site to GitHub Pages only after project validation succeeds.

#### Scenario: Successful main branch push
- **WHEN** a commit is pushed to `main` and project validation succeeds
- **THEN** the workflow deploys the current site to GitHub Pages

#### Scenario: Validation fails
- **WHEN** project validation fails for a commit pushed to `main`
- **THEN** the workflow reports failure
- **AND** it does not deploy that commit

### Requirement: Deployment includes only static runtime assets
The published artifact SHALL contain the home page, all card-printer pages, their runtime scripts, styles, icons, required card art, and the 5etools data those pages load; it SHALL exclude development dependencies and project-only files such as `node_modules`, package manifests, tests, and unneeded 5etools source files.

#### Scenario: Pages load their required resources
- **WHEN** a visitor opens any deployed card-printer page
- **THEN** its scripts, styles, card art, and required data are available at the paths the page requests

#### Scenario: Development files are not published
- **WHEN** the deployment artifact is assembled
- **THEN** development dependencies, package manifests, tests, and unrelated source files are absent from the published site
