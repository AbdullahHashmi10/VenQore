import React, { useState } from 'react';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';
import { Head, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import PageHeader from '@/Components/PageHeader';
import DataTable from '@/Components/DataTable';
import StatCard, { StatCardGrid } from '@/Components/StatCard';
import { PauseCircle, Play, Trash2, ShoppingCart, Clock, DollarSign, Users } from 'lucide-react';
import axios from 'axios';
import SellModuleTabs from '@/Components/SellModuleTabs';

export default function ParkedSalesIndex({ parkedSales = [], stats = {} }) {
    const { store } = usePage().props;
    // Format currency


    // Table columns
    const columns = [
        {
            key: 'reference',
            label: 'Reference',
            render: (value) => (
                <span className="font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400">
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
                        <p className="text-xs text-slate-400">{date.toLocaleTimeString('en-PK', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</p>
                    </div>
                );
            }
        },
        {
            key: 'customer',
            label: 'Customer',
            render: (value) => (
                <div>
                    <p className="font-semibold text-slate-800 dark:text-white">{value?.name || 'Walk-in'}</p>
                    {value?.phone && <p className="text-xs text-slate-400">{value.phone}</p>}
                </div>
            )
        },
        {
            key: 'items_count',
            label: 'Items',
            render: (value) => (
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
                    {value || 0} items
                </span>
            )
        },
        {
            key: 'total',
            label: 'Total',
            render: (value) => (
                <span className="font-bold text-slate-800 dark:text-white">
                    {formatCurrency(value, store)}
                </span>
            )
        },
        {
            key: 'parked_by',
            label: 'Parked By',
            render: (value) => (
                <span className="text-sm text-slate-500">{value?.name || 'Unknown'}</span>
            )
        },
        {
            key: 'note',
            label: 'Note',
            render: (value) => (
                <span className="text-sm text-slate-400 truncate max-w-[150px] block">
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
        <OneGlanceLayout title="Parked Sales" activeMenu="Sell">
            <Head title="Parked Sales" />

            <div className="flex flex-col h-full">
                <SellModuleTabs activeTab="parked" />

                <div className="pb-8 h-full flex flex-col gap-6 overflow-auto">
                    <PageHeader
                        title="Parked Sales"
                        subtitle="View and recall held transactions"
                        icon={PauseCircle}
                        breadcrumbs={[
                            { label: 'Sales' },
                            { label: 'Parked Sales' }
                        ]}
                    />

                    {/* Stats Cards */}
                    <StatCardGrid columns={4}>
                        <StatCard
                            title="Total Parked"
                            value={stats.total || 0}
                            icon={PauseCircle}
                            iconColor="amber"
                            subtitle="Held transactions"
                        />
                        <StatCard
                            title="Total Value"
                            value={formatCurrency(stats.total_value, store)}
                            icon={DollarSign}
                            iconColor="emerald"
                            subtitle="In parked sales"
                        />
                        <StatCard
                            title="Today's Parked"
                            value={stats.today || 0}
                            icon={Clock}
                            iconColor="blue"
                            subtitle="Parked today"
                        />
                        <StatCard
                            title="With Customers"
                            value={stats.with_customer || 0}
                            icon={Users}
                            iconColor="purple"
                            subtitle="Has customer info"
                        />
                    </StatCardGrid>

                    {/* Data Table */}
                    <div className="flex-1 min-h-0">
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
            </div>
        </OneGlanceLayout>
    );
}
