import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { formatCurrency } from '@/Utils/format';
import { 
    CheckCircle, 
    XCircle, 
    RotateCcw, 
    ArrowLeft, 
    ShieldAlert, 
    Clock, 
    FileText, 
    User, 
    Calendar,
    Send,
    Tag,
    DollarSign,
    Layers,
    GitCommit,
    Check,
    AlertCircle,
    ArrowRight,
    Ban,
    Edit3,
    ExternalLink
} from 'lucide-react';

// ─── Transaction Detail Cards ────────────────────────────────────────────────
function CustomerReceiptCard({ payload, amount }) {
    const allocations = payload.allocations || [];
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl text-xs">
                <div>
                    <span className="text-gray-400 block font-medium">Customer ID</span>
                    <span className="font-mono text-gray-800 text-sm font-semibold">{payload.customer_id || 'N/A'}</span>
                </div>
                <div>
                    <span className="text-gray-400 block font-medium">Payment Method</span>
                    <span className="capitalize text-gray-800 text-sm font-semibold">{payload.payment_method || 'Cash'}</span>
                </div>
                <div>
                    <span className="text-gray-400 block font-medium">Receipt Date</span>
                    <span className="text-gray-800 text-sm font-semibold">{payload.payment_date || 'Today'}</span>
                </div>
                {payload.reference && (
                    <div className="col-span-2">
                        <span className="text-gray-400 block font-medium">Reference Number</span>
                        <span className="font-mono text-gray-800">{payload.reference}</span>
                    </div>
                )}
            </div>

            {allocations.length > 0 && (
                <div>
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Invoice Allocations</h4>
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 text-gray-500 font-semibold border-b">
                                <tr>
                                    <th className="px-4 py-2.5">Invoice / Sale ID</th>
                                    <th className="px-4 py-2.5 text-right">Allocated Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {allocations.map((alloc, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-2.5 font-mono text-gray-800">{alloc.sale_id}</td>
                                        <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{formatCurrency(alloc.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function SupplierPaymentCard({ payload, amount }) {
    const allocations = payload.allocations || [];
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl text-xs">
                <div>
                    <span className="text-gray-400 block font-medium">Supplier ID</span>
                    <span className="font-mono text-gray-800 text-sm font-semibold">{payload.supplier_id || 'N/A'}</span>
                </div>
                <div>
                    <span className="text-gray-400 block font-medium">Payment Method</span>
                    <span className="capitalize text-gray-800 text-sm font-semibold">{payload.payment_method || 'Cash'}</span>
                </div>
                <div>
                    <span className="text-gray-400 block font-medium">Payment Date</span>
                    <span className="text-gray-800 text-sm font-semibold">{payload.payment_date || 'Today'}</span>
                </div>
                {payload.reference && (
                    <div className="col-span-2">
                        <span className="text-gray-400 block font-medium">Reference</span>
                        <span className="font-mono text-gray-800">{payload.reference}</span>
                    </div>
                )}
            </div>

            {allocations.length > 0 && (
                <div>
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Bill Allocations</h4>
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 text-gray-500 font-semibold border-b">
                                <tr>
                                    <th className="px-4 py-2.5">Purchase Bill ID</th>
                                    <th className="px-4 py-2.5 text-right">Allocated Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {allocations.map((alloc, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-2.5 font-mono text-gray-800">{alloc.purchase_id}</td>
                                        <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{formatCurrency(alloc.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function SalesInvoiceCard({ payload }) {
    const items = payload.items || [];
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl text-xs">
                <div>
                    <span className="text-gray-400 block font-medium">Customer</span>
                    <span className="text-gray-800 text-sm font-semibold">{payload.customer_name || payload.party_id || 'Walk-in Customer'}</span>
                </div>
                <div>
                    <span className="text-gray-400 block font-medium">Payment Method</span>
                    <span className="capitalize text-gray-800 text-sm font-semibold">{payload.payment_method || 'Credit'}</span>
                </div>
                <div>
                    <span className="text-gray-400 block font-medium">Subtotal</span>
                    <span className="text-gray-800 text-sm font-semibold">{formatCurrency(payload.subtotal || 0)}</span>
                </div>
                {payload.discount_amount > 0 && (
                    <div>
                        <span className="text-gray-400 block font-medium">Discount</span>
                        <span className="text-rose-600 font-semibold">-{formatCurrency(payload.discount_amount)}</span>
                    </div>
                )}
                {payload.tax_amount > 0 && (
                    <div>
                        <span className="text-gray-400 block font-medium">Tax</span>
                        <span className="text-gray-800 font-semibold">{formatCurrency(payload.tax_amount)}</span>
                    </div>
                )}
                <div>
                    <span className="text-gray-400 block font-medium">Total Payable</span>
                    <span className="text-indigo-600 text-sm font-bold">{formatCurrency(payload.total || 0)}</span>
                </div>
            </div>

            {items.length > 0 && (
                <div>
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Line Items</h4>
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 text-gray-500 font-semibold border-b">
                                <tr>
                                    <th className="px-4 py-2.5">Product</th>
                                    <th className="px-4 py-2.5 text-center">Qty</th>
                                    <th className="px-4 py-2.5 text-right">Unit Price</th>
                                    <th className="px-4 py-2.5 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-2.5 font-medium text-gray-900">{item.product_name || item.name || item.product_id}</td>
                                        <td className="px-4 py-2.5 text-center text-gray-600">{item.quantity || item.qty || 1}</td>
                                        <td className="px-4 py-2.5 text-right text-gray-600">{formatCurrency(item.unit_price || item.price || 0)}</td>
                                        <td className="px-4 py-2.5 text-right font-semibold text-gray-900">
                                            {formatCurrency((item.quantity || item.qty || 1) * (item.unit_price || item.price || 0))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function OperatingExpenseCard({ payload }) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl text-xs">
                <div>
                    <span className="text-gray-400 block font-medium">Expense Category</span>
                    <span className="text-gray-800 text-sm font-semibold">{payload.category_name || payload.expense_category_id || 'General Expense'}</span>
                </div>
                <div>
                    <span className="text-gray-400 block font-medium">Expense Date</span>
                    <span className="text-gray-800 text-sm font-semibold">{payload.expense_date || payload.date || 'Today'}</span>
                </div>
                <div>
                    <span className="text-gray-400 block font-medium">Payment Method</span>
                    <span className="capitalize text-gray-800 text-sm font-semibold">{payload.payment_method || 'Cash'}</span>
                </div>
                {payload.input_tax > 0 && (
                    <div>
                        <span className="text-gray-400 block font-medium">Input Tax</span>
                        <span className="text-gray-800 font-semibold">{formatCurrency(payload.input_tax)}</span>
                    </div>
                )}
                <div className="col-span-2">
                    <span className="text-gray-400 block font-medium">Description / Reason</span>
                    <span className="text-gray-800">{payload.notes || payload.description || 'No notes provided.'}</span>
                </div>
            </div>
        </div>
    );
}

// ─── Revision Diff Viewer ────────────────────────────────────────────────────
function RevisionDiffView({ revisions = [] }) {
    if (revisions.length <= 1) {
        return (
            <div className="p-4 bg-gray-50 rounded-xl text-xs text-gray-500 text-center">
                This document is currently on its initial submission (v1). No previous revisions to compare.
            </div>
        );
    }

    const currentRev = revisions[revisions.length - 1];
    const prevRev = revisions[revisions.length - 2];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-600 bg-gray-50 p-3 rounded-xl">
                <span className="flex items-center gap-1.5 text-amber-700">
                    <GitCommit className="w-4 h-4" /> Previous (v{prevRev.version})
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <span className="flex items-center gap-1.5 text-indigo-700">
                    <GitCommit className="w-4 h-4" /> Current (v{currentRev.version})
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
                {/* Previous Revision */}
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                    <div className="font-bold text-amber-900">v{prevRev.version} by {prevRev.maker?.name || 'Maker'}</div>
                    <div className="text-xs text-gray-500">{new Date(prevRev.created_at).toLocaleString()}</div>
                    <div className="text-sm font-bold text-gray-900 mt-2">Amount: {formatCurrency(prevRev.amount)}</div>
                    {prevRev.notes && <div className="text-xs text-gray-700 italic mt-1">"{prevRev.notes}"</div>}
                </div>

                {/* Current Revision */}
                <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2">
                    <div className="font-bold text-indigo-900">v{currentRev.version} by {currentRev.maker?.name || 'Maker'}</div>
                    <div className="text-xs text-gray-500">{new Date(currentRev.created_at).toLocaleString()}</div>
                    <div className="text-sm font-bold text-indigo-900 mt-2">
                        Amount: {formatCurrency(currentRev.amount)}
                        {currentRev.amount !== prevRev.amount && (
                            <span className="ml-2 text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-normal">
                                Changed ({formatCurrency(currentRev.amount - prevRev.amount)})
                            </span>
                        )}
                    </div>
                    {currentRev.notes && <div className="text-xs text-gray-700 italic mt-1">"{currentRev.notes}"</div>}
                </div>
            </div>
        </div>
    );
}

// ─── Main Approval Detail Page ───────────────────────────────────────────────
export default function ApprovalDetail({
    document = {},
    returnReasons = [],
    canApprove = false,
    isMaker = false,
    canWithdraw = false,
    canResubmit = false
}) {
    const [actionModal, setActionModal] = useState(null); // 'approve' | 'reject' | 'return' | 'resubmit' | 'withdraw'
    const [notes, setNotes] = useState('');
    const [selectedReasonCodes, setSelectedReasonCodes] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('details'); // 'details' | 'diff' | 'audit'

    // Resubmit form state
    const currentPayload = document.current_revision?.payload || {};
    const [resubmitAmount, setResubmitAmount] = useState(document.amount || '');
    const [resubmitNotes, setResubmitNotes] = useState('');
    const [editablePayload, setEditablePayload] = useState(currentPayload);

    const storeSlug = window.location.pathname.split('/')[2];

    const getOriginalEditorUrl = () => {
        if (!storeSlug || !document.id) return null;
        switch (document.document_type) {
            case 'customer_receipt':
                return `/s/${storeSlug}/v3/customer-payments?edit_approval=${document.id}`;
            case 'supplier_payment':
                return `/s/${storeSlug}/v3/supplier-payments?edit_approval=${document.id}`;
            case 'operating_expense':
                return `/s/${storeSlug}/expenses?edit_approval=${document.id}`;
            case 'sales_invoice':
                return `/s/${storeSlug}/sales?edit_approval=${document.id}`;
            default:
                return null;
        }
    };

    const handleAction = (action) => {
        setSubmitting(true);
        const url = route(`store.approvals.${action}`, { store_slug: storeSlug, id: document.id });
        
        let data = {
            version: document.version,
            expected_version: document.version,
            notes: notes,
            reason: notes,
            reason_codes: selectedReasonCodes,
        };

        if (action === 'resubmit') {
            data = {
                version: document.version,
                expected_version: document.version,
                amount: parseFloat(resubmitAmount),
                payload: { ...editablePayload, amount: parseFloat(resubmitAmount) },
                notes: resubmitNotes || notes,
            };
        } else if (action === 'withdraw') {
            data = {
                version: document.version,
                expected_version: document.version,
                reason: notes || 'Withdrawn by maker.',
            };
        }

        router.post(url, data, {
            onFinish: () => {
                setSubmitting(false);
                setActionModal(null);
                setNotes('');
            },
        });
    };

    const renderPayloadCard = () => {
        switch (document.document_type) {
            case 'customer_receipt':
                return <CustomerReceiptCard payload={currentPayload} amount={document.amount} />;
            case 'supplier_payment':
                return <SupplierPaymentCard payload={currentPayload} amount={document.amount} />;
            case 'sales_invoice':
            case 'direct_sale':
            case 'pos_sale':
                return <SalesInvoiceCard payload={currentPayload} />;
            case 'operating_expense':
                return <OperatingExpenseCard payload={currentPayload} />;
            default:
                return (
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Transaction Data</h4>
                        <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl text-xs">
                            {Object.entries(currentPayload).map(([k, v]) => (
                                <div key={k} className="truncate">
                                    <span className="text-gray-400 block capitalize">{k.replace(/_/g, ' ')}</span>
                                    <span className="font-medium text-gray-800">
                                        {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
        }
    };

    return (
        <OneGlanceLayout>
            <Head title={`Approval #${document.document_number || document.id}`} />
            <div className="p-6 max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('store.approvals.inbox', { store_slug: storeSlug })}
                            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-gray-900">{document.document_number}</h1>
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 uppercase">
                                    {document.document_type?.replace(/_/g, ' ')}
                                </span>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                                    document.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                    document.status === 'returned' ? 'bg-orange-100 text-orange-800' :
                                    document.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                                    'bg-amber-100 text-amber-800'
                                }`}>
                                    {document.status} (v{document.version})
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Submitted on {new Date(document.created_at).toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Header Actions */}
                    <div className="flex items-center gap-2">
                        {/* Reviewer Action Buttons */}
                        {document.status === 'pending' && canApprove && (
                            <>
                                <button
                                    onClick={() => setActionModal('return')}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition"
                                >
                                    <RotateCcw className="w-4 h-4" /> Return for Correction
                                </button>
                                <button
                                    onClick={() => setActionModal('reject')}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition"
                                >
                                    <XCircle className="w-4 h-4" /> Reject
                                </button>
                                <button
                                    onClick={() => setActionModal('approve')}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition"
                                >
                                    <CheckCircle className="w-4 h-4" /> Approve & Post
                                </button>
                            </>
                        )}

                        {/* Maker Action Buttons */}
                        {canResubmit && (
                            <div className="flex items-center gap-2">
                                {getOriginalEditorUrl() && (
                                    <a
                                        href={getOriginalEditorUrl()}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 transition"
                                    >
                                        <ExternalLink className="w-4 h-4" /> Edit in Original Form
                                    </a>
                                )}
                                <button
                                    onClick={() => setActionModal('resubmit')}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition"
                                >
                                    <Edit3 className="w-4 h-4" /> Quick Resubmit
                                </button>
                            </div>
                        )}

                        {canWithdraw && (
                            <button
                                onClick={() => setActionModal('withdraw')}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                            >
                                <Ban className="w-4 h-4" /> Withdraw
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
                            activeTab === 'details'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Document Details
                    </button>
                    <button
                        onClick={() => setActiveTab('diff')}
                        className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
                            activeTab === 'diff'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Revision Comparison ({document.revisions?.length || 1})
                    </button>
                    <button
                        onClick={() => setActiveTab('audit')}
                        className={`px-4 py-2 text-xs font-bold border-b-2 transition ${
                            activeTab === 'audit'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Audit Trail ({document.transitions?.length || 0})
                    </button>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left 2 Cols: Tabbed Content */}
                    <div className="md:col-span-2 space-y-6">
                        {activeTab === 'details' && (
                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-indigo-600" />
                                        Structured Transaction Details
                                    </h2>
                                    <div className="text-right">
                                        <span className="text-xs text-gray-400 block">Total Amount</span>
                                        <span className="text-xl font-extrabold text-gray-900">{formatCurrency(document.amount)}</span>
                                    </div>
                                </div>

                                {renderPayloadCard()}
                            </div>
                        )}

                        {activeTab === 'diff' && (
                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
                                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-indigo-600" />
                                    Revision History & Changes
                                </h2>
                                <RevisionDiffView revisions={document.revisions || []} />
                            </div>
                        )}

                        {activeTab === 'audit' && (
                            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
                                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-indigo-600" />
                                    Audit & Transition History
                                </h2>
                                <div className="space-y-4">
                                    {(document.transitions || []).map((t, idx) => (
                                        <div key={t.id || idx} className="flex items-start gap-3 text-sm border-l-2 border-indigo-200 pl-4 py-1">
                                            <div>
                                                <div className="font-semibold text-gray-900">
                                                    {t.from_status} → <span className="text-indigo-600 uppercase">{t.to_status}</span>
                                                    <span className="text-xs font-normal text-gray-400 ml-2">by {t.actor?.name || 'System'}</span>
                                                </div>
                                                {t.notes && <p className="text-gray-600 text-xs mt-1">{t.notes}</p>}
                                                {t.reason_codes?.length > 0 && (
                                                    <div className="flex gap-1 mt-1">
                                                        {t.reason_codes.map((rc) => (
                                                            <span key={rc} className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">
                                                                {rc}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="text-[10px] text-gray-400 mt-1">{new Date(t.created_at).toLocaleString()}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right 1 Col: Summary & Metadata */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-gray-900">Document Metadata</h3>
                            <div className="space-y-3 text-xs">
                                <div>
                                    <span className="text-gray-400 block">Maker</span>
                                    <span className="font-medium text-gray-800">{document.maker?.name || 'Staff'} ({document.maker?.email})</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block">Current Version</span>
                                    <span className="font-bold text-indigo-600">v{document.version}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block">Idempotency Key</span>
                                    <span className="font-mono text-gray-800 text-[11px] break-all">{document.idempotency_key || 'None'}</span>
                                </div>
                                {document.posted_at && (
                                    <div>
                                        <span className="text-gray-400 block">Posted At</span>
                                        <span className="text-emerald-700 font-medium">{new Date(document.posted_at).toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modals for Actions */}
                {actionModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
                            <h3 className="text-lg font-bold text-gray-900 capitalize">
                                {actionModal === 'resubmit' ? 'Correct & Resubmit Document' :
                                 actionModal === 'withdraw' ? 'Withdraw Submission' :
                                 `Confirm ${actionModal}`}
                            </h3>

                            {actionModal === 'return' && (
                                <div>
                                    <div className="block text-xs font-semibold text-gray-700 mb-2">Preset Return Reasons</div>
                                    <div className="space-y-1.5 max-h-40 overflow-y-auto border p-2 rounded-lg">
                                        {(returnReasons || []).map((r) => (
                                            <label key={r.code} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    value={r.code}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedReasonCodes([...selectedReasonCodes, r.code]);
                                                        } else {
                                                            setSelectedReasonCodes(selectedReasonCodes.filter((c) => c !== r.code));
                                                        }
                                                    }}
                                                    className="rounded border-gray-300 text-indigo-600"
                                                />
                                                <span><strong className="font-mono">{r.code}</strong>: {r.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {actionModal === 'resubmit' && (
                                <div className="space-y-3">
                                    <div>
                                        <label htmlFor="resubmit-amount-input" className="block text-xs font-semibold text-gray-700 mb-1">Corrected Total Amount *</label>
                                        <input
                                            id="resubmit-amount-input"
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            value={resubmitAmount}
                                            onChange={(e) => setResubmitAmount(e.target.value)}
                                            className="w-full text-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="resubmit-notes-input" className="block text-xs font-semibold text-gray-700 mb-1">Maker Correction Notes</label>
                                        <textarea
                                            id="resubmit-notes-input"
                                            value={resubmitNotes}
                                            onChange={(e) => setResubmitNotes(e.target.value)}
                                            rows={2}
                                            placeholder="Explain what corrections were made..."
                                            className="w-full text-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>
                            )}

                            {actionModal !== 'resubmit' && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        {actionModal === 'approve' ? 'Reviewer Notes (Optional)' :
                                         actionModal === 'withdraw' ? 'Reason for Withdrawal *' :
                                         'Reason / Instructions for Maker *'}
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                        placeholder={actionModal === 'approve' ? 'Optional remarks...' : 'Provide details...'}
                                        className="w-full text-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setActionModal(null)}
                                    className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleAction(actionModal)}
                                    disabled={submitting || (actionModal === 'return' && selectedReasonCodes.length === 0)}
                                    className={`px-4 py-2 text-xs font-bold text-white rounded-lg transition shadow-sm ${
                                        actionModal === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                        actionModal === 'reject' ? 'bg-rose-600 hover:bg-rose-700' :
                                        actionModal === 'resubmit' ? 'bg-indigo-600 hover:bg-indigo-700' :
                                        actionModal === 'withdraw' ? 'bg-gray-700 hover:bg-gray-800' :
                                        'bg-orange-600 hover:bg-orange-700'
                                    } disabled:opacity-50`}
                                >
                                    {submitting ? 'Processing...' : `Confirm ${actionModal}`}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </OneGlanceLayout>
    );
}
