# Code API

The main authoring workflow is writing JSON files in `data/`. The viewer and validator can also be used directly in code.

## Validation

```js
import { validateTree } from './lib/tree.js';

const tree = validateTree(input);
```

Returns a normalized copy without mutating the input or doing I/O. Rejects unknown fields, invalid values, duplicate IDs, more than 2,000 nodes or more than 40 levels. Missing IDs are generated deterministically; explicit stable IDs are recommended for live editing.

For files, use `npm run validate -- data/name.json`. There is no HTTP write API or JavaScript file-writing wrapper.

## Viewer

Include `public/style.css` and give the container a width and height:

```js
import { createTreeViewer } from './public/tree-viewer.js';

const viewer = createTreeViewer(document.querySelector('#container'), {
  onChange(state) { /* zoom, selectedId, focusRootId, collapsedCount, canCollapse */ },
});
viewer.setTree(data);
viewer.fit();
```

| Method | Behavior |
| --- | --- |
| `setTree(data, { preserveView: true })` | Validate and replace data, retaining viewport, subtree focus and surviving node state. Omit the option for a fresh view. |
| `focus(id)` | Reveal, select and center a node, leaving subtree focus if needed. |
| `focusSubtree(id)` | Make a branch the displayed root at a readable zoom. |
| `showFullTree()` | Restore the previous overview. |
| `goToParent()` | Select the parent, moving up a focused subtree when necessary. |
| `select(id \| null)` | Open or close node details. |
| `collapse(id)`, `expand(id)` | Fold or unfold a branch. |
| `collapseAll()`, `expandAll()` | Fold or unfold branches in the current subtree. |
| `find(text)` | Return matching nodes from the entire dataset. |
| `search(text)` | Find nodes and highlight matches. |
| `fit()` | Fit the visible tree to the container. |
| `zoomIn()`, `zoomOut()`, `resetZoom()` | Change the canvas zoom. |
| `clear(message)` | Remove the tree and show a message. |
| `destroy()` | Remove the viewer and its listeners. |
