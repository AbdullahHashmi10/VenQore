# VenQore Station — v2 audit and v3 rebuild

**Date:** 6 Oct 2026 · **From:** v2.0.0 (shipped exe, June) / source as of 30 Sep · **To:** v3.0.0

## What was wrong with v2 (all fixed in v3)

### Hardware that silently didn't work

| # | Problem | Effect on a shop | v3 |
|---|---|---|---|
| H1 | `kickDrawer()` returned a hard-coded failure. | Every cash tender showed "Cash drawer request failed"; the drawer never opened from the POS. | Real `ESC p` pulse (pin 2 or 5) sent raw through the spooler / network. |
| H2 | Receipts printed as an HTML page through the Windows driver (electron-pos-printer). `autoCut` was ignored. | No paper cut unless the driver happened to do it; slow first print. | Raw ESC/POS raster + native cut. Driver mode kept as an option and as automatic fallback. |
| H3 | Electron 44's printer list has no `isDefault`/`status`. v2 read both. | The "default printer" fallback in the web app (`printers.find(p => p.isDefault)`) never matched; the status chip showed only a name. | Spooler bridge returns default printer, driver, port, status bits (offline, paper out, jam, cover open) and queued jobs. |
| H4 | `paperWidth: '100mm'` (web 4-inch setting) was rejected. | 4-inch printers could not print from Station at all. | 58 / 80 / 104 mm supported. |
| H5 | `copies` arriving as a string ("2") was rejected as "Invalid copies". | Thermal copies setting could break printing. | Coerced and clamped 1–5. |
| H6 | Saved scanner/scale ports were never reopened at launch, and an unplug was never recovered. | Serial scanner/scale stopped working after every restart or cable wiggle. | Auto-reconnect at launch + hot-plug watcher every 3 s. |
| H7 | Serial scanner barcodes were sent as an IPC event the POS never listens to (the POS uses keyboard-wedge input). | COM scanners did nothing in the POS. | Barcodes are typed into the POS exactly like a USB keyboard scanner (+ Enter/Tab/none). Event mode still available. |
| H8 | Scanner parser split only on `\r\n`. | Scanners ending in CR or LF (most) never delivered a scan. | CR, LF, CRLF, ETX and no-suffix (quiet-gap flush). |
| H9 | Scale parser took the first number, ignored sign/unit/stability. | Grams read as kilograms, negative tare lost, unstable weights accepted. | kg/g/lb/oz, sign, stable/settling/overload; optional poll protocols (W, P, ENQ, SI). |
| H10 | Dual-screen launcher was not exposed to the page and loaded `/pos/display`, which doesn't exist. | No customer display. | Built-in customer display window (V6), auto-open on second monitor, fed by the POS (wired in `Pos.jsx`). |
| H11 | No network-printer support. | Kitchen/bar Ethernet printers needed a Windows driver per printer. | Add by IP in settings; appear in every printer picker as `tcp://IP:9100`; live status via DLE EOT. |
| H12 | Printer list enumerated every 5 s via Chromium. | Spooler load on low-end tills. | Cached; refreshed every 20 s through the warm helper. |

### Bugs in the app itself

