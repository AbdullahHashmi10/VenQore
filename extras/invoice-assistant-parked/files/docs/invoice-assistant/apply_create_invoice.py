#!/usr/bin/env python3
"""Anchored, idempotent patch of resources/js/Pages/Sales/CreateInvoice.jsx for the invoice assistant.
usage: python3 apply_create_invoice.py [path]   (default resources/js/Pages/Sales/CreateInvoice.jsx)"""
import sys, io

path = sys.argv[1] if len(sys.argv) > 1 else 'resources/js/Pages/Sales/CreateInvoice.jsx'
raw = open(path, 'rb').read().decode('utf-8')
if 'InvoiceAssistantPanel' in raw:
    print('SKIP already applied'); sys.exit(0)
crlf = '\r\n' in raw
s = raw.replace('\r\n', '\n')

def sub(anchor, new, where='replace'):
    global s
    c = s.count(anchor)
    if c != 1:
        sys.exit('ANCHOR COUNT %d != 1: %r' % (c, anchor[:80]))
    if where == 'replace': s = s.replace(anchor, new)
    elif where == 'after': s = s.replace(anchor, anchor + new)
    elif where == 'before': s = s.replace(anchor, new + anchor)

# A. imports
sub("import { Printer, Trash2, TrendingUp, CheckCircle2, Wallet, Coins, Plus, X } from 'lucide-react';",
    "import { Printer, Trash2, TrendingUp, CheckCircle2, Wallet, Coins, Plus, X, Sparkles } from 'lucide-react';")
sub("import { documentType } from '@/Documents/documentTypes';\n",
"""
import InvoiceAssistantPanel from '@/Components/InvoiceAssistant/InvoiceAssistantPanel';
import { invoiceAssistantApi } from '@/Domain/invoiceAssistant/invoiceAssistantApi';
import { buildInvoiceFromPrefill, describeHandoff } from '@/Domain/invoiceAssistant/draftToDocument';
""", 'after')

# B. props
sub("export default function CreateInvoice({ sale, aiPrefill, approval_correction = null }) {",
    "export default function CreateInvoice({ sale, aiPrefill, approval_correction = null, assistantDraftId = null }) {")

# C. assistant logic, after `current` exists (still above the early return)
sub("    const current = drafts.current;\n", """
    /* ── the invoice assistant ───────────────────────────────────────────
       Typed or spoken text becomes a DRAFT on the server. Handing it off does
       not post anything: the draft is claimed here, becomes a NEW tab in the
       workspace like any other, and is saved with the normal Save button — with
       the same approval rules, stock check and ledger as a hand-typed invoice.
       The server's claim is acknowledged only after the tab exists, so a crash
       half-way through can be recovered instead of losing the draft. */
    const [assistantOpen, setAssistantOpen] = useState(false);
    const [assistantConfig, setAssistantConfig] = useState(null);
    const [assistantInfo, setAssistantInfo] = useState({});
    const assistantSeen = useRef(new Set());
    const assistantAck = useRef(null);

    useEffect(() => {
        if (isEdit || approval_correction || !store?.slug) return undefined;
        const ctl = new AbortController();
        invoiceAssistantApi.getConfig(store.slug, { signal: ctl.signal })
            .then((c) => setAssistantConfig(c))
            .catch(() => setAssistantConfig(null));
        return () => ctl.abort();
    }, [isEdit, approval_correction, store?.slug]);

    const claimAssistantDraft = async (draftId) => {
        if (!draftId || !store?.slug || assistantSeen.current.has(draftId)) return;
        if ((ws.activeInvoices || []).some((x) => x.assistantDraftId === draftId)) return;
        assistantSeen.current.add(draftId);
        try {
            const claimed = await invoiceAssistantApi.claim(store.slug, draftId);
            const built = buildInvoiceFromPrefill(claimed.prefill, {
                blankLine, uid, today, availableOf, defaultTax: settings?.default_tax_rate,
            });
            assistantAck.current = { draftId, token: claimed.claim_token };
            drafts.add(built.invoice);
            setAssistantInfo((m) => ({ ...m, [draftId]: describeHandoff(built) }));
        } catch (e) {
            assistantSeen.current.delete(draftId);
            showAlert({
                title: 'Could not open the assistant’s draft',
                message: e?.code === 'unsupported_prefill'
                    ? 'This draft was made by a different version of the assistant. Please create it again.'
                    : (e?.message || 'Something went wrong.'),
                type: 'warning',
            });
        }
    };

    /* Acknowledge once the new tab is really in the workspace. */
    useEffect(() => {
        const p = assistantAck.current;
        if (!p || !store?.slug) return;
        if (!(ws.activeInvoices || []).some((x) => x.assistantDraftId === p.draftId)) return;
        assistantAck.current = null;
        const send = (n) => invoiceAssistantApi.acknowledge(store.slug, p.draftId, p.token)
            .catch((e) => { if (n < 2 && e?.retryable) setTimeout(() => send(n + 1), 1500 * (n + 1)); });
        send(0);
    }, [ws.activeInvoices, store?.slug]);

    /* Arrived by link (?assistant_draft=…): claim it, then drop the parameter so
       a refresh does not try to claim it a second time. */
    useEffect(() => {
        if (isEdit || !assistantDraftId) return;
        claimAssistantDraft(assistantDraftId).finally(() => {
            try {
                const u = new URL(window.location.href);
                if (u.searchParams.has('assistant_draft')) {
                    u.searchParams.delete('assistant_draft');
                    window.history.replaceState(window.history.state, '', u.pathname + u.search + u.hash);
                }
            } catch (_) { /* cosmetic only */ }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assistantDraftId, isEdit]);
""", 'after')

