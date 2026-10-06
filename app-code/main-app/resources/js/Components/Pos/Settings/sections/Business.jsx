/* ==========================================================================
   Whole business: receipts, stock & prices, tax & rounding, cash & security
   ==========================================================================
   These pages edit the SAME store settings as Settings in the main menu —
   through the same endpoint, section by section — so there is still exactly
   one place each value lives. The register reloads them the moment a save
   lands, which is why a change here shows on the very next sale.
   ========================================================================== */

import React from 'react';
import {
    Printer, Boxes, Landmark, Wallet, ExternalLink, Unlock, Lock, ShieldCheck, Clock,
    FileText, ArrowLeftRight,
} from 'lucide-react';
import { useSettingsCtx, truthy } from '../context';
import { Page, Section, Row, Switch, Segmented, Stepper, Field, Button, Callout, Tag } from '../primitives';

function LockedNote() {
    return (
        <Callout tone="warn" icon={Lock}>
            You can see these settings, but only an <b>owner or manager</b> can change them. Ask one of them to sign in,
            or change them in <b>Settings</b> from the main menu.
        </Callout>
    );
}

function settingsLink(p, hash) {
    try { return `${route('store.settings', { store_slug: p.storeSlug })}#${hash}`; } catch (_) { return null; }
}

export function ReceiptsPage() {
    const { p, flash, storeVal, saveStore } = useSettingsCtx();
    const locked = !p.canManageStore;
    const b = (k, d) => truthy(storeVal(k, d ? '1' : '0'));
    const save = patch => saveStore('printer_device', patch);
    const type = storeVal('default_print_type', 'regular') === 'thermal' ? 'thermal' : 'regular';
    const thermal = type === 'thermal';
    const designer = settingsLink(p, 'document_layouts');

    const detailToggles = [
        ['thermal_show_headers', 'Column headings', 'A heading row (Item / Amount) above the items.'],
        ['thermal_show_sno', 'Line numbers', '1, 2, 3… in front of each item.'],
        ['thermal_show_units', 'Units', 'pcs, kg, box… after each quantity.'],
        ['thermal_show_mrp', 'Printed price (MRP)', 'The maximum retail price next to your price, so customers see the saving.'],
        ['thermal_show_description', 'Product description', 'A short description under the product name.'],
        ['thermal_show_batch', 'Batch number', 'For medicines and food with batch numbers.'],
        ['thermal_show_expiry', 'Expiry date', 'For items that expire.'],
    ];

    return (
        <Page icon={Printer} title="Receipts"
              intro="What the printed receipt looks like and when it prints. The preview on the right is drawn from your business details.">
            {locked && <LockedNote />}
            <Section title="Paper and printing" scope="store" locked={locked}>
                <Row sid="receipt.type" stacked flash={flash} title="Receipt type"
                     desc="Most tills use a small roll printer (thermal). Choose full page if you print on A4 paper with a normal office printer.">
                    <Segmented label="Receipt type" disabled={locked} value={type}
                               onChange={v => save({ default_print_type: v })}
                               options={[{ value: 'thermal', label: 'Roll receipt (thermal)' }, { value: 'regular', label: 'Full page (A4)' }]} />
                </Row>
                {thermal && (
                    <Row sid="receipt.width" stacked flash={flash} title="Paper roll width"
                         desc="Measure the paper roll in your printer. 80mm is the usual size; 58mm is the small one used by portable printers.">
                        <Segmented label="Paper roll width" disabled={locked} value={storeVal('thermal_page_size', '3inch')}
                                   onChange={v => save({ thermal_page_size: v })}
                                   options={[{ value: '2inch', label: '58mm (small)' }, { value: '3inch', label: '80mm (standard)' }, { value: '4inch', label: '100mm (wide)' }]} />
                    </Row>
                )}
                <Row sid="receipt.auto" flash={flash} title={<>Print after every sale <Tag>This device</Tag></>}
                     desc="Prints the receipt as soon as a sale is paid, without asking. Turn off to print only when the customer wants one.">
                    <Switch label="Print after every sale" checked={!!p.printOnComplete} onChange={p.setPrintOnComplete} />
                </Row>
                {thermal && (
                    <>
                        <Row sid="receipt.copies" flash={flash} title="Copies"
                             desc="Print 2 if you keep a copy for the shop, for example for credit sales.">
                            <Stepper label="copies" disabled={locked} value={Number(storeVal('thermal_copies', 1)) || 1} min={1} max={5}
                                     onChange={v => save({ thermal_copies: v })} format={v => `${v} ${v === 1 ? 'copy' : 'copies'}`} />
                        </Row>
                        <Row sid="receipt.cut" flash={flash} title="Cut the paper after printing"
                             desc="For printers with a cutter. If yours has no cutter, this does nothing.">
                            <Switch label="Cut the paper" disabled={locked} checked={b('thermal_auto_cut', true)} onChange={v => save({ thermal_auto_cut: v })} />
                        </Row>
                        <Row sid="receipt.bold" flash={flash} title="Darker headings"
                             desc="Prints the shop name and total in bold — easier to read on faint paper.">
                            <Switch label="Darker headings" disabled={locked} checked={b('thermal_use_bold', true)} onChange={v => save({ thermal_use_bold: v })} />
                        </Row>
                        <Row sid="receipt.feed" flash={flash} title="Blank space at the end"
                             desc="Extra blank lines after the receipt so the cutter or tear bar does not cut through the message.">
                            <Stepper label="blank lines" disabled={locked} value={Number(storeVal('thermal_extra_lines', 3)) || 0} min={0} max={10}
                                     onChange={v => save({ thermal_extra_lines: v })} format={v => `${v} line${v === 1 ? '' : 's'}`} />
                        </Row>
                    </>
                )}
            </Section>

            {thermal && (
                <Section title="What the receipt shows" scope="store" locked={locked}
                         desc="Your business name, address and phone come from Tax & rounding → Business details.">
                    <Row sid="receipt.columns" stacked flash={flash} title="Extra details on each item"
                         desc="Tap to turn each one on or off. Keep receipts short unless customers need the detail.">
                        <div className="vqs-chips">
                            {detailToggles.map(([k, label, hint]) => {
                                const on = b(k, false);
                                return (
                                    <button key={k} type="button" className="vqs-chip" aria-pressed={on} title={hint}
                                            disabled={locked} onClick={() => save({ [k]: !on })}>
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </Row>
                    <Row sid="receipt.barcode" flash={flash} title="Barcode at the bottom"
                         desc="Prints the receipt number as a barcode. Scan it later to find the sale quickly for a return.">
                        <Switch label="Barcode" disabled={locked} checked={b('thermal_show_barcode', true)} onChange={v => save({ thermal_show_barcode: v })} />
                    </Row>
                    <Row sid="receipt.footer" stacked flash={flash} title="Thank-you message"
                         desc="Printed at the bottom of every receipt. Good for opening hours, your return policy or social media.">
                        <ReceiptFooter disabled={locked} value={storeVal('thermal_custom_footer', '')} onSave={v => save({ thermal_custom_footer: v })} />
                    </Row>
                </Section>
            )}

            <Section title="Logo and full design" desc="Add your logo, change fonts and design the A4 invoice in the full receipt designer.">
                <Row sid="receipt.designer" flash={flash} title="Open the receipt designer"
                     desc="Opens Settings → Document layouts in a new tab, so this sale stays where it is.">
                    {designer && (
                        <a className="vqs-btn" data-v="s" href={designer} target="_blank" rel="noopener noreferrer">
                            <FileText size={16} /> Open designer <ExternalLink size={14} />
                        </a>
                    )}
                </Row>
            </Section>
        </Page>
    );
}

function ReceiptFooter({ value, onSave, disabled }) {
    const [draft, setDraft] = React.useState(value || '');
    React.useEffect(() => { setDraft(value || ''); }, [value]);
    const dirty = (draft || '') !== (value || '');
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            <Field multiline width="100%" maxLength={300} disabled={disabled} label="Thank-you message"
                   placeholder="Thank you for shopping with us! Exchanges within 7 days with this receipt."
                   value={draft} onChange={setDraft} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Button v="p" size="sm" disabled={disabled || !dirty} onClick={() => onSave(draft.trim())}>Save message</Button>
                {dirty && <Button v="g" size="sm" onClick={() => setDraft(value || '')}>Undo</Button>}
                <span className="vqs-muted" style={{ marginLeft: 'auto', fontSize: 13 }}>{(draft || '').length}/300</span>
            </div>
        </div>
    );
}

export function StockPage() {
    const { p, flash, storeVal, saveStore } = useSettingsCtx();
    const locked = !p.canManageStore;
    const tracking = storeVal('stock_maintenance', '1') !== '0' && storeVal('stock_maintenance', '1') !== false;
    const b = (k) => truthy(storeVal(k, '0'));
    return (
        <Page icon={Boxes} title="Stock & prices"
              intro="How the register protects your stock: whether it can sell more than you have, when it warns you, and which prices it uses.">
            {locked && <LockedNote />}
            <Section title="Stock" scope="store" locked={locked}>
                <Row sid="stock.track" flash={flash} title="Keep track of stock"
                     desc="Every sale takes items off your stock count and every purchase adds them back. Turn off if you only sell services or do not count stock.">
                    <Switch label="Keep track of stock" disabled={locked} checked={tracking}
                            onChange={v => saveStore('stock_items', { stock_maintenance: v })} />
                </Row>
                <Row sid="stock.negative" flash={flash} disabled={!tracking}
                     title="Sell even when stock shows zero"
                     desc="On: the sale goes through and the stock count goes below zero — useful if deliveries are not always entered on time. Off: the register stops the sale and asks you to check the stock."
                     tags={!b('stop_sale_negative_stock') && tracking ? <Tag tone="warn">Overselling allowed</Tag> : null}>
                    <Switch label="Sell when stock shows zero" disabled={locked || !tracking}
                            checked={!b('stop_sale_negative_stock')}
                            onChange={v => saveStore('checkout_returns', { stop_sale_negative_stock: !v })} />
                </Row>
                <Row sid="stock.low" flash={flash} disabled={!tracking} title="Low stock warnings"
                     desc="Sends you a reminder when products run low, so you can reorder in time.">
                    <Switch label="Low stock warnings" disabled={locked || !tracking} checked={b('low_stock_alerts')}
                            onChange={v => saveStore('stock_items', { low_stock_alerts: v })} />
                </Row>
                <Row sid="stock.threshold" flash={flash} disabled={!tracking} title="What counts as low"
                     desc="A product is 'low' when its stock is at or below this number (unless the product has its own minimum).">
                    <Stepper label="low stock level" disabled={locked || !tracking} value={Number(storeVal('low_stock_threshold', 10)) || 0}
                             min={0} max={500} step={Number(storeVal('low_stock_threshold', 10)) >= 50 ? 10 : 1}
                             onChange={v => saveStore('stock_items', { low_stock_threshold: v })} format={v => `${v} or fewer`} />
                </Row>
                <Row sid="stock.batch" flash={flash} title="Batches and expiry dates"
                     desc="Record batch numbers and expiry dates when you buy stock. Needed for medicines and many foods.">
                    <Switch label="Batches and expiry dates" disabled={locked} checked={b('batch_tracking_enabled')}
                            onChange={v => saveStore('stock_items', { batch_tracking_enabled: v })} />
                </Row>
            </Section>
            <Section title="Prices" scope="store" locked={locked}>
                <Row sid="stock.wholesale" flash={flash} title="Wholesale prices"
                     desc="Lets products carry a second, lower trade price. The register uses it automatically when a product has one set, for example for bulk buyers.">
                    <Switch label="Wholesale prices" disabled={locked} checked={b('wholesale_price_enabled')}
                            onChange={v => saveStore('stock_items', { wholesale_price_enabled: v })} />
                </Row>
            </Section>
        </Page>
    );
}

export function MoneyPage() {
    const { p, flash, storeVal, saveStore } = useSettingsCtx();
    const locked = !p.canManageStore;
    const rate = Number(storeVal('default_tax_rate', 0)) || 0;
    const round = (() => {
        const v = String(storeVal('round_off_total', 'none') ?? 'none');
        return v === '1' || v === 'true' ? '0' : (v || 'none');
    })();
    const decimals = Number(storeVal('decimal_places', 2));
    const profile = settingsLink(p, 'profile');
    const integrations = settingsLink(p, 'features_connections');
    const fbrOn = truthy(storeVal('fbr_integration', '0'));

    return (
        <Page icon={Landmark} title="Tax & rounding"
              intro="The standard tax rate, how totals are rounded, and how many decimals your money shows.">
            {locked && <LockedNote />}
            <Section title="Tax" scope="store" locked={locked}>
                <Row sid="money.tax-rate" flash={flash} title="Standard tax rate"
                     desc="The rate added to sales when tax is on. Individual products can still have their own rate."
                     example={rate ? <>On a sale of 1,000 this adds <b>{(1000 * rate / 100).toLocaleString()}</b>.</> : <>Set to 0% to charge no tax.</>}>
                    <Stepper label="tax rate" disabled={locked} value={rate} min={0} max={50} step={0.5}
                             onChange={v => saveStore('taxes', { default_tax_rate: v })} format={v => `${v}%`} />
                </Row>
                {p.enableTax === false && (
                    <Callout>Tax is switched off on this till (<b>Checkout &amp; returns → Tax on sales</b>), so this rate is not being added here.</Callout>
                )}
            </Section>

            <Section title="Rounding and decimals" scope="store" locked={locked}>
                <Row sid="money.round" stacked flash={flash} title="How the bill is rounded"
                     desc="Rounds what the customer pays so you are not handing out tiny coins. The difference is shown on the bill as 'Rounding'. Each till can still switch rounding off."
                     example={<><b>Example:</b> 1,247.60 rounded to whole becomes 1,248.</>}>
                    <Segmented label="How the bill is rounded" disabled={locked} value={round}
                               onChange={v => saveStore('checkout_returns', { round_off_total: v })}
                               options={[
                                   { value: 'none', label: 'No rounding' },
                                   { value: '0', label: 'Whole amount' },
                                   { value: '2', label: '2 decimals' },
                                   { value: '3', label: '3 decimals' },
                               ]} />
                </Row>
                <Row sid="money.decimals" flash={flash} title="Decimal places"
                     desc="How many digits after the point prices and totals show — 2 for most currencies, 0 if you never use paisa or cents.">
                    <Segmented label="Decimal places" disabled={locked} value={Number.isFinite(decimals) ? decimals : 2}
                               onChange={v => saveStore('region_numbers', { decimal_places: v })}
                               options={[0, 1, 2, 3].map(n => ({ value: n, label: String(n) }))} />
                </Row>
            </Section>

            <Section title="Business details" desc="Printed at the top of every receipt and invoice.">
                <Row sid="money.business" stacked flash={flash} title={storeVal('business_name', '') || 'Business name not set'}
                     desc={[storeVal('business_address', ''), storeVal('business_phone', ''), storeVal('tax_number', '') ? `Tax number ${storeVal('tax_number', '')}` : '']
                         .filter(Boolean).join(' · ') || 'Add your address, phone and tax number so they print on receipts.'}>
                    {profile && (
                        <a className="vqs-btn" data-v="s" data-size="sm" href={profile} target="_blank" rel="noopener noreferrer">
                            Edit business details <ExternalLink size={14} />
                        </a>
                    )}
                </Row>
                <Row sid="money.fbr" flash={flash}
                     title={<>FBR tax reporting {fbrOn ? <Tag tone="success">On</Tag> : <Tag>Off</Tag>}</>}
                     desc="For businesses in Pakistan that must report sales to the FBR. Set up once by the owner, with your POS ID from the FBR.">
                    {integrations && (
                        <a className="vqs-btn" data-v="g" data-size="sm" href={integrations} target="_blank" rel="noopener noreferrer">
                            Set up <ExternalLink size={14} />
                        </a>
                    )}
                </Row>
            </Section>
        </Page>
    );
}

export function CashPage() {
    const { p, flash, storeVal } = useSettingsCtx();
    const passcodeOn = truthy(storeVal('enable_passcode', '0'));
    const approvalsOn = truthy(storeVal('approval_admin_enabled', '0'));
    const security = settingsLink(p, 'security');
    const approvals = settingsLink(p, 'approvals');
    return (
        <Page icon={Wallet} title="Cash & security"
              intro="The cash drawer, shifts and end-of-day counts, and who is allowed to change things.">
            <Section title="Cash drawer" scope="device">
                <Row sid="cash.drawer-auto" flash={flash} title="Open the drawer for cash sales"
                     desc="Pops the cash drawer open when a sale is paid in cash. Card and bank sales leave it shut.">
                    <Switch label="Open the drawer for cash sales" checked={!!p.openDrawerOnCash} onChange={p.setOpenDrawerOnCash} />
                </Row>
                <Row sid="cash.drawer-now" flash={flash} title="Open the drawer now"
                     desc="Opens the drawer without a sale — to give change or check the float. The keyboard shortcut is Ctrl + D."
                     disabled={!p.isStationConnected}>
                    <Button v="s" icon={Unlock} disabled={!p.isStationConnected} onClick={p.onOpenCashDrawer}>Open drawer</Button>
                </Row>
                {!p.isStationConnected && (
                    <Callout>The drawer is opened through the receipt printer, which needs the <b>VenQore Station</b> app on this computer. In a normal web browser the drawer cannot be opened.</Callout>
                )}
            </Section>

            <Section title="Shifts and end of day">
                {p.isPosStaff ? (
                    <>
                        <Row sid="cash.shift" flash={flash}
                             title={p.registerShift ? <>Shift #{p.registerShift.id} <Tag tone="success">Open</Tag></> : <>No shift open <Tag tone="warn">Closed</Tag></>}
                             desc={p.registerShift
                                 ? 'Record cash going in or out of the drawer during the shift, or close the shift to count the drawer and print the end-of-day (Z) report.'
                                 : 'Open a shift with the starting cash in the drawer before taking sales.'}>
                            {p.registerShift ? (
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <Button v="s" size="sm" icon={ArrowLeftRight} onClick={p.onCashMovement}>Cash in / out</Button>
                                    <Button v="d" size="sm" icon={Lock} onClick={p.onCloseShift}>Close shift &amp; Z-report</Button>
                                </div>
                            ) : (
                                <Button v="p" size="sm" icon={Clock} onClick={p.onOpenShift}>Open shift</Button>
                            )}
                        </Row>
                    </>
                ) : (
                    <Row sid="cash.shift" flash={flash} title="Shifts are for till staff"
                         desc="Staff who sign in as till operators open a shift with a starting float and close it with a cash count and an end-of-day (Z) report. Owners and managers sell without shifts." />
                )}
            </Section>

            <Section title="Who can change what" desc="Set up by the owner in Settings → Security. Shown here so staff know what to expect.">
                <Row sid="cash.passcode" flash={flash}
                     title={<>Passcode for settings {passcodeOn ? <Tag tone="success"><ShieldCheck size={11} /> On</Tag> : <Tag>Off</Tag>}</>}
                     desc={passcodeOn
                         ? 'Changing business-wide settings asks for the admin passcode, unless you are the owner.'
                         : 'Anyone with settings permission can change business-wide settings without a passcode.'}>
                    {security && p.canManageStore && (
                        <a className="vqs-btn" data-v="g" data-size="sm" href={security} target="_blank" rel="noopener noreferrer">Change <ExternalLink size={14} /></a>
                    )}
                </Row>
                <Row sid="cash.approvals" flash={flash}
                     title={<>Manager approval {approvalsOn ? <Tag tone="success">On</Tag> : <Tag>Off</Tag>}</>}
                     desc="When on, things like large discounts, refunds and deleting sales need a manager's PIN at the till.">
                    {approvals && p.canManageStore && (
                        <a className="vqs-btn" data-v="g" data-size="sm" href={approvals} target="_blank" rel="noopener noreferrer">Change <ExternalLink size={14} /></a>
                    )}
                </Row>
            </Section>
        </Page>
    );
}
