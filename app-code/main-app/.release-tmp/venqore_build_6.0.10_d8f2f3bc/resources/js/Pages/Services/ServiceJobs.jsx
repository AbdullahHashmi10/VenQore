import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import ServiceNavTabs from '@/Pages/Services/ServiceNavTabs';
import { Plus, Search, Wrench, Calendar, User, Clock, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { useTermText } from '@/lib/terms';

const STATUS_META = {
    draft:           { label: 'Draft',          className: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
    scheduled:       { label: 'Scheduled',      className: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300' },
    in_progress:     { label: 'In Progress',    className: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' },
    on_hold:         { label: 'On Hold',        className: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300' },
    awaiting_parts:  { label: 'Awaiting Parts', className: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300' },
    completed:       { label: 'Completed',      className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' },
    invoiced:        { label: 'Invoiced',       className: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300' },
    cancelled:       { label: 'Cancelled',      className: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' },
};

function StatusBadge({ status }) {
    const meta = STATUS_META[status] || { label: status, className: 'bg-sunken text-ink-secondary' };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-2xs font-semibold ${meta.className}`}>
            {meta.label}
        </span>
    );
}

export default function ServiceJobs({ jobs, filters = {}, stats = {} }) {
    const { store } = usePage().props;
    const storeSlug = store?.slug || (typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : '');
    const [search, setSearch] = useState(filters.search || '');
    const tt = useTermText();

    const runSearch = (e) => {
        if (e.key !== 'Enter') return;
        router.get(route('store.service-jobs.index', { store_slug: storeSlug }), { search, status: filters.status }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const setStatusFilter = (status) => {
        router.get(route('store.service-jobs.index', { store_slug: storeSlug }), { search, status }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <OneGlanceLayout title={tt('Service Jobs')} activeMenu="Sell">
            <Head title={tt('Service Jobs')} />

            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
                {/* Unified Services Tabs */}
                <ServiceNavTabs active="jobs" />

                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
                            {tt('Work Orders & Service Jobs')}
                        </h1>
                        <p className="mt-1 text-sm text-ink-secondary">
                            {tt('Track client work orders, technician dispatches, and billing status.')}
                        </p>
                    </div>
                    <Link
                        href={route('store.service-jobs.create', { store_slug: storeSlug })}
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent-fill px-4 text-sm font-semibold text-accent-on shadow-glow transition-colors duration-fast ease-standard hover:bg-accent-fill-hover"
                    >
                        <Plus size={16} />
                        {tt('New Work Order')}
                    </Link>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
                        <p className="text-2xs font-semibold uppercase tracking-widest text-ink-muted">{tt('Active Work Orders')}</p>
                        <p className="mt-1 text-2xl font-bold text-ink">{stats.open ?? 0}</p>
                    </div>
                    <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
                        <p className="text-2xs font-semibold uppercase tracking-widest text-ink-muted">Completed</p>
                        <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.completed ?? 0}</p>
                    </div>
                    <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
                        <p className="text-2xs font-semibold uppercase tracking-widest text-ink-muted">Invoiced & Settled</p>
                        <p className="mt-1 text-2xl font-bold text-accent-text">{stats.invoiced ?? 0}</p>
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[220px]">
                        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={runSearch}
                            placeholder={tt('Search by job #, service title, customer name or phone...')}
                            className="h-10 w-full rounded-lg border border-line bg-app pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-focus"
                        />
                    </div>
                    {['', 'scheduled', 'in_progress', 'completed', 'invoiced'].map((s) => (
                        <button
                            key={s || 'all'}
                            type="button"
                            onClick={() => setStatusFilter(s)}
                            className={`h-10 rounded-lg border px-3 text-xs font-semibold transition-colors duration-fast ease-standard ${
                                (filters.status || '') === s
                                    ? 'border-accent bg-accent-quiet text-accent-text'
                                    : 'border-line bg-surface text-ink-secondary hover:bg-sunken'
                            }`}
                        >
                            {s === '' ? 'All Statuses' : (STATUS_META[s]?.label || s)}
                        </button>
                    ))}
                </div>

                <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-surface shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-line bg-sunken/40 text-2xs font-semibold uppercase tracking-widest text-ink-muted">
                                <th className="px-4 py-3">{tt('Job / Order')}</th>
                                <th className="px-4 py-3">{tt('Customer')}</th>
                                <th className="px-4 py-3">Assigned Tech</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Schedule</th>
                                <th className="px-4 py-3 text-right">Est. Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {(jobs.data || []).map((job) => {
                                const tech = job.assignments?.[0]?.employee?.name;
                                return (
                                    <tr key={job.id} className="transition-colors duration-fast ease-standard hover:bg-sunken/40">
                                        <td className="px-4 py-3.5">
                                            <Link
                                                href={route('store.service-jobs.show', { store_slug: storeSlug, serviceJob: job.id })}
                                                className="font-semibold text-ink hover:text-accent-text"
                                            >
                                                {job.number}
                                            </Link>
                                            <p className="mt-0.5 text-xs text-ink-muted">{job.title}</p>
                                        </td>
                                        <td className="px-4 py-3.5 text-ink-secondary">
                                            <p className="font-medium text-ink">{job.party?.name || 'Walk-in'}</p>
                                            {job.party?.phone && <p className="text-2xs text-ink-muted">{job.party.phone}</p>}
                                        </td>
                                        <td className="px-4 py-3.5 text-ink-secondary">
                                            {tech ? (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink">
                                                    <User size={13} className="text-accent-text" />
                                                    {tech}
                                                </span>
                                            ) : (
                                                <span className="text-2xs text-ink-muted italic">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5"><StatusBadge status={job.status} /></td>
                                        <td className="px-4 py-3.5 text-ink-secondary">
                                            <div className="flex items-center gap-1.5 text-xs">
                                                <Calendar size={13} className="text-ink-muted" />
                                                <span>{job.scheduled_start_at ? new Date(job.scheduled_start_at).toLocaleDateString() : (job.scheduled_for || '—')}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono font-medium text-ink">
                                            {job.estimated_total ? formatCurrency(job.estimated_total) : '—'}
                                        </td>
                                    </tr>
                                );
                            })}

                            {(jobs.data || []).length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center">
                                        <Wrench size={26} className="mx-auto text-ink-muted/50 mb-2" />
                                        <p className="text-sm font-semibold text-ink">{tt('No service work orders found')}</p>
                                        <p className="mt-1 text-xs text-ink-secondary">{tt('Create a new work order or book via the Dispatch Calendar.')}</p>
                                        <Link
                                            href={route('store.service-jobs.create', { store_slug: storeSlug })}
                                            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-text hover:underline"
                                        >
                                            <Plus size={14} /> {tt('Create Work Order')}
                                        </Link>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {jobs.links && jobs.links.length > 3 && (
                    <div className="mt-4 flex flex-wrap items-center gap-1.5">
                        {jobs.links.map((link, i) => (
                            <button
                                key={i}
                                type="button"
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                className={`h-8 min-w-8 rounded-md px-2 text-xs font-semibold transition-colors duration-fast ease-standard ${
                                    link.active
                                        ? 'bg-accent-fill text-accent-on'
                                        : 'text-ink-secondary hover:bg-sunken disabled:opacity-40 border border-line'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </OneGlanceLayout>
    );
}
