# Tasks

## 1. Landing page

- [ ] 1.1 Add a responsive root `index.html` in the card-printer visual theme with links to all three printer pages, update the README getting-started links to lead from the home page, and verify all links and narrow-screen layout with `npm run serve`.

## 2. Spell front title wrapping

- [ ] 2.1 Add a line-break opportunity after `/` for long, unspaced spell front titles without changing item, beast, or spell-back title behavior; add focused regression coverage, update `docs/card-tool-rendering-and-printing.md`, and verify with `npm test` and a spell front screen/print preview.

## 3. GitHub Pages deployment

- [ ] 3.1 Add a separate workflow that runs on every push to `main`, checks out the pinned submodule recursively, runs `npm ci` and `npm test`, stages only the site and required runtime data/assets, and deploys a Pages artifact; verify a workflow run publishes the three pages and omits development-only files.
- [ ] 3.2 Document the one-time GitHub Pages Actions-source setup in the README and verify the first deployment succeeds after repository Pages settings are enabled.

## 4. Integration verification

- [ ] 4.1 Serve and inspect the staged site under its project subpath; verify the home-page links, all three pages' data and assets, slash-title wrapping, and the absence of missing runtime requests.
