import React, { useState } from 'react';
import { usePage, Head, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import FormModal, { FormField, FormInput, FormSelect, FormTextarea, PrimaryButton, SecondaryButton } from '@/Components/FormModal';
import MoneyModuleTabs from '@/Components/MoneyModuleTabs';
import {
    Landmark,
    Plus,
    CreditCard,
    TrendingUp,
    TrendingDown,
    Search,
    Wallet,
    Edit,
    Trash2,
    ArrowRightLeft,
    MoreVertical
} from 'lucide-react';
import axios from 'axios';

export default function BankAccountsIndex({ bankAccounts = [], stats = {} }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeActionMenu, setActiveActionMenu] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        account_number: '',
        bank_name: '',
        account_type: 'checking',
        opening_balance: 0,
        current_balance: 0,
        notes: ''
    });
    const [errors, setErrors] = useState({});

    // Format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0
        }).format(value || 0);
    };

    // Open create modal
    const handleCreate = () => {
        setEditingAccount(null);
        setFormData({
            name: '',
            account_number: '',
            bank_name: '',
            account_type: 'checking',
            opening_balance: 0,
            current_balance: 0,
            notes: ''
        });
        setErrors({});
        setIsModalOpen(true);
    };

    // Open edit modal
    const handleEdit = (account) => {
        setEditingAccount(account);
        setFormData({
            name: account.name || '',
            account_number: account.account_number || '',
            bank_name: account.bank_name || '',
            account_type: account.account_type || 'checking',
            opening_balance: account.opening_balance || 0,
            current_balance: account.current_balance || 0,
            notes: account.notes || ''
        });
        setErrors({});
        setIsModalOpen(true);
    };

    // Handle delete
    const handleDelete = async (account) => {
        if (!confirm(`Are you sure you want to delete "${account.name}"?`)) return;

        try {
            await axios.delete(route('store.bank-accounts.destroy', account.id));
            router.reload({ only: ['bankAccounts', 'stats'] });
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete account');
        }
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            if (editingAccount) {
                await axios.put(route('store.bank-accounts.update', editingAccount.id), formData);
            } else {
                await axios.post(route('store.bank-accounts.store', { store_slug: store.slug }), formData);
            }
            setIsModalOpen(false);
            router.reload({ only: ['bankAccounts', 'stats'] });
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors || {});
            } else {
                alert(error.response?.data?.message || 'An error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    // Filter Data
    const filteredAccounts = bankAccounts.filter(acc =>
        acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.bank_name && acc.bank_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Close menu on click outside
    React.useEffect(() => {
        const handleClickOutside = () => setActiveActionMenu(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <OneGlanceLayout title="Bank Accounts" activeMenu="Money">
            <Head title="Bank Accounts" />

            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden">
                <MoneyModuleTabs activeTab="accounts" className="!mb-0" />

                {/* Stats Cards Section - Compact Single Line */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0">
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <Landmark size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Balance</p>
                        </div>
                        <p className="text-base font-black text-slate-900 dark:text-white">{formatCurrency(stats.total_balance)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                <Wallet size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Cash on Hand</p>
                        </div>
                        <p className="text-base font-black text-emerald-600">{formatCurrency(stats.cash_balance)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                <TrendingUp size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Money In (Today)</p>
                        </div>
                        <p className="text-base font-black text-blue-600">{formatCurrency(stats.today_in)}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                                <TrendingDown size={16} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Money Out (Today)</p>
                        </div>
                        <p className="text-base font-black text-rose-600">{formatCurrency(stats.today_out)}</p>
                    </div>
                </div>

                {/* Header Area - Compact Single Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    {/* Left: Title */}
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0">
                            Bank <span className="text-indigo-600">Accounts</span>
                        </h1>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        <span className="text-xs font-bold text-slate-500">{filteredAccounts.length} Accounts</span>
                    </div>

                    {/* Right: Search + Actions */}
                    <div className="flex items-center gap-2">
                        <div className="relative w-52 hidden md:block">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search accounts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-700 dark:text-slate-200"
                            />
                        </div>
                        <button
                            onClick={handleCreate}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <Plus size={14} /> Add Account
                        </button>
                    </div>
                </div>

                {/* Main Table */}
                <div className="flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[35%]">Account Details</th>
                                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[20%]">Number</th>
                                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[15%]">Type</th>
                                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[20%] text-right">Balance</th>
                                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[10%] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredAccounts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <Landmark size={32} className="mb-2 opacity-50" />
                                            <p className="text-sm">No accounts found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAccounts.map((account) => (
                                    <tr
                                        key={account.id}
                                        className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors group cursor-pointer border-l-4 border-transparent hover:border-indigo-400"
                                        onClick={() => router.visit(route('store.bank-accounts.transactions', account.id))}
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${account.account_type === 'cash' ? 'bg-emerald-500' : 'bg-indigo-500'
                                                    }`}>
                                                    {account.account_type === 'cash' ? <Wallet size={18} /> : <Landmark size={18} />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-white text-sm">{account.name}</p>
                                                    <p className="text-xs text-slate-400">{account.bank_name || 'Cash Account'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono text-sm text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                                            {account.account_number ? `****${account.account_number.slice(-4)}` : '-'}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wide ${account.account_type === 'cash' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                                    account.account_type === 'savings' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' :
                                                        account.account_type === 'credit' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                                                            'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                                                }`}>
                                                {account.account_type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <p className={`text-sm font-black ${parseFloat(account.current_balance) < 0 ? 'text-red-500' : 'text-slate-800 dark:text-white'
                                                }`}>
                                                {formatCurrency(account.current_balance)}
                                            </p>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setActiveActionMenu(activeActionMenu === account.id ? null : account.id); }}
                                                    className={`p-1.5 rounded-lg transition-colors ${activeActionMenu === account.id ? 'text-indigo-600 bg-slate-100 dark:bg-slate-800' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600'}`}
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                                {activeActionMenu === account.id && (
                                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-1 z-50 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => { handleEdit(account); setActiveActionMenu(null); }}
                                                            className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                                                        >
                                                            <Edit size={14} /> Edit Details
                                                        </button>
                                                        <button
                                                            onClick={() => router.visit(route('store.bank-accounts.transactions', account.id))}
                                                            className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded dark:hover:bg-slate-700 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                                                        >
                                                            <ArrowRightLeft size={14} /> Transactions
                                                        </button>
                                                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                                        <button
                                                            onClick={() => { handleDelete(account); setActiveActionMenu(null); }}
                                                            className="w-full text-left px-3 py-2 hover:bg-red-50 rounded dark:hover:bg-red-900/20 flex items-center gap-2 text-sm text-red-600"
                                                        >
                                                            <Trash2 size={14} /> Delete Account
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <FormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingAccount ? 'Edit Bank Account' : 'Add Bank Account'}
                subtitle={editingAccount ? 'Update account details' : 'Add a new bank or cash account'}
                size="lg"
                footer={
                    <div className="flex justify-end gap-3">
                        <SecondaryButton onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton onClick={handleSubmit} loading={loading}>
                            {editingAccount ? 'Update' : 'Create'}
                        </PrimaryButton>
                    </div>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Account Name" required error={errors.name?.[0]}>
                            <FormInput
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Main Business Account"
                                error={errors.name}
                            />
                        </FormField>

                        <FormField label="Account Type" required>
                            <FormSelect
                                value={formData.account_type}
                                onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                            >
                                <option value="cash">Cash</option>
                                <option value="checking">Checking Account</option>
                                <option value="savings">Savings Account</option>
                                <option value="credit">Credit Card</option>
                            </FormSelect>
                        </FormField>
                    </div>

                    {formData.account_type !== 'cash' && (
                        <div className="grid grid-cols-2 gap-4">
                            <FormField label="Bank Name">
                                <FormInput
                                    value={formData.bank_name}
                                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                    placeholder="e.g., HBL, UBL, Meezan"
                                />
                            </FormField>

                            <FormField label="Account Number">
                                <FormInput
                                    value={formData.account_number}
                                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                                    placeholder="Enter account number"
                                />
                            </FormField>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Opening Balance" hint="Initial balance when adding this account">
                            <FormInput
                                type="number"
                                value={formData.opening_balance}
                                onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
                                placeholder="0"
                            />
                        </FormField>

                        {editingAccount && (
                            <FormField label="Current Balance">
                                <FormInput
                                    type="number"
                                    value={formData.current_balance}
                                    disabled
                                    className="bg-slate-50 dark:bg-slate-800/50"
                                />
                            </FormField>
                        )}
                    </div>

                    <FormField label="Notes">
                        <FormTextarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Optional notes about this account"
                            rows={2}
                        />
                    </FormField>
                </form>
            </FormModal>
        </OneGlanceLayout>
    );
}
