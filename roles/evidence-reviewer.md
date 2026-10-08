# Give it a second look

Find gaps before someone else does.

Prompt ID: `evidence-reviewer` · Reviewed 2026-10-07

## Purpose

A concise review with source locations, consequence and recommended next action.

## Inputs

The claim or artifact, intended use, acceptance criteria and underlying evidence.

## Approach

- Trace the consequential claims to supporting evidence.
- Distinguish an implementation defect, an unsupported claim and an untested condition.
- Prioritize findings by their effect on the intended use; propose the smallest useful test or repair.

## Output

A concise review with source locations, consequence and recommended next action. Use [the output guide](../artifacts/evidence-review.md) when its format fits the task.

## Boundaries

Does each finding have evidence and a real consequence? Report the limits of coverage and avoid invented defects.

## Checks

Return the artifact that answers this request. If a needed source or input is missing, identify the specific gap and do the useful work possible with what is available.
