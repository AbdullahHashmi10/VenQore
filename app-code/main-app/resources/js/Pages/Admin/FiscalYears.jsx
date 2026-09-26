import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { 
    Calendar, Lock, Unlock, ShieldAlert, CheckCircle2, AlertTriangle, 
    FileText, Plus, UserCheck, Key, RefreshCw, FileDown
} from 'lucide-react';

export default function FiscalYears({ auth, fiscal_years = [], active_lock = null, active_exceptions = [], retained_accounts = [] }) {
    const [selectedFy, setSelectedFy] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [showReopenModal, setShowReopenModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showLockModal, setShowLockModal] = useState(false);
    const [showExceptionModal, setShowExceptionModal] = useState(false);

    // Form for creating new year
    const createForm = useForm({
        name: '',
        start_date: '',
        end_date: '',
        retained_earnings_account_id: retained_accounts[0]?.id || '',
        notes: ''
    });

    // Form for closing year
    const closeForm = useForm({
        fiscal_year_id: '',
        approved_by: auth?.user?.id || '',
        approval_pin: '',
        preview_hash: '',
        override_reason: ''
    });

    // Form for reopening year
    const reopenForm = useForm({
        approved_by: auth?.user?.id || '',
        approval_pin: '',
        reopen_reason: ''
    });

    // Form for lock
    const lockForm = useForm({
        fiscal_year_id: '',
        lock_type: 'soft',
        locked_through_date: '',
        reason: ''
    });

    // Form for exception
    const exceptionForm = useForm({
        period_lock_id: active_lock?.id || '',
        user_id: '',
        scope: 'user',
        valid_from: new Date().toISOString().slice(0, 16),
        expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16),
        reason: ''
    });

    const fetchPreview = async (fy) => {
        setSelectedFy(fy);
        setLoadingPreview(true);
        try {
            const res = await fetch(route('store.v3.fiscal-year.preview', { store_slug: route().params.store_slug, id: fy.id }));
            const data = await res.json();
            setPreviewData(data);
            closeForm.setData({
                fiscal_year_id: fy.id,
                approved_by: auth?.user?.id || '',
                approval_pin: '',
                preview_hash: data.preview_hash,
                override_reason: ''
            });
        } catch (err) {
            console.error('Failed to load preview:', err);
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        createForm.post(route('store.v3.fiscal-year.store', { store_slug: route().params.store_slug }), {
            onSuccess: () => setShowCreateModal(false)
        });
    };

    const handleCloseSubmit = (e) => {
        e.preventDefault();
        closeForm.post(route('store.v3.fiscal-year.close', { store_slug: route().params.store_slug }), {
            onSuccess: () => {
                setShowCloseModal(false);
                setPreviewData(null);
            }
        });
    };

    const handleReopenSubmit = (e) => {
        e.preventDefault();
        reopenForm.post(route('store.v3.fiscal-year.reopen', { store_slug: route().params.store_slug, id: selectedFy.id }), {
            onSuccess: () => setShowReopenModal(false)
        });
    };

    const handleLockSubmit = (e) => {
        e.preventDefault();
        lockForm.post(route('store.v3.fiscal-year.locks.store', { store_slug: route().params.store_slug }), {
            onSuccess: () => setShowLockModal(false)
        });
    };

    const handleExceptionSubmit = (e) => {
        e.preventDefault();
        exceptionForm.post(route('store.v3.fiscal-year.exceptions.store', { store_slug: route().params.store_slug }), {
            onSuccess: () => setShowExceptionModal(false)
        });
    };

    const downloadReport = (fyId) => {
        window.open(route('store.v3.fiscal-year.report', { store_slug: route().params.store_slug, id: fyId }), '_blank');
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'closed': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">Closed</span>;
            case 'open': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-300">Open</span>;
            case 'reopened': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-300">Reopened</span>;
            case 'closing': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300">Closing</span>;
            default: return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-300">Draft</span>;
        }
    };

    return (
        <OneGlanceLayout>
            <Head title="Fiscal Years & Period Locks" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Calendar className="w-7 h-7 text-indigo-600" />
                            Fiscal Years & Accounting Period Control
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Manage financial reporting boundaries, period locking, pre-close checklists, and controlled reopen history.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Fiscal Year
                        </button>
                        <button
                            onClick={() => setShowLockModal(true)}
                            className="inline-flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
                        >
                            <Lock className="w-4 h-4 mr-2" />
                            Set Period Lock
                        </button>
                    </div>
                </div>

                {/* Active Lock Status Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Lock className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Period Lock</span>
                            <h3 className="text-lg font-bold text-gray-900 mt-1">
                                {active_lock ? `Locked through ${active_lock.locked_through_date}` : 'No Active Lock'}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                                {active_lock ? `Lock Type: ${active_lock.lock_type.toUpperCase()} (${active_lock.reason})` : 'All dates open for posting'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Fiscal Years</span>
                            <h3 className="text-lg font-bold text-gray-900 mt-1">
                                {fiscal_years.length} Defined Period(s)
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                                {fiscal_years.filter(f => f.status === 'closed').length} Closed, {fiscal_years.filter(f => f.status === 'open').length} Open
                            </p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Exceptions</span>
                                <button
                                    onClick={() => setShowExceptionModal(true)}
                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                                >
                                    + Grant
                                </button>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mt-1">
                                {active_exceptions.length} Temporary Exemption(s)
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                                {active_exceptions.length > 0 ? 'Permitted posting inside locked range' : 'Strict lock enforcement active'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Fiscal Years List */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-base font-semibold text-gray-900">Fiscal Years Catalogue</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3">Fiscal Year Name</th>
                                    <th className="px-6 py-3">Start Date</th>
                                    <th className="px-6 py-3">End Date</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Version</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {fiscal_years.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                                            No fiscal year records created yet. Click "New Fiscal Year" to setup your first period.
                                        </td>
                                    </tr>
                                ) : (
                                    fiscal_years.map((fy) => (
                                        <tr key={fy.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-semibold text-gray-900">{fy.name}</td>
                                            <td className="px-6 py-4">{fy.start_date}</td>
                                            <td className="px-6 py-4">{fy.end_date}</td>
                                            <td className="px-6 py-4">{getStatusBadge(fy.status)}</td>
                                            <td className="px-6 py-4 text-xs font-mono">v{fy.close_version || 1}</td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button
                                                    onClick={() => fetchPreview(fy)}
                                                    className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-md transition-colors"
                                                >
                                                    <FileText className="w-3.5 h-3.5 mr-1" />
                                                    Preview & Checklist
                                                </button>

                                                {fy.status !== 'closed' && (
                                                    <button
                                                        onClick={() => {
                                                            fetchPreview(fy);
                                                            setShowCloseModal(true);
                                                        }}
                                                        className="inline-flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-md transition-colors"
                                                    >
                                                        <Lock className="w-3.5 h-3.5 mr-1" />
                                                        Close Year
                                                    </button>
                                                )}

                                                {fy.status === 'closed' && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedFy(fy);
                                                                setShowReopenModal(true);
                                                            }}
                                                            className="inline-flex items-center px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-md transition-colors"
                                                        >
                                                            <Unlock className="w-3.5 h-3.5 mr-1" />
                                                            Reopen
                                                        </button>
                                                        <button
                                                            onClick={() => downloadReport(fy.id)}
                                                            className="inline-flex items-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium rounded-md transition-colors"
                                                        >
                                                            <FileDown className="w-3.5 h-3.5 mr-1" />
                                                            Close Certificate
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Preview and Readiness Checklist Section */}
                {selectedFy && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
                        <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    Pre-Close Readiness Checklist & P&L Preview — {selectedFy.name}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    Period: {selectedFy.start_date} to {selectedFy.end_date}
                                </p>
                            </div>
                            <button
                                onClick={() => fetchPreview(selectedFy)}
                                className="inline-flex items-center text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loadingPreview ? 'animate-spin' : ''}`} />
                                Refresh Calculation
                            </button>
                        </div>

                        {loadingPreview ? (
                            <div className="py-12 text-center text-gray-400">Loading readiness metrics...</div>
                        ) : previewData ? (
                            <div className="space-y-6">
                                {/* Summary KPIs */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <span className="text-xs text-gray-500 font-medium">Total Income</span>
                                        <p className="text-lg font-bold text-gray-900 mt-1">Rs. {previewData.financial_summary.total_income.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <span className="text-xs text-gray-500 font-medium">Total Expenses</span>
                                        <p className="text-lg font-bold text-gray-900 mt-1">Rs. {previewData.financial_summary.total_expense.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                                        <span className="text-xs text-indigo-700 font-medium">Net Profit / (Loss)</span>
                                        <p className={`text-lg font-bold mt-1 ${previewData.financial_summary.net_profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                            Rs. {previewData.financial_summary.net_profit.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <span className="text-xs text-gray-500 font-medium">Retained Earnings Account</span>
                                        <p className="text-sm font-bold text-gray-900 mt-1">
                                            [{previewData.financial_summary.retained_account.code}] {previewData.financial_summary.retained_account.name}
                                        </p>
                                    </div>
                                </div>

                                {/* Checklist Items */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-gray-800">Readiness Controls</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {previewData.checks.map((chk, idx) => (
                                            <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                                                {chk.status === 'pass' ? (
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                                ) : chk.severity === 'blocking' ? (
                                                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                                                ) : (
                                                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                                )}
                                                <div>
                                                    <span className="font-semibold text-gray-900">{chk.label}</span>
                                                    <p className="text-gray-500 mt-0.5">{chk.measured_value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Proposed Closing Journal Lines */}
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-gray-800">Proposed Retained Earnings Transfer Journal Lines</h4>
                                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                                        <table className="w-full text-xs text-left text-gray-600">
                                            <thead className="bg-gray-100 font-semibold text-gray-700 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-2">Code</th>
                                                    <th className="px-4 py-2">Account Name</th>
                                                    <th className="px-4 py-2 text-right">Debit</th>
                                                    <th className="px-4 py-2 text-right">Credit</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {previewData.proposed_journal_lines.map((line, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-4 py-2 font-mono">{line.account_code}</td>
                                                        <td className="px-4 py-2 font-medium">{line.account_name}</td>
                                                        <td className="px-4 py-2 text-right">{line.debit > 0 ? line.debit.toFixed(2) : '-'}</td>
                                                        <td className="px-4 py-2 text-right">{line.credit > 0 ? line.credit.toFixed(2) : '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </OneGlanceLayout>
    );
}
