import React, { useCallback, useEffect, useRef } from 'react';
import { GripVertical, Trash2, Plus, Minus, FileText } from 'lucide-react';
import DocumentQuickRow from '@/Documents/DocumentQuickRow';
import AsyncProductCombobox from '@/Components/AsyncProductCombobox';
import WheelInput from '@/Components/WheelInput';
import VqSelect from '@/Documents/VqSelect';
import { lineTotal } from '@/Documents/documentMoney';

/**
 * DocumentLines — the lines of any document, whatever they happen to be.
 *
 * A sales invoice has quantity, price and discount; a stock audit has expected
 * and counted; a goods receipt has ordered, received, batch and expiry; an
 * expense voucher has a category and an amount. Underneath they are the same
 * table with different columns, which is why every one of the old screens had
 * a hand-written copy of the same 200 lines of markup with two cells changed.
 *
 * A column is one entry in CELLS below. Adding "unit of measure" to every
 * document that wants it is one line here, not a change in thirteen files.
 */

const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };

/* One rule for "how many can I sell", shared with the product search. The
   payload does not always carry available_stock; the search falls back to
   stock minus reservations, so the row has to fall back the same way — or the
   list says 113 and the line says 0 for the same product. */
/* What to put under a quantity. On a document where goods ARRIVE, the number
   that matters is everything on the shelf: what is reserved for somebody else's
   order has no bearing on how many more you can buy, and showing "0 in stock"
   for a product with a hundred of them reserved is simply the wrong number.
   Where goods LEAVE, reservations are exactly what matters. */
export const stockOf = (product, stored, mode = 'available') => {
    if (mode === 'onhand' && product) {
        const total = parseFloat(product.stock_quantity);
        if (Number.isFinite(total)) return total;
    }
    return availableOf(product, stored);
};

export const availableOf = (product, stored) => {
    if (product) {
        if (product.available_stock !== undefined && product.available_stock !== null) {
            return num(product.available_stock);
        }
        const total = parseFloat(product.stock_quantity);
        if (Number.isFinite(total)) return Math.max(0, total - num(product.reserved_quantity));
    }
    return num(stored);
};

const HEADS = {
    idx: { label: '#', cls: 'c fit' },
    item: { label: 'Item', cls: 'item' },
    category: { label: 'Category', cls: 'item' },
    desc: { label: 'Description', cls: 'item' },
    ordered: { label: 'Ordered', cls: 'c fit' },
    qty: { label: 'Qty', cls: 'c fit' },
    counted: { label: 'Counted', cls: 'c fit' },
    expected: { label: 'On record', cls: 'c fit' },
    diff: { label: 'Difference', cls: 'c fit' },
    free: { label: 'Free', cls: 'c fit' },
    uom: { label: 'Unit', cls: 'c fit' },
    batch: { label: 'Batch', cls: 'c fit' },
    expiry: { label: 'Expires', cls: 'c fit' },
    rate: { label: 'Price', cls: 'n fit' },
    taxpct: { label: 'Tax %', cls: 'n fit' },
    bizpct: { label: 'Business %', cls: 'n fit' },
    cost: { label: 'Cost', cls: 'n fit' },
    disc: { label: 'Discount', cls: 'n fit' },
    amount: { label: 'Amount', cls: 'n fit' },
    total: { label: 'Amount', cls: 'n fit' },
    del: { label: '', cls: 'fit' },
};

/* Each entry renders the CONTROL for one column. The <td> is added by the
   table and left off by the card list, so one definition serves both and the
   phone layout can never drift from the desktop one. */
