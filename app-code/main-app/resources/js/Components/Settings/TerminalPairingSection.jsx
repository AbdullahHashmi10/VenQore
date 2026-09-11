import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Copy, Monitor, Plus, Trash2, RefreshCw } from 'lucide-react';
import SectionHeader from '@/Components/SectionHeader';

/**
 * Terminal pairing (2026-09-10).
 *
 * VenQore Station needs a one-time pairing code before it can talk to this
 * store. The owner/admin creates a code here and types it into the Station
 * setup screen. The code works once and expires (default 60 minutes). On first
 * use the server gives the terminal its own device secret; the code is then spent.
 */
export default function TerminalPairingSection({ storeSlug }) {
    const [tokens, setTokens] = useState([]);
    const [label, setLabel] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(null);
    const [terminals, setTerminals] = useState([]);

    const load = useCallback(async () => {
        try {
            const res = await axios.get(route('store.terminal-pairing.index', { store_slug: storeSlug }));
            setError('');
            setTokens(res.data?.tokens || []);
            const t = await axios.get(route('store.terminals.index', { store_slug: storeSlug }));
            setTerminals(t.data?.terminals || []);
        } catch (e) {
            setError(e.response?.status === 403 ? 'Only owners and admins can pair terminals.' : 'Could not load pairing codes.');
        }
    }, [storeSlug]);

    // Fetch on mount. The state updates happen after the request resolves,
    // inside the promise callback — not synchronously in the effect body.
    useEffect(() => {
        const t = setTimeout(load, 0);
        return () => clearTimeout(t);
    }, [load]);

    const create = async () => {
        setLoading(true);
        setError('');
        try {
            await axios.post(route('store.terminal-pairing.store', { store_slug: storeSlug }), {
                label: label.trim() || null,
                ttl_minutes: 60,
            });
            setLabel('');
            await load();
        } catch (e) {
            setError(e.response?.data?.message || 'Could not create a pairing code.');
        } finally {
            setLoading(false);
        }
    };

    const revoke = async (id) => {
        try {
            await axios.delete(route('store.terminal-pairing.destroy', { store_slug: storeSlug, id }));
            await load();
        } catch (e) {
            setError('Could not cancel that code.');
        }
    };

    const disconnect = async (id) => {
        if (!window.confirm('Disconnect this terminal? It will need a new pairing code.')) return;
        try {
            await axios.post(route('store.terminals.revoke', { store_slug: storeSlug, id }));
            await load();
        } catch (e) {
            setError('Could not disconnect that terminal.');
        }
    };

    const copy = async (code) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(code);
            window.setTimeout(() => setCopied(null), 1500);
        } catch (e) { /* clipboard blocked — the code is visible anyway */ }
    };

    return (
        <div className="bg-surface rounded-2xl border border-line p-6">
            <SectionHeader
                title="Terminals (VenQore Station)"
                description="Create a one-time code, then enter it on the Station setup screen. Each code works once and expires after 60 minutes."
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end mb-5">
                <label className="flex-1 text-sm text-ink-secondary">
                    Terminal name (optional)
                    <input
                        type="text"
                        value={label}
                        maxLength={100}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="Front counter"
                        className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
                    />
                </label>
                <button
                    type="button"
                    onClick={create}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-accent-fill px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                    {loading ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
                    Create pairing code
                </button>
            </div>

            {error && <p role="alert" className="mb-4 text-sm text-danger-700">{error}</p>}

            {tokens.length === 0 ? (
                <p className="text-sm text-ink-muted">No active pairing codes.</p>
            ) : (
                <ul className="divide-y divide-line rounded-md border border-line">
                    {tokens.map((t) => (
                        <li key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                            <Monitor size={16} className="text-ink-muted" aria-hidden="true" />
                            <code className="font-numeric text-base tracking-widest text-ink select-all">{t.token}</code>
                            <span className="text-sm text-ink-muted">{t.label || 'Unnamed terminal'}</span>
                            <span className="ml-auto text-xs text-ink-muted">
                                {t.expires_at ? `expires ${new Date(t.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                            </span>
                            <button type="button" onClick={() => copy(t.token)} className="rounded-md p-2 hover:bg-interactive-hover" aria-label="Copy code">
                                <Copy size={16} />{copied === t.token && <span className="sr-only">Copied</span>}
                            </button>
                            <button type="button" onClick={() => revoke(t.id)} className="rounded-md p-2 hover:bg-interactive-hover" aria-label="Cancel code">
                                <Trash2 size={16} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            <h4 className="mt-6 mb-2 text-sm font-semibold text-ink">Paired terminals</h4>
            {terminals.length === 0 ? (
                <p className="text-sm text-ink-muted">No terminals paired yet.</p>
            ) : (
                <ul className="divide-y divide-line rounded-md border border-line">
                    {terminals.map((t) => (
                        <li key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                            <Monitor size={16} className="text-ink-muted" aria-hidden="true" />
                            <span className="text-sm text-ink">{t.name}</span>
                            <span className="text-xs text-ink-muted">
                                {t.last_heartbeat_at ? `last seen ${new Date(t.last_heartbeat_at).toLocaleString()}` : 'never seen'}
                            </span>
                            <button type="button" onClick={() => disconnect(t.id)} className="ml-auto rounded-md px-3 py-1 text-sm text-danger-700 hover:bg-interactive-hover">
                                Disconnect
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
