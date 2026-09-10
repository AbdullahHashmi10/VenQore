# Unused page components — archived 5 Sep 2026

Each file below had, at the time of archiving:
  * zero `Inertia::render('<name>')` calls anywhere in routes/ or app/
  * zero imports from any file under resources/js/
  * zero bare-string references to its component path

Restore by copying back to `Original path`.

| File | Original path | Size | Evidence |
|---|---|--:|---|
| `Dashboard.jsx` | `resources/js/Pages/Dashboard.jsx` | 36 KB | Superseded by NewDashboard.jsx, which DashboardController::index already renders. The 26 'Dashboard' string hits in the repo are the nav label, not this component. |
| `PreSales/BestPreSales.jsx` | `resources/js/Pages/PreSales/BestPreSales.jsx` | 16 KB | No route, no import, no string reference. |
| `Sales/Orders/SalesOrdersList.jsx` | `resources/js/Pages/Sales/Orders/SalesOrdersList.jsx` | 9 KB | No route, no import, no string reference. |
| `Reports/Dashboard.jsx` | `resources/js/Pages/Reports/Dashboard.jsx` | 8 KB | No route, no import. Reports hub is Reports/ReportsHub.jsx. |
| `ActivityLog.jsx` | `resources/js/Pages/ActivityLog.jsx` | 3 KB | No route, no import, no string reference. |
| `RedeemSuccess.jsx` | `resources/js/Pages/RedeemSuccess.jsx` | 3 KB | No route, no import. Redeem.jsx is still routed; this success screen is not. |
| `DemoExpired.jsx` | `resources/js/Pages/DemoExpired.jsx` | 3 KB | No route, no import, no string reference. |
| `Admin/Dashboard.jsx` | `resources/js/Pages/Admin/Dashboard.jsx` | 0 KB | 0.6 KB stub. No route, no import. |
| `V3/Purchases/Index.jsx` | `resources/js/Pages/V3/Purchases/Index.jsx` | 0 KB | 0.1 KB stub left from the V3 consolidation. |
