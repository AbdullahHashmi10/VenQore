// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import axios from 'axios';
import WhatsAppShareModal from '../Components/WhatsAppShareModal';

vi.mock('axios', () => ({ default: { post: vi.fn() } }));
vi.mock('@inertiajs/react', () => ({ usePage: () => ({ props: { store: { slug: 'audit' } } }) }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.route = () => '/prepare';
let root;
afterEach(async () => { if (root) await act(async () => root.unmount()); root = null; vi.restoreAllMocks(); document.body.innerHTML = ''; });

it('uses the next document recipient and ignores a late response from the previous document', async () => {
    let resolveOld;
    axios.post.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }))
        .mockResolvedValueOnce({ data: { success: true, phone: '22222222222', document_number: 'SECOND' } });
    const container = document.createElement('div'); document.body.append(container); root = createRoot(container);
    await act(async () => root.render(<WhatsAppShareModal isOpen documentId="first" initialPhone="11111111111" />));
    await act(async () => root.render(<WhatsAppShareModal isOpen documentId="second" initialPhone="22222222222" />));
    await act(async () => resolveOld({ data: { success: true, phone: '11111111111', document_number: 'FIRST' } }));
    expect(axios.post.mock.calls[1][1]).toMatchObject({ document_id: 'second', phone: '22222222222' });
    expect(container.textContent).toContain('SECOND');
    expect(container.textContent).not.toContain('FIRST');
    expect(container.querySelector('input').value).toBe('22222222222');
});

it('does not reuse a typed recipient when the next document has no initial phone', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true, phone: '11111111111' } })
        .mockResolvedValueOnce({ data: { success: true, phone: '33333333333' } });
    const container = document.createElement('div'); document.body.append(container); root = createRoot(container);
    await act(async () => root.render(<WhatsAppShareModal isOpen documentId="first" />));
    await act(async () => root.render(<WhatsAppShareModal isOpen documentId="second" />));
    expect(axios.post.mock.calls.at(-1)[1].phone).toBeUndefined();
    expect(container.querySelector('input').value).toBe('33333333333');
});
