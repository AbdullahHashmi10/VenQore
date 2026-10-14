import React, { useMemo, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, Lock, Search } from 'lucide-react';

import { ReportShell, ReportSection, filterInputCls } from '@/Components/Reports/ReportKit';
import { buildReportCatalog } from '@/lib/reportCatalog';
import { getReportTier, getReportDecisionMessage } from '@/lib/reportPlanMap';
import { useTermText } from '@/lib/terms';

/**
 * Reports home. The catalogue (lib/reportCatalog) is the only list of reports;
 * this page searches it, filters it by category and lays it out as cards.
 * Reports whose module is off (hiddenReports) never reach the catalogue; reports
 * outside the plan show a lock and send the user to billing.
 */

const TILE_TONES = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    sky: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
    rose: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    violet: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
};

function ReportCard({ report, tone, billingHref, tt }) {
    const Icon = report.icon;
    const title = tt(report.title);
    const description = tt(report.description);

    if (report.locked) {
        const tier = getReportTier(report.route) || 'Starter';
        const decision = getReportDecisionMessage(report.route);
        return (
            <Link href={billingHref} title={decision || 'Upgrade to unlock'}
                className="group flex h-full min-h-[104px] min-w-0 items-center gap-3 rounded-[12px] border border-line bg-sunken/40 p-4 transition-colors hover:border-brand-300">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-sunken text-ink-muted"><Icon size={18} /></span>
                <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold text-ink-secondary">{title}</span>
                        <span className="shrink-0 rounded-full border border-brand-500/20 bg-brand-500/10 px-2 py-0.5 text-3xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">{tier}</span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-sm text-ink-muted">{decision || description}</span>
                </span>
                <span className="flex h-8 shrink-0 items-center gap-1 rounded-[12px] bg-brand-600 px-2.5 text-xs font-bold text-white group-hover:bg-brand-700"><Lock size={12} />Upgrade</span>
            </Link>
        );
    }

    return (
        <Link href={report.href}
            className="group flex h-full min-h-[104px] min-w-0 items-center gap-3 rounded-[12px] border border-line bg-surface p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/40 dark:hover:bg-brand-900/10">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] ${TILE_TONES[tone] || TILE_TONES.brand}`}><Icon size={18} /></span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-bold text-ink group-hover:text-brand-600 dark:group-hover:text-brand-400">{title}</span>
                <span className="mt-0.5 line-clamp-2 block text-sm text-ink-muted">{description}</span>
            </span>
            <ArrowRight size={16} className="shrink-0 text-ink-muted opacity-0 transition-all group-hover:translate-x-0.5 group-hover:text-brand-500 group-hover:opacity-100" />
        </Link>
    );
}

export default function ReportsHub() {
    const tt = useTermText();
    const { store, hiddenReports = [], planFeatures = {} } = usePage().props;
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('all');

    const catalog = useMemo(
        () => buildReportCatalog({ slug: store?.slug, hiddenReports, planFeatures }),
        [store?.slug, hiddenReports, planFeatures],
    );
    const billingHref = useMemo(() => {
        try { return route('store.billing', { store_slug: store?.slug }); } catch (e) { return '/billing'; }
    }, [store?.slug]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return catalog
            .filter((cat) => category === 'all' || cat.id === category)
            .map((cat) => ({
                ...cat,
                reports: q
                    ? cat.reports.filter((r) => `${tt(r.title)} ${tt(r.description)} ${cat.title}`.toLowerCase().includes(q))
                    : cat.reports,
            }))
            .filter((cat) => cat.reports.length > 0);
    }, [catalog, category, query, tt]);

    const total = catalog.reduce((n, c) => n + c.reports.length, 0);

    const filtersNode = (
        <>
            <div className="relative w-full sm:w-72">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${total} reports...`}
                    className={`${filterInputCls} w-full pl-9`} aria-label="Search reports" />
            </div>
            <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category"
                className={`${filterInputCls} min-w-[11rem] font-semibold`}>
                <option value="all">All categories</option>
                {catalog.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
        </>
    );

    return (
        <ReportShell title="Reports" subtitle="Every report in one place" activeKey="hub" hideNav filters={filtersNode}>
            {category === 'all' && !query.trim() && catalog.length > 1 && (
                <div className="grid shrink-0 grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
                    {catalog.map((c) => {
                        const CatIcon = c.icon;
                        return (
                            <button key={c.id} type="button"
                                onClick={() => document.getElementById(`reports-${c.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                                className="flex h-[76px] items-center gap-3 rounded-[14px] border border-line bg-surface px-4 text-left shadow-sm transition-colors hover:border-brand-300">
                                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] ${TILE_TONES[c.tone] || TILE_TONES.brand}`}>{CatIcon ? <CatIcon size={20} /> : null}</span>
                                <span className="min-w-0">
                                    <span className="block truncate text-base font-bold text-ink">{c.title}</span>
                                    <span className="block text-sm text-ink-muted">{c.reports.length} reports</span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {visible.map((cat) => (
                <div key={cat.id} id={`reports-${cat.id}`} className="shrink-0 scroll-mt-2">
                <ReportSection title={cat.title} subtitle={cat.description} icon={cat.icon} tone={cat.tone}
                    right={<span className="text-xs font-bold text-ink-muted">{cat.reports.length}</span>}>
                    <div className="grid auto-rows-fr grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                        {cat.reports.map((r) => (
                            <ReportCard key={r.key} report={r} tone={cat.tone} billingHref={billingHref} tt={tt} />
                        ))}
                    </div>
                </ReportSection>
                </div>
            ))}

            {visible.length === 0 && (
                <ReportSection>
                    <div className="flex flex-col items-center gap-2 py-12 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sunken text-ink-muted"><Search size={22} /></span>
                        <p className="text-sm font-bold text-ink-secondary">No reports found</p>
                        <p className="text-xs text-ink-muted">Try a different search or category</p>
                    </div>
                </ReportSection>
            )}
        </ReportShell>
    );
}
