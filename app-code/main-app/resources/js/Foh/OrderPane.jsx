import React, { useCallback, useMemo, useState } from 'react';
import { CreditCard, Printer, Check } from 'lucide-react';
import OrderHeader from './OrderHeader';
import CartLines from './CartLines';
import CatalogPane from './CatalogPane';
import { VariantPicker, TablePicker, ConfirmBar } from './OrderDialogs';
import useFohOrder, { lineKey } from './useFohOrder';
import { computeTotals } from '@/Sell/core/cartMath';
import ModifierSheet from '@/Pos/Table/ModifierSheet';
import SplitSheet from '@/Pos/Table/SplitSheet';
import { MoveSheet } from '@/Pos/Table/TableBar';
import { DeliveryPanel } from '@/Pos/Table/Delivery';
import PaymentModal from '@/Components/Pos/PaymentModal';
import ApprovalPinModal from '@/Components/Pos/ApprovalPinModal';
import OpenShiftModal from '@/Components/Pos/OpenShiftModal';

const readFlag = (v, dflt) => (v === undefined || v === null || v === '' ? dflt : !['0', 'false', 'off', 'no'].includes(String(v).toLowerCase()));

/**
 * One order, whatever its type. The menu on the left, the order on the right.
 * Everything that is not arithmetic lives in a hook (useFohOrder / useFohCheckout)
 * or in the shared Sale Core, so this file only wires screens to actions.
 */
