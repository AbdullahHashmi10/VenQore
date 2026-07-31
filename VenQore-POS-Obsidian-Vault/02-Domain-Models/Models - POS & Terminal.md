---
tags: [models, pos, terminal]
---

# Models — POS & Terminal

Part of [[VenQore POS - Home]] · [[POS Terminal Deep Dive]]

## Terminal (`Terminal.php`)
Registered POS device. Fillable: `name, device_id, tenant_id, ip_address, last_heartbeat_at, status, last_status_reason, is_active, paired_at`.

## TerminalActivity
Tracks away/back activity gaps per terminal (idle detection). `terminal` belongsTo.

## TerminalPairingToken (`TerminalPairingToken.php`)
Short-lived single-use pairing token for new-terminal onboarding. Static `generateToken()` (`pair_` prefix), `isUsable()` (unused + not expired).

## StaffAttendance / StaffActivityGap / StaffDailySummary
`StaffAttendance`: `check_in, check_out, last_active_at, total_gap_minutes, status`; `gaps` hasMany StaffActivityGap.
`StaffActivityGap`: idle-time gap tracking during a shift.
`StaffDailySummary`: daily rollup of work hours, casts `work_intervals` array.

## StaffInvitation (`StaffInvitation.php`)
Full invite lifecycle (`pending, no_account, awaiting_approval, active, expired, revoked, declined`). Static `generateShortCode()` (`VQ-XXXXXX`), `generateToken()`. Methods: `isValid()`, `isExpired()`, `primaryRole()`, `statusLabel()`.

## Related
- [[POS Terminal Deep Dive]]
- [[Offline Sync - Dexie & IndexedDB]]
