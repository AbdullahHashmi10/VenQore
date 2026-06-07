
/**
 * ============================================================================================================================================================
 * MASTER SALES CONSOLE: ATOMIC ANALYSIS & ARCHITECTURAL BLUEPRINT
 * ============================================================================================================================================================
 * 
 * "ICE BISECTED & DISSECTED" - THE ATOMIC BREAKDOWN
 * This document serves as the single source of truth for the Master Sales Interface. 
 * Every interaction, data flow, and linkage is documented here.
 *
 * ------------------------------------------------------------------------------------------------------------------------------------------------------------
 * 1. THE TABBED SESSION MANAGER (SESSION LAYER)
 * ------------------------------------------------------------------------------------------------------------------------------------------------------------
 * - **Atomic Unit**: The `InvoiceSession`.
 * - **Behavior**: 
 *   - Creating a tab instantiates a new local state object `{ id: uuid(), items: [], customer: null, meta: {} }`.
 *   - **Linkage**: This state does NOT touch the database until "Save" is pressed to prevent "Ghost Records".
 *   - **State Persistence**: Every keystroke updates `localStorage`. If the browser crashes, the "Draft Recovery" system restores all tabs exactly as they were.
 *   - **Naming Logic**: 
 *     - Default: "Sales #N"
 *     - Trigger: User selects "Customer A".
 *     - Action: Tab renames to "Customer A".
 *     - Override: User can double-click tab to manually rename (e.g., "Review for later").
 *
 * ------------------------------------------------------------------------------------------------------------------------------------------------------------
 * 2. CUSTOMER ENTITY & CRM LINKAGE (RELATIONAL LAYER)
 * ------------------------------------------------------------------------------------------------------------------------------------------------------------
 * - **Atomic Unit**: The `SelectedCustomer`.
 * - **Search Mechanism**:
 *   - Triggers: Input `onChange` (Debounced 300ms).
 *   - Scope: Searches `customers` table (Name, Phone, Email, Tax ID).
 * - **Deep Links (The "Everything" Connection)**:
 *   - **Financial Link**: Fetch `accounts` ledger for this `customer_id`. -> Displays "Current Balance: $500 Dr".
 *   - **Risk Link**: Check `credit_limit` column. -> Condition: If (Balance + CurrentCart > Limit) -> Trigger "Credit Block Modal".
 *   - **Pricing Link**: Check `price_level` (Retail/Wholesale). -> Action: All product prices dynamically adjust to this level immediately.
 *   - **Loyalty Link**: Check `loyalty_points`. -> Display "Redeemable: 50 pts".
 *   - **History Link**: Fetch `latest_sale_date`. -> Display "Last seen: 2 days ago".
 * 
 * ------------------------------------------------------------------------------------------------------------------------------------------------------------
 * 3. PRODUCT INPUT & INVENTORY LOGIC (THE CORE ENGINE)
 * ------------------------------------------------------------------------------------------------------------------------------------------------------------
 * - **Search Modes**:
 *   - **Fuzzy Search**: "Appl" -> Matches "Apple", "Application", "Snapple". Ordering by `frequency_of_sale` (AI Prediction).
 *   - **Strict Scan**: Barcode Input. 
 *     - *Atomic Link*: Queries `product_barcodes` table (includes Alias Barcodes).
 *     - *Multi-Unit Link*: If barcode matches a "Box of 10", it adds 10 units automatically.
 * 
 * - **Stock Validation (Atomic Check)**:
 *   - *Trigger*: Every `quantity` change.
 *   - *Logic*: Check `warehouse_stock` for `product_id` AND `active_warehouse_id`.
 *   - *Visual*: If (Qty > Stock) -> Turn Row Red -> Show "Overselling Warning" (unless overridden by Admin).
 * 
 * - **Batch & Expiry (The "Deep" Detail)**:
 *   - *Condition*: If Product is `has_batch = true`.
 *   - *Interaction*: Popover appears demanding "Select Batch". 
 *   - *Link*: Deducts from specific Batch ID in `inventory_batches` table, not just general stock.
 * 
 * ------------------------------------------------------------------------------------------------------------------------------------------------------------
 * 4. THE TRANSACTION MATRIX (THE GRID)
 * ------------------------------------------------------------------------------------------------------------------------------------------------------------
 * - **Atomic Row Features**:
 *   - **Sequence Manipulation**: 
 *     - *Action*: Drag Row / Click Up-Down.
 *     - *Purpose*: Printing order (e.g., Heavy items first for packing).
 *   - **Cloning**: 
 *     - *Action*: Right-click -> "Duplicate".
 *     - *Use Case*: Selling same item with different modification notes.
 *   - **Dynamic Conversion**:
 *     - *Action*: Toggle Unit (Pcs -> Box).
 *     - *Math*: Price * ConversionFactor.
 *   - **Profit Peek (Admin Only)**:
 *     - *Math*: (Selling Price - Cost Price) * Qty.
 *     - *Visual*: Tiny indicator bar under price (Green = Healthy, Red = Loss).
 * 
 * ------------------------------------------------------------------------------------------------------------------------------------------------------------
 * 5. FINANCIAL CLOSING (THE LEDGER HANDSHAKE)
 * ------------------------------------------------------------------------------------------------------------------------------------------------------------
 * - **Atomic Payment Splitter**:
 *   - *Requirement*: "Cash in Hand" + "Credit Card" combo.
 *   - *Linkage*:
 *     - $50 -> `Dr` Cash Account (Asset).
 *     - $50 -> `Dr` Bank Account (Asset).
 *     - $100 -> `Cr` Sales Account (Revenue).
 *     - *Tax*: `Cr` Tax Payable (Liability).
 * 
 * - **Rounding Logic**:
 *   - Auto-calculate `0.01` or `0.02` diff.
 *   - *Link*: Posts to "Rounding Expense" account automatically.
 *
 * ------------------------------------------------------------------------------------------------------------------------------------------------------------
 * 6. AUDIT & SECURITY (THE RECORDING)
 * ------------------------------------------------------------------------------------------------------------------------------------------------------------
 * - **Every Click Recorded**:
 *   - Changed Price $10 -> $9. *Log*: "User X overrode price (Reason required?)".
 *   - Deleted Row. *Log*: "User X removed item Y".
 *   - Printed Invoice. *Log*: "User X generated PDF".
 * ============================================================================================================================================================
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Head, usePage } from '@inertiajs/react';
import {
    Plus, Trash2, Save, Printer, User, Package, X, ChevronRight,
    ChevronLeft, CreditCard, Banknote, Percent, DollarSign, Info,
    ScanBarcode, Search, GripVertical, Settings, ArrowUp, ArrowDown,
    AlertCircle, Check, Loader2, RefreshCcw, History, Tag, Box,
    AlertTriangle, Calculator, FileText, Layers, Truck, Copy,
    MoreHorizontal
} from 'lucide-react';
import axios from 'axios';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import { useWorkspace } from '@/Contexts/WorkspaceContext';
import { useAlert } from '@/Contexts/AlertContext';
import AsyncProductCombobox from '@/Components/AsyncProductCombobox';
import AsyncPartyCombobox from '@/Components/AsyncPartyCombobox';

// --- ATOMIC SUB-COMPONENTS ---

/**
 * [ATOMIC COMPONENT] CustomerProfileCard
 * "Analyzing the link to other things" -> Displays the deep CRM data.
 */
