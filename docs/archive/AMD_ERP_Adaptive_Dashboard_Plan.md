# AMD ERP — Adaptive Dashboard System
## Complete Design & Implementation Plan

---

## THE CORE IDEA

Think of it exactly like your phone's home screen. On your phone you can choose a 4×5 grid or a 5×6 grid and everything — your icons, your widgets — rearranges itself to fit that grid. You can have a big 2×2 weather widget sitting next to four small app icons. You can move things anywhere. You can remove things you never use. And when you come back tomorrow, everything is exactly where you left it.

That is exactly what we are building for AMD ERP's dashboard — but for business data instead of phone apps.

The user owns their dashboard. It is their workspace. Not ours.

---

## PART 1 — THE GRID SYSTEM (The Foundation)

### How the Grid Works

The dashboard is divided into a grid of equal cells. The user chooses how dense that grid is. More columns and rows = more things visible at once but smaller. Fewer columns and rows = bigger cards, fewer things, more breathing room.

### Grid Options the User Can Choose

These are inspired by how phone home screens work:

| Grid Name | Columns × Rows | Best For |
|---|---|---|
| **Comfortable** | 3×3 | Simple overview, older users, large monitors |
| **Standard** | 4×4 | Default — balanced for most users |
| **Compact** | 5×5 | Power users, lots of data at once |
| **Dense** | 6×6 | Analysts, maximum information density |
| **Wide** | 4×3 | Landscape-heavy monitors, fewer but wider cards |
| **Tall** | 3×5 | Portrait-style screens, more rows |

The user picks their grid from a settings panel. The entire dashboard immediately rearranges to fit the new grid. Cards that were 2×1 in the 4×4 grid become proportionally the same in the 5×5 grid.

### Cell Sizes

Every cell in the grid is the same size. A card that occupies 2×1 cells is always twice as wide as a 1×1 card. The cell size itself changes based on the grid density and screen size — the grid always fills the full screen.

### Why Not Fixed 12 Columns

A fixed 12-column grid is a developer tool, not a user tool. Users do not think in columns. They think in "I want this card to be about half the screen wide." The phone-style grid system is much more natural — users already understand it from their phones.

---

## PART 2 — THE WIDGETS (What Goes On The Dashboard)

### Main Dashboard Widgets

Every widget below can be placed anywhere on the grid, resized within its min/max limits, and configured to show only what the user wants.

---

#### 1. Performance Widget
**What it shows:** Sales, Gross Profit, or both  
**Default size:** 2×1  
**Min size:** 1×1  
**Max size:** 4×2  
**Configuration options:**
- Show Sales only / Gross Profit only / Both
- Time period: Today / This Week / This Month / Custom
- Compare to previous period (show +/- percentage)
- Show as number only or with mini sparkline chart

**How it looks at different sizes:**
- 1×1: Just one big number (e.g. Sales: Rs 45,000)
- 2×1: Two numbers side by side (Sales + Gross Profit)
- 4×2: Full card with sparkline trend lines under each number

---

#### 2. Revenue Analytics Widget
**What it shows:** Sales and Gross Profit line chart over time  
**Default size:** 4×3  
**Min size:** 2×2  
**Max size:** Full screen (all columns × all rows)  
**Configuration options:**
- Show Sales line / Gross Profit line / Both
- Time axis: Today (hourly) / Week (daily) / Month (daily) / Year (monthly)
- Chart type: Line / Bar / Area
- Show data labels on hover only or always

**How it looks at different sizes:**
- 2×2: Minimal chart, no labels, just the shape of the curve
- 4×3: Full chart with axes, legend, and interactive hover
- Full screen: Detailed chart with zoom, pan, and data export button

---

#### 3. Outstanding Widget
**What it shows:** To Receive (AR) and To Pay (AP)  
**Default size:** 2×1  
**Min size:** 1×1  
**Max size:** 3×2  
**Configuration options:**
- Show both / To Receive only / To Pay only
- Time filter: All time / This month / This quarter
- Show party breakdown (top 3 who owe most)

