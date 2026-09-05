import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import axios from 'axios';
import './NewDashboard.css';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';

/* The real nav arrives as the shared `nav` prop (ModuleNavBuilder) carrying
   lucide icon NAMES — the same contract QoreShell consumes. */
import {
  ArrowLeftRight, BadgeCheck, BarChart3, Barcode, BookOpen, BookText, BookUser,
  Building2, CalendarClock, Circle, ClipboardCheck, ClipboardList, Coins, Factory,
  FileInput, FileMinus, FileSignature, FileText, GitCompare, Globe, Landmark,
  Layers, Package, Receipt, RefreshCcw, Repeat, ScanLine, ShoppingBag,
  ShoppingCart, Sparkles, Truck, Users, Utensils, Wallet, Settings2,
  Menu, Clock, Sun, Moon, Bell, PenLine, Plus, PanelRight, RotateCcw, Store, Type,
  LayoutDashboard, Box, TrendingUp, ShieldCheck, Settings, Activity, Monitor, User,
  LogOut, ChevronLeft, ChevronUp, Home,
} from 'lucide-react';

const NAV_ICONS = {
  ArrowLeftRight, BadgeCheck, BarChart3, Barcode, BookOpen, BookText, BookUser,
  Building2, CalendarClock, ClipboardCheck, ClipboardList, Coins, Factory,
  FileInput, FileMinus, FileSignature, FileText, GitCompare, Globe, Landmark,
  Layers, Package, Receipt, RefreshCcw, Repeat, ScanLine, ShoppingBag,
  ShoppingCart, Sparkles, Truck, Users, Utensils, Wallet,
};
const NavIcon = ({ name, size = 18 }) => {
  const Cmp = NAV_ICONS[name] || Circle;
  return <Cmp size={size} strokeWidth={1.9} aria-hidden="true" />;
};
/** Group letters (config/modules.php) → the section word the sidebar shows —
    identical to QoreShell so the two shells can never disagree. */
const NAV_GROUP_LABELS = { A:'Catalog', B:'Sell', C:'Stock', D:'Buy', E:'Make', F:'Money', G:'Grow' };
const NAV_GROUP_ORDER = ['A','B','C','D','E','F','G'];

// React Bits Components
import GlassIcons from '@/Components/ReactBits/GlassIcons';
import WelcomeTourModal from '@/Components/WelcomeTourModal';
import DashboardTourGuide from '@/Components/DashboardTourGuide';
import RECKONER_CATALOG from './ReckonerCatalog.json';

/* ══ human copy ════════════════════════════════════════════════════════════
   Every reading carries a plain-language description. The wizard shows ONLY
   the name and this sentence — never the backend key, never the shape, never
   the module. Descriptions are written per key; anything unlisted falls back
   to a sentence built from what the reading is.
   ═════════════════════════════════════════════════════════════════════════ */

const READING_DESC = {
  "accounting.assets": "Everything the business owns — stock, cash, equipment and receivables combined.",
  "accounting.liabilities": "Everything the business owes — supplier dues, loans and unpaid bills combined.",
  "accounting.income_ytd": "All income recorded since the start of this year.",
  "accounting.expense_ytd": "All expenses recorded since the start of this year.",
  "bank_accounts.total_balance": "The combined balance across all your bank accounts.",
  "bank_accounts.cash_on_hand": "Cash currently in the drawer and safe.",
  "bank_accounts.money_in_today": "Money received into your accounts today.",
  "bank_accounts.money_out_today": "Money paid out of your accounts today.",
  "bank_reconciliation.total_txns": "Bank transactions imported and waiting to be checked.",
  "bank_reconciliation.matched": "Bank transactions matched to your books.",
  "bank_reconciliation.unmatched": "Bank transactions that still need matching.",
  "batch_tracking.total_batches": "Product batches currently tracked in stock.",
  "batch_tracking.expiring_soon": "Batches that reach their expiry date soon.",
  "batch_tracking.expired": "Batches already past their expiry date.",
  "batch_tracking.total_qty": "Total quantity held across all tracked batches.",
  "debit_notes.total_notes": "Debit notes raised against suppliers.",
  "purchasing.spend": "Total value of purchases in the selected timeframe.",
  "debit_notes.open_credits": "Supplier credit you can still use against future purchases.",
  "finance.expenses_total": "Everything spent today, across all expense heads.",
  "finance.payables": "What you currently owe suppliers and creditors.",
  "party.supplier_count": "Suppliers you currently owe money to.",
  "finance.avg_balance": "The average balance across your accounts.",
  "finance.receivables": "What customers currently owe you.",
  "party.customer_count": "Customers who currently owe you money.",
  "inventory.total_categories": "Product categories in your catalogue.",
  "inventory.main_categories": "Top-level categories in your catalogue.",
  "inventory.products_linked": "Products linked to your online store.",
  "inventory.product_count": "Products in your catalogue.",
  "inventory.low_stock_count": "Products at or below their reorder level.",
  "inventory.stock_value": "What your current stock is worth at cost.",
  "production.run_count": "Production runs currently in progress.",
  "inventory.completed_today": "Production runs finished today.",
  "production.total_cost": "What production has cost this month.",
  "inventory.out_of_stock_count": "Products with nothing left on the shelf.",
  "pre_sales.total_quotes": "Quotations sent to customers.",
  "pre_sales.pending": "Quotations still waiting on a customer decision.",
  "proposals.total_proposals": "Proposals sent to customers.",
  "proposals.accepted": "Proposals the customer said yes to.",
  "proposals.pending": "Proposals still waiting on a reply.",
  "purchasing.count": "Purchase orders placed with suppliers.",
  "purchase_orders.pending": "Purchase orders not yet delivered.",
  "purchase_orders.received": "Purchase orders delivered and received.",
  "recurring_invoices.total": "Repeating invoices set up for regular customers.",
  "recurring_invoices.active": "Repeating invoices currently running.",
  "recurring_invoices.paused": "Repeating invoices on hold.",
  "recurring_invoices.monthly_revenue": "What your repeating invoices bring in each month.",
  "reminders.total_scheduled": "Payment reminders scheduled to go out.",
  "reminders.pending": "Reminders queued but not yet sent.",
  "reminders.sent": "Reminders already delivered.",
  "reminders.overdue": "Invoices past due that need a follow-up.",
  "returns.total_returns": "Sales returned by customers.",
  "returns.items_returned": "Individual items customers brought back.",
  "returns.total_refunded": "Money refunded on returned sales.",
  "sales.revenue": "Everything you sold in the selected timeframe.",
  "sales_orders.confirmed": "Customer orders confirmed and in progress.",
  "sales_orders.pending": "Customer orders waiting for confirmation.",
  "serial_tracking.total_serials": "Serial-numbered items being tracked.",
  "serial_tracking.in_stock": "Serialised items currently in stock.",
  "serial_tracking.sold": "Serialised items sold.",
  "serial_tracking.returned": "Serialised items returned.",
  "staff.member_count": "People on your team.",
  "staff.on_shift_count": "Team members clocked in right now.",
  "staff_attendance.absent": "Team members not in today.",
  "staff_attendance.pending_gaps": "Attendance gaps awaiting review.",
  "staff_attendance.hours_today": "Hours worked by the whole team today.",
  "sales.revenue_trend": "How your sales move day by day — the classic revenue chart.",
  "sales.payment_breakdown": "How customers paid — cash, card, credit, bank and wallet.",
  "sales.top_products": "Your best sellers, ranked by sales value.",
  "sales.top_customers": "Your biggest customers, ranked by what they bought.",
  "sales.hourly_heatmap": "Your busiest hours, mapped across the week.",
  "sales.live_feed": "The latest sales as they happen, newest first.",
  "sales.avg_order_value": "What the typical sale is worth.",
  "sales.basket_size": "How many items the typical sale contains.",
  "sales.discount_given": "Discounts given away in the selected timeframe.",
  "sales.return_rate": "The share of sales that come back as returns.",
  "sales.conversion_funnel": "Quotes to orders to paid — where deals drop off.",
  "sales.channel_split": "Sales split between your counter, online store and phone orders.",
  "sales.region_split": "Where your sales come from, by area.",
  "finance.profit_trend": "What's left after costs, tracked over time.",
  "finance.cash_flow_trend": "Money coming in against money going out.",
  "finance.expenses_by_category": "Where the money goes — rent, salaries, utilities and more.",
  "finance.receivables_aging": "Customer dues grouped by how overdue they are.",
  "finance.balance_sheet_ok": "A quick check that your books balance.",
  "finance.cash_runway": "How many days your cash lasts at the current burn.",
  "finance.dso": "How long customers take to pay you, on average.",
  "finance.dpo": "How long you take to pay suppliers, on average.",
  "finance.quick_ratio": "Whether liquid assets cover short-term dues.",
  "finance.expense_ratio": "Expenses as a share of income.",
  "finance.tax_liability": "Tax collected and owed for the period.",
  "inventory.low_stock_list": "Every product at or below its reorder level, in one list.",
  "inventory.turnover": "How fast stock sells through and gets replaced.",
  "inventory.days_of_cover": "How many days current stock will last.",
  "inventory.sell_through": "The share of stock received that has already sold.",
  "inventory.dead_stock_value": "Money tied up in stock that hasn't moved.",
  "inventory.value_trend": "How your stock value moves over time.",
  "inventory.by_warehouse": "Where your stock sits, location by location.",
  "inventory.expiry_window": "Products expiring within the next 30 days.",
  "purchasing.spend_trend": "Your purchase history — what you bought, over time.",
  "purchasing.by_supplier": "Which suppliers your money goes to.",
  "purchasing.supplier_concentration": "How much of your buying depends on one supplier.",
  "purchasing.lead_time": "How long suppliers take to deliver, on average.",
  "purchasing.on_time_rate": "The share of orders suppliers deliver on time.",
  "operations.plan_usage": "How much of your VenQore plan you've used.",
  "staff.sales_per_head": "Sales generated per team member.",
  "staff.attendance_rate": "The share of shifts your team showed up for.",
  "operations.open_tickets": "Support tickets waiting on an answer.",
  "party.new_vs_returning": "New faces against regulars, side by side.",
  "party.retention_rate": "The share of customers who come back.",
  "finance.expenses_trend": "Your expense history — what you spent, over time.",
  "operations.activity_feed": "Everything that just happened — sales, purchases, payments and stock moves.",
};

/* A description for anything the table above missed — built from what the
   reading is, still free of jargon. */
function readingDesc(r){
  if (READING_DESC[r.key]) return READING_DESC[r.key];
  const noun = r.unit === "currency" ? "value" : r.unit === "percent" ? "rate" : "count";
  return `${r.label} — a live ${noun} from ${r.area.toLowerCase()}.`;
}

/* ══ module gating ═════════════════════════════════════════════════════════
   Every reading belongs to the product module(s) that produce its data —
   the same module keys config/modules.php declares and the Inertia shell
   shares on every page as the `modules` prop. A business running five
   modules sees the cards those five modules can actually answer, nothing
   else. An empty enabled-set (no tenant bound, the dev harness) gates
   nothing. A reading matching no rule is always available. */
const READING_MODULE_RULES = [
  [/^accounting\./,           ["accounting_workspace"]],
  [/^bank_accounts\./,        ["bank_accounts"]],
  [/^bank_reconciliation\./,  ["bank_reconciliation"]],
  [/^batch_tracking\./,       ["batches_expiry"]],
  [/^debit_notes\./,          ["purchase_returns"]],
  [/^finance\.expenses/,      ["expenses"]],
  [/^finance\.tax/,           ["tax_compliance"]],
  [/^finance\./,              ["khata_credit", "payments", "accounting_workspace"]],
  [/^party\./,                ["customers", "suppliers"]],
  [/^inventory\./,            ["inventory"]],
  [/^production\./,           ["production_runs"]],
  [/^pre_sales\./,            ["pre_sales"]],
  [/^proposals\./,            ["quotations"]],
  [/^purchase_orders\./,      ["purchase_orders"]],
  [/^purchasing\./,           ["purchases", "purchase_orders"]],
  [/^recurring_invoices\./,   ["recurring_invoices"]],
  [/^reminders\./,            ["khata_credit"]],
  [/^returns\./,              ["sales_returns"]],
  [/^sales_orders\./,         ["sales_orders"]],
  [/^sales\./,                ["pos", "invoicing"]],
  [/^serial_tracking\./,      ["serials"]],
  [/^staff\./,                ["staff_attendance"]],
  [/^staff_attendance\./,     ["staff_attendance"]],
  [/^operations\./,           []],
];
function modulesOf(key){
  for (const [re, mods] of READING_MODULE_RULES) if (re.test(key)) return mods;
  return [];
}

function prepareReadings(source) {
  const list = (Array.isArray(source) && source.length > 0) ? [...source] : [...RECKONER_CATALOG];
  if (typeof window !== "undefined" && window.__VENQORE_DEMO_MODE__) {
    list.push(
      { key:"finance.expenses_trend", label:"Expense trend", shape:"SERIES", unit:"currency",
        area:"Finance", module:"Extra", short:"Expense trend", extra:true,
        rowNames:["Rent","Salaries","Utilities","Transport","Marketing","Other"],
        sliceNames:["Rent","Salaries","Utilities","Transport","Other"] },
      { key:"operations.activity_feed", label:"Recent activity", shape:"FEED", unit:"currency",
        area:"Operations", module:"Extra", short:"Recent activity", extra:true,
        rowNames:["Bilal Ahmed","Sana Iqbal","Hamza Raza","Noor Fatima","Ayesha Khan","Usman Ali"],
        sliceNames:["New","Returning","Dormant"] },
      { key:"bank_accounts.liquid_net", label:"Total Liquid Net", shape:"SCALAR", unit:"currency",
        area:"Finance", module:"BankAccounts", short:"Total Liquid Net", extra:true,
        rowNames:["Rent","Salaries","Utilities","Transport","Marketing","Other"],
        sliceNames:["Rent","Salaries","Utilities","Transport","Other"] },
      { key:"purchasing.recent", label:"Recent purchases", shape:"FEED", unit:"currency",
        area:"Purchasing", module:"Extra", short:"Recent purchases", extra:true,
        rowNames:["Metro Supply","Karim Bros","Lahore Foods","Indus Traders","Bahria Wholesale","Ravi Depot"],
        sliceNames:["Metro Supply","Karim Bros","Lahore Foods","Indus Traders"] },
    );
    READING_DESC["bank_accounts.liquid_net"] = "Bank balances and cash in hand, added up — everything liquid.";
    READING_DESC["purchasing.recent"] = "The latest purchases from your suppliers, newest first.";
  }
  list.forEach(r => {
    r.desc = readingDesc(r);
    r.modules = modulesOf(r.key);
    if (!Array.isArray(r.rowNames) || r.rowNames.length === 0) {
      r.rowNames = ["Cash", "Card", "Credit", "Bank", "Online", "Other"];
    }
    if (!Array.isArray(r.sliceNames) || r.sliceNames.length === 0) {
      r.sliceNames = ["Cash", "Card", "Credit", "Bank", "Online"];
    }
  });
  return list;
}

function getDashboardProps() {
  if (typeof window !== "undefined" && window.__DASHBOARD_PROPS__) {
    return window.__DASHBOARD_PROPS__;
  }
  return {};
}