const CELLS = {
    idx: (item, idx) => <span className="vqdoc-idx">{idx + 1}</span>,

    item: (item, idx, c) => (
        /* The onboarding tour points at the first item cell. It was pointing at
           an id nothing rendered, so that step of the tour had no spotlight and
           never advanced by itself. */
        <div id={idx === 0 ? 'tour-invoice-product' : undefined}
            className="vqdoc-combo" style={{ position: 'relative', minWidth: 0 }}>
                <AsyncProductCombobox
                    selectedItem={item.product}
                    onSelect={(product) => c.onPickProduct(product, item.id)}
                    onCreateNew={c.onCreateProduct}
                    onEdit={c.onEditProduct}
                    defaultOptions={c.defaultProducts}
                    placeholder={c.itemPlaceholder || 'Search for an item'}
                    addNewLabel="Add New Product"
                    hideCostAndMargin={!c.isAdmin}
                    portal
                />
            {/* `lockItems` is not `locked`. A receipt or a return is seeded
                from the document it answers to: WHAT is on it is settled, but
                how many came back is exactly what the operator is here to
                type. Locking the whole row instead was how the old screens
                ended up re-typing the item list to change one quantity. */}
            {(c.locked || c.lockItems) && <div style={{ position: 'absolute', inset: 0, cursor: 'not-allowed' }} />}
        </div>
    ),

    category: (item, idx, c) => (
        <VqSelect
                ariaLabel="Expense category"
                disabled={c.locked}
                value={item.category_id ?? ''}
                placeholder="Choose a category"
                onChange={(v) => c.update(item.id, 'category_id', v)}
            options={(c.categories || []).map((x) => ({ value: x.id, label: x.name }))}
        />
    ),

    desc: (item, idx, c) => (
        <input
            type="text" className="vqdoc-in" value={item.desc || ''} disabled={c.locked}
            placeholder="What it was for"
            onChange={(e) => c.update(item.id, 'desc', e.target.value)}
        />
    ),

    /* Read-only, and deliberately so: this is what the order or the original
       invoice said, and it is the ceiling the line is checked against. */
    ordered: (item) => (
        <span style={{ color: 'var(--vq-text-3)' }}>{item.ordered_quantity ?? item.max_quantity ?? '—'}</span>
    ),

    qty: (item, idx, c) => {
        const cap = item.max_quantity;
        const over = cap !== undefined && cap !== null && num(item.quantity) > num(cap);
        return (
            <>
                <WheelInput
                    type="number"
                    className={`vqdoc-cell c w-qty ${over ? 'bad' : ''}`}
                    value={item.quantity ?? 1}
                    disabled={c.locked}
                    onChange={(e) => c.update(item.id, 'quantity', num(e.target.value))}
                    onWheel={(e) => { e.preventDefault(); const f = c.qtyFloor ?? 1; const cap = item.max_quantity; const next = num(item.quantity) + (e.deltaY < 0 ? 1 : -1); c.update(item.id, 'quantity', Math.min(cap === undefined || cap === null ? Infinity : num(cap), Math.max(f, next))); }}
                    onFocus={(e) => { e.target.select(); c.onCellFocus?.(); }}
                />
{over && <span className="vqdoc-stock" data-low="true">only {cap} available</span>}
                {!over && item.product && c.showStock && c.stockBadge !== false && (() => {
                    const n = stockOf(item.product, item.available_stock, c.stockMode);
                    /* Nothing on the shelf is only worth flagging where that
                       stops you — on a purchase it is the normal reason to be
                       buying, so it is stated, not warned about. */
                    return (
                        <span className="vqdoc-stock" data-low={c.stockMode !== 'onhand' && !(n > 0)}>
                            {n} {c.stockWord || 'in hand'}
                        </span>
                    );
                })()}
            </>
        );
    },

    counted: (item, idx, c) => (
        <WheelInput
                type="number" className="vqdoc-cell c w-qty"
                value={item.counted_quantity ?? 0} disabled={c.locked}
                onChange={(e) => c.update(item.id, 'counted_quantity', num(e.target.value))}
                onWheel={(e) => { e.preventDefault(); c.update(item.id, 'counted_quantity', Math.max(0, num(item.counted_quantity) + (e.deltaY < 0 ? 1 : -1))); }}
            onFocus={(e) => e.target.select()}
        />
    ),

    expected: (item) => (
        <span style={{ color: 'var(--vq-text-3)' }}>
            {item.product ? availableOf(item.product, item.available_stock) : '—'}
        </span>
    ),

    /* The size of the correction, and which way it goes. Short stock is the
       one that costs money, so it is the one that is coloured. */
    diff: (item) => {
        if (!item.product) return <span>—</span>;
        const on = availableOf(item.product, item.available_stock);
        const d = num(item.counted_quantity) - on;
        return (
            <span className="vqdoc-stock" data-low={d < 0} style={d > 0 ? { color: 'var(--vq-success)' } : undefined}>
                {d > 0 ? `+${d}` : d}
            </span>
        );
    },

    free: (item, idx, c) => (
        <WheelInput
                type="number" className="vqdoc-cell c free w-qty"
                value={item.freeQuantity || ''} placeholder="0" disabled={c.locked}
                onChange={(e) => c.update(item.id, 'freeQuantity', num(e.target.value))}
            onWheel={(e) => { e.preventDefault(); c.update(item.id, 'freeQuantity', Math.max(0, num(item.freeQuantity) + (e.deltaY < 0 ? 1 : -1))); }}
        />
    ),

    uom: (item) => (
        <span style={{ color: 'var(--vq-text-3)', fontSize: 'var(--d-t-2xs)' }}>
            {item.product?.unit || item.product?.uom || '—'}
        </span>
    ),

    batch: (item, idx, c) => (
        <input type="text" className="vqdoc-in c" style={{ width: 'var(--d-w-num)' }}
            value={item.batch || ''} placeholder="—" disabled={c.locked}
            onChange={(e) => c.update(item.id, 'batch', e.target.value)} />
    ),

    expiry: (item, idx, c) => (
        <input type="date" className="vqdoc-in c" style={{ width: 'var(--d-w-amt)' }}
            value={item.expiry || ''} disabled={c.locked}
            onChange={(e) => c.update(item.id, 'expiry', e.target.value)} />
    ),

    /* `readOnly.rate` is not `locked`. On a purchase return the value of a
       line is the FIFO batch cost it came in at — a real figure, worth showing,
       and not one this document is allowed to change. An editable box that the
       server ignores is the exact defect this kit exists to prevent. */
    rate: (item, idx, c) => (
        <WheelInput
                type="number" className="vqdoc-cell w-num"
                value={item.price ?? 0} disabled={c.locked || c.readOnly?.rate}
                onChange={(e) => c.update(item.id, 'price', num(e.target.value))}
            onWheel={(e) => { e.preventDefault(); const step = num(item.price) >= 100 ? 10 : 1; c.update(item.id, 'price', Math.max(0, num(item.price) + ((e.deltaY < 0 ? 1 : -1) * step))); }}
            onFocus={(e) => { e.target.select(); c.onCellFocus?.(); }}
        />
    ),

    /* What the supplier actually billed on this line. Blank means "whatever
       this product's rate is", which is where it starts. */
    taxpct: (item, idx, c) => (
        <WheelInput
            type="number" className="vqdoc-cell c w-qty"
            value={item.tax_rate ?? ''} disabled={c.locked}
            placeholder={item.product?.tax_rate ?? '0'}
            onChange={(e) => c.update(item.id, 'tax_rate', e.target.value === '' ? null : num(e.target.value))}
            onFocus={(e) => e.target.select()}
        />
    ),

    /* How much of this line was bought for the business. Anything below 100
       means part of its tax is not reclaimable, and the server splits it. */
    bizpct: (item, idx, c) => (
        <WheelInput
            type="number" className="vqdoc-cell c w-qty"
            value={item.business_pct ?? 100} disabled={c.locked}
            onChange={(e) => c.update(item.id, 'business_pct', Math.max(0, Math.min(100, num(e.target.value))))}
            onWheel={(e) => { e.preventDefault(); c.update(item.id, 'business_pct', Math.max(0, Math.min(100, num(item.business_pct ?? 100) + (e.deltaY < 0 ? 5 : -5)))); }}
            onFocus={(e) => e.target.select()}
        />
    ),

    disc: (item, idx, c) => (
        <div className="vqdoc-pair">
                <WheelInput
                    type="number" className="vqdoc-cell w-num disc"
                    value={item.discount ?? 0} disabled={c.locked || c.readOnly?.disc}
                    onChange={(e) => c.update(item.id, 'discount', num(e.target.value))}
                    onWheel={(e) => { e.preventDefault(); const step = item.discountType === 'percent' ? 1 : (num(item.price) >= 100 ? 5 : 1); c.update(item.id, 'discount', Math.max(0, num(item.discount) + ((e.deltaY < 0 ? 1 : -1) * step))); }}
                />
                <button
                    type="button" className="vqdoc-flip"
                    data-on={item.discountType === 'percent' ? 'true' : 'false'}
                    disabled={c.locked || c.readOnly?.disc}
                    title={item.discountType === 'percent' ? 'Percentage off' : 'Amount off'}
                    onClick={() => !c.locked && c.update(item.id, 'discountType', item.discountType === 'fixed' ? 'percent' : 'fixed')}
                >
                {item.discountType === 'percent' ? '%' : c.currency}
            </button>
        </div>
    ),

    amount: (item, idx, c) => (
        <WheelInput
            type="number" className="vqdoc-cell total w-amt"
            value={item.amount ?? 0} disabled={c.locked}
            onChange={(e) => c.update(item.id, 'amount', num(e.target.value))}
            onFocus={(e) => e.target.select()}
        />
    ),

    /* The amount is editable, and the little button says which way the sum is
       solved when you edit it — change the price, or change the quantity. */
    total: (item, idx, c) => (
        <div className="vqdoc-pair">
                <button
                    type="button" className="vqdoc-flip"
                    data-on={c.totalMode(item.id) === 'price' ? 'true' : 'false'}
                    disabled={c.locked || c.readOnly?.total}
                    title={c.totalMode(item.id) === 'price' ? 'Editing the amount changes the price' : 'Editing the amount changes the quantity'}
                    onClick={() => !c.locked && c.toggleTotalMode(item.id)}
                >
                    {c.totalMode(item.id) === 'price' ? c.currency : '#'}
                </button>
                <WheelInput
                    type="number" className="vqdoc-cell total w-amt"
                    value={parseFloat(lineTotal(item).toFixed(2))} disabled={c.locked || c.readOnly?.total}
                    onChange={(e) => c.onTotalChange(item, e.target.value)}
                    onWheel={(e) => { e.preventDefault(); const cur = lineTotal(item); const step = cur >= 100 ? 10 : 1; c.onTotalChange(item, String(Math.max(0, cur + ((e.deltaY < 0 ? 1 : -1) * step)))); }}
                onFocus={(e) => e.target.select()}
            />
        </div>
    ),

    del: (item, idx, c) => (!c.locked ? (
        <button type="button" className="vqdoc-icon sm quiet danger" onClick={() => c.remove(item.id)} title="Remove this line">
            <Trash2 size={15} />
        </button>
    ) : null),
};

