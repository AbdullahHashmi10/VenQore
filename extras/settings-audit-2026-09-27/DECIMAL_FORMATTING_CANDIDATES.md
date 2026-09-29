# Fixed two-decimal display candidates

These are source-search results for the IDE to classify, not confirmed defects. They include money, percentages, quantities, file sizes, calculations and styling. Change only money **presentation** to use the saved global decimal setting; keep accounting calculation precision separate. The PHP codebase also has 908 matching `number_format(..., 2)` / `round(..., 2)` lines across 148 files, many of which are internal calculations. Start with customer-visible views and printed output.

The reported Sales dashboard case is addressed in the current working tree. Verify it at 0, 1, 2 and 4 decimal places after save and reload. For each candidate below, mark `money display`, `calculation`, `non-money`, or `fixed external currency`; attach a test where behavior changes.

```text
resources/js\Documents\DocumentLines.jsx:308:                    value={parseFloat(lineTotal(item).toFixed(2))} disabled={c.locked || c.readOnly?.total}
resources/js\Domain\invoice\useInvoiceForm.js:75:    const grandTotal = roundingEnabled ? Math.round(rawGrandTotal) : parseFloat(rawGrandTotal.toFixed(2));
resources/js\Domain\invoice\invoiceSchema.js:130:        : parseFloat(rawGrandTotal.toFixed(2));
resources/js\LayoutLaw\ui.jsx:36:export const n2 = (v) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
resources/js\NewInvoice\zones.jsx:26:    .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
resources/js\Pages\Admin\DataManagement.jsx:1024: {migrationFile.name} ({(migrationFile.size / 1024 / 1024).toFixed(2)} MB)
resources/js\Pages\Admin\FiscalYears.jsx:399:                                                        <td className="px-4 py-2 text-right">{line.debit > 0 ? line.debit.toFixed(2) : '-'}</td>
resources/js\Pages\Admin\FiscalYears.jsx:400:                                                        <td className="px-4 py-2 text-right">{line.credit > 0 ? line.credit.toFixed(2) : '-'}</td>
resources/js\Pages\Admin\Migration.jsx:137:                                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
resources/js\Components\Charts\funnel-chart.tsx:303:              const ringKey = `h-ring-${r.opacity.toFixed(2)}`;
resources/js\Components\Charts\funnel-chart.tsx:361:              const ringKey = `h-ring-${r.opacity.toFixed(2)}`;
resources/js\Components\Charts\funnel-chart.tsx:514:              const ringKey = `v-ring-${r.opacity.toFixed(2)}`;
resources/js\Components\Charts\funnel-chart.tsx:572:              const ringKey = `v-ring-${r.opacity.toFixed(2)}`;
resources/js\Components\Charts\loading-sweep.tsx:393:            key={`${x.toFixed(2)}-${value}`}
resources/js\Components\Charts\live-y-axis.tsx:110:  formatValue = (v: number) => v.toFixed(2),
resources/js\Components\Charts\live-line.tsx:98:  formatValue = (v: number) => v.toFixed(2),
resources/js\theme\build\generate.js:217:                    `${mode}: ${fg} on ${bg} is ${ratio.toFixed(2)}:1 ` +
resources/js\Pages\Cookbook\RecipesList.jsx:289:                                                                {parseFloat(ing.required).toFixed(2)} {ing.unit}
resources/js\Pages\Cookbook\RecipesList.jsx:292:                                                                {parseFloat(ing.available).toFixed(2)} {ing.unit}
resources/js\Pages\Cookbook\RecipesList.jsx:301:                                                                        SHORT: {parseFloat(ing.shortfall).toFixed(2)}
resources/js\Pages\Cookbook\Create.jsx:38: if (numQty >= 1000) return `${(numQty / 1000).toFixed(2)}kg`;
resources/js\Pages\Cookbook\Create.jsx:48: if (numQty >= 1000) return `${(numQty / 1000).toFixed(2)}L`;
resources/js\Pages\Cookbook\Create.jsx:699: {getCurrencySymbol()} {calculations.totalCOGM.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
resources/js\Pages\Cookbook\Create.jsx:703: Cost per unit: {getCurrencySymbol()} {calculations.costPerUnit.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
resources/js\Pages\Cookbook\Create.jsx:731: {getCurrencySymbol()} {calculations.suggestedPrice.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
resources/js\Pages\Cookbook\Create.jsx:734: Profit: {getCurrencySymbol()} {(calculations.suggestedPrice - calculations.totalCOGM).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
resources/js\Pages\Expenses\ExpensesList.jsx:1405: <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{getCurrencySymbol()} {cashBalance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
resources/js\Pages\ChequeBooks\Show.jsx:12:    (getCurrencySymbol()) + ' ' + (new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0));
resources/js\Pages\ChequeBooks\Reports\PostDated.jsx:11:    (getCurrencySymbol()) + ' ' + (new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0));
resources/js\Pages\ChequeBooks\Reports\OutgoingRegister.jsx:12:    (getCurrencySymbol()) + ' ' + (new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0));
resources/js\Pages\ChequeBooks\Reports\IncomingRegister.jsx:11:    (getCurrencySymbol()) + ' ' + (new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0));
resources/js\Pages\ChequeBooks\ReceivedCheques.jsx:13:    (getCurrencySymbol()) + ' ' + (new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val || 0));
resources/js\Pages\Pos.jsx:1595:                next.total = String(+(val * qty).toFixed(2));
resources/js\Pages\Pos.jsx:1598:                next.total = String(+(val * price).toFixed(2));
resources/js\Pages\GrowthEngine\Settings.jsx:250:                            <strong>{cur} {((data.loyalty_points_earned_per_unit * 10) / data.loyalty_redemption_rate).toFixed(2)}</strong> off a future bill.
resources/js\Pages\Billing\Index.jsx:1269:                                            <span className="text-ink font-mono font-bold text-sm">${tier.priceUSD.toFixed(2)}/item</span>
resources/js\Pages\Billing\Index.jsx:1305:                                            <span className="font-mono text-ink font-bold">${serviceTier.priceUSD.toFixed(2)} / product</span>
resources/js\Pages\Billing\Index.jsx:1309:                                            <span className="font-mono text-ink font-bold">+${(extraBlocks * serviceTier.extraUSD).toFixed(2)}</span>
resources/js\Pages\Billing\Index.jsx:1313:                                            <span className="font-mono text-[#0BAA8F] font-bold">${usdPricePerProduct.toFixed(2)} / item</span>
resources/js\Pages\Billing\Index.jsx:1320:                                            <div className="text-2xl font-bold font-mono text-ink">${usdTotalSetupCost.toFixed(2)}</div>
resources/js\Pages\NewDashboard.jsx:1089:            stroke-width="${sw}" opacity="${(0.08 + 0.92 * (k / (n-1))).toFixed(2)}"/>`);
resources/js\Pages\NewDashboard.jsx:1304:                  stroke="var(--vq-chart-surface)" stroke-width="1.5" opacity="${(1 - lvl*0.18).toFixed(2)}"/>`;
resources/js\Pages\NewDashboard.jsx:1549:      if (variant === "dots") return `<span class="ck-hd2" style="--d:${d}ms"><i style="transform:scale(${(0.3+v/mx*0.7).toFixed(2)});background:var(--vq-seq-${lvl+1})"></i>
resources/js\Pages\GrowthEngine\GrowthDashboard.jsx:56: if (n >= 10000000) return `${(n / 10000000).toFixed(2)} Cr`;
resources/js\Pages\GrowthEngine\GrowthDashboard.jsx:57: if (n >= 100000) return `${(n / 100000).toFixed(2)} Lac`;
resources/js\Pages\GrowthEngine\GrowthDashboard.jsx:651: {t.sensitivity !== 1 && ` · sensitivity ${t.sensitivity.toFixed(2)}×`}
resources/js\Pages\VenSynQ\Payouts.jsx:26:        minimumFractionDigits: 2, maximumFractionDigits: 2,
resources/js\Pages\VenSynQ\Dashboard.jsx:391:                                                                £{parseFloat(sale.total ?? 0).toFixed(2)}
resources/js\Pages\VenSynQ\Dashboard.jsx:394:                                                                {sale.gross_platform_fee ? `£${parseFloat(sale.gross_platform_fee).toFixed(2)}` : '—'}
resources/js\Pages\VenSynQ\Components\MoneyPipeline.jsx:32:        minimumFractionDigits: 2,
resources/js\Pages\VenSynQ\Components\MoneyPipeline.jsx:33:        maximumFractionDigits: 2,
resources/js\Components\Pos\PaymentModal.jsx:51:                const rows = Array.from({ length: n }, () => ({ method: 'cash', amount: each.toFixed(2), account_id: acct }));
resources/js\Components\Pos\PaymentModal.jsx:53:                if (drift) rows[0].amount = (each + drift).toFixed(2);
resources/js\Components\Pos\PaymentModal.jsx:58:                    { method: 'cash', amount: first.toFixed(2), account_id: acct },
resources/js\Components\Pos\PaymentModal.jsx:59:                    { method: 'card', amount: Math.max(0, totalAmount - first).toFixed(2), account_id: acct },
resources/js\Pages\Settings\ChatbotSettings.jsx:20: return `$${Number(cost).toFixed(2)}`;
resources/js\Pages\Marketing\Tools\BarcodeLabelSheet.jsx:279:                                            formatDisplay={(v) => parseFloat(v).toFixed(2)}
resources/js\Pages\Restaurant\Dashboard.jsx:116:                    ${Number(table.order_total || 0).toFixed(2)}
resources/js\Pages\Marketing\Tools\CashDrawer.jsx:306:                                    {symbol}{subtotal.toFixed(2)}
resources/js\Pages\Marketing\Tools\CashDrawer.jsx:347:                        <span className="text-lg font-bold text-ink">{symbol}{totals.totalBills.toFixed(2)}</span>
resources/js\Pages\Marketing\Tools\CashDrawer.jsx:351:                        <span className="text-lg font-bold text-ink">{symbol}{totals.totalCoins.toFixed(2)}</span>
resources/js\Pages\Marketing\Tools\CashDrawer.jsx:355:                        <span className="text-xl font-bold text-brand-600 dark:text-brand-400">{symbol}{totals.totalCounted.toFixed(2)}</span>
resources/js\Pages\Marketing\Tools\CashDrawer.jsx:360:                            {totals.variance > 0 ? `+${symbol}${totals.variance.toFixed(2)} OVER` : totals.variance < 0 ? `-${symbol}${Math.abs(totals.variance).toFixed(2)} SHORT` : `${symbol}0.00 BALANCED`}
resources/js\Pages\Marketing\Tools\InventoryHealth.jsx:54:    const fmtMoney = (v) => (v === null || v === undefined || !Number.isFinite(v)) ? '—' : `${sym}${round2(v).toFixed(2)}`;
resources/js\Pages\Marketing\Tools\InventoryHealth.jsx:367:                        <p className="text-xl font-bold text-ink">{gmroi.value !== null && Number.isFinite(gmroi.value) ? round2(gmroi.value).toFixed(2) : '—'}</p>
resources/js\Pages\Marketing\Tools\InventoryHealth.jsx:410:                        <p className="text-xl font-bold text-ink">{turnover.turns !== null ? `${round2(turnover.turns).toFixed(2)}×` : '—'}</p>
resources/js\Pages\Marketing\Tools\FoodCostCalculator.jsx:67:    return `${currencySym}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
resources/js\Pages\Marketing\Tools\FoodCostCalculator.jsx:295:            csv += `"${r.name.replace(/"/g, '""')}",${r.portions},${r.batchCost.toFixed(2)},${r.costPerPortion.toFixed(2)},${r.suggestedPrice.toFixed(2)},${r.sellingPrice.toFixed(2)},${r.actualFoodCostPct.toFixed(1)}%,${r.grossProfit.toFixed(2)}\n`;
resources/js\Pages\Marketing\Tools\CreditNote.jsx:94:    const fmtMoney = (n) => `${symbol}${(parseFloat(n) || 0).toFixed(2)}`;
resources/js\Pages\Marketing\Tools\MarginCalculator.jsx:178:    const fmtMoney = (v) => (v === null || v === undefined || Number.isNaN(v) || !Number.isFinite(v)) ? '—' : `${sym}${round2(v).toFixed(2)}`;
resources/js\Pages\Marketing\Tools\MarginCalculator.jsx:179:    const fmtPct = (v) => (v === null || v === undefined || Number.isNaN(v) || !Number.isFinite(v)) ? '—' : `${round2(v).toFixed(2)}%`;
resources/js\Pages\Sales\CreatePreSale.jsx:1405: value={parseFloat(calculateLineTotal(item).toFixed(2))}
resources/js\Pages\Marketing\Tools\Invoice.jsx:86:    const fmtMoney = (n) => `${symbol}${(parseFloat(n) || 0).toFixed(2)}`;
resources/js\Pages\Marketing\Tools\PosRoiCalculator.jsx:37:    const absVal = Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
resources/js\Pages\Marketing\Tools\PosRoiCalculator.jsx:137:            ['Monthly Labor Savings ($)', metrics.monthlyLaborSavings.toFixed(2)],
resources/js\Pages\Marketing\Tools\PosRoiCalculator.jsx:138:            ['Monthly Stock Leakage Saved ($)', metrics.monthlyShrinkageSavings.toFixed(2)],
resources/js\Pages\Marketing\Tools\PosRoiCalculator.jsx:139:            ['Gross Monthly Savings ($)', metrics.grossMonthlySavings.toFixed(2)],
resources/js\Pages\Marketing\Tools\PosRoiCalculator.jsx:140:            ['Net Monthly Savings ($)', metrics.netMonthlySavings.toFixed(2)],
resources/js\Pages\Marketing\Tools\PosRoiCalculator.jsx:142:            ['1-Year Net ROI ($)', metrics.netSavingsY1.toFixed(2)],
resources/js\Pages\Marketing\Tools\PosRoiCalculator.jsx:144:            ['3-Year Total Savings ($)', metrics.netSavingsY3.toFixed(2)],
resources/js\Pages\Marketing\Tools\PaymentFeeCalculator.jsx:91:    const fmtMoney = (v) => (v === null || v === undefined || Number.isNaN(v) || !Number.isFinite(v)) ? '—' : `$${round2(v).toFixed(2)}`;
resources/js\Pages\Marketing\Tools\PaymentFeeCalculator.jsx:300:                                                <td className="px-3 py-2.5 text-ink-secondary whitespace-nowrap">{r.effectiveRate !== null ? `${round2(r.effectiveRate).toFixed(2)}%` : '—'}</td>
resources/js\Pages\Marketing\Tools\PurchaseOrder.jsx:78:    const fmtMoney = (n) => `${symbol}${(parseFloat(n) || 0).toFixed(2)}`;
resources/js\Pages\Marketing\Tools\ProductCsvCleaner.jsx:378:                                                {row.price_clean !== null && row.price_clean !== undefined ? Number(row.price_clean).toFixed(2) : (row.price || '—')}
resources/js\Pages\PurchaseOrders\Show.jsx:195:                                        ${parseFloat(item.unit_cost).toFixed(2)}
resources/js\Pages\PurchaseOrders\Show.jsx:198:                                        ${parseFloat(item.total_cost).toFixed(2)}
resources/js\Pages\PurchaseOrders\Show.jsx:207:                                    ${parseFloat(order.total_amount).toFixed(2)}
resources/js\Components\SmartCapturePanel.jsx:614:            .toFixed(2);
resources/js\Components\SmartCapturePanel.jsx:819:                                        label: `${doc.reference || doc.id?.slice(0, 8)} — ${doc.party || 'No party'}${doc.total !== undefined && doc.total !== null ? ` — ${parseFloat(doc.total).toFixed(2)}` : ''} (${doc.status})`
resources/js\Components\SmartCapturePanel.jsx:1358:                                    <span className="text-[#23C4A6] font-bold" style={{ fontFamily: 'var(--vq-font-numeric)' }}>Rs. {Math.abs(successData.total || 0).toFixed(2)}</span>
resources/js\Pages\V3\Purchases\Show.jsx:343:                                                ? `${getCurrencySymbol(store)} ${parseFloat(line.debit).toFixed(2)}`
resources/js\Pages\V3\Purchases\Show.jsx:348:                                                ? `${getCurrencySymbol(store)} ${parseFloat(line.credit).toFixed(2)}`
resources/js\Pages\StockTake\Show.jsx:162:                                                {impact === 0 ? '-' : (impact > 0 ? `+${impact.toFixed(2)}` : impact.toFixed(2))}
resources/js\Pages\SuperAdmin\AiUsage\Index.jsx:106:                            ${(kpis.month_spend || 0).toFixed(2)}
resources/js\Pages\SuperAdmin\AiUsage\Index.jsx:121:                            ${(kpis.projected_month_end || 0).toFixed(2)}
resources/js\Pages\SuperAdmin\AiUsage\Index.jsx:124:                            <span>~${(kpis.avg_daily_spend_7d || 0).toFixed(2)} / day avg</span>
resources/js\Pages\SuperAdmin\AiUsage\Index.jsx:136:                            ${(kpis.daily_spend_cap || 25).toFixed(2)}
resources/js\Pages\Marketing\Tools\QrMenuPublic.jsx:65:                                            {symbol}{Number(item.price).toFixed(2)}
resources/js\Pages\Marketing\Tools\Quote.jsx:105:    const fmtMoney = (n) => `${symbol}${(parseFloat(n) || 0).toFixed(2)}`;
resources/js\Pages\Marketing\Tools\Receipt.jsx:78:    const fmtMoney = (n) => `${symbol}${(parseFloat(n) || 0).toFixed(2)}`;
resources/js\Pages\Marketing\Tools\SmartCapture.jsx:150:  const fmtMoney = (n) => `${symbol}${(parseFloat(n) || 0).toFixed(2)}`;
resources/js\Pages\Reports\PurchaseReturns.jsx:67:            amount: parseFloat(amount.toFixed(2))
```
