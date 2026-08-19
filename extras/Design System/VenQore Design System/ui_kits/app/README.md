# VenQore app UI kit

Recreation of the VenQore ERP product surfaces in the v5 language, built from the
supplied dashboard screenshots (`uploads/preview (1..3).webp`) and the component
inventory those screens imply.

- `AppShell.jsx` — 248px rail (logo, module nav, trial card, user + theme toggle),
  glass top bar (search, Ask Vena, live-sync badge, notifications), page header.
- `DashboardScreen.jsx` — KPI row (one mint focal tile), purchases trend, inventory
  ring + meters, sales-by-day bars, payments breakdown, cash position, alerts rail,
  activity feed, one ink Signals card.
- `BlueprintScreen.jsx` — the AI builder: prompt card, module diff list with
  switches, detected-facts chips, go-live checklist, approve → toast.
- `LedgerScreen.jsx` — invoice table with chips, totals row, and a journal modal
  proving debits = credits.

Screens navigate by clicking the rail. Everything is composed from the published
components — no kit-local primitives.

Deliberately blank: any screen the sources did not show (POS terminal, payroll,
VenSynQ channel setup). Ask before inventing them.
