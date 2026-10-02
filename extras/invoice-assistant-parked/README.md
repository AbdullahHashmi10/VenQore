# Conversational invoice assistant — PARKED (not part of the app)

Built 2026-10-02, then deliberately removed from the running app. Nothing here is loaded by the application, ships in a release, or reaches users. The migration was never run, so no database table exists.

- `files/` — every new file, laid out exactly as it lived under `app-code/main-app/`. Includes `files/docs/invoice-assistant/HANDOFF.md` (what it does, setup order, decisions, limitations).
- `existing-files-changes.patch` — the edits it made to 7 existing files (SaleController, web.php, console.php, ai_limits.php, ai_models.php, CreateInvoice.jsx, AiUsageRecorder.php). Those files are back to their committed state.

To bring it back: copy the contents of `files/` into `app-code/main-app/`, then from the repo root run `git apply --3way extras/invoice-assistant-parked/existing-files-changes.patch` (files may have moved on, so expect to resolve some conflicts), then follow HANDOFF.md section 2.
