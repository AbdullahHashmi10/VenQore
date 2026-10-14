import React, { useState, useMemo } from 'react';
import MobileListHeader from '@/Components/MobileListHeader';
import MobileStats from '@/Components/MobileStats';
import { getCurrencySymbol } from '@/Utils/format';
import { usePage, Head, Link } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import PrintService from '@/Utils/PrintService';
import { useMoneyNavGroups } from '@/Components/MoneyModuleTabs';
import { ListPageFrame, ListToolbar, ListAddButton, ListStatCards } from '@/Components/ListShell';
import ListFilterPill from '@/Components/ListFilterPill';
import { 
    Wallet, 
    ArrowLeft, 
    Search, 
    Filter,
    Minus,
    MoreVertical,
    Printer,
    Download,
    ArrowDownLeft,
    ArrowUpRight,
    List
} from 'lucide-react';

export default function CashHistory({ balance, ledger, store }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const moneyNavGroups = useMoneyNavGroups();
    const totalIn = useMemo(() => ledger.filter(i => i.mode === 'in').reduce((s, i) => s + (Number(i.amount) || 0), 0), [ledger]);
    const totalOut = useMemo(() => ledger.filter(i => i.mode === 'out').reduce((s, i) => s + (Number(i.amount) || 0), 0), [ledger]);

    const filteredLedger = useMemo(() => {
        let data = [...ledger];
        if (filterType === 'in') data = data.filter(item => item.mode === 'in');
        if (filterType === 'out') data = data.filter(item => item.mode === 'out');

        if (searchTerm) {
            const low = searchTerm.toLowerCase();
            data = data.filter(item => 
                item.name.toLowerCase().includes(low) || 
                item.type.toLowerCase().includes(low) ||
                item.description.toLowerCase().includes(low)
            );
        }
        return data;
    }, [ledger, filterType, searchTerm]);

    return (
        <OneGlanceLayout title="Cash Ledger" activeMenu="Money" noPadding>
            <Head title="Cash In Hand" />

            <ListPageFrame className="flex flex-col h-full bg-sunken dark:bg-app overflow-hidden p-2.5">
                <ListToolbar
                    title="Cash In Hand"
                    navGroups={moneyNavGroups}
                    activeId="funds"
                    left={(
                        <ListFilterPill
                            icon={Filter}
                            label="All transactions"
                            value={filterType}
                            options={[{ value: 'all', label: 'All transactions' }, { value: 'in', label: 'Money In' }, { value: 'out', label: 'Money Out' }]}
                            onChange={setFilterType}
                        />
                    )}
                    search={{ value: searchTerm, onChange: setSearchTerm, placeholder: 'Search Transactions' }}
                    actions={(
                        <>
                            <button type="button" onClick={() => PrintService.printPage()} className="h-10 w-10 flex items-center justify-center rounded-[12px] text-ink-muted hover:bg-interactive-hover transition-colors" title="Print">
                                <Printer size={18} />
                            </button>
                            <ListAddButton icon={Wallet}>Adjust Cash</ListAddButton>
                        </>
                    )}
                />
                <ListStatCards cards={[
                    { label: 'Cash In Hand', value: `${getCurrencySymbol()} ${balance.toLocaleString()}`, icon: Wallet, icon_tone: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', value_tone: 'text-emerald-600' },
                    { label: 'Money In', value: `${getCurrencySymbol()} ${totalIn.toLocaleString()}`, icon: ArrowDownLeft, icon_tone: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', value_tone: 'text-emerald-600' },
                    { label: 'Money Out', value: `${getCurrencySymbol()} ${totalOut.toLocaleString()}`, icon: ArrowUpRight, icon_tone: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400', value_tone: 'text-rose-600' },
                    { label: 'Transactions', value: ledger.length, icon: List },
                ]} />

                <MobileListHeader
                    title="Cash In Hand"
                    navGroups={moneyNavGroups}
                    activeId="funds"
                    filter={{
                        active: filterType !== 'all',
                        sections: [{ label: 'Type', value: filterType, options: [{ value: 'all', label: 'All transactions' }, { value: 'in', label: 'Money In' }, { value: 'out', label: 'Money Out' }], onSelect: setFilterType }],
                    }}
                    search={{ value: searchTerm, onChange: setSearchTerm, placeholder: 'Search Transactions' }}
                    actions={[{ icon: Printer, label: 'Print', onClick: () => PrintService.printPage() }]}
                />
                <MobileStats bp="md" hero={0} items={[
                    { label: 'Cash In Hand', value: `${getCurrencySymbol()} ${balance.toLocaleString()}`, tone: 'emerald', icon: Wallet },
                    { label: 'Money In', value: `${getCurrencySymbol()} ${totalIn.toLocaleString()}`, tone: 'emerald', icon: ArrowDownLeft },
                    { label: 'Money Out', value: `${getCurrencySymbol()} ${totalOut.toLocaleString()}`, tone: 'rose', icon: ArrowUpRight },
                    { label: 'Transactions', value: ledger.length, tone: 'ink', icon: List },
                ]} />

                {/* Main Table Content */}
                <div className="flex-1 overflow-hidden px-6 pb-6 mt-2 md:contents">
                    <div className="bg-surface rounded-xl md:rounded-[14px] border border-line shadow-sm overflow-hidden flex flex-col h-full md:h-auto md:flex-1 md:min-h-0">
                        <div className="overflow-auto custom-scrollbar md:flex-1 md:min-h-0">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-sunken dark:bg-surface border-b border-line md:sticky md:top-0 md:z-10">
                                    <tr>
                                        <th className="sticky top-0 z-10 bg-sunken px-4 py-4 text-1xs font-bold text-ink-muted uppercase tracking-tight border-r border-line">
                                            <div className="flex flex-wrap items-center justify-between gap-y-2">Type <Filter size={12} className="opacity-0 group-hover:opacity-100" /></div>
                                        </th>
                                        <th className="sticky top-0 z-10 bg-sunken px-4 py-4 text-1xs font-bold text-ink-muted uppercase tracking-tight border-r border-line">
                                            <div className="flex flex-wrap items-center justify-between gap-y-2">Name <Filter size={12} className="opacity-0 group-hover:opacity-100" /></div>
                                        </th>
                                        <th className="sticky top-0 z-10 bg-sunken px-4 py-4 text-1xs font-bold text-ink-muted uppercase tracking-tight border-r border-line">
                                            <div className="flex flex-wrap items-center justify-between gap-y-2">Date <Filter size={12} className="opacity-0 group-hover:opacity-100" /></div>
                                        </th>
                                        <th className="sticky top-0 z-10 bg-sunken px-4 py-4 text-1xs font-bold text-ink-muted uppercase tracking-tight text-right w-48">
                                            <div className="flex flex-wrap items-center justify-between gap-y-2">Amount <Filter size={12} className="opacity-0 group-hover:opacity-100" /></div>
                                        </th>
                                        <th className="sticky top-0 z-10 bg-sunken w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                    {filteredLedger.map((item, idx) => (
                                        <tr key={item.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-sunken'} dark:bg-app hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors group`}>
                                            <td className="px-4 py-4 text-sm font-bold text-ink-secondary dark:text-ink border-r border-line">
                                                {item.type}
                                            </td>
                                            <td className="px-4 py-4 text-sm font-bold text-ink-secondary border-r border-line">
                                                {item.name}
                                                {item.description && item.description !== item.name && (
                                                    <p className="text-2xs text-ink-muted font-normal mt-0.5 line-clamp-1">{item.description}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-[13px] font-medium text-ink-muted border-r border-line">
                                                {item.date}
                                            </td>
                                            <td className={`px-4 py-4 text-right text-sm font-bold tabular-nums ${item.mode === 'in' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {getCurrencySymbol()} {item.amount.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <button className="p-1 text-neutral-300 hover:text-ink-secondary dark:hover:text-neutral-200">
                                                    <MoreVertical size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredLedger.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center text-ink-muted italic text-sm">
                                                No transactions found in this period.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </ListPageFrame>
        </OneGlanceLayout>
    );
}
