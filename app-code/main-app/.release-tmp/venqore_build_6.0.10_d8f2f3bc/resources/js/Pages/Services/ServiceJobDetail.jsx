import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import {
    ArrowLeft,
    MapPin,
    Calendar,
    User,
    FileText,
    Receipt,
    Clock,
    CheckCircle2,
    AlertCircle,
    Wrench,
    Plus,
    Trash2,
    DollarSign,
    RotateCcw,
    TrendingUp,
    TrendingDown,
    X,
    ExternalLink,
    Shield
} from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { useTermText } from '@/lib/terms';

const STATUS_META = {
    draft:          { label: 'Draft',          className: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
    scheduled:      { label: 'Scheduled',      className: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' },
    in_progress:    { label: 'In Progress',    className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' },
    on_hold:        { label: 'On Hold',        className: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300' },
    awaiting_parts: { label: 'Awaiting Parts', className: 'bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300' },
    completed:      { label: 'Completed',      className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' },
    invoiced:       { label: 'Invoiced',       className: 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300' },
    cancelled:      { label: 'Cancelled',      className: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300' },
};

const NEXT_STATUS = {
    draft:          ['scheduled', 'cancelled'],
    scheduled:      ['in_progress', 'on_hold', 'cancelled'],
    in_progress:    ['on_hold', 'awaiting_parts', 'completed', 'cancelled'],
    on_hold:        ['scheduled', 'in_progress', 'cancelled'],
    awaiting_parts: ['in_progress', 'cancelled'],
    completed:      ['invoiced'],
    invoiced:       [],
    cancelled:      [],
};

function StatusBadge({ status }) {
    const meta = STATUS_META[status] || { label: status, className: 'bg-sunken text-ink-secondary' };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-2xs font-semibold ${meta.className}`}>
            {meta.label}
        </span>
    );
}

const EVENT_ICON = {
    created:               FileText,
    status_changed:        Clock,
    technician_assigned:   User,
    technician_unassigned: User,
    invoiced:              Receipt,
};

export default function ServiceJobDetail({ job, employees = [], tools = [] }) {
    const { store } = usePage().props;
    const storeSlug = store?.slug || (typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : '');
    const [busy, setBusy] = useState(false);
    const tt = useTermText();

    // Modal states
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignForm, setAssignForm] = useState({ employee_id: '', role: 'primary' });

    const [isCheckoutToolModalOpen, setIsCheckoutToolModalOpen] = useState(false);
    const [checkoutToolForm, setCheckoutToolForm] = useState({ tool_id: '', quantity: 1 });

    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [scheduleForm, setScheduleForm] = useState({
        scheduled_for: job.scheduled_for || new Date().toISOString().split('T')[0],
        scheduled_start_at: job.scheduled_start_at || '',
        scheduled_end_at: job.scheduled_end_at || '',
    });

    const changeStatus = (status) => {
        if (busy) return;
        setBusy(true);
        router.post(
            route('store.service-jobs.status', { store_slug: storeSlug, serviceJob: job.id }),
            { status },
            { preserveScroll: true, onFinish: () => setBusy(false) }
        );
    };

    const convertInvoice = () => {
        if (busy) return;
        setBusy(true);
        router.post(
            route('store.service-jobs.convert-invoice', { store_slug: storeSlug, serviceJob: job.id }),
            {},
            { preserveScroll: true, onFinish: () => setBusy(false) }
        );
    };

    // Assign Tech
    const handleAssign = (e) => {
        e.preventDefault();
        router.post(
            route('store.service-jobs.assign', { store_slug: storeSlug, serviceJob: job.id }),
            assignForm,
            {
                preserveScroll: true,
                onSuccess: () => setIsAssignModalOpen(false),
            }
        );
    };

    // Unassign Tech
    const handleUnassign = (employeeId) => {
        if (!confirm(tt('Are you sure you want to unassign this technician?'))) return;
        router.delete(
            route('store.service-jobs.unassign', { store_slug: storeSlug, serviceJob: job.id, employeeId }),
            { preserveScroll: true }
        );
    };

    // Checkout Tool
    const handleCheckoutTool = (e) => {
        e.preventDefault();
        router.post(
            route('store.service-jobs.checkout-tool', { store_slug: storeSlug, serviceJob: job.id }),
            checkoutToolForm,
            {
                preserveScroll: true,
                onSuccess: () => setIsCheckoutToolModalOpen(false),
            }
        );
    };

    // Return Tool
    const handleReturnTool = (toolId) => {
        router.post(
            route('store.service-jobs.return-tool', { store_slug: storeSlug, serviceJob: job.id, toolId }),
            {},
            { preserveScroll: true }
        );
    };

    // Update Schedule
    const handleUpdateSchedule = (e) => {
        e.preventDefault();
        router.post(
            route('store.service-jobs.update-schedule', { store_slug: storeSlug, serviceJob: job.id }),
            scheduleForm,
            {
                preserveScroll: true,
                onSuccess: () => setIsScheduleModalOpen(false),
            }
        );
    };

    const lines = job.lines || [];
    const revenueTotal = lines.reduce((sum, l) => sum + Number(l.quantity) * Number(l.unit_price), 0) || Number(job.estimated_total) || 0;
    
    // Linked expenses calculation (Phase 6)
    const expenses = job.expenses || [];
    const expensesTotal = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
    const netMargin = revenueTotal - expensesTotal;
    const marginPercentage = revenueTotal > 0 ? ((netMargin / revenueTotal) * 100).toFixed(1) : 0;

    const nextOptions = NEXT_STATUS[job.status] || [];

    return (
        <OneGlanceLayout title={job.number} activeMenu="Sell">
            <Head title={`${job.number} — ${job.title}`} />

            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
                <Link
                    href={route('store.service-jobs.index', { store_slug: storeSlug })}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-secondary hover:text-ink transition-colors"
                >
                    <ArrowLeft size={14} />
                    {tt('Back to Work Orders')}
                </Link>

                {/* Top Action Bar */}
                <div className="mt-3 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
                                {job.number}
                            </h1>
                            <StatusBadge status={job.status} />
                            <span className="rounded-md border border-line bg-app px-2 py-0.5 text-2xs font-semibold uppercase text-ink-muted">
                                {job.priority || 'Normal'} Priority
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-ink-secondary">{job.title}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {job.status === 'completed' && (
                            <button
                                type="button"
                                onClick={convertInvoice}
                                disabled={busy || lines.length === 0}
                                className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent-fill px-4 text-sm font-semibold text-accent-on shadow-glow transition-colors hover:bg-accent-fill-hover disabled:opacity-60"
                            >
                                <Receipt size={16} />
                                Convert to Invoice
                            </button>
                        )}

                        {job.status === 'invoiced' && job.invoice && (
                            <span className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink-secondary">
                                <CheckCircle2 size={16} className="text-emerald-500" />
                                Invoiced as {job.invoice.invoice_number}
                            </span>
                        )}
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left 2 Columns */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Job Details Card */}
                        <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-sm font-semibold text-ink">{tt('Job & Customer Details')}</h2>
                                <button
                                    type="button"
                                    onClick={() => setIsScheduleModalOpen(true)}
                                    className="text-xs font-semibold text-accent-text hover:underline flex items-center gap-1"
                                >
                                    <Clock size={13} /> Reschedule
                                </button>
                            </div>

                            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="rounded-lg border border-line bg-app p-3">
                                    <dt className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-widest text-ink-muted">
                                        <User size={12} /> {tt('Customer')}
                                    </dt>
                                    <dd className="mt-1 font-semibold text-ink">{job.party?.name || 'Walk-in'}</dd>
                                    {job.party?.phone && <dd className="text-xs text-ink-muted mt-0.5">{job.party.phone}</dd>}
                                </div>

                                <div className="rounded-lg border border-line bg-app p-3">
                                    <dt className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-widest text-ink-muted">
                                        <Calendar size={12} /> Scheduled Date & Time
                                    </dt>
                                    <dd className="mt-1 font-semibold text-ink">
                                        {job.scheduled_start_at
                                            ? new Date(job.scheduled_start_at).toLocaleString()
                                            : job.scheduled_for || 'Not set'}
                                    </dd>
                                </div>

                                {job.site_address && (
                                    <div className="sm:col-span-2 rounded-lg border border-line bg-app p-3">
                                        <dt className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-widest text-ink-muted">
                                            <MapPin size={12} /> Site Location Address
                                        </dt>
                                        <dd className="mt-1 text-sm text-ink">{job.site_address}</dd>
                                    </div>
                                )}

                                {job.description && (
                                    <div className="sm:col-span-2 rounded-lg border border-line bg-app p-3">
                                        <dt className="text-2xs font-semibold uppercase tracking-widest text-ink-muted">
                                            Description / Notes
                                        </dt>
                                        <dd className="mt-1 text-xs leading-relaxed text-ink-secondary">
                                            {job.description}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {/* Billable Lines Table */}
                        <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
                            <h2 className="text-sm font-semibold text-ink mb-3">{tt('Billable Scope & Services')}</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-line text-2xs font-semibold uppercase tracking-widest text-ink-muted">
                                            <th className="py-2.5 pr-3">{tt('Item / Service')}</th>
                                            <th className="py-2.5 pr-3 text-right">Qty</th>
                                            <th className="py-2.5 pr-3 text-right">Unit Rate</th>
                                            <th className="py-2.5 pl-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-line">
                                        {lines.map((line) => (
                                            <tr key={line.id}>
                                                <td className="py-3 pr-3 text-ink">
                                                    <p className="font-medium">{line.description}</p>
                                                    <span className="text-3xs uppercase tracking-wider text-ink-muted">
                                                        {line.kind}
                                                    </span>
                                                </td>
                                                <td className="py-3 pr-3 text-right text-ink-secondary">{line.quantity}</td>
                                                <td className="py-3 pr-3 text-right text-ink-secondary font-mono">
                                                    {formatCurrency(line.unit_price)}
                                                </td>
                                                <td className="py-3 pl-3 text-right font-semibold text-ink font-mono">
                                                    {formatCurrency(Number(line.quantity) * Number(line.unit_price))}
                                                </td>
                                            </tr>
                                        ))}
                                        {lines.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="py-6 text-center text-xs text-ink-muted">
                                                    No specific billable line items entered.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    {lines.length > 0 && (
                                        <tfoot>
                                            <tr className="border-t border-line bg-sunken/20">
                                                <td colSpan={3} className="py-3 pr-3 text-right text-xs font-semibold uppercase tracking-widest text-ink-muted">
                                                    Total Billable Value
                                                </td>
                                                <td className="py-3 pl-3 text-right text-sm font-bold text-ink font-mono">
                                                    {formatCurrency(revenueTotal)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>

                        {/* Phase 4/5: Checked-Out Tools & Field Equipment */}
                        <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
                                        <Wrench size={16} className="text-accent-text" />
                                        Field Tools & Equipment Custody
                                    </h2>
                                    <p className="text-2xs text-ink-muted">{tt('Tools checked out for this job assignment.')}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsCheckoutToolModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-app px-2.5 py-1.5 text-xs font-semibold text-accent-text hover:bg-sunken"
                                >
                                    <Plus size={13} />
                                    Check Out Tool
                                </button>
                            </div>

                            <div className="space-y-2">
                                {(job.tools || []).map((jt) => (
                                    <div
                                        key={jt.id}
                                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-app p-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-ink-muted border border-line">
                                                <Wrench size={15} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-ink">{jt.tool?.name || `Tool #${jt.tool_id}`}</p>
                                                <p className="text-3xs text-ink-muted">
                                                    Taken: {new Date(jt.taken_at).toLocaleString()}
                                                    {jt.quantity > 1 ? ` &bull; Qty: ${jt.quantity}` : ''}
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            {jt.returned_at ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-2xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                    <CheckCircle2 size={12} /> Returned
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handleReturnTool(jt.tool_id)}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1 text-2xs font-semibold text-ink hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                                                >
                                                    <RotateCcw size={12} />
                                                    Mark Returned
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {(!job.tools || job.tools.length === 0) && (
                                    <p className="py-4 text-center text-xs text-ink-muted">
                                        {tt('No tools checked out for this job yet.')}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Phase 6: Direct Job Expenses & Costing */}
                        <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
                                        <DollarSign size={16} className="text-rose-500" />
                                        {tt('Direct Job Expenses & Materials')}
                                    </h2>
                                    <p className="text-2xs text-ink-muted">{tt('Cost of goods, fuel, parts, and vendor expenses linked to this job.')}</p>
                                </div>
                                <Link
                                    href={route('store.expenses.index', { store_slug: storeSlug }) + `?service_job_id=${job.id}`}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-accent-text hover:underline"
                                >
                                    <span>Expenses Module</span>
                                    <ExternalLink size={12} />
                                </Link>
                            </div>

                            <div className="space-y-2">
                                {expenses.map((exp) => (
                                    <div
                                        key={exp.id}
                                        className="flex items-center justify-between rounded-lg border border-line bg-app p-3 text-xs"
                                    >
                                        <div>
                                            <p className="font-semibold text-ink">{exp.description || exp.expense_category?.name || 'Expense'}</p>
                                            <p className="text-2xs text-ink-muted">
                                                {exp.expense_date} &bull; {exp.expense_category?.name || 'General'}
                                            </p>
                                        </div>
                                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                                            -{formatCurrency(exp.amount)}
                                        </span>
                                    </div>
                                ))}

                                {expenses.length === 0 && (
                                    <p className="py-4 text-center text-xs text-ink-muted">
                                        {tt('No direct expenses linked to this job.')}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Activity Audit Trail */}
                        <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
                            <h2 className="text-sm font-semibold text-ink mb-3">{tt('Job Audit Log & History')}</h2>
                            <ul className="space-y-3">
                                {(job.events || []).map((event) => {
                                    const Icon = EVENT_ICON[event.type] || AlertCircle;
                                    return (
                                        <li key={event.id} className="flex items-start gap-3">
                                            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sunken text-ink-muted">
                                                <Icon size={12} />
                                            </span>
                                            <div>
                                                <p className="text-xs text-ink font-medium">{event.body}</p>
                                                <p className="mt-0.5 text-3xs text-ink-muted">
                                                    {event.user?.name ? `${event.user.name} · ` : ''}
                                                    {new Date(event.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>

                    {/* Right Column: Financials, Lifecycle, Assigned Technicians */}
                    <div className="space-y-6">
                        {/* Financial Profitability Card (Phase 6) */}
                        <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
                            <h2 className="text-sm font-semibold text-ink flex items-center gap-2 mb-3">
                                <TrendingUp size={16} className="text-accent-text" />
                                {tt('Job Financials & Margin')}
                            </h2>

                            <div className="space-y-3">
                                <div className="flex justify-between text-xs">
                                    <span className="text-ink-secondary">Estimated / Billable Value</span>
                                    <span className="font-mono font-semibold text-ink">{formatCurrency(revenueTotal)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-ink-secondary">Direct Expenses Incurred</span>
                                    <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">
                                        -{formatCurrency(expensesTotal)}
                                    </span>
                                </div>
                                <div className="border-t border-line pt-2.5 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-ink">{tt('Net Job Margin')}</p>
                                        <p className="text-3xs text-ink-muted">{marginPercentage}% profit margin</p>
                                    </div>
                                    <span
                                        className={`font-mono text-base font-black ${
                                            netMargin >= 0
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-rose-600 dark:text-rose-400'
                                        }`}
                                    >
                                        {formatCurrency(netMargin)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Lifecycle Status Box */}
                        <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
                            <h2 className="text-sm font-semibold text-ink mb-3">Status Lifecycle</h2>
                            {nextOptions.length === 0 ? (
                                <p className="text-xs text-ink-muted">
                                    {tt('Job')} is {STATUS_META[job.status]?.label.toLowerCase() || job.status}. {tt('No forward transitions.')}
                                </p>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {nextOptions.map((status) => (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={() => changeStatus(status)}
                                            disabled={busy}
                                            className="h-10 rounded-lg border border-line bg-app px-3.5 text-left text-xs font-semibold text-ink hover:bg-sunken hover:border-accent transition-colors disabled:opacity-50"
                                        >
                                            Mark as &rarr; {STATUS_META[status]?.label || status}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Assigned Staff & Technicians */}
                        <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
                                    <User size={16} className="text-accent-text" />
                                    {tt('Assigned Staff')}
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setIsAssignModalOpen(true)}
                                    className="text-xs font-semibold text-accent-text hover:underline"
                                >
                                    + Assign
                                </button>
                            </div>

                            <div className="space-y-2">
                                {(job.assignments || []).map((a) => (
                                    <div
                                        key={a.id}
                                        className="flex items-center justify-between rounded-lg border border-line bg-app p-2.5 text-xs"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-quiet text-3xs font-bold text-accent-text">
                                                {a.employee?.name?.charAt(0) || 'E'}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-ink">{a.employee?.name || tt('Staff')}</p>
                                                <span className="text-3xs uppercase tracking-wider text-ink-muted">
                                                    {a.role || 'Primary'}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleUnassign(a.employee_id)}
                                            className="p-1 text-ink-muted hover:text-rose-600 transition-colors"
                                            title="Unassign"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}

                                {(!job.assignments || job.assignments.length === 0) && (
                                    <p className="py-2 text-center text-xs text-ink-muted">
                                        {tt('No technician assigned yet.')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ASSIGN TECHNICIAN MODAL */}
            {isAssignModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-2xl animate-in fade-in zoom-in-95">
                        <h3 className="text-sm font-semibold text-ink mb-3">{tt('Assign Technician to Job')}</h3>
                        <form onSubmit={handleAssign} className="space-y-3">
                            <div>
                                <label className="mb-1 block text-2xs font-semibold uppercase text-ink-muted">{tt('Technician')}</label>
                                <select
                                    required
                                    value={assignForm.employee_id}
                                    onChange={(e) => setAssignForm({ ...assignForm, employee_id: e.target.value })}
                                    className="w-full rounded-lg border border-line bg-app px-3 py-2 text-xs text-ink"
                                >
                                    <option value="">Select an employee...</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-2xs font-semibold uppercase text-ink-muted">Role</label>
                                <select
                                    value={assignForm.role}
                                    onChange={(e) => setAssignForm({ ...assignForm, role: e.target.value })}
                                    className="w-full rounded-lg border border-line bg-app px-3 py-2 text-xs text-ink"
                                >
                                    <option value="primary">Primary Lead</option>
                                    <option value="assistant">Assistant</option>
                                    <option value="specialist">Specialist</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAssignModalOpen(false)}
                                    className="rounded-lg border border-line px-3 py-1.5 text-xs text-ink-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-lg bg-accent-fill px-4 py-1.5 text-xs font-semibold text-accent-on shadow-glow"
                                >
                                    Assign
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CHECKOUT TOOL MODAL */}
            {isCheckoutToolModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-2xl animate-in fade-in zoom-in-95">
                        <h3 className="text-sm font-semibold text-ink mb-3">{tt('Check Out Tool for Job')}</h3>
                        <form onSubmit={handleCheckoutTool} className="space-y-3">
                            <div>
                                <label className="mb-1 block text-2xs font-semibold uppercase text-ink-muted">Select Tool</label>
                                <select
                                    required
                                    value={checkoutToolForm.tool_id}
                                    onChange={(e) => setCheckoutToolForm({ ...checkoutToolForm, tool_id: e.target.value })}
                                    className="w-full rounded-lg border border-line bg-app px-3 py-2 text-xs text-ink"
                                >
                                    <option value="">Select equipment...</option>
                                    {tools.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name} ({t.status})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-2xs font-semibold uppercase text-ink-muted">Quantity</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={checkoutToolForm.quantity}
                                    onChange={(e) => setCheckoutToolForm({ ...checkoutToolForm, quantity: e.target.value })}
                                    className="w-full rounded-lg border border-line bg-app px-3 py-2 text-xs text-ink"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCheckoutToolModalOpen(false)}
                                    className="rounded-lg border border-line px-3 py-1.5 text-xs text-ink-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-lg bg-accent-fill px-4 py-1.5 text-xs font-semibold text-accent-on shadow-glow"
                                >
                                    Check Out
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* RESCHEDULE MODAL */}
            {isScheduleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-2xl animate-in fade-in zoom-in-95">
                        <h3 className="text-sm font-semibold text-ink mb-3">{tt('Update Job Schedule')}</h3>
                        <form onSubmit={handleUpdateSchedule} className="space-y-3">
                            <div>
                                <label className="mb-1 block text-2xs font-semibold uppercase text-ink-muted">Scheduled Date</label>
                                <input
                                    type="date"
                                    value={scheduleForm.scheduled_for}
                                    onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_for: e.target.value })}
                                    className="w-full rounded-lg border border-line bg-app px-3 py-2 text-xs text-ink"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-2xs font-semibold uppercase text-ink-muted">Start Date & Time</label>
                                <input
                                    type="datetime-local"
                                    value={scheduleForm.scheduled_start_at ? scheduleForm.scheduled_start_at.substring(0, 16) : ''}
                                    onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_start_at: e.target.value })}
                                    className="w-full rounded-lg border border-line bg-app px-3 py-2 text-xs text-ink"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsScheduleModalOpen(false)}
                                    className="rounded-lg border border-line px-3 py-1.5 text-xs text-ink-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-lg bg-accent-fill px-4 py-1.5 text-xs font-semibold text-accent-on shadow-glow"
                                >
                                    Save Schedule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </OneGlanceLayout>
    );
}
