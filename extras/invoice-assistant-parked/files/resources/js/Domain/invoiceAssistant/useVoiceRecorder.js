import { useCallback, useEffect, useRef, useState } from 'react';

/** Preference order: the formats the server accepts (webm/ogg/mp4), best first. */
export const MIME_CANDIDATES = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
];

export function pickMimeType(MR = typeof MediaRecorder !== 'undefined' ? MediaRecorder : undefined) {
    if (!MR || typeof MR.isTypeSupported !== 'function') return '';
    for (const t of MIME_CANDIDATES) {
        try { if (MR.isTypeSupported(t)) return t; } catch (_) { /* try next */ }
    }
    return '';
}

export function extensionFor(mime) {
    const m = String(mime || '').toLowerCase();
    if (m.includes('webm')) return 'webm';
    if (m.includes('ogg')) return 'ogg';
    if (m.includes('mp4') || m.includes('aac')) return 'm4a';
    if (m.includes('wav')) return 'wav';
    return 'webm';
}

export function isSupported() {
    return typeof window !== 'undefined'
        && typeof navigator !== 'undefined'
        && !!navigator.mediaDevices?.getUserMedia
        && typeof MediaRecorder !== 'undefined';
}

export function describeMicError(e) {
    switch (e?.name) {
        case 'NotAllowedError':
        case 'SecurityError':
            return { code: 'mic_denied', message: 'Microphone access is blocked. Allow it in the browser’s site settings, or type the invoice instead.' };
        case 'NotFoundError':
        case 'OverconstrainedError':
            return { code: 'mic_missing', message: 'No microphone was found. Plug one in, or type the invoice instead.' };
        case 'NotReadableError':
        case 'AbortError':
            return { code: 'mic_busy', message: 'The microphone is in use by another app. Close it and try again.' };
        default:
            return { code: 'mic_error', message: 'Could not start the microphone. You can type the invoice instead.' };
    }
}

/**
 * Microphone lifecycle for the voice invoice.
 *
 *  - getUserMedia only runs from start(), which the UI calls from a click.
 *  - Hard caps: maxSeconds (default 60) and maxBytes (default 10 MiB) stop the
 *    recording and hand back what was captured so far.
 *  - Every track is stopped on stop / cancel / unmount, so the browser's
 *    "recording" indicator never lingers.
 *  - A generation id drops events from a recording that was cancelled or
 *    superseded. Audio is held only in memory and never persisted.
 *
 * `onComplete({ blob, mime, extension, seconds, reason })` fires once per
 * recording that was stopped (not cancelled).
 */
