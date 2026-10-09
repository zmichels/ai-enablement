# Give the project a memory

Good ideas have a habit of living three chats ago. Keep the ones worth finding again.

The [project-learning-ledger skill](../skills/project-learning-ledger/SKILL.md) helps an assistant notice useful ideas, decisions, connections and possible measures as work unfolds. It keeps a small record, retrieves what matters later, and tests a lesson before treating it as an improvement. It works for planning an event, improving a handoff, investigating a question or building software.

In **Build my helper**, select **Remember and learn as we go**, then click **Build helper prompt**. That selection includes the capability; the task box can stay blank. Combine it with any other helper to keep project memory alongside the main work. **Keep the lesson** remains a useful choice for one correction or reusable lesson.

You can also give your assistant the complete skill folder or paste the prompt below.

## A prompt to get going

```text
Help this project learn as we work. Use its existing decision or handoff records;
if none exists, start a small structured JSON ledger in this workspace using
the project-learning-ledger contract, with a brief Markdown view using the same IDs.
If you cannot save files here, give me copy-ready entries and say they are unsaved.

Capture things I ask you to remember. At meaningful discoveries, corrections,
decisions and natural pauses, also notice a few things that would be costly to
rediscover: useful ideas, assumptions, connections, questions or possible measures.
Skip routine recap and duplicates. Keep working; no ledger announcement is needed
when nothing meaningful changed.

Give records stable IDs, scope, source locators, evidence and decision states,
and a next check. Mark your own ideas as proposals. Distinguish what was observed,
what we decided and what action is authorized. Keep contrary evidence and preserve
old rationale when a decision changes. A metric idea needs a definition, data
source and limitation; no invented measurements.

At resumption or before a related decision, retrieve the relevant records and
check that they still apply. Turn a promising lesson into the smallest testable
improvement within our agreed scope. Record results and the changed artifact;
do not turn a saved suggestion into a universal rule or edit global instructions.

Keep a brief current-state index and leave a pointer for the next session.
Preserve typed links and, when observations exist, population, case, run, stage,
candidate-space and version identifiers for later analysis. Leave missing scores
missing; do not manufacture vectors. Keep text embeddings separate from decision
support distributions. Use explicit coarse/fine mappings for optional Decision-PGA
comparisons across scales, populations and repeated runs; check outcomes separately.
Tell me where meaningful updates were saved. Keep private context in its proper
workspace. Do not start a background monitor or claim model retraining.
```

## Make it fit your style

| Say this | What it changes |
|---|---|
| “Keep it quiet.” | Capture explicit requests and consequential corrections or decisions; batch the rest at handoff. |
| “Notice promising connections, too.” | Keep a few exploratory ideas with their uncertainty and a useful way to investigate. |
| “Let's study how we improve.” | Add definitions and before/after observations for agreed measures; the extra measurement work stays scoped. |
| “What have we learned that changes the next step?” | Retrieve applicable records and explain what they support now. |
| “This only applies to this project.” | Keep the lesson local rather than generalizing it to other work or people. |

Start with the [empty JSON ledger](../skills/project-learning-ledger/assets/ledger.empty.json) and a [short human view](../skills/project-learning-ledger/assets/project-memory.md). The [worked example](../skills/project-learning-ledger/references/example.md) shows an idea, a proposed metric and a corrected decision without pretending any of them has proved a result. The [learning loop](../learning-loop.md) covers evaluating and adopting reusable lessons.

Want to explore a tangle of ideas or patterns across repeated work? The [data contract and optional Decision-PGA adapter](../skills/project-learning-ledger/references/data-contract.md) preserve links, different scales, populations and run histories. You can begin with readable notes and add observations as there is something meaningful to measure.

Saved context becomes useful when an assistant reads and checks it. The skill does not supply background monitoring, automatic access to other chats, or guaranteed cross-session memory. It is an authored starter with practice cases; behavior in your agent still needs trying.

For the larger idea, read [Automation as a product that learns](https://zmichels.github.io/agents-evolve/), including its discussion of portable project memory and links to Decision-PGA.
