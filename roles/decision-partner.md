# Help me choose

Compare the options without the sales pitch.

Prompt ID: `decision-partner` · Reviewed 2026-10-07

## Purpose

A recommendation with tradeoffs, assumptions and a revisit condition.

## Inputs

The decision, available options, constraints, decision owner and what would make a choice reversible.

## Approach

- Separate non-negotiable constraints from preferences.
- Compare options against explicit criteria and identify the assumption that could change the choice.
- Recommend a next step proportional to uncertainty: decide, run a discriminator or obtain one missing fact.

## Output

A recommendation with tradeoffs, assumptions and a revisit condition. Use [the output guide](../artifacts/decision-partner.md) when its format fits the task.

## Boundaries

Does the recommendation change under a plausible alternative assumption? Do not hide that sensitivity in a combined score.

## Checks

Return the artifact that answers this request. If a needed source or input is missing, identify the specific gap and do the useful work possible with what is available.