| # | Problem | v3 |
|---|---|---|
| B1 | `assets/icon.png` was excluded from the package but used for the window, tray and shell logo. | Tray icon blank, broken logo image in the installed app. → All icons generated from the real `icon.svg`, all packaged. |
| B2 | **Old icon** (different mark, white background, 6250 px, 668 KB). | New icon from `/images/icon.svg` — .ico with 16→256 px, transparent, crisp at taskbar size. |
| B3 | "Check for updates" sent `amd:check-updates`, which had no handler. | Wired. |
| B4 | `autoDownload = false` and nothing ever called download. | Updates never installed. → Download in background, install on restart, status shown in settings. |
| B5 | `--disable-software-rasterizer` was always on. | Black window on tills without a working GPU driver. → Removed; automatic switch to safe graphics after 2 GPU crashes, plus a manual toggle. |
| B6 | Prefs file rewritten every 5 s, non-atomically; a corrupt file reset `deviceId`. | Terminal could "forget" it was paired after a power cut. → Atomic write + `.bak` recovery, debounced, sync timestamp written every 10 min at most. |
| B7 | Heartbeat / quit calls had no timeout; quit waited on a fetch. | App froze on Exit when offline. → 10 s / 2.5 s timeouts; Chromium network stack (honours shop proxies). |
| B8 | `did-fail-load` counted sub-frame failures. | A failing analytics iframe could put the POS into a reload loop. → Main frame only; network errors get an auto-retry screen with back-off. |
| B9 | Error pages detected by page title ("Laravel", "Forbidden"…). | False error screens. → Uses the real HTTP status. |
| B10 | `register-terminal` used `parseInt` on what is now a UUID. | Terminal ID corrupted. → Accepts UUID or integer. |
| B11 | Tray "Quit" bypassed the exit PIN. | Cashier could close a monitored till from the tray. → Goes through the same exit gate. |
| B12 | Windows shutdown was blocked by the exit gate. | → Session-end always allowed. |
| B13 | Test print / drawer buttons gave no feedback. | → Result + recent job list in settings. |
| B14 | COM port dropdowns were empty until "Scan" was pressed. | → Auto-scan on open; unplugged saved ports still shown. |
| B15 | Paired till could start on a blank loader (webview src race). | Found during v3 testing. → Webview created with its first URL. |
| B16 | `window.open` from the POS (print views) was denied or sent to the system browser. | → Opens a Station document window with the same session and hardware bridge. |

### Security

| # | Problem | v3 |
|---|---|---|
| S1 | Shell window ran with `nodeIntegration: true, contextIsolation: false`. | Sandboxed shell with a narrow `window.station` bridge. |
| S2 | Shell relayed **any** IPC channel from the web page to main as a trusted sender. | Relay removed; main talks to the page directly. |
| S3 | Exit passcode stored in clear text, shipped default `1234`, compared in the renderer, no rate limit. | Manager PIN, scrypt-hashed, verified in main, 5 tries then 60 s lockout; `1234` and repeated digits refused; v2 passcodes migrated. |
| S4 | F12 opened DevTools on the POS for anyone. | Ctrl+Shift+Alt+I, behind the PIN. |
| S5 | Page could open a native file dialog (`browse-file`). | Removed. |
| S6 | Webview preload path came from the shell. | Forced in main at attach; webview sandboxed. |
| S7 | Permissions (camera, serial, HID…) unmanaged. | Allow-list for the trusted origin only; Web Serial/HID denied (Station owns the ports). |
| S8 | Monitoring could be enabled without any PIN. | Requires a manager PIN; consent screen kept; screenshot queue bounded. |
| S9 | No-sale drawer opening had no control. | Bar drawer button only appears with a PIN and asks for it. |

## New in v3

- **V6 design system** throughout: tokens copied from the V6 token files into `assets/v6.css`, Plus Jakarta Sans / Bricolage Grotesque / Space Grotesk bundled offline, 14 px / pill shapes only, teal accent, green-cast ink, dark by default with a light theme. SVG icons replace emoji.
- Live status chips: internet, receipt printer (with paper/offline state), scanner, scale (live weight), customer display.
- Settings sheet: Printers (default, per-printer mode/paper/cut/drawer pin/darkness/buzzer, network printers, job history), Scanner & scale, Display (customer screen, zoom, window/fullscreen, theme), Station (pairing, autostart, keep awake, safe graphics, updates, diagnostics, logs, clear cache, restart), Security (PIN, settings lock, monitoring).
- Pairing: paste a full POS link, auto-formatted code, non-blocking "not paired" banner (hardware keeps working).
- Auto-start with Windows, keep display awake, POS zoom (Ctrl +/−/0), kiosk downloads saved straight to Downloads with an "Open" toast.
- Rotating log file + one-click diagnostics export for support.
- Pole display (2×20 VFD) support, mirrored from the cart.
- `window.amdAPI` additions: `printHtml`, `getHardwareStatus`, `onHardwareStatus`, `getWeight`, customer display, pole display, print history. All v2 calls unchanged.

## Measured (container test rig)

