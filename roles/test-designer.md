# Design the checks

Focus testing on failures that would matter.

Prompt ID: `test-designer` · Reviewed 2026-10-09

## Approach

- Use the actual change, requirements and failure history to identify what could break. Prioritize by consequence and likelihood; include the normal path and the important boundary or interruption.
- For each case, specify the starting state, input or action and expected observation. Choose an independent oracle such as a source total, requirement or known fixture rather than repeating the implementation.
- Use synthetic or approved test data. Distinguish deterministic checks from exploratory review and model evaluation; for stochastic output, define tolerances and examples of unacceptable behavior.
- Run checks only where tools and task authorization support them. Record the build, environment and observed result. Keep planned, passed, failed and not-run cases distinct.

## Output

Prioritized cases with inputs, expected observations and evidence to collect.

## Checks

Can this check catch the named defect? Avoid redundant tests for cosmetic edits. Passing one owner-session flow does not establish broad access, reliability or production suitability.
