# Portable records, graphs and Decision-PGA inputs

The canonical record is JSON conforming to [ledger.schema.json](../assets/ledger.schema.json). Start with [ledger.empty.json](../assets/ledger.empty.json). All analysis collections can remain empty while ordinary ideas and decisions accumulate. Keep a small Markdown view for people, using the same stable record IDs.

## Three representations with different jobs

| Representation | What it helps with | What it does not establish |
|---|---|---|
| Text records plus typed links | Retrieval, a concept map, dependencies, alternatives and the reasons behind a decision | A graph edge marked inferred is not an observed causal relationship. |
| Derived text embeddings or feature vectors | Similarity search, grouping related ideas, or an exploratory display | Similarity, layout distance and arbitrary numerical features are not categorical probabilities. |
| Repeated support distributions over defined candidates | Decision-PGA clouds, coarse/fine views and run-by-stage trajectories | Stable or concentrated support does not establish correctness, learning or permission to act. |

Keep the text and links even when deriving vectors. A visualization should let a reader follow a plotted item back to its record, observation, source, scope and state. For connections that are difficult to juggle, start with a filtered graph or table; use probability geometry when the question and observations support it.

## Collections and identity

| Collection | Key fields and purpose |
|---|---|
| `records` | Stable `id`, kind, title/text, scope, parent record, source, evidence state, decision/adoption state, revisit trigger and change history. Metric records add an operational definition. |
| `relations` | Stable `id`, `from`/`to` record IDs, relation type, observed/inferred/proposed basis, reason and source. `supersedes` points from the replacement to the older record. |
| `spaces` | Immutable candidate-space ID/version, question, granularity (`level`), ordered labels and their meanings. An optional parent mapping defines a coarse partition. |
| `protocols` | Immutable measurement-protocol ID/version, method, provenance, and whether values are explicit assessments, sample frequencies, model probabilities or synthetic. |
| `populations` | Population ID, eligibility/definition, sampling unit and plan, and comparability limits. A named cohort is not automatically a representative sample. |
| `configurations` | Workflow, model, prompt, tool and data revisions. Unknown values remain null. A material change gets a new configuration ID. |
| `runs` | Population and configuration IDs, case ID, repeat index, start time and separately checked outcome. Keep case identity stable across repetitions and appropriate before/after comparisons. |
| `observations` | Stable ID, record/run/space/protocol IDs, stage and sequence, support vector or null, missing reason, and source. Add observations rather than overwriting previous stages. |
| `measurements` | Actual numeric metric value or null, metric-record ID, run ID, source and missing reason. Unit, denominator and limits come from the referenced metric definition. |

The `source` object records a real locator, observation date and source revision; dates/revisions can be null if unknown. Free text can explain a short conversation locator. Never invent a message URL or convert an agent hypothesis into a user decision. Actual sensitive records remain in the authorized project workspace.

The schema checks shape; [ledger.py](../scripts/ledger.py) also checks identities, references, hierarchy/supersession cycles, vector dimensions and sums, missingness and scale mappings. It cannot establish the truth of an evidence claim or whether two populations are scientifically comparable.

## Sampling, scale and learning questions

Keep these comparison units separate:

1. **Within a run:** how support changes after a lookup, correction or tool result. Preserve ordered stages, including failures or missing observations.
2. **Repeated runs of one case:** how a configuration varies under a stated repetition/sampling protocol. Repeated measurements of the same case are not new independent cases.
3. **Across cases or populations:** whether a pattern recurs for defined types of work. Record eligibility, strata and sampling coverage; avoid letting an over-sampled case silently stand for the population.
4. **Across revisions:** compare appropriate cases and outcome checks before/after a change. Different models, source sets, prompts or case mixes can confound an apparent improvement.
5. **Across levels:** inspect broad action choices and finer alternatives while keeping their relationship explicit. Project/task/subtask record hierarchy and candidate granularity are different dimensions.

For a coarse/fine view, every fine label must map to exactly one coarse label, every coarse label must be covered, and the decision question must stay the same. The exporter sums the declared groups; it does not average unrelated states, infer a partition from wording, or discard the fine observations. Multi-level mappings can be followed up the declared parent chain. Overlapping concepts belong in graph relations or separately designed spaces, not an invented partition.

Different dimensions and candidate meanings change the geometry. Do not directly equate a fine-space spread with a coarse-space spread, pool levels into one cloud, or treat their metric differences as improvement. Compare like-defined populations at each level and examine where the refinement reveals structure. An observation of better outcome is still needed to support a learning claim.

