# VenQore ERP — Flutter Mobile App & Product Strategy
## Complete Plan: Build, Sell, and Scale

---

## 1. THE BIG PICTURE

You have a full ERP web system. The mobile app is not a separate system — it is a beautiful mobile interface that talks to the same ERP via API. 

**How it works in one sentence:**
Customer installs ERP on their hosting → opens your Flutter app → enters their website URL + login → app connects and shows all their data beautifully on mobile.

---

## 2. WHAT YOU ARE SELLING

### Product A — ERP Web App (already built)
- Self-hosted on customer's server
- Full browser-based ERP
- Sell on CodeCanyon, LemonSqueezy, Gumroad, AppSumo

### Product B — Flutter Mobile App (to build)
- Connects to their ERP installation
- Works on Android and iOS
- Sell as: free with ERP purchase, or separate purchase, or subscription add-on

### Product C — SaaS Hosted Version (future)
- You host the ERP for them
- Customer pays monthly
- They get web + mobile access
- Highest revenue potential

---

## 3. CONNECTION ARCHITECTURE

```
Customer's Phone (Flutter App)
         ↕ HTTPS API calls
Customer's Hosting (VenQore ERP)
         ↕ Laravel Backend
Customer's Database (MySQL)
```

The Flutter app communicates with the ERP through a REST API. The ERP already has most routes — they just need proper API authentication added (token-based login via Laravel Sanctum).

