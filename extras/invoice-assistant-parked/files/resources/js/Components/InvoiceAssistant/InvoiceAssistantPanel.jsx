import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Sparkles, Send } from 'lucide-react';

import { Field, Sheet } from '@/Documents/DocumentShell';
import { invoiceAssistantApi } from '@/Domain/invoiceAssistant/invoiceAssistantApi';
import { useInvoiceAssistant } from '@/Domain/invoiceAssistant/useInvoiceAssistant';
import ClarificationList from './ClarificationList';
import ResolvedDraftReview from './ResolvedDraftReview';
import TranscriptReview from './TranscriptReview';
import VoiceInput from './VoiceInput';

const EXAMPLE = 'Invoice Ali Traders: 3 boxes of ABC-101 and 10 of XYZ-200, on credit, due in 15 days.';

/**
 * "Draft with assistant" — type or speak an invoice, answer any questions, and
 * open the result in the normal editor.
 *
 * The assistant only DRAFTS. It never saves, posts, approves a payment or
 * touches stock: the last button here opens the draft in a new editor tab, and
 * the operator still saves it there like any other invoice.
 */
export default function InvoiceAssistantPanel({ slug, config, money, onClose, onHandoff, api = invoiceAssistantApi }) {
    const a = useInvoiceAssistant({ slug, api });
    const limits = config?.limits || {};
    const maxChars = limits.max_input_chars || 4000;
    const voiceOn = !!config?.voice_enabled;

    const [text, setText] = useState('');
    const [reply, setReply] = useState('');
    const [transcript, setTranscript] = useState(null);   // { text, warnings, language } | null
    const [status, setStatus] = useState('');
    const taRef = useRef(null);
    const closedRef = useRef(false);
    const [confirmClose, setConfirmClose] = useState(false);

    useEffect(() => { taRef.current?.focus(); }, []);

    const draft = a.draft;
    const busy = !!a.busy;
    const phase = draft ? 'review' : transcript ? 'transcript' : 'compose';

    // Screen-reader narration of what just happened.
    useEffect(() => {
        if (a.busy === 'create') setStatus('Drafting your invoice…');
        else if (a.busy === 'message') setStatus('Updating the draft…');
        else if (a.busy === 'handoff') setStatus('Opening the invoice editor…');
        else if (a.error) setStatus(a.error.message);
        else if (draft) setStatus(draft.can_handoff ? 'The draft is ready to open in the editor.' : `${(draft.unresolved || []).length} thing${(draft.unresolved || []).length === 1 ? '' : 's'} to confirm.`);
        else setStatus('');
    }, [a.busy, a.error, draft]);

    const requestClose = useCallback(() => {
        // A reviewed draft is work: a stray click on the backdrop must not throw it away.
        if (a.draft && !confirmClose) { setConfirmClose(true); return; }
        if (closedRef.current) return;
        closedRef.current = true;
        a.discard();                       // the server drops the draft's content
        onClose?.();
    }, [a, onClose, confirmClose]);

    const submitText = async () => {
        const d = await a.start(text, 'text');
        if (d) setReply('');
    };

    const useTranscript = async (t) => {
        const d = await a.start(t, 'voice');
        if (d) { setTranscript(null); setReply(''); }
    };

    const sendReply = async () => {
        const d = await a.reply(reply);
        if (d) setReply('');
    };

    const open = async () => {
        const out = await a.handoff();
        if (out) {
            closedRef.current = true;      // handed off: do NOT discard
            onHandoff?.(out);
        }
    };

    const onKey = (fn) => (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); fn(); }
    };

    return (
        <Sheet
            title="Draft an invoice with the assistant"
            hint="Say or type who it is for and what they bought. You review it, then save it in the editor as usual."
            icon={<Sparkles size={18} />}
            width={760}
            onClose={requestClose}
        >
            <div style={{ display: 'grid', gap: 'var(--d-s5, 20px)' }}>
                <div role="status" aria-live="polite" style={{ position: 'absolute', left: '-9999px' }}>{status}</div>

                {confirmClose && (
                    <div role="alertdialog" aria-label="Discard this draft?" className="vqdoc-note" data-tone="warn" style={{ display: 'grid', gap: 'var(--d-s3, 12px)' }}>
                        <span>Discard this draft? Nothing has been saved to your books.</span>
                        <div className="vqdoc-actions">
                            <button type="button" className="vqdoc-btn" onClick={() => setConfirmClose(false)}>Keep working</button>
                            <button type="button" className="vqdoc-btn danger" onClick={requestClose}>Discard draft</button>
                        </div>
                    </div>
                )}

                {a.error && (
                    <div role="alert" className="vqdoc-note" data-tone="warn" style={{ display: 'grid', gap: 'var(--d-s2, 8px)' }}>
                        <span>{a.error.message}</span>
                        {a.error.retryable && phase === 'compose' && (
                            <span><button type="button" className="vqdoc-btn xs" onClick={submitText}>Try again</button></span>
                        )}
                        {a.error.code === 'stale_revision' && <span>The latest version of the draft is shown below.</span>}
                    </div>
                )}

                {phase === 'compose' && (
                    <>
                        <Field label="Describe the invoice" span={12} hint={`Ctrl+Enter to draft · ${text.length}/${maxChars}`}>
                            <textarea
                                ref={taRef}
                                className="vqdoc-in"
                                dir="auto"
                                rows={5}
                                maxLength={maxChars}
                                value={text}
                                placeholder={EXAMPLE}
                                disabled={busy}
                                onChange={(e) => setText(e.target.value)}
                                onKeyDown={onKey(() => text.trim().length >= 2 && !busy && submitText())}
                            />
                        </Field>
                        <div className="vqdoc-actions">
                            {voiceOn && <VoiceInput slug={slug} limits={limits} disabled={busy} onTranscript={setTranscript} api={api} />}
                            <button type="button" className="vqdoc-btn pri" disabled={busy || text.trim().length < 2} onClick={submitText}>
                                <Send size={16} aria-hidden="true" /> {busy ? 'Drafting…' : 'Draft the invoice'}
                            </button>
                        </div>
                        <p style={{ margin: 0, color: 'var(--vq-text-2)' }}>
                            The assistant never saves or posts anything. Prices come from your catalogue, not from the assistant.
                        </p>
                    </>
                )}

                {phase === 'transcript' && (
                    <TranscriptReview
                        initialText={transcript.text}
                        warnings={transcript.warnings}
                        language={transcript.language}
                        busy={busy}
                        maxChars={maxChars}
                        onUse={useTranscript}
                        onRetry={() => setTranscript(null)}
                    />
                )}

                {phase === 'review' && (
                    <>
                        <ClarificationList unresolved={draft.unresolved} busy={busy} onChoose={a.choose} />
                        <ResolvedDraftReview draft={draft} money={money} />

                        <Field label={draft.unresolved?.length ? 'Answer or change something' : 'Change something'} span={12}
                            hint="For example: “make the second one 12”, “on cash instead”, “add 2 of ABC-300”. Ctrl+Enter to send.">
                            <textarea
                                className="vqdoc-in"
                                dir="auto"
                                rows={2}
                                maxLength={maxChars}
                                value={reply}
                                disabled={busy}
                                onChange={(e) => setReply(e.target.value)}
                                onKeyDown={onKey(sendReply)}
                            />
                        </Field>
                        <div className="vqdoc-actions">
                            <button type="button" className="vqdoc-btn" disabled={busy} onClick={() => { a.discard(); setTranscript(null); }}>Start over</button>
                            <button type="button" className="vqdoc-btn" disabled={busy || !reply.trim()} onClick={sendReply}>Send</button>
                            <button type="button" className="vqdoc-btn pri" disabled={busy || !draft.can_handoff} onClick={open}
                                title={draft.can_handoff ? 'Open this draft in the invoice editor' : 'Answer the questions above first'}>
                                {a.busy === 'handoff' ? 'Opening…' : 'Open in the invoice editor'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Sheet>
    );
}
