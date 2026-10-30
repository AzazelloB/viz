# Hierarchy visualizer

A fullscreen tree viewer for exploring a subject through its parts. Node titles stay on the canvas; descriptions and source references live in the details panel.

```sh
npm run dev
```

Open http://127.0.0.1:3000. Requires Node.js 22+. No dependencies or build step. `npm start` also runs the app; development mode additionally restarts the server when its code changes.

## Write JSON directly

Ask an agent working in this project to visualize a subject or codebase. [AGENTS.md](AGENTS.md) defines how to inspect it and organize the hierarchy. The agent writes a file in `data/`; no generator or application code changes are needed.

For example, `data/company.json`:

```json
{
  "title": "Company",
  "root": {
    "id": "ceo",
    "label": "CEO",
    "children": [
      {
        "id": "engineering",
        "label": "Engineering",
        "description": "Builds and maintains the product.",
        "children": [
          { "id": "engineers", "label": "Engineers" }
        ]
      }
    ]
  }
}
```

```sh
npm run validate -- data/company.json
```

Validation checks the JSON deterministically without changing it. Omit the filename to validate every dataset. See [schema.json](schema.json) and [data/AGENTS.md](data/AGENTS.md) for fields and limits. Use stable, unique IDs so edits retain selection and collapsed branches.

The app watches for file changes and updates the tree without reloading the page. Agents can save a small valid tree, then grow it through complete JSON snapshots. Incomplete or invalid edits show an error while the last valid tree stays visible. CSS updates apply live; other frontend edits reload the page. Development server restarts also reconnect and reload the page.

Datasets stay local and are excluded from Git. A fresh checkout starts with an empty `data/` folder containing only writing instructions.

## Explore

Choose a dataset from the dropdown. Click a node for its details, then follow its children or the parent arrow. Focus subtree isolates a branch; Full tree restores the previous overview. Trees start expanded, with buttons to collapse or expand all branches in the current view.

Drag to pan, scroll to zoom, `F` to fit, `/` to search, and arrow keys to navigate. The small triangle under a node expands or collapses its children.

For embedding the viewer in browser code, see [the code API](docs/API.md).