## Optional Decision-PGA export

The adapter targets the upstream [probability-cloud example](https://github.com/zmichels/Decision-PGA/blob/8dfcd3e76abec20ef4522e9bb74fd1a7290a76fb/examples/probability_cloud.json) and [kinematic-trajectory contract](https://github.com/zmichels/Decision-PGA/blob/8dfcd3e76abec20ef4522e9bb74fd1a7290a76fb/docs/kinematic-trajectory.md), inspected 2026-10-08. It emits `source`, ordered `labels`, and either `probabilities` (runs × labels) or `steps` plus `runs` (runs × stages × labels). A `metadata` receipt preserves selection, mappings, counts, observation IDs, case/repeat IDs, outcome states, and a hash of the canonical ledger. Retain this input receipt alongside the external diagnostic output.

From the skill folder, using Python 3.10 or later:

```bash
python3 scripts/ledger.py validate assets/ledger.synthetic.json

python3 scripts/ledger.py cloud assets/ledger.synthetic.json \
  --population baseline --config config-v1 --record PM-001 \
  --space handoff-fine-v1 --protocol synthetic-v1 --stages review > fine-cloud.json

python3 scripts/ledger.py cloud assets/ledger.synthetic.json \
  --population baseline --config config-v1 --record PM-001 \
  --from-space handoff-fine-v1 --space handoff-coarse-v1 \
  --protocol synthetic-v1 --stages review > coarse-cloud.json

python3 scripts/ledger.py trajectory assets/ledger.synthetic.json \
  --population revised --config config-v2 --record PM-001 \
  --space handoff-fine-v1 --protocol synthetic-v1 \
  --stages input,context,review > revised-trajectory.json
```

Use fresh output filenames to preserve previous exports. The bundled fixture has two explicitly synthetic populations, two cases with two repetitions each, three stages, and two candidate scales. All outcome checks remain unmeasured. These invented vectors exercise the format; they are not evidence that a checklist improved.

The exporter requires an explicit population, configuration, record, candidate space, measurement protocol and stage selection. It never pools them automatically. By default an incomplete run blocks export. `--allow-incomplete` explicitly excludes incomplete runs and lists each exclusion and reason in the receipt; it never fills gaps with zeros. At least two complete runs are required here, but two runs are not a claim of statistical adequacy. Each included run has equal weight, so check case balance before interpreting a cloud.

If the user already has a suitable Decision-PGA installation, its CLI can read the exports:

```bash
decision-pga diagnose --pretty fine-cloud.json
decision-pga diagnose --pretty revised-trajectory.json
```

Decision-PGA is an external research prototype, not vendored or automatically installed by this skill. Check compatibility when changing versions. The adapter does not calculate arbitrary feature-space PGA, text-embedding geometry, automated subgroup discovery, formal significance, or causal effects. Read the [article series](https://zmichels.github.io/decision-pga-pages/article/) for the wider approach.

## Retrieval and other downstream analysis

```bash
python3 scripts/ledger.py documents assets/ledger.synthetic.json > records.jsonl
```

This gives one stable record ID and retrieval text per line, with full record metadata and incident links. A vector store adapter can embed that text after checking the destination's data permissions. Retain project ID, source hash/revision, embedding model/version, preprocessing, dimensions and metric with any derived vectors; re-embed changed records and follow supersession. The command itself does not send data anywhere or create embeddings. The original JSON remains the graph and observation store.

## Verification status

On 2026-10-08, the empty and synthetic ledgers passed the JSON Schema draft 2020-12 contract and the bundled integrity checks. Tests cover coarse and multi-level aggregation, explicit population/configuration selection, run and case lineage, missingness, trajectory ordering, duplicate observations, invalid vectors, graph references and provenance. Eight synthetic exports (two populations × two scales × cloud/trajectory) were accepted by the upstream `diagnose_payload` at the pinned revision above. Skill frontmatter and package links were also checked.

These checks establish format and adapter behavior on those fixtures. The conversational capture prompts have not completed an independent host trial, and no real-world learning improvement is claimed. The practice cases in the worked example are for that next evaluation.

Return analytical findings to the ledger as attributed ideas or evaluated lessons: which observation IDs informed the finding, what was tested, the actual outcome, and the condition for revisiting it. This closes a learning loop without allowing a visually compelling pattern to certify itself.
