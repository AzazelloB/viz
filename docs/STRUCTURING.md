# Structuring a tree

A tree explains a subject through a chosen set of relationships. Software also has dependencies, memberships, shared components, and navigation links. Not every one of those relationships must become a parent-child edge. The author makes a sourced editorial choice; static analysis cannot make that choice on its own.

The canvas works entirely through its labels and hierarchy. Placement reasoning and evidence belong in the author/reviewer conversation or scratch notes. The dataset supports only a title, a root, and nodes with IDs, labels, and children.

## Review an edge

For an ambiguous child, privately answer:

1. What does the parent mean here? Does it keep that meaning further down the branch?
2. What is the child: a part, property, member, kind, local operation, or implementation constituent?
3. What source establishes that relationship, beyond proving both concepts exist?
4. Is this the operation's primary subject, or merely a dependency it uses?
5. Would another parent express the scope better? Would moving it fragment a feature that should be understood together?

Do not expose this as a mandatory five-field record on every node. Spend the effort on actual ambiguities.

## Examples

| Situation | Useful distinction |
| --- | --- |
| A library searches books and authors | Search belongs at the scope covering both. Putting it under Books just because it reads book text narrows its apparent subject. |
| Borrowing a book checks a member's eligibility | Borrowing can stay with Books. An eligibility dependency alone does not make it a constituent of Members. |
| Albums and playlists both contain tracks | Tracks may appear in both contexts. These occurrences need different IDs, not different synonyms. Membership does not imply that the underlying track has two owners. |
| An album contains tracks, while a track lists its album | Both relationships are true. Repeated ancestor labels merit review for a possible reversal or circular explanation, but can also be an intentional contextual reference. |
| A preference supports light and dark palettes and follows the device until saved | Palette choices and the source of a preference answer different questions. Separate those distinctions locally; there is no need for parallel frontend/backend inventories. |
| A process has input, decisions, and assignments | These can explain its constituents. Nesting consecutive actions merely because one runs after another does not explain containment. |
| A confirmation screen and an order record both expose status | Their values can differ. Verify persisted values against the writer, not just similarly named screen messages. Integration of a feature's layers does not make their contracts interchangeable. |
| A parent has only one child | Keep the parent if it expresses a real distinction. A single-child branch is not inherently bad. Remove it when it merely rephrases the child. |

## Review a branch

Read the labels from a meaningful ancestor down. Check:

- **Identity:** labels have stable meanings; an entity does not silently become a catch-all feature area.
- **Scope:** operations covering peers are not buried under only one of them. Shared use is not mistaken for ownership.
- **Integration:** a feature's content, interaction, and implementation remain together where that helps. Screens and component names do not create a second copy of the subject.
- **Context:** repetitions explain membership or a different local role. They do not need to be globally unique, and repetition should not be disguised with synonyms.
- **Decomposition:** intermediate nodes reveal meaningful distinctions. Depth follows the subject; width and depth are not quality scores.
- **Evidence:** sources support the concept and the edge. File existence, shared keywords, and a matching name are insufficient evidence for placement.

The question is what relationship a reader would infer from the tree, not whether the author can invent a sentence that defends it. If the label needs a different meaning to justify each child, reconsider the scope.

## Simplicity pass

Choose the smallest explanation that preserves the subject's important distinctions. There is no deterministic test for preserved understanding, so use deletion as a review operation rather than a node-count target:

1. Identify what the branch must teach the reader.
2. Consider removing a node, promoting its children, or merging a repeated rule.
3. Ask what important distinction would be lost. If the answer is only a routine code check, UI button, or bookkeeping consequence, omit it unless that is the requested subject.
4. Re-read the simpler branch. Retain depth when it exposes a real mechanism; do not manufacture intermediate concepts to make the tree look thorough.

For example, a single-contribution policy and a prior-contribution eligibility check usually express one rule at two enforcement points. Keep the rule at their useful shared scope. “Remove answer” does not ordinarily need a second “Remove answer” button node, an Eligibility wrapper, and a Cleanup subtree of database effects. A voting feature can often be explained by what receives votes and whether a vote can be changed or removed; its counter arithmetic is a separate detail to include only when that distinction matters.

This is an Occam-style preference between explanations with equivalent useful coverage. A numerical complexity score cannot determine which facts matter. The static tool therefore does not automatically prune or impose a node budget.

## Static review

`npm run review -- data/name.json` validates the file and reports a few observable patterns:

- Siblings whose labels match after case, Unicode, and whitespace normalization.
- A label repeated along its own ancestor path.
- Repeated non-leaf branches with the same ordered normalized labels and structure (at least three nodes), ignoring occurrence IDs. A group entirely covered by larger repeated branches is suppressed. If there is an additional uncovered occurrence, the group is retained with all its contexts for comparison.

These are review hints, not conceptual errors. Each includes occurrence IDs and full paths so the author can distinguish contexts. Matching branches can represent a genuinely shared structure. Common leaf labels under unrelated parents are deliberately not flagged. There is no synonym detection, concept-uniqueness rule, width limit, target depth, quality score, automatic rewrite, or requirement to eliminate hints.

`--json` emits all findings and structural statistics. The text report shows at most eight hints and four occurrence paths per hint. Neither format changes the input. Hints return exit code zero; malformed datasets or unreadable files return a nonzero code.

A hint-free report cannot establish good ownership. Conversely, intentional repetition may remain in a well-structured tree. Resolve hints against the subject and user preferences, not by cosmetic renaming.

## Testing an authoring workflow

Use a fresh-context author with these instructions and actual source access. Do not supply an ideal hierarchy or the current dataset as an answer to copy. Ask for a small representative slice containing local behavior, a cross-cutting operation, and a shared implementation.

Review the result against the questions above, including the simplicity pass. Include accepted repetitions and meaningful single-child branches, as well as redundant enforcement rules, incidental bookkeeping, misleading ownership, and duplicate inventories. Compare the useful distinctions retained and the facts omitted, not agreement on a target outline or a fixed count/depth. A successful trial demonstrates which decisions the workflow exposed; it does not prove repeatability across subjects or models.
