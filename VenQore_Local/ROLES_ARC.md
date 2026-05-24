# VenQore SaaS — Master Organizational Chart & Roles
**Vision:** A highly scalable, two-tier hierarchical structure mapping VenQore HQ (Platform) and Customer Workspaces (Tenant).

---

## TIER 1: VENQORE HQ (The Platform Level)
*These users work for VenQore. They manage the SaaS platform, monitor health, handle billing, and support the customers. They use the `venqore.com/hq` portal.*

### Executive & Operations
* **Platform Owner (Founder):** Ultimate God-mode; sees all macro-metrics, MRR, global staff performance, and can override any system constraint.
* **Operations Manager:** Oversees day-to-day platform health, reviews support manager metrics, and handles high-level vendor disputes (e.g., Cloudflare, Lemon Squeezy).

### Support & Customer Success
* **VP of Support (Global Support Head):** Monitors global ticket resolution times, oversees all departmental managers, and tracks overall customer satisfaction scores.
* **Department Support Manager:** Manages a specific support silo (e.g., Billing Support Manager, Tech Support Manager) and monitors their specific agents' dashboards.
* **L1 Support Agent:** Frontline chat/ticket responder with a personal dashboard tracking their solved tickets, response times, and the ability to route complex chats to specific departments.
* **L2 Technical Support:** Handles escalated bugs routed from L1; has "Impersonation" rights to log into a customer's store (with audit logging) to replicate technical errors.
* **Customer Success Manager (CSM):** Proactively reaches out to large enterprise clients to ensure they are using the ERP properly and helps them onboard their staff.

### Sales & Marketing
* **Marketing & Content Manager:** Accesses the internal CMS to publish blogs, update landing page copy, and push release notes to the public site.
* **Account Executive (Enterprise Sales):** Manages inbound leads for massive 50+ location retail chains and configures custom subscription pricing or volume discounts.
* **Billing Operations:** Manages AppSumo code redemptions, processes refunds, disputes chargebacks, and monitors subscription churn rates.

### Engineering & Security
* **Product Manager:** Reviews aggregated customer feature requests routed from the Support team to plan the development roadmap.
* **Security & Compliance Auditor:** A view-only role that monitors global error logs, failed login attempts, and tracks the audit trail of what HQ staff are doing.

---

## TIER 2: THE TENANT (The Customer's Store)
*These users are your customers and their employees. They exist strictly within the walled garden of their specific store (e.g., `venqore.com/app/ali-store`).*

### Store Leadership
* **Store Owner (Super-Admin):** Holds the wallet; has full operational control, manages VenQore subscription billing, and can delete the workspace.
* **General Manager (Store Admin):** Runs the business operations, views master P&L, and manages staff, but has zero access to the VenQore billing tab.

### Store Floor Operations
* **Shift Manager:** Opens/closes the POS, approves cashier voids, and views daily shift revenue, but is blocked from master profit margins.
* **Cashier:** Frontline staff restricted entirely to the POS screen to scan items and take payments.

### Back Office & Logistics
* **Inventory/Warehouse Manager:** Adjusts stock counts, manages internal warehouse transfers, and prints barcodes, but cannot access the POS or financials.
* **Purchasing/Procurement Agent:** Creates Purchase Orders and buys raw materials from the B2B network, but cannot see physical store sales.
* **Dispatch/Fulfillment Lead:** Monitors the Omnichannel tab (WooCommerce/Amazon orders) to pack and ship boxes, but cannot touch physical store stock.

### Finance & Accounting
* **Internal Accountant:** Full access to all 108-scenario financial ledgers, journal entries, and cost-prices, but blocked from ringing up customers.
* **External Auditor (CPA):** A view-only role used during tax season to export financial reports without the ability to edit or delete any data.

### Future B2B Ecosystem (Phase 3)
* **Wholesale Partner:** An external vendor account granted limited access to drop supplier catalogs directly into the store owner's procurement dashboard.



