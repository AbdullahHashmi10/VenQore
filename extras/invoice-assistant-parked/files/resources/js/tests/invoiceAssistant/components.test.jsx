// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

afterEach(() => cleanup());

vi.mock('@/Documents/DocumentShell', () => ({
    Field: ({ label, children, hint }) => <label><span>{label}</span>{children}{hint ? <small>{hint}</small> : null}</label>,
    Sheet: ({ title, children, onClose }) => <div role="dialog" aria-label={title}><button onClick={onClose}>close-sheet</button>{children}</div>,
}));

import ClarificationList from '@/Components/InvoiceAssistant/ClarificationList';
import ResolvedDraftReview from '@/Components/InvoiceAssistant/ResolvedDraftReview';
import InvoiceAssistantPanel from '@/Components/InvoiceAssistant/InvoiceAssistantPanel';

const customerQ = {
    field: 'customer', reason: 'ambiguous_customer', question: 'More than one customer matches “Ali”. Which one?',
    candidate_set_id: 'cs_cust', candidates: [{ id: '1', label: 'Ali Traders', detail: '0300-1' }, { id: '2', label: 'Ali Brothers' }],
};
const productQ = {
    field: 'product', line_key: 'l2', reason: 'ambiguous_product', question: 'Which “widget”?',
    candidate_set_id: 'cs_prod', candidates: [{ id: '5|9', label: 'Widget — Red' }, { id: '5|10', label: 'Widget — Blue' }],
};
const qtyQ = { field: 'quantity', line_key: 'l1', reason: 'quantity_missing', question: 'How many of “ABC”?', candidates: [], candidate_set_id: 'cs_q' };

describe('ClarificationList', () => {
    it('renders nothing when there is nothing to ask', () => {
        const { container } = render(<ClarificationList unresolved={[]} onChoose={() => {}} />);
        expect(container.innerHTML).toBe('');
    });

    it('submits structured selections only for the questions that were answered', () => {
        const onChoose = vi.fn();
        render(<ClarificationList unresolved={[customerQ, productQ]} onChoose={onChoose} />);
        const apply = screen.getByRole('button', { name: /apply choice/i });
        expect(apply.disabled).toBe(true);
        fireEvent.click(screen.getByLabelText(/Ali Brothers/));
        expect(apply.disabled).toBe(false);
        fireEvent.click(apply);
        expect(onChoose).toHaveBeenCalledWith([{ field: 'customer', candidate_set_id: 'cs_cust', selected_id: '2' }]);
    });

    it('sends line keys for line-level questions and several answers at once', () => {
        const onChoose = vi.fn();
        render(<ClarificationList unresolved={[customerQ, productQ]} onChoose={onChoose} />);
        fireEvent.click(screen.getByLabelText(/Ali Traders/));
        fireEvent.click(screen.getByLabelText(/Widget — Blue/));
        fireEvent.click(screen.getByRole('button', { name: /apply choices/i }));
        expect(onChoose).toHaveBeenCalledWith([
            { field: 'customer', candidate_set_id: 'cs_cust', selected_id: '1' },
            { field: 'product', line_key: 'l2', candidate_set_id: 'cs_prod', selected_id: '5|10' },
        ]);
    });

    it('shows candidate-less questions as text to answer in the message box', () => {
        render(<ClarificationList unresolved={[qtyQ]} onChoose={() => {}} />);
        expect(screen.getByText(/How many of/)).toBeTruthy();
        expect(screen.getByText(/Answer in the box below/)).toBeTruthy();
        expect(screen.queryByRole('button', { name: /apply/i })).toBeNull();
    });

    it('forgets a pick when the questions change', () => {
        const onChoose = vi.fn();
        const { rerender } = render(<ClarificationList unresolved={[customerQ]} onChoose={onChoose} />);
        fireEvent.click(screen.getByLabelText(/Ali Traders/));
        rerender(<ClarificationList unresolved={[{ ...customerQ, candidate_set_id: 'cs_new' }]} onChoose={onChoose} />);
        expect(screen.getByRole('button', { name: /apply choice/i }).disabled).toBe(true);
    });

    it('disables everything while busy', () => {
        render(<ClarificationList unresolved={[customerQ]} busy onChoose={() => {}} />);
        screen.getAllByRole('radio').forEach((r) => expect(r.disabled).toBe(true));
    });
});

describe('ResolvedDraftReview', () => {
    const draft = {
        customer: { id: '1', name: 'Ali Traders' },
        payment: { method: 'credit', amount_paid: '0', amount_source: 'default_zero' },
        invoice_date: '2026-10-02', due_date: '2026-10-17', notes: 'Deliver Monday',
        lines: [{ line_key: 'l1', name: 'ABC-101', sku: 'ABC-101', quantity: '3', sale_uom: 'box', unit_price: '100', price_source: 'store_policy', discount_percent: '10' }],
        lines_pending: [{ line_key: 'l2', name: 'Widget', quantity: '2' }],
        totals_preview: { subtotal: '300.00', discount: '30.00', tax: '0.00', total: '270.00', note: 'Preview only.' },
        warnings: [{ code: 'insufficient_stock', line_key: 'l1', message: 'Only 2 of “ABC-101” available.' }],
    };

    it('shows what was understood, a labelled preview and the warnings', () => {
        render(<ResolvedDraftReview draft={draft} money={(n) => `Rs ${n}`} />);
        expect(screen.getByText('Ali Traders')).toBeTruthy();
        expect(screen.getByText(/On account/)).toBeTruthy();
        expect(screen.getByText(/no amount received yet/)).toBeTruthy();
        expect(screen.getByText(/10% off/)).toBeTruthy();
        expect(screen.getByText('Needs your answer')).toBeTruthy();
        expect(screen.getByText('Estimated total')).toBeTruthy();
        expect(screen.getByText('Preview only.')).toBeTruthy();
        expect(screen.getByText(/Only 2 of/)).toBeTruthy();
    });

    it('says when an amount was stated by the operator', () => {
        render(<ResolvedDraftReview draft={{ ...draft, payment: { method: 'cash', amount_paid: '250', amount_source: 'explicit' } }} money={(n) => `Rs ${n}`} />);
        expect(screen.getByText(/Rs 250 received \(as you said\)/)).toBeTruthy();
    });

    it('renders nothing without a draft', () => {
        const { container } = render(<ResolvedDraftReview draft={null} />);
        expect(container.innerHTML).toBe('');
    });
});

