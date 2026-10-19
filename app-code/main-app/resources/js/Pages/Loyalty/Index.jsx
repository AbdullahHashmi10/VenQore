import React, { useMemo, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Gift, Users, TrendingUp, ArrowDownCircle, Settings as SettingsIcon, Search } from 'lucide-react';

import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable, filterInputCls } from '@/Components/Reports/ReportKit';

/** Loyalty overview: balances per customer, recent activity and the current rates. */
export default function LoyaltyIndex({ enabled = false, balances = [], recent = [], rates = {} }) {
    const { store } = usePage().props;
    const [query, setQuery] = useState('');

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        return q ? balances.filter((b) => `${b.name} ${b.phone || ''}`.toLowerCase().includes(q)) : balances;
    }, [balances, query]);

    const outstanding = balances.reduce((n, b) => n + b.balance, 0);
    const earned = balances.reduce((n, b) => n + b.earned, 0);
    const redeemed = balances.reduce((n, b) => n + b.redeemed, 0);
    const liability = rates.redemption > 0 ? outstanding / rates.redemption : 0;

    const settingsHref = (() => { try { return route('store.growth-engine.settings', { store_slug: store?.slug }); } catch (e) { return '#'; } })();

    const filters = (
        <>
            <label className="relative block">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customer or phone..." className={`${filterInputCls} w-64 pl-9`} />
            </label>
            <Link href={settingsHref} className="flex h-10 items-center gap-2 rounded-[12px] border border-line px-3 text-sm font-bold text-ink-secondary hover:bg-interactive-hover">
                <SettingsIcon size={16} />Rates
            </Link>
        </>
    );

    const columns = [
        { key: 'name', label: 'Customer', sortable: true, render: (r) => <span className="font-bold text-ink">{r.name}</span> },
        { key: 'phone', label: 'Phone', render: (r) => r.phone || '-' },
        { key: 'balance', label: 'Points', align: 'right', sortable: true, render: (r) => <span className="font-bold text-brand-600">{r.balance.toLocaleString()}</span> },
        { key: 'earned', label: 'Earned', align: 'right', sortable: true, render: (r) => r.earned.toLocaleString() },
        { key: 'redeemed', label: 'Redeemed', align: 'right', sortable: true, render: (r) => r.redeemed.toLocaleString() },
    ];

    const activity = [
        { key: 'at', label: 'When', render: (r) => (r.at || '').slice(0, 16).replace('T', ' ') },
        { key: 'name', label: 'Customer', render: (r) => r.name },
        { key: 'points', label: 'Points', align: 'right', render: (r) => <span className={`font-bold ${r.type === 'redeemed' ? 'text-rose-600' : 'text-emerald-600'}`}>{r.type === 'redeemed' ? '-' : '+'}{Math.abs(r.points).toLocaleString()}</span> },
        { key: 'description', label: 'Reason' },
    ];

    return (
        <ReportShell title="Loyalty Points" subtitle="Customer points and rewards" activeKey="loyalty" navGroups={[]} showHub={false} filters={filters}>
            {!enabled && (
                <div className="shrink-0 rounded-[14px] border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                    Loyalty points are not included in your current plan, so new sales are not earning points. Existing balances below can still be redeemed.
                </div>
            )}
            <ReportKpis items={[
                { label: 'Points outstanding', value: outstanding.toLocaleString(), icon: Gift, tone: 'brand', sub: `Worth about ${liability.toLocaleString(undefined, { maximumFractionDigits: 0 })} to redeem` },
                { label: 'Customers with points', value: balances.filter((b) => b.balance > 0).length, icon: Users, tone: 'sky' },
                { label: 'Total earned', value: earned.toLocaleString(), icon: TrendingUp, tone: 'emerald' },
                { label: 'Total redeemed', value: redeemed.toLocaleString(), icon: ArrowDownCircle, tone: 'amber' },
            ]} />
            <ReportGrid>
                <ReportCol span={8}>
                    <ReportSection title="Customer balances" subtitle={`${rows.length} customers`} icon={Users} tone="sky" flush>
                        <ReportTable columns={columns} rows={rows} rowKey={(r) => r.id} empty="No customer has earned points yet" />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={4}>
                    <ReportSection title="How points work" icon={Gift} tone="brand">
                        <ul className="space-y-2 text-sm text-ink-secondary">
                            <li>Earn <b>{rates.per_unit}</b> point for every <b>{rates.per_amount}</b> spent, on sales that have a customer.</li>
                            <li>Redeem at <b>{rates.redemption}</b> points per 1 of currency.</li>
                        </ul>
                    </ReportSection>
                    <div className="mt-2" />
                    <ReportSection title="Recent activity" icon={TrendingUp} tone="emerald" flush>
                        <ReportTable columns={activity} rows={recent} rowKey={(r) => r.id} pageSize={0} empty="No activity yet" />
                    </ReportSection>
                </ReportCol>
            </ReportGrid>
        </ReportShell>
    );
}
