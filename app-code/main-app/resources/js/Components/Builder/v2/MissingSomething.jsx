/**
 * "Something's missing" (plan §6.6): search everything, browse all tools, or tell us.
 * Anything not ready shows as "Coming soon — notify me". Nothing is a dead end.
 */
import React, { useState } from 'react';
import { post } from './api';

export default function MissingSomething({ sessionId, onChanged, onClose, email: initialEmail = '' }) {
    const [q, setQ] = useState('');
    const [hits, setHits] = useState(null);
    const [all, setAll] = useState(null);
    const [text, setText] = useState('');
    const [email, setEmail] = useState(initialEmail || '');
    const [sent, setSent] = useState('');
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);

    const search = async (e) => {
        e?.preventDefault();
        if (q.trim().length < 2) return;
        setBusy(true);
        const r = await post('search', { session_id: sessionId, q });
        setHits(r.ok ? r.data.hits : []);
        setBusy(false);
    };

    const browse = async () => {
        setBusy(true);
        const r = await post('catalogue', { session_id: sessionId });
        setAll(r.ok ? r.data.modules : []);
        setBusy(false);
    };

    const add = async (module) => {
        setBusy(true);
        const r = await post('override', { session_id: sessionId, module, action: 'add' });
        setBusy(false);
        if (r.ok) {
            onChanged(r.data);
            setHits((h) => h && h.map((x) => (x.module === module ? { ...x, state: 'included', note: 'Added by you.' } : x)));
            setAll((a) => a && a.map((x) => (x.module === module ? { ...x, state: 'included' } : x)));
        }
    };

    const tell = async (what) => {
        setErr('');
        setBusy(true);
        const r = await post('missing', { session_id: sessionId, text: what, email: email || undefined });
        setBusy(false);
        if (r.ok) {
            setSent(r.data.message);
            setText('');
            onChanged(null);
        } else {
            setErr(r.data?.message || 'Please check the details and try again.');
        }
    };

    const Row = ({ m }) => (
        <li className="flex items-center justify-between gap-3 border-b border-line py-3">
            <span className="min-w-0">
                <span className="block text-base font-semibold text-ink">{m.label}</span>
                {m.description ? <span className="block text-xs text-ink-muted">{m.description}</span> : null}
            </span>
            {m.state === 'included' && <span className="shrink-0 text-sm text-ink-muted">{m.note || 'Already included'}</span>}
            {m.state === 'addable' && (
                <button type="button" disabled={busy} onClick={() => add(m.module)} className="min-h-[44px] shrink-0 rounded-full bg-accent-fill px-4 text-sm font-semibold text-accent-on disabled:opacity-50">
                    Add — free
                </button>
            )}
            {m.state === 'coming_soon' && (
                <button type="button" disabled={busy} onClick={() => tell(`Notify me when this is ready: ${m.label}`)} className="min-h-[44px] shrink-0 rounded-full border border-line px-4 text-sm font-semibold text-ink-secondary disabled:opacity-50">
                    Coming soon — notify me
                </button>
            )}
        </li>
    );

    return (
        <section className="mx-auto w-full max-w-2xl rounded-lg border border-line bg-surface p-5" aria-label="Something's missing">
            <div className="flex items-start justify-between">
                <h2 className="text-xl font-semibold text-ink">Something's missing?</h2>
                <button type="button" onClick={onClose} className="min-h-[44px] px-2 text-sm font-semibold text-ink-secondary">Close</button>
            </div>

            <form onSubmit={search} className="mt-3 flex gap-2">
                <label className="sr-only" htmlFor="v2-search">Search for what you need</label>
                <input id="v2-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for what you need, e.g. expiry dates, returns, delivery" className="min-h-[48px] w-full rounded-lg border border-line bg-surface px-3 text-base text-ink" />
                <button type="submit" disabled={busy} className="min-h-[48px] rounded-full bg-accent-fill px-5 text-sm font-semibold text-accent-on disabled:opacity-50">Search</button>
            </form>
            {hits && (hits.length ? <ul className="mt-2">{hits.map((m) => <Row key={m.module} m={m} />)}</ul> : <p className="mt-3 text-sm text-ink-muted">Nothing matched. Browse all tools below, or tell us what you need.</p>)}

            <div className="mt-5">
                {!all ? (
                    <button type="button" onClick={browse} disabled={busy} className="min-h-[44px] text-sm font-semibold text-accent-text underline-offset-2 hover:underline">Browse all tools</button>
                ) : (
                    <ul className="max-h-80 overflow-y-auto">{all.map((m) => <Row key={m.module} m={m} />)}</ul>
                )}
            </div>

            <div className="mt-6 border-t border-line pt-4">
                <h3 className="text-base font-semibold text-ink">Can't find it? Tell us.</h3>
                {sent ? (
                    <p className="mt-2 text-sm text-ink-secondary" role="status">{sent}</p>
                ) : (
                    <>
                        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={500} aria-label="What do you need?" className="mt-2 w-full rounded-lg border border-line bg-surface p-3 text-base text-ink" placeholder="What do you need that isn't here?" />
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email (optional)" placeholder="Email, so we can tell you if we build it (optional)" className="mt-2 min-h-[48px] w-full rounded-lg border border-line bg-surface px-3 text-base text-ink" />
                        {err && <p className="mt-2 text-sm text-danger-text" role="alert">{err}</p>}
                        <button type="button" disabled={busy || text.trim().length < 3} onClick={() => tell(text)} className="mt-3 min-h-[48px] rounded-full bg-accent-fill px-6 text-sm font-semibold text-accent-on disabled:opacity-50">Send</button>
                    </>
                )}
            </div>
        </section>
    );
}
