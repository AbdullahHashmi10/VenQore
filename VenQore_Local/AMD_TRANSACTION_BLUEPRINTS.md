# VenQore TRANSACTION BLUEPRINTS (Master Reference)

This document contains the perfected blueprints for all transaction-related modules in the VenQore POS system. All modules must follow the `ZENITH_NEXUS_TEMPLATE.md` for creation and `ZENITH_INDEX_TEMPLATE.md` for list views.

---

## 1. PROPOSALS (Sales Estimation)
**Core Goal**: Customer-facing quotes and sales planning.
*   **Unique Needs**:
    *   **Validity Period**: Must prominently show "Valid Until" date.
    *   **AI Profit Insight**: Real-time margin analysis specifically for the customer's profit strategy.
    *   **Convert button**: Easy conversion from Proposal to Sale (not implemented yet, but reserved in UI).
*   **Template Status**: Updated to Zenith Workspace v2.0 structure.

## 2. SALES ORDERS (Pre-Orders)
**Core Goal**: Reservation of inventory before final payment.
*   **Unique Needs**:
    *   **Stock Reservation**: UI must highlight "Available" vs "Total" stock.
    *   **Shipment Date**: Expected delivery date tracking.
    *   **Partial Fulfillment**: Tracking items that are out of stock.
*   **Template Status**: Updated to Zenith Workspace v2.0 structure.

## 3. PURCHASES (Inbound Transactions)
**Core Goal**: Stock replenishment and supplier ledger management.
*   **Unique Needs**:
    *   **Cost vs MSRP**: Prominent field for Unit Cost.
    *   **Batch Tracking**: Placeholder for Manufacturing/Expiry dates.
    *   **Supplier Balance**: Shows current due to the supplier in the sidebar.
*   **Template Status**: Updated to Zenith Workspace v2.0 structure.

## 4. PURCHASE ORDERS (Pre-Purchase/Indents)
**Core Goal**: Ordering stock from vendors.
*   **Unique Needs**:
    *   **Vendor Requirements**: Links directly to Item Reorder points.
    *   **Approval Workflow**: Tracking "Sent", "Approved", "Received" status.
*   **Template Status**: Updated to Zenith Workspace v2.0 structure.

---

## CONTINUITY RULES
1.  **Zenith Scaling**: MUST be present in the top-right toolbar of all Create pages.
2.  **Select All on Click**: `onFocus={(e) => e.target.select()}` MUST be on all Qty, Price, and Amount inputs.
3.  **Balance Dashboard**: The right sidebar MUST show the Party's current ledger balance.
4.  **Sticky Footer**: Summary and Action buttons must remain visible regardless of item list length.
