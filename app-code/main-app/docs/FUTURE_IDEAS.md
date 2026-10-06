# Future product ideas

This is the central backlog for product ideas deliberately deferred from current work.
Created: 2026-10-04. An entry is not authorization to implement or a delivery commitment.

Related current plan: [POS staff, seats, and shifts](POS_STAFF_AND_SEATS_PLAN.md).
Broader historical roadmap: [ROADMAP.md](ROADMAP.md).

## How to maintain this file

Use stable IDs such as FUT-001. Statuses: Idea, Discovery, Planned, In progress, Shipped, Parked. Keep ownership, dependencies, unresolved decisions, and links with each idea. Promote an idea into a separate implementation plan before development; retain a link and status here. Do not mix deferred features into the current POS staff release.

## FUT-001 — Rider accounts and delivery workspace

- Status: Idea — deferred; not part of the POS staff implementation.
- Added: 2026-10-04.
- Product sponsor: business owner. Implementation owner: unassigned.
- Problem: businesses need to assign deliveries, let riders see their work, and reconcile delivery cash and earnings without exposing POS or business administration.

### Proposed rider experience

An individual email/login and store-scoped rider membership. Login opens **My deliveries**, a mobile-friendly page showing assigned orders, collection point, delivery address, customer contact needed for that assignment, delivery status, and cash to collect. Riders see only their assignments.

Suggested status flow: Assigned → Accepted → Collected → Out for delivery → Delivered. Include failed delivery, reassignment, and return-to-store outcomes with reasons. Dispatch managers can correct/reassign with an audit trail. Rider actions must not grant authority to change sale amounts or refund orders.

The page should show today's completed deliveries and earnings with separate values for **earned**, **pending approval**, and **paid**. Earnings may use a fixed per-delivery fee or a configured rule; do not promise actual payroll/payout processing before it is implemented. Customer cash collected is money owed to the business, not rider earnings.

### Proposed business workspace

Add **Delivery / Dispatch** for authorized managers: unassigned orders, assignment controls, status, failed deliveries, proof of delivery, outstanding cash by rider, earnings approval, and payout history. Distinguish internal riders from third-party carrier integrations.

### Cash and delivery proof

Support prepaid and cash-on-delivery orders. Record assigned collection amount, actual amount collected, exceptions, cash handed back, and manager receipt acknowledgment. Use a rider cash account/reconciliation process; never silently net earnings against cash owed. Any approved net settlement must have explicit entries.

Decide appropriate proof of delivery during discovery: customer code, acknowledgment, or photo. Expose customer information only while needed for assigned work and define retention. Live tracking is optional future discovery, not an assumed requirement; consent, battery use, retention, and maps cost need decisions.

### Dependencies and extension points

- Reuse individual identity and store membership architecture from the POS staff plan; add a dedicated `rider` access type later with its own access ceiling.
- Reuse auditable assignments, shifts where appropriate, immutable money records, and notification mechanisms.
- Link delivery assignment to an order and preserve order creator, cashier, dispatcher, and rider as separate actors.
- Build assignment authorization, idempotent status updates, offline retry behavior, and cash reconciliation before broad rollout.
- Do not grant POS access automatically. Any future person serving two roles needs explicit entitlement and permission rules.

### Pricing questions — undecided

Consider included rider capacity plus a rider-seat add-on, or a dispatch module with included riders. Do not reuse the $5 POS price automatically. Research delivery volume, support needs, messaging/maps costs, and whether tracking is included before choosing a price. Avoid per-delivery charges until the owner deliberately selects that model.

### Discovery questions

1. In-house staff, contractors, external carriers, or a combination?
2. Fixed delivery earnings, distance-based rates, bonuses, or manual amounts?
3. Is cash-on-delivery required at launch, and who confirms collection discrepancies?
4. Is assignment manual initially? What notifications are needed?
5. Does delivery finish a sale, fulfill an already-paid sale, or settle a credit order?
6. What proof, customer contact retention, and optional location tracking are appropriate?

### Promotion criteria

Start a separate rider implementation plan after POS identity/quota enforcement and cash reconciliation are stable, and after the owner selects delivery workflow, rider pricing, and earnings/settlement rules. No rider code is included in the current plan.
