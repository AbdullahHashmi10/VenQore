# VenQore Station: EXE, updates, pairing and dedicated POS audit

Audit date: 10 October 2026. Scope: current Windows source, locally available installers, public download response, update feed reachability, pairing source and Windows kiosk feasibility. No live release or Windows lockdown was performed.

## Outcome

The distribution path is inconsistent: current desktop source and the latest local installer are 3.1.4, the web download metadata says 1.4.2, and both local public download copies are actually 2.0.0. The public installer responds with exactly the old file's byte count. The configured update hostname failed DNS resolution from this machine while the main website was reachable. Fix distribution before building another EXE and expecting existing tills to change.

The desired owner-controlled, POS-only computer is feasible. The existing fullscreen/PIN implementation is not a Windows security boundary. Implement dedicated Windows kiosk provisioning alongside app permissions and a controlled maintenance workflow.

## Evidence and findings

| Priority | Finding | Evidence and consequence |
|---|---|---|
| P1 | Old installer remains in the download path | `app-code/main-app/public/downloads/VenQore_Station_Setup.exe` and the equivalent production-clean-repo copy have embedded product version 2.0.0 and size 77,843,978 bytes. |
| P1 | Public download appears stale | HEAD to `https://www.venqore.com/downloads/VenQore_Station_Setup.exe` returned 200, Content-Length 77,843,978, Last-Modified 5 June 2026 and a seven-day cache lifetime. Size matches the local 2.0.0 installer; remote bytes were not downloaded and hashed, so exact identity remains unverified. |
| P1 | Automatic update endpoint is unreachable from the audit machine | `package.json` publishes to `https://updates.venqore.com/station/`. A network check outside the sandbox failed to resolve this hostname. The main site succeeded in the same check. Investigate public DNS, TLS and hosting; this is an observed failure, not proof of worldwide DNS state. |
| P1 | Changing local POS code does not change the hosted POS | `main.js:57` loads `https://www.venqore.com` in ordinary production mode. Most POS screens are hosted web content, not bundled in the EXE. Local web changes require a separately verified web deployment. Signed local environment profiles are an exception. |
| P2 | Download page metadata is independently maintained and wrong | `AppsController.php:33` advertises 1.4.2, 1 September and 84.6 MB. The latest local 3.1.4 setup is 104,077,619 bytes. |
| P2 | Portable builds never auto-update | `main.js:270` skips updater setup for portable mode. This is intentional but means portable users need manual replacement or migration to the installed edition. |
| P2 | Release handoff omits the setup blockmap | The 3.1.4 release folder contains setup, portable and latest.yml, but no blockmap. The matching blockmap exists in windows-app/dist. Publish the complete set; a missing blockmap is not by itself proof that full-download updating will fail. |
| P1 for broad rollout | Installers are unsigned | Windows Authenticode inspection returned NotSigned for old public copies and 3.1.4. Existing release notes label 3.1.4 pilot/internal. Obtain signing, enforce publisher verification and validate installation/update behavior before broad distribution. |
| P1 for kiosk claims | Fullscreen can be left without an owner check | `main.js:428` toggles fullscreen with F11. `shell:window` can minimize or change fullscreen without a PIN. Windows task switching is not controlled. |
| P1 for kiosk claims | Exit and external launch paths bypass a uniform authorization boundary | `amd:force-close` directly quits, trusting the page's manager check. `amd:open-external` opens HTTP(S) URLs externally; log/download actions open Windows applications. These must be explicitly handled under a future kiosk policy. |
| P1 for kiosk claims | Settings protection is partly enforced in the UI | `shell-renderer.js` gates opening settings, but `shell:save-prefs` does not verify a PIN or a main-process authorization session. The local PIN is not connected to an individual owner's cloud permission. This is a boundary weakness, not evidence that arbitrary remote sites can call local-shell IPC. |

### Artifact identity

- Old public installer SHA-256: `A73323267B17F12DEA54A9F464542C30786FA6AA3158A073F2451B71F16B0762`.
- Latest local setup: `releases/2026-10-07-google-oauth-hotfix/VenQore-Station-Setup-3.1.4.exe`.
- Latest local setup SHA-256: `25BBB4536658AEB8D95E95535A28688DE5552A7D635117CEBE83752F197583F1`.
- The setup's embedded version is 3.1.4; source package version is also 3.1.4. This does not establish that every current source edit is inside that EXE.

## Upgrade design and repair sequence

1. Establish one release manifest with Station version, immutable installer URL, size, SHA-256, release date, source revision, supported web protocol range and rollout status. Generate website download metadata from it. Keep desktop version and hosted POS build version separate and visible in diagnostics.
2. Repair and verify update hosting. Serve the versioned setup and blockmap before activating latest.yml. Confirm its size and SHA-512 against the actual downloadable bytes. Use short cache/revalidation for latest.yml; versioned binaries can have long cache lifetimes. Replace the stable download link with a redirect to the approved versioned asset and purge stale cache when changing it.
3. Validate the exact candidate on a test till before changing the public link. Current 3.1.4 is a pilot candidate, not approved for broad production use. A changed desktop source requires a new version and rebuilt artifacts; do not silently replace an existing version.
4. Rehearse 2.0.0-to-candidate and 3.1.x-to-candidate upgrades, including user-data location, pairing, PIN migration, printer profiles and shortcuts. Do not assume installing under a different Windows user preserves DPAPI-encrypted pairing secrets. Offer an explicit re-pair flow when migration cannot retain identity.
5. Prefer the installed edition for managed tills. Show portable users a clear manual upgrade path, and detect obsolete shortcuts/copies without automatically deleting their data.
6. Download updates in the background, but apply only when no sale/payment is in flight, pending offline work is synchronized or durably preserved, and printing has drained. Coordinate the current auto-install-on-quit behavior with the kiosk restart policy. Show retryable update errors and last successful check in the owner dashboard.
7. Deploy web changes separately under `RELEASE_AND_DEPLOYMENT_POLICY.md`. Rebuilding Station alone will not publish the local Laravel/React changes. Existing blocked web ZIPs must not be used as a shortcut.

