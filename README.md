# AI Enablement

A portable starter for helping people and agents understand work, coordinate useful roles, and turn experience into tested, reusable lessons.

## Tell your agent to start here

Clone or download this repository, then tell your assistant:

> Read START_HERE.md in this folder. Help me with this outcome: [describe the job]. Select the relevant modules, explain any missing context, and continue within my authorized scope.

For an assistant that can read web pages, provide [START_HERE.md](START_HERE.md) or its raw URL:

```text
https://raw.githubusercontent.com/zmichels/ai-enablement/main/START_HERE.md
```

The assistant needs access to the linked files as well as the entry point. Reading the package does not install software or start a background service.

## Choose a starting point

| Need | Start with |
|---|---|
| Understand or improve a workflow | [Role catalog](starter/catalog.md) and [copy-ready prompts](starter/role-prompts.md) |
| Coordinate a project across roles | [Project starter](starter/README.md) and [coordinator prompt](starter/coordinator-prompt.md) |
| Retain a useful result or failure | [Learning loop](learning-loop.md) and [lesson template](lesson-template.md) |
| Add your organization's context | [Optional context-pack contract](overlay-contract.md) |
| Evaluate whether the package helps | [Small-task exercise](exercise.md) |

Learning here means making an inspectable improvement to a test, prompt, template, procedure or skill. The method preserves evidence, applicability and counterexamples before a lesson is adopted.

The core works on its own. An organization can provide a separate context pack with scoped terminology and source references; private evidence and real project records belong in the authorized project workspace.

## Status

Version 0.1.0 is an initial starter. The package's references and distribution boundaries have automated checks; its practical benefit still needs representative project evaluation. Examples are synthetic. It does not provide a persistent agent runtime or change an agent's permissions.

The release manifest records the packaged source revision and SHA-256 hashes for the core files. Repository README and license are maintained alongside that exported core. Candidate labels in the catalog describe material awaiting broader evaluation; they do not imply that this repository is private.

## License

[MIT](LICENSE).