**How it looks at different sizes:**
- 1×1: One number (whichever is selected)
- 2×1: Two numbers with colored labels
- 3×2: Two numbers + list of top 3 parties under each

---

#### 4. Net Profit Widget
**What it shows:** Current net profit status (Good/Warning/Critical)  
**Default size:** 2×1  
**Min size:** 1×1  
**Max size:** 3×2  
**Configuration options:**
- Time period: Today / Week / Month / Year
- Show as: Number / Percentage of revenue / Status indicator only
- Profit threshold settings (when does it turn red/yellow/green)

---

#### 5. Cash & Bank Widget (Currently called Right Sidebar)
**What it shows:** Cash in Hand, Bank Accounts, Total Balance  
**Default size:** 2×3  
**Min size:** 1×2  
**Max size:** 3×6  
**Configuration options:**
- Show all accounts / Only cash / Only banks / Selected accounts only
- Show individual account balances or total only
- Show activity feed below balances (Yes/No)
- Show Sale/Purchase quick action buttons (Yes/No)

**Special behavior:** This widget can be placed anywhere — left, right, center, bottom. It is not locked to the right side. If the user wants it on the left, it goes on the left.

---

#### 6. Growth Engine Widget
**What it shows:** AI opportunities, at-risk customers, recovery alerts  
**Default size:** 3×3  
**Min size:** 2×2  
**Max size:** 5×4  
**Configuration options:**
- Show all categories / Only opportunities / Only at-risk / Only overdue
- Number of items to show (3 / 5 / 10)
- Compact list view or detailed card view

---

#### 7. Top Products Widget
**What it shows:** Best selling products by volume and revenue  
**Default size:** 3×2  
**Min size:** 2×2  
**Max size:** 6×4  
**Configuration options:**
- Sort by: Volume / Revenue / Profit margin
- Number of products: 5 / 10 / 20
- Show as: Table / Bar chart / Both

---

#### 8. Low Stock Alerts Widget
**What it shows:** Products below minimum stock threshold  
**Default size:** 3×2  
**Min size:** 2×1  
**Max size:** 6×4  
**Configuration options:**
- Show critical only (0 stock) / Show low stock / Show both
- Number of items: 5 / 10 / All
- Show "Order" quick action button (Yes/No)

---

#### 9. Activity Feed Widget
**What it shows:** Recent transactions — Sales, Purchases, Expenses  
**Default size:** 2×3  
**Min size:** 1×2  
**Max size:** 4×6  
**Configuration options:**
- Filter by type: All / Sales only / Purchases only / Expenses only
- Number of items: 5 / 10 / 20
- Compact (one line per item) or detailed (two lines per item)

---

#### 10. Quick Actions Widget (New)
**What it shows:** Big clickable buttons for common actions  
**Default size:** 2×1  
**Min size:** 1×1  
**Max size:** 4×2  
**Configuration options:**
- Choose which actions to show (New Sale, New Purchase, Add Expense, Receive Payment, Pay Supplier)
- Button style: Icon only / Icon + Label / Label only

---

#### 11. Daily Summary Widget (New)
**What it shows:** Today at a glance — transactions count, cash movement  
**Default size:** 2×1  
**Min size:** 1×1  
**Max size:** 3×2  
**Configuration options:**
- What to include: Sales count / Purchase count / Expense total / Cash in / Cash out

---

#### 12. Party Balance Snapshot Widget (New)
**What it shows:** Quick view of top customers/suppliers and their balances  
**Default size:** 3×2  
**Min size:** 2×2  
**Max size:** 5×4  
**Configuration options:**
- Show customers / suppliers / both
- Sort by: Balance amount / Name / Last activity
- Number of parties: 5 / 10

---

### Admin Dashboard Widgets

The admin dashboard (Executive Dashboard) gets the same treatment:

