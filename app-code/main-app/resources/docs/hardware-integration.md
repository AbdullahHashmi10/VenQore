---
title: Hardware & Printer Integration
description: Frequently asked questions about connecting WebUSB thermal receipt printers, scanners, and cash drawers.
category: Hardware Integration
order: 4
---

# Hardware & Printer Integration

Find answers on connecting receipt printers, barcode scanners, and cash drawers to your checkout station.

## Questions & Answers

### Q: How do I connect a WebUSB thermal receipt printer to the POS?
**A:** VenQore supports WebUSB to send raw ESC/POS commands directly to thermal printers without print drivers:
1. Turn on your printer and connect it via USB.
2. In the POS screen, open settings (gear icon) and select "WebUSB Connection".
3. Click "Connect Printer". A browser popup will list USB devices.
4. Select your printer (e.g. `POS-80` or `USB Printing Support`) and click "Pair".
5. Click "Print Test Receipt" to verify.
- **Safari/Firefox users:** Since WebUSB is not supported by these browsers, select "System Print Dialog" to output receipts via the standard print window.

### Q: How do I configure a USB or Bluetooth barcode scanner?
**A:** Barcode scanners work out of the box as keyboard input devices:
- **Scan Suffix:** Set your scanner's suffix configuration to output an `Enter` key after each scan (usually done by scanning a barcode in your scanner's user manual).
- **POS Checkout Flow:** Simply scan a barcode on any product while on the POS terminal screen. The system intercepts the scan, matches it with your product SKU, and appends it to the cart instantly.

### Q: How do I configure my cash drawer to pop open automatically on checkout?
**A:** Cash drawers trigger using the receipt printer:
1. Connect the cash drawer's RJ11/RJ12 cable directly to the matching port on the back of your thermal receipt printer.
2. When a cashier completes a cash sale, the POS sends a raw drawer-kick command to the printer.
3. The printer sends an electric pulse to the cash drawer, opening it automatically.
4. To open the drawer without a sale, cashiers with admin clearance can click the "Open Drawer" action in the POS menu.