The current service worker bypasses `/build/` assets, APIs and nonstatic requests. Do not assume clearing all browser storage is the fix for stale screens: verify hosted build identifiers first and preserve IndexedDB/offline sales. The Station cache action currently targets caches/service workers rather than IndexedDB, but should still be used only when safe for an active till.

## Easier pairing

Current flow: owner/admin with `admin.settings_manage` creates a short, expiring, single-use code in Settings; Station asks for a store slug/link and code; `/api/heartbeat` binds the device and returns a device secret. Station stores the secret using Windows-protected storage. This is a useful foundation.

Recommended first-run experience:

1. Station displays a short device code and QR link, with an expiry and a human-readable device label.
2. The owner scans it or enters the code in the signed-in POS, selects the store and counter, and sees the requesting device before approving.
3. Station polls using a separate private request credential. Only the approved device can collect its new secret; the visible QR/code alone must not retrieve it.
4. Station shows the confirmed store and counter, then offers printer selection, a test receipt and optional dedicated-PC setup.

Use atomic single-use approval, short expiry, tenant scoping, rate limits, revocation and audit events. Keep login separate from device pairing: approval of a till must not grant a cashier the owner's account. Retain the current manual store-and-code path for recovery. Add distinct `devices.pair`, `devices.revoke`, `devices.manage_lockdown` and `devices.unlock` permissions rather than relying only on broad settings access. These are proposed permissions, not existing ones.

## Owner-controlled POS-only mode

Provide two explicit modes: ordinary desktop use and a provisioned dedicated POS account. In dedicated mode, Windows starts Station automatically, restarts it after crashes and restricts other applications. A separate owner maintenance account remains available through authenticated recovery.

For the closest fit to a desktop EXE, use Windows Shell Launcher on a supported Enterprise, Education or IoT Enterprise edition, plus application allowlisting and device policies. Shell Launcher alone does not prevent other applications from opening. Windows Pro supports Assigned Access; its restricted-user configuration is a separate option to evaluate against the exact OS build and Station dependencies. The simple single-app Assigned Access experience is for UWP or Edge, not an arbitrary Electron EXE.

Sources: [Microsoft Shell Launcher](https://learn.microsoft.com/en-us/windows/configuration/shell-launcher/) and [Microsoft Assigned Access](https://learn.microsoft.com/en-us/windows/configuration/assigned-access/).

An owner passcode should authorize a short maintenance session through a protected local service, or authenticated switching to a separate maintenance account. Never grant an elevated Windows desktop merely because the renderer says a PIN was accepted. Enforce verification outside the web page, store credentials outside cashier-writable preferences, persist attempt limits across restarts, expire access automatically, and record who unlocked which device. Keep separate offline recovery credentials under owner control; no universal factory passcode.

Ordinary cashier accounts must not be Windows administrators. Provision installation location, file permissions and update elevation deliberately: the current per-user, asInvoker installer is not a complete managed kiosk deployment. Inventory print helpers and any child processes before allowlisting; a broad exception for command interpreters would undermine the restriction.

Lockdown must cover F11, minimize, close, settings, DevTools, external URLs, downloaded files, Explorer dialogs, Task Manager and OS shortcuts. Do not try to make this reliable by killing other processes or intercepting a few keys. Protect normal cashier operation with OS policies; do not promise to defeat an administrator or unrestricted physical access.

Owner experience: select Dedicated POS, complete an edition/prerequisite check and recovery setup, then apply configuration on the intended till. To do other work, choose Owner maintenance, authenticate, and enter a time-limited maintenance session. Returning to the cashier account restores the dedicated POS experience. No lockdown should be applied to a development computer merely to demonstrate it.

## Acceptance gates

- Public installer, displayed metadata and update feed describe the same approved version; verify downloaded bytes and publisher.
- Installed and portable paths show the correct upgrade instructions; old shortcuts cannot silently launch an unnoticed obsolete copy.
- Upgrade, crash, interrupted download, restart and power-loss tests preserve sales, pairing and printer settings.
- Pairing rejects expired, replayed, wrong-store and unauthorized approval attempts; revocation and re-pairing are exercised.
- Cashier escape attempts fail; authorized maintenance, failed-PIN throttling, offline recovery and automatic re-lock work after reboot.
- Printing, scanner, scale, customer display, downloads and OAuth work within the final allowlist.
- A real till rehearsal verifies Windows edition/build, account layout, connectivity loss and safe update timing before rollout.

## Verification limits

The existing Station suite passed 26/26 tests outside the sandbox. The first sandbox run failed two tests involving a local network listener and a preferences-file rename; the unrestricted rerun passed both. These unit tests do not prove installer upgrade, real hardware, pairing end-to-end or kiosk security.

Public HTTP headers and DNS reachability were checked. No authenticated production configuration, installed cashier EXE, live web build ID, Windows target edition or full remote installer hash was inspected. No installer was run, no software was deployed, and no Windows account or security policy was changed. The repository has extensive pre-existing changes; this audit adds only this report.

Recommended order: repair release distribution first, then implement pairing approval, then build and rehearse Windows kiosk provisioning. Release and lockdown implementation remain separate work from this audit.
