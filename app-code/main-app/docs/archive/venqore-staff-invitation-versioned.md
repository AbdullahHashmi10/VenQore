# VenQore — Staff Invitation System
## Versioned Build Plan (V1 → V2 → V3)

---

## Philosophy

Build it right, build it in layers.
Each version is **fully functional and shippable on its own.**
No version leaves the system in a broken or incomplete state.

---

---

# VERSION 1 — Core Invite System (Ship This First)

> **Goal:** Admin can invite staff. Staff can accept. It works. It's secure enough for real use.

---

## V1 — What's Included

### Admin Side

- Add Member form with: **Name, Email, Phone (optional), Role(s)**
- No password field. Ever.
- On submit:
  - System generates a **short alphanumeric code** (e.g. `VQ-A3X9P2`)
  - Code is stored with a **48-hour expiry**
  - Code is **bound to the invited email** (hard-enforced)
  - If email is configured → invite email is sent automatically
  - If email is NOT configured → code is shown to admin to share manually
- Code shown to admin immediately with a **[Copy]** button
- Invite appears as a **pending row** in the Staff list

### Staff List — Pending Rows

Columns: **Name, Email, Phone, Role(s), Invite Code + [Copy], Status, Actions (3-dot)**

**Statuses in V1:**

| Status | Meaning |
|---|---|
| Pending | Invite sent, no action yet |
| No Account | Email not registered on VenQore |
| Awaiting Approval | User accepted, admin needs to confirm |
| Active | User fully joined |
| Expired | 48h window passed |

**3-dot menu in V1:**

| Action | Description |
|---|---|
| Share via WhatsApp | Pre-filled message with code + link |
| Share via Email | Re-triggers invite email |
| Resend | Resets TTL to 48h, resends message |
| Revoke | Cancels the invite immediately |

---

### Invitee Side

**Path A — Magic Link**
- User clicks link in email → lands on `/invite/accept?token=...`
- If not logged in → redirected to login/register → auto-redirected back
- Email match check (if logged-in email ≠ invited email → hard block)
- Shows store name, admin name, role offered
- User clicks **Accept** or **Decline**

**Path B — Hub Code Entry**
- User opens Hub → sees **"Enter Invite Code"** field
- Enters `VQ-A3X9P2` → system validates email match → shows acceptance screen
- Same Accept / Decline screen as Path A

**No Account handling:**
- If invitee hasn't registered yet, status shows `No Account`
- When they register with that email → Hub shows a prompt to check invitations
- They accept from there

---

### Approval Flow (V1 — Always ON, No Toggle Yet)

- User accepts → status → `Awaiting Approval`
- Admin gets an **in-app notification**: *"[Name] accepted your invite. Confirm to add them."*
- Admin clicks **Confirm** → user added → status → `Active`
- Admin clicks **Decline** → invite cancelled → user notified

---

## V1 — What's NOT Included (Saved for Later)

- Auto-approve toggle
- "Viewed" status tracking
- Granular status badges beyond the 5 above
- Token hashing in DB
- Rate limiting on code attempts
- Bulk invites
- Admin approval reminders

---

## V1 — Database Table

```sql
store_invitations
─────────────────
id               UUID PRIMARY KEY
store_id         UUID
invited_by       UUID  -- admin user ID
invitee_name     VARCHAR
invitee_email    VARCHAR
invitee_phone    VARCHAR (nullable)
roles            JSONB
short_code       VARCHAR(10) UNIQUE
token            VARCHAR  -- plain for now, hashed in V2
status           ENUM(pending, no_account, awaiting_approval, active, expired, revoked, declined)
expires_at       TIMESTAMP
accepted_at      TIMESTAMP (nullable)
approved_at      TIMESTAMP (nullable)
created_at       TIMESTAMP
```

---

## V1 — API Endpoints

```
POST   /api/invitations              → Create invite
GET    /api/invitations/:storeId     → List store invites (admin)
GET    /api/invitations/validate     → Validate token from magic link
GET    /api/invitations/mine         → Pending invites for logged-in user
POST   /api/invitations/accept       → Accept invite (by token or code)
POST   /api/invitations/:id/approve  → Admin approves
POST   /api/invitations/:id/revoke   → Admin revokes
POST   /api/invitations/:id/resend   → Resend + reset TTL
```

---

## V1 — Frontend Checklist

**Admin:**
- [ ] Add Member modal (name, email, phone, roles)
- [ ] Staff list table with pending rows
- [ ] Status badges (5 statuses)
- [ ] Invite code display + copy button
- [ ] 3-dot menu (WhatsApp, Email, Resend, Revoke)
- [ ] In-app notification for awaiting approval
- [ ] Confirm / Decline action buttons

**Invitee / Hub:**
- [ ] Magic link landing page
- [ ] Login/Register redirect and return
- [ ] Acceptance screen (store info, role, Accept / Decline)
- [ ] Hub: "Enter Invite Code" field
- [ ] Hub: Pending invitations prompt on first login

---

---

# VERSION 2 — Security Hardening + UX Polish

> **Goal:** Make V1 bulletproof. Add the security layer and smooth out friction points.

---

## V2 — What's Added

### Security Upgrades

- **Token hashing in DB** — Raw token only lives in the URL. DB stores a hash (SHA-256). Even if DB is leaked, tokens are useless.
- **Rate limiting** — Max 3 failed code attempts per hour per IP. Blocks brute-force guessing on short codes.
- **Token scope lock** — Invite token can only perform invite actions. No other API access.
- **Single-use enforcement** — Token is immediately invalidated the moment it is accepted. Cannot be replayed.

### New Status: "Viewed"

