import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Square, X } from 'lucide-react';
import { useVoiceRecorder } from '@/Domain/invoiceAssistant/useVoiceRecorder';
import { invoiceAssistantApi, newRequestId, toAssistantError } from '@/Domain/invoiceAssistant/invoiceAssistantApi';

/**
 * Press to talk. A recording is sent for transcription and handed back as
 * EDITABLE text; it never creates a draft by itself. Audio is not stored in
 * the browser, and the microphone is released as soon as the recording ends.
 */
export default function VoiceInput({ slug, limits = {}, locale = 'auto', onTranscript, disabled = false, api = invoiceAssistantApi }) {
    const [phase, setPhase] = useState('idle');   // idle | sending
    const [error, setError] = useState(null);
    const ctlRef = useRef(null);
    const reqRef = useRef(null);                  // { blob, id } so a retry of the same audio is idempotent
    const mounted = useRef(true);

    useEffect(() => () => { mounted.current = false; ctlRef.current?.abort(); }, []);

    const send = useCallback(async (audio) => {
        setError(null);
        setPhase('sending');
        if (!reqRef.current || reqRef.current.blob !== audio.blob) reqRef.current = { blob: audio.blob, id: newRequestId(), extension: audio.extension };
        const ctl = new AbortController();
        ctlRef.current = ctl;
        try {
            const out = await api.transcribe(slug, {
                audio: audio.blob, filename: `recording.${audio.extension}`, locale, requestId: reqRef.current.id,
            }, { signal: ctl.signal });
            if (!mounted.current) return;
            reqRef.current = null;
            onTranscript?.({ text: out.text || '', warnings: out.warnings || [], language: out.detected_language || null });
        } catch (raw) {
            const e = toAssistantError(raw);
            if (!mounted.current || e.aborted) return;
            setError(e);
            if (!e.retryable) reqRef.current = null;
        } finally {
            if (mounted.current) setPhase('idle');
        }
    }, [api, slug, locale, onTranscript]);

    const rec = useVoiceRecorder({
        maxSeconds: limits.max_seconds || 60,
        maxBytes: limits.max_bytes || 10 * 1024 * 1024,
        onComplete: (audio) => { send(audio).finally(() => rec.reset()); },
    });

    const recording = rec.state === 'recording';
    const working = rec.state === 'requesting' || phase === 'sending';
    const shown = error || rec.error;

    return (
        <div style={{ display: 'grid', gap: 'var(--d-s3, 12px)' }}>
            <div style={{ display: 'flex', gap: 'var(--d-s3, 12px)', alignItems: 'center', flexWrap: 'wrap' }}>
                {!recording ? (
                    <button type="button" className="vqdoc-btn" disabled={disabled || working || !rec.supported}
                        aria-label="Start recording" onClick={() => { setError(null); rec.start(); }}>
                        <Mic size={16} aria-hidden="true" /> {rec.state === 'requesting' ? 'Waiting for the microphone…' : phase === 'sending' ? 'Listening to the recording…' : 'Speak the invoice'}
                    </button>
                ) : (
                    <>
                        <button type="button" className="vqdoc-btn pri" aria-label="Stop recording" onClick={rec.stop}>
                            <Square size={16} aria-hidden="true" /> Stop · {rec.seconds}s / {rec.maxSeconds}s
                        </button>
                        <button type="button" className="vqdoc-btn" aria-label="Cancel recording" onClick={rec.cancel}>
                            <X size={16} aria-hidden="true" /> Cancel
                        </button>
                    </>
                )}
                {phase === 'sending' && (
                    <button type="button" className="vqdoc-btn" onClick={() => { ctlRef.current?.abort(); setPhase('idle'); rec.reset(); }}>Stop waiting</button>
                )}
            </div>
            {!rec.supported && <p style={{ margin: 0, color: 'var(--vq-text-2)' }}>This browser cannot record audio — type the invoice instead.</p>}
            <div role="status" aria-live="polite" style={{ minHeight: '1.25em', color: 'var(--vq-text-2)' }}>
                {recording ? `Recording… ${rec.seconds} seconds. Say the customer, the items and quantities, then press Stop.` : ''}
            </div>
            {shown && (
                <div role="alert" className="vqdoc-note" data-tone="warn">
                    <span>{shown.message}</span>
                    {error?.retryable && reqRef.current && (
                        <button type="button" className="vqdoc-btn xs" onClick={() => send({ blob: reqRef.current.blob, extension: reqRef.current.extension })}>Try again</button>
                    )}
                </div>
            )}
        </div>
    );
}
