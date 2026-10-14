import React, { useState, useMemo } from 'react';
import { getCurrencySymbol } from '@/Utils/format';
import { router, usePage } from '@inertiajs/react';
import MoneyModuleTabs, { useMoneyNavGroups } from '@/Components/MoneyModuleTabs';
import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable, filterInputCls } from '@/Components/Reports/ReportKit';
import { TrendChart, DonutChart, RankBars } from '@/Components/Reports/ReportCharts';
import { Wallet, Landmark, Plus, Minus, ArrowLeftRight, Settings2, TrendingUp, Clock, X, AlertCircle, Search, PieChart, BarChart3, ListOrdered } from 'lucide-react';

import ElevatedPinModal from '@/Components/ElevatedPinModal';

// Modal Component (Reused)
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-surface rounded-[14px] shadow-2xl w-full max-w-md border border-line overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex min-h-14 items-center justify-between gap-2 px-4 border-b border-line">
                    <h3 className="text-base font-bold text-ink">{title}</h3>
                    <button onClick={onClose} className="flex h-10 w-10 items-center justify-center hover:bg-interactive-hover rounded-[12px] transition-colors">
                        <X size={18} className="text-ink-muted" />
                    </button>
                </div>
                <div className="p-4 max-h-[80vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};

const IN_TYPES = ['add', 'sale'];
const OUT_TYPES = ['remove', 'purchase', 'expense'];
const typeLabel = (t) => ({ add: 'Capital Add', remove: 'Withdrawal', sale: 'Sale', purchase: 'Purchase', expense: 'Expense', transfer: 'Transfer' }[t] || 'Adjustment');
const typeTone = (t) => IN_TYPES.includes(t) ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : OUT_TYPES.includes(t) ? 'bg-rose-50 text-rose-600 border-rose-200' : t === 'transfer' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-orange-50 text-orange-600 border-orange-200';

