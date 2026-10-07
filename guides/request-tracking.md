# One task, several requests

Use this with [Find the right request](../roles/request-navigator.md) and [Keep requests moving](../roles/request-coordinator.md). A facilities repair, a new starter or a server provision may all need more than one team.

## Begin with the outcome

State what “done” means for the person asking. Find existing requests before creating more. Identify which steps depend on others; parallel requests are useful only when their prerequisites are ready. Ticket creation, assignment, completion and the overall outcome are different milestones.

## Keep a small shared record

For each request, keep its verified ID and link, purpose, owning team as recorded, dependencies, latest source status, last observed time and next action. Retain the source and observation time of each update. Leave unknown owners or dates unknown. Separate requested dates from agreed dates and forecasts. Use the [tracker template](../artifacts/request-coordinator.md).

A ticket marked closed does not prove the overall task works. Record the service owner's completion evidence or the relevant acceptance check. Do not merge a parent request, its items and fulfillment tasks into one invented status; preserve their relationships as the source exposes them.

## Check, compare, summarize

Read only the agreed requests and sources. Compare the current observation with the previous saved observation. Report changes, blockers, missing access and the next useful action. If a read fails, retain the prior status with its old timestamp and label the new check unavailable. Do not present cached or inaccessible data as a fresh result.

A useful update: “The access request is complete. The equipment request is still waiting for a delivery date. Setup can start after delivery; no action is needed from you today.” Every claim should trace to an actual observation.

## Follow up without becoming the problem

Prepare a short question that names the request, dependency and answer needed. Send it only with explicit authorization covering the recipient, channel and purpose. Check for recent updates or messages before sending; keep a sent-message record to prevent duplicates. Respect the team's stated escalation path. No invented urgency, deadlines or service-level agreements.

If creation or sending times out, check whether it succeeded before retrying. “Attempted” stays separate from “confirmed.” Do not attach private ticket content to a wider audience than authorized.

## Optional scheduled checks

The launch page does not schedule or run anything. An assistant with an available scheduler can configure checks after the user requests them and these details are established:

- Exact requests and source system; how the scheduled run can access them.
- Cadence and time zone, where the prior snapshot is saved, and when monitoring ends.
- Which changes warrant a notification, where it goes, and what counts as a blocker.
- Read-only checks versus separately authorized ticket edits or outbound follow-ups.

Confirm the actual schedule identifier and next run after creation. If scheduling or access is unavailable, return a reusable manual check prompt and state that no monitor is running. Stop or revise the schedule when the task completes or the user asks. Avoid routine unchanged updates unless requested.

## Small practice case

A new server needs three teams: capacity is approved, network setup is waiting for an address range, and backup enrollment cannot start until the server exists. No live ticket IDs are provided. Produce a dependency list and draft the question about the missing range. Do not claim to check, submit or follow up on real tickets.
