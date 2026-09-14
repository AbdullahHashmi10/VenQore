# Archived dashboard pages

`NewDashboard.jsx` — the v6 Live Card Builder preview. Retired 2026-09-15.

It was never a distinct dashboard: `store.new-dashboard` and `store.dashboard`
both called `DashboardController@index`, which renders `Pages/Dashboard.jsx`.
This file was only reachable via the public `/new-dashboard` preview route,
which rendered it with hardcoded demo figures.

Kept for reference — the card-builder interactions and layout ideas are worth
lifting into the real dashboard. Not routed, not bundled, not resolvable by
Inertia. To view it again, copy it back to `resources/js/Pages/` and add a
temporary platform-admin-only route.
