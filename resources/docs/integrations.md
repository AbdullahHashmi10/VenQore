---
title: eCommerce & Sync Integrations
description: Frequently asked questions and guides for connecting WooCommerce Sync, Amazon Seller Central, and TikTok Shop.
category: Integrations
order: 5
---

# eCommerce & Sync Integrations

Find answers on multi-channel sales syncs and stock count alignment.

## Questions & Answers

### Q: How do I set up WooCommerce Sync for inventory and orders?
**A:** Map WooCommerce orders and stock counts by setting up REST API access:
1. In WordPress, go to WooCommerce > Settings > Advanced > REST API.
2. Click "Add Key". Set description to `VenQore` and permissions to `Read/Write`. Copy the Consumer Key and Consumer Secret.
3. In VenQore, go to Settings > Integrations > WooCommerce.
4. Enter your WooCommerce site URL, Consumer Key, and Consumer Secret. Select the warehouse to map your web inventory.
5. Click "Verify Connection".
- **Real-Time Sync:** Online orders are imported as sales invoices in VenQore, and inventory edits in VenQore update WooCommerce stock counts within seconds.

### Q: How do I link VenQore with Amazon Seller Central?
**A:** Authorize VenQore to track stock levels and import Amazon seller records:
1. Go to Settings > Integrations and select Amazon Marketplace.
2. Click "Authorize". Log into your Seller Central account and approve VenQore access.
3. Select your active Selling Region (North America, Europe, or Far East).
4. Map listings by matching your Amazon Seller SKUs with VenQore catalog SKUs.
- **Stock Depletion:** Every time you complete a sale in your storefront or Amazon, inventory syncs to avoid cancelations.

### Q: How do I set up my TikTok Shop integration?
**A:** Sync product catalog items and track TikTok shop orders:
1. Go to Settings > Integrations and select TikTok Shop.
2. Click "Connect Seller Account". Log into Seller Center and approve the connection.
3. Map your product listings by matching TikTok Seller SKUs with VenQore catalog SKUs.
- **eCommerce Flow:** Orders are imported as sales invoices. When marked as fulfilled, shipping details are pushed back to TikTok automatically.
