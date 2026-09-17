import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Head, router, Link } from '@inertiajs/react';
import axios from 'axios';
import './NewDashboard.css';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { useAppearance } from '@/Contexts/AppearanceContext';
import FramePicker from '@/Dashboard/components/FramePicker';

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
import V6FinancialSidebar from '@/Components/V6FinancialSidebar';
import RightPanel from '@/Components/RightPanel';
import RECKONER_CATALOG from './ReckonerCatalog.json';

/* ══ human copy ════════════════════════════════════════════════════════════
   Every reading carries a plain-language description. The wizard shows ONLY
   the name and this sentence — never the backend key, never the shape, never
   the module. Descriptions are written per key; anything unlisted falls back
   to a sentence built from what the reading is.
   ═════════════════════════════════════════════════════════════════════════ */

const READING_DESC = {
  // ── Core & Overview Financials ──
  "core.revenue": "All the money that came into your shop from sales. It adds up every customer payment from your cash register, invoices, and receipts. This is the total money customers handed you before taking out any costs or expenses.",
  "core.revenue_trend": "A day-by-day graph of your sales. It shows how much money came in each day, so you can easily spot your best sales days, your slow days, and whether your sales are going up or down this month.",
  "core.gross_profit": "The profit you make on the items themselves. It takes your sales money and subtracts what you paid to buy those products wholesale. For example, if you sell a shirt for Rs 1,000 that cost you Rs 600, your gross profit is Rs 400.",
  "core.gross_margin_pct": "Shows what percentage of your selling price is profit. For example, a 40% margin means that for every 100 rupees a customer pays you, 40 rupees is profit on the item and 60 rupees covers what you paid to buy it.",
  "core.net_profit": "The real money you actually take home in your pocket. It takes your sales and subtracts everything: the cost of the products, shop rent, staff wages, electricity bills, tea, and taxes. This is your true final profit.",
  "core.net_margin_pct": "Out of every 100 rupees of sales that comes into your shop, this shows how many rupees stay with you as pure profit after paying every single shop bill and expense.",
  "core.profit_trend": "A daily graph showing your actual take-home profit day by day. It shows if you made real money every day or if big bills (like rent or supplier payments) caused you to lose money on certain days.",
  "core.cogs": "The wholesale cost of the products you actually sold to customers. It only counts items that were sold, so you know exactly how much you paid to buy that inventory from your suppliers.",
  "core.expenses_total": "All the everyday money spent to keep your shop running. This includes shop rent, electricity, staff salaries, internet, tea, repairs, and delivery costs. It does not include buying stock.",
  "core.expense_ratio": "Shows how much of your sales money is eaten up by shop bills. For example, if you sell Rs 100,000 and your shop expenses are Rs 20,000, then 20% of your money goes straight to bills.",
  "core.receivables": "The total money that customers owe you on credit (your Khata balance). It shows how much of your money is sitting in other people's pockets waiting to be collected.",
  "core.receivables_aging": "Groups what customers owe you by how late they are (under 30 days, 60 days, or over 90 days). It reminds you which customers to call first before their credit gets too old to collect.",
  "core.payables": "Total money you owe to your suppliers and vendors for stock or services. It shows all the upcoming bills that you need to pay soon.",
  "core.payables_aging": "Lists your supplier bills by when they are due. It helps you see which bills need to be paid today and which ones you can pay next week, keeping suppliers happy.",
  "core.total_liquidity": "All the ready cash you have right now. It adds up all the cash inside your cash drawer and safe, plus all the money in every bank account you have.",
  "core.liquidity_trend": "A graph tracking your total cash over time. It shows whether your shop is saving more cash day by day or if your bank balance is slowly drying up.",
  "core.cash_flow_trend": "Compares the cash entering your shop against the cash leaving your shop each day. It helps make sure you don't spend more cash on bills than what customers are paying you.",
  "core.net_cash_position": "The cash you have in hand and bank minus what you owe to suppliers right now. It tells you how much money is truly yours if you paid off all your supplier bills today.",
  "core.working_capital": "Your financial breathing room. It checks if your current stock, cash, and customer dues are enough to easily cover your short-term bills and keep your shop running smoothly.",
  "core.revenue_vs_prev": "Shows if your sales are higher or lower compared to last month or last week. A green number means more customers are buying from you than before.",
  "core.profit_vs_prev": "Shows if your real take-home profit grew or shrank compared to last month. It tells you if you are actually keeping more money in your pocket than before.",
  "core.transaction_count": "The total number of customer sales and printed receipts. It tells you how busy your checkout counter was, counting every visit whether the customer spent Rs 50 or Rs 50,000.",
  "core.avg_transaction_value": "The average amount a customer spends when they buy from you. It divides your total sales by the number of customers, showing if people are buying bigger or smaller baskets.",
  "core.busiest_day": "Tells you which day brought in the most sales money. It helps you know which day of the week you need the most staff and the most stock ready.",
  "core.peak_hour": "The exact hour of the day when the most customers are checking out at your counter. It tells you when you need all cashiers present to handle the rush.",
  "core.balance_sheet_ok": "A live check that makes sure all your accounts balance. A green mark means every debit matches every credit and there are zero bookkeeping errors in your system.",
  "core.journal_entries_count": "The number of accounting records our system created for your shop automatically. Every time you sell, buy, or pay a bill, the system writes the accounting entries for you.",
  "core.audit_trail_count": "A safety counter of every action taken in your system, like making a sale, giving a discount, or editing stock. It keeps a record so you always know who did what.",
  "core.reversal_count": "Counts how many times a sale or bill was cancelled, returned, or corrected. A high number helps you catch cashier mistakes or customer return issues early.",
  "core.document_sequence_ok": "Checks that your invoice and receipt numbers follow in a clean order (like 101, 102, 103) with no missing slips or duplicate numbers.",
  "core.user_activity": "Shows which of your staff members and cashiers have logged into the system and are working today.",
  "core.plan_usage": "Shows how much of your monthly software plan limits you have used, such as number of orders or products.",

  // ── Inventory & Products ──
  "inventory.stock_value": "The wholesale purchase cost of all the goods sitting on your shelves. It tells you exactly how much of your money is currently tied up in unsold stock.",
  "inventory.low_stock_count": "Products that are running out of stock and need to be reordered soon before you run out completely.",
  "inventory.out_of_stock_count": "Products that have completely sold out with zero left on the shelf. You need to reorder these to avoid missing sales.",
  "inventory.turnover": "Shows how many times your stock completely sells out and gets replaced. Fast-moving items sell quickly and make you more money.",
  "inventory.days_of_cover": "How many days your current stock will last based on how fast it is selling. Helps you know when to order more goods.",
  "inventory.dead_stock_value": "Money stuck in products that haven't sold in a long time. You can put these on sale or discount them to get your cash back.",
  "products.top_margin": "The items in your shop that give you the highest profit percentage on each sale. These are your best items to recommend to customers to make more money.",
  "products.lowest_margin": "The items you sell with very little profit markup. It warns you where you are barely making any profit so you can adjust prices if supplier costs go up.",
  "products.active_count": "The total number of products you currently have available for customers to buy in your store.",
  "products.by_category": "Shows how your products are divided across different groups, like drinks, snacks, or clothes, so you see what types of items you carry the most.",
  "products.catalogue_value": "How much money you would collect if you sold every single item currently on your shelves at full retail price.",
  "products.never_sold": "Items sitting in your shop that no customer has ever bought. It helps you spot dead items so you can put them on discount or stop ordering them.",
  "products.missing_cost": "Products where you forgot to enter what you paid the supplier. Entering their cost is important so the system can calculate your real profit.",
  "products.new_this_period": "New products you added to your store during this period.",

  // ── Customers & Khata ──
  "customers.count": "The total number of customers saved in your system with their contact and Khata details.",
  "customers.top_customers": "A list of your best customers who have spent the most money in your shop. It helps you know your most loyal buyers so you can give them special service.",
  "customers.dormant": "Customers who used to buy from you but have not visited in the last 2 to 3 months. A reminder to send them an SMS or give them a special offer to bring them back.",
  "customers.repeat_rate": "The percentage of customers who come back to buy from you again. A higher number means customers love your shop and keep returning.",
  "customers.avg_spend": "The average amount a customer has spent in your shop over their entire history with you.",

  // ── Suppliers & Purchasing ──
  "suppliers.active": "How many different suppliers and wholesale distributors you bought goods from during this period.",
  "suppliers.top_suppliers": "The suppliers you buy the most from. Helps you know who your biggest partners are so you can ask for better discounts.",
  "suppliers.spend_total": "The total money you spent buying new stock and goods from suppliers during this period.",
  "suppliers.spend_trend": "A timeline showing how much money you spent on buying stock each week or month.",
  "suppliers.concentration": "Shows if too much of your purchasing is coming from just one supplier, so you know if you are depending too much on one vendor.",

  // ── Point of Sale (POS) ──
  "pos.revenue_trend": "Shows your counter sales hour by hour and day by day, helping you see when your cash register is making the most money.",
  "pos.payment_breakdown": "Shows how customers paid you — how much came in cash, how much by bank card, and how much on credit. It makes end-of-day register counting easy.",
  "pos.hourly_heatmap": "A map showing your rush hours across the entire week, so you know which hours of each day are packed with customers and which hours are quiet.",
  "pos.live_feed": "A live feed showing every sale as it happens at the counter right now. You can see what customers are buying in real time.",
  "pos.max_sale": "The biggest single sale made at your counter during this period.",
  "pos.items_per_sale": "The average number of items a customer buys in one receipt. It tells you if customers are buying just one thing or filling their baskets.",

  // ── Invoicing & Billing ──
  "invoicing.value_trend": "Shows the total value of customer invoices you issued over time, tracking your wholesale and corporate billing.",
  "invoicing.unpaid_value": "The total amount of unpaid customer invoices waiting to be collected.",
  "invoicing.overdue_count": "How many customer invoices are late and past their due date, reminding you who needs a payment reminder.",

  // ── Bank Accounts & Cash ──
  "bank_accounts.total_balance": "The total money sitting in all your bank accounts combined.",
  "bank_accounts.cash_on_hand": "The physical cash inside your shop registers, cash drawer, and safe right now.",
  "bank_accounts.money_in_today": "Total money received today from sales, customer Khata payments, and bank deposits.",
  "bank_accounts.money_out_today": "Total money paid out today for supplier bills, shop expenses, and cash withdrawals.",
  "accounting.assets": "Everything of value your business owns — your unsold stock, bank balance, cash in hand, and customer credit combined.",
  "accounting.liabilities": "Everything your business owes to others — unpaid supplier bills, loans, and expenses.",
  "accounting.income_ytd": "All sales and earnings your shop has made since the beginning of this year.",
  "accounting.expense_ytd": "All shop bills, expenses, and costs spent since the beginning of this year."
};

/* A description for anything the table above missed — built from what the
   reading is, clear, human, and free of generic placeholders. */
function readingDesc(r){
  if (READING_DESC[r.key]) return READING_DESC[r.key];
  if (r.desc && typeof r.desc === "string" && !r.desc.includes("— a live") && r.desc.trim().length > 20) return r.desc;
  if (r.insight && typeof r.insight === "string" && !r.insight.includes("— a live") && r.insight.trim().length > 20) return r.insight;
  if (r.description && typeof r.description === "string" && !r.description.includes("— a live") && r.description.trim().length > 20) return r.description;
  const noun = r.unit === "currency" ? "money amounts" : r.unit === "percent" ? "percentages" : "counts";
  return `Tracks ${r.label.toLowerCase()} for your store, showing real-time ${noun} from your ${r.area.toLowerCase()} records.`;
}

/* ══ module gating ═════════════════════════════════════════════════════════
   Every reading belongs to the product module(s) that produce its data —
   the same module keys config/modules.php declares and the Inertia shell
   shares on every page as the `modules` prop. A business running five
   modules sees the cards those five modules can actually answer, nothing
   else. An empty enabled-set (no tenant bound, the dev harness) gates
   nothing. A reading matching no rule is always available. */
function modulesOf(key){
  if (typeof window !== "undefined" && Array.isArray(window.READINGS)) {
    const found = window.READINGS.find(r => r.key === key);
    if (found && Array.isArray(found.modules)) return found.modules;
  }
  const fallback = Array.isArray(RECKONER_CATALOG) ? RECKONER_CATALOG.find(r => r.key === key) : null;
  return fallback && Array.isArray(fallback.modules) ? fallback.modules : [];
}

