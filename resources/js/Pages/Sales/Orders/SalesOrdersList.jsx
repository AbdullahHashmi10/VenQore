import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import PageHeader from '@/Components/PageHeader';
import DataTable from '@/Components/DataTable';
import StatCard, { StatCardGrid } from '@/Components/StatCard';
import FilterPanel from '@/Components/FilterPanel';
import FormModal, { FormField, FormInput, FormSelect, FormTextarea, PrimaryButton, SecondaryButton } from '@/Components/FormModal';
import { ClipboardList, Plus, Clock, CheckCircle, XCircle, Package, Truck } from 'lucide-react';
import axios from 'axios';
import SellModuleTabs from '@/Components/SellModuleTabs';

export default function SalesOrdersIndex({ orders = [], stats = {}, customers = [] }) {
    const { store } = usePage().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filters, setFilters] = useState({});
    const [formData, setFormData] = useState({
        customer_id: '',
        expected_date: '',
        notes: '',
        items: []
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0
        }).format(value || 0);
    };

    // Table columns
    const columns = [
        {
            key: 'order_number',
            label: 'Order #',
            render: (value) => (
                <span className="font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    {value}
                </span>
            )
        },
        {
            key: 'created_at',
            label: 'Date',
            render: (value) => new Date(value).toLocaleDateString('en-PK', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            })
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
            key: 'status',
            label: 'Status',
            render: (value) => {
                const statuses = {
                    pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400', icon: Clock },
                    confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400', icon: CheckCircle },
                    processing: { label: 'Processing', color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400', icon: Package },
                    shipped: { label: 'Shipped', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400', icon: Truck },
                    completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400', icon: CheckCircle },
                    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400', icon: XCircle }
                };
                const s = statuses[value] || statuses.pending;
                const Icon = s.icon;
                return (
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 w-fit ${s.color}`}>
                        <Icon size={12} />
                        {s.label}
                    </span>
                );
            }
        },
        {
            key: 'expected_date',
            label: 'Expected',
            render: (value) => value ? new Date(value).toLocaleDateString('en-PK', {
                day: '2-digit',
                month: 'short'
            }) : '-'
        },
        {
            key: 'total',
            label: 'Total',
            render: (value) => (
                <span className="font-bold text-slate-800 dark:text-white">
                    {formatCurrency(value)}
                </span>
            )
        }
    ];

    // Filter definitions
    const filterDefs = [
        {
            key: 'date',
            type: 'dateRange',
            label: 'Date Range'
        },
        {
            key: 'status',
            type: 'select',
            label: 'Status',
            options: [
                { value: 'pending', label: 'Pending' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'processing', label: 'Processing' },
                { value: 'shipped', label: 'Shipped' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' }
            ]
        },
        {
            key: 'customer',
            type: 'search',
            label: 'Customer',
            placeholder: 'Search customer...'
        }
    ];

    const handleView = (order) => {
        router.visit(route('store.sales.orders.show', { store_slug: store?.slug, order: order.id }));
    };

    const handleCreate = () => {
        router.visit(route('store.pre-sales.create', { store_slug: store?.slug }));
    };

    const handleConvertToSale = async (order) => {
        if (!confirm('Convert this order to a sale invoice?')) return;
        try {
            await axios.post(route('store.sales-orders.convert', { store_slug: store?.slug, salesOrder: order.id }));
            router.reload();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to convert order');
        }
    };

    return (
        <OneGlanceLayout title="Sales Orders" activeMenu="Sell">
            <Head title="Sales Orders" />

            <div className="flex flex-col h-full">
                <SellModuleTabs activeTab="orders" />

                <div className="pb-8 h-full flex flex-col gap-6 overflow-auto">
                    <PageHeader
                        title="Sales Orders"
                        subtitle="Manage customer orders before invoicing"
                        icon={ClipboardList}
                        breadcrumbs={[
                            { label: 'Sales' },
                            { label: 'Orders' }
                        ]}
                        actions={
                            <button
                                onClick={handleCreate}
                                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/25"
                            >
                                <Plus size={18} />
                                New Order
                            </button>
                        }
                    />

                    {/* Stats Cards */}
                    <StatCardGrid columns={4}>
                        <StatCard
                            title="Pending Orders"
                            value={stats.pending || 0}
                            icon={Clock}
                            iconColor="amber"
                            subtitle="Awaiting confirmation"
                        />
                        <StatCard
                            title="Processing"
                            value={stats.processing || 0}
                            icon={Package}
                            iconColor="purple"
                            subtitle="Being prepared"
                        />
                        <StatCard
                            title="This Month"
                            value={formatCurrency(stats.month_total)}
                            icon={ClipboardList}
                            iconColor="blue"
                            subtitle="Order value"
                        />
                        <StatCard
                            title="Completed"
                            value={stats.completed || 0}
                            icon={CheckCircle}
                            iconColor="emerald"
                            subtitle="This month"
                        />
                    </StatCardGrid>

                    {/* Filters */}
                    <FilterPanel
                        filters={filterDefs}
                        values={filters}
                        onChange={setFilters}
                        onReset={() => setFilters({})}
                    />

                    {/* Data Table */}
                    <div className="flex-1 min-h-0">
                        <DataTable
                            data={orders}
                            columns={columns}
                            onView={handleView}
                            searchable
                            emptyMessage="No sales orders yet"
                            actions={[
                                {
                                    icon: CheckCircle,
                                    label: 'Convert to Sale',
                                    onClick: handleConvertToSale
                                }
                            ]}
                        />
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
