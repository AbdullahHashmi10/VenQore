---
tags: [routes, api]
---

# API Routes — `routes/api.php`

Part of [[VenQore POS - Home]] · [[Route Map Overview]]

Sanctum-token / server-to-server API, prefix `/api`.

| Route | Purpose |
|---|---|
| `GET /user` (auth:sanctum) | Current user |
| `POST /heartbeat` | `Api\HeartbeatController@store` |
| `POST /terminal/activities`, `/terminal/screenshot` | `Api\TerminalActivityController` |
| `GET /check-connection` | `Api\SyncController@checkConnection` |
| `GET /sync/users\|products\|customers\|suppliers\|inventory\|taxes` (auth:sanctum) | `Api\SyncController` — offline sync pull |
| `POST /sync/orders/batch` (auth:sanctum) | Offline sync push |
| `POST /webhooks/lemon-squeezy` (HMAC-verified) | `LemonSqueezyWebhookController@handle` |
| `POST /webhooks/pusher` | `PusherWebhookController@handle` |
| `GET /pos/search\|featured\|categories\|barcode/{code}` (auth:sanctum, throttle:pos) | `Api\PosSearchController` |
| `POST /woo/webhook/{uuid}`, `GET /woo/verify/{token}`, `POST /woo/handshake` | `WooSync\WooWebhookController`, `WooSync\WooHandshakeController` |
| `POST /drm/validate`, `GET /drm/protected` (middleware `drm.license`) | `DrmLicenseController` |
| `POST /{store_slug}/chatbot/session`, `/session/{uuid}/message`, `/session/{uuid}/typing` | `VisitorChatController` — public chatbot visitor API |
| `GET /{store_slug}/vena/context`, `POST /{store_slug}/vena/assist` | `VenaContextController`, `VenaAssistController` |
| `GET /api/plan/usage` (top-level, tenant-agnostic) | `Api\PlanUsageController@usage` |

## Related
- [[Offline Sync - Dexie & IndexedDB]]
- [[Controllers Directory]]
