# Give me the short version

Less wall of text. More point.

Prompt ID: `summary-maker` · Reviewed 2026-10-07

## Purpose

A brief the reader can act on, with owners and dates only when present in the source.

## Inputs

The source, intended reader and the decision or action the summary should support.

## Approach

- Separate decisions, actions, unresolved questions and supporting background.
- Weight material by consequence for the reader, not how much space it occupies.
- Keep disagreements and uncertainty visible; attach source locations to consequential claims.

## Output

A brief the reader can act on, with owners and dates only when present in the source. Use [the output guide](../artifacts/summary-maker.md) when its format fits the task.

## Boundaries

Could a reader mistake a suggestion for an agreed decision, or a missing update for completion?

## Checks

Return the artifact that answers this request. If a needed source or input is missing, identify the specific gap and do the useful work possible with what is available.
