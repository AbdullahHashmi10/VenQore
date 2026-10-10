/* ==========================================================================
   Checkout & returns
   ========================================================================== */

import React from 'react';
import { Receipt, X, Plus, UtensilsCrossed, Undo2 } from 'lucide-react';
import { useSettingsCtx } from '../context';
import { Page, Section, Row, Switch, Segmented, Stepper, Button, Callout, Tag } from '../primitives';

export function CheckoutPage() {
    const { p, flash, storeVal, saveStore } = useSettingsCtx();
    const presets = p.discountPresets || [];
    const locked = !p.canManageStore;
    const returnPolicy = storeVal('pos_return_mode', 'reference');
    const returnWindow = Number(storeVal('pos_return_window', 0)) || 0;
    const windowRule = storeVal('pos_return_window_behavior', 'warn');

    return (
        <Page icon={Receipt} title="Checkout & returns"
              intro="What appears on a sale, how the total is worked out, the quick discount buttons, and how refunds are handled.">
            <Section title="Extra options on a sale" scope="device"
                     desc="Turn on only what this till needs. Each one adds a control to the sale screen.">
                <Row sid="checkout.tax" flash={flash} title="Tax on sales"
                     desc="Adds tax to the bill using your standard rate, with a switch on each sale for prices that already include tax. Turn off if you do not charge tax at this till."
                     example={<>Your standard rate is <b>{Number(storeVal('default_tax_rate', 0)) || 0}%</b> — change it in <b>Tax &amp; rounding</b>.</>}>
                    <Switch label="Tax on sales" checked={!!p.enableTax} onChange={p.setEnableTax} />
                </Row>
                <Row sid="checkout.free" flash={flash} title="Free items (bonus quantity)"
                     desc="Lets you add free units to a line — for example 'buy 10, get 1 free'. Free units leave stock but are not charged.">
                    <Switch label="Free items" checked={!!p.enableFreeQty} onChange={p.setEnableFreeQty} />
                </Row>
                <Row sid="checkout.calc" flash={flash} title="Quick price calculator"
                     desc="Shows a ⇆ button on each line to work out quantity from an amount, or the price per unit from a total. Also opens with F6.">
                    <Switch label="Quick price calculator" checked={p.showItemConverter !== false} onChange={p.setShowItemConverter} />
                </Row>
                <Row sid="checkout.fulfilment" flash={flash} title="Delivery from stock or from a supplier"
                     desc="Adds a choice on the sale: send from your own stock, or have the supplier deliver straight to the customer (drop-shipping). Most shops leave this off.">
                    <Switch label="Fulfilment choice" checked={!!p.enableFulfilment} onChange={p.setEnableFulfilment} />
                </Row>
            </Section>

            <Section title="Total and cash" scope="device">
                <Row sid="checkout.round" flash={flash} title="Round the total on this till"
                     desc="Rounds what the customer pays, using the rounding rule set for the business, and shows the difference as its own line on the bill."
                     example={<>Business rule: <b>{roundLabel(storeVal('round_off_total', 'none'))}</b> — change it in <b>Tax &amp; rounding</b>.</>}>
                    <Switch label="Round the total" checked={!!p.roundOff} onChange={p.setRoundOff} />
                </Row>
                <Row sid="checkout.autofill" flash={flash} title="Fill in the exact cash"
                     desc="The 'amount received' box starts at the exact total, so an exact-cash or card sale is one tap. Type over it when the customer hands you more.">
                    <Switch label="Fill in the exact cash" checked={!!p.autoFillCash} onChange={p.setAutoFillCash} />
                </Row>
                <Row sid="checkout.discounts" stacked flash={flash} title="Quick discount buttons"
                     desc="The percentages offered as one-tap buttons when giving a discount. Tap a button to remove it, or a dashed one to add it.">
                    <div className="vqs-chips">
                        {presets.map(v => (
                            <button key={v} type="button" className="vqs-chip" aria-pressed="true" title={`Remove ${v}%`}
                                    onClick={() => p.setDiscountPresets?.(presets.filter(x => x !== v))}>
                                <span className="vqs-num">{v}%</span><X size={13} />
                            </button>
                        ))}
                        {[5, 10, 15, 20, 25, 30, 50].filter(v => !presets.includes(v)).map(v => (
                            <button key={v} type="button" className="vqs-chip" data-dashed="1" title={`Add ${v}%`}
                                    onClick={() => p.setDiscountPresets?.([...presets, v].sort((a, b) => a - b))}>
                                <Plus size={13} /><span className="vqs-num">{v}%</span>
                            </button>
                        ))}
                    </div>
                </Row>
            </Section>

            <Section title="Returns and refunds" desc="Return mode is a switch for this till. The return rules apply to every till.">
                <Row sid="checkout.returns-mode" flash={flash}
                     title="Return mode"
                     desc="Turns this register into a refund counter: the next sale you complete becomes a refund (credit note) instead of a sale. Switch it off again when you are done."
                     tags={p.returnMode ? <Tag tone="danger"><Undo2 size={11} /> On now</Tag> : null}>
                    <Switch label="Return mode" tone="danger" checked={!!p.returnMode} onChange={p.setReturnMode} />
                </Row>
                <Row sid="checkout.return-policy" stacked flash={flash}
                     title={<>What a return needs <Tag tone="accent">Whole business</Tag></>}
                     desc="How strict refunds are. 'Receipt number' is safest: staff must find the original sale. 'Open' lets staff refund anything — only use it if you trust every cashier.">
                    <Segmented label="What a return needs" disabled={locked} value={returnPolicy}
                               onChange={v => saveStore('checkout_returns', { pos_return_mode: v })}
                               options={[
                                   { value: 'reference', label: 'Receipt number' },
                                   { value: 'customer_or_reference', label: 'Receipt or customer' },
                                   { value: 'open', label: 'Open — no proof' },
                               ]} />
                    {returnPolicy === 'open' && (
                        <div style={{ marginTop: 10 }}>
                            <Callout tone="warn">Open returns cannot be checked against a sale. Anyone at the till can refund any amount.</Callout>
                        </div>
                    )}
                </Row>
                <Row sid="checkout.return-window" flash={flash}
                     title={<>How long returns are allowed <Tag tone="accent">Whole business</Tag></>}
                     desc={returnWindow
                         ? `Items sold more than ${returnWindow} days ago ${windowRule === 'block' ? 'cannot be returned' : 'show a warning before they can be returned'}.`
                         : 'No time limit: items can be returned whenever.'}>
                    <Stepper label="days" disabled={locked} value={returnWindow} min={0} max={365} step={returnWindow >= 30 ? 15 : 7}
                             onChange={v => saveStore('checkout_returns', { pos_return_window: v })}
                             format={v => (v ? `${v} days` : 'No limit')} />
                    {returnWindow > 0 && (
                        <Segmented label="After the limit" disabled={locked} value={windowRule}
                                   onChange={v => saveStore('checkout_returns', { pos_return_window_behavior: v })}
                                   options={[{ value: 'warn', label: 'Warn' }, { value: 'block', label: 'Block' }]} />
                    )}
                </Row>
                {locked && <Callout tone="warn">Only an owner or manager can change the return rules.</Callout>}
            </Section>

            {!p.restaurantRelevant && p.restaurantAvailable !== false && (
                <Section title="Do you cook or prepare orders?" desc="Cafés, bakeries and juice bars that make what they sell get kitchen tickets and a kitchen screen. Tables, takeaway and delivery live in Front of House.">
                    <Row sid="checkout.restaurant-on" flash={flash}
                         title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><UtensilsCrossed size={17} /> Restaurant and café tools</span>}
                         desc="Turns on kitchen tickets for the whole business and adds the Kitchen tickets page to these settings. Nothing changes for shops that sell ready-made goods.">
                        <Button v="soft" disabled={locked} onClick={() => p.setPreparesOrders?.(true)}>Turn on</Button>
                    </Row>
                </Section>
            )}
        </Page>
    );
}

export function roundLabel(v) {
    const s = String(v ?? 'none');
    if (s === 'none' || s === '' || s === 'null') return 'no rounding';
    if (s === '0' || s === '1' || s === 'true') return 'to the nearest whole amount';
    return `to ${s} decimal places`;
}
