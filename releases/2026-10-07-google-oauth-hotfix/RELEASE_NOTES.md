# Google sign-in hotfix — 7 October 2026

## Versions

- VenQore Mobile `1.1.1+3`
- VenQore Station `3.1.4`

## Fixed

Google sign-in can leave VenQore for `https://accounts.google.com` and return
through `/auth/google/callback` in the same application session.

The exception is deliberately narrow:

- VenQore must initiate the flow from `/auth/google`.
- Only the exact HTTPS `accounts.google.com` origin is accepted.
- Look-alike domains and all other external origins remain blocked.
- Google pages cannot call Station hardware IPC APIs.
- The callback must return to a trusted VenQore origin.

## Verification

- Flutter static analysis: passed
- Flutter tests: 6/6 passed
- Windows Station tests: 26/26 passed
- Android release build: passed
- Windows installer and portable builds: passed

Test Google sign-in once on a real Android device and Windows test computer
before sending the hotfix to every pilot user. Google can apply account or
OAuth-client policies that cannot be reproduced without the configured live
account.

## Signing status

These remain pilot/internal distribution builds. The APK still uses the
project's current debug signing configuration, and the Windows executables do
not have an Authenticode publisher certificate.
