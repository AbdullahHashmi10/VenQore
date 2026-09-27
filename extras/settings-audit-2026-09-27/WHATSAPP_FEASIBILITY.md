# WhatsApp receipt and reminder feasibility audit

Date: 27 September 2026. Scope: audit and IDE handoff only; no messages sent and no application behavior changed.

## Decision

Yes, the product can offer a useful Vyapar-like **manual share** flow without a messaging API: choose a party and a specific sale, return, payment, or other document; generate the correct text or PDF; open WhatsApp with a prepared message or invoke the device share sheet; the operator reviews and sends it. A `wa.me` link prepares **text**, not a PDF/image attachment, and does not prove that the user sent it. For unattended scheduled WhatsApp reminders or a true “send and track delivery” button, use the **official WhatsApp Business Platform**, directly through Meta Cloud API or through an approved provider. Do not treat WhatsApp Web scripting as a durable no-API automation method.

The current app has fragments of both approaches, but no reliable end-to-end workflow for the requested receipt sharing or automated WhatsApp reminders. In particular, two paths currently claim a message was sent when it may only have been prepared or simulated.

## What exists today

| Surface | Evidence | Actual behavior / gap |
|---|---|---|
| Sale detail WhatsApp button | `app-code/main-app/resources/js/Pages/Sales/Show.jsx:103`; `app-code/main-app/app/Http/Controllers/CommunicationController.php:31` | Prompts for a number, POSTs, then opens the returned `wa.me` URL. Controller's Twilio send is commented out; it always returns success plus a **mock** URL containing only “receipt ... is ready.” UI says “message queued” although nothing was queued, attached, or verified sent. |
| Receivables WhatsApp links | `app-code/main-app/resources/js/Pages/Finance/Receivables.jsx:291,358` | Open `wa.me` for the raw party number. No amount/message/receipt and no reliable international normalization. |
| Growth Engine outreach | `app-code/main-app/app/Http/Controllers/GrowthEngineController.php:484` | Returns a `wa.me` URL with suggested text and some Pakistan-focused number normalization. This is a workable manual-draft pattern, but not transaction document sharing or a send receipt. |
| Invoice reminder creation/list | `app-code/main-app/app/Http/Controllers/InvoiceReminderController.php:60-145`; `resources/js/Pages/Reminders/Create.jsx`; `resources/js/Pages/Reminders/InvoiceReminders.jsx` | Stores a future reminder with type `email` or `whatsapp`, but no scheduler/worker was found to process `invoice_reminders.scheduled_at`. The list offers manual “Send Now.” The WhatsApp branch tries Twilio only if class/config are present; otherwise logs a simulated send. It catches send errors, then **still marks status `sent` and shows success**. The `email` branch actually attempts SMS, not email. No media/document or delivery callback. |
| Scheduled payment reminder command | `app-code/main-app/app/Console/Commands/SendPaymentReminders.php`; `routes/console.php:219` | Scheduled command sends **email** to overdue parties; it does not process the invoice-reminder records or send WhatsApp. |
| Settings > Messages | `app-code/main-app/resources/js/Pages/Admin/Settings.jsx:741-830` | “Connect Account” has no action. Template button shows an alert. Meta API URL/token/phone ID and `whatsapp_enabled` are stored/displayed but are not wired to either send route. These fields do not establish a provider connection. |
| Other sales actions | `resources/js/Pages/Sales/SalesHistory.jsx:724,939,1257`; `resources/js/Pages/NewInvoice.jsx:1043` | Visible WhatsApp actions are unhandled, TODO, or informational toast. |

`config/services.php` declares a standalone `WHATSAPP_TOKEN`, but the reviewed send controllers refer to `services.twilio.*`, which is not configured there; `composer.json` does not declare Twilio's PHP SDK. A deployed environment may have extra code/config, but this repository does not establish an operational API path. Avoid reading a saved token as proof of a working integration.

The settings inventory's four WhatsApp fields remain correctly classified as having no operational consumer. This note adds the broader communication-path audit. Existing tests contain plan-gate and messaging-report checks, but no receipt-send, reminder delivery, scheduler, or consent-path tests were found.

## Feasible delivery options

### Cost note (checked 27 September 2026)

