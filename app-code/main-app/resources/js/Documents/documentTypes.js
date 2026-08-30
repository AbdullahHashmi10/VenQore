/**
 * documentTypes.js — what each document IS.
 *
 * Every screen in this folder is the same editor. What makes a purchase
 * invoice different from a stock audit is not its markup, it is the answers
 * to a handful of questions: who is on the other side of it, does it carry
 * money, what does it do to stock, where does it post. Those answers live
 * here, once, in a form a shopkeeper could check.
 *
 * The rule this file exists to enforce: a field that is not listed for a
 * document does not appear on it, has no switch in settings, and is never
 * sent to the server. That is what stops a quotation growing an "Amount
 * paid" box that collects a number and throws it away — which is exactly
 * what the old screens did, because they were copies of the sales invoice
 * with the wrong parts left in.
 *
 * ── The vocabulary ──────────────────────────────────────────────────────
 *
 * party.role      customer | supplier | none
 *                 'none' means the document is internal — a stock transfer
 *                 has warehouses on both ends, not a person.
 *
 * party.search    which parties the picker looks through. Defaults to the
 *                 role, but a real shop does not sort that neatly: you buy
 *                 stock back from a customer who over-ordered, you sell an
 *                 offcut to a supplier. Where that happens the picker searches
 *                 'all' and the document records whoever was chosen, rather
 *                 than making somebody register the same person twice.
 *
 * money.lines     'priced'  qty × rate, the normal case
 *                 'amount'  a sum per line, no quantity (an expense voucher)
 *                 'count'   quantities only, no money anywhere (stock work)
 *
 * money.settle    'in'      money arrives      — Amount paid / Balance due
 *                 'out'     money leaves       — Amount paid / Balance owed
 *                 'advance' part now, rest later
 *                 'refund'  money goes back the way it came
 *                 'none'    the document is not paid at all (a quote, a
 *                           template, a debit note — these adjust or propose,
 *                           they do not settle)
 *
 * stock.effect    'out'     sold, leaves the shop
 *                 'in'      bought or returned, arrives
 *                 'reserve' spoken for but not yet gone
 *                 'onorder' expected, not yet ours
 *                 'move'    same goods, different shelf
 *                 'set'     the count IS the new truth (an audit)
 *                 'none'    nothing moves
 *
 * ledger         which way the UNSETTLED part of this document moves the
 *                 party's position with the shop. One signed figure, read from
 *                 the journal, always from the shop's point of view:
 *
 *                   net > 0   they owe the shop
 *                   net < 0   the shop owes them
 *
 *                 So a sale on credit is +1 (they owe more), a purchase on
 *                 account is -1 (the shop owes more, which REDUCES their net),
 *                 and a document that posts nothing to the ledger — a
 *                 quotation, an order, a template — is 0 and shows the balance
 *                 for information without pretending to move it.
 *
 *                 Getting this wrong is not a display bug. A purchase from a
 *                 customer showed their balance going UP when the shop had
 *                 just taken on a debt to them.
 *
 * stock.badge     what the small figure under a quantity reports.
 *                 'onhand'    everything on the shelf — the right figure when
 *                             goods are ARRIVING, because what is reserved for
 *                             somebody else has no bearing on what you can buy
 *                 'available' what can still be sold, net of reservations
 *                 false       no figure at all
 *
 * stock.check     'block'   refuse to save past available stock
 *                 'warn'    say so, let the operator decide
 *                 'none'    not this document's business
 *
 * drafts          the namespace unfinished documents are kept under. It is
 *                 spelled out per document because the old screens shared
 *                 one: opening a quotation and a sale return fought over the
 *                 same tabs, and closing one closed the other.
 */

/* Fields a document can carry in its header block. A document lists the ones
   that make sense for it; the operator's own switches then decide which of
   those they actually want to see. */
