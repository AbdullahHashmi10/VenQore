import React, { useState, useMemo } from 'react';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import { Head, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import ContactsModuleTabs, { useContactsNavGroups } from '@/Components/ContactsModuleTabs';
import { ListPageFrame, ListToolbar, ListAddButton, ListStatCards } from '@/Components/ListShell';
import ListFilterPill from '@/Components/ListFilterPill';
import PrintService from '@/Utils/PrintService';
import { exportRowsToCsv, canExportCsv } from '@/lib/exportCsv';
import {
    FileText,
    ArrowDownCircle,
    ArrowUpCircle,
    TrendingUp,
    TrendingDown,
    Wallet,
    Calendar,
    Download,
    Printer,
    Search,
    ChevronUp,
    ChevronDown,
    Filter,
    MessageCircle, Layers, DollarSign } from 'lucide-react';
import WhatsAppShareModal from '@/Components/WhatsAppShareModal';
import MobileStats from '@/Components/MobileStats';
import MobileListHeader from '@/Components/MobileListHeader';

export default function PartyLedger({ party = {}, transactions = [], stats = {} }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [transactionType, setTransactionType] = useState('all');
    const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

    // Mobile responsiveness toggle states
    const [isStatsExpanded, setIsStatsExpanded] = useState(false);
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Format currency
    const { store } = usePage().props;
    const contactsNavGroups = useContactsNavGroups();
    const isOverdue = party.type === 'customer' && party.credit_limit && parseFloat(party.current_balance || 0) > parseFloat(party.credit_limit);


    const getTypeStyle = (type) => {
        const types = {
            sale: { label: 'Sale', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: TrendingUp },
            purchase: { label: 'Purchase', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: TrendingDown },
            payment_in: { label: 'Received', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: ArrowDownCircle },
            payment_out: { label: 'Paid', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: ArrowUpCircle },
            opening: { label: 'Opening', color: 'bg-neutral-100 text-ink-secondary dark:bg-surface dark:text-ink-muted', icon: Wallet },
            return: { label: 'Return', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: ArrowUpCircle },
        };
        return types[type] || types.opening;
    };

    const handleExportCsv = () => exportRowsToCsv('ledger-' + (party?.name || 'party'), [
        { label: 'Date', get: (t) => t.date },
        { label: 'Type', get: (t) => t.type },
        { label: 'Reference', get: (t) => t.reference },
        { label: 'Description', get: (t) => t.description },
        { label: 'Debit', get: (t) => t.debit },
        { label: 'Credit', get: (t) => t.credit },
        { label: 'Balance', get: (t) => t.balance },
    ], filteredTransactions);

    // Filter transactions
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const matchesSearch = !searchTerm ||
                t.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.description?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesType = transactionType === 'all' || t.type === transactionType;

            // Basic date filter (can be enhanced)
            const matchesDate = (!dateRange.start || t.date >= dateRange.start) &&
                (!dateRange.end || t.date <= dateRange.end);

            return matchesSearch && matchesType && matchesDate;
        });
    }, [transactions, searchTerm, transactionType, dateRange]);

    return (
        <OneGlanceLayout title={`Ledger - ${party.name}`} activeMenu="Contacts" noPadding>
            <Head title={`Ledger - ${party.name}`} />

            <div className="max-md:p-1.5 max-md:h-full md:contents">
            <ListPageFrame className="max-md:flex max-md:flex-col max-md:h-full max-md:bg-app max-md:p-2 max-md:gap-1 max-md:overflow-hidden">
                <ListToolbar
                    title={`${party.name} Ledger`}
                    navGroups={contactsNavGroups}
                    activeId="ledgers"
                    left={<ListFilterPill icon={Layers} label="All Types" value={transactionType} onChange={setTransactionType} options={[
                        { value: 'all', label: 'All Types' }, { value: 'sale', label: 'Sales' }, { value: 'purchase', label: 'Purchases' }, { value: 'payment_in', label: 'Received' }, { value: 'payment_out', label: 'Paid' },
                    ]} />}
                    search={{ value: searchTerm, onChange: setSearchTerm, placeholder: 'Search Ref or Desc...' }}
                    actions={<>
                        <button style={canExportCsv() ? undefined : { display: 'none' }} type="button" onClick={handleExportCsv} className="h-10 w-10 rounded-[12px] border border-line bg-app text-emerald-600 hover:bg-interactive-hover flex items-center justify-center transition-colors" title="Export"><Download size={16} /></button>
                        <button type="button" onClick={() => PrintService.printPage()} className="h-10 w-10 rounded-[12px] border border-line bg-app text-ink-muted hover:text-ink hover:bg-interactive-hover flex items-center justify-center transition-colors" title="Print"><Printer size={16} /></button>
                        <ListAddButton icon={MessageCircle} onClick={() => setShowWhatsAppModal(true)} title="Share Statement on WhatsApp">Share Statement</ListAddButton>
                    </>}
                />
                <ListStatCards cards={[
                    { label: 'Opening', value: formatCurrency(stats.opening_balance, store), icon: Wallet, icon_tone: 'bg-sunken text-ink-secondary' },
                    { label: 'Credits', value: formatCurrency(stats.total_credit, store), icon: ArrowDownCircle, icon_tone: 'bg-emerald-50 text-emerald-600', value_tone: 'text-emerald-600' },
                    { label: 'Debits', value: formatCurrency(stats.total_debit, store), icon: ArrowUpCircle, icon_tone: 'bg-red-50 text-red-600', value_tone: 'text-red-600' },
                    { label: 'Net Balance', value: formatCurrency(Math.abs(stats.final_balance || 0), store), icon: TrendingUp, value_tone: stats.final_balance > 0 ? 'text-emerald-600' : (stats.final_balance < 0 ? 'text-red-600' : 'text-ink-muted') },
                ]} />
                <div className="md:hidden"><ContactsModuleTabs activeTab="ledgers" /></div>

                {isOverdue && (
                    <div className="bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50 p-3 rounded-xl flex flex-wrap items-center justify-between gap-y-2 shrink-0 mb-1">
                        <div className="flex items-center gap-2 text-rose-800 dark:text-rose-400">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                            <span className="text-xs font-bold uppercase">Credit Limit Exceeded: {formatCurrency(party.current_balance, store)} / Limit: {formatCurrency(party.credit_limit, store)}</span>
                        </div>
                    </div>
                )}

                {/* PHONE header (Inventory pattern) */}
                <MobileListHeader
                    title={party.name}
                    filters={[{ key: 'type', icon: Layers, label: 'Transaction type', value: transactionType, onChange: setTransactionType, options: [
                        { id: 'all', label: 'All Types' }, { id: 'sale', label: 'Sales' }, { id: 'purchase', label: 'Purchases' }, { id: 'payment_in', label: 'Received' }, { id: 'payment_out', label: 'Paid' }
                    ] }]}
                    search={{ event: true,  value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), placeholder: 'Search Ref or Desc...' }}
                    actions={[
                        { icon: MessageCircle, label: 'Share on WhatsApp', onClick: () => setShowWhatsAppModal(true) },
                        { icon: Printer, label: 'Print', onClick: () => PrintService.printPage() }
                    ]}
                />
                <MobileStats bp="md" hero={2} items={[
                    { label: 'Opening', value: formatCurrency(stats.opening_balance, store), tone: 'ink', icon: Wallet },
                    { label: 'Credits', value: formatCurrency(stats.total_credit, store), tone: 'emerald', icon: TrendingUp },
                    { label: 'Debits', value: formatCurrency(stats.total_debit, store), tone: 'red', icon: TrendingDown },
                    { label: 'Net Balance', value: formatCurrency(Math.abs(stats.final_balance || 0), store), tone: (stats.final_balance || 0) > 0 ? 'emerald' : ((stats.final_balance || 0) < 0 ? 'red' : 'ink'), icon: DollarSign }
                ]} />


                {/* Ledger Content Area */}
                <div className="flex-1 min-h-0 overflow-auto rounded-xl md:rounded-[14px] border border-line shadow-sm bg-surface">
                    
                    {/* Desktop Table View */}
                    <div className="hidden sm:block">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-app border-b border-line sticky top-0 z-10">
                                    <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider">Date</th>
                                    <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-center">Type</th>
                                    <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider">Reference</th>
                                    <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-right">You Gave</th>
                                    <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-right">You Received</th>
                                    <th className="sticky top-0 z-10 bg-app p-3 text-2xs font-bold text-ink-muted uppercase tracking-wider text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {filteredTransactions.length > 0 ? (
                                    filteredTransactions.map((t, index) => {
                                        const typeStyle = getTypeStyle(t.type);
                                        const TypeIcon = typeStyle.icon;

                                        return (
                                            <tr key={index} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors">
                                                <td className="p-3 text-xs font-medium text-ink-secondary whitespace-nowrap">
                                                    {new Date(t.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold uppercase ${typeStyle.color}`}>
                                                        <TypeIcon size={10} />
                                                        {typeStyle.label}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <p className="text-xs font-bold text-ink hover:text-brand-600 transition-colors cursor-pointer">{t.reference || '-'}</p>
                                                    {t.description && <p className="text-2xs text-ink-muted truncate max-w-[200px]">{t.description}</p>}
                                                </td>
                                                <td className="p-3 text-right">
                                                    {t.debit > 0 ? (
                                                        <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400">{formatCurrency(t.debit, store)}</span>
                                                    ) : <span className="text-neutral-300">-</span>}
                                                </td>
                                                <td className="p-3 text-right">
                                                    {t.credit > 0 ? (
                                                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(t.credit, store)}</span>
                                                    ) : <span className="text-neutral-300">-</span>}
                                                </td>
                                                <td className="p-3 text-right">
                                                    <span className={`text-xs font-mono font-bold ${t.balance > 0 ? 'text-emerald-600 dark:text-emerald-400' : (t.balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-ink-muted')}`}>
                                                        {formatCurrency(Math.abs(t.balance), store)}
                                                    </span>
                                                    {t.balance !== 0 && (
                                                        <span className={`text-3xs font-bold ml-1 uppercase ${t.balance > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                            {t.balance > 0 ? 'To Receive' : 'To Pay'}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="p-5 sm:p-12 text-center text-ink-muted">
                                            <div className="flex flex-col items-center gap-2">
                                                <FileText size={24} className="opacity-50" />
                                                <p className="text-sm font-medium">No transactions found</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Stacked Cards List View */}
                    <div className="block sm:hidden divide-y divide-line">
                        {filteredTransactions.length > 0 ? (
                            filteredTransactions.map((t, index) => {
                                const typeStyle = getTypeStyle(t.type);
                                const TypeIcon = typeStyle.icon;

                                return (
                                    <div key={index} className="p-3 hover:bg-interactive-hover dark:hover:bg-interactive-hover flex flex-col gap-1.5">
                                        <div className="flex flex-wrap items-center justify-between gap-y-2">
                                            <span className="text-2xs text-ink-muted font-medium font-mono">
                                                {new Date(t.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold uppercase ${typeStyle.color}`}>
                                                <TypeIcon size={8} />
                                                {typeStyle.label}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="text-xs font-bold text-ink break-all">{t.reference || '-'}</p>
                                            {t.description && <p className="text-2xs text-ink-muted mt-0.5">{t.description}</p>}
                                        </div>
                                        <div className="flex flex-wrap items-center justify-between gap-y-2 text-1xs pt-1.5 border-t border-dashed border-line mt-1">
                                            <div className="flex gap-2">
                                                {t.debit > 0 && (
                                                    <span className="text-red-600 dark:text-red-400 font-mono font-bold">Gave: {formatCurrency(t.debit, store)}</span>
                                                )}
                                                {t.credit > 0 && (
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">Rec: {formatCurrency(t.credit, store)}</span>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <span className={`font-bold font-mono ${t.balance > 0 ? 'text-emerald-600' : (t.balance < 0 ? 'text-red-600' : 'text-ink-muted')}`}>
                                                    {formatCurrency(Math.abs(t.balance), store)}
                                                </span>
                                                {t.balance !== 0 && (
                                                    <span className={`text-4xs font-bold ml-0.5 uppercase ${t.balance > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        {t.balance > 0 ? 'Rec' : 'Pay'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-5 sm:p-12 text-center text-ink-muted text-xs">
                                <FileText size={20} className="mx-auto mb-1.5 opacity-50" />
                                No transactions found
                            </div>
                        )}
                    </div>

                </div>
            </ListPageFrame>
            </div>

            <WhatsAppShareModal
                isOpen={showWhatsAppModal}
                onClose={() => setShowWhatsAppModal(false)}
                documentType="party_statement"
                documentId={party?.id}
                partyName={party?.name}
                initialPhone={party?.phone}
                documentNumber={`Statement: ${party?.name || ''}`}
                amount={Math.abs(stats?.final_balance ?? party?.current_balance ?? 0)}
            />
        </OneGlanceLayout>
    );
}
