# Visualization workflow

These instructions apply when creating or updating a visualization in this app. Explain what the subject IS through concepts and their meaningful parts. A useful tree is a chosen explanation of a system, not an attempt to turn every relationship into containment.

## Output

- Use short, familiar, atomic labels. Children should make their parent's identity clearer. The format contains only tree `title`/`root` and node `id`/`label`/`children`; there are no node details or extra explanatory fields.
- Inventory the subject as it exists. Assessments, recommendations, purposes, and narratives require an explicit request. An intended audience alone does not request an assessment.
- Ground concepts AND their placement in inspected sources. A file proving that two things exist does not prove that one belongs beneath the other. Never infer behavior from filenames.
- Inspect code to establish the facts, keeping evidence and placement reasoning outside the visualization. Use the subject's vocabulary rather than its directory layout or component names. Prefer `Answers` to `Member answer cards` when the parent already establishes the context.

## Structure

- Give each node a stable meaning. Do not quietly expand an entity into an entire feature area to justify unrelated descendants. Choose the scope from the subject, then choose a label that expresses it.
- Read a label as a reader would, without consulting its source. Keep the noun or qualifier needed to identify it: a creator-edited title is not a creator's name. A narrow label must not conceal a broader process beneath it.
- Privately complete the sentence “This child is ___ of this parent.” Parts, properties, members, subtypes, local operations, and implementation constituents can be useful relationships. Mere association, dependency, navigation, or execution order is not enough by itself.
- Keep a concept's data, interactions, and implementation together where they explain that concept. Do not make parallel frontend, backend, data, and flow inventories of the same features. This does not mean every operation involving an entity belongs under that entity.
- Place an operation by its primary subject. An operation spanning several peer concepts belongs at their meaningful shared scope. Reading a parent's configuration as a dependency does not automatically change an operation's primary subject.
- Shared use does not establish ownership. A component used in two places is not automatically a part of either one; put genuinely shared machinery at a verified common scope, or show its contextual occurrence when that helps the explanation.
- Repeated concepts and repeated labels ARE allowed. Distinct occurrence IDs must remain unique. Keep names consistent for the same meaning; use context or precise labels to distinguish different meanings. Repeat a concept when its local membership or role helps, not to create duplicate inventories of one feature. Do not rename synonyms merely to evade a review hint.
- Decide locally what the children explain. If a parent enumerates kinds, its direct children should be kinds. If different relationships genuinely help under one concept, make their meaning clear rather than introducing a generic bag of “related things.”
- Let branches be as deep as their meaningful decomposition requires. There is no target depth, width, node count, or uniform shape. Retain useful distinctions; remove wrappers that only restate their children. Do not add categories merely to make a tree narrower, or flatten it to silence diagnostics.

## Minimum sufficient tree

- Prefer the fewest concepts that explain the requested subject without losing important distinctions. Completeness is not an inventory of every field, control, validation check, lifecycle step, or implementation consequence.
- Start with the essential parts. Add a node only when the reader learns something material from that distinction. Familiar actions do not need an input/validation/eligibility/cleanup tree by default.
- Apply a deletion pass: if removing a node or branch preserves the useful explanation, remove it. If a wrapper adds no meaning, promote its useful children. Stop expanding when the remaining facts are incidental mechanics or obvious from the parent.
- Represent one rule once at the useful shared scope. A rule and each place the code enforces that rule are usually the same explanatory concept. For example, “one answer or vote” does not also need a prior-contribution-check branch under submission.
- Preserve repetition when it explains a different local role or membership. This is distinct from restating one policy, showing the same control as both an operation and a button, or listing arithmetic behind an otherwise simple count.
- Do not minimize blindly: preserve a genuinely complex mechanism's meaningful parts. The aim is less explanation for the same understanding, not a fixed node budget or a maximum depth.

See [docs/STRUCTURING.md](docs/STRUCTURING.md) for examples and the review rubric.

## Procedure

1. Read `data/AGENTS.md` and `schema.json`.
2. Inspect the subject. Establish a private glossary of concepts, aliases, and contexts. Keep the scope and any user-reviewed branches intact.
3. Sketch the essential parts before expanding details. For ambiguous placements, compare plausible parents and check which relationship the sources actually support. Keep this reasoning outside the dataset.
4. Write the hierarchy directly as `data/<name>.json`. Do not create a JavaScript generator or call a file-writing API to construct a hierarchy. Mechanical format migrations may strip retired fields while preserving existing nodes and relationships. Save complete, valid snapshots as the tree develops.
5. Read representative branches using labels and ancestors alone. Review ownership and scope, then perform the deletion pass above. Check that rules, controls, and incidental mechanisms have not multiplied into unnecessary entities. The outline must make sense through the tree itself.
6. Run `npm run validate -- data/<name>.json` and `npm run review -- data/<name>.json`. Validation errors must be fixed. Review hints are observations to examine, not semantic verdicts or requirements to remove repetition. A report with no hints does not establish a good hierarchy.
7. Preserve IDs for unchanged occurrences. Do not change application code to register a dataset. Finish with a short link to the dataset in the app.

The app watches `data/` and retains its last valid version while a file is invalid. Stable IDs preserve selection, collapsed branches, and subtree focus across updates.

Datasets stay local and are ignored by Git. Do not commit or force-add them. The visualization belongs in this app; do not produce an inline report, screenshots, or an alternate visualization unless explicitly requested.

For dataset-only changes, use the focused validation and review commands; do not run builds or broad test suites.