function runCardBuilder(opts) {
  if (typeof window !== "undefined") {
    window.__DASHBOARD_PROPS__ = opts || {};
  }
  /* Inertia remounts this page on every client-side navigation back to it. The
     engine registers document-level listeners, so running it twice would double
     every pointerup and leak a listener per visit. Re-boot the board instead. */
  if (typeof window !== "undefined" && window.VenQoreCards && window.__vqCardEngine){
    window.VenQoreCards.setStoreSlug(opts && opts.storeSlug);
    window.VenQoreCards.setEnabledModules(opts && opts.modules);
    if (opts && opts.readings && window.VenQoreCards.setReadings) {
      window.VenQoreCards.setReadings(opts.readings);
    }
    window.VenQoreCards.boot();
    return;
  }
  if (typeof window !== "undefined") window.__vqCardEngine = true;

  let READINGS = prepareReadings(
    (opts && opts.readings) || (typeof window !== "undefined" && window.__VENQORE_READINGS__) || RECKONER_CATALOG
  );

let ENABLED_MODULES = null;    /* null = ungated (no tenant / dev harness) */
function setEnabledModules(list){
  ENABLED_MODULES = Array.isArray(list) && list.length ? new Set(list) : null;
}
function readingAvailable(r){
  if (!ENABLED_MODULES) return true;
  const mods = r.modules || [];
  if (!mods.length) return true;
  return mods.some(m => ENABLED_MODULES.has(m));
}
function availableReadings(){ return READINGS.filter(readingAvailable); }
/** Hubs gate the same way: by the module that owns their data. */
const SPECIAL_MODULES = {
  bank_liquidity: ["bank_accounts"],
  growth_engine:  ["reports", "ai_insights"],
  charity_hub:    [],
  top_products_hub: ["sales", "pos"],
  recent_purchases_hub: ["purchases"],
  store_health:   ["finance"],
  action_hub: [], launchpad: [], alerts_hub: [], custom_button: [],
};
function specialAvailable(type){
  if (!ENABLED_MODULES) return true;
  const mods = SPECIAL_MODULES[type] || [];
  if (!mods.length) return true;
  return mods.some(m => ENABLED_MODULES.has(m));
}

/* ══ time, scales, formatting ══════════════════════════════════════════════
   Every chart is anchored to real dates so a card can always answer
   "what day is this, and what period am I looking at?"
   ═════════════════════════════════════════════════════════════════════════ */

const MS_H = 3600e3, MS_D = 864e5;
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

/* period → how many points, how far apart, and how each axis tick reads */
const PERIOD = {
  Today:   { n: 12, step: MS_H,     grain: "hour"  },
  Week:    { n: 7,  step: MS_D,     grain: "day"   },
  Month:   { n: 30, step: MS_D,     grain: "day"   },
  Quarter: { n: 13, step: 7 * MS_D, grain: "week"  },
  Year:    { n: 12, step: 30 * MS_D,grain: "month" },
};
const PERIODS = Object.keys(PERIOD);

function anchorNow(){ const d = new Date(); d.setMinutes(0,0,0); return d; }

/** Real timestamps ending now, one per point, spaced by the period's step. */
function timeline(period){
  const { n, step, grain } = PERIOD[period];
  const end = anchorNow();
  if (grain !== "hour") end.setHours(0,0,0,0);
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push(new Date(end.getTime() - i * step));
  return out;
}

/* axis tick label — short, and never ambiguous about which month it is */
function tickLabel(d, grain){
  if (grain === "hour")  return String(d.getHours()).padStart(2,"0") + ":00";
  if (grain === "month") return MON[d.getMonth()];
  return MON[d.getMonth()] + " " + d.getDate();
}
/* tooltip header — the full answer */
function fullLabel(d, grain){
  if (grain === "hour")  return DOW[d.getDay()] + " " + String(d.getHours()).padStart(2,"0") + ":00";
  if (grain === "month") return MON[d.getMonth()] + " " + d.getFullYear();
  if (grain === "week")  return "Week of " + MON[d.getMonth()] + " " + d.getDate();
  return DOW[d.getDay()] + ", " + MON[d.getMonth()] + " " + d.getDate();
}
/* the rolling pill under the axis — split into two stacks */
function tickerParts(d, grain){
  if (grain === "hour")  return { a: DOW[d.getDay()], b: String(d.getHours()).padStart(2,"0") + ":00" };
  if (grain === "month") return { a: String(d.getFullYear()), b: MON[d.getMonth()] };
  return { a: MON[d.getMonth()], b: String(d.getDate()) };
}

/* ── d3-style nice ticks, so the Y axis lands on round numbers ─────────── */
function niceStep(raw){
  const mag = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / mag;
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
}
function niceTicks(min, max, count = 5){
  if (!isFinite(min) || !isFinite(max) || min === max) { max = (max || 1) * 1.2; min = 0; }
  const step = niceStep((max - min) / Math.max(1, count - 1));
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
  const out = [];
  for (let v = lo; v <= hi + step * 1e-9; v += step) out.push(+v.toFixed(10));
  return { ticks: out, lo, hi };
}

/* ── value formatting, by unit ─────────────────────────────────────────── */
function fmtValue(v, unit, compact){
  if (unit === "percent")  return (Math.round(v * 10) / 10) + "%";
  if (unit === "currency") return (compact ? abbrNum(v) : groupNum(Math.round(v)));
  return compact ? abbrNum(v) : groupNum(Math.round(v));
}
function groupNum(n){ return Math.round(n).toLocaleString("en-US"); }
function abbrNum(n){
  const a = Math.abs(n);
  if (a >= 1e9) return (n/1e9).toFixed(1).replace(/\.0$/,"") + "B";
  if (a >= 1e6) return (n/1e6).toFixed(1).replace(/\.0$/,"") + "M";
  if (a >= 1e3) return (n/1e3).toFixed(a >= 1e5 ? 0 : 1).replace(/\.0$/,"") + "K";
  return groupNum(n);
}
function unitPrefix(unit){ return unit === "currency" ? "Rs " : ""; }
function unitSuffix(unit){ return unit === "percent" ? "%" : ""; }

/* ── live reckoner integration & deterministic fallback ─────────────── */
let DASHBOARD_PROPS = {};
const LIVE_RECKONER_DATA = {};
const PENDING_RECKONER_REQUESTS = new Set();
let RECKONER_FETCH_TIMER = null;

function toReckonerPeriod(period) {
  const map = {
    Today: "today",
    Week: "this_week",
    Month: "this_month",
    Quarter: "this_quarter",
    Year: "this_year",
  };
  return map[period] || "this_month";
}

function queueLiveReadings(cards, onComplete) {
  if (!cards || !cards.length || typeof window === "undefined" || typeof axios === "undefined") return;
  const requests = [];
  cards.forEach(c => {
    if (!c || c.type) return;
    const uiPer = c.period || "Month";
    const reckPer = toReckonerPeriod(uiPer);
    const reqKey = `${c.key}|${uiPer}`;
    const mappedKey = `${c.key}|${reckPer}`;
    if (!PENDING_RECKONER_REQUESTS.has(reqKey) && !LIVE_RECKONER_DATA[reqKey] && !LIVE_RECKONER_DATA[mappedKey]) {
      PENDING_RECKONER_REQUESTS.add(reqKey);
      requests.push({ key: c.key, period: reckPer, reqKey, uiPeriod: uiPer });
    }
    if (Array.isArray(c.extraKeys)) {
      c.extraKeys.forEach(ek => {
        const ekReqKey = `${ek}|${uiPer}`;
        const ekMappedKey = `${ek}|${reckPer}`;
        if (!PENDING_RECKONER_REQUESTS.has(ekReqKey) && !LIVE_RECKONER_DATA[ekReqKey] && !LIVE_RECKONER_DATA[ekMappedKey]) {
          PENDING_RECKONER_REQUESTS.add(ekReqKey);
          requests.push({ key: ek, period: reckPer, reqKey: ekReqKey, uiPeriod: uiPer });
        }
      });
    }
  });

  if (!requests.length) {
    if (onComplete) onComplete();
    return;
  }

  const chunks = [];
  for (let i = 0; i < requests.length; i += 24) {
    chunks.push(requests.slice(i, i + 24));
  }

  let hasNewData = false;

  Promise.allSettled(chunks.map(chunk =>
    axios.post("/api/reckoner/read", {
      requests: chunk.map(r => ({ key: r.key, period: r.period }))
    }, { _skipGlobalErrorHandler: true }).then(res => {
      const items = res?.data?.data || [];
      const handledKeys = new Set();
      items.forEach((item, idx) => {
        if (item && item.key) {
          const req = chunk[idx] || chunk.find(r => r.key === item.key);
          const perKey = item.period?.key || req?.period || "today";
          const uiP = req?.uiPeriod || "Month";
          LIVE_RECKONER_DATA[`${item.key}|${perKey}`] = item;
          LIVE_RECKONER_DATA[`${item.key}|${uiP}`] = item;
          if (req?.reqKey) handledKeys.add(req.reqKey);
          hasNewData = true;
        }
      });
      // Mark missing items in this chunk as empty so they won't re-request endlessly
      chunk.forEach(r => {
        if (!handledKeys.has(r.reqKey)) {
          LIVE_RECKONER_DATA[r.reqKey] = { key: r.key, empty: true };
          LIVE_RECKONER_DATA[`${r.key}|${r.period}`] = { key: r.key, empty: true };
        }
      });
    }).catch(() => {
      // Mark chunk as handled on error/offline to prevent infinite loops
      chunk.forEach(r => {
        LIVE_RECKONER_DATA[r.reqKey] = LIVE_RECKONER_DATA[r.reqKey] || { key: r.key, error: true };
        LIVE_RECKONER_DATA[`${r.key}|${r.period}`] = LIVE_RECKONER_DATA[`${r.key}|${r.period}`] || { key: r.key, error: true };
      });
    }).finally(() => {
      chunk.forEach(r => PENDING_RECKONER_REQUESTS.delete(r.reqKey));
    })
  )).then(() => {
    if (hasNewData) {
      // Update charts and values safely on existing board without full destructive DOM wipe
      const board = document.getElementById("board");
      if (board) {
        board.querySelectorAll(".vqc").forEach(el => {
          const c = cardOf(el.dataset.id);
          const host = el.querySelector(".vqc-host");
          if (c && host) mountChart(host, c);
        });
        fitValues(board);
      }
    }
    if (onComplete) onComplete();
  });
}

function seed(str){
  let h = 2166136261;
  for (let i = 0; i < str.length; i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
}
/* readings that genuinely swing either side of zero — a profit/loss chart
   is meaningless if the data can only ever be positive */
const SIGNED = /profit|net_|cash_flow|margin|variance/;

/** Real business series: uses live Reckoner data when available, with clean 0 fallback when empty. */
function valuesFor(key, period, unit){
  const { n } = PERIOD[period] || PERIOD.Month;
  const reqKey = `${key}|${period}`;
  const live = LIVE_RECKONER_DATA[reqKey] || LIVE_RECKONER_DATA[`${key}|${toReckonerPeriod(period)}`];

  if (live && live.ok && live.data !== undefined && live.data !== null) {
    if (live.data.series && Array.isArray(live.data.series)) {
      const pts = live.data.series.map(pt => (typeof pt.y === 'number' ? pt.y : typeof pt.value === 'number' ? pt.value : 0));
      if (pts.length > 0) {
        if (pts.length === n) return pts;
        if (pts.length < n) {
          const pad = new Array(n - pts.length).fill(0);
          return [...pad, ...pts];
        }
        return pts.slice(-n);
      }
      return new Array(n).fill(0);
    }
    if (Array.isArray(live.data) && (live.data.length === 0 || typeof live.data[0] === 'number')) {
      if (live.data.length === 0) return new Array(n).fill(0);
      if (live.data.length >= n) return live.data.slice(-n);
      const pad = new Array(n - live.data.length).fill(live.data[0] || 0);
      return [...pad, ...live.data];
    }
    if (typeof live.data === 'number') {
      return new Array(n).fill(live.data);
    }
    if (typeof live.data === 'object' && live.data.current !== undefined) {
      const curr = Number(live.data.current) || 0;
      const prev = Number(live.data.previous) || curr;
      const out = [];
      for (let i = 0; i < n; i++) {
        out.push(prev + (curr - prev) * (i / Math.max(1, n - 1)));
      }
      return out;
    }
  }

  // Honest production empty state: return 0s instead of fabricated numbers
  return new Array(n).fill(0);
}

/** Everything a cartesian card needs: real times, one array per series. */
function buildSeries(keys, period){
  const times = timeline(period), grain = PERIOD[period].grain;
  const series = keys.map((k, i) => {
    const rd = readingOf(k);
    return { key: k, name: rd.label, unit: rd.unit, color: `var(--vq-series-${(i%8)+1})`,
             values: valuesFor(k, period, rd.unit) };
  });
  return { times, grain, series, period,
           tickLabels: times.map(t => tickLabel(t, grain)),
           fullLabels: times.map(t => fullLabel(t, grain)),
           ticker:     times.map(t => tickerParts(t, grain)) };
}

/** Category breakdown for pie / ring / funnel / bar-ranking. */
function buildParts(key, period, names){
  const reqKey = `${key}|${period}`;
  const live = LIVE_RECKONER_DATA[reqKey] || LIVE_RECKONER_DATA[`${key}|${toReckonerPeriod(period)}`];
  const rd = readingOf(key);

  if (live && live.ok && live.data) {
    const rawItems = live.data.slices || live.data.rows || (Array.isArray(live.data) ? live.data : null);
    if (Array.isArray(rawItems) && rawItems.length > 0) {
      const list = rawItems.map((item, i) => ({
        name: item.name || item.label || item.day || `Item ${i + 1}`,
        value: typeof item.value === 'number' ? item.value : typeof item.total === 'number' ? item.total : Number(item.val || item.sales || item.count || 0),
        color: `var(--vq-series-${(i%8)+1})`,
      })).filter(x => x.value > 0);
      list.sort((a, b) => b.value - a.value);
      const total = Number(live.data.total) || list.reduce((s, x) => s + (x.value || 0), 0) || 0;
      return { parts: list, total: total || 1, unit: rd?.unit || 'currency' };
    }
  }

  // Honest production empty state: no mock slices
  return { parts: [], total: 0, unit: rd?.unit || "currency" };
}
function unitBase(unit){ return unit === "currency" ? 180000 : unit === "percent" ? 22 : 320; }

function readingOf(key){
  const found = Array.isArray(READINGS) ? READINGS.find(r => r.key === key) : null;
  if (found) return found;
  if (Array.isArray(READINGS) && READINGS[0]) return READINGS[0];
  return {
    key: key || "sales.revenue",
    label: "Revenue",
    shape: "SCALAR",
    unit: "currency",
    area: "Sales",
    module: "Sales",
    short: "Revenue",
    extra: false,
    desc: "Revenue for the period.",
    rowNames: ["Cash", "Card", "Credit", "Bank", "Online", "Other"],
    sliceNames: ["Cash", "Card", "Credit", "Bank", "Online"],
  };
}

/* ══ animated numerals + the date ticker ═══════════════════════════════════
   Digits live in a 0-9 column that slides; only the digits that actually
   changed move. Separators and units swap without motion. This is what makes
   a value feel like it *changed* rather than was replaced.
   ═════════════════════════════════════════════════════════════════════════ */

const DIGITS = "0123456789";

/** Shape of a string with every digit flattened — used to detect a rebuild. */
function shapeOf(s){ return String(s).replace(/\d/g, "D"); }

function buildRoller(el, text){
  const s = String(text);
  el.dataset.value = s;
  el.textContent = s;
}

/** Set a value's text. Changed → the text swaps with a soft pulse. The old
    per-digit rolling columns are gone: they depended on every digit row
    measuring exactly 1em against the full app cascade, and in production one
    stray rule made the digits land between rows. A number that is always
    readable beats one that sometimes dances. */
function setRoller(el, text){
  if (!el) return;
  const s = String(text);
  if (el.dataset.value === s) return;
  el.dataset.value = s;
  el.textContent = s;
  el.classList.remove("nf-pulse");
  void el.offsetWidth;                      /* restart the animation */
  el.classList.add("nf-pulse");
}

/** Markup for a roller that some later call will drive. */
function rollerHTML(text, cls = ""){
  const tmp = document.createElement("span");
  tmp.className = "nf " + cls;
  buildRoller(tmp, text);
  return tmp.outerHTML;
}

/* ── date ticker — month and day stacks that scroll to the hovered point ── */
function tickerHTML(parts){
  const stack = (items, key) =>
    `<span class="dt-win"><span class="dt-col" data-k="${key}">`
    + items.map(t => `<i>${t}</i>`).join("") + `</span></span>`;
  /* De-duplicated runs for the coarse stack, one entry per point for the fine one */
  const coarse = [], coarseIndex = [];
  parts.forEach(p => {
    if (!coarse.length || coarse[coarse.length - 1] !== p.a) coarse.push(p.a);
    coarseIndex.push(coarse.length - 1);
  });
  return `<span class="dt" data-coarse="${coarseIndex.join(",")}">`
       + stack(coarse, "a") + stack(parts.map(p => p.b), "b") + `</span>`;
}
const TICK_H = 20;   /* must match .dt-win / .dt-col i in the stylesheet */
function setTicker(el, index){
  if (!el) return;
  const map = (el.dataset.coarse || "").split(",").map(Number);
  const a = el.querySelector('.dt-col[data-k="a"]'), b = el.querySelector('.dt-col[data-k="b"]');
  /* translate in pixels — the column is N items tall, so a percentage here
     would scroll by the whole stack instead of one row */
  if (a) a.style.transform = `translateY(${-(map[index] || 0) * TICK_H}px)`;
  if (b) b.style.transform = `translateY(${-index * TICK_H}px)`;
}

/* ══ chart engine ══════════════════════════════════════════════════════════
   Charts mount into a measured host so text and dots are drawn in real
   pixels. Every cartesian chart gets: a Y axis with round numbers, a dated X
   axis, a crosshair that snaps to the nearest point, a tooltip carrying every
   series' value, and a headline that re-reads to the hovered point.
   ═════════════════════════════════════════════════════════════════════════ */

let CHART_UID = 0;

/* ── variants, per chart type ──────────────────────────────────────────── */
const VARIANTS = {
  area:     [["gradient","Gradient fill"],["solid","Solid fill"],["pattern","Pattern fill"],
             ["step","Stepped"],["stacked","Stacked"],["nofill","Line only"]],
  line:     [["smooth","Smooth"],["linear","Linear"],["step","Stepped"],
             ["dots","With points"],["dashtail","Dashed tail"],["thick","Heavy stroke"]],
  bar:      [["rounded","Rounded"],["square","Square"],["thin","Thin columns"],
             ["grouped","Grouped"],["stacked","Stacked"],["pattern","Pattern fill"]],
  composed: [["bar-trend","Bar + trend line"],["bar-line-area","Bar + line + area"],["bar-two-lines","Bar + two lines"],
             ["stacked-line","Stacked bars + line"],["pattern","Pattern fills"],
             ["thin-columns","Thin columns"],["area-bar","Area + bar"]],
  pl:       [["split","Split fill"],["bars","Diverging bars"],["line","Line only"]],
  live:     [["pulse","Pulsing head"],["trail","Fading trail"],["dots","With points"]],
  pie:      [["solid","Solid"],["donut","Donut"],["exploded","Exploded"],["pattern","Pattern"]],
  ring:     [["concentric","Concentric rings"],["single","Single ring"],["thick","Heavy stroke"]],
  sunburst: [["two-level","Two level"],["three-level","Three level"]],
  gauge:    [["arc","Arc"],["notch","Notched"],["full","Full circle"]],
  funnel:   [["centered","Centered"],["left","Left aligned"],["stepped","Stepped"]],
  radar:    [["filled","Filled"],["outline","Outline"],["dots","With points"]],
  scatter:  [["dots","Dots"],["bubble","Bubble"],["trend","With trend line"]],
  heatmap:  [["square","Square cells"],["rounded","Rounded cells"],["dots","Dot scale"]],
  table:    [["rows","Rows"],["bars","With bars"],["rank","Ranked"]],
  feed:     [["dots","Dots"],["bars","With bars"]],
  stat:     [["number","Number only"],["spark","Sparkline"],["delta","Period comparison"],["plain","Min / avg / max"]],
  sparkline:[["area","Area"],["line","Line"],["bars","Bars"]],
  status:   [["chip","Chip"],["dot","Dot"]],
  treemap:  [["nested","Nested"]],
  sankey:   [["flow","Flow"],["thin","Thin links"]],
  choropleth:[["grid","Region grid"],["list","Ranked list"]],
};
const variantsOf = c => VARIANTS[c] || [["default","Default"]];
const defaultVariant = c => variantsOf(c)[0][0];

/* which charts are cartesian (share the axis + crosshair engine) */
const CARTESIAN = new Set(["area","line","bar","composed","pl","live"]);
const RADIAL    = new Set(["pie","ring","sunburst"]);

/* ── path builders ─────────────────────────────────────────────────────── */
const P = (x,y) => `${x.toFixed(1)} ${y.toFixed(1)}`;
function pathLinear(pts){ return "M" + pts.map(p => P(p[0],p[1])).join(" L"); }
function pathStep(pts){
  let d = "M" + P(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++){
    const mx = (pts[i-1][0] + pts[i][0]) / 2;
    d += ` L${P(mx, pts[i-1][1])} L${P(mx, pts[i][1])} L${P(pts[i][0], pts[i][1])}`;
  }
  return d;
}
/* Catmull-Rom → cubic bezier, alpha ≈ 0.42 like the reference */
function pathSmooth(pts, t = 0.42){
  if (pts.length < 3) return pathLinear(pts);
  let d = "M" + P(pts[0][0], pts[0][1]);
  for (let i = 0; i < pts.length - 1; i++){
    const p0 = pts[i-1] || pts[i], p1 = pts[i], p2 = pts[i+1], p3 = pts[i+2] || p2;
    const c1 = [p1[0] + (p2[0]-p0[0]) * t/3, p1[1] + (p2[1]-p0[1]) * t/3];
    const c2 = [p2[0] - (p3[0]-p1[0]) * t/3, p2[1] - (p3[1]-p1[1]) * t/3];
    d += ` C${P(c1[0],c1[1])} ${P(c2[0],c2[1])} ${P(p2[0],p2[1])}`;
  }
  return d;
}
function curveFor(variant){
  return variant === "step" ? pathStep : variant === "linear" ? pathLinear : pathSmooth;
}

/* ── the cartesian engine ──────────────────────────────────────────────── */
function mountCartesian(host, card){
  const { W, H } = hostDimensions(host, card);
  const keys = [card.key, ...(card.extraKeys || [])];
  const ds = buildSeries(keys, card.period);
  const uid = "ck" + (++CHART_UID);
  const variant = card.variant || defaultVariant(card.chart);

  /* split series across a left and right axis when units disagree, so a
     rupee series and a percentage series can share one card honestly */
  const units = [...new Set(ds.series.map(s => s.unit))];
  const rightUnit = units.length > 1 ? units[1] : null;
  const axisOf = s => (rightUnit && s.unit === rightUnit) ? "right" : "left";

  const m = { l: 48, r: rightUnit ? 48 : 12, t: 12, b: 30 };
  const pw = Math.max(20, W - m.l - m.r), ph = Math.max(20, H - m.t - m.b);

  const domainFor = side => {
    const vals = ds.series.filter(s => axisOf(s) === side).flatMap(s => s.values);
    if (!vals.length) return null;
    const stacked = /stacked/.test(variant) && ds.series.length > 1;
    const hi = stacked
      ? Math.max(...ds.times.map((_,i) => ds.series.reduce((a,s) => a + s.values[i], 0)))
      : Math.max(...vals);
    return niceTicks(Math.min(0, Math.min(...vals)), hi, 5);
  };
  const L = domainFor("left"), Rt = rightUnit ? domainFor("right") : null;
  const yOf = (v, side) => {
    const D = side === "right" ? Rt : L;
    return m.t + ph - ((v - D.lo) / (D.hi - D.lo || 1)) * ph;
  };
  const n = ds.times.length;
  const xOf = i => m.l + (n === 1 ? pw/2 : (i * pw) / (n - 1));
  const bandW = pw / n;

  /* ── axes ── */
  const yLabels = (D, side) => D.ticks.map(v =>
    `<text class="ck-lab" x="${side === "right" ? W - m.r + 8 : m.l - 8}" y="${(yOf(v, side) + 4).toFixed(1)}"
      text-anchor="${side === "right" ? "start" : "end"}">${fmtValue(v, side === "right" ? rightUnit : ds.series[0].unit, true)}</text>`).join("");
  const grid = L.ticks.map(v =>
    `<line class="ck-grid" x1="${m.l}" x2="${W - m.r}" y1="${yOf(v,"left").toFixed(1)}" y2="${yOf(v,"left").toFixed(1)}"/>`).join("");

  const maxXT = Math.max(2, Math.floor(pw / 66));
  const stepXT = Math.max(1, Math.ceil(n / maxXT));
  const keep = new Set();
  for (let i = 0; i < n; i += stepXT) keep.add(i);
  keep.add(n - 1);
  /* the stepped run can land right next to the final tick — drop it if so */
  const sorted = [...keep].sort((a,b) => a-b);
  if (sorted.length > 1 && (n - 1 - sorted[sorted.length - 2]) < stepXT) keep.delete(sorted[sorted.length - 2]);
  const xLabels = ds.tickLabels.map((t, i) => keep.has(i)
    ? `<text class="ck-lab" x="${xOf(i).toFixed(1)}" y="${H - 8}" text-anchor="${i === 0 ? "start" : i === n-1 ? "end" : "middle"}">${t}</text>`
    : "").join("");

  /* ── series marks ── */
  const defs = [], marks = [];
  const stackTop = new Array(n).fill(0);
  const isStacked = /stacked/.test(variant) && ds.series.length > 1;

  /* z-order: areas wash underneath, bars sit on them, lines read on top —
     otherwise a later area fill paints over earlier columns */
  const Z = { area: 0, bar: 1, line: 2 };
  const order = ds.series.map((s, si) => si)
    .sort((a, b) => Z[roleFor(card.chart, variant, a)] - Z[roleFor(card.chart, variant, b)]);

  order.forEach(si => {
    const s = ds.series[si];
    const side = axisOf(s);
    const pts = s.values.map((v, i) => [xOf(i), yOf(isStacked ? (stackTop[i] += v) : v, side)]);
    const role = roleFor(card.chart, variant, si);
    const gid = `${uid}-g${si}`;

    if (role === "bar"){
      const groupN = card.chart === "bar" && variant === "grouped" ? ds.series.length : 1;
      const bw = Math.min(22, Math.max(3, bandW * (variant === "thin" ? 0.22 : variant === "thin-columns" ? 0.3 : 0.55) / groupN));
      const rx = variant === "square" ? 0 : Math.min(4, bw / 2);
      const off = groupN > 1 ? (si - (groupN - 1) / 2) * bw : 0;
      const fill = variant === "pattern" && si === 0 ? `url(#${uid}-pat)` : s.color;
      if (variant === "pattern" && si === 0) defs.push(patternDef(`${uid}-pat`, s.color));
      marks.push(`<g class="ck-s ck-s--bar" data-i="${si}">` + s.values.map((v, i) => {
        const y0 = isStacked ? yOf(stackTop[i], side) : yOf(v, side);
        const base = yOf(Math.max(0, L.lo), side);
        const yTop = Math.min(y0, base), hgt = Math.max(1.5, Math.abs(base - y0));
        return `<rect class="ck-bar" data-x="${i}" x="${(xOf(i) - bw/2 + off).toFixed(1)}" y="${yTop.toFixed(1)}"
          width="${bw.toFixed(1)}" height="${hgt.toFixed(1)}" rx="${rx}" fill="${fill}"/>`;
      }).join("") + `</g>`);
    }
    else if (role === "area"){
      const curve = curveFor(variant === "step" ? "step" : "smooth");
      const base = yOf(Math.max(0, L.lo), side);
      const solid = variant === "solid", pat = variant === "pattern";
      if (pat) defs.push(patternDef(`${uid}-pa${si}`, s.color));
      else defs.push(`<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${s.color}" stop-opacity="${solid ? .45 : .3}"/>
        <stop offset="100%" stop-color="${s.color}" stop-opacity="${solid ? .28 : 0}"/></linearGradient>`);
      const fill = pat ? `url(#${uid}-pa${si})` : `url(#${gid})`;
      const areaPath = variant === "nofill" ? ""
        : `<path class="ck-area" d="${curve(pts)} L${P(pts[n-1][0], base)} L${P(pts[0][0], base)} Z" fill="${fill}"/>`;
      marks.push(`<g class="ck-s" data-i="${si}">${areaPath}
        <path class="ck-line" d="${curve(pts)}" stroke="${s.color}"/></g>`);
    }
    else { /* line */
      const curve = curveFor(variant === "step" ? "step" : variant === "linear" ? "linear" : "smooth");
      const dash = variant === "dashtail" ? ` stroke-dasharray="6 5"` : "";
      const sw = variant === "thick" ? 3.5 : 2.5;
      const dots = (variant === "dots" || variant === "trend")
        ? pts.map(p => `<circle class="ck-pt" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" fill="${s.color}"/>`).join("") : "";
      /* the trail fades the history out behind the head instead of pulsing it */
      let body;
      if (card.chart === "live" && variant === "trail"){
        const seg = [];
        for (let k = 1; k < n; k++){
          seg.push(`<path class="ck-line" d="${pathLinear([pts[k-1], pts[k]])}" stroke="${s.color}"
            stroke-width="${sw}" opacity="${(0.08 + 0.92 * (k / (n-1))).toFixed(2)}"/>`);
        }
        body = seg.join("");
      } else {
        body = `<path class="ck-line" d="${curve(pts)}" stroke="${s.color}" stroke-width="${sw}"${dash}/>`;
      }
      const head = card.chart === "live" && si === 0
        ? `<circle class="${variant === "trail" ? "ck-cap" : "ck-pulse"}" cx="${pts[n-1][0].toFixed(1)}"
             cy="${pts[n-1][1].toFixed(1)}" r="4.5" fill="${s.color}"/>` : "";
      marks.push(`<g class="ck-s" data-i="${si}">${body}${dots}${head}</g>`);
    }
  });

  /* bar + trend: the same series drawn twice — columns for the level, a
     smoothed line for the direction. Works with a single reading. */
  if (card.chart === "composed" && variant === "bar-trend" && ds.series.length === 1){
    const s0 = ds.series[0], side = axisOf(s0);
    const pts = s0.values.map((v,i) => [xOf(i), yOf(v, side)]);
    marks.push(`<g class="ck-s" data-i="${ds.series.length}">
      <path class="ck-line" d="${pathSmooth(pts)}" stroke="var(--vq-series-3)" stroke-width="2.5"/></g>`);
  }

  /* profit / loss gets a diverging split around zero */
  if (card.chart === "pl"){
    marks.length = 0;
    const s = ds.series[0], zero = yOf(0, "left");
    const pts = s.values.map((v,i) => [xOf(i), yOf(v, "left")]);
    const d = pathSmooth(pts);
    if (variant === "bars"){
      const bw = Math.max(2, bandW * 0.6);
      marks.push(`<g class="ck-s" data-i="0">` + s.values.map((v,i) => {
        const y = yOf(v, "left"), up = v >= 0;
        return `<rect class="ck-bar" data-x="${i}" x="${(xOf(i) - bw/2).toFixed(1)}"
          y="${Math.min(y, zero).toFixed(1)}" width="${bw.toFixed(1)}"
          height="${Math.max(1.5, Math.abs(zero - y)).toFixed(1)}" rx="3"
          fill="var(--vq-div-${up ? "pos" : "neg"}-2)"/>`;
      }).join("")
      + `<line class="ck-zero" x1="${m.l}" x2="${W-m.r}" y1="${zero.toFixed(1)}" y2="${zero.toFixed(1)}"/></g>`);
    } else if (variant === "line"){
      marks.push(`<g class="ck-s" data-i="0">
        <line class="ck-zero" x1="${m.l}" x2="${W-m.r}" y1="${zero.toFixed(1)}" y2="${zero.toFixed(1)}"/>
        <path class="ck-line" d="${d}" stroke="var(--vq-series-1-ink)" stroke-width="2.5"/>
        ${s.values.map((v,i) => `<circle class="ck-pt" cx="${xOf(i).toFixed(1)}" cy="${yOf(v,"left").toFixed(1)}"
          r="3.5" fill="var(--vq-div-${v >= 0 ? "pos" : "neg"}-2)"/>`).join("")}</g>`);
    } else {
    defs.push(`<clipPath id="${uid}-up"><rect x="0" y="0" width="${W}" height="${zero.toFixed(1)}"/></clipPath>
               <clipPath id="${uid}-dn"><rect x="0" y="${zero.toFixed(1)}" width="${W}" height="${(H-zero).toFixed(1)}"/></clipPath>`);
    const areaD = `${d} L${P(pts[n-1][0], zero)} L${P(pts[0][0], zero)} Z`;
    marks.push(`<g class="ck-s" data-i="0">
      <path d="${areaD}" fill="var(--vq-div-pos-1)" opacity=".5" clip-path="url(#${uid}-up)"/>
      <path d="${areaD}" fill="var(--vq-div-neg-1)" opacity=".5" clip-path="url(#${uid}-dn)"/>
      <line class="ck-zero" x1="${m.l}" x2="${W-m.r}" y1="${zero.toFixed(1)}" y2="${zero.toFixed(1)}"/>
      <path class="ck-line" d="${d}" stroke="var(--vq-series-1-ink)"/></g>`);
    }
  }

  /* ── hover furniture ── */
  const dots = ds.series.map((s, si) =>
    `<circle class="ck-hd" data-i="${si}" r="4.5" fill="var(--vq-surface)" stroke="${s.color}" stroke-width="2.5"/>`).join("");

  host.innerHTML = `
    <svg class="ck" width="${W}" height="${H}" role="img">
      <defs>${defs.join("")}</defs>
      <g class="ck-grids">${grid}</g>
      <g class="ck-axis">${yLabels(L, "left")}${Rt ? yLabels(Rt, "right") : ""}${xLabels}</g>
      <g class="ck-plot" style="clip-path:inset(0 100% 0 0)">${marks.join("")}</g>
      <g class="ck-hover" style="opacity:0">
        <line class="ck-cross" y1="${m.t}" y2="${m.t + ph}"/>
        ${dots}
      </g>
      <rect class="ck-cap" x="${m.l}" y="${m.t}" width="${pw}" height="${ph}" fill="transparent"/>
    </svg>
    <div class="ck-tip" hidden></div>
    <div class="ck-ticker" hidden>${tickerHTML(ds.ticker)}</div>`;

  requestAnimationFrame(() => {
    const plot = host.querySelector(".ck-plot");
    if (plot) plot.style.clipPath = "inset(0 0% 0 0)";
  });

  wireCartesian(host, card, ds, { xOf, yOf, axisOf, m, pw, ph, W, H, bandW, n });
}

function roleFor(chart, variant, si){
  if (chart === "bar") return "bar";
  if (chart === "area") return si === 0 ? "area" : (variant === "stacked" ? "area" : "line");
  if (chart === "line" || chart === "live" || chart === "pl") return "line";
  if (chart === "composed"){
    if (variant === "bar-trend")      return si === 0 ? "bar" : "line";
    if (variant === "bar-two-lines")  return si === 0 ? "bar"  : "line";
    if (variant === "area-bar")       return si === 0 ? "area" : "bar";
    if (variant === "stacked-line")   return si < 2 ? "bar" : "line";
    return si === 0 ? "bar" : si === 1 ? "area" : "line";
  }
  return "line";
}
function patternDef(id, color){
  return `<pattern id="${id}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="7" height="7" fill="${color}" opacity=".22"/>
    <line x1="0" y1="0" x2="0" y2="7" stroke="${color}" stroke-width="3"/></pattern>`;
}

/* ── interaction: snap to nearest point, report every series ───────────── */
function wireCartesian(host, card, ds, g){
  const svg   = host.querySelector(".ck");
  const cap   = host.querySelector(".ck-cap");
  const hover = host.querySelector(".ck-hover");
  const cross = host.querySelector(".ck-cross");
  const tip   = host.querySelector(".ck-tip");
  const tick  = host.querySelector(".ck-ticker");
  const tickEl= host.querySelector(".dt");
  const plot  = host.querySelector(".ck-plot");
  const head  = host.closest(".vqc")?.querySelector(".vqc-value[data-full] .nf");
  const headSub = host.closest(".vqc")?.querySelector(".vqc-when");
  const hds   = [...host.querySelectorAll(".ck-hd")];
  const bars  = [...host.querySelectorAll(".ck-bar")];
  let active = -1;

  /* the headline may be running in its abbreviated form — hover re-reads
     must respect that, or the hover value overflows what fitValues fitted */
  const headCompact = () => head?.closest(".vqc-value")?.dataset.mode === "compact";
  const restText = () => {
    const s0 = ds.series[0], last = s0.values[s0.values.length - 1];
    return { v: unitPrefix(s0.unit) + fmtValue(last, s0.unit, headCompact()), when: rangeLabel(ds) };
  };

  function show(i){
    if (i === active) return;
    active = i;
    hover.style.opacity = "1";
    plot.classList.add("is-hovering");
    const x = g.xOf(i);
    cross.style.transform = `translateX(${x.toFixed(1)}px)`;
    ds.series.forEach((s, si) => {
      const d = hds[si]; if (!d) return;
      d.style.transform = `translate(${x.toFixed(1)}px, ${g.yOf(s.values[i], g.axisOf(s)).toFixed(1)}px)`;
    });
    bars.forEach(b => b.classList.toggle("is-on", +b.dataset.x === i));
    tip.hidden = false;
    tip.innerHTML = `<p class="ck-tip-h">${ds.fullLabels[i]}</p>`
      + ds.series.map(s => `<span class="ck-tip-r"><span class="ck-tip-d" style="background:${s.color}"></span>
          <span class="ck-tip-n">${s.name}</span>
          <b class="ck-tip-v">${unitPrefix(s.unit)}${fmtValue(s.values[i], s.unit)}</b></span>`).join("");
    const tw = tip.offsetWidth || 150;
    tip.style.left = Math.max(4, Math.min(g.W - tw - 4, x - tw / 2)) + "px";
    tick.hidden = false;
    tick.style.left = x.toFixed(1) + "px";
    setTicker(tickEl, i);
    if (head) setRoller(head, unitPrefix(ds.series[0].unit) + fmtValue(ds.series[0].values[i], ds.series[0].unit, headCompact()));
    if (headSub) headSub.textContent = ds.fullLabels[i];
  }
  function clear(){
    active = -1;
    hover.style.opacity = "0";
    plot.classList.remove("is-hovering");
    bars.forEach(b => b.classList.remove("is-on"));
    tip.hidden = true; tick.hidden = true;
    const r = restText();
    if (head) setRoller(head, r.v);
    if (headSub) headSub.textContent = r.when;
  }
  const idxFrom = ev => {
    const r = svg.getBoundingClientRect();
    const x = ev.clientX - r.left;
    return Math.max(0, Math.min(g.n - 1, Math.round((x - g.m.l) / (g.pw / Math.max(1, g.n - 1)))));
  };
  cap.addEventListener("mousemove", e => show(idxFrom(e)));
  cap.addEventListener("mouseleave", clear);
  cap.addEventListener("touchmove", e => { e.preventDefault(); show(idxFrom(e.touches[0])); }, { passive:false });
  cap.addEventListener("touchend", clear);
}

function rangeLabel(ds){
  const a = ds.times[0], b = ds.times[ds.times.length - 1];
  const f = d => tickLabel(d, ds.grain);
  return ds.period === "Today" ? `Today · ${f(a)}–${f(b)}` : `${ds.period} · ${f(a)} – ${f(b)}`;
}

/* ── radial: legend hover swaps the centre, other slices dim ───────────── */
function mountRadial(host, card){
  const { W: HW, H: HH } = hostDimensions(host, card);
  const pd0 = buildParts(card.key, card.period, readingOf(card.key)?.sliceNames);
  if (!pd0.parts || pd0.parts.length === 0) {
    host.innerHTML = `<div class="ck-empty" style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--vq-text-muted);font-size:12px;"><span style="opacity:0.6;">No category breakdown recorded</span></div>`;
    return;
  }
  const legH = Math.min(HH * 0.5, (pd0.parts?.length || 1) * 30 + 6);
  const size = Math.max(84, Math.min(HW, HH - legH - 8, 210));
  const pd = pd0;
  const variant = card.variant || defaultVariant(card.chart);
  const cx = size/2, cy = size/2, R = size/2 - 4;
  const inner = card.chart === "pie"
    ? (variant === "donut" ? R * 0.58 : 0)
    : R * 0.56;

  let arcs = "", pdefs = "";
  if (card.chart === "ring" && variant === "thick"){
    /* one heavy ring carrying the leading share, not a stack of thin ones */
    const frac = (pd.parts[0]?.value || 0) / (pd.total || 1);
    arcs = `<path class="ck-track" d="${arcPath(cx,cy,R*0.44,R,0,1)}" fill="var(--vq-chart-track-data)"/>`
         + `<path class="ck-seg" data-i="0" d="${arcPath(cx,cy,R*0.44,R,0,frac)}" fill="${pd.parts[0]?.color || "var(--vq-series-1)"}"/>`;
  } else if (card.chart === "sunburst" && variant === "three-level"){
    const band = (R - R*0.3) / 3;
    for (let lvl = 0; lvl < 3; lvl++){
      const r1 = R - lvl*band, r0 = r1 - band*0.86;
      const set = pd.parts.slice(0, 4 - lvl);
      const tot = set.reduce((a,b)=>a+(b?.value||0),0) || 1;
      let a = 0;
      set.forEach((p, i) => { const f = (p?.value || 0) / tot;
        arcs += `<path class="ck-seg" data-i="${i}" d="${arcPath(cx,cy,r0,r1,a,a+f)}" fill="${p?.color || "var(--vq-series-1)"}"
                  stroke="var(--vq-chart-surface)" stroke-width="1.5" opacity="${(1 - lvl*0.18).toFixed(2)}"/>`;
        a += f; });
    }
  } else if (card.chart === "ring" && variant !== "single"){
    /* concentric rings — one track + one value arc per part */
    const band = (R - inner) / Math.max(1, pd.parts.length);
    pd.parts.forEach((p, i) => {
      const r1 = R - i * band, r0 = r1 - band * 0.72;
      const frac = (p?.value || 0) / (pd.parts[0]?.value || 1);
      arcs += `<path class="ck-track" d="${arcPath(cx,cy,r0,r1,0,1)}" fill="var(--vq-chart-track-data)"/>`
           +  `<path class="ck-seg" data-i="${i}" d="${arcPath(cx,cy,r0,r1,0,Math.min(1,frac))}" fill="${p?.color || "var(--vq-series-1)"}"/>`;
    });
  } else {
    let a = 0;
    pd.parts.forEach((p, i) => {
      const f = (p?.value || 0) / (pd.total || 1);
      const pop = variant === "exploded" ? 4 : 0;
      let fill = p?.color || "var(--vq-series-1)";
      if (variant === "pattern"){
        const pid = `${"pt" + (++CHART_UID)}`;
        pdefs += patternDef(pid, p.color);
        fill = `url(#${pid})`;
      }
      arcs += `<path class="ck-seg" data-i="${i}" d="${arcPath(cx,cy,inner,R - (i%2?pop:0),a,a+f)}" fill="${fill}"
                stroke="var(--vq-chart-surface)" stroke-width="2"/>`;
      a += f;
    });
  }

  const centreV = unitPrefix(pd.unit) + fmtValue(pd.total, pd.unit, true);
  /* The legend never scrolls and never clips: rows that do not fit the space
     the dial left over are folded into one quiet "+N more" line. Each legend
     row (name + bar) lays out at ~34px; the more-line takes one slot. */
  const LEG_ROW = 34, MORE_ROW = 20;
  const legRoom = Math.max(0, HH - size - 10);
  const fit = Math.floor((legRoom + 4) / LEG_ROW);
  const useRows = fit >= pd.parts.length
    ? pd.parts
    : pd.parts.slice(0, Math.max(0, Math.floor((legRoom + 4 - MORE_ROW) / LEG_ROW)));
  const moreN = pd.parts.length - useRows.length;
  host.innerHTML = `
    <div class="ck-radial">
      <div class="ck-dial" style="width:${size}px;height:${size}px">
        <svg width="${size}" height="${size}" class="ck-rsvg"><defs>${pdefs}</defs>${arcs}</svg>
        ${inner > 0 || card.chart === "ring" ? `<span class="ck-centre">
          <span class="ck-centre-v">${rollerHTML(centreV)}</span>
          <span class="ck-centre-k">${centreLabel(card)}</span></span>` : ""}
      </div>
      <div class="ck-leg">${useRows.map((p,i) => `
        <button class="ck-leg-r" data-i="${i}">
          <span class="ck-leg-d" style="background:${p.color}"></span>
          <span class="ck-leg-n">${p.name}</span>
          <span class="ck-leg-v">${unitPrefix(pd.unit)}${fmtValue(p.value, pd.unit, true)}</span>
          <span class="ck-leg-p">${Math.round(p.value / pd.total * 100)}%</span>
          <span class="ck-leg-bar"><i style="width:${(p.value/pd.parts[0].value*100).toFixed(0)}%;background:${p.color}"></i></span>
        </button>`).join("")}${moreN > 0 && useRows.length ? `
        <span class="ck-leg-more">+ ${moreN} more in the full view</span>` : ""}</div>
    </div>`;

  const dial = host.querySelector(".ck-dial");
  const nf   = host.querySelector(".ck-centre-v .nf");
  const lab  = host.querySelector(".ck-centre-k");
  const segs = [...host.querySelectorAll(".ck-seg")];
  host.querySelectorAll(".ck-leg-r").forEach(btn => {
    const i = +btn.dataset.i;
    const on = () => {
      dial.classList.add("is-focus");
      segs.forEach(s => s.classList.toggle("is-dim", +s.dataset.i !== i));
      host.querySelectorAll(".ck-leg-r").forEach(r => r.classList.toggle("is-dim", +r.dataset.i !== i));
      btn.classList.add("is-on");
      setRoller(nf, unitPrefix(pd.unit) + fmtValue(pd.parts[i].value, pd.unit, true));
      if (lab) lab.textContent = pd.parts[i].name;
    };
    const off = () => {
      dial.classList.remove("is-focus");
      segs.forEach(s => s.classList.remove("is-dim"));
      host.querySelectorAll(".ck-leg-r").forEach(r => r.classList.remove("is-dim","is-on"));
      setRoller(nf, centreV);
      if (lab) lab.textContent = centreLabel(card);
    };
    btn.addEventListener("mouseenter", on);
    btn.addEventListener("focus", on);
    btn.addEventListener("mouseleave", off);
    btn.addEventListener("blur", off);
  });
  segs.forEach(s => {
    s.addEventListener("mouseenter", () =>
      host.querySelector(`.ck-leg-r[data-i="${s.dataset.i}"]`)?.dispatchEvent(new Event("mouseenter")));
    s.addEventListener("mouseleave", () =>
      host.querySelector(`.ck-leg-r[data-i="${s.dataset.i}"]`)?.dispatchEvent(new Event("mouseleave")));
  });
}
/* the centre has room for about a dozen characters — say "Total", not a
   truncated copy of the card title that is already above it */
function centreLabel(card){
  const rd = readingOf(card.key);
  return rd.unit === "currency" ? "Total" : rd.unit === "percent" ? "Share" : "All";
}
function arcPath(cx, cy, r0, r1, f0, f1){
  const TAU = Math.PI * 2, a0 = -Math.PI/2 + f0*TAU, a1 = -Math.PI/2 + f1*TAU;
  const big = (f1 - f0) > 0.5 ? 1 : 0;
  if (f1 - f0 >= 0.9999){
    return `M${P(cx-r1,cy)}A${r1} ${r1} 0 1 1 ${P(cx+r1,cy)}A${r1} ${r1} 0 1 1 ${P(cx-r1,cy)}Z`
         + (r0 > 0 ? `M${P(cx-r0,cy)}A${r0} ${r0} 0 1 0 ${P(cx+r0,cy)}A${r0} ${r0} 0 1 0 ${P(cx-r0,cy)}Z` : "");
  }
  const x = (r,a) => cx + r*Math.cos(a), y = (r,a) => cy + r*Math.sin(a);
  return `M${P(x(r1,a0),y(r1,a0))}A${r1} ${r1} 0 ${big} 1 ${P(x(r1,a1),y(r1,a1))}`
       + `L${P(x(r0,a1),y(r0,a1))}A${r0} ${r0} 0 ${big} 0 ${P(x(r0,a0),y(r0,a0))}Z`;
}

/* ══ the remaining chart families ══════════════════════════════════════════ */

function mountGauge(host, card){
  const { W, H } = hostDimensions(host, card);
  const S = Math.min(W, H);
  const size = Math.max(90, Math.min(S - 16, 250));
  const rd = readingOf(card.key);
  const vals = valuesFor(card.key, card.period, rd.unit);
  const v = vals[vals.length - 1];
  const max = rd.unit === "percent" ? 100 : Math.ceil(Math.max(...vals) * 1.25);
  const frac = Math.max(0, Math.min(1, v / max));
  const variant = card.variant || "arc";
  const cx = size/2, cy = size/2, R = size/2 - 6, w = Math.max(9, size * 0.075);
  const span = variant === "full" ? 1 : 0.75;
  const rot = variant === "full" ? 0 : 0.625;
  const arc = (f, cls, col) => `<path class="${cls}" d="${arcPath(cx,cy,R-w,R, rot, rot + span*f)}" fill="${col}"/>`;
  let notches = "";
  if (variant === "notch"){
    notches = Array.from({length: 28}, (_, i) => {
      const f = i / 27, on = f <= frac;
      const a = (rot + span * f) * Math.PI * 2 - Math.PI/2;
      const x1 = cx + (R-w)*Math.cos(a), y1 = cy + (R-w)*Math.sin(a);
      const x2 = cx + R*Math.cos(a),     y2 = cy + R*Math.sin(a);
      return `<line class="ck-notch${on?" is-on":""}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}"
        x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" style="--d:${i*22}ms"/>`;
    }).join("");
  }
  host.innerHTML = `<div class="ck-radial">
    <div class="ck-dial" style="width:${size}px;height:${size}px">
      <svg width="${size}" height="${size}" class="ck-rsvg">
        ${variant === "notch" ? notches
          : arc(1,"ck-track","var(--vq-chart-track-data)") + arc(frac,"ck-seg","var(--vq-series-1-ink)")}
      </svg>
      <span class="ck-centre">
        <span class="ck-centre-v">${rollerHTML(unitPrefix(rd.unit) + fmtValue(v, rd.unit, true))}</span>
        <span class="ck-centre-k">of ${fmtValue(max, rd.unit, true)}</span></span>
    </div></div>`;
}

function mountFunnel(host, card){
  const H = Math.max(90, host.clientHeight);
  const LAB = 150;                                  /* the label column, in px */
  const W = Math.max(80, host.clientWidth - LAB - 16);
  const pd = buildParts(card.key, card.period, readingOf(card.key)?.rowNames);
  const rows = pd.parts.slice(0, 5), mx = (rows[0]?.value || 1), rh = H / Math.max(1, rows.length);
  const variant = card.variant || "centered";
  const shapes = rows.map((p, i) => {
    const bw = ((p?.value || 0) / mx) * W * 0.94;
    const x = variant === "left" ? 0 : (W - bw) / 2;
    return `<rect class="ck-fn" data-i="${i}" x="${x.toFixed(1)}" y="${(i*rh+3).toFixed(1)}"
      width="${bw.toFixed(1)}" height="${(rh-6).toFixed(1)}" rx="${variant==="stepped"?2:6}" fill="${p?.color || "var(--vq-series-1)"}" style="--d:${i*70}ms"/>`;
  }).join("");
  host.innerHTML = `<div class="ck-fnw">
    <svg width="${W}" height="${H}" class="ck-fsvg" viewBox="0 0 ${W} ${H}">${shapes}</svg>
    <div class="ck-fnl" style="width:${LAB}px">${rows.map((p,i) => `<div class="ck-fnr" data-i="${i}">
      <span>${p.name}</span><b>${unitPrefix(pd.unit)}${fmtValue(p?.value || 0, pd.unit, true)}</b>
      <em>${Math.round((p?.value || 0)/mx*100)}%</em></div>`).join("")}</div></div>`;
  linkRows(host, ".ck-fn", ".ck-fnr");
}

function mountRadar(host, card){
  const { W, H } = hostDimensions(host, card);
  const S = Math.max(120, Math.min(W - 20, H - 20));
  const pd = buildParts(card.key, card.period, (readingOf(card.key)?.rowNames || []).slice(0,6));
  const ax = pd.parts.slice(0,6), n = Math.max(1, ax.length), mx = Math.max(1, ...ax.map(p=>p?.value || 0));
  const cx = S/2, cy = S/2, R = S/2 - 38;
  const variant = card.variant || "filled";
  const pt = (i,f) => { const a = -Math.PI/2 + 2*Math.PI*i/n; return [cx + R*f*Math.cos(a), cy + R*f*Math.sin(a)]; };
  const rings = [0.25,0.5,0.75,1].map(k =>
    `<polygon class="ck-rgrid" points="${ax.map((_,i)=>pt(i,k).map(v=>v.toFixed(1)).join(",")).join(" ")}"/>`).join("");
  const spokes = ax.map((_,i)=>{ const [x,y]=pt(i,1);
    return `<line class="ck-rgrid" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`; }).join("");
  const poly = ax.map((p,i)=>pt(i,(p?.value || 0)/mx).map(v=>v.toFixed(1)).join(",")).join(" ");
  const dots = variant === "dots" ? ax.map((p,i)=>{ const [x,y]=pt(i,(p?.value || 0)/mx);
    return `<circle class="ck-pt" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="var(--vq-series-1-ink)"/>`; }).join("") : "";
  const labs = ax.map((p,i)=>{ const [x,y]=pt(i,1.17);
    return `<text class="ck-lab" x="${x.toFixed(1)}" y="${(y+4).toFixed(1)}" text-anchor="middle">${p.name.slice(0,10)}</text>`; }).join("");
  host.innerHTML = `<div class="ck-radial"><svg width="${S}" height="${S}" class="ck-rsvg">
    ${rings}${spokes}
    <polygon class="ck-rpoly" points="${poly}" fill="${variant==="outline"?"none":"var(--vq-series-1-ink)"}"
      fill-opacity="${variant==="outline"?0:.22}" stroke="var(--vq-series-1-ink)" stroke-width="2"/>
    ${dots}${labs}</svg></div>`;
}

function mountScatter(host, card){
  const { W, H } = hostDimensions(host, card);
  const reqKey = `${card.key}|${card.period}`;
  const live = LIVE_RECKONER_DATA[reqKey] || LIVE_RECKONER_DATA[`${card.key}|${toReckonerPeriod(card.period)}`];
  const pts = Array.isArray(live?.data?.points) ? live.data.points : [];

  if (pts.length === 0) {
    host.innerHTML = `<div class="ck-empty" style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--vq-text-muted);font-size:12px;"><span style="opacity:0.6;">No scatter data for this period</span></div>`;
    return;
  }

  const m = { l:44, r:12, t:10, b:26 }, pw = W-m.l-m.r, ph = H-m.t-m.b;
  const rd = readingOf(card.key);
  const xs = niceTicks(0, 100, 5), ys = niceTicks(0, 100, 5);
  const grid = ys.ticks.map(v => { const y = m.t+ph-(v/100)*ph;
    return `<line class="ck-grid" x1="${m.l}" x2="${W-m.r}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"/>
            <text class="ck-lab" x="${m.l-8}" y="${(y+4).toFixed(1)}" text-anchor="end">${v}</text>`; }).join("");
  const xlab = xs.ticks.map(v => { const x = m.l+(v/100)*pw;
    return `<text class="ck-lab" x="${x.toFixed(1)}" y="${H-8}" text-anchor="middle">${v}</text>`; }).join("");
  const variant = card.variant || "dots";
  const dots = pts.map((p,i) => `<circle class="ck-sc" data-i="${i}" cx="${(m.l+(p.x||0)*pw).toFixed(1)}"
    cy="${(m.t+ph-(p.y||0)*ph).toFixed(1)}" r="${variant==="bubble"?(p.w||4).toFixed(1):4.5}"
    fill="var(--vq-series-1-ink)" fill-opacity=".55" style="--d:${i*14}ms"><title>${rd.label}</title></circle>`).join("");
  const trend = variant === "trend"
    ? `<line class="ck-trend" x1="${m.l}" y1="${(m.t+ph*0.78).toFixed(1)}" x2="${W-m.r}" y2="${(m.t+ph*0.2).toFixed(1)}"/>` : "";
  host.innerHTML = `<svg class="ck" width="${W}" height="${H}">${grid}${xlab}${trend}
    <g class="ck-plot" style="clip-path:inset(0 100% 0 0)">${dots}</g></svg>`;
  requestAnimationFrame(() => { const p = host.querySelector(".ck-plot"); if (p) p.style.clipPath = "inset(0 0% 0 0)"; });
}

function mountHeatmap(host, card){
  const { W: HW, H: HH } = hostDimensions(host, card);
  const rd = readingOf(card.key);
  const reqKey = `${card.key}|${card.period}`;
  const live = LIVE_RECKONER_DATA[reqKey] || LIVE_RECKONER_DATA[`${card.key}|${toReckonerPeriod(card.period)}`];
  const variant = card.variant || "square";

  if (live && live.ok && live.data && Array.isArray(live.data.rows) && live.data.rows.length > 0) {
    const dayShorts = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const fullDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const hours = [9, 12, 15, 18];
    const hourLabels = ["09h", "12h", "15h", "18h"];
    
    const matrix = hourLabels.map((hl, hIdx) => {
      const targetHour = hours[hIdx];
      return dayShorts.map((ds, dIdx) => {
        const fullDay = fullDays[dIdx];
        const match = live.data.rows.find(r => (r.day === fullDay || r.day === ds) && (Math.abs(r.hour - targetHour) <= 1 || r.hour === targetHour));
        return match ? (match.sales || match.count || 0) : 0;
      });
    });
    const mx = Math.max(1, ...matrix.flat());
    const cells = matrix.flatMap((row, ri) => row.map((v, ci) => {
      const lvl = Math.min(4, Math.floor(v / mx * 5));
      const d = (ri * dayShorts.length + ci) * 11;
      if (variant === "dots") return `<span class="ck-hd2" style="--d:${d}ms"><i style="transform:scale(${(0.3+v/mx*0.7).toFixed(2)});background:var(--vq-seq-${lvl+1})"></i>
        <span class="ck-hint">${hourLabels[ri]} · ${dayShorts[ci]} — ${fmtValue(v, rd.unit)}</span></span>`;
      return `<span class="ck-hc ${variant==="rounded"?"is-round":""}" style="background:var(--vq-seq-${lvl+1});--d:${d}ms">
        <span class="ck-hint">${hourLabels[ri]} · ${dayShorts[ci]} — ${fmtValue(v, rd.unit)}</span></span>`;
    })).join("");

    host.innerHTML = `<div class="ck-hm" style="--c:${dayShorts.length}">
      <div class="ck-hm-x"><span></span>${dayShorts.map(c=>`<b>${c}</b>`).join("")}</div>
      <div class="ck-hm-b"><div class="ck-hm-y">${hourLabels.map(x=>`<b>${x}</b>`).join("")}</div>
      <div class="ck-hm-g">${cells}</div></div>
      <div class="ck-hm-l"><span>Low</span>${[1,2,3,4,5].map(i=>`<i style="background:var(--vq-seq-${i})"></i>`).join("")}<span>High</span></div></div>`;
    return;
  }

  host.innerHTML = `<div class="ck-empty" style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--vq-text-muted);font-size:12px;"><span style="opacity:0.6;">No activity recorded for this period</span></div>`;
}

function mountTable(host, card){
  const { H } = hostDimensions(host, card);
  const pd = buildParts(card.key, card.period, readingOf(card.key)?.rowNames);
  if (!pd.parts || pd.parts.length === 0) {
    host.innerHTML = `<div class="ck-empty" style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--vq-text-muted);font-size:12px;"><span style="opacity:0.6;">No table records for this period</span></div>`;
    return;
  }
  const capacity = Math.max(2, Math.floor((H - 4) / 38));
  const rows = pd.parts.slice(0, Math.min(7, capacity)), mx = (rows[0]?.value || 1);
  const variant = card.variant || "rows";
  host.innerHTML = `<div class="ck-tb">${rows.map((p,i) => `
    <div class="ck-tr" style="--d:${i*45}ms">
      ${variant === "rank" ? `<span class="ck-rank">${i+1}</span>` : ""}
      <span class="ck-tn">${p.name}</span>
      ${variant === "bars" ? `<span class="ck-tbar"><i style="width:${((p?.value || 0)/mx*100).toFixed(0)}%;background:${p?.color || "var(--vq-series-1)"}"></i></span>` : ""}
      <b class="ck-tv">${unitPrefix(pd.unit)}${fmtValue(p?.value || 0, pd.unit, true)}</b>
    </div>`).join("")}</div>`;
}

function mountFeed(host, card){
  const { H } = hostDimensions(host, card);
  const reqKey = `${card.key}|${card.period}`;
  const live = LIVE_RECKONER_DATA[reqKey] || LIVE_RECKONER_DATA[`${card.key}|${toReckonerPeriod(card.period)}`];
  const capacity = Math.max(2, Math.floor((H - 4) / 38));
  const bars = card.variant === "bars";

  if (live && live.ok && live.data && Array.isArray(live.data.items) && live.data.items.length > 0) {
    const items = live.data.items.slice(0, Math.min(6, capacity));
    host.innerHTML = `<div class="ck-tb ${bars ? "is-bars" : ""}">${items.map((item, i) => `
      <div class="ck-tr" style="--d:${i*45}ms">
        ${bars ? "" : `<span class="ck-fd" style="background:var(--vq-series-${(i%8)+1})"></span>`}
        <span class="ck-tn">${esc(item.subtitle ? `${item.title} (${item.subtitle})` : item.title)}</span>
        <span class="ck-tt">${esc(item.at || '')}</span>
        <b class="ck-tv">${esc(item.value || '')}</b>
      </div>`).join("")}</div>`;
    return;
  }

  host.innerHTML = `<div class="ck-empty" style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--vq-text-muted);font-size:12px;"><span style="opacity:0.6;">No recent transactions in this period</span></div>`;
}

function mountSankey(host, card){
  const { W, H } = hostDimensions(host, card);
  const pd = buildParts(card.key, card.period, readingOf(card.key)?.sliceNames);
  if (!pd.parts || pd.parts.length === 0) {
    host.innerHTML = `<div class="ck-empty" style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--vq-text-muted);font-size:12px;"><span style="opacity:0.6;">No flow data for this period</span></div>`;
    return;
  }
  const parts = pd.parts.slice(0,4), tot = parts.reduce((a,b)=>a+(b?.value||0),0) || 1;
  const thin = (card.variant === "thin");
  let y = 6, links = "", nodes = "";
  parts.forEach((p, i) => {
    const h = ((p?.value || 0) / tot) * (H - 12) * (thin ? 0.7 : 1);
    nodes += `<rect x="20" y="${y.toFixed(1)}" width="11" height="${h.toFixed(1)}" rx="3" fill="${p?.color || "var(--vq-series-1)"}"/>`;
    const ty = 10 + i * ((H - 20) / Math.max(1, parts.length));
    links += `<path class="ck-lk" style="--d:${i*90}ms" d="M31 ${y.toFixed(1)} C${W*0.45} ${y.toFixed(1)} ${W*0.55} ${ty.toFixed(1)} ${(W-32).toFixed(1)} ${ty.toFixed(1)}
      L${(W-32).toFixed(1)} ${(ty + h*0.72).toFixed(1)} C${W*0.55} ${(ty+h*0.72).toFixed(1)} ${W*0.45} ${(y+h).toFixed(1)} 31 ${(y+h).toFixed(1)} Z"
      fill="${p?.color || "var(--vq-series-1)"}" fill-opacity=".3"><title>${p.name} — ${fmtValue(p?.value || 0, pd.unit, true)}</title></path>`;
    y += h + 5;
  });
  nodes += `<rect x="${W-31}" y="6" width="11" height="${H-12}" rx="3" fill="var(--vq-chart-track-data)"/>`;
  host.innerHTML = `<svg class="ck" width="${W}" height="${H}">${links}${nodes}</svg>`;
}

function mountChoropleth(host, card){
  const rd = readingOf(card.key);
  const reqKey = `${card.key}|${card.period}`;
  const live = LIVE_RECKONER_DATA[reqKey] || LIVE_RECKONER_DATA[`${card.key}|${toReckonerPeriod(card.period)}`];
  const regs = Array.isArray(live?.data?.regions) ? live.data.regions : [];
  if (regs.length === 0) {
    host.innerHTML = `<div class="ck-empty" style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--vq-text-muted);font-size:12px;"><span style="opacity:0.6;">No regional data for this period</span></div>`;
    return;
  }
  regs.sort((a,b) => (b.v || b.value || 0) - (a.v || a.value || 0));
  const mx = (regs[0].v || regs[0].value || 1);
  if (card.variant === "list"){
    const capacity = Math.max(2, Math.floor((host.clientHeight - 4) / 38));
    host.innerHTML = `<div class="ck-tb">${regs.slice(0, capacity).map((g,i)=>{
      const val = g.v || g.value || 0;
      return `<div class="ck-tr" style="--d:${i*45}ms">
        <span class="ck-rank">${i+1}</span><span class="ck-tn">${g.n || g.name}</span>
        <span class="ck-tbar"><i style="width:${(val/mx*100).toFixed(0)}%;background:var(--vq-seq-${Math.min(4,Math.floor(val/mx*5))+1})"></i></span>
        <b class="ck-tv">${unitPrefix(rd.unit)}${fmtValue(val, rd.unit, true)}</b></div>`;
    }).join("")}</div>`;
    return;
  }
  host.innerHTML = `<div class="ck-geo">${regs.map((g,i)=>{
    const val = g.v || g.value || 0;
    return `<div class="ck-geo-c" style="--d:${i*55}ms">
      <i class="ck-geo-f" style="width:${(val/mx*100).toFixed(0)}%;background:var(--vq-seq-${Math.min(4,Math.floor(val/mx*5))+1})"></i>
      <span>${g.n || g.name}</span><b>${unitPrefix(rd.unit)}${fmtValue(val, rd.unit, true)}</b></div>`;
  }).join("")}</div>`;
}

function mountSparkline(host, card){
  const { W, H } = hostDimensions(host, card);
  const rd = readingOf(card.key);
  const vals = valuesFor(card.key, card.period, rd.unit);
  const times = timeline(card.period), grain = PERIOD[card.period].grain;
  const mn = Math.min(...vals), mx = Math.max(...vals), rg = (mx-mn)||1;
  const n = vals.length;
  const pts = vals.map((v,i) => [ (i*(W-6))/(n-1) + 3, H - 4 - ((v-mn)/rg)*(H-10) ]);
  const variant = card.variant || "area";
  const uid = "sp" + (++CHART_UID);
  let body;
  if (variant === "bars"){
    const bw = (W/n)*0.62;
    body = vals.map((v,i) => `<rect class="ck-bar" data-x="${i}" x="${(pts[i][0]-bw/2).toFixed(1)}"
      y="${pts[i][1].toFixed(1)}" width="${bw.toFixed(1)}" height="${(H-4-pts[i][1]).toFixed(1)}" rx="2"
      fill="var(--vq-series-1-ink)"/>`).join("");
  } else {
    const d = pathSmooth(pts);
    body = (variant === "area"
      ? `<defs><linearGradient id="${uid}" x1="0" y1="0" x2="0" y2="1">
         <stop offset="0%" stop-color="var(--vq-series-1-ink)" stop-opacity=".3"/>
         <stop offset="100%" stop-color="var(--vq-series-1-ink)" stop-opacity="0"/></linearGradient></defs>
         <path d="${d} L${P(pts[n-1][0],H)} L${P(pts[0][0],H)} Z" fill="url(#${uid})"/>` : "")
      + `<path class="ck-line" d="${d}" stroke="var(--vq-series-1-ink)"/>`;
  }
  host.innerHTML = `<svg class="ck ck--spark" width="${W}" height="${H}">
    <g class="ck-plot" style="clip-path:inset(0 100% 0 0)">${body}</g>
    <g class="ck-hover" style="opacity:0"><line class="ck-cross" y1="0" y2="${H}"/>
      <circle class="ck-hd" r="3.5" fill="var(--vq-surface)" stroke="var(--vq-series-1-ink)" stroke-width="2"/></g>
    <rect class="ck-cap" x="0" y="0" width="${W}" height="${H}" fill="transparent"/></svg>
    <div class="ck-tip ck-tip--sm" hidden></div>`;
  requestAnimationFrame(() => { const p = host.querySelector(".ck-plot"); if (p) p.style.clipPath = "inset(0 0% 0 0)"; });

  const cap = host.querySelector(".ck-cap"), hov = host.querySelector(".ck-hover");
  const cross = host.querySelector(".ck-cross"), dot = host.querySelector(".ck-hd");
  const tip = host.querySelector(".ck-tip");
  const head = host.closest(".vqc")?.querySelector(".vqc-value[data-full] .nf");
  const sub  = host.closest(".vqc")?.querySelector(".vqc-when");
  const headCompact = () => head?.closest(".vqc-value")?.dataset.mode === "compact";
  const rest = () => { if (head) setRoller(head, unitPrefix(rd.unit) + fmtValue(vals[n-1], rd.unit, headCompact()));
                       if (sub) sub.textContent = card.period + " · " + tickLabel(times[0],grain) + " – " + tickLabel(times[n-1],grain); };
  cap.addEventListener("mousemove", e => {
    const r0 = cap.getBoundingClientRect();
    const i = Math.max(0, Math.min(n-1, Math.round(((e.clientX - r0.left) - 3) / ((W-6)/(n-1)))));
    hov.style.opacity = "1";
    cross.style.transform = `translateX(${pts[i][0].toFixed(1)}px)`;
    dot.style.transform = `translate(${pts[i][0].toFixed(1)}px, ${pts[i][1].toFixed(1)}px)`;
    tip.hidden = false;
    tip.innerHTML = `<p class="ck-tip-h">${fullLabel(times[i], grain)}</p>
      <span class="ck-tip-r"><b class="ck-tip-v">${unitPrefix(rd.unit)}${fmtValue(vals[i], rd.unit)}</b></span>`;
    const tw = tip.offsetWidth || 110;
    tip.style.left = Math.max(0, Math.min(W - tw, pts[i][0] - tw/2)) + "px";
    if (head) setRoller(head, unitPrefix(rd.unit) + fmtValue(vals[i], rd.unit, headCompact()));
    if (sub) sub.textContent = fullLabel(times[i], grain);
  });
  cap.addEventListener("mouseleave", () => { hov.style.opacity = "0"; tip.hidden = true; rest(); });
}

/* A single number with no context is the complaint. Every stat card now
   carries either a sparkline, a period comparison, or a min/avg/max read. */
function mountStat(host, card){
  const variant = card.variant || "spark";
  if (variant === "spark") return mountSparkline(host, card);
  const rd = readingOf(card.key);
  const vals = valuesFor(card.key, card.period, rd.unit);
  const now = vals[vals.length - 1];
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const avg = vals.reduce((a,b) => a+b, 0) / vals.length;
  const times = timeline(card.period), grain = PERIOD[card.period].grain;
  const at = i => tickLabel(times[i], grain);

  if (variant === "delta"){
    const half = Math.floor(vals.length / 2);
    const prev = vals.slice(0, half).reduce((a,b)=>a+b,0) / half;
    const curr = vals.slice(half).reduce((a,b)=>a+b,0) / (vals.length - half);
    const mx = Math.max(prev, curr) || 1;
    const row = (lab, v, col) => `<div class="ck-cmp">
      <span class="ck-cmp-l">${lab}</span>
      <span class="ck-cmp-t"><i style="width:${(v/mx*100).toFixed(0)}%;background:${col}"></i></span>
      <b class="ck-cmp-v">${unitPrefix(rd.unit)}${fmtValue(v, rd.unit, true)}</b></div>`;
    host.innerHTML = `<div class="ck-stat">
      ${row("This " + card.period.toLowerCase(), curr, "var(--vq-series-1)")}
      ${row("Previous", prev, "var(--vq-chart-track-data)")}
      <p class="ck-stat-n">${curr >= prev ? "Up" : "Down"}
        ${Math.abs((curr-prev)/(prev||1)*100).toFixed(1)}% on the first half of the period.</p></div>`;
    return;
  }
  const cell = (k, v, when) => `<div class="ck-fact"><span>${k}</span>
    <b>${unitPrefix(rd.unit)}${fmtValue(v, rd.unit, true)}</b>${when ? `<em>${when}</em>` : ""}</div>`;
  host.innerHTML = `<div class="ck-stat ck-stat--facts">
    ${cell("Lowest", lo, at(vals.indexOf(lo)))}
    ${cell("Average", avg, card.period.toLowerCase())}
    ${cell("Highest", hi, at(vals.indexOf(hi)))}
    ${cell("Latest", now, at(vals.length - 1))}</div>`;
}

function mountStatus(host, card){
  const rd = readingOf(card.key);
  const reqKey = `${card.key}|${card.period}`;
  const live = LIVE_RECKONER_DATA[reqKey] || LIVE_RECKONER_DATA[`${card.key}|${toReckonerPeriod(card.period)}`];
  const times = timeline(card.period), grain = PERIOD[card.period].grain;
  const ok = live?.data?.status ? (live.data.status === 'ok' || live.data.status === 'balanced') : true;
  const state = live?.data?.message || (ok ? "Balanced" : "Needs review");
  const body = (card.variant === "dot")
    ? `<span class="ck-dotstate ${ok ? "is-ok" : "is-warn"}"><i></i><b>${esc(state)}</b></span>`
    : `<span class="ck-badge ${ok ? "is-ok" : "is-warn"}"><i></i>${esc(state)}</span>`;
  host.innerHTML = `<div class="ck-stat ck-stat--status">${body}
    <p class="ck-stat-n">${rd.label} · checked ${fullLabel(times[times.length-1], grain)}</p></div>`;
}

function linkRows(host, shapeSel, rowSel){
  const shapes = [...host.querySelectorAll(shapeSel)], rows = [...host.querySelectorAll(rowSel)];
  const set = (i, on) => {
    shapes.forEach(s => s.classList.toggle("is-dim", on && +s.dataset.i !== i));
    rows.forEach(r => { r.classList.toggle("is-dim", on && +r.dataset.i !== i);
                        r.classList.toggle("is-on", on && +r.dataset.i === i); });
  };
  [...shapes, ...rows].forEach(el => {
    el.addEventListener("mouseenter", () => set(+el.dataset.i, true));
    el.addEventListener("mouseleave", () => set(-1, false));
  });
}

/* ── dispatcher ────────────────────────────────────────────────────────── */
const MOUNT = {
  gauge: mountGauge, funnel: mountFunnel, radar: mountRadar, scatter: mountScatter,
  heatmap: mountHeatmap, table: mountTable, feed: mountFeed, sankey: mountSankey,
  choropleth: mountChoropleth, sparkline: mountSparkline,
  stat: mountStat, status: mountStatus,
};
function mountChart(host, card){
  if (!host) return;
  if (CARTESIAN.has(card.chart)) return mountCartesian(host, card);
  if (RADIAL.has(card.chart))    return mountRadial(host, card);
  const fn = MOUNT[card.chart];
  if (fn) return fn(host, card);
}

/* ══ board, editor, library, builder ═══════════════════════════════════════ */

/* Every reading carries a value over time, so every reading can take a time
   chart. Shape decides what is *natural*, not what is permitted. */
const TIME_CHARTS = ["stat","sparkline","area","line","bar","composed","pl","live","gauge","ring"];
const LEGAL = {
  SCALAR:       TIME_CHARTS.concat(["heatmap","scatter","table"]),
  STATUS:       ["status","stat","sparkline","area","line","bar"],
  SERIES:       TIME_CHARTS.concat(["heatmap","scatter","table"]),
  MULTI_SERIES: ["composed","line","area","bar","pl","live","stat","sparkline"],
  BREAKDOWN:    ["pie","ring","sunburst","funnel","bar","radar","sankey","choropleth","table","stat","treemap"]
                  .filter(c => c !== "treemap"),
  RANKING:      ["bar","table","funnel","choropleth","pie","ring","radar","stat"],
  TABLE:        ["table","heatmap","scatter","bar","line","area","stat"],
  GAUGE:        ["gauge","ring","stat","sparkline","area","line","bar"],
  FEED:         ["feed","table","bar","stat"],
};
const CHART_NAME = {
  stat:"Number", sparkline:"Sparkline", gauge:"Gauge", ring:"Ring", status:"Status",
  area:"Area", line:"Line", bar:"Bar", pl:"Profit / loss", live:"Live line",
  composed:"Combo", pie:"Pie", sunburst:"Sunburst", funnel:"Funnel", radar:"Radar",
  sankey:"Sankey", choropleth:"Regions", table:"Table", heatmap:"Heatmap",
  scatter:"Scatter", feed:"Feed",
};
const MIN_CAT = {
  stat:"C2", status:"C2", sparkline:"C3", feed:"C4", table:"C4", gauge:"C4", ring:"C4",
  bar:"C4", funnel:"C4", pie:"C4", radar:"C4",
  area:"C5", line:"C5", pl:"C5", live:"C5", composed:"C5", scatter:"C5",
  heatmap:"C5", sunburst:"C5", sankey:"C5", choropleth:"C5",
};
const CATS = ["C1","C2","C3","C4","C5","C6"];
const CAT_NAME = { C1:"Tile", C2:"Strip", C3:"Metric", C4:"Panel", C5:"Board", C6:"Canvas" };
const FITS = {
  C1: [[2,1,"icon+label"],[1,1,"icon"]],
  C2: [[4,1,"inline"],[3,2,"stacked"]],
  C3: [[4,3,"full"],[3,2,"standard"],[2,2,"compact"],[2,3,"stacked"]],
  C4: [[4,4,"full"],[3,4,"standard"],[3,5,"compact"],[2,6,"list"]],
  C5: [[6,6,"full"],[5,7,"narrow"],[4,8,"min"]],
  C6: [[8,8,"full"],[6,10,"narrow"],[4,12,"min"]],
};
const DEFAULT_FIT = { C1:0, C2:0, C3:0, C4:0, C5:2, C6:1 };

/* ══ Layout Law §6 — the allowed-size system ═══════════════════════════════
   A category is a list of FITS (the interiors) plus a MAX rectangle. A size is
   legal for a category when it is at least as large as one of that category's
   fits and no larger than the category's maximum. Everything the UI offers is
   generated from this — no hand-written size list may exist anywhere else,
   because a hand-written list is how a card ends up wider than the grid. */
const CAT_MAX = {
  C1: [3, 2],    /* Tile   — shortcut, quick action, single glyph        */
  C2: [6, 2],    /* Strip  — one KPI on one line                         */
  C3: [6, 4],    /* Metric — KPI with delta, sparkline or comparison     */
  C4: [6, 6],    /* Panel  — ranked list, breakdown, small chart         */
  C5: [12, 9],   /* Board  — full chart, multi-series, wide table        */
  C6: [12, 16],  /* Canvas — hero chart, statement, cohort grid, map     */
};
const CAT_DESC = {
  C1: "Shortcut, quick action, single glyph",
  C2: "One KPI on one line",
  C3: "KPI with delta, sparkline or comparison",
  C4: "Ranked list, breakdown, small chart",
  C5: "Full chart, multi-series, wide table",
  C6: "Hero chart, statement, cohort grid",
};
/* What each fit changes inside the card — shown against every size so the
   choice is never blind. Straight out of the Law's own tables. */
const FIT_INSIDE = {
  "icon+label":"icon left, label right", "icon":"icon only, label in tooltip",
  "inline":"label and value share one line", "stacked":"label above value",
  "full":"the richest interior this category has",
  "standard":"value and delta, no sparkline",
  "compact":"abbreviated value, no sparkline",
  "list":"narrow list, one item per row",
  "narrow":"legend or controls move below",
  "min":"the leanest interior — chart only",
};

/** The smallest rectangle any fit in this category will accept. */
function catFloor(cat, T){
  const f = (T || FITS)[cat] || [];
  return [Math.min(...f.map(x => x[0])), Math.min(...f.map(x => x[1]))];
}
/** Is [w,h] a legal size for `cat`? At least one fit must sit inside it. */
function sizeLegal(cat, w, h, T){
  const [MW, MH] = CAT_MAX[cat] || [12, 16];
  if (w > MW || h > MH || w < 1 || h < 1) return false;
  return ((T || FITS)[cat] || []).some(([fw, fh]) => w >= fw && h >= fh);
}
/** The richest fit that fits inside [w,h] — fits are ordered richest first. */
function resolveFit(cat, w, h, T){
  const list = (T || FITS)[cat] || [];
  for (let i = 0; i < list.length; i++){
    if (w >= list[i][0] && h >= list[i][1]) return i;
  }
  return null;
}
/** The lowest legal height for a given width in this category. */
function minHeightAt(cat, w, T){
  const hs = ((T || FITS)[cat] || []).filter(([fw]) => w >= fw).map(([, fh]) => fh);
  return hs.length ? Math.min(...hs) : null;
}
/** The lowest legal width for a given height in this category. */
function minWidthAt(cat, h, T){
  const ws = ((T || FITS)[cat] || []).filter(([, fh]) => h >= fh).map(([fw]) => fw);
  return ws.length ? Math.min(...ws) : null;
}
/** Every legal size in a category, as {w,h,fit,fitName,inside,isFit,isMax}. */
function sizesFor(cat, T){
  const tbl = T || FITS;
  const [MW, MH] = CAT_MAX[cat] || [12, 16];
  const out = [];
  for (let w = 1; w <= MW; w++){
    for (let h = 1; h <= MH; h++){
      if (!sizeLegal(cat, w, h, tbl)) continue;
      const fit = resolveFit(cat, w, h, tbl);
      const nm = tbl[cat][fit][2];
      out.push({
        cat, w, h, fit, fitName: nm, inside: FIT_INSIDE[nm] || "",
        isFit: tbl[cat][fit][0] === w && tbl[cat][fit][1] === h,
        isMax: w === MW && h === MH,
      });
    }
  }
  return out;
}
/** The presets a category offers: every canonical fit, each fit widened to the
    category's full width, and the category maximum. That is a ladder a person
    can actually choose from — the exhaustive set is reachable through the
    stepper, which walks the same legality rules one column at a time. */
function presetsFor(cat, T){
  const tbl = T || FITS;
  const list = tbl[cat] || [];
  if (!list.length) return [];
  const [MW, MH] = CAT_MAX[cat] || [12, 16];
  const mk = (w, h) => {
    const fit = resolveFit(cat, w, h, tbl) ?? 0;
    const nm = tbl[cat][fit][2];
    return { cat, w, h, fit, fitName: nm, inside: FIT_INSIDE[nm] || "",
             isFit: tbl[cat][fit][0] === w && tbl[cat][fit][1] === h,
             isMax: w === MW && h === MH };
  };
  const out = [];
  list.forEach(([w, h]) => {
    out.push(mk(w, h));
    if (MW > w) out.push(mk(MW, h));                 /* the same interior, full width */
    const mid = Math.round((w + MW) / 2);
    if (mid > w && mid < MW) out.push(mk(mid, h));
  });
  out.push(mk(MW, MH));
  return out
    .filter(s => sizeLegal(cat, s.w, s.h, tbl))
    .filter((s, i, a) => a.findIndex(x => x.w === s.w && x.h === s.h) === i)
    .sort((a, b) => (a.w * a.h) - (b.w * b.h) || a.w - b.w);
}

/* ── the live grid ────────────────────────────────────────────────────────
   The Law picks the legal column count whose width lands nearest 112px. The
   stylesheet does the same thing in media queries; this reads the answer back
   out of the DOM so JS and CSS can never disagree about how wide the grid is. */
const LEGAL_COLS = { desktop:[12], tablet:[8], mobile:[4] };
function boardCols(el){
  const board = el || document.getElementById("board");
  if (board){
    const cs = getComputedStyle(board);
    /* Read the DECLARED count, never the used track list. A card that spans
       more columns than exist makes CSS Grid mint implicit tracks, so the used
       value reports the overflow back as the grid's width — and the clamp that
       is supposed to prevent the overflow would read its own bug as the truth
       and hold it in place. --vq-cols is what the stylesheet meant. */
    const v = parseInt(cs.getPropertyValue("--vq-cols"), 10);
    if (v > 0 && v <= 24) return v;
    const tpl = cs.gridTemplateColumns;
    if (tpl && tpl !== "none"){
      const n = tpl.trim().split(/\s+/).length;
      if (n > 0 && n <= 24) return n;
    }
  }
  /* No board in the document yet — fall back to the ladder, and only ever to
     a count the Law actually allows. */
  const vw = typeof window !== "undefined" ? window.innerWidth : 1920;
  return vw < 600 ? 4 : vw < 1024 ? 8 : 12;
}
/** The board's real column width in px. The Law's fit floors are pixel
    measurements — "4×1 inline ≥ 356px" — so a fit cannot be chosen from column
    counts alone: four columns is 520px on a desktop and 330px on a phone, and
    only one of those can hold an inline strip. */
function boardColW(el){
  const board = el || document.getElementById("board");
  const cols = boardCols(board);
  if (board && board.clientWidth > 0)
    return Math.max(24, (board.clientWidth - GRID.gutter * (cols - 1)) / cols);
  return 112;
}
/** How wide this card actually is, in px, on this board. */
function pxWidth(w, colW){ return w * (colW || 112) + (w - 1) * GRID.gutter; }

/* A card may never be wider than the grid it sits in. When the grid narrows
   the card keeps its authored width in state and only *renders* narrower, so
   widening the window restores it exactly — §6 step 2, in reverse. */
function fitToGrid(w, h, cols){
  const c = cols || boardCols();
  if (w <= c) return [w, h];
  return [Math.max(1, c), h];
}

/* The smallest [cols, rows] a chart can be drawn in and still be read.
   Nothing may be placed below this — it is a property of the card, not a
   suggestion, so no card can ever clip its own content. */
const MIN_SIZE = {
  stat:[2,1], status:[2,1], sparkline:[3,3],
  gauge:[3,4], ring:[4,6], pie:[4,6], sunburst:[4,6],
  bar:[4,4], table:[3,4], funnel:[5,4], radar:[4,5], feed:[3,4],
  area:[4,4], line:[4,4], pl:[4,4], live:[4,4], composed:[5,5],
  scatter:[4,4], heatmap:[4,4], sankey:[5,5], choropleth:[4,4],
};
/* legend-bearing charts grow with how much they have to list */
/* A card in C1 or C2 has no chart host — only a stat or a status can live
   there. Everything else needs a body, so it starts at C3. */
const HOSTLESS = new Set(["stat","status"]);

/* ══ the non-reading card families ═════════════════════════════════════════
   An operations hub and a shortcut tile are cards like any other: they sit on
   the same grid, obey the same category bounds and carry the same options. The
   only thing that differs is what is drawn inside, so that is the only thing
   this registry describes. Everything else — sizing, tones, emphasis, deep
   link, title — comes from the shared card contract below. */
const SPECIAL = {
  action_hub:     { cat:"C4", min:[3,2], cats:["C3","C4","C5","C6"], family:"hub",
                    eyebrow:"OPERATIONS HUB", name:"Quick Operations Hub",
                    sub:"Point of sale, purchases and quick dispatch" },
  bank_liquidity: { cat:"C4", min:[3,2], cats:["C3","C4","C5","C6"], family:"hub",
                    eyebrow:"LIQUIDITY & BALANCES", name:"Bank & Liquid Net Balances",
                    sub:"Accounts, drawer and total liquid net" },
  alerts_hub:     { cat:"C4", min:[3,3], cats:["C3","C4","C5","C6"], family:"hub",
                    eyebrow:"ACTIONS REQUIRED", name:"Actions Required & Alerts",
                    sub:"Everything waiting on someone" },
  growth_engine:  { cat:"C4", min:[3,2], cats:["C3","C4","C5","C6"], family:"hub",
                    eyebrow:"GROWTH ENGINE", name:"Growth Engine & Target Pace",
                    sub:"Velocity, target pace and retention" },
  charity_hub:    { cat:"C4", min:[3,2], cats:["C3","C4","C5","C6"], family:"hub",
                    eyebrow:"CHARITY & DONATIONS", name:"Charity & Donations Hub",
                    sub:"Live donations summary and one-click contribution" },
  top_products_hub: { cat:"C4", min:[3,2], cats:["C3","C4","C5","C6"], family:"hub",
                    eyebrow:"TOP PERFORMERS", name:"Top Selling Products",
                    sub:"Best sellers ranked by sold quantity and sales volume" },
  recent_purchases_hub: { cat:"C4", min:[3,2], cats:["C3","C4","C5","C6"], family:"hub",
                    eyebrow:"PURCHASING DESK", name:"Recent Supplier Purchases",
                    sub:"Latest purchase orders, suppliers and delivery status" },
  store_health:   { cat:"C3", min:[3,2], cats:["C2","C3","C4","C5"], family:"hub",
                    eyebrow:"FINANCIAL VITALITY", name:"Store Health & Verification",
                    sub:"Balance sheet integrity, audit readiness and liquidity" },
  custom_button:  { cat:"C1", min:[1,1], cats:["C1"], family:"shortcut",
                    eyebrow:"SHORTCUT", name:"Shortcut", sub:"One-click jump" },
  launchpad:      { cat:"C4", min:[3,2], cats:["C3","C4","C5"], family:"hub",
                    eyebrow:"LAUNCHPAD", name:"Launchpad",
                    sub:"Your four essentials — always the same four" },
};
const isSpecial = c => !!(c && c.type && SPECIAL[c.type]);
/* Hubs are laid out on their own ladder rather than the reading ladder: a hub
   is a row of items, so its fits trade columns for rows exactly like C4's. */
const SPECIAL_FITS = {
  C1: [[2,1,"icon+label"],[1,1,"icon"]],
  C2: [[4,1,"inline"],[3,2,"stacked"]],
  C3: [[4,2,"full"],[3,2,"standard"],[2,3,"stacked"]],
  C4: [[4,2,"full"],[3,3,"standard"],[3,4,"compact"],[2,5,"list"]],
  C5: [[6,3,"full"],[5,4,"narrow"],[4,5,"min"]],
  C6: [[8,4,"full"],[6,6,"narrow"],[4,8,"min"]],
};
/** The fit ladder a card resolves against — hubs stack shallower than charts. */
const fitsTable = c => (isSpecial(c) ? SPECIAL_FITS : FITS);

/** A stat showing only its number — no chart body to make room for. */
const isBare = c => c.chart === "stat" && c.variant === "number";
function minSizeFor(card){
  if (isSpecial(card)) return SPECIAL[card.type].min.slice();
  /* A tile and a strip have no chart body — renderCard draws the reading and
     nothing else there — so the chart's own floor does not apply. Measuring a
     C2 strip against a sparkline's three-row minimum is what made every strip
     size illegal and left the size picker empty. */
  if (card.cat === "C1") return [1, 1];
  if (card.cat === "C2") return [3, 1];
  let [w, h] = MIN_SIZE[card.chart] || [3,3];
  if (!HOSTLESS.has(card.chart) && !isBare(card)) h = Math.max(h, 3);
  if (card.chart === "stat"){
    const v = card.variant || "spark";
    if (v === "number")      [w,h] = [3,1];   /* value + delta + period, one row */
    else if (v === "spark")  [w,h] = [3,3];
    else if (v === "delta")  [w,h] = [3,3];
    else                     [w,h] = [3,4];
  }
  if (card.chart === "status") [w,h] = [3,3];
  let rows = h;
  const parts = () => {
    const rd = readingOf(card.key);
    const sn = (rd && Array.isArray(rd.sliceNames) && rd.sliceNames.length > 0) ? rd.sliceNames : ["Cash", "Card", "Credit", "Bank"];
    return sn.length;
  };
  /* header ~60px + dial ~200px + ~47px per legend row, over an 88px pitch */
  if (RADIAL.has(card.chart)) rows = Math.max(rows, 2 + Math.ceil(parts() * 0.75));
  /* a funnel is just stacked rows — it needs height per stage, not a dial */
  if (card.chart === "funnel") rows = Math.max(rows, parts() + 1);
  if (CARTESIAN.has(card.chart) && card.extraKeys.length) rows = Math.max(rows, h + 1);
  return [w, rows];
}
/* the fits a chart is allowed to take, as [index, cols, rows, name] */
function fitsFor(card, cat){
  const T = fitsTable(card);
  /* A tile or a strip can only hold something that draws no chart. That is the
     categorical rule; the pixel floors below are the dimensional one. */
  if (!isSpecial(card) && (cat === "C1" || cat === "C2") && !HOSTLESS.has(card.chart)) return [];
  const [mw, mh] = minSizeFor({ ...card, cat });
  return (T[cat] || []).map((f,i) => [i, f[0], f[1], f[2]]).filter(([,w,h]) => w >= mw && h >= mh);
}
function catsFor(card){
  if (isSpecial(card)) return SPECIAL[card.type].cats.filter(k => fitsFor(card, k).length);
  return CATS.filter(k => fitsFor(card, k).length);
}
/** The category a given rectangle lands in — richest legal one wins, so
    dragging a card bigger buys a richer interior rather than more air. */
function catForSize(card, w, h){
  const list = catsFor(card);
  for (let i = list.length - 1; i >= 0; i--){
    if (sizeLegal(list[i], w, h, fitsTable(card))) return list[i];
  }
  return card.cat || list[0] || "C3";
}
/* smallest category that can actually hold this chart */
function fitCat(card){ return catsFor(card)[0] || (isSpecial(card) ? SPECIAL[card.type].cat : "C6"); }

/* ── the one place a card's rendered geometry is decided ─────────────────
   Authored size wins; below it, the card's own floor; above it, the category
   max and the live grid. A card can therefore never be smaller than it can
   draw, nor wider than the screen it is on. */
function geometryOf(card, cols, colW){
  const cat = card.cat || fitCat(card);
  const T = fitsTable(card);
  const [MW, MH] = CAT_MAX[cat] || [12, 16];
  const [mw, mh] = minSizeFor({ ...card, cat });
  let w, h;
  if (card.w && card.h){ w = card.w; h = card.h; }
  else {
    const list = T[cat] || T.C4;
    const f = list[Math.min(card.fit || 0, list.length - 1)];
    w = f[0]; h = f[1];
  }
  w = Math.max(mw, Math.min(MW, w));
  h = Math.max(mh, Math.min(MH, h));
  /* a size the category will not accept is raised to the nearest one it will */
  if (!sizeLegal(cat, w, h, T)){
    const needH = minHeightAt(cat, w, T);
    if (needH != null) h = Math.max(h, needH);
    else { const needW = minWidthAt(cat, h, T); if (needW != null) w = Math.max(w, needW); }
  }
  const [gw, gh] = fitToGrid(w, h, cols);
  return { w: gw, h: gh, authoredW: w, authoredH: h, cat, colW: colW || COL_W,
           fit: resolveFit(cat, gw, gh, T) ?? 0, clamped: gw !== w };
}
/* dial charts need a legend under the dial; the rest are fine in a panel */
const TALL = new Set(["pie","ring","sunburst","gauge"]);
const MULTI_OK = new Set(["line","area","bar","composed"]);

/* Variants that only differ once a card carries more than one series.
   Offering them on a single-series card is a fake choice — it renders the
   same picture — so they are shown disabled with the reason. */
const NEEDS_SERIES = {
  area:     { stacked: 2 },
  bar:      { grouped: 2, stacked: 2 },
  composed: { "bar-line-area": 2, "bar-two-lines": 3, "stacked-line": 3,
              pattern: 2, "thin-columns": 2, "area-bar": 2 },
};
/* And the reverse: variants that only make sense on their own, because with
   more series they collapse into another variant's rule. */
const ONLY_SINGLE = { composed: ["bar-trend"] };

/** [id, name, enabled, why] for the variants of this card, in context. */
function variantsFor(card){
  const need = NEEDS_SERIES[card.chart] || {};
  const solo = ONLY_SINGLE[card.chart] || [];
  const have = 1 + card.extraKeys.length;
  return variantsOf(card.chart).map(([id, name]) => {
    if (solo.includes(id)) return [id, name, have === 1, "single series only"];
    const want = need[id] || 0;
    return [id, name, have >= want, want ? `needs ${want} series` : ""];
  });
}
/** Fall back to something renderable when the series count drops. */
function fixVariant(card){
  const v = variantsFor(card);
  if (!v.some(([id, , ok]) => id === card.variant && ok)){
    const first = v.find(([, , ok]) => ok);
    if (first) card.variant = first[0];
  }
}

const IC = {
  up:'<path d="m3 17 6-6 4 4 8-8"/><path d="M17 7h4v4"/>',
  down:'<path d="m3 7 6 6 4-4 8 8"/><path d="M17 17h4v-4"/>',
  plus:'<path d="M5 12h14"/><path d="M12 5v14"/>',
  x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  pencil:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash:'<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>',
  grip:'<circle cx="9" cy="6" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="18" r="1.4"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',
  moon:'<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
};
const ic = (n, s=14) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]||""}</svg>`;

/* ── state ─────────────────────────────────────────────────────────────── */
let CARDS = [], EDIT = null, SEQ = 0, LIB_AREA = "All", LIB_Q = "";
/* Board-wide preferences — set once in the editor, applied to every card. */
const PREFS = { periodPicker: true };
const newId = () => "c" + (++SEQ);
const cardOf = id => CARDS.find(c => c.id === id);

function catFor(chart){ return MIN_CAT[chart] || "C3"; }
/* Snap a card onto a legal size. Called after anything that changes what the
   card has to draw — chart type, added series, new category. */
/* Switching chart or variant re-sizes the card to that chart's natural size
   straight away — including dropping any hand-resize, which was measured for
   the old chart and means nothing for the new one. */
function resizeForChart(c){
  c.w = c.h = null;
  c.cat = fitCat(c);
  c.fit = DEFAULT_FIT[c.cat];
  clampFit(c);
}
function clampFit(c, wanted){
  const T = fitsTable(c);
  if (c.w && c.h){
    const g = geometryOf(c, 24);          /* 24 = the widest legal grid; no clamp here */
    c.w = g.authoredW; c.h = g.authoredH; c.cat = g.cat; c.fit = g.fit;
    return;
  }
  let legal = fitsFor(c, c.cat);
  if (!legal.length){ c.cat = fitCat(c); legal = fitsFor(c, c.cat); }
  const want = wanted ?? (isSpecial(c) ? 0 : DEFAULT_FIT[c.cat]);
  c.fit = legal.some(([i]) => i === want) ? want : legal[0][0];
  void T;
}
function legalFor(key){ const rd = readingOf(key); return LEGAL[rd.shape] || ["stat"]; }

function addCard(key, opts = {}){
  const rd = readingOf(key); if (!rd) return null;
  const chart = opts.chart || legalFor(key)[0];
  const c = { id:newId(), key, extraKeys: opts.extraKeys || [], chart,
              variant: opts.variant || defaultVariant(chart), cat:"C3", fit:0,
              period: opts.period || "Month",
              title: opts.title || null, accent: !!opts.accent };
  /* the card decides its own smallest honest size — never the caller */
  c.cat = opts.cat && fitsFor(c, opts.cat).length ? opts.cat : fitCat(c);
  clampFit(c, opts.fit);
  CARDS.push(c);
  draw();
  return c;
}

/* ── card face ─────────────────────────────────────────────────────────── */
function headlineOf(card){
  const rd = readingOf(card.key);
  const reqKey = `${card.key}|${card.period}`;
  const live = LIVE_RECKONER_DATA[reqKey] || LIVE_RECKONER_DATA[`${card.key}|${toReckonerPeriod(card.period)}`];
  const times = timeline(card.period), grain = PERIOD[card.period].grain;

  if (live && live.ok && live.data !== undefined && live.data !== null) {
    let last = 0;
    let prev = 0;
    let hasDelta = false;

    if (typeof live.data === 'number') {
      last = live.data;
    } else if (typeof live.data === 'object') {
      if (live.data.current !== undefined) {
        last = Number(live.data.current) || 0;
        prev = Number(live.data.previous) || 0;
        hasDelta = true;
      } else if (live.data.total !== undefined) {
        last = Number(live.data.total) || 0;
      } else if (live.data.series && Array.isArray(live.data.series) && live.data.series.length > 0) {
        const s = live.data.series;
        last = Number(s[s.length - 1]?.y ?? s[s.length - 1]?.value ?? 0);
        if (s.length > 1) {
          prev = Number(s[s.length - 2]?.y ?? s[s.length - 2]?.value ?? 0);
          hasDelta = true;
        }
      } else if (Array.isArray(live.data.slices) && live.data.slices.length > 0) {
        last = live.data.slices.reduce((acc, x) => acc + Number(x.value || 0), 0);
      }
    }

    const pct = (hasDelta && prev !== 0) ? ((last - prev) / Math.abs(prev)) * 100 : (live.data?.delta_pct ?? 0);
    const dir = pct >= 0 ? "up" : "down";

    return {
      value: unitPrefix(rd.unit) + fmtValue(last, rd.unit),
      valueCompact: unitPrefix(rd.unit) + fmtValue(last, rd.unit, true),
      dir, pct: Math.abs(pct).toFixed(1) + "%",
      when: card.period + " · " + tickLabel(times[0], grain) + " – " + tickLabel(times[times.length-1], grain),
    };
  }

  const vals = valuesFor(card.key, card.period, rd.unit);
  const last = vals[vals.length - 1], prev = vals[vals.length - 2] ?? last;
  const pct = prev ? ((last - prev) / prev) * 100 : 0;
  return {
    value: unitPrefix(rd.unit) + fmtValue(last, rd.unit),
    valueCompact: unitPrefix(rd.unit) + fmtValue(last, rd.unit, true),
    dir: pct >= 0 ? "up" : "down", pct: Math.abs(pct).toFixed(1) + "%",
    when: card.period + " · " + tickLabel(times[0], grain) + " – " + tickLabel(times[times.length-1], grain),
  };
}

/** The one way a number lands on a card face. Carries both its full and its
    abbreviated form so fitValues() can step down instead of ever clipping. */
function valueHTML(hl, cls){
  return `<span class="vqc-value ${cls || ""}" data-full="${esc(hl.value)}"
    data-compact="${esc(hl.valueCompact)}">${rollerHTML(hl.value)}</span>`;
}

/* ══ the no-clip contract ══════════════════════════════════════════════════
   A number is never allowed to be cut. After every layout-affecting event the
   board walks its values: full figure → abbreviated figure → abbreviated at a
   smaller size. Deterministic, measured against real layout, no scrolling. */
function fitValues(scope){
  (scope || document).querySelectorAll(".vqc-value[data-full], .vqc-bank-val[data-full]").forEach(v => {
    const nf = v.querySelector(".nf");
    const put = t => { if (nf) setRoller(nf, t); else v.textContent = t; };
    const cur = () => (nf ? nf.dataset.value : v.textContent);
    const box = v.closest(".vqc-bank-box") || v.closest(".vqc-bd") || v.closest(".vqc") || v.parentElement;
    if (!box || !box.clientWidth) return;
    const over = () => (box.scrollWidth - box.clientWidth > 1) || (v.scrollWidth - v.clientWidth > 1);
    v.classList.remove("is-tight");
    v.dataset.mode = "full";
    if (cur() !== v.dataset.full) put(v.dataset.full);
    if (!over()) return;
    if (v.dataset.compact && v.dataset.compact !== v.dataset.full){
      put(v.dataset.compact);
      v.dataset.mode = "compact";
      if (!over()) return;
    }
    v.classList.add("is-tight");
  });
}

/* Day / Week / Month / Quarter / Year, switchable from the card face. */
function periodPicker(c){
  return `<span class="vqc-per">
    <button class="vqc-per-b" aria-haspopup="true" aria-expanded="false">${c.period}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="3" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg></button>
    <span class="vqc-per-m" hidden>${PERIODS.map(x =>
      `<button class="vqc-per-i ${x === c.period ? "is-on" : ""}" data-p="${x}">${x}</button>`).join("")}</span>
  </span>`;
}

function tools(){
  return `<span class="vqc-tools">
    <button class="vqc-act vqc-grip" title="Drag to reorder" aria-label="Drag to reorder">${ic("grip",13)}</button>
    <button class="vqc-act vqc-edit" title="Edit card" aria-label="Edit card">${ic("pencil",12)}</button>
    <button class="vqc-act vqc-del" title="Remove card" aria-label="Remove card">${ic("trash",12)}</button></span>`;
}

/* The grid's own geometry — resize snaps to this, nothing else. */
const GRID = { cols: 12, unit: 64, gutter: 24 };

/** The rendered [cols, rows] — clamped to the card's floor, its category max
    and the live grid. Nothing else in the file may compute a card's size. */
function sizeOf(c, cols, colW){
  const g = geometryOf(c, cols, colW);
  return [g.w, g.h];
}
/** The size the author chose, before the grid clamp — what the editor shows. */
function authoredSizeOf(c){
  const g = geometryOf(c, 24);
  return [g.authoredW, g.authoredH];
}

/* ── measuring the chart host ─────────────────────────────────────────────
   Measure first, and only fall back to arithmetic when the host is not in the
   document yet. The old fallback subtracted a fixed 100px for the header, which
   is right for exactly one card shape and wrong for every other — a gauge in a
   2-row card came out with a negative body and drew on top of its own label. */
function hostDimensions(host, card) {
  /* clientWidth/Height are LAYOUT sizes. getBoundingClientRect() is the painted
     rect, which includes any transform — and cards animate in under
     `scale(.985)`, so measuring the rect during that animation drew every chart
     1.5% narrow. The SVG has no viewBox, so a mis-measure is not a soft error:
     the drawing stays at its original scale inside a stretched element and ends
     up squashed against the left edge. Measure layout, not paint. */
  if (host && host.clientWidth > 30 && host.clientHeight > 24)
    return { W: host.clientWidth, H: host.clientHeight };

  const cardEl = host ? host.closest(".vqc") : null;
  let cardW = 0, cardH = 0;
  if (cardEl){
    cardW = cardEl.clientWidth; cardH = cardEl.clientHeight;
  }
  if (cardW < 30 || cardH < 30){
    const board = (host && host.closest(".vq-grid")) || document.getElementById("board");
    const cols = boardCols(board);
    const [wCols, hRows] = sizeOf(card, cols);
    let colW = 112;
    if (board && board.clientWidth > 0)
      colW = Math.max(36, (board.clientWidth - GRID.gutter * (cols - 1)) / cols);
    cardW = wCols * colW + (wCols - 1) * GRID.gutter;
    cardH = hRows * GRID.unit + (hRows - 1) * GRID.gutter;
  }

  /* Everything above the host, measured rather than guessed where we can. */
  let above = 0;
  if (cardEl){
    const cs = getComputedStyle(cardEl);
    above += parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    [...cardEl.children].forEach(ch => {
      if (ch === host || ch.classList.contains("vqc-glare")
          || ch.classList.contains("vqc-star")
          || ch.classList.contains("vqc-resize")) return;
      if (ch.offsetHeight) above += ch.offsetHeight;
    });
  }
  if (!above){
    const selfLabelled = card.chart === "gauge" || card.chart === "ring" || card.chart === "sunburst";
    above = (card.chart !== "status" && !selfLabelled) ? 92 : 30;
    if (card.extraKeys && card.extraKeys.length) above += 26;
    above += 28;
  }
  return {
    W: Math.max(60, Math.round(cardW - 28)),
    H: Math.max(40, Math.round(cardH - above)),
  };
}

/* The store slug the page was rendered for — never a literal. */
let STORE_SLUG = "";
const storePath = p => STORE_SLUG ? `/s/${STORE_SLUG}${p}` : p;
function getDeepLinkForCard(key) {
  if (!key) return '/pos';
  if (key.startsWith('sales') || key.startsWith('pre_sales') || key.startsWith('proposals')
      || key.startsWith('recurring') || key.startsWith('returns')) return storePath('/sales');
  if (key.startsWith('purchase') || key.startsWith('debit_notes')) return storePath('/purchase-orders');
  if (key.startsWith('inventory') || key.startsWith('batch') || key.startsWith('serial')
      || key.startsWith('production')) return storePath('/inventory');
  if (key.startsWith('accounting') || key.startsWith('finance') || key.startsWith('bank'))
    return storePath('/finance');
  if (key.startsWith('party') || key.startsWith('parties') || key.startsWith('contacts'))
    return storePath('/parties');
  if (key.startsWith('staff') || key.startsWith('operations')) return storePath('/reports');
  return storePath('/reports');
}

/* ══ the card face ═════════════════════════════════════════════════════════
   One function, one chrome contract, every family. A reading card, an
   operations hub and a shortcut tile differ only in their interior; the frame,
   the tools, the tone, the emphasis and the resize handle are identical, so
   they are written once here and never per-family. */

const esc = s => String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;")
  .replace(/>/g,"&gt;").replace(/"/g,"&quot;");

const TONE_CLASS = {
  surface:"vqc--tone-surface", accent:"vqc--tone-accent vqc--accent",
  ink:"vqc--tone-ink", mesh:"vqc--tone-mesh",
};

/* Shortcut glyphs — one path set, drawn at whatever size the tile resolves to */
const SHORTCUT_ICONS = {
  cart:'<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
  box:'<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  truck:'<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  dollar:'<line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>',
  chart:'<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
  bolt:'<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  plus:'<path d="M12 5v14"/><path d="M5 12h14"/>',
  heart:'<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6V4.5a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.5.6.87 1.15 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
};
const shortcutIcon = (n, s = 20) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SHORTCUT_ICONS[n] || SHORTCUT_ICONS.bolt}</svg>`;