function prepareReadings(source) {
  const list = (Array.isArray(source) && source.length > 0) ? [...source] : [...RECKONER_CATALOG];
  if (typeof window !== "undefined" && window.__VENQORE_DEMO_MODE__) {
    list.push(
      { key:"finance.expenses_trend", label:"Expense trend", shape:"SERIES", unit:"currency",
        area:"Finance", module:"Extra", modules:["expenses"], short:"Expense trend", extra:true,
        rowNames:["Rent","Salaries","Utilities","Transport","Marketing","Other"],
        sliceNames:["Rent","Salaries","Utilities","Transport","Other"] },
      { key:"operations.activity_feed", label:"Recent activity", shape:"FEED", unit:"currency",
        area:"Operations", module:"Extra", modules:[], short:"Recent activity", extra:true,
        rowNames:["Bilal Ahmed","Sana Iqbal","Hamza Raza","Noor Fatima","Ayesha Khan","Usman Ali"],
        sliceNames:["New","Returning","Dormant"] },
      { key:"bank_accounts.liquid_net", label:"Total Liquid Net", shape:"SCALAR", unit:"currency",
        area:"Finance", module:"BankAccounts", modules:["bank_accounts"], short:"Total Liquid Net", extra:true,
        rowNames:["Rent","Salaries","Utilities","Transport","Marketing","Other"],
        sliceNames:["Rent","Salaries","Utilities","Transport","Other"] },
      { key:"purchasing.recent", label:"Recent purchases", shape:"FEED", unit:"currency",
        area:"Purchasing", module:"Extra", modules:["purchases"], short:"Recent purchases", extra:true,
        rowNames:["Metro Supply","Karim Bros","Lahore Foods","Indus Traders","Bahria Wholesale","Ravi Depot"],
        sliceNames:["Metro Supply","Karim Bros","Lahore Foods","Indus Traders"] },
    );
    READING_DESC["bank_accounts.liquid_net"] = "Bank balances and cash in hand, added up — everything liquid.";
    READING_DESC["purchasing.recent"] = "The latest purchases from your suppliers, newest first.";
  }
  list.forEach(r => {
    r.desc = readingDesc(r);
    r.modules = Array.isArray(r.modules) ? r.modules : modulesOf(r.key);
    r.rowNames = Array.isArray(r.rowNames) ? r.rowNames : [];
    r.sliceNames = Array.isArray(r.sliceNames) ? r.sliceNames : [];
  });
  return list;
}

// Server-provided facts used by the non-Reckoner hub cards.
let DASHBOARD_RUNTIME_DATA = {};

/* ── live reckoner integration & cache ─────────────── */
const LIVE_RECKONER_DATA = {};
const PENDING_RECKONER_REQUESTS = new Set();
let RECKONER_FETCH_TIMER = null;

function clearReckonerDataCache() {
  for (const k of Object.keys(LIVE_RECKONER_DATA)) {
    delete LIVE_RECKONER_DATA[k];
  }
}

