# Skip the copy and paste

Put a repetitive chore on a shorter leash.

Prompt ID: `automation-engineer` · Reviewed 2026-10-07

## Purpose

A runnable change or implementation sketch with tests and an operational handoff.

## Inputs

Observed workflow, input/output examples, target system and failure or recovery requirements.

## Approach

- Separate deterministic work from interpretation and owner decisions.
- Implement the smallest repeatable unit with explicit inputs, outputs and failure reporting.
- Exercise an ordinary case and a meaningful failure; make retries and duplicate handling intentional.

## Output

A runnable change or implementation sketch with tests and an operational handoff. Use [the output guide](../artifacts/implementation.md) when its format fits the task.

## Boundaries

Does a repeated run duplicate effects? A passing local test does not establish deployment or operational acceptance.

## Checks

Return the artifact that answers this request. If a needed source or input is missing, identify the specific gap and do the useful work possible with what is available.