Manual `wa.me` drafts, PDF downloads and device sharing do not incur a WhatsApp **Business Platform messaging fee**; they use the operator's normal WhatsApp app and connectivity. Meta's direct Business Platform has no general per-message-free promise: it charges per **delivered** message according to destination market and category. Meta currently lists service messages and utility replies to users as no-charge, while business-initiated utility templates such as eligible transaction notices can incur a fee. The exact classification and Pakistan rate must be checked in Meta's live rate card before estimating a budget. See [Meta's current pricing page](https://whatsappbusiness.com/products/platform-pricing/). If using Twilio, its published WhatsApp handling fee is **US$0.005 per message**, inbound or outbound, in addition to applicable Meta fees; [Twilio's pricing page](https://www.twilio.com/en-us/whatsapp/pricing) says pricing was current as of August 2026. A free trial is not the same as free production sending. Older WhatsApp FAQs mentioning 1,000 free conversations describe an earlier pricing model and should not be used for this decision.

| Option | Text | PDF/image | Unattended schedule | Delivery status | API/cost | Fit |
|---|---|---|---|---|---|---|
| `wa.me/<international-number>?text=...` | Prefilled draft; human taps Send | Cannot attach via link | No | No | No messaging API | Good first release for short receipt summary, link, or reminder draft |
| Native/device share sheet from mobile/PWA | User selects WhatsApp and sends prepared PDF/image where browser/device supports file sharing | Possible; browser/platform support must be tested | No | No | No messaging API | Good mobile document-sharing path; desktop needs download/open fallback |
| Download PDF and open chat | Prefilled text plus operator manually attaches PDF | Yes, manually | No | No | No messaging API | Reliable fallback on desktop |
| Secure document link in `wa.me` draft | URL in text; user opens protected receipt | Indirectly | No | App can track link opens, **not WhatsApp delivery** | No messaging API | Useful if recipient access, expiry and privacy are designed carefully |
| Official Business Platform API | Yes, subject to template/window rules | Yes, supported media/document messages and approved media templates as applicable | Yes | Provider/webhook status and errors can be recorded | Meta pricing, possible provider fees | Required for true background automation and delivery reporting |

WhatsApp's [Click to Chat documentation](https://faq.whatsapp.com/5913398998672934) confirms the phone-number format and text-prefill behavior. The link opens a chat; it does not send a message itself. A browser cannot silently put a PDF into another app's chat using `wa.me`. Mobile share-sheet capability depends on platform and browser, so the IDE should prototype it on the actual devices used by stores and preserve a manual fallback.

## Risk and policy boundary

The [WhatsApp Business Messaging Policy](https://whatsappbusiness.com/policy/) applies to the Business App and Platform. It calls for recipient opt-in, honoring opt-outs, and avoiding spam or surprise messages; it says access may be limited or removed for violations. There is **no guaranteed “ban-free” route**, even for manual messages. A person manually sending an expected receipt to the correct party is lower risk than bulk automation, but the product should still record the party's permission and show the final recipient/document before sharing.

On the Business Platform, business-initiated messages use approved templates; free-form replies are limited to the 24-hour customer-service window after the user's last message. Templates and pricing are provider/platform concerns that must be checked at implementation time. The current policy also lists **debt collection** among restricted/prohibited use cases. Ordinary invoice status/transactional notices may differ from collection demands, but the exact payment-reminder content and business category need policy review **before** automating overdue/debt outreach. Do not design this as aggressive debt-collection messaging. [Policy source](https://whatsappbusiness.com/policy/).

Avoid unofficial WhatsApp Web browser automation, QR-session bots, device-emulator clickers and bulk-send extensions as a production transport. They cannot provide a compliant, supportable unattended workflow or reliable delivery records and may trigger account restrictions. This is an architectural recommendation from the official Business policy, not a claim that any specific integration has already been banned.

## What Vyapar publicly shows, and what remains unknown

Vyapar's [invoice sharing page](https://vyaparapp.in/use-cases/share-invoices-instantly) advertises a one-tap WhatsApp PDF share, automated PDF generation, and resend. Its [payment reminder walkthrough](https://vyaparapp.in/videos/how-to-send-payment-reminder) distinguishes selecting a party, a WhatsApp reminder from the user's account, and scheduling a later reminder; its [reminder product page](https://vyaparapp.in/free/invoice-reminder-software) advertises automatic and bulk reminders. These are observable **product capabilities/claims**, not evidence of Vyapar's internal transport or policy arrangement. Public pages do not establish whether each flow uses the device share sheet, its own gateway, Meta Cloud API, another provider, or different transports per platform. Do not imitate an assumed hidden implementation. Reproduce the useful interaction: select exact party/document, preview, share, resend, and clear send status.

## Recommended product shape for the IDE

1. Build one reusable **Share document** action on each eligible transaction detail, history row, and party ledger entry. The action must start from a stable transaction ID and resolve the party on the server. Include sale receipt, sales return/credit note, payment receipt, statement, and purchase-side documents only for appropriate recipient and permission. Do not send a sale receipt when the user selected a return.
2. Show a compact preview: document type and number, party name, normalized international WhatsApp number, amount/currency, and text/PDF/link choice. Allow number correction for the single send without silently overwriting the party record. Hide or explain the action when the transaction has no party/phone or remains draft/void.
3. First release: manual `wa.me` text draft and protected PDF download/share. Label result **“Opened WhatsApp”**, not “Sent.” For image sharing, reuse the canonical receipt renderer only after checking visual quality; a raster image is optional. A PDF is usually clearer for multi-item bills. Desktop fallback: download PDF, open chat, operator attaches it. Do not expose invoice totals, customer names or permanent unauthenticated PDF links in URLs/logs.
4. Move all WhatsApp-related settings into one Messages/WhatsApp section with explicit **Manual sharing** and **Automated delivery** states. Manual mode needs no API credential fields. Automated mode should show provider, connected/verified sender, templates, consent policy, delivery/failed events, and per-tenant message limits. Hide or disable the current “Connect Account,” `whatsapp_enabled`, and “auto-send” promises until backed by working behavior.
5. For automation, choose **one** official transport (Meta Cloud API direct or supported BSP such as Twilio), then implement authenticated credential storage, approved templates, opt-in/opt-out, queue scheduler, duplicate prevention, current balance check immediately before a reminder, send/retry/backoff, webhook-based status, audit trail, and per-tenant isolation. Create `pending/queued/provider-accepted/delivered/failed/cancelled` states; never report `sent` on a simulated call or caught exception.
6. Reconcile the two reminder systems. `invoice_reminders.scheduled_at` currently has no observed dispatcher, while the existing daily command emails parties based on `payment_reminder_days`. Decide whether reminders belong to a specific invoice or an aggregate party balance and make settings/preview/output use the same amount logic. Stop reminders when paid, returned, voided, or opted out.

## Priority and rough effort

These are implementation estimates for a developer familiar with this codebase, **not a commitment**; receipt renderer/API onboarding and real device testing can change them.

| Work | Priority | Rough effort |
|---|---|---|
| Correct misleading success/status, `email`→SMS mismatch, and dead buttons | P0 | 0.5–2 days |
| Manual text draft for exact transaction/party, phone validation, preview | P1 | 1–3 days |
| Reuse/generate PDF, mobile share sheet and desktop fallback, privacy checks | P1 | 2–5 days |
| Consolidate Messages settings and add real integration health/status | P1 | 1–3 days after transport choice |
| Official API onboarding, templates, consent, scheduler, queue, retries, webhooks | P2, after policy/product decision | 1–3+ weeks plus external onboarding/review |

## Tests the IDE should add

- Receipt and return share resolve the **correct transaction and party**, reject cross-tenant IDs, omit drafts/voids, and handle missing/invalid phone numbers.
- Text formatting, country-code normalization, URL encoding, PDF content/layout, expired/protected document links, and mobile/desktop fallback.
- Manual share never marks a message delivered; mock API, exception, and missing credentials never mark reminders sent.
- Scheduled reminder dispatch at the intended tenant-local time, exactly once; cancel on payment/return/opt-out; partial-payment amount is current; provider webhook status is reconciled.
- UI tests for preview, correct recipient, disabled states, and “Opened WhatsApp” wording. Run backend tests against a disposable test database, as the main audit notes.

This was source and public-documentation review. No WhatsApp account, recipient phone, PDF attachment, webhook, or actual reminder was exercised.