const CustomerProfileCard = ({ customer, onClose }) => {
    if (!customer) return null;

    const { store } = usePage().props;
 
    // ATOMIC ANALYSIS: Risks and Rewards
    const isOverLimit = (customer.balance || 0) > (customer.credit_limit || 999999);

    return (
        <div className="absolute top-14 left-0 w-full bg-slate-900 border-b border-indigo-500/30 p-4 shadow-2xl z-20 grid grid-cols-4 gap-4 animate-in slide-in-from-top-2">

            {/* 1. IDENTITY & CONTACT */}
            <div className="border-r border-slate-700 pr-4">
                <h4 className="text-indigo-400 font-bold text-lg mb-1">{customer.name}</h4>
                <div className="text-xs text-slate-400 font-mono space-y-1">
                    <div>ID: #{customer.id}</div>
                    <div>Ph: {customer.phone || 'N/A'}</div>
                    <div className="flex items-center text-emerald-500">
                        <Tag className="w-3 h-3 mr-1" />
                        <span>Price Level: {customer.price_level || 'Retail'}</span>
                    </div>
                </div>
            </div>

            {/* 2. FINANCIAL HEALTH (Link to Ledgers) */}
            <div className="border-r border-slate-700 px-4">
                <div className="text-xs uppercase text-slate-500 font-bold mb-2">Financial Status</div>
                <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-400 text-sm">Balance:</span>
                    <span className={`font-mono font-bold ${customer.balance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {formatCurrency(customer.balance || 0, store)}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Credit Limit:</span>
                    <span className="font-mono text-slate-300">{customer.credit_limit ? formatCurrency(customer.credit_limit, store) : '∞'}</span>
                </div>
                {isOverLimit && (
                    <div className="mt-2 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" /> Over Limit
                    </div>
                )}
            </div>

            {/* 3. LOYALTY (Link to Rewards) */}
            <div className="border-r border-slate-700 px-4">
                <div className="text-xs uppercase text-slate-500 font-bold mb-2">Growth Engine</div>
                <div className="bg-gradient-to-r from-amber-500/10 to-transparent p-2 rounded">
                    <div className="text-amber-500 font-bold text-lg">{customer.points || 0} PTS</div>
                    <div className="text-[10px] text-amber-400/60">Redeemable Value: {formatCurrency((customer.points || 0) * 0.1, store)}</div>
                </div>
            </div>

            {/* 4. HISTORY (Link to Sales) */}
            <div className="px-4 relative">
                <button onClick={onClose} className="absolute top-0 right-0 p-1 hover:text-white text-slate-500">
                    <X className="w-4 h-4" />
                </button>
                <div className="text-xs uppercase text-slate-500 font-bold mb-2">Last Interaction</div>
                <div className="text-sm text-slate-300">2 Days Ago</div>
                <div className="text-[10px] text-slate-500 mb-2">Invoice #INV-2024-001</div>
                <button className="text-xs text-indigo-400 underline hover:text-indigo-300">View Full Ledger</button>
            </div>
        </div>
    );
};

/**
 * [ATOMIC COMPONENT] Detailed Row
 * "Each and every single detail" for the item row.
 */
const AtomicRow = ({ item, index, onUpdate, onRemove, onMove, onDuplicate }) => {
    const { store } = usePage().props;
    // DERIVED ATOMIC MATH
    const gross = (item.quantity * item.price);
    const discountAmount = item.discountType === 'percent' ? (gross * (item.discount / 100)) : item.discount;
    const net = gross - discountAmount;
    const profit = (item.price - (item.cost || 0)) * item.quantity;
    const margin = item.price > 0 ? ((item.price - (item.cost || 0)) / item.price) * 100 : 0;

    return (
        <tr className="group border-b border-slate-700/50 hover:bg-slate-800/40 transition-colors relative">
            {/* ROW ACTIONS (HOVER ONLY) */}
            <td className="w-10">
                <div className="flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onMove(index, -1)} className="p-1 hover:text-indigo-400"><ArrowUp className="w-3 h-3" /></button>
                    <button onClick={() => onMove(index, 1)} className="p-1 hover:text-indigo-400"><ArrowDown className="w-3 h-3" /></button>
                </div>
            </td>

            {/* PRODUCT DETAIL & METADATA */}
            <td className="p-3">
                <div className="flex flex-col">
                    <span className="font-bold text-slate-100">{item.name}</span>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono mt-1">
                        <span className="bg-slate-800 px-1 rounded border border-slate-700">SKU: {item.product?.sku || 'N/A'}</span>
                        {item.product?.stock_quantity <= 0 && <span className="text-red-500 flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> Stock: 0</span>}
                        {item.product?.location && <span>Loc: {item.product.location}</span>}
                    </div>
                </div>
            </td>

            {/* BATCH / SERIAL (The Hidden Detail) */}
            <td className="w-24 p-2">
                {item.product?.has_batch ? (
                    <select className="bg-slate-900 border border-slate-600 text-[10px] rounded p-1 w-full text-amber-400 cursor-pointer">
                        <option>Batch A (Exp 2025)</option>
                        <option>Batch B (Exp 2026)</option>
                    </select>
                ) : (
                    <div className="text-center text-slate-700 text-xs">-</div>
                )}
            </td>

            {/* QUANTITY & UNIT */}
            <td className="w-32 p-2">
                <div className="flex items-center space-x-1">
                    <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => onUpdate(item.id, 'quantity', parseFloat(e.target.value))}
                        className="w-16 bg-slate-800 border-slate-600 rounded text-center font-bold text-white focus:ring-indigo-500"
                    />
                    <div className="flex flex-col text-[9px] text-slate-500 leading-tight">
                        <span className="cursor-pointer hover:text-indigo-400">PCS</span>
                        <span className="cursor-pointer hover:text-indigo-400">BOX</span>
                    </div>
                </div>
            </td>

            {/* PRICE & MARGIN PEEK */}
            <td className="w-32 p-2">
                <div className="relative group/price">
                    <input
                        type="number"
                        value={item.price}
                        onChange={(e) => onUpdate(item.id, 'price', parseFloat(e.target.value))}
                        className="w-full bg-slate-800 border-slate-600 rounded text-right pr-2 text-emerald-400 font-mono"
                    />
                    {/* ATOMIC LINK: MARGIN TOOLTIP */}
                    <div className="absolute top-full right-0 bg-slate-900 border border-slate-700 p-2 rounded shadow-xl z-50 hidden group-focus-within/price:block min-w-[150px]">
                        <div className="text-[10px] text-slate-400 flex justify-between">
                            <span>Cost:</span> <span>{formatCurrency(item.product?.cost || 0, store)}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex justify-between">
                            <span>Margin:</span>
                            <span className={margin < 15 ? 'text-red-400' : 'text-green-400'}>{margin.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            </td>

            {/* TOTALS */}
            <td className="w-32 p-3 text-right font-mono font-bold text-slate-200">
                {formatCurrency(net, store)}
            </td>

            {/* MENU ACTIONS */}
            <td className="w-10 text-center">
                <div className="relative group/menu">
                    <button className="text-slate-500 hover:text-indigo-400"><MoreHorizontal className="w-4 h-4" /></button>
                    {/* DROPDOWN FOR "ALL THOSE THOUSAND THINGS" */}
                    <div className="absolute right-0 top-6 w-40 bg-slate-800 border border-slate-700 rounded shadow-2xl overflow-hidden hidden group-hover/menu:block z-50">
                        <button onClick={() => onDuplicate(item.id)} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-700 flex items-center">
                            <Copy className="w-3 h-3 mr-2" /> Duplicate Row
                        </button>
                        <button className="w-full text-left px-3 py-2 text-xs hover:bg-slate-700 flex items-center">
                            <FileText className="w-3 h-3 mr-2" /> Add Note
                        </button>
                        <button className="w-full text-left px-3 py-2 text-xs hover:bg-slate-700 flex items-center">
                            <History className="w-3 h-3 mr-2" /> History
                        </button>
                        <div className="border-t border-slate-700 my-1"></div>
                        <button onClick={() => onRemove(item.id)} className="w-full text-left px-3 py-2 text-xs hover:bg-red-900/50 text-red-400 flex items-center">
                            <Trash2 className="w-3 h-3 mr-2" /> Remove
                        </button>
                    </div>
                </div>
            </td>
        </tr>
    );
};

// --- MAIN PAGE ---

export default function MasterSales() {
    // SYSTEM STATE
    const { store } = usePage().props;
    const { activeInvoices, currentInvoiceId, setCurrentInvoiceId, addInvoice, removeInvoice, updateInvoice } = useWorkspace();
    const currentInvoice = activeInvoices.find(i => i.id === currentInvoiceId) || activeInvoices[0]; // Active Tab logic

    // ATOMIC INTERFACE STATE
    const [scanMode, setScanMode] = useState(false); // Scan vs Type
    const [showCustomerDetails, setShowCustomerDetails] = useState(false); // Details Pannel
    const [auditLog, setAuditLog] = useState([]); // The "Recording" of everything
    const [customerQuery, setCustomerQuery] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // --- REFS FOR FOCUS LINKING ---
    const searchRef = useRef(null);
    const tableRef = useRef(null);

    // --- LOGIC: AUDIT LOGGING ---
    const logAction = (action, details = '') => {
        const entry = {
            id: Date.now(),
            time: new Date().toLocaleTimeString(),
            action,
            details
        };
        setAuditLog(prev => [entry, ...prev].slice(0, 100)); // Keep last 100
    };

    // --- LOGIC: ACTIONS ---
    const handleMoveItem = (index, direction) => {
        if (!currentInvoice?.items) return;
        const newItems = [...currentInvoice.items];
        const newIndex = index + direction;
        if (newIndex >= 0 && newIndex < newItems.length) {
            [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
            updateInvoice(currentInvoice.id, { items: newItems });
            logAction('REORDER', `Moved item ${index + 1} to ${newIndex + 1}`);
        }
    };

    const handleUpdateItem = (itemId, field, value) => {
        const newItems = currentInvoice.items.map(item => {
            if (item.id === itemId) return { ...item, [field]: value };
            return item;
        });
        updateInvoice(currentInvoice.id, { items: newItems });
        // Don't log every keystroke, ideally debounce this logger
    };

    const handleDuplicateItem = (itemId) => {
        const item = currentInvoice.items.find(i => i.id === itemId);
        if (item) {
            const newItem = { ...item, id: Date.now(), quantity: 1 }; // Reset qty?
            updateInvoice(currentInvoice.id, { items: [...currentInvoice.items, newItem] });
            logAction('DUPLICATE', `Cloned ${item.name}`);
        }
    };

    const handleSelectProduct = (product) => {
        // "As soon as I create... it goes into that tab"
        const newItem = {
            id: Date.now(),
            product: product,
            name: product.name,
            price: parseFloat(product.price || 0),
            quantity: 1,
            discount: 0,
            discountType: 'fixed',
            cost: product.cost || 0
        };
        const items = currentInvoice.items || [];
        updateInvoice(currentInvoice.id, { items: [...items, newItem] });
        logAction('ADD_ITEM', product.name);
        setSearchQuery('');
        // Focus stays on search for rapid entry
        searchRef.current?.focus();
    };

    // --- RENDER ---
    return (
        <div className="h-screen w-full bg-[#0B1121] text-slate-300 flex flex-col font-sans overflow-hidden">
            <Head title="Master Sales Console" />

            {/* 1. TOP BAR: TAB MANAGEMENT (THE "VERY TOP" REQUIREMENT) */}
            <div className="h-12 bg-slate-950 border-b border-slate-800 flex items-center px-2 space-x-2">
                <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar max-w-[80vw]">
                    {activeInvoices.map((inv, idx) => (
                        <div
                            key={inv.id}
                            onClick={() => setCurrentInvoiceId(inv.id)}
                            className={`
                                relative group flex items-center px-4 py-2 rounded-t-lg cursor-pointer transition-all border-t-2 select-none min-w-[160px] max-w-[220px]
                                ${inv.id === currentInvoiceId
                                    ? 'bg-[#1e293b] border-indigo-500 text-white shadow-lg'
                                    : 'bg-slate-900 border-transparent text-slate-500 hover:bg-slate-800'}
                            `}
                        >
                            <User className={`w-3 h-3 mr-2 ${inv.id === currentInvoiceId ? 'text-indigo-400' : 'opacity-0'}`} />
                            <div className="flex flex-col truncate">
                                <span className="text-xs font-bold truncate">
                                    {inv.customer?.name || `Invoice #${idx + 1}`}
                                </span>
                                <span className="text-[9px] font-mono opacity-60 flex justify-between w-full">
                                    <span>{inv.items?.length || 0} Items</span>
                                    <span>{formatCurrency(inv.total || 0, store)}</span>
                                </span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); removeInvoice(inv.id); }}
                                className="absolute right-1 top-1 p-1 hover:bg-slate-700 rounded-full opacity-0 group-hover:opacity-100"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                    <button onClick={addInvoice} className="p-2 hover:bg-slate-800 rounded text-slate-400">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex-1"></div>
                {/* GLOBAL SETTINGS LINK */}
                <button className="p-2 text-slate-500 hover:text-white"><Settings className="w-5 h-5" /></button>
            </div>

            {/* 2. THE WORKBENCH */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* LEFT: THE INVOICE SHEET */}
                <div className="flex-1 flex flex-col bg-[#0f172a] relative">

                    {/* CUSTOMER HEADER (EXPANDABLE) */}
                    <div className="h-16 border-b border-slate-800 bg-slate-900 flex items-center px-4 justify-between z-10 relative">
                        {/* Customer Search */}
                        <div className="flex items-center w-1/3 relative">
                            <div className={`p-2 rounded-lg mr-3 ${currentInvoice?.customer ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-600'}`}>
                                <User className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Customer / Client</label>
                                <AsyncPartyCombobox
                                    partyType="all"
                                    onSelect={(party) => {
                                        if (!party || !currentInvoice) return;
                                        updateInvoice(currentInvoice.id, { customer: party });
                                        logAction('CUSTOMER', `Selected ${party.name}`);
                                    }}
                                    placeholder="Search Client (Alt+C)..."
                                    className="bg-transparent border-none p-0 text-sm font-bold text-white"
                                />
                            </div>
                            {/* POPUP CARD */}
                            {currentInvoice?.customer && showCustomerDetails && (
                                <CustomerProfileCard customer={currentInvoice.customer} onClose={() => setShowCustomerDetails(false)} />
                            )}
                        </div>

                        {/* Meta Info */}
                        <div className="flex items-center space-x-6 text-right">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-500">Date</label>
                                <div className="text-sm font-mono text-slate-300">{new Date().toLocaleDateString()}</div>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-500">Salesman</label>
                                <div className="text-sm font-medium text-slate-300">Admin User</div>
                            </div>
                        </div>
                    </div>

                    {/* ITEMS TABLE (SCROLLABLE AREA) */}
                    <div className="flex-1 overflow-y-auto bg-[#0f172a]" ref={tableRef}>
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#1e293b] sticky top-0 z-10 border-b border-slate-700 shadow-md">
                                <tr className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                                    <th className="p-2 w-10 text-center">#</th>
                                    <th className="p-2">Item Description</th>
                                    <th className="p-2 w-24">Batch/Serial</th>
                                    <th className="p-2 w-32">Qty / Unit</th>
                                    <th className="p-2 w-32">Price</th>
                                    <th className="p-2 w-32 text-right">Total</th>
                                    <th className="p-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentInvoice?.items?.map((item, idx) => (
                                    <AtomicRow
                                        key={item.id}
                                        item={item}
                                        index={idx}
                                        onUpdate={handleUpdateItem}
                                        onRemove={(id) => updateInvoice(currentInvoice.id, { items: currentInvoice.items.filter(x => x.id !== id) })}
                                        onDuplicate={handleDuplicateItem}
                                        onMove={handleMoveItem}
                                    />
                                ))}
                                {(!currentInvoice?.items?.length) && (
                                    <tr>
                                        <td colSpan="7" className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center opacity-20">
                                                <Package className="w-16 h-16 mb-4" />
                                                <span className="text-lg font-light">The cart is empty</span>
                                                <span className="text-sm">Scan items or use search on the right</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* FINANCIAL FOOTER (The "Bottom Layer") */}
                    <div className="bg-slate-900 border-t border-slate-800 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
                        <div className="flex justify-between items-start">

                            {/* PAYMENT SPLIT SIMULATOR */}
                            <div className="w-1/2 pr-10">
                                <div className="text-[10px] uppercase font-bold text-slate-500 mb-2 flex items-center">
                                    <Layers className="w-3 h-3 mr-1" /> Payment Stack
                                </div>
                                <div className="flex space-x-2">
                                    <div className="flex-1 bg-slate-800 rounded p-2 border border-slate-700 flex flex-col cursor-pointer hover:border-emerald-500 transition-colors">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs text-slate-400">Cash</span>
                                            <Banknote className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <input type="number" className="bg-transparent border-none p-0 text-emerald-400 font-bold text-right" placeholder="0.00" />
                                    </div>
                                    <div className="flex-1 bg-slate-800 rounded p-2 border border-slate-700 flex flex-col cursor-pointer hover:border-blue-500 transition-colors">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs text-slate-400">Card</span>
                                            <CreditCard className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <input type="number" className="bg-transparent border-none p-0 text-blue-400 font-bold text-right" placeholder="0.00" />
                                    </div>
                                </div>
                            </div>

                            {/* GRAND TOTALS */}
                            <div className="w-1/2 pl-10 border-l border-slate-800">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-slate-400">
                                        <span>Subtotal</span>
                                        <span>{formatCurrency(currentInvoice?.subtotal || 0, store)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-400">
                                        <span>Tax (VAT 5%)</span>
                                        <span>{formatCurrency(currentInvoice?.tax || 0, store)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-400">
                                        <span>Discount</span>
                                        <span className="text-red-400">-{formatCurrency(currentInvoice?.discount || 0, store)}</span>
                                    </div>
                                    <div className="border-t border-slate-700 my-2 pt-2 flex justify-between items-end">
                                        <span className="text-sm font-bold text-slate-300">TOTAL DUE</span>
                                        <span className="text-4xl font-black text-white">{formatCurrency(currentInvoice?.total || 0, store)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FINAL ACTION BAR */}
                        <div className="mt-4 flex space-x-3">
                            <button className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded shadow-lg shadow-emerald-900/40 flex items-center justify-center">
                                <Check className="w-5 h-5 mr-2" /> COMPLETE SALE (F10)
                            </button>
                            <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 rounded font-bold flex items-center">
                                <Printer className="w-5 h-5 mr-2" /> Print
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT: THE CONTROL TOWER (SIDEBAR) */}
                <div className="w-[350px] bg-[#020617] border-l border-slate-800 flex flex-col z-30 shadow-2xl">

                    {/* MODE TOGGLE */}
                    <div className="p-2 grid grid-cols-2 gap-2 bg-slate-900 border-b border-slate-800">
                        <button
                            onClick={() => setScanMode(false)}
                            className={`p-2 text-xs font-bold uppercase rounded flex flex-col items-center justify-center ${!scanMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-transparent text-slate-500 hover:bg-slate-800'}`}
                        >
                            <Search className="w-4 h-4 mb-1" /> Search
                        </button>
                        <button
                            onClick={() => setScanMode(true)}
                            className={`p-2 text-xs font-bold uppercase rounded flex flex-col items-center justify-center ${scanMode ? 'bg-emerald-600 text-white shadow-lg' : 'bg-transparent text-slate-500 hover:bg-slate-800'}`}
                        >
                            <ScanBarcode className="w-4 h-4 mb-1" /> Scan
                        </button>
                    </div>

                    {/* INPUT AREA */}
                    <div className="p-4 border-b border-slate-800 bg-gradient-to-b from-slate-900 to-[#020617]">
                        {scanMode ? (
                            <div className="relative">
                                <input type="text" autoFocus className="w-full bg-black border-2 border-emerald-500/50 text-emerald-400 font-mono text-center text-xl p-3 rounded" placeholder="SCAN BARCODE..." />
                                <div className="text-[10px] text-center text-emerald-600 mt-2 animate-pulse">Running Barcode Listener...</div>
                            </div>
                        ) : (
                            <div className="pt-1">
                                <AsyncProductCombobox
                                    onSelect={(product) => {
                                        if (!product) return;
                                        handleSelectProduct(product);
                                    }}
                                    placeholder="Search products... (Alt+P)"
                                />
                                <div className="flex justify-between mt-2 text-[10px] text-slate-500">
                                    <span>Select to add to invoice</span>
                                    <span>Type to search</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* QUICK RESULTS / LINKS */}
                    <div className="flex-1 overflow-y-auto p-2">
                        {searchQuery && (
                            <div className="space-y-1">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div
                                        key={i}
                                        onClick={() => handleSelectProduct({ id: i, name: `Sample Product ${i}`, price: 10 + i, cost: 5 })}
                                        className="p-3 bg-slate-800/30 border border-slate-700/50 rounded hover:bg-indigo-600/10 hover:border-indigo-500 cursor-pointer group transition-all"
                                    >
                                        <div className="flex justify-between">
                                            <span className="font-bold text-slate-200 group-hover:text-white">Sample Product {i}</span>
                                            <span className="font-mono text-emerald-400 font-bold">{formatCurrency(12.50, store)}</span>
                                        </div>
                                        <div className="flex justify-between mt-1 text-[10px] text-slate-500">
                                            <span>Ware A: 50pcs</span>
                                            <span>Shelf: A-12</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!searchQuery && !scanMode && (
                            <div className="mt-8 px-4 grid grid-cols-2 gap-4">
                                {/* SHORTCUTS / LINKS */}
                                <button className="aspect-square bg-slate-900 border border-slate-800 rounded flex flex-col items-center justify-center hover:bg-slate-800 hover:border-slate-700 text-slate-500 hover:text-indigo-400 transition-all">
                                    <Calculator className="w-6 h-6 mb-2" />
                                    <span className="text-[10px] uppercase font-bold">Calculator</span>
                                </button>
                                <button className="aspect-square bg-slate-900 border border-slate-800 rounded flex flex-col items-center justify-center hover:bg-slate-800 hover:border-slate-700 text-slate-500 hover:text-emerald-400 transition-all">
                                    <Truck className="w-6 h-6 mb-2" />
                                    <span className="text-[10px] uppercase font-bold">Shipping</span>
                                </button>
                                <button className="aspect-square bg-slate-900 border border-slate-800 rounded flex flex-col items-center justify-center hover:bg-slate-800 hover:border-slate-700 text-slate-500 hover:text-amber-400 transition-all">
                                    <History className="w-6 h-6 mb-2" />
                                    <span className="text-[10px] uppercase font-bold">Recent</span>
                                </button>
                                <button className="aspect-square bg-slate-900 border border-slate-800 rounded flex flex-col items-center justify-center hover:bg-slate-800 hover:border-slate-700 text-slate-500 hover:text-red-400 transition-all">
                                    <AlertTriangle className="w-6 h-6 mb-2" />
                                    <span className="text-[10px] uppercase font-bold">Hold Bill</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ACTIVITY STREAM (THE MEMORY) */}
                    <div className="h-48 border-t border-slate-800 bg-[#020617] flex flex-col">
                        <div className="p-2 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-500 flex justify-between items-center">
                            <span>System Activity Log</span>
                            <RefreshCcw className="w-3 h-3" />
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2 font-mono text-[10px]">
                            {auditLog.map(log => (
                                <div key={log.id} className="flex space-x-2 text-slate-500">
                                    <span className="text-slate-600">{log.time}</span>
                                    <span className="text-indigo-400 font-bold">{log.action}</span>
                                    <span className="truncate">{log.details}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
