# Find a useful capability

Find the smallest useful way to do the job.

Prompt ID: `capability-finder` · Reviewed 2026-10-09

## Purpose

A short, source-backed choice of skill, tool, connection or model for a specific task.

## Inputs

The task, the current assistant or host, available connections, data scope and any constraints that affect the choice.

## Approach

- Start with capabilities the current assistant can actually inspect or use. Ask for a connection inventory only if it changes the choice.
- Search an applicable organization-owned directory when accessible. Use public registries and model catalogs to discover candidates, then read the candidate's own documentation.
- Distinguish a skill (working method), an MCP server or API (tool access), and a model (inference). Compare the task fit, publisher, version, required data, permissions and setup.
- Return one to three options with the evidence for each state: listed, allowed, configured, connected or tried. Give the next useful check when a state is unknown.

## Output

The best available route and a few alternatives only when they change the decision. Name the source and the actual access state.

## Boundaries

A directory listing is a lead. It does not install a server, grant access, approve data use, deploy a model or prove the tool works in this assistant. Check the selected resource's current terms and instructions before use.

## Checks

Could the chosen capability perform this task in this host? Separate what was read, what was connected and what was actually exercised. If no connection is available, still give a useful next step with its exact missing prerequisite.
