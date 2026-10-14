import React from 'react';
import {
    LayoutDashboard, Users, UserCog, Shield, Package, Boxes, Tag, Layers, FileText, Receipt, ShoppingCart,
    ShoppingBag, CreditCard, Wallet, Landmark, BarChart3, LineChart, PieChart, Settings, Truck, Warehouse,
    ArrowLeftRight, RotateCcw, Clock, History, RefreshCcw, ClipboardList, CheckSquare, Percent, Printer,
    Store, Building2, Bell, Globe, Plug, Upload, Download, Calculator, BookOpen, Scale, Circle,
    Home, Wrench, CalendarDays, Hammer, FileSignature, Undo2, BellRing, Repeat, FileCheck2, Monitor, UtensilsCrossed,
    ChefHat, Tv, Map, Bike, SlidersHorizontal, ClipboardCheck, PackageX, FolderTree, PlusSquare, ScanSearch, QrCode,
    Barcode, Factory, Contact, Banknote, PiggyBank, Inbox, ShieldCheck, Send, Mail, MessageSquare,
    Megaphone, Sprout, BookText, TrendingUp, Hourglass, AlertTriangle, CalendarX, CalendarClock, Blocks,
    Database, Trash2, Gauge, Ticket, Coins, ReceiptText, ArrowDownToLine, ArrowUpFromLine,
    PackageOpen, Crown, Activity, Workflow,
} from 'lucide-react';

// Exact page names first: every page gets its own icon. Anything not listed falls back to the rules below.
const EXACT = {
    'Home': Home, 'Main Dashboard': LayoutDashboard, 'Executive Dashboard': Gauge,
    'Orders': ClipboardList, 'Service Jobs': Wrench, 'Dispatch Calendar': CalendarDays, 'Tools & Equipment': Hammer,
    'Quotations / Pre-Sales': FileSignature, 'Proposals': FileText, 'Returns History': Undo2, 'Invoice Reminders': BellRing,
    'Recurring Invoices': Repeat, 'E-Invoicing': FileCheck2,
    'POS': Monitor, 'Restaurant Dashboard': LayoutDashboard, 'FOH': UtensilsCrossed, 'Kitchen': ChefHat, 'Order TV Screen': Tv, 'Floor Plan': Map, 'Riders': Bike, 'FOH Settings': SlidersHorizontal,
    'Purchases': ShoppingBag, 'Purchase Orders': ClipboardCheck, 'Purchase Returns': PackageX,
    'Products': Package, 'Categories': FolderTree, 'Attributes': SlidersHorizontal, 'Add-ons': PlusSquare, 'Labels': Tag,
    'Stock Levels': Boxes, 'Stock Operations': Workflow, 'Stock Transfers': ArrowLeftRight, 'Stock Audit': ScanSearch,
    'Batch Tracking': Layers, 'Serial Tracking': Barcode, 'Production': Factory, 'Cookbook': BookOpen,
    'Customers': Users, 'Suppliers': Truck, 'Parties': Contact,
    'Payments': CreditCard, 'Expenses': Receipt, 'To Receive': ArrowDownToLine, 'To Pay': ArrowUpFromLine,
    'Fund Management': PiggyBank, 'Bank Accounts': Landmark, 'Bank Reconciliation': Scale,
    'Approval Inbox': Inbox, 'Approval Policies': ShieldCheck, 'My Submissions': Send,
    'Dashboard': LayoutDashboard, 'Store Overview': Store, 'Online Orders': ShoppingCart, 'Online Products': PackageOpen, 'Offers & Coupons': Ticket,
    'QR Menu & Catalogue': QrCode, 'Online Store Settings': Settings,
    'VenSynQ': RefreshCcw, 'Email Marketing': Mail, 'SMS Marketing': MessageSquare, 'Campaigns': Megaphone,
    'WooCommerce Sync': Plug, 'VenSynQ Settings': SlidersHorizontal,
    'Growth Engine': Sprout, 'Chart of Accounts': BookText, 'Profit & Loss': TrendingUp, 'Balance Sheet': Scale, 'Cash Flow': Coins,
    'Tax Report': Percent, 'Sales Report': BarChart3, 'Discount Report': Percent, 'Sale Aging': Hourglass,
    'Purchase Report': PieChart, 'Expense Report': ReceiptText, 'Stock Valuation': Banknote, 'Low Stock': AlertTriangle,
    'Movement History': History, 'Expiry Report': CalendarX, 'Activity Log': Activity,
    'User Management': UserCog, 'Staff Attendance': CalendarClock, 'Modules & Features': Blocks, 'Data Management': Database,
    'Recycle Bin': Trash2, 'Subscription': Crown,
};

// First matching rule wins. Pure label heuristics so every sub-page gets an icon
// without touching the menu definitions.
const RULES = [
    [/executive|business dashboard|^dashboard|overview/i, LayoutDashboard],
    [/user|staff|team|employee|role/i, UserCog],
    [/permission|security|approval|polic/i, Shield],
    [/customer|supplier|vendor|contact|client/i, Users],
    [/transfer/i, ArrowLeftRight],
    [/warehouse|location|branch/i, Warehouse],
    [/stock|inventory|adjust/i, Boxes],
    [/product|item|service/i, Package],
    [/categor|brand|unit|tag/i, Tag],
    [/variant|bundle|batch/i, Layers],
    [/return|credit note|refund/i, RotateCcw],
    [/remind/i, Clock],
    [/recurring/i, RefreshCcw],
    [/history|log|audit/i, History],
    [/proposal|quotation|estimate/i, FileText],
    [/purchase order|order/i, ClipboardList],
    [/purchase|bill/i, ShoppingBag],
    [/debit|payment|expense/i, CreditCard],
    [/invoice|sale|receipt/i, Receipt],
    [/cart|pos|checkout/i, ShoppingCart],
    [/bank|account|ledger|journal|cash/i, Landmark],
    [/wallet|money|finance/i, Wallet],
    [/tax|discount|offer|promo/i, Percent],
    [/profit|loss|balance|trial/i, Scale],
    [/trend|forecast|insight|analytic/i, LineChart],
    [/report/i, BarChart3],
    [/summary|breakdown/i, PieChart],
    [/deliver|shipping|courier/i, Truck],
    [/print|label|barcode/i, Printer],
    [/import/i, Upload],
    [/export/i, Download],
    [/calculat/i, Calculator],
    [/approve|task|checklist/i, CheckSquare],
    [/store|shop|online/i, Store],
    [/company|business|organi/i, Building2],
    [/notif|alert/i, Bell],
    [/domain|website|site/i, Globe],
    [/integrat|api|webhook/i, Plug],
    [/guide|help|learn/i, BookOpen],
    [/setting|prefer|config/i, Settings],
];

export function SubIcon({ label, size = 14, className = '' }) {
    const exact = EXACT[label];
    const hit = exact ? [null, exact] : RULES.find(([re]) => re.test(label || ''));
    const Icon = hit ? hit[1] : Circle;
    return <Icon size={hit ? size : 6} className={`shrink-0 ${className}`} />;
}