# VenQore SaaS — Tier 1 (Platform HQ) Role Architecture
**Vision:** This is the internal nervous system of VenQore. These roles operate entirely outside of the customer's retail environment. They use the `venqore.com/hq` portal to ensure the money printing machine runs without interruption, scales globally, and remains secure.

---

## 1. Executive & Operations

### Platform Owner (The Founder / CEO)
* **The Role:** Ultimate God-mode. This is the master key to the entire empire.
* **The Dashboard:** The "Command Center." Shows real-time Global MRR (Monthly Recurring Revenue), total active stores, total GMV (Gross Merchandise Value) flowing through the platform, churn rates, and global server health.
* **Capabilities:** * Can view, create, edit, or delete any HQ staff account.
  * Can force-delete or suspend any customer workspace.
  * Has access to the master API keys (Lemon Squeezy, Cloudflare R2, Postmark).
  * Can "Impersonate" any user in the system without needing their password.

### Operations Manager
* **The Role:** The right hand to the Founder. They keep the internal gears turning so the Platform Owner can focus on strategy and architecture.
* **The Dashboard:** The "Ops Hub." Tracks internal HQ performance, vendor API statuses (e.g., "Is Lemon Squeezy down?"), and massive system-wide alerts.
* **Capabilities:** * Can manage HQ staff (except Platform Owners).
  * Can issue platform-wide announcements (e.g., "Scheduled Maintenance at 2 AM").
  * Cannot access the master payouts or change core banking details.

---

## 2. Support & Customer Success
*This department is structured to route problems efficiently so you don't have to wake up at night to fix them.*

### VP of Support (Global Head)
* **The Role:** Oversees the entire support apparatus. They don't answer tickets; they look at the macro-level customer happiness.
* **The Dashboard:** "Support Analytics." Shows global ticket volume heatmaps, average resolution times, and Customer Satisfaction (CSAT) scores across all departments.
* **Capabilities:** Can reassign staff between departments during heavy ticket loads, and reviews major customer churn exit interviews.

### Department Support Manager
* **The Role:** Manages a specific silo of support (e.g., Billing Support, Technical Support, Onboarding Support).
* **The Dashboard:** "Department Overview." Shows a live feed of their specific agents. They see who is currently online, how many active chats each agent is handling, and flags chats that have been waiting for more than 5 minutes.
* **Capabilities:** Can jump into any active chat to "Whisper" to the L1 agent (internal notes the customer cannot see) or take over the chat entirely.

### L1 Support Agent (The Frontline)
* **The Role:** The first human a customer talks to. They handle basic "How do I do this?" questions.
* **The Dashboard:** "Agent Console." A split-screen view. The left side shows their personal active chat queue. The right side shows the customer's basic store profile (Plan, Store Name, Join Date) and a quick-reply macro library.
* **Capabilities:** * Can answer chats, send help documentation links, and view basic store settings.
  * **The Routing Power:** If a ticket is too complex, they click a button to instantly transfer the chat queue to a specific department (e.g., "Route to Tech Support L2" or "Route to Billing Ops").

### L2 Technical Support
* **The Role:** The bug hunters. They step in when the software actually breaks or a background job fails.
* **The Dashboard:** "Tech Console." Shows escalated tickets alongside system error logs for that specific customer's tenant ID.
* **Capabilities:** * Can view database slow queries and Horizon queue failures for a specific store.
  * **Impersonation Power:** Can log into the customer's store as the customer to replicate the bug. (Every action taken while impersonating is stamped with a bright red `[Performed by VenQore Support]` tag in the audit logs).

### Customer Success Manager (CSM)
* **The Role:** Proactive relationship builders for VIP or Business-tier customers. 
* **The Dashboard:** "Adoption Tracker." Shows which high-paying accounts are *not* using the software properly (e.g., "Ali's Supermarket pays $79/mo but hasn't uploaded any products in 10 days").
* **Capabilities:** Can trigger manual onboarding email sequences, book 1-on-1 Zoom calls through the dashboard, and offer free trial extensions to save a churning account.

