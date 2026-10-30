# Visualization workflow

These instructions apply when creating or updating a visualization in this app.

## Output contract

- Default to a structural inventory of the subject as it exists: concepts, parts, screens, records, components and their relationships.
- Describe what each node is, what it contains and factual implementation details. Purpose, rationale, reviews, weaknesses, recommendations and narratives require an explicit request.
- The audience or the user's intended use does not by itself request an assessment.
- Use short, atomic labels. Split bundled concepts into child nodes instead of using compound titles or arrow chains.
- Nest parts, members, subtypes, property groups or implementation constituents beneath their parent. A sequence of actions alone is not a parent-child relationship.
- Keep a feature's implementation beneath that feature. Do not create parallel trees for user flows, implementation and findings. Put genuinely shared machinery under a shared parent.
- Follow the subject's conceptual structure, not its directory layout. Add depth where there are meaningful constituent parts; stop before line-by-line code narration or incidental detail. There is no target node count or depth.
- Ground factual claims in inspected sources. For code, include file paths or file:line references in `source`; do not infer behavior from filenames.

## Vocabulary

Establish an internal glossary before constructing the hierarchy. Determine concepts from actual usage, records and relationships, not filenames or historical names alone.

Choose one displayed name for each concept and use it consistently. Record code names or historical aliases in that concept's description when needed. Different names for the same concept do not create additional concepts; distinct concepts with overlapping names need distinct, precise labels.

## Procedure

1. Read `data/AGENTS.md` and `schema.json`.
2. Inspect the requested subject and establish its vocabulary.
3. Write the hierarchy directly as `data/<name>.json`, following the output contract above. Do not create a JavaScript generator or call a file-writing API.
4. Review naming, parent-child relationships, factual descriptions and source references. Remove unrequested commentary and duplicated concepts.
5. Run `npm run validate -- data/<name>.json`. Fix validation errors in the JSON itself. Preserve IDs for unchanged concepts when updating a dataset. Do not change application code to register a dataset.

The app watches `data/`. Save complete, valid JSON snapshots as the hierarchy develops so the user can follow along. Start with a small valid tree and expand it. While a file is incomplete or invalid, the app keeps its last valid version visible. Stable IDs preserve selection, collapsed branches and subtree focus across updates.

Datasets stay local and are ignored by Git. Do not commit them or force-add ignored files.

The visualization belongs in this app. Do not produce an inline report, screenshots or an alternate visualization unless explicitly requested. Finish with a short link to the dataset in the app.

For dataset-only changes, use schema/tree validation; do not run builds or broad test suites.
