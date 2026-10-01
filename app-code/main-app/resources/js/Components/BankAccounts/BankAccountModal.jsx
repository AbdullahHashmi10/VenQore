import React, { useState, useEffect } from 'react';
import FormModal, { FormField, FormInput, FormTextarea, PrimaryButton, SecondaryButton } from '@/Components/FormModal';
import {
    Landmark,
    Wallet,
    CreditCard,
    Building2,
    BookOpen,
    CheckCircle2,
    Sparkles,
    FileText,
    Hash
} from 'lucide-react';
import { getCurrencySymbol } from '@/Utils/format';

export default function BankAccountModal({
    isOpen,
    onClose,
    editingAccount = null,
    onSubmit,
    loading = false,
    errors = {}
}) {
    const currency = getCurrencySymbol();

    const [formData, setFormData] = useState({
        name: '',
        account_number: '',
        bank_name: '',
        account_type: 'checking',
        opening_balance: 0,
        notes: '',
        // Inline Cheque Book state
        add_cheque_book: false,
        cheque_book_prefix: '',
        cheque_book_start_number: 100001,
        cheque_book_end_number: 100050,
        cheque_book_padding_zeros: 6,
        cheque_book_notes: ''
    });

    useEffect(() => {
        if (editingAccount) {
            setFormData({
                name: editingAccount.name || '',
                account_number: editingAccount.account_number || '',
                bank_name: editingAccount.bank_name || '',
                account_type: editingAccount.account_type === 'Default' ? 'cash' : (editingAccount.account_type || 'checking'),
                opening_balance: editingAccount.opening_balance || 0,
                notes: editingAccount.notes || '',
                add_cheque_book: false,
                cheque_book_prefix: '',
                cheque_book_start_number: 100001,
                cheque_book_end_number: 100050,
                cheque_book_padding_zeros: 6,
                cheque_book_notes: ''
            });
        } else {
            setFormData({
                name: '',
                account_number: '',
                bank_name: '',
                account_type: 'checking',
                opening_balance: 0,
                notes: '',
                add_cheque_book: false,
                cheque_book_prefix: '',
                cheque_book_start_number: 100001,
                cheque_book_end_number: 100050,
                cheque_book_padding_zeros: 6,
                cheque_book_notes: ''
            });
        }
    }, [editingAccount, isOpen]);

    const accountTypes = [
        {
            id: 'checking',
            name: 'Checking Account',
            desc: 'Daily business account',
            icon: Building2,
            supportsCheque: true,
            color: 'from-blue-500/10 to-indigo-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400'
        },
        {
            id: 'savings',
            name: 'Savings Account',
            desc: 'Reserve interest account',
            icon: Landmark,
            supportsCheque: true,
            color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
        },
        {
            id: 'credit',
            name: 'Credit Card',
            desc: 'Corporate card line',
            icon: CreditCard,
            supportsCheque: false,
            color: 'from-amber-500/10 to-orange-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400'
        },
        {
            id: 'cash',
            name: 'Cash Drawer',
            desc: 'Physical cash box',
            icon: Wallet,
            supportsCheque: false,
            color: 'from-purple-500/10 to-violet-500/10 border-purple-500/40 text-purple-600 dark:text-purple-400'
        },
    ];

    const currentTypeObj = accountTypes.find(t => t.id === formData.account_type) || accountTypes[0];

    // Format padded serial helper
    const formatSerial = (num, prefix, padding) => {
        if (!num || isNaN(num)) return '';
        const padded = String(num).padStart(padding || 6, '0');
        return prefix ? `${prefix}-${padded}` : padded;
    };

    const startNum = parseInt(formData.cheque_book_start_number) || 0;
    const endNum = parseInt(formData.cheque_book_end_number) || 0;
    const padding = parseInt(formData.cheque_book_padding_zeros) || 6;
    const prefix = (formData.cheque_book_prefix || '').toUpperCase().trim();
    const calculatedLeaves = (endNum >= startNum && startNum > 0) ? (endNum - startNum + 1) : 0;
    const sampleStart = formatSerial(startNum, prefix, padding);
    const sampleEnd = formatSerial(endNum, prefix, padding);

    const handleSubmitForm = (e) => {
        e.preventDefault();
        if (onSubmit) {
            onSubmit(formData);
        }
    };

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title={editingAccount ? 'Edit Bank Account' : 'Add Bank Account'}
            subtitle={editingAccount ? 'Update account settings' : 'Register a new bank account or cash drawer with optional instant cheque book allocation'}
            size="wide"
            errors={errors}
            footer={
                <div className="flex items-center justify-between gap-4">
                    <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-ink-muted">
                        <Sparkles size={14} className="text-brand-500 shrink-0" />
                        <span>V6 Banking Engine • Multi-tenant Ledger</span>
                    </div>
                    <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
                        <SecondaryButton onClick={onClose} type="button" className="!px-4 !py-2 !text-xs !rounded-xl">
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton onClick={handleSubmitForm} loading={loading} type="button" className="!px-5 !py-2 !text-xs !rounded-xl">
                            {editingAccount
                                ? 'Update Account'
                                : formData.add_cheque_book && currentTypeObj.supportsCheque
                                    ? 'Save & Register Cheque Book'
                                    : 'Create Bank Account'}
                        </PrimaryButton>
                    </div>
                </div>
            }
        >
            <form onSubmit={handleSubmitForm} className="space-y-4">

                {/* 1. Account Type Selector - 4-Column Horizontal Layout */}
                <div>
                    <label className="block text-2xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                        Select Account Type <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {accountTypes.map((type) => {
                            const Icon = type.icon;
                            const isSelected = formData.account_type === type.id;
                            return (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => {
                                        setFormData(prev => ({
                                            ...prev,
                                            account_type: type.id,
                                            add_cheque_book: type.supportsCheque ? prev.add_cheque_book : false
                                        }));
                                    }}
                                    className={`
                                        p-3 rounded-xl border text-left transition-all flex items-center gap-3 relative
                                        ${isSelected
                                            ? `bg-gradient-to-br ${type.color} border-brand-500 ring-1 ring-brand-500/30 shadow-sm`
                                            : 'bg-app border-line hover:border-brand-500/40 hover:bg-surface'
                                        }
                                    `}
                                >
                                    <div className={`p-2.5 rounded-lg shrink-0 ${isSelected ? 'bg-surface shadow-xs' : 'bg-sunken text-ink-muted'}`}>
                                        <Icon size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1">
                                            <p className="font-bold text-xs text-ink truncate">{type.name}</p>
                                            {isSelected && (
                                                <CheckCircle2 size={14} className="text-brand-500 shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-2xs text-ink-muted font-medium truncate">{type.desc}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Core Bank Account Details - 4-Column Horizontal Desktop Layout */}
                <div className="bg-surface p-4 rounded-xl border border-line shadow-2xs space-y-3">
                    <h4 className="text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                        <FileText size={13} className="text-brand-500" /> Account Identity & Financial Details
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                        <FormField label="Account Display Name" required error={errors.name?.[0]}>
                            <FormInput
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder={formData.account_type === 'cash' ? 'e.g., Main Cash Drawer' : 'e.g., HBL Primary Operating Account'}
                                error={errors.name}
                                required
                            />
                        </FormField>

                        {formData.account_type !== 'cash' ? (
                            <>
                                <FormField label="Bank Name" hint="e.g., Habib Bank, Meezan, UBL">
                                    <FormInput
                                        value={formData.bank_name}
                                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                                        placeholder="e.g., Habib Bank Limited"
                                    />
                                </FormField>

                                <FormField label="Account / IBAN Number" hint="Official IBAN / Account #">
                                    <FormInput
                                        value={formData.account_number}
                                        onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                                        placeholder="e.g., PK36HABB00001234567890"
                                    />
                                </FormField>
                            </>
                        ) : null}

                        <FormField label="Opening Balance" hint="Initial starting balance">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-ink-muted text-xs">
                                    {currency}
                                </span>
                                <FormInput
                                    type="number"
                                    step="any"
                                    value={formData.opening_balance}
                                    onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
                                    placeholder="0.00"
                                    className="pl-8"
                                />
                            </div>
                        </FormField>
                    </div>
                </div>

                {/* 3. Instant Cheque Book Allocation Section */}
                {currentTypeObj.supportsCheque && !editingAccount && (
                    <div className={`
                        rounded-xl border transition-all p-3.5 overflow-hidden
                        ${formData.add_cheque_book
                            ? 'bg-gradient-to-b from-brand-500/5 to-brand-600/10 border-brand-500/40 shadow-2xs'
                            : 'bg-app border-line hover:border-brand-500/30'
                        }
                    `}>
                        {/* Toggle Header */}
                        <div
                            onClick={() => setFormData(prev => ({ ...prev, add_cheque_book: !prev.add_cheque_book }))}
                            className="flex items-center justify-between cursor-pointer group"
                        >
                            <div className="flex items-center gap-2.5">
                                <div className={`p-2 rounded-lg transition-colors ${formData.add_cheque_book ? 'bg-brand-600 text-white shadow-xs' : 'bg-sunken text-ink-muted group-hover:text-brand-500'}`}>
                                    <BookOpen size={16} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-xs text-ink">Register Initial Cheque Book</h4>
                                        <span className="px-2 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                                            Instant Allocation
                                        </span>
                                    </div>
                                    <p className="text-2xs text-ink-muted font-medium">
                                        Issue a cheque book serial range immediately upon adding this account
                                    </p>
                                </div>
                            </div>

                            {/* iOS style compact switch */}
                            <div className={`w-9 h-5 rounded-full transition-colors p-0.5 flex items-center shrink-0 ${formData.add_cheque_book ? 'bg-brand-600 justify-end' : 'bg-sunken justify-start'}`}>
                                <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                            </div>
                        </div>

                        {/* Collapsible Form Controls */}
                        {formData.add_cheque_book && (
                            <div className="mt-3 pt-3 border-t border-brand-500/20 space-y-3 animate-in fade-in slide-in-from-top-1 duration-fast">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                                    <FormField label="Series Prefix" hint="e.g. HBL">
                                        <FormInput
                                            value={formData.cheque_book_prefix}
                                            onChange={(e) => setFormData({ ...formData, cheque_book_prefix: e.target.value.toUpperCase() })}
                                            placeholder="PREFIX"
                                            className="font-mono uppercase text-xs !py-2"
                                        />
                                    </FormField>

                                    <FormField label="Start Serial" required error={errors.cheque_book_start_number?.[0]}>
                                        <FormInput
                                            type="number"
                                            min="1"
                                            value={formData.cheque_book_start_number}
                                            onChange={(e) => setFormData({ ...formData, cheque_book_start_number: parseInt(e.target.value) || 0 })}
                                            placeholder="100001"
                                            className="font-mono text-xs !py-2"
                                            required
                                        />
                                    </FormField>

                                    <FormField label="End Serial" required error={errors.cheque_book_end_number?.[0]}>
                                        <FormInput
                                            type="number"
                                            min="1"
                                            value={formData.cheque_book_end_number}
                                            onChange={(e) => setFormData({ ...formData, cheque_book_end_number: parseInt(e.target.value) || 0 })}
                                            placeholder="100050"
                                            className="font-mono text-xs !py-2"
                                            required
                                        />
                                    </FormField>

                                    <FormField label="Zero Padding">
                                        <select
                                            value={formData.cheque_book_padding_zeros}
                                            onChange={(e) => setFormData({ ...formData, cheque_book_padding_zeros: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 rounded-xl bg-app border border-line text-ink font-semibold text-xs outline-none focus:border-brand-500"
                                        >
                                            <option value={4}>4 Digits (0101)</option>
                                            <option value={6}>6 Digits (000101)</option>
                                            <option value={8}>8 Digits (00000101)</option>
                                        </select>
                                    </FormField>
                                </div>

                                {/* Live Range & Leaf Counter Badge */}
                                <div className="p-2.5 rounded-lg bg-surface/90 border border-brand-500/20 flex items-center justify-between gap-2 text-2xs">
                                    <div className="flex items-center gap-1.5 font-mono">
                                        <Hash size={12} className="text-brand-500 shrink-0" />
                                        <span className="text-ink-muted">Preview:</span>
                                        {calculatedLeaves > 0 ? (
                                            <span className="font-bold text-ink bg-app px-2 py-0.5 rounded border border-line">
                                                {sampleStart} <span className="text-brand-500">→</span> {sampleEnd}
                                            </span>
                                        ) : (
                                            <span className="text-rose-500 font-bold">End serial &ge; Start serial required</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 font-bold">
                                        <span className="text-ink-muted">Leaves:</span>
                                        <span className={`px-2 py-0.5 rounded-full text-3xs ${calculatedLeaves > 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                            {calculatedLeaves} Leaves
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 4. Optional Remarks */}
                <FormField label="Account Remarks / Notes">
                    <FormTextarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Optional internal notes or reference instructions..."
                        rows={2}
                        className="!py-2 text-xs"
                    />
                </FormField>
            </form>
        </FormModal>
    );
}