describe('InvoiceAssistantPanel', () => {
    const ready = { draft_id: 'd1', revision: 1, status: 'ready_for_review', can_handoff: true, unresolved: [], lines: [], customer: { id: '1', name: 'Ali' }, payment: { method: 'credit', amount_source: 'default_zero' } };
    const makeApi = (over = {}) => ({
        createDraft: vi.fn().mockResolvedValue(ready),
        sendMessage: vi.fn().mockResolvedValue({ ...ready, revision: 2 }),
        handoff: vi.fn().mockResolvedValue({ draft_id: 'd1', redirect_url: '/x' }),
        discard: vi.fn().mockResolvedValue({}),
        ...over,
    });
    const config = { enabled: true, voice_enabled: false, limits: { max_input_chars: 4000 } };

    it('drafts from typed text and keeps the Draft button disabled until there is text', async () => {
        const api = makeApi();
        render(<InvoiceAssistantPanel slug="s" config={config} api={api} onClose={() => {}} onHandoff={() => {}} />);
        const btn = screen.getByRole('button', { name: /draft the invoice/i });
        expect(btn.disabled).toBe(true);
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'invoice ali 3 abc' } });
        fireEvent.click(btn);
        await waitFor(() => expect(api.createDraft).toHaveBeenCalled());
        expect(api.createDraft.mock.calls[0][1]).toMatchObject({ text: 'invoice ali 3 abc', inputMode: 'text' });
        expect((await screen.findByRole('button', { name: /open in the invoice editor/i })).disabled).toBe(false);
    });

    it('does not offer the microphone when voice is off', () => {
        render(<InvoiceAssistantPanel slug="s" config={config} api={makeApi()} onClose={() => {}} onHandoff={() => {}} />);
        expect(screen.queryByRole('button', { name: /start recording/i })).toBeNull();
    });

    it('keeps "Open in the invoice editor" disabled while questions remain', async () => {
        const api = makeApi({ createDraft: vi.fn().mockResolvedValue({ ...ready, can_handoff: false, unresolved: [qtyQ] }) });
        render(<InvoiceAssistantPanel slug="s" config={config} api={api} onClose={() => {}} onHandoff={() => {}} />);
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'invoice ali some abc' } });
        fireEvent.click(screen.getByRole('button', { name: /draft the invoice/i }));
        expect((await screen.findByRole('button', { name: /open in the invoice editor/i })).disabled).toBe(true);
    });

    it('hands off without discarding, and passes the result up', async () => {
        const api = makeApi();
        const onHandoff = vi.fn();
        render(<InvoiceAssistantPanel slug="s" config={config} api={api} onClose={() => {}} onHandoff={onHandoff} />);
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'invoice ali 3 abc' } });
        fireEvent.click(screen.getByRole('button', { name: /draft the invoice/i }));
        fireEvent.click(await screen.findByRole('button', { name: /open in the invoice editor/i }));
        await waitFor(() => expect(onHandoff).toHaveBeenCalledWith({ draft_id: 'd1', redirect_url: '/x' }));
        expect(api.discard).not.toHaveBeenCalled();
    });

    it('asks before throwing away a reviewed draft, then discards it', async () => {
        const api = makeApi();
        const onClose = vi.fn();
        render(<InvoiceAssistantPanel slug="s" config={config} api={api} onClose={onClose} onHandoff={() => {}} />);
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'invoice ali 3 abc' } });
        fireEvent.click(screen.getByRole('button', { name: /draft the invoice/i }));
        await screen.findByRole('button', { name: /open in the invoice editor/i });
        fireEvent.click(screen.getByText('close-sheet'));
        expect(onClose).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: /discard draft/i }));
        expect(onClose).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(api.discard).toHaveBeenCalled());
    });

    it('closes straight away when there is no draft', () => {
        const onClose = vi.fn();
        render(<InvoiceAssistantPanel slug="s" config={config} api={makeApi()} onClose={onClose} onHandoff={() => {}} />);
        fireEvent.click(screen.getByText('close-sheet'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('shows a plain-language error and keeps the typed text', async () => {
        const api = makeApi({ createDraft: vi.fn().mockRejectedValue({ response: { status: 429, data: { code: 'rate_limited', message: 'Too many requests.', retryable: false } } }) });
        render(<InvoiceAssistantPanel slug="s" config={config} api={api} onClose={() => {}} onHandoff={() => {}} />);
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'invoice ali 3 abc' } });
        fireEvent.click(screen.getByRole('button', { name: /draft the invoice/i }));
        expect((await screen.findByRole('alert')).textContent).toMatch(/too many requests/i);
        expect(screen.getByRole('textbox').value).toBe('invoice ali 3 abc');
    });
});
