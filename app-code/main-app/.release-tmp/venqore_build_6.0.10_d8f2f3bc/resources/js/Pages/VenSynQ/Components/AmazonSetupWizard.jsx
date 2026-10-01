import React, { useState, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { role, vq } from '@/theme/runtime';
import {
    ChevronRight, ChevronLeft, CheckCircle2, AlertCircle,
    KeyRound, Store, ShieldCheck, Loader2, ExternalLink,
} from 'lucide-react';

/**
 * AmazonSetupWizard — T16 §2 "frictionless 3-step wizard".
 *
 * Sits ALONGSIDE the existing OAuth redirect rather than replacing it. Sellers
 * running a self-authorized SP-API application hold LWA credentials directly and
 * never see a consent screen, so the redirect flow is a dead end for them.
 *
 * Step 3 calls a validate-only endpoint that performs a real LWA refresh-token
 * grant and returns pass/fail WITHOUT persisting anything — a bad key pair can
 * never be saved as a "connected" channel that then fails silently at 3am.
 */

const STEPS = [
    { key: 'client',  title: 'LWA Application', icon: KeyRound,    hint: 'From Seller Central → Develop Apps' },
    { key: 'token',   title: 'Refresh Token',   icon: ShieldCheck, hint: 'Generated when you authorize your app' },
    { key: 'seller',  title: 'Seller ID',       icon: Store,       hint: 'Your Merchant Token' },
];

const AMAZON_MARKETPLACES = [
    {
        region: 'eu',
        title: 'Europe',
        markets: [
            { value: 'uk', label: 'United Kingdom', desc: '.co.uk' },
            { value: 'de', label: 'Germany', desc: '.de' },
            { value: 'fr', label: 'France', desc: '.fr' },
            { value: 'it', label: 'Italy', desc: '.it' },
            { value: 'es', label: 'Spain', desc: '.es' },
            { value: 'nl', label: 'Netherlands', desc: '.nl' },
            { value: 'se', label: 'Sweden', desc: '.se' },
            { value: 'pl', label: 'Poland', desc: '.pl' },
            { value: 'be', label: 'Belgium', desc: '.com.be' },
            { value: 'tr', label: 'Turkey', desc: '.com.tr' },
        ]
    },
    {
        region: 'na',
        title: 'North America',
        markets: [
            { value: 'us', label: 'United States', desc: '.com' },
            { value: 'ca', label: 'Canada', desc: '.ca' },
            { value: 'mx', label: 'Mexico', desc: '.com.mx' },
            { value: 'br', label: 'Brazil', desc: '.com.br' },
        ]
    },
    {
        region: 'me_in',
        title: 'Middle East & India',
        markets: [
            { value: 'in', label: 'India', desc: '.in' },
            { value: 'ae', label: 'UAE / Dubai', desc: '.ae' },
            { value: 'sa', label: 'Saudi Arabia', desc: '.sa' },
            { value: 'eg', label: 'Egypt', desc: '.com.eg' },
            { value: 'za', label: 'South Africa', desc: '.co.za' },
        ]
    },
    {
        region: 'apac',
        title: 'Asia-Pacific',
        markets: [
            { value: 'jp', label: 'Japan', desc: '.co.jp' },
            { value: 'au', label: 'Australia', desc: '.com.au' },
            { value: 'sg', label: 'Singapore', desc: '.sg' },
        ]
    }
];

const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    background: '#0a1220', border: '1px solid #1e3a5f',
    color: vq.slate[100], fontSize: 13, outline: 'none',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
};

const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 700, color: vq.slate[400],
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6,
};