/** The control cluster every card carries: open, drag, edit, remove.
    The open arrow is one of the acts rather than a special case, so a card's
    controls read as one set — and it is the only one the author can turn off. */
function cardTools(c, link){
  const arrow = c.showOpenArrow !== false && link;
  return `<span class="vqc-tools">
    ${arrow ? `<a href="${esc(link)}" class="vqc-nav-link" title="Open ${esc(destinationName(link))}" aria-label="Open ${esc(destinationName(link))}">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg></a>` : ""}
    <button type="button" class="vqc-act vqc-grip" title="Drag to reorder" aria-label="Drag to reorder">${ic("grip",13)}</button>
    <button type="button" class="vqc-act vqc-edit" title="Edit card" aria-label="Edit card">${ic("pencil",12)}</button>
    <button type="button" class="vqc-act vqc-del" title="Remove card" aria-label="Remove card">${ic("trash",12)}</button>
  </span>`;
}

/** What the open arrow's tooltip says it will open. */
function destinationName(path){
  if (!path) return "";
  const tail = String(path).replace(/\/$/, "").split("/").pop() || "";
  const named = {
    pos: "Point of Sale", sales: "Sales & Invoices", inventory: "Inventory & Stock",
    "purchase-orders": "Purchasing", finance: "Finance & Accounts",
    parties: "Parties & CRM", reports: "Reports & Intel", settings: "Settings",
  };
  return named[tail] || tail.replace(/-/g, " ");
}