---

## 3. Sales & Marketing

### Marketing & Content Manager
* **The Role:** Drives traffic and manages the public face of VenQore.
* **The Dashboard:** "CMS & Analytics." Integrates with Google Analytics and holds the internal blogging engine. 
* **Capabilities:** * Can publish, edit, and schedule blog posts for `venqore.com/blog`.
  * Can update pricing copy, feature lists, and SEO metadata on the public landing pages.
  * Has absolutely zero access to any customer's internal store data or HQ financial data.

### Account Executive (Enterprise Sales)
* **The Role:** Closes the big fish. If a 50-location pharmacy chain wants to migrate, this role handles the negotiation.
* **The Dashboard:** "Sales Pipeline." Tracks inbound enterprise leads, meeting schedules, and contract statuses.
* **Capabilities:** * Can generate secure, custom discount codes or bypass normal pricing limits to create bespoke "Enterprise" subscription tiers in Lemon Squeezy.

### Billing Operations
* **The Role:** The mechanics of the money. They handle the financial friction that L1 Support cannot.
* **The Dashboard:** "Billing Console." Shows recent failed payments, upcoming renewals, and AppSumo redemption logs.
* **Capabilities:** * Can manually process partial or full refunds.
  * Can dispute bank chargebacks.
  * Can manually credit an account with a "Lifetime License" if an AppSumo API webhook fails to trigger.

---

## 4. Engineering & Security

### Product Manager
* **The Role:** The bridge between customer complaints and the coding terminal. 
* **The Dashboard:** "Feature Roadmap." Aggregates tags from L1 Support (e.g., 50 people requested "Dark Mode"). 
* **Capabilities:** Can view anonymized usage data to see which features are used most often, helping prioritize what the developers should build next.

### Security & Compliance Auditor
* **The Role:** The Watchman. Essential for enterprise credibility. They ensure no internal HQ staff are abusing their power.
* **The Dashboard:** "Audit Matrix." A massive, filterable feed of every sensitive action taken by HQ staff. 
* **Capabilities:** * Strictly **View-Only**.
  * Can track exactly which L2 Support Agent clicked "Impersonate" on a specific store, at what time, from what IP address. 
  * Reviews failed HQ login attempts to catch internal credential leaks.



# VenQore SaaS : Tier 2 (Tenant Level) Role Architecture
**Vision:** This is the walled garden. Every role here exists strictly within a single customer's store environment (e.g., `venqore.com/app/ali-store`). A user's power in this tier does not leak into other stores they might belong to, and they have absolutely zero visibility into VenQore HQ.

---

## 1. Store Leadership

### Store Owner (The Super-Admin)
* **The Role:** The wallet holder and ultimate legal owner of the workspace data. 
* **The Dashboard:** The Master Dashboard. Shows full P&L, inventory valuation, and the exclusive VenQore Subscription settings.
* **Capabilities:** * Can do absolutely everything within the store.
  * **Exclusive Powers:** Manages the credit card on file, upgrades the VenQore pricing plan, and can permanently delete the store database.
  * Can invite, edit, or fire any other staff member.

### General Manager (The Store Admin)
* **The Role:** The operational brain. This is the trusted right-hand partner who runs the day-to-day business so the owner can step away.
* **The Dashboard:** The Master Dashboard, exactly like the Owner, but with the "Billing" and "Store Deletion" tabs physically removed.
* **Capabilities:** * Full access to sales operations, deep financial reports, and inventory management.
  * Can invite and fire mid-level staff (Managers, Cashiers, Inventory Clerks).
  * Cannot access the VenQore subscription page or transfer store ownership.

---

## 2. Store Floor Operations