export const FIELD_LIBRARY = {
    account:    { label: 'Money goes to',   hint: 'Which drawer, cheque or bank account this is banked into.' },
    accountOut: { label: 'Money comes from', hint: 'Which drawer or bank account this is paid out of.' },
    refund:     { label: 'Refund from',     hint: 'Where the money goes back out of.' },
    docno:      { label: 'Document number', hint: 'Your own reference. Off means the system numbers it.' },
    supplierRef:{ label: "Supplier's bill no.", hint: "The number on THEIR document, so you can find it again when they call." },
    date:       { label: 'Date',            hint: 'Off means today, every time.' },
    terms:      { label: 'Payment terms',   hint: 'Immediately, or within 7 / 15 / 30 / 60 days. Choosing terms sets the due date.' },
    due:        { label: 'Due date',        hint: 'The date itself, editable — for when a customer has agreed something unusual.' },
    validity:   { label: 'Valid until',     hint: 'After this date the quotation lapses and the prices on it no longer stand.' },
    delivery:   { label: 'Delivery date',   hint: 'When the customer expects the goods.' },
    expected:   { label: 'Expected on',     hint: 'When the supplier says the goods will arrive.' },
    warehouse:  { label: 'Warehouse',       hint: 'Which stock these lines come out of or go into.' },
    fromWh:     { label: 'From warehouse',  hint: 'Where the goods are now.' },
    toWh:       { label: 'To warehouse',    hint: 'Where they are going.' },
    source:     { label: 'Against',         hint: 'The document this one answers to. Picking it loads the lines and caps what can be returned.' },
    reason:     { label: 'Reason',          hint: 'Why this was raised — it prints on the document and shows in the ledger.' },
    frequency:  { label: 'Repeats',         hint: 'How often an invoice is raised from this template.' },
    nextRun:    { label: 'Next one on',     hint: 'The date the next invoice is raised.' },
    status:     { label: 'Status',          hint: 'A paused template raises nothing until you start it again.' },
    attachment: { label: 'Attachment',      hint: 'A photograph or scan of the bill, kept with the record.' },
    notes:      { label: 'Note',            hint: 'A line of free text that prints on the document.' },
    tax:        { label: 'Tax',             hint: 'The tax line in the totals, using the rates from your tax settings.' },
    free:       { label: 'Free quantity',   hint: 'A free-goods column on every row — for buy-ten-get-one and samples.' },
    prevbal:    { label: 'Previous balance', hint: 'What this party owed before today, and what they will owe once this is added.' },
    margin:     { label: 'Margin button',   hint: 'A margin figure that shows only while the button is held down.' },
};

/* Line columns a document can carry. Same idea: a stock audit has no rate
   column because there is no money on it, so it cannot be switched on. */
export const COLUMN_LIBRARY = {
    idx:      { label: '#',          fit: true },
    item:     { label: 'Item',       grow: true },
    category: { label: 'Category',   grow: true },
    desc:     { label: 'Description', grow: true },
    ordered:  { label: 'Ordered',    fit: true, readOnly: true },
    qty:      { label: 'Qty',        fit: true },
    counted:  { label: 'Counted',    fit: true },
    expected: { label: 'Expected',   fit: true, readOnly: true },
    diff:     { label: 'Difference', fit: true, readOnly: true },
    free:     { label: 'Free',       fit: true },
    uom:      { label: 'Unit',       fit: true },
    batch:    { label: 'Batch',      fit: true },
    expiry:   { label: 'Expires',    fit: true },
    rate:     { label: 'Price',      fit: true },
    cost:     { label: 'Cost',       fit: true },
    disc:     { label: 'Discount',   fit: true },
    amount:   { label: 'Amount',     fit: true },
    total:    { label: 'Total',      fit: true },
    del:      { label: '',           fit: true },
};

const base = {
    menu: 'Sales',
    /* Most documents do not move anybody's balance. The ones that do say so. */
    ledger: 0,
    ref: { label: 'Document no.', prefix: 'DOC-' },
    fields: [],
    columns: ['idx', 'item', 'qty', 'rate', 'total', 'del'],
    money: { lines: 'priced', tax: false, charges: false, settle: 'none', rounding: true, margin: false },
    stock: { effect: 'none', check: 'none', badge: false },
    tabs: true,
    api: {},
};

const merge = (spec) => ({
    ...base, ...spec,
    ref: { ...base.ref, ...(spec.ref || {}) },
    money: { ...base.money, ...(spec.money || {}) },
    stock: { ...base.stock, ...(spec.stock || {}) },
    party: spec.party ? { required: true, balance: false, ...spec.party } : { role: 'none' },
});

