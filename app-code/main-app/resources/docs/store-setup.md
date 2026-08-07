---
title: Store Setup & Locations
description: Frequently asked questions about configuring store locations, adding staff accounts, and setting up tax rules.
category: Store Setup
order: 2
---

# Store Setup & Locations

Learn how to configure your store's warehouse locations, staff members, and tax rules.

## Questions & Answers

### Q: How do I add and manage multiple warehouses or store locations?
**A:** VenQore supports multi-location inventory syncing under the Growth and Enterprise plans:
1. Go to Settings > Locations in your dashboard.
2. Click "Add Location".
3. Define its address, storage type (retail storefront vs. raw storage warehouse), and contact details.
4. Click Save. You can now transfer stock between these locations using the Stock Transfer tool.

### Q: How do I create staff accounts and manage checkout permissions?
**A:** Secure your store by assigning staff members specific permission profiles:
1. Go to Settings > Staff & Users.
2. Click "Invite Staff member".
3. Enter their email address and select a role:
   - **Cashier:** Restricted to the POS checkout screen. Cannot view purchase costs, supplier info, or financial reports.
   - **Manager:** Can update stock counts, create purchase orders, and run daily reports. Cannot access central billing or ledger configs.
   - **Administrator:** Full access to all locations, advanced reports, billing systems, and integration keys.
4. The system sends an email invitation for the user to set their password.

### Q: How do I configure inclusive or exclusive tax rules for products?
**A:** Set up tax compliance classes based on your business location:
- **Tax Classes:** Go to Settings > Taxes and click "New Tax Class" (e.g., GST 18%, VAT 5%, or Tax Exempt).
- **Pricing Mode:** Choose whether product retail prices include the tax (inclusive) or whether the POS should add the tax during checkout (exclusive).
- **FBR Compliance (Pakistan):** If your store requires FBR integration, add your compliance license keys and device ID under compliance settings. The printer will query and append the government invoice registration number automatically on checkout receipts.
