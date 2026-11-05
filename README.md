# D&D Card Maker

Standalone card-printing pages for [5etools](https://github.com/5etools-mirror-3/5etools-src) content.

The project contains three self-contained pages:

- `spell-cards.html` — spell cards, A4 landscape, 4x2 grid
- `item-cards.html` — item cards, A4 landscape, 2x4 grid
- `beast-cards.html` — beast cards, A4 portrait, 2x2 grid

The 5etools source is vendored as a git submodule at `5etools/`, pinned to `v2.25.4`
(`d2a2616867`). All game data is read from `5etools/data/`; the card-tool code,
styles, tests, and back-card art live in this repository.

## Getting started

```sh
git clone --recurse-submodules <repository-url> dnd-card-maker
cd dnd-card-maker
npm install
npm run serve
```

Then open <http://localhost:5050/spell-cards.html>,
<http://localhost:5050/item-cards.html>, or
<http://localhost:5050/beast-cards.html>.

If the repository was cloned without submodules, run:

```sh
git submodule update --init --recursive
```

## Project layout

```text
.
├── 5etools/              # 5etools source (git submodule, read-only)
├── card-images/          # local card-back art
├── css/card-tool.css
├── docs/                 # architecture and maintenance notes
├── js/
│   ├── card-tool.js      # shared engine
│   ├── card-tool-text.js
│   ├── card-tool-utils.js
│   ├── spell-cards.js
│   ├── item-cards.js
│   └── beast-cards.js
├── test/                 # unit tests
├── beast-cards.html
├── item-cards.html
└── spell-cards.html
```

## Updating 5etools data

The submodule is intentionally pinned. To move to a newer 5etools revision:

```sh
git -C 5etools fetch origin
git -C 5etools checkout <commit-or-tag>
git add 5etools
git commit -m "chore: update 5etools submodule"
```

Review the card pages after updating: data file names, item/bestiary fluff paths,
and card-renderer field assumptions can change between 5etools releases.

## Images

`card-images/` contains the local spell-card back art and is required. Item and
beast card backs optionally use artwork from the 5etools image pack. That pack is
not part of the 5etools source repository; place it under `img/` at the project
root if you want those images. `img/` is ignored by git.

## Tests

```sh
npm test
```

These are unit tests for the shared card-tool text and filter utilities. They do
not exercise the browser UI or print layout. For layout changes, serve the
project and check the front/back previews and browser print preview at the
appropriate A4 orientation.

## License

The card-tool code in this repository is separate from the 5etools project. The
`5etools/` submodule retains its own license; see `5etools/LICENSE.md`.
