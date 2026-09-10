# Review previews — landing-3d-redesign

Static, double-clickable previews of the redesigned public pages. No server
needed; start at `index.html`. Built from this branch with
`npx vite build --config scratch/preview/vite.preview.config.mjs && node scratch/preview/gen.cjs`.

Notes:
- Add `#vq3d` to any preview URL to force the 3D hero on (it is normally
  gated behind device capability + prefers-reduced-motion).
- Forms and deep links are stubbed; pricing shows fallback prices (the real
  page reads plans from the database).
- This folder is a review artifact — delete it before merging to main.
