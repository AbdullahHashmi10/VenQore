this was the old structure

📦 Store Panel (Main Application)
├── 🏠 Home (Central Hub)
├── 📊 Dashboard (Key Performance Metrics)
│
├── 💰 Sell (Sales Module)
│   ├── 📑 Transactions
│   │   ├── 📄 Orders (Invoices)
│   │   ├── 📝 Quotations / Pre-Sales
│   │   └── ✉️ Proposals
│   ├── 🔄 Post-Sale
│   │   ├── 📜 Returns History
│   │   ├── 🔔 Invoice Reminders
│   │   └── 🔁 Recurring Invoices
│   └── ⚙️ Config
│       └── 📧 E-Invoicing
│
├── 🛒 Purchase (Procurement)
│   ├── 📑 Transactions
│   │   ├── 📥 Purchases (Bills)
│   │   └── 📜 Purchase Orders
│   └── 🔄 Post-Purchase
│       └── 📤 Purchase Returns
│
├── 📦 Stock (Inventory Management)
│   ├── 📚 Catalog
│   │   ├── 🏷️ Products
│   │   ├── 🗂️ Categories
│   │   ├── 🧩 Attributes
│   │   └── 🔖 Labels
│   ├── ⚙️ Operations
│   │   ├── 📉 Stock Levels
│   │   ├── 🔧 Stock Operations
│   │   ├── 🚛 Stock Transfers
│   │   └── 🔍 Stock Audit
│   ├── 🔍 Tracking
│   │   ├── 🔢 Batch Tracking
│   │   └── 🆔 Serial Tracking
│   └── 🏭 Manufacturing
│       ├── 🛠️ Production
│       └── 📖 Cookbook (BOM)
│
├── 👥 Contacts (Relationship Management)
│   ├── 👤 Customers
│   ├── 🏭 Suppliers
│   └── 👥 Parties (Unified Directory)
│
├── 💵 Money (Finance & Accounting)
│   ├── 💸 Cash Flow
│   │   ├── 💳 Payments
│   │   ├── 📉 Expenses
│   │   ├── 📥 To Receive
│   │   └── 📤 To Pay
│   └── 🏦 Banking
│       ├── 💰 Fund Management
│       ├── 🏛️ Bank Accounts
│       └── ⚖️ Bank Reconciliation
│
├── 📈 Insights (Reports & Analytics)
│   ├── 💰 Financial Health (P&L, Balance Sheet, Cash Flow)
│   ├── 📈 Sales Analysis (Sales Reports, Aging)
│   ├── 🛒 Purchase Analysis (Expense Reports)
│   ├── 📦 Inventory (Valuation, Movement, Low Stock)
│   └── 📜 Operational (Activity Logs)
│
└── 🛡️ Admin Panel (System Administration)
    ├── 🏠 Admin Home
    ├── 📊 Executive Dashboard
    ├── 👥 User Management
    ├── ⏰ Staff Attendance & Summaries
    ├── ⚙️ System Settings
    ├── 💾 Data Management (Import / Export / Backups)
    ├── 🛡️ Activity Log
    ├── 🖥️ Database Maintenance
    ├── 🗑️ Recycle Bin
    └── 🚀 System Update


this is the current structure

📦 VenQore SaaS Platform
│
├── 🛡️ Platform HQ (Master Global Panel)
│   ├── 🏠 Platform Home
│   ├── 🏪 Stores Management
│   │   ├── 🆕 Create New Store
│   │   ├── 📋 All Active Stores
│   │   └── ⏸️ Suspended / Trial Stores
│   ├── 👥 Global User Management
│   │   ├── 👤 Unified Identity Directory
│   │   └── 🔐 Platform Permissions
│   ├── 🎫 Support Tickets
│   │   ├── 📥 Open Requests
│   │   └── 📜 Archive
│   ├── 🔗 Webhooks & Integrations
│   └── 📦 System Update
│       └── 🚀 Version Control
│
└── 🏬 Store Individual Panel (Context: /s/{store-slug})
    ├── 🏠 Home (Store Hub)
    ├── 📊 Dashboard (Performance Analytics)
    │
    ├── 💰 Sell (Sales Module)
    │   ├── 📑 Transactions
    │   │   ├── 📄 Orders (Invoices)
    │   │   ├── 📝 Quotations / Pre-Sales
    │   │   └── ✉️ Proposals
    │   ├── 🔄 Post-Sale
    │   │   ├── 📜 Returns History
    │   │   ├── 🔔 Invoice Reminders (Plan Locked)
    │   │   └── 🔁 Recurring Invoices (Plan Locked)
    │   └── ⚙️ Config
    │       └── 📧 E-Invoicing (Plan Locked)
    │
    ├── 🛒 Purchase (Procurement Module)
    │   ├── 📑 Transactions
    │   │   ├── 📥 Purchases (Bills)
    │   │   └── 📜 Purchase Orders
    │   └── 🔄 Post-Purchase
    │       └── 📤 Purchase Returns
    │
    ├── 📦 Stock (Inventory Hub)
    │   ├── 📚 Catalog
    │   │   ├── 🏷️ Products
    │   │   ├── 🗂️ Categories
    │   │   ├── 🧩 Attributes
    │   │   └── 🔖 Labels
    │   ├── ⚙️ Operations
    │   │   ├── 📉 Stock Levels
    │   │   ├── 🔧 Stock Operations
    │   │   ├── 🚛 Stock Transfers
    │   │   └── 🔍 Stock Audit
    │   ├── 🔍 Tracking
    │   │   ├── 🔢 Batch Tracking
    │   │   └── 🆔 Serial Tracking
    │   └── 🏭 Manufacturing
    │       ├── 🛠️ Production (Plan Locked)
    │       └── 📖 Cookbook / BOM (Plan Locked)
    │
    ├── 👥 Contacts (Relationship Management)
    │   ├── 👤 Customers
    │   ├── 🏭 Suppliers
    │   └── 👥 Parties (Unified Directory)
    │
    ├── 💵 Money (Financial Hub)
    │   ├── 💸 Cash Flow
    │   │   ├── 💳 Payments (In/Out)	
    │   │   ├── 📉 Expenses
    │   │   ├── 📥 To Receive
    │   │   └── 📤 To Pay
    │   └── 🏦 Banking
    │       ├── 💰 Fund Management (Plan Locked)
    │       ├── 🏛️ Bank Accounts
    │       └── ⚖️ Bank Reconciliation (Plan Locked)
    │
    ├── 📈 Insights (Reports & Analytics)
    │   ├── 💰 Financial Health (P&L, Balance Sheet, Cash Flow)
    │   ├── 📈 Sales Analysis (Sales Reports, Aging)
    │   ├── 🛒 Purchase Analysis (Expense Reports)
    │   ├── 📦 Inventory (Valuation, Movement, Expiry)
    │   └── 📜 Operational (Activity Logs)
    │
    └── ⚙️ Store Settings (Executive Menu)
        ├── 📊 Dashboard (Security & Staffing Stats)
        ├── 👥 Staff (Scoped Store Employees)
        ├── ⚙️ General Settings (Currency, Logos, Receipts)
        └── 📦 Subscription (Billing & Plan Limits)


