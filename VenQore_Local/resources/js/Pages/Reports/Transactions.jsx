import React, { useState, useEffect, useCallback } from 'react';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { CreditCard } from 'lucide-react';
import MasterReport from '@/Components/Reports/MasterReport';
import ReportsLayout from '@/Layouts/ReportsLayout';
import { Head } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';

export default function TransactionsReport({ transactions = {}, filters = {} }) {
    const {
        store
    } = usePage().props;

    // State for Infinite Scroll
    const [allTransactions, setAllTransactions] = useState(transactions.data || []);
    const [nextPageUrl, setNextPageUrl] = useState(transactions.next_page_url);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        setAllTransactions(transactions.data || []);
        setNextPageUrl(transactions.next_page_url);
    }, [transactions]);

    const loadMore = useCallback(async () => {
        if (!nextPageUrl || loadingMore) return;
        setLoadingMore(true);
        try {
            const res = await axios.get(nextPageUrl, { headers: { Accept: 'application/json' } });
            // De-duplicate in case of race conditions
            setAllTransactions(prev => {
                const existingIds = new Set(prev.map(p => p.id + '-' + p.type)); // Composite key since IDs overlap between tables
                const uniqueNew = res.data.data.filter(p => !existingIds.has(p.id + '-' + p.type));
                return [...prev, ...uniqueNew];
            });
            setNextPageUrl(res.data.next_page_url);
        } catch (e) {
            console.error("Failed to load more transactions", e);
        } finally {
            setLoadingMore(false);
        }
    }, [nextPageUrl, loadingMore]);

    // Map Columns
    const columns = [
        {
            key: 'date',
            label: 'Date',
            type: 'date',
            sortable: true
        },
        {
            key: 'type',
            label: 'Type',
            sortable: true,
            render: (row) => <span className="font-medium text-slate-700 dark:text-slate-300">{row.type}</span>
        },
        {
            key: 'ref', // Using 'ref' or 'id'
            label: 'Reference',
            render: (row) => <span className="font-mono text-xs text-slate-500">{row.id}</span>
        },
        {
            key: 'party',
            label: 'Party',
            render: (row) => row.party || '-'
        },
        {
            key: 'amount',
            label: 'Amount',
            align: 'right',
            sortable: true,
            render: (row) => {
                const isPositive = row.type === 'Sale' || row.type === 'Payment In';
                const isExpense = row.type === 'Expense' || row.type === 'Purchase';
                // Logic based on type
                const colorClass = (row.type === 'Sale' || row.type === 'Payment In') ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300';

                return (
                    <span className={`font-bold ${colorClass}`}>
                        {formatCurrency(row.amount)}
                    </span>
                );
            }
        },
        {
            key: 'status',
            label: 'Status',
            render: (row) => (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase">
                    {row.status || '-'}
                </span>
            )
        }
    ];

    // Filter Defs
    const filterDefs = [
        {
            key: 'start_date',
            type: 'date',
            label: 'Start Date'
        },
        {
            key: 'end_date',
            type: 'date',
            label: 'End Date'
        }
        // Removing Type filter for now as generic Union query complicates specific filtering unless handling in controller
    ];

    const handleFilterChange = (newValues) => {
        router.get(route("store.reports.transactions", {
            store_slug: store.slug
        }), newValues, { preserveState: true, replace: true });
    };

    return (
        <ReportsLayout title="All Transactions">
            <Head title="All Transactions" />

            <MasterReport
                title="All Transactions"
                stats={[]} // No stats provided by controller yet
                columns={columns}
                data={allTransactions}
                filters={filterDefs}
                filterValues={filters}
                onFilterChange={handleFilterChange}
                onExport={() => alert('Export feature coming soon')}

                // Infinite Scroll Props
                enableInfiniteScroll={true}
                onLoadMore={loadMore}
                hasMore={!!nextPageUrl}
                loadingMore={loadingMore}
            />
        </ReportsLayout>
    );
}