/** The frame. Nothing may build an <article class="vqc"> except this. */
function cardFrame(c, opts){
  const { w, h, cat, clamped } = opts.geo;
  const tone = c.tone || (c.accent ? "accent" : "surface");
  const cls = [
    "vqc", `vqc--${String(cat).toLowerCase()}`, `vq-w${w}`, `vq-h${h}`,
    TONE_CLASS[tone] || TONE_CLASS.surface,
    opts.extraClass || "",
    c.starBorder ? "vqc--starred" : "",
    c.glare === false ? "" : (c.accent || c.glare ? "vqc--glared" : ""),
    clamped ? "is-clamped" : "",
    `vqc--fit-${opts.geo.fit}`,
  ].filter(Boolean).join(" ");
  /* --vqw / --vqh let the stylesheet reason about a card's own span without a
     container query, so an interior can thin out at 2 rows and fill out at 6. */
  const pinned = Number.isInteger(c.gx) && Number.isInteger(c.gy) && (opts.cols || 12) >= 12;
  const place = pinned
    ? `grid-column:${Math.max(1, Math.min((opts.cols || 12) - w + 1, c.gx + 1))} / span ${w};grid-row:${c.gy + 1} / span ${h};`
    : "";
  return `<article class="${cls}" data-id="${c.id}" data-cat="${cat}" data-w="${w}" data-h="${h}"
    tabindex="0" draggable="false"
    style="--i:${CARDS.indexOf(c)};--vqw:${w};--vqh:${h};${place}">
    ${c.starBorder ? `<span class="vqc-star" aria-hidden="true"></span>` : ""}
    ${opts.body}
    <span class="vqc-glare" aria-hidden="true"></span>
    <button type="button" class="vqc-resize" aria-label="Resize card" title="Drag to resize"></button>
  </article>`;
}

/* ── the interiors ─────────────────────────────────────────────────────── */

function hubHead(c, eyebrow, link){
  return `<div class="vqc-hd">
    <span class="vqc-eyebrow" title="${esc(eyebrow)}">${esc(eyebrow)}</span>
    <span class="vqc-hd-r">${cardTools(c, link)}</span>
  </div>`;
}

function bodyActionHub(c, geo){
  const link = c.targetUrl || c.link || '/pos';
  /* §6 in miniature: a card that gets bigger does not get emptier, it changes
     shape. The hub offers three lanes at its floor and grows to eight, so the
     space a larger card buys is spent on more of the product rather than on
     more air around the same three buttons. */
  const ALL = [
    { href:'/pos',                          mod:'sales',    icon:'cart',   label:'Point of Sale' },
    { href: storePath('/purchase-orders'),  mod:'purchase', icon:'truck',  label:'Purchase Order' },
    { href:null,                            mod:'actions',  icon:'plus',   label:'Quick Actions' },
    { href: storePath('/sales'),            mod:'quiet',    icon:'file',   label:'New Invoice' },
    { href: storePath('/inventory'),        mod:'quiet',    icon:'box',    label:'Add Product' },
    { href: storePath('/parties'),          mod:'quiet',    icon:'users',  label:'New Customer' },
    { href: storePath('/finance'),          mod:'quiet',    icon:'dollar', label:'Add Expense' },
    { href: storePath('/reports'),          mod:'quiet',    icon:'chart',  label:'Reports' },
  ];
  /* How many lanes fit, in pixels rather than by eye: the card's own height,
     less its padding, its header row and its title block, divided by a lane
     plus a gutter. Counting rows instead left a 3-row hub with one row of
     buttons and a dead band underneath. */
  const cardH  = geo.h * 64 + (geo.h - 1) * 24;
  const titleH = geo.h >= 3 ? 61 : 0;                 /* h3 line + sub + margin */
  const free   = cardH - 40 /* padding */ - 34 /* header */ - titleH;
  const rows   = Math.max(1, Math.floor((free + 8) / (40 + 8)));
  /* A lane needs about two grid columns to hold an icon and a readable label,
     so the column count comes from the card's span and the row count from its
     measured height. The grid is then told that number outright rather than
     being left to auto-fit into a different one — the two disagreeing is how a
     six-column hub ended up with eight 113px lanes, each too narrow to read. */
  const perRow = Math.max(1, Math.floor(geo.w / 2));
  const items  = ALL.slice(0, Math.max(3, Math.min(ALL.length, perRow * rows)));
  return hubHead(c, SPECIAL.action_hub.eyebrow, link) +
    `<div class="vqc-hub-title-wrap">
       <div class="vqc-action-hub-title">${esc(titleOf(c))}</div>
       <div class="vqc-action-hub-sub">${esc(SPECIAL.action_hub.sub)}</div>
     </div>
     <div class="vqc-action-hub-grid" style="grid-template-columns:repeat(${Math.min(perRow, items.length)},minmax(0,1fr))">${items.map(i => i.href
       ? `<a href="${esc(i.href)}" class="vqc-hub-btn vqc-hub-btn--${i.mod}">${shortcutIcon(i.icon,15)}<span>${esc(i.label)}</span></a>`
       : `<button type="button" class="vqc-hub-btn vqc-hub-btn--${i.mod}" data-glass="1">${shortcutIcon(i.icon,15)}<span>${esc(i.label)}</span></button>`
     ).join("")}</div>`;
}

function bodyBankLiquidity(c, geo){
  const link = c.targetUrl || c.link || storePath('/finance');
  const dProps = getDashboardProps();
  const bankAccounts = Array.isArray(dProps.bankAccounts) ? dProps.bankAccounts : [];
  const cashVal = Number(dProps.cashData?.balance) || (Array.isArray(dProps.cashAccounts) ? dProps.cashAccounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0) : 0);
  const bankVal = bankAccounts.reduce((sum, a) => sum + (Number(a.current_balance) || 0), 0);
  const totalLiquid = cashVal + bankVal;
  const bankCount = bankAccounts.length;

  const boxes = [
    { l:'Bank Accounts',   v: bankVal, s: `${bankCount} account${bankCount === 1 ? '' : 's'} active` },
    { l:'Cash on Hand',    v: cashVal, s:'Drawer & safe' },
    { l:'Total Liquid Net',v: totalLiquid, s: totalLiquid > 0 ? 'Liquid assets' : 'No liquid balance', total:true },
  ];
  /* a 3-wide hub gives each box ~110px — the grouped figure cannot fit, so
     the boxes carry both forms and fitValues steps them down like any card */
  return hubHead(c, SPECIAL.bank_liquidity.eyebrow, link) +
    `<div class="vqc-hub-title-wrap"><div class="vqc-action-hub-title">${esc(titleOf(c))}</div>
      <div class="vqc-action-hub-sub">${esc(SPECIAL.bank_liquidity.sub)}</div></div>` +
    `<div class="vqc-bank-grid">${boxes.map(b => `
      <div class="vqc-bank-box${b.total ? ' is-total' : ''}">
        <span class="vqc-bank-label" title="${esc(b.l)}">${esc(b.l)}</span>
        <span class="vqc-bank-val" data-full="Rs ${groupNum(b.v)}" data-compact="Rs ${abbrNum(b.v)}">Rs ${groupNum(b.v)}</span>
        <span class="vqc-bank-sub">${esc(b.s)}</span>
      </div>`).join("")}</div>`;
}

function bodyAlertsHub(c, geo){
  const link = c.targetUrl || c.link || storePath('/reports');
  const modOk = mods => !ENABLED_MODULES || !mods.length || mods.some(m => ENABLED_MODULES.has(m));
  const dProps = getDashboardProps();
  const lowStockCount = Array.isArray(dProps.lowStockItems) ? dProps.lowStockItems.length : 0;
  const overdueReceivables = Number(dProps.outstanding?.receivables) || 0;
  const recs = Array.isArray(dProps.aiRecommendations) ? dProps.aiRecommendations : [];

  const rows = [];
  if (lowStockCount > 0 && modOk(['inventory'])) {
    rows.push({ k:'warning', href: storePath('/inventory'), msg: `<strong>${lowStockCount} product${lowStockCount === 1 ? '' : 's'}</strong> reached reorder limit`, cta:'Reorder' });
  }
  if (overdueReceivables > 0 && modOk(['khata_credit','payments'])) {
    rows.push({ k:'danger', href: storePath('/finance'), msg: `<strong>Rs ${groupNum(overdueReceivables)}</strong> customer dues outstanding`, cta:'Follow up' });
  }
  recs.forEach(r => {
    rows.push({
      k: r.priority === 'urgent' ? 'danger' : 'warning',
      href: storePath('/reports'),
      msg: esc(r.message || r.title),
      cta: 'View'
    });
  });

  const room = Math.max(1, Math.min(Math.max(1, rows.length), Math.floor((geo.h - 1) * 88 / 46)));
  const visibleRows = rows.slice(0, room);

  return hubHead(c, SPECIAL.alerts_hub.eyebrow, link) +
    (visibleRows.length === 0
      ? `<div class="vqc-alerts-empty" style="display:flex;align-items:center;justify-content:center;height:calc(100% - 40px);color:var(--vq-text-muted);font-size:12px;text-align:center;padding:12px;">All clear — no pending alerts</div>`
      : `<div class="vqc-alerts-list">${visibleRows.map(r => `
      <a href="${esc(r.href)}" class="vqc-alert-item vqc-alert-item--${r.k}">
        <span class="vqc-alert-dot"></span>
        <span class="vqc-alert-msg">${r.msg}</span>
        <span class="vqc-alert-btn">${esc(r.cta)} &rarr;</span>
      </a>`).join("")}</div>`);
}

function bodyGrowthEngine(c, geo){
  const link = c.targetUrl || c.link || storePath('/reports');
  const dProps = getDashboardProps();
  const monthSales = Number(dProps.performance?.Month?.sales) || Number(dProps.revenue) || 0;
  const daySales = Number(dProps.performance?.Today?.sales) || Number(dProps.performance?.Day?.sales) || 0;
  const netProfit = Number(dProps.netProfit) || 0;

  const stats = [
    { l:'Month Sales',   v: 'Rs ' + abbrNum(monthSales), s: 'Sales this month' },
    { l:'Today Sales',   v: 'Rs ' + abbrNum(daySales),   s: "Today's total" },
    { l:'Net Profit',    v: 'Rs ' + abbrNum(netProfit),  s: 'Realised profit' },
  ];
  return hubHead(c, SPECIAL.growth_engine.eyebrow, link) +
    `<div class="vqc-hub-title-wrap"><div class="vqc-action-hub-title">${esc(titleOf(c))}</div>
      <div class="vqc-action-hub-sub">${esc(SPECIAL.growth_engine.sub)}</div></div>` +
    `<div class="vqc-growth-grid">${stats.map(s => `
      <div class="vqc-growth-stat">
        <span class="vqc-growth-label">${esc(s.l)}</span>
        <span class="vqc-growth-val">${esc(s.v)}</span>
        <span class="vqc-growth-sub">${esc(s.s)}</span>
      </div>`).join("")}</div>`;
}

function bodyCustomButton(c, geo){
  const href = c.targetUrl || c.link || '/pos';
  const colour = c.btnColor || 'var(--vq-teal-500)';
  /* 1×1 is the icon fit: glyph only, name in the tooltip. Everything wider
     shows the label; two rows and up also show the sub-line. §6 C1. */
  const iconOnly = geo.w < 2;
  const label = titleOf(c);
  return `<a href="${esc(href)}" class="vqc-custom-action-anchor${iconOnly ? ' is-icon' : ''}"
      title="${esc(label)}">
      <span class="vqc-custom-icon-ring" style="background:${esc(colour)}">${shortcutIcon(c.icon || 'bolt', 18)}</span>
      ${iconOnly ? "" : `<span class="vqc-custom-text">
        <span class="vqc-custom-btn-title">${esc(label)}</span>
        ${geo.h >= 2 ? `<span class="vqc-custom-btn-sub">Open ${esc(destinationName(href))}</span>` : ""}
      </span>`}
    </a>${cardTools(c, href)}`;
}

/* The launchpad: four fixed actions, whatever the size. Growing the card
   grows the buttons, not the button count — the counterpart to the action
   hub for people who found the growing lane-count unsettling. */
function bodyLaunchpad(c, geo){
  const link = c.targetUrl || c.link || '/pos';
  const items = [
    { href:'/pos',                         icon:'cart',  label:'Point of Sale' },
    { href: storePath('/sales'),           icon:'file',  label:'New Invoice' },
    { href: storePath('/inventory'),       icon:'box',   label:'Add Product' },
    { href: storePath('/purchase-orders'), icon:'truck', label:'Purchase Order' },
  ];
  const perRow = geo.w >= 4 ? 2 : 1;
  return hubHead(c, SPECIAL.launchpad.eyebrow, link) +
    (geo.h >= 3 ? `<div class="vqc-hub-title-wrap">
       <div class="vqc-action-hub-title">${esc(titleOf(c))}</div>
       <div class="vqc-action-hub-sub">${esc(SPECIAL.launchpad.sub)}</div>
     </div>` : "") +
    `<div class="vqc-launchpad" style="grid-template-columns:repeat(${perRow},minmax(0,1fr))">${items.map(i =>
      `<a href="${esc(i.href)}" class="vqc-hub-btn vqc-hub-btn--quiet vqc-launchpad-btn">${shortcutIcon(i.icon,16)}<span>${esc(i.label)}</span></a>`
    ).join("")}</div>`;
}

function bodyCharityHub(c, geo) {
  const link = c.targetUrl || c.link || storePath('/reports');
  const dProps = getDashboardProps();
  const charityToday = Number(dProps.charityStats?.today) || 0;
  const charityMonth = Number(dProps.charityStats?.month) || 0;
  const defAmt = Number(dProps.charityStats?.default_amount) || 10;

  return hubHead(c, SPECIAL.charity_hub.eyebrow, link) +
    `<div class="vqc-hub-title-wrap">
      <div class="vqc-action-hub-title">${esc(titleOf(c))}</div>
      <div class="vqc-action-hub-sub">${esc(SPECIAL.charity_hub.sub)}</div>
    </div>
    <div class="vqc-bank-grid" style="grid-template-columns: repeat(2, 1fr); margin-bottom: 8px;">
      <div class="vqc-bank-box is-total">
        <span class="vqc-bank-label">Today's Donations</span>
        <span class="vqc-bank-val" style="color: #f43f5e;">Rs ${groupNum(charityToday)}</span>
        <span class="vqc-bank-sub">Direct contributions</span>
      </div>
      <div class="vqc-bank-box">
        <span class="vqc-bank-label">This Month</span>
        <span class="vqc-bank-val">Rs ${groupNum(charityMonth)}</span>
        <span class="vqc-bank-sub">Monthly total</span>
      </div>
    </div>
    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
      <button type="button" onclick="window._vqDonateCharity && window._vqDonateCharity(10)" class="vqc-hub-btn" style="flex: 1; min-width: 50px; padding: 6px 8px; font-size: 11px; background: rgba(244,63,94,0.12); color: #f43f5e; border: 1px solid rgba(244,63,94,0.25); border-radius: 8px; cursor: pointer; font-weight: 700;">+Rs 10</button>
      <button type="button" onclick="window._vqDonateCharity && window._vqDonateCharity(50)" class="vqc-hub-btn" style="flex: 1; min-width: 50px; padding: 6px 8px; font-size: 11px; background: rgba(244,63,94,0.12); color: #f43f5e; border: 1px solid rgba(244,63,94,0.25); border-radius: 8px; cursor: pointer; font-weight: 700;">+Rs 50</button>
      <button type="button" onclick="window._vqDonateCharity && window._vqDonateCharity(100)" class="vqc-hub-btn" style="flex: 1; min-width: 50px; padding: 6px 8px; font-size: 11px; background: rgba(244,63,94,0.12); color: #f43f5e; border: 1px solid rgba(244,63,94,0.25); border-radius: 8px; cursor: pointer; font-weight: 700;">+Rs 100</button>
      <button type="button" onclick="window._vqDonateCharity && window._vqDonateCharity(${defAmt})" class="vqc-hub-btn" style="flex: 1; min-width: 70px; padding: 6px 8px; font-size: 11px; background: rgba(244,63,94,0.2); color: #f43f5e; border: 1px solid rgba(244,63,94,0.4); border-radius: 8px; cursor: pointer; font-weight: 800;">Donate Default</button>
    </div>`;
}

function bodyTopProductsHub(c, geo) {
  const link = c.targetUrl || c.link || storePath('/reports');
  const dProps = getDashboardProps();
  const topProducts = Array.isArray(dProps.topSellingItems) ? dProps.topSellingItems : [];

  return hubHead(c, SPECIAL.top_products_hub.eyebrow, link) +
    `<div class="vqc-hub-title-wrap">
      <div class="vqc-action-hub-title">${esc(titleOf(c))}</div>
      <div class="vqc-action-hub-sub">${esc(SPECIAL.top_products_hub.sub)}</div>
    </div>` +
    (topProducts.length === 0
      ? `<div class="vqc-alerts-empty" style="display:flex;align-items:center;justify-content:center;height:calc(100% - 40px);color:var(--vq-text-muted);font-size:12px;text-align:center;padding:12px;">No sales recorded yet</div>`
      : `<div class="vqc-alerts-list">${topProducts.slice(0, 5).map((t, idx) => {
          const val = Number(t.total_sales || t.sales || t.revenue || 0);
          const sold = t.sold || t.qty || t.quantity || 0;
          return `
            <a href="${esc(storePath('/inventory'))}" class="vqc-alert-item vqc-alert-item--info" style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <span style="font-weight:700;font-size:11px;color:var(--vq-text-muted);width:16px;">#${idx+1}</span>
              <span class="vqc-alert-msg" style="flex:1;"><strong>${esc(t.name || `Item ${idx+1}`)}</strong><br/><span style="font-size:10px;opacity:0.75;">${esc(t.category || 'Standard Item')} · Sold: ${sold}</span></span>
              <span style="font-weight:800;font-size:12px;color:var(--vq-teal-500);white-space:nowrap;">Rs ${groupNum(val)}</span>
            </a>
          `;
        }).join("")}</div>`);
}

