import React, { useState, useEffect } from 'react';
import FormModal, { FormField, FormInput, FormSelect, FormTextarea, PrimaryButton, SecondaryButton } from '@/Components/FormModal';
import axios from 'axios';
import { usePage } from '@inertiajs/react';

export default function QuickPartyModal({ isOpen, onClose, onSuccess, type = 'customer', initialName = '', editingParty = null }) {
    const {
        store
    } = usePage().props;

    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const isEditMode = !!editingParty;

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        type: type,
        opening_balance: 0,
        opening_balance_type: 'receivable',
        credit_limit: '',
        address: '',
        notes: '',
        default_discount: 0
    });

    useEffect(() => {
        if (isOpen) {
            if (editingParty) {
                // Edit mode - populate form with existing data
                setFormData({
                    name: editingParty.name || '',
                    phone: editingParty.phone || '',
                    email: editingParty.email || '',
                    type: editingParty.type || type,
                    opening_balance: editingParty.opening_balance || 0,
                    opening_balance_type: editingParty.opening_balance_type || 'receivable',
                    credit_limit: editingParty.credit_limit || '',
                    address: editingParty.address || '',
                    notes: editingParty.notes || '',
                    default_discount: editingParty.default_discount || 0
                });
            } else {
                // Create mode - reset form
                setFormData({
                    name: initialName,
                    phone: '',
                    email: '',
                    type: type,
                    opening_balance: 0,
                    opening_balance_type: 'receivable',
                    credit_limit: '',
                    address: '',
                    notes: '',
                    default_discount: 0
                });
            }
            setErrors({});
        }
    }, [isOpen, initialName, type, editingParty]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        try {
            let response;
            if (isEditMode) {
                // Update existing party
                const url = type === 'supplier'
                    ? route('store.suppliers.update', editingParty.id)
                    : route("store.parties.update", [store.slug, editingParty.id]);
                response = await axios.put(url, formData);
            } else {
                // Create new party
                const url = type === 'supplier' ? route('store.suppliers.store', { store_slug: store.slug }) : route("store.parties.store", {
                    store_slug: store.slug
                });
                response = await axios.post(url, formData);
            }

            if (response.data.success || response.status === 200 || response.status === 201) {
                onSuccess(response.data.party || { ...formData, id: editingParty?.id });
                onClose();
            }
        } catch (error) {
            if (error.response && error.response.data.errors) {
                setErrors(error.response.data.errors);
            } else {
                console.error('Error saving party:', error);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const typeLabel = type === 'customer' ? 'Customer' : 'Supplier';

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title={`${isEditMode ? 'Edit' : 'Create New'} ${typeLabel}`}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4 p-4">
                <FormField label="Name" error={errors.name} required>
                    <FormInput
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        autoFocus
                    />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                    <FormField label="Phone" error={errors.phone}>
                        <FormInput
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </FormField>
                    <FormField label="Email" error={errors.email}>
                        <FormInput
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </FormField>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField label="Default Discount (%)" error={errors.default_discount}>
                        <FormInput
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={formData.default_discount}
                            onChange={e => setFormData({ ...formData, default_discount: e.target.value })}
                            placeholder="0.00"
                        />
                    </FormField>
                </div>

                {!isEditMode && (
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Opening Balance" error={errors.opening_balance}>
                            <FormInput
                                type="number"
                                value={formData.opening_balance}
                                onChange={e => setFormData({ ...formData, opening_balance: e.target.value })}
                            />
                        </FormField>
                        <FormField label="Balance Type">
                            <FormSelect
                                value={formData.opening_balance_type}
                                onChange={e => setFormData({ ...formData, opening_balance_type: e.target.value })}
                            >
                                <option value="receivable">To Receive (They Owe Us)</option>
                                <option value="payable">To Pay (We Owe Them)</option>
                            </FormSelect>
                        </FormField>
                    </div>
                )}

                <FormField label="Address">
                    <FormTextarea
                        value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                    />
                </FormField>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <SecondaryButton onClick={onClose} disabled={submitting}>
                        Cancel
                    </SecondaryButton>
                    <PrimaryButton type="submit" disabled={submitting} loading={submitting}>
                        {isEditMode ? 'Update' : 'Create'} {typeLabel}
                    </PrimaryButton>
                </div>
            </form>
        </FormModal>
    );
}