export const DOCUMENTS = {

    /* ── SELLING ────────────────────────────────────────────────────── */

    'sales-invoice': merge({
        id: 'sales-invoice',
        name: 'Sales invoice',
        title: { new: 'New sale', edit: 'Edit sale', tab: 'Sale' },
        emptyTitle: 'Nothing on this invoice yet',
        emptyHint: 'Add an item below, or scan a barcode.',
        menu: 'Sales',
        zone: 'Customer & details',
        /* Selling to a supplier happens too — an offcut, a returned pallet —
            so the picker looks through everyone. */
        party: { role: 'customer', label: 'Customer', search: 'all', balance: true,
                 placeholder: 'Search anyone you sell to' },
        ref: { label: 'Invoice no.', prefix: 'INV-' },
        /* No invoice-number box. The server numbers a sale itself, through
           SequenceService, and never reads a number sent with one — so the
           field, the browser-side counter behind it and the prefix setting
           that formatted it produced a number that was displayed, saved in the
           browser, printed on nothing and thrown away. What the customer's
           copy shows is what `store.sales.show` returns. */
        fields: ['account', 'date', 'terms', 'due', 'notes', 'tax', 'free', 'prevbal', 'margin'],
        /* The keys the screen this replaces saved its preferences under. */
        legacyKeys: { comp: 'invoice_composition_v2', fields: 'invoice_fields_v1',
                      stock: 'invoice_show_stock' },
        columns: ['idx', 'item', 'qty', 'free', 'uom', 'rate', 'disc', 'total', 'del'],
        /* The only document where every part of the money model is on: goods
           are sold, tax is charged, carriage is added and cash changes hands
           at the counter. Everything else below is this, minus something. */
        money: { lines: 'priced', tax: true, charges: true, settle: 'in', rounding: true, margin: true,
                 settleLabel: 'Amount paid', balanceLabels: ['Balance due', 'Change owed', 'Settled in full'] },
        stock: { effect: 'out', check: 'block', badge: 'available' },
        /* Sold on credit: they owe the shop more. */
        ledger: 1,
        drafts: 'sales',
        api: { store: 'store.sales.store', update: 'store.sales.update', show: 'store.sales.show',
               print: 'store.sales.print', index: 'store.sales.index' },
    }),

    quotation: merge({
        id: 'quotation',
        name: 'Quotation',
        title: { new: 'New quotation', edit: 'Edit quotation', tab: 'Quote' },
        menu: 'Sales',
        zone: 'Customer & details',
        party: { role: 'customer', label: 'Customer', balance: true },
        ref: { label: 'Quotation no.', prefix: 'QUO-' },
        /* No payment account, no due date, no amount paid. A quotation is an
           offer: nothing has been sold, so nothing can have been banked. What
           it needs instead is an expiry, because a price quoted in March
           cannot be held to in December — and the old screen saved that field
           as null on every single quotation because no input fed it. */
        /* No free-goods column: `proposal_items` has nowhere to put one and
           the controller validates no key for it, so the units would be shown,
           netted out of the quoted total, and then not be on the saved
           quotation at all. */
        fields: ['docno', 'date', 'validity', 'terms', 'notes', 'tax', 'prevbal', 'margin'],
        columns: ['idx', 'item', 'qty', 'uom', 'rate', 'disc', 'total', 'del'],
        /* Rounding off: only the sales and purchase invoices send the
           difference as `round_off`. Rounding here would print one figure and
           store another. */
        money: { lines: 'priced', tax: true, charges: true, settle: 'none', rounding: false, margin: true },
        /* Nothing moves and nothing is reserved, but the operator still wants
           to see what is on the shelf before promising it. */
        stock: { effect: 'none', check: 'none', badge: 'available' },
        /* An offer posts nothing. The balance is shown so the operator knows
            who they are quoting, not because this document moves it. */
        ledger: 0,
        drafts: 'quotation',
        api: { store: 'store.proposals.store', update: 'store.proposals.update',
               print: 'store.proposals.print', index: 'store.proposals.index',
               convertSale: 'store.proposals.convert-to-sale',
               convertOrder: 'store.proposals.convert-to-presale' },
    }),

    'sales-order': merge({
        id: 'sales-order',
        name: 'Sales order',
        title: { new: 'New sales order', edit: 'Edit sales order', tab: 'Order' },
        menu: 'Sales',
        zone: 'Customer & details',
        party: { role: 'customer', label: 'Customer', balance: true },
        ref: { label: 'Order no.', prefix: 'SO-' },
        /* An order is often taken with money down, so the settlement row is
           an ADVANCE rather than payment in full — and it is wired, unlike
           the old screen which collected it and dropped it on the floor. */
        /* Same as the quotation: `sales_order_items` has no free-goods
           column and the controller validates no key for one. */
        fields: ['account', 'docno', 'date', 'delivery', 'terms', 'notes', 'tax', 'prevbal', 'margin'],
        columns: ['idx', 'item', 'qty', 'uom', 'rate', 'disc', 'total', 'del'],
        money: { lines: 'priced', tax: true, charges: true, settle: 'advance', rounding: false, margin: true,
                 settleLabel: 'Advance received', balanceLabels: ['Balance on delivery', 'Overpaid', 'Paid in full'] },
        /* Ordered goods are spoken for, not gone. Selling past what is free
           is allowed but the operator is told they are going on backorder. */
        stock: { effect: 'reserve', check: 'warn', badge: 'unreserved' },
        /* Once it has become a sale the document is history and must not be
           editable — the old screen got this right and it is worth keeping. */
        lockWhen: (doc) => ['completed', 'converted'].includes(doc?.status),
        lockNote: 'This order has been converted to a sale and can no longer be changed.',
        /* An order posts nothing until it becomes a sale. Any advance taken
            is real money, but it is handled as a payment, not by this line. */
        ledger: 0,
        drafts: 'sales-order',
        /* No print route: `pre-sales.print` is still a stub, and the old
           screen's button printed `store.sales.print` with an ORDER id, which
           is a different document entirely. Once the order is converted the
           sale it became is what gets printed. */
        api: { store: 'store.pre-sales.store', update: 'store.sales.orders.update',
               index: 'store.pre-sales.index', convert: 'store.pre-sales.convert' },
    }),

    'sale-return': merge({
        id: 'sale-return',
        name: 'Sale return',
        title: { new: 'New sale return', edit: 'Edit sale return', tab: 'Return' },
        menu: 'Returns',
        zone: 'Customer & details',
        party: { role: 'customer', label: 'Customer', balance: true },
        ref: { label: 'Return no.', prefix: 'RET-' },
        /* A return answers to a sale. Picking that sale loads its lines and
           caps every quantity at what was actually sold, net of anything
           already returned — without it, a return is a hole you can walk both
           stock and cash out through. */
        source: { doc: 'sales-invoice', label: 'Against invoice', required: true,
                  api: 'store.api.sales.returnable',
                  show: 'store.api.sales.returnable.show', capBy: 'quantity' },
        /* No document number (the return is numbered by the system and the
           endpoint takes no reference), no free column and — see below — no
           document discount. Each of those was a box whose number went
           nowhere, and the discount one was worse than nothing: it lowered the
           refund on the screen while the server valued the return at full
           price and quietly turned the difference into store credit. */
        fields: ['refund', 'source', 'date', 'reason', 'notes', 'tax', 'prevbal'],
        columns: ['idx', 'item', 'ordered', 'qty', 'uom', 'rate', 'disc', 'total', 'del'],
        /* No carriage row. The returns endpoint has no column for one and
           validates no key for it, so an editable charge here would add to the
           total on the screen and be dropped on the way to the server — the
           exact defect this file exists to prevent. */
        money: { lines: 'priced', tax: true, charges: false, settle: 'refund', rounding: false, margin: false,
                 docDiscount: false,
                 settleLabel: 'Refund given', balanceLabels: ['Credited to account', 'Refunded over', 'Settled in full'] },
        stock: { effect: 'in', check: 'none', badge: false },
        /* The return's own line spelling: `price` like the sale it answers to,
           and each line carries the id of the ORIGINAL line so the server can
           cap it. Per line rather than per product, because the same product
           can appear twice on one sale at two prices. */
        lineKeys: { source: 'original_sale_item_id' },
        /* Goods came back: the shop owes the customer, so their net falls. */
        ledger: -1,
        drafts: 'sale-return',
        api: { store: 'store.returns.store', print: 'store.sales.print', index: 'store.returns-history.index' },
    }),

    'recurring-invoice': merge({
        id: 'recurring-invoice',
        name: 'Recurring invoice',
        title: { new: 'New recurring invoice', edit: 'Edit recurring invoice', tab: 'Template' },
        menu: 'Sales',
        zone: 'Customer & schedule',
        party: { role: 'customer', label: 'Customer', balance: false },
        ref: { label: 'Template name', prefix: '', free: true },
        /* A template is never paid — the invoices it raises are. So the
           settlement row comes off, and everything that shapes the invoices
           it will raise (tax, discounts, carriage) stays and, unlike before,
           actually saves. */
        /* A template has no number and no date of its own — it has a name
           and a schedule. What it CAN carry is what reaches the invoices it
           raises: the lines, their tax rates, and a discount on the whole
           document, which the generator spreads across the lines the same way
           the invoice screen does. Carriage stays off — the sale engine has no
           document-level charge, so a delivery fee here would show on the
           template and on no invoice it ever raised. */
        fields: ['warehouse', 'frequency', 'nextRun', 'status', 'terms', 'notes', 'tax', 'free', 'margin'],
        columns: ['idx', 'item', 'qty', 'free', 'uom', 'rate', 'disc', 'total', 'del'],
        money: { lines: 'priced', tax: true, charges: false, settle: 'none', rounding: false, margin: true },
        stock: { effect: 'none', check: 'none', badge: 'available' },
        /* The template stores its lines as a JSON blob validated key by key,
           and it spells them differently from everything else. */
        lineKeys: { qty: 'qty', price: 'unit_price', free: 'free_qty' },
        /* A template raises invoices; it is not one. */
        ledger: 0,
        tabs: false,
        drafts: null,
        api: { store: 'store.recurring-invoices.store', update: 'store.recurring-invoices.update',
               index: 'store.recurring-invoices.index' },
    }),

    /* ── BUYING ─────────────────────────────────────────────────────── */

    'purchase-invoice': merge({
        id: 'purchase-invoice',
        name: 'Purchase invoice',
        title: { new: 'New purchase', edit: 'Edit purchase', tab: 'Purchase' },
        emptyTitle: 'Nothing on this purchase yet',
        emptyHint: 'Search for what you are buying, or scan the delivery in.',
        menu: 'Purchases',
        zone: 'Supplier & details',
        /* Searches everyone, not only suppliers: buying stock back from a
            customer is an ordinary thing, and refusing it just forces the same
            person to be registered twice. */
        party: { role: 'supplier', label: 'Supplier', search: 'all', balance: true,
                 placeholder: 'Search anyone you buy from' },
        /* Two numbers, and they are not the same number. Ours files the
           document; theirs is what the supplier will quote down the phone. */
        ref: { label: 'Purchase no.', prefix: 'PUR-' },
        /* No free-goods column: `purchase_items` has no column to put it in, so
            offering one would be a box that swallows a number. When the schema
            grows one, this list is where it comes back. */
        fields: ['accountOut', 'supplierRef', 'docno', 'date', 'terms', 'due', 'warehouse',
                 'notes', 'tax', 'prevbal'],
        columns: ['idx', 'item', 'qty', 'uom', 'rate', 'taxpct', 'bizpct', 'disc', 'total', 'del'],
        /* Purchases were built with their own spelling of a line. Naming it
            here beats a special case in the payload builder. */
        lineKeys: { qty: 'qty', price: 'unit_cost', discount: 'discount_amount', taxRate: 'tax_rate' },
        dateKey: 'purchase_date',
        /* Money leaves rather than arrives, and there is no margin on a
           purchase — the price IS the cost, so a margin button here would be
           showing the operator a number about nothing. */
        /* No delivery/extra rows. Freight and duty on a purchase are LANDED
            COSTS: the server spreads them across the goods so they end up in
            what the stock is worth, which a flat charge on the bill would not
            do. Leaving `charges` on rendered two editable rows that added to
            the on-screen total and were then dropped by the server — the very
            defect this kit was written to stop. */
        /* Rounding ON, and the difference is sent as `round_off`: the screen
            shows the figure the supplier will be paid and the ledger records
            where the odd paisa went. Rounding off while still sending a
            round-off was the one combination that made the two disagree. */
        money: { lines: 'priced', tax: true, charges: false, settle: 'out', rounding: true, margin: false,
                 /* The supplier taxed their lines and the bill discount comes
                    off afterwards — `PurchaseService` posts it that way, so the
                    screen has to read it that way or the two totals differ by
                    the tax on the discount. */
                 taxAfterDocDiscount: false,
                 /* Tax on a purchase is whatever the supplier charged, line by
                    line — it is not the buyer's to choose. So the row reports
                    rather than offers, and there is no rate dropdown. */
                 taxRatePicker: false,
                 settleLabel: 'Amount paid', balanceLabels: ['Balance owed', 'Paid over', 'Settled in full'],
                 chargeLabels: { delivery: 'Freight', extra: 'Other charges' } },
        /* Goods arrive. There is nothing to check against — you cannot buy
           more than exists. */
        stock: { effect: 'in', check: 'none', badge: 'onhand' },
        /* Bought on account: the shop owes them, so their net FALLS. This is
            the one that was adding instead of subtracting. */
        ledger: -1,
        drafts: 'purchase',
        api: { store: 'store.v3.purchases.store', update: 'store.v3.purchases.update',
               index: 'store.v3.purchases.index' },
    }),

    'purchase-order': merge({
        id: 'purchase-order',
        name: 'Purchase order',
        title: { new: 'New purchase order', edit: 'Edit purchase order', tab: 'PO' },
        menu: 'Purchases',
        zone: 'Supplier & details',
        party: { role: 'supplier', label: 'Supplier', balance: true },
        ref: { label: 'Order no.', prefix: 'PO-' },
        fields: ['accountOut', 'supplierRef', 'docno', 'date', 'expected', 'terms', 'warehouse',
                 'notes', 'tax', 'free', 'prevbal'],
        columns: ['idx', 'item', 'qty', 'free', 'uom', 'rate', 'disc', 'total', 'del'],
        money: { lines: 'priced', tax: true, charges: true, settle: 'advance', rounding: false, margin: false,
                 settleLabel: 'Advance paid', balanceLabels: ['Balance on receipt', 'Paid over', 'Paid in full'],
                 chargeLabels: { delivery: 'Freight', extra: 'Other charges' } },
        /* `purchase_order_items` calls it a unit cost, like the purchase
           invoice does. */
        lineKeys: { price: 'unit_cost' },
        /* Nothing has arrived yet — an order puts goods on the incoming list,
           it does not put them on the shelf. */
        stock: { effect: 'onorder', check: 'none', badge: 'onhand' },
        /* Ordering commits nothing to the ledger until the goods arrive. */
        ledger: 0,
        drafts: 'purchase-order',
        api: { store: 'store.purchase-orders.store', update: 'store.purchase-orders.update',
               print: 'store.purchase-orders.print', index: 'store.purchase-orders.index',
               receive: 'store.purchase-orders.receive' },
    }),

    'goods-receipt': merge({
        id: 'goods-receipt',
        name: 'Goods receipt',
        title: { new: 'Receive goods', edit: 'Edit goods receipt', tab: 'GRN' },
        menu: 'Purchases',
        zone: 'Supplier & delivery',
        party: { role: 'supplier', label: 'Supplier', required: false, balance: false },
        ref: { label: 'Receipt no.', prefix: 'GRN-' },
        /* No lookup endpoint: the receipt is opened FROM the purchase, so
           the server hands the screen the lines and their remaining
           quantities as props. A second round trip would only be a chance for
           the two to disagree. */
        source: { doc: 'purchase-invoice', label: 'Against purchase', required: true, capBy: 'quantity' },
        lineKeys: { qty: 'receiving_qty', source: 'purchase_item_id' },
        /* A receipt is a count, not a negotiation. The prices were agreed on
           the order; what matters at the door is how many turned up, in what
           condition and with what batch and expiry on them. Money stays off
           the screen unless the shop tracks landed cost. */
        /* The receipt is booked as of now, into the warehouse the purchase
           named, under a number the system gives it. None of those three is
           this screen's to decide, so none of them is offered. */
        fields: ['source', 'notes'],
        /* No free column: `receiving_qty` is the only quantity the receive
           endpoint takes, so a second one would be a box that swallows a
           number. Free goods on a delivery are received as quantity. */
        columns: ['idx', 'item', 'ordered', 'qty', 'uom', 'batch', 'expiry', 'del'],
        money: { lines: 'count', tax: false, charges: false, settle: 'none', rounding: false, margin: false },
        stock: { effect: 'in', check: 'none', badge: 'onhand' },
        ledger: 0,
        tabs: false,
        drafts: null,
        api: { store: 'store.v3.purchases.receive.store', index: 'store.v3.purchases.index' },
    }),

    'purchase-return': merge({
        id: 'purchase-return',
        name: 'Purchase return',
        title: { new: 'New purchase return', edit: 'Edit purchase return', tab: 'Return' },
        menu: 'Purchases',
        zone: 'Supplier & details',
        party: { role: 'supplier', label: 'Supplier', balance: true },
        ref: { label: 'Return no.', prefix: 'PRET-' },
        /* Same as the receipt: seeded from the purchase it answers to,
           including which FIFO batch each line came out of. */
        source: { doc: 'purchase-invoice', label: 'Against purchase', required: true, capBy: 'quantity' },
        lineKeys: { qty: 'return_qty', source: 'purchase_item_id' },
        /* Everything about the money on a purchase return is decided by the
           batches the goods came out of: the endpoint takes a date, a reason
           and a quantity per line, and values the rest itself. A refund box, a
           tax row and a discount here would all have been figures that changed
           the screen and reached nothing. */
        fields: ['source', 'date', 'reason', 'prevbal'],
        columns: ['idx', 'item', 'ordered', 'qty', 'uom', 'rate', 'total', 'del'],
        money: { lines: 'priced', tax: false, charges: false, settle: 'none', rounding: false, margin: false,
                 docDiscount: false },
        /* Goods go back to the supplier, so they leave the shelf — and unlike
           a sale, you cannot send back more than you bought. */
        stock: { effect: 'out', check: 'block', badge: 'onhand' },
        /* Goods went back to the supplier: the shop owes them less, so their
            net rises back towards zero. */
        ledger: 1,
        /* NOT a tabbed document. It is opened from one purchase's URL and its
           lines carry that purchase's item and batch ids; keeping a draft
           queue meant opening a second purchase's return showed the first
           one's lines, and saving posted THOSE batches against THIS supplier. */
        tabs: false,
        drafts: null,
        api: { store: 'store.v3.purchases.return.store', index: 'store.v3.purchases.index' },
    }),

    'debit-note': merge({
        id: 'debit-note',
        name: 'Debit note',
        title: { new: 'New debit note', edit: 'Edit debit note', tab: 'Note' },
        menu: 'Purchases',
        zone: 'Supplier & details',
        party: { role: 'supplier', label: 'Supplier', balance: true },
        ref: { label: 'Note no.', prefix: 'DN-' },
        source: { doc: 'purchase-invoice', label: 'Against purchase', required: false, capBy: null },
        /* A debit note says "we owe you less than your bill says" — short
           delivery, damaged goods, a price that was wrong. It adjusts the
           ledger, it is not paid, and it only moves stock if the goods are
           physically going back, which is why that is a switch rather than an
           assumption. */
        /* `debit_notes.reference_number` is unique and generated; a typed one
           would either be ignored or collide. */
        fields: ['source', 'date', 'reason', 'notes', 'tax', 'prevbal'],
        columns: ['idx', 'item', 'qty', 'uom', 'rate', 'total', 'del'],
        money: { lines: 'priced', tax: true, charges: false, settle: 'none', rounding: false, margin: false },
        stock: { effect: 'optional', check: 'none', badge: 'onhand',
                 optionLabel: 'Send the goods back too', optionHint: 'Off means this is a price or billing adjustment only and nothing leaves the shelf.' },
        /* A debit note says the shop owes them less than their bill claimed. */
        ledger: 1,
        drafts: 'debit-note',
        api: { store: 'store.debit-notes.store', update: 'store.debit-notes.update',
               print: 'store.debit-notes.print', index: 'store.debit-notes.index' },
    }),

    /* ── MONEY OUT ──────────────────────────────────────────────────── */

    expense: merge({
        id: 'expense',
        name: 'Expense',
        title: { new: 'Record an expense', edit: 'Edit expense', tab: 'Expense' },
        menu: 'Money',
        zone: 'Payee & details',
        party: { role: 'supplier', label: 'Paid to', required: false, balance: false },
        ref: { label: 'Voucher no.', prefix: 'EXP-' },
        /* An expense has no products on it, so the line is a category and an
           amount — but it IS still a line, because one voucher covering rent
           and utilities is a normal thing and the old single-amount form
           could not do it. */
        fields: ['accountOut', 'docno', 'date', 'attachment', 'notes', 'tax'],
        columns: ['idx', 'category', 'desc', 'amount', 'del'],
        /* No document discount: the endpoint stores the sum of the lines, so
           a discount would lower the total on the screen, be excluded from the
           amount posted, and leave the difference sitting in the payee's
           account as money still owed to somebody who was paid in full. */
        money: { lines: 'amount', tax: true, charges: false, settle: 'out', rounding: false, margin: false,
                 docDiscount: false,
                 settleLabel: 'Amount paid', balanceLabels: ['Still owing', 'Paid over', 'Settled in full'] },
        stock: { effect: 'none', check: 'none', badge: false },
        /* An unpaid expense is money the shop owes the payee. */
        ledger: -1,
        tabs: false,
        drafts: null,
        api: { store: 'store.expenses.store', update: 'store.expenses.update', index: 'store.expenses.index' },
    }),

    /* ── STOCK ──────────────────────────────────────────────────────── */

    'stock-transfer': merge({
        id: 'stock-transfer',
        name: 'Stock transfer',
        title: { new: 'New stock transfer', edit: 'Edit stock transfer', tab: 'Transfer' },
        emptyTitle: 'Nothing to move yet',
        emptyHint: 'Add the items going from one warehouse to the other.',
        menu: 'Stock',
        zone: 'Where it moves',
        /* Nobody is on the other side of a transfer — the shop is on both
           ends. So no party combobox, and warehouses take its place. */
        party: { role: 'none' },
        ref: { label: 'Transfer no.', prefix: 'TRF-' },
        /* A transfer can be written down before the van leaves, so its status
            says whether the stock has actually moved yet. */
        fields: ['docno', 'date', 'fromWh', 'toWh', 'status', 'notes'],
        columns: ['idx', 'item', 'qty', 'uom', 'del'],
        /* Not one figure of money anywhere. The same goods are worth the same
           after the van ride, so a total would be a number with no meaning. */
        money: { lines: 'count', tax: false, charges: false, settle: 'none', rounding: false, margin: false },
        stock: { effect: 'move', check: 'block', badge: 'onhand' },
        tabs: false,
        drafts: null,
        api: { store: 'store.stock-transfers.store', index: 'store.stock-transfers.index' },
    }),

    'stock-audit': merge({
        id: 'stock-audit',
        name: 'Stock audit',
        title: { new: 'New stock audit', edit: 'Edit stock audit', tab: 'Audit' },
        emptyTitle: 'Nothing counted yet',
        emptyHint: 'Scan the shelf, or search for what you are counting.',
        menu: 'Stock',
        zone: 'What is being counted',
        party: { role: 'none' },
        ref: { label: 'Audit no.', prefix: 'AUD-' },
        /* A count can be saved half-done and finished later; only completing
            it writes the corrections to stock. */
        fields: ['docno', 'date', 'warehouse', 'status', 'notes'],
        /* The counted figure is not a quantity being moved, it is a
           correction: whatever is written here becomes the truth, and the
           difference column is the size of the correction. */
        columns: ['idx', 'item', 'expected', 'counted', 'diff', 'uom', 'del'],
        money: { lines: 'count', tax: false, charges: false, settle: 'none', rounding: false, margin: false },
        stock: { effect: 'set', check: 'none', badge: 'onhand' },
        tabs: false,
        drafts: null,
        api: { store: 'store.stock-takes.store', index: 'store.stock-takes.index' },
    }),
};

export const documentType = (id) => DOCUMENTS[id] || DOCUMENTS['sales-invoice'];

/* Convenience predicates, so screens ask questions rather than compare
   strings — `hasMoney(doc)` reads better than `doc.money.lines !== 'count'`
   and only has to be got right once. */
export const hasMoney = (d) => d.money.lines !== 'count';
export const hasQty = (d) => d.money.lines !== 'amount';
export const settles = (d) => d.money.settle !== 'none';
export const partyOf = (d) => (d.party.role === 'none' ? null : d.party);
export const carries = (d, field) => d.fields.includes(field);
export const hasColumn = (d, col) => d.columns.includes(col);
