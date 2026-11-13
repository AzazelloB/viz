# Authoring workflow trial

This was a small source-backed experiment on Concord, not a benchmark of model reliability or a proof that one hierarchy is correct. The local datasets remain ignored by Git. The reproducible parts are the prompts and review questions.

## Baseline

An independent reader reviewed the existing Concord dataset without the user conversation. The useful top-level parts and several detailed branches were retained, including Question, Duration, Answer limit, Feedback, voting totals, and the live-update machinery.

The review identified concrete problems:

- An accounting concept, Contributions, contained most of the application behavior.
- Answers contained Groups, which contained Answers again.
- Answer reading owned a search whose subjects included group titles.
- Results contained synchronization of the whole poll but omitted shared result exploration.
- An order status value contained a confirmation experience with polling and navigation.
- Answer counts included a group count.

The initial static report only surfaced the ancestor-label echo. It did not establish that the membership was wrong, and it did not discover the other ownership mistakes. This is why structural observations are advisory rather than a conceptual validator.

## Fresh-context author

The author received the project's revised instructions, the structuring guide, schema, and source access. It did not read existing JSON datasets or receive an ideal hierarchy. The task was:

> Inspect Concord and create a representative slice explaining poll answering, grouped results, search, live updates, and payment confirmation. Derive the hierarchy from the sources and current guidance. There is no target count, depth, or width. Keep labels short, retain useful contextual repetitions, and run validation and advisory review.

The author produced `data/concord-workflow-trial.json`. It independently kept Search outside the answer/group branches, put poll-wide Live updates outside either result context, represented group-member and pending answers as contextual occurrences, and placed payment-status application at the scope shared by notification and reconciliation callers. A meaningful single-child Owner access constraint was retained.

The trial passed format validation and had no static hints. A second fresh-context reviewer still found two material label weaknesses:

- “Creator name” appeared to mean a person's name, while the source established a creator-edited group title. It became “Custom title”; “Generated name” became “Generated title” for consistency.
- “Payment confirmation” covered refund/void processing as well as approval. It became “Payment status.”

Thus a hint-free report did not establish semantic quality. The instructions helped expose scope decisions but did not settle every reader's interpretation of a label. Those two local corrections were applied after review, not silently counted as first-pass success.

## Main dataset revision

The existing Concord dataset was revised rather than replaced with the smaller trial. Question, Duration, Answer limit, and the non-poll branches were preserved. Changes follow the reviewed relationships:

- Participation covers identity, the contribution rule, answer submission/removal, and voting.
- Results owns grouped/pending results, search, pagination, ranking, and statistics. Groups are no longer a descendant of Answers. Member Answers remains a useful contextual occurrence.
- Live updates sits at Polls scope because it synchronizes more than result rows.
- Confirmation is a Checkout constituent rather than a property of the Status value.
- Shared group processing explicitly names both grouping and naming as its jobs.
- Empty naming and answer-content wrappers were removed selectively. Meaningful depth and contextual repetitions were retained.

These are editorial decisions backed by source scope, not deductions made by the static tool.

A final source-backed spot review accepted those scopes but caught another factual mismatch: Cancelled was listed as an Order status because the return screen has a cancellation message. The payment writer normalizes provider `voided` into stored `refunded`. Cancelled was removed from the stored-status enumeration. This was an additional review correction, not something detected by the advisory checks.

## Focused verification

```sh
npm run validate -- data/concord.json data/concord-workflow-trial.json
npm run review -- data/concord.json data/concord-workflow-trial.json
```

The workflow adds no relation enum, globally unique concept rule, fuzzy synonym detection, shape target, quality score, or automatic restructuring. Further trials should use other subjects and a separate reviewer, retain disagreement, and compare concrete source-backed choices rather than the number of hints removed.

## Simplicity correction

Subsequent user review found that several technically defensible branches were still poor explanations: the contribution rule reappeared as an eligibility check, removal exposed database bookkeeping, and voting expanded into counter arithmetic. The earlier reviews had not tested whether each distinction earned its cost to the reader.

The guidance now requires a deletion pass and a minimum sufficient explanation. Routine checks, controls, and consequences are omitted unless their distinction matters to the requested subject. The Concord tree was simplified accordingly. This corrects the workflow rather than treating fewer static hints or greater detail as evidence of success.

The format and viewer now carry labels and hierarchy only. The earlier experiment's evidence was used for authoring and review; it is not a node-details feature or part of the current dataset format.
