import React, { useState, useMemo, useRef } from 'react';
import { getCurrencySymbol } from '@/Utils/format';
import { Head, router, usePage, Link } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import MoneyModuleTabs from '@/Components/MoneyModuleTabs';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import {
    Wallet,
    Landmark,
    Plus,
    Minus,
    ArrowLeftRight,
    Settings2,
    TrendingUp,
    Clock,
    X,
    AlertCircle,
    Search,
    Filter,
    ExternalLink
} from 'lucide-react';

import SecurityPinModal from '@/Components/SecurityPinModal';

// --- Components ---

// Modal Component (Reused)
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <X size={18} className="text-slate-400" />
                    </button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
};

// 3D Glassy Feature Card (Updated: Smaller height, improved z-index/padding handling)
const ActionCard3D = ({ icon: Icon, title, description, colorClass, glowColor, onClick, delay = 0 }) => {
    const cardRef = useRef(null);
    const glowRef = useRef(null);

    const handleMouseMove = (e) => {
        if (!cardRef.current || !glowRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;

        cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

        const glowX = (x / rect.width) * 100;
        const glowY = (y / rect.height) * 100;
        glowRef.current.style.opacity = '1';
        glowRef.current.style.background = `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255,255,255,0.2), transparent 70%)`;
    };

    const handleMouseLeave = () => {
        if (!cardRef.current || !glowRef.current) return;
        cardRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        glowRef.current.style.opacity = '0';
    };

    return (
        <button
            onClick={onClick}
            className="group relative w-full h-[120px] cursor-pointer block animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-backwards z-10 hover:z-20"
            style={{ animationDelay: `${delay}ms` }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* Background Blob */}
            <div className={`absolute inset-0 ${colorClass} rounded-2xl blur-[30px] opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />

            {/* Card Content */}
            <div
                ref={cardRef}
                className="relative h-full w-full bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 p-4 flex flex-col items-center justify-center text-center transition-transform duration-100 ease-out will-change-transform shadow-sm group-hover:shadow-xl dark:shadow-black/50"
                style={{ transformStyle: 'preserve-3d' }}
            >
                <div ref={glowRef} className="absolute inset-0 transition-opacity duration-300 pointer-events-none opacity-0 mix-blend-soft-light z-20 rounded-2xl" />

                <div className="relative z-10 flex flex-col items-center">
                    <div className={`mb-2 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 ${glowColor} shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                        <Icon size={20} />
                    </div>
                    <h3 className="text-sm font-bold mb-0.5 text-slate-800 dark:text-white group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors">
                        {title}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-medium">
                        {description}
                    </p>
                </div>
            </div>
        </button>
    );
};

// Graph Component (Updated: Visible axes)
const FundFlowChart = ({ transactions, store }) => {
    const data = useMemo(() => {
        const grouped = {};
        [...transactions].reverse().forEach(tx => {
            const dateStr = tx.created_at.split(' ').slice(0, 3).join(' ');
            if (!grouped[dateStr]) {
                grouped[dateStr] = { name: dateStr.split(',')[0], income: 0, expense: 0, net: 0 };
            }
            const amount = parseFloat(tx.amount);
            if (tx.type === 'add') {
                grouped[dateStr].income += amount;
                grouped[dateStr].net += amount;
            } else if (tx.type === 'remove') {
                grouped[dateStr].expense += amount;
                grouped[dateStr].net -= amount;
            }
        });
        const result = Object.values(grouped);
        // Ensure dummy data if empty for visual check
        if (result.length === 0) {
            return [{ name: 'Today', income: 0, expense: 0 }];
        }
        return result;
    }, [transactions]);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm h-full min-h-[300px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600">
                        <TrendingUp size={16} />
                    </div>
                    Fund Flow Analysis
                </h2>
                <div className="flex gap-2">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div> In
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-rose-500"></div> Out
                    </span>
                </div>
            </div>

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" strokeOpacity={0.5} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            tickFormatter={(val) => `${getCurrencySymbol()} ${val / 1000}k`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }}
                            itemStyle={{ fontSize: '12px' }}
                        />
                        <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                        <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// --- Main Page Component ---

export default function FundManagement({ cashAccount, bankAccounts = [], transactions = [], ledger = [], totalFunds = 0, stats = {} }) {
    const { flash, store } = usePage().props;

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
    const confirmSubmit = () => {
        if (!pendingAction) return;
        
        setProcessing(true);
        router.post(route(`store.funds.${pendingAction}`, { store_slug: store.slug }), formData, {
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

    return (
        <OneGlanceLayout title="Fund Management" activeMenu="Money">
            <Head title="Fund Management" />

            {/* Security Passcode Modal */}
            <SecurityPinModal
                isOpen={isSecurityModalOpen}
                onClose={() => {
                    setIsSecurityModalOpen(false);
                    setPendingAction(null);
                }}
                onSuccess={confirmSubmit}
                store={store}
            />

            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-2 overflow-hidden">

                {/* 1. Main Tabs */}
                <MoneyModuleTabs activeTab="funds" className="!mb-2" />

                {/* 2. Sub Navigation Bar */}
                <div className="flex items-center gap-2 overflow-x-auto p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0 no-scrollbar">
                    <button
                        onClick={() => handleNavClick('dashboard')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${mode === 'dashboard' ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                        <Settings2 size={16} /> Dashboard
                    </button>
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    <button
                        onClick={() => handleNavClick('transactions', 'all')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${mode === 'transactions' && subMode === 'all' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                        All Transactions
                    </button>
                    <button
                        onClick={() => handleNavClick('transactions', 'deposits')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${mode === 'transactions' && subMode === 'deposits' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                        Deposits <span className="text-[10px] bg-emerald-200 dark:bg-emerald-800 px-1.5 rounded-full ml-1">Add</span>
                    </button>
                    <button
                        onClick={() => handleNavClick('transactions', 'withdrawals')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${mode === 'transactions' && subMode === 'withdrawals' ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                        Withdrawals <span className="text-[10px] bg-rose-200 dark:bg-rose-800 px-1.5 rounded-full ml-1">Rem</span>
                    </button>
                    <button
                        onClick={() => handleNavClick('transactions', 'transfers')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${mode === 'transactions' && subMode === 'transfers' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                        Transfers
                    </button>
                    <button
                        onClick={() => handleNavClick('transactions', 'adjustments')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${mode === 'transactions' && subMode === 'adjustments' ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                        Adjustments
                    </button>
                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    <button
                        onClick={() => handleNavClick('transactions', 'sales')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${mode === 'transactions' && subMode === 'sales' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                        Sales
                    </button>
                    <button
                        onClick={() => handleNavClick('transactions', 'purchases')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${mode === 'transactions' && subMode === 'purchases' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                        Purchases
                    </button>
                    <button
                        onClick={() => handleNavClick('transactions', 'expenses')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${mode === 'transactions' && subMode === 'expenses' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                        Expenses
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden animate-in fade-in duration-300">

                    {/* MODE 1: DASHBOARD */}
                    {mode === 'dashboard' && (
                        <div className="flex flex-col h-full gap-4 p-1">

                            {/* 3D Action Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 p-2 shrink-0">
                                <ActionCard3D
                                    icon={Plus}
                                    title="Add Funds"
                                    description="Capital Injection"
                                    colorClass="bg-emerald-500"
                                    glowColor="text-emerald-500 dark:text-emerald-400"
                                    onClick={() => setActiveModal('add')}
                                    delay={0}
                                />
                                <ActionCard3D
                                    icon={Minus}
                                    title="Remove Funds"
                                    description="Owner Drawing"
                                    colorClass="bg-rose-500"
                                    glowColor="text-rose-500 dark:text-rose-400"
                                    onClick={() => setActiveModal('remove')}
                                    delay={100}
                                />
                                <ActionCard3D
                                    icon={ArrowLeftRight}
                                    title="Transfer"
                                    description="Move Money"
                                    colorClass="bg-blue-500"
                                    glowColor="text-blue-500 dark:text-blue-400"
                                    onClick={() => setActiveModal('transfer')}
                                    delay={200}
                                />
                                <ActionCard3D
                                    icon={Settings2}
                                    title="Adjust"
                                    description="Fix Balance"
                                    colorClass="bg-amber-500"
                                    glowColor="text-amber-500 dark:text-amber-400"
                                    onClick={() => setActiveModal('adjust')}
                                    delay={300}
                                />
                            </div>

                            {/* Middle Section: Chart and Stats */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 shrink-0 h-[250px] lg:h-[300px]">

                                {/* Chart Section (Spans 8 cols) */}
                                <div className="lg:col-span-8 h-full">
                                    <FundFlowChart transactions={transactions} store={store} />
                                </div>

                                {/* Financial Pulse (Spans 4 cols) - Midnight Nebula Theme */}
                                <div className="lg:col-span-4 h-full flex flex-col">
                                    <div className="flex-1 bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group border border-slate-800">
                                        {/* Stars/Noise Overlay */}
                                        <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-20 pointer-events-none"></div>
                                        <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-colors duration-500"></div>
                                        <div className="absolute bottom-0 left-0 p-24 bg-purple-500/10 rounded-full blur-3xl -ml-12 -mb-12 group-hover:bg-purple-500/20 transition-colors duration-500"></div>

                                        <div className="relative z-10 flex flex-col justify-between h-full">
                                            <div>
                                                <h3 className="text-slate-400 font-medium text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)] animate-pulse"></div>
                                                    Total Business Liquidity
                                                </h3>
                                                <h2 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300">
                                                    {getCurrencySymbol()} {parseFloat(totalFunds).toLocaleString()}
                                                </h2>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mt-6">
                                                <div className="bg-white/5 rounded-xl p-3 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                                                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Cash In Hand</p>
                                                    <p className="font-bold text-lg text-emerald-400">{getCurrencySymbol()} {parseFloat(cashAccount.balance).toLocaleString()}</p>
                                                </div>
                                                <div className="bg-white/5 rounded-xl p-3 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                                                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Bank Accounts</p>
                                                    <p className="font-bold text-lg text-blue-400">{getCurrencySymbol()} {bankAccounts.reduce((sum, b) => sum + parseFloat(b.balance), 0).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity (Expanded to fill remaining space) */}
                            <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                                <div className="flex justify-between items-center mb-4 shrink-0">
                                    <h3 className="text-slate-800 dark:text-white font-bold flex items-center gap-2">
                                        <Clock size={16} className="text-slate-400" /> Recent Activity
                                    </h3>
                                    <button 
                                        onClick={() => setMode('transactions')}
                                        className="text-[10px] font-black uppercase text-indigo-500 hover:text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                                    >
                                        Full History <ExternalLink size={10} />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                                    {transactions.slice(0, 10).map(tx => (
                                        <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                    ['add', 'sale'].includes(tx.type) ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                                                    ['remove', 'purchase', 'expense'].includes(tx.type) ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600' :
                                                    'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                                                }`}>
                                                    {['add', 'sale'].includes(tx.type) ? <Plus size={18} /> :
                                                     ['remove', 'purchase', 'expense'].includes(tx.type) ? <Minus size={18} /> :
                                                     <ArrowLeftRight size={18} />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-white text-sm line-clamp-1">{tx.reason || 'Transaction'}</p>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                        <span>{tx.created_at}</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700"></span>
                                                        <span>{tx.account_name}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`text-sm font-bold ${tx.type === 'add' ? 'text-emerald-600' :
                                                tx.type === 'remove' ? 'text-rose-600' :
                                                    'text-slate-700 dark:text-slate-300'
                                                }`}>
                                                {tx.type === 'add' ? '+' : tx.type === 'remove' ? '-' : ''} {getCurrencySymbol()} {parseFloat(tx.amount).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                    {transactions.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-3">
                                                <Clock size={24} className="opacity-50" />
                                            </div>
                                            <p className="text-sm">No recent activity</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MODE 2: ALL TRANSACTIONS */}
                    {mode === 'transactions' && (
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full mb-4">
                            {/* Toolbar */}
                            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/50 text-black dark:text-white">
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <div className="relative w-full sm:w-64">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            placeholder="Search..."
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 flex items-center gap-2 cursor-pointer">
                                        <Filter size={14} className="text-slate-400" />
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                            {filteredTransactions.length} records
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="flex-1 overflow-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                        <tr>
                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase w-[15%]">Date</th>
                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase w-[10%]">Type</th>
                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase w-[30%]">Details</th>
                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase w-[15%]">Account</th>
                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right w-[15%]">Amount</th>
                                            <th className="p-4 text-xs font-bold text-slate-500 uppercase w-[15%] text-right">Reference</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {filteredTransactions.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="p-12 text-center text-slate-400">
                                                    <p>No transactions match your search.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredTransactions.map(tx => (
                                                <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="p-4 text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">{tx.created_at}</td>
                                                    <td className="p-4">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                                                            ['add', 'sale'].includes(tx.type) ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                            ['remove', 'purchase', 'expense'].includes(tx.type) ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                                            tx.type === 'transfer' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                            'bg-orange-50 text-orange-600 border-orange-200'
                                                        }`}>
                                                            {tx.type === 'add' ? 'Capital Add' : 
                                                             tx.type === 'remove' ? 'Withdrawal' :
                                                             tx.type === 'sale' ? 'Sale' :
                                                             tx.type === 'purchase' ? 'Purchase' :
                                                             tx.type === 'expense' ? 'Expense' :
                                                             tx.type === 'transfer' ? 'Transfer' : 
                                                             'Adjustment'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <p className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">{tx.reason}</p>
                                                        {tx.notes && <p className="text-xs text-slate-400 line-clamp-1 italic">{tx.notes}</p>}
                                                    </td>
                                                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{tx.account_name}</td>
                                                    <td className={`p-4 text-right text-sm font-black tabular-nums ${
                                                        tx.is_outgoing ? 'text-rose-600' : 'text-emerald-600'
                                                    }`}>
                                                        {tx.is_outgoing ? '-' : '+'} {getCurrencySymbol()} {parseFloat(tx.amount).toLocaleString()}
                                                    </td>
                                                    <td className="p-4 text-right text-xs font-mono text-slate-400">{tx.reference || '-'}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}


                </div>
            </div>

            {/* --- MODALS --- */}

            {/* Add Funds Modal */}
            <Modal isOpen={activeModal === 'add'} onClose={() => setActiveModal(null)} title="Add Funds">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Add To</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => setFormData({ ...formData, account_type: 'cash' })} className={`p-3 rounded-xl border-2 transition-all ${formData.account_type === 'cash' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                                <Wallet size={20} className="mx-auto mb-1 text-emerald-500" />
                                <p className="text-sm font-medium">Cash</p>
                            </button>
                            <button type="button" onClick={() => setFormData({ ...formData, account_type: 'bank' })} className={`p-3 rounded-xl border-2 transition-all ${formData.account_type === 'bank' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                                <Landmark size={20} className="mx-auto mb-1 text-blue-500" />
                                <p className="text-sm font-medium">Bank</p>
                            </button>
                        </div>
                    </div>
                    {formData.account_type === 'bank' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select Bank Account</label>
                            <select value={formData.bank_account_id} onChange={e => setFormData({ ...formData, bank_account_id: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                                <option value="">Select account...</option>
                                {bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Amount ({getCurrencySymbol()})</label>
                        <input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="Enter amount" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-bold" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Reason</label>
                        <input type="text" value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} placeholder="e.g., Owner capital investment" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <button onClick={() => handleSubmit('add')} disabled={processing || !formData.amount || !formData.reason} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-bold rounded-xl transition-colors">
                        {processing ? 'Processing...' : 'Add Funds'}
                    </button>
                </div>
            </Modal>

            {/* Remove Funds Modal */}
            <Modal isOpen={activeModal === 'remove'} onClose={() => setActiveModal(null)} title="Remove Funds">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Remove From</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => setFormData({ ...formData, account_type: 'cash' })} className={`p-3 rounded-xl border-2 transition-all ${formData.account_type === 'cash' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                                <Wallet size={20} className="mx-auto mb-1 text-emerald-500" />
                                <p className="text-sm font-medium">Cash</p>
                            </button>
                            <button type="button" onClick={() => setFormData({ ...formData, account_type: 'bank' })} className={`p-3 rounded-xl border-2 transition-all ${formData.account_type === 'bank' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                                <Landmark size={20} className="mx-auto mb-1 text-blue-500" />
                                <p className="text-sm font-medium">Bank</p>
                            </button>
                        </div>
                    </div>
                    {formData.account_type === 'bank' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select Bank Account</label>
                            <select value={formData.bank_account_id} onChange={e => setFormData({ ...formData, bank_account_id: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                                <option value="">Select account...</option>
                                {bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Amount ({getCurrencySymbol()})</label>
                        <input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="Enter amount" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-bold" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Reason</label>
                        <input type="text" value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} placeholder="e.g., Owner personal withdrawal" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <button onClick={() => handleSubmit('remove')} disabled={processing || !formData.amount || !formData.reason} className="w-full py-3 bg-red-500 hover:bg-red-600 disabled:bg-slate-300 text-white font-bold rounded-xl transition-colors">
                        {processing ? 'Processing...' : 'Remove Funds'}
                    </button>
                </div>
            </Modal>

            {/* Transfer Modal */}
            <Modal isOpen={activeModal === 'transfer'} onClose={() => setActiveModal(null)} title="Transfer Funds">
                <div className="space-y-4">
                    <div className="space-y-6">
                        {/* FROM SECTION */}
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Transfer From</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, from_type: 'cash' })}
                                    className={`relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 ${formData.from_type === 'cash' ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 shadow-lg shadow-indigo-500/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${formData.from_type === 'cash' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                            <Wallet size={18} />
                                        </div>
                                        <span className={`text-sm font-black ${formData.from_type === 'cash' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>Cash</span>
                                    </div>
                                    {formData.from_type === 'cash' && <div className="w-2 h-2 rounded-full bg-indigo-500"></div>}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, from_type: 'bank' })}
                                    className={`relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 ${formData.from_type === 'bank' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 shadow-lg shadow-blue-500/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${formData.from_type === 'bank' ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                            <Landmark size={18} />
                                        </div>
                                        <span className={`text-sm font-black ${formData.from_type === 'bank' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>Bank</span>
                                    </div>
                                    {formData.from_type === 'bank' && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                                </button>
                            </div>
                            {formData.from_type === 'bank' && (
                                <div className="mt-3 animate-in slide-in-from-top-2 duration-300">
                                    <select
                                        value={formData.from_bank_id}
                                        onChange={e => setFormData({ ...formData, from_bank_id: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-bold transition-all shadow-inner"
                                    >
                                        <option value="">Select Origin Bank Account...</option>
                                        {bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} ({getCurrencySymbol()} {parseFloat(acc.balance).toLocaleString()})</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* ARROW DIVIDER */}
                        <div className="flex justify-center -my-2 relative z-10">
                            <div className="bg-white dark:bg-slate-800 p-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-xl text-slate-400">
                                <Minus className="rotate-90" size={16} />
                            </div>
                        </div>

                        {/* TO SECTION */}
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Transfer To</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, to_type: 'cash' })}
                                    className={`relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 ${formData.to_type === 'cash' ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 shadow-lg shadow-indigo-500/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${formData.to_type === 'cash' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                            <Wallet size={18} />
                                        </div>
                                        <span className={`text-sm font-black ${formData.to_type === 'cash' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>Cash</span>
                                    </div>
                                    {formData.to_type === 'cash' && <div className="w-2 h-2 rounded-full bg-indigo-500"></div>}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, to_type: 'bank' })}
                                    className={`relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 ${formData.to_type === 'bank' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 shadow-lg shadow-blue-500/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${formData.to_type === 'bank' ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                            <Landmark size={18} />
                                        </div>
                                        <span className={`text-sm font-black ${formData.to_type === 'bank' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>Bank</span>
                                    </div>
                                    {formData.to_type === 'bank' && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                                </button>
                            </div>
                            {formData.to_type === 'bank' && (
                                <div className="mt-3 animate-in slide-in-from-top-2 duration-300">
                                    <select
                                        value={formData.to_bank_id}
                                        onChange={e => setFormData({ ...formData, to_bank_id: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-bold transition-all shadow-inner"
                                    >
                                        <option value="">Select Destination Bank Account...</option>
                                        {bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Amount ({getCurrencySymbol()})</label>
                        <input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="Enter amount" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-bold" />
                    </div>
                    <button onClick={() => handleSubmit('transfer')} disabled={processing || !formData.amount} className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white font-bold rounded-xl transition-colors">
                        {processing ? 'Processing...' : 'Transfer Funds'}
                    </button>
                </div>
            </Modal>

            {/* Adjust Balance Modal */}
            <Modal isOpen={activeModal === 'adjust'} onClose={() => setActiveModal(null)} title="Adjust Balance">
                <div className="space-y-4">
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
                        <p className="text-sm text-orange-700 dark:text-orange-300">
                            <AlertCircle size={16} className="inline mr-2" />
                            Use this to correct discrepancies between physical count and system balance.
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Account</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => setFormData({ ...formData, account_type: 'cash', new_balance: cashAccount.balance })} className={`p-3 rounded-xl border-2 transition-all ${formData.account_type === 'cash' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                                <Wallet size={20} className="mx-auto mb-1 text-emerald-500" />
                                <p className="text-sm font-medium">Cash</p>
                                <p className="text-xs text-slate-400">{getCurrencySymbol()} {parseFloat(cashAccount.balance).toLocaleString()}</p>
                            </button>
                            <button type="button" onClick={() => setFormData({ ...formData, account_type: 'bank' })} className={`p-3 rounded-xl border-2 transition-all ${formData.account_type === 'bank' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                                <Landmark size={20} className="mx-auto mb-1 text-blue-500" />
                                <p className="text-sm font-medium">Bank</p>
                            </button>
                        </div>
                    </div>
                    {formData.account_type === 'bank' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select Bank Account</label>
                            <select value={formData.bank_account_id} onChange={e => setFormData({ ...formData, bank_account_id: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                                <option value="">Select account...</option>
                                {bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} - {getCurrencySymbol()} {parseFloat(acc.balance).toLocaleString()}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Correct Balance ({getCurrencySymbol()})</label>
                        <input type="number" value={formData.new_balance} onChange={e => setFormData({ ...formData, new_balance: e.target.value })} placeholder="Enter actual balance" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-bold" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Reason for Adjustment</label>
                        <input type="text" value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} placeholder="e.g., Physical cash count correction" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" />
                    </div>
                    <button onClick={() => handleSubmit('adjust')} disabled={processing || formData.new_balance === '' || !formData.reason} className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-bold rounded-xl transition-colors">
                        {processing ? 'Processing...' : 'Adjust Balance'}
                    </button>
                </div>
            </Modal>
        </OneGlanceLayout>
    );
}