export default function OrderPane({
    card, tables, catalog, settings, storeSlug, caps, money, checkout, enabledTypes,
    bankAccounts = [], fohSettings = {}, onBack, onToast, onAfterPaid,
}) {
    const order = useFohOrder({ tables, card });
    const { cart, extras } = order;
    const [variantFor, setVariantFor] = useState(null);       // { product, variants }
    const [modifierFor, setModifierFor] = useState(null);     // { product, variant }
    const [modifierGroups, setModifierGroups] = useState([]);
    const [modifierLoading, setModifierLoading] = useState(false);
    const [splitOpen, setSplitOpen] = useState(false);
    const [moving, setMoving] = useState(false);
    const [seating, setSeating] = useState(false);
    const [closing, setClosing] = useState(false);
    const [mobileTab, setMobileTab] = useState('order');

    const isTable = card.kind !== 'ticket';
    const meta = useMemo(() => ({ covers: card.covers, orderType: card.order_type, note: extras.remarks || '' }), [card.covers, card.order_type, extras.remarks]);

    /* What this payment covers: unpaid lines, narrowed to the picked lines of a split part. */
    const payable = useMemo(() => {
        const unpaid = cart.filter((l) => !l.paidSaleId);
        const ps = card.pending_settle;
        if (ps && ps.mode === 'lines' && Array.isArray(ps.line_ids)) {
            const ids = new Set(ps.line_ids.map(String));
            return unpaid.filter((l) => ids.has(String(lineKey(l))));
        }
        return unpaid;
    }, [cart, card.pending_settle]);

    const deliveryFee = Number(card.delivery?.fee) || 0;
    const sale = useMemo(() => ({
        cart: payable,
        customer: extras.customer, walkInName: extras.walkInName, remarks: extras.remarks,
        discountType: extras.discountType, discountValue: extras.discountValue,
        tipAmount: extras.tipAmount,
        additionalCharges: deliveryFee, additionalChargesLabel: deliveryFee ? 'Delivery Fee' : '', delivery_charge: deliveryFee,
    }), [payable, extras, deliveryFee]);

    const totals = useMemo(() => computeTotals({
        cart: payable, sale, settings,
        enableTax: settings?.enable_tax !== '0',
        enableFreeQty: false,
        tableMode: true,
        serviceChargePct: parseFloat(settings?.service_charge_percent || 0) || 0,
        tipEnabled: true,
        roundOff: readFlag(settings?.round_off_total, false),
    }), [payable, sale, settings]);

    /* ── adding to the order ─────────────────────────────────────────── */
    const finishAdd = useCallback((product, variant, mods) => {
        order.addProduct(product, variant, mods);
    }, [order]);

    const askAddOns = useCallback(async (product, variant) => {
        setModifierLoading(true);
        const groups = await catalog.modifierGroups(product);
        setModifierLoading(false);
        if (!groups.length) { finishAdd(product, variant, []); return; }
        setModifierGroups(groups);
        setModifierFor({ product, variant });
    }, [catalog, finishAdd]);

    const onPick = useCallback(async (product) => {
        if (product.eighty_sixed) return;
        const variants = product.has_variants ? await catalog.variantsOf(product) : [];
        if (variants.length) { setVariantFor({ product, variants }); return; }
        askAddOns(product, null);
    }, [catalog, askAddOns]);

    /* ── order-level actions ─────────────────────────────────────────── */
    const save = useCallback(() => tables.flushOrder(card.occupancy_id, order.getCart(), meta), [tables, card.occupancy_id, order, meta]);

    const fire = async () => {
        await save();
        const res = await tables.sendToKitchen(card.occupancy_id);
        if (res) order.markFired();
    };
    const bill = async () => {
        await save();
        await tables.dropCheck(card.occupancy_id, !!card.check_dropped_at);
    };
    /* Pay-first takeaway (fast food): one button pays AND sends the order to the kitchen. */
    const payFirst = card.order_type === 'takeaway' && fohSettings.takeaway_flow === 'pay_first';
    const pay = async () => {
        await save();
        if (payFirst && order.unsentCount > 0) {
            const res = await tables.sendToKitchen(card.occupancy_id);
            if (res) order.markFired();
        }
        checkout.begin(null);
    };
    const confirmSplit = async (spec) => {
        setSplitOpen(false);
        await save();
        if (spec.mode === 'lines') {
            const res = await tables.split(card.occupancy_id, spec);
            if (res) onToast?.(`${spec.line_ids.length} line${spec.line_ids.length === 1 ? '' : 's'} moved to this bill: take the payment`, 'info');
            return;
        }
        checkout.begin(spec.mode === 'covers' ? { ways: spec.parts } : { amount: spec.amount });
    };
    const convertTo = async (to) => {
        if (to === 'dine_in') { setSeating(true); return; }
        await save();
        const res = await tables.convert(card.occupancy_id, to);
        if (res) onToast?.(`Now ${to === 'delivery' ? 'a delivery' : 'a takeaway'}`, 'success');
    };
    const seatAt = async (position, covers) => {
        await save();
        const res = await tables.convert(card.occupancy_id, 'dine_in', { position_id: position.id, covers });
        setSeating(false);
        if (res) onToast?.(`Seated at ${position.code}`, 'success');
    };
    const closeOrder = async () => {
        setClosing(false);
        const res = await tables.closeTable(card.occupancy_id, cart.length > 0);
        if (res) onBack?.();
    };

    const onComplete = async (paymentData) => {
        const out = await checkout.complete(paymentData, { card, sale, totals, partId: card.pending_settle?.id || null });
        if (out) onAfterPaid?.(out);
    };

    const mayPay = caps?.canPay !== false;
    const unsent = order.unsentCount;
    const due = totals.cartTotal;

    return (
        <div className="foh-order" data-mobile-tab={mobileTab}>
            <OrderHeader
                card={card} covers={card.covers || 1} unsent={unsent} busy={tables.busy}
                elapsedLabel={null} checkDropped={!!card.check_dropped_at} enabledTypes={enabledTypes}
                onBack={onBack} onCovers={(n) => tables.pushOrder(card.occupancy_id, order.getCart(), { ...meta, covers: n }, true)}
                onFire={fire} onBill={bill} onSplit={() => setSplitOpen(true)} onMove={() => setMoving(true)}
                onClose={() => (cart.length ? setClosing(true) : closeOrder())} onConvert={convertTo}
                canDiscard={caps?.canVoid !== false || cart.length === 0}
            />

            <div className="foh-mobile-tabs" role="tablist">
                <button type="button" role="tab" aria-selected={mobileTab === 'menu'} onClick={() => setMobileTab('menu')}>Menu</button>
                <button type="button" role="tab" aria-selected={mobileTab === 'order'} onClick={() => setMobileTab('order')}>Order ({cart.length})</button>
            </div>

            <div className="foh-split">
                <CatalogPane catalog={catalog} eightySixIds={tables.eightySixIds} money={money} onPick={onPick} />

                <section className="foh-cart" aria-label="Order">
                    {card.delivery && (
                        <DeliveryPanel ticket={card} money={money} onUpdate={(patch) => tables.updateDelivery(card.occupancy_id, patch)} onError={(m) => onToast?.(m, 'error')} />
                    )}
                    <div className="foh-cart-scroll">
                        <CartLines
                            cart={cart} money={money} canVoid={caps?.canVoid !== false} showCourse={isTable}
                            onQty={order.setQty} onRemove={order.removeLine} onPatch={order.patchLine}
                        />
                    </div>

                    <div className="foh-totals">
                        <div><span>Subtotal</span><b className="vq-num">{money(totals.subtotal)}</b></div>
                        {totals.totalDiscounts > 0 && <div><span>Discount</span><b className="vq-num">-{money(totals.totalDiscounts)}</b></div>}
                        {totals.taxAmount > 0 && <div><span>Tax</span><b className="vq-num">{money(totals.taxAmount)}</b></div>}
                        {totals.serviceCharge > 0 && <div><span>Service {totals.serviceChargePct}%</span><b className="vq-num">{money(totals.serviceCharge)}</b></div>}
                        {deliveryFee > 0 && <div><span>Delivery fee</span><b className="vq-num">{money(deliveryFee)}</b></div>}
                        <label className="foh-tip">
                            <span>Tip</span>
                            <input type="number" min="0" inputMode="decimal" value={extras.tipAmount} onChange={(e) => order.patchExtras({ tipAmount: e.target.value })} aria-label="Tip amount" />
                        </label>
                        <div className="foh-due"><span>Total payable</span><b className="vq-num">{money(due)}</b></div>
                    </div>

                    <div className="foh-pay">
                        {mayPay ? (
                            <button type="button" className="vqt-btn vqt-btn-go foh-pay-btn" data-primary="1" disabled={!payable.length || tables.busy || checkout.processing} onClick={pay}>
                                <CreditCard size={18} aria-hidden="true" /> {payFirst && unsent > 0 ? 'Pay & send to kitchen' : 'Pay'} {payable.length ? money(due) : ''}
                            </button>
                        ) : (
                            <button type="button" className="vqt-btn foh-pay-btn" disabled={!cart.length || tables.busy} onClick={bill}>
                                <Printer size={18} aria-hidden="true" /> {card.check_dropped_at ? 'Bill printed' : 'Print bill for the cashier'}
                            </button>
                        )}
                    </div>
                </section>
            </div>

            <VariantPicker
                product={variantFor?.product} variants={variantFor?.variants || []} money={money}
                onCancel={() => setVariantFor(null)}
                onPick={(v) => { const p = variantFor.product; setVariantFor(null); askAddOns(p, v); }}
            />

            <ModifierSheet
                open={!!modifierFor} product={modifierFor?.product} groups={modifierGroups} loading={modifierLoading} money={money}
                onCancel={() => { setModifierFor(null); setModifierGroups([]); }}
                onConfirm={(mods) => { const m = modifierFor; setModifierFor(null); setModifierGroups([]); finishAdd(m.product, m.variant, mods); }}
            />

            {isTable && (
                <SplitSheet
                    open={splitOpen} lines={cart.filter((l) => !l.paidSaleId)} remaining={due} covers={card.covers || 2} money={money}
                    busy={tables.busy} onCancel={() => setSplitOpen(false)} onConfirm={confirmSplit}
                />
            )}

            {isTable && moving && (
                <MoveSheet
                    from={card} positions={tables.positions} busy={tables.busy} onCancel={() => setMoving(false)}
                    onTransfer={async (to) => { setMoving(false); await save(); const r = await tables.transfer(card.occupancy_id, to.id); if (r) tables.select(to.id); }}
                    onMerge={async (to) => { setMoving(false); await save(); const r = await tables.merge(card.occupancy_id, to.occupancy_id); if (r) tables.select(to.id); }}
                />
            )}

            {seating && <TablePicker positions={tables.positions} busy={tables.busy} onCancel={() => setSeating(false)} onPick={seatAt} />}

            {closing && (
                <ConfirmBar
                    title={`Discard ${card.code}?`} danger confirmLabel="Discard"
                    body="This order has items on it. Discarding removes it without a sale; items already sent to the kitchen are cancelled."
                    onCancel={() => setClosing(false)} onConfirm={closeOrder}
                />
            )}

            <PaymentModal
                isOpen={checkout.paymentOpen} onClose={checkout.close} totalAmount={due} onComplete={onComplete}
                currency={settings?.currency_code || settings?.currency || 'PKR'} bankAccounts={bankAccounts}
                customer={extras.customer} defaultPrintReceipt seedSplit={checkout.seedSplit}
            />

            {checkout.approval && (
                <ApprovalPinModal
                    request={checkout.approval.info} storeSlug={storeSlug} busy={checkout.processing} money={money} zIndex="z-modal"
                    onClose={() => checkout.setApproval(null)}
                    onSubmit={(a) => checkout.complete(checkout.approval.paymentData, checkout.approval.ctx, a).then((out) => out && onAfterPaid?.(out))}
                />
            )}

            <OpenShiftModal
                isOpen={checkout.shift.showOpenShiftModal} onClose={() => checkout.shift.setShowOpenShiftModal(false)}
                onSuccess={(s, m) => { checkout.shift.setRegisterShift(s); checkout.shift.setShiftMetrics(m); onToast?.(`Shift #${s.id} opened`, 'success'); }}
                registerId={settings?.register_id || 'REG-1'}
            />
        </div>
    );
}
