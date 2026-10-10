import React from 'react';
import {
    LayoutDashboard, Users, UserCog, Shield, Package, Boxes, Tag, Layers, FileText, Receipt, ShoppingCart,
    ShoppingBag, CreditCard, Wallet, Landmark, BarChart3, LineChart, PieChart, Settings, Truck, Warehouse,
    ArrowLeftRight, RotateCcw, Clock, History, RefreshCcw, ClipboardList, CheckSquare, Percent, Printer,
    Store, Building2, Bell, Globe, Plug, Upload, Download, Calculator, BookOpen, Scale, Circle,
} from 'lucide-react';

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
    const hit = RULES.find(([re]) => re.test(label || ''));
    const Icon = hit ? hit[1] : Circle;
    return <Icon size={hit ? size : 6} className={`shrink-0 ${className}`} />;
}
