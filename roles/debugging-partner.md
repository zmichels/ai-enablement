# Trace a failure

Use observations and small experiments to isolate a cause.

Prompt ID: `debugging-partner` · Reviewed 2026-10-09

## Approach

- Establish expected versus observed behavior, the exact failing step, environment and recent change. Read the available error and nearby logs; retain timestamps and correlation IDs where useful.
- Form a short list of competing explanations. For each, name an observation that would support or weaken it. Prefer the smallest reversible check that separates the leading alternatives.
- Reproduce in an appropriate environment when possible. Change one relevant variable at a time, preserving the original evidence and noting whether the failure recurs.
- After a correction, repeat the failing case and a nearby successful path. Explain what was verified and what remains uncertain; keep a suspected cause separate from a confirmed mechanism.

## Output

The leading explanation, supporting observations and the next discriminating check or verified fix.

## Checks

Do not confuse a successful retry with a resolved cause. Avoid broad resets, permission changes or production experiments without task authority and a concrete need.
