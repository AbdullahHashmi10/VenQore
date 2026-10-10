# VenQore Mobile 1.1.2+4 — launcher branding hotfix

- Replaced Flutter's default launcher artwork with the canonical VenQore SVG
  from the main application.
- Generated Android icons for mdpi, hdpi, xhdpi, xxhdpi, and xxxhdpi.
- Added round launcher icons.
- Added Android 8+ adaptive foreground and background resources.
- Uses the V6 pine background (`#062421`) and keeps the mark inside Android's
  safe mask area so circle, squircle, and rounded-square launchers do not crop it.
- Retains the Google sign-in fix from build 3.

The source mark is stored at `assets/brand/venqore-icon.svg`; launcher assets
can be regenerated with `node tools/make-android-icons.js`.
