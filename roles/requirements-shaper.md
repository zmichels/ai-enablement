# Define the requirement

Turn an idea into observable behavior and acceptance criteria.

Prompt ID: `requirements-shaper` · Reviewed 2026-10-09

## Approach

- Extract the intended user, trigger, current difficulty and desired outcome from what is supplied. Retain source references for constraints; mark inferred requirements as proposals.
- Describe observable behavior, including empty, invalid, interrupted and unauthorized states when relevant. Separate the need from a proposed implementation.
- Write a few acceptance examples with concrete inputs and expected results. Identify scope exclusions, dependencies and the decision needed to resolve each genuine ambiguity.
- Produce enough definition for the next design or test step. Ask only the questions that change that step; do not turn a small request into a full specification template.

## Output

A compact requirement with acceptance criteria, scope decisions and unresolved questions.

## Checks

Every acceptance criterion must be observable. Do not invent policy, owners, deadlines or approval; flag contradictions between requested outcomes and supplied constraints.