- Receipt to a port-9100 printer: **~600 ms cold, ~120 ms warm** (render + raster + send).
- Urdu text renders correctly on thermal output (raster path).
- End-to-end: pairing against a mock server, `amdAPI.print` + drawer from the cloud page, document popup with bridge, external navigation blocked, serial scanner typed into the focused input with Enter, scale reading delivered.
- Packaged Windows build boots (verified under Wine); PowerShell spooler helper parses, compiles and answers its protocol (verified on PowerShell 7).

## Not testable from here — check on a real till

1. Raw printing to a USB thermal printer through the spooler (first print after install).
2. Cash drawer on pin 2 (most) — switch to pin 5 in the printer's settings if it doesn't open.
3. Second monitor customer display.
4. Windows SmartScreen: the exe is unsigned. Code-signing removes the "unknown publisher" warning.

## Web app changes made alongside

- `resources/js/Utils/AMDStation.js`: `getHardwareStatus`, `onHardwareStatus`, `printHtml`, `customerDisplay` helpers; the hook refreshes printers live.
- `resources/js/Pages/Pos.jsx`: one effect mirrors the open cart to the customer display / pole display (no-op in a browser or on Station 2).
- These need the normal web build + deploy.

---

# v3.1.0 — 6 Oct 2026 (same day, second pass)

## Changed because of review questions

| # | What | Change |
|---|---|---|
| D1 | Station opened `app.venqore.com`, but VenQore serves the public site **and** the app from one domain (`config/session.php`: "URL-based routing (no subdomains)"). | Station now loads `https://www.venqore.com` (the bare `venqore.com` is trusted too, for the redirect). It starts at `/login` and goes to `/s/<store>/pos`. |
| D2 | The marketing pages (`/`, `/pricing`, `/features`, `/pos` showcase, `/docs`…) live on that same origin, so a logo click or link could drop a cashier on the public site. | Station never shows them: any main-frame or in-app navigation to a marketing path is turned back to `/login` (which Laravel forwards to the till if signed in). Customer receipts `/r/…` and everything under `/s/…` are untouched. List: `MARKETING_ROOTS` in `main.js`. |
| D3 | Theme defaulted to dark. | **Light by default**, dark by choice (Settings → Display). Customer display follows. |

## Printer roles and backup printers

Each kind of job has its own printer on this till, set once in Settings → Printers → "Where each job prints":

| Role | Used for |
|---|---|
| Customer bills (= the Station default) | receipts and the cash drawer |
| Kitchen tickets | KOTs |
| Bar tickets | KOTs whose station is the bar |
| Takeaway tickets | takeaway KOTs |
| Labels | `amdAPI.printHtml({ role:'label', pageSize:{widthMm,heightMm} })` |
| A4 documents & reports | `amdAPI.printHtml({ role:'document' })` |