1. **Pending Actions Widget** — items requiring attention
2. **Profit Margin Widget** — overall business health
3. **Overdue Payments Widget** — late invoices
4. **Purchases Trend Widget** — 6-month spending chart
5. **Inventory Health Widget** — donut chart of stock status
6. **Payments Breakdown Widget** — transaction types donut chart
7. **Expenses Breakdown Widget** — category breakdown donut chart
8. **System Status Widget** — operational status, last backup
9. **Active Staff Widget** — staff count
10. **Money In/Out Widget** — cash flow summary
11. **Alerts Widget** — system and business alerts
12. **Activity Log Widget** — recent user actions

All of these follow the same drag/resize/configure rules as the main dashboard.

---

## PART 3 — HOW THE USER INTERACTS WITH IT

### Entering Edit Mode

In the top bar of the dashboard, there is an **Edit Layout** button (pencil icon). When the user clicks it:

- All widgets get a subtle glowing border to show they are movable
- A drag handle appears in the top-left corner of each widget
- A resize handle appears in the bottom-right corner of each widget
- A `⚙` settings icon appears in the top-right corner of each widget
- A `✕` remove icon appears in the top-right corner of each widget
- An **Add Widget** button appears at the top
- The Grid Settings panel appears (to change grid density)
- A **Save Layout** button appears, and a **Reset to Default** button

Everything else in the app is still visible but non-interactive while in edit mode.

### Dragging Widgets

User clicks and holds the drag handle → widget lifts slightly with a shadow → user drags it → a ghost placeholder shows where it will land → user releases → widget snaps to position. If a widget is dragged on top of another widget, they swap positions automatically.

### Resizing Widgets

User clicks and drags the resize handle in the bottom-right corner of any widget → widget grows or shrinks in grid cell increments → it cannot be made smaller than its minimum size or larger than its maximum size → a small tooltip shows the current size (e.g. "2×3") while resizing.

### Configuring a Widget

User clicks the `⚙` icon on any widget → a small panel slides in from the right showing configuration options specific to that widget → user adjusts settings → changes apply live to the widget in real time → clicking outside the panel closes it and saves.

### Removing a Widget

User clicks the `✕` icon → widget fades out and disappears → a small "Undo" toast notification appears for 5 seconds.

### Adding a Widget

User clicks **Add Widget** in edit mode → a panel slides up from the bottom showing all available widgets as cards → widgets already on the dashboard are greyed out → user clicks any available widget → it appears in the first empty space on the dashboard.

### Changing Grid Density

In edit mode, a small grid picker appears at the top of the dashboard → it looks exactly like the phone home screen grid picker — a visual grid of dots where the user selects their preferred density → when changed, all widgets reposition and resize proportionally.

### Saving

User clicks **Save Layout** → layout is saved to their account → they see a confirmation toast. Next time they log in, their layout is exactly as they left it. Different users can have completely different layouts — a cashier sees different things than a manager.

### Reset to Default

User clicks **Reset to Default** in edit mode → a confirmation dialog appears → if confirmed, layout returns to the original default layout.

---

## PART 4 — THE TOP BAR CHANGES

### Current State (Problem)
Admin panel is hidden behind a tiny avatar menu in the bottom left. Users cannot find it. Settings are scattered.

### New Top Bar Layout

```
[Logo] [Search Bar]          [Growth Engine] [Admin Panel*] [⚙ Settings] [🔔 Notifications]
```

*(Admin Panel button only visible to admins)*

### Admin Panel Button
- Same style as Growth Engine button (pill-shaped, with icon)
- Icon: Shield or Grid icon
- Label: "Admin Panel"
- Only visible if user has admin role
- Clicking takes directly to Admin Panel

### Settings Button (⚙)
Clicking opens a clean dropdown panel with:

