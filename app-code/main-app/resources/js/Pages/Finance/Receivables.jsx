import React, { useState, useMemo } from 'react';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import { Head, Link, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import MoneyModuleTabs, { useMoneyNavGroups } from '@/Components/MoneyModuleTabs';
import { ListPageFrame, ListToolbar, ListStatCards } from '@/Components/ListShell';
import PrintService from '@/Utils/PrintService';
import { exportRowsToCsv, canExportCsv } from '@/lib/exportCsv';
import {
    ArrowLeft,
    Search,
    Filter,
    Download,
    MessageCircle,
    Phone,
    Mail,
    ArrowDownLeft,
    TrendingUp,
    TrendingDown,
    FileText,
    Users,
    ChevronUp,
    ChevronDown,
    Printer,
    DollarSign,
    Calendar,
    CreditCard, ArrowUpRight } from 'lucide-react';
import { useTermText } from '@/lib/terms';
import MobileStats from '@/Components/MobileStats';
import MobileListHeader from '@/Components/MobileListHeader';

export default function Receivables({ parties = [] }) {
    const { store } = usePage().props;
    const tt = useTermText();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'balance', direction: 'desc' });

    // Mobile responsiveness toggle states
    const [isStatsExpanded, setIsStatsExpanded] = useState(false);
    const [showMobileSearch, setShowMobileSearch] = useState(false);

    // Calculate Stats
    const stats = useMemo(() => {
        const totalReceivable = parties.reduce((sum, p) => sum + (parseFloat(p.balance ?? p.current_balance) || 0), 0);
        const totalParties = parties.length;
        const avgReceivable = totalParties > 0 ? totalReceivable / totalParties : 0;

        return {
            totalReceivable,
            totalParties,
            avgReceivable,
            largestDebtor: parties.reduce((max, p) => (parseFloat(p.balance ?? p.current_balance ?? 0) > parseFloat(max.balance ?? max.current_balance ?? 0) ? p : max), {})
        };
    }, [parties]);

    const handleExportCsv = () => exportRowsToCsv('receivables', [
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
                valA = parseFloat(a.balance ?? a.current_balance ?? 0);
                valB = parseFloat(b.balance ?? b.current_balance ?? 0);
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
        <OneGlanceLayout title="Accounts Receivable" activeMenu="Money" noPadding>
            <Head title="Receivables" />

            <div className="flex flex-col h-full bg-app p-3.5 gap-1 overflow-hidden md:contents">
              <ListPageFrame className="max-md:contents">
                {/* ── Desktop header: two rows ── */}
                <ListToolbar
                    title="Accounts Receivable"
                    navGroups={navGroups}
                    activeId="receivables"
                    search={{ value: searchTerm, onChange: setSearchTerm, placeholder: tt('Search customers...') }}
                    actions={(
                        <>
                            <button style={canExportCsv() ? undefined : { display: 'none' }} type="button" onClick={handleExportCsv} className="h-10 w-10 flex items-center justify-center rounded-[12px] border border-line bg-app text-emerald-600 hover:bg-interactive-hover" title="Export"><Download size={16} /></button>
                            <button type="button" onClick={() => PrintService.printPage()} className="h-10 w-10 flex items-center justify-center rounded-[12px] border border-line bg-app text-ink-muted hover:text-ink hover:bg-interactive-hover" title="Print"><Printer size={16} /></button>
                        </>
                    )}
                />
                <ListStatCards cards={[
                    { label: 'Total Receivable', value: formatCurrency(stats.totalReceivable, store), icon: DollarSign, icon_tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', value_tone: 'text-emerald-600' },
                    { label: 'Active Debtors', value: stats.totalParties, icon: Users },
                    { label: 'Avg Balance', value: formatCurrency(stats.avgReceivable, store), icon: TrendingUp, icon_tone: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', value_tone: 'text-blue-600' },
                    { label: 'Highest Balance', value: formatCurrency(parseFloat(stats.largestDebtor.balance ?? stats.largestDebtor.current_balance ?? 0), store), icon: TrendingUp, icon_tone: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400', value_tone: 'text-red-600' },
                ]} />

                {/* Phone / existing header (hidden on md+) */}
                <div className="contents md:hidden">
                <MoneyModuleTabs activeTab="receivables" />

                {/* PHONE header (Inventory pattern) */}
                <MobileListHeader
                    title="Accounts Receivable"
                    search={{ event: true,  value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), placeholder: tt('Search customers...') }}
                    actions={[{ icon: Printer, label: 'Print', onClick: () => PrintService.printPage() }]}
                />
                <MobileStats bp="md" hero={0} items={[
                    { label: 'Total Receivable', value: formatCurrency(stats.totalReceivable, store), tone: 'emerald', icon: TrendingUp },
                    { label: 'Active Debtors', value: stats.totalParties, tone: 'brand', icon: Users },
                    { label: 'Avg Balance', value: formatCurrency(stats.avgReceivable, store), tone: 'blue', icon: DollarSign },
                    { label: 'Highest Balance', value: formatCurrency(parseFloat(stats.largestDebtor.balance ?? stats.largestDebtor.current_balance ?? 0), store), tone: 'red', icon: ArrowDownLeft }
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
                                        {tt('Customer')} {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                                    </div>
                                </th>
                                <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider">Contact</th>
                                <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center">Last Active</th>
                                <th
                                    className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-right cursor-pointer hover:bg-interactive-hover dark:hover:bg-interactive-hover"
                                    onClick={() => handleSort('balance')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Receivable {sortConfig.key === 'balance' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
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
                                                <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-sm">
                                                    {party.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-ink">{party.name}</p>
                                                    <p className="text-2xs text-ink-muted">{tt('Customer')}</p>
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
                                            <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(parseFloat(party.balance ?? party.current_balance ?? 0), store)}</p>
                                        </td>
                                        <td className="p-3 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity">
                                                <a
                                                    href={`https://wa.me/${(party.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Dear ${party.name}, gentle reminder from ${store?.name || 'our store'}. Your outstanding balance is ${formatCurrency(parseFloat(party.balance ?? party.current_balance ?? 0), store)}. Thank you.`)}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                                    title="Send Payment Reminder via WhatsApp"
                                                >
                                                    <MessageCircle size={14} />
                                                </a>
                                                <a href={`tel:${party.phone}`} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Call">
                                                    <Phone size={14} />
                                                </a>
                                                <Link
                                                    href={route('store.payments.in', { store_slug: store?.slug, party_id: party.id })}
                                                    className="p-1.5 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors flex items-center justify-center"
                                                    title="Record Payment"
                                                >
                                                    <CreditCard size={14} />
                                                </Link>
                                                <Link
                                                    href={route('store.parties.ledger', { store_slug: store?.slug, party: party.id })}
                                                    className="p-1.5 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
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
                                            <TrendingUp size={32} className="opacity-20" />
                                            <p className="text-sm font-medium">No pending receivables found</p>
                                            <p className="text-xs text-ink-muted">{tt('Good job! All customers are paid up.')}</p>
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
                                        <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-sm">
                                            {party.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-ink leading-tight">{party.name}</p>
                                            <p className="text-2xs text-ink-muted mt-0.5">Last Active: {new Date(party.updated_at || party.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <p className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(parseFloat(party.balance ?? party.current_balance ?? 0), store)}
                                    </p>
                                </div>
                                
                                <div className="flex flex-wrap items-center justify-between gap-y-2 border-t border-line pt-2 mt-1">
                                    <div className="flex flex-col text-2xs text-ink-muted">
                                        {party.phone && <span className="font-medium text-ink-secondary">📞 {party.phone}</span>}
                                        {party.email && <span className="truncate max-w-[150px]">✉️ {party.email}</span>}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {party.phone && (
                                            <>
                                                <a
                                                    href={`https://wa.me/${(party.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Dear ${party.name}, gentle reminder from ${store?.name || 'our store'}. Your outstanding balance is ${formatCurrency(parseFloat(party.balance ?? party.current_balance ?? 0), store)}. Thank you.`)}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                                    title="Send Payment Reminder via WhatsApp"
                                                >
                                                    <MessageCircle size={14} />
                                                </a>
                                                <a href={`tel:${party.phone}`} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Call">
                                                    <Phone size={14} />
                                                </a>
                                            </>
                                        )}
                                        <Link
                                            href={route('store.payments.in', { store_slug: store?.slug, party_id: party.id })}
                                            className="p-1.5 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors flex items-center justify-center"
                                            title="Record Payment"
                                        >
                                            <CreditCard size={14} />
                                        </Link>
                                        <Link
                                            href={route('store.parties.ledger', { store_slug: store?.slug, party: party.id })}
                                            className="p-1.5 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
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
                                <TrendingUp size={32} className="opacity-20" />
                                <p className="text-sm font-medium">No pending receivables found</p>
                                <p className="text-xs text-ink-muted">{tt('Good job! All customers are paid up.')}</p>
                            </div>
                        </div>
                    )}
                </div>
              </ListPageFrame>
            </div>
        </OneGlanceLayout>
    );
}
