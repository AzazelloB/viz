# Dataset format

Follow the visualization contract and workflow in `../AGENTS.md`. Write JSON directly in this folder using `../schema.json`. The app discovers files and updates the view automatically. No JavaScript generator or registration is needed.

- Required fields: tree `title` and `root`; node `label`.
- Optional tree field: `description`. Optional node fields: `id`, `subtitle`, `description`, `source`, `children`.
- Only labels appear on the canvas. Factual descriptions and source references appear in the details panel. Do not add subtitles unless requested.
- Use stable, unique IDs. Retain IDs for unchanged concepts when updating a tree.
- Sibling order determines left-to-right placement.
- Filenames must begin with a letter or number, contain only letters, numbers, hyphens or underscores, and end in `.json`.
- Validate from the project root with `npm run validate -- data/<name>.json`. Validation reads the file without rewriting it. Run `npm run validate` to check all datasets.
- Save complete, valid snapshots as you work. Start small, then add branches; stable IDs keep the user's view intact. An incomplete save leaves the last valid tree visible until the JSON is valid again.
- Limits: 2,000 nodes and 40 levels. These are safety limits, not targets.
- JSON datasets are local and ignored by Git. Do not commit or force-add them.
