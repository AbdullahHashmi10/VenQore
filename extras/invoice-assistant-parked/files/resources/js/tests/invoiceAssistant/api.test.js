import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AssistantError, invoiceAssistantApi, newRequestId, toAssistantError, urlFor } from '@/Domain/invoiceAssistant/invoiceAssistantApi';

const axiosError = (status, data) => ({ response: { status, data } });

describe('invoiceAssistantApi', () => {
    let ax;
    beforeEach(() => {
        ax = { get: vi.fn(), post: vi.fn(), delete: vi.fn() };
        globalThis.window = globalThis.window || globalThis;
        window.axios = ax;
        delete globalThis.route;
    });
    afterEach(() => { delete window.axios; });

    it('creates unique request ids', () => {
        const ids = new Set(Array.from({ length: 50 }, newRequestId));
        expect(ids.size).toBe(50);
        for (const id of ids) expect(id).toMatch(/^[A-Za-z0-9_\-:.]{8,64}$/);
    });

    it('falls back to the literal store path when Ziggy does not know the route', () => {
        globalThis.route = () => { throw new Error('Ziggy error: route not found'); };
        expect(urlFor('create', 'acme')).toBe('/s/acme/invoice-assistant/drafts');
        expect(urlFor('handoff', 'acme', 'd-1')).toBe('/s/acme/invoice-assistant/drafts/d-1/handoff');
        expect(urlFor('transcribe', 'acme')).toBe('/s/acme/invoice-assistant/transcriptions');
    });

    it('uses Ziggy when it is available', () => {
        globalThis.route = vi.fn(() => '/zig/url');
        expect(urlFor('config', 'acme')).toBe('/zig/url');
        expect(globalThis.route).toHaveBeenCalledWith('store.invoice-assistant.config', { store_slug: 'acme' });
    });

    it('maps the documented error envelope', () => {
        const e = toAssistantError(axiosError(409, {
            code: 'stale_revision', message: 'changed', retryable: false, field_errors: { a: ['x'] }, draft: { draft_id: 'd', revision: 3 },
        }));
        expect(e).toBeInstanceOf(AssistantError);
        expect(e.code).toBe('stale_revision');
        expect(e.draft.revision).toBe(3);
        expect(e.fieldErrors).toEqual({ a: ['x'] });
        expect(e.retryable).toBe(false);
        expect(e.status).toBe(409);
    });

    it('treats network failures and timeouts as retryable', () => {
        expect(toAssistantError({ message: 'Network Error' })).toMatchObject({ code: 'network', retryable: true });
        expect(toAssistantError({ code: 'ECONNABORTED' })).toMatchObject({ code: 'timeout', retryable: true });
    });

    it('recognises cancellation', () => {
        expect(toAssistantError({ code: 'ERR_CANCELED' }).aborted).toBe(true);
        expect(toAssistantError({ name: 'AbortError' }).aborted).toBe(true);
    });

    it('gives friendly messages for 419, 429, 403 and 500 without a body', () => {
        expect(toAssistantError(axiosError(419, '')).code).toBe('session_expired');
        expect(toAssistantError(axiosError(429, '')).retryable).toBe(true);
        expect(toAssistantError(axiosError(403, '')).message).toMatch(/access/i);
        expect(toAssistantError(axiosError(500, '')).retryable).toBe(true);
    });

    it('never leaks a raw server body as the message', () => {
        const e = toAssistantError(axiosError(500, '<html>stack trace</html>'));
        expect(e.message).not.toMatch(/stack trace/);
    });

    it('createDraft posts the documented body', async () => {
        ax.post.mockResolvedValue({ data: { draft_id: 'd1' } });
        const out = await invoiceAssistantApi.createDraft('acme', { text: 'hi there', inputMode: 'voice', requestId: 'req-12345' });
        expect(out).toEqual({ draft_id: 'd1' });
        const [, body] = ax.post.mock.calls[0];
        expect(body).toEqual({ text: 'hi there', input_mode: 'voice', request_id: 'req-12345' });
    });

    it('sendMessage sends text OR selections, never an empty selections array', async () => {
        ax.post.mockResolvedValue({ data: {} });
        await invoiceAssistantApi.sendMessage('acme', 'd1', { expectedRevision: 2, text: 'make it 5', selections: [], requestId: 'req-1' });
        expect(ax.post.mock.calls[0][1]).toEqual({ expected_revision: 2, text: 'make it 5', request_id: 'req-1' });
        await invoiceAssistantApi.sendMessage('acme', 'd1', {
            expectedRevision: 2, selections: [{ field: 'customer', candidate_set_id: 'cs_1', selected_id: '9' }], requestId: 'req-2',
        });
        expect(ax.post.mock.calls[1][1].selections).toHaveLength(1);
        expect(ax.post.mock.calls[1][1]).not.toHaveProperty('text');
    });

    it('wraps failures in AssistantError', async () => {
        ax.post.mockRejectedValue(axiosError(422, { code: 'validation_failed', message: 'bad', field_errors: { text: ['required'] } }));
        await expect(invoiceAssistantApi.createDraft('a', { text: 'x', requestId: 'r-1234567' })).rejects.toMatchObject({
            name: 'AssistantError', code: 'validation_failed', fieldErrors: { text: ['required'] },
        });
    });

    it('transcribe sends multipart audio with the request id and locale', async () => {
        ax.post.mockResolvedValue({ data: { text: 'hello' } });
        const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/webm' });
        await invoiceAssistantApi.transcribe('acme', { audio: blob, filename: 'recording.webm', locale: 'ur', requestId: 'req-voice-1' });
        const form = ax.post.mock.calls[0][1];
        expect(form).toBeInstanceOf(FormData);
        expect(form.get('request_id')).toBe('req-voice-1');
        expect(form.get('locale')).toBe('ur');
        expect(form.get('audio').name).toBe('recording.webm');
    });

    it('discard passes the expected revision as a query parameter', async () => {
        ax.delete.mockResolvedValue({ data: '' });
        await invoiceAssistantApi.discard('acme', 'd1', 4);
        expect(ax.delete.mock.calls[0][1].params).toEqual({ expected_revision: 4 });
    });
});