- When invitee clicks the magic link, backend silently marks status → `Viewed`
- Admin sees a new badge in the staff list
- No authentication needed to trigger this — just the link click

**Updated Status Set for V2:**

| Status | Meaning |
|---|---|
| Sent | Invite dispatched |
| Viewed | User clicked the link |
| No Account | Email not registered |
| Awaiting Approval | Accepted, pending admin confirm |
| Active | Fully joined |
| Expired | TTL ran out |
| Revoked | Admin cancelled |
| Declined | User declined the invite |

### Auto-Approve Toggle

- New toggle on the Add Member form: **"Require my approval when they accept"**
- Default: ON
- When OFF: user is added instantly the moment they accept (email match still enforced)
- Useful for bulk onboarding scenarios

### Edit Roles on Pending Invite

- New option in 3-dot menu: **Edit Roles**
- Admin can change assigned roles while invite is still pending
- No need to revoke and re-invite just for a role fix

### Admin Approval Reminder

- If an invite sits in `Awaiting Approval` for more than **7 days**, admin receives a reminder notification
- *"You have a pending staff member waiting for your approval: [Name]"*

---

## V2 — Database Changes

```sql
ALTER store_invitations
  ADD token_hash    VARCHAR  -- replaces plain token
  ADD viewed_at     TIMESTAMP (nullable)
  ADD auto_approve  BOOLEAN DEFAULT FALSE
```

---

## V2 — Frontend Checklist

- [ ] Auto-approve toggle on Add Member form
- [ ] "Viewed" status badge
- [ ] Full 8-status badge set
- [ ] Edit Roles in 3-dot menu
- [ ] Rate limit error message on code entry (too many attempts)
- [ ] 7-day approval reminder notification display

---

---

# VERSION 3 — Enterprise Features + Full Polish

> **Goal:** Everything. Handles edge cases, scales to large teams, covers advanced scenarios.

---

## V3 — What's Added

### Bulk Invites

- Admin can upload a **CSV file** with columns: Name, Email, Phone, Role
- System processes each row as an individual invite
- Batch summary shown after: *"12 invites sent. 2 failed (duplicate emails)."*
- Auto-approve recommended/defaulted for bulk

### Invite Templates

- Admin can save **Role Presets** (e.g. "Cashier Package" = Cashier + Inventory View)
- When inviting, select a template instead of picking roles manually every time

### Advanced Invite Link Page

- The `/invite/accept` page gets a full branded design:
  - Store logo and name
  - Admin's name and photo
  - Role(s) being offered with descriptions
  - "What can I do in this store?" expandable section
- Unauthenticated users see: *"You've been invited to join [Store Name]. Create your account to accept."*
  - After signup, automatically redirected to this page — zero extra steps

### Invite Analytics (Admin)

- Per-invite stats on hover or detail view:
  - Times the link was clicked
  - Last viewed timestamp
  - Delivery status (email bounced? not delivered?)

### Invite History & Audit Log

- Completed/expired/revoked invites move to a collapsible **Invite History** section
- Full audit trail per invite: who created it, when it was viewed, accepted, approved, by whom

### Notification Preferences

- Admin can configure:
  - Get notified when invite is viewed: ON/OFF
  - Get notified when invite is accepted: ON/OFF
  - Get approval reminder after X days: configurable (default 7)

### Invitee — My Invitations Page (Full)

- Dedicated page in Hub (not just a prompt)
- Shows all pending invites with store details
- Shows expired invites with note: *"This invite expired. Contact the admin to resend."*
- Shows declined invites with option to reconsider (triggers admin notification)

---

## V3 — Frontend Checklist

- [ ] CSV bulk upload UI + batch result summary
- [ ] Role preset / invite template selector
- [ ] Branded invite acceptance landing page
- [ ] Invite analytics display (per row)
- [ ] Invite history section (collapsed by default)
- [ ] Audit log view per invite
- [ ] Notification preferences settings panel
- [ ] Full "My Invitations" page in Hub

---

---

## Version Comparison Summary

| Feature | V1 | V2 | V3 |
|---|---|---|---|
| Add member (name, email, phone, roles) | ✅ | ✅ | ✅ |
| Invite code + magic link | ✅ | ✅ | ✅ |
| Email + WhatsApp sharing | ✅ | ✅ | ✅ |
| Pending rows in staff list | ✅ | ✅ | ✅ |
| 5 core status badges | ✅ | ✅ | ✅ |
| Resend / Revoke actions | ✅ | ✅ | ✅ |
| Admin approval gate | ✅ | ✅ | ✅ |
| No-account detection + Hub prompt | ✅ | ✅ | ✅ |
| Token hashing in DB | ❌ | ✅ | ✅ |
| Rate limiting on code entry | ❌ | ✅ | ✅ |
| "Viewed" status tracking | ❌ | ✅ | ✅ |
| Full 8-status badge set | ❌ | ✅ | ✅ |
| Auto-approve toggle | ❌ | ✅ | ✅ |
| Edit roles on pending invite | ❌ | ✅ | ✅ |
| Approval reminder (7 days) | ❌ | ✅ | ✅ |
| Bulk CSV invite | ❌ | ❌ | ✅ |
| Invite templates / role presets | ❌ | ❌ | ✅ |
| Branded invite landing page | ❌ | ❌ | ✅ |
| Invite analytics | ❌ | ❌ | ✅ |
| Full audit log | ❌ | ❌ | ✅ |
| Notification preferences | ❌ | ❌ | ✅ |
| Full "My Invitations" Hub page | ❌ | ❌ | ✅ |

---

*VenQore Staff Invitation System — Versioned Plan v1.0*
