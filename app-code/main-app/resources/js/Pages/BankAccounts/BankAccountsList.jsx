import React, { useState } from 'react';
import { getCurrencySymbol } from '@/Utils/format';
import { usePage, Head, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import BankAccountModal from '@/Components/BankAccounts/BankAccountModal';
import MobileListHeader from '@/Components/MobileListHeader';
import MobileStats from '@/Components/MobileStats';
import MoneyModuleTabs, { useMoneyNavGroups } from '@/Components/MoneyModuleTabs';
import { ListPageFrame, ListToolbar, ListAddButton, ListStatCards } from '@/Components/ListShell';
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
    const { store } = usePage().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const [errors, setErrors] = useState({});

    // Format currency
    const formatCurrency = (value) => {
        return (value < 0 ? '-' : '') + (getCurrencySymbol()) + ' ' + new Intl.NumberFormat('en-PK', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Math.abs(value) || 0);
    };

    // Open create modal
    const handleCreate = () => {
        setEditingAccount(null);
        setErrors({});
        setIsModalOpen(true);
    };

    // Open edit modal
    const handleEdit = (account) => {
        setEditingAccount(account);
        setErrors({});
        setIsModalOpen(true);
    };

    // Handle delete
    const handleDelete = async (account) => {
        if (!confirm(`Are you sure you want to delete "${account.name}"?`)) return;

        try {
            await axios.delete(route('store.bank-accounts.destroy', { store_slug: store.slug, bankAccount: account.id }));
            router.reload({ only: ['bankAccounts', 'stats'] });
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete account');
        }
    };

    // Submit form
    const handleSubmit = async (submittedPayload) => {
        setLoading(true);
        setErrors({});

        try {
            if (editingAccount) {
                await axios.put(route('store.bank-accounts.update', { store_slug: store.slug, bankAccount: editingAccount.id }), submittedPayload);
            } else {
                await axios.post(route('store.bank-accounts.store', { store_slug: store.slug }), submittedPayload);
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

    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('action') === 'add') {
            handleCreate();
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }, []);

    const navGroups = useMoneyNavGroups();

    return (
        <OneGlanceLayout title="Bank Accounts" activeMenu="Money" noPadding>
            <Head title="Bank Accounts" />

            <div className="flex flex-col h-full bg-app p-3.5 gap-1 overflow-hidden md:contents">
              <ListPageFrame className="max-md:contents">
                {/* ── Desktop header: two rows ── */}
                <ListToolbar
                    title="Bank Accounts"
                    navGroups={navGroups}
                    activeId="accounts"
                    search={{ value: searchTerm, onChange: setSearchTerm, placeholder: 'Search accounts…' }}
                    actions={<ListAddButton onClick={handleCreate} icon={Plus}>Add Account</ListAddButton>}
                />
                <ListStatCards cards={[
                    { label: 'Total Balance', value: formatCurrency(stats.total_balance), icon: Landmark },
                    { label: 'Cash on Hand', value: formatCurrency(stats.cash_balance), icon: Wallet, icon_tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', value_tone: 'text-emerald-600' },
                    { label: 'Money In (Today)', value: formatCurrency(stats.today_in), icon: TrendingUp, icon_tone: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', value_tone: 'text-blue-600' },
                    { label: 'Money Out (Today)', value: formatCurrency(stats.today_out), icon: TrendingDown, icon_tone: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400', value_tone: 'text-rose-600' },
                ]} />

                {/* Phone / existing header (hidden on md+) */}
                {/* PHONE header (Inventory pattern) */}
                <MobileListHeader
                    title="Bank Accounts"
                    navGroups={navGroups}
                    activeId="accounts"
                    search={{ value: searchTerm, onChange: setSearchTerm, placeholder: 'Search accounts…' }}
                    add={{ onClick: handleCreate, label: 'Add Account' }}
                />
                <MobileStats bp="md" hero={0} items={[
                    { label: 'Total Balance', value: formatCurrency(stats.total_balance), tone: 'brand', icon: Landmark },
                    { label: 'Cash on Hand', value: formatCurrency(stats.cash_balance), tone: 'emerald', icon: Wallet },
                    { label: 'Money In (Today)', value: formatCurrency(stats.today_in), tone: 'blue', icon: TrendingUp },
                    { label: 'Money Out (Today)', value: formatCurrency(stats.today_out), tone: 'rose', icon: TrendingDown },
                ]} />

                {/* Main Table */}
                <div className="flex-1 min-h-0 overflow-auto rounded-xl md:rounded-[14px] border border-line shadow-sm bg-surface">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-app border-b border-line sticky top-0 z-10">
                                <th className="sticky top-0 z-10 bg-app p-4 text-xs font-bold text-ink-muted uppercase tracking-wider w-[35%]">Account Details</th>
                                <th className="sticky top-0 z-10 bg-app p-4 text-xs font-bold text-ink-muted uppercase tracking-wider w-[20%]">Number</th>
                                <th className="sticky top-0 z-10 bg-app p-4 text-xs font-bold text-ink-muted uppercase tracking-wider w-[15%]">Type</th>
                                <th className="sticky top-0 z-10 bg-app p-4 text-xs font-bold text-ink-muted uppercase tracking-wider w-[20%] text-right">Balance</th>
                                <th className="sticky top-0 z-10 bg-app p-4 text-xs font-bold text-ink-muted uppercase tracking-wider w-[10%] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {filteredAccounts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-5 sm:p-12 text-center text-ink-muted">
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
                                        className="hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-colors group cursor-pointer border-l-4 border-transparent hover:border-brand-400"
                                        onClick={() => account?.id && router.visit(route('store.bank-accounts.transactions', { store_slug: store.slug, bankAccount: account.id }))}
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${account.account_type === 'cash' ? 'bg-emerald-500' : 'bg-brand-500'
                                                    }`}>
                                                    {account.account_type === 'cash' ? <Wallet size={18} /> : <Landmark size={18} />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-ink text-sm">{account.name}</p>
                                                    <p className="text-xs text-ink-muted">{account.bank_name || 'Cash Account'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono text-sm text-ink-secondary hidden sm:table-cell">
                                            {account.account_number ? `****${account.account_number.slice(-4)}` : '-'}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-md text-2xs font-bold uppercase tracking-wide ${account.account_type === 'cash' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                                    account.account_type === 'savings' ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-400' :
                                                        account.account_type === 'credit' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                                                            'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                                                }`}>
                                                {account.account_type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <p className={`text-sm font-bold ${parseFloat(account.current_balance) < 0 ? 'text-red-500' : 'text-ink'
                                                }`}>
                                                {formatCurrency(account.current_balance)}
                                            </p>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setActiveActionMenu(activeActionMenu === account.id ? null : account.id); }}
                                                    className={`p-1.5 rounded-lg transition-colors ${activeActionMenu === account.id ? 'text-brand-600 bg-sunken' : 'text-ink-muted hover:bg-interactive-hover dark:hover:bg-interactive-hover hover:text-brand-600'}`}
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                                {activeActionMenu === account.id && (
                                                    <div className="absolute right-0 top-full mt-2 w-48 bg-surface rounded-[14px] shadow-xl border border-line p-1 z-50 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => { handleEdit(account); setActiveActionMenu(null); }}
                                                            className="w-full text-left px-3 py-2 hover:bg-interactive-hover rounded dark:hover:bg-interactive-hover flex items-center gap-2 text-sm text-ink-secondary"
                                                        >
                                                            <Edit size={14} /> Edit Details
                                                        </button>
                                                        <button
                                                            onClick={() => account?.id && router.visit(route('store.bank-accounts.transactions', { store_slug: store.slug, bankAccount: account.id }))}
                                                            className="w-full text-left px-3 py-2 hover:bg-interactive-hover rounded dark:hover:bg-interactive-hover flex items-center gap-2 text-sm text-ink-secondary"
                                                        >
                                                            <ArrowRightLeft size={14} /> Transactions
                                                        </button>
                                                        <div className="h-px bg-sunken my-1"></div>
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
              </ListPageFrame>
            </div>

            {/* Create/Edit Modal */}
            <BankAccountModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                editingAccount={editingAccount}
                onSubmit={handleSubmit}
                loading={loading}
                errors={errors}
            />
        </OneGlanceLayout>
    );
}
