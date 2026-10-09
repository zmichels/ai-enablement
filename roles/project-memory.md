# Remember and learn as we go

Keep useful ideas, decisions and lessons close at hand.

Prompt ID: `project-memory` · Reviewed 2026-10-08

## Purpose

Maintain a small, usable project memory alongside the work. Selecting this capability requests ongoing capture and retrieval without requiring the user to repeat these instructions in each task.

## Inputs

The current conversation, project context and authorized artifacts, plus any existing ledger or handoff notes. If the project is not yet identified, ask only which work to support; do not ask the user to describe this capability again.

## Approach

- Set up or extend one small structured JSON ledger and a short human view in the authorized project workspace. Use the project-learning-ledger skill and its schema when accessible; if they are unavailable, preserve the fields below in a clearly provisional record and name the schema gap. If files cannot be saved, return a clearly unsaved draft.
- Keep this selected capability active alongside the main task even when the task never mentions memory, ledgers or learning. Do the main work first; batch recordkeeping at natural pauses. Capture explicit requests and occasionally notice consequential ideas, decisions, corrections, connections, open questions and possible measures. Skip routine recap and duplicates; combine lessons from other selected methods into this same ledger.
- Preserve stable IDs, scope, source locators, evidence and adoption states, typed links, revisit triggers and supersession history. Keep ideas as proposals until supported; a saved decision does not confer execution authority. Retrieve relevant records at resumption and before related decisions, checking freshness and contrary evidence.
- Keep the format ready for optional Decision-PGA analysis: preserve record hierarchy and, when observations exist, population, case, run, stage, measurement protocol, candidate-space and configuration versions. Use explicit mappings between fine and coarse candidates. Keep absent scores null with a reason and text embeddings separate from decision-support vectors. Recording this structure does not require starting an analysis or inventing measurements.
- Turn a promising lesson into the smallest testable improvement within the agreed scope. Record actual outcomes, limits and the changed artifact before adopting guidance. Briefly report meaningful saved updates; continue quietly when nothing warrants capture. Leave a current-state pointer for the next session.

## Output

The requested work plus a maintained project ledger, a brief current-state view and any next useful check. When selected alone, set up the memory using available context or ask which project it should support. The [skill](../skills/project-learning-ledger/SKILL.md), [JSON contract](../skills/project-learning-ledger/assets/ledger.schema.json), [empty ledger](../skills/project-learning-ledger/assets/ledger.empty.json) and [analysis adapter guide](../skills/project-learning-ledger/references/data-contract.md) supply the portable format and optional analysis path.

## Boundaries

This is project-local recordkeeping and tested reuse, not automatic model training or a background monitor. Do not let it replace the main task, expand permissions, promote speculation into fact, or edit global instructions. Persist only in the authorized workspace; later agents must actually load the saved records.

## Checks

Can another session recover the current decision, its source and uncertainty, what changed, and the next check? Verify that stored files exist before claiming persistence, that superseded rationale remains recoverable, and that any numerical observations retain their sampling and version context.
