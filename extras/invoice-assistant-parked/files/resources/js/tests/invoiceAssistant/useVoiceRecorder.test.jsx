// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { describeMicError, extensionFor, pickMimeType, useVoiceRecorder } from '@/Domain/invoiceAssistant/useVoiceRecorder';

class FakeRecorder {
    static supported = ['audio/webm;codecs=opus', 'audio/webm'];
    static isTypeSupported(t) { return FakeRecorder.supported.includes(t); }
    static last = null;
    constructor(stream, opts = {}) { this.stream = stream; this.mimeType = opts.mimeType || 'audio/webm'; this.state = 'inactive'; FakeRecorder.last = this; }
    start() { this.state = 'recording'; }
    stop() {
        if (this.state === 'inactive') return;
        this.state = 'inactive';
        this.ondataavailable?.({ data: new Blob([new Uint8Array(this.finalBytes ?? 10)]) });
        this.onstop?.();
    }
    emit(bytes) { this.ondataavailable?.({ data: new Blob([new Uint8Array(bytes)]) }); }
}

const makeStream = () => {
    const track = { stop: vi.fn() };
    return { track, getTracks: () => [track] };
};

describe('voice helpers', () => {
    it('prefers webm/opus, then the next supported type', () => {
        expect(pickMimeType(FakeRecorder)).toBe('audio/webm;codecs=opus');
        class OnlyMp4 { static isTypeSupported(t) { return t === 'audio/mp4'; } }
        expect(pickMimeType(OnlyMp4)).toBe('audio/mp4');
        class None { static isTypeSupported() { return false; } }
        expect(pickMimeType(None)).toBe('');
        expect(pickMimeType(undefined)).toBe('');
    });

    it('maps mime types to file extensions', () => {
        expect(extensionFor('audio/webm;codecs=opus')).toBe('webm');
        expect(extensionFor('audio/ogg')).toBe('ogg');
        expect(extensionFor('audio/mp4')).toBe('m4a');
        expect(extensionFor('')).toBe('webm');
    });

    it('explains microphone errors in plain words', () => {
        expect(describeMicError({ name: 'NotAllowedError' }).code).toBe('mic_denied');
        expect(describeMicError({ name: 'NotFoundError' }).code).toBe('mic_missing');
        expect(describeMicError({ name: 'NotReadableError' }).code).toBe('mic_busy');
        expect(describeMicError({ name: 'Weird' }).code).toBe('mic_error');
    });
});

describe('useVoiceRecorder', () => {
    let stream;
    beforeEach(() => {
        vi.useFakeTimers();
        stream = makeStream();
        globalThis.MediaRecorder = FakeRecorder;
        Object.defineProperty(globalThis.navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn().mockResolvedValue(stream) } });
    });
    afterEach(() => { vi.useRealTimers(); });

    it('records, stops and delivers one blob, releasing the microphone', async () => {
        const onComplete = vi.fn();
        const { result } = renderHook(() => useVoiceRecorder({ onComplete }));
        await act(async () => { await result.current.start(); });
        expect(result.current.state).toBe('recording');
        act(() => { result.current.stop(); });
        expect(onComplete).toHaveBeenCalledTimes(1);
        const arg = onComplete.mock.calls[0][0];
        expect(arg.blob.size).toBeGreaterThan(0);
        expect(arg.extension).toBe('webm');
        expect(arg.reason).toBe('stopped');
        expect(stream.track.stop).toHaveBeenCalled();
    });

    it('only asks for the microphone when start() is called', () => {
        renderHook(() => useVoiceRecorder({}));
        expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
    });

    it('reports a denied permission and stays usable', async () => {
        navigator.mediaDevices.getUserMedia.mockRejectedValueOnce({ name: 'NotAllowedError' });
        const { result } = renderHook(() => useVoiceRecorder({}));
        let ok;
        await act(async () => { ok = await result.current.start(); });
        expect(ok).toBe(false);
        expect(result.current.state).toBe('idle');
        expect(result.current.error.code).toBe('mic_denied');
    });

    it('stops at the time limit and delivers what it has', async () => {
        const onComplete = vi.fn();
        const { result } = renderHook(() => useVoiceRecorder({ maxSeconds: 3, onComplete }));
        await act(async () => { await result.current.start(); });
        await act(async () => { vi.advanceTimersByTime(3500); });
        expect(onComplete).toHaveBeenCalledTimes(1);
        expect(onComplete.mock.calls[0][0].reason).toBe('time_limit');
        expect(stream.track.stop).toHaveBeenCalled();
    });

    it('stops at the size limit', async () => {
        const onComplete = vi.fn();
        const { result } = renderHook(() => useVoiceRecorder({ maxBytes: 100, onComplete }));
        await act(async () => { await result.current.start(); });
        act(() => { FakeRecorder.last.emit(150); });
        expect(onComplete).toHaveBeenCalledTimes(1);
        expect(onComplete.mock.calls[0][0].reason).toBe('size_limit');
    });

    it('cancel delivers nothing and releases the microphone', async () => {
        const onComplete = vi.fn();
        const { result } = renderHook(() => useVoiceRecorder({ onComplete }));
        await act(async () => { await result.current.start(); });
        act(() => { result.current.cancel(); });
        expect(onComplete).not.toHaveBeenCalled();
        expect(stream.track.stop).toHaveBeenCalled();
        expect(result.current.state).toBe('idle');
    });

    it('releases the microphone on unmount', async () => {
        const { result, unmount } = renderHook(() => useVoiceRecorder({}));
        await act(async () => { await result.current.start(); });
        unmount();
        expect(stream.track.stop).toHaveBeenCalled();
    });

    it('drops a stream granted after cancel', async () => {
        let grant;
        navigator.mediaDevices.getUserMedia.mockImplementationOnce(() => new Promise((r) => { grant = r; }));
        const onComplete = vi.fn();
        const { result } = renderHook(() => useVoiceRecorder({ onComplete }));
        let p;
        act(() => { p = result.current.start(); });
        act(() => { result.current.cancel(); });
        await act(async () => { grant(stream); await p; });
        expect(stream.track.stop).toHaveBeenCalled();
        expect(result.current.state).toBe('idle');
    });

    it('treats an empty recording as an error, not a transcription', async () => {
        const onComplete = vi.fn();
        const { result } = renderHook(() => useVoiceRecorder({ onComplete }));
        await act(async () => { await result.current.start(); });
        FakeRecorder.last.finalBytes = 0;
        FakeRecorder.last.stop = function () { this.state = 'inactive'; this.onstop?.(); };
        act(() => { result.current.stop(); });
        expect(onComplete).not.toHaveBeenCalled();
        expect(result.current.error.code).toBe('empty_recording');
    });

    it('reports an unsupported browser without throwing', async () => {
        delete globalThis.MediaRecorder;
        const { result } = renderHook(() => useVoiceRecorder({}));
        let ok;
        await act(async () => { ok = await result.current.start(); });
        expect(ok).toBe(false);
        expect(result.current.error.code).toBe('unsupported');
    });
});