# D. never auto-settle an assistant draft
sub("""                settleDefault={(d, totals) => (
                    settings?.pos_auto_fill_cash === '1' && d.paymentMethod === 'cash'
                        ? totals.grandTotal
                        : 0
                )}""",
"""                settleDefault={(d, totals) => (
                    /* An assistant draft is never settled for the operator: the
                       amount is whatever was STATED in the request, else 0. */
                    d.assistantDraftId
                        ? num(d.assistantStatedPaid)
                        : (settings?.pos_auto_fill_cash === '1' && d.paymentMethod === 'cash'
                            ? totals.grandTotal
                            : 0)
                )}""")

# E. banner
sub("    return (\n        <>\n            <MoneyDocument\n", """    const assistantTab = !isEdit && !approval_correction && current?.assistantDraftId && current?.status !== 'completed'
        ? (assistantInfo[current.assistantDraftId] || {
            text: 'Drafted by the assistant. Nothing is saved yet — check every line, price and payment, then save as usual.',
            notices: [], statedPayment: false,
        })
        : null;
    const assistantBanner = assistantTab ? (
        <div className="vqdoc-note" data-tone="warn">
            <span className="eyebrow">Drafted by the assistant</span>
            <span>{assistantTab.text}</span>
            {assistantTab.statedPayment && <span>A payment was filled in as you said — confirm the account it goes into before you save.</span>}
            {(assistantTab.notices || []).map((n, i) => <span key={i}>{n}</span>)}
        </div>
    ) : null;

""", 'before')
sub("                notice={approval_correction ? (", "                notice={assistantBanner || (approval_correction ? (")
sub("                ) : null)}\n                url={({ d }) =>", "                ) : null))}\n                url={({ d }) =>")

# F. payload
sub("                    if (!idemRef.current[d.id]) idemRef.current[d.id] = uid();\n",
"""                    /* An assistant tab keeps its key on the tab itself, so a
                       reload after a timed-out save still retries the SAME sale
                       instead of posting a second one. */
                    if (!idemRef.current[d.id]) idemRef.current[d.id] = d.idemKey || uid();
                    if (!isEdit && d.assistantDraftId && d.idemKey !== idemRef.current[d.id]) {
                        ws.updateInvoice(d.id, { idemKey: idemRef.current[d.id] });
                    }
""")
sub("                        source: 'manual',\n",
    "                        source: 'manual',\n                        ...(!isEdit && d.assistantDraftId ? { assistant_draft_id: d.assistantDraftId } : {}),\n", 'replace')

# G. toolbar button
sub("""                extraTools={(
                    <button type="button" className="vqdoc-icon" title="What this sale is making"
                        onClick={() => setMarginOpen(true)}>
                        <TrendingUp size={17} />
                    </button>
                )}""",
"""                extraTools={(
                    <>
                        {assistantConfig?.enabled && !isEdit && !approval_correction && !posted && (
                            <button type="button" className="vqdoc-icon" title="Draft this invoice by typing or speaking"
                                aria-label="Draft with the assistant" onClick={() => setAssistantOpen(true)}>
                                <Sparkles size={17} />
                            </button>
                        )}
                        <button type="button" className="vqdoc-icon" title="What this sale is making"
                            onClick={() => setMarginOpen(true)}>
                            <TrendingUp size={17} />
                        </button>
                    </>
                )}""")

# H. panel
sub("            <InvoiceTourGuide store={store} />\n", """            {assistantOpen && (
                <InvoiceAssistantPanel
                    slug={store?.slug}
                    config={assistantConfig}
                    money={money}
                    onClose={() => setAssistantOpen(false)}
                    onHandoff={(out) => { setAssistantOpen(false); claimAssistantDraft(out?.draft_id); }}
                />
            )}

""", 'before')

out = s.replace('\n', '\r\n') if crlf else s
open(path, 'wb').write(out.encode('utf-8'))
print('OK', path)
