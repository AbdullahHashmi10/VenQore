import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { Head, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';

const title = (key) => key.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function Correct({ document }) {
    const initialStructured = useMemo(() => Object.fromEntries(
        Object.entries(document.payload || {}).filter(([, value]) => value !== null && typeof value === 'object')
    ), [document.payload]);
    const [payload, setPayload] = useState(document.payload || {});
    const [structured, setStructured] = useState(Object.fromEntries(
        Object.entries(initialStructured).map(([key, value]) => [key, JSON.stringify(value, null, 2)])
    ));
    const [amount, setAmount] = useState(document.amount || '');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        setError('');
        const nextPayload = { ...payload };
        try {
            Object.entries(structured).forEach(([key, value]) => {
                nextPayload[key] = JSON.parse(value);
            });
        } catch (parseError) {
            setError('One of the line-item sections is not valid. Check commas, brackets and values.');
            return;
        }

        setBusy(true);
        try {
            await axios.post(document.resubmit_url, {
                payload: nextPayload,
                amount: Number(amount),
                notes,
                expected_version: document.version,
            });
            router.visit(document.show_url);
        } catch (requestError) {
            const errors = requestError.response?.data?.errors;
            setError(errors ? Object.values(errors).flat().join(' ') : (requestError.response?.data?.message || 'Unable to resubmit this document.'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <OneGlanceLayout title="Correct approval request">
            <Head title={`Correct ${document.document_number}`} />
            <div className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                    <h1 className="text-xl font-bold text-gray-900">Correct and resubmit {document.document_number}</h1>
                    <p className="mt-1 text-sm text-gray-600">{title(document.document_type)}</p>
                    {document.return_notes && <p className="mt-3 text-sm text-amber-900"><strong>Reviewer note:</strong> {document.return_notes}</p>}
                    {document.return_reason_codes?.length > 0 && <p className="mt-1 text-xs text-amber-800">Reasons: {document.return_reason_codes.join(', ')}</p>}
                </div>

                <form onSubmit={submit} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700">Approval amount</label>
                        <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 w-full rounded-lg border-gray-300" required />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {Object.entries(payload).filter(([, value]) => value === null || typeof value !== 'object').map(([key, value]) => (
                            <div key={key}>
                                <label className="block text-sm font-semibold text-gray-700">{title(key)}</label>
                                <input
                                    type={typeof value === 'number' ? 'number' : (key.includes('date') ? 'date' : 'text')}
                                    step={typeof value === 'number' ? 'any' : undefined}
                                    value={value ?? ''}
                                    onChange={(e) => setPayload((current) => ({ ...current, [key]: typeof value === 'number' ? Number(e.target.value) : e.target.value }))}
                                    className="mt-1 w-full rounded-lg border-gray-300"
                                />
                            </div>
                        ))}
                    </div>

                    {Object.entries(structured).map(([key, value]) => (
                        <div key={key}>
                            <label className="block text-sm font-semibold text-gray-700">{title(key)}</label>
                            <p className="mb-1 text-xs text-gray-500">Edit the line details carefully. The system will validate them before resubmission.</p>
                            <textarea value={value} onChange={(e) => setStructured((current) => ({ ...current, [key]: e.target.value }))} rows={Math.min(18, Math.max(6, value.split('\n').length + 1))} className="w-full rounded-lg border-gray-300 font-mono text-sm" />
                        </div>
                    ))}

                    <div>
                        <label className="block text-sm font-semibold text-gray-700">What you corrected</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" maxLength="1000" className="mt-1 w-full rounded-lg border-gray-300" />
                    </div>

                    {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => router.visit(document.show_url)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold">Cancel</button>
                        <button type="submit" disabled={busy} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Resubmitting…' : 'Resubmit for approval'}</button>
                    </div>
                </form>
            </div>
        </OneGlanceLayout>
    );
}
