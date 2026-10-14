import React, { useState, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Calendar, Clock, Package, DollarSign, Layers, Info, Search, Activity, PieChart as PieIcon, X, AlertTriangle, ShieldCheck, Zap, Trophy, Table2 } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { useTermText } from '@/lib/terms';
import { ReportShell, ReportKpis, ReportSection, ReportGrid, ReportCol, ReportTable, FilterSelect, filterInputCls } from '@/Components/Reports/ReportKit';
import { DonutChart, RankBars } from '@/Components/Reports/ReportCharts';

export default function PointInTimeInventory({ data = [], stats = [], meta = {} }) {
    const tt = useTermText();
    const { store } = usePage().props;
    const today = new Date().toISOString().split('T')[0];
    const [asOfDate, setAsOfDate] = useState(meta.as_of_date || today);
    const [asOfTime, setAsOfTime] = useState(meta.as_of_time || '');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalDetails, setModalDetails] = useState({ ledger: [], batches: [] });
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [isAuditing, setIsAuditing] = useState(false);
    const [auditResult, setAuditResult] = useState(null);

    const handleSelectItem = (item) => {
        setSelectedItem(item);
        if (!item) { setModalDetails({ ledger: [], batches: [] }); return; }
        setIsLoadingDetails(true);
        fetch(route('store.reports.point-in-time-inventory.details', {
            store_slug: store.slug, product_id: item.product_id, as_of_date: asOfDate, as_of_time: asOfTime || undefined,
        }))
            .then((res) => res.json())
            .then((json) => { setModalDetails({ ledger: json.ledger || [], batches: json.batches || [] }); setIsLoadingDetails(false); })
            .catch((err) => { console.error(err); setIsLoadingDetails(false); });
    };

    const applyDate = () => {
        router.get(route('store.reports.point-in-time-inventory', { store_slug: store.slug }), {
            as_of_date: asOfDate, as_of_time: asOfTime || undefined,
        }, { preserveState: true, preserveScroll: true });
    };

    const pieData = useMemo(() => {
        const m = {};
        data.forEach((item) => { const n = item.category || 'Uncategorized'; m[n] = (m[n] || 0) + (item.stock_value || 0); });
        const list = Object.entries(m).map(([name, value]) => ({ name, value })).filter((s) => s.value > 0).sort((a, b) => b.value - a.value);
        if (list.length > 5) {
            const top = list.slice(0, 4);
            top.push({ name: 'Others', value: list.slice(4).reduce((s, i) => s + i.value, 0) });
            return top;
        }
        return list;
    }, [data]);

    const topItems = useMemo(() => [...data].sort((a, b) => (b.stock_value || 0) - (a.stock_value || 0)).slice(0, 8)
        .map((p) => ({ label: p.name, value: p.stock_value || 0, sub: `${p.quantity || 0} units` })), [data]);

    const filtered = useMemo(() => data.filter((r) => {
        const q = search.toLowerCase();
        if (q && !((r.name || '').toLowerCase().includes(q) || (r.sku || '').toLowerCase().includes(q) || (r.category || '').toLowerCase().includes(q))) return false;
        const qty = r.quantity || 0;
        if (statusFilter === 'out') return qty <= 0;
        if (statusFilter === 'low') return qty > 0 && qty <= 15;
        if (statusFilter === 'healthy') return qty > 15 && qty <= 200;
        if (statusFilter === 'over') return qty > 200;
        return true;
    }), [data, search, statusFilter]);

    const runInventoryAudit = () => {
        setIsAuditing(true);
        setTimeout(() => {
            const out = data.filter((r) => (r.quantity || 0) <= 0).length;
            const low = data.filter((r) => (r.quantity || 0) > 0 && (r.quantity || 0) <= 15).length;
            const over = data.filter((r) => (r.quantity || 0) > 200).length;
            setAuditResult({
                score: Math.max(10, 100 - out * 4 - low * 2 - over),
                outOfStockCount: out, lowStockCount: low, overstockedCount: over,
                potentialBleed: data.filter((r) => (r.quantity || 0) > 200).reduce((s, r) => s + (r.stock_value || 0) * 0.15, 0),
            });
            setIsAuditing(false);
        }, 800);
    };

    const statIcon = (label) => (label.includes('As Of') || label.includes('Date') ? Calendar : label.includes('Value') ? DollarSign : label.includes('Quantity') ? Layers : Package);
    const statTone = (label) => (label.includes('Value') ? 'emerald' : label.includes('Quantity') ? 'brand' : 'slate');

    const columns = [
        { key: 'name', label: tt('Product'), sortable: true, get: (r) => r.name || '',
          render: (r) => {
              const qty = r.quantity || 0;
              return (
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-ink">{r.name}</span>
                        {qty <= 0 && <span className="shrink-0 rounded-[12px] bg-rose-50 px-2 text-2xs font-bold uppercase text-rose-600">Out</span>}
                        {qty > 0 && qty <= 15 && <span className="shrink-0 rounded-[12px] bg-amber-50 px-2 text-2xs font-bold uppercase text-amber-600">Low</span>}
                    </div>
                    <div className="truncate font-mono text-xs text-ink-muted">{r.sku} · {r.category}</div>
                </div>);
          } },
        { key: 'quantity', label: 'Qty', align: 'right', sortable: true, get: (r) => r.quantity || 0, render: (r) => <span className="font-mono font-semibold text-ink-secondary">{r.quantity || 0}</span> },
        { key: 'unit_cost', label: 'Unit Cost', align: 'right', sortable: true, get: (r) => Number(r.unit_cost) || 0, render: (r) => <span className="font-mono text-ink-muted">{formatCurrency(r.unit_cost, store)}</span> },
        { key: 'stock_value', label: 'Value', align: 'right', sortable: true, get: (r) => r.stock_value || 0, render: (r) => <span className="font-mono font-bold text-ink">{formatCurrency(r.stock_value, store)}</span> },
    ];

    const miniTh = 'px-3 py-2 text-xs font-bold uppercase text-ink-muted';

    return (
        <ReportShell
            title="Point-In-Time Inventory"
            subtitle="Historical inventory ledger valuation and snapshot"
            activeKey="point-in-time-inventory"
            exportConfig={{ filename: `inventory_as_of_${asOfDate}`, rows: filtered, columns: [
                { label: 'Product', get: (r) => r.name }, { label: 'SKU', get: (r) => r.sku }, { label: 'Category', get: (r) => r.category },
                { label: 'Quantity', get: (r) => r.quantity || 0 }, { label: 'Unit Cost', get: (r) => r.unit_cost }, { label: 'Stock Value', get: (r) => r.stock_value || 0 },
            ] }}
            filters={(
                <div className="flex flex-wrap items-center gap-2">
                    <Calendar size={16} className="text-ink-muted" />
                    <input type="date" value={asOfDate} max={today} onChange={(e) => setAsOfDate(e.target.value)} className={filterInputCls} aria-label="As of date" />
                    <Clock size={16} className="text-ink-muted" />
                    <input type="time" value={asOfTime} onChange={(e) => setAsOfTime(e.target.value)} className={`${filterInputCls} w-28`} aria-label="As of time" />
                    {asOfTime && <button type="button" onClick={() => setAsOfTime('')} className="h-10 rounded-[12px] px-3 text-sm font-semibold text-ink-secondary hover:bg-interactive-hover">Clear time</button>}
                    <button type="button" onClick={applyDate} className="h-10 rounded-[12px] bg-brand-600 px-4 text-sm font-bold text-white transition-colors hover:bg-brand-700">Reconstruct</button>
                    <FilterSelect label="Stock" value={statusFilter} onChange={setStatusFilter}
                        options={[{ value: 'all', label: tt('All Products') }, { value: 'out', label: 'Out of Stock' }, { value: 'low', label: 'Low Stock (≤15)' }, { value: 'healthy', label: 'Healthy (16-200)' }, { value: 'over', label: 'Overstocked (>200)' }]} />
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-3 text-ink-muted" size={16} />
                        <input type="text" placeholder="Search snapshot..." value={search} onChange={(e) => setSearch(e.target.value)} className={`${filterInputCls} w-56 pl-9`} />
                    </div>
                </div>
            )}
        >
            {meta.note && (
                <div className="flex shrink-0 items-start gap-2 rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                    <Info size={16} className="mt-0.5 shrink-0" /><span className="leading-relaxed">{meta.note}</span>
                </div>
            )}
            <ReportKpis items={stats.map((s) => ({ label: s.label, value: s.value, icon: statIcon(s.label), tone: statTone(s.label) }))} />
            <ReportGrid>
                <ReportCol span={4}>
                    <ReportSection title="Value by category" subtitle="Share of snapshot value" icon={PieIcon}>
                        <DonutChart slices={pieData} unit="currency" height={260} />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={4}>
                    <ReportSection title="Top value items" subtitle="Largest capital at that moment" icon={Trophy} tone="amber">
                        <RankBars items={topItems} unit="currency" />
                    </ReportSection>
                </ReportCol>
                <ReportCol span={4}>
                    <ReportSection title="Stock intelligence" subtitle="Snapshot health check" icon={Zap} tone="emerald"
                        right={<button type="button" onClick={runInventoryAudit} disabled={isAuditing} className="h-10 rounded-[12px] bg-emerald-600 px-4 text-sm font-bold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50">{isAuditing ? 'Auditing...' : 'Run audit'}</button>}>
                        {auditResult ? (
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between rounded-[12px] border border-line bg-app p-3">
                                    <div><span className="block text-xs font-bold uppercase text-ink-muted">Health score</span><span className="text-2xl font-bold text-emerald-600">{auditResult.score}/100</span></div>
                                    {auditResult.score >= 80 ? <ShieldCheck className="text-emerald-500" size={32} /> : <AlertTriangle className="text-amber-500" size={32} />}
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                    <div className="rounded-[12px] bg-app p-2"><span className="block text-sm font-bold text-rose-600">{auditResult.outOfStockCount}</span>Out</div>
                                    <div className="rounded-[12px] bg-app p-2"><span className="block text-sm font-bold text-amber-600">{auditResult.lowStockCount}</span>Low</div>
                                    <div className="rounded-[12px] bg-app p-2"><span className="block text-sm font-bold text-blue-600">{auditResult.overstockedCount}</span>Over</div>
                                </div>
                                <p className="text-xs leading-relaxed text-ink-muted">Estimated carrying cost of overstock: <strong className="text-ink">{formatCurrency(auditResult.potentialBleed, store)} / yr</strong>.</p>
                            </div>
                        ) : (
                            <p className="text-sm leading-relaxed text-ink-muted">Stock value is rebuilt from the full movement ledger in FIFO order to the exact moment selected. Run the audit to score this snapshot for stock-outs and overstock.</p>
                        )}
                    </ReportSection>
                </ReportCol>
            </ReportGrid>
            <ReportSection title="Inventory snapshot" subtitle={`${filtered.length} products · click a row for the ledger`} icon={Table2} flush>
                <ReportTable columns={columns} rows={filtered} rowKey={(r) => r.product_id ?? r.sku} onRowClick={handleSelectItem}
                    totals={{ name: 'Total', quantity: filtered.reduce((s, r) => s + (r.quantity || 0), 0), stock_value: formatCurrency(filtered.reduce((s, r) => s + (r.stock_value || 0), 0), store) }}
                    empty="No inventory matches search criteria." />
            </ReportSection>

            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-sm">
                    <div className="flex max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-[14px] border border-line bg-surface shadow-2xl">
                        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3">
                            <div className="min-w-0">
                                <span className="text-xs font-bold uppercase tracking-wide text-ink-muted">Snapshot {asOfDate} {asOfTime || '23:59:59'}</span>
                                <h2 className="truncate text-lg font-bold text-ink">{selectedItem.name}</h2>
                                <p className="text-xs text-ink-muted">SKU {selectedItem.sku || 'N/A'} · {selectedItem.category || 'N/A'}</p>
                            </div>
                            <button type="button" onClick={() => handleSelectItem(null)} className="flex h-10 w-10 items-center justify-center rounded-[12px] text-ink-muted hover:bg-interactive-hover" aria-label="Close"><X size={18} /></button>
                        </div>
                        <div className="flex flex-col gap-2 overflow-y-auto p-4 text-sm">
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {[['Stock Quantity', selectedItem.quantity, ''], ['Unit Valuation Cost', formatCurrency(selectedItem.unit_cost, store), ''], ['Valuation Basis', 'FIFO cost', 'text-brand-600'], ['Total Stock Value', formatCurrency(selectedItem.stock_value, store), 'text-emerald-600']].map(([l, v, c]) => (
                                    <div key={l} className="rounded-[12px] border border-line bg-app p-3"><p className="text-xs font-bold uppercase text-ink-muted">{l}</p><p className={`mt-1 text-lg font-bold text-ink ${c}`}>{v}</p></div>
                                ))}
                            </div>
                            {isLoadingDetails ? (
                                <div className="py-16 text-center text-xs font-bold uppercase tracking-widest text-ink-muted">Querying ledger...</div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                    <div>
                                        <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-ink-muted"><Layers size={14} /> Active FIFO cost layers</h4>
                                        {modalDetails.batches.length === 0 ? (
                                            <div className="rounded-[12px] border border-dashed border-line bg-app p-6 text-center italic text-ink-muted">No cost layers, item is out of stock.</div>
                                        ) : (
                                            <div className="overflow-hidden rounded-[12px] border border-line"><table className="w-full text-left text-xs">
                                                <thead className="border-b border-line bg-app"><tr><th className={miniTh}>Batch</th><th className={`${miniTh} text-right`}>Cost</th><th className={`${miniTh} text-right`}>Left</th><th className={`${miniTh} text-right`}>Value</th></tr></thead>
                                                <tbody className="divide-y divide-line">{modalDetails.batches.map((b, i) => (
                                                    <tr key={i} className="h-12"><td className="px-3 font-semibold text-ink-secondary">{b.id}<span className="block font-mono text-2xs text-ink-muted">Inwarded {b.date}</span></td>
                                                        <td className="px-3 text-right font-mono">{formatCurrency(b.cost, store)}</td>
                                                        <td className="px-3 text-right font-mono">{b.qtyLeft} <span className="text-ink-muted">/ {b.receivedQty}</span></td>
                                                        <td className="px-3 text-right font-mono font-bold">{formatCurrency(b.qtyLeft * b.cost, store)}</td></tr>
                                                ))}</tbody></table></div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-ink-muted"><Activity size={14} /> Reconstruction audit trail</h4>
                                        {modalDetails.ledger.length === 0 ? (
                                            <div className="rounded-[12px] border border-dashed border-line bg-app p-6 text-center italic text-ink-muted">No stock movement ledger transactions found.</div>
                                        ) : (
                                            <div className="overflow-hidden rounded-[12px] border border-line"><table className="w-full text-left text-xs">
                                                <thead className="border-b border-line bg-app"><tr><th className={miniTh}>Date</th><th className={miniTh}>Transaction</th><th className={miniTh}>Ref</th><th className={`${miniTh} text-right`}>Delta</th></tr></thead>
                                                <tbody className="divide-y divide-line">{modalDetails.ledger.map((l, i) => (
                                                    <tr key={i} className="h-12"><td className="px-3 font-mono text-ink-muted">{l.date}</td>
                                                        <td className="px-3 font-semibold text-ink-secondary">{l.type}<span className="block text-2xs font-normal text-ink-muted">by {l.user}</span></td>
                                                        <td className="px-3 font-mono text-ink-muted">{l.ref}</td>
                                                        <td className={`px-3 text-right font-mono font-bold ${String(l.qty).startsWith('+') ? 'text-emerald-600' : 'text-rose-500'}`}>{l.qty}</td></tr>
                                                ))}</tbody></table></div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex shrink-0 justify-end border-t border-line bg-app p-3">
                            <button type="button" onClick={() => handleSelectItem(null)} className="h-10 rounded-[12px] bg-neutral-800 px-5 text-sm font-bold text-white hover:bg-neutral-700">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </ReportShell>
    );
}