this is what i want, 

📦 VenQore SaaS Platform
│
├── 🛡️ Platform HQ (Master Global Panel)
│   ├── 🏠 Platform Home
│   ├── 🏪 Stores Management
│   │   ├── 🆕 Create New Store
│   │   ├── 📋 All Active Stores
│   │   └── ⏸️ Suspended / Trial Stores
│   ├── 👥 Global User Management
│   │   ├── 👤 Unified Identity Directory
│   │   └── 🔐 Platform Permissions
│   ├── 🎫 Support Tickets
│   │   ├── 📥 Open Requests
│   │   └── 📜 Archive
│   ├── 🔗 Webhooks & Integrations
│   └── 📦 System Update
│       └── 🚀 Version Control
│
└── 🏬 Store Individual Panel (Context: /s/{store-slug})
    ├── 🏠 Home (Store Hub)
    ├── 📊 Dashboard (Performance Analytics)
    │
    ├── 💰 Sell (Sales Module)
    │   ├── 📑 Transactions
    │   │   ├── 📄 Orders (Invoices)
    │   │   ├── 📝 Quotations / Pre-Sales
    │   │   └── ✉️ Proposals
    │   ├── 🔄 Post-Sale
    │   │   ├── 📜 Returns History
    │   │   ├── 🔔 Invoice Reminders (Plan Locked)
    │   │   └── 🔁 Recurring Invoices (Plan Locked)
    │   └── ⚙️ Config
    │       └── 📧 E-Invoicing (Plan Locked)
    │
    ├── 🛒 Purchase (Procurement Module)
    │   ├── 📑 Transactions
    │   │   ├── 📥 Purchases (Bills)
    │   │   └── 📜 Purchase Orders
    │   └── 🔄 Post-Purchase
    │       └── 📤 Purchase Returns
    │
    ├── 📦 Stock (Inventory Hub)
    │   ├── 📚 Catalog
    │   │   ├── 🏷️ Products
    │   │   ├── 🗂️ Categories
    │   │   ├── 🧩 Attributes
    │   │   └── 🔖 Labels
    │   ├── ⚙️ Operations
    │   │   ├── 📉 Stock Levels
    │   │   ├── 🔧 Stock Operations
    │   │   ├── 🚛 Stock Transfers
    │   │   └── 🔍 Stock Audit
    │   ├── 🔍 Tracking
    │   │   ├── 🔢 Batch Tracking
    │   │   └── 🆔 Serial Tracking
    │   └── 🏭 Manufacturing
    │       ├── 🛠️ Production (Plan Locked)
    │       └── 📖 Cookbook / BOM (Plan Locked)
    │
    ├── 👥 Contacts (Relationship Management)
    │   ├── 👤 Customers
    │   ├── 🏭 Suppliers
    │   └── 👥 Parties (Unified Directory)
    │
    ├── 💵 Money (Financial Hub)
    │   ├── 💸 Cash Flow
    │   │   ├── 💳 Payments (In/Out)
    │   │   ├── 📉 Expenses
    │   │   ├── 📥 To Receive
    │   │   └── 📤 To Pay
    │   └── 🏦 Banking
    │       ├── 💰 Fund Management (Plan Locked)
    │       ├── 🏛️ Bank Accounts
    │       └── ⚖️ Bank Reconciliation (Plan Locked)
    │
    ├── 📈 Insights (Reports & Analytics)
    │   ├── 💰 Financial Health (P&L, Balance Sheet, Cash Flow)
    │   ├── 📈 Sales Analysis (Sales Reports, Aging)
    │   ├── 🛒 Purchase Analysis (Expense Reports)
    │   ├── 📦 Inventory (Valuation, Movement, Expiry)
    │   └── 📜 Operational (Activity Logs)
    │
└── 🛡️ Admin Panel (System Administration)
    ├── 🏠 Admin Home
    ├── 📊 Executive Dashboard
    ├── 👥 User Management
    ├── ⏰ Staff Attendance & Summaries 
    ├── ⚙️ System Settings
    ├── 💾 Data Management (Import / Export / Backups)
    ├── 🛡️ Activity Log
    ├── 🗑️ Recycle Bin
    └── 📦 Subscription (Billing & Plan Limits)
