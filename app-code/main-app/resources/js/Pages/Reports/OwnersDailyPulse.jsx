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
import { 
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
    CartesianGrid, Tooltip, Legend, LineChart, Line 
} from 'recharts';
import axios from 'axios';
import { formatCurrency } from '@/Utils/format';

import { vq } from '@/theme/runtime';
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
                        <div className="text-center p-8 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl max-w-sm">
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
                        <MidnightNebula className="rounded-2xl border border-neutral-800 shadow-2xl p-8 backdrop-blur-md bg-neutral-900/80" primaryColor="emerald" secondaryColor="indigo">
                            <div className="text-center mb-8">
                                <div className="inline-flex p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400 mb-4 animate-bounce">
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
                                        className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl shadow-lg hover: transition-all"
                                    >
                                        <Lock size={18} />
                                        <span>REQUIRE PASSCODE</span>
                                    </button>
                                    <button 
                                        onClick={handleSetupDisable}
                                        disabled={processing}
                                        className="w-full flex items-center justify-center gap-2 py-4 bg-sunken hover:bg-interactive-hover text-white font-bold rounded-2xl transition-all"
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
                                        className="w-full text-center tracking-[0.7em] text-xl font-bold bg-neutral-950/80 border border-neutral-800 rounded-2xl p-4 text-white focus:outline-none placeholder-slate-700"
                                        placeholder="••••••••"
                                    />
                                    <div className="grid grid-cols-3 gap-3">
                                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(key => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => handleKeypadPress(key, 'new')}
                                                className={`h-14 rounded-2xl font-bold text-lg ${key === 'C' || key === '⌫' ? 'bg-neutral-800 text-ink-muted' : 'bg-neutral-700 text-white'}`}
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
                                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all"
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
                                        className="w-full text-center tracking-[0.7em] text-xl font-bold bg-neutral-950/80 border border-neutral-800 rounded-2xl p-4 text-white focus:outline-none placeholder-slate-700"
                                        placeholder="••••••••"
                                    />
                                    <div className="grid grid-cols-3 gap-3">
                                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(key => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => handleKeypadPress(key, 'confirm')}
                                                className={`h-14 rounded-2xl font-bold text-lg ${key === 'C' || key === '⌫' ? 'bg-neutral-800 text-ink-muted' : 'bg-neutral-700 text-white'}`}
                                            >
                                                {key}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={handleSetupConfirm}
                                        disabled={processing || confirmPasscode.length < 4}
                                        className="w-full py-4 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all"
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
                        <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
                        <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-[0.03] pointer-events-none" />
                    </div>

                    <div className={`relative z-10 w-full max-w-md ${shake ? 'animate-bounce' : ''}`} style={shake ? { animation: 'shake 0.4s ease-in-out' } : {}}>
                        <MidnightNebula className="rounded-2xl border border-neutral-800 shadow-2xl p-8 backdrop-blur-md bg-neutral-900/80" primaryColor="indigo" secondaryColor="purple">
                            
                            {/* Vault Icon Header */}
                            <div className="text-center mb-8">
                                <div className="inline-flex p-4 bg-brand-500/10 rounded-2xl border border-brand-500/20 text-brand-400 mb-4 animate-pulse">
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
                                        className="w-full text-center tracking-[0.7em] text-xl font-bold bg-sunken/80 border border-neutral-800 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all font-mono placeholder-slate-700 shadow-inner"
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
                                    <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-400 text-xs text-center justify-center font-medium animate-pulse">
                                        <ShieldAlert size={14} className="shrink-0" />
                                        {error}
                                    </div>
                                )}

                                {/* Tactile Virtual Keypad */}
                                <div className="grid grid-cols-3 gap-3 my-4">
                                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((key) => {
                                        const isFlash = activeKey === key;
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => handleKeypadPress(key)}
                                                className={`h-14 rounded-2xl flex items-center justify-center font-bold text-lg transition-all active:scale-95 select-none ${
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
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 disabled:from-neutral-800 disabled:to-neutral-800 disabled:opacity-40 text-white font-bold rounded-2xl transition-all shadow-lg hover: active:scale-[0.99] focus:outline-none"
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
    return (
        <ReportsLayout title="Owner's Daily Pulse" showSidebar={true}>
            <Head title="Owner's Daily Pulse Dashboard" />

            <div className="space-y-6 max-w-7xl mx-auto pb-12">

                {/* Dashboard Security Top Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                    {/* Glowing Accent Layer */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
                            <Shield size={24} className="animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                Owner's Daily Pulse 
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                    Executive Session
                                </span>
                            </h1>
                            <p className="text-xs text-ink-muted mt-0.5">
                                Executive financial ledger audits and auto-healing data backups.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 relative z-10">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-neutral-950/80 border border-neutral-700/80 text-white rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/80 hover:border-line-strong transition-all outline-none"
                            title="Select Date"
                        />
                        <button 
                            onClick={() => window.location.reload()}
                            className="p-3 bg-neutral-800 hover:bg-interactive-hover text-neutral-300 hover:text-white rounded-xl border border-neutral-700/80 transition-colors"
                            title="Force Refresh Data"
                        >
                            <RefreshCw size={16} />
                        </button>
                        <button
                            onClick={handleLockTerminal}
                            className="flex items-center gap-2 px-4 py-3 bg-red-950/40 hover:bg-red-900/30 text-red-400 hover:text-red-300 rounded-xl border border-red-900/50 transition-all font-semibold text-xs uppercase tracking-wider"
                        >
                            <LogOut size={14} />
                            <span>Lock Vault</span>
                        </button>
                    </div>
                </div>

                {/* Grid of 7 Floating Metric Cards */}
                {todaySnap ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                        
                        {/* 1. SALES */}
                        <div className="bg-neutral-900 border border-neutral-800/80 rounded-2xl p-4 shadow-xl flex flex-col justify-between hover:border-emerald-500/30 transition-all group hover:-translate-y-0.5">
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-2xs font-bold text-ink-muted uppercase tracking-widest">Today Sales</span>
                                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                        <TrendingUp size={14} />
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-white leading-none">
                                    {formatCurrency(todaySnap.sales)}
                                </h3>
                            </div>
                            <div className="mt-4 pt-2 border-t border-neutral-800/50 flex justify-between items-center text-2xs">
                                <span className="text-ink-muted font-bold">VS YESTERDAY</span>
                                {yesterdaySnap ? (
                                    <span className={`font-bold ${todaySnap.sales >= yesterdaySnap.sales ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {formatPercent(calculateChange(todaySnap.sales, yesterdaySnap.sales)) || '0.0%'}
                                    </span>
                                ) : (
                                    <span className="text-ink-muted">N/A</span>
                                )}
                            </div>
                        </div>

                        {/* 2. PURCHASES */}
                        <div className="bg-neutral-900 border border-neutral-800/80 rounded-2xl p-4 shadow-xl flex flex-col justify-between hover:border-blue-500/30 transition-all group hover:-translate-y-0.5">
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-2xs font-bold text-ink-muted uppercase tracking-widest flex items-center gap-1">
                                        Today Purchases
                                    </span>
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                        <Package size={14} />
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-white leading-none">
                                    {formatCurrency(todaySnap.purchases)}
                                </h3>
                            </div>
                            <div className="mt-4 pt-2 border-t border-neutral-800/50 flex justify-between items-center text-2xs">
                                <span className="text-ink-muted font-bold">VS YESTERDAY</span>
                                {yesterdaySnap ? (
                                    <span className={`font-bold ${todaySnap.purchases <= yesterdaySnap.purchases ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {formatPercent(calculateChange(todaySnap.purchases, yesterdaySnap.purchases)) || '0.0%'}
                                    </span>
                                ) : (
                                    <span className="text-ink-muted">N/A</span>
                                )}
                            </div>
                        </div>

                        {/* 2. CASH IN HAND */}
                        <div className="bg-neutral-900 border border-neutral-800/80 rounded-2xl p-4 shadow-xl flex flex-col justify-between hover:border-violet-500/30 transition-all group hover:-translate-y-0.5">
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-2xs font-bold text-ink-muted uppercase tracking-widest">Cash in Hand</span>
                                    <div className="p-2 bg-violet-500/10 rounded-lg text-violet-400">
                                        <DollarSign size={14} />
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-white leading-none">
                                    {formatCurrency(todaySnap.cash)}
                                </h3>
                            </div>
                            <div className="mt-4 pt-2 border-t border-neutral-800/50 flex justify-between items-center text-2xs">
                                <span className="text-ink-muted font-bold">VS YESTERDAY</span>
                                {yesterdaySnap ? (
                                    <span className={`font-bold ${todaySnap.cash >= yesterdaySnap.cash ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {formatPercent(calculateChange(todaySnap.cash, yesterdaySnap.cash)) || '0.0%'}
                                    </span>
                                ) : (
                                    <span className="text-ink-muted">N/A</span>
                                )}
                            </div>
                        </div>

                        {/* 3. STOCK VALUE */}
                        <div className="bg-neutral-900 border border-neutral-800/80 rounded-2xl p-4 shadow-xl flex flex-col justify-between hover:border-cyan-500/30 transition-all group hover:-translate-y-0.5">
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-2xs font-bold text-ink-muted uppercase tracking-widest">Stock Asset</span>
                                    <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                                        <Package size={14} />
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-white leading-none">
                                    {formatCurrency(todaySnap.stock)}
                                </h3>
                            </div>
                            <div className="mt-4 pt-2 border-t border-neutral-800/50 flex justify-between items-center text-2xs">
                                <span className="text-ink-muted font-bold">VS YESTERDAY</span>
                                {yesterdaySnap ? (
                                    <span className={`font-bold ${todaySnap.stock >= yesterdaySnap.stock ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {formatPercent(calculateChange(todaySnap.stock, yesterdaySnap.stock)) || '0.0%'}
                                    </span>
                                ) : (
                                    <span className="text-ink-muted">N/A</span>
                                )}
                            </div>
                        </div>

                        {/* 4. TODAY EXPENSE */}
                        <div className="bg-neutral-900 border border-neutral-800/80 rounded-2xl p-4 shadow-xl flex flex-col justify-between hover:border-orange-500/30 transition-all group hover:-translate-y-0.5">
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-2xs font-bold text-ink-muted uppercase tracking-widest">Today Expense</span>
                                    <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
                                        <CreditCard size={14} />
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-white leading-none">
                                    {formatCurrency(todaySnap.expense)}
                                </h3>
                            </div>
                            <div className="mt-4 pt-2 border-t border-neutral-800/50 flex justify-between items-center text-2xs">
                                <span className="text-ink-muted font-bold">VS YESTERDAY</span>
                                {yesterdaySnap ? (
                                    <span className={`font-bold ${todaySnap.expense <= yesterdaySnap.expense ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {formatPercent(calculateChange(todaySnap.expense, yesterdaySnap.expense)) || '0.0%'}
                                    </span>
                                ) : (
                                    <span className="text-ink-muted">N/A</span>
                                )}
                            </div>
                        </div>

                        {/* 5. RECEIVABLES */}
                        <div className="bg-neutral-900 border border-neutral-800/80 rounded-2xl p-4 shadow-xl flex flex-col justify-between hover:border-amber-500/30 transition-all group hover:-translate-y-0.5">
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-2xs font-bold text-ink-muted uppercase tracking-widest">Receivables</span>
                                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                                        <ArrowRight size={14} />
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-white leading-none">
                                    {formatCurrency(todaySnap.receivables)}
                                </h3>
                            </div>
                            <div className="mt-4 pt-2 border-t border-neutral-800/50 flex justify-between items-center text-2xs">
                                <span className="text-ink-muted font-bold">VS YESTERDAY</span>
                                {yesterdaySnap ? (
                                    <span className={`font-bold ${todaySnap.receivables >= yesterdaySnap.receivables ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {formatPercent(calculateChange(todaySnap.receivables, yesterdaySnap.receivables)) || '0.0%'}
                                    </span>
                                ) : (
                                    <span className="text-ink-muted">N/A</span>
                                )}
                            </div>
                        </div>

                        {/* 6. PAYABLES */}
                        <div className="bg-neutral-900 border border-neutral-800/80 rounded-2xl p-4 shadow-xl flex flex-col justify-between hover:border-rose-500/30 transition-all group hover:-translate-y-0.5">
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-2xs font-bold text-ink-muted uppercase tracking-widest">Payables</span>
                                    <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
                                        <Clock size={14} />
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-white leading-none">
                                    {formatCurrency(todaySnap.payables)}
                                </h3>
                            </div>
                            <div className="mt-4 pt-2 border-t border-neutral-800/50 flex justify-between items-center text-2xs">
                                <span className="text-ink-muted font-bold">VS YESTERDAY</span>
                                {yesterdaySnap ? (
                                    <span className={`font-bold ${todaySnap.payables <= yesterdaySnap.payables ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {formatPercent(calculateChange(todaySnap.payables, yesterdaySnap.payables)) || '0.0%'}
                                    </span>
                                ) : (
                                    <span className="text-ink-muted">N/A</span>
                                )}
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center text-ink-muted">
                        <AlertCircle className="w-12 h-12 text-ink-secondary mx-auto mb-3" />
                        <h3 className="text-white font-bold text-lg">No Financial Snapshots Yet</h3>
                        <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto">
                            The self-healing data backfiller is scanning your double-entry accounts to generate your daily history.
                        </p>
                    </div>
                )}

                {/* Interactive Chart Section */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                    {/* Nebula Background Elements inside the chart area */}
                    <div className="absolute top-1/2 left-1/2 w-[40rem] h-[40rem] -translate-x-1/2 -translate-y-1/2 bg-brand-500/[0.02] rounded-full blur-[120px] pointer-events-none" />
                    
                    {/* Header & Tabs */}
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 border-b border-neutral-800/80 mb-6 relative z-10">
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                                <Activity className="w-5 h-5 text-brand-400" />
                                30-Day Financial Trends
                            </h2>
                            <p className="text-xs text-ink-muted mt-0.5">
                                Select a tab below to filter individual metrics or view combined double-entry trends.
                            </p>
                        </div>

                        {/* Interactive Capsule Toggle Buttons (8 Tabs) */}
                        <div className="flex flex-wrap gap-1.5 bg-neutral-950 p-1.5 rounded-2xl border border-neutral-800/50">
                            {[
                                { id: 'overview', label: 'All Combined', color: 'text-brand-400 bg-brand-500/10 border-brand-500/20 hover:text-white' },
                                { id: 'sales', label: 'Sales', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:text-white' },
                                { id: 'purchases', label: 'Purchases', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20 hover:text-white' },
                                { id: 'cash', label: 'Cash Hand', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20 hover:text-white' },
                                { id: 'stock', label: 'Stock Value', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 hover:text-white' },
                                { id: 'expense', label: 'Expenses', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20 hover:text-white' },
                                { id: 'receivables', label: 'Receivables', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20 hover:text-white' },
                                { id: 'payables', label: 'Payables', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20 hover:text-white' },
                            ].map(tab => {
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-3 py-2 text-2xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                                            isActive 
                                                ? 'bg-brand-600 text-white shadow-md ' 
                                                : 'text-ink-muted hover:bg-interactive-hover hover:text-white'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Chart Plotting (Recharts Area / Line) */}
                    <div className="h-[24rem] w-full relative z-10">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="salesGlow" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={vq.emerald[500]} stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor={vq.emerald[500]} stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="purchasesGlow" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={vq.blue[500]} stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor={vq.blue[500]} stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="cashGlow" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={vq.violet[500]} stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor={vq.violet[500]} stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="stockGlow" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={vq.cyan[500]} stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor={vq.cyan[500]} stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="expenseGlow" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={vq.orange[500]} stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor={vq.orange[500]} stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="receivablesGlow" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={vq.amber[500]} stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor={vq.amber[500]} stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="payablesGlow" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={vq.rose[500]} stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor={vq.rose[500]} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={vq.slate[800]} opacity={0.5} vertical={false} />
                                    <XAxis 
                                        dataKey="displayDate" 
                                        stroke={vq.slate[600]} 
                                        fontSize={10} 
                                        fontWeight="bold"
                                        tickLine={false} 
                                        axisLine={false} 
                                        dy={10}
                                    />
                                    <YAxis 
                                        stroke={vq.slate[600]} 
                                        fontSize={10} 
                                        fontWeight="bold"
                                        tickLine={false} 
                                        axisLine={false} 
                                        tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                                        dx={-10}
                                    />
                                    <Tooltip 
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-neutral-950/95 border border-neutral-800 p-4 rounded-xl shadow-2xl backdrop-blur-md">
                                                        <p className="text-2xs font-bold text-ink-muted uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                            <Calendar size={10} />
                                                            {label}
                                                        </p>
                                                        <div className="space-y-1.5">
                                                            {payload.map((item, i) => (
                                                                <div key={i} className="flex items-center justify-between gap-6 text-xs">
                                                                    <div className="flex items-center gap-1.5 text-ink-muted">
                                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                                                        <span>{item.name}:</span>
                                                                    </div>
                                                                    <span className="font-bold text-white">
                                                                        {formatCurrency(item.value)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    
                                    {/* 8 TABS ROUTED CONDITIONALLY */}
                                    {activeTab === 'overview' && (
                                        <>
                                            <Area type="monotone" name="Sales" dataKey="sales" stroke={vq.emerald[500]} strokeWidth={2.5} fillOpacity={0} />
                                            <Area type="monotone" name="Purchases" dataKey="purchases" stroke={vq.blue[500]} strokeWidth={2.5} fillOpacity={0} />
                                            <Area type="monotone" name="Cash hand" dataKey="cash" stroke={vq.violet[500]} strokeWidth={2.5} fillOpacity={0} />
                                            <Area type="monotone" name="Stock Value" dataKey="stock" stroke={vq.cyan[500]} strokeWidth={2.5} fillOpacity={0} />
                                            <Area type="monotone" name="Expenses" dataKey="expense" stroke={vq.orange[500]} strokeWidth={2.5} fillOpacity={0} />
                                        </>
                                    )}

                                    {activeTab === 'sales' && (
                                        <Area type="monotone" name="Sales" dataKey="sales" stroke={vq.emerald[500]} strokeWidth={3} fill="url(#salesGlow)" />
                                    )}

                                    {activeTab === 'purchases' && (
                                        <Area type="monotone" name="Purchases" dataKey="purchases" stroke={vq.blue[500]} strokeWidth={3} fill="url(#purchasesGlow)" />
                                    )}

                                    {activeTab === 'cash' && (
                                        <Area type="monotone" name="Cash Hand" dataKey="cash" stroke={vq.violet[500]} strokeWidth={3} fill="url(#cashGlow)" />
                                    )}

                                    {activeTab === 'stock' && (
                                        <Area type="monotone" name="Stock Value" dataKey="stock" stroke={vq.cyan[500]} strokeWidth={3} fill="url(#stockGlow)" />
                                    )}

                                    {activeTab === 'expense' && (
                                        <Area type="monotone" name="Expenses" dataKey="expense" stroke={vq.orange[500]} strokeWidth={3} fill="url(#expenseGlow)" />
                                    )}

                                    {activeTab === 'receivables' && (
                                        <Area type="monotone" name="Receivables" dataKey="receivables" stroke={vq.amber[500]} strokeWidth={3} fill="url(#receivablesGlow)" />
                                    )}

                                    {activeTab === 'payables' && (
                                        <Area type="monotone" name="Payables" dataKey="payables" stroke={vq.rose[500]} strokeWidth={3} fill="url(#payablesGlow)" />
                                    )}
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-ink-muted font-bold text-sm">
                                Loading Trend Analysis...
                            </div>
                        )}
                    </div>
                </div>

                {/* Chronological Grid Table Logs */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden relative">
                    <div className="p-6 border-b border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                                <FileText className="w-5 h-5 text-brand-400" />
                                Historical Pulse Logs
                            </h2>
                            <p className="text-xs text-ink-muted mt-0.5">
                                Chronological ledger records for the past 30 days. Save memos in-line.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-ink-muted">
                            <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
                            <span>Autosave Enabled</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-sunken/60 text-ink-muted uppercase tracking-widest font-bold border-b border-neutral-800">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Sales</th>
                                    <th className="px-6 py-4">Purchases</th>
                                    <th className="px-6 py-4">Cash Position</th>
                                    <th className="px-6 py-4">Stock Asset</th>
                                    <th className="px-6 py-4">Receivables</th>
                                    <th className="px-6 py-4">Payables</th>
                                    <th className="px-6 py-4">Expenses</th>
                                    <th className="px-6 py-4 min-w-[240px]">Daily Memo / Note (Autosaves Inline)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800/60">
                                {formattedSnapshots.length > 0 ? (
                                    formattedSnapshots.map((snap) => {
                                        const dateStr = snap.date;
                                        const currentNote = noteEdits[dateStr] !== undefined ? noteEdits[dateStr] : (snap.note || '');
                                        const saveStatus = savingNotes[dateStr];

                                        return (
                                            <tr key={snap.id} className="hover:bg-interactive-hover transition-colors">
                                                
                                                {/* Date */}
                                                <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                                                    {new Date(snap.date).toLocaleDateString(undefined, { 
                                                        year: 'numeric', 
                                                        month: 'short', 
                                                        day: 'numeric' 
                                                    })}
                                                </td>

                                                {/* Sales */}
                                                <td className="px-6 py-4 font-bold text-emerald-400">
                                                    {formatCurrency(snap.sales)}
                                                </td>

                                                {/* Purchases */}
                                                <td className="px-6 py-4 font-bold text-blue-400">
                                                    {formatCurrency(snap.purchases)}
                                                </td>

                                                {/* Cash */}
                                                <td className="px-6 py-4 font-bold text-violet-300">
                                                    {formatCurrency(snap.cash)}
                                                </td>

                                                {/* Stock */}
                                                <td className="px-6 py-4 font-bold text-neutral-300">
                                                    {formatCurrency(snap.stock)}
                                                </td>

                                                {/* Receivables */}
                                                <td className="px-6 py-4 font-bold text-amber-400">
                                                    {formatCurrency(snap.receivables)}
                                                </td>

                                                {/* Payables */}
                                                <td className="px-6 py-4 font-bold text-rose-400">
                                                    {formatCurrency(snap.payables)}
                                                </td>

                                                {/* Expenses */}
                                                <td className="px-6 py-4 font-bold text-orange-400">
                                                    {formatCurrency(snap.expense)}
                                                </td>

                                                {/* In-line Autosaving Daily Note */}
                                                <td className="px-6 py-4 relative">
                                                    <div className="relative group">
                                                        <textarea 
                                                            value={currentNote}
                                                            onChange={(e) => handleNoteChange(dateStr, e.target.value)}
                                                            placeholder="Write daily notes, events, exceptions..."
                                                            rows={2}
                                                            className="w-full bg-neutral-950/80 border border-neutral-800/80 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500/50 focus:border-brand-500 transition-all font-medium placeholder-slate-600 resize-none hover:border-line-strong"
                                                        />
                                                        
                                                        {/* Autosave Indicator Overlay */}
                                                        {saveStatus && (
                                                            <div className="absolute right-2 bottom-3 flex items-center gap-1.5 px-2 py-1 rounded-lg text-3xs font-bold uppercase tracking-wider bg-neutral-950 border border-neutral-800 shadow-xl z-20">
                                                                {saveStatus === 'saving' && (
                                                                    <>
                                                                        <RefreshCw size={10} className="text-amber-400 animate-spin" />
                                                                        <span className="text-amber-400">Saving...</span>
                                                                    </>
                                                                )}
                                                                {saveStatus === 'saved' && (
                                                                    <>
                                                                        <CheckCircle size={10} className="text-emerald-400" />
                                                                        <span className="text-emerald-400">Saved</span>
                                                                    </>
                                                                )}
                                                                {saveStatus === 'error' && (
                                                                    <>
                                                                        <AlertCircle size={10} className="text-red-400 animate-pulse" />
                                                                        <span className="text-red-400">Retry</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-ink-muted">
                                            No daily history logs found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </ReportsLayout>
    );
}
