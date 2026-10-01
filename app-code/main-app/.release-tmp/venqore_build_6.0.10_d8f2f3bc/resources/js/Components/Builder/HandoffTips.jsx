/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  HandoffTips — what to do with it, shown while it is being built.         ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Provisioning takes a few seconds and those seconds are otherwise dead. This
 * is the one moment in the whole funnel where a user is BOTH committed and
 * idle, which makes it the best place in the product to explain the two
 * features that change how the software feels to use — and the worst place to
 * show a spinner and nothing else.
 *
 * Both of these are things a new user would otherwise discover in month three,
 * or never. Told here, they land as "this thing will save me time", which is a
 * far better first impression than a list of modules.
 *
 * ── No numbers ─────────────────────────────────────────────────────────────
 * The allowance is per-plan and lives in `config/ai_limits.php`. It is
 * described here, never quantified, because a figure typed into a component is
 * a figure that goes stale the first time pricing moves — and the repo rule is
 * that a tenant-facing screen never shows a number that did not come from the
 * source of truth.
 */

import React from 'react';
import { motion } from 'motion/react';
import { MessageSquare, ScanLine } from 'lucide-react';

const TIPS = [
    {
        icon: ScanLine,
        title: 'Stop typing things in',
        body: 'Photograph a supplier bill, a handwritten order slip or a WhatsApp screenshot — even send a voice note — and Smart Capture turns it into a real entry, costed and posted. Your plan includes a monthly allowance for it.',
    },
    {
        icon: MessageSquare,
        title: 'Just ask',
        body: 'Vena sits in the header. Ask in plain words — "what did I sell last Tuesday", "why is my margin down", "add a card for unpaid invoices" — and it answers from your own ledger rather than sending you to hunt for a report.',
    },
];

export default function HandoffTips({ className = '' }) {
    return (
        <div className={`text-left ${className}`}>
            <p className="mb-3 text-3xs font-semibold uppercase tracking-widest text-ink-muted">
                While that finishes — two things worth knowing
            </p>
            <div className="space-y-2.5">
                {TIPS.map((tip, i) => (
                    <motion.div
                        key={tip.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.4,
                            delay: 0.5 + i * 0.35,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        className="flex items-start gap-3 rounded-lg border border-line bg-surface p-4"
                    >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-quiet text-accent-text">
                            <tip.icon size={17} strokeWidth={1.9} />
                        </span>
                        <span className="min-w-0">
                            <span className="block text-sm font-semibold text-ink">
                                {tip.title}
                            </span>
                            <span className="mt-1 block text-xs leading-relaxed text-ink-secondary">
                                {tip.body}
                            </span>
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
