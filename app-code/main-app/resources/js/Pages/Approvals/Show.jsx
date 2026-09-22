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
    Send
} from 'lucide-react';

export default function ApprovalDetail({ document = {}, returnReasons = [], canApprove = false, isMaker = false }) {
    const [actionModal, setActionModal] = useState(null); // 'approve' | 'reject' | 'return' | 'resubmit'
    const [notes, setNotes] = useState('');
    const [selectedReasonCodes, setSelectedReasonCodes] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const storeSlug = window.location.pathname.split('/')[2];
    const currentPayload = document.current_revision?.payload || {};

    const handleAction = (action) => {
        setSubmitting(true);
        const url = route(`store.approvals.${action}`, { store_slug: storeSlug, id: document.id });
        
        const data = {
            version: document.version,
            notes: notes,
            reason: notes,
            reason_codes: selectedReasonCodes,
        };

        router.post(url, data, {
            onFinish: () => {
                setSubmitting(false);
                setActionModal(null);
            },
        });
    };

    return (
        <OneGlanceLayout>
            <Head title={`Approval #${document.document_number || document.id}`} />
            <div className="p-6 max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b pb-4">
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
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 uppercase">
                                    {document.status} (v{document.version})
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Submitted on {new Date(document.created_at).toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {document.status === 'pending' && canApprove && (
                        <div className="flex items-center gap-2">
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
                        </div>
                    )}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left 2 Cols: Details & Payload */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-600" />
                                Document Payload & Details
                            </h2>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                                    <div>
                                        <span className="text-gray-500 block text-xs">Total Amount</span>
                                        <span className="text-lg font-bold text-gray-900">{formatCurrency(document.amount)}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block text-xs">Maker</span>
                                        <span className="font-medium text-gray-900">{document.maker?.name || 'Staff'}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-gray-500 block text-xs">Description / Reason</span>
                                        <span className="text-gray-800">{document.description || 'No description provided.'}</span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Payload Data</h3>
                                    <pre className="p-4 bg-gray-900 text-gray-100 text-xs rounded-lg overflow-x-auto">
                                        {JSON.stringify(currentPayload, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>

                        {/* Audit & Transition History */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
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
                    </div>

                    {/* Right 1 Col: Summary & Metadata */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-gray-900">Document Metadata</h3>
                            <div className="space-y-3 text-xs">
                                <div>
                                    <span className="text-gray-400 block">Document ID</span>
                                    <span className="font-mono text-gray-800">{document.id}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block">Current Version</span>
                                    <span className="font-bold text-indigo-600">{document.version}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block">Idempotency Key</span>
                                    <span className="font-mono text-gray-800">{document.idempotency_key || 'None'}</span>
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

                {/* Modal for Approvals / Rejection / Return */}
                {actionModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
                            <h3 className="text-lg font-bold text-gray-900 capitalize">
                                Confirm {actionModal}
                            </h3>

                            {actionModal === 'return' && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-2">Preset Return Reasons</label>
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

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    {actionModal === 'approve' ? 'Reviewer Notes (Optional)' : 'Reason / Instructions for Maker *'}
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    placeholder={actionModal === 'approve' ? 'Optional remarks...' : 'Provide details on what needs correction...'}
                                    className="w-full text-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

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