### Shift Manager
* **The Role:** The floor supervisor. They keep the retail line moving and handle customer disputes without needing to see the total business profit margins.
* **The Dashboard:** The "Shift Hub." Focuses on daily revenue metrics, cash drawer balances, and pending voids.
* **Capabilities:** * Can open and close the POS registers.
  * Can process customer refunds and authorize voided items (using their unique 4-digit PIN to override Cashier screens).
  * Can view daily sales reports and perform minor manual stock adjustments (e.g., marking an item as "Damaged").
  * Blocked from viewing the Master P&L, wholesale cost prices, and accounting ledgers.

### Cashier
* **The Role:** The frontline worker. This role requires the tightest security to prevent both accidental errors and intentional theft.
* **The Dashboard:** The POS Screen. When they log in, they do not even see a sidebar or a settings menu. They are dropped directly onto the barcode scanning interface.
* **Capabilities:** * Can scan items, apply basic pre-approved discounts, and process cash or card payments.
  * Cannot manually type in a custom price for an item.
  * Cannot void a scanned item without a Shift Manager typing in an override PIN.
  * Cannot view inventory totals or any end-of-day reports.

---

## 3. Back Office & Logistics

### Inventory / Warehouse Manager
* **The Role:** The backroom controller. They ensure the physical shelves match the digital numbers.
* **The Dashboard:** "Stock Control." A focused view of low-stock alerts, incoming shipments, and barcode generation tools.
* **Capabilities:** * Can receive new stock shipments, adjust inventory counts, and initiate stock transfers between warehouses (e.g., moving items from the Okara main store to a secondary location).
  * Can print barcode labels and bulk-import product CSVs.
  * Completely blocked from opening the POS, viewing financial reports, or seeing the wholesale cost of goods.

### Purchasing / Procurement Agent
* **The Role:** The buyer. They handle supplier relationships and restock the business.
* **The Dashboard:** "Procurement Hub." Tracks pending Purchase Orders, supplier ledgers, and raw material cost fluctuations.
* **Capabilities:** * Can create Purchase Orders and send them to wholesale suppliers.
  * Can input raw material costs and update supplier payment statuses.
  * Blocked from viewing physical retail sales, the POS, and customer data.

### Dispatch / Fulfillment Lead
* **The Role:** The e-commerce logistics team. They handle the "Omnichannel" bridge you envisioned.
* **The Dashboard:** "Fulfillment Queue." A live feed of incoming WooCommerce, Shopify, and Amazon FBM orders.
* **Capabilities:** * Can accept online orders, print shipping labels, and mark packages as dispatched (which automatically deducts the stock).
  * Blocked from physical store operations, in-store POS, and all financial accounting reports.

---

## 4. Finance & Accounting

### Internal Accountant
* **The Role:** The financial controller who manages the 108-scenario financial rulebook you built.
* **The Dashboard:** "Financial Ledger." Deep-dive interface into journal entries, chart of accounts, and balance sheets.
* **Capabilities:** * Full access to true FIFO cost margins, asset depreciation, party ledgers, and expense tracking.
  * Can manually create complex journal entries.
  * Blocked from opening the POS or manually altering physical stock counts.

### External Auditor (CPA)
* **The Role:** The tax season guest. A highly secure, "look but do not touch" role for external compliance.
* **The Dashboard:** "Reporting Suite."
* **Capabilities:** * Strictly **View-Only**.
  * Can view and export the P&L, balance sheets, and tax reports.
  * The system physically blocks them from creating, editing, or deleting a single record.

---

## 5. Future Network Roles (Phase 3)

### Wholesale Partner
* **The Role:** An external vendor account integrated into the B2B syndicate.
* **The Dashboard:** "Vendor Portal."
* **Capabilities:** * Can upload their wholesale product catalog directly into the Store Owner's procurement dashboard.
  * Can receive and accept automated Purchase Orders from the store.
  * Has absolutely zero access to any internal data of the store they are selling to.


