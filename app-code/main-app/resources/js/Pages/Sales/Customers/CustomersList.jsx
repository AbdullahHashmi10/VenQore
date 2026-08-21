import React, { useState } from 'react';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Plus, Search, Edit, Trash2, X, Save, User, Phone, Mail, MapPin } from 'lucide-react';
import ContactsModuleTabs from '@/Components/ContactsModuleTabs';

export default function CustomersIndex({ customers, filters }) {
    const { store } = usePage().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    const { data, setData, post, put, delete: destroy, processing, reset, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        pricing_tier: 'standard',
        currency_code: 'USD',
        is_tax_exempt: false,
        credit_limit: 0,
        date_of_birth: '',
        anniversary_date: '',
        addresses: [],
    });

    const addAddress = () => {
        setData('addresses', [...data.addresses, { label: 'Shipping', address: '', city: '', state: '', postal_code: '', country: '' }]);
    };

    const removeAddress = (index) => {
        const newAddresses = [...data.addresses];
        newAddresses.splice(index, 1);
        setData('addresses', newAddresses);
    };

    const updateAddress = (index, field, value) => {
        const newAddresses = [...data.addresses];
        newAddresses[index][field] = value;
        setData('addresses', newAddresses);
    };

    const openModal = (customer = null) => {
        if (customer) {
            setEditingCustomer(customer);
            setData({
                name: customer.name,
                email: customer.email || '',
                phone: customer.phone || '',
                address: customer.address || '',
                pricing_tier: customer.pricing_tier || 'standard',
                currency_code: customer.currency_code || 'USD',
                is_tax_exempt: customer.is_tax_exempt || false,
                credit_limit: customer.credit_limit || 0,
                date_of_birth: customer.date_of_birth || '',
                anniversary_date: customer.anniversary_date || '',
                addresses: customer.addresses || [],
            });
        } else {
            setEditingCustomer(null);
            reset();
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingCustomer) {
            put(route('store.customers.update', { store_slug: store?.slug, customer: editingCustomer.id }), {
                onSuccess: closeModal,
            });
        } else {
            post(route('store.customers.store', { store_slug: store?.slug }), {
                onSuccess: closeModal,
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this customer?')) {
            destroy(route('store.customers.destroy', { store_slug: store?.slug, customer: id }));
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('store.customers.index', { store_slug: store?.slug }), { search: searchTerm }, { preserveState: true });
    };

    return (
        <OneGlanceLayout title="Customers" activeMenu="Contacts">
            <Head title="Customers" />

            <div className="flex flex-col h-full">
                <ContactsModuleTabs activeTab="customers" />

                <div className="pb-8">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <form onSubmit={handleSearch} className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={20} />
                            <input
                                type="text"
                                placeholder="Search customers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-line bg-surface text-ink-secondary dark:text-ink focus:ring-2 ring-brand-500/20 outline-none"
                            />
                        </form>
                        <button
                            onClick={() => openModal()}
                            className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl hover:bg-brand-700 transition-all shadow-md hover:shadow-lg active:scale-95"
                        >
                            <Plus size={20} /> Add Customer
                        </button>
                    </div>

                    <div className="bg-surface rounded-2xl shadow-sm border border-line overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-app text-ink-muted text-xs uppercase tracking-wider">
                                    <th className="p-4 font-semibold">Name</th>
                                    <th className="p-4 font-semibold">Contact</th>
                                    <th className="p-4 font-semibold">Address</th>
                                    <th className="p-4 font-semibold">Loyalty Points</th>
                                    <th className="p-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {customers.data.length > 0 ? (
                                    customers.data.map((customer) => (
                                        <tr key={customer.id} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold">
                                                        {customer.name.charAt(0)}
                                                    </div>
                                                    <span className="font-medium text-ink">{customer.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1 text-sm text-ink-secondary">
                                                    {customer.email && (
                                                        <div className="flex items-center gap-2">
                                                            <Mail size={14} /> {customer.email}
                                                        </div>
                                                    )}
                                                    {customer.phone && (
                                                        <div className="flex items-center gap-2">
                                                            <Phone size={14} /> {customer.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-ink-secondary text-sm">
                                                {customer.address ? (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin size={14} /> {customer.address}
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td className="p-4 text-ink-secondary font-medium">
                                                {customer.loyalty_points}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openModal(customer)}
                                                        className="p-2 text-ink-muted hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(customer.id)}
                                                        className="p-2 text-ink-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-ink-muted">
                                            No customers found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-normal">
                    <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-normal">
                        <div className="p-6 border-b border-line flex justify-between items-center">
                            <h3 className="text-lg font-bold text-ink">
                                {editingCustomer ? 'Edit Customer' : 'Add Customer'}
                            </h3>
                            <button onClick={closeModal} className="text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-200">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-ink-secondary mb-1">Name</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-line bg-app text-sm focus:ring-2 ring-brand-500/20 outline-none"
                                    required
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-ink-secondary mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-line bg-app text-sm focus:ring-2 ring-brand-500/20 outline-none"
                                    />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-ink-secondary mb-1">Phone</label>
                                    <input
                                        type="text"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-line bg-app text-sm focus:ring-2 ring-brand-500/20 outline-none"
                                    />
                                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-ink-secondary mb-1">Pricing Tier</label>
                                    <select
                                        value={data.pricing_tier}
                                        onChange={(e) => setData('pricing_tier', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-line bg-app text-sm focus:ring-2 ring-brand-500/20 outline-none"
                                    >
                                        <option value="standard">Standard</option>
                                        <option value="gold">Gold (Level 2)</option>
                                        <option value="silver">Silver (Level 3)</option>
                                        <option value="bronze">Bronze (Level 4)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-ink-secondary mb-1">Billing Currency</label>
                                    <select
                                        value={data.currency_code}
                                        onChange={(e) => setData('currency_code', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-line bg-app text-sm focus:ring-2 ring-brand-500/20 outline-none"
                                    >
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                        <option value="PKR">PKR (Rs)</option>
                                        <option value="INR">INR (₹)</option>
                                        <option value="AED">AED (د.إ)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-ink-secondary mb-1">Main Address</label>
                                    <textarea
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-line bg-app text-sm focus:ring-2 ring-brand-500/20 outline-none h-10 resize-none"
                                    />
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    type="checkbox"
                                    id="is_tax_exempt"
                                    checked={data.is_tax_exempt}
                                    onChange={(e) => setData('is_tax_exempt', e.target.checked)}
                                    className="rounded border-line text-brand-600 shadow-sm focus:ring-brand-500"
                                />
                                <label htmlFor="is_tax_exempt" className="text-sm font-medium text-ink-secondary">
                                    Tax Exempt (Do not charge tax)
                                </label>
                            </div>

                            <div className="grid grid-cols-3 gap-4 pt-2">
                                <div>
                                    <label className="block text-sm font-medium text-ink-secondary mb-1">Credit Limit</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={data.credit_limit}
                                        onChange={(e) => setData('credit_limit', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-line bg-app text-sm focus:ring-2 ring-brand-500/20 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-ink-secondary mb-1">Date of Birth</label>
                                    <input
                                        type="date"
                                        value={data.date_of_birth}
                                        onChange={(e) => setData('date_of_birth', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-line bg-app text-sm focus:ring-2 ring-brand-500/20 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-ink-secondary mb-1">Anniversary</label>
                                    <input
                                        type="date"
                                        value={data.anniversary_date}
                                        onChange={(e) => setData('anniversary_date', e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-line bg-app text-sm focus:ring-2 ring-brand-500/20 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 border-t border-line">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-ink-secondary">Additional Addresses</label>
                                    <button
                                        type="button"
                                        onClick={addAddress}
                                        className="text-xs flex items-center gap-1 text-brand-600 hover:text-brand-700"
                                    >
                                        <Plus size={14} /> Add Address
                                    </button>
                                </div>
                                
                                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                    {data.addresses.map((addr, idx) => (
                                        <div key={idx} className="p-3 bg-app rounded-xl border border-line relative">
                                            <button
                                                type="button"
                                                onClick={() => removeAddress(idx)}
                                                className="absolute top-2 right-2 text-ink-muted hover:text-red-500"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                            <div className="grid grid-cols-3 gap-2 mb-2">
                                                <div className="col-span-1">
                                                    <input
                                                        type="text"
                                                        placeholder="Label (e.g. Shipping)"
                                                        value={addr.label}
                                                        onChange={(e) => updateAddress(idx, 'label', e.target.value)}
                                                        className="w-full px-2 py-1 text-xs rounded border border-line bg-surface"
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <input
                                                        type="text"
                                                        placeholder="City"
                                                        value={addr.city || ''}
                                                        onChange={(e) => updateAddress(idx, 'city', e.target.value)}
                                                        className="w-full px-2 py-1 text-xs rounded border border-line bg-surface"
                                                    />
                                                </div>
                                            </div>
                                            <textarea
                                                placeholder="Full Address"
                                                value={addr.address}
                                                onChange={(e) => updateAddress(idx, 'address', e.target.value)}
                                                className="w-full px-2 py-1 text-xs rounded border border-line bg-surface resize-none h-16"
                                            />
                                        </div>
                                    ))}
                                    {data.addresses.length === 0 && (
                                        <div className="text-center text-xs text-ink-muted py-2 italic">
                                            No additional addresses.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-ink-secondary hover:bg-interactive-hover rounded-xl transition-colors text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors text-sm font-medium flex items-center gap-2 shadow-lg "
                                >
                                    <Save size={16} />
                                    {processing ? 'Saving...' : 'Save Customer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </OneGlanceLayout>
    );
}
