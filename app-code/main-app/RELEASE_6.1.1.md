# Release record: 6.1.1

- Built: 2026-10-01
- Artifact: `AMD_POS_Update_v6.1.1.zip`
- Size: 61,028,372 bytes (58.20 MiB)
- SHA-256: `8488174D8A00865B9B97C5C121820D7D3BFEDEB2645CB0082D5CA0F7CC7C4261`
- Source revision: `dba9f8cf36c1acb4b75c7e7810be4c46161f868c`
- Source state: dirty, 1,612 paths reported by the builder
- Classification: `ARTIFACT VALIDATED FOR STAGING`

## Updater token correction

The previous protocol created an operation token while receiving chunk zero,
required it for chunk one, but returned it only after the final chunk. Every
multi-chunk upload therefore failed with `Invalid or expired update token`.

Version 6.1.1:

- returns the operation token with the first chunk;
- sends that token with later chunks in the new frontend;
- accepts upload chunks from the legacy authenticated, CSRF-protected updater
  page so an existing installation can bootstrap the corrected release;
- continues to require the token and strict phase order for extraction,
  migrations, cache rebuilding, and version recording.

Regression coverage:

- `tests/Feature/UpdaterChunkTokenTest.php`: passed, 7 assertions.
- Browser and SSR production builds: passed.
- Runtime-only archive validation: passed.

## One-time bootstrap for a server running the broken updater

1. Upload the corrected local `app/Http/Controllers/UpdaterController.php` to
   the same path under the live application root, replacing that one file.
2. From the application root, clear the abandoned upload state:

   ```bash
   rm -f storage/update.lock
   rm -rf storage/app/update_chunks
   rm -f storage/app/update_package/update.zip
   php artisan optimize:clear
   ```

3. Reload `/updater`, choose `AMD_POS_Update_v6.1.1.zip`, and start again.
4. Confirm the upload progresses beyond chunk 1 and completes all five stages.
5. Confirm version 6.1.1, no pending migrations, and no update lock.

The 6.1.0 artifact is superseded and must not be installed.