# VenQore SaaS — Tier 3 (The Network Ecosystem) Role Architecture
**Vision:** This is the empire tier (Years 5–15). These roles do not work for VenQore HQ (Tier 1), and they do not work for the individual retail shop (Tier 2). They are the external actors—suppliers, consumers, and partners—who connect the isolated stores into a massive, thriving global economy.

---

## 1. The B2B Syndicate (The Wholesale Network)
*These roles enable shops to buy from each other seamlessly within the VenQore ecosystem without ever sending an email or picking up a phone.*

### Wholesale Partner (The Supplier)
* **The Role:** A bulk distributor or manufacturer (e.g., a flour mill in Okara) selling to VenQore retail stores (e.g., a local bakery).
* **The Dashboard:** "Vendor Portal." A focused view of incoming Purchase Orders from various VenQore retail stores, bulk inventory levels, and wholesale invoices.
* **Capabilities:** * Can upload wholesale catalogs with tiered pricing (e.g., "Buy 100 units, get 10% off") visible exclusively to verified VenQore retailers.
  * Can accept, modify, or reject incoming automated Purchase Orders from retailers.
  * **The Boundary:** They have absolutely zero visibility into the retailer's markup, physical retail sales, or customer data. They only see what is explicitly ordered from them.

### B2B Account Representative
* **The Role:** The salesperson working for the Wholesale Partner. 
* **The Dashboard:** "B2B CRM." Tracks which VenQore retail stores are buying their products and who has stopped ordering.
* **Capabilities:** * Can approve special line-item discounts for specific VIP retail clients directly within the VenQore procurement network.
  * Can message the Retailer's "Procurement Agent" directly through the system.

---

## 2. The B2C Marketplace (The Consumer Empire)
*These roles bypass third-party apps like Foodpanda or Amazon. They connect the everyday person directly to the VenQore merchant's POS.*

### Marketplace Consumer (The Shopper)
* **The Role:** An everyday person buying food, groceries, or retail goods through the public VenQore Consumer App.
* **The Dashboard:** "My Orders." A unified shopping cart, order history, and delivery tracker across all VenQore-powered merchants.
* **Capabilities:** * Can browse digital storefronts, place orders, and save payment methods.
  * **The Magic:** When they click "Buy," their order bypasses external integrations and drops directly into the specific merchant's Tier 2 POS screen with a loud notification ring.

### Delivery Courier (The Fleet)
* **The Role:** The driver assigned to move physical goods from the Tier 2 Store to the Consumer.
* **The Dashboard:** "Driver App." A hyper-optimized route map and order queue.
* **Capabilities:** * Can view pickup instructions, drop-off locations, and mark orders as "Picked Up" or "Delivered."
  * **The Boundary:** They only see the order ID and the customer address. They cannot see the store's total revenue or the customer's payment details.

---

## 3. The API & Third-Party Ecosystem
*As VenQore becomes an enterprise standard, you will need to allow external professionals to interact with your customers securely.*

### Certified Agency Partner (The Implementer)
* **The Role:** An external IT agency or freelance expert hired by a massive 50-location retail chain to set up their VenQore system. 
* **The Dashboard:** "Agency Hub." Similar to the Shopify Partner Dashboard. Shows a list of all client stores they are actively managing.
* **Capabilities:** * Can request "Delegate Access" to a Tier 2 store. Once the Store Owner approves, the Agency gets temporary Admin rights without consuming a paid staff seat.
  * Can configure hardware, build custom API integrations, and import legacy data.
  * **The Boundary:** The Store Owner can revoke this access with one click the moment the setup contract is finished.

### External App Developer (The Plugin Builder)
* **The Role:** A developer building third-party integrations (e.g., a custom loyalty points system or a specialized tax calculator) for the VenQore Marketplace.
* **The Dashboard:** "Developer Console." Tracks API usage, webhooks, and active installations of their app.
* **Capabilities:** * Can generate OAuth tokens and manage Webhook endpoints.
  * **The Boundary:** Can only access specific data scopes explicitly approved by the Store Owner (e.g., "This app is requesting Read-Only access to your Inventory").


