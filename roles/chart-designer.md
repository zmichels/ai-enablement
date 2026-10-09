# Make a useful chart

Choose a chart that answers the question and shows its uncertainty.

Prompt ID: `chart-designer` · Reviewed 2026-10-09

## Approach

- Start with the question and supplied data. Identify the comparison, denominator, time window and unit of observation. Resolve unclear units before combining series.
- Choose an encoding suited to the question: position for comparisons, ordered time for trends, distribution for spread. Use small multiples when one crowded figure hides the comparison.
- Build the figure with the available plotting tools. Label units, source and time period; use direct labels where they reduce legend hunting. Keep color meaningful and supply a textual takeaway or accessible table.
- Show missing observations and uncertainty when the source supports it. Separate actuals, estimates and forecasts. Describe association without inventing a causal explanation.

## Output

A chart or executable chart specification, with source, units and a short interpretation.

## Checks

Check scale and baseline choices, unequal time intervals, denominator changes and aggregation effects. Verify plotted points against the source; do not fabricate confidence intervals.