export default function DocumentLines({ doc, chrome, items = [], ctx, onQuickAdd }) {
    const { level, asCards, armedRow, setArmedRow, showQuickEntry } = chrome;
    const boxRef = useRef(null);
    const count = items.length;

    /* Three things decide whether a column is on screen: the document has to
       carry it at all, the detail level has to want it, and — for the ones
       with a switch — the operator has to want it. A column the document does
       not list can never come back, whatever is in saved preferences. */
    const visible = doc.columns.filter((id) => {
        if (id === 'del' || id === 'item' || id === 'category' || id === 'desc') return true;
        if (id === 'free') return ctx.freeOn && (level.cols.includes('free') || items.some((i) => num(i.freeQuantity) > 0));
        if (id === 'disc') return ctx.canDiscount && level.cols.includes('disc');
        if (id === 'idx' || id === 'uom') return level.cols.includes(id);
        /* A document that lists these lists them because they are the point:
           the rate the supplier actually billed, and how much of the line was
           bought for the business. Hiding them behind the detail level meant a
           fresh install had neither column, so the rate fell back to the
           product's and a part-private purchase claimed its input tax in full —
           with nothing on screen to say either had happened. They still drop
           out on a narrow screen, like every other column. */
        if (id === 'taxpct' || id === 'bizpct') return !asCards;
        return true;
    });

    /* Picking a product into the LAST row grows the document by one, so entry
       never stops to hunt for an "Add" button. Wrapping it here means every
       document gets it rather than each remembering to. */
    const pick = useCallback((product, id) => {
        ctx.onPickProduct(product, id);
        if (items.length && items[items.length - 1].id === id && ctx.addLine) ctx.addLine();
    }, [ctx, items]);
    const cellCtx = { ...ctx, onPickProduct: pick };

    /* A new row that appears below the fold may as well not have appeared. */
    const grew = useRef(count);
    useEffect(() => {
        if (count > grew.current && boxRef.current) {
            boxRef.current.scrollTo({ top: boxRef.current.scrollHeight, behavior: 'smooth' });
        }
        grew.current = count;
    }, [count]);

    /* The empty state is drawn here, from the document's own words, with a
       colSpan taken from the columns that are actually on screen. Each page
       passing its own guessed number is how a purchase came to span twelve
       columns in a table that had eight. */
    const empty = !count && !showQuickEntry ? (
        <tr>
            <td colSpan={visible.length + 1}>
                <div className="vqdoc-empty">
                    <span className="ico"><FileText size={22} /></span>
                    <p>{doc.emptyTitle || `Nothing on this ${doc.name.toLowerCase()} yet`}</p>
                    <small>{doc.emptyHint || 'Add an item below.'}</small>
                </div>
            </td>
        </tr>
    ) : null;

    const quickRow = showQuickEntry && !ctx.locked && onQuickAdd ? (
        <DocumentQuickRow doc={doc} chrome={chrome} ctx={cellCtx} visible={visible} onCommit={onQuickAdd} />
    ) : null;

    if (asCards) {
        return <CardList doc={doc} chrome={chrome} items={items} ctx={cellCtx} visible={visible} />;
    }

    return (
        <div className="vqdoc-linesbox" ref={boxRef}>
            <table className="vqdoc-lines">
                <thead>
                    <tr>
                        <th className="fit" aria-label="Reorder" />
                        {visible.map((id) => (
                            <th key={id} className={HEADS[id]?.cls}>{HEADS[id]?.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {quickRow}
                    {!items.length && empty}
                    {items.map((item, idx) => (
                        <tr
                            key={item.id}
                            className={`${ctx.draggedIndex === idx ? 'dragging' : ''} ${ctx.invalid?.includes(idx) ? 'bad' : ''}`}
                            draggable={armedRow === idx && !ctx.locked}
                            onDragStart={(e) => ctx.onDragStart?.(e, idx)}
                            onDragOver={(e) => ctx.onDragOver?.(e, idx)}
                            onDragEnd={() => { ctx.onDragEnd?.(); setArmedRow(null); }}
                        >
                            {/* The row is armed by the grip, not by itself: a
                                draggable <tr> steals text selection from every
                                input inside it. */}
                            <td className="fit">
                                <span
                                    className="grip" title="Drag to reorder"
                                    onPointerDown={() => { if (!ctx.locked) setArmedRow(idx); }}
                                    onPointerUp={() => setArmedRow(null)}
                                >
                                    <GripVertical size={14} />
                                </span>
                            </td>
                            {visible.map((id) => (
                                <td key={id} className={HEADS[id]?.cls}>{CELLS[id]?.(item, idx, cellCtx)}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* On a phone the table becomes a list of cards, one tap to open a line and
   edit it properly. Same columns, same handlers, different shape. */
function CardList({ doc, chrome, items, ctx, visible }) {
    const { openLine, setOpenLine } = chrome;
    const priced = doc.money.lines === 'priced';

    return (
        <div className="vqdoc-linesbox">
            {!items.length && (
                <div className="vqdoc-empty">
                    <span className="ico"><FileText size={22} /></span>
                    <p>{doc.emptyTitle || `Nothing on this ${doc.name.toLowerCase()} yet`}</p>
                    <small>{doc.emptyHint || 'Add an item below.'}</small>
                </div>
            )}
            {items.map((item, idx) => {
                const open = openLine === item.id;
                return (
                    <React.Fragment key={item.id}>
                        <div className={`vqdoc-card ${open ? 'open' : ''}`} onClick={() => setOpenLine(open ? null : item.id)}>
                            <div className="top">
                                <span className="vqdoc-idx">{idx + 1}</span>
                                <span className="nm">{item.product?.name || item.name || item.desc || 'Choose an item'}</span>
                                {priced && <span className="amt">{ctx.money(lineTotal(item))}</span>}
                                {doc.money.lines === 'amount' && <span className="amt">{ctx.money(num(item.amount))}</span>}
                            </div>
                            <div className="mini-row">
                                {visible.includes('qty') && <span className="vqdoc-mini"><span className="k">Qty</span><span className="v">{item.quantity ?? 0}</span></span>}
                                {visible.includes('counted') && <span className="vqdoc-mini"><span className="k">Counted</span><span className="v">{item.counted_quantity ?? 0}</span></span>}
                                {visible.includes('free') && !!item.freeQuantity && <span className="vqdoc-mini"><span className="k">Free</span><span className="v">{item.freeQuantity}</span></span>}
                                {priced && <span className="vqdoc-mini"><span className="k">Price</span><span className="v">{item.price ?? 0}</span></span>}
                                {visible.includes('disc') && !!item.discount && (
                                    <span className="vqdoc-mini"><span className="k">Off</span><span className="v">{item.discount}{item.discountType === 'percent' ? '%' : ''}</span></span>
                                )}
                            </div>
                        </div>
                        {open && (
                            <div className="vqdoc-adjust" onClick={(e) => e.stopPropagation()}>
                                {visible.filter((id) => id !== 'idx' && id !== 'del' && id !== 'diff' && id !== 'expected' && id !== 'ordered').map((id) => (
                                    <div key={id} className="f" style={id === 'item' || id === 'desc' || id === 'category' ? { gridColumn: '1 / -1' } : undefined}>
                                        <span className="vqdoc-lbl">{HEADS[id]?.label || id}</span>
                                        {id === 'qty' ? (
                                            <div className="vqdoc-stepper">
                                                <button type="button" disabled={ctx.locked} onClick={() => ctx.update(item.id, 'quantity', Math.max(0, num(item.quantity) - 1))}><Minus size={15} /></button>
                                                <input type="number" value={item.quantity ?? 1} disabled={ctx.locked} onChange={(e) => ctx.update(item.id, 'quantity', num(e.target.value))} />
                                                <button type="button" disabled={ctx.locked} onClick={() => ctx.update(item.id, 'quantity', num(item.quantity) + 1)}><Plus size={15} /></button>
                                            </div>
                                        ) : CELLS[id]?.(item, idx, ctx)}
                                    </div>
                                ))}
                                {!ctx.locked && (
                                    <div className="f" style={{ gridColumn: '1 / -1' }}>
                                        <button type="button" className="vqdoc-btn danger" onClick={() => { setOpenLine(null); ctx.remove(item.id); }}>
                                            <Trash2 size={15} /> Remove this line
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}
