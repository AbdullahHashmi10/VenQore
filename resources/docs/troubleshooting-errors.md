---
title: Troubleshooting & Error Messages
description: Frequently asked questions about common error messages, offline-mode syncing issues, and how to reach VenQore customer support.
category: Troubleshooting & Errors
order: 7
---

# Troubleshooting & Error Messages

Find answers to common technical queries, connection issues, and error messages.

## Questions & Answers

### Q: What should I do if my POS terminal says it is Offline?
**A:** VenQore is built offline-first using Dexie.js (IndexedDB). If you lose internet connection:
- **Keep Selling:** You can continue scanning barcodes, adding products to carts, and completing sales. Receipts will print normally.
- **Sync Status:** A red "Offline" status bar will appear. Sales are stored securely in your browser's local cache.
- **Automatic Sync:** Once your internet connection is restored, the POS automatically pushes cached sales to the server in the background. Do not close or clear your browser cache while sales are waiting to sync.

### Q: Why am I seeing a "Plan Limit Exceeded" error message?
**A:** This occurs if your store action exceeds your active plan boundaries (e.g., trying to add a 4th store location while on the 3-location Growth plan):
- **How to resolve:** Navigate to Settings > Billing and click "Upgrade Plan" to increase your limits.
- **LTD Users:** If you are an AppSumo lifetime customer, you can stack up to 3 codes from Settings > Billing > Redeem to unlock the highest unlimited limits.

### Q: How do I fix thermal printer WebUSB pairing failures?
**A:** If your printer is not detected when clicking "Connect Printer":
1. Ensure the printer is turned on and connected directly via USB (avoid hubs).
2. Chrome, Edge, or Opera are required. Firefox and Safari do not support WebUSB.
3. If Chrome says "Device busy" or "No compatible device found", your operating system might have locked the USB port. Go to printer settings, disable "Windows Print Spooler" for that USB port, and try again.

### Q: How do I reach VenQore Customer Support for urgent queries?
**A:** If you need human assistance:
- **WhatsApp Support:** Message us at [+92 309 1999489](https://wa.me/923091999489) for quick turnaround support.
- **Admin Dashboard:** Log in and click "Help & Support" in your side menu to open a support ticket with our engineering team.
- **Email:** Contact us at support@venqore.com. We reply to all inquiries within 12-24 hours.