function bodyRecentPurchasesHub(c, geo) {
  const link = c.targetUrl || c.link || storePath('/purchase-orders');
  const dProps = getDashboardProps();
  const purchases = Array.isArray(dProps.recentPurchases) ? dProps.recentPurchases : [];

  return hubHead(c, SPECIAL.recent_purchases_hub.eyebrow, link) +
    `<div class="vqc-hub-title-wrap">
      <div class="vqc-action-hub-title">${esc(titleOf(c))}</div>
      <div class="vqc-action-hub-sub">${esc(SPECIAL.recent_purchases_hub.sub)}</div>
    </div>` +
    (purchases.length === 0
      ? `<div class="vqc-alerts-empty" style="display:flex;align-items:center;justify-content:center;height:calc(100% - 40px);color:var(--vq-text-muted);font-size:12px;text-align:center;padding:12px;">No recent purchases recorded</div>`
      : `<div class="vqc-alerts-list">${purchases.slice(0, 5).map(p => {
          const amt = Number(p.total_amount || p.amount || p.total || 0);
          const sup = p.supplier_name || p.supplier?.name || p.party?.name || 'Supplier Order';
          const dt = p.date ? new Date(p.date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : (p.created_at ? new Date(p.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '');
          return `
            <a href="${esc(storePath('/purchase-orders'))}" class="vqc-alert-item vqc-alert-item--warning" style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <span class="vqc-alert-dot"></span>
              <span class="vqc-alert-msg" style="flex:1;"><strong>${esc(sup)}</strong><br/><span style="font-size:10px;opacity:0.75;">${dt} · ${esc(p.status || 'Received')}</span></span>
              <span style="font-weight:800;font-size:12px;color:var(--vq-amber-500);white-space:nowrap;">Rs ${groupNum(amt)}</span>
            </a>
          `;
        }).join("")}</div>`);
}

function bodyStoreHealth(c, geo) {
  const link = c.targetUrl || c.link || storePath('/reports');
  const dProps = getDashboardProps();
  const netProfit = Number(dProps.netProfit?.Month?.value ?? dProps.netProfit?.value ?? 0);
  const healthStatus = dProps.netProfit?.Month?.status || (netProfit >= 0 ? 'Good' : 'Needs Attention');
  const isHealthy = healthStatus === 'Good' || netProfit >= 0;

  return hubHead(c, SPECIAL.store_health.eyebrow, link) +
    `<div class="vqc-hub-title-wrap">
      <div class="vqc-action-hub-title">${esc(titleOf(c))}</div>
      <div class="vqc-action-hub-sub">${esc(SPECIAL.store_health.sub)}</div>
    </div>
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 12px; background: ${isHealthy ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)'}; border: 1px solid ${isHealthy ? 'rgba(16,185,129,0.25)' : 'rgba(244,63,94,0.25)'}; margin-bottom: 8px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="display: inline-block; width: 10px; height: 10px; border-radius: 999px; background: ${isHealthy ? '#10b981' : '#f43f5e'}; box-shadow: 0 0 10px ${isHealthy ? '#10b981' : '#f43f5e'};"></span>
        <span style="font-size: 13px; font-weight: 800; color: ${isHealthy ? '#10b981' : '#f43f5e'}; text-transform: uppercase;">${esc(healthStatus)}</span>
      </div>
      <span style="font-size: 11px; font-weight: 600; opacity: 0.8;">Double-entry balanced</span>
    </div>
    <div class="vqc-bank-grid" style="grid-template-columns: repeat(2, 1fr);">
      <div class="vqc-bank-box">
        <span class="vqc-bank-label">Receivables</span>
        <span class="vqc-bank-val">Rs ${groupNum(Number(dProps.outstanding?.Month?.receivables ?? dProps.outstanding?.receivables ?? 0))}</span>
        <span class="vqc-bank-sub">Customer balances</span>
      </div>
      <div class="vqc-bank-box">
        <span class="vqc-bank-label">Payables</span>
        <span class="vqc-bank-val">Rs ${groupNum(Number(dProps.outstanding?.Month?.payables ?? dProps.outstanding?.payables ?? 0))}</span>
        <span class="vqc-bank-sub">Supplier dues</span>
      </div>
    </div>`;
}

const SPECIAL_BODY = {
  action_hub: bodyActionHub, bank_liquidity: bodyBankLiquidity,
  alerts_hub: bodyAlertsHub, growth_engine: bodyGrowthEngine,
  charity_hub: bodyCharityHub, top_products_hub: bodyTopProductsHub,
  recent_purchases_hub: bodyRecentPurchasesHub, store_health: bodyStoreHealth,
  custom_button: bodyCustomButton, launchpad: bodyLaunchpad,
};

/* ── the reading interiors ─────────────────────────────────────────────── */

/* C2 · the strip. The reference lays the inline form as a three-column grid —
   label | value | window — because a flex row lets the label push the number
   off the end. The value never shrinks; the window truncates next; the label
   gives way first. */
function bodyStrip(c, geo, link){
  const hl = headlineOf(c);
  const title = titleOf(c);
  /* Two forms, one idea: the number owns the right edge and never clips.
     INLINE (one row): a two-zone grid — the left zone stacks the label over
     the timeframe caption (both truncate), the right zone is the value and
     its change pill, right-aligned and never shrunk. No floating captions in
     the middle of the card, ever.
     STACKED (two rows): label on top, the number below at full size, the
     change pill beside it, the timeframe as a quiet caption at the bottom. */
  const px = pxWidth(geo.w, geo.colW);
  const stacked = geo.h >= 2;
  const delta = c.showDelta === false ? "" :
    `<span class="vqc-delta vqc-delta--${hl.dir}">${ic(hl.dir,10)}${hl.pct}</span>`;
  const tight = px < 320;                      /* a phone-width strip */
  const when = c.showWhen === false ? "" : `<span class="vqc-when">${esc(c.period)}</span>`;
  if (stacked){
    return `<div class="vqc-bd vqc-bd--strip is-stacked">
        <span class="vqc-eyebrow" title="${esc(title)}">${esc(title)}</span>
        <span class="vqc-head">${valueHTML(hl, "vqc-value--sm")}${delta}</span>
        ${when}
      </div>${cardTools(c, link)}`;
  }
  return `<div class="vqc-bd vqc-bd--strip is-inline${tight ? " is-tight-strip" : ""}">
      <span class="vqc-strip-left">
        <span class="vqc-eyebrow" title="${esc(title)}">${esc(title)}</span>
        ${when}
      </span>
      <span class="vqc-head">${valueHTML(hl, "vqc-value--sm")}${delta}</span>
    </div>${cardTools(c, link)}`;
}

/* C1 · the tile. Icon-and-label at 2×1, the label in a tooltip at 1×1. */
function bodyTile(c, geo, link){
  const hl = headlineOf(c);
  const title = titleOf(c);
  return `<div class="vqc-bd vqc-bd--tile">
      ${geo.w > 1 ? `<span class="vqc-label" title="${esc(title)}">${esc(title)}</span>` : ""}
      ${valueHTML(hl, "vqc-value--xs")}
    </div>${cardTools(c, link)}`;
}

/** A card is named by what it shows, never by what someone typed. A reading
    card takes the reading's label, a hub its template's name, a shortcut its
    destination — so two boards of the same data read the same way. */
function titleOf(c){
  if (isSpecial(c)) return c.title || SPECIAL[c.type].name;
  return readingOf(c.key).label;
}

function bodyChartCard(c, geo, link){
  const title = titleOf(c);
  const hl = headlineOf(c);
  const keys = [c.key, ...(c.extraKeys || [])];
  const legend = (keys.length > 1 && CARTESIAN.has(c.chart))
    ? `<div class="vqc-leg">${keys.map((k,i) => `<button type="button" class="vqc-leg-i" data-i="${i}">
        <span class="vqc-leg-d" style="background:var(--vq-series-${(i%8)+1})"></span>${esc(readingOf(k).label)}</button>`).join("")}</div>`
    : "";
  /* the number is suppressed only when the chart already draws it in its centre */
  const selfLabelled = c.chart === "gauge" || c.chart === "ring" || c.chart === "sunburst"
    || (c.chart === "pie" && c.variant === "donut");
  const showHead = c.chart !== "status" && !selfLabelled;
  /* The author's four switches, each additionally gated by whether the card is
     actually big enough to carry the thing. A switch says "I want this"; the
     geometry says "there is room" — a card never overflows because of a
     preference. */
  const room = geo.h;
  const showWhen   = c.showWhen !== false && c.chart !== "status" && room >= 4;
  const showDelta  = c.showDelta !== false && geo.w >= 2;
  const showPicker = c.showPeriodPicker !== false && PREFS.periodPicker
                     && room >= 2 && geo.w >= 3;
  return `<div class="vqc-hd">
      <span class="vqc-eyebrow" title="${esc(title)}">${esc(title)}</span>
      <span class="vqc-hd-r">${showPicker ? periodPicker(c) : ""}${cardTools(c, link)}</span>
    </div>
    <div class="vqc-bd">
      ${showHead ? `<div class="vqc-head">
        ${valueHTML(hl)}
        ${showDelta ? `<span class="vqc-delta vqc-delta--${hl.dir}">${ic(hl.dir,10)}${hl.pct}</span>` : ""}
      </div>` : ""}
      ${showWhen ? `<p class="vqc-when">${esc(hl.when)}</p>` : ""}
      ${isBare(c) ? "" : `<div class="vqc-host" data-chart="${c.chart}"></div>${legend}`}
    </div>`;
}

function renderCard(c, cols, colW){
  const geo = geometryOf(c, cols, colW);
  const link = c.targetUrl || c.link || getDeepLinkForCard(c.key);

  if (isSpecial(c)){
    const fn = SPECIAL_BODY[c.type];
    return cardFrame(c, {
      geo, cols, body: fn(c, geo),
      extraClass: `vqc--${c.type.replace(/_/g,"-")} vqc--special vqc--fam-${SPECIAL[c.type].family}`,
    });
  }

  const body =
      geo.cat === "C1" ? bodyTile(c, geo, link)
    : geo.cat === "C2" ? bodyStrip(c, geo, link)
    : bodyChartCard(c, geo, link);

  return cardFrame(c, { geo, cols, body, extraClass: `vqc--chart-${c.chart}` });
}

/* ── draw ──────────────────────────────────────────────────────────────── */
/* Measured once per draw and read by geometryOf, so every card in a pass
   resolves against the same column width rather than each re-measuring. */
let COL_W = 112;
let RESIZE_T = null, LAST_COLS = 0;

/* One observer for every chart host on the board. A chart is a raster of its
   host's size, so it has to be re-cut whenever that size changes — and a host
   can change size without the window doing so: the nav pushes, a card is
   resized by hand, a font finishes loading, an ancestor animates. Watching the
   element rather than the window is the only version of this that is always
   right. Sizes are compared before re-mounting, so a settled board does no
   work at all. */
const HOST_SIZES = new WeakMap();
const HOST_RO = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(entries => {
  for (const entry of entries){
    const host = entry.target;
    const w = host.clientWidth, h = host.clientHeight;
    if (w < 20 || h < 16) continue;
    const was = HOST_SIZES.get(host);
    if (was && Math.abs(was.w - w) < 2 && Math.abs(was.h - h) < 2) continue;
    HOST_SIZES.set(host, { w, h });
    const el = host.closest(".vqc");
    const card = el && cardOf(el.dataset.id);
    if (card) mountChart(host, card);
  }
});
function draw(){
  const board = document.getElementById("board");
  if (!board) return;
  const cols = boardCols(board);
  COL_W = boardColW(board);
  LAST_COLS = cols;
  /* innerHTML discards the old hosts, but a ResizeObserver keeps a strong
     reference to everything it observes — so without this the observer would
     accumulate one dead host per redraw for the life of the page. */
  HOST_RO?.disconnect();
  board.innerHTML = CARDS.map(c => renderCard(c, cols)).join("")
    || `<p class="board-empty">No cards yet — open <strong>Add card</strong> and pick what you want to see.</p>`;
  const count = document.getElementById("count");
  if (count) count.textContent = CARDS.length;

  board.querySelectorAll(".vqc").forEach(el => {
    const c = cardOf(el.dataset.id); if (!c) return;
    const host = el.querySelector(".vqc-host");
    if (host){ mountChart(host, c); HOST_RO?.observe(host); }
    el.querySelector(".vqc-edit")?.addEventListener("click", e => {
      e.stopPropagation();
      if (typeof window !== "undefined" && window._vqEditCard) window._vqEditCard(c.id);
      else openEdit(c.id);
    });
    el.querySelector(".vqc-del") ?.addEventListener("click", e => {
      e.stopPropagation();
      el.classList.add("is-going");
      setTimeout(() => { CARDS = CARDS.filter(x => x.id !== c.id); if (EDIT === c.id) closeEdit(); draw(); }, 200);
    });
    /* the hub's own "quick actions" button opens the React popup */
    el.querySelectorAll('[data-glass]').forEach(b => b.addEventListener("click", e => {
      e.preventDefault(); e.stopPropagation();
      if (window._vqOpenGlassActions) window._vqOpenGlassActions();
    }));
    /* legend hover dims the other series, same as the reference */
    el.querySelectorAll(".vqc-leg-i").forEach(btn => {
      const i = +btn.dataset.i;
      const set = on => {
        el.querySelectorAll(".ck-s").forEach(s => s.classList.toggle("is-dim", on && +s.dataset.i !== i));
        el.querySelectorAll(".vqc-leg-i").forEach(b => b.classList.toggle("is-dim", on && +b.dataset.i !== i));
      };
      btn.addEventListener("mouseenter", () => set(true));
      btn.addEventListener("mouseleave", () => set(false));
    });
    wireDrag(el, c);
    wireResize(el, c);
    wirePeriod(el, c);
  });
  fitValues(board);
  renderLibrary();
  persistBoard();
  clearTimeout(RECKONER_FETCH_TIMER);
  RECKONER_FETCH_TIMER = setTimeout(() => {
    queueLiveReadings(CARDS);
  }, 40);
}
/* Re-measure on resize. When the grid changes column count the cards have to
   be re-laid, not just re-drawn — a 12-wide board card is an 8-wide one at
   1280 and its interior resolves to a different fit. Same column count and we
   only re-mount the charts, so the board never flickers for nothing. */
function relayout(){
  const board = document.getElementById("board");
  if (!board) return;
  if (boardCols(board) !== LAST_COLS) { draw(); return; }
  board.querySelectorAll(".vqc").forEach(el => {
    const c = cardOf(el.dataset.id), host = el.querySelector(".vqc-host");
    if (c && host) mountChart(host, c);
  });
  fitValues(board);
}
addEventListener("resize", () => { clearTimeout(RESIZE_T); RESIZE_T = setTimeout(relayout, 150); });

/* ── on-card period menu ───────────────────────────────────────────────── */
function wirePeriod(el, c){
  const box = el.querySelector(".vqc-per"); if (!box) return;
  const btn = box.querySelector(".vqc-per-b"), menu = box.querySelector(".vqc-per-m");
  const close = () => { menu.hidden = true; btn.setAttribute("aria-expanded","false"); };
  btn.addEventListener("click", e => {
    e.stopPropagation();
    document.querySelectorAll(".vqc-per-m").forEach(m => { if (m !== menu) m.hidden = true; });
    menu.hidden = !menu.hidden;
    btn.setAttribute("aria-expanded", String(!menu.hidden));
  });
  menu.querySelectorAll(".vqc-per-i").forEach(b => b.addEventListener("click", e => {
    e.stopPropagation();
    c.period = b.dataset.p;
    close();
    queueLiveReadings([c]);
    /* redraw just this card so the rest of the board stays put */
    const host = el.querySelector(".vqc-host");
    el.querySelector(".vqc-per-b").childNodes[0].nodeValue = c.period + " ";
    const hl = headlineOf(c);
    const val = el.querySelector(".vqc-value[data-full]");
    if (val){
      val.dataset.full = hl.value;
      val.dataset.compact = hl.valueCompact;
    }
    const when = el.querySelector(".vqc-when");
    if (when) when.textContent = when.closest(".vqc-bd--strip") ? c.period : hl.when;
    const deltaEl = el.querySelector(".vqc-delta");
    if (deltaEl){
      deltaEl.className = `vqc-delta vqc-delta--${hl.dir}`;
      deltaEl.innerHTML = `${ic(hl.dir,10)}${hl.pct}`;
    }
    fitValues(el);
    persistBoard();
    menu.querySelectorAll(".vqc-per-i").forEach(x => x.classList.toggle("is-on", x.dataset.p === c.period));
    if (host){ host.classList.add("is-swapping");
      setTimeout(() => { mountChart(host, c); host.classList.remove("is-swapping"); }, 180); }
    if (EDIT === c.id) openEdit(c.id);
  }));
}
document.addEventListener("click", () =>
  document.querySelectorAll(".vqc-per-m").forEach(m => m.hidden = true));

/* ── resize from the bottom-right corner, snapped to the grid ──────────── */
function wireResize(el, c){
  const grip = el.querySelector(".vqc-resize"); if (!grip) return;
  grip.addEventListener("pointerdown", e => {
    e.preventDefault(); e.stopPropagation();
    grip.setPointerCapture?.(e.pointerId);
    const board = document.getElementById("board");
    const cols = boardCols(board);
    const colW = (board.clientWidth - GRID.gutter * (cols - 1)) / cols;
    const pitchX = colW + GRID.gutter, pitchY = GRID.unit + GRID.gutter;
    const start = el.getBoundingClientRect();
    const T = fitsTable(c);
    const cat = c.cat || fitCat(c);
    const [MW, MH] = CAT_MAX[cat] || [12, 16];
    const [floorW, floorH] = minSizeFor(c);
    const capW = Math.min(cols, MW);
    el.classList.add("is-resizing");
    document.body.classList.add("is-reordering");
    const hint = document.createElement("span");
    hint.className = "vqc-size-hint"; el.appendChild(hint);
    let lastW = 0, lastH = 0;

    const move = ev => {
      let w = Math.round((ev.clientX - start.left + GRID.gutter) / pitchX);
      let h = Math.round((ev.clientY - start.top + GRID.gutter) / pitchY);
      w = Math.max(floorW, Math.min(capW, w));
      h = Math.max(floorH, Math.min(MH, h));
      /* the category will not accept every rectangle — raise to the nearest
         one it will, so a drag can never leave a card in an illegal shape */
      if (!sizeLegal(cat, w, h, T)){
        const needH = minHeightAt(cat, w, T);
        if (needH != null) h = Math.max(h, needH);
        else { const needW = minWidthAt(cat, h, T); if (needW != null) w = Math.max(w, needW); }
        h = Math.min(h, MH); w = Math.min(w, capW);
      }
      if (w === lastW && h === lastH) return;
      lastW = w; lastH = h;
      c.w = w; c.h = h;
      c.fit = resolveFit(cat, w, h, T) ?? c.fit;
      el.className = el.className
        .replace(/vq-w\d+/, "vq-w" + w).replace(/vq-h\d+/, "vq-h" + h)
        .replace(/vqc--fit-\d+/, "vqc--fit-" + c.fit);
      el.style.setProperty("--vqw", w); el.style.setProperty("--vqh", h);
      el.dataset.w = w; el.dataset.h = h;
      const fitName = (T[cat][c.fit] || [])[2];
      hint.textContent = `${w} × ${h}${fitName ? " · " + fitName : ""}`;
      const host = el.querySelector(".vqc-host"); if (host) mountChart(host, c);
      fitValues(el);
    };
    const up = () => {
      removeEventListener("pointermove", move); removeEventListener("pointerup", up);
      el.classList.remove("is-resizing");
      document.body.classList.remove("is-reordering");
      hint.remove();
      draw();                       /* the interior may resolve to a new fit */
      if (EDIT === c.id) openEdit(c.id);
    };
    addEventListener("pointermove", move); addEventListener("pointerup", up);
  });
}

/* ── drag to reposition ────────────────────────────────────────────────── */
/* ── move a card anywhere on the grid ─────────────────────────────────────
   In edit mode the whole card face is a handle (the grip works everywhere,
   any time). While dragging, a dashed ghost shows the snapped 12-column
   cell the card will take; dropping PINS the card there (c.gx / c.gy — grid
   coordinates, 0-based). Pinned cards keep their spot; unpinned cards flow
   around them. Pins apply on the full 12-column grid — on tablet and phone
   the board stacks in card order instead, so a phone never inherits a
   desktop arrangement it has no room for. */
function pinnedOthers(self, cols){
  return CARDS.filter(o => o !== self && Number.isInteger(o.gx) && Number.isInteger(o.gy))
    .map(o => { const [w, h] = sizeOf(o, cols); return { x: o.gx, y: o.gy, w, h }; });
}
function freeSpot(self, gx, gy, w, h, cols){
  const others = pinnedOthers(self, cols);
  const x = Math.max(0, Math.min(cols - w, gx));
  let y = Math.max(0, gy);
  const hits = (yy) => others.some(o => x < o.x + o.w && o.x < x + w && yy < o.y + o.h && o.y < yy + h);
  while (hits(y)) y++;
  return { x, y };
}
function beginMove(e0, el, c){
  e0.preventDefault(); e0.stopPropagation();
  const board = document.getElementById("board"); if (!board) return;
  const cols = boardCols(board);
  const colW = boardColW(board);
  const pitchX = colW + GRID.gutter, pitchY = GRID.unit + GRID.gutter;
  const [w, h] = sizeOf(c, cols, colW);
  el.classList.add("is-dragging");
  document.body.classList.add("is-reordering");
  const ghost = document.createElement("div");
  ghost.className = "vq-drop-ghost";
  board.appendChild(ghost);
  let gx = null, gy = null;
  const move = ev => {
    const r = board.getBoundingClientRect();
    const x = ev.clientX - r.left, y = ev.clientY - r.top;
    gx = Math.max(0, Math.min(cols - w, Math.round(x / pitchX - w / 2)));
    gy = Math.max(0, Math.round(y / pitchY - h / 2));
    ghost.style.gridColumn = `${gx + 1} / span ${w}`;
    ghost.style.gridRow = `${gy + 1} / span ${h}`;
    ghost.classList.add("is-on");
  };
  const up = () => {
    removeEventListener("pointermove", move); removeEventListener("pointerup", up);
    el.classList.remove("is-dragging");
    document.body.classList.remove("is-reordering");
    ghost.remove();
    if (gx != null && gy != null && cols >= 12){
      const spot = freeSpot(c, gx, gy, w, h, cols);
      c.gx = spot.x; c.gy = spot.y;
      draw();
    } else if (gx != null){
      /* small grid: reorder by drop position instead of pinning */
      draw();
    }
  };
  addEventListener("pointermove", move); addEventListener("pointerup", up);
  move(e0);
}
function wireDrag(el, c){
  const grip = el.querySelector(".vqc-grip");
  grip?.addEventListener("pointerdown", e => beginMove(e, el, c));
  el.addEventListener("pointerdown", e => {
    if (!document.documentElement.classList.contains("vq-editing")) return;
    if (e.button !== 0) return;
    if (e.target.closest(".vqc-act, .vqc-nav-link, .vqc-per, .vqc-resize, a, button, input, .ck-cap")) return;
    beginMove(e, el, c);
  });
}

/* ── editor ────────────────────────────────────────────────────────────── */
function openEdit(id){
  EDIT = id;
  const c = cardOf(id); if (!c) return;
  const rd = readingOf(c.key);
  const legal = legalFor(c.key);
  const vars = variantsFor(c);
  const p = document.getElementById("edit");
  p.classList.add("is-on");
  const seriesRows = [c.key, ...c.extraKeys].map((k, i) => `
    <div class="ed-ser">
      <span class="ed-ser-d" style="background:var(--vq-series-${(i%8)+1})"></span>
      <span class="ed-ser-n">${readingOf(k).label}</span>
      <span class="ed-ser-u">${readingOf(k).unit}</span>
      ${i === 0 ? `<span class="ed-ser-b">primary</span>`
                : `<button class="ed-ser-x" data-drop="${k}" title="Remove series">${ic("x",12)}</button>`}
    </div>`).join("");

  p.innerHTML = `
    <div class="ed-h"><div>
      <p class="ed-eyebrow">Editing</p>
      <h3 class="ed-t">${c.title || rd.label}</h3>
      <code class="ed-k">${rd.key} · ${rd.shape}</code></div>
      <button class="vqc-act" id="ed-close" aria-label="Close">${ic("x",13)}</button></div>

    <p class="ed-lab">Name</p>
    <input class="ed-in" id="ed-title" value="${(c.title || rd.label).replace(/"/g,"&quot;")}">

    <p class="ed-lab">Period</p>
    <div class="ed-seg" id="ed-period">${PERIODS.map(x =>
      `<button class="ed-seg-i" aria-pressed="${x === c.period}" data-p="${x}">${x}</button>`).join("")}</div>

    <p class="ed-lab">Chart</p>
    <div class="ed-chips" id="ed-charts">${legal.map(ch =>
      `<button class="ed-chip ${ch === c.chart ? "is-on":""}" data-ch="${ch}">${CHART_NAME[ch]}</button>`).join("")}</div>

    <p class="ed-lab">Look <span class="ed-sub">${CHART_NAME[c.chart]} variants</span></p>
    <div class="ed-chips" id="ed-vars">${vars.map(([v,n,ok,why]) =>
      `<button class="ed-chip ${v === c.variant ? "is-on":""} ${ok?"":"is-off"}" ${ok?"":"disabled"}
        data-v="${v}" ${ok?"":`title="${why}"`}>${n}${ok?"":` · ${why}`}</button>`).join("")}</div>

    <p class="ed-lab">Series ${MULTI_OK.has(c.chart) ? `<span class="ed-sub">compare up to 4</span>` : ""}</p>
    <div class="ed-sers">${seriesRows}</div>
    ${MULTI_OK.has(c.chart) && c.extraKeys.length < 3 ? `
      <div class="ed-add">
        <input class="ed-in ed-in--sm" id="ed-sq" placeholder="Add a series to compare…" autocomplete="off">
        <div class="ed-sug" id="ed-sug" hidden></div>
      </div>` : MULTI_OK.has(c.chart) ? "" : `<p class="ed-note">Switch to a line, area, bar or composed chart to compare more than one reading.</p>`}

    <p class="ed-lab">Size <span class="ed-sub">minimum ${minSizeFor(c)[0]}×${minSizeFor(c)[1]} for a ${CHART_NAME[c.chart].toLowerCase()}</span></p>
    <div class="ed-chips" id="ed-cats">${CATS.map(k => {
      const ok = fitsFor(c, k).length;
      return `<button class="ed-size ${k === c.cat?"is-on":""} ${ok?"":"is-off"}" ${ok?"":"disabled"}
        data-cat="${k}" ${ok?"":'title="Too small for this chart"'}>${k} ${CAT_NAME[k]}</button>`; }).join("")}</div>
    <div class="ed-chips" id="ed-fits">${fitsFor(c, c.cat).map(([i,w,h,nm]) =>
      `<button class="ed-size ${(!c.w && i === c.fit)?"is-on":""}" data-fit="${i}">${w}×${h} ${nm}</button>`).join("")}
      ${c.w ? `<button class="ed-size is-on" data-fit="custom">${c.w}×${c.h} custom</button>` : ""}</div>
    <p class="ed-note">Drag a card's bottom-right corner to size it freely — it snaps to the
      grid and stops at the ${minSizeFor(c)[0]}×${minSizeFor(c)[1]} floor.</p>

    <p class="ed-lab">Period control <span class="ed-sub">applies to every card</span></p>
    <div class="ed-chips" id="ed-perpref">
      <button class="ed-chip ${PREFS.periodPicker?"is-on":""}" data-pp="1">Show on cards</button>
      <button class="ed-chip ${PREFS.periodPicker?"":"is-on"}" data-pp="0">Hide — set it here</button></div>

    <p class="ed-lab">Emphasis</p>
    <div class="ed-chips" id="ed-acc">
      <button class="ed-chip ${!c.accent?"is-on":""}" data-a="0">Plain</button>
      <button class="ed-chip ${c.accent?"is-on":""}" data-a="1">Accent fill</button></div>
    <p class="ed-note">One accent card per board — setting this clears the others.</p>`;

  const again = fn => { fn(); draw(); openEdit(id); };
  p.querySelector("#ed-close").onclick = closeEdit;
  p.querySelector("#ed-title").oninput = e => { c.title = e.target.value || null; draw(); };
  p.querySelectorAll("#ed-period .ed-seg-i").forEach(b => b.onclick = () => again(() => c.period = b.dataset.p));
  p.querySelectorAll("#ed-charts .ed-chip").forEach(b => b.onclick = () => again(() => {
    c.chart = b.dataset.ch;
    c.variant = defaultVariant(c.chart);
    if (!MULTI_OK.has(c.chart)) c.extraKeys = [];
    fixVariant(c);
    resizeForChart(c);
  }));
  p.querySelectorAll("#ed-vars .ed-chip").forEach(b => b.onclick = () => again(() => {
    c.variant = b.dataset.v;
    resizeForChart(c); }));
  p.querySelectorAll("#ed-cats .ed-size").forEach(b => b.onclick = () => again(() => {
    c.cat = b.dataset.cat; c.w = c.h = null; clampFit(c); }));
  p.querySelectorAll("#ed-fits .ed-size").forEach(b => b.onclick = () => again(() => {
    if (b.dataset.fit === "custom") return;
    c.w = c.h = null; c.fit = +b.dataset.fit; }));
  p.querySelectorAll("#ed-perpref .ed-chip").forEach(b => b.onclick = () => again(() => {
    PREFS.periodPicker = b.dataset.pp === "1"; }));
  p.querySelectorAll("#ed-acc .ed-chip").forEach(b => b.onclick = () => again(() => {
    const on = b.dataset.a === "1"; if (on) CARDS.forEach(x => x.accent = false); c.accent = on; }));
  p.querySelectorAll(".ed-ser-x").forEach(b => b.onclick = () => again(() => {
    c.extraKeys = c.extraKeys.filter(k => k !== b.dataset.drop); fixVariant(c); clampFit(c, c.fit); }));

  const q = p.querySelector("#ed-sq"), sug = p.querySelector("#ed-sug");
  if (q){
    q.oninput = () => {
      const t = q.value.trim().toLowerCase();
      if (!t){ sug.hidden = true; return; }
      const hits = READINGS.filter(r => r.key !== c.key && !c.extraKeys.includes(r.key)
        && (r.label.toLowerCase().includes(t) || r.key.includes(t))).slice(0, 6);
      sug.hidden = !hits.length;
      sug.innerHTML = hits.map(r => `<button class="ed-sug-i" data-k="${r.key}">
        <span>${r.label}</span><code>${r.unit}</code></button>`).join("");
      sug.querySelectorAll(".ed-sug-i").forEach(b => b.onclick = () => again(() => {
        c.extraKeys.push(b.dataset.k); clampFit(c, c.fit); }));
    };
  }
}
function closeEdit(){ EDIT = null; document.getElementById("edit").classList.remove("is-on"); }

/* ── library ───────────────────────────────────────────────────────────── */
function renderLibrary(){
  const box = document.getElementById("lib-body"); if (!box) return;
  /* The panel is a slide-over that starts closed. Rebuilding a hundred rows
     into a hidden element on every single draw is work nobody sees. */
  const panel = document.getElementById("lib");
  if (panel && !panel.classList.contains("is-on")) return;
  const on = new Set(CARDS.map(c => c.key));
  const areas = ["All", ...new Set(READINGS.map(r => r.area))];
  const q = LIB_Q.trim().toLowerCase();
  const list = READINGS.filter(r =>
    (LIB_AREA === "All" || r.area === LIB_AREA) &&
    (!q || r.label.toLowerCase().includes(q) || r.key.includes(q)));
  box.innerHTML = `
    <div class="lib-find">${ic("search",14)}<input id="lib-q" placeholder="Search ${READINGS.length} readings…" value="${LIB_Q.replace(/"/g,"&quot;")}"></div>
    <div class="lib-tabs">${areas.map(a =>
      `<button class="lib-tab ${a === LIB_AREA?"is-on":""}" data-a="${a}">${a}</button>`).join("")}</div>
    <div class="lib-list">${list.length ? list.map(r => `
      <div class="lib-row ${on.has(r.key)?"is-added":""}">
        <span class="lib-row-n">${r.label}</span>
        <code class="lib-row-k">${r.key}</code>
        <span class="lib-shape">${r.shape}</span>
        ${r.extra ? '<span class="lib-badge">extra</span>' : ''}
        <button class="lib-add" data-k="${r.key}" title="Add card">${on.has(r.key)?ic("check",13):ic("plus",13)}</button>
      </div>`).join("") : `<p class="lib-none">Nothing matches “${LIB_Q}”.</p>`}</div>`;
  const qi = box.querySelector("#lib-q");
  qi.oninput = () => { LIB_Q = qi.value; renderLibrary();
    const el = document.getElementById("lib-q"); el.focus(); el.setSelectionRange(el.value.length, el.value.length); };
  box.querySelectorAll(".lib-tab").forEach(b => b.onclick = () => { LIB_AREA = b.dataset.a; renderLibrary(); });
  box.querySelectorAll(".lib-add").forEach(b => b.onclick = () => {
    const c = addCard(b.dataset.k); if (c) openEdit(c.id); });
}

/* ── persistence ───────────────────────────────────────────────────────────
   The board a person builds is theirs: every change is written to this
   browser, per store, and comes back on the next visit. A reset swaps in a
   starting layout rather than silently destroying their work. */
const BOARD_KEY = () => `vq-dashboard-v6:${STORE_SLUG || "default"}`;
let PERSIST_ON = false;            /* off until the first board is in place */
function persistBoard(){
  if (!PERSIST_ON || typeof localStorage === "undefined") return;
  try { localStorage.setItem(BOARD_KEY(), JSON.stringify({ v: 2, cards: CARDS })); }
  catch {}
}
function loadBoard(){
  if (typeof localStorage === "undefined") return null;
  try {
    const data = JSON.parse(localStorage.getItem(BOARD_KEY()) || "null");
    if (!data || data.v !== 2 || !Array.isArray(data.cards) || !data.cards.length) return null;
    return availableCards(data.cards.filter(c => c && (c.type ? SPECIAL[c.type] : true)));
  } catch { return null; }
}

/* ── starting layouts ──────────────────────────────────────────────────────
   Composed to pack an 8-column board edge to edge; on wider or narrower
   boards the grid re-flows and every size stays legal. `key` is a reading,
   `type` a hub. Anything else is the ordinary card contract. */
