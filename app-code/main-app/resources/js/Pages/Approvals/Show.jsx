import React, { useState, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { 
    ArrowLeft, 
    Clock, 
    CheckCircle2, 
    RotateCcw, 
    XCircle, 
    History, 
    Edit3, 
    X, 
    Ban 
} from 'lucide-react';
import { fireToast } from '@/lib/approval-response';

import PurchaseForm from '@/Pages/V3/Purchases/PurchaseForm';
import SalesInvoiceApprovalView from './Components/SalesInvoiceApprovalView';
import SalesReturnApprovalView from './Components/SalesReturnApprovalView';
import ProposalApprovalView from './Components/ProposalApprovalView';
import OperatingExpenseApprovalView from './Components/OperatingExpenseApprovalView';
import PaymentInApprovalView from './Components/PaymentInApprovalView';
import PaymentOutApprovalView from './Components/PaymentOutApprovalView';
import FundTransferApprovalView from './Components/FundTransferApprovalView';
import FundMovementApprovalView from './Components/FundMovementApprovalView';
import PartyAdjustmentApprovalView from './Components/PartyAdjustmentApprovalView';
import AuditHistoryDrawer from './Components/AuditHistoryDrawer';
import DecisionModal from './Components/DecisionModal';

export default function ApprovalShow({
    document = {},
    canApprove = false,
    isMaker = false,
    canWithdraw = false,
    canResubmit = false,
    returnReasons = [],
    warehouses = [],
    bankAccounts = [],
    expenseCategories = [],
    categories = [],
    suppliers = [],
    customers = [],
    parties = [],
    products = []
}) {
    const { store } = usePage().props;
    const storeSlug = store?.slug || window.location.pathname.split('/')[2];

    const currentRev = document.current_revision || (document.revisions && document.revisions[document.revisions.length - 1]) || {};
    const initialPayload = currentRev.payload || {};

    const [isEditing, setIsEditing] = useState(false);
    const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
    const [actionModal, setActionModal] = useState(null); // 'approve' | 'return' | 'reject' | 'withdraw'
    const [actionNotes, setActionNotes] = useState('');
    const [selectedReasonCode, setSelectedReasonCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getDocumentTitle = (type) => {
        switch (type) {
            case 'purchase_posting': return 'Purchase Bill';
            case 'purchase_return': return 'Purchase Return (Debit Note)';
            case 'sales_invoice': return 'Sales Invoice';
            case 'sales_return': return 'Sales Return (Credit Note)';
            case 'proposal': return 'Sales Proposal / Quotation';
            case 'customer_receipt': return 'Customer Receipt (Money In)';
            case 'supplier_refund': return 'Supplier Refund (Money In)';
            case 'supplier_payment': return 'Supplier Payment (Money Out)';
            case 'customer_refund': return 'Customer Refund (Money Out)';
            case 'operating_expense': return 'Operating Expense Voucher';
            case 'fund_transfer': return 'Internal Vault / Bank Transfer';
            case 'capital_injection': return 'Owner Capital Addition';
            case 'owner_drawings': return 'Owner Drawing / Withdrawal';
            case 'balance_adjustment': return 'Party Balance Adjustment';
            case 'inventory_adjust': return 'Stock / Inventory Adjustment';
            default: return type ? type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Transaction Document';
        }
    };

    const docTitle = getDocumentTitle(document.document_type);

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('en-PK', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderStatusBadge = () => {
        switch (document.status) {
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                        <Clock size={11} className="animate-spin-slow" /> Pending Review
                    </span>
                );
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 size={11} /> Approved & Posted
                    </span>
                );
            case 'returned':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/30">
                        <RotateCcw size={11} /> Needs Correction
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                        <XCircle size={11} /> Rejected
                    </span>
                );
            case 'withdrawn':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sunken text-ink-muted border border-line">
                        <Ban size={11} /> Withdrawn
                    </span>
                );
            default:
                return (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sunken text-ink-muted">
                        {document.status}
                    </span>
                );
        }
    };

    // Quick Approve modal confirmation
    const handleApproveConfirm = () => {
        setIsSubmitting(true);
        axios.post(route('store.approvals.approve', { store_slug: storeSlug, id: document.id }), {
            version: document.version,
            notes: actionNotes
        })
        .then(res => {
            fireToast(res.data?.message || 'Document approved and posted successfully!', 'success');
            setActionModal(null);
            router.visit(route('store.approvals.inbox', { store_slug: storeSlug }));
        })
        .catch(err => {
            const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to approve document.';
            fireToast(msg, 'error');
            setIsSubmitting(false);
        });
    };

    // Return for Correction confirmation
    const handleReturnConfirm = () => {
        setIsSubmitting(true);
        axios.post(route('store.approvals.return', { store_slug: storeSlug, id: document.id }), {
            version: document.version,
            notes: actionNotes,
            reason_codes: selectedReasonCode ? [selectedReasonCode] : []
        })
        .then(res => {
            fireToast(res.data?.message || 'Document returned to maker for correction.', 'info');
            setActionModal(null);
            router.visit(route('store.approvals.inbox', { store_slug: storeSlug }));
        })
        .catch(err => {
            const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to return document.';
            fireToast(msg, 'error');
            setIsSubmitting(false);
        });
    };

    // Reject confirmation
    const handleRejectConfirm = () => {
        setIsSubmitting(true);
        axios.post(route('store.approvals.reject', { store_slug: storeSlug, id: document.id }), {
            version: document.version,
            reason: actionNotes,
            reason_codes: selectedReasonCode ? [selectedReasonCode] : []
        })
        .then(res => {
            fireToast(res.data?.message || 'Document has been rejected.', 'warning');
            setActionModal(null);
            router.visit(route('store.approvals.inbox', { store_slug: storeSlug }));
        })
        .catch(err => {
            const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to reject document.';
            fireToast(msg, 'error');
            setIsSubmitting(false);
        });
    };

    // Maker withdraw confirmation
    const handleWithdrawConfirm = () => {
        setIsSubmitting(true);
        axios.post(route('store.approvals.withdraw', { store_slug: storeSlug, id: document.id }), {
            version: document.version,
            reason: actionNotes
        })
        .then(res => {
            fireToast(res.data?.message || 'Submission withdrawn.', 'info');
            setActionModal(null);
            router.visit(route('store.approvals.my-submissions', { store_slug: storeSlug }));
        })
        .catch(err => {
            const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to withdraw submission.';
            fireToast(msg, 'error');
            setIsSubmitting(false);
        });
    };

    const handleConfirmDecision = () => {
        if (actionModal === 'approve') handleApproveConfirm();
        else if (actionModal === 'return') handleReturnConfirm();
        else if (actionModal === 'reject') handleRejectConfirm();
        else if (actionModal === 'withdraw') handleWithdrawConfirm();
    };

    // Prepare purchase hydrated models
    const purchaseData = useMemo(() => {
        const p = initialPayload;
        return {
            id: document.id,
            party_id: p.supplier_id || p.party_id,
            supplier_name: p.supplier_name || p.party_name || '',
            supplier_balance: p.party_balance ?? 0,
            purchase_date: p.purchase_date || p.date || (document.created_at ? document.created_at.slice(0, 10) : ''),
            due_date: p.due_date || '',
            invoice_number: p.supplier_invoice || p.invoice_number || '',
            reference: p.reference || document.document_number || '',
            warehouse_id: p.warehouse_id || (warehouses?.find(w => w.is_default)?.id || warehouses?.[0]?.id || ''),
            notes: p.notes || '',
            discount: parseFloat(p.discount || 0),
            payment_method: p.payment_method || p.paymentMethod || 'credit',
            payment_account_id: p.payment_account_id || null,
            total: parseFloat(p.grand_total || p.total || document.amount || 0),
            amount_paid: parseFloat(p.paid_amount || p.amount_paid || p.amountPaid || 0),
            payment_status: parseFloat(p.paid_amount || p.amount_paid || 0) >= parseFloat(document.amount || 0) ? 'paid' : 'unpaid',
            workflow_status: p.workflow_status || 'received',
        };
    }, [initialPayload, document]);

    const itemsData = useMemo(() => {
        const rawItems = initialPayload.items || [];
        return rawItems.map(i => ({
            id: i.id || `item-${Math.random()}`,
            product_id: i.product_id || i.id,
            product_name: i.product_name || i.name || i.item_name || 'Product',
            tax_rate: parseFloat(i.tax_rate ?? 0),
            base_unit: i.base_unit || i.unit_name || i.unit || 'pcs',
            qty: parseFloat(i.qty ?? i.quantity ?? 1),
            unit_cost: parseFloat(i.unit_cost ?? i.unit_price ?? i.price ?? i.rate ?? i.cost ?? 0),
            discount_amount: parseFloat(i.discount_amount ?? i.discount ?? 0),
            business_pct: i.business_pct !== undefined ? parseFloat(i.business_pct) : 100,
            variant_id: i.variant_id || null,
        }));
    }, [initialPayload]);

    const landedCostsData = useMemo(() => {
        const rawExtras = initialPayload.extras || [];
        return rawExtras.map(x => ({
            id: x.id || `extra-${Math.random()}`,
            category_id: x.category_id || '',
            amount: parseFloat(x.amount || 0),
            method: x.method || 'value',
            description: x.description || '',
        }));
    }, [initialPayload]);

    // Review Notice Strip that sits right inside the document layout
    const renderNotice = () => (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface border border-line rounded-xl shadow-xs mb-3">
            <div className="flex items-center gap-3">
                <Link
                    href={isMaker ? route('store.approvals.my-submissions', { store_slug: storeSlug }) : route('store.approvals.inbox', { store_slug: storeSlug })}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-line text-ink hover:bg-interactive-hover transition-colors"
                    title={isMaker ? "Back to My Submissions" : "Back to Reviewer Inbox"}
                >
                    <ArrowLeft size={16} />
                </Link>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-ink">{docTitle}</span>
                        <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-sunken text-ink-muted">
                            #{document.document_number}
                        </span>
                        {renderStatusBadge()}
                    </div>
                    <p className="text-2xs text-ink-muted mt-0.5">
                        Submitted by <strong className="text-ink font-semibold">{document.maker?.name || 'Maker'}</strong> • {formatDateTime(document.created_at)}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setHistoryDrawerOpen(true)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-surface border border-line text-ink hover:bg-interactive-hover flex items-center gap-1.5 transition-colors"
                >
                    <History size={13} />
                    <span>Audit & History ({document.revisions?.length || 1})</span>
                </button>

                {canApprove && (
                    <>
                        <button
                            type="button"
                            onClick={() => setActionModal('reject')}
                            disabled={isSubmitting}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-rose-300 text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-1"
                        >
                            <XCircle size={13} /> Reject
                        </button>
                        <button
                            type="button"
                            onClick={() => setActionModal('return')}
                            disabled={isSubmitting}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-amber-300 text-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors flex items-center gap-1"
                        >
                            <RotateCcw size={13} /> Return to Maker
                        </button>

                        {isEditing ? (
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                disabled={isSubmitting}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface border border-line text-ink hover:bg-interactive-hover transition-colors flex items-center gap-1"
                            >
                                <X size={13} /> Cancel Edit
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                disabled={isSubmitting}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors flex items-center gap-1"
                            >
                                <Edit3 size={13} /> Edit Document
                            </button>
                        )}

                        {!isEditing && (
                            <button
                                type="button"
                                onClick={() => setActionModal('approve')}
                                disabled={isSubmitting}
                                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition-colors"
                            >
                                <CheckCircle2 size={14} /> Approve & Post
                            </button>
                        )}
                    </>
                )}

                {isMaker && canWithdraw && (
                    <button
                        type="button"
                        onClick={() => setActionModal('withdraw')}
                        disabled={isSubmitting}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-line text-ink-muted hover:text-rose-600 hover:bg-interactive-hover transition-colors flex items-center gap-1"
                    >
                        <Ban size={13} /> Withdraw
                    </button>
                )}

                {isMaker && canResubmit && (
                    <Link
                        href={route('store.approvals.correct', { store_slug: storeSlug, id: document.id })}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                        <Edit3 size={14} /> Edit & Resubmit
                    </Link>
                )}
            </div>
        </div>
    );

    const renderExtraActions = () => (
        <div className="w-full flex flex-col gap-2" style={{ flex: '1 0 100%', width: '100%' }}>
            {canApprove && !isEditing && (
                <>
                    {/* Row 1: Primary Full-Width Action */}
                    <button
                        type="button"
                        onClick={() => setActionModal('approve')}
                        disabled={isSubmitting}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                        <CheckCircle2 size={16} />
                        <span>Approve & Post</span>
                    </button>

                    {/* Row 2: 3 Balanced Secondary Actions */}
                    <div className="grid grid-cols-3 gap-2 w-full">
                        <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            disabled={isSubmitting}
                            className="py-2 px-1.5 rounded-xl text-xs font-semibold bg-surface border border-line text-ink hover:bg-interactive-hover hover:border-ink-muted transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                        >
                            <Edit3 size={13} className="text-primary shrink-0" />
                            <span>Edit</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActionModal('return')}
                            disabled={isSubmitting}
                            className="py-2 px-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                        >
                            <RotateCcw size={13} className="shrink-0" />
                            <span>Return</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActionModal('reject')}
                            disabled={isSubmitting}
                            className="py-2 px-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                        >
                            <XCircle size={13} className="shrink-0" />
                            <span>Reject</span>
                        </button>
                    </div>
                </>
            )}

            {canApprove && isEditing && (
                <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={isSubmitting}
                    className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-surface border border-line text-ink hover:bg-interactive-hover transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                    <X size={14} />
                    <span>Cancel Edit</span>
                </button>
            )}

            {isMaker && canResubmit && (
                <Link
                    href={route('store.approvals.correct', { store_slug: storeSlug, id: document.id })}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                    <Edit3 size={15} />
                    <span>Edit & Resubmit</span>
                </Link>
            )}

            {isMaker && canWithdraw && (
                <button
                    type="button"
                    onClick={() => setActionModal('withdraw')}
                    disabled={isSubmitting}
                    className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-surface border border-line text-ink-muted hover:text-rose-600 hover:bg-interactive-hover transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                    <Ban size={14} />
                    <span>Withdraw Submission</span>
                </button>
            )}
        </div>
    );

    // ── Purchase Documents: Render Exact PurchaseForm / MoneyDocument ───────────────
    if (document.document_type === 'purchase_posting' || document.document_type === 'purchase_return') {
        return (
            <>
                <Head title={`Review Purchase · #${document.document_number || document.id}`} />

                <PurchaseForm
                    mode="edit"
                    purchase={purchaseData}
                    items={itemsData}
                    landedCosts={landedCostsData}
                    suppliers={suppliers}
                    products={products}
                    warehouses={warehouses}
                    expenseCategories={expenseCategories}
                    locked={!isEditing}
                    lockNote="This purchase bill is pending review and approval."
                    notice={renderNotice()}
                    extraActions={renderExtraActions()}
                    saveLabel="Save & Approve to Ledger"
                    afterUrl={route('store.approvals.inbox', { store_slug: storeSlug })}
                    url={() => route('store.approvals.approve', { store_slug: storeSlug, id: document.id })}
                    onSaved={(res) => {
                        fireToast(res.data?.message || 'Document approved and posted successfully!', 'success');
                        router.visit(route('store.approvals.inbox', { store_slug: storeSlug }));
                    }}
                    outerBuildPayload={({ d, items, totals, acct, opts }) => {
                        const priced = items.filter((i) => i.product);
                        const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
                        const updatedPayload = {
                            supplier_id: d.party?.id,
                            party_id: d.party?.id,
                            supplier_name: d.party?.name,
                            warehouse_id: d.warehouse_id || null,
                            purchase_date: d.purchase_date,
                            due_date: d.due_date || null,
                            supplier_invoice: d.supplier_invoice || null,
                            reference: d.reference || null,
                            notes: d.notes || null,
                            payment_method: d.paymentMethod,
                            workflow_status: d.workflow_status,
                            round_off: totals.grandTotal - totals.rawGrandTotal,
                            items: priced.map((src) => ({
                                product_id: src.product?.id,
                                product_name: src.product?.name,
                                variant_id: src.variant?.id || null,
                                qty: num(src.quantity),
                                unit_cost: num(src.price),
                                discount_amount: num(src.discount),
                                business_pct: num(src.business_pct ?? 100),
                                tax_rate: num(src.tax_rate ?? 0),
                            })),
                            extras: (d.extras || []).filter((x) => num(x.amount) > 0).map((x) => ({
                                amount: num(x.amount),
                                method: x.method || 'value',
                                category_id: x.category_id || null,
                                description: x.description || null,
                            })),
                            payment_account_id: d.paymentAccountId || null,
                            amount_paid: num(d.amountPaid),
                        };

                        return {
                            notes: actionNotes || 'Approved with reviewer modifications',
                            version: document.version,
                            updated_payload: updatedPayload,
                            updated_amount: totals.grandTotal,
                        };
                    }}
                />

                <AuditHistoryDrawer
                    isOpen={historyDrawerOpen}
                    onClose={() => setHistoryDrawerOpen(false)}
                    document={document}
                    store={store}
                />

                <DecisionModal
                    modalType={actionModal}
                    onClose={() => setActionModal(null)}
                    onConfirm={handleConfirmDecision}
                    notes={actionNotes}
                    setNotes={setActionNotes}
                    selectedReasonCode={selectedReasonCode}
                    setSelectedReasonCode={setSelectedReasonCode}
                    returnReasons={returnReasons}
                    isSubmitting={isSubmitting}
                    document={document}
                    store={store}
                />
            </>
        );
    }

    const renderDocumentBody = () => {
        switch (document.document_type) {
            case 'sales_invoice':
                return (
                    <SalesInvoiceApprovalView
                        document={document}
                        payload={initialPayload}
                        locked={!isEditing}
                        notice={renderNotice()}
                        extraActions={renderExtraActions()}
                        onApproveWithEdits={(res) => {
                            fireToast(res.data?.message || 'Sales invoice approved and posted successfully!', 'success');
                            router.visit(route('store.approvals.inbox', { store_slug: storeSlug }));
                        }}
                        storeSlug={storeSlug}
                        customers={customers}
                        products={products}
                        warehouses={warehouses}
                        bankAccounts={bankAccounts}
                        actionNotes={actionNotes}
                    />
                );

            case 'sales_return':
                return (
                    <SalesReturnApprovalView
                        document={document}
                        payload={initialPayload}
                        locked={!isEditing}
                        notice={renderNotice()}
                        extraActions={renderExtraActions()}
                        onApproveWithEdits={(res) => {
                            fireToast(res.data?.message || 'Sales return approved successfully!', 'success');
                            router.visit(route('store.approvals.inbox', { store_slug: storeSlug }));
                        }}
                        storeSlug={storeSlug}
                        customers={customers}
                        products={products}
                        actionNotes={actionNotes}
                    />
                );

            case 'proposal':
                return (
                    <ProposalApprovalView
                        document={document}
                        payload={initialPayload}
                        locked={!isEditing}
                        notice={renderNotice()}
                        extraActions={renderExtraActions()}
                        onApproveWithEdits={(res) => {
                            fireToast(res.data?.message || 'Quotation approved successfully!', 'success');
                            router.visit(route('store.approvals.inbox', { store_slug: storeSlug }));
                        }}
                        storeSlug={storeSlug}
                        customers={customers}
                        products={products}
                        actionNotes={actionNotes}
                    />
                );

            case 'operating_expense':
                return (
                    <OperatingExpenseApprovalView
                        document={document}
                        payload={initialPayload}
                        locked={!isEditing}
                        notice={renderNotice()}
                        extraActions={renderExtraActions()}
                        onApproveWithEdits={(res) => {
                            fireToast(res.data?.message || 'Operating expense approved and posted successfully!', 'success');
                            router.visit(route('store.approvals.inbox', { store_slug: storeSlug }));
                        }}
                        storeSlug={storeSlug}
                        suppliers={suppliers}
                        bankAccounts={bankAccounts}
                        categories={expenseCategories}
                        actionNotes={actionNotes}
                    />
                );

            case 'customer_receipt':
            case 'supplier_refund':
                return (
                    <PaymentInApprovalView
                        document={document}
                        payload={initialPayload}
                        isEditing={isEditing}
                        setIsEditing={setIsEditing}
                        notice={renderNotice()}
                        extraActions={renderExtraActions()}
                        store={store}
                        customers={customers}
                        suppliers={suppliers}
                        bankAccounts={bankAccounts}
                        actionNotes={actionNotes}
                    />
                );

            case 'supplier_payment':
            case 'customer_refund':
                return (
                    <PaymentOutApprovalView
                        document={document}
                        payload={initialPayload}
                        isEditing={isEditing}
                        setIsEditing={setIsEditing}
                        notice={renderNotice()}
                        extraActions={renderExtraActions()}
                        store={store}
                        customers={customers}
                        suppliers={suppliers}
                        bankAccounts={bankAccounts}
                        actionNotes={actionNotes}
                    />
                );

            case 'fund_transfer':
                return (
                    <FundTransferApprovalView
                        document={document}
                        payload={initialPayload}
                        isEditing={isEditing}
                        setIsEditing={setIsEditing}
                        notice={renderNotice()}
                        extraActions={renderExtraActions()}
                        store={store}
                        bankAccounts={bankAccounts}
                        actionNotes={actionNotes}
                    />
                );

            case 'capital_injection':
            case 'owner_drawings':
                return (
                    <FundMovementApprovalView
                        document={document}
                        payload={initialPayload}
                        isEditing={isEditing}
                        setIsEditing={setIsEditing}
                        notice={renderNotice()}
                        extraActions={renderExtraActions()}
                        store={store}
                        bankAccounts={bankAccounts}
                        actionNotes={actionNotes}
                    />
                );

            case 'balance_adjustment':
            default:
                return (
                    <PartyAdjustmentApprovalView
                        document={document}
                        payload={initialPayload}
                        isEditing={isEditing}
                        setIsEditing={setIsEditing}
                        notice={renderNotice()}
                        extraActions={renderExtraActions()}
                        store={store}
                        parties={parties}
                        customers={customers}
                        suppliers={suppliers}
                        actionNotes={actionNotes}
                    />
                );
        }
    };

    return (
        <>
            <Head title={`Review ${docTitle} · #${document.document_number || document.id}`} />

            {renderDocumentBody()}

            <AuditHistoryDrawer
                isOpen={historyDrawerOpen}
                onClose={() => setHistoryDrawerOpen(false)}
                document={document}
                store={store}
            />

            <DecisionModal
                modalType={actionModal}
                onClose={() => setActionModal(null)}
                onConfirm={handleConfirmDecision}
                notes={actionNotes}
                setNotes={setActionNotes}
                selectedReasonCode={selectedReasonCode}
                setSelectedReasonCode={setSelectedReasonCode}
                returnReasons={returnReasons}
                isSubmitting={isSubmitting}
                document={document}
                store={store}
            />
        </>
    );
}
