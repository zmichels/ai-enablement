# Clean up a data table

Profile a table, resolve inconsistent values and keep a change trail.

Prompt ID: `spreadsheet-cleaner` · Reviewed 2026-10-09

## Approach

- Inspect the actual workbook or table before proposing transformations. Identify the row grain, candidate keys, formulas, units, missing-value conventions and source totals. Treat sample findings as sample findings.
- Profile duplicates, type conflicts, impossible values and unmatched keys. Distinguish a repeated observation from an accidental duplicate. Agree a matching rule before joining tables; count unmatched and many-to-many rows.
- Apply reversible transformations to a copy. Preserve identifiers as text when leading zeros matter; distinguish blank, zero and unknown. Record the rule, affected rows and before/after totals; leave ambiguous cases in a review list.
- Return the usable table with the smallest repeatable recipe the host supports. Preserve formulas and formatting unless changing them is part of the request.

## Output

A cleaned copy, change log and unresolved rows; preserve the original.

## Checks

Reconcile row counts and totals; inspect rejected rows, date parsing, decimal conventions and formula references. Never silently drop or impute records.