const PRESETS = {
  retail: {
    name: "Retail overview", desc: "Sales, money, stock and alerts — the everyday board.",
    panel: "money",
    cards: [
      { key:"sales.revenue_trend", chart:"area", variant:"gradient", cat:"C5", w:6, h:7, period:"Month" },
      { type:"bank_liquidity", cat:"C4", w:3, h:3 },
      { key:"sales.avg_order_value", chart:"stat", variant:"spark", cat:"C3", w:3, h:3, period:"Month" },
      { type:"alerts_hub", cat:"C4", w:3, h:4 },
      { key:"inventory.low_stock_count", chart:"stat", variant:"spark", cat:"C3", w:3, h:4, period:"Today" },
      { key:"sales.payment_breakdown", chart:"pie", variant:"donut", cat:"C4", w:4, h:6, period:"Month" },
      { key:"sales.top_products", chart:"bar", variant:"solid", cat:"C4", w:4, h:6, period:"Month" },
      { key:"sales.live_feed", chart:"feed", variant:"live", cat:"C4", w:4, h:6, period:"Today" },
      { type:"launchpad", cat:"C4", w:6, h:3 },
      { type:"growth_engine", cat:"C4", w:6, h:3 },
    ],
  },
  finance: {
    name: "Money & accounts", desc: "Cash flow, dues, expenses and the bank picture.",
    panel: "credit",
    cards: [
      { key:"finance.cash_flow_trend", chart:"composed", variant:"bar-line-area", cat:"C5", w:6, h:7, period:"Month" },
      { type:"bank_liquidity", cat:"C4", w:3, h:3 },
      { key:"bank_accounts.money_in_today", chart:"stat", variant:"number", cat:"C2", w:3, h:2, period:"Today" },
      { key:"finance.receivables", chart:"stat", variant:"number", cat:"C2", w:3, h:2, period:"Month" },
      { key:"bank_accounts.money_out_today", chart:"stat", variant:"number", cat:"C2", w:3, h:2, period:"Today" },
      { key:"finance.payables", chart:"stat", variant:"number", cat:"C2", w:3, h:2, period:"Month" },
      { key:"finance.quick_ratio", chart:"stat", variant:"spark", cat:"C3", w:3, h:3, period:"Month" },
      { key:"finance.expenses_by_category", chart:"pie", variant:"donut", cat:"C4", w:4, h:6, period:"Month" },
      { key:"finance.expenses_trend", chart:"line", variant:"smooth", cat:"C4", w:4, h:6, period:"Month" },
      { key:"finance.receivables_aging", chart:"bar", variant:"solid", cat:"C4", w:4, h:6, period:"Month" },
      { key:"finance.profit_trend", chart:"line", variant:"smooth", cat:"C4", w:6, h:4, period:"Month" },
      { key:"finance.dso", chart:"stat", variant:"spark", cat:"C3", w:3, h:4, period:"Month" },
      { key:"finance.dpo", chart:"stat", variant:"spark", cat:"C3", w:3, h:4, period:"Month" },
    ],
  },
  inventory: {
    name: "Stock & purchasing", desc: "What's on the shelf, what's running out, what's on order.",
    panel: "operations",
    cards: [
      { key:"inventory.stock_value", chart:"stat", variant:"number", cat:"C2", w:4, h:1, period:"Month" },
      { key:"inventory.low_stock_count", chart:"stat", variant:"number", cat:"C2", w:4, h:1, period:"Today" },
      { key:"inventory.out_of_stock_count", chart:"stat", variant:"number", cat:"C2", w:4, h:1, period:"Today" },
      { key:"inventory.low_stock_list", chart:"table", variant:"standard", cat:"C4", w:4, h:6, period:"Month" },
      { key:"inventory.by_warehouse", chart:"pie", variant:"donut", cat:"C4", w:4, h:6, period:"Month" },
      { key:"inventory.value_trend", chart:"line", variant:"smooth", cat:"C4", w:4, h:6, period:"Month" },
      { key:"inventory.expiry_window", chart:"bar", variant:"solid", cat:"C4", w:4, h:5, period:"Month" },
      { key:"purchasing.spend_trend", chart:"line", variant:"smooth", cat:"C4", w:4, h:5, period:"Month" },
      { type:"alerts_hub", cat:"C4", w:4, h:5 },
      { key:"purchase_orders.pending", chart:"stat", variant:"number", cat:"C2", w:6, h:1, period:"Month" },
      { key:"batch_tracking.expiring_soon", chart:"stat", variant:"number", cat:"C2", w:6, h:1, period:"Month" },
    ],
  },
  command: {
    name: "Command centre", desc: "The revenue chart front and centre, everything else around it.",
    panel: "operations",
    cards: [
      { key:"finance.receivables", chart:"stat", variant:"number", cat:"C2", w:3, h:2, period:"Month" },
      { key:"sales.revenue_trend", chart:"area", variant:"gradient", cat:"C5", w:6, h:8, period:"Month" },
      { key:"finance.payables", chart:"stat", variant:"number", cat:"C2", w:3, h:2, period:"Month" },
      { key:"operations.plan_usage", chart:"gauge", variant:"arc", cat:"C4", w:3, h:4, period:"Month" },
      { key:"sales.top_products", chart:"table", variant:"bars", cat:"C4", w:3, h:4, period:"Month" },
      { key:"inventory.low_stock_count", chart:"stat", variant:"number", cat:"C2", w:3, h:2, period:"Today" },
      { key:"sales.avg_order_value", chart:"stat", variant:"number", cat:"C2", w:3, h:2, period:"Month" },
      { key:"sales.live_feed", chart:"feed", variant:"live", cat:"C4", w:6, h:4, period:"Today" },
      { key:"sales.top_customers", chart:"bar", variant:"solid", cat:"C4", w:6, h:4, period:"Month" },
    ],
  },
  classic: {
    name: "Familiar (like the old dashboard)", desc: "The layout you know — numbers on top, trend and lists below, money and activity on the right.",
    panel: "money",
    cards: [
      { key:"sales.revenue", chart:"stat", variant:"number", cat:"C2", w:3, h:1, period:"Today" },
      { key:"finance.profit_trend", chart:"stat", variant:"number", cat:"C2", w:3, h:1, period:"Month" },
      { key:"finance.receivables", chart:"stat", variant:"number", cat:"C2", w:3, h:1, period:"Month" },
      { key:"finance.payables", chart:"stat", variant:"number", cat:"C2", w:3, h:1, period:"Month" },
      { key:"sales.revenue_trend", chart:"area", variant:"gradient", cat:"C5", w:6, h:6, period:"Month" },
      { type:"alerts_hub", cat:"C4", w:3, h:3 },
      { key:"inventory.low_stock_count", chart:"stat", variant:"spark", cat:"C3", w:3, h:3, period:"Today" },
      { key:"purchasing.recent", chart:"feed", variant:"live", cat:"C4", w:3, h:6, period:"Month" },
      { key:"sales.top_products", chart:"bar", variant:"solid", cat:"C4", w:6, h:5, period:"Month" },
      { key:"operations.activity_feed", chart:"feed", variant:"live", cat:"C4", w:6, h:5, period:"Today" },
    ],
  },
  base: {
    name: "Start simple", desc: "One chart, the day's numbers, and room to grow.",
    panel: null,
    cards: [
      { key:"sales.revenue_trend", chart:"area", variant:"gradient", cat:"C5", w:12, h:6, period:"Month" },
      { key:"sales.revenue", chart:"stat", variant:"number", cat:"C2", w:4, h:1, period:"Today" },
      { key:"finance.expenses_total", chart:"stat", variant:"number", cat:"C2", w:4, h:1, period:"Today" },
      { key:"inventory.low_stock_count", chart:"stat", variant:"number", cat:"C2", w:4, h:1, period:"Today" },
      { type:"launchpad", cat:"C4", w:6, h:3 },
      { type:"alerts_hub", cat:"C4", w:6, h:3 },
    ],
  },
};
const DEFAULT_PRESET = "retail";

/** A preset never hands over a card the store's modules cannot answer. */
function availableCards(cards){
  return cards.filter(c => c.type
    ? specialAvailable(c.type)
    : (READINGS.some(r => r.key === c.key) && readingAvailable(readingOf(c.key))));
}

function applyPreset(id){
  const p = PRESETS[id] || PRESETS[DEFAULT_PRESET];
  const cols = boardCols();
  const scale = cols < 12 ? cols / 12 : 1;
  CARDS = availableCards(p.cards).map(c => {
    const card = { ...c, id: newId() };
    if (scale !== 1 && card.w){
      card.w = Math.max(1, Math.min(cols, Math.round(card.w * scale)));
    }
    delete card.gx; delete card.gy;          /* presets always flow */
    return normaliseCard(card);
  });
  EDIT = null;
  draw();
}

/* ── boot ──────────────────────────────────────────────────────────────── */
function boot(presetId){
  CARDS = []; EDIT = null;          /* a reset replaces the board, never doubles it */
  PERSIST_ON = false;
  if (presetId){
    applyPreset(presetId);
  } else {
    const saved = loadBoard();
    if (saved){
      let maxSeq = 0;
      saved.forEach(c => { const m = /^c(\d+)$/.exec(c.id || ""); if (m) maxSeq = Math.max(maxSeq, +m[1]); });
      SEQ = maxSeq;
      CARDS = saved.map(c => normaliseCard(c));
      draw();
    } else {
      applyPreset(DEFAULT_PRESET);
      if (typeof axios !== 'undefined') {
        axios.get('/api/dashboards').then(res => {
          const list = res?.data?.data || [];
          if (Array.isArray(list) && list.length > 0) {
            const activeBoard = list.find(b => b.is_default) || list[0];
            if (activeBoard && Array.isArray(activeBoard.cards) && activeBoard.cards.length > 0) {
              const backendCards = activeBoard.cards.map(bc => ({
                id: bc.id || newId(),
                key: bc.reading_key || bc.key,
                chart: bc.style || bc.chart,
                period: bc.period === 'today' ? 'Today' : bc.period === 'this_week' ? 'Week' : bc.period === 'this_year' ? 'Year' : 'Month',
                w: bc.w,
                h: bc.h,
                gx: bc.x,
                gy: bc.y,
                cat: bc.cat || 'C4',
                fit: bc.fit || 0,
                type: bc.type,
                variant: bc.variant || defaultVariant(bc.style || 'area'),
              }));
              CARDS = availableCards(backendCards).map(normaliseCard);
              draw();
            }
          }
        }).catch(() => {});
      }
    }
  }
  PERSIST_ON = true;
  persistBoard();

  /* Theme is owned by the React shell now (persisted, light by default) —
     the engine only repaints when told. */
  const libOpenBtn = document.getElementById("lib-open");
  if (libOpenBtn) {
    libOpenBtn.onclick = () => {
      document.getElementById("lib")?.classList.add("is-on");
      document.getElementById("lib-q")?.focus();
    };
  }
  const libCloseBtn = document.getElementById("lib-close");
  if (libCloseBtn) {
    libCloseBtn.onclick = () => document.getElementById("lib")?.classList.remove("is-on");
  }
}



// Expose engines and chart constraint helpers to React component
window.VenQoreCards = {
  getCards: () => CARDS,
  setCards: (newCards) => { CARDS = newCards.map(normaliseCard); draw(); },
  addCardObject: (card) => { CARDS.push(normaliseCard(card)); draw(); return card; },
  updateCard: (id, patch) => {
    const c = cardOf(id); if (!c) return null;
    Object.assign(c, patch); normaliseCard(c); draw(); return c;
  },
  getReadings: () => READINGS,
  getAvailableReadings: () => availableReadings(),
  setReadings: (newReadings) => {
    if (Array.isArray(newReadings) && newReadings.length > 0) {
      READINGS = prepareReadings(newReadings);
      if (typeof window !== 'undefined') window.__VENQORE_READINGS__ = newReadings;
      draw();
    }
  },
  getCats: () => CATS,
  getCatNames: () => CAT_NAME,
  getCatDescs: () => CAT_DESC,
  getCatMax: () => CAT_MAX,
  getFits: () => FITS,
  getSpecialFits: () => SPECIAL_FITS,
  getSpecials: () => SPECIAL,
  getLegalCharts: () => LEGAL,
  getChartNames: () => CHART_NAME,
  getVariants: () => VARIANTS,
  getVariantsFor: (card) => variantsFor(normaliseCard({ ...card })),
  getShortcutIcons: () => Object.keys(SHORTCUT_ICONS),
  iconMarkup: (n, s) => shortcutIcon(n, s || 18),
  /* the Layout Law, as the UI needs it */
  sizesFor, presetsFor, sizeLegal, resolveFit, minHeightAt, minWidthAt, catFloor,
  catsFor: (card) => catsFor(normaliseCard({ ...card })),
  geometryOf: (card, cols, colW) => geometryOf(normaliseCard({ ...card }), cols, colW),
  boardCols,
  fitsTable: (card) => fitsTable(card),
  isSpecial,
  minSizeFor: (card) => minSizeFor(normaliseCard({ ...card })),
  fitCat: (card) => fitCat(normaliseCard({ ...card })),
  sizeOf,
  authoredSizeOf,
  getReadingOf: readingOf,
  getHeadlineOf: headlineOf,
  renderCard: renderCard,
  /* the Law's own column width — the preview draws at it rather than at
     whatever the board behind the modal happens to be showing */
  REFERENCE_COL_W: 112,
  mountChart: mountChart,
  draw: draw,
  relayout: relayout,
  openEdit: openEdit,
  closeEdit: closeEdit,
  addCard: addCard,
  boot: boot,
  setStoreSlug: (s) => { STORE_SLUG = s || ""; },
  deepLinkFor: getDeepLinkForCard,
  catForSize: (card, w, h) => catForSize(normaliseCard({ ...card }), w, h),
  fitValues,
  getPresets: () => PRESETS,
  applyPreset,
  setEnabledModules,
  getAvailableReadings: availableReadings,
  specialAvailable,
  destinationName,
  titleOf,
  getPrefs: () => PREFS,
  setPref: (k, v) => { PREFS[k] = v; draw(); },
  openGlassActions: () => {
    if (window._vqOpenGlassActions) window._vqOpenGlassActions();
  }
};

/** Fill in whatever a caller left out, then snap the card onto a legal size.
    Every entry point into the engine goes through this, so a card built by the
    React wizard and a card built by the library are the same object. */
function normaliseCard(c){
  if (!c) return c;
  if (!c.id) c.id = newId();
  if (isSpecial(c)){
    const S = SPECIAL[c.type];
    if (!c.cat || !S.cats.includes(c.cat)) c.cat = S.cat;
  } else {
    if (!c.chart) c.chart = legalFor(c.key)[0];
    if (!c.variant) c.variant = defaultVariant(c.chart);
    if (!Array.isArray(c.extraKeys)) c.extraKeys = [];
    if (!c.period) c.period = "Month";
    if (!c.cat || !FITS[c.cat] || !fitsFor(c, c.cat).length) c.cat = fitCat(c);
    /* The bare number is the TILE and STRIP interior — those categories have no
       chart host at all. A stat that lands in C3 or above has a body to fill,
       and leaving it on `number` there is how a 3×3 card ended up as one figure
       floating in 240px of nothing. */
    if (c.chart === "stat"){
      const chartless = c.cat === "C1" || c.cat === "C2";
      if (chartless && c.variant !== "number") c.variant = "number";
      if (!chartless && c.variant === "number") c.variant = "spark";
    }
    fixVariant(c);
  }
  if (!Number.isInteger(c.gx) || !Number.isInteger(c.gy) || c.gx < 0 || c.gy < 0 || c.gx > 11){
    delete c.gx; delete c.gy;
  }
  if (c.tone == null) c.tone = c.accent ? "accent" : "surface";
  if (c.tone === "accent") c.accent = true;
  const g = geometryOf(c, 24);
  c.cat = g.cat; c.fit = g.fit;
  if (c.w || c.h){ c.w = g.authoredW; c.h = g.authoredH; }
  return c;
}


  DASHBOARD_PROPS = opts || {};
  STORE_SLUG = (opts && opts.storeSlug) || "";
  setEnabledModules(opts && opts.modules);
  boot();

  /* The board can change width without the window doing so — the nav pushes,
     the editor drawer opens. Watch the element, not just the viewport. */
  const board = document.getElementById("board");
  if (board && typeof ResizeObserver !== "undefined") {
    let timer = null, lastW = board.clientWidth;
    const ro = new ResizeObserver(() => {
      if (Math.abs(board.clientWidth - lastW) < 2) return;
      lastW = board.clientWidth;
      clearTimeout(timer);
      timer = setTimeout(relayout, 90);
    });
    ro.observe(board);
  }
}

/* ══ what the wizard offers ════════════════════════════════════════════════
   Nothing here lists a size. Sizes come out of the Layout Law resolver in the
   engine above (sizesFor / presetsFor / CAT_MAX), so the wizard, the drag
   handle and the board can never disagree about what is allowed. */

const CARD_TONES = [
  { id: 'surface', name: 'Default Surface', desc: 'Follows the page theme',
    swatchBg: 'var(--vq-surface, #ffffff)' },
  { id: 'accent',  name: 'Mint Accent',     desc: 'Teal brand gradient',
    swatchBg: 'linear-gradient(135deg, #0baa8f, #076b5e)' },
  { id: 'ink',     name: 'Obsidian Ink',    desc: 'Always dark, both themes',
    swatchBg: '#0d1412' },
  { id: 'mesh',    name: 'Aurora Mesh',     desc: 'Teal / sky gradient mesh',
    swatchBg: 'radial-gradient(circle at 100% 0%, #93ebd6 0%, #8fd9f5 100%)' },
];

/* The operations & command cards. `type` keys into the engine's SPECIAL
   registry, which owns their category, floor and legal categories. */
const OPERATIONAL_TEMPLATES = [
  { type: 'action_hub', title: 'Quick Operations Hub', category: 'Operations',
    desc: 'Action buttons for your daily flow — shows more of them as you make the card bigger.',
    tone: 'ink' },
  { type: 'launchpad', title: 'Launchpad', category: 'Operations',
    desc: 'Your four essentials — Point of Sale, New Invoice, Add Product, Purchase Order. Always the same four, at any size.',
    tone: 'surface' },
  { type: 'bank_liquidity', title: 'Bank & Liquid Net Balances', category: 'Finance',
    desc: 'Live breakdown of bank accounts, cash drawer holdings and total liquid net balance.',
    tone: 'surface' },
  { type: 'charity_hub', title: 'Charity & Donations Hub', category: 'Finance',
    desc: 'Live donation counter with instant one-tap donation recording.',
    tone: 'surface' },
  { type: 'top_products_hub', title: 'Top Products & Best Sellers', category: 'Sales',
    desc: 'Best selling products ranked by sold quantity and sales revenue.',
    tone: 'surface' },
  { type: 'recent_purchases_hub', title: 'Recent Purchases & Suppliers', category: 'Purchases',
    desc: 'Latest purchase orders, suppliers, amounts, and statuses.',
    tone: 'surface' },
  { type: 'store_health', title: 'Store Financial Health', category: 'Finance',
    desc: 'Solvency verification, books audit status, and receivables balance.',
    tone: 'surface' },
  { type: 'alerts_hub', title: 'Actions Required & Alerts', category: 'Operations',
    desc: 'Operational alerts — low-stock reorders, overdue receivables, warehouse receipts. Shows more rows as the card grows.',
    tone: 'surface' },
  { type: 'growth_engine', title: 'Growth Engine & Target Pace', category: 'Sales',
    desc: 'Revenue velocity, target progress and repeat-customer retention.',
    tone: 'surface' },
];

/* Shortcut destinations. `url` is a path under the active store unless it
   starts with a slash and a known root, so the store slug is applied at build
   time rather than baked into the file. */
const SHORTCUT_TARGETS = [
  { label: 'Point of Sale',            path: '/pos',             absolute: true,  icon: 'cart',     color: '#0baa8f' },
  { label: 'Create New Invoice',       path: '/sales',           icon: 'file',     color: '#2ba5d1' },
  { label: 'Inventory & Stock List',   path: '/inventory',       icon: 'box',      color: '#8ccb2e' },
  { label: 'Create Purchase Order',    path: '/purchase-orders', icon: 'truck',    color: '#f26a47' },
  { label: 'Accounts & Ledgers',       path: '/finance',         icon: 'dollar',   color: '#5227ff' },
  { label: 'Charity & Donations',      path: '/charity/stats',   icon: 'heart',    color: '#e11d48' },
  { label: 'Parties & Customers',      path: '/parties',         icon: 'users',    color: '#e0b4e0' },
  { label: 'Business Intel Reports',   path: '/reports',         icon: 'chart',    color: '#f5b32e' },
  { label: 'Settings',                 path: '/settings',        icon: 'settings', color: '#7b8a83' },
];

/* The shortcut swatch set — every one clears 4.5:1 against white glyphs. */
const SHORTCUT_COLORS = [
  '#0baa8f', '#2ba5d1', '#5227ff', '#8c4bd6',
  '#c2417a', '#f26a47', '#b8860b', '#4c5f57',
];
const SHORTCUT_ICON_NAMES = ['cart','file','box','truck','dollar','users','chart','bolt','plus','settings'];

const PERIOD_LABELS = ['Today', 'Week', 'Month', 'Quarter', 'Year'];

/* Used only before the engine has booted, so the first paint of the wizard is
   never wrong. The engine's own CAT_MAX is authoritative from then on. */
const CAT_MAX_FALLBACK = { C1:[3,2], C2:[6,2], C3:[6,4], C4:[6,6], C5:[12,9], C6:[12,16] };

/* One small proportional diagram of a w×h card, so a size is chosen by eye and
   not by arithmetic. Drawn against the category's own maximum. */
function SizeGlyph({ w, h, max = [12, 16] }) {
  /* One fixed frame per glyph, whatever the category's maximum happens to be,
     so a C1 tile's diagram is as legible as a C6 canvas's. The filled rectangle
     is the card as a fraction of its own category's maximum. */
  const [MW, MH] = max;
  const BOX = 46, BOXH = 30, PAD = 0.75;
  const cw = (BOX - PAD * 2) / MW, ch = (BOXH - PAD * 2) / MH;
  const fw = Math.max(3, Math.min(BOX - PAD * 2, w * cw));
  const fh = Math.max(3, Math.min(BOXH - PAD * 2, h * ch));
  return (
    <svg className="vq-size-glyph" width={BOX} height={BOXH} viewBox={`0 0 ${BOX} ${BOXH}`} aria-hidden="true">
      <rect x={PAD / 2} y={PAD / 2} width={BOX - PAD} height={BOXH - PAD} rx="3"
            fill="none" stroke="currentColor" strokeOpacity=".22" strokeDasharray="2.5 2.5" />
      <rect x={PAD} y={PAD} width={fw} height={fh} rx="2.5"
            fill="currentColor" fillOpacity=".85" />
    </svg>
  );
}

const isReadingCardIdx = i => i === 0;

/* ══ the right side panel ══════════════════════════════════════════════════
   The old dashboard kept a fixed right panel (cash in hand, accounts,
   activity). Here it is OPT-IN and COMPOSABLE: a store picks the rails it
   wants from this registry, in any order, and the choice persists next to
   the board. Each rail is a narrow, fixed-purpose column widget — cards on
   the grid stay the place for anything a user wants to size or restyle. */
/* Six pre-built side panels. A store picks ONE design — the composition is
   ours, so every one of them is balanced; nobody has to be a designer to get
   a good panel. Each design is a fixed stack of rails. */
const PANEL_DESIGNS = [
  { id: 'money', name: 'Money desk',
    desc: 'The old dashboard\u2019s panel — action buttons, cash & accounts, live activity.',
    rails: ['action_trio', 'balances', 'activity'] },
  { id: 'charity_desk', name: 'Charity & Giving',
    desc: 'Community donations, today\u2019s figures and quick actions.',
    rails: ['charity', 'today', 'quick_actions'] },
  { id: 'operations', name: 'Operations desk',
    desc: 'What needs doing — alerts, today\u2019s numbers, quick actions.',
    rails: ['alerts', 'today', 'quick_actions'] },
  { id: 'sales', name: 'Sales pulse',
    desc: 'Today at a glance, best sellers and the live feed.',
    rails: ['today', 'top_lists', 'activity'] },
  { id: 'credit', name: 'Credit control',
    desc: 'Who owes you — reminders, cash & accounts, activity.',
    rails: ['reminders', 'balances', 'activity'] },
  { id: 'growth', name: 'Growth',
    desc: 'Targets, velocity and your best performers.',
    rails: ['targets', 'top_lists'] },
  { id: 'minimal', name: 'Minimal',
    desc: 'Just quick actions and today\u2019s numbers.',
    rails: ['quick_actions', 'today'] },
];

const RAIL_DEFS = [
  { id: 'action_trio', name: 'Action buttons', modules: [],
    desc: 'Sale, purchase and more actions \u2014 one tap each.' },
  { id: 'charity', name: 'Charity & Donations', modules: [],
    desc: 'Live charity balance and quick 1-tap donation buttons.' },
  { id: 'balances', name: 'Cash & accounts', modules: ['bank_accounts'],
    desc: 'Cash in hand, every bank account, and the liquid total.' },
  { id: 'today', name: 'Today at a glance', modules: [],
    desc: "Today's sales, expenses and money in / out, in four numbers." },
  { id: 'activity', name: 'Recent activity', modules: [],
    desc: 'The latest sales, purchases and payments as they happen.' },
  { id: 'alerts', name: 'Actions required', modules: [],
    desc: 'Low stock, overdue dues, waiting orders — everything needing someone.' },
  { id: 'quick_actions', name: 'Quick actions', modules: [],
    desc: 'One-tap buttons for the things you do all day.' },
  { id: 'targets', name: 'Growth & targets', modules: ['reports', 'ai_insights'],
    desc: 'Monthly target pace, revenue velocity and repeat customers.' },
  { id: 'top_lists', name: 'Top performers', modules: ['pos', 'invoicing'],
    desc: 'Best-selling products and biggest customers this month.' },
  { id: 'reminders', name: 'Payment reminders', modules: ['khata_credit'],
    desc: 'Who to chase today, with amounts and how overdue they are.' },
];

