import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import ServiceNavTabs, { useServiceNavGroups } from '@/Pages/Services/ServiceNavTabs';
import MobileListHeader from '@/Components/MobileListHeader';
import MobileStats from '@/Components/MobileStats';
import { ListPageFrame, ListToolbar, ListAddButton, ListStatCards } from '@/Components/ListShell';
import ListFilterPill from '@/Components/ListFilterPill';
import { Plus, Search, Wrench, Calendar, User, Clock, CheckCircle2, Filter } from 'lucide-react';
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
    const serviceNavGroups = useServiceNavGroups();

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
        <OneGlanceLayout title={tt('Service Jobs')} activeMenu="Sell" noPadding>
            <Head title={tt('Service Jobs')} />

            <ListPageFrame className="p-2.5">
            <ListToolbar
                title={tt('Service Jobs')}
                navGroups={serviceNavGroups}
                activeId="jobs"
                left={(
                    <ListFilterPill
                        icon={Filter}
                        label="All Statuses"
                        value={filters.status || ''}
                        allValue=""
                        options={['', 'scheduled', 'in_progress', 'completed', 'invoiced'].map((s) => ({ value: s, label: s === '' ? 'All Statuses' : (STATUS_META[s]?.label || s) }))}
                        onChange={setStatusFilter}
                    />
                )}
                search={{ value: search, onChange: setSearch, onKeyDown: runSearch, placeholder: tt('Search by job #, service title, customer name or phone...') }}
                actions={<ListAddButton icon={Plus} href={route('store.service-jobs.create', { store_slug: storeSlug })}>{tt('New Work Order')}</ListAddButton>}
            />
            <ListStatCards cards={[
                { label: tt('Active Work Orders'), value: stats.open ?? 0, icon: Clock },
                { label: 'Completed', value: stats.completed ?? 0, icon: CheckCircle2, icon_tone: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', value_tone: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Invoiced & Settled', value: stats.invoiced ?? 0, icon: Wrench, icon_tone: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
            ]} />
            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:contents">
                <MobileListHeader
                    title={tt('Service Jobs')}
                    navGroups={serviceNavGroups}
                    activeId="jobs"
                    filter={{
                        active: !!filters.status,
                        sections: [{ label: 'Status', value: filters.status || '', options: ['', 'scheduled', 'in_progress', 'completed', 'invoiced'].map((s) => ({ value: s, label: s === '' ? 'All Statuses' : (STATUS_META[s]?.label || s) })), onSelect: setStatusFilter }],
                    }}
                    search={{ value: search, onChange: setSearch, onKeyDown: runSearch, placeholder: tt('Search jobs...') }}
                    add={{ href: route('store.service-jobs.create', { store_slug: storeSlug }), label: tt('New Work Order') }}
                />
                <MobileStats bp="md" hero={0} items={[
                    { label: tt('Active'), value: stats.open ?? 0, tone: 'amber', icon: Clock },
                    { label: 'Completed', value: stats.completed ?? 0, tone: 'emerald', icon: CheckCircle2 },
                    { label: 'Invoiced', value: stats.invoiced ?? 0, tone: 'blue', icon: Wrench },
                ]} />

                <div className="mt-4 md:mt-0 overflow-x-auto md:flex-1 md:min-h-0 md:overflow-auto rounded-xl md:rounded-[14px] border border-line bg-surface shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="md:sticky md:top-0 md:z-10">
                            <tr className="border-b border-line bg-sunken/40 md:bg-sunken text-2xs font-semibold uppercase tracking-widest text-ink-muted">
                                <th className="sticky top-0 z-10 bg-app px-4 py-3">{tt('Job / Order')}</th>
                                <th className="sticky top-0 z-10 bg-app px-4 py-3">{tt('Customer')}</th>
                                <th className="sticky top-0 z-10 bg-app px-4 py-3">Assigned Tech</th>
                                <th className="sticky top-0 z-10 bg-app px-4 py-3">Status</th>
                                <th className="sticky top-0 z-10 bg-app px-4 py-3">Schedule</th>
                                <th className="sticky top-0 z-10 bg-app px-4 py-3 text-right">Est. Value</th>
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
                    <div className="mt-4 md:mt-0 md:shrink-0 flex flex-wrap items-center gap-1.5">
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
            </ListPageFrame>
        </OneGlanceLayout>
    );
}