```
┌─────────────────────────┐
│  APPEARANCE             │
│  ○ Dark Mode      ✓     │
│  ○ Light Mode           │
│  ○ Text Mode            │
│                         │
│  DASHBOARD              │
│  ✎ Edit Layout          │
│  ⊞ Change Grid          │
│  ↺ Reset to Default     │
│                         │
│  ─────────────────────  │
│  ⚙ Admin Settings  🔒  │  ← Admin only
└─────────────────────────┘
```

The Edit Layout, Change Grid, and Reset options move here instead of being buttons on the dashboard itself. This keeps the dashboard clean.

---

## PART 5 — HOW LAYOUTS ARE SAVED

### Per User Storage

Each user has their own layout saved in the database. The layout is stored as a JSON object in a `user_preferences` table.

Structure:
```json
{
  "user_id": "uuid",
  "dashboard_grid": "4x4",
  "dashboard_layout": [
    {
      "id": "performance",
      "x": 0,
      "y": 0,
      "w": 2,
      "h": 1,
      "config": {
        "show_gross_profit": true,
        "period": "today"
      }
    },
    {
      "id": "revenue_analytics",
      "x": 2,
      "y": 0,
      "w": 4,
      "h": 3,
      "config": {
        "chart_type": "area",
        "show_gross_profit_line": true,
        "period": "month"
      }
    }
  ],
  "admin_dashboard_grid": "4x4",
  "admin_dashboard_layout": [ ... ]
}
```

### When It Saves
- Auto-saves 2 seconds after the user stops making changes (debounced)
- Also saves when user clicks "Save Layout"
- A small "Saved" indicator appears briefly when it saves

### Default Layout
If a user has never customized their dashboard, they see the default layout which is the current dashboard as it exists today. This means existing users are not disrupted when this feature launches.

---

## PART 6 — WIDGET BEHAVIOR AT DIFFERENT SIZES

This is one of the most important design decisions. Each widget must look great at every size it can be. It cannot just shrink — it must adapt its content to fit.

### The Three Display Modes

**Nano mode** (1×1 or 1×2): Show only the single most important number or status. No labels, no extra info. Just the data in large text.

**Normal mode** (default size): Show the full widget as designed. Labels, supporting data, action buttons.

**Expanded mode** (larger than default): Show additional detail. More items in lists, bigger charts with more data points, breakdown sections that are hidden in normal mode.

### Example — Performance Widget at Three Sizes

**1×1 (Nano):**
```
Rs 45,000
Sales Today
```

**2×1 (Normal):**
```
PERFORMANCE         Today ▾
Sales        Gross Profit
Rs 45,000    Rs 12,000
```

**4×2 (Expanded):**
```
PERFORMANCE                    Today ▾
Sales                    Gross Profit
Rs 45,000                Rs 12,000
▁▃▅▇▅▃▁▃▅▇              ▁▁▃▃▅▅▇▇▅▅
+12% vs yesterday        +8% vs yesterday
```

### Example — Revenue Analytics at Three Sizes

**2×2 (Nano):**
Just the chart curve with no axes or labels. The shape tells the story.

**4×3 (Normal):**
Full chart with axes, legend, time selector tabs (Today/Month/Year), hover tooltips.

**Full screen:**
Everything in Normal plus: zoom controls, date range picker, data export button, second chart below comparing this period to last period.

---

## PART 7 — THE WIDGET LIBRARY PANEL

When user clicks Add Widget, a panel slides up from the bottom of the screen showing all widgets:

```
┌─────────────────────────────────────────────────────────────────────┐
│  ADD WIDGET                                          [✕ Close]      │
│                                                                      │
│  ACTIVE (on your dashboard)                                         │
│  [Performance ✓] [Revenue Analytics ✓] [Outstanding ✓]             │
│                                                                      │
│  AVAILABLE TO ADD                                                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │
│  │  Daily       │ │  Party       │ │  Quick       │               │
│  │  Summary     │ │  Snapshot    │ │  Actions     │               │
│  │              │ │              │ │              │               │
│  │  Today at    │ │  Top 5       │ │  New Sale    │               │
│  │  a glance    │ │  balances    │ │  New Purchase│               │
│  │              │ │              │ │              │               │
│  │  [+ Add]     │ │  [+ Add]     │ │  [+ Add]     │               │
│  └──────────────┘ └──────────────┘ └──────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
```

