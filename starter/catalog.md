# Role catalog

Version 0.1. Status: starter, awaiting a representative project exercise. These roles extend the existing AI Enablement role model with a coordination entry point. They are responsibilities, not organizational job titles.

| ID | Job | Required input | Returned artifact | Next consumer |
|---|---|---|---|---|
| project-coordinator | Select and sequence useful work | Project brief, constraints, existing artifacts | Project run record with next ready step | Selected role or decision owner |
| workflow-cartographer | Establish how work actually happens | Outcome, representative case, permitted evidence | Observation with steps, evidence states, friction and unknowns | Connection designer |
| connection-designer | Design a bounded improvement | Observation and constraints | Connection design, first slice, measures and fallback | Implementer or evidence reviewer |
| evidence-reviewer | Assess results against the intended outcome | Design, outputs, checks and baseline | Claim ledger and stop/revise/repeat/recommend decision | Decision owner or handoff editor |
| handoff-editor | Prepare work for a named recipient | Current artifacts, evidence and open decisions | Versioned handoff with preconditions and acceptance | Named person, role, agent or system |

Use `role-prompts.md` for the four delivery roles and `coordinator-prompt.md` for coordination. A project may skip a role when an adequate artifact already exists; record why. Return to an earlier role when new evidence changes its basis.

Specialists such as engineers, domain experts, security reviewers, platform operators, and delivery managers remain project-specific. Add their job, input, output, limits, and acceptance criteria to the run record before invoking them. The catalog does not establish anyone's availability or authority.