/** One rail, rendered with real props from the database. */
function DashRail({ id, storePath, onQuickActions, enabledModules = [], props = {} }) {
  const modOk = mods => !enabledModules.length || !mods || !mods.length || mods.some(m => enabledModules.includes(m));
  
  if (id === 'charity') {
    const charityToday = Number(props.charityStats?.today) || 0;
    const charityMonth = Number(props.charityStats?.month) || 0;
    const defAmt = Number(props.charityStats?.default_amount) || 10;

    return (
      <section className="vq-rail-card">
        <header className="vq-rail-h">
          <span>Charity &amp; Donations</span>
          <button type="button" onClick={() => window._vqDonateCharity && window._vqDonateCharity(defAmt)} className="vq-rail-link text-rose-500 font-bold">
            +Rs {defAmt}
          </button>
        </header>
        <div className="vq-rail-hero">
          <span className="vq-rail-hero-l">Today's Total</span>
          <span className="vq-rail-hero-v text-rose-500">Rs {charityToday.toLocaleString()}</span>
          <span className="vq-rail-hero-s">Month: Rs {charityMonth.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-2.5">
          {[10, 50, 100].map(amt => (
            <button
              key={amt}
              type="button"
              onClick={() => window._vqDonateCharity && window._vqDonateCharity(amt)}
              className="flex-1 py-1 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold transition-colors"
            >
              +Rs {amt}
            </button>
          ))}
        </div>
      </section>
    );
  }

  if (id === 'action_trio') return (
    <section className="vq-rail-card vq-rail-card--trio">
      <div className="vq-rail-trio">
        <a href="/pos" className="vq-trio-btn is-sale">
          <span className="vq-trio-ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5"/><path d="m5 12 7 7 7-7"/></svg></span>
          <span>Sale</span>
        </a>
        <a href={storePath('/purchase-orders')} className="vq-trio-btn is-purchase">
          <span className="vq-trio-ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m19 12-7-7-7 7"/></svg></span>
          <span>Purchase</span>
        </a>
        <button type="button" className="vq-trio-btn is-actions" onClick={onQuickActions}>
          <span className="vq-trio-ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg></span>
          <span>Actions</span>
        </button>
      </div>
    </section>
  );

  if (id === 'balances') {
    const bankAccounts = Array.isArray(props.bankAccounts) ? props.bankAccounts : [];
    const cashVal = Number(props.cashData?.balance) || (Array.isArray(props.cashAccounts) ? props.cashAccounts.reduce((s, a) => s + (Number(a.balance) || 0), 0) : 0);
    const bankVal = bankAccounts.reduce((s, a) => s + (Number(a.current_balance) || 0), 0);
    const totalLiquid = cashVal + bankVal;

    return (
      <section className="vq-rail-card">
        <header className="vq-rail-h"><span>Cash &amp; accounts</span><a href={storePath('/finance')} className="vq-rail-link">Open</a></header>
        <div className="vq-rail-hero">
          <span className="vq-rail-hero-l">Cash in hand</span>
          <span className="vq-rail-hero-v">Rs {cashVal.toLocaleString()}</span>
          <span className="vq-rail-hero-s">Drawer &amp; safe</span>
        </div>
        <ul className="vq-rail-list">
          {bankAccounts.length > 0 ? (
            bankAccounts.map((a, i) => (
              <li key={a.id || i} className="vq-rail-row">
                <span className="vq-rail-row-n">{a.name || a.bank_name || 'Bank Account'}</span>
                <span className="vq-rail-row-v">Rs {(Number(a.current_balance) || 0).toLocaleString()}</span>
              </li>
            ))
          ) : (
            <li className="vq-rail-row text-xs text-[rgba(241,245,242,0.4)] py-1.5 justify-center">No bank accounts linked</li>
          )}
        </ul>
        <div className="vq-rail-total">
          <span>Total liquid</span><strong>Rs {totalLiquid.toLocaleString()}</strong>
        </div>
      </section>
    );
  }

  if (id === 'today') {
    const todaySales = Number(props.performance?.Today?.sales) || Number(props.performance?.Day?.sales) || 0;
    const todayExpenses = Number(props.performance?.Today?.expenses) || Number(props.performance?.Day?.expenses) || 0;
    const moneyIn = Number(props.performance?.Today?.money_in) || todaySales;
    const moneyOut = Number(props.performance?.Today?.money_out) || todayExpenses;

    return (
      <section className="vq-rail-card">
        <header className="vq-rail-h"><span>Today at a glance</span></header>
        <div className="vq-rail-minigrid">
          <div className="vq-rail-mini"><span>Sales</span><strong>Rs {abbrNum(todaySales)}</strong></div>
          <div className="vq-rail-mini"><span>Expenses</span><strong>Rs {abbrNum(todayExpenses)}</strong></div>
          <div className="vq-rail-mini"><span>Money in</span><strong>Rs {abbrNum(moneyIn)}</strong></div>
          <div className="vq-rail-mini"><span>Money out</span><strong>Rs {abbrNum(moneyOut)}</strong></div>
        </div>
      </section>
    );
  }

  if (id === 'activity') {
    const txs = Array.isArray(props.recentTransactions) && props.recentTransactions.length > 0
      ? props.recentTransactions
      : (Array.isArray(props.recentPurchases) ? props.recentPurchases : []);

    return (
      <section className="vq-rail-card">
        <header className="vq-rail-h"><span>Recent activity</span><a href={storePath('/reports')} className="vq-rail-link">All</a></header>
        <ul className="vq-rail-list">
          {txs.length > 0 ? (
            txs.slice(0, 6).map((tx, i) => {
              const isIn = tx.type === 'in' || tx.type === 'sale' || tx.type === 'payment_in' || Number(tx.amount) > 0;
              const amt = Math.abs(Number(tx.amount || tx.total || 0));
              const title = tx.desc || tx.description || tx.reference || (tx.type ? `${tx.type}` : 'Transaction');
              const time = tx.date ? new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (tx.created_at ? new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');

              return (
                <li key={tx.id || i} className="vq-rail-row">
                  <span className={`vq-rail-dot is-${isIn ? 'in' : 'out'}`} aria-hidden="true" />
                  <span className="vq-rail-row-n">{title}<em>{time}</em></span>
                  <span className={`vq-rail-row-v is-${isIn ? 'in' : 'out'}`}>{isIn ? '+ ' : '− '}Rs {amt.toLocaleString()}</span>
                </li>
              );
            })
          ) : (
            <li className="vq-rail-row text-xs text-[rgba(241,245,242,0.4)] py-3 justify-center">No recent activity</li>
          )}
        </ul>
      </section>
    );
  }

  if (id === 'alerts') {
    const lowStockItems = Array.isArray(props.lowStockItems) ? props.lowStockItems : [];
    const overdueReceivables = Number(props.outstanding?.receivables) || 0;
    const aiRecs = Array.isArray(props.aiRecommendations) ? props.aiRecommendations : [];

    const alertsList = [];
    if (lowStockItems.length > 0 && modOk(['inventory'])) {
      alertsList.push({ k: 'warn', msg: <><strong>{lowStockItems.length} product{lowStockItems.length === 1 ? '' : 's'}</strong> reached reorder limit</>, href: '/inventory' });
    }
    if (overdueReceivables > 0 && modOk(['khata_credit', 'payments'])) {
      alertsList.push({ k: 'bad', msg: <><strong>Rs {overdueReceivables.toLocaleString()}</strong> customer dues overdue</>, href: '/finance' });
    }
    aiRecs.forEach(r => {
      alertsList.push({
        k: r.priority === 'urgent' ? 'bad' : 'info',
        msg: <>{r.message || r.title}</>,
        href: '/reports'
      });
    });

    return (
      <section className="vq-rail-card">
        <header className="vq-rail-h"><span>Actions required</span></header>
        <ul className="vq-rail-list">
          {alertsList.length > 0 ? (
            alertsList.map((a, i) => (
              <li key={i}>
                <a href={storePath(a.href)} className={`vq-rail-alert is-${a.k}`}>
                  <span className="vq-rail-dot" aria-hidden="true" />
                  <span className="vq-rail-alert-m">{a.msg}</span>
                </a>
              </li>
            ))
          ) : (
            <li className="vq-rail-row text-xs text-[rgba(241,245,242,0.4)] py-3 justify-center">All clear — no actions required</li>
          )}
        </ul>
      </section>
    );
  }

  if (id === 'quick_actions') return (
    <section className="vq-rail-card">
      <header className="vq-rail-h"><span>Quick actions</span></header>
      <div className="vq-rail-actions">
        <a href={storePath('/sales')} className="vq-rail-act is-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
          <span>New Invoice</span>
        </a>
        <a href={storePath('/purchase-orders')} className="vq-rail-act">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          <span>New Purchase</span>
        </a>
        <button type="button" className="vq-rail-act" onClick={onQuickActions}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
          <span>More actions</span>
        </button>
      </div>
    </section>
  );

  if (id === 'targets') {
    const monthSales = Number(props.performance?.Month?.sales) || Number(props.revenue) || 0;
    const daySales = Number(props.performance?.Today?.sales) || Number(props.performance?.Day?.sales) || 0;
    const netProfit = Number(props.netProfit) || 0;

    return (
      <section className="vq-rail-card">
        <header className="vq-rail-h"><span>Growth &amp; targets</span><a href={storePath('/reports')} className="vq-rail-link">Open</a></header>
        <div className="vq-rail-meter">
          <div className="vq-rail-meter-t"><span>Monthly sales</span><strong>Rs {abbrNum(monthSales)}</strong></div>
          <div className="vq-rail-bar"><i style={{ width: monthSales > 0 ? '100%' : '0%' }} /></div>
          <span className="vq-rail-meter-s">Total revenue this month</span>
        </div>
        <div className="vq-rail-meter">
          <div className="vq-rail-meter-t"><span>Today's velocity</span><strong>Rs {abbrNum(daySales)}</strong></div>
          <div className="vq-rail-bar"><i style={{ width: daySales > 0 ? '75%' : '0%' }} /></div>
          <span className="vq-rail-meter-s">Sales closed today</span>
        </div>
        <div className="vq-rail-meter">
          <div className="vq-rail-meter-t"><span>Net profit</span><strong>Rs {abbrNum(netProfit)}</strong></div>
          <div className="vq-rail-bar"><i style={{ width: netProfit > 0 ? '100%' : '0%' }} /></div>
          <span className="vq-rail-meter-s">Realised profit</span>
        </div>
      </section>
    );
  }

  if (id === 'top_lists') {
    const topProducts = Array.isArray(props.topSellingItems) ? props.topSellingItems : [];
    const maxVal = topProducts[0]?.total_sales || topProducts[0]?.sales || 1;

    return (
      <section className="vq-rail-card">
        <header className="vq-rail-h"><span>Top performers</span><a href={storePath('/reports')} className="vq-rail-link">Open</a></header>
        <span className="vq-rail-sub">Products</span>
        <ul className="vq-rail-list">
          {topProducts.length > 0 ? (
            topProducts.slice(0, 5).map((t, idx) => {
              const val = Number(t.total_sales || t.sales || t.revenue || 0);
              const pct = Math.min(100, Math.round((val / maxVal) * 100)) || 20;
              return (
                <li key={t.id || idx} className="vq-rail-rank">
                  <span className="vq-rail-row-n">{t.name || `Item ${idx + 1}`}</span>
                  <span className="vq-rail-track"><i style={{ width: `${pct}%` }} /></span>
                  <span className="vq-rail-row-v">Rs {abbrNum(val)}</span>
                </li>
              );
            })
          ) : (
            <li className="vq-rail-row text-xs text-[rgba(241,245,242,0.4)] py-2 justify-center">No sales recorded this month</li>
          )}
        </ul>
      </section>
    );
  }

  if (id === 'reminders') {
    const overdueAmt = Number(props.outstanding?.receivables) || 0;

    return (
      <section className="vq-rail-card">
        <header className="vq-rail-h"><span>Payment reminders</span><a href={storePath('/finance')} className="vq-rail-link">All</a></header>
        <ul className="vq-rail-list">
          {overdueAmt > 0 ? (
            <li className="vq-rail-row">
              <span className="vq-rail-dot is-bad" aria-hidden="true" />
              <span className="vq-rail-row-n">Outstanding Receivables<em>Pending customer dues</em></span>
              <span className="vq-rail-row-v">Rs {overdueAmt.toLocaleString()}</span>
            </li>
          ) : (
            <li className="vq-rail-row text-xs text-[rgba(241,245,242,0.4)] py-3 justify-center">No pending payment reminders</li>
          )}
        </ul>
      </section>
    );
  }

  return null;
}

/* ── a preset, drawn: simulate the grid's row-major auto-placement on 8
   columns and paint the little rectangles. A picker you choose by eye. */
function packPreset(cards, cols = 8) {
  const taken = [];   /* taken[row] = boolean[cols] */
  const rects = [];
  const fits = (r, c, w, h) => {
    for (let y = r; y < r + h; y++) { const row = taken[y]; if (row) for (let x = c; x < c + w; x++) if (row[x]) return false; }
    return true;
  };
  const mark = (r, c, w, h) => {
    for (let y = r; y < r + h; y++) { taken[y] ||= new Array(cols).fill(false); for (let x = c; x < c + w; x++) taken[y][x] = true; }
  };
  let cursorR = 0, cursorC = 0;
  cards.forEach(card => {
    const w = Math.min(cols, card.w || 3), h = card.h || 2;
    let r = cursorR, c = cursorC, placed = false;
    while (!placed) {
      if (c + w > cols) { c = 0; r++; continue; }
      if (fits(r, c, w, h)) { rects.push({ x: c, y: r, w, h, hub: !!card.type }); mark(r, c, w, h); cursorR = r; cursorC = c + w; placed = true; }
      else c++;
    }
  });
  return rects;
}
function PresetThumb({ cards }) {
  const rects = useMemo(() => packPreset(cards), [cards]);
  const rows = Math.min(14, rects.reduce((m, r) => Math.max(m, r.y + r.h), 0));
  const CW = 112, U = 5, G = 1.6, colW = (CW - G * 7) / 8;
  const H = rows * U + (rows - 1) * G;
  return (
    <svg className="vq-preset-thumb" width={CW} height={Math.max(30, H)} viewBox={`0 0 ${CW} ${Math.max(30, H)}`} aria-hidden="true">
      {rects.filter(r => r.y < 14).map((r, i) => (
        <rect key={i}
          x={r.x * (colW + G)} y={r.y * (U + G)}
          width={r.w * colW + (r.w - 1) * G} height={Math.min(r.h, 14 - r.y) * U + (Math.min(r.h, 14 - r.y) - 1) * G}
          rx="1.6" fill="currentColor" opacity={r.hub ? 0.85 : 0.42} />
      ))}
    </svg>
  );
}

export default function NewDashboard(props) {
  const containerRef = useRef(null);
  const previewRef = useRef(null);
  const previewFrameRef = useRef(null);
  const previewHandleRef = useRef(null);

  const store = props?.store || { name: 'VenQore Main Outlet', currency_symbol: 'Rs', slug: '' };
  const auth = props?.auth || {};
  const user = auth?.user || { name: 'Store Owner', email: 'business@venqore.com' };
  const settings = props?.settings || {};
  const readingsProp = props?.readings || null;
  if (typeof window !== 'undefined') {
    if (props) window.__DASHBOARD_PROPS__ = props;
    if (Array.isArray(readingsProp) && readingsProp.length > 0) {
      window.__VENQORE_READINGS__ = readingsProp;
    }
  }
  const [seniorMode, setSeniorMode] = useState(() => String(settings?.senior_mode) === '1');

  useEffect(() => {
    setSeniorMode(String(settings?.senior_mode) === '1');
  }, [settings?.senior_mode]);

  useEffect(() => {
    let posSeniorOverride = null;
    try {
      const raw = sessionStorage.getItem('pos_senior_mode');
      if (raw !== null) posSeniorOverride = JSON.parse(raw);
    } catch (_) {}

    const isSenior = posSeniorOverride !== null ? posSeniorOverride : seniorMode;
    const fontSize = isSenior ? '20px' : '16px';
    document.documentElement.style.fontSize = fontSize;
  }, [seniorMode]);
  /* The store route is /s/{slug}/new-dashboard and does not pass the slug as a
     prop, so read it off the path when it is not supplied. Every deep link on
     every card is built from this — the alternative is the literal store slug
     that used to be typed into forty href strings in this file. */
  const storeSlug = useMemo(() => {
    if (props?.store?.slug) return props.store.slug;
    if (props?.store_slug) return props.store_slug;
    if (typeof window !== 'undefined') {
      const m = window.location.pathname.match(/^\/s\/([^/]+)/);
      if (m) return decodeURIComponent(m[1]);
    }
    return '';
  }, [props?.store?.slug, props?.store_slug]);
  const storePath = (p) => (storeSlug ? `/s/${storeSlug}${p}` : p);

  /* ── shell ───────────────────────────────────────────────────────────── */
  /* The Layout Law §2: the hamburger exists at every width; below 1216 it
     overlays because an automatic push can never be free, and from 1280 the
     dashboard shows the nav expanded because cards absorb the loss. The user's
     own choice, once made, is sticky and only demoted by the viewport. */
  const [navIntent, setNavIntent] = useState('auto');   // 'auto' | 'expanded' | 'rail'
  const [navOverlayOpen, setNavOverlayOpen] = useState(false);
  const [vw, setVw] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1920));
  const [isEditMode, setIsEditMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [engineReady, setEngineReady] = useState(false);


  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [isDisplayMenuOpen, setIsDisplayMenuOpen] = useState(false);
  const displayMenuRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const canPush = vw >= 1216;                 // §2 — push threshold
  const navMode = !canPush ? 'overlay' : (
    navIntent === 'rail' ? 'rail'
      : navIntent === 'expanded' ? 'expanded'
      : (vw >= 1280 ? 'expanded' : 'rail')    // dashboard archetype default
  );
  const toggleNav = () => {
    if (!canPush) { setNavOverlayOpen(o => !o); return; }
    setNavIntent(navMode === 'expanded' ? 'rail' : 'expanded');
  };
  useEffect(() => { if (canPush) setNavOverlayOpen(false); }, [canPush]);
  useEffect(() => {
    if (!navOverlayOpen) return;
    const onKey = e => { if (e.key === 'Escape') setNavOverlayOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navOverlayOpen]);

  const railOnly = navMode === 'rail';

  /* ── the add-card wizard ─────────────────────────────────────────────── */
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [stepperModalOpen, setStepperModalOpen] = useState(false);
  const [categoryFolderIndex, setCategoryFolderIndex] = useState(0); // 0 readings · 1 hubs · 2 shortcuts
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('All');
  const [glassModalOpen, setGlassModalOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState(null);

  useEffect(() => {
    if (!glassModalOpen) return;
    const onKey = e => { if (e.key === 'Escape') setGlassModalOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [glassModalOpen]);

  /* the draft — one shape for all three families */
  const [selectedReading, setSelectedReading] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customBtnTarget, setCustomBtnTarget] = useState(SHORTCUT_TARGETS[0]);

  const [draftCat, setDraftCat] = useState('C3');
  const [draftW, setDraftW] = useState(4);
  const [draftH, setDraftH] = useState(3);
  const [draftChart, setDraftChart] = useState('area');
  const [draftVariant, setDraftVariant] = useState('gradient');
  const [draftTone, setDraftTone] = useState('surface');
  const [draftPeriod, setDraftPeriod] = useState('Month');
  /* The four things the author may put on, or take off, the card face. All
     four default ON; each is additionally gated at render by whether the card
     is big enough to carry it, so a preference can never cause an overflow. */
  const [draftShowPeriodPicker, setDraftShowPeriodPicker] = useState(true);
  const [draftShowWhen, setDraftShowWhen] = useState(true);
  const [draftShowDelta, setDraftShowDelta] = useState(true);
  const [draftOpenArrow, setDraftOpenArrow] = useState(true);
  const [draftGlare, setDraftGlare] = useState(false);
  const [draftStarBorder, setDraftStarBorder] = useState(false);
  const [draftIcon, setDraftIcon] = useState('cart');
  const [draftColor, setDraftColor] = useState('#0baa8f');
  const [draftLink, setDraftLink] = useState('');
  const [previewZoom, setPreviewZoom] = useState('fit');   // 'fit' | 'actual'
  const [previewScale, setPreviewScale] = useState(100);

  const engine = () => (typeof window !== 'undefined' ? window.VenQoreCards : null);

  /* ── theme: light is the default; the choice persists per browser ────── */
  const THEME_KEY = 'vq-dashboard-v6-theme';
  const [themeMode, setThemeMode] = useState(() => {
    try {
      const v = localStorage.getItem(THEME_KEY);
      return v === 'dark' || v === 'mesh' || v === 'light' ? v : 'mesh';
    } catch { return 'mesh'; }
  });
  useEffect(() => {
    const r = document.documentElement;
    const dark = themeMode !== 'light';
    r.setAttribute('data-theme', dark ? 'dark' : 'light');
    if (themeMode === 'mesh') r.setAttribute('data-bg', 'mesh');
    else r.removeAttribute('data-bg');
    try { localStorage.setItem(THEME_KEY, themeMode); } catch {}
    /* charts sample their colours at mount — repaint under the new tokens */
    engine()?.draw?.();
  }, [themeMode, engineReady]);
  const cycleTheme = () => setThemeMode(m => (m === 'light' ? 'dark' : m === 'dark' ? 'mesh' : 'light'));
  const themeTitle = themeMode === 'light' ? 'Theme: light — switch to dark'
    : themeMode === 'dark' ? 'Theme: dark — switch to mesh' : 'Theme: mesh — switch to light';

  /* ── the right side panel ────────────────────────────────────────────── */
  const RAILS_KEY = `vq-dashboard-v6-rails:${storeSlug || 'default'}`;
  const [railPrefs, setRailPrefsState] = useState(() => {
    const base = { design: null, sticky: true, width: 340, collapsed: false };
    try {
      const v = JSON.parse(localStorage.getItem(RAILS_KEY) || 'null');
      if (v && typeof v.design === 'string') return { ...base, ...v };
      /* older payloads composed rails by hand — map them onto the nearest design */
      const ids = Array.isArray(v) ? v : (v && Array.isArray(v.ids) ? v.ids : null);
      if (ids && ids.length){
        const design = ids.includes('balances') ? 'money'
          : ids.includes('alerts') ? 'operations'
          : ids.includes('targets') ? 'growth' : 'minimal';
        return { ...base, ...(v && !Array.isArray(v) ? v : {}), ids: undefined, design };
      }
    } catch {}
    return base;
  });
  const saveRailPrefs = (next) => {
    setRailPrefsState(next);
    try { localStorage.setItem(RAILS_KEY, JSON.stringify(next)); } catch {}
  };
  const setRailOpt = (patch) => saveRailPrefs({ ...railPrefs, ...patch });
  const panelDesign = PANEL_DESIGNS.find(d => d.id === railPrefs.design) || null;
  const [railsModalOpen, setRailsModalOpen] = useState(false);

  const railAvailable = (def) => {
    const mods = Array.isArray(props?.modules) ? props.modules : [];
    if (!mods.length || !def.modules.length) return true;
    return def.modules.some(m => mods.includes(m));
  };
  const availableRailDefs = RAIL_DEFS.filter(railAvailable);
  const railsFit = vw >= 1360;                    /* the panel needs real width */
  const chosenRails = panelDesign
    ? panelDesign.rails.filter(id => availableRailDefs.some(d => d.id === id))
    : [];
  const activeRails = railsFit ? chosenRails : [];
  const railsOn = activeRails.length > 0 && !railPrefs.collapsed;

  /* The grid is a fixed 12 columns — the panel and the nav squeeze the same
     twelve tracks rather than re-arranging the board. Only a repaint is
     needed when the available width changes. */
  useEffect(() => {
    const t = setTimeout(() => engine()?.relayout?.(), 260);
    return () => clearTimeout(t);
  }, [railsOn, railPrefs.width, vw, navMode, engineReady]);

  /* Applying a preset sets the board AND the panel it was composed with. */
  const choosePreset = (id) => {
    const e = engine();
    const p = e?.getPresets?.()[id];
    e?.applyPreset?.(id);
    if (p) setRailOpt({ design: PANEL_DESIGNS.some(d => d.id === p.panel) ? p.panel : null, collapsed: false });
    setPresetModalOpen(false);
  };


  useEffect(() => {
    window._vqOpenGlassActions = () => setGlassModalOpen(true);
    window._vqDonateCharity = async (amount) => {
      try {
        const donateUrl = typeof window !== 'undefined' && typeof window.route === 'function'
          ? window.route('store.charity.add', { store_slug: storeSlug })
          : `/s/${storeSlug}/charity/add`;
        const res = await axios.post(donateUrl, { amount: Number(amount) || 10 });
        if (res.data && res.data.success) {
          if (props?.charityStats) {
            props.charityStats.today = res.data.today_total;
          }
          if (window.__DASHBOARD_PROPS__?.charityStats) {
            window.__DASHBOARD_PROPS__.charityStats.today = res.data.today_total;
          }
          window.VenQoreCards?.draw?.();
          window.dispatchEvent(new CustomEvent('vq:toast', {
            detail: { message: `Charity recorded: Rs ${Number(amount || 10).toLocaleString()}`, type: 'success' }
          }));
          router.reload({ only: ['charityStats'] });
        }
      } catch (err) {
        console.error('Failed to record charity:', err);
      }
    };
    return () => {
      window._vqOpenGlassActions = null;
      window._vqDonateCharity = null;
    };
  }, [storeSlug, props]);

  const enabledModules = useMemo(
    () => (Array.isArray(props?.modules) ? props.modules : []),
    [props?.modules]);

  useEffect(() => {
    runCardBuilder({ storeSlug, modules: enabledModules, readings: readingsProp, ...props });
    setEngineReady(true);
  }, [storeSlug, enabledModules, readingsProp, props]);

  /* Edit mode is a page state; the engine paints from a class on the shell. */
  useEffect(() => {
    document.documentElement.classList.toggle('vq-editing', isEditMode);
  }, [isEditMode]);

  /* The board reflows when the nav pushes — tell the engine, not the window. */
  useEffect(() => {
    const t = setTimeout(() => engine()?.relayout?.(), 280);
    return () => clearTimeout(t);
  }, [navMode]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [menuOpen]);

  useEffect(() => {
    if (!isDisplayMenuOpen) return;
    const close = (e) => {
      if (displayMenuRef.current && displayMenuRef.current.contains(e.target)) return;
      setIsDisplayMenuOpen(false);
    };
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [isDisplayMenuOpen]);

  /* Listen to layout customization events dispatched from header or layout */
  useEffect(() => {
    const onEditLayout = () => setIsEditMode(v => !v);
    const onAddCard = () => openPicker(0);
    const onToggleSidePanel = () => setRailsModalOpen(true);
    const onOpenSidePanel = () => setRailsModalOpen(true);
    const onStartFresh = () => setPresetModalOpen(true);
    const onQuickActions = () => setGlassModalOpen(true);

    window.addEventListener('vq:edit-layout', onEditLayout);
    window.addEventListener('vq:toggle-edit-layout', onEditLayout);
    window.addEventListener('vq:add-card', onAddCard);
    window.addEventListener('vq:open-add-card', onAddCard);
    window.addEventListener('vq:toggle-side-panel', onToggleSidePanel);
    window.addEventListener('vq:open-side-panel', onOpenSidePanel);
    window.addEventListener('vq:start-fresh', onStartFresh);
    window.addEventListener('vq:open-quick-actions', onQuickActions);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('edit') === '1') setIsEditMode(true);
      if (params.get('add_card') === '1') setTimeout(() => openPicker(0), 350);
      if (params.get('side_panel') === '1') setTimeout(() => setRailsModalOpen(true), 350);
      if (params.get('reset') === '1') setPresetModalOpen(true);
    }

    return () => {
      window.removeEventListener('vq:edit-layout', onEditLayout);
      window.removeEventListener('vq:toggle-edit-layout', onEditLayout);
      window.removeEventListener('vq:add-card', onAddCard);
      window.removeEventListener('vq:open-add-card', onAddCard);
      window.removeEventListener('vq:toggle-side-panel', onToggleSidePanel);
      window.removeEventListener('vq:open-side-panel', onToggleSidePanel);
      window.removeEventListener('vq:start-fresh', onStartFresh);
      window.removeEventListener('vq:open-quick-actions', onQuickActions);
    };
  }, [panelDesign, railPrefs.collapsed]);

  /* ── the draft, as a card object ─────────────────────────────────────── */
  const draftCard = useMemo(() => {
    const base = {
      id: editingCardId || 'preview-card',
      tone: draftTone,
      accent: draftTone === 'accent',
      glare: draftGlare,
      starBorder: draftStarBorder,
      showOpenArrow: draftOpenArrow,
      cat: draftCat, w: draftW, h: draftH,
    };
    if (categoryFolderIndex === 0 && selectedReading) {
      const chartless = draftCat === 'C1' || draftCat === 'C2';
      return {
        ...base,
        key: selectedReading.key,
        chart: chartless ? 'stat' : draftChart,
        variant: chartless ? 'number' : draftVariant,
        period: draftPeriod,
        showPeriodPicker: draftShowPeriodPicker,
        showWhen: draftShowWhen,
        showDelta: draftShowDelta,
        extraKeys: [],
      };
    }
    if (categoryFolderIndex === 1 && selectedTemplate) {
      return { ...base, type: selectedTemplate.type, title: selectedTemplate.title };
    }
    if (categoryFolderIndex === 2) {
      const url = draftLink
        || (customBtnTarget.absolute ? customBtnTarget.path : storePath(customBtnTarget.path));
      return { ...base, type: 'custom_button', cat: 'C1',
               title: customBtnTarget.label,
               targetUrl: url, icon: draftIcon, btnColor: draftColor };
    }
    return null;
  }, [categoryFolderIndex, selectedReading, selectedTemplate, customBtnTarget, editingCardId,
      draftCat, draftW, draftH, draftChart, draftVariant, draftTone, draftPeriod,
      draftShowPeriodPicker, draftShowWhen, draftShowDelta, draftOpenArrow,
      draftGlare, draftStarBorder, draftIcon, draftColor, draftLink, storeSlug]);

  /* What the card will be called, and where its arrow goes — both derived. */
  const draftName = useMemo(() => {
    if (isReadingCardIdx(categoryFolderIndex) && selectedReading) return selectedReading.label;
    if (categoryFolderIndex === 1 && selectedTemplate) return selectedTemplate.title;
    if (categoryFolderIndex === 2) return customBtnTarget.label;
    return '—';
  }, [categoryFolderIndex, selectedReading, selectedTemplate, customBtnTarget]);

  const draftDest = useMemo(() => {
    if (categoryFolderIndex === 2)
      return draftLink || (customBtnTarget.absolute ? customBtnTarget.path : storePath(customBtnTarget.path));
    const e = engine();
    if (!e || !draftCard) return '/pos';
    if (draftCard.targetUrl || draftCard.link) return draftCard.targetUrl || draftCard.link;
    try { return e.deepLinkFor(draftCard.key); } catch { return '/pos'; }
  }, [categoryFolderIndex, draftCard, draftLink, customBtnTarget, storeSlug, engineReady]);

  const destLabel = useMemo(() => {
    const e = engine();
    try { return e?.destinationName?.(draftDest) || draftDest; } catch { return draftDest; }
  }, [draftDest, engineReady]);

  /* ── which categories and sizes this draft may take ──────────────────── */
  const legalCats = useMemo(() => {
    const e = engine();
    if (!e || !draftCard) return ['C3'];
    try { return e.catsFor(draftCard); } catch { return ['C3']; }
  }, [draftCard, engineReady]);

  const catMax = engine()?.getCatMax?.() || CAT_MAX_FALLBACK;
  const catNames = engine()?.getCatNames?.() || {};
  const catDescs = engine()?.getCatDescs?.() || {};

  const draftFloor = useMemo(() => {
    const e = engine();
    if (!e || !draftCard) return [1, 1];
    try { return e.minSizeFor({ ...draftCard, cat: draftCat }); } catch { return [1, 1]; }
  }, [draftCard, draftCat, engineReady]);

  const sizePresets = useMemo(() => {
    const e = engine();
    if (!e || !draftCard) return [];
    const T = e.fitsTable(draftCard);
    const [fw, fh] = draftFloor;
    return e.presetsFor(draftCat, T)
      .filter(s => s.w >= fw && s.h >= fh)
      .sort((a, b) => (a.w * a.h) - (b.w * b.h));
  }, [draftCat, draftCard, draftFloor, engineReady]);

  /* the resolved geometry of the draft, on the live grid */
  const draftGeo = useMemo(() => {
    const e = engine();
    if (!e || !draftCard) return { w: draftW, h: draftH, fit: 0, cat: draftCat, clamped: false };
    try { return e.geometryOf(draftCard, 24, e.REFERENCE_COL_W || 112); }
    catch { return { w: draftW, h: draftH, fit: 0, cat: draftCat, clamped: false }; }
  }, [draftCard, engineReady]);

  /* the name of the interior this size resolves to — the Law's own word for it */
  const resolvedFitName = useMemo(() => {
    const e = engine();
    if (!e || !draftCard) return '—';
    try {
      const T = e.fitsTable(draftCard);
      const i = e.resolveFit(draftCat, draftW, draftH, T);
      return (T[draftCat] && T[draftCat][i] && T[draftCat][i][2]) || '—';
    } catch { return '—'; }
  }, [draftCard, draftCat, draftW, draftH, engineReady]);

  const boardColCount = useMemo(() => {
    const e = engine();
    return e?.boardCols ? e.boardCols() : (vw < 600 ? 4 : vw < 1024 ? 6 : vw < 1440 ? 8 : vw < 1800 ? 10 : vw < 2400 ? 12 : 16);
  }, [vw, engineReady]);

  /* step a dimension, staying inside the law */
  const stepSize = (axis, delta) => {
    const e = engine(); if (!e || !draftCard) return;
    const T = e.fitsTable(draftCard);
    const [MW, MH] = catMax[draftCat] || [12, 16];
    const [fw, fh] = draftFloor;
    let w = draftW, h = draftH;
    if (axis === 'w') w += delta; else h += delta;
    w = Math.max(1, Math.min(MW, w));
    h = Math.max(1, Math.min(MH, h));
    if (w < fw || h < fh) return;
    if (!e.sizeLegal(draftCat, w, h, T)) {
      if (axis === 'w') {
        const need = e.minHeightAt(draftCat, w, T);
        if (need == null || need > MH) return;
        h = Math.max(h, need);
      } else {
        const need = e.minWidthAt(draftCat, h, T);
        if (need == null || need > MW) return;
        w = Math.max(w, need);
      }
    }
    setDraftW(w); setDraftH(h);
  };
  const canStep = (axis, delta) => {
    const e = engine(); if (!e || !draftCard) return false;
    const T = e.fitsTable(draftCard);
    const [MW, MH] = catMax[draftCat] || [12, 16];
    const [fw, fh] = draftFloor;
    let w = draftW, h = draftH;
    if (axis === 'w') w += delta; else h += delta;
    if (w < Math.max(1, fw) || h < Math.max(1, fh) || w > MW || h > MH) return false;
    if (e.sizeLegal(draftCat, w, h, T)) return true;
    if (axis === 'w') { const n = e.minHeightAt(draftCat, w, T); return n != null && n <= MH; }
    const n = e.minWidthAt(draftCat, h, T); return n != null && n <= MW;
  };

  /* changing category re-seats the size on that category's richest legal fit */
  const chooseCat = (cat) => {
    const e = engine(); if (!e) { setDraftCat(cat); return; }
    setDraftCat(cat);
    /* A tile and a strip draw no chart, so a stat there is the plain number.
       Moving up to a category that HAS a body gives the sparkline back rather
       than leaving the card looking emptier than the one it grew out of. */
    let variant = draftVariant;
    if (isReadingCard && draftChart === 'stat') {
      if ((cat === 'C1' || cat === 'C2') && variant !== 'number') variant = 'number';
      if (cat !== 'C1' && cat !== 'C2' && variant === 'number') variant = 'spark';
      setDraftVariant(variant);
    }
    const probe = { ...draftCard, cat, variant };
    let T, floor;
    try { T = e.fitsTable(probe); floor = e.minSizeFor(probe); } catch { T = null; floor = [1, 1]; }
    const list = e.presetsFor(cat, T).filter(s => s.w >= floor[0] && s.h >= floor[1]);
    const keep = list.find(s => s.w === draftW && s.h === draftH);
    const pick = keep || list.find(s => s.isFit) || list[0];
    if (pick) { setDraftW(pick.w); setDraftH(pick.h); }
  };

  const chooseSize = (s) => { setDraftCat(s.cat); setDraftW(s.w); setDraftH(s.h); };

  /* ── live preview ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!stepperModalOpen || step !== 2) return;
    const e = engine();
    const host = previewRef.current, frame = previewFrameRef.current;
    if (!e || !host || !frame || !draftCard) return;

    /* Draw the card at true board geometry, then scale the whole thing to fit
       the stage. Scaling — rather than squeezing the card into whatever space
       is left — is what makes 12×16 actually look like four times 6×8 instead
       of landing on the same clamped rectangle. */
    const COLW = e.REFERENCE_COL_W || 112, UNIT = 64, GUT = 24;   /* the Law's own numbers */
    const geo = e.geometryOf(draftCard, 24, COLW);
    const cardW = geo.w * COLW + (geo.w - 1) * GUT;
    const cardH = geo.h * UNIT + (geo.h - 1) * GUT;

    const avail = frame.getBoundingClientRect();
    const padded = { w: Math.max(160, avail.width - 32), h: Math.max(140, avail.height - 32) };
    const scale = previewZoom === 'actual'
      ? 1
      : Math.min(1, padded.w / cardW, padded.h / cardH);

    /* Two boxes, because a transform does not change layout. The outer one is
       the SCALED size, so the frame centres and scrolls around what is actually
       painted; the inner one is the TRUE size, scaled from its top-left corner.
       Scaling rather than squeezing is what makes 12×16 look four times 6×8
       instead of landing on the same clamped rectangle. */
    host.style.width = `${Math.round(cardW * scale)}px`;
    host.style.height = `${Math.round(cardH * scale)}px`;

    host.innerHTML = `<div class="vq-preview-scaler"></div>`;
    const scaler = host.firstElementChild;
    scaler.style.width = `${cardW}px`;
    scaler.style.height = `${cardH}px`;
    scaler.style.transform = `scale(${scale})`;
    scaler.style.transformOrigin = 'top left';
    scaler.innerHTML = e.renderCard(draftCard, 24, COLW);

    const cardEl = scaler.querySelector('.vqc');
    if (cardEl) {
      cardEl.style.width = '100%';
      cardEl.style.height = '100%';
      cardEl.style.gridColumn = 'auto';
      cardEl.style.gridRow = 'auto';
      cardEl.style.animation = 'none';
    }
    frame.dataset.size = `${geo.w} × ${geo.h} · ${cardW}×${cardH}px · ${Math.round(scale * 100)}%`;
    setPreviewScale(Math.round(scale * 100));

    /* seat the resize handle on the card's bottom-right corner — it lives
       outside the re-rendered host so a drag survives every re-render */
    const handle = previewHandleRef.current;
    if (handle){
      const seat = () => {
        handle.style.left = (host.offsetLeft + Math.round(cardW * scale) - 8) + 'px';
        handle.style.top  = (host.offsetTop  + Math.round(cardH * scale) - 8) + 'px';
        handle.style.display = 'block';
      };
      seat();
      requestAnimationFrame(seat);
    }

    const raf = requestAnimationFrame(() => {
      const chartHost = scaler.querySelector('.vqc-host');
      if (chartHost) e.mountChart(chartHost, draftCard);
      e.fitValues?.(scaler);
    });
    return () => cancelAnimationFrame(raf);
  }, [stepperModalOpen, step, draftCard, previewZoom, vw, engineReady]);

  /* ── opening the wizard ──────────────────────────────────────────────── */
  const resetDraftChrome = () => {
    setDraftTone('surface'); setDraftGlare(false); setDraftStarBorder(false);
    setDraftLink(''); setPreviewZoom('fit');
    setDraftOpenArrow(true); setDraftShowWhen(true);
    setDraftShowDelta(true); setDraftShowPeriodPicker(true);
  };

  /* One picker, three families as tabs — no launcher in between. */
  const setFamily = (catIndex) => {
    setCategoryFolderIndex(catIndex);
    setStep(1);
    setEditingCardId(null);
    setSelectedReading(null);
    setSelectedTemplate(null);
    setSearchQuery('');
    resetDraftChrome();
    if (catIndex === 2) {
      setDraftCat('C1'); setDraftW(2); setDraftH(1);
      setDraftShowPeriodPicker(false);
    } else if (catIndex === 1) {
      setDraftCat('C4'); setDraftW(4); setDraftH(2);
    } else {
      setDraftCat('C3'); setDraftW(4); setDraftH(3);
      setDraftShowPeriodPicker(true);
    }
  };
  const openPicker = (catIndex = 0) => {
    setFamily(catIndex);
    setStepperModalOpen(true);
  };
  const launchCategoryModal = openPicker;

  const seatDraftOn = (card) => {
    const e = engine(); if (!e) return;
    const T = e.fitsTable(card);
    const cat = card.cat;
    const floor = e.minSizeFor(card);
    const list = e.presetsFor(cat, T).filter(s => s.w >= floor[0] && s.h >= floor[1]);
    const pick = list.find(s => s.isFit) || list[0];
    setDraftCat(cat);
    if (pick) { setDraftW(pick.w); setDraftH(pick.h); }
  };

  const selectMetricForStep2 = (rd) => {
    setSelectedReading(rd);
    setSelectedTemplate(null);
    const byShape = {
      SCALAR:       ['stat',   'spark',    'C2'],
      GAUGE:        ['gauge',  'standard', 'C4'],
      TABLE:        ['table',  'standard', 'C5'],
      FEED:         ['feed',   'live',     'C4'],
      BREAKDOWN:    ['bar',    'grouped',  'C4'],
      RANKING:      ['bar',    'solid',    'C4'],
      STATUS:       ['status', 'standard', 'C2'],
      MULTI_SERIES: ['composed','bar-line-area','C5'],
      SERIES:       ['area',   'gradient', 'C5'],
    };
    let [chart, variant, cat] = byShape[rd.shape] || ['area', 'gradient', 'C5'];
    /* a strip has no chart body, so the sparkline variant would be a lie */
    if (cat === 'C2' || cat === 'C1') variant = 'number';
    setDraftChart(chart);
    setDraftVariant(variant);
    setDraftPeriod('Month');
    resetDraftChrome();
    seatDraftOn({ key: rd.key, chart, variant, extraKeys: [], period: 'Month', cat });
    setStep(2);
  };

  const selectTemplateForStep2 = (tmpl) => {
    setSelectedTemplate(tmpl);
    setSelectedReading(null);
    const specials = engine()?.getSpecials?.() || {};
    const S = specials[tmpl.type] || { cat: 'C4' };
    resetDraftChrome();
    setDraftTone(tmpl.tone || 'surface');
    seatDraftOn({ type: tmpl.type, cat: S.cat });
    setStep(2);
  };

  const selectCustomBtnForStep2 = (target) => {
    setCustomBtnTarget(target);
    setSelectedReading(null);
    setSelectedTemplate(null);
    setDraftCat('C1'); setDraftW(2); setDraftH(1);
    setDraftIcon(target.icon);
    setDraftColor(target.color);
    resetDraftChrome();
    setDraftLink(target.absolute ? target.path : storePath(target.path));
    setStep(2);
  };

  /* ── editing a card already on the board ─────────────────────────────── */
  const openCardEditor = (id) => {
    const e = engine(); if (!e) return;
    const c = (e.getCards() || []).find(x => x.id === id);
    if (!c) return;
    setEditingCardId(id);
    const special = e.isSpecial(c);
    setCategoryFolderIndex(special ? (c.type === 'custom_button' ? 2 : 1) : 0);
    if (special && c.type !== 'custom_button') {
      setSelectedTemplate(OPERATIONAL_TEMPLATES.find(t => t.type === c.type) || OPERATIONAL_TEMPLATES[0]);
      setSelectedReading(null);
    } else if (special) {
      setSelectedTemplate(null); setSelectedReading(null);
      setDraftIcon(c.icon || 'cart'); setDraftColor(c.btnColor || '#0baa8f');
    } else {
      setSelectedReading(e.getReadingOf(c.key));
      setSelectedTemplate(null);
      setDraftChart(c.chart); setDraftVariant(c.variant);
      setDraftPeriod(c.period || 'Month');
      setDraftShowPeriodPicker(c.showPeriodPicker !== false);
      setDraftShowWhen(c.showWhen !== false);
      setDraftShowDelta(c.showDelta !== false);
    }
    const g = e.geometryOf(c, 24);
    setDraftCat(g.cat); setDraftW(g.authoredW ?? g.w); setDraftH(g.authoredH ?? g.h);
    setDraftTone(c.tone || (c.accent ? 'accent' : 'surface'));
    setDraftGlare(!!c.glare); setDraftStarBorder(!!c.starBorder);
    setDraftOpenArrow(c.showOpenArrow !== false);
    setDraftLink(c.targetUrl || c.link || '');
    setPreviewZoom('fit');
    setStep(2);
    setStepperModalOpen(true);
  };

  useEffect(() => {
    window._vqEditCard = openCardEditor;
    return () => { window._vqEditCard = null; };
  });

  /* ── chart + variant selection ───────────────────────────────────────── */
  const handleChartSelect = (chartType) => {
    const e = engine();
    setDraftChart(chartType);
    const variants = e?.getVariants?.() || {};
    const first = (variants[chartType] || [['standard']])[0][0];
    setDraftVariant(first);
    if (!e || !selectedReading) return;
    const probe = { key: selectedReading.key, chart: chartType, variant: first,
                    extraKeys: [], period: draftPeriod, cat: draftCat };
    const cats = e.catsFor(probe);
    const cat = cats.includes(draftCat) ? draftCat : (cats[0] || 'C5');
    const T = e.fitsTable(probe);
    const floor = e.minSizeFor({ ...probe, cat });
    const list = e.presetsFor(cat, T).filter(s => s.w >= floor[0] && s.h >= floor[1]);
    setDraftCat(cat);
    const keep = list.find(s => s.w === draftW && s.h === draftH);
    const pick = keep || list.find(s => s.isFit) || list[0];
    if (pick) { setDraftW(pick.w); setDraftH(pick.h); }
  };

  /* ── commit ──────────────────────────────────────────────────────────── */
  const handleAddCardConfirm = () => {
    const e = engine(); if (!e || !draftCard) return;
    const card = { ...draftCard };
    if (editingCardId) {
      delete card.id;
      e.updateCard(editingCardId, card);
    } else {
      card.id = 'c-' + Math.random().toString(36).substring(2, 9);
      e.addCardObject(card);
    }
    setStepperModalOpen(false);
    setEditingCardId(null);
    setStep(1);
  };

  const handleResetLayout = () => { setPresetModalOpen(true); setMenuOpen(false); };

  /* ── catalogue ───────────────────────────────────────────────────────── */
  const readings = engineReady
    ? ((engine()?.getAvailableReadings?.() ?? engine()?.getReadings?.()) || [])
    : (Array.isArray(readingsProp) && readingsProp.length > 0 ? readingsProp : ((typeof window !== 'undefined' && window.__VENQORE_READINGS__) || []));
  const visibleTemplates = engineReady
    ? OPERATIONAL_TEMPLATES.filter(t => engine()?.specialAvailable?.(t.type) !== false)
    : OPERATIONAL_TEMPLATES;

  const availableAreas = useMemo(
    () => ['All', ...Array.from(new Set(readings.map(r => r?.area).filter(Boolean)))],
    [readings]);

  const filteredReadings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return readings.filter(r =>
      r && (selectedArea === 'All' || r.area === selectedArea) &&
      (!q || (r.label && r.label.toLowerCase().includes(q)) || (r.module && r.module.toLowerCase().includes(q)) || (r.key && r.key.toLowerCase().includes(q))));
  }, [readings, selectedArea, searchQuery]);

  const groupedSections = useMemo(() => {
    const groups = {};
    filteredReadings.forEach(r => { (groups[r?.area || 'General'] ||= []).push(r); });
    return groups;
  }, [filteredReadings]);

  const legalMap = engine()?.getLegalCharts?.() || {};
  const legalCharts = (selectedReading ? legalMap[selectedReading?.shape] : null)
    || ['area', 'bar', 'line', 'stat', 'gauge', 'funnel', 'table', 'feed', 'heatmap'];
  const chartNames = engine()?.getChartNames?.() || {};

  const currentVariants = useMemo(() => {
    const e = engine();
    if (!e || !selectedReading) return [['standard', 'Standard', true, '']];
    try {
      return e.getVariantsFor({ key: selectedReading.key, chart: draftChart,
                                variant: draftVariant, extraKeys: [], period: draftPeriod });
    } catch { return (e.getVariants?.()[draftChart] || [['standard', 'Standard']]).map(v => [v[0], v[1], true, '']); }
  }, [selectedReading, draftChart, draftVariant, draftPeriod, engineReady]);

  const isReadingCard = categoryFolderIndex === 0;
  const isHubCard = categoryFolderIndex === 1;
  const isShortcutCard = categoryFolderIndex === 2;
  const hasDraft = !!draftCard;
  const chartlessCat = draftCat === 'C1' || draftCat === 'C2';

  const familyLabel = isReadingCard ? 'METRIC & CHART'
    : isHubCard ? 'SMART PANEL' : 'SHORTCUT';

  /* ── the simple size system ──────────────────────────────────────────────
     Users never see categories, fits, columns or pixel floors. They see a
     handful of named sizes — and the preview's corner, which drags through
     every size the rules allow. The engine's legality tables still decide
     everything; this is only a friendlier way to ask. */
  const SIZE_LABELS = { C1:'Tiny', C2:'One-line', C3:'Compact', C4:'Standard', C5:'Large', C6:'Extra large' };
  const SIZE_HINTS  = {
    C1:'Just the number', C2:'Name and number on one line', C3:'Number with its trend',
    C4:'Room for a small chart or list', C5:'A full chart', C6:'The biggest card there is',
  };

  const statFamily = isReadingCard && draftChart === 'stat';
  const variantForCat = (cat) => {
    if (!statFamily) return draftVariant;
    if (cat === 'C1' || cat === 'C2') return 'number';
    return draftVariant === 'number' ? 'spark' : draftVariant;
  };

  const sizeChips = useMemo(() => {
    const e = engine();
    if (!e || !draftCard) return [];
    if (isShortcutCard){
      return [
        { cat:'C1', w:1, h:1, label:'Icon only', hint:'Glyph only — the name shows on hover' },
        { cat:'C1', w:2, h:1, label:'Standard', hint:'Icon and name' },
        { cat:'C1', w:3, h:2, label:'Roomy', hint:'Icon, name and where it goes' },
      ];
    }
    const probeBase = { ...draftCard, variant: statFamily ? 'number' : draftVariant };
    let cats = [];
    try { cats = e.catsFor(probeBase); } catch { cats = ['C3']; }
    const chips = [];
    cats.forEach(cat => {
      if (isReadingCard && cat === 'C1') return;      /* tiles belong to shortcuts */
      const variant = variantForCat(cat);
      const probe = { ...draftCard, cat, variant };
      let pick = null;
      try {
        const T = e.fitsTable(probe);
        const floor = e.minSizeFor(probe);
        const list = e.presetsFor(cat, T).filter(s => s.w >= floor[0] && s.h >= floor[1]);
        pick = list.find(s => s.isFit) || list[0];
      } catch { pick = null; }
      if (pick) chips.push({ cat, w: pick.w, h: pick.h, variant,
                             label: SIZE_LABELS[cat] || cat, hint: SIZE_HINTS[cat] || '' });
    });
    return chips;
  }, [draftCard, isShortcutCard, isReadingCard, statFamily, draftChart, draftVariant, engineReady]);

  const pickChip = (chip) => {
    setDraftCat(chip.cat);
    if (chip.variant && chip.variant !== draftVariant) setDraftVariant(chip.variant);
    setDraftW(chip.w); setDraftH(chip.h);
  };

  /* Drag the preview's corner: candidate rectangle → the richest interior the
     rules will give it. Falls back to the nearest legal size in the current
     interior, exactly like the board's own resize. */
  const applyDragSize = (wRaw, hRaw) => {
    const e = engine(); if (!e || !draftCard) return;
    const catMaxTbl = e.getCatMax?.() || CAT_MAX_FALLBACK;
    const w = Math.max(1, Math.min(12, wRaw)), h = Math.max(1, Math.min(16, hRaw));
    let cats = [];
    try { cats = isShortcutCard ? ['C1'] : e.catsFor({ ...draftCard, variant: statFamily ? 'number' : draftVariant }); }
    catch { cats = [draftCat]; }
    if (isReadingCard) cats = cats.filter(c => c !== 'C1');
    for (let i = cats.length - 1; i >= 0; i--){
      const cat = cats[i];
      const variant = variantForCat(cat);
      const probe = { ...draftCard, cat, variant };
      try {
        const [MW, MH] = catMaxTbl[cat] || [12, 16];
        if (w > MW || h > MH) continue;
        const [fw, fh] = e.minSizeFor(probe);
        if (w < fw || h < fh) continue;
        if (!e.sizeLegal(cat, w, h, e.fitsTable(probe))) continue;
        setDraftCat(cat);
        if (variant !== draftVariant) setDraftVariant(variant);
        setDraftW(w); setDraftH(h);
        return;
      } catch { /* try the next interior */ }
    }
    /* nothing takes the exact rectangle — snap inside the current interior */
    try {
      const probe = { ...draftCard, cat: draftCat };
      const T = e.fitsTable(probe);
      const [MW, MH] = catMaxTbl[draftCat] || [12, 16];
      const [fw, fh] = e.minSizeFor(probe);
      let w2 = Math.max(fw, Math.min(MW, w)), h2 = Math.max(fh, Math.min(MH, h));
      if (!e.sizeLegal(draftCat, w2, h2, T)){
        const needH = e.minHeightAt(draftCat, w2, T);
        if (needH != null && needH <= MH) h2 = Math.max(h2, needH);
        else {
          const needW = e.minWidthAt(draftCat, h2, T);
          if (needW != null && needW <= MW) w2 = Math.max(w2, needW);
          else return;
        }
      }
      setDraftW(w2); setDraftH(h2);
    } catch { /* keep the current size */ }
  };
  const applyDragSizeRef = useRef(applyDragSize);
  applyDragSizeRef.current = applyDragSize;

  /* the drag itself — the handle lives outside the re-rendered preview */
  const dragState = useRef(null);
  const dragScaleRef = useRef(1);
  dragScaleRef.current = Math.max(0.05, previewScale / 100);
  const onHandleDown = (ev) => {
    ev.preventDefault(); ev.stopPropagation();
    dragState.current = { x: ev.clientX, y: ev.clientY, w: draftW, h: draftH, scale: dragScaleRef.current };
    document.body.classList.add('is-reordering');
    const move = (e2) => {
      const st = dragState.current; if (!st) return;
      const dw = Math.round(((e2.clientX - st.x) / st.scale) / (112 + 24));
      const dh = Math.round(((e2.clientY - st.y) / st.scale) / (64 + 24));
      applyDragSizeRef.current(st.w + dw, st.h + dh);
    };
    const up = () => {
      dragState.current = null;
      document.body.classList.remove('is-reordering');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      /* a drag that ends over the overlay must not read as a click on it —
         that click is what used to close the whole modal mid-resize */
      const squelch = (ce) => { ce.stopPropagation(); ce.preventDefault(); };
      window.addEventListener('click', squelch, { capture: true, once: true });
      setTimeout(() => window.removeEventListener('click', squelch, { capture: true }), 250);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  // The Quick Actions launcher — 9 high-frequency operational fast-lane actions
  const glassActionItems = [
    {
      label: 'Money In',
      color: 'teal',
      href: storePath('/funds?action=add'),
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="7" y1="7" x2="17" y2="17"/>
          <polyline points="17 7 17 17 7 17"/>
        </svg>
      ),
    },
    {
      label: 'Money Out',
      color: 'coral',
      href: storePath('/funds?action=remove'),
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="7" y1="17" x2="17" y2="7"/>
          <polyline points="7 7 17 7 17 17"/>
        </svg>
      ),
    },
    {
      label: 'Transfer Money',
      color: 'blue',
      href: storePath('/funds?action=transfer'),
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m16 3 4 4-4 4"/>
          <path d="M20 7H4"/>
          <path d="m8 21-4-4 4-4"/>
          <path d="M4 17h16"/>
        </svg>
      ),
    },
    {
      label: 'Add Product',
      color: 'orange',
      href: storePath('/inventory?action=add'),
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m7.5 4.27 9 5.15"/>
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
          <path d="m3.3 7 8.7 5 8.7-5"/>
          <path d="M12 22V12"/>
        </svg>
      ),
    },
    {
      label: 'Add Expense',
      color: 'red',
      href: storePath('/expenses?action=add'),
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="2" x2="12" y2="22"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
    },
    {
      label: 'Add User',
      color: 'purple',
      href: storePath('/admin/users'),
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <line x1="19" y1="8" x2="19" y2="14"/>
          <line x1="22" y1="11" x2="16" y2="11"/>
        </svg>
      ),
    },
    {
      label: 'Refund',
      color: 'indigo',
      href: storePath('/returns/create'),
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </svg>
      ),
    },
    {
      label: 'New Quote',
      color: 'sky',
      href: storePath('/sales/pre-sales/create'),
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      ),
    },
    {
      label: 'New Recurring Invoice',
      color: 'lime',
      href: storePath('/recurring-invoices/create'),
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m17 2 4 4-4 4"/>
          <path d="M3 11v-1a4 4 0 0 1 4-4h14"/>
          <path d="m7 22-4-4 4-4"/>
          <path d="M21 13v1a4 4 0 0 1-4 4H3"/>
        </svg>
      ),
    },
    {
      label: 'Charity Donation',
      color: 'rose',
      action: () => {
        if (window._vqDonateCharity) {
          window._vqDonateCharity(10);
        }
      },
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
        </svg>
      ),
    },
  ];

  /* The REAL sidebar: derived from the shared `nav` prop the same way
     QoreShell derives it, so this shell and the module switches can never
     disagree. The hardcoded groups below survive only as the fallback for
     the store-less route and the dev harness. */
  const sharedNav = Array.isArray(props?.nav) ? props.nav : [];
  const liveNavGroups = useMemo(() => {
    if (!sharedNav.length) return null;
    const safeHref = (name) => {
      try {
        if (typeof window !== 'undefined' && typeof window.route === 'function') {
          const has = window.route().has ? window.route().has(name) : true;
          if (has === false) return null;
          return window.route(name);
        }
      } catch { /* fall through */ }
      return null;
    };
    const byGroup = new Map();
    for (const item of sharedNav) {
      const href = safeHref(item.route);
      if (!href) continue;
      if (!byGroup.has(item.group)) byGroup.set(item.group, []);
      byGroup.get(item.group).push({ label: item.label, href, lucide: item.icon });
    }
    const groups = NAV_GROUP_ORDER
      .filter(g => byGroup.has(g))
      .map(g => ({ title: NAV_GROUP_LABELS[g] || g, items: byGroup.get(g) }));
    if (!groups.length) return null;
    const main = [
      { label: 'Dashboard', href: storePath('/new-dashboard'), active: true, badge: 'Live',
        d: <><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></> },
    ];
    /* POS is the one destination a counter business lives in — pinned. */
    if (sharedNav.some(i => i.key === 'pos')) main.push({
      label: 'Point of Sale', href: '/pos',
      d: <><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></> });
    return [
      { title: 'Main', items: main, pinned: true },
      ...groups,
      { title: 'System', items: [
        { label: 'Settings', href: storePath('/settings'),
          d: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6V4.5a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.5.6.87 1.15 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></> },
      ], pinned: true },
    ];
  }, [sharedNav, storeSlug]);

  /* nav groups collapse — remembered per browser, Main and System never fold */
  const NAVFOLD_KEY = 'vq-dashboard-v6-navfold';
  const [navFold, setNavFold] = useState(() => {
    try { return JSON.parse(localStorage.getItem(NAVFOLD_KEY) || '{}') || {}; } catch { return {}; }
  });
  const toggleFold = (title) => {
    const next = { ...navFold, [title]: !navFold[title] };
    setNavFold(next);
    try { localStorage.setItem(NAVFOLD_KEY, JSON.stringify(next)); } catch {}
  };

  const navGroups = [
    { title: 'Main', items: [
      { label: 'Dashboard v6',      href: '/new-dashboard', active: true, badge: 'Live',
        d: <><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></> },
      { label: 'Point of Sale',     href: '/pos',
        d: <><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></> },
    ]},
    { title: 'Operations', items: [
      { label: 'Inventory & Stock', href: storePath('/inventory'),
        d: <><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></> },
      { label: 'Sales & Invoices',  href: storePath('/sales'),
        d: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></> },
      { label: 'Purchasing',        href: storePath('/purchase-orders'),
        d: <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></> },
    ]},
    { title: 'Financials', items: [
      { label: 'Finance & Accounts', href: storePath('/finance'),
        d: <><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></> },
      { label: 'Reports & Intel',    href: storePath('/reports'),
        d: <><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></> },
      { label: 'Parties & CRM',      href: storePath('/parties'),
        d: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></> },
    ]},
    { title: 'System', items: [
      { label: 'Settings', href: storePath('/settings'),
        d: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6V4.5a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.5.6.87 1.15 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></> },
    ]},
  ];

  /* ── the shared styling panel — every family gets all of it ──────────── */
  /* `hint` states what the geometry will do regardless of the switch. It is
     amber only when it CONTRADICTS the switch — otherwise it is just a note. */
  const SwitchRow = ({ on, set, title, sub, hint, warn }) => (
    <button type="button" className="vq-v6-switch-wrapper" role="switch" aria-checked={on}
            onClick={() => set(v => !v)}>
      <span className="vq-v6-switch-label">
        <span className="vq-v6-switch-title">{title}</span>
        <span className="vq-v6-switch-sub">{sub}</span>
        {hint && <span className={`vq-v6-switch-hint ${warn ? 'is-warn' : ''}`}>{hint}</span>}
      </span>
      <span className={`vq-v6-switch-track ${on ? 'is-on' : ''}`}>
        <span className="vq-v6-switch-knob" />
      </span>
    </button>
  );

  const StylePanel = (
    <>
      {/* What this card is — stated, not typed. A card is named by what it
          shows, so two boards of the same data read the same way. */}
      <div className="vq-identity">
        <span className="vq-identity-eyebrow">{familyLabel}</span>
        <span className="vq-identity-name">{draftName}</span>
        <span className="vq-identity-meta">
          {isReadingCard && selectedReading?.desc ? <>{selectedReading.desc} </> : null}
          <span className="vq-identity-opens">Opens {destLabel}.</span>
        </span>
      </div>

      {/* ── Size: a few named sizes; the preview's corner does the rest ── */}
      <div className="vq-form-group">
        <label className="vq-form-label">
          <span>Size</span>
          <span className="vq-form-sublabel">or drag the corner of the preview</span>
        </label>

        <div className="vq-size-grid">
          {sizeChips.map(s => (
            <button key={`${s.cat}-${s.w}x${s.h}`} type="button"
              className={`vq-size-card ${draftCat === s.cat && draftW === s.w && draftH === s.h ? 'is-active' : ''}`}
              onClick={() => pickChip(s)}>
              <SizeGlyph w={s.w} h={s.h} max={[12, 8]} />
              <span className="vq-size-card-text">
                <span className="vq-size-card-title">{s.label}</span>
                <span className="vq-size-card-desc">{s.hint}</span>
              </span>
            </button>
          ))}
        </div>

        {draftW > boardColCount && (
          <p className="vq-form-note is-warn">
            Wider than this screen — here it fills the row, and spreads out fully on a bigger display.
          </p>
        )}
      </div>

      {/* ── Reading-only: chart type and variant ── */}
      {isReadingCard && !chartlessCat && (
        <>
          <div className="vq-form-group">
            <label className="vq-form-label">
              <span>Chart type</span>
              <span className="vq-form-sublabel">The size adjusts to fit</span>
            </label>
            <div className="vq-select-btn-group">
              {legalCharts.map(ch => (
                <button key={ch} type="button"
                  className={`vq-choice-btn ${draftChart === ch ? 'is-active' : ''}`}
                  onClick={() => handleChartSelect(ch)}>
                  {chartNames[ch] || ch}
                </button>
              ))}
            </div>
          </div>

          <div className="vq-form-group">
            <label className="vq-form-label">
              <span>Style</span>
              <span className="vq-form-sublabel">{chartNames[draftChart] || draftChart}</span>
            </label>
            <div className="vq-select-btn-group">
              {currentVariants.map(([v, n, ok, why]) => (
                <button key={v} type="button" disabled={ok === false} title={ok === false ? why : undefined}
                  className={`vq-choice-btn ${draftVariant === v ? 'is-active' : ''} ${ok === false ? 'is-off' : ''}`}
                  onClick={() => ok !== false && setDraftVariant(v)}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {isReadingCard && chartlessCat && (
        <p className="vq-form-note">
          This size shows the name and the number, nothing else — pick a bigger size to add a chart.
        </p>
      )}

      {/* ── Shortcut-only: where it goes, and how it looks ── */}
      {isShortcutCard && (
        <>
          <div className="vq-form-group">
            <label className="vq-form-label">
              <span>Where it goes</span>
              <span className="vq-form-sublabel">The tile is named after its destination</span>
            </label>
            <div className="vq-dest-grid">
              {SHORTCUT_TARGETS.map(t => {
                const url = t.absolute ? t.path : storePath(t.path);
                const on = draftLink === url;
                return (
                  <button key={t.path} type="button"
                    className={`vq-dest-tile ${on ? 'is-active' : ''}`}
                    onClick={() => {
                      setCustomBtnTarget(t); setDraftLink(url);
                      setDraftIcon(t.icon); setDraftColor(t.color);
                    }}>
                    <span className="vq-dest-glyph" style={{ background: t.color }}
                          dangerouslySetInnerHTML={{ __html: engine()?.iconMarkup?.(t.icon, 16) || '' }} />
                    <span className="vq-dest-name">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="vq-form-group">
            <label className="vq-form-label">
              <span>Glyph</span>
              <span className="vq-form-sublabel">Defaults to the destination's own</span>
            </label>
            <div className="vq-icon-grid">
              {SHORTCUT_ICON_NAMES.map(n => (
                <button key={n} type="button" aria-label={n}
                  className={`vq-icon-swatch ${draftIcon === n ? 'is-active' : ''}`}
                  onClick={() => setDraftIcon(n)}
                  dangerouslySetInnerHTML={{ __html: engine()?.iconMarkup?.(n, 18) || '' }} />
              ))}
            </div>
          </div>

          <div className="vq-form-group">
            <label className="vq-form-label">Glyph colour</label>
            <div className="vq-color-grid">
              {SHORTCUT_COLORS.map(col => (
                <button key={col} type="button" aria-label={col}
                  className={`vq-color-swatch ${draftColor === col ? 'is-active' : ''}`}
                  style={{ background: col }} onClick={() => setDraftColor(col)} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Tone: all four, all families ── */}
      <div className="vq-form-group">
        <label className="vq-form-label">
          <span>Card background</span>
          <span className="vq-form-sublabel">Readable on every page background</span>
        </label>
        <div className="vq-tone-grid">
          {CARD_TONES.map(t => (
            <button key={t.id} type="button"
              className={`vq-tone-card ${draftTone === t.id ? 'is-active' : ''}`}
              onClick={() => setDraftTone(t.id)}>
              <span className="vq-tone-swatch" style={{ background: t.swatchBg }} />
              <span className="vq-tone-info">
                <span className="vq-tone-name">{t.name}</span>
                <span className="vq-tone-desc">{t.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Reading-only: which window the number covers ── */}
      {isReadingCard && (
        <div className="vq-form-group">
          <label className="vq-form-label">
            <span>Default timeframe</span>
            <span className="vq-form-sublabel">What the card reads when it loads</span>
          </label>
          <div className="vq-select-btn-group">
            {PERIOD_LABELS.map(p => (
              <button key={p} type="button"
                className={`vq-choice-btn ${draftPeriod === p ? 'is-active' : ''}`}
                onClick={() => setDraftPeriod(p)}>{p}</button>
            ))}
          </div>
        </div>
      )}

      {/* ── What the card face carries ── */}
      <div className="vq-form-group">
        <label className="vq-form-label">
          <span>On the card face</span>
          <span className="vq-form-sublabel">Each is hidden automatically when the card is too small</span>
        </label>
        <div className="vq-switch-stack">
          <SwitchRow on={draftOpenArrow} set={setDraftOpenArrow}
            title="Open arrow"
            sub={`Jumps to ${destLabel}`}
            hint="Appears on hover, in the card's top-right corner" />
          {isReadingCard && (
            <SwitchRow on={draftShowDelta} set={setDraftShowDelta}
              title="Change pill"
              sub="The ↗ 18.7% chip beside the number"
              hint={draftW < 2 ? 'Needs 2 columns — hidden at this width' : null} warn />
          )}
          {isReadingCard && (
            <SwitchRow on={draftShowWhen} set={setDraftShowWhen}
              title="Timeframe caption"
              sub="The “Month · Jul 30 – Aug 28” line under the number"
              hint={draftH < 4 ? 'Needs 4 rows — hidden at this height' : null} warn />
          )}
          {isReadingCard && !chartlessCat && (
            <SwitchRow on={draftShowPeriodPicker} set={setDraftShowPeriodPicker}
              title="Timeframe picker"
              sub="Readers can change the window without editing"
              hint={draftW < 3 ? 'Needs 3 columns — hidden at this width' : null} warn />
          )}
          <SwitchRow on={draftStarBorder} set={setDraftStarBorder}
            title="Animated star border"
            sub="Marks a card as high priority" />
          <SwitchRow on={draftGlare} set={setDraftGlare}
            title="Glare reflex"
            sub="Light sweeps the card on hover" />
        </div>
      </div>
    </>
  );

  return (
    <OneGlanceLayout activeMenu="Dashboard" noPadding={true}>
      <Head title="Command Center — New Dashboard" />

      <div ref={containerRef}
           className={`vq-shell ${isEditMode ? 'is-editing' : ''} vq-nav-embedded`}
           id="vq-app-shell">
        <div className="vq-main-stage">

        {isEditMode && (
          <div className="vq-edit-banner">
            <span className="vq-edit-banner-text">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
              Drag any card to place it anywhere on the grid · drag the bottom-right corner to resize · the pencil opens the full editor.
            </span>
            <button type="button" className="vq-edit-banner-btn" onClick={() => setIsEditMode(false)}>Done</button>
          </div>
        )}

        <main className="vq-scroll-region">
          <div className="vq-canvas">
            <div className={`vq-canvas-body ${railsOn ? 'has-rails' : ''}`}>
              <div className="vq-board-zone">
                <div className="vq-grid" id="board" />
              </div>

              {railsOn && (
                <aside className={`vq-rails ${railPrefs.sticky ? 'is-sticky' : ''}`}
                       style={{ '--vq-rails-w': `${railPrefs.width || 340}px` }}
                       aria-label="Side panel">
                  <div className="vq-rails-shell">
                    <div className="vq-rails-scroll">
                      {activeRails.map(id => <DashRail key={id} id={id} storePath={storePath}
                                                       enabledModules={enabledModules}
                                                       props={props}
                                                       onQuickActions={() => setGlassModalOpen(true)} />)}
                    </div>
                  </div>
                </aside>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ── Choose a starting layout ────────────────────────────────────── */}
      {presetModalOpen && (
        <div className="vq-modal-overlay" onClick={() => setPresetModalOpen(false)} role="dialog" aria-modal="true">
          <div className="vq-modal-card vq-preset-modal" onClick={e => e.stopPropagation()}>
            <div className="vq-modal-top-bar">
              <div>
                <div className="vq-modal-step-sub">STARTING LAYOUTS</div>
                <div className="vq-modal-heading">Start fresh</div>
              </div>
              <button type="button" className="vq-modal-close-x" onClick={() => setPresetModalOpen(false)} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="vq-preset-note">
              Pick a starting point — it replaces what's on the board now, and you can
              add, resize and remove anything afterwards.
            </div>
            <div className="vq-preset-grid">
              {Object.entries(engine()?.getPresets?.() || {}).map(([id, p]) => {
                const railNames = (p.rails || [])
                  .map(rid => RAIL_DEFS.find(d => d.id === rid)?.name)
                  .filter(Boolean);
                return (
                  <button key={id} type="button" className="vq-item-card vq-preset-card"
                          onClick={() => choosePreset(id)}>
                    <span className="vq-preset-row">
                      <PresetThumb cards={p.cards} />
                      <span className="vq-preset-text">
                        <span className="vq-item-card-top">
                          <span className="vq-item-card-title">{p.name}</span>
                          <svg className="vq-item-card-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                        </span>
                        <span className="vq-item-card-desc">{p.desc}</span>
                        {railNames.length > 0 && (
                          <span className="vq-preset-rails">Side panel: {railNames.join(' · ')}</span>
                        )}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── The wizard ──────────────────────────────────────────────────── */}
      {stepperModalOpen && (
        <div className="vq-modal-overlay" onClick={() => setStepperModalOpen(false)} role="dialog" aria-modal="true">
          <div className="vq-modal-card" onClick={e => e.stopPropagation()}>
            <div className="vq-modal-top-bar">
              <div>
                <div className="vq-modal-step-sub">
                  {editingCardId ? familyLabel : step === 1 ? 'ADD A CARD' : familyLabel}
                </div>
                <div className="vq-modal-heading">
                  {step === 1 ? 'Add to your dashboard' : editingCardId ? 'Edit this card' : 'Make it yours'}
                </div>
              </div>
              <button type="button" className="vq-modal-close-x" onClick={() => setStepperModalOpen(false)} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            {!editingCardId && step === 1 && (
              <div className="vq-family-tabs" role="tablist" aria-label="What kind of card">
                {[
                  { t: 'Metrics & charts', s: 'Live numbers from your business' },
                  { t: 'Smart panels', s: 'Ready-made interactive cards' },
                  { t: 'Shortcuts', s: 'One-click buttons to any page' },
                ].map((f, i) => (
                  <button key={f.t} type="button" role="tab" aria-selected={categoryFolderIndex === i}
                    className={`vq-family-tab ${categoryFolderIndex === i ? 'is-active' : ''}`}
                    onClick={() => setFamily(i)}>
                    <span className="vq-family-tab-title">{f.t}</span>
                    <span className="vq-family-tab-sub">{f.s}</span>
                  </button>
                ))}
              </div>
            )}

            {step === 1 && isReadingCard && (
              <div className="vq-modal-filter-zone">
                <div className="vq-modal-search-wrapper">
                  <svg className="vq-modal-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                  <input type="text" className="vq-modal-search-input"
                         placeholder="Search for anything — sales, stock, expenses…"
                         value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus />
                </div>
                <div className="vq-modal-chips-row">
                  {availableAreas.map(a => (
                    <button key={a} type="button"
                      className={`vq-modal-chip ${selectedArea === a ? 'is-active' : ''}`}
                      onClick={() => setSelectedArea(a)}>{a}</button>
                  ))}
                </div>
              </div>
            )}

            <div className={`vq-modal-scroll-area ${step === 2 ? 'is-step2' : ''}`}>
              {step === 1 ? (
                isReadingCard ? (
                  Object.keys(groupedSections).length === 0 ? (
                    <p className="vq-modal-empty">Nothing matches “{searchQuery}”.</p>
                  ) : Object.keys(groupedSections).map(area => (
                    <div key={area} className="vq-modal-section-group">
                      <div className="vq-modal-section-title">{area}</div>
                      <div className="vq-modal-cards-grid">
                        {groupedSections[area].map(r => (
                          <button type="button" key={r.key} className="vq-item-card"
                                  onClick={() => selectMetricForStep2(r)}>
                            <span className="vq-item-card-top">
                              <span className="vq-item-card-title">{r.label}</span>
                              <svg className="vq-item-card-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                            </span>
                            <span className="vq-item-card-desc">{r.desc || ''}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                ) : isHubCard ? (
                  <div className="vq-modal-section-group">
                    <div className="vq-modal-section-title">Ready-made panels</div>
                    <div className="vq-modal-cards-grid">
                      {visibleTemplates.map(tmpl => (
                        <button type="button" key={tmpl.type} className="vq-item-card"
                                onClick={() => selectTemplateForStep2(tmpl)}>
                          <span className="vq-item-card-top">
                            <span className="vq-item-card-title">{tmpl.title}</span>
                            <svg className="vq-item-card-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                          </span>
                          <span className="vq-item-card-desc">{tmpl.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="vq-modal-section-group">
                    <div className="vq-modal-section-title">Pick where the button takes you</div>
                    <div className="vq-modal-cards-grid">
                      {SHORTCUT_TARGETS.map(target => (
                        <button type="button" key={target.path} className="vq-item-card"
                                onClick={() => selectCustomBtnForStep2(target)}>
                          <span className="vq-item-card-top">
                            <span className="vq-item-glyph" style={{ background: target.color }}
                                  dangerouslySetInnerHTML={{ __html: engine()?.iconMarkup?.(target.icon, 15) || '' }} />
                            <span className="vq-item-card-title">{target.label}</span>
                            <svg className="vq-item-card-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                          </span>
                          <span className="vq-item-card-desc">One click takes you straight there.</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              ) : (
                <div className="vq-step2-layout">
                  <div className="vq-controls-pane">{StylePanel}</div>

                  <div className="vq-preview-stage">
                    <div className="vq-preview-bar">
                      <span className="vq-preview-title">Live preview</span>
                      <span className="vq-preview-meta">
                        {draftGeo.w} × {draftGeo.h}
                        {previewScale < 100 && <em className="vq-preview-scale"> · shown at {previewScale}%</em>}
                      </span>
                      <span className="vq-preview-zoom">
                        <button type="button" className={previewZoom === 'fit' ? 'is-on' : ''}
                                onClick={() => setPreviewZoom('fit')}>Fit</button>
                        <button type="button" className={previewZoom === 'actual' ? 'is-on' : ''}
                                onClick={() => setPreviewZoom('actual')}>100%</button>
                      </span>
                    </div>
                    <div className="vq-preview-frame" ref={previewFrameRef}>
                      <div className="vq-preview-card-host" ref={previewRef} />
                      <button type="button" className="vq-preview-handle" ref={previewHandleRef}
                              onPointerDown={onHandleDown}
                              aria-label="Drag to resize" title="Drag to resize" />
                    </div>
                    <p className="vq-preview-foot">
                      Drag the corner to resize — it snaps to sizes where everything always fits.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="vq-modal-bottom-bar">
              {step === 1 ? (
                <span />
              ) : (
                <button type="button" className="vq-choice-btn"
                        onClick={() => { if (editingCardId) { setStepperModalOpen(false); setEditingCardId(null); } else setStep(1); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
                  <span>{editingCardId ? 'Cancel' : 'Change card'}</span>
                </button>
              )}

              <div className="vq-modal-bottom-actions">
                <button type="button" className="vq-modal-close-btn" onClick={() => setStepperModalOpen(false)}>Close</button>
                {step === 2 && (
                  <button type="button" className="vqb vqb--primary" onClick={handleAddCardConfirm}>
                    {editingCardId ? 'Save changes' : 'Add to dashboard'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Choose a side panel ─────────────────────────────────────────── */}
      {railsModalOpen && (
        <div className="vq-modal-overlay" onClick={() => setRailsModalOpen(false)} role="dialog" aria-modal="true">
          <div className="vq-modal-card vq-preset-modal" onClick={e => e.stopPropagation()}>
            <div className="vq-modal-top-bar">
              <div>
                <div className="vq-modal-step-sub">SIDE PANEL</div>
                <div className="vq-modal-heading">Choose a side panel</div>
              </div>
              <button type="button" className="vq-modal-close-x" onClick={() => setRailsModalOpen(false)} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="vq-preset-note">
              A ready-made column that sits to the right of your cards — pick the
              one that matches how you work. Each is composed to fit; there is
              nothing to arrange.
            </div>
            <div className="vq-rails-layoutbar">
              <div className="vq-rails-opt-group" role="group" aria-label="Panel width">
                <span className="vq-rails-opt-label">Width</span>
                {[[300, 'Cosy'], [340, 'Comfortable'], [380, 'Wide']].map(([w, n]) => (
                  <button key={w} type="button"
                          className={`vq-choice-btn ${railPrefs.width === w ? 'is-active' : ''}`}
                          onClick={() => setRailOpt({ width: w })}>{n}</button>
                ))}
              </div>
              <div className="vq-rails-opt-group" role="group" aria-label="Panel behaviour">
                <span className="vq-rails-opt-label">Scrolling</span>
                <button type="button" className={`vq-choice-btn ${railPrefs.sticky ? 'is-active' : ''}`}
                        onClick={() => setRailOpt({ sticky: true })}>Stays in place</button>
                <button type="button" className={`vq-choice-btn ${!railPrefs.sticky ? 'is-active' : ''}`}
                        onClick={() => setRailOpt({ sticky: false })}>Scrolls with cards</button>
              </div>
            </div>
            <div className="vq-rails-options">
              <button type="button"
                      className={`vq-rail-option ${!panelDesign ? 'is-on' : ''}`}
                      onClick={() => setRailOpt({ design: null, collapsed: false })}>
                <span className="vq-rail-option-text">
                  <span className="vq-rail-option-name">No side panel</span>
                  <span className="vq-rail-option-desc">Give the cards the full width.</span>
                </span>
              </button>
              {PANEL_DESIGNS.map(d => {
                const usable = d.rails.some(rid => availableRailDefs.some(x => x.id === rid));
                if (!usable) return null;
                return (
                  <button key={d.id} type="button"
                          className={`vq-rail-option ${railPrefs.design === d.id ? 'is-on' : ''}`}
                          onClick={() => setRailOpt({ design: d.id, collapsed: false })}>
                    <span className="vq-rail-option-text">
                      <span className="vq-rail-option-name">{d.name}</span>
                      <span className="vq-rail-option-desc">{d.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="vq-modal-bottom-bar">
              <span />
              <div className="vq-modal-bottom-actions">
                <button type="button" className="vqb vqb--primary" onClick={() => setRailsModalOpen(false)}>Done</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick actions ───────────────────────────────────────────────── */}
      {glassModalOpen && (
        <div className="vq-glass-modal-overlay" onClick={() => setGlassModalOpen(false)} role="dialog" aria-modal="true" aria-label="Quick Actions">
          <div className="vq-glass-modal-card" onClick={e => e.stopPropagation()}>
            <div className="vq-glass-modal-header">
              <div>
                <div className="vq-glass-modal-eyebrow">
                  <span className="vq-glass-pulse-dot" />
                  <span>Command Centre Fast Lane</span>
                </div>
                <div className="vq-glass-modal-title">Quick Actions</div>
                <div className="vq-glass-modal-desc">Instant one-click shortcuts to key operational workflows.</div>
              </div>
              <button type="button" className="vq-glass-modal-close" onClick={() => setGlassModalOpen(false)} aria-label="Close Quick Actions">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <GlassIcons items={glassActionItems} onActionClick={(item) => {
              setGlassModalOpen(false);
              if (item.action) item.action();
              else if (item.href) window.location.href = item.href;
            }} />
          </div>
        </div>
      )}

      {/* Engine-owned drawers — the library and the deep editor */}
      <aside className="side">
        <div id="edit" />
        <div className="panel" id="lib">
          <div className="panel-h">
            <h2 className="panel-t">Card library</h2>
            <button type="button" className="vqc-act" id="lib-close" aria-label="Close library">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
          <div className="panel-b" id="lib-body" />
        </div>
      </aside>

      {!store?.is_demo && !store?.onboarding_completed && (
        store?.onboarding_step === 'welcome' || 
        store?.onboarding_step === 'purchase_tour_start' || 
        store?.onboarding_step === 'purchase_tour_sidebar' ||
        store?.onboarding_step === 'invoice_tour_start' ||
        store?.onboarding_step === 'pos_tour_start' ||
        store?.onboarding_step === 'expense_tour_start'
      ) && (
        <WelcomeTourModal store={store} />
      )}

      {!store?.is_demo && !store?.onboarding_completed && store?.onboarding_step === 'dashboard_tour' && (
        <DashboardTourGuide store={store} />
      )}

      </div>
    </OneGlanceLayout>
  );
}

NewDashboard.layout = (page) => page;