export function useVoiceRecorder({ maxSeconds = 60, maxBytes = 10 * 1024 * 1024, onComplete } = {}) {
    const [state, setState] = useState('idle');       // idle | requesting | recording | processing
    const [seconds, setSeconds] = useState(0);
    const [error, setError] = useState(null);

    const genRef = useRef(0);
    const recRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);
    const bytesRef = useRef(0);
    const timerRef = useRef(null);
    const startedRef = useRef(0);
    const onCompleteRef = useRef(onComplete);
    const mountedRef = useRef(true);
    const finishedRef = useRef(0);
    onCompleteRef.current = onComplete;

    const releaseStream = () => {
        try { streamRef.current?.getTracks?.().forEach((t) => t.stop()); } catch (_) { /* already stopped */ }
        streamRef.current = null;
    };
    const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };

    const teardown = () => {
        clearTimer();
        const r = recRef.current;
        recRef.current = null;
        if (r) {
            r.ondataavailable = null;
            r.onstop = null;
            r.onerror = null;
            try { if (r.state !== 'inactive') r.stop(); } catch (_) { /* already stopped */ }
        }
        releaseStream();
        chunksRef.current = [];
        bytesRef.current = 0;
    };

    const finish = useCallback((gen, reason) => {
        if (gen !== genRef.current) return;
        const r = recRef.current;
        if (!r || finishedRef.current === gen) return;
        finishedRef.current = gen;
        const mime = r.mimeType || pickMimeType() || 'audio/webm';
        const secs = Math.min(maxSeconds, Math.max(0, (Date.now() - startedRef.current) / 1000));
        r.onstop = () => {
            if (gen !== genRef.current) return;
            const blob = new Blob(chunksRef.current, { type: mime });
            releaseStream();
            clearTimer();
            recRef.current = null;
            chunksRef.current = [];
            bytesRef.current = 0;
            if (!mountedRef.current) return;
            if (!blob.size) {
                setState('idle');
                setError({ code: 'empty_recording', message: 'Nothing was recorded. Try again.' });
                return;
            }
            setState('processing');
            onCompleteRef.current?.({ blob, mime, extension: extensionFor(mime), seconds: secs, reason });
        };
        try {
            if (r.state !== 'inactive') r.stop(); else r.onstop();
        } catch (_) {
            r.onstop();
        }
    }, [maxSeconds]);

    const start = useCallback(async () => {
        if (state === 'requesting' || state === 'recording') return false;
        setError(null);
        if (!isSupported()) {
            setError({ code: 'unsupported', message: 'This browser cannot record audio. Type the invoice instead.' });
            return false;
        }
        teardown();
        const gen = ++genRef.current;
        setState('requesting');
        setSeconds(0);
        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
        } catch (e) {
            if (gen === genRef.current && mountedRef.current) { setState('idle'); setError(describeMicError(e)); }
            return false;
        }
        // Cancelled or unmounted while the permission prompt was open.
        if (gen !== genRef.current || !mountedRef.current) {
            try { stream.getTracks().forEach((t) => t.stop()); } catch (_) { /* noop */ }
            return false;
        }
        streamRef.current = stream;

        let rec;
        try {
            const mime = pickMimeType();
            rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
        } catch (_) {
            releaseStream();
            setState('idle');
            setError({ code: 'recorder_error', message: 'Could not start recording on this device. Type the invoice instead.' });
            return false;
        }
        recRef.current = rec;
        chunksRef.current = [];
        bytesRef.current = 0;

        rec.ondataavailable = (ev) => {
            if (gen !== genRef.current || !ev.data?.size) return;
            chunksRef.current.push(ev.data);
            bytesRef.current += ev.data.size;
            if (bytesRef.current >= maxBytes) finish(gen, 'size_limit');
        };
        rec.onerror = () => {
            if (gen !== genRef.current) return;
            teardown();
            if (mountedRef.current) { setState('idle'); setError({ code: 'recorder_error', message: 'The recording failed. Try again or type the invoice.' }); }
        };

        startedRef.current = Date.now();
        rec.start(1000);
        setState('recording');
        timerRef.current = setInterval(() => {
            if (gen !== genRef.current) return;
            const s = Math.floor((Date.now() - startedRef.current) / 1000);
            if (mountedRef.current) setSeconds(Math.min(s, maxSeconds));
            if (s >= maxSeconds) finish(gen, 'time_limit');
        }, 250);
        return true;
    }, [state, finish, maxBytes, maxSeconds]);

    const stop = useCallback(() => {
        if (state !== 'recording') return;
        finish(genRef.current, 'stopped');
    }, [state, finish]);

    /** Abandon the recording: nothing is delivered. */
    const cancel = useCallback(() => {
        genRef.current += 1;
        teardown();
        setState('idle');
        setSeconds(0);
    }, []);

    /** The caller finished with the audio (sent, or failed): ready to record again. */
    const reset = useCallback(() => { setState('idle'); setSeconds(0); setError(null); }, []);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            genRef.current += 1;
            teardown();
        };
    }, []);

    return { state, seconds, error, supported: isSupported(), start, stop, cancel, reset, maxSeconds };
}

export default useVoiceRecorder;
