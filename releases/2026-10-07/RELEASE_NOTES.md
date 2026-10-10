# VenQore client release — 7 October 2026

## Artifacts

- `VenQore-Mobile-1.1.0-build2.apk` — Android business pilot
- `VenQore-Station-Setup-3.1.3.exe` — Windows installer with auto-update metadata
- `VenQore-Station-3.1.3-Portable.exe` — portable Windows build
- `latest.yml` — Electron updater metadata for the setup build
- `checksums.json` — SHA-256 hashes and byte sizes

## Verification

- Flutter static analysis: passed
- Flutter navigation and responsive layout tests: 5/5 passed
- Windows Station hardware, printing, security, and preference tests: 24/24 passed
- Android release build: passed
- Windows NSIS installer build: passed
- Windows portable build: passed

## Distribution status

These files are suitable for controlled pilot and internal distribution.

- The Android APK currently uses `com.example.amd_erp_mobile` and the Flutter
  debug signing key. Configure a permanent VenQore application ID and production
  keystore before Play Store distribution.
- The Windows executables are not Authenticode-signed. Windows SmartScreen may
  show an unknown-publisher warning until a code-signing certificate is added.
- The apps load live VenQore workflows. Deploy the matching web application
  changes before giving these builds to users.

## Pilot smoke test

1. Install on a clean Android device and a clean Windows test computer.
2. Sign in and select a business.
3. Verify Dashboard, Sales, POS, sign-out, and restricted-role behavior.
4. On Windows, pair a terminal and test the actual receipt printer, drawer,
   scanner or scale used at the pilot location.
5. Confirm update hosting serves `latest.yml` and the 3.1.3 setup executable
   together before enabling auto-update for users.
