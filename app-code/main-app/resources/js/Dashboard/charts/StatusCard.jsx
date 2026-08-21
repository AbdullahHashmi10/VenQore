import React from 'react';
import { AlertTriangle, CheckCircle2, HelpCircle, XCircle } from 'lucide-react';

/**
 * StatusCard — a state, in a word.
 *
 * ── §2 · nothing meaningful is colour alone ─────────────────────────────────
 *
 * A status gets an icon AND a word, always. Roughly 1 in 12 men cannot reliably
 * separate the red from the green, and a red dot and a green dot are the same
 * dot to them — so the icon shape differs (a tick, a triangle, a cross) and the
 * word is always printed.
 *
 * The old version painted each severity with a nine-class Tailwind pigment
 * string the product does not own, and then hard-coded two checks — "General
 * Ledger Structure Ok" and "Debits Match Credits" — into every status card
 * regardless of what it was showing. Those come from the reading now, or they
 * do not appear.
 */

const TONES = {
    ok:      { className: 'vqc-dot--ok',   Icon: CheckCircle2,  chip: 'vqc-chip--ok' },
    warning: { className: 'vqc-dot--warn', Icon: AlertTriangle, chip: 'vqc-chip--warn' },
    danger:  { className: 'vqc-dot--bad',  Icon: XCircle,       chip: 'vqc-chip--bad' },
    neutral: { className: '',              Icon: HelpCircle,    chip: '' },
};

export default function StatusCard({ data }) {
    const severity = data?.severity || 'neutral';
    const tone = TONES[severity] || TONES.neutral;
    const label = data?.label || 'Unknown';
    const checks = Array.isArray(data?.checks) ? data.checks : [];

    return (
        <div className="vqc-status">
            <span className={`vqc-dot ${tone.className}`.trim()}>
                <i aria-hidden="true" />
                <span>{label}</span>
            </span>

            {data?.detail && <p className="vqc-ctx">{data.detail}</p>}

            {checks.length > 0 && (
                <ul className="vqc-checks">
                    {checks.map((check, i) => {
                        const ok = check.ok ?? check.passed ?? true;
                        const CheckIcon = ok ? CheckCircle2 : XCircle;
                        return (
                            <li key={check.label ?? i} className={ok ? '' : 'is-bad'}>
                                <CheckIcon size={12} aria-hidden="true" />
                                <span>{check.label ?? String(check)}</span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
