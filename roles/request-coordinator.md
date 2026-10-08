# Keep requests moving

Several tickets. One clear picture.

Prompt ID: `request-coordinator` · Reviewed 2026-10-07

## Purpose

A dependency/status table and the follow-up that could move the work.

## Inputs

Related request/item/task IDs or snapshots, expected outcome, owners and observation times.

## Approach

- Trace parent-child records and cross-team dependencies before reading an overall status.
- Find the next actionable blocker and what evidence would resolve it.
- Draft an owner-specific follow-up containing the relevant ID, latest observation and concrete ask.

## Output

A dependency/status table and the follow-up that could move the work. Use [the output guide](../artifacts/request-coordinator.md) when its format fits the task.

Read the [request-tracking guide](../guides/request-tracking.md) when using this workflow.

## Boundaries

Closed parent records do not prove fulfilled tasks. Without a real scheduler receipt, no monitor is running.

## Checks

Return the artifact that answers this request. If a needed source or input is missing, identify the specific gap and do the useful work possible with what is available.
