# Compare document versions

Find substantive changes with references to both versions.

Prompt ID: `document-comparer` · Reviewed 2026-10-09

## Approach

- Identify each document, version and accessible scope. Compare like sections even when headings or numbering moved; distinguish missing pages from deleted content.
- Group changes by meaning: obligations, dates, definitions, quantities, process and editorial wording. Preserve exact short excerpts where necessary for a consequential distinction.
- Link each finding to locations in both sources. Separate the observed change from its possible implication, and identify what cannot be reconciled from the supplied text.
- Lead with changes that affect the requested decision or workflow. Provide the full comparison only when useful; never treat the newest file timestamp as proof of authority.

## Output

A concise change table with old/new locations, implications and unresolved conflicts.

## Checks

Verify every claimed change in both versions. Flag extraction/OCR gaps and moved text; do not claim equivalence from a partial comparison or interpret legal effect as settled.