### Authentication Flow
1. User opens app → enters their ERP URL (e.g. https://shop.com)
2. App calls `POST /api/login` with email + password
3. ERP returns an API token
4. App stores token securely
5. All future requests include `Authorization: Bearer {token}`

---

## 4. API LAYER — WHAT NEEDS TO BE BUILT IN ERP

Add these API routes to the ERP (prefixed with `/api/`):

### Authentication
- `POST /api/login` — returns token
- `POST /api/logout` — revokes token
- `GET /api/user` — current user info

### Dashboard
- `GET /api/dashboard` — cash, sales today, AR, AP, inventory value, recent activity

### Sales
- `GET /api/sales` — list with filters
- `POST /api/sales` — create sale
- `GET /api/sales/{id}` — single sale detail
- `PUT /api/sales/{id}` — update
- `DELETE /api/sales/{id}` — delete
- `GET /api/sales/{id}/pdf` — download invoice

### Purchases
- `GET /api/purchases`
- `POST /api/purchases`
- `GET /api/purchases/{id}`
- `PUT /api/purchases/{id}`
- `DELETE /api/purchases/{id}`

### Parties (Customers & Suppliers)
- `GET /api/parties` — with type filter
- `POST /api/parties`
- `GET /api/parties/{id}`
- `GET /api/parties/{id}/statement` — ledger

### Products & Inventory
- `GET /api/products` — with search
- `POST /api/products`
- `GET /api/products/{id}`
- `GET /api/inventory` — stock levels

### Expenses
- `GET /api/expenses`
- `POST /api/expenses`

### Payments
- `POST /api/payments/in` — receive from customer
- `POST /api/payments/out` — pay to supplier

### Reports
- `GET /api/reports/profit-loss`
- `GET /api/reports/trial-balance`
- `GET /api/reports/cash-flow`
- `GET /api/reports/sales`
- `GET /api/reports/purchases`
- `GET /api/reports/day-book`
- `GET /api/reports/stock-valuation`
- `GET /api/reports/party-statement`
- `GET /api/reports/aged-receivables`
- `GET /api/reports/aged-payables`

### Fund Management
- `GET /api/funds` — cash + bank balances
- `POST /api/funds/add`
- `POST /api/funds/transfer`

### Notifications & Activity
- `GET /api/activity` — recent transactions
- `GET /api/notifications`

---

## 5. FLUTTER APP — COMPLETE SCREEN LIST

### Onboarding & Auth (4 screens)
1. **Splash Screen** — logo animation, check saved URL/token
2. **Connect Screen** — enter ERP URL, validate connection
3. **Login Screen** — email + password, remember me
4. **PIN/Biometric Lock** — optional quick unlock after first login

### Dashboard (1 screen)
5. **Home Dashboard**
   - Cash in Hand (large display)
   - Bank Accounts list
   - Today's Sales + Gross Profit
   - Outstanding: To Receive + To Pay
   - Net Profit (month)
   - Stock Value
   - Recent Activity feed
   - Quick action buttons: New Sale, New Purchase, Add Expense
   - Low Stock Alerts
   - Growth Engine insights widget

### Sales Module (6 screens)
6. **Sales List** — search, filter by date/status, sort
7. **Sale Detail** — full invoice view, payment status, action buttons
8. **Create Sale** — product search, qty, price, customer select, payment
9. **Edit Sale** — same as create with pre-filled data
10. **POS / Quick Sale** — simplified fast checkout for retail
11. **Sale PDF Viewer** — view and share invoice as PDF

### Purchase Module (5 screens)
12. **Purchases List** — search, filter
13. **Purchase Detail** — full view
14. **Create Purchase** — product search, supplier, payment
15. **Edit Purchase**
16. **Purchase Orders List** — view and convert to purchase

### Parties (5 screens)
17. **Parties List** — customers + suppliers, search, balance display
18. **Party Detail** — contact info, balance, credit limit warning
19. **Party Statement** — full ledger history
20. **Add / Edit Party**
21. **Receive Payment** — from customer
22. **Pay Supplier** — to supplier

### Inventory (5 screens)
23. **Products List** — search by name/SKU, stock status badges
24. **Product Detail** — price, cost, stock, category
25. **Add / Edit Product**
26. **Stock Levels** — low stock alerts, valuation
27. **Inventory Batches** — FIFO batch view per product

### Expenses (3 screens)
28. **Expenses List** — search, filter by category/date
29. **Add Expense** — category, amount, cash/bank, attachment photo
30. **Edit Expense**

### Finance & Accounting (4 screens)
31. **Finance Dashboard** — receivables, payables, cash flow chart
32. **Fund Management** — cash in hand, bank accounts, add/transfer funds
33. **Bank Accounts** — list, balances, transactions
34. **Payments History** — all in/out payments

### Reports (12 screens)
35. **Reports Hub** — categorized list of all reports
36. **Profit & Loss** — with date range picker, chart
37. **Trial Balance** — accounts table
38. **Balance Sheet** — assets vs liabilities
39. **Cash Flow** — in/out over time, chart
40. **Day Book** — daily transactions
41. **Sales Report** — with charts
42. **Purchases Report**
43. **Stock Valuation** — inventory value
44. **Party Statement** (linked from party detail)
45. **Aged Receivables** — who owes, how long
46. **Aged Payables** — who you owe, how long

### Notifications & Activity (2 screens)
47. **Notification Center** — all alerts
48. **Activity Log** — full transaction history

### Settings (3 screens)
49. **App Settings** — theme, language, PIN toggle, notifications
50. **Connection Settings** — change ERP URL, re-login
51. **Profile** — user info, change password

**Total: 51 screens**

---

## 6. DESIGN PRINCIPLES

### Visual Style
- Dark mode first (matches the ERP aesthetic)
- Light mode available
- Clean cards with subtle shadows
- Green for income/positive, Red for expense/negative
- Indigo/Purple as brand accent color
- Large numbers for financial figures (easy to read at a glance)

### Key UX Rules
- Every financial number must be large and clearly colored
- Search must be instant with debounce
- Pull to refresh on all list screens
- Offline mode: show cached data with "Last updated" timestamp
- Swipe to delete/edit on list items
- Haptic feedback on important actions
- Confirmations on destructive actions

### Charts (use fl_chart package)
- Line chart for sales over time
- Bar chart for monthly comparison
- Pie chart for expense categories
- Donut chart for receivables vs payables

---

## 7. FLUTTER PACKAGES TO USE

```yaml
dependencies:
  # HTTP & API
  dio: ^5.0.0                    # HTTP client with interceptors
  retrofit: ^4.0.0               # API client generator
  
  # State Management
  flutter_riverpod: ^2.0.0       # Clean state management
  
  # Local Storage
  hive_flutter: ^1.1.0           # Fast local database for offline
  flutter_secure_storage: ^9.0.0 # Secure token storage
  
  # UI Components
  fl_chart: ^0.68.0              # Charts and graphs
  shimmer: ^3.0.0                # Loading placeholders
  cached_network_image: ^3.3.0   # Image caching
  
  # PDF
  flutter_pdfview: ^1.3.0        # View PDFs in app
  
  # Utilities
  intl: ^0.19.0                  # Currency and date formatting
  connectivity_plus: ^6.0.0      # Check internet connection
  local_auth: ^2.1.0             # Biometric/PIN authentication
  share_plus: ^9.0.0             # Share invoices
  image_picker: ^1.0.0           # Expense receipt photos
  url_launcher: ^6.2.0           # Open links
```

---

## 8. PROJECT STRUCTURE

```
lib/
├── core/
│   ├── api/           # API client, interceptors, endpoints
│   ├── auth/          # Token management, login state
│   ├── storage/       # Hive local database
│   └── theme/         # Colors, fonts, styles
├── features/
│   ├── dashboard/     # Home screen
│   ├── sales/         # Sales CRUD + POS
│   ├── purchases/     # Purchases CRUD
│   ├── parties/       # Customers + Suppliers
│   ├── inventory/     # Products + Stock
│   ├── expenses/      # Expenses
│   ├── finance/       # Funds + Bank accounts
│   ├── reports/       # All reports
│   └── settings/      # App settings
├── shared/
│   ├── widgets/       # Reusable UI components
│   ├── utils/         # Currency formatter, date helpers
│   └── models/        # Data models
└── main.dart
```

---

## 9. HOW TO SELL IT

### Option A — Bundle with ERP (Recommended first)
- Customer buys ERP → gets Flutter app source code included
- They compile and publish to their own Play Store / App Store account
- Price ERP higher to include mobile access

### Option B — Compiled App on Play Store
- Publish app on Play Store and App Store yourself
- App is free to download
- On first launch: enter ERP URL + login
- No subscription needed — they just need a running ERP
- Benefit: Easy distribution, professional appearance

### Option C — White Label
- Sell the Flutter source code separately
- Buyer rebrands it with their own logo/colors
- Charge Rs 50,000 - 150,000 for white label rights

### Option D — SaaS (Best long-term revenue)
- You host the ERP for them: Rs 2,000-5,000/month
- They get web + mobile access
- Mobile app connects to your hosted server
- No installation needed for customer

### Pricing Recommendation
- ERP only: $59-79 (CodeCanyon standard)
- ERP + Mobile source: $99-129
- White label: $299-499
- SaaS: $15-25/month per business

---

## 10. HOW LICENSING WORKS FOR MOBILE

For the compiled app approach (Play Store):
- App is free to download — no purchase needed at app level
- License is controlled by the ERP itself
- When customer connects to their ERP URL, the ERP checks their license
- If license is valid → API works → app works
- If license expired → API returns 403 → app shows "License expired" screen

For the source code approach:
- You deliver the Flutter source via email or private GitHub repo
- Customer compiles it themselves with their own bundle ID
- They publish to their own accounts

---

## 11. WHAT TO BUILD FIRST (PRIORITY ORDER)

### Phase 1 — Core (4 weeks)
1. API authentication layer in ERP (Laravel Sanctum)
2. Dashboard API endpoint
3. Flutter: Splash + Connect + Login screens
4. Flutter: Dashboard screen
5. Flutter: Sales list + detail
6. Flutter: Create sale (basic)

### Phase 2 — Transactions (3 weeks)
7. Flutter: Purchases list + create
8. Flutter: Expenses list + create
9. Flutter: Parties list + statement
10. Flutter: Receive/Pay payments

### Phase 3 — Reports & Inventory (2 weeks)
11. Flutter: Reports hub + 5 key reports
12. Flutter: Products list + stock levels
13. Flutter: Fund management

### Phase 4 — Polish (1 week)
14. Offline mode with Hive caching
15. Push notifications
16. PDF viewer for invoices
17. Dark/light theme toggle
18. App Store + Play Store submission

**Total estimated time: 10 weeks with one Flutter developer**

---

## 12. STEP BY STEP — WHAT TO DO NOW

1. **Add Laravel Sanctum to ERP** — `composer require laravel/sanctum`
2. **Create `/api` routes file** — mirror existing web routes as API endpoints
3. **Add API authentication middleware**
4. **Test all API endpoints with Postman**
5. **Start Flutter project** — `flutter create amd_erp_mobile`
6. **Build connection + login flow first**
7. **Build dashboard**
8. **Build sales module**
9. **Continue through priority list above**

---

## 13. NOTES ON APP STORE SUBMISSION

### Play Store (Android)
- Need Google Play Developer account: $25 one-time
- Review time: 1-3 days
- App bundle (.aab) submission

### App Store (iOS)
- Need Apple Developer account: $99/year
- Review time: 1-7 days
- Requires Mac for final build
- More strict review — make sure app works fully before submission

### App Name Suggestions
- VenQore ERP Mobile
- VenQore Business Manager
- VenQore POS & Accounting

---

*Plan created: March 2026*
*ERP Version: V2.0 with V3 Accounting Engine*
*Total Flutter Screens: 51*
*Estimated Build Time: 10 weeks*
