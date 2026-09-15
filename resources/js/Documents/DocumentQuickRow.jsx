import React, { useCallback, useRef, useState } from 'react';
import { Zap, Plus } from 'lucide-react';
import AsyncProductCombobox from '@/Components/AsyncProductCombobox';
import WheelInput from '@/Components/WheelInput';

/**
 * DocumentQuickRow — line after line without leaving the keyboard.
 *
 * The fastest way to enter a document is not to click "Add an item" and then
 * find the search box: it is to type. The first keystroke anywhere on the
 * screen lands here (the handler for that lives in useDocumentChrome), Enter
 * puts the line on the document, and the cursor comes straight back for the
 * next one.
 *
 * It also does one small thing that matters more than it looks: a committed
 * line REPLACES the starter blank row rather than being appended after it, so
 * a document does not end up carrying a permanent empty first line.
 */

const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };

export default function DocumentQuickRow({ doc, chrome, ctx, visible, onCommit }) {
    const { quickQuery, setQuickQuery, focusQuick } = chrome;
    const qtyRef = useRef(null);

    const blank = { product: null, name: '', quantity: 1, freeQuantity: 0, price: 0, discount: 0, discountType: 'fixed' };
    const [draft, setDraft] = useState(blank);

    const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

    const pick = useCallback((product) => {
        if (!product) return;
        setDraft((d) => ({
            ...d,
            product,
            name: product.name,
            /* A purchase line opens at what the thing costs; a sale at what it
               sells for. The document says which. */
            price: num(ctx.priceOf ? ctx.priceOf(product) : product.price),
        }));
        setTimeout(() => qtyRef.current?.focus?.(), 40);
    }, [ctx]);

    const commit = useCallback(() => {
        if (!draft.product && !draft.name) return;
        onCommit(draft);
        setDraft(blank);
        setQuickQuery('');
        setTimeout(focusQuick, 30);
    }, [draft, onCommit, setQuickQuery, focusQuick]);

    /* Enter means the same thing in every cell of this row: put it on the
       document and give me the next one. */
    const onKey = (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        commit();
    };

    const cell = (id) => {
        if (!visible.includes(id)) return null;
        switch (id) {
            case 'idx':
                return <td key="idx" className="c fit"><Zap size={13} /></td>;
            case 'item':
                return (
                    <td key="item" className="item">
                        <div className="vqdoc-combo" id="quick-entry-input">
                            <AsyncProductCombobox
                                selectedItem={draft.product}
                                value={quickQuery}
                                onQueryChange={setQuickQuery}
                                onSelect={pick}
                                onCreateNew={ctx.onCreateProduct}
                                defaultOptions={ctx.defaultProducts}
                                placeholder="Just start typing — the first keystroke lands here"
                                addNewLabel="Add New Product"
                                hideCostAndMargin={!ctx.isAdmin}
                                portal
                            />
                        </div>
                    </td>
                );
            case 'qty':
            case 'counted':
                return (
                    <td key={id} className="c fit">
                        <WheelInput
                            ref={qtyRef} type="number" className="vqdoc-cell c w-qty"
                            value={draft.quantity} onKeyDown={onKey}
                            onChange={(e) => set('quantity', num(e.target.value))}
                            onFocus={(e) => e.target.select()}
                        />
                    </td>
                );
            case 'free':
                return (
                    <td key="free" className="c fit">
                        <WheelInput type="number" className="vqdoc-cell c free w-qty"
                            value={draft.freeQuantity || ''} placeholder="0" onKeyDown={onKey}
                            onChange={(e) => set('freeQuantity', num(e.target.value))} />
                    </td>
                );
            case 'rate':
                return (
                    <td key="rate" className="n fit">
                        <WheelInput type="number" className="vqdoc-cell w-num"
                            value={draft.price} onKeyDown={onKey}
                            onChange={(e) => set('price', num(e.target.value))}
                            onFocus={(e) => e.target.select()} />
                    </td>
                );
            case 'disc':
                return (
                    <td key="disc" className="n fit">
                        <WheelInput type="number" className="vqdoc-cell w-num disc"
                            value={draft.discount} onKeyDown={onKey}
                            onChange={(e) => set('discount', num(e.target.value))} />
                    </td>
                );
            case 'del':
                return (
                    <td key="del" className="fit">
                        <button type="button" className="vqdoc-btn xs pri" onClick={commit} title="Add this line (Enter)">
                            <Plus size={13} /> Add
                        </button>
                    </td>
                );
            default:
                return <td key={id} className="fit" />;
        }
    };

    return (
        <tr className="quick">
            <td className="fit" />
            {visible.map(cell)}
        </tr>
    );
}
