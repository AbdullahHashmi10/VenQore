# VenQore Station 3.1

The Windows companion for the VenQore cloud POS. Station shows the sealed
VenQore origin (`https://www.venqore.com` (app pages only; the public marketing pages on the same domain are never shown on a till)) full-screen and gives that page —
and only that page — the hardware a browser can't reach:

| Hardware | How Station drives it |
|---|---|
| USB / Windows receipt printers | Receipt rendered by Chromium (any font, Urdu/Arabic, logos) → 1-bit raster → **raw ESC/POS** through the Windows spooler. Native cut, native barcodes/QR. ~100 ms per receipt once warm. |
| Network kitchen / bar printers | Straight to `IP:9100`, no driver. Live status (offline, cover open, paper out / low). |
| Cash drawer | Real `ESC p` pulse on pin 2 or pin 5 (v2 always returned "not supported"). |
| A4 / laser printers | Silent print through the Windows driver (`amdAPI.printHtml` / `printDocument`). |
| Label printers | Silent, any size: `printLabel(html, { widthMm, heightMm })`. |
| Print roles | Bills, kitchen, bar, takeaway, labels and A4 documents each go to their own printer, with an optional backup that takes over if the main one is off, out of paper or unplugged. Set once in Station → Printers. |
| Serial (COM) barcode scanner | Typed into the POS exactly like a USB keyboard scanner (Enter/Tab/none after), or delivered as an event. Hot-plug reconnect. |
| Serial weighing scale | Continuous or polled (`W`, `P`, ENQ, `SI`). kg/g/lb, sign, stable/settling/overload. |
| 2 × 20 pole display (VFD) | Mirrors the last item and the total. |
| Customer-facing monitor | Second-screen display (cart, total, change) fed by the POS. |

## Develop

```bash
npm install
npm run dev          # opens http://127.0.0.1:8000 (or VENQORE_DEV_URL)
npm test             # unit tests (ESC/POS, receipt HTML, scale parser, routing, prefs)
```

DevTools for the POS page: **Ctrl+Shift+Alt+I** (asks for the manager PIN when one is set).

## Build the Windows installer

```bash
npm install
npm run build:win    # dist/VenQore-Station-Setup-<v>.exe  +  dist/VenQore-Station-<v>-Portable.exe
```

`npm run icons` regenerates every icon from `assets/icon.svg` (the same mark as
the web app's `/images/icon.svg`). `build:win` runs it first.

To ship an update: upload `VenQore-Station-Setup-<v>.exe`, its `.blockmap` and
`latest.yml` to `https://updates.venqore.com/station/`. Installed Stations
download it in the background and install it on the next restart. The portable
build does not auto-update.

## Files

```
main.js              lifecycle, windows, IPC boundary, heartbeat, updater
preload.js           window.amdAPI for the cloud page (v2-compatible + v3 additions)
shell-preload.js     window.station for the local shell (no Node in the shell)
shell.html/.css/.js  the Station UI — V6 design system tokens in assets/v6.css
customer-display.*   the second-screen page
lib/printers.js      discovery, per-printer profiles, queues, ESC/POS vs driver
lib/winspool.js      Windows spooler bridge (RAW jobs, status, default printer)
lib/renderer.js      hidden Chromium surfaces that rasterise / print
lib/escpos.js        the ESC/POS byte encoder
lib/receipt-html.js  receipt rows → HTML (escaped, style-whitelisted)
lib/serial.js        scanner, scale, pole display with hot-plug
lib/netprinter.js    port-9100 printers + DLE EOT status
lib/prefs.js         atomic prefs file, hashed manager PIN
lib/logger.js        rotating log in %APPDATA%/VenQore Station/logs
tools/make-icons.js  SVG → .ico/.png
tests/               node:test unit tests + Electron end-to-end harnesses
```

## window.amdAPI (cloud page)

Everything from v2 keeps its name and return shape:
`check, registerTerminal, getPrefs, savePrefs, print, openDrawer, getPrinters,
setDefaultPrinter, testPrint, close, forceClose, reload, onExitRequest,
listSerialPorts, openScanner, openScale, closeSerial, onBarcodeScan,
onScaleReading, onUpdateAvailable, onUpdateProgress, onUpdateReady,
downloadUpdate, installUpdate`.

New in v3:

```js
await amdAPI.print({ content, role?: 'receipt'|'kitchen'|'bar'|'takeaway', printerName?, copies?, paperWidth: '58mm'|'80mm'|'100mm', autoCut?, openDrawer? })
// → { success, error?, mode: 'escpos' | 'driver' | 'driver (fallback)', printer }

await amdAPI.printHtml({ html, role?: 'document'|'label', printerName?, pageSize: 'A4' | { widthMm, heightMm }, copies?, landscape? }) // silent
await amdAPI.getHardwareStatus()      // printers with state, serial devices, display
amdAPI.onHardwareStatus(cb)           // live updates (returns unsubscribe)
await amdAPI.getWeight()              // latest scale reading
await amdAPI.openCustomerDisplay() / closeCustomerDisplay()
await amdAPI.updateCustomerDisplay({ mode, storeName, currency, items:[{name,qty,price,total}], subtotal, discount, tax, total, paid, change })
await amdAPI.poleDisplay('line 1', 'line 2')
await amdAPI.getPrintHistory()
await amdAPI.getPrintRoles()          // [{ role, label, printer, fallback }]
amdAPI.openStationSettings()
```

`printerName` may be a Windows printer name or a network printer `tcp://192.168.1.50:9100` that a manager added in Station settings — the page can never name an address Station doesn't already know.
Resolution order: a role set on this till → the name the POS gave → the customer-bills printer.
Omit it and Station uses the saved receipt printer → the only/first receipt
printer → the Windows default.

## Shortcuts

| | |
|---|---|
| Ctrl+Shift+R | Reload POS |
| Ctrl+Shift+S | Station settings |
| Ctrl+Shift+P | Privacy shade |
| Ctrl + / Ctrl − / Ctrl 0 | POS zoom |
| F11 | Full screen ↔ window |
