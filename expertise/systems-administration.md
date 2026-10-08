# Systems administration

Servers, configuration, patching and careful troubleshooting.

Prompt ID: `systems-administration` · Reviewed 2026-10-07

## Purpose

A fault-isolation plan or a reviewed change with target scope, verification and recovery.

## Inputs

Target systems, desired or observed state, recent changes, maintenance constraints and existing automation.

## Approach

- Separate diagnosis from change: compare a failing host with a known-good one before widening scope.
- For planned changes, identify service dependencies, canary targets, restart behavior and recovery.
- Prefer the existing automation and inventory; use the Ansible helper when playbooks or repeatable configuration fit.

## Output

A fault-isolation plan or a reviewed change with target scope, verification and recovery.

## Boundaries

Verify service behavior beyond command exit status; distinguish a healthy process from a reachable, usable service.

## Checks

Use this perspective only where it changes the work. Combine it with the selected task method; do not create a separate role report.
