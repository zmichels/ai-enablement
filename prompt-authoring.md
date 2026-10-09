# How these prompts are built

A reusable prompt should tell the assistant what to help with, what it can use, how to work and what a useful result looks like. It should also say where its claims and actions stop. A role name alone does not do that.

## Our small contract

Only **Approach** is required: the specific method that changes what the assistant does. Add the other sections when they earn their place; leave them out when they would repeat generic advice. The [minimal template](prompt-template.md) and [contract](prompt-contract.json) make that explicit.

| Section | The question it answers |
|---|---|
| Purpose | What help is this for? |
| Inputs | What does the assistant need, and what if something is missing? |
| Approach | What specific behaviors make this role useful? |
| Output | What should the user actually receive? |
| Boundaries | What must remain true about facts, access and actions? |
| Checks | How should the assistant check its result before returning it? |

These sections organize the prompt, not every answer. Someone asking for a two-line email should receive a two-line email, not a six-section report.

## Sources and deliberate choices

- Anthropic's [prompting guidance](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) recommends clear instructions, relevant context, roles, examples and explicit output expectations. We use readable Markdown sections to keep those concerns distinct. This is a portable house style, not a claim that all models behave alike.
- The [Agent Skills specification](https://agentskills.io/specification) describes a packaging format with a SKILL.md entry point and supporting resources that can be loaded as needed. We borrow the idea of small modules and selective loading. This catalog is plain prompts and context; it is not automatically an installed or specification-compliant Skills package.
- [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) defines requirement words, and [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174.html) clarifies their uppercase use. In this package, **MUST / MUST NOT** mark a required boundary, **SHOULD** a default that can have a justified exception, and **MAY** an option. This is a writing convention, not a mechanism for overriding an assistant's instructions or guaranteeing compliance.

Sources checked 2026-10-07. No universal agent-authoring standard is asserted by this package.

## Combining expertise

Work-area prompts supply perspective; help roles supply methods. A combined helper is instructed to choose the relevant contributions, resolve overlap and produce one useful result. It should surface a real conflict instead of inventing consensus. The browser assembles these instructions deterministically; the receiving assistant adapts them to the actual task.

The builders include the relevant method, useful artifact and task-specific check. Full guides remain available by link instead of being pasted into every brief. Each item’s sidecar supplies activation cues and explicitly phrase-matched variants, such as diagnosing a failed playbook versus planning a patch rollout. These suggestions are deterministic and fallible; the receiving assistant should discard a mismatch.

Item sidecars also hold optional search aliases, use cases and explained connections. The generated indexes feed both builders; edit the sidecar rather than the generated catalog. A curated connection is an editorial suggestion, not evidence of successful use.

The resource shelf names the kind and availability of each reference. An automation collection, a document, an agent skill and an installed tool are different things. Public builders contain public references only.

Optional **Tailor this with AI** sends a reviewed brief to a host-configured model. It asks the model to select an approach and a concrete first artifact, reconcile methods and preserve user constraints. The page labels the output as a draft and validates referenced capability IDs. That validation cannot establish that the model’s reasoning or factual claims are correct.

## Write for an already capable assistant

Keep guidance that changes a decision: a diagnostic split, an overlooked dependency, a useful output, a source requirement or a domain-specific failure check. Delete advice that could be pasted unchanged into every role. “Be thorough and helpful” is not a specialist method. Neither is a persona title.

For example, server troubleshooting should distinguish connection, privilege, module and service failures; queue improvement should distinguish ordering, payment, preparation and pickup. Neither needs a paragraph announcing expertise.

## Try a prompt before trusting it

Use a typical task, a missing-input case and a case that tempts the assistant to overreach. Look for a useful result, sensible questions, honest sources and no claim of actions it did not take. Record the model/tools and observed result. Package tests validate structure, references and assembly; they do not establish real-world effectiveness. Use [the exercise](exercise.md) for a practical trial.

Keep [the cheat sheet](prompt-cheat-sheet.md) close. A little experimentation is part of learning what helps.
