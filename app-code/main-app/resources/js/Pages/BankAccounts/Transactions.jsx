import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePage, Head, Link } from '@inertiajs/react';
import axios from 'axios';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import MoneyModuleTabs from '@/Components/MoneyModuleTabs';
import {
    ArrowLeft,
    Search,
    Download,
    Printer,
    ArrowUpCircle,
    ArrowDownCircle,
    FileText,
    TrendingUp,
    TrendingDown
} from 'lucide-react';
import { formatCurrency } from '@/Utils/format';

export default function BankAccountTransactions({ bankAccount, transactions }) {
    const { store } = usePage().props;
    // State for Infinite Scroll
    const [allTransactions, setAllTransactions] = useState(transactions.data || []);
    const [nextPageUrl, setNextPageUrl] = useState(transactions.next_page_url);
    const [loadingMore, setLoadingMore] = useState(false);

    // Observer Ref
    const observerTarget = useRef(null);

    const loadMore = useCallback(async () => {
        if (!nextPageUrl || loadingMore) return;
        setLoadingMore(true);
        try {
            const res = await axios.get(nextPageUrl, { headers: { Accept: 'application/json' } });
            setAllTransactions(prev => [...prev, ...res.data.data]);
            setNextPageUrl(res.data.next_page_url);
        } catch (e) {
            console.error("Failed to load more transactions", e);
        } finally {
            setLoadingMore(false);
        }
    }, [nextPageUrl, loadingMore]);

    // Intersection Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && nextPageUrl && !loadingMore) {
                    loadMore();
                }
            },
            { threshold: 0.1, rootMargin: '200px' }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [nextPageUrl, loadMore, loadingMore]);

    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

    const getTypeConfig = (type) => {
        const configs = {
            credit: { label: 'Credit', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20', icon: ArrowDownCircle },
            debit: { label: 'Debit', color: 'text-red-600 bg-red-50 dark:bg-red-900/20', icon: ArrowUpCircle },
        };
        return configs[type] || { label: type, color: 'text-ink-secondary', icon: FileText };
    };

    return (
        <OneGlanceLayout title="Bank Transactions" activeMenu="Money">
            <Head title={`${bankAccount?.name || 'Bank'} Transactions`} />

            <div className="flex flex-col h-full bg-app p-2 gap-1 overflow-hidden">
                <MoneyModuleTabs activeTab="bank-accounts" />

                {/* Header */}
                <div className="flex items-center justify-between bg-surface p-3 rounded-xl border border-line shadow-sm shrink-0">
                    <div className="flex items-center gap-3">
                        <Link href={route('store.bank-accounts.index', { store_slug: store.slug })} className="p-2 hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg transition-colors">
                            <ArrowLeft size={18} className="text-ink-muted" />
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold text-ink uppercase tracking-tight">
                                {bankAccount?.name}
                            </h1>
                            <p className="text-xs font-bold text-ink-muted uppercase">
                                {bankAccount?.bank_name} • {bankAccount?.account_number}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-ink-muted uppercase">Current Balance</p>
                        <p className="text-xl font-bold text-brand-600">{formatCurrency(bankAccount?.current_balance)}</p>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto rounded-xl border border-line shadow-sm bg-surface">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-app border-b border-line sticky top-0 z-10 backdrop-blur-sm">
                            <tr>
                                <th className="p-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Date</th>
                                <th className="p-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Description</th>
                                <th className="p-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Reference</th>
                                <th className="p-4 text-xs font-bold text-ink-muted uppercase tracking-wider">Type</th>
                                <th className="p-4 text-xs font-bold text-ink-muted uppercase tracking-wider text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {allTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center text-ink-muted">
                                        <div className="flex flex-col items-center gap-2">
                                            <FileText size={32} className="opacity-50" />
                                            <p className="font-medium">No transactions found for this account</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                allTransactions.map((row) => {
                                    const config = getTypeConfig(row.type);
                                    const Icon = config.icon;
                                    return (
                                        <tr key={`${row.source}-${row.id}`} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors">
                                            <td className="p-4 text-sm font-medium text-ink-secondary whitespace-nowrap">
                                                {formatDate(row.date)}
                                            </td>
                                            <td className="p-4 text-sm text-ink-secondary font-medium">
                                                {row.description}
                                            </td>
                                            <td className="p-4 text-xs font-mono font-bold text-ink-muted">
                                                {row.ref || '-'}
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold uppercase ${config.color}`}>
                                                    <Icon size={12} />
                                                    {config.label}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className={`text-sm font-bold font-mono ${row.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {row.type === 'credit' ? '+' : '-'}{formatCurrency(row.amount)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}

                            {/* Infinite Scroll Target */}
                            <tr ref={observerTarget}>
                                <td colSpan="5" className="h-4 p-0"></td>
                            </tr>
                            {loadingMore && (
                                <tr>
                                    <td colSpan="5" className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2 text-ink-muted">
                                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-xs font-bold uppercase">Loading more...</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