export default function FundManagement({ cashAccount, bankAccounts = [], transactions = [], ledger = [], totalFunds = 0, stats = {} }) {
    const { flash, store } = usePage().props;
    const moneyNavGroups = useMoneyNavGroups();

    // UI State
    const [mode, setMode] = useState('dashboard');
    const [subMode, setSubMode] = useState('all');

    // Handle initial view from URL
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('view') === 'history') {
            setMode('transactions');
            setSubMode('all');
        }

        const actionParam = params.get('action') || params.get('modal');
        if (['add', 'remove', 'transfer', 'adjust'].includes(actionParam)) {
            setActiveModal(actionParam);
        }
    }, []);

    const [activeModal, setActiveModal] = useState(null);
    const [processing, setProcessing] = useState(false);

    // Security PIN State
    const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // 'add' | 'remove' | 'transfer' | 'adjust'
    const [verifiedPin, setVerifiedPin] = useState('');

    // Search/Sort State
    const [searchTerm, setSearchTerm] = useState('');

    // Form Data
    const [formData, setFormData] = useState({
        account_type: 'cash',
        bank_account_id: '',
        amount: '',
        reason: '',
        notes: '',
        new_balance: '',
        from_type: 'bank',
        from_bank_id: '',
        to_type: 'cash',
        to_bank_id: '',
    });

    // Helper: Reset Form
    const resetForm = () => {
        setFormData({
            account_type: 'cash',
            bank_account_id: '',
            amount: '',
            reason: '',
            notes: '',
            new_balance: '',
            from_type: 'bank',
            from_bank_id: '',
            to_type: 'cash',
            to_bank_id: ''
        });
    };

    // Helper: Trigger Handle Submit with Security Check
    const handleSubmit = (action) => {
        setPendingAction(action);
        setIsSecurityModalOpen(true);
    };

    // Helper: Execute the final submission
    const confirmSubmit = (pin) => {
        if (!pendingAction) return;
        
        setProcessing(true);
        router.post(route(`store.funds.${pendingAction}`, { store_slug: store.slug }), {
            ...formData,
            passcode: pin,
        }, {
            onSuccess: () => {
                setActiveModal(null);
                setIsSecurityModalOpen(false);
                setPendingAction(null);
                resetForm();
            },
            onFinish: () => {
                setProcessing(false);
                setIsSecurityModalOpen(false);
                setPendingAction(null);
            }
        });
    };

    // Navigation Helper
    const handleNavClick = (newMode, newSubMode = 'all') => {
        setMode(newMode);
        setSubMode(newSubMode);
    };

    // Filter Transactions Logic
    const filteredTransactions = useMemo(() => {
        let data = [...transactions];

        if (subMode === 'deposits') data = data.filter(t => t.type === 'add');
        if (subMode === 'withdrawals') data = data.filter(t => t.type === 'remove');
        if (subMode === 'transfers') data = data.filter(t => t.type === 'transfer');
        if (subMode === 'adjustments') data = data.filter(t => t.type === 'adjust');
        if (subMode === 'sales') data = data.filter(t => t.type === 'sale');
        if (subMode === 'purchases') data = data.filter(t => t.type === 'purchase');
        if (subMode === 'expenses') data = data.filter(t => t.type === 'expense');

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            data = data.filter(t =>
                (t.reason?.toLowerCase() || '').includes(lower) ||
                (t.notes?.toLowerCase() || '').includes(lower) ||
                (t.amount?.toString() || '').includes(lower)
            );
        }

        return data;
    }, [transactions, subMode, searchTerm]);

    const sym = getCurrencySymbol();
    const money = (v) => `${sym} ${(parseFloat(v) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const bankTotal = bankAccounts.reduce((sum, b) => sum + (parseFloat(b.balance) || 0), 0);
    const cashBal = parseFloat(cashAccount?.balance) || 0;

    // Daily money in / out (transfers and adjustments are not income or spend)
    const flow = useMemo(() => {
        const grouped = new Map();
        [...transactions].reverse().forEach((tx) => {
            if (tx.type === 'transfer' || tx.type === 'adjust') return;
            const day = String(tx.created_at || '').split(' ').slice(0, 2).join(' ');
            if (!day) return;
            const g = grouped.get(day) || { in: 0, out: 0 };
            const amount = parseFloat(tx.amount) || 0;
            if (tx.is_outgoing) g.out += amount; else g.in += amount;
            grouped.set(day, g);
        });
        const days = [...grouped.keys()];
        return {
            series: [
                { name: 'Money in', points: days.map((d) => ({ x: d, y: grouped.get(d).in })) },
                { name: 'Money out', points: days.map((d) => ({ x: d, y: grouped.get(d).out })) },
            ],
            totalIn: days.reduce((s, d) => s + grouped.get(d).in, 0),
            totalOut: days.reduce((s, d) => s + grouped.get(d).out, 0),
        };
    }, [transactions]);

    const accountSlices = [
        { name: cashAccount?.name || 'Cash in Hand', value: Math.max(0, cashBal) },
        ...bankAccounts.map((b) => ({ name: b.name, value: Math.max(0, parseFloat(b.balance) || 0) })),
    ].filter((s) => s.value > 0);

    const biggest = useMemo(() => [...transactions]
        .filter((t) => t.type !== 'transfer' && t.type !== 'adjust')
        .sort((a, b) => (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0))
        .slice(0, 6)
        .map((t) => ({ label: t.reason || typeLabel(t.type), value: parseFloat(t.amount) || 0, sub: typeLabel(t.type) })), [transactions]);

    const txColumns = [
        { key: 'created_at', label: 'Date', width: 190, className: 'whitespace-nowrap' },
        { key: 'type', label: 'Type', width: 130, render: (tx) => (
            <span className={`inline-flex h-6 items-center rounded-[8px] border px-2 text-2xs font-bold uppercase tracking-wide ${typeTone(tx.type)}`}>{typeLabel(tx.type)}</span>
        ) },
        { key: 'reason', label: 'Details', render: (tx) => <span className="font-semibold text-ink">{tx.reason}{tx.notes ? <span className="ml-2 text-xs font-normal italic text-ink-muted">{tx.notes}</span> : null}</span> },
        { key: 'account_name', label: 'Account' },
        { key: 'amount', label: 'Amount', align: 'right', get: (tx) => parseFloat(tx.amount) || 0, render: (tx) => (
            <span className={`font-bold tabular-nums ${tx.is_outgoing ? 'text-rose-600' : 'text-emerald-600'}`}>{tx.is_outgoing ? '-' : '+'} {money(tx.amount)}</span>
        ) },
        { key: 'reference', label: 'Reference', align: 'right', get: (tx) => tx.reference || '-', className: 'font-mono text-xs text-ink-muted' },
    ];

    const tabs = [
        ['dashboard', 'all', 'Overview'],
        ['transactions', 'all', 'All Transactions'],
        ['transactions', 'deposits', 'Deposits'],
        ['transactions', 'withdrawals', 'Withdrawals'],
        ['transactions', 'transfers', 'Transfers'],
        ['transactions', 'adjustments', 'Adjustments'],
        ['transactions', 'sales', 'Sales'],
        ['transactions', 'purchases', 'Purchases'],
        ['transactions', 'expenses', 'Expenses'],
    ];

    const actionBtn = (label, Icon, modal, tone) => (
        <button key={modal} type="button" onClick={() => setActiveModal(modal)}
            className={`flex h-10 items-center gap-2 rounded-[12px] px-3 text-sm font-bold transition-colors ${tone}`}>
            <Icon size={16} /><span className="hidden lg:inline">{label}</span>
        </button>
    );
    const actions = (
        <>
            {actionBtn('Add Funds', Plus, 'add', 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400')}
            {actionBtn('Remove Funds', Minus, 'remove', 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400')}
            {actionBtn('Transfer', ArrowLeftRight, 'transfer', 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400')}
            {actionBtn('Adjust', Settings2, 'adjust', 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400')}
        </>
    );

    const filters = (
        <>
            <div className="flex min-w-0 flex-wrap items-center gap-1">
                {tabs.map(([m, s, label]) => {
                    const on = mode === m && subMode === s;
                    return (
                        <button key={label} type="button" onClick={() => handleNavClick(m, s)}
                            className={`h-10 whitespace-nowrap rounded-[12px] px-3 text-sm font-semibold transition-colors ${on ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' : 'text-ink-secondary hover:bg-interactive-hover'}`}>
                            {label}
                        </button>
                    );
                })}
            </div>
            {mode === 'transactions' && (
                <div className="relative ml-auto w-full sm:w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search..." className={`${filterInputCls} w-full pl-10`} />
                </div>
            )}
        </>
    );

    return (
        <>
            <ElevatedPinModal
                isOpen={isSecurityModalOpen}
                onClose={() => {
                    setIsSecurityModalOpen(false);
                    setPendingAction(null);
                }}
                onSuccess={(pin, authorizedBy) => {
                    setVerifiedPin(pin);
                    confirmSubmit(pin);
                }}
                permission="funds.manage"
                actionLabel={pendingAction ? pendingAction + ' funds' : 'this action'}
                store={store}
            />

            <ReportShell title="Fund Management" navGroups={moneyNavGroups} activeKey="funds" activeMenu="Money" showHub={false} actions={actions} filters={filters}
                exportConfig={{
                    filename: 'fund-transactions',
                    columns: [{ label: 'Date', get: (t) => t.created_at }, { label: 'Type', get: (t) => typeLabel(t.type) }, { label: 'Details', get: (t) => t.reason }, { label: 'Account', get: (t) => t.account_name }, { label: 'Amount', get: (t) => (t.is_outgoing ? -1 : 1) * (parseFloat(t.amount) || 0) }, { label: 'Reference', get: (t) => t.reference }],
                    rows: filteredTransactions,
                }}>
                <div className="md:hidden"><MoneyModuleTabs activeTab="funds" className="!mb-2" /></div>

                {mode === 'dashboard' && (
                    <>
                        <ReportKpis items={[
                            { label: 'Total liquidity', value: money(totalFunds), icon: Wallet, tone: 'violet' },
                            { label: 'Cash in hand', value: money(cashBal), icon: Wallet, tone: 'emerald' },
                            { label: 'Bank accounts', value: money(bankTotal), icon: Landmark, tone: 'blue', sub: `${bankAccounts.length} account${bankAccounts.length === 1 ? '' : 's'}` },
                            { label: 'Money in', value: money(flow.totalIn), icon: TrendingUp, tone: 'emerald', valueTone: 'emerald' },
                            { label: 'Money out', value: money(flow.totalOut), icon: TrendingUp, tone: 'rose', valueTone: 'rose' },
                        ]} />

                        <ReportGrid>
                            <ReportCol span={8}>
                                <ReportSection title="Fund flow" subtitle="Money in vs out by day" icon={BarChart3} tone="emerald">
                                    <TrendChart series={flow.series} type="area" height={260} />
                                </ReportSection>
                            </ReportCol>
                            <ReportCol span={4}>
                                <ReportSection title="Balance by account" icon={PieChart} tone="violet">
                                    <DonutChart slices={accountSlices} height={260} />
                                </ReportSection>
                            </ReportCol>
                        </ReportGrid>

                        <ReportGrid>
                            <ReportCol span={4}>
                                <ReportSection title="Largest movements" icon={ListOrdered} tone="amber">
                                    <RankBars items={biggest} limit={6} />
                                </ReportSection>
                            </ReportCol>
                            <ReportCol span={8}>
                                <ReportSection title="Recent activity" icon={Clock} tone="brand" flush
                                    right={<button type="button" onClick={() => handleNavClick('transactions', 'all')} className="flex h-10 items-center rounded-[12px] px-3 text-sm font-bold text-brand-600 hover:bg-interactive-hover">Full history</button>}>
                                    <ReportTable columns={txColumns} rows={transactions.slice(0, 10)} rowKey={(t) => t.id} pageSize={10} empty="No recent activity" />
                                </ReportSection>
                            </ReportCol>
                        </ReportGrid>
                    </>
                )}

                {mode === 'transactions' && (
                    <ReportSection title="Transactions" subtitle={`${filteredTransactions.length} records`} icon={Clock} tone="brand" flush>
                        <ReportTable columns={txColumns} rows={filteredTransactions} rowKey={(t) => t.id} pageSize={50} empty="No transactions match your search" />
                    </ReportSection>
                )}
            </ReportShell>

            {/* --- MODALS --- */}

            {/* Add Funds Modal */}
            <Modal isOpen={activeModal === 'add'} onClose={() => setActiveModal(null)} title="Add Funds">
                <div className="space-y-2">
                    <div>
                        <label className="block text-sm font-medium text-ink-secondary mb-2">Add To</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => setFormData({ ...formData, account_type: 'cash' })} className={`p-3 rounded-[12px] border-2 transition-all ${formData.account_type === 'cash' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-line'}`}>
                                <Wallet size={20} className="mx-auto mb-1 text-emerald-500" />
                                <p className="text-sm font-medium">Cash</p>
                            </button>
                            <button type="button" onClick={() => setFormData({ ...formData, account_type: 'bank' })} className={`p-3 rounded-[12px] border-2 transition-all ${formData.account_type === 'bank' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-line'}`}>
                                <Landmark size={20} className="mx-auto mb-1 text-blue-500" />
                                <p className="text-sm font-medium">Bank</p>
                            </button>
                        </div>
                    </div>
                    {formData.account_type === 'bank' && (
                        <div>
                            <label className="block text-sm font-medium text-ink-secondary mb-2">Select Bank Account</label>
                            <select value={formData.bank_account_id} onChange={e => setFormData({ ...formData, bank_account_id: e.target.value })} className="w-full h-10 px-3 rounded-[12px] border border-line bg-surface text-ink focus:ring-2 focus:ring-brand-500 outline-none">
                                <option value="">Select account...</option>
                                {bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-ink-secondary mb-2">Amount ({getCurrencySymbol()})</label>
                        <input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="Enter amount" className="w-full h-10 px-3 rounded-[12px] border border-line bg-surface text-ink focus:ring-2 focus:ring-brand-500 outline-none text-lg font-bold" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-ink-secondary mb-2">Reason</label>
                        <input type="text" value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} placeholder="e.g., Owner capital investment" className="w-full h-10 px-3 rounded-[12px] border border-line bg-surface text-ink focus:ring-2 focus:ring-brand-500 outline-none" />
                    </div>
                    <button onClick={() => handleSubmit('add')} disabled={processing || !formData.amount || !formData.reason} className="w-full h-10 bg-emerald-500 hover:bg-emerald-600 disabled:bg-sunken text-white font-bold rounded-[12px] transition-colors">
                        {processing ? 'Processing...' : 'Add Funds'}
                    </button>
                </div>
            </Modal>

            {/* Remove Funds Modal */}
            <Modal isOpen={activeModal === 'remove'} onClose={() => setActiveModal(null)} title="Remove Funds">
                <div className="space-y-2">
                    <div>
                        <label className="block text-sm font-medium text-ink-secondary mb-2">Remove From</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => setFormData({ ...formData, account_type: 'cash' })} className={`p-3 rounded-[12px] border-2 transition-all ${formData.account_type === 'cash' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-line'}`}>
                                <Wallet size={20} className="mx-auto mb-1 text-emerald-500" />
                                <p className="text-sm font-medium">Cash</p>
                            </button>
                            <button type="button" onClick={() => setFormData({ ...formData, account_type: 'bank' })} className={`p-3 rounded-[12px] border-2 transition-all ${formData.account_type === 'bank' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-line'}`}>
                                <Landmark size={20} className="mx-auto mb-1 text-blue-500" />
                                <p className="text-sm font-medium">Bank</p>
                            </button>
                        </div>
                    </div>
                    {formData.account_type === 'bank' && (
                        <div>
                            <label className="block text-sm font-medium text-ink-secondary mb-2">Select Bank Account</label>
                            <select value={formData.bank_account_id} onChange={e => setFormData({ ...formData, bank_account_id: e.target.value })} className="w-full h-10 px-3 rounded-[12px] border border-line bg-surface text-ink focus:ring-2 focus:ring-brand-500 outline-none">
                                <option value="">Select account...</option>
                                {bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-ink-secondary mb-2">Amount ({getCurrencySymbol()})</label>
                        <input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="Enter amount" className="w-full h-10 px-3 rounded-[12px] border border-line bg-surface text-ink focus:ring-2 focus:ring-brand-500 outline-none text-lg font-bold" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-ink-secondary mb-2">Reason</label>
                        <input type="text" value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} placeholder="e.g., Owner personal withdrawal" className="w-full h-10 px-3 rounded-[12px] border border-line bg-surface text-ink focus:ring-2 focus:ring-brand-500 outline-none" />
                    </div>
                    <button onClick={() => handleSubmit('remove')} disabled={processing || !formData.amount || !formData.reason} className="w-full h-10 bg-red-500 hover:bg-red-600 disabled:bg-sunken text-white font-bold rounded-[12px] transition-colors">
                        {processing ? 'Processing...' : 'Remove Funds'}
                    </button>
                </div>
            </Modal>

            {/* Transfer Modal */}
            <Modal isOpen={activeModal === 'transfer'} onClose={() => setActiveModal(null)} title="Transfer Funds">
                <div className="space-y-2">
                    <div className="space-y-2">
                        {/* FROM SECTION */}
                        <div>
                            <label className="block text-2xs font-bold uppercase tracking-widest text-ink-muted mb-3">Transfer From</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, from_type: 'cash' })}
                                    className={`relative flex flex-wrap items-center justify-between gap-y-2 p-4 rounded-[14px] border-2 transition-all duration-slow ${formData.from_type === 'cash' ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-500/10 ' : 'border-line bg-surface'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`p-2 rounded-[12px] ${formData.from_type === 'cash' ? 'bg-brand-500 text-white' : 'bg-sunken text-ink-muted'}`}>
                                            <Wallet size={18} />
                                        </div>
                                        <span className={`text-sm font-bold ${formData.from_type === 'cash' ? 'text-brand-600 dark:text-brand-400' : 'text-ink-muted'}`}>Cash</span>
                                    </div>
                                    {formData.from_type === 'cash' && <div className="w-2 h-2 rounded-full bg-brand-500"></div>}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, from_type: 'bank' })}
                                    className={`relative flex flex-wrap items-center justify-between gap-y-2 p-4 rounded-[14px] border-2 transition-all duration-slow ${formData.from_type === 'bank' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 ' : 'border-line bg-surface'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`p-2 rounded-[12px] ${formData.from_type === 'bank' ? 'bg-blue-500 text-white' : 'bg-sunken text-ink-muted'}`}>
                                            <Landmark size={18} />
                                        </div>
                                        <span className={`text-sm font-bold ${formData.from_type === 'bank' ? 'text-blue-600 dark:text-blue-400' : 'text-ink-muted'}`}>Bank</span>
                                    </div>
                                    {formData.from_type === 'bank' && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                                </button>
                            </div>
                            {formData.from_type === 'bank' && (
                                <div className="mt-3 animate-in slide-in-from-top-2 duration-slow">
                                    <select
                                        value={formData.from_bank_id}
                                        onChange={e => setFormData({ ...formData, from_bank_id: e.target.value })}
                                        className="w-full h-10 px-3 rounded-[12px] border border-line bg-surface text-ink focus:ring-2 focus:ring-brand-500 outline-none text-xs font-bold transition-all "
                                    >
                                        <option value="">Select Origin Bank Account...</option>
                                        {bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({getCurrencySymbol()} {parseFloat(acc.balance).toLocaleString()})</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* ARROW DIVIDER */}
                        <div className="flex justify-center -my-2 relative z-10">
                            <div className="bg-surface p-2 rounded-full border border-line  text-ink-muted">
                                <Minus className="rotate-90" size={16} />
                            </div>
                        </div>

                        {/* TO SECTION */}
                        <div>
                            <label className="block text-2xs font-bold uppercase tracking-widest text-ink-muted mb-3">Transfer To</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, to_type: 'cash' })}
                                    className={`relative flex flex-wrap items-center justify-between gap-y-2 p-4 rounded-[14px] border-2 transition-all duration-slow ${formData.to_type === 'cash' ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-500/10 ' : 'border-line bg-surface'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`p-2 rounded-[12px] ${formData.to_type === 'cash' ? 'bg-brand-500 text-white' : 'bg-sunken text-ink-muted'}`}>
                                            <Wallet size={18} />
                                        </div>
                                        <span className={`text-sm font-bold ${formData.to_type === 'cash' ? 'text-brand-600 dark:text-brand-400' : 'text-ink-muted'}`}>Cash</span>
                                    </div>
                                    {formData.to_type === 'cash' && <div className="w-2 h-2 rounded-full bg-brand-500"></div>}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, to_type: 'bank' })}
                                    className={`relative flex flex-wrap items-center justify-between gap-y-2 p-4 rounded-[14px] border-2 transition-all duration-slow ${formData.to_type === 'bank' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 ' : 'border-line bg-surface'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`p-2 rounded-[12px] ${formData.to_type === 'bank' ? 'bg-blue-500 text-white' : 'bg-sunken text-ink-muted'}`}>
                                            <Landmark size={18} />
                                        </div>
                                        <span className={`text-sm font-bold ${formData.to_type === 'bank' ? 'text-blue-600 dark:text-blue-400' : 'text-ink-muted'}`}>Bank</span>
                                    </div>
                                    {formData.to_type === 'bank' && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                                </button>
                            </div>
                            {formData.to_type === 'bank' && (
                                <div className="mt-3 animate-in slide-in-from-top-2 duration-slow">
                                    <select
                                        value={formData.to_bank_id}
                                        onChange={e => setFormData({ ...formData, to_bank_id: e.target.value })}
                                        className="w-full h-10 px-3 rounded-[12px] border border-line bg-surface text-ink focus:ring-2 focus:ring-brand-500 outline-none text-xs font-bold transition-all "
                                    >
                                        <option value="">Select Destination Bank Account...</option>
                                        {bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-ink-secondary mb-2">Amount ({getCurrencySymbol()})</label>
                        <input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="Enter amount" className="w-full h-10 px-3 rounded-[12px] border border-line bg-surface text-ink focus:ring-2 focus:ring-brand-500 outline-none text-lg font-bold" />
                    </div>
                    <button onClick={() => handleSubmit('transfer')} disabled={processing || !formData.amount} className="w-full h-10 bg-blue-500 hover:bg-blue-600 disabled:bg-sunken text-white font-bold rounded-[12px] transition-colors">
                        {processing ? 'Processing...' : 'Transfer Funds'}
                    </button>
                </div>
            </Modal>

            {/* Adjust Balance Modal */}
            <Modal isOpen={activeModal === 'adjust'} onClose={() => setActiveModal(null)} title="Adjust Balance">
                <div className="space-y-2">
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-[12px]">
                        <p className="text-sm text-orange-700 dark:text-orange-300">
                            <AlertCircle size={16} className="inline mr-2" />
                            Use this to correct discrepancies between physical count and system balance.
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-ink-secondary mb-2">Account</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => setFormData({ ...formData, account_type: 'cash', new_balance: cashAccount.balance })} className={`p-3 rounded-[12px] border-2 transition-all ${formData.account_type === 'cash' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-line'}`}>
                                <Wallet size={20} className="mx-auto mb-1 text-emerald-500" />
                                <p className="text-sm font-medium">Cash</p>
                                <p className="text-xs text-ink-muted">{getCurrencySymbol()} {parseFloat(cashAccount.balance).toLocaleString()}</p>
                            </button>
                            <button type="button" onClick={() => setFormData({ ...formData, account_type: 'bank' })} className={`p-3 rounded-[12px] border-2 transition-all ${formData.account_type === 'bank' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-line'}`}>
                                <Landmark size={20} className="mx-auto mb-1 text-blue-500" />
                                <p className="text-sm font-medium">Bank</p>
                            </button>
                        </div>
                    </div>
                    {formData.account_type === 'bank' && (
                        <div>
                            <label className="block text-sm font-medium text-ink-secondary mb-2">Select Bank Account</label>
                            <select value={formData.bank_account_id} onChange={e => setFormData({ ...formData, bank_account_id: e.target.value })} className="w-full h-10 px-3 rounded-[12px] border border-line bg-surface">
                                <option value="">Select account...</option>
                                {bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} - {getCurrencySymbol()} {parseFloat(acc.balance).toLocaleString()}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-ink-secondary mb-2">Correct Balance ({getCurrencySymbol()})</label>
                        <input type="number" value={formData.new_balance} onChange={e => setFormData({ ...formData, new_balance: e.target.value })} placeholder="Enter actual balance" className="w-full h-10 px-3 rounded-[12px] border border-line bg-surface text-ink focus:ring-2 focus:ring-brand-500 outline-none text-lg font-bold" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-ink-secondary mb-2">Reason for Adjustment</label>
                        <input type="text" value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} placeholder="e.g., Physical cash count correction" className="w-full h-10 px-3 rounded-[12px] border border-line bg-surface" />
                    </div>
                    <button onClick={() => handleSubmit('adjust')} disabled={processing || formData.new_balance === '' || !formData.reason} className="w-full h-10 bg-orange-500 hover:bg-orange-600 disabled:bg-sunken text-white font-bold rounded-[12px] transition-colors">
                        {processing ? 'Processing...' : 'Adjust Balance'}
                    </button>
                </div>
            </Modal>
        </>
    );
}
