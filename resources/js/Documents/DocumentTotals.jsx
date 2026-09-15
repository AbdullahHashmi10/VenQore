import React from 'react';
import { X } from 'lucide-react';
import VqSelect from '@/Documents/VqSelect';
import { projectBalance } from '@/Documents/usePartyBalance';

/**
 * DocumentTotals — the money column, for documents that have one.
 *
 * Which rows appear is decided in three places and nowhere else: the document
 * spec says which rows can exist at all, the detail level says how much of the
 * breakdown is shown at this width, and the operator's switches decide the
 * couple of rows that answer to a switch. A row that a document does not carry
 * has no markup, no switch and no number in the payload.
 */

export default function DocumentTotals({
    doc, chrome, totals, document: d, ctx,
}) {
    const { level, showAllTotals, setShowAllTotals, totalRef } = chrome;
    const { money, currency, locked, patch, taxRates } = ctx;
    /* The settlement box gets its own setter where a screen needs to know the
       operator typed in it — otherwise a part payment is overwritten by the
       next recalculation. Falls back to the ordinary one. */
    const patchSettle = ctx.patchSettle || patch;

    /* Rows that answer to a switch rather than to the detail level. */
    const SWITCHED = { tax: 'tax', prevbal: 'prevbal' };
    const row = (id) => {
        if (SWITCHED[id] && !chrome.carries(SWITCHED[id])) return false;
        return level.summary.includes(id) || showAllTotals;
    };

    const hasHidden = level.summary.length < 9;
    /* Some documents are valued by the server from their lines and take no
       document-level discount at all. Offering one there does not merely fail
       to save — it lowers the figure the operator settles against while the
       server settles against the full one. */
    const docDiscount = doc.money.docDiscount !== false;
    const charges = doc.money.charges;
    const chargeLabels = doc.money.chargeLabels || {};
    const settles = doc.money.settle !== 'none';

    /* Signed from the shop's point of view and read from the ledger: positive
       means they owe the shop, negative means the shop owes them. Which way
       THIS document moves it is the document's own `ledger` value — adding in
       both directions is what made a purchase from a customer look as though
       it increased what they owed. */
    const bal = projectBalance({
        net: ctx.prevBalance || 0,
        unsettled: totals.balance,
        direction: doc.ledger,
    });

    return (
        <>
            <section className="vqdoc-zone">
                <div className="vqdoc-zone-h">
                    <span>Totals</span>
                    <span className="spacer" />
                    {hasHidden && (
                        <button type="button" className="togg" onClick={() => setShowAllTotals((p) => !p)}>
                            {showAllTotals ? 'Less' : 'Show all'}
                        </button>
                    )}
                </div>

                <div className="vqdoc-sum">
                    {row('subtotal') && (
                        <div className="vqdoc-sum-row">
                            <span className="k">Subtotal</span>
                            <span className="v">{money(totals.subtotal)}</span>
                        </div>
                    )}

                    {row('item_disc') && totals.itemDiscounts > 0 && (
                        <div className="vqdoc-sum-row neg">
                            <span className="k">Line discounts</span>
                            <span className="v">&minus;{money(totals.itemDiscounts)}</span>
                        </div>
                    )}

                    {docDiscount && row('doc_disc') && (
                        <div className="vqdoc-sum-row edit">
                            <span className="k">Discount</span>
                            <span className="v">
                                <span className="cur">{currency}</span>
                                <input
                                    type="number" className="vqdoc-cell" value={d.discount ?? 0}
                                    disabled={locked} placeholder="0"
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => patch({ discount: parseFloat(e.target.value) || 0 })}
                                />
                            </span>
                        </div>
                    )}

                    {doc.money.tax && row('tax') && (
                        <div className="vqdoc-sum-row edit">
                            <span className="k">
                                Tax{totals.taxAmount > 0 ? ` · ${money(totals.taxAmount)}` : ''}
                                {/* When products carry their own rates the dropdown
                                    below is only the fallback, so the row says so
                                    rather than implying one rate applies to all. */}
                                {totals.taxAmount > 0 && totals.taxRateLabel === 'mixed rates' && (
                                    <span className="sub">at each product&rsquo;s own rate</span>
                                )}
                            </span>
                            <span className="v">
                                {doc.money.taxRatePicker === false ? (
                                    /* Reported, not chosen. */
                                    <span>{money(totals.taxAmount)}</span>
                                ) : (
                                <VqSelect
                                    className="sm" ariaLabel="Tax rate" disabled={locked}
                                    value={d.tax ?? 0}
                                    onChange={(v) => patch({ tax: parseFloat(v) || 0 })}
                                    options={[
                                        { value: 0, label: 'No tax' },
                                        ...(taxRates || []).map((t) => ({ value: t.rate, label: t.name, hint: `${t.rate}%` })),
                                        ...(d.tax && !(taxRates || []).some((t) => t.rate === d.tax)
                                            ? [{ value: d.tax, label: `Custom ${d.tax}%` }] : []),
                                    ]}
                                />
                                )}
                            </span>
                        </div>
                    )}

                    {charges && ctx.chargeVisible?.delivery !== false && row('shipping') && (
                        <div className="vqdoc-sum-row edit">
                            <span className="k">{chargeLabels.delivery || 'Delivery'}</span>
                            <span className="v">
                                <span className="cur">{currency}</span>
                                <input
                                    type="number" className="vqdoc-cell" value={d.delivery_charge ?? 0}
                                    disabled={locked} placeholder="0"
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => patch({ delivery_charge: parseFloat(e.target.value) || 0 })}
                                />
                            </span>
                        </div>
                    )}

                    {charges && ctx.chargeVisible?.extra !== false && row('extra') && (
                        <div className="vqdoc-sum-row edit">
                            <span className="k">
                                <input
                                    type="text" className="lbl-in"
                                    value={d.extra_charge_label || ''} disabled={locked}
                                    placeholder={chargeLabels.extra || 'Other charge'}
                                    onChange={(e) => patch({ extra_charge_label: e.target.value })}
                                />
                            </span>
                            <span className="v">
                                <span className="cur">{currency}</span>
                                <input
                                    type="number" className="vqdoc-cell" value={d.extra_charge_value ?? 0}
                                    disabled={locked} placeholder="0"
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => patch({ extra_charge_value: parseFloat(e.target.value) || 0 })}
                                />
                            </span>
                        </div>
                    )}

                    <div className="vqdoc-total" ref={totalRef}>
                        <span className="k">Total</span>
                        <span className="v">{money(totals.grandTotal)}</span>
                    </div>

                    {settles && row('settled') && (
                        <div id="tour-invoice-paid" className="vqdoc-sum-row edit">
                            <span className="k">
                                {totals.settleLabel}
                                {!locked && (
                                    <span className="vqdoc-quickamt">
                                        {/* Exact fills in what is owed to the paisa —
                                            the thing an operator reaches for most and
                                            the thing they used to have to retype. */}
                                        <button type="button" className="vqdoc-btn xs" title="Settled in full"
                                            disabled={totals.grandTotal <= 0 || Math.abs((d.amountPaid || 0) - totals.grandTotal) < 0.005}
                                            onClick={() => patchSettle({ amountPaid: totals.grandTotal })}>
                                            Exact
                                        </button>
                                        {!!d.amountPaid && (
                                            <button type="button" className="vqdoc-icon xs quiet"
                                                title="Clear" aria-label="Clear the amount" onClick={() => patchSettle({ amountPaid: 0 })}>
                                                <X size={13} />
                                            </button>
                                        )}
                                    </span>
                                )}
                            </span>
                            <span className="v">
                                <span className="cur">{currency}</span>
                                <input
                                    type="number" className="vqdoc-cell" value={d.amountPaid ?? 0}
                                    disabled={locked} placeholder="0"
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => patchSettle({ amountPaid: parseFloat(e.target.value) || 0 })}
                                />
                            </span>
                        </div>
                    )}

                    {settles && row('balance') && (
                        <div className="vqdoc-callout" data-tone={totals.balanceTone}>
                            <span>{totals.balanceLabel}</span>
                            <span className="v">{money(Math.abs(totals.balance))}</span>
                        </div>
                    )}

                    {/* Rows a particular document adds — a purchase's landed
                        costs, say. Passed by the caller and, until now, dropped
                        on the floor. */}
                    {ctx.extraRows}

                    {/* What this document does to what they already owe. The
                        shopkeeper wants the standing figure whichever way it is
                        settled, so it answers to its own switch rather than to
                        the settlement above. */}
                    {row('prevbal') && ctx.party && ctx.balanceKnown !== false && (
                        <div className="vqdoc-ledger">
                            <div className="vqdoc-sum-row">
                                <span className="k">{bal.beforeLabel(ctx.party.name)}</span>
                                <span className="v" data-owed={bal.before > 0.005 ? 'true' : undefined}>
                                    {money(Math.abs(bal.before))}
                                    {bal.before < -0.005 && <span className="cur">the shop owes</span>}
                                </span>
                            </div>
                            {bal.moves && (
                                <div className="vqdoc-sum-row strong">
                                    <span className="k">{bal.label(ctx.party.name)}</span>
                                    <span className="v" data-owed={bal.after > 0.005 ? 'true' : undefined}>
                                        {money(Math.abs(bal.after))}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {ctx.actions}
        </>
    );
}

/**
 * The count column — what a stock document has instead of totals. No money
 * anywhere, because the same goods are worth the same after the van ride and a
 * total would be a number with no meaning.
 */
export function DocumentCounts({ doc, chrome, totals, ctx }) {
    const { totalRef } = chrome;
    return (
        <>
            <section className="vqdoc-zone">
                <div className="vqdoc-zone-h"><span>Summary</span></div>
                <div className="vqdoc-sum">
                    <div className="vqdoc-sum-row">
                        <span className="k">Lines</span>
                        <span className="v">{totals.lines}</span>
                    </div>
                    <div className="vqdoc-total" ref={totalRef}>
                        <span className="k">{ctx.unitLabel || 'Units'}</span>
                        <span className="v">{totals.units}</span>
                    </div>
                    {ctx.extraRows}
                </div>
            </section>
            {ctx.actions}
        </>
    );
}
