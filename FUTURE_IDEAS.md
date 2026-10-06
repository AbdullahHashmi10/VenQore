# Future Ideas Registry

This document records deferred ideas and product proposals for future milestones.
Each entry has a stable ID, status, problem, proposed scope, dependencies, open decisions, and reference links.

---

### FUT-001: Rider / Delivery Driver Specialized Accounts

- **ID:** FUT-001
- **Status:** Deferred (Explicitly out of scope for POS staff & paid seats milestone)
- **Date Recorded:** 2026-10-04
- **Problem:**
  Stores with internal delivery operations need dispatch tracking, delivery confirmation, and cash-on-delivery (COD) reconciliation without granting drivers access to the sales terminal or register cash drawer.
- **Proposed Scope:**
  - Specialized lightweight mobile-first interface for delivery drivers.
  - Order assignment and status progression (Dispatched -> Out for Delivery -> Delivered / Failed).
  - COD settlement: attributing collected cash from customers upon return to store and handover to cashier/manager.
  - Driver seat pricing model: evaluate if included in Scale/Core or sold as a dedicated driver seat add-on.
- **Dependencies:**
  - Completion of POS staff, paid seats, and cash custody sessions.
  - Dispatch and delivery module hardening.
- **Open Decisions:**
  - Separate membership access type (`driver` or `rider`) vs. capability under POS staff.
  - Offline sync requirements for drivers on mobile cellular networks.
  - Proof-of-delivery capture (customer signature or photo upload).