- Every role may have a **backup printer**: if the main one is unreachable, off, out of paper or fails, the job goes to the backup (`fallbackUsed: true` in the result).
- Unset role → customer-bills printer. A role set on this till **wins** over the store-wide printer name the server sends in a KOT (that name is usually another PC's printer).
- A bill sent to a *named* printer that doesn't exist fails with a clear error — it never silently lands on another printer.
- Network (Ethernet) printers can be a role printer, so kitchen printers need no Windows driver on any PC.

Thermal printing is **silent** in every mode: raw ESC/POS goes to the spooler / port 9100 with no dialog, and the Windows-driver path uses `silent: true`.

## Security review — "can someone hack us from the exe code?"

Reading the code of an Electron app is always possible (the app archive is a zip-like file), so the rule is: nothing in it may be a secret, and nothing in it may be trusted blindly. Result of the review:

| # | Finding | Fix in 3.1.0 |
|---|---|---|
| X1 | **No secrets in the code** (no API keys, tokens or passwords; the pairing secret is issued per till by the server). | — verified by search |
| X2 | The page could pass any `tcp://host:port` as a "printer", so a compromised page could make the till send bytes to any machine on the shop network (port scanning / SSRF). Also reachable through `defaultPrinter`. | Station now only prints to printers it already knows: installed ones, or network printers a manager added in Station settings. Tested: a rogue listener received 0 bytes. |
| X3 | The till's pairing secret was stored as plain text in the prefs file. | Encrypted with Windows DPAPI (`safeStorage`, tied to the Windows user); an existing plain secret is migrated on first start. |
| X4 | The page could save any text as the scanner/scale COM port. | Only `COMn` / `/dev/...` paths accepted. |
| X5 | The exe could be modified (edit `app.asar`, add code, start it with `ELECTRON_RUN_AS_NODE` or `--inspect`). | Electron fuses: RunAsNode **off**, NODE_OPTIONS **off**, `--inspect` **off**, cookie encryption **on**, only load the app from the archive, and **embedded ASAR integrity validation on**. Tested: a one-byte edit to `app.asar` makes the app refuse to start ("ASAR Integrity Violation"). |
| X6 | Auto-update trust: the exe is **not code-signed**, so Windows can't verify who published an update; updates are protected only by HTTPS to `updates.venqore.com` and the hash in `latest.yml`. | **Open.** Buy a code-signing certificate; protect the `updates.venqore.com/station/` upload credentials like a bank password (whoever can upload there can run code on every till). |
| X7 | Anyone who already controls the Windows account of the till can read local files regardless. | Out of scope; mitigated by Windows accounts, BitLocker and a manager PIN. |

Already in place from 3.0: sealed origin, sandboxed shell, sender checks on every IPC call, permission allow-list, hashed PIN with lockout, DevTools behind the PIN.

## Web app changes (need the normal build + deploy)

- `Utils/AMDStation.js`: `print(..., { role })`, `printTicket`, `printDocument`, `printLabel`, `getPrintRoles`, `getWeight`, `describePrinterProblem`; the hook now exposes `hardware`, `stationVersion`, `printerProblem` and `problemFor(role)`.
- `Utils/KitchenPrintService.js`: every KOT goes with a role (`bar`, `takeaway` or `kitchen`).
- `Pages/Pos.jsx`: the printer indicator shows the printer's real state ("Out of paper", "Offline"…) with a tooltip; a warning appears when the payment screen opens and again after the sale if the printer is down (the sale is never blocked); a **weigh button** on each cart line (shown only when a scale is connected) fills the quantity from the scale (steady readings only, 3 decimals, `updateQty(..., { exact: true })`).

## Not done (needs the server, or hardware I can't test)

- **Settings → Terminals health view** (Station version / printer / scanner / last seen per till) and **remote diagnostics upload**: need a database column and a controller change in `HeartbeatController` (security-sensitive, covered by your permission/golden tests). Spec: Station adds a small `station` object to the heartbeat; the server stores it on `terminals`.
- **No-sale drawer audit log**: needs a server endpoint to record who opened the drawer and why.
- **Card terminals, Bluetooth/HID scanners, two customer displays**: not built (card terminals depend on the bank's device SDK).
- Real-till checks (USB spooler printing, drawer pin, second monitor, auto-update) still need a physical till.

## 3.1.1 — installer look

The setup wizard used electron-builder's stock blue panel because no art was supplied. Now: a V6 panel (`build/installerSidebar.bmp`, `build/uninstallerSidebar.bmp`, 164×314, dark teal, the real mark, Bricolage Grotesque wordmark) and reworded Finish text (`build/installer.nsh`) that tells the cashier to enter the store name and the pairing code from Settings → Terminals. Regenerate the art with `python3 tools/make-installer-art.py` (needs pillow, fonttools, brotli). NSIS only shows this panel on the Finish (and uninstall) pages; the other pages use the small header icon.

## 3.1.3 — 7 Oct 2026

Release packaging refresh after the October Station updates. The installer and
portable packages are rebuilt from the current V6 shell, hardware bridge,
security controls, printer routing, and customer-display sources.

## 3.1.4 — Google sign-in hotfix

The sealed browser now permits the exact `accounts.google.com` origin only
while a VenQore `/auth/google` flow is active. The OAuth callback must return
to a trusted VenQore origin. Hardware IPC remains unavailable to Google pages,
and every unrelated external origin remains blocked.
