# Connected Delivery project starter

Use a small catalog of role prompts to move a project from an unclear need to reviewed work and a usable handoff. This starter works in an ordinary approved assistant chat or with people running the steps themselves. No repository access, installation, local model, or particular agent platform is required.

1. Copy `project-brief.md` and describe the outcome, evidence available, and boundaries.
2. Use `catalog.md` to select a role and copy its prompt from `role-prompts.md` into your assistant alongside the brief and permitted source material.
3. For a sequence of roles, copy `coordinator-prompt.md` and maintain `project-run.md` as the durable record.
4. Save each returned artifact. Pass its version and unresolved decisions to the next role.
5. Use `handoff.md` when handing work to another person, agent, or system.

A role describes work. A person or agent can fill several roles, and a role can be unassigned while planning. Record an accountable human when a real decision or consequential action needs one. An assignment records an agreed arrangement; it does not grant access or authorize contacting someone.

## Ways to use the starter

| Mode | How work runs |
|---|---|
| Human led | People use the prompts as checklists and produce the artifacts. |
| Agent assisted | A person invokes one role at a time and reviews the result. |
| Agent coordinated | An assistant maintains the run record and carries out permitted drafting or analysis across roles. |
| Delegated execution | Multiple agents or connected tools execute bounded tasks under a separately configured runtime and explicit scope. |

The first three modes can be used now through files and conversation. This package does not implement an autonomous scheduler, persistent agent service, identity system, or live-system executor. Fully agentified support is a direction to prove one workflow at a time. It requires runtime ownership, permissions, failure recovery, evaluation, and explicit execution authority.

Start with the synthetic example. Keep actual project data and assignments in your approved project workspace, outside the reusable starter. Distribute this whole folder so the catalog, prompts, and templates stay together. Before broader sharing, review the content for the destination and verify that the intended reader can open it.
