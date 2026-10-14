import React, { useState } from 'react';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import { Head, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import PageHeader from '@/Components/PageHeader';
import DataTable from '@/Components/DataTable';
import StatCard, { StatCardGrid } from '@/Components/StatCard';
import { PauseCircle, Play, Trash2, ShoppingCart, Clock, DollarSign, Users } from 'lucide-react';
import axios from 'axios';
import SellModuleTabs, { useSellNavGroups } from '@/Components/SellModuleTabs';
import MobileListHeader from '@/Components/MobileListHeader';
import MobileStats from '@/Components/MobileStats';
import { ListPageFrame, ListToolbar, ListStatCards } from '@/Components/ListShell';
import { useTermText } from '@/lib/terms';

export default function ParkedSalesIndex({ parkedSales = [], stats = {} }) {
    const { store } = usePage().props;
    const navGroups = useSellNavGroups();
    const tt = useTermText();
    // Format currency


    // Table columns
    const columns = [
        {
            key: 'reference',
            label: 'Reference',
            render: (value) => (
                <span className="font-mono text-sm font-semibold text-brand-600 dark:text-brand-400">
                    {value || 'No Ref'}
                </span>
            )
        },
        {
            key: 'created_at',
            label: 'Parked At',
            render: (value) => {
                const date = new Date(value);
                return (
                    <div>
                        <p className="text-sm">{date.toLocaleDateString('en-PK', {
                            day: '2-digit',
                            month: 'short'
                        })}</p>
                        <p className="text-xs text-ink-muted">{date.toLocaleTimeString('en-PK', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</p>
                    </div>
                );
            }
        },
        {
            key: 'customer',
            label: tt('Customer'),
            render: (value) => (
                <div>
                    <p className="font-semibold text-ink">{value?.name || 'Walk-in'}</p>
                    {value?.phone && <p className="text-xs text-ink-muted">{value.phone}</p>}
                </div>
            )
        },
        {
            key: 'items_count',
            label: 'Items',
            render: (value) => (
                <span className="px-2 py-1 bg-sunken rounded-lg text-xs font-semibold">
                    {value || 0} items
                </span>
            )
        },
        {
            key: 'total',
            label: 'Total',
            render: (value) => (
                <span className="font-bold text-ink">
                    {formatCurrency(value, store)}
                </span>
            )
        },
        {
            key: 'parked_by',
            label: 'Parked By',
            render: (value) => (
                <span className="text-sm text-ink-muted">{value?.name || 'Unknown'}</span>
            )
        },
        {
            key: 'note',
            label: 'Note',
            render: (value) => (
                <span className="text-sm text-ink-muted truncate max-w-[150px] block">
                    {value || '-'}
                </span>
            )
        }
    ];

    const handleRecall = (sale) => {
        // Navigate to POS with this parked sale data
        router.visit(route('store.pos', { store_slug: store?.slug }) + `?recall=${sale.id}`);
    };

    const handleDelete = async (sale) => {
        if (!confirm('Are you sure you want to delete this parked sale?')) return;
        try {
            await axios.delete(route('store.parked-sales.destroy', { store_slug: store?.slug, sale: sale.id }));
            router.reload();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete parked sale');
        }
    };

    return (
        <OneGlanceLayout title="Parked Sales" activeMenu="Sell" noPadding>
            <Head title="Parked Sales" />

            <ListPageFrame className="flex flex-col h-full p-1.5">
                <MobileListHeader title="Parked Sales" navGroups={navGroups} activeId="parked" />
                <MobileStats bp="md" hero={1} items={[
                    { label: 'Parked', value: stats.total || 0, tone: 'amber', icon: PauseCircle },
                    { label: 'Value', value: formatCurrency(stats.total_value, store), tone: 'emerald', icon: DollarSign },
                    { label: 'Today', value: stats.today || 0, tone: 'blue', icon: Clock },
                    { label: tt('With Customers'), value: stats.with_customer || 0, tone: 'brand', icon: Users },
                ]} />

                <ListToolbar title="Parked Sales" navGroups={navGroups} activeId="parked" />
                <ListStatCards cards={[
                    { label: 'Total Parked', value: stats.total || 0, icon: PauseCircle, icon_tone: 'bg-amber-100 text-amber-600' },
                    { label: 'Total Value', value: formatCurrency(stats.total_value, store), icon: DollarSign, icon_tone: 'bg-emerald-100 text-emerald-600' },
                    { label: "Today's Parked", value: stats.today || 0, icon: Clock, icon_tone: 'bg-blue-100 text-blue-600' },
                    { label: tt('With Customers'), value: stats.with_customer || 0, icon: Users, icon_tone: 'bg-brand-100 text-brand-600' },
                ]} />

                <div className="pb-8 md:pb-0 h-full flex flex-col gap-6 md:gap-0 overflow-auto md:flex-1 md:min-h-0">
                    {/* Data Table */}
                    <div className="flex-1 min-h-0 md:overflow-auto md:rounded-[14px] md:border md:border-line md:shadow-sm md:bg-surface md:[&>div]:border-0 md:[&>div]:rounded-none md:[&>div]:shadow-none md:[&>div]:overflow-visible md:[&_.overflow-x-auto]:overflow-visible md:[&_thead]:sticky md:[&_thead]:top-0 md:[&_thead]:z-10">
                        <DataTable
                            data={parkedSales}
                            columns={columns}
                            searchable
                            emptyMessage="No parked sales"
                            actions={[
                                {
                                    icon: Play,
                                    label: 'Recall',
                                    onClick: handleRecall,
                                    className: 'text-emerald-600 hover:text-emerald-700'
                                },
                                {
                                    icon: Trash2,
                                    label: 'Delete',
                                    onClick: handleDelete,
                                    className: 'text-red-600 hover:text-red-700'
                                }
                            ]}
                        />
                    </div>
                </div>
            </ListPageFrame>
        </OneGlanceLayout>
    );
}