export default function AmazonSetupWizard({ storeSlug, onClose }) {
    const [step, setStep] = useState(0);
    const [form, setForm] = useState({
        client_id: '', client_secret: '', refresh_token: '', seller_id: '', name: '', region: 'uk',
    });
    const [activeRegionTab, setActiveRegionTab] = useState('eu');
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const set = (key) => (e) => {
        setForm((f) => ({ ...f, [key]: e.target.value }));
        // Any credential edit invalidates a previous test result — showing a
        // stale green tick against changed values would be actively misleading.
        setTestResult(null);
    };

    // Per-step gate. Prevents advancing with blank fields, which is what made
    // the old single-page form fail server-side after the user had walked away.
    const canAdvance = useCallback(() => {
        if (step === 0) return form.client_id.trim() !== '' && form.client_secret.trim() !== '';
        if (step === 1) return form.refresh_token.trim() !== '';
        return form.seller_id.trim() !== '';
    }, [step, form]);

    const handleTest = useCallback(async () => {
        setTesting(true);
        setTestResult(null);

        try {
            const res = await fetch(route('store.vensynq.amazon.test', { store_slug: storeSlug }), {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content ?? '',
                },
                body: JSON.stringify({
                    client_id: form.client_id,
                    client_secret: form.client_secret,
                    refresh_token: form.refresh_token,
                }),
            });

            const data = await res.json();
            setTestResult(data);
        } catch (e) {
            setTestResult({ ok: false, message: 'Could not reach the server. Check your connection and retry.' });
        } finally {
            setTesting(false);
        }
    }, [form, storeSlug]);

    const handleSave = useCallback(() => {
        setSaving(true);
        setErrors({});

        router.post(
            route('store.vensynq.amazon.store', { store_slug: storeSlug }),
            form,
            {
                preserveScroll: true,
                onError: (errs) => setErrors(errs),
                onFinish: () => setSaving(false),
            },
        );
    }, [form, storeSlug]);

    const StepIcon = STEPS[step].icon;

    return (
        <div style={{
            background: 'linear-gradient(135deg, #0d1e36 0%, #091220 100%)',
            border: '1px solid #1e3a5f', borderRadius: 14, padding: 22,
            display: 'flex', flexDirection: 'column', gap: 18,
        }}>
            {/* ── Stepper ──────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                {STEPS.map((s, i) => {
                    const done   = i < step;
                    const active = i === step;

                    return (
                        <React.Fragment key={s.key}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '7px 12px', borderRadius: 999,
                                background: active ? '#12233f' : 'transparent',
                                border: `1px solid ${active ? '#2f5c96' : done ? role.success[800] : vq.slate[800]}`,
                                minWidth: 0,
                            }}>
                                <span style={{
                                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: done ? role.success[600] : active ? 'rgb(var(--vq-blue-500))' : vq.slate[800],
                                    color: '#fff', fontSize: 10, fontWeight: 700,
                                }}>
                                    {done ? <CheckCircle2 size={12} /> : i + 1}
                                </span>
                                <span style={{
                                    fontSize: 12, fontWeight: 600,
                                    color: active ? vq.slate[100] : done ? role.success[400] : vq.slate[500],
                                    whiteSpace: 'nowrap',
                                }}>
                                    {s.title}
                                </span>
                            </div>
                            {i < STEPS.length - 1 && <ChevronRight size={13} color={vq.slate[700]} />}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* ── Step body ────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <StepIcon size={16} color="#60a5fa" />
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: vq.slate[100] }}>{STEPS[step].title}</div>
                        <div style={{ fontSize: 11, color: vq.slate[500] }}>{STEPS[step].hint}</div>
                    </div>
                </div>

                {step === 0 && (
                    <>
                        <div>
                            <label style={labelStyle} htmlFor="amz-client-id">LWA Client ID</label>
                            <input
                                id="amz-client-id"
                                style={inputStyle}
                                value={form.client_id}
                                onChange={set('client_id')}
                                placeholder="amzn1.application-oa2-client.…"
                                autoComplete="off"
                                spellCheck={false}
                            />
                        </div>
                        <div>
                            <label style={labelStyle} htmlFor="amz-client-secret">LWA Client Secret</label>
                            <input
                                id="amz-client-secret"
                                style={inputStyle}
                                type="password"
                                value={form.client_secret}
                                onChange={set('client_secret')}
                                placeholder="amzn1.oa2-cs.v1.…"
                                autoComplete="new-password"
                                spellCheck={false}
                            />
                        </div>
                        <a
                            href="https://sellercentral.amazon.com/sellingpartner/developerconsole"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgb(var(--vq-blue-400))', textDecoration: 'none' }}
                        >
                            Open Amazon Developer Console <ExternalLink size={11} />
                        </a>
                    </>
                )}

                {step === 1 && (
                    <div>
                        <label style={labelStyle} htmlFor="amz-refresh">Refresh Token</label>
                        <textarea
                            id="amz-refresh"
                            style={{ ...inputStyle, minHeight: 84, resize: 'vertical', lineHeight: 1.5 }}
                            value={form.refresh_token}
                            onChange={set('refresh_token')}
                            placeholder="Atzr|IwEBI…"
                            autoComplete="off"
                            spellCheck={false}
                        />
                        <p style={{ margin: '7px 0 0', fontSize: 11, color: vq.slate[500], lineHeight: 1.5 }}>
                            This is issued once when you authorize your application. VenQore encrypts it at
                            rest and rotates the short-lived access token automatically every 10 minutes.
                        </p>
                    </div>
                )}

                {step === 2 && (
                    <>
                        <div>
                            <label style={labelStyle} htmlFor="amz-seller">Seller ID (Merchant Token)</label>
                            <input
                                id="amz-seller"
                                style={inputStyle}
                                value={form.seller_id}
                                onChange={set('seller_id')}
                                placeholder="A1BCDEFGHIJKLM"
                                autoComplete="off"
                                spellCheck={false}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Amazon Region / Marketplace</label>
                            
                            {/* Region Tabs */}
                            <div style={{ display: 'flex', borderBottom: '1px solid #1e3a5f', marginBottom: 12, gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
                                {AMAZON_MARKETPLACES.map((group) => {
                                    const isActive = activeRegionTab === group.region;
                                    return (
                                        <button
                                            key={group.region}
                                            type="button"
                                            onClick={() => setActiveRegionTab(group.region)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                                                color: isActive ? '#fff' : 'rgb(var(--vq-slate-500))',
                                                fontWeight: isActive ? 700 : 500,
                                                padding: '4px 2px 6px 2px',
                                                fontSize: 11,
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap',
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            {group.title}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Marketplaces list */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxHeight: 180, overflowY: 'auto', padding: '2px 4px' }}>
                                {AMAZON_MARKETPLACES.find(g => g.region === activeRegionTab)?.markets.map((reg) => {
                                    const isSelected = form.region === reg.value;
                                    return (
                                        <button
                                            key={reg.value}
                                            type="button"
                                            onClick={() => setForm((f) => ({ ...f, region: reg.value }))}
                                            style={{
                                                padding: '12px 10px',
                                                borderRadius: 8,
                                                background: isSelected ? '#12233f' : '#0a1220',
                                                border: isSelected ? '1px solid #3b82f6' : '1px solid #1e3a5f',
                                                color: '#fff',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                transition: 'all 0.2s ease',
                                                boxShadow: isSelected ? '0 0 10px rgba(59, 130, 246, 0.15)' : 'none',
                                            }}
                                        >
                                            <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? 'rgb(var(--vq-blue-400))' : vq.slate[100], marginBottom: 2 }}>
                                                {reg.label}
                                            </div>
                                            <div style={{ fontSize: 9, color: isSelected ? vq.slate[300] : 'rgb(var(--vq-slate-500))' }}>
                                                {reg.desc}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle} htmlFor="amz-name">Channel Name (optional)</label>
                            <input
                                id="amz-name"
                                style={{ ...inputStyle, fontFamily: 'inherit' }}
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                placeholder="Amazon UK — Main Store"
                            />
                        </div>

                        {/* Test Connection lives on the final step so it can
                            validate the complete credential set in one call. */}
                        <button
                            onClick={handleTest}
                            disabled={testing || !form.client_id || !form.client_secret || !form.refresh_token}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                padding: '10px 16px', borderRadius: 9, border: '1px solid #2f5c96',
                                background: testing ? vq.slate[800] : '#12233f',
                                color: testing ? vq.slate[500] : '#93c5fd',
                                fontSize: 13, fontWeight: 600,
                                cursor: testing ? 'wait' : 'pointer', width: '100%',
                            }}
                        >
                            {testing ? <Loader2 size={14} className="spin" /> : <ShieldCheck size={14} />}
                            {testing ? 'Contacting Amazon…' : 'Test Connection'}
                        </button>

                        {testResult && (
                            <div style={{
                                display: 'flex', alignItems: 'flex-start', gap: 8,
                                padding: '11px 13px', borderRadius: 9,
                                background: testResult.ok ? role.success[950] : role.danger[950],
                                border: `1px solid ${testResult.ok ? role.success[800] : role.danger[800]}`,
                            }}>
                                {testResult.ok
                                    ? <CheckCircle2 size={14} color={role.success[400]} style={{ flexShrink: 0, marginTop: 1 }} />
                                    : <AlertCircle size={14} color={role.danger[400]} style={{ flexShrink: 0, marginTop: 1 }} />}
                                <span style={{
                                    fontSize: 12, lineHeight: 1.5,
                                    color: testResult.ok ? role.success[300] : role.danger[300],
                                }}>
                                    {testResult.message}
                                </span>
                            </div>
                        )}

                        {Object.values(errors).length > 0 && (
                            <div style={{
                                padding: '11px 13px', borderRadius: 9,
                                background: role.danger[950], border: `1px solid ${role.danger[800]}`,
                                color: role.danger[300], fontSize: 12, lineHeight: 1.5,
                            }}>
                                {Object.values(errors).join(' ')}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── Footer navigation ────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                    onClick={() => (step === 0 ? onClose?.() : setStep((s) => s - 1))}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '9px 15px', borderRadius: 8,
                        background: 'transparent', border: `1px solid ${vq.slate[800]}`,
                        color: vq.slate[400], fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                >
                    <ChevronLeft size={13} /> {step === 0 ? 'Cancel' : 'Back'}
                </button>

                {step < STEPS.length - 1 ? (
                    <button
                        onClick={() => setStep((s) => s + 1)}
                        disabled={!canAdvance()}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '9px 20px', borderRadius: 8, border: 'none',
                            background: canAdvance() ? 'linear-gradient(135deg, rgb(var(--vq-blue-500)), #1d4ed8)' : vq.slate[800],
                            color: canAdvance() ? '#fff' : vq.slate[600],
                            fontSize: 12, fontWeight: 700,
                            cursor: canAdvance() ? 'pointer' : 'not-allowed',
                        }}
                    >
                        Continue <ChevronRight size={13} />
                    </button>
                ) : (
                    <button
                        onClick={handleSave}
                        disabled={saving || !canAdvance()}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '9px 20px', borderRadius: 8, border: 'none',
                            background: saving || !canAdvance()
                                ? vq.slate[800]
                                : 'linear-gradient(135deg, rgb(var(--vq-emerald-600)), rgb(var(--vq-emerald-700)))',
                            color: saving || !canAdvance() ? vq.slate[600] : '#fff',
                            fontSize: 12, fontWeight: 700,
                            cursor: saving ? 'wait' : canAdvance() ? 'pointer' : 'not-allowed',
                        }}
                    >
                        {saving ? <Loader2 size={13} className="spin" /> : <CheckCircle2 size={13} />}
                        {saving ? 'Connecting…' : 'Connect Amazon'}
                    </button>
                )}
            </div>
        </div>
    );
}
