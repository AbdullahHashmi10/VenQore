import React, { useState, useMemo } from 'react';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import { Head, Link, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import MoneyModuleTabs, { useMoneyNavGroups } from '@/Components/MoneyModuleTabs';
import { ListPageFrame, ListToolbar, ListStatCards } from '@/Components/ListShell';
import PrintService from '@/Utils/PrintService';
import { exportRowsToCsv, canExportCsv } from '@/lib/exportCsv';
import {
    Search,
    Download,
    Phone,
    TrendingDown,
    FileText,
    Users,
    ChevronUp,
    ChevronDown,
    Printer,
    ArrowUpRight,
    CreditCard,
    DollarSign,
    Mail, TrendingUp, ArrowDownLeft } from 'lucide-react';
import { useTermText } from '@/lib/terms';
import MobileStats from '@/Components/MobileStats';
import MobileListHeader from '@/Components/MobileListHeader';

export default function Payables({ parties = [] }) {
    const { store } = usePage().props;
    const tt = useTermText();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'balance', direction: 'desc' });

    // Mobile responsiveness toggle states
    const [isStatsExpanded, setIsStatsExpanded] = useState(false);
    const [showMobileSearch, setShowMobileSearch] = useState(false);

    // Calculate Stats
    const stats = useMemo(() => {
        const totalPayable = parties.reduce((sum, p) => sum + (Math.abs(parseFloat(p.balance ?? p.current_balance ?? 0)) || 0), 0);
        const totalParties = parties.length;
        const avgPayable = totalParties > 0 ? totalPayable / totalParties : 0;
        const largestCreditor = parties.reduce((max, p) => (Math.abs(parseFloat(p.balance ?? p.current_balance ?? 0)) > Math.abs(parseFloat(max.balance ?? max.current_balance ?? 0)) ? p : max), {});

        return {
            totalPayable,
            totalParties,
            avgPayable,
            largestCreditor
        };
    }, [parties]);

    const handleExportCsv = () => exportRowsToCsv('payables', [
        { label: 'Name', get: (p) => p.name },
        { label: 'Phone', get: (p) => p.phone },
        { label: 'Email', get: (p) => p.email },
        { label: 'Balance', get: (p) => p.balance ?? p.current_balance },
    ], filteredParties);

    // Sort and Filter Data
    const filteredParties = useMemo(() => {
        let result = parties.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.phone && p.phone.includes(searchTerm))
        );

        result.sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];

            if (sortConfig.key === 'balance') {
                valA = Math.abs(parseFloat(a.balance ?? a.current_balance ?? 0));
                valB = Math.abs(parseFloat(b.balance ?? b.current_balance ?? 0));
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [parties, searchTerm, sortConfig]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const navGroups = useMoneyNavGroups();

    return (
        <OneGlanceLayout title="Accounts Payable" activeMenu="Money" noPadding>
            <Head title="Payables" />

            <div className="flex flex-col h-full bg-app p-3.5 gap-1 overflow-hidden md:contents">
              <ListPageFrame className="max-md:contents">
                {/* ── Desktop header: two rows ── */}
                <ListToolbar
                    title="Accounts Payable"
                    navGroups={navGroups}
                    activeId="payables"
                    search={{ value: searchTerm, onChange: setSearchTerm, placeholder: tt('Search suppliers...') }}
                    actions={(
                        <>
                            <button style={canExportCsv() ? undefined : { display: 'none' }} type="button" onClick={handleExportCsv} className="h-10 w-10 flex items-center justify-center rounded-[12px] border border-line bg-app text-emerald-600 hover:bg-interactive-hover" title="Export"><Download size={16} /></button>
                            <button type="button" onClick={() => PrintService.printPage()} className="h-10 w-10 flex items-center justify-center rounded-[12px] border border-line bg-app text-ink-muted hover:text-ink hover:bg-interactive-hover" title="Print"><Printer size={16} /></button>
                        </>
                    )}
                />
                <ListStatCards cards={[
                    { label: 'Total Payable', value: formatCurrency(stats.totalPayable, store), icon: DollarSign, icon_tone: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400', value_tone: 'text-red-600' },
                    { label: 'Active Creditors', value: stats.totalParties, icon: Users },
                    { label: 'Avg Balance', value: formatCurrency(stats.avgPayable, store), icon: TrendingDown, icon_tone: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', value_tone: 'text-blue-600' },
                    { label: 'Highest Creditor', value: formatCurrency(parseFloat(stats.largestCreditor.balance ?? stats.largestCreditor.current_balance ?? 0), store), icon: TrendingDown, icon_tone: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400', value_tone: 'text-rose-600' },
                ]} />

                {/* Phone / existing header (hidden on md+) */}
                <div className="contents md:hidden">
                <MoneyModuleTabs activeTab="payables" />

                {/* PHONE header (Inventory pattern) */}
                <MobileListHeader
                    title="Accounts Payable"
                    search={{ event: true,  value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), placeholder: tt('Search suppliers...') }}
                    actions={[{ icon: Printer, label: 'Print', onClick: () => PrintService.printPage() }]}
                />
                <MobileStats bp="md" hero={0} items={[
                    { label: 'Total Payable', value: formatCurrency(stats.totalPayable, store), tone: 'red', icon: TrendingDown },
                    { label: 'Active Creditors', value: stats.totalParties, tone: 'brand', icon: Users },
                    { label: 'Avg Balance', value: formatCurrency(stats.avgPayable, store), tone: 'blue', icon: DollarSign },
                    { label: 'Highest Creditor', value: formatCurrency(parseFloat(stats.largestCreditor.balance ?? stats.largestCreditor.current_balance ?? 0), store), tone: 'rose', icon: ArrowUpRight }
                ]} />


                </div>

                {/* Main Table (Desktop only) */}
                <div className="hidden sm:block flex-1 min-h-0 overflow-auto rounded-xl md:rounded-[14px] border border-line shadow-sm bg-surface">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-app border-b border-line sticky top-0 z-10">
                                <th
                                    className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider cursor-pointer hover:bg-interactive-hover dark:hover:bg-interactive-hover"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center gap-1">
                                        {tt('Supplier')} {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                                    </div>
                                </th>
                                <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider">Contact</th>
                                <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center">Since</th>
                                <th
                                    className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-right cursor-pointer hover:bg-interactive-hover dark:hover:bg-interactive-hover"
                                    onClick={() => handleSort('balance')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Payable {sortConfig.key === 'balance' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                                    </div>
                                </th>
                                <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {filteredParties.length > 0 ? (
                                filteredParties.map((party) => (
                                    <tr key={party.id} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors group">
                                        <td className="p-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold text-sm">
                                                    {party.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-ink">{party.name}</p>
                                                    <p className="text-2xs text-ink-muted">{tt('Supplier')}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1.5 text-ink-secondary text-xs">
                                                    <Phone size={12} /> {party.phone || '-'}
                                                </div>
                                                {party.email && (
                                                    <div className="flex items-center gap-1.5 text-ink-muted text-2xs">
                                                        <Mail size={10} /> {party.email}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 text-center">
                                            <p className="text-xs text-ink-muted">{new Date(party.updated_at || party.created_at).toLocaleDateString()}</p>
                                        </td>
                                        <td className="p-3 text-right">
                                            <p className="font-mono font-bold text-rose-600 dark:text-rose-400">{formatCurrency(party.balance ?? party.current_balance ?? 0, store)}</p>
                                        </td>
                                        <td className="p-3 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity">
                                                <Link
                                                    href={route('store.payments.out', { store_slug: store?.slug, party_id: party.id })}
                                                    className="p-1.5 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors flex items-center justify-center"
                                                    title="Record Payment"
                                                >
                                                    <CreditCard size={14} />
                                                </Link>
                                                <Link
                                                    href={route('store.parties.ledger', { store_slug: store?.slug, party: party.id })}
                                                    className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                                                    title="View Ledger"
                                                >
                                                    <FileText size={14} /> Ledger
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-5 sm:p-12 text-center text-ink-muted">
                                        <div className="flex flex-col items-center gap-2">
                                            <TrendingDown size={32} className="opacity-20" />
                                            <p className="text-sm font-medium">No pending payables found</p>
                                            <p className="text-xs text-ink-muted">{tt('Excellent! All suppliers are paid.')}</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card List (Mobile only) */}
                <div className="block sm:hidden flex-1 overflow-auto space-y-1.5">
                    {filteredParties.length > 0 ? (
                        filteredParties.map((party) => (
                            <div key={party.id} className="bg-surface p-3 rounded-xl border border-line shadow-sm flex flex-col gap-2">
                                <div className="flex flex-wrap items-center justify-between gap-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold text-sm">
                                            {party.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-ink leading-tight">{party.name}</p>
                                            <p className="text-2xs text-ink-muted mt-0.5">Since: {new Date(party.updated_at || party.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <p className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400">
                                        {formatCurrency(parseFloat(party.balance ?? party.current_balance ?? 0), store)}
                                    </p>
                                </div>
                                
                                <div className="flex flex-wrap items-center justify-between gap-y-2 border-t border-line pt-2 mt-1">
                                    <div className="flex flex-col text-2xs text-ink-muted">
                                        {party.phone && <span className="font-medium text-ink-secondary">📞 {party.phone}</span>}
                                        {party.email && <span className="truncate max-w-[150px]">✉️ {party.email}</span>}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Link
                                            href={route('store.payments.out', { store_slug: store?.slug, party_id: party.id })}
                                            className="p-1.5 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors flex items-center justify-center"
                                            title="Record Payment"
                                        >
                                            <CreditCard size={14} />
                                        </Link>
                                        <Link
                                            href={route('store.parties.ledger', { store_slug: store?.slug, party: party.id })}
                                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                                            title="View Ledger"
                                        >
                                            <FileText size={14} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-5 sm:p-12 text-center text-ink-muted bg-surface rounded-xl border border-line shadow-sm">
                            <div className="flex flex-col items-center gap-2">
                                <TrendingDown size={32} className="opacity-20" />
                                <p className="text-sm font-medium">No pending payables found</p>
                                <p className="text-xs text-ink-muted">{tt('Excellent! All suppliers are paid.')}</p>
                            </div>
                        </div>
                    )}
                </div>
              </ListPageFrame>
            </div>
        </OneGlanceLayout>
    );
}
