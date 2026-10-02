// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => cleanup());
import { useInvoiceAssistant } from '@/Domain/invoiceAssistant/useInvoiceAssistant';
import { AssistantError } from '@/Domain/invoiceAssistant/invoiceAssistantApi';

const draft = (over = {}) => ({ draft_id: 'd1', revision: 1, status: 'ready_for_review', can_handoff: true, unresolved: [], lines: [], ...over });
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };

describe('useInvoiceAssistant', () => {
    it('starts a draft and exposes it', async () => {
        const api = { createDraft: vi.fn().mockResolvedValue(draft()) };
        const { result } = renderHook(() => useInvoiceAssistant({ slug: 's', api }));
        await act(async () => { await result.current.start('invoice ali 3 abc', 'text'); });
        expect(result.current.draft.draft_id).toBe('d1');
        expect(api.createDraft.mock.calls[0][1]).toMatchObject({ text: 'invoice ali 3 abc', inputMode: 'text' });
        expect(result.current.busy).toBeNull();
    });

    it('ignores input that is too short, without calling the server', async () => {
        const api = { createDraft: vi.fn() };
        const { result } = renderHook(() => useInvoiceAssistant({ slug: 's', api }));
        await act(async () => { await result.current.start(' a ', 'text'); });
        expect(api.createDraft).not.toHaveBeenCalled();
    });

    it('allows only one operation at a time (double click cannot send twice)', async () => {
        const d = deferred();
        const api = { createDraft: vi.fn(() => d.promise) };
        const { result } = renderHook(() => useInvoiceAssistant({ slug: 's', api }));
        act(() => { result.current.start('first request', 'text'); result.current.start('first request', 'text'); });
        expect(api.createDraft).toHaveBeenCalledTimes(1);
        await act(async () => { d.resolve(draft()); await d.promise; });
        expect(result.current.draft).not.toBeNull();
    });

    it('retries the SAME logical request with the SAME request id', async () => {
        const api = { createDraft: vi.fn()
            .mockRejectedValueOnce(new AssistantError({ code: 'network', retryable: true }))
            .mockResolvedValueOnce(draft()) };
        const { result } = renderHook(() => useInvoiceAssistant({ slug: 's', api }));
        await act(async () => { await result.current.start('same text here', 'text'); });
        expect(result.current.error.code).toBe('network');
        await act(async () => { await result.current.start('same text here', 'text'); });
        expect(api.createDraft.mock.calls[0][1].requestId).toBe(api.createDraft.mock.calls[1][1].requestId);
        expect(result.current.error).toBeNull();
    });

    it('starts a fresh attempt after a failure the server reported', async () => {
        const api = { createDraft: vi.fn()
            .mockRejectedValueOnce(new AssistantError({ code: 'assistant_unavailable', retryable: true, status: 503 }))
            .mockResolvedValueOnce(draft()) };
        const { result } = renderHook(() => useInvoiceAssistant({ slug: 's', api }));
        await act(async () => { await result.current.start('same text here', 'text'); });
        await act(async () => { await result.current.start('same text here', 'text'); });
        expect(api.createDraft.mock.calls[0][1].requestId).not.toBe(api.createDraft.mock.calls[1][1].requestId);
    });

    it('uses a NEW request id when the text changed', async () => {
        const api = { createDraft: vi.fn()
            .mockRejectedValueOnce(new AssistantError({ code: 'network', retryable: true }))
            .mockResolvedValueOnce(draft()) };
        const { result } = renderHook(() => useInvoiceAssistant({ slug: 's', api }));
        await act(async () => { await result.current.start('text one', 'text'); });
        await act(async () => { await result.current.start('text two', 'text'); });
        expect(api.createDraft.mock.calls[0][1].requestId).not.toBe(api.createDraft.mock.calls[1][1].requestId);
    });

    it('sends the revision it saw and replaces the draft with the answer', async () => {
        const api = {
            createDraft: vi.fn().mockResolvedValue(draft({ revision: 4 })),
            sendMessage: vi.fn().mockResolvedValue(draft({ revision: 5 })),
        };
        const { result } = renderHook(() => useInvoiceAssistant({ slug: 's', api }));
        await act(async () => { await result.current.start('hello there', 'text'); });
        await act(async () => { await result.current.reply('make it five'); });
        expect(api.sendMessage.mock.calls[0][2]).toMatchObject({ expectedRevision: 4, text: 'make it five' });
        expect(result.current.draft.revision).toBe(5);
    });

    it('shows the server’s version after a stale revision instead of retrying blindly', async () => {
        const fresh = draft({ revision: 9 });
        const api = {
            createDraft: vi.fn().mockResolvedValue(draft({ revision: 4 })),
            sendMessage: vi.fn().mockRejectedValue(new AssistantError({ code: 'stale_revision', status: 409, draft: fresh })),
        };
        const { result } = renderHook(() => useInvoiceAssistant({ slug: 's', api }));
        await act(async () => { await result.current.start('hello there', 'text'); });
        await act(async () => { await result.current.reply('change'); });
        expect(result.current.draft.revision).toBe(9);
        expect(result.current.error.code).toBe('stale_revision');
    });

    it('drops the draft when it expired', async () => {
        const api = {
            createDraft: vi.fn().mockResolvedValue(draft()),
            sendMessage: vi.fn().mockRejectedValue(new AssistantError({ code: 'draft_expired', status: 410 })),
        };
        const { result } = renderHook(() => useInvoiceAssistant({ slug: 's', api }));
        await act(async () => { await result.current.start('hello there', 'text'); });
        await act(async () => { await result.current.reply('anything'); });
        expect(result.current.draft).toBeNull();
        expect(result.current.error.code).toBe('draft_expired');
    });

    it('sends structured selections without any text', async () => {
        const api = {
            createDraft: vi.fn().mockResolvedValue(draft({ unresolved: [{ field: 'customer' }], can_handoff: false })),
            sendMessage: vi.fn().mockResolvedValue(draft({ revision: 2 })),
        };
        const { result } = renderHook(() => useInvoiceAssistant({ slug: 's', api }));
        await act(async () => { await result.current.start('hello there', 'text'); });
        const sel = [{ field: 'customer', candidate_set_id: 'cs_1', selected_id: '9' }];
        await act(async () => { await result.current.choose(sel); });
        expect(api.sendMessage.mock.calls[0][2].selections).toEqual(sel);
        expect(api.sendMessage.mock.calls[0][2].text).toBeUndefined();
    });

    it('refuses to hand off a draft that is not ready', async () => {
        const api = { createDraft: vi.fn().mockResolvedValue(draft({ can_handoff: false })), handoff: vi.fn() };
        const { result } = renderHook(() => useInvoiceAssistant({ slug: 's', api }));
        await act(async () => { await result.current.start('hello there', 'text'); });
        let out;
        await act(async () => { out = await result.current.handoff(); });
        expect(out).toBeNull();
        expect(api.handoff).not.toHaveBeenCalled();
    });

    it('hands off a ready draft', async () => {
        const api = {
            createDraft: vi.fn().mockResolvedValue(draft({ revision: 3 })),
            handoff: vi.fn().mockResolvedValue({ draft_id: 'd1', redirect_url: '/x' }),
        };
        const { result } = renderHook(() => useInvoiceAssistant({ slug: 's', api }));
        await act(async () => { await result.current.start('hello there', 'text'); });
        let out;
        await act(async () => { out = await result.current.handoff(); });
        expect(out.draft_id).toBe('d1');
        expect(api.handoff.mock.calls[0][2]).toMatchObject({ expectedRevision: 3 });
    });

    it('ignores an answer that arrives after discard', async () => {
        const d = deferred();
        const api = { createDraft: vi.fn(() => d.promise), discard: vi.fn().mockResolvedValue({}) };
        const { result } = renderHook(() => useInvoiceAssistant({ slug: 's', api }));
        act(() => { result.current.start('slow request', 'text'); });
        await act(async () => { await result.current.discard(); });
        await act(async () => { d.resolve(draft()); await d.promise; });
        expect(result.current.draft).toBeNull();
        expect(result.current.busy).toBeNull();
    });

    it('discard asks the server to drop the draft and clears state', async () => {
        const api = { createDraft: vi.fn().mockResolvedValue(draft({ revision: 2 })), discard: vi.fn().mockResolvedValue({}) };
        const { result } = renderHook(() => useInvoiceAssistant({ slug: 's', api }));
        await act(async () => { await result.current.start('hello there', 'text'); });
        await act(async () => { await result.current.discard(); });
        expect(api.discard).toHaveBeenCalledWith('s', 'd1', 2);
        expect(result.current.draft).toBeNull();
    });

    it('does not update state after unmount', async () => {
        const d = deferred();
        const api = { createDraft: vi.fn(() => d.promise) };
        const { result, unmount } = renderHook(() => useInvoiceAssistant({ slug: 's', api }));
        act(() => { result.current.start('slow request', 'text'); });
        unmount();
        await expect((async () => { d.resolve(draft()); await d.promise; })()).resolves.toBeUndefined();
    });

    it('can be used again after a failure', async () => {
        const api = { createDraft: vi.fn()
            .mockRejectedValueOnce(new AssistantError({ code: 'rate_limited', retryable: false }))
            .mockResolvedValueOnce(draft()) };
        const { result } = renderHook(() => useInvoiceAssistant({ slug: 's', api }));
        await act(async () => { await result.current.start('first try', 'text'); });
        expect(result.current.busy).toBeNull();
        await act(async () => { await result.current.start('second try', 'text'); });
        await waitFor(() => expect(result.current.draft).not.toBeNull());
    });
});