function runCardBuilder(opts) {
  /* Inertia remounts this page on every client-side navigation back to it. The
     engine registers document-level listeners, so running it twice would double
     every pointerup and leak a listener per visit. Re-boot the board instead. */
  const ENGINE_VERSION = 4;
  if (typeof window !== "undefined" && window.VenQoreCards?.engineVersion === ENGINE_VERSION && window.__vqCardEngine){
    window.VenQoreCards.setStoreSlug(opts && opts.storeSlug);
    window.VenQoreCards.setEnabledModules(opts && opts.modules);
    if (opts && opts.layoutLaw && window.VenQoreCards.setLayoutLaw) {
      window.VenQoreCards.setLayoutLaw(opts.layoutLaw);
    }
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
  if (r && r.contract_state === 'unimplemented') return false;
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

/** Real timestamps for the current period, spaced by the period's step. */
function timeline(period){
  const conf = PERIOD[period] || PERIOD.Month;
  const grain = conf.grain;
  const now = anchorNow();

  if (period === "Today") {
    const out = [];
    const base = new Date(now);
    base.setHours(0, 0, 0, 0);
    const maxH = Math.max(12, Math.min(24, now.getHours() + 1));
    for (let h = 0; h < maxH; h++) {
      out.push(new Date(base.getTime() + h * MS_H));
    }
    return out;
  }

  if (period === "Week") {
    const out = [];
    const base = new Date(now);
    base.setHours(0, 0, 0, 0);
    const day = base.getDay();
    const diffToMon = (day === 0 ? 6 : day - 1);
    const monday = new Date(base.getTime() - diffToMon * MS_D);
    const count = Math.max(2, diffToMon + 1);
    for (let d = 0; d < count; d++) {
      out.push(new Date(monday.getTime() + d * MS_D));
    }
    return out;
  }

  if (period === "Month") {
    const out = [];
    const y = now.getFullYear();
    const m = now.getMonth();
    const todayDate = Math.max(2, now.getDate());
    for (let d = 1; d <= todayDate; d++) {
      out.push(new Date(y, m, d, 0, 0, 0));
    }
    return out;
  }

  if (period === "Quarter") {
    const out = [];
    const y = now.getFullYear();
    const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
    const currentMonth = now.getMonth();
    for (let m = qStartMonth; m <= currentMonth; m++) {
      out.push(new Date(y, m, 1, 0, 0, 0));
    }
    return out.length >= 2 ? out : [new Date(y, qStartMonth, 1, 0, 0, 0), now];
  }

  if (period === "Year") {
    const out = [];
    const y = now.getFullYear();
    const currentMonth = now.getMonth();
    for (let m = 0; m <= currentMonth; m++) {
      out.push(new Date(y, m, 1, 0, 0, 0));
    }
    return out.length >= 2 ? out : [new Date(y, 0, 1, 0, 0, 0), now];
  }

  const { n, step } = conf;
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


function toReckonerPeriod(period) {
  const map = {
    Day: "today",
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
  const now = Date.now();
  const requests = [];

  cards.forEach(c => {
    if (!c || c.type) return;
    const uiPer = c.period || "Month";
    const rd = readingOf(c.key);
    let reckPer = toReckonerPeriod(uiPer);
    if (rd && rd.periods && Array.isArray(rd.periods) && rd.periods.length > 0 && !rd.periods.includes(reckPer)) {
      reckPer = rd.default_period || rd.periods[0] || "live";
    }
    const gran = PERIOD[uiPer]?.grain || "day";
    const compositeId = `${c.key}|${reckPer}|${gran}`;
    const reqKey = `${c.key}|${uiPer}`;

    const existing = LIVE_RECKONER_DATA[compositeId] || LIVE_RECKONER_DATA[reqKey];
    const isExpired = existing && existing._expiresAt && now > existing._expiresAt;

    if (!PENDING_RECKONER_REQUESTS.has(reqKey) && (!existing || isExpired)) {
      PENDING_RECKONER_REQUESTS.add(reqKey);
      requests.push({ key: c.key, period: reckPer, granularity: gran, reqKey, uiPeriod: uiPer });
    }

    if (Array.isArray(c.extraKeys)) {
      c.extraKeys.forEach(ek => {
        const ekRd = readingOf(ek);
        let ekReckPer = toReckonerPeriod(uiPer);
        if (ekRd && ekRd.periods && Array.isArray(ekRd.periods) && ekRd.periods.length > 0 && !ekRd.periods.includes(ekReckPer)) {
          ekReckPer = ekRd.default_period || ekRd.periods[0] || "live";
        }
        const ekCompositeId = `${ek}|${ekReckPer}|${gran}`;
        const ekReqKey = `${ek}|${uiPer}`;
        const ekExisting = LIVE_RECKONER_DATA[ekCompositeId] || LIVE_RECKONER_DATA[ekReqKey];
        const ekIsExpired = ekExisting && ekExisting._expiresAt && now > ekExisting._expiresAt;

        if (!PENDING_RECKONER_REQUESTS.has(ekReqKey) && (!ekExisting || ekIsExpired)) {
          PENDING_RECKONER_REQUESTS.add(ekReqKey);
          requests.push({ key: ek, period: ekReckPer, granularity: gran, reqKey: ekReqKey, uiPeriod: uiPer });
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

  Promise.allSettled(chunks.map(chunk =>
    axios.post("/api/reckoner/read", {
      requests: chunk.map(r => ({ key: r.key, period: r.period, granularity: r.granularity }))
    }).then(res => {
      const items = res?.data?.data || [];
      const receivedAt = Date.now();
      items.forEach((item) => {
        if (item && item.key) {
          const ttlSec = Math.max(300, Number(item.meta?.ttl) || 300);
          item._expiresAt = receivedAt + ttlSec * 1000;

          // Match by item.id if composite id returned, or key + period
          const req = chunk.find(r => item.id && item.id.startsWith(r.key + '|' + r.period))
            || chunk.find(r => r.key === item.key && (r.period === item.period?.key || r.period === item.period))
            || chunk.find(r => r.key === item.key);

          const perKey = item.period?.key || req?.period || "today";
          const uiP = req?.uiPeriod || "Month";
          const gran = req?.granularity || item.granularity || PERIOD[uiP]?.grain || "day";

          if (item.id) {
            LIVE_RECKONER_DATA[item.id] = item;
          }
          LIVE_RECKONER_DATA[`${item.key}|${perKey}|${gran}`] = item;
          LIVE_RECKONER_DATA[`${item.key}|${perKey}`] = item;
          LIVE_RECKONER_DATA[`${item.key}|${uiP}`] = item;
        }
      });
    }).catch(error => {
      const message = error?.response?.data?.message || error?.message || "This reading could not be loaded.";
      chunk.forEach(req => {
        const failure = { key: req.key, ok: false, status: "error", error: { code: "request_failed", message } };
        if (!LIVE_RECKONER_DATA[`${req.key}|${req.uiPeriod}`]) {
          LIVE_RECKONER_DATA[`${req.key}|${req.period}|${req.granularity}`] = failure;
          LIVE_RECKONER_DATA[`${req.key}|${req.period}`] = failure;
          LIVE_RECKONER_DATA[`${req.key}|${req.uiPeriod}`] = failure;
        }
      });
    })
    .finally(() => {
      chunk.forEach(r => PENDING_RECKONER_REQUESTS.delete(r.reqKey));
    })
  )).then(() => {
    if (typeof window !== "undefined" && window.VenQoreCards && window.VenQoreCards.draw) {
      window.VenQoreCards.draw();
    }
    if (onComplete) onComplete();
  });
}


function liveReading(card){
  const reckPer = toReckonerPeriod(card.period);
  const gran = PERIOD[card.period]?.grain || "day";

  return LIVE_RECKONER_DATA[`${card.key}|${card.period}`]
    || LIVE_RECKONER_DATA[`${card.key}|${reckPer}|${gran}`]
    || LIVE_RECKONER_DATA[`${card.key}|${reckPer}`]
    || null;
}

function renderDataState(host, card, emptyMessage = "No data in this period."){
  const pending = PENDING_RECKONER_REQUESTS.has(`${card.key}|${card.period}`)
    || PENDING_RECKONER_REQUESTS.has(`${card.key}|${toReckonerPeriod(card.period)}`);
  const live = liveReading(card);
  if (pending && !live){
    host.innerHTML = `<div class="ck-state is-loading" role="status">Loading…</div>`;
    return true;
  }
  /* The Reckoner returns a reading envelope. Distinctly handle unavailable */
  if (live?.status === "unavailable") {
    const reason = live.error?.message || "Coming soon — not available yet.";
    host.innerHTML = `<div class="ck-state is-unavailable" role="status">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="ck-state-ic"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <b>Not available yet</b>
      <span>${esc(reason)}</span>
    </div>`;
    return true;
  }
  if (live?.status === "empty"){
    host.innerHTML = `<div class="ck-state is-empty" role="status">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="ck-state-ic"><path d="M4 6v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6"/><path d="M10 12h4"/></svg>
      <b>No activity recorded</b>
      <span>${esc(emptyMessage)}</span>
    </div>`;
    return true;
  }
  if (live?.status === "locked" || live?.status === "plan_locked" || live?.status === "module_locked"){
    host.innerHTML = `<div class="ck-state is-unavailable" role="status">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="ck-state-ic"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      <b>Module not active</b>
      <span>Enable this feature in settings to view data.</span>
    </div>`;
    return true;
  }
  if (live && (!live.ok || live.status === "error")){
    let errText = live.error?.message || "New transactions will automatically stream here.";
    if (typeof errText === 'string' && (errText.includes("Invariant failure:") || errText.includes("stock_value_control") || errText.includes("FAILED:"))) {
      errText = "Reconciling ledger entries. Data will update on next sync.";
    }
    host.innerHTML = `<div class="ck-state is-unavailable" role="status">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="ck-state-ic"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <b>Data reconciling</b>
      <span>${esc(errText)}</span>
    </div>`;
    return true;
  }
  if (!live){
    host.innerHTML = `<div class="ck-state is-empty" role="status">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="ck-state-ic"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      <b>Awaiting updates</b>
      <span>${esc(emptyMessage)}</span>
    </div>`;
    return true;
  }
  return false;
}
/* readings that genuinely swing either side of zero — a profit/loss chart
   is meaningless if the data can only ever be positive */
const SIGNED = /profit|net_|cash_flow|margin|variance/;

/** A business series backed only by Reckoner data. Missing data is zero, never invented. */
function valuesFor(key, period, unit){
  const conf = PERIOD[period] || PERIOD.Month;
  const grain = conf.grain || "day";
  const times = timeline(period);
  const n = times.length;
  const reckPer = toReckonerPeriod(period);
  const gran = grain || "day";
  const reqKey = `${key}|${period}`;
  const live = LIVE_RECKONER_DATA[reqKey]
    || LIVE_RECKONER_DATA[`${key}|${reckPer}|${gran}`]
    || LIVE_RECKONER_DATA[`${key}|${reckPer}`];

  if (live && live.ok && live.status !== "unavailable") {
    let seriesSource = (live.data && (live.data.series || live.data.points)) || live.series;

    // If scalar card has no series of its own, check if a corresponding trend series is already loaded
    if (!seriesSource || (Array.isArray(seriesSource) && seriesSource.length === 0)) {
      const trendKey = `${key}_trend`;
      const altTrendKey = key.includes('net_profit') ? key.replace('net_profit', 'profit_trend') : (key.includes('gross_profit') ? key.replace('gross_profit', 'profit_trend') : null);
      const trendLive = LIVE_RECKONER_DATA[`${trendKey}|${period}`]
        || LIVE_RECKONER_DATA[`${trendKey}|${reckPer}`]
        || (altTrendKey && (LIVE_RECKONER_DATA[`${altTrendKey}|${period}`] || LIVE_RECKONER_DATA[`${altTrendKey}|${reckPer}`]));
      if (trendLive && trendLive.ok && trendLive.data && Array.isArray(trendLive.data.series) && trendLive.data.series.length > 0) {
        seriesSource = trendLive.data.series;
      }
    }

    if (seriesSource && Array.isArray(seriesSource) && seriesSource.length > 0) {
      // Build key map based on granularity
      const xMap = new Map();
      seriesSource.forEach(pt => {
        let rawDate = pt.date ?? pt.t ?? pt.x ?? '';
        let k = String(rawDate);
        if (typeof rawDate === 'string' && rawDate.includes('T')) {
          const ptDate = new Date(rawDate);
          if (!isNaN(ptDate.getTime())) {
            if (grain === 'hour') {
              k = String(ptDate.getHours()).padStart(2, '0');
            } else if (grain === 'month') {
              k = `${ptDate.getFullYear()}-${String(ptDate.getMonth() + 1).padStart(2, '0')}`;
            } else {
              k = `${ptDate.getFullYear()}-${String(ptDate.getMonth() + 1).padStart(2, '0')}-${String(ptDate.getDate()).padStart(2, '0')}`;
            }
          }
        } else if (typeof rawDate === 'string' && rawDate.length >= 10 && rawDate.includes('-')) {
          if (grain === 'month') {
            k = rawDate.slice(0, 7);
          } else if (grain === 'hour' && rawDate.length >= 13) {
            k = rawDate.slice(11, 13);
          } else {
            k = rawDate.slice(0, 10);
          }
        } else if (typeof rawDate === 'number' || (typeof rawDate === 'string' && /^\d+$/.test(rawDate))) {
          if (grain === 'hour') {
            k = String(Number(rawDate)).padStart(2, '0');
          }
        }
        const v = typeof pt.y === 'number' ? pt.y : (typeof pt.value === 'number' ? pt.value : (typeof pt === 'number' ? pt : (Number(pt) || 0)));
        xMap.set(k, v);
      });

      const mapped = times.map(t => {
        let k;
        if (grain === 'hour') {
          k = String(t.getHours()).padStart(2, '0');
        } else if (grain === 'month') {
          k = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`;
        } else {
          const y = t.getFullYear();
          const m = String(t.getMonth() + 1).padStart(2, '0');
          const d = String(t.getDate()).padStart(2, '0');
          k = `${y}-${m}-${d}`;
        }
        return xMap.has(k) ? xMap.get(k) : null;
      });

      if (mapped.some(v => v !== null)) {
        return mapped.map(v => v ?? 0);
      }

      // If keys didn't match directly, check if pts array matches n directly without interpolation
      const pts = seriesSource.map(pt => (
        typeof pt === 'number' ? pt :
        typeof pt?.y === 'number' ? pt.y :
        typeof pt?.value === 'number' ? pt.value : 0
      ));
      if (pts.length === n) return pts;
      if (pts.length > n) return pts.slice(-n);
      return pts;
    }
    if (Array.isArray(live.data) && typeof live.data[0] === 'number') {
      if (live.data.length === n) return live.data;
      if (live.data.length > n) return live.data.slice(-n);
      return live.data;
    }
    if (typeof live.data === 'number') {
      const arr = new Array(n).fill(0);
      arr[n - 1] = live.data;
      return arr;
    }
    if (typeof live.value === 'number') {
      const arr = new Array(n).fill(0);
      arr[n - 1] = live.value;
      return arr;
    }
  }

  // Never invent interpolation between points. Empty series returns empty or nulls
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
  const reckPer = toReckonerPeriod(period);
  const live = LIVE_RECKONER_DATA[reqKey] || LIVE_RECKONER_DATA[`${key}|${reckPer}`];
  const rd = readingOf(key);

  if (live && live.ok && live.status !== "unavailable" && live.data) {
    const rawItems = (Array.isArray(live.data.items) && live.data.items.length > 0)
      ? live.data.items
      : (Array.isArray(live.data.slices) && live.data.slices.length > 0)
        ? live.data.slices
        : (Array.isArray(live.data.rows) && live.data.rows.length > 0)
          ? live.data.rows
          : (Array.isArray(live.data) && live.data.length > 0)
            ? live.data
            : null;

    if (Array.isArray(rawItems) && rawItems.length > 0) {
      const list = rawItems.map((item, i) => ({
        name: item.name || item.label || item.title || item.day || `Item ${i + 1}`,
        value: typeof item.value === 'number' ? item.value : (typeof item.margin === 'number' ? item.margin : (typeof item.total === 'number' ? item.total : (typeof item.amount === 'number' ? item.amount : (item.val !== undefined ? Number(item.val) : (item.sales !== undefined ? Number(item.sales) : (item.count !== undefined ? Number(item.count) : 0)))))),
        color: `var(--vq-series-${(i%8)+1})`,
      }));
      if (key !== 'products.lowest_margin') {
        list.sort((a, b) => b.value - a.value);
      }
      const total = Number(live.data.total) || list.reduce((s, x) => s + (x.value || 0), 0);
      return { parts: list, total, unit: rd?.unit || 'currency' };
    }
  }

  // Never invent fake segment names when data is missing. Return empty parts
  return { parts: [], total: 0, unit: rd?.unit || "currency" };
}
function unitBase(unit){ return unit === "currency" ? 180000 : unit === "percent" ? 22 : 320; }

function readingOf(key){
  const found = Array.isArray(READINGS) ? READINGS.find(r => r.key === key) : null;
  if (found) return found;
  // Return neutral fallback without inventing wrong label or unit
  return {
    key: key || "unknown",
    label: (key || "Metric").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    shape: "SCALAR",
    unit: "currency",
    area: "General",
    module: "General",
    short: (key || "Metric").replace(/_/g, " "),
    extra: false,
    desc: "",
    rowNames: [],
    sliceNames: [],
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
/* Catmull-Rom → flowing organic cubic bezier (alpha ≈ 0.42) */
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
  /* Wide hero cards (≥ 7 grid columns) look far better with an area chart
     than a bare line — the fill grounds the data against the dark background
     and gives the peak more visual weight. Only applies to line/trend/stat
     when the user hasn't already chosen a specific chart type. */
  const isWideHero = (card.w || 0) >= 7 && card.style?.accent;
  const effectiveChart = (isWideHero && (card.chart === "line" || card.chart === "trend" || card.chart === "sparkline"))
    ? "area"
    : card.chart;
  const cardForChart = effectiveChart !== card.chart ? { ...card, chart: effectiveChart } : card;

  const keys = [cardForChart.key, ...(cardForChart.extraKeys || [])];
  const ds = buildSeries(keys, cardForChart.period);
  const uid = "ck" + (++CHART_UID);
  const variant = cardForChart.variant || defaultVariant(effectiveChart);

  /* split series across a left and right axis when units disagree, so a
     rupee series and a percentage series can share one card honestly */
  const units = [...new Set(ds.series.map(s => s.unit))];
  const rightUnit = units.length > 1 ? units[1] : null;
  const axisOf = s => (rightUnit && s.unit === rightUnit) ? "right" : "left";

  /* Top margin 18px: the Catmull-Rom bezier can overshoot its data points by
     up to ~8% on steep peaks — the extra 6px stops the line clipping at the
     card edge. The domain also adds 18% headroom (was 12%) for the same reason. */
  const m = { l: 48, r: rightUnit ? 48 : 12, t: 18, b: 30 };
  const pw = Math.max(20, W - m.l - m.r), ph = Math.max(20, H - m.t - m.b);

  const domainFor = side => {
    const vals = ds.series.filter(s => axisOf(s) === side).flatMap(s => s.values);
    if (!vals.length) return null;
    const stacked = /stacked/.test(variant) && ds.series.length > 1;
    const rawHi = stacked
      ? Math.max(...ds.times.map((_,i) => ds.series.reduce((a,s) => a + s.values[i], 0)))
      : Math.max(...vals);
    const rawLo = Math.min(...vals);
    const span = Math.max(1, rawHi - Math.min(0, rawLo));
    const hi = rawHi + span * 0.18;   /* was 0.12 — extra headroom for bezier overshoot */
    const lo = rawLo < 0 ? rawLo - span * 0.12 : 0; /* was 0.10 */
    return niceTicks(lo, hi, 5);
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
    .sort((a, b) => Z[roleFor(effectiveChart, variant, a)] - Z[roleFor(effectiveChart, variant, b)]);

  order.forEach(si => {
    const s = ds.series[si];
    const side = axisOf(s);
    const pts = s.values.map((v, i) => [xOf(i), yOf(isStacked ? (stackTop[i] += v) : v, side)]);
    const role = roleFor(effectiveChart, variant, si);
    const gid = `${uid}-g${si}`;

    if (role === "bar"){
      const groupN = effectiveChart === "bar" && variant === "grouped" ? ds.series.length : 1;
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
    const hl = headlineOf(card);
    if (hl && hl.value && hl.value !== "—") {
      return { v: headCompact() ? hl.valueCompact : hl.value, when: hl.when || rangeLabel(ds) };
    }
    const s0 = ds.series[0];
    const nonZeroVals = (s0?.values || []).filter(v => v !== 0 && v !== null && !isNaN(v));
    const fallbackVal = nonZeroVals.length ? nonZeroVals[nonZeroVals.length - 1] : (s0?.values?.[s0.values.length - 1] ?? 0);
    return { v: unitPrefix(s0?.unit || "") + fmtValue(fallbackVal, s0?.unit, headCompact()), when: rangeLabel(ds) };
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
  const pd = pd0;
  const numParts = (pd.parts && pd.parts.length) ? pd.parts.length : 1;
  const LEG_ROW = 24;
  const totalLegH = numParts * LEG_ROW;
  const maxDial = Math.max(64, HH - totalLegH - 10);
  const size = Math.max(68, Math.min(HW * 0.48, maxDial, 105));
  const variant = card.variant || defaultVariant(card.chart);
  const cx = size/2, cy = size/2, R = size/2 - 3;
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
  // Guarantee all categories fit without folding or cutting off
  const useRows = pd.parts.slice(0, Math.min(6, numParts));
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
        <button class="ck-leg-r" data-i="${i}" title="${esc(p.name)}">
          <span class="ck-leg-d" style="background:${p.color}"></span>
          <span class="ck-leg-n">${esc(p.name)}</span>
          <span class="ck-leg-v">${unitPrefix(pd.unit)}${fmtValue(p.value, pd.unit, true)}</span>
          <span class="ck-leg-p">${Math.round(p.value / (pd.total || 1) * 100)}%</span>
        </button>`).join("")}${moreN > 0 ? `
        <span class="ck-leg-more">+ ${moreN} more</span>` : ""}</div>
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
  const size = Math.min(Math.max(60, S - 12), 250);
  const live = liveReading(card);
  const liveVal = typeof live?.data?.value === 'number' ? live.data.value : (typeof live?.data === 'number' ? live.data : null);
  const rd = readingOf(card.key);
  const vals = valuesFor(card.key, card.period, rd.unit);
  const v = liveVal !== null ? liveVal : (vals.length ? vals[vals.length - 1] : 0);
  const max = rd.unit === "percent" ? 100 : Math.ceil(Math.max(...(vals.length ? vals : [v, 1])) * 1.25);
  const frac = Math.max(0, Math.min(1, max > 0 ? v / max : 0));
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
  if (renderDataState(host, card)) return;
  const { W, H } = hostDimensions(host, card);
  const m = { l:44, r:12, t:10, b:26 }, pw = W-m.l-m.r, ph = H-m.t-m.b;
  const rd = readingOf(card.key);
  const live = liveReading(card);
  const sourceRows = live?.data?.rows || live?.data?.series || [];
  const pts = sourceRows.map((point, index) => ({
    x: Number(point.x ?? index) / Math.max(1, sourceRows.length - 1),
    y: Number(point.y ?? point.value ?? 0),
    w: Number(point.w ?? point.weight ?? 4),
  }));
  if (!pts.length){ host.innerHTML = `<div class="ck-state is-empty" role="status">No data in this period.</div>`; return; }
  const maxY = Math.max(...pts.map(point => Math.abs(point.y)), 1);
  pts.forEach(point => { point.y = Math.max(0, Math.min(1, point.y / maxY)); });
  const xs = niceTicks(0, 100, 5), ys = niceTicks(0, 100, 5);
  const grid = ys.ticks.map(v => { const y = m.t+ph-(v/100)*ph;
    return `<line class="ck-grid" x1="${m.l}" x2="${W-m.r}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"/>
            <text class="ck-lab" x="${m.l-8}" y="${(y+4).toFixed(1)}" text-anchor="end">${v}</text>`; }).join("");
  const xlab = xs.ticks.map(v => { const x = m.l+(v/100)*pw;
    return `<text class="ck-lab" x="${x.toFixed(1)}" y="${H-8}" text-anchor="middle">${v}</text>`; }).join("");
  const variant = card.variant || "dots";
  const dots = pts.map((p,i) => `<circle class="ck-sc" data-i="${i}" cx="${(m.l+p.x*pw).toFixed(1)}"
    cy="${(m.t+ph-p.y*ph).toFixed(1)}" r="${variant==="bubble"?p.w.toFixed(1):4.5}"
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

  renderDataState(host, card);
}

function mountTable(host, card){
  const { H } = hostDimensions(host, card);
  const pd = buildParts(card.key, card.period, readingOf(card.key)?.rowNames);
  const capacity = Math.max(3, Math.floor((H - 4) / 38));
  const rows = pd.parts.slice(0, Math.min(8, capacity)), mx = (rows[0]?.value || 1);
  const variant = card.variant || "rows";
  const isPct  = pd.unit === "percent" || pd.unit === "pct" || rows.some(r => Math.abs(r?.value||0) <= 100 && String(r?.name||'').length > 0);
  const color  = (i) => `var(--vq-series-${(i%6)+1})`;
  host.innerHTML = `<div class="ck-tb ck-tb--rank">${rows.map((p,i) => {
    const pct = ((p?.value || 0) / mx * 100).toFixed(0);
    const valTxt = unitPrefix(pd.unit) + fmtValue(p?.value || 0, pd.unit, true);
    return `
    <div class="ck-tr" style="--d:${i*40}ms;--pct:${pct}%;--clr:${color(i)}">
      <span class="ck-rank-n">${i+1}</span>
      <span class="ck-tn" title="${esc(p.name)}">${esc(p.name)}</span>
      <span class="ck-tpct">${valTxt}</span>
    </div>`;
  }).join("")}</div>`;
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

  const pd = buildParts(card.key, card.period, readingOf(card.key)?.rowNames);
  const times = timeline(card.period).slice(-6).reverse();
  const rows = pd.parts.slice(0, Math.min(6, capacity)), mx = (rows[0]?.value || 1);
  host.innerHTML = `<div class="ck-tb ${bars ? "is-bars" : ""}">${rows.map((p,i) => `
    <div class="ck-tr" style="--d:${i*45}ms">
      ${bars ? "" : `<span class="ck-fd" style="background:${p?.color || "var(--vq-series-1)"}"></span>`}
      <span class="ck-tn">${p.name}</span>
      ${bars ? `<span class="ck-tbar"><i style="width:${((p?.value || 0)/mx*100).toFixed(0)}%;background:${p?.color || "var(--vq-series-1)"}"></i></span>`
             : `<span class="ck-tt">${fullLabel(times[i] || times[0], PERIOD[card.period].grain)}</span>`}
      <b class="ck-tv">${unitPrefix(pd.unit)}${fmtValue(p?.value || 0, pd.unit, true)}</b>
    </div>`).join("")}</div>`;
}

function mountSankey(host, card){
  const { W, H } = hostDimensions(host, card);
  const pd = buildParts(card.key, card.period, readingOf(card.key)?.sliceNames);
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
  if (renderDataState(host, card)) return;
  const rd = readingOf(card.key);
  const live = liveReading(card);
  const sourceRows = live?.data?.rows || live?.data?.regions || [];
  const regs = sourceRows.map(row => ({
    n: row.name ?? row.region ?? row.label ?? "—",
    v: Number(row.value ?? row.total ?? row.count ?? 0),
  }));
  if (!regs.length){ host.innerHTML = `<div class="ck-state is-empty" role="status">No regional data in this period.</div>`; return; }
  regs.sort((a,b) => b.v - a.v);
  const mx = regs[0].v;
  if (card.variant === "list"){
    const capacity = Math.max(2, Math.floor((host.clientHeight - 4) / 38));
    host.innerHTML = `<div class="ck-tb">${regs.slice(0, capacity).map((g,i)=>`<div class="ck-tr" style="--d:${i*45}ms">
      <span class="ck-rank">${i+1}</span><span class="ck-tn">${g.n}</span>
      <span class="ck-tbar"><i style="width:${(g.v/mx*100).toFixed(0)}%;background:var(--vq-seq-${Math.min(4,Math.floor(g.v/mx*5))+1})"></i></span>
      <b class="ck-tv">${unitPrefix(rd.unit)}${fmtValue(g.v, rd.unit, true)}</b></div>`).join("")}</div>`;
    return;
  }
  /* a tinted fill behind normal text, rather than text on a saturated tile —
     the sequential scale inverts between themes and would strand the label */
  host.innerHTML = `<div class="ck-geo">${regs.map((g,i)=>`
    <div class="ck-geo-c" style="--d:${i*55}ms">
      <i class="ck-geo-f" style="width:${(g.v/mx*100).toFixed(0)}%;background:var(--vq-seq-${Math.min(4,Math.floor(g.v/mx*5))+1})"></i>
      <span>${g.n}</span><b>${unitPrefix(rd.unit)}${fmtValue(g.v, rd.unit, true)}</b></div>`).join("")}</div>`;
}

function mountSparkline(host, card){
  const { W, H } = hostDimensions(host, card);
  const rd = readingOf(card.key);
  const vals = valuesFor(card.key, card.period, rd.unit);
  const times = timeline(card.period), grain = PERIOD[card.period].grain;
  const rawMn = Math.min(...vals), rawMx = Math.max(...vals);
  const span = Math.max(1, rawMx - rawMn);
  /* 42% top headroom and 14% bottom floor gives the organic flowing Catmull-Rom
     curves full space to peak and wave naturally with zero clipping or flattening. */
  const mn = rawMn < 0 ? rawMn - span * 0.16 : Math.max(0, rawMn - span * 0.12);
  const mx = rawMx + span * 0.42;
  const rg = (mx - mn) || 1;
  const n = vals.length;
  const padTop = 22, padBottom = 10, padX = 6;
  const availH = Math.max(10, H - padTop - padBottom);
  const pts = vals.map((v, i) => [
    (i * (W - padX * 2)) / Math.max(1, n - 1) + padX,
    H - padBottom - ((v - mn) / rg) * availH
  ]);
  const variant = card.variant || "area";
  const uid = "sp" + (++CHART_UID);
  let body;
  if (variant === "bars"){
    const bw = (W/n)*0.62;
    body = vals.map((v,i) => `<rect class="ck-bar" data-x="${i}" x="${(pts[i][0]-bw/2).toFixed(1)}"
      y="${pts[i][1].toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0, H-padBottom-pts[i][1]).toFixed(1)}" rx="2"
      fill="var(--vq-series-1-ink)"/>`).join("");
  } else {
    const d = pathSmooth(pts, 0.42);
    body = (variant === "area"
      ? `<defs><linearGradient id="${uid}" x1="0" y1="0" x2="0" y2="1">
         <stop offset="0%" stop-color="var(--vq-series-1-ink)" stop-opacity=".3"/>
         <stop offset="100%" stop-color="var(--vq-series-1-ink)" stop-opacity="0"/></linearGradient></defs>
         <path d="${d} L${P(pts[n-1][0],H)} L${P(pts[0][0],H)} Z" fill="url(#${uid})"/>` : "")
      + `<path class="ck-line" d="${d}" stroke="var(--vq-series-1-ink)" stroke-width="2.5"/>`;
  }
  host.innerHTML = `<svg class="ck ck--spark" width="${W}" height="${H}" style="overflow:visible">
    <g class="ck-plot" style="clip-path:none">${body}</g>
    <g class="ck-hover" style="opacity:0"><line class="ck-cross" y1="0" y2="${H}"/>
      <circle class="ck-hd" r="3.5" fill="var(--vq-surface)" stroke="var(--vq-series-1-ink)" stroke-width="2"/></g>
    <rect class="ck-cap" x="0" y="0" width="${W}" height="${H}" fill="transparent"/></svg>
    <div class="ck-tip ck-tip--sm" hidden></div>`;
  requestAnimationFrame(() => { const p = host.querySelector(".ck-plot"); if (p) p.style.clipPath = "none"; });

  const cap = host.querySelector(".ck-cap"), hov = host.querySelector(".ck-hover");
  const cross = host.querySelector(".ck-cross"), dot = host.querySelector(".ck-hd");
  const tip = host.querySelector(".ck-tip");
  const head = host.closest(".vqc")?.querySelector(".vqc-value[data-full] .nf");
  const sub  = host.closest(".vqc")?.querySelector(".vqc-when");
  const headCompact = () => head?.closest(".vqc-value")?.dataset.mode === "compact";
  const rest = () => {
    if (head) {
      const hl = headlineOf(card);
      setRoller(head, hl ? (headCompact() ? hl.valueCompact : hl.value) : (unitPrefix(rd.unit) + fmtValue(vals[n-1], rd.unit, headCompact())));
    }
    if (sub) sub.textContent = card.period + " · " + tickLabel(times[0],grain) + " – " + tickLabel(times[n-1],grain);
  };
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
  if (renderDataState(host, card)) return;
  const rd = readingOf(card.key);
  const times = timeline(card.period), grain = PERIOD[card.period].grain;
  const live = liveReading(card);
  const status = live?.data || {};
  const ok = status.severity === "ok" || status.state === "balanced" || status.ok === true;
  const state = status.label || status.state || (ok ? "OK" : "Needs review");
  const body = (card.variant === "dot")
    ? `<span class="ck-dotstate ${ok ? "is-ok" : "is-warn"}"><i></i><b>${state}</b></span>`
    : `<span class="ck-badge ${ok ? "is-ok" : "is-warn"}"><i></i>${state}</span>`;
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
  stat: mountStat, status: mountStatus, list: mountTable,
};
function mountChart(host, card){
  if (!host) return;
  if (!isSpecial(card) && renderDataState(host, card)) return;
  const shape = String(readingOf(card.key)?.shape || "").toUpperCase();
  const legacyTimeChart = CARTESIAN.has(card.chart) || ["sparkline", "stat", "gauge", "ring"].includes(card.chart);
  if (shape === "RANKING" && (card.chart === "bar" || legacyTimeChart)) return mountTable(host, card);
  if (shape === "BREAKDOWN" && legacyTimeChart) return mountRadial(host, { ...card, chart: "pie" });
  if (shape === "TABLE" && legacyTimeChart) return mountTable(host, card);
  if (shape === "FEED" && legacyTimeChart) return mountFeed(host, card);
  if (CARTESIAN.has(card.chart)) return mountCartesian(host, card);
  if (RADIAL.has(card.chart))    return mountRadial(host, card);
  const fn = MOUNT[card.chart];
  if (fn) return fn(host, card);
}

/* ══ board, editor, library, builder ═══════════════════════════════════════ */

/* Every reading carries a value over time, so every reading can take a time
   chart. Shape decides what is *natural*, not what is permitted. */
let LEGAL = {};
let CHART_NAME = {};
let MIN_CAT = {};
let CATS = [];
let CAT_NAME = {};
let FITS = {};
let DEFAULT_FIT = {};
let GRID = {};

/* ══ Layout Law §6 — the allowed-size system ═══════════════════════════════
   A category is a list of FITS (the interiors) plus a MAX rectangle. A size is
   legal for a category when it is at least as large as one of that category's
   fits and no larger than the category's maximum. Everything the UI offers is
   generated from this — no hand-written size list may exist anywhere else,
   because a hand-written list is how a card ends up wider than the grid. */
let CAT_MAX = {};
let CAT_DESC = {};

const chartKey = key => ({ profit_loss_line: "pl", live_line: "live" }[key] || key);
function setLayoutLaw(law){
  if (!law || !law.categories || !law.chartLegality || !law.chartCategories) return false;
  const categories = law.categories;
  GRID = {
    cols: Number(law.grid.columns),
    unit: Number(law.grid.unit),
    gutter: Number(law.grid.gutter),
  };
  CATS = Object.keys(categories).filter(key => /^C\d+$/.test(key));
  CAT_NAME = Object.fromEntries(CATS.map(key => [key, categories[key].name]));
  CAT_DESC = Object.fromEntries(CATS.map(key => [key, categories[key].role]));
  CAT_MAX = Object.fromEntries(CATS.map(key => [key, [Number(categories[key].max.w), Number(categories[key].max.h)]]));
  FITS = Object.fromEntries(CATS.map(key => [key, categories[key].fits.map(fit => [Number(fit.w), Number(fit.h), fit.key, Number(fit.floor)])]));
  DEFAULT_FIT = Object.fromEntries(CATS.map(key => {
    const found = categories[key].fits.findIndex(fit => fit.default === true);
    return [key, found < 0 ? 0 : found];
  }));
  LEGAL = Object.fromEntries(Object.entries(law.chartLegality)
    .filter(([shape]) => !shape.startsWith("$"))
    .map(([shape, charts]) => [shape, charts.map(chartKey)]));
  MIN_CAT = Object.fromEntries(Object.entries(law.chartCategories)
    .filter(([chart]) => !chart.startsWith("$"))
    .map(([chart, cats]) => [chartKey(chart), cats[0]]));
  CHART_NAME = Object.fromEntries([...new Set(Object.values(LEGAL).flat())].map(chart => [
    chart,
    ({ stat:"Number", pl:"Profit / loss", live:"Live line", composed:"Combo", choropleth:"Regions" }[chart]
      || chart.replaceAll("_", " ").replace(/^./, c => c.toUpperCase())),
  ]));
  if (typeof window !== "undefined") window.__VENQORE_LAYOUT_LAW__ = law;
  return true;
}

setLayoutLaw((opts && opts.layoutLaw) || (typeof window !== "undefined" && window.__VENQORE_LAYOUT_LAW__));
if (!CATS.length) throw new Error("[VenQoreCards] Layout Law was not provided by the server.");
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
  custom_button:  { cat:"C1", min:[1,1], cats:["C1"], family:"shortcut",
                    eyebrow:"SHORTCUT", name:"Shortcut", sub:"One-click jump" },
  launchpad:      { cat:"C4", min:[3,2], cats:["C3","C4","C5"], family:"hub",
                    eyebrow:"LAUNCHPAD", name:"Launchpad",
                    sub:"Your four essentials — always the same four" },
};
const isSpecial = c => !!(c && c.type && SPECIAL[c.type]);
/* Hubs are laid out on their own ladder rather than the reading ladder: a hub
   is a row of items, so its fits trade columns for rows exactly like C4's. */
/** The fit ladder a card resolves against — hubs stack shallower than charts. */
const fitsTable = () => FITS;

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
  const frameSlot = FRAME_SLOTS.find(slot => Number(slot.slot) === Number(card.frameSlot));
  if (frameSlot && (cols || 12) >= 12) {
    const sw = Number(frameSlot.w);
    const sh = Number(frameSlot.h);
    const scat = frameSlot.category || card.cat || "C4";
    const T = fitsTable(card);
    const [gw, gh] = fitToGrid(sw, sh, cols);
    return {
      w: gw,
      h: gh,
      authoredW: sw,
      authoredH: sh,
      cat: scat,
      colW: colW || COL_W,
      fit: resolveFit(scat, gw, gh, T) ?? 0,
      clamped: false,
    };
  }
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
let ACTIVE_FRAME = (opts && opts.activeFrame) || null;
let FRAME_SLOTS = Array.isArray(opts && opts.frameSlots) ? opts.frameSlots : [];
let FRAME_DIRTY = !!(opts && opts.frameDirty);
let DASHBOARD_ID = (opts && opts.dashboardId) || null;
let SAVE_LAYOUT_TIMER = null;
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
  const live = liveReading(card);
  const times = timeline(card.period), grain = PERIOD[card.period].grain;

  if (live?.status === "unavailable") {
    return {
      value: "—",
      valueCompact: "—",
      dir: "up", pct: "",
      when: live.error?.message || "Not available yet",
    };
  }

  if (live && live.ok && (live.data !== undefined && live.data !== null || live.value !== undefined)) {
    let last = null;
    let prev = null;
    let hasDelta = false;

    if (typeof live.data === 'number') {
      last = live.data;
    } else if (typeof live.data === 'object' && live.data !== null) {
      if (live.data.value !== undefined && live.data.value !== null) {
        last = Number(live.data.value);
        if (live.data.previous !== undefined && live.data.previous !== null) {
          prev = Number(live.data.previous);
          hasDelta = true;
        } else if (live.data.comparison?.previous !== undefined && live.data.comparison?.previous !== null) {
          prev = Number(live.data.comparison.previous);
          hasDelta = true;
        }
      } else if (live.value !== undefined && live.value !== null) {
        last = Number(live.value);
      } else if (live.data.total !== undefined && live.data.total !== null) {
        last = Number(live.data.total);
      } else if (live.data.current !== undefined && live.data.current !== null) {
        last = Number(live.data.current);
        if (live.data.previous !== undefined && live.data.previous !== null) {
          prev = Number(live.data.previous);
          hasDelta = true;
        } else if (live.data.comparison?.previous !== undefined && live.data.comparison?.previous !== null) {
          prev = Number(live.data.comparison.previous);
          hasDelta = true;
        }
      } else if (Array.isArray(live.data.slices) && live.data.slices.length > 0) {
        last = live.data.slices.reduce((acc, x) => acc + (x.value !== undefined && x.value !== null ? Number(x.value) : 0), 0);
      } else {
        const seriesSource = live.data.series || live.data.points || live.series;
        if (Array.isArray(seriesSource) && seriesSource.length > 0) {
          if (live.data.total !== undefined && live.data.total !== null) {
            last = Number(live.data.total);
          } else if (live.value !== undefined && live.value !== null) {
            last = Number(live.value);
          } else {
            const nonZeroPts = seriesSource.filter(pt => {
              const v = pt?.y ?? pt?.value ?? (typeof pt === 'number' ? pt : null);
              return v !== null && v !== undefined && v !== 0;
            });
            const chosenPt = nonZeroPts.length ? nonZeroPts[nonZeroPts.length - 1] : seriesSource[seriesSource.length - 1];
            const rawVal = chosenPt?.y ?? chosenPt?.value ?? (typeof chosenPt === 'number' ? chosenPt : null);
            if (rawVal !== null && rawVal !== undefined) {
              last = Number(rawVal);
            }
          }
          if (seriesSource.length > 1) {
            const prevPt = seriesSource[seriesSource.length - 2];
            const rawPrev = prevPt?.y ?? prevPt?.value ?? (typeof prevPt === 'number' ? prevPt : null);
            if (rawPrev !== null && rawPrev !== undefined) {
              prev = Number(rawPrev);
              hasDelta = true;
            }
          }
        }
      }
    } else if (typeof live.value === 'number') {
      last = live.value;
    }

    if (last === null || isNaN(last)) {
      return {
        value: "—",
        valueCompact: "—",
        dir: "up", pct: "",
        when: card.period + " · " + tickLabel(times[0], grain) + " – " + tickLabel(times[times.length-1], grain),
      };
    }

    let pctNum = null;
    if (hasDelta && prev !== null && !isNaN(prev) && prev !== 0) {
      pctNum = ((last - prev) / Math.abs(prev)) * 100;
    } else if (live.delta?.pct !== undefined && live.delta?.pct !== null) {
      pctNum = Number(live.delta.pct);
    } else if (live.data?.comparison?.percent !== undefined && live.data?.comparison?.percent !== null) {
      pctNum = Number(live.data.comparison.percent);
    } else if (live.data?.change_pct !== undefined && live.data?.change_pct !== null) {
      pctNum = Number(live.data.change_pct);
    } else if (live.data?.delta_pct !== undefined && live.data?.delta_pct !== null) {
      pctNum = Number(live.data.delta_pct);
    }

    const dir = (pctNum === null || pctNum >= 0) ? "up" : "down";
    const pct = pctNum !== null && !isNaN(pctNum) ? (Math.abs(pctNum).toFixed(1) + "%") : "";
    const freshness = live.meta?.freshness || "live";
    const asOf = live.meta?.computed_at || null;

    return {
      value: unitPrefix(rd.unit) + fmtValue(last, rd.unit),
      valueCompact: unitPrefix(rd.unit) + fmtValue(last, rd.unit, true),
      dir, pct,
      when: card.period + " · " + tickLabel(times[0], grain) + " – " + tickLabel(times[times.length-1], grain),
      freshness,
      asOf,
    };
  }

  const pending = PENDING_RECKONER_REQUESTS.has(reqKey)
    || PENDING_RECKONER_REQUESTS.has(`${card.key}|${toReckonerPeriod(card.period)}`);
  return {
    value: "—",
    valueCompact: "—",
    dir: "up", pct: "",
    when: pending ? "Loading data…" : "No activity recorded",
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
    clamped ? "is-clamped" : "",
    `vqc--fit-${opts.geo.fit}`,
  ].filter(Boolean).join(" ");
  /* --vqw / --vqh let the stylesheet reason about a card's own span without a
     container query, so an interior can thin out at 2 rows and fill out at 6. */
  const frameSlot = FRAME_SLOTS.find(slot => Number(slot.slot) === Number(c.frameSlot));
  const is12 = (opts.cols || 12) >= 12;
  const pinned = ((frameSlot && is12)
    || (Number.isInteger(c.gx) && Number.isInteger(c.gy) && is12));
  const colSpan = (frameSlot && is12) ? Number(frameSlot.w) : w;
  const rowSpan = (frameSlot && is12) ? Number(frameSlot.h) : h;
  const colStart = (frameSlot ? Number(frameSlot.x) : c.gx) + 1;
  const rowStart = (frameSlot ? Number(frameSlot.y) : c.gy) + 1;
  const place = pinned
    ? `grid-column:${colStart} / span ${colSpan};grid-row:${rowStart} / span ${rowSpan};`
    : "";
  return `<article class="${cls}" data-id="${c.id}" data-cat="${cat}" data-w="${colSpan}" data-h="${rowSpan}"
    tabindex="0" draggable="false"
    style="--i:${CARDS.indexOf(c)};--vqw:${colSpan};--vqh:${rowSpan};${place}">
    ${opts.body}
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
  const bankAccounts = DASHBOARD_RUNTIME_DATA.bankAccounts || [];
  const cashAccounts = DASHBOARD_RUNTIME_DATA.cashAccounts || [];
  const cashOnHand = Number(DASHBOARD_RUNTIME_DATA.cashData?.balance || 0);
  const bankTotal = bankAccounts.reduce((sum, account) => sum + Number(account.current_balance || 0), 0);
  const cashAccountTotal = cashAccounts.reduce((sum, account) => sum + Number(account.current_balance || 0), 0);
  const boxes = [
    { l:'Bank Accounts',   v:bankTotal, s:`${bankAccounts.length} accounts active` },
    { l:'Cash on Hand',    v:cashOnHand, s:'Ledger balance' },
    { l:'Total Liquid Net',v:bankTotal + cashAccountTotal + cashOnHand, s:'Current balance', total:true },
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
  /* each alert belongs to the module that raised it — a store without that
     module never sees the row */
  const modOk = mods => !ENABLED_MODULES || !mods.length || mods.some(m => ENABLED_MODULES.has(m));
  const lowStockCount = (DASHBOARD_RUNTIME_DATA.lowStockItems || []).length;
  const rows = (lowStockCount > 0 ? [
    { k:'warning', mods:['inventory'], href: storePath('/inventory'), msg:`<strong>${lowStockCount} products</strong> reached safety reorder limit`, cta:'Reorder' },
  ] : []).filter(r => modOk(r.mods));
  /* one row per row-track above the header — never more than will fit */
  const room = Math.max(1, Math.min(rows.length, Math.floor((geo.h - 1) * 88 / 46)));
  return hubHead(c, SPECIAL.alerts_hub.eyebrow, link) +
    `<div class="vqc-alerts-list">${rows.length ? rows.slice(0, room).map(r => `
      <a href="${esc(r.href)}" class="vqc-alert-item vqc-alert-item--${r.k}">
        <span class="vqc-alert-dot"></span>
        <span class="vqc-alert-msg">${r.msg}</span>
        <span class="vqc-alert-btn">${esc(r.cta)} &rarr;</span>
      </a>`).join("") : '<p class="vq-rail-empty">No actions required</p>'}</div>`;
}

function bodyGrowthEngine(c, geo){
  const link = c.targetUrl || c.link || storePath('/reports');
  return hubHead(c, SPECIAL.growth_engine.eyebrow, link) +
    `<div class="vqc-hub-title-wrap"><div class="vqc-action-hub-title">${esc(titleOf(c))}</div>
      <div class="vqc-action-hub-sub">${esc(SPECIAL.growth_engine.sub)}</div></div>` +
    `<div class="vqc-growth-grid"><p class="vq-rail-empty">No growth data yet</p></div>`;
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

const SPECIAL_BODY = {
  action_hub: bodyActionHub, bank_liquidity: bodyBankLiquidity,
  alerts_hub: bodyAlertsHub, growth_engine: bodyGrowthEngine,
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
  const delta = (c.showDelta === false || !hl.pct) ? "" :
    `<span class="vqc-delta vqc-delta--${hl.dir}">${ic(hl.dir,10)}${hl.pct}</span>`;
  const tight = px < 320;                      /* a phone-width strip */
  const when = c.showWhen === false ? "" : `<span class="vqc-when">${esc(c.period)}</span>`;
  const stacked = Boolean(c.stacked || geo.h >= 2);
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

function getDomainColor(key, area){
  const k = String(key || "").toLowerCase();
  const a = String(area || "").toLowerCase();
  if (k.startsWith("sales") || a.includes("sale")) return "#10B981"; // Emerald
  if (k.startsWith("finance") || k.startsWith("accounting") || a.includes("finance") || a.includes("money")) return "#F59E0B"; // Amber
  if (k.startsWith("inventory") || a.includes("stock") || a.includes("inventory")) return "#8B5CF6"; // Violet
  if (k.startsWith("party") || k.includes("customer") || a.includes("party")) return "#0EA5E9"; // Sky
  if (k.startsWith("purchase") || a.includes("buy")) return "#EC4899"; // Pink
  return "#14B8A6";
}

function bodyChartCard(c, geo, link){
  const title = titleOf(c);
  const rd = readingOf(c.key);
  const shape = String(rd?.shape || "").toUpperCase();
  const hl = headlineOf(c);
  const keys = [c.key, ...(c.extraKeys || [])];
  const legend = (keys.length > 1 && CARTESIAN.has(c.chart))
    ? `<div class="vqc-leg">${keys.map((k,i) => `<button type="button" class="vqc-leg-i" data-i="${i}">
        <span class="vqc-leg-d" style="background:var(--vq-series-${(i%8)+1})"></span>${esc(readingOf(k).label)}</button>`).join("")}</div>`
    : "";
  /* the number is suppressed only when the chart already draws it in its centre */
  const selfLabelled = c.chart === "gauge" || c.chart === "ring" || c.chart === "sunburst"
    || (c.chart === "pie" && c.variant === "donut");
  
  // List/table/ranking/feed cards NEVER display a standalone "Rs 0" or "0" metric
  const isList = shape === "RANKING" || shape === "TABLE" || shape === "FEED"
    || ["table", "list", "feed", "ranking"].includes(c.chart);

  const showHead = c.chart !== "status" && !selfLabelled && !isList;
  const room = geo.h;
  const showWhen   = c.showWhen !== false && c.chart !== "status" && !isList && room >= 4;
  const showDelta  = c.showDelta !== false && !isList && geo.w >= 2;
  /* List/ranking/table/feed cards don't need a period picker — there is no
     headline number on them and the period context is obvious from the data. */
  const showPicker = c.showPeriodPicker !== false && PREFS.periodPicker
                     && room >= 2 && geo.w >= 3 && !isList;

  return `<div class="vqc-hd">
      <span class="vqc-eyebrow" title="${esc(title)}">${esc(title)}</span>
      <span class="vqc-hd-r">${showPicker ? periodPicker(c) : ""}${cardTools(c, link)}</span>
    </div>
    <div class="vqc-bd">
      ${showHead ? `<div class="vqc-head">
        ${valueHTML(hl)}
        ${(showDelta && hl.pct) ? `<span class="vqc-delta vqc-delta--${hl.dir}">${ic(hl.dir,10)}${hl.pct}</span>` : ""}
      </div>` : ""}
      ${showWhen ? `<p class="vqc-when"${hl.asOf ? ` title="As of ${esc(hl.asOf)}"` : ''}>${esc(hl.when)}</p>` : ""}
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

function ensureAllSlotsFilled(){
  if (!FRAME_SLOTS || !FRAME_SLOTS.length) return;
  const occupiedSlots = new Set(CARDS.map(c => Number(c.frameSlot)).filter(Number.isFinite));
  const usedKeys = new Set(CARDS.map(c => c.key).filter(Boolean));

  FRAME_SLOTS.forEach(slot => {
    const slotNum = Number(slot.slot);
    if (!occupiedSlots.has(slotNum)) {
      const availReading = READINGS.find(r => !usedKeys.has(r.key) && readingAvailable(r))
        || READINGS.find(r => readingAvailable(r))
        || READINGS[0];
      if (availReading) {
        usedKeys.add(availReading.key);
        const fitIndex = (FITS[slot.category] || []).findIndex(fit => fit[2] === slot.fit);
        CARDS.push(normaliseCard({
          id: newId(),
          key: availReading.key,
          chart: legalFor(availReading.key)[0] || "stat",
          period: "Month",
          frameSlot: slotNum,
          gx: Number(slot.x),
          gy: Number(slot.y),
          w: Number(slot.w),
          h: Number(slot.h),
          cat: slot.category,
          fit: fitIndex < 0 ? (DEFAULT_FIT[slot.category] || 0) : fitIndex,
          variant: "spark",
          accent: slotNum === 1,
        }));
        occupiedSlots.add(slotNum);
      }
    }
  });
}

function draw(){
  const board = document.getElementById("board");
  if (!board) return;
  const cols = boardCols(board);
  COL_W = boardColW(board);
  LAST_COLS = cols;
  if (cols >= 12 && FRAME_SLOTS && FRAME_SLOTS.length) {
    ensureAllSlotsFilled();
  }
  HOST_RO?.disconnect();
  const cardsHtml = CARDS.map(c => renderCard(c, cols)).join("");
  board.innerHTML = cardsHtml
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
      setTimeout(() => { CARDS = CARDS.filter(x => x.id !== c.id); markFrameDirty(); if (EDIT === c.id) closeEdit(); draw(); }, 200);
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
      delete c.frameSlot;
      markFrameDirty();
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
      delete c.frameSlot;
      markFrameDirty();
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
  /* The panel is a slide-over that starts closed. Rebuilding rows into a
     hidden element on every single draw is work nobody sees. */
  const panel = document.getElementById("lib");
  if (panel && !panel.classList.contains("is-on")) return;
  const on = new Set(CARDS.map(c => c.key));
  const q = LIB_Q.trim().toLowerCase();

  // Categories per §8: Modules enabled + Qore
  const modulesSet = new Set();
  READINGS.forEach(r => {
    if (r.module) modulesSet.add(r.module);
  });
  const areas = ["All", "Qore", ...Array.from(modulesSet).filter(m => m !== "Qore").sort()];

  const list = READINGS.filter(r => {
    if (LIB_AREA !== "All") {
      if (LIB_AREA === "Qore" && r.module !== "Qore") return false;
      if (LIB_AREA !== "Qore" && r.module !== LIB_AREA) return false;
    }
    if (!q) return true;
    return r.label.toLowerCase().includes(q) ||
      r.key.toLowerCase().includes(q) ||
      (r.desc && r.desc.toLowerCase().includes(q)) ||
      (r.insight && r.insight.toLowerCase().includes(q));
  }).sort((a, b) => (b.weight || 50) - (a.weight || 50));

  box.innerHTML = `
    <div class="lib-find">${ic("search",14)}<input id="lib-q" placeholder="Search ${READINGS.length} cards by name or insight…" value="${LIB_Q.replace(/"/g,"&quot;")}"></div>
    <div class="lib-tabs">${areas.map(a =>
      `<button class="lib-tab ${a === LIB_AREA?"is-on":""}" data-a="${a}">${a === "Qore" ? "🔒 Qore" : a}</button>`).join("")}</div>
    <div class="lib-list">${list.length ? list.map(r => `
      <div class="lib-row ${on.has(r.key)?"is-added":""}">
        <span class="lib-row-n">${r.label}</span>
        <span class="lib-row-k">${r.insight || r.desc || r.key}</span>
        <span class="lib-shape">${r.shape}</span>
        <button class="lib-add" data-k="${r.key}" title="${on.has(r.key) ? 'Already on dashboard' : 'Add card'}">${on.has(r.key)?ic("check",13):ic("plus",13)}</button>
      </div>`).join("") : `<p class="lib-none">Nothing matches “${LIB_Q}”.</p>`}</div>`;
  const qi = box.querySelector("#lib-q");
  if (qi) {
    qi.oninput = () => { LIB_Q = qi.value; renderLibrary();
      const el = document.getElementById("lib-q"); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } };
  }
  box.querySelectorAll(".lib-tab").forEach(b => b.onclick = () => { LIB_AREA = b.dataset.a; renderLibrary(); });
  box.querySelectorAll(".lib-add").forEach(b => b.onclick = () => {
    const c = addCard(b.dataset.k); if (c) openEdit(c.id); });
}

/* ── persistence ───────────────────────────────────────────────────────────
   The board a person builds is theirs: every change is written to this
   browser, per store, and comes back on the next visit. A reset swaps in a
   starting layout rather than silently destroying their work. */
const BOARD_KEY = () => `vq-dashboard-v6:${STORE_SLUG || "default"}`;
const BOARD_SCHEMA_VERSION = 4;
let SKIP_LEGACY_SERVER_LAYOUT = false;
let PERSIST_ON = false;            /* off until the first board is in place */
function persistBoard(){
  if (!PERSIST_ON || typeof localStorage === "undefined") return;
  try { localStorage.setItem(BOARD_KEY(), JSON.stringify({ v: BOARD_SCHEMA_VERSION, cards: CARDS })); }
  catch {}
}

function serverCard(c){
  if (!c.key || c.type) return null;
  const [w, h] = authoredSizeOf(c);
  const fit = (FITS[c.cat] || [])[c.fit]?.[2];
  return {
    id: /^[0-9a-f-]{32,36}$/i.test(String(c.id || "")) ? c.id : undefined,
    reading_key: c.key,
    chart: ({ pl:"profit_loss_line", live:"live_line" }[c.chart] || c.chart),
    period: ({ Today:"today", Week:"this_week", Month:"this_month", Quarter:"this_quarter", Year:"this_year" }[c.period] || "this_month"),
    category: c.cat,
    fit,
    w,
    h,
    x: Number.isInteger(c.gx) ? c.gx : 0,
    y: Number.isInteger(c.gy) ? c.gy : 0,
    frame_slot: Number.isFinite(Number(c.frameSlot)) ? Number(c.frameSlot) : null,
    style: { variant: c.variant, accent: !!c.accent },
  };
}
function saveServerLayout(){
  if (!DASHBOARD_ID || typeof axios === "undefined") return;
  clearTimeout(SAVE_LAYOUT_TIMER);
  SAVE_LAYOUT_TIMER = setTimeout(() => {
    const cards = CARDS.map(serverCard).filter(Boolean);
    axios.put(`/api/dashboards/${DASHBOARD_ID}/layout`, { cards, frame_dirty: FRAME_DIRTY })
      .catch(error => console.error("[VenQoreCards] Could not save dashboard layout.", error));
  }, 250);
}
function markFrameDirty(){
  FRAME_DIRTY = true;
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("vq:frame-dirty", { detail: true }));
  saveServerLayout();
}
function setFrame(frameKey, slots){
  ACTIVE_FRAME = frameKey;
  FRAME_SLOTS = Array.isArray(slots) ? slots : [];
  FRAME_DIRTY = false;

  const oldCards = [...CARDS];
  const usedKeys = new Set();
  const newCards = [];

  FRAME_SLOTS.forEach((slot) => {
    let matched = oldCards.find(c => !usedKeys.has(c.key) && c.cat === slot.category);
    if (!matched) matched = oldCards.find(c => !usedKeys.has(c.key));
    if (!matched) {
      const availReading = READINGS.find(r => !usedKeys.has(r.key) && readingAvailable(r))
        || READINGS.find(r => readingAvailable(r))
        || READINGS[0];
      if (availReading) {
        matched = {
          id: newId(),
          key: availReading.key,
          chart: legalFor(availReading.key)[0] || "stat",
          period: "Month",
          variant: "spark",
        };
      }
    }

    if (matched) {
      usedKeys.add(matched.key);
      const fitIndex = (FITS[slot.category] || []).findIndex(fit => fit[2] === slot.fit);
      newCards.push({
        ...matched,
        id: matched.id || newId(),
        frameSlot: Number(slot.slot),
        gx: Number(slot.x),
        gy: Number(slot.y),
        w: Number(slot.w),
        h: Number(slot.h),
        cat: slot.category,
        fit: fitIndex < 0 ? (DEFAULT_FIT[slot.category] || 0) : fitIndex,
        accent: Number(slot.slot) === 1,
      });
    }
  });

  CARDS = newCards.map(normaliseCard);
  draw();

  if (DASHBOARD_ID && typeof axios !== "undefined") {
    axios.put(`/api/dashboards/${DASHBOARD_ID}`, { frame_key: frameKey })
      .then(() => axios.get(`/api/dashboards/${DASHBOARD_ID}`))
      .then(response => {
        const cards = response?.data?.data?.cards;
        if (!Array.isArray(cards) || !cards.length) return;
        CARDS = availableCards(cards.map(bc => ({
          id: bc.id || newId(), key: bc.reading_key || bc.key, chart: chartKey(bc.chart),
          period: ({ today:"Today", this_week:"Week", this_year:"Year", this_quarter:"Quarter" }[bc.period] || "Month"),
          w: bc.w, h: bc.h, gx: bc.x, gy: bc.y, cat: bc.category || "C4",
          fit: Math.max(0, (FITS[bc.category] || []).findIndex(fit => fit[2] === bc.fit)),
          frameSlot: bc.frame_slot, variant: bc.style?.variant || defaultVariant(chartKey(bc.chart)),
          accent: !!bc.style?.accent,
        }))).map(normaliseCard);
        draw();
      })
      .catch(error => console.error("[VenQoreCards] Could not switch dashboard frame.", error));
  }
}
function loadBoard(){
  if (typeof localStorage === "undefined") return null;
  try {
    const data = JSON.parse(localStorage.getItem(BOARD_KEY()) || "null");
    if (data && data.v !== BOARD_SCHEMA_VERSION) SKIP_LEGACY_SERVER_LAYOUT = true;
    if (!data || data.v !== BOARD_SCHEMA_VERSION || !Array.isArray(data.cards) || !data.cards.length) return null;
    return availableCards(data.cards.filter(c => c && (c.type ? SPECIAL[c.type] : true)));
  } catch { return null; }
}

/** A card is only valid if the store's enabled modules can answer it. */
function availableCards(cards){
  return (cards || []).filter(c => c && (c.type
    ? specialAvailable(c.type)
    : (READINGS.some(r => r.key === c.key) && readingAvailable(readingOf(c.key)))));
}

/* ── boot ──────────────────────────────────────────────────────────────── */
function boot(frameKey){
  CARDS = []; EDIT = null;          /* a reset replaces the board, never doubles it */
  SKIP_LEGACY_SERVER_LAYOUT = false;
  PERSIST_ON = false;
  if (frameKey && FRAME_SLOTS.length){
    setFrame(frameKey, FRAME_SLOTS);
  } else {
    const saved = loadBoard();
    if (saved){
      let maxSeq = 0;
      saved.forEach(c => { const m = /^c(\d+)$/.exec(c.id || ""); if (m) maxSeq = Math.max(maxSeq, +m[1]); });
      SEQ = maxSeq;
      CARDS = saved.map(c => normaliseCard(c));
      draw();
    } else if (typeof axios !== 'undefined') {
      axios.get('/api/dashboards').then(res => {
        const list = res?.data?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          const activeBoard = list.find(b => b.is_default) || list[0];
          if (!SKIP_LEGACY_SERVER_LAYOUT && activeBoard && Array.isArray(activeBoard.cards) && activeBoard.cards.length > 0) {
            const backendCards = activeBoard.cards.map(bc => ({
              id: bc.id || newId(),
              key: bc.reading_key || bc.key,
              chart: chartKey(bc.chart),
              period: ({ today:"Today", this_week:"Week", this_year:"Year", this_quarter:"Quarter" }[bc.period] || "Month"),
              w: bc.w,
              h: bc.h,
              gx: bc.x,
              gy: bc.y,
              frameSlot: bc.frame_slot,
              cat: bc.category || 'C4',
              fit: bc.fit || 0,
              type: bc.type,
              variant: bc.variant || defaultVariant(chartKey(bc.chart)),
            }));
            CARDS = availableCards(backendCards).map(normaliseCard);
            DASHBOARD_ID = activeBoard.id || DASHBOARD_ID;
            ACTIVE_FRAME = activeBoard.frame_key || ACTIVE_FRAME;
            FRAME_DIRTY = !!activeBoard.frame_dirty;
            draw();
          }
        }
      }).catch(() => {});
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
  engineVersion: ENGINE_VERSION,
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
  setLayoutLaw: (law) => {
    if (setLayoutLaw(law)) draw();
  },
  setFrame,
  getFrame: () => ACTIVE_FRAME,
  isFrameDirty: () => FRAME_DIRTY,
  getCats: () => CATS,
  getCatNames: () => CAT_NAME,
  getCatDescs: () => CAT_DESC,
  getCatMax: () => CAT_MAX,
  getFits: () => FITS,
  getSpecialFits: () => FITS,
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
  setStoreSlug: (s) => {
    if (STORE_SLUG && STORE_SLUG !== s) clearReckonerDataCache();
    STORE_SLUG = s || "";
  },
  clearCache: clearReckonerDataCache,
  deepLinkFor: getDeepLinkForCard,
  catForSize: (card, w, h) => catForSize(normaliseCard({ ...card }), w, h),
  fitValues,
  setEnabledModules,
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
const catMaxFromLaw = law => Object.fromEntries(Object.entries(law?.categories || {})
  .filter(([key]) => /^C\d+$/.test(key))
  .map(([key, category]) => [key, [Number(category.max.w), Number(category.max.h)]]));

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
  { id: 'v6_cockpit', name: 'VenQore V6 Cockpit',
    desc: 'The complete pre-V6 financial sidebar — Total balance, instant action buttons, cash in hand with detail modal, stock valuation, bank accounts, and live activity feed.',
    rails: ['v6_cockpit'] },
  { id: 'classic_panel', name: 'Classic Right Panel',
    desc: 'The original dashboard right panel with quick action icons, cash balance, and live ledger feed.',
    rails: ['classic_panel'] },
  { id: 'dark_hub', name: 'Dark hub',
    desc: 'Deep ink panel with teal mesh — the pre-V6 look, as a standalone dark sidebar.',
    rails: ['action_trio', 'balances', 'activity'] },
  { id: 'money', name: 'Money desk',
    desc: 'The classic panel — action buttons, cash & accounts, live activity.',
    rails: ['action_trio', 'balances', 'activity'] },
  { id: 'operations', name: 'Operations desk',
    desc: 'What needs doing — alerts, today\'s numbers, quick actions.',
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
    desc: 'Just quick actions and today\'s numbers.',
    rails: ['quick_actions', 'today'] },
];

const RAIL_DEFS = [
  { id: 'v6_cockpit', name: 'VenQore V6 Financial Cockpit', modules: ['bank_accounts', 'pos'],
    desc: 'Total balance, instant action buttons, cash in hand, stock value, bank accounts and expanded activity.' },
  { id: 'classic_panel', name: 'Classic Right Panel', modules: ['bank_accounts'],
    desc: 'Original right panel with quick actions, cash balance, and activity feed.' },
  { id: 'action_trio', name: 'Action buttons', modules: [],
    desc: 'Sale, purchase and more actions \u2014 one tap each.' },
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

/* demo data the rails draw — the same seeded world the cards use */


/** One rail, rendered. Fixed-purpose, fixed-width; the board stays the
    place for anything the user wants to size and restyle. */
function DashRail({
  id, storePath, onQuickActions, enabledModules = [],
  cashData = null, bankAccounts = [], cashAccounts = [],
  recentTransactions = [], topSellingItems = [], lowStockItems = [],
  performance = {}, currencySymbol = 'Rs', isDemo = false, debtors = [],
}) {
  const modOk = mods => !enabledModules.length || !mods || !mods.length || mods.some(m => enabledModules.includes(m));

  if (id === 'v6_cockpit') {
    return (
      <V6FinancialSidebar
        recentTransactions={recentTransactions}
        bankAccounts={bankAccounts}
        cashAccounts={cashAccounts}
        cashData={cashData}
        inventoryValue={performance?.stock_value || 0}
        sticky={false}
        className="w-full"
      />
    );
  }

  if (id === 'classic_panel') {
    return (
      <RightPanel
        recentTransactions={recentTransactions}
        bankAccounts={bankAccounts}
        cashAccounts={cashAccounts}
        cashData={cashData}
        inventoryValue={performance?.stock_value || 0}
        sticky={false}
      />
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
    // Build account rows from real server data
    const allAccounts = [
      ...cashAccounts.map(a => ({ n: a.name || 'Cash', v: `${currencySymbol} ${(a.current_balance ?? 0).toLocaleString()}` })),
      ...bankAccounts.map(a => ({ n: a.name || a.bank_name || 'Bank', v: `${currencySymbol} ${(a.current_balance ?? 0).toLocaleString()}` })),
    ];
    const totalLiquid = [
      ...(cashAccounts || []).map(a => a.current_balance ?? 0),
      ...(bankAccounts || []).map(a => a.current_balance ?? 0),
    ].reduce((s, v) => s + v, 0);
    const cashBalance = cashData?.balance ?? 0;

    return (
      <section className="vq-rail-card">
        <header className="vq-rail-h"><span>Cash &amp; accounts</span><a href={storePath('/finance')} className="vq-rail-link">Open</a></header>
        <div className="vq-rail-hero">
          <span className="vq-rail-hero-l">Cash in hand</span>
          <span className="vq-rail-hero-v">{currencySymbol} {cashBalance.toLocaleString()}</span>
          <span className="vq-rail-hero-s">GL cash account</span>
        </div>
        {allAccounts.length > 0 ? (
          <ul className="vq-rail-list">
            {allAccounts.map(a => (
              <li key={a.n} className="vq-rail-row">
                <span className="vq-rail-row-n">{a.n}</span>
                <span className="vq-rail-row-v">{a.v}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="vq-rail-empty">No bank accounts added yet</p>
        )}
        {allAccounts.length > 0 && (
          <div className="vq-rail-total">
            <span>Total liquid</span><strong>{currencySymbol} {totalLiquid.toLocaleString()}</strong>
          </div>
        )}
      </section>
    );
  }

  if (id === 'today') {
    const today = performance?.Today || {};
    const sales    = today?.sales    ?? 0;
    const expenses = today?.expenses ?? 0;
    const moneyIn  = today?.money_in ?? 0;
    const moneyOut = today?.money_out ?? 0;
    const fmt = v => typeof v === 'number' && !isNaN(v) ? `${currencySymbol} ${Math.round(v).toLocaleString()}` : '—';
    return (
      <section className="vq-rail-card">
        <header className="vq-rail-h"><span>Today at a glance</span></header>
        <div className="vq-rail-minigrid">
          <div className="vq-rail-mini"><span>Sales</span><strong>{fmt(sales)}</strong></div>
          <div className="vq-rail-mini"><span>Expenses</span><strong>{fmt(expenses)}</strong></div>
          <div className="vq-rail-mini"><span>Money in</span><strong>{fmt(moneyIn)}</strong></div>
          <div className="vq-rail-mini"><span>Money out</span><strong>{fmt(moneyOut)}</strong></div>
        </div>
      </section>
    );
  }

  if (id === 'activity') {
    // recentTransactions from GL: { type, amount, time, description, activityType, reference_id }
    const txList = recentTransactions.slice(0, 5);
    const kindClass = t => ({ sale: 'in', payment_in: 'in', purchase: 'out', expense: 'out', payment_out: 'out', return: 'warn' }[t] || 'info');
    const handleTxClick = (a) => {
      if (!a.reference_id) return;
      if (a.activityType === 'sale' || a.activityType === 'return' || a.reference_type === 'sale') {
        window.location.href = storePath(`/sales/${a.reference_id}`);
      } else if (a.activityType === 'purchase' || a.reference_type === 'purchase') {
        window.location.href = storePath('/purchase-orders');
      } else if (a.activityType === 'expense' || a.reference_type === 'expense') {
        window.location.href = storePath('/expenses');
      } else if (a.activityType === 'payment_in' || a.activityType === 'payment_out') {
        window.location.href = storePath('/funds');
      }
    };
    return (
      <section className="vq-rail-card">
        <header className="vq-rail-h"><span>Recent activity</span><a href={storePath('/reports')} className="vq-rail-link">All</a></header>
        {txList.length > 0 ? (
          <ul className="vq-rail-list">
            {txList.map((a, i) => (
              <li key={a.id || i} className="vq-rail-row" style={{ cursor: a.reference_id ? 'pointer' : 'default' }}
                  onClick={() => handleTxClick(a)} title={a.description || a.reference_id || a.type}>
                <span className={`vq-rail-dot is-${kindClass(a.activityType)}`} aria-hidden="true" />
                <span className="vq-rail-row-n">
                  {a.type} {a.reference_id ? <span style={{ opacity: 0.65, fontWeight: 'normal', fontSize: '11px' }}>({a.reference_id})</span> : ''}
                  <em>{a.time}</em>
                </span>
                <span className={`vq-rail-row-v is-${kindClass(a.activityType)}`}>{a.amount}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="vq-rail-empty">No activity yet today</p>
        )}
      </section>
    );
  }

  if (id === 'alerts') {
    // Drive from lowStockItems — real server data
    const alerts = [];
    if (lowStockItems.length > 0) {
      alerts.push({ k: 'warn', mods: ['inventory'], msg: <><strong>{lowStockItems.length} products</strong> low on stock</>, href: '/inventory' });
    }
    return (
      <section className="vq-rail-card">
        <header className="vq-rail-h"><span>Actions required</span></header>
        {alerts.filter(a => modOk(a.mods)).length > 0 ? (
          <ul className="vq-rail-list">
            {alerts.filter(a => modOk(a.mods)).map((a, i) => (
              <li key={i}>
                <a href={storePath(a.href)} className={`vq-rail-alert is-${a.k}`}>
                  <span className="vq-rail-dot" aria-hidden="true" />
                  <span className="vq-rail-alert-m">{a.msg}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="vq-rail-empty">No actions required</p>
        )}
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
    const monthlyRev = performance?.Month?.sales || 0;
    const targetRev = 300000;
    const pacePct = Math.min(100, Math.round((monthlyRev / targetRev) * 100));
    return (
      <section className="vq-rail-card">
        <header className="vq-rail-h"><span>Growth &amp; targets</span><a href={storePath('/reports')} className="vq-rail-link">Open</a></header>
        <span className="vq-rail-sub">Monthly Revenue Target ({pacePct}%)</span>
        <div style={{ padding: '8px 12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
            <span>{currencySymbol} {monthlyRev.toLocaleString()}</span>
            <span style={{ opacity: 0.65 }}>Target: {currencySymbol} {targetRev.toLocaleString()}</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${pacePct}%`, height: '100%', background: '#3b82f6', borderRadius: '3px' }} />
          </div>
        </div>
      </section>
    );
  }

  if (id === 'top_lists') {
    // Use real topSellingItems from controller
    const topMax = topSellingItems[0]?.net_revenue ?? 0;
    return (
      <section className="vq-rail-card">
        <header className="vq-rail-h"><span>Top performers</span><a href={storePath('/reports')} className="vq-rail-link">Open</a></header>
        <span className="vq-rail-sub">Products this month</span>
        {topSellingItems.length > 0 ? (
          <ul className="vq-rail-list">
            {topSellingItems.slice(0, 5).map(t => (
              <li key={t.id} className="vq-rail-rank">
                <span className="vq-rail-row-n">{t.name}</span>
                <span className="vq-rail-track"><i style={{ width: `${topMax > 0 ? Math.round((t.net_revenue / topMax) * 100) : 0}%` }} /></span>
                <span className="vq-rail-row-v">{t.revenue}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="vq-rail-empty">No sales yet this month</p>
        )}
      </section>
    );
  }

  if (id === 'reminders') {
    const debtorsList = (debtors && debtors.length > 0) ? debtors : (DASHBOARD_RUNTIME_DATA?.debtors || []);
    return (
      <section className="vq-rail-card">
        <header className="vq-rail-h"><span>Payment reminders</span><a href={storePath('/customers')} className="vq-rail-link">All</a></header>
        {debtorsList.length > 0 ? (
          <ul className="vq-rail-list">
            {debtorsList.map(d => (
              <li key={d.id} className="vq-rail-row">
                <span className="vq-rail-row-n">{d.name}<em>{d.phone}</em></span>
                <span className="vq-rail-row-v is-warn">{d.balance}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="vq-rail-empty">No overdue payments</p>
        )}
      </section>
    );
  }

  return null;
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
  const isDemo = props?.is_demo === true;
  /* Real data from DashboardController ───────────────────────────── */
  const cashData          = props?.cashData          || null;
  const bankAccounts      = props?.bankAccounts      || [];
  const cashAccounts      = props?.cashAccounts      || [];
  const recentTransactions = props?.recentTransactions || [];
  const topSellingItems   = props?.topSellingItems   || [];
  const lowStockItems     = props?.lowStockItems     || [];
  const performance       = props?.performance       || {};
  const debtors           = props?.debtors           || [];
  DASHBOARD_RUNTIME_DATA = {
    cashData,
    bankAccounts,
    cashAccounts,
    recentTransactions,
    topSellingItems,
    lowStockItems,
    performance,
    debtors,
  };
  /* ─────────────────────────────────────────────────────────────── */

  const readingsProp = props?.readings || null;
  const layoutLawProp = props?.layoutLaw || null;
  const frames = Array.isArray(props?.frames) ? props.frames : [];
  const [activeFrameKey, setActiveFrameKey] = useState(props?.activeFrame || 'classic');
  const [frameDirty, setFrameDirty] = useState(!!props?.frameDirty);
  if (typeof window !== 'undefined' && Array.isArray(readingsProp) && readingsProp.length > 0) {
    window.__VENQORE_READINGS__ = readingsProp;
  }
  if (typeof window !== 'undefined' && layoutLawProp) {
    window.__VENQORE_LAYOUT_LAW__ = layoutLawProp;
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
  const [framePickerModalOpen, setFramePickerModalOpen] = useState(false);
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

  /* ── theme: AppearanceProvider is the single authority ────────────────────── */
  const { isDark, appearance, update: updateAppearance } = useAppearance();

  // Retire legacy independent storage key without overriding server saved preference
  useEffect(() => {
    try {
      localStorage.removeItem('vq-dashboard-v6-theme');
    } catch {}
  }, []);

  // Redraw charts after shared appearance changes and after chart engine becomes ready
  useEffect(() => {
    engine()?.draw?.();
  }, [isDark, appearance, engineReady]);

  const cycleTheme = () => updateAppearance({ mode: isDark ? 'light' : 'dark' });
  const themeTitle = isDark ? 'Theme: dark — switch to light' : 'Theme: light — switch to dark';

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




  useEffect(() => {
    window._vqOpenGlassActions = () => setGlassModalOpen(true);
    return () => { window._vqOpenGlassActions = null; };
  }, []);

  const enabledModules = useMemo(
    () => (Array.isArray(props?.modules) ? props.modules : []),
    [props?.modules]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onDocSave = () => {
      clearReckonerDataCache();
      engine()?.draw?.();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        engine()?.draw?.();
      }
    };
    window.addEventListener('pos:sale-saved', onDocSave);
    window.addEventListener('sale:saved', onDocSave);
    window.addEventListener('purchase:saved', onDocSave);
    window.addEventListener('expense:saved', onDocSave);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('pos:sale-saved', onDocSave);
      window.removeEventListener('sale:saved', onDocSave);
      window.removeEventListener('purchase:saved', onDocSave);
      window.removeEventListener('expense:saved', onDocSave);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    clearReckonerDataCache();
  }, [storeSlug]);

  useEffect(() => {
    const activeFrame = frames.find(frame => frame.key === activeFrameKey);
    runCardBuilder({
      storeSlug, modules: enabledModules, readings: readingsProp, layoutLaw: layoutLawProp,
      dashboardId: props?.dashboardId, activeFrame: activeFrameKey,
      frameSlots: frameDirty ? [] : (activeFrame?.slots || []), frameDirty,
    });
    setEngineReady(true);
  }, [storeSlug, enabledModules, readingsProp, layoutLawProp, props?.dashboardId]);

  useEffect(() => {
    const onDirty = event => setFrameDirty(!!event.detail);
    window.addEventListener('vq:frame-dirty', onDirty);
    return () => window.removeEventListener('vq:frame-dirty', onDirty);
  }, []);

  const chooseFrame = (frameKey) => {
    if (frameDirty && !window.confirm('This dashboard has custom changes. Switching frames will re-flow its cards. Continue?')) return;
    const frame = frames.find(item => item.key === frameKey);
    if (!frame) return;
    engine()?.setFrame?.(frame.key, frame.slots);
    setActiveFrameKey(frame.key);
    setFrameDirty(false);
  };

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
    const onToggleSidePanel = () => {
      if (!panelDesign) setRailsModalOpen(true);
      else setRailOpt({ collapsed: !railPrefs.collapsed });
    };
    const onOpenSidePanel = () => setRailsModalOpen(true);
    const onStartFresh = () => setFramePickerModalOpen(true);
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
      if (params.get('reset') === '1') setFramePickerModalOpen(true);
    }

    return () => {
      window.removeEventListener('vq:edit-layout', onEditLayout);
      window.removeEventListener('vq:toggle-edit-layout', onEditLayout);
      window.removeEventListener('vq:add-card', onAddCard);
      window.removeEventListener('vq:open-add-card', onAddCard);
      window.removeEventListener('vq:toggle-side-panel', onToggleSidePanel);
      window.removeEventListener('vq:open-side-panel', onOpenSidePanel);
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

  const catMax = engine()?.getCatMax?.() || catMaxFromLaw(layoutLawProp);
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

  const handleResetLayout = () => { setFramePickerModalOpen(true); setMenuOpen(false); };

  /* ── catalogue ───────────────────────────────────────────────────────── */
  const readings = engineReady
    ? ((engine()?.getAvailableReadings?.() ?? engine()?.getReadings?.()) || [])
    : (Array.isArray(readingsProp) && readingsProp.length > 0 ? readingsProp : ((typeof window !== 'undefined' && window.__VENQORE_READINGS__) || []));
  const visibleTemplates = engineReady
    ? OPERATIONAL_TEMPLATES.filter(t => engine()?.specialAvailable?.(t.type) !== false)
    : OPERATIONAL_TEMPLATES;

  const availableAreas = useMemo(() => {
    const areas = Array.from(new Set(readings.filter(r => r?.contract_state !== 'unimplemented').map(r => r?.area).filter(Boolean)));
    const hasComingSoon = readings.some(r => r?.contract_state === 'unimplemented');
    return ['All', ...areas, ...(hasComingSoon ? ['Coming soon'] : [])];
  }, [readings]);

  const filteredReadings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return readings.filter(r => {
      if (!r) return false;
      const isUnimplemented = r.contract_state === 'unimplemented';
      if (selectedArea === 'Coming soon') {
        if (!isUnimplemented) return false;
      } else {
        if (isUnimplemented) return false;
        if (selectedArea !== 'All' && r.area !== selectedArea) return false;
      }
      return (!q || (r.label && r.label.toLowerCase().includes(q)) || (r.module && r.module.toLowerCase().includes(q)) || (r.key && r.key.toLowerCase().includes(q)));
    });
  }, [readings, selectedArea, searchQuery]);

  const groupedSections = useMemo(() => {
    const groups = {};
    filteredReadings.forEach(r => {
      const sectionName = selectedArea === 'Coming soon' ? (r?.area || 'Coming soon') : (r?.area || 'General');
      (groups[sectionName] ||= []).push(r);
    });
    return groups;
  }, [filteredReadings, selectedArea]);

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
    const catMaxTbl = e.getCatMax?.() || catMaxFromLaw(layoutLawProp);
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
                {isEditMode && frames.length > 0 && (
                  <section className="vq-frame-picker" aria-label="Dashboard frame settings">
                    <FramePicker frames={frames} value={activeFrameKey} onChange={chooseFrame} />
                  </section>
                )}
                <div className="vq-grid" id="board" />
              </div>

              {railsOn && (
                <aside className={`vq-rails ${railPrefs.sticky ? 'is-sticky' : ''} ${railPrefs.design === 'dark_hub' ? 'vq-rails--dark' : ''}`}
                       style={{ '--vq-rails-w': `${railPrefs.width || 340}px` }}
                       aria-label="Side panel">
                  <div className="vq-rails-shell">
                    <div className="vq-rails-scroll">
                      {activeRails.map(id => <DashRail key={id} id={id} storePath={storePath}
                                                       enabledModules={enabledModules}
                                                       onQuickActions={() => setGlassModalOpen(true)}
                                                       cashData={cashData}
                                                       bankAccounts={bankAccounts}
                                                       cashAccounts={cashAccounts}
                                                       recentTransactions={recentTransactions}
                                                       topSellingItems={topSellingItems}
                                                       lowStockItems={lowStockItems}
                                                       performance={performance}
                                                       debtors={debtors}
                                                       currencySymbol={store?.currency_symbol || 'Rs'}
                                                       isDemo={isDemo} />)}
                    </div>
                  </div>
                </aside>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ── Choose a starting layout / Frame picker modal ─────────────────── */}
      {framePickerModalOpen && typeof document !== 'undefined' && createPortal((
        <div className="vq-modal-overlay" onClick={() => setFramePickerModalOpen(false)} role="dialog" aria-modal="true">
          <div className="vq-modal-card vq-preset-modal" onClick={e => e.stopPropagation()}>
            <div className="vq-modal-top-bar">
              <div>
                <div className="vq-modal-step-sub">STARTING LAYOUTS</div>
                <div className="vq-modal-heading">Choose a layout frame</div>
              </div>
              <button type="button" className="vq-modal-close-x" onClick={() => setFramePickerModalOpen(false)} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="vq-preset-note">
              Pick a geometric frame — cards adapt seamlessly to the slots, and you can customize, resize, and add cards anytime.
            </div>
            <div className="p-4 overflow-y-auto max-h-[70vh]">
              <FramePicker
                frames={frames}
                value={activeFrameKey}
                onChange={(frameKey) => {
                  chooseFrame(frameKey);
                  setFramePickerModalOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      ), document.body)}

      {/* ── The wizard ──────────────────────────────────────────────────── */}
      {stepperModalOpen && typeof document !== 'undefined' && createPortal((
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
                              <span className="vq-item-card-title">
                                {r.label}
                              </span>
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
      ), document.body)}

      {/* ── Choose a side panel ─────────────────────────────────────────── */}
      {railsModalOpen && typeof document !== 'undefined' && createPortal((
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
      ), document.body)}

      {/* ── Quick actions ───────────────────────────────────────────────── */}
      {glassModalOpen && typeof document !== 'undefined' && createPortal((
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
              if (item.href) window.location.href = item.href;
            }} />
          </div>
        </div>
      ), document.body)}

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

      </div>
    </OneGlanceLayout>
  );
}

NewDashboard.layout = (page) => page;