Each card in the library shows:
- Widget name
- Small preview of what it looks like
- Brief description
- Add button

---

## PART 8 — TECHNICAL APPROACH

### Library to Use
**react-grid-layout** — this is the right tool. It is used by Grafana, Kibana, and many professional dashboards. It handles all the drag, drop, resize, and collision logic.

Key features it gives us for free:
- Snap to grid
- Collision detection (widgets cannot overlap)
- Responsive breakpoints
- Drag handles
- Resize handles
- Layout serialization (saving to JSON)

### What We Build On Top
- Widget configuration panels (the ⚙ settings per widget)
- Widget library panel
- Grid picker UI
- Save/load from database
- Widget content adaptation based on size
- Top bar changes

### Implementation Phases

**Phase 1 — Foundation (3-4 days)**
- Install react-grid-layout
- Convert all existing dashboard cards to grid items
- Basic drag and resize working
- Layout saves to localStorage (not database yet)
- Grid density picker working

**Phase 2 — Widget Configuration (2-3 days)**
- Add ⚙ config panel to each widget
- Each widget responds to its config settings
- Widgets adapt their display at different sizes (Nano/Normal/Expanded)

**Phase 3 — Widget Library (1-2 days)**
- Add Widget panel
- Remove and add widgets
- Undo on remove

**Phase 4 — Save to Database (1 day)**
- Create user_preferences table
- API endpoint to save/load layout
- Per-user layouts

**Phase 5 — Top Bar & Admin Dashboard (2 days)**
- New top bar buttons
- Admin Panel button
- Settings dropdown
- Apply same grid system to Admin Executive Dashboard

**Total: approximately 10-12 days of focused work**

---

## PART 9 — THE FEELING IT SHOULD HAVE

This is the most important part. The technology is easy. The feeling is hard.

When a user drags a card it should feel **physical** — like they are sliding a real tile on a board. The card should lift slightly (subtle shadow increase, tiny scale up). The placeholder where it will land should pulse softly. When it drops it should land with a gentle spring animation, not a hard snap.

When a widget resizes, the content inside should reflow smoothly. The chart should redraw as it grows. The text should not jump.

The whole edit mode should feel like a **creative workspace** — something enjoyable to customize, not a settings page to tolerate. Users should want to arrange their dashboard the way they arrange their desk.

The grid picker should feel exactly like the phone home screen grid picker. A satisfying tactile moment of choosing your density.

Configuration panels should be fast and live-updating. Change a setting and see the widget change immediately — no Apply button needed.

---

## PART 10 — ROLLOUT PLAN

### For Existing Users
- Nothing changes on their first login after the update
- They see the dashboard exactly as it was
- A small one-time tooltip appears: "Your dashboard is now customizable — click Edit Layout to get started"
- After they dismiss it, it never appears again

### For New Users
- They see the default layout
- During onboarding (if there is one), a step shows them how to customize their dashboard

### Future Ideas
- **Dashboard Templates** — preset layouts for different roles (Cashier, Manager, Owner, Accountant)
- **Share Layout** — export your layout and share it with another user on the same system
- **Widget-level permissions** — admin can hide certain widgets from certain user roles
- **Scheduled widgets** — a widget that shows different data based on time of day (morning shows today's targets, evening shows today's summary)

---

*Document Version: 1.0*  
*Created for AMD ERP V2.0*  
*Covers: Main Dashboard + Admin Executive Dashboard*  
*Total New Widgets: 12 main + 12 admin = 24 widgets*  
*Estimated Implementation: 10-12 working days*
