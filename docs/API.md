# Code API

The main authoring workflow is writing JSON files in `data/`. The viewer and validator can also be used directly in code.

## Validation

```js
import { validateTree } from './lib/tree.js';

const tree = validateTree(input);
```

Returns a normalized copy without mutating the input or doing I/O. Rejects unknown fields, invalid values, duplicate IDs, more than 2,000 nodes or more than 40 levels. Missing IDs are generated deterministically; explicit stable IDs are recommended for live editing.

Trees contain only `title` and `root`. Nodes contain only `id`, `label`, and `children`; `id` and `children` are optional on input. Normalized nodes always have an ID and a children array.

For files, use `npm run validate -- data/name.json`. There is no HTTP write API or JavaScript file-writing wrapper.

## Advisory review

```js
import { reviewTree } from './lib/review.js';

const { stats, findings } = reviewTree(input);
```

For Node authoring tools: validates the same format, then returns structural statistics (`nodes`, `levels`, `maxChildren`) and advisory findings without mutation or I/O. A finding contains a `code`, factual `observation`, review `question`, and `occurrences` with IDs and full label paths. Codes are `sibling-label`, `ancestor-label`, and `matching-branch`. The checks do not infer synonyms, enforce unique concepts, or judge conceptual ownership. Statistics are not a quality score.

Use `npm run review -- data/name.json` for text or `npm run review -- --json data/name.json` for full JSON. Hints return exit code zero. Invalid data or unreadable files return a nonzero code. See [the structuring guide](STRUCTURING.md) for the pattern definitions and human review procedure.

## Catalog

`listDatasets()` from `lib/data.js` returns the discovered files. Valid entries contain `file`, `title`, `revision`, and `nodeCount`, including the root. Invalid entries remain selectable with an `error` and no node count. The same catalog is served at `/data.json`.

## Viewer

Include `public/style.css` and give the container a width and height:

```js
import { createTreeViewer } from './public/tree-viewer.js';

const viewer = createTreeViewer(document.querySelector('#container'), {
  onChange(state) { /* zoom, selectedId, selectedLabel, focusRootId, canFocusSubtree, canGoToParent, collapsedCount, canCollapse */ },
});
viewer.setTree(data);
viewer.fit();
```

Selection is a highlight with bottom-panel actions. `selectedLabel` is null when nothing is selected; `canFocusSubtree` and `canGoToParent` let a host enable the corresponding controls.

| Method | Behavior |
| --- | --- |
| `setTree(data, { preserveView: true })` | Validate and replace data, retaining viewport, subtree focus and surviving node state. Omit the option for a fresh view. |
| `focus(id)` | Reveal, select and center a node, leaving subtree focus if needed. |
| `focusSubtree(id)` | Make a branch the displayed root at a readable zoom. |
| `showFullTree()` | Restore the previous overview. |
| `goToParent()` | Select the parent, moving up a focused subtree when necessary. |
| `select(id \| null)` | Select or clear the highlighted node. |
| `collapse(id)`, `expand(id)` | Fold or unfold a branch. |
| `collapseAll()`, `expandAll()` | Fold or unfold branches in the current subtree. |
| `find(text)` | Return matching nodes from the entire dataset. |
| `search(text)` | Find nodes and highlight matches. |
| `fit()` | Fit the visible tree to the container. |
| `zoomIn()`, `zoomOut()`, `resetZoom()` | Change the canvas zoom. |
| `clear(message)` | Remove the tree and show a message. |
| `destroy()` | Remove the viewer and its listeners. |
