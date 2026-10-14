import React, { useState, useEffect, useMemo } from 'react';
import ReportsLayout from '@/Layouts/ReportsLayout';
import { Head, router } from '@inertiajs/react';
import {
 Lock, Unlock, Eye, EyeOff, Activity, RefreshCw, LogOut,
 TrendingUp, Shield, ShieldAlert, Award, FileText, ChevronDown,
 CheckCircle, Save, Sparkles, Scale, DollarSign, Package,
 ArrowRight, CreditCard, ChevronRight, AlertCircle, Calendar, Clock
} from 'lucide-react';
import MidnightNebula from '@/Components/MidnightNebula';
import axios from 'axios';
import { formatCurrency } from '@/Utils/format';
import {
 ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable, filterInputCls,
} from '@/Components/Reports/ReportKit';
import { TrendChart, DonutChart, RankBars } from '@/Components/Reports/ReportCharts';


export default function OwnersDailyPulse({ is_locked, needs_setup, is_owner, store_slug, store_name, snapshots = [] }) {
 // LOCKSCREEN STATES
 const [passcode, setPasscode] = useState('');
 const [showPasscode, setShowPasscode] = useState(false);
 const [error, setError] = useState('');
 const [processing, setProcessing] = useState(false);
 const [shake, setShake] = useState(false);
 const [activeKey, setActiveKey] = useState(null);

 // SETUP STATES
 const [setupPhase, setSetupPhase] = useState('initial'); // initial, setting, confirming
 const [newPasscode, setNewPasscode] = useState('');
 const [confirmPasscode, setConfirmPasscode] = useState('');

 // DASHBOARD STATES
 const [activeTab, setActiveTab] = useState('overview'); // overview, sales, stock, payables, receivables, cash, expenses, net_assets
 const [noteEdits, setNoteEdits] = useState({});
 const [savingNotes, setSavingNotes] = useState({}); // { [date]: 'saving' | 'saved' | 'error' }
 const [saveTimers, setSaveTimers] = useState({});
 const [selectedDate, setSelectedDate] = useState(snapshots[0]?.date || new Date().toISOString().split('T')[0]);

 // PHYSICAL KEYBOARD LISTENER FOR PIN ENTRY
 useEffect(() => {
 if (!is_locked) return;

 const handleKeyDown = (e) => {
 const key = e.key;

 if (/^[0-9]$/.test(key)) {
 e.preventDefault();
 setPasscode(prev => prev + key);
 triggerKeyFlash(key);
 } else if (key === 'Backspace') {
 e.preventDefault();
 setPasscode(prev => prev.slice(0, -1));
 triggerKeyFlash('⌫');
 } else if (key === 'Escape') {
 e.preventDefault();
 setPasscode('');
 triggerKeyFlash('C');
 } else if (key === 'Enter') {
 e.preventDefault();
 handleUnlock();
 }
 };

 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, [is_locked, passcode, needs_setup, setupPhase, newPasscode, confirmPasscode]);

 const triggerKeyFlash = (key) => {
 setActiveKey(key);
 setTimeout(() => setActiveKey(null), 1500);
 };

 // LOCKSCREEN PIN UNLOCK
 const handleUnlock = (e) => {
 if (e) e.preventDefault();
 if (!passcode || processing) return;

 setProcessing(true);
 setError('');

 axios.post(route('store.reports.owner-daily-pulse.verify', { store_slug }), { passcode })
 .then(res => {
 if (res.data.success) {
 window.location.reload();
 }
 })
 .catch(err => {
 setProcessing(false);
 setError(err.response?.data?.message || 'Access Denied: Invalid security passcode.');
 setShake(true);
 setPasscode('');
 setTimeout(() => setShake(false), 500);
 });
 };

 // VIRTUAL KEYPAD CLICK
 const handleKeypadPress = (val, target = 'passcode') => {
 setError('');
 let setter = setPasscode;
 if (target === 'new') setter = setNewPasscode;
 if (target === 'confirm') setter = setConfirmPasscode;

 if (val === 'C') {
 setter('');
 } else if (val === '⌫') {
 setter(prev => prev.slice(0, -1));
 } else {
 setter(prev => prev + val);
 }
 };

 // SETUP ACTIONS
 const handleSetupDisable = () => {
 setProcessing(true);
 axios.post(route('store.reports.owner-daily-pulse.setup', { store_slug }), { action: 'disable' })
 .then(() => window.location.reload())
 .catch(() => setProcessing(false));
 };

 const handleSetupConfirm = () => {
 if (newPasscode !== confirmPasscode) {
 setError('Passcodes do not match!');
 setConfirmPasscode('');
 setShake(true);
 setTimeout(() => setShake(false), 500);
 return;
 }

 setProcessing(true);
 axios.post(route('store.reports.owner-daily-pulse.setup', { store_slug }), { action: 'set', passcode: newPasscode })
 .then(() => window.location.reload())
 .catch(err => {
 setProcessing(false);
 setError(err.response?.data?.message || 'Setup failed.');
 });
 };

 // LOG OUT / LOCK TERMINAL
 const handleLockTerminal = () => {
 router.post(route('store.reports.owner-daily-pulse.lock', { store_slug }));
 };

 // DAILY NOTE INLINE AUTOSAVING LOGIC
 const handleNoteChange = (date, value) => {
 setNoteEdits(prev => ({ ...prev, [date]: value }));

 if (saveTimers[date]) {
 clearTimeout(saveTimers[date]);
 }

 setSavingNotes(prev => ({ ...prev, [date]: 'saving' }));

 const timer = setTimeout(() => {
 saveNoteToServer(date, value);
 }, 1200);

 setSaveTimers(prev => ({ ...prev, [date]: timer }));
 };

 const saveNoteToServer = (date, value) => {
 axios.post(route('store.reports.owner-daily-pulse.note', { store_slug }), { date, note: value })
 .then(() => {
 setSavingNotes(prev => ({ ...prev, [date]: 'saved' }));
 setTimeout(() => {
 setSavingNotes(prev => {
 const next = { ...prev };
 delete next[date];
 return next;
 });
 }, 3000);
 })
 .catch(() => {
 setSavingNotes(prev => ({ ...prev, [date]: 'error' }));
 });
 };

 // COMPUTE METRICS AND CHART TRENDS
 const formattedSnapshots = useMemo(() => {
 return snapshots.map(snap => {
 const sales = parseFloat(snap.sales_value) || 0;
 const purchases = parseFloat(snap.purchases_value) || 0;
 const stock = parseFloat(snap.stock_value) || 0;
 const payables = parseFloat(snap.payables_value) || 0;
 const receivables = parseFloat(snap.receivables_value) || 0;
 const cash = parseFloat(snap.cash_value) || 0;
 const expense = parseFloat(snap.expense_value) || 0;
 const netAssets = (cash + receivables + stock) - payables;
 const netProfit = sales - expense;

 return {
 ...snap,
 sales,
 purchases,
 stock,
 payables,
 receivables,
 cash,
 expense,
 netAssets,
 netProfit,
 displayDate: new Date(snap.date).toLocaleDateString(undefined, {
 month: 'short',
 day: 'numeric'
 })
 };
 });
 }, [snapshots]);

 // Recharts requires chronological order (oldest to newest)
 const chartData = useMemo(() => {
 return [...formattedSnapshots].reverse();
 }, [formattedSnapshots]);

 // TODAY AND YESTERDAY SNAPSHOTS FOR FLOATING CARDS
 const selectedIndex = formattedSnapshots.findIndex(s => s.date === selectedDate);
 const todaySnap = selectedIndex >= 0 ? formattedSnapshots[selectedIndex] : null;
 const yesterdaySnap = selectedIndex >= 0 ? formattedSnapshots[selectedIndex + 1] || null : null;

 const calculateChange = (todayVal, yesterdayVal) => {
 if (!yesterdayVal || yesterdayVal === 0) return null;
 const diff = todayVal - yesterdayVal;
 return (diff / yesterdayVal) * 100;
 };

 const formatPercent = (val) => {
 if (val === null || val === undefined) return null;
 const sign = val >= 0 ? '+' : '';
 return `${sign}${val.toFixed(1)}%`;
 };

 // RENDER: SETUP FIRST TIME
 if (needs_setup) {
 if (!is_owner) {
 return (
 <ReportsLayout title="Secure Vault Locked" showSidebar={false}>
 <div className="min-h-[85vh] flex items-center justify-center p-4">
 <div className="text-center p-4 sm:p-8 bg-neutral-900 border border-neutral-800 rounded-[14px] shadow-xl max-w-sm">
 <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
 <h2 className="text-2xl font-bold text-white mb-2">Vault Unconfigured</h2>
 <p className="text-ink-muted text-sm">
 The store owner must configure the Daily Pulse vault security before it can be accessed.
 </p>
 </div>
 </div>
 </ReportsLayout>
 );
 }

 return (
 <ReportsLayout title="Configure Vault Security" showSidebar={false}>
 <Head title="Configure Vault Security" />
 <div className="min-h-[85vh] flex items-center justify-center p-4">
 <div className="absolute inset-0 bg-neutral-950 z-0 overflow-hidden">
 <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />
 <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-brand-600/10 rounded-full blur-[100px] pointer-events-none" />
 </div>

 <div className={`relative z-10 w-full max-w-md ${shake ? 'animate-bounce' : ''}`} style={shake ? { animation: 'shake 0.4s ease-in-out' } : {}}>
 <MidnightNebula className="rounded-[14px] border border-neutral-800 shadow-2xl p-4 sm:p-8 backdrop-blur-md bg-neutral-900/80" primaryColor="emerald" secondaryColor="indigo">
 <div className="text-center mb-8">
 <div className="inline-flex p-4 bg-emerald-500/10 rounded-[14px] border border-emerald-500/20 text-emerald-400 mb-4 animate-bounce">
 <Shield size={32} />
 </div>
 <h2 className="text-2xl font-bold text-white tracking-tight">Vault Security Setup</h2>
 <p className="text-ink-muted text-xs max-w-xs mx-auto mt-2">
 You are the owner. Choose how you want to secure your Daily Pulse dashboard.
 </p>
 </div>

 {setupPhase === 'initial' && (
 <div className="space-y-4">
 <button
 onClick={() => setSetupPhase('setting')}
 className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-[14px] shadow-lg transition-all"
 >
 <Lock size={18} />
 <span>REQUIRE PASSCODE</span>
 </button>
 <button
 onClick={handleSetupDisable}
 disabled={processing}
 className="w-full flex items-center justify-center gap-2 py-4 bg-sunken hover:bg-interactive-hover text-white font-bold rounded-[14px] transition-all"
 >
 <Unlock size={18} />
 <span>LEAVE UNLOCKED</span>
 </button>
 </div>
 )}

 {setupPhase === 'setting' && (
 <div className="space-y-6">
 <h3 className="text-center font-bold text-neutral-300">Enter New Passcode</h3>
 <input
 type="password"
 value={newPasscode}
 readOnly
 className="w-full text-center tracking-[0.7em] text-xl font-bold bg-neutral-950/80 border border-neutral-800 rounded-[14px] p-4 text-white focus:outline-none placeholder-slate-700"
 placeholder="••••••••"
 />
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
 {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(key => (
 <button
 key={key}
 type="button"
 onClick={() => handleKeypadPress(key, 'new')}
 className={`h-14 rounded-[14px] font-bold text-lg ${key === 'C' || key === '⌫' ? 'bg-neutral-800 text-ink-muted' : 'bg-neutral-700 text-white'}`}
 >
 {key}
 </button>
 ))}
 </div>
 <button
 onClick={() => {
 if (newPasscode.length >= 4) setSetupPhase('confirming');
 else setError('Passcode must be at least 4 digits');
 }}
 disabled={newPasscode.length < 4}
 className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-[14px] transition-all"
 >
 NEXT
 </button>
 {error && <p className="text-red-400 text-xs text-center">{error}</p>}
 </div>
 )}

 {setupPhase === 'confirming' && (
 <div className="space-y-6">
 <h3 className="text-center font-bold text-neutral-300">Confirm Passcode</h3>
 <input
 type="password"
 value={confirmPasscode}
 readOnly
 className="w-full text-center tracking-[0.7em] text-xl font-bold bg-neutral-950/80 border border-neutral-800 rounded-[14px] p-4 text-white focus:outline-none placeholder-slate-700"
 placeholder="••••••••"
 />
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
 {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(key => (
 <button
 key={key}
 type="button"
 onClick={() => handleKeypadPress(key, 'confirm')}
 className={`h-14 rounded-[14px] font-bold text-lg ${key === 'C' || key === '⌫' ? 'bg-neutral-800 text-ink-muted' : 'bg-neutral-700 text-white'}`}
 >
 {key}
 </button>
 ))}
 </div>
 <button
 onClick={handleSetupConfirm}
 disabled={processing || confirmPasscode.length < 4}
 className="w-full py-4 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold rounded-[14px] transition-all"
 >
 {processing ? 'SAVING...' : 'CONFIRM & SAVE'}
 </button>
 {error && <p className="text-red-400 text-xs text-center">{error}</p>}
 </div>
 )}

 </MidnightNebula>
 </div>
 </div>
 <style>{`
 @keyframes shake {
 0%, 100% { transform: translateX(0); }
 20%, 60% { transform: translateX(-6px); }
 40%, 80% { transform: translateX(6px); }
 }
`}</style>
 </ReportsLayout>
 );
 }

 // RENDER: SECURE LOCKSCREEN TERMINAL
 if (is_locked) {
 return (
 <ReportsLayout title="Secure Vault Lock" showSidebar={false}>
 <Head title="Secure Vault Authorization" />

 <div className="min-h-[85vh] flex items-center justify-center p-4">
 {/* Midnight Nebula Background Overlay */}
 <div className="absolute inset-0 bg-neutral-950 z-0 overflow-hidden">
 <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-brand-600/10 rounded-full blur-[100px] pointer-events-none" />
 <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-brand-600/10 rounded-full blur-[100px] pointer-events-none" />
 <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-[0.03] pointer-events-none" />
 </div>

 <div className={`relative z-10 w-full max-w-md ${shake ? 'animate-bounce' : ''}`} style={shake ? { animation: 'shake 0.4s ease-in-out' } : {}}>
 <MidnightNebula className="rounded-[14px] border border-neutral-800 shadow-2xl p-4 sm:p-8 backdrop-blur-md bg-neutral-900/80" primaryColor="indigo" secondaryColor="purple">

 {/* Vault Icon Header */}
 <div className="text-center mb-8">
 <div className="inline-flex p-4 bg-brand-500/10 rounded-[14px] border border-brand-500/20 text-brand-400 mb-4 animate-pulse">
 <Lock size={32} />
 </div>
 <h2 className="text-2xl font-bold text-white tracking-tight">{store_name}</h2>
 <p className="text-xs font-bold text-brand-400 uppercase tracking-widest mt-1">Owner's Secure Daily Pulse</p>
 <p className="text-ink-muted text-xs max-w-xs mx-auto mt-2">
 Enter your authorization passcode to unlock the financial vault.
 </p>
 </div>

 {/* Passcode Secure Display */}
 <form onSubmit={handleUnlock} className="space-y-6">
 <div className="relative">
 <input
 type={showPasscode ? "text" : "password"}
 value={passcode}
 onChange={(e) => setPasscode(e.target.value)}
 placeholder="••••••••"
 className="w-full text-center tracking-[0.7em] text-xl font-bold bg-sunken/80 border border-neutral-800 rounded-[14px] p-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all font-mono placeholder-slate-700 shadow-inner"
 disabled={processing}
 autoFocus
 />
 <button
 type="button"
 onClick={() => setShowPasscode(!showPasscode)}
 className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted hover:text-neutral-300 transition-colors"
 >
 {showPasscode ? <EyeOff size={18} /> : <Eye size={18} />}
 </button>
 </div>

 {/* Glowing PIN dots */}
 <div className="flex justify-center gap-3">
 {[1, 2, 3, 4, 5, 6].map((idx) => (
 <div
 key={idx}
 className={`w-3.5 h-3.5 rounded-full transition-all duration-slow ${
 passcode.length >= idx
 ? 'bg-brand-400 shadow-[0_0_12px_rgba(129,140,248,0.8)] scale-110'
 : 'bg-neutral-800'
 }`}
 />
 ))}
 </div>

 {error && (
 <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-900/50 rounded-[12px] text-red-400 text-xs text-center justify-center font-medium animate-pulse">
 <ShieldAlert size={14} className="shrink-0" />
 {error}
 </div>
 )}

 {/* Tactile Virtual Keypad */}
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
 {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((key) => {
 const isFlash = activeKey === key;
 return (
 <button
 key={key}
 type="button"
 onClick={() => handleKeypadPress(key)}
 className={`h-14 rounded-[14px] flex items-center justify-center font-bold text-lg transition-all active:scale-95 select-none ${
 key === 'C' || key === '⌫'
 ? 'bg-neutral-800/40 hover:bg-interactive-hover text-ink-muted'
 : 'bg-neutral-800/80 hover:bg-interactive-hover text-white'
 } border border-neutral-800/80 hover:border-line-strong shadow-md ${
 isFlash ? 'bg-brand-600/80 text-white border-brand-400 shadow-[0_0_15px_rgba(99,102,241,0.6)] scale-95' : ''
 }`}
 >
 {key}
 </button>
 );
 })}
 </div>

 {/* Primary Glow Unlock Button */}
 <button
 type="submit"
 disabled={!passcode || processing}
 className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-brand disabled:bg-none disabled:bg-neutral-800 disabled:opacity-40 text-white font-bold rounded-[14px] transition-all shadow-lg active:scale-[0.99] focus:outline-none"
 >
 {processing ? (
 <RefreshCw className="w-5 h-5 animate-spin" />
 ) : (
 <>
 <Unlock size={18} />
 <span>UNLOCK SYSTEM</span>
 </>
 )}
 </button>
 </form>
 </MidnightNebula>
 </div>
 </div>

 <style>{`
 @keyframes shake {
 0%, 100% { transform: translateX(0); }
 20%, 60% { transform: translateX(-6px); }
 40%, 80% { transform: translateX(6px); }
 }
`}</style>
 </ReportsLayout>
 );
 }

 // RENDER: UNLOCKED DASHBOARD
 const tabs = [
 { id: 'overview', label: 'All Combined' },
 { id: 'sales', label: 'Sales' },
 { id: 'purchases', label: 'Purchases' },
 { id: 'cash', label: 'Cash Hand' },
 { id: 'stock', label: 'Stock Value' },
 { id: 'expense', label: 'Expenses' },
 { id: 'receivables', label: 'Receivables' },
 { id: 'payables', label: 'Payables' },
 ];
 const metricKeys = {
 sales: ['Sales', 'sales'], purchases: ['Purchases', 'purchases'], cash: ['Cash Hand', 'cash'],
 stock: ['Stock Value', 'stock'], expense: ['Expenses', 'expense'], receivables: ['Receivables', 'receivables'], payables: ['Payables', 'payables'],
 };
 const overviewKeys = ['sales', 'purchases', 'cash', 'stock', 'expense'];
 const seriesFor = (id) => ({ name: metricKeys[id][0], points: chartData.map((s) => ({ x: s.date, y: s[metricKeys[id][1]] })) });
 const trendSeries = activeTab === 'overview' ? overviewKeys.map(seriesFor) : [seriesFor(activeTab)];

 // Same good/bad rule as before: purchases, expenses and payables are better when lower
 const kpi = (label, key, icon, tone, higherIsBetter) => {
 const cur = todaySnap[key];
 const ch = yesterdaySnap ? calculateChange(cur, yesterdaySnap[key]) : null;
 const good = yesterdaySnap ? (higherIsBetter ? cur >= yesterdaySnap[key] : cur <= yesterdaySnap[key]) : null;
 return {
 label, value: formatCurrency(cur), icon, tone,
 sub: yesterdaySnap ? `vs yesterday ${formatPercent(ch) || '0.0%'}${good ? ' · better' : ' · worse'}` : 'vs yesterday N/A',
 trend: yesterdaySnap && ch !== null ? (ch >= 0 ? 'up' : 'down') : undefined,
 valueTone: good === false ? 'rose' : undefined,
 };
 };

 const kpis = todaySnap ? [
 kpi('Today Sales', 'sales', TrendingUp, 'emerald', true),
 kpi('Today Purchases', 'purchases', Package, 'blue', false),
 kpi('Cash in Hand', 'cash', DollarSign, 'brand', true),
 kpi('Stock Asset', 'stock', Package, 'sky', true),
 kpi('Today Expense', 'expense', CreditCard, 'amber', false),
 kpi('Receivables', 'receivables', ArrowRight, 'amber', true),
 kpi('Payables', 'payables', Clock, 'rose', false),
 ] : [];

 const assetSlices = todaySnap ? [
 { name: 'Cash in Hand', value: Math.max(todaySnap.cash, 0) },
 { name: 'Stock Asset', value: Math.max(todaySnap.stock, 0) },
 { name: 'Receivables', value: Math.max(todaySnap.receivables, 0) },
 ].filter((s) => s.value > 0) : [];
 const rankItems = todaySnap ? [
 { label: 'Sales', value: todaySnap.sales }, { label: 'Purchases', value: todaySnap.purchases },
 { label: 'Expenses', value: todaySnap.expense }, { label: 'Cash in Hand', value: todaySnap.cash },
 { label: 'Stock Asset', value: todaySnap.stock }, { label: 'Receivables', value: todaySnap.receivables },
 { label: 'Payables', value: todaySnap.payables },
 ].sort((a, b) => b.value - a.value) : [];
 const bestSalesDay = formattedSnapshots.reduce((b, s) => (!b || s.sales > b.sales ? s : b), null);
 const longDate = (d) => new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

 const logColumns = [
 { key: 'date', label: 'Date', sortable: true, get: (r) => r.date, render: (r) => <span className="font-bold text-ink">{longDate(r.date)}</span> },
 { key: 'sales', label: 'Sales', align: 'right', sortable: true, get: (r) => r.sales, render: (r) => <span className="font-bold text-emerald-600">{formatCurrency(r.sales)}</span> },
 { key: 'purchases', label: 'Purchases', align: 'right', sortable: true, get: (r) => r.purchases, render: (r) => formatCurrency(r.purchases) },
 { key: 'cash', label: 'Cash Position', align: 'right', sortable: true, get: (r) => r.cash, render: (r) => formatCurrency(r.cash) },
 { key: 'stock', label: 'Stock Asset', align: 'right', sortable: true, get: (r) => r.stock, render: (r) => formatCurrency(r.stock) },
 { key: 'receivables', label: 'Receivables', align: 'right', sortable: true, get: (r) => r.receivables, render: (r) => <span className="text-amber-600">{formatCurrency(r.receivables)}</span> },
 { key: 'payables', label: 'Payables', align: 'right', sortable: true, get: (r) => r.payables, render: (r) => <span className="text-rose-600">{formatCurrency(r.payables)}</span> },
 { key: 'expense', label: 'Expenses', align: 'right', sortable: true, get: (r) => r.expense, render: (r) => formatCurrency(r.expense) },
 {
 key: 'note', label: 'Daily Memo (autosaves)', width: 320,
 render: (r) => {
 const dateStr = r.date;
 const currentNote = noteEdits[dateStr] !== undefined ? noteEdits[dateStr] : (r.note || '');
 const saveStatus = savingNotes[dateStr];
 return (
 <div className="relative flex items-center" onClick={(e) => e.stopPropagation()}>
 <input type="text" value={currentNote} onChange={(e) => handleNoteChange(dateStr, e.target.value)}
 placeholder="Write daily notes, events, exceptions..." className={`${filterInputCls} h-9 w-full pr-20`} />
 {saveStatus && (
 <span className="absolute right-2 flex items-center gap-1 text-3xs font-bold uppercase tracking-wider">
 {saveStatus === 'saving' && (<><RefreshCw size={10} className="animate-spin text-amber-500" /><span className="text-amber-500">Saving...</span></>)}
 {saveStatus === 'saved' && (<><CheckCircle size={10} className="text-emerald-500" /><span className="text-emerald-500">Saved</span></>)}
 {saveStatus === 'error' && (<><AlertCircle size={10} className="text-rose-500" /><span className="text-rose-500">Retry</span></>)}
 </span>
 )}
 </div>
 );
 },
 },
 ];

 return (
 <ReportShell
 title="Owner's Daily Pulse" subtitle="Executive financial ledger audits and auto-healing data backups" activeKey="owner-daily-pulse"
 filters={(
 <label className="flex items-center gap-2">
 <span className="text-xs font-bold uppercase tracking-wide text-ink-muted">Date</span>
 <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className={filterInputCls} title="Select Date" />
 </label>
 )}
 actions={(
 <>
 <button type="button" onClick={() => window.location.reload()} title="Force Refresh Data"
 className="flex h-10 w-10 items-center justify-center rounded-[12px] text-ink-muted transition-colors hover:bg-interactive-hover">
 <RefreshCw size={18} />
 </button>
 <button type="button" onClick={handleLockTerminal}
 className="flex h-10 items-center gap-2 rounded-[12px] border border-rose-200 px-3 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-900/20">
 <LogOut size={16} /><span className="hidden sm:inline">Lock Vault</span>
 </button>
 </>
 )}
 exportConfig={{
 filename: 'owner-daily-pulse',
 columns: [
 { label: 'Date', get: (r) => r.date }, { label: 'Sales', get: (r) => r.sales }, { label: 'Purchases', get: (r) => r.purchases },
 { label: 'Cash', get: (r) => r.cash }, { label: 'Stock', get: (r) => r.stock }, { label: 'Receivables', get: (r) => r.receivables },
 { label: 'Payables', get: (r) => r.payables }, { label: 'Expenses', get: (r) => r.expense },
 { label: 'Note', get: (r) => (noteEdits[r.date] !== undefined ? noteEdits[r.date] : (r.note || '')) },
 ],
 rows: formattedSnapshots,
 }}
 >
 {todaySnap ? (
 <ReportKpis items={kpis} min={170} />
 ) : (
 <ReportSection>
 <div className="flex flex-col items-center gap-2 py-8 text-center">
 <AlertCircle className="h-10 w-10 text-ink-muted" />
 <h3 className="text-base font-bold text-ink">No Financial Snapshots Yet</h3>
 <p className="max-w-sm text-xs text-ink-muted">The self-healing data backfiller is scanning your double-entry accounts to generate your daily history.</p>
 </div>
 </ReportSection>
 )}

 <ReportGrid>
 <ReportCol span={8}>
 <ReportSection title="30-Day Financial Trends" subtitle="Pick a metric or view the combined double-entry trends" icon={Activity}>
 <div className="mb-2 flex flex-wrap items-center gap-1">
 {tabs.map((tab) => (
 <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
 className={`h-10 rounded-[12px] px-3 text-sm font-semibold transition-colors ${activeTab === tab.id ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' : 'text-ink-secondary hover:bg-interactive-hover'}`}>
 {tab.label}
 </button>
 ))}
 </div>
 <TrendChart series={trendSeries} type={activeTab === 'overview' ? 'line' : 'area'} height={320} />
 </ReportSection>
 </ReportCol>
 <ReportCol span={4}>
 <ReportSection title="Asset Mix" subtitle={todaySnap ? longDate(todaySnap.date) : undefined} icon={Scale} tone="violet">
 <DonutChart slices={assetSlices} height={320} />
 </ReportSection>
 </ReportCol>
 </ReportGrid>

 {todaySnap ? (
 <ReportGrid>
 <ReportCol span={6}>
 <ReportSection title="Figures Ranked" subtitle={`All seven pulse numbers for ${longDate(todaySnap.date)}`} icon={Award} tone="emerald">
 <RankBars items={rankItems} limit={7} />
 </ReportSection>
 </ReportCol>
 <ReportCol span={6}>
 <ReportSection title="Highlights" subtitle="Derived from the snapshots above" icon={Sparkles} tone="amber">
 <ul className="flex flex-col divide-y divide-line">
 <li className="flex h-12 items-center justify-between gap-2 text-sm"><span className="text-ink-secondary">Net profit (sales minus expenses)</span><span className={`font-bold tabular-nums ${todaySnap.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(todaySnap.netProfit)}</span></li>
 <li className="flex h-12 items-center justify-between gap-2 text-sm"><span className="text-ink-secondary">Net assets (cash + receivables + stock - payables)</span><span className={`font-bold tabular-nums ${todaySnap.netAssets >= 0 ? 'text-ink' : 'text-rose-600'}`}>{formatCurrency(todaySnap.netAssets)}</span></li>
 {bestSalesDay ? (
 <li className="flex h-12 items-center justify-between gap-2 text-sm"><span className="text-ink-secondary">Best sales day ({longDate(bestSalesDay.date)})</span><span className="font-bold tabular-nums text-ink">{formatCurrency(bestSalesDay.sales)}</span></li>
 ) : null}
 </ul>
 </ReportSection>
 </ReportCol>
 </ReportGrid>
 ) : null}

 <ReportSection title="Historical Pulse Logs" subtitle="Chronological ledger records for the past 30 days. Memos save inline." icon={FileText} flush
 right={<span className="flex items-center gap-2 text-xs text-ink-muted"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand-500" />Autosave Enabled</span>}>
 <ReportTable columns={logColumns} rows={formattedSnapshots} rowKey={(r) => r.id ?? r.date} pageSize={31} empty="No daily history logs found." />
 </ReportSection>
 </ReportShell>
 );
}
