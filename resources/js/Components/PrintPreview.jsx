import React from 'react';
import { Scissors } from 'lucide-react';
import { formatCurrency, formatNumber, numberToWords } from '@/Utils/format';

import { vq } from '@/theme/runtime';
const getExtraChargesList = (calculations) => {
    try {
        if (calculations.extra_charge_label && typeof calculations.extra_charge_label === 'string' && calculations.extra_charge_label.startsWith('[')) {
            const list = JSON.parse(calculations.extra_charge_label);
            if (Array.isArray(list)) {
                return list.filter(f => parseFloat(f.value) > 0);
            }
        }
    } catch (_) {}
    
    if (calculations.extra_charge_value > 0) {
        return [{
            id: 1,
            label: calculations.extra_charge_label || 'Extra',
            value: calculations.extra_charge_value
        }];
    }
    return [];
};

/**
 * Advanced Print Preview Engine
 * Supports: Custom Dimensions, Variable Margins, 20+ Themes, Dark Mode Container
 */
export default function PrintPreview({ data, sale = null, type = 'regular', mode = 'light', forPrint = false }) {
    // Standard Paper Sizes in mm mapping to screen pixels (approx 3.78 px/mm)
    const MM_TO_PX = 3; // slightly scaled down for screen fit
    const paperSizes = {
        'A4': { w: 210, h: 297 },
        'A5': { w: 148, h: 210 },
        'Letter': { w: 216, h: 279 },
        'Legal': { w: 216, h: 356 },
    };

    // Calculate Dimensions
    let width, minHeight;

    if (type === 'thermal') {
        // Thermal Widths
        if (data.thermal_page_size === '2inch') width = 58 * MM_TO_PX; // ~174px
        else if (data.thermal_page_size === '4inch') width = 100 * MM_TO_PX; // ~300px
        else width = 80 * MM_TO_PX; // ~240px (Default 3inch)

        // thermal_custom_chars overrides width: standard 3" = 48 chars @ 80mm
        // scale proportionally: px_per_char ≈ (80 * MM_TO_PX) / 48
        const customChars = parseInt(data.thermal_custom_chars) || 0;
        if (customChars > 0 && customChars !== 48) {
            const pxPerChar = (80 * MM_TO_PX) / 48;
            width = Math.round(customChars * pxPerChar);
        }

        minHeight = 100 * MM_TO_PX; // Dynamic height
    } else {
        // Regular Paper
        let pW, pH;
        if (data.paper_size === 'Custom') {
            pW = parseFloat(data.custom_paper_width) || 210;
            pH = parseFloat(data.custom_paper_height) || 297;
        } else {
            const size = paperSizes[data.paper_size] || paperSizes['A4'];
            pW = size.w;
            pH = size.h;
        }

        if (data.paper_orientation === 'Landscape') {
            width = pH * MM_TO_PX;
            minHeight = pW * MM_TO_PX;
        } else {
            width = pW * MM_TO_PX;
            minHeight = pH * MM_TO_PX;
        }
    }

    // Margins
    const extraSpaceTop = parseFloat(data.print_extra_space_top) || 0;
    const marginTop = ((parseFloat(data.margin_top) || 0) + extraSpaceTop) * MM_TO_PX;
    const marginBottom = (parseFloat(data.margin_bottom) || 0) * MM_TO_PX;
    const marginLeft = (parseFloat(data.margin_left) || 0) * MM_TO_PX;
    const marginRight = (parseFloat(data.margin_right) || 0) * MM_TO_PX;

    // Theme Color
    const themeColor = data.print_theme_color || vq.indigo[600];

    // Parse Real Sale Data vs. Dummy Preview Data
    let items = [];
    let calculations = {};

    if (sale) {
        // Parse Real Data
        const saleItems = sale.items || sale.cart || [];
        items = saleItems.map((item, idx) => {
            const qty = parseFloat(item.quantity || item.qty || 1);
            const rate = parseFloat(item.unit_price || item.price || 0);
            const grossAmt = qty * rate;
            
            // Reconstruct discount amount and percentage
            const mrpVal = parseFloat(item.mrp || item.product?.mrp || rate || 0);
            let discountAmt = parseFloat(item.discount_amount || (item.discount_type === 'fixed' ? item.discount : 0) || 0);
            let discountPercent = parseFloat(item.discount_percent || 0);
            if (discountPercent === 0) {
                if (item.discount_type === 'percent') {
                    discountPercent = parseFloat(item.discount || 0);
                } else if (discountAmt > 0) {
                    const gross = grossAmt + discountAmt;
                    discountPercent = gross > 0 ? Math.round((discountAmt / gross) * 100) : 0;
                }
            }

            // Fallback 1: If MRP is greater than rate, calculate the discount based on MRP
            if (discountAmt === 0 && mrpVal > rate) {
                discountAmt = (mrpVal - rate) * qty;
                discountPercent = Math.round(((mrpVal - rate) / mrpVal) * 100);
            }



            const freeQty = parseFloat(item.free_quantity || item.freeQuantity || item.free_qty || 0);

            return {
                sno: idx + 1,
                name: item.product?.name || item.name || 'Item',
                hsn: item.product?.hsn || item.hsn || '',
                qty: qty,
                free_qty: freeQty,
                rate: rate,
                mrp: mrpVal,
                gst: parseFloat(item.tax_percent || item.tax_rate || 0),
                amount: grossAmt - discountAmt, // item total should show amount after item-level discount
                discount_percent: discountPercent,
                discount_amount: discountAmt,
                desc: item.desc || item.description || '',
                batch: item.batch || '',
                exp: item.exp || item.expiry || '',
                mfg_date: item.mfg_date || item.batch_mfg_date || (item.batch_details?.mfg_date) || '',
                size: item.size || item.product?.size || '',
                model: item.model || item.product?.model || '',
                serial: item.serial || item.serial_number || (item.serial_numbers ? item.serial_numbers.map(s => s.serial_number).join(', ') : '') || ''
            };
        });

        const itemsSubtotal = items.reduce((sum, i) => sum + i.amount, 0);
        const taxAmount = parseFloat(sale.tax || sale.tax_amount || 0);
        const discountAmount = parseFloat(sale.discount || sale.global_discount || 0);
        const deliveryCharge = parseFloat(sale.delivery_charge || sale.shipping_charges || 0);
        const extraCharge = parseFloat(sale.extra_charge_value || 0);
        const extraChargeLabel = sale.extra_charge_label || 'Extra';
        const grandTotal = parseFloat(sale.total || sale.invoice_total || sale.total_amount || 0);
        
        // Fix 0 amountPaid fallback bug
        let amountPaid = 0;
        if (sale.amount_paid !== undefined && sale.amount_paid !== null) {
            amountPaid = parseFloat(sale.amount_paid);
        } else if (sale.paid_amount !== undefined && sale.paid_amount !== null) {
            amountPaid = parseFloat(sale.paid_amount);
        } else if (sale.paid !== undefined && sale.paid !== null) {
            amountPaid = parseFloat(sale.paid);
        } else if (sale.cash !== undefined && sale.cash !== null) {
            amountPaid = parseFloat(sale.cash);
        }

        // Total savings = invoice/global discount + row item discounts + free items valued at price
        const totalItemDiscounts = items.reduce((sum, i) => sum + (parseFloat(i.discount_amount) || 0), 0);
        const freeItemsValue = items.reduce((sum, i) => sum + ((parseFloat(i.free_qty) || 0) * (parseFloat(i.rate) || 0)), 0);
        const totalSavings = discountAmount + totalItemDiscounts + freeItemsValue;

        const balanceDue = Math.max(0, grandTotal - amountPaid);

        // Ledger Balances
        let prevLedgerBalance = 0;
        let netLedgerBalance = 0;

        if (sale.customer_prev_balance !== undefined && sale.customer_prev_balance !== null) {
            prevLedgerBalance = parseFloat(sale.customer_prev_balance);
            netLedgerBalance = parseFloat(sale.customer_net_balance || 0);
        } else {
            // Fields not provided by server — show 0/0 rather than reading the
            // stale current_balance column which may be an outdated cached value.
            prevLedgerBalance = 0;
            netLedgerBalance  = 0;
        }

        calculations = {
            subtotal: parseFloat(sale.subtotal || (itemsSubtotal + totalItemDiscounts)), // subtotal before item discounts
            qty: items.reduce((sum, i) => sum + i.qty, 0),
            gst: taxAmount,
            discount: totalSavings, // "You Saved" will show total savings
            invoiceDiscount: discountAmount, // for top-level discount line in bill
            delivery_charge: deliveryCharge,
            extra_charge_value: extraCharge,
            extra_charge_label: extraChargeLabel,
            total: grandTotal,
            paid: amountPaid,
            balance: balanceDue,
            prev_balance: prevLedgerBalance,
            net_balance: netLedgerBalance
        };
    } else {
        // Fallback to sample data for settings preview
         items = [
             { sno: 1, name: 'Samsung Galaxy A54', hsn: '8517', qty: 1, free_qty: 1, freeQuantity: 1, rate: 85000, mrp: 90000, gst: 18, amount: 76500, discount_percent: 10, discount_amount: 8500, desc: '128GB Black', batch: 'BX-902', exp: '12/26', mfg_date: '01/24', size: '6.4"', model: 'SM-A546B', serial: 'S/N: 9876543210' },
             { sno: 2, name: 'Wireless Charger 15W', hsn: '8504', qty: 2, free_qty: 0, freeQuantity: 0, rate: 2500, mrp: 2999, gst: 12, amount: 5000, discount_percent: 0, discount_amount: 0, desc: 'Fast Charge', batch: 'BX-902', exp: '12/26', mfg_date: '01/24', size: 'Standard', model: 'WC-15W', serial: '' },
             { sno: 3, name: 'Tempered Glass Screen', hsn: '7007', qty: 1, free_qty: 0, freeQuantity: 0, rate: 350, mrp: 499, gst: 5, amount: 315, discount_percent: 10, discount_amount: 35, desc: '9H Hardness', batch: 'BX-902', exp: '12/26', mfg_date: '01/24', size: '6.4"', model: 'TG-A54', serial: '' },
         ];
        calculations = {
            subtotal: 90350,
            qty: 4,
            gst: 4518,
            discount: 17035, // 8535 + 8500 (free item value)
            invoiceDiscount: 8535,
            delivery_charge: 100,
            extra_charge_value: 50,
            extra_charge_label: 'Extra Charge',
            total: 81815 + 100 + 50,
            paid: 0,
            balance: 81815 + 100 + 50,
            prev_balance: 15000,
            net_balance: 96815 + 100 + 50
        };
    }

    let entityLabel = 'Customer';
    let entityName = 'John Doe';
    let showEntity = false;

    if (sale) {
        const isExpense = sale.type === 'expense' || sale.category || sale.category_name;
        const isPurchase = sale.type === 'purchase' || sale.supplier || sale.supplier_name || window.location.pathname.includes('purchase');

        if (isExpense) {
            entityLabel = 'Category';
            entityName = sale.category?.name || sale.category_name || 'Expense';
            showEntity = true;
        } else if (isPurchase) {
            entityLabel = 'Supplier';
            entityName = sale.supplier?.name || sale.contact?.name || sale.supplier_name || sale.party?.name || 'Supplier';
            showEntity = !!(sale.supplier || sale.contact || sale.supplier_name || sale.party);
        } else {
            entityLabel = 'Customer';
            entityName = sale.customer?.name || sale.contact?.name || sale.customer_name || sale.party?.name || 'Walk-in Customer';
            showEntity = !!(sale.customer || sale.contact || sale.customer_name || sale.party);
        }
    } else {
        showEntity = true;
    }

    const commonProps = { data, items, calculations, themeColor, MM_TO_PX, entityLabel, entityName, showEntity };


    // When actually rendering for the printer, strip all UI shadows, helpers, and wrappers
    // that would bleed outside the print boundary and trigger a second page cut.
    if (forPrint) {
        let printWidth = width ? `${width}px` : '100%';
        // Use exact mm for print mode to avoid scaling issues in browser
        if (type === 'thermal') {
            if (data.thermal_page_size === '2inch') printWidth = '58mm';
            else if (data.thermal_page_size === '4inch') printWidth = '100mm';
            else printWidth = '80mm';
        } else {
            if (data.paper_size === 'Custom') printWidth = '100%';
            else if (data.paper_orientation === 'Landscape') printWidth = `${paperSizes[data.paper_size]?.h || 297}mm`;
            else printWidth = `${paperSizes[data.paper_size]?.w || 210}mm`;
        }

        return (
            <div
                className="bg-white text-black print-container box-border mx-auto"
                style={{
                    width: printWidth,
                    paddingTop: `${data.margin_top || 0}mm`,
                    paddingBottom: `${data.margin_bottom || 0}mm`,
                    paddingLeft: `${data.margin_left || 0}mm`,
                    paddingRight: `${data.margin_right || 0}mm`,
                }}
            >
                {type === 'thermal'
                    ? <ThermalRenderer {...commonProps} sale={sale} />
                    : <RegularRenderer {...commonProps} sale={sale} />
                }
            </div>
        );
    }

    return (
        <div className={`relative transition-all duration-300 ${mode === 'dark' ? 'brightness-90 contrast-125' : ''}`}>
            {/* Paper Shadow Container */}
            <div
                className="bg-white text-slate-900 shadow-2xl mx-auto overflow-hidden flex flex-col relative transition-all duration-500"
                style={{
                    width: `${width}px`,
                    minHeight: `${minHeight}px`,
                    paddingTop: `${marginTop}px`,
                    paddingBottom: `${marginBottom}px`,
                    paddingLeft: `${marginLeft}px`,
                    paddingRight: `${marginRight}px`,
                }}
            >
                {/* Content Render Strategy */}
                {type === 'thermal'
                    ? <ThermalRenderer {...commonProps} sale={sale} />
                    : <RegularRenderer {...commonProps} sale={sale} />
                }
            </div>

            {/* Dimensions Indicator (Helper) */}
            <div className={`absolute -bottom-8 left-0 w-full text-center text-2xs font-mono opacity-50 ${mode === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                {Math.round(width / MM_TO_PX)}mm x {Math.round(minHeight / MM_TO_PX)}mm
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// REGULAR PRINTER THEMES
// ----------------------------------------------------------------------

const RegularRenderer = (props) => {
    const { data } = props;
    const theme = data.print_theme || 'modern';

    switch (theme) {
        case 'classic': return <ThemeRegularClassic {...props} />;
        case 'bold': return <ThemeRegularBold {...props} />;
        default: return <ThemeRegularModern {...props} />;
    }
};

// --- Theme 1: Modern (Default) ---
const ThemeRegularModern = ({ data, items, calculations, themeColor, sale, entityLabel, entityName, showEntity }) => {
    const showDiscount = data.print_show_discount && items.some(i => i.discount_percent > 0 || i.discount_amount > 0);
    const formatAmount = (amount) => formatCurrency(amount, data);
    const formatNum = (num) => formatNumber(num, null, data);

    const headerContent = (
        <div className="flex justify-between items-start border-b-2 pb-6 mb-6" style={{ borderColor: themeColor }}>
            <div className="flex gap-4">
                {data.print_logo && (
                    data.print_logo_path ? (
                        <img
                            src={data.print_logo_path}
                            alt="Logo"
                            className="w-24 h-24 object-contain mr-4"
                        />
                    ) : (
                        <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400 font-bold">LOGO</div>
                    )
                )}
                <div>
                    <h1 className="font-extrabold text-left" style={{ color: themeColor, fontSize: `${itemsHeadingSize(data.print_company_text_size)}rem` }}>{data.business_name || 'Business Name'}</h1>
                    <div className="text-xs text-slate-600 space-y-0.5 mt-2 text-left font-sans">
                        <p>{data.business_address || '123 Business St, City, Country'}</p>
                        <p>{data.business_phone || '+1 234 567 890'}</p>
                        {data.business_email && <p>Email: {data.business_email}</p>}
                        {data.tax_number && <p>Tax/NTN: {data.tax_number}</p>}
                    </div>
                </div>
            </div>
            <div className="text-right">
                <div className="font-black text-slate-100 uppercase tracking-tighter" style={{ fontSize: '2.5rem' }}>Invoice</div>
                <div className="text-sm font-bold text-slate-600 mt-1"># {sale ? (sale.invoice_no || sale.invoice_number || sale.reference_number || sale.id) : `${data.sale_prefix}1001`}</div>
                {data.print_original_copy && <div className="text-2xs font-bold uppercase tracking-widest text-slate-400 mt-1">Original Copy</div>}
                <div className="text-xs text-slate-500 mt-1">Date: {sale ? (new Date(sale.created_at || sale.date).toLocaleDateString()) : new Date().toLocaleDateString()}</div>
            </div>
        </div>
    );

    const billToContent = showEntity ? (
        <div className="flex justify-between mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100 text-left">
            <div>
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">{entityLabel}</div>
                <div className="font-bold text-slate-800">{entityName}</div>
                {sale?.contact?.address && <div className="text-xs text-slate-500">{sale.contact.address}</div>}
            </div>
            <div className="text-right">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Payment Status</div>
                <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">PAID</div>
            </div>
        </div>
    ) : null;

    const mainContent = (
        <>
            {/* Table */}
            <table className="w-full mb-auto text-sm">
                <thead className="bg-slate-800 text-white rounded-t-lg">
                    <tr>
                        {data.print_show_sno && <th className="p-3 text-left first:rounded-tl-lg w-12">#</th>}
                        <th className="p-3 text-left">Item</th>
                        {data.print_show_hsn && <th className="p-3 text-left">HSN</th>}
                        {data.print_show_description && <th className="p-3 text-left">Desc</th>}
                        {data.print_show_mrp && <th className="p-3 text-right">MRP</th>}
                        <th className="p-3 text-center">
                            {data.print_show_free_qty && items.some(i => i.free_qty > 0) ? 'Qty + Free' : 'Qty'}
                        </th>
                        {data.print_show_units && <th className="p-3 text-center">Unit</th>}
                        <th className="p-3 text-right">Rate</th>
                        {showDiscount && <th className="p-3 text-right">Disc %</th>}
                        {data.print_tax_details && <th className="p-3 text-right">Tax</th>}
                        <th className="p-3 text-right last:rounded-tr-lg">Total</th>
                    </tr>
                </thead>
                <tbody style={{ fontSize: `${itemsBodySize(data.print_invoice_text_size)}rem` }}>
                    {items.map((item, i) => (
                        <tr key={i} className="border-b border-slate-100 last:border-0">
                            {data.print_show_sno && <td className="p-3 text-slate-500">{item.sno}</td>}
                            <td className="p-3 font-medium text-left">
                                <div>{item.name}</div>
                                {(data.thermal_show_batch || data.thermal_show_expiry || data.thermal_show_mfg_date || data.thermal_show_size || data.thermal_show_model || data.thermal_show_serial) && (item.batch || item.exp || item.mfg_date || item.size || item.model || item.serial) && (
                                    <div className="text-2xs text-slate-400 font-mono mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                                        {data.thermal_show_batch && item.batch && <span>Batch: {item.batch}</span>}
                                        {data.thermal_show_expiry && item.exp && <span>Exp: {item.exp}</span>}
                                        {data.thermal_show_mfg_date && item.mfg_date && <span>Mfg: {item.mfg_date}</span>}
                                        {data.thermal_show_size && item.size && <span>Size: {item.size}</span>}
                                        {data.thermal_show_model && item.model && <span>Model: {item.model}</span>}
                                        {data.thermal_show_serial && item.serial && <span>S/N: {item.serial}</span>}
                                    </div>
                                )}
                            </td>
                            {data.print_show_hsn && <td className="p-3 text-slate-500 text-left">{item.hsn}</td>}
                            {data.print_show_description && <td className="p-3 text-slate-500 text-xs text-left">{item.desc}</td>}
                            {data.print_show_mrp && <td className="p-3 text-right text-slate-400 line-through">{formatAmount(item.mrp || (item.rate * 1.2))}</td>}

                            <td className="p-3 text-center text-slate-600 font-bold">
                                {data.print_show_free_qty && item.free_qty > 0 ? `${item.qty}+${item.free_qty}` : item.qty}
                            </td>
                            {data.print_show_units && <td className="p-3 text-center text-slate-500">{item.unit || 'pc'}</td>}

                            <td className="p-3 text-right text-slate-600">{formatAmount(item.rate)}</td>

                            {showDiscount && (
                                <td className="p-3 text-right text-emerald-600 font-bold">
                                    {item.discount_percent > 0
                                        ? `${item.discount_percent}% (-${formatAmount(item.discount_amount)})`
                                        : item.discount_amount > 0
                                            ? `-${formatAmount(item.discount_amount)}`
                                            : '-'
                                    }
                                </td>
                            )}

                            {data.print_tax_details && <td className="p-3 text-right text-slate-600">{formatAmount(item.tax || 0)}</td>}
                            <td className="p-3 text-right font-bold">{formatAmount(item.amount)}</td>
                        </tr>
                    ))}
                    {Array.from({ length: Math.max(0, (parseInt(data.print_min_item_rows) || 0) - items.length) }).map((_, idx) => (
                        <tr key={`empty-${idx}`} className="h-8 border-b border-slate-100 last:border-0 opacity-10">
                            {data.print_show_sno && <td className="p-3"></td>}
                            <td className="p-3"></td>
                            {data.print_show_hsn && <td className="p-3"></td>}
                            {data.print_show_description && <td className="p-3"></td>}
                            {data.print_show_mrp && <td className="p-3"></td>}
                            <td className="p-3"></td>
                            {data.print_show_units && <td className="p-3"></td>}
                            <td className="p-3"></td>
                            {showDiscount && <td className="p-3"></td>}
                            {data.print_tax_details && <td className="p-3"></td>}
                            <td className="p-3"></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mt-6 border-t pt-6">
                <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm text-slate-500"><span>Sub Total</span><span>{formatAmount(calculations.subtotal)}</span></div>

                    {data.print_total_quantity && (
                        <div className="flex justify-between text-sm text-slate-500"><span>Total Qty</span><span>{calculations.qty}</span></div>
                    )}

                    <div className="flex justify-between text-sm text-slate-500"><span>Tax</span><span>{formatAmount(calculations.gst)}</span></div>

                    {calculations.invoiceDiscount > 0 && (
                        <div className="flex justify-between text-sm text-red-500 font-bold"><span>Discount</span><span>-{formatAmount(calculations.invoiceDiscount)}</span></div>
                    )}

                    {data.print_show_delivery_charge !== false && calculations.delivery_charge > 0 && (
                        <div className="flex justify-between text-sm text-slate-500"><span>Delivery Charges</span><span>{formatAmount(calculations.delivery_charge)}</span></div>
                    )}

                    {data.print_show_extra_charge !== false && getExtraChargesList(calculations).map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm text-slate-500"><span>{item.label}</span><span>{formatAmount(item.value)}</span></div>
                    ))}

                    {data.print_you_saved && calculations.discount > 0 && (
                        <div className="flex justify-between text-sm text-emerald-600 font-bold"><span>You Saved</span><span>{formatAmount(calculations.discount)}</span></div>
                    )}

                    <div className="flex justify-between text-lg font-black mt-2 pt-2 border-t" style={{ color: themeColor }}>
                        <span>Total</span><span>{formatAmount(calculations.total)}</span>
                    </div>

                    {data.print_received_amount && (
                        <div className="flex justify-between text-sm text-slate-600 mt-2"><span>Received</span><span>{formatAmount(calculations.paid)}</span></div>
                    )}
                    {data.print_balance_amount && (
                        <div className="flex justify-between text-sm text-red-500 font-bold"><span>Balance Due</span><span>{formatAmount(calculations.balance)}</span></div>
                    )}
                    {data.print_show_previous_balance && (
                        <>
                            <div className="flex justify-between text-sm text-slate-500"><span>Prev Balance</span><span>{formatAmount(calculations.prev_balance)}</span></div>
                            <div className="flex justify-between text-sm font-bold border-t pt-1" style={{ color: themeColor }}>
                                <span>Net Balance</span>
                                <span>{formatAmount(calculations.net_balance)}</span>
                            </div>
                        </>
                    )}
                    {(data.print_party_balance && !data.print_show_previous_balance) && (
                        <div className="flex justify-between text-sm text-slate-500">
                            <span>Party Balance</span>
                            <span>{formatAmount(calculations.net_balance)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t text-center space-y-2">
                {data.print_amount_words !== '0' && (
                    <div className="text-sm font-bold italic text-slate-600 bg-slate-50 py-1 rounded">
                        "{numberToWords(calculations.total, data.print_amount_words)}"
                    </div>
                )}

                {(data.print_description !== false && data.print_description !== '0' && data.print_description !== 0) && (
                    <div className="text-xs text-slate-400">
                        {data.print_terms || 'Thank you for your business!'}
                    </div>
                )}

                <div className="text-2xs text-slate-400 font-medium pt-2">
                    Powered by{' '}
                    <a
                        href="https://venqore.com?utm_source=invoice_footer"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 font-bold hover:underline"
                    >
                        VenQore
                    </a>
                </div>

                {/* Received / Delivered / Acknowledgement / Payment Mode */}
                {(data.print_received_by || data.print_delivered_by || data.print_acknowledgement || data.print_payment_mode) && (
                    <div className="flex justify-between items-end text-xs mt-6 pt-4 border-t border-dashed border-slate-200">
                        {data.print_payment_mode && (
                            <div className="text-left">
                                <span className="font-bold text-slate-500">Payment Mode: </span>
                                <span className="font-bold text-slate-800">{sale ? (sale.payment_method || 'Cash').toUpperCase() : 'CASH'}</span>
                            </div>
                        )}
                        <div className="flex gap-6 ml-auto font-bold">
                            {data.print_received_by && (
                                <div className="text-center">
                                    <div className="w-28 border-b border-slate-300 h-6"></div>
                                    <div className="text-2xs text-slate-500 mt-1">Received By</div>
                                </div>
                            )}
                            {data.print_delivered_by && (
                                <div className="text-center">
                                    <div className="w-28 border-b border-slate-300 h-6"></div>
                                    <div className="text-2xs text-slate-500 mt-1">Delivered By</div>
                                </div>
                            )}
                            {data.print_acknowledgement && (
                                <div className="text-center">
                                    <div className="w-36 border-b border-slate-300 h-6"></div>
                                    <div className="text-2xs text-slate-500 mt-1">Customer Acknowledgement</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {data.print_signature_text && (
                    <div className="flex justify-end mt-8">
                        <div className="text-center">
                            <div className="h-10"></div>
                            <div className="border-t border-slate-300 w-32"></div>
                            <div className="text-2xs font-bold text-slate-500 mt-1">{data.print_signature_text}</div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );

    if (data.print_header_all_pages) {
        return (
            <table className="w-full h-full font-sans print-layout-master-table" style={{ borderCollapse: 'collapse', border: 'none' }}>
                <thead>
                    <tr>
                        <td style={{ border: 'none', padding: 0 }}>
                            {headerContent}
                            {billToContent}
                        </td>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={{ border: 'none', padding: 0, verticalAlign: 'top' }}>
                            {mainContent}
                        </td>
                    </tr>
                </tbody>
            </table>
        );
    }

    return (
        <div className="font-sans h-full flex flex-col">
            {headerContent}
            {billToContent}
            {mainContent}
        </div>
    );
};

// Helper for font sizes
const itemsHeadingSize = (val) => {
    const map = { '2': 1.25, '3': 1.5, '4': 1.875, '5': 2.25 };
    return map[val] || 1.875;
};
const itemsBodySize = (val) => {
    const map = { '1': 0.75, '2': 0.875, '3': 1, '4': 1.125 }; // rem
    return map[val] || 0.875;
};

// --- Theme 2: Classic/Official ---
const ThemeRegularClassic = ({ data, items, calculations, themeColor, sale, entityLabel, entityName, showEntity }) => {
    const formatAmount = (amount) => formatCurrency(amount, data);

    const headerContent = (
        <div className="text-center mb-8 border-b-4 double border-slate-800 pb-4">
            <h1 className="text-3xl font-bold uppercase tracking-widest mb-2">{data.business_name}</h1>
            <p className="text-sm italic">{data.business_address}</p>
            <p className="text-xs">{data.business_phone}{data.business_email && ` | Email: ${data.business_email}`}{data.tax_number && ` | Tax/NTN: ${data.tax_number}`}</p>
        </div>
    );

    const billToContent = (
        <div className="flex justify-between mb-6 border p-4 text-left">
            <div>
                <strong>{entityLabel.toUpperCase()}:</strong>
                <p>{entityName}</p>
                {sale?.contact?.address && <p>{sale.contact.address}</p>}
            </div>
            <div className="text-right">
                <p><strong>INVOICE #:</strong> {sale ? (sale.invoice_no || sale.invoice_number || sale.reference_number || sale.id) : `${data.sale_prefix}005`}</p>
                <p><strong>DATE:</strong> {sale ? (new Date(sale.created_at || sale.date).toLocaleDateString()) : new Date().toLocaleDateString()}</p>
            </div>
        </div>
    );

    const mainContent = (
        <>
            <table className="w-full border-collapse border border-slate-800 mb-6">
                <thead className="bg-slate-100">
                    <tr>
                        <th className="border border-slate-800 p-2 text-left">DESCRIPTION</th>
                        <th className="border border-slate-800 p-2 text-center">
                            {data.print_show_free_qty && items.some(i => i.free_qty > 0) ? 'QTY + FREE' : 'QTY'}
                        </th>
                        <th className="border border-slate-800 p-2 text-right">UNIT PRICE</th>
                        <th className="border border-slate-800 p-2 text-right">AMOUNT</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, i) => (
                        <tr key={i}>
                            <td className="border border-slate-800 p-2 text-left">
                                <div>{item.name}</div>
                                {(data.thermal_show_batch || data.thermal_show_expiry || data.thermal_show_mfg_date || data.thermal_show_size || data.thermal_show_model || data.thermal_show_serial) && (item.batch || item.exp || item.mfg_date || item.size || item.model || item.serial) && (
                                    <div className="text-2xs text-slate-500 font-mono mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                                        {data.thermal_show_batch && item.batch && <span>Batch: {item.batch}</span>}
                                        {data.thermal_show_expiry && item.exp && <span>Exp: {item.exp}</span>}
                                        {data.thermal_show_mfg_date && item.mfg_date && <span>Mfg: {item.mfg_date}</span>}
                                        {data.thermal_show_size && item.size && <span>Size: {item.size}</span>}
                                        {data.thermal_show_model && item.model && <span>Model: {item.model}</span>}
                                        {data.thermal_show_serial && item.serial && <span>S/N: {item.serial}</span>}
                                    </div>
                                )}
                            </td>
                            <td className="border border-slate-800 p-2 text-center">
                                {data.print_show_free_qty && item.free_qty > 0 ? `${item.qty}+${item.free_qty}` : item.qty}
                            </td>
                            <td className="border border-slate-800 p-2 text-right">{formatAmount(item.rate)}</td>
                            <td className="border border-slate-800 p-2 text-right">{formatAmount(item.amount)}</td>
                        </tr>
                    ))}
                    {Array.from({ length: Math.max(0, (parseInt(data.print_min_item_rows) || 0) - items.length) }).map((_, idx) => (
                        <tr key={`empty-${idx}`}>
                            <td className="border border-slate-800 p-2 h-8"></td>
                            <td className="border border-slate-800 p-2 text-center h-8"></td>
                            <td className="border border-slate-800 p-2 text-right h-8"></td>
                            <td className="border border-slate-800 p-2 text-right h-8"></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-between items-start mt-6">
                <div className="w-1/2 text-left space-y-2">
                    {data.print_amount_words !== '0' && (
                        <div className="text-xs italic font-bold">
                            "{numberToWords(calculations.total, data.print_amount_words)}"
                        </div>
                    )}
                    {(data.print_description !== false && data.print_description !== '0' && data.print_description !== 0) && (
                        <div className="text-xs italic whitespace-pre-wrap">
                            {data.print_terms || 'Thank you for your business!'}
                        </div>
                    )}
                </div>
                <div className="w-1/2 ml-auto">
                    <div className="flex justify-between border-b border-slate-800 py-1"><span>SUBTOTAL:</span><span>{formatAmount(calculations.subtotal)}</span></div>
                    {calculations.invoiceDiscount > 0 && (
                        <div className="flex justify-between border-b border-slate-800 py-1 text-red-600 font-bold"><span>DISCOUNT:</span><span>-{formatAmount(calculations.invoiceDiscount)}</span></div>
                    )}
                    <div className="flex justify-between border-b border-slate-800 py-1"><span>TAX:</span><span>{formatAmount(calculations.gst)}</span></div>
                    {data.print_show_delivery_charge !== false && calculations.delivery_charge > 0 && (
                        <div className="flex justify-between border-b border-slate-800 py-1"><span>DELIVERY:</span><span>{formatAmount(calculations.delivery_charge)}</span></div>
                    )}
                    {data.print_show_extra_charge !== false && getExtraChargesList(calculations).map((item, idx) => (
                        <div key={idx} className="flex justify-between border-b border-slate-800 py-1"><span>{String(item.label || 'EXTRA').toUpperCase()}:</span><span>{formatAmount(item.value)}</span></div>
                    ))}
                    <div className="flex justify-between font-bold text-xl py-2"><span>TOTAL:</span><span>{formatAmount(calculations.total)}</span></div>
                    {data.print_received_amount && (
                        <div className="flex justify-between border-b border-slate-800 py-1"><span>RECEIVED:</span><span>{formatAmount(calculations.paid)}</span></div>
                    )}
                    {data.print_balance_amount && (
                        <div className="flex justify-between border-b border-slate-800 py-1 font-bold"><span>BALANCE DUE:</span><span>{formatAmount(calculations.balance)}</span></div>
                    )}
                    {data.print_show_previous_balance && (
                        <>
                            <div className="flex justify-between border-b border-slate-800 py-1"><span>PREV BALANCE:</span><span>{formatAmount(calculations.prev_balance)}</span></div>
                            <div className="flex justify-between font-bold py-1"><span>NET BALANCE:</span><span>{formatAmount(calculations.net_balance)}</span></div>
                        </>
                    )}
                    {(data.print_party_balance && !data.print_show_previous_balance) && (
                        <div className="flex justify-between border-b border-slate-800 py-1"><span>PARTY BALANCE:</span><span>{formatAmount(calculations.net_balance)}</span></div>
                    )}
                </div>
            </div>

            {/* Received / Delivered / Acknowledgement / Payment Mode */}
            {(data.print_received_by || data.print_delivered_by || data.print_acknowledgement || data.print_payment_mode) && (
                <div className="flex justify-between items-end text-xs mt-8 pt-4 border-t border-dashed border-slate-800">
                    {data.print_payment_mode && (
                        <div className="text-left font-bold">
                            <span>Payment Mode: </span>
                            <span>{sale ? (sale.payment_method || 'Cash').toUpperCase() : 'CASH'}</span>
                        </div>
                    )}
                    <div className="flex gap-6 ml-auto font-bold">
                        {data.print_received_by && (
                            <div className="text-center">
                                <div className="w-28 border-b border-slate-800 h-6"></div>
                                <div className="text-2xs mt-1">Received By</div>
                            </div>
                        )}
                        {data.print_delivered_by && (
                            <div className="text-center">
                                <div className="w-28 border-b border-slate-800 h-6"></div>
                                <div className="text-2xs mt-1">Delivered By</div>
                            </div>
                        )}
                        {data.print_acknowledgement && (
                            <div className="text-center">
                                <div className="w-36 border-b border-slate-800 h-6"></div>
                                <div className="text-2xs mt-1">Customer Acknowledgement</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {data.print_signature_text && (
                <div className="flex justify-end mt-8">
                    <div className="text-center font-bold">
                        <div className="h-10"></div>
                        <div className="border-t border-slate-800 w-32"></div>
                        <div className="text-2xs mt-1">{data.print_signature_text}</div>
                    </div>
                </div>
            )}
        </>
    );

    if (data.print_header_all_pages) {
        return (
            <table className="w-full h-full font-serif print-layout-master-table" style={{ borderCollapse: 'collapse', border: 'none' }}>
                <thead>
                    <tr>
                        <td style={{ border: 'none', padding: 0 }}>
                            {headerContent}
                            {billToContent}
                        </td>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={{ border: 'none', padding: 0, verticalAlign: 'top' }}>
                            {mainContent}
                        </td>
                    </tr>
                </tbody>
            </table>
        );
    }

    return (
        <div className="font-serif h-full flex flex-col text-slate-900">
            {headerContent}
            {billToContent}
            {mainContent}
            <div className="text-2xs text-slate-400 font-medium pt-2 text-center mt-auto">
                Powered by{' '}
                <a
                    href="https://venqore.com?utm_source=invoice_footer"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#4f46e5', fontWeight: 'bold' }}
                >
                    VenQore
                </a>
            </div>
        </div>
    );
};

// --- Theme 3: Bold Header ---
const ThemeRegularBold = ({ data, items, calculations, themeColor, sale, entityLabel, entityName, showEntity }) => {
    const formatAmount = (amount) => formatCurrency(amount, data);

    const headerContent = (
        <div className="bg-slate-900 text-white p-8 -mx-8 -mt-8 mb-8 flex justify-between items-center text-left" style={{ backgroundColor: themeColor }}>
            <div>
                <h1 className="text-4xl font-black">{data.business_name}</h1>
                <p className="opacity-80 mt-1">INVOICE</p>
            </div>
            <div className="text-right opacity-80 text-sm">
                <p>{data.business_phone}</p>
                <p>{data.business_address}</p>
                {data.business_email && <p>{data.business_email}</p>}
                {data.tax_number && <p>Tax/NTN: {data.tax_number}</p>}
            </div>
        </div>
    );

    const billToContent = (
        <div className="grid grid-cols-2 gap-8 mb-10 text-left">
            <div>
                <h3 className="font-bold text-slate-400 uppercase text-xs mb-2">{entityLabel}</h3>
                <div className="text-xl font-bold text-slate-800">{entityName}</div>
            </div>
            <div className="text-right">
                <h3 className="font-bold text-slate-400 uppercase text-xs mb-2">Invoice Info</h3>
                <p className="font-mono">{sale ? (sale.invoice_no || sale.invoice_number || sale.reference_number || sale.id) : `${data.sale_prefix}-1001`}</p>
                <p className="font-mono text-slate-500">{sale ? (new Date(sale.created_at || sale.date).toLocaleDateString()) : new Date().toLocaleDateString()}</p>
            </div>
        </div>
    );

    const mainContent = (
        <>
            <table className="w-full mb-8">
                <thead>
                    <tr className="border-b-2 border-slate-900">
                        <th className="text-left py-3 font-black text-slate-900 uppercase text-xs">Item Description</th>
                        <th className="text-right py-3 font-black text-slate-900 uppercase text-xs">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, i) => (
                        <tr key={i} className="border-b border-slate-100">
                            <td className="py-4 text-left">
                                <div className="font-bold">{item.name}</div>
                                {(data.thermal_show_batch || data.thermal_show_expiry || data.thermal_show_mfg_date || data.thermal_show_size || data.thermal_show_model || data.thermal_show_serial) && (item.batch || item.exp || item.mfg_date || item.size || item.model || item.serial) && (
                                    <div className="text-2xs text-slate-500 font-mono mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                                        {data.thermal_show_batch && item.batch && <span>Batch: {item.batch}</span>}
                                        {data.thermal_show_expiry && item.exp && <span>Exp: {item.exp}</span>}
                                        {data.thermal_show_mfg_date && item.mfg_date && <span>Mfg: {item.mfg_date}</span>}
                                        {data.thermal_show_size && item.size && <span>Size: {item.size}</span>}
                                        {data.thermal_show_model && item.model && <span>Model: {item.model}</span>}
                                        {data.thermal_show_serial && item.serial && <span>S/N: {item.serial}</span>}
                                    </div>
                                )}
                                <div className="text-xs text-slate-500">{item.qty} x {formatAmount(item.rate)}</div>
                            </td>
                            <td className="py-4 text-right font-bold">{formatAmount(item.amount)}</td>
                        </tr>
                    ))}
                    {Array.from({ length: Math.max(0, (parseInt(data.print_min_item_rows) || 0) - items.length) }).map((_, idx) => (
                        <tr key={`empty-${idx}`} className="border-b border-slate-100 h-12">
                            <td className="py-4"></td>
                            <td className="py-4 text-right"></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-between items-start mt-6">
                <div className="w-1/2 text-left space-y-2">
                    {data.print_amount_words !== '0' && (
                        <div className="text-xs italic font-bold">
                            "{numberToWords(calculations.total, data.print_amount_words)}"
                        </div>
                    )}
                    {(data.print_description !== false && data.print_description !== '0' && data.print_description !== 0) && (
                        <div className="text-xs text-slate-400">
                            {data.print_terms || 'Thank you for your business!'}
                        </div>
                    )}
                </div>
                <div className="w-1/2 ml-auto text-sm space-y-1">
                    <div className="flex justify-between"><span>Subtotal:</span><span>{formatAmount(calculations.subtotal)}</span></div>
                    {calculations.invoiceDiscount > 0 && (
                        <div className="flex justify-between text-red-600 font-bold"><span>Discount:</span><span>-{formatAmount(calculations.invoiceDiscount)}</span></div>
                    )}
                    <div className="flex justify-between"><span>Tax Amount:</span><span>{formatAmount(calculations.gst)}</span></div>
                    {data.print_show_delivery_charge !== false && calculations.delivery_charge > 0 && (
                        <div className="flex justify-between"><span>Delivery:</span><span>{formatAmount(calculations.delivery_charge)}</span></div>
                    )}
                    {data.print_show_extra_charge !== false && getExtraChargesList(calculations).map((item, idx) => (
                        <div key={idx} className="flex justify-between"><span>{item.label}:</span><span>{formatAmount(item.value)}</span></div>
                    ))}
                    <div className="flex justify-between font-bold text-base border-t border-slate-900 pt-1"><span>TOTAL DUE:</span><span>{formatAmount(calculations.total)}</span></div>
                    {data.print_received_amount && (
                        <div className="flex justify-between"><span>Received:</span><span>{formatAmount(calculations.paid)}</span></div>
                    )}
                    {data.print_balance_amount && (
                        <div className="flex justify-between font-bold"><span>Balance Due:</span><span>{formatAmount(calculations.balance)}</span></div>
                    )}
                    {data.print_show_previous_balance && (
                        <>
                            <div className="flex justify-between"><span>Prev Balance:</span><span>{formatAmount(calculations.prev_balance)}</span></div>
                            <div className="flex justify-between font-bold border-t border-slate-900 pt-1"><span>Net Balance:</span><span>{formatAmount(calculations.net_balance)}</span></div>
                        </>
                    )}
                    {(data.print_party_balance && !data.print_show_previous_balance) && (
                        <div className="flex justify-between font-bold"><span>Party Balance:</span><span>{formatAmount(calculations.net_balance)}</span></div>
                    )}
                </div>
            </div>

            {/* Received / Delivered / Acknowledgement / Payment Mode */}
            {(data.print_received_by || data.print_delivered_by || data.print_acknowledgement || data.print_payment_mode) && (
                <div className="flex justify-between items-end text-xs mt-8 pt-4 border-t-2 border-slate-900">
                    {data.print_payment_mode && (
                        <div className="text-left font-bold">
                            <span>Payment Mode: </span>
                            <span>{sale ? (sale.payment_method || 'Cash').toUpperCase() : 'CASH'}</span>
                        </div>
                    )}
                    <div className="flex gap-6 ml-auto font-bold">
                        {data.print_received_by && (
                            <div className="text-center">
                                <div className="w-28 border-b-2 border-slate-900 h-6"></div>
                                <div className="text-2xs mt-1">Received By</div>
                            </div>
                        )}
                        {data.print_delivered_by && (
                            <div className="text-center">
                                <div className="w-28 border-b-2 border-slate-900 h-6"></div>
                                <div className="text-2xs mt-1">Delivered By</div>
                            </div>
                        )}
                        {data.print_acknowledgement && (
                            <div className="text-center">
                                <div className="w-36 border-b-2 border-slate-900 h-6"></div>
                                <div className="text-2xs mt-1">Customer Acknowledgement</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {data.print_signature_text && (
                <div className="flex justify-end mt-8">
                    <div className="text-center font-bold">
                        <div className="h-10"></div>
                        <div className="border-t-2 border-slate-900 w-32"></div>
                        <div className="text-2xs mt-1">{data.print_signature_text}</div>
                    </div>
                </div>
            )}
        </>
    );

    if (data.print_header_all_pages) {
        return (
            <table className="w-full h-full font-sans print-layout-master-table" style={{ borderCollapse: 'collapse', border: 'none' }}>
                <thead>
                    <tr>
                        <td style={{ border: 'none', padding: 0 }}>
                            {headerContent}
                            {billToContent}
                        </td>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={{ border: 'none', padding: 0, verticalAlign: 'top' }}>
                            {mainContent}
                        </td>
                    </tr>
                </tbody>
            </table>
        );
    }

    return (
        <div className="font-sans h-full flex flex-col">
            {headerContent}
            {billToContent}
            {mainContent}
            <div className="text-2xs text-slate-400 font-medium pt-2 text-center mt-auto">
                Powered by{' '}
                <a
                    href="https://venqore.com?utm_source=invoice_footer"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#4f46e5', fontWeight: 'bold' }}
                >
                    VenQore
                </a>
            </div>
        </div>
    );
};



// ----------------------------------------------------------------------
// THERMAL PRINTER THEMES
// ----------------------------------------------------------------------

const ThermalRenderer = (props) => {
    const { data } = props;
    const theme = data.print_theme || 'modern';

    switch (theme) {
        case 'classic': return <ThemeThermalClassic {...props} />;
        case 'bold': return <ThemeThermalBold {...props} />;
        default: return <ThemeThermalModern {...props} />;
    }
};

const ThemeThermalModern = ({ data, items, calculations, themeColor, sale, entityLabel, entityName, showEntity }) => {
    // Dynamic Styles based on settings
    const fontSize = (data.thermal_font_size || 12) + 'px';
    const fontWeight = data.thermal_use_bold ? 'bold' : 'normal';

    // Formatting Helper (Respects Currency Symbol & Decimals)
    const formatAmount = (amount) => {
        return formatCurrency(amount, data);
    };

    // Amount in Words Logic (Simplified for Preview)
    const getAmountInWords = (amount) => {
        if (data.print_amount_words === '0') return null;
        return numberToWords(amount, data.print_amount_words);
    };

    return (
        <div className="font-sans text-black" style={{ fontSize, fontWeight }}>
            {/* Header */}
            <div className="text-center mb-4">
                {data.print_logo && data.print_logo_path && (
                    <img
                        src={data.print_logo_path}
                        alt="Logo"
                        className="w-16 h-16 object-contain mx-auto mb-2 grayscale"
                    />
                )}

                <div className="font-black text-lg mb-1 leading-tight">
                    {data.business_name}
                </div>
                <div className="text-[0.85em]">
                    {data.business_address}
                </div>
                {data.business_phone && (
                    <div className="text-[0.85em]">
                        Tel: {data.business_phone}
                    </div>
                )}
                {data.business_email && (
                    <div className="text-[0.85em]">
                        Email: {data.business_email}
                    </div>
                )}
                {data.tax_number && (
                    <div className="text-[0.85em]">
                        Tax/NTN: {data.tax_number}
                    </div>
                )}
            </div>

            {/* Meta Info */}
            <div className="border-y border-dashed border-black py-2 mb-3 text-[0.85em]">
                <div className="flex justify-between mb-1">
                    <div className="flex flex-col text-left">
                        <span>Date: {new Date().toLocaleDateString()}</span>
                        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex flex-col text-right">
                        <span># {sale ? (sale.invoice_no || sale.invoice_number || sale.reference_number || sale.id) : `${data.sale_prefix}1001`}</span>
                        <span>Cashier: {sale?.user?.name || 'Admin'}</span>
                    </div>
                </div>
                {/* Entity Name */}
                {showEntity && (
                    <div className="border-t border-dashed border-black mt-1 pt-1 font-bold text-center">
                        {entityLabel}: {entityName}
                    </div>
                )}
            </div>

            {data.thermal_show_headers && (
                <div className="flex justify-between text-[0.8em] font-black border-b-2 border-black pb-1 mb-2 uppercase tracking-tight">
                    <span className="flex-1">Item</span>
                    <span className="text-right w-20">
                        {data.print_show_free_qty && items.some(i => i.free_qty > 0) ? 'Qty+Free' : 'Qty'}
                    </span>
                    <span className="text-right w-24">Amt</span>
                </div>
            )}

            {/* Items List */}
            <div className="space-y-3 mb-4">
                {items.map((item, i) => (
                    <div key={i} className="flex flex-col border-b border-black pb-2 last:border-0 last:pb-0">
                        {/* Top Line */}
                        <div className="flex justify-between items-start">
                            <div className="flex-1 pr-1">
                                <span className={data.thermal_use_bold ? 'font-black' : 'font-bold'}>
                                    {data.thermal_show_sno ? `${item.sno}. ` : ''}
                                    {item.name}
                                </span>
                            </div>

                            {/* Column Alignments */}
                            {data.thermal_show_headers ? (
                                <>
                                    <div className="w-12 text-right font-bold text-[0.9em]">
                                        {data.print_show_free_qty && item.free_qty > 0 ? `${item.qty}+${item.free_qty}` : item.qty}
                                    </div>
                                    <div className="w-24 text-right font-bold whitespace-nowrap">
                                        {formatAmount(item.amount)}
                                    </div>
                                </>
                            ) : (
                                <div className="font-bold whitespace-nowrap">{formatAmount(item.amount)}</div>
                            )}
                        </div>

                        {/* Details Line */}
                        <div className="flex flex-wrap gap-x-3 text-[0.85em] mt-0.5">

                            {/* Qty x Rate — show free qty as "1+1" if applicable */}
                            {!data.thermal_show_headers && (
                                <span>
                                    {data.print_show_free_qty && item.free_qty > 0 ? `${item.qty}+${item.free_qty}` : item.qty} {data.thermal_show_units ? 'pc' : ''} x {formatAmount(item.rate)}
                                </span>
                            )}

                            {/* Discount — show % AND amount when percent-based */}
                            {data.print_show_discount && (item.discount_percent > 0 || item.discount_amount > 0) && (
                                <span className="font-bold">
                                    {item.discount_percent > 0
                                        ? `(-${item.discount_percent}% = ${formatAmount(item.discount_amount)})`
                                        : `(-${formatAmount(item.discount_amount)})`
                                    }
                                </span>
                            )}

                            {/* MRP Display */}
                            {data.thermal_show_mrp && item.mrp > 0 && (
                                <span className="line-through decoration-black">
                                    MRP: {formatAmount(item.mrp)}
                                </span>
                            )}
                        </div>

                        {/* Extra Description */}
                        {data.thermal_show_description && item.desc && (
                            <div className="text-[0.8em] italic mt-0.5">
                                {item.desc}
                            </div>
                        )}

                        {/* Batch/Exp Info */}
                        {(data.thermal_show_batch || data.thermal_show_expiry || data.thermal_show_mfg_date || data.thermal_show_size || data.thermal_show_model || data.thermal_show_serial) && (item.batch || item.exp || item.mfg_date || item.size || item.model || item.serial) && (
                            <div className="text-[0.75em] font-mono mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                                {data.thermal_show_batch && item.batch && <span>Batch: {item.batch} </span>}
                                {data.thermal_show_expiry && item.exp && <span>Exp: {item.exp}</span>}
                                {data.thermal_show_mfg_date && item.mfg_date && <span>Mfg: {item.mfg_date}</span>}
                                {data.thermal_show_size && item.size && <span>Size: {item.size}</span>}
                                {data.thermal_show_model && item.model && <span>Model: {item.model}</span>}
                                {data.thermal_show_serial && item.serial && <span>S/N: {item.serial}</span>}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Calculation Section */}
            <div className="p-2 rounded mb-4 border border-black" style={{ fontSize: '1.1em' }}>
                <div className="flex justify-between text-[0.9em] mb-1">
                    <span>Subtotal</span>
                    <span>{formatAmount(calculations.subtotal)}</span>
                </div>

                {data.print_total_quantity && (
                    <div className="flex justify-between text-[0.9em] mb-1">
                        <span>Total Qty</span>
                        <span>{calculations.qty}</span>
                    </div>
                )}

                {/* Tax Details */}
                {data.print_tax_details && calculations.gst > 0 && (
                    <div className="flex justify-between text-[0.9em] mb-1">
                        <span>Tax Amount</span>
                        <span>{formatAmount(calculations.gst)}</span>
                    </div>
                )}

                {calculations.invoiceDiscount > 0 && (
                    <div className="flex justify-between text-[0.9em] mb-1 text-red-600 font-bold">
                        <span>Discount</span>
                        <span>-{formatAmount(calculations.invoiceDiscount)}</span>
                    </div>
                )}

                {data.print_show_delivery_charge !== false && calculations.delivery_charge > 0 && (
                    <div className="flex justify-between text-[0.9em] mb-1">
                        <span>Delivery Charges</span>
                        <span>{formatAmount(calculations.delivery_charge)}</span>
                    </div>
                )}

                {data.print_show_extra_charge !== false && getExtraChargesList(calculations).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[0.9em] mb-1">
                        <span>{item.label}</span>
                        <span>{formatAmount(item.value)}</span>
                    </div>
                ))}

                <div className="flex justify-between font-black mt-2 pt-2 border-t border-black">
                    <span>TOTAL</span>
                    <span>{formatAmount(calculations.total)}</span>
                </div>
                {data.print_received_amount && (
                    <div className="flex justify-between text-[0.8em] mt-1">
                        <span>Received</span>
                        <span>{formatAmount(calculations.paid)}</span>
                    </div>
                )}
                {data.print_balance_amount && (
                    <div className="flex justify-between text-[0.8em] font-bold">
                        <span>Balance Due</span>
                        <span>{formatAmount(calculations.balance)}</span>
                    </div>
                )}
                {data.print_show_previous_balance && (
                    <>
                        <div className="flex justify-between text-[0.8em] text-slate-500">
                            <span>Prev Balance</span>
                            <span>{formatAmount(calculations.prev_balance)}</span>
                        </div>
                        <div className="flex justify-between text-[0.85em] font-black border-t border-dashed border-black pt-1">
                            <span>Net Balance</span>
                            <span>{formatAmount(calculations.net_balance)}</span>
                        </div>
                    </>
                )}
                {(data.print_party_balance && !data.print_show_previous_balance) && (
                    <div className="flex justify-between text-[0.8em] text-slate-500">
                        <span>Party Balance</span>
                        <span>{formatAmount(calculations.net_balance)}</span>
                    </div>
                )}

                {data.print_you_saved && calculations.discount > 0 && (
                    <div className="flex justify-between text-[1em] mt-2 pt-2 border-t border-dashed border-black font-black">
                        <span>You Saved</span>
                        <span>{formatAmount(calculations.discount)}</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="text-center space-y-3">
                {/* Amount in Words */}
                {data.print_amount_words !== '0' && (
                    <div className="text-[0.8em] font-bold italic border-b border-black pb-2">
                        "{getAmountInWords(calculations.total)}"
                    </div>
                )}

                {/* Terms and Custom Message */}
                {(data.print_description !== false && data.print_description !== '0' && data.print_description !== 0) && (
                    <div className="text-[0.85em] italic whitespace-pre-wrap leading-tight opacity-90">
                        {data.print_terms || ''}
                        {data.thermal_custom_footer && <div className="mt-2 font-bold">{data.thermal_custom_footer}</div>}
                        {!data.print_terms && !data.thermal_custom_footer && '*** THANK YOU ***\nSee you again!'}
                    </div>
                )}

                <div className="text-[0.75em] opacity-60 mt-2">
                    Powered by{' '}
                    <a href="https://venqore.com?utm_source=invoice_footer" target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5', fontWeight: 'bold' }}>VenQore</a>
                </div>

                {/* Received / Delivered / Acknowledgement / Payment Mode */}
                {(data.print_received_by || data.print_delivered_by || data.print_acknowledgement || data.print_payment_mode) && (
                    <div className="flex flex-col items-center text-[0.85em] gap-1 border-t border-dashed border-black pt-2 mt-2">
                        {data.print_payment_mode && (
                            <div>
                                <span className="font-bold">Payment: </span>
                                <span>{sale ? (sale.payment_method || 'Cash').toUpperCase() : 'CASH'}</span>
                            </div>
                        )}
                        <div className="flex flex-col gap-2 w-full mt-1">
                            {data.print_received_by && (
                                <div className="flex justify-between">
                                    <span>Received By:</span>
                                    <span>_________________</span>
                                </div>
                            )}
                            {data.print_delivered_by && (
                                <div className="flex justify-between">
                                    <span>Delivered By:</span>
                                    <span>_________________</span>
                                </div>
                            )}
                            {data.print_acknowledgement && (
                                <div className="flex justify-between">
                                    <span>Customer Sign:</span>
                                    <span>_________________</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Signature */}
                {data.print_signature_text && (
                    <div className="flex flex-col items-center mt-4 pt-4">
                        <div className="border-t border-black w-32 mb-1"></div>
                        <div className="text-[0.75em] font-bold">{data.print_signature_text}</div>
                    </div>
                )}

                {(data.thermal_show_barcode === true || data.thermal_show_barcode === 1 || (data.thermal_show_barcode !== false && data.thermal_show_barcode !== '0' && data.thermal_show_barcode !== 0)) && (
                    <div className="flex flex-col items-center mt-2">
                        <div className="h-10 w-2/3 mx-auto" style={{
                            backgroundImage: `repeating-linear-gradient(90deg, 
                                #000 0px, #000 2px, 
                                transparent 2px, transparent 4px,
                                #000 4px, #000 8px,
                                transparent 8px, transparent 10px)`
                        }}></div>
                        <div className="text-[0.6em] font-mono mt-1 tracking-widest opacity-70">
                            *{sale ? (sale.invoice_no || sale.invoice_number || sale.reference_number || sale.id) : `${data.sale_prefix}1001`}*
                        </div>
                    </div>
                )}

                {/* Extra Feed Lines */}
                {(parseInt(data.thermal_extra_lines ?? data.print_feed_lines) > 0) && (
                    <div style={{ height: (parseInt(data.thermal_extra_lines ?? data.print_feed_lines) * 12) + 'px' }}></div>
                )}
            </div>
        </div>
    );
};

const ThemeThermalClassic = ({ data, items, calculations, themeColor, sale, entityLabel, entityName, showEntity }) => {
    // Formatting Helpers
    const formatAmount = (amount) => {
        return formatCurrency(amount, data);
    };

    const getAmountInWords = (amount) => {
        if (data.print_amount_words === '0') return null;
        return numberToWords(amount, data.print_amount_words);
    };

    return (
        <div className="font-mono text-xs text-black">
            {/* Header */}
            <div className="text-center mb-3 border-b-2 border-black border-dashed pb-2">
                {data.print_logo && data.print_logo_path && (
                    <img
                        src={data.print_logo_path}
                        alt="Logo"
                        className="w-12 h-12 object-contain mx-auto mb-2 grayscale"
                    />
                )}
                <div className="font-bold text-lg uppercase">{data.business_name}</div>
                <div className="whitespace-pre-wrap">{data.business_address}</div>
                {data.business_phone && <div>Tel: {data.business_phone}</div>}
                {data.business_email && <div>Email: {data.business_email}</div>}
                {data.tax_number && <div>Tax/NTN: {data.tax_number}</div>}
            </div>

            {/* Meta Info */}
            <div className="mb-2 pb-2 border-b border-black border-dashed">
                <div className="flex justify-between">
                    <span>DT: {sale ? (new Date(sale.created_at || sale.date).toLocaleDateString()) : new Date().toLocaleDateString()}</span>
                    <span>TM: {sale ? (new Date(sale.created_at || sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                    <span># {sale ? (sale.invoice_no || sale.invoice_number || sale.reference_number || sale.id) : `${data.sale_prefix}1001`}</span>
                    <span>OP: {sale?.user?.name || 'Admin'}</span>
                </div>
                {/* Entity */}
                {showEntity && (
                    <div className="mt-1 text-center font-bold uppercase">
                        {entityLabel.substr(0, 4)}: {entityName}
                    </div>
                )}
            </div>

            {/* Columns Header */}
            {data.thermal_show_headers && (
                <div className="flex justify-between font-bold border-b border-black border-dashed pb-1 mb-2">
                    <span className="flex-1">ITEM</span>
                    <span className="text-right w-16">
                        {data.print_show_free_qty && items.some(i => i.free_qty > 0) ? 'QTY+FREE' : 'QTY'}
                    </span>
                    <span className="text-right w-20">AMT</span>
                </div>
            )}

            {/* Items */}
            <div className="mb-2">
                {items.map((item, i) => (
                    <div key={i} className="mb-2">
                        {/* Top Line */}
                        <div className="flex justify-between items-start">
                            <div className="flex-1 pr-1 font-bold">
                                {data.thermal_show_sno ? `${item.sno}. ` : ''}
                                {item.name.toUpperCase()}
                            </div>

                            {data.thermal_show_headers ? (
                                <>
                                    <div className="w-10 text-right">{item.qty}</div>
                                    <div className="w-20 text-right">{formatAmount(item.amount)}</div>
                                </>
                            ) : (
                                <div>{formatAmount(item.amount)}</div>
                            )}
                        </div>

                        {/* Details */}
                        <div className="flex flex-wrap gap-x-2 text-[0.9em]">
                            {!data.thermal_show_headers && (
                                <span>{data.print_show_free_qty && item.free_qty > 0 ? `${item.qty}+${item.free_qty}` : item.qty} {data.thermal_show_units ? 'pc' : ''} x {formatAmount(item.rate)}</span>
                            )}

                            {data.print_show_discount && (item.discount_percent > 0 || item.discount_amount > 0) && (
                                <span>
                                    {item.discount_percent > 0
                                        ? `(Disc: -${item.discount_percent}% = ${formatAmount(item.discount_amount)})`
                                        : `(Disc: -${formatAmount(item.discount_amount)})`
                                    }
                                </span>
                            )}
                        </div>

                        {data.thermal_show_mrp && item.mrp > 0 && (
                            <div className="line-through">MRP: {formatAmount(item.mrp)}</div>
                        )}
                        {data.thermal_show_description && item.desc && (
                            <div className="italic">{item.desc}</div>
                        )}
                        {(data.thermal_show_batch || data.thermal_show_expiry || data.thermal_show_mfg_date || data.thermal_show_size || data.thermal_show_model || data.thermal_show_serial) && (item.batch || item.exp || item.mfg_date || item.size || item.model || item.serial) && (
                            <div className="text-[0.9em]">
                                {data.thermal_show_batch && item.batch && <span>BATCH: {item.batch} </span>}
                                {data.thermal_show_expiry && item.exp && <span>EXP: {item.exp} </span>}
                                {data.thermal_show_mfg_date && item.mfg_date && <span>MFG: {item.mfg_date} </span>}
                                {data.thermal_show_size && item.size && <span>SIZE: {item.size} </span>}
                                {data.thermal_show_model && item.model && <span>MODEL: {item.model} </span>}
                                {data.thermal_show_serial && item.serial && <span>S/N: {item.serial}</span>}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Calculations */}
            <div className="border-t-2 border-black border-dashed pt-2 mb-2">
                <div className="flex justify-between">
                    <span>SUBTOTAL</span>
                    <span>{formatAmount(calculations.subtotal)}</span>
                </div>
                {data.print_total_quantity && (
                    <div className="flex justify-between">
                        <span>TTL QTY</span>
                        <span>{calculations.qty}</span>
                    </div>
                )}
                {data.print_tax_details && calculations.gst > 0 && (
                    <div className="flex justify-between">
                        <span>TAX</span>
                        <span>{formatAmount(calculations.gst)}</span>
                    </div>
                )}

                {calculations.invoiceDiscount > 0 && (
                    <div className="flex justify-between text-red-600 font-bold">
                        <span>DISCOUNT</span>
                        <span>-{formatAmount(calculations.invoiceDiscount)}</span>
                    </div>
                )}

                {data.print_show_delivery_charge !== false && calculations.delivery_charge > 0 && (
                    <div className="flex justify-between">
                        <span>DELIVERY</span>
                        <span>{formatAmount(calculations.delivery_charge)}</span>
                    </div>
                )}

                {data.print_show_extra_charge !== false && getExtraChargesList(calculations).map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                        <span>{String(item.label || 'EXTRA').toUpperCase()}</span>
                        <span>{formatAmount(item.value)}</span>
                    </div>
                ))}

                <div className="flex justify-between font-bold text-sm mt-1 pt-1 border-t border-black border-dashed">
                    <span>NET TOTAL</span>
                    <span>{formatAmount(calculations.total)}</span>
                </div>

                {data.print_received_amount && (
                    <div className="flex justify-between">
                        <span>PAID</span>
                        <span>{formatAmount(calculations.paid)}</span>
                    </div>
                )}
                {data.print_balance_amount && (
                    <div className="flex justify-between font-bold">
                        <span>BALANCE DUE</span>
                        <span>{formatAmount(calculations.balance)}</span>
                    </div>
                )}
                {data.print_show_previous_balance && (
                    <>
                        <div className="flex justify-between text-slate-500">
                            <span>PREV BALANCE</span>
                            <span>{formatAmount(calculations.prev_balance)}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t border-black border-dashed pt-1">
                            <span>NET BALANCE</span>
                            <span>{formatAmount(calculations.net_balance)}</span>
                        </div>
                    </>
                )}
                {(data.print_party_balance && !data.print_show_previous_balance) && (
                    <div className="flex justify-between text-slate-500">
                        <span>PARTY BALANCE</span>
                        <span>{formatAmount(calculations.net_balance)}</span>
                    </div>
                )}

                {data.print_you_saved && calculations.discount > 0 && (
                    <div className="flex justify-between mt-1 pt-1 border-t border-black border-dashed font-bold">
                        <span>YOU SAVED</span>
                        <span>{formatAmount(calculations.discount)}</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="text-center">
                {data.print_amount_words !== '0' && (
                    <div className="mb-2 italic uppercase border-b border-black border-dashed pb-1">
                        {getAmountInWords(calculations.total)}
                    </div>
                )}

                {(data.print_description !== false && data.print_description !== '0' && data.print_description !== 0) && (
                    <div className="whitespace-pre-wrap mb-2">
                        {data.print_terms || ''}
                        {data.thermal_custom_footer && <div className="mt-1 font-bold">{data.thermal_custom_footer}</div>}
                        {!data.print_terms && !data.thermal_custom_footer && '*** THANK YOU ***'}
                    </div>
                )}

                <div className="text-[0.75em] opacity-60 mt-1">
                    Powered by{' '}
                    <a href="https://venqore.com?utm_source=invoice_footer" target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5', fontWeight: 'bold' }}>VenQore</a>
                </div>

                {/* Received / Delivered / Acknowledgement / Payment Mode */}
                {(data.print_received_by || data.print_delivered_by || data.print_acknowledgement || data.print_payment_mode) && (
                    <div className="flex flex-col text-[0.9em] gap-1 border-t border-black border-dashed pt-2 mt-2">
                        {data.print_payment_mode && (
                            <div className="font-bold">
                                <span>PAYMENT: </span>
                                <span>{sale ? (sale.payment_method || 'Cash').toUpperCase() : 'CASH'}</span>
                            </div>
                        )}
                        <div className="flex flex-col gap-2 w-full mt-1">
                            {data.print_received_by && (
                                <div className="flex justify-between">
                                    <span>RECEIVED BY:</span>
                                    <span>_________________</span>
                                </div>
                            )}
                            {data.print_delivered_by && (
                                <div className="flex justify-between">
                                    <span>DELIVERED BY:</span>
                                    <span>_________________</span>
                                </div>
                            )}
                            {data.print_acknowledgement && (
                                <div className="flex justify-between">
                                    <span>CUST SIGN:</span>
                                    <span>_________________</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {data.print_signature_text && (
                    <div className="mt-4 pt-4">
                        <div className="border-t border-black w-32 mx-auto mb-1"></div>
                        <div>{data.print_signature_text}</div>
                    </div>
                )}

                {(data.thermal_show_barcode === true || data.thermal_show_barcode === 1 || (data.thermal_show_barcode !== false && data.thermal_show_barcode !== '0' && data.thermal_show_barcode !== 0)) && (
                    <div className="flex flex-col items-center mt-2">
                        <div className="mt-2 h-8 w-2/3 mx-auto opacity-70" style={{
                            backgroundImage: `repeating-linear-gradient(90deg, 
                                #000 0px, #000 1px, 
                                transparent 1px, transparent 2px,
                                #000 2px, #000 4px,
                                transparent 4px, transparent 5px)`
                        }}></div>
                        <div className="text-[0.6em] font-mono mt-1 tracking-widest opacity-50 uppercase">
                            *{sale ? (sale.invoice_no || sale.invoice_number || sale.reference_number || sale.id) : `${data.sale_prefix}1001`}*
                        </div>
                    </div>
                )}

                {/* Extra Feed Lines */}
                {(parseInt(data.thermal_extra_lines ?? data.print_feed_lines) > 0) && (
                    <div style={{ height: (parseInt(data.thermal_extra_lines ?? data.print_feed_lines) * 12) + 'px' }}></div>
                )}
            </div>
        </div>
    );
};

const ThemeThermalBold = ({ data, items, calculations, themeColor, sale, entityLabel, entityName, showEntity }) => {
    // Formatting Helpers
    const formatAmount = (amount) => {
        return formatCurrency(amount, data);
    };

    const getAmountInWords = (amount) => {
        if (data.print_amount_words === '0') return null;
        return numberToWords(amount, data.print_amount_words);
    };

    return (
        <div className="font-sans text-sm font-bold border-2 border-black p-1 text-black">
            {/* Header */}
            <div className="bg-black text-white p-3 text-center mb-4">
                {data.print_logo && data.print_logo_path && (
                    <img
                        src={data.print_logo_path}
                        alt="Logo"
                        className="w-12 h-12 object-contain mx-auto mb-2 invert brightness-200"
                    />
                )}
                <div className="text-xl uppercase tracking-wider">{data.business_name}</div>
                <div className="text-xs font-normal opacity-90">{data.business_address}</div>
                {data.business_phone && <div className="text-xs font-normal opacity-90">{data.business_phone}</div>}
                {data.business_email && <div className="text-xs font-normal opacity-90">{data.business_email}</div>}
                {data.tax_number && <div className="text-xs font-normal opacity-90">Tax/NTN: {data.tax_number}</div>}
            </div>

            {/* Meta */}
            <div className="flex justify-between text-xs mb-4 px-1 border-b-4 border-black pb-2">
                <div>
                    <div>DATE: {sale ? (new Date(sale.created_at || sale.date).toLocaleDateString()) : new Date().toLocaleDateString()}</div>
                    <div>BILL #: {sale ? (sale.invoice_no || sale.invoice_number || sale.reference_number || sale.id) : `${data.sale_prefix}1001`}</div>
                </div>
                <div className="text-right">
                    <div>TIME: {sale ? (new Date(sale.created_at || sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    {showEntity && <div>{entityLabel.substr(0, 4).toUpperCase()}: {entityName.toUpperCase()}</div>}
                </div>
            </div>

            {/* Columns Header */}
            {data.thermal_show_headers && (
                <div className="flex justify-between bg-black text-white p-1 mb-2 text-xs">
                    <span className="flex-1 pl-1">ITEM Description</span>
                    <span className="text-center w-16">
                        {data.print_show_free_qty && items.some(i => i.free_qty > 0) ? 'QTY+FREE' : 'QTY'}
                    </span>
                    <span className="text-right w-24 pr-1">AMOUNT</span>
                </div>
            )}

            {/* Items */}
            <div className="space-y-3 mb-6 px-1">
                {items.map((item, i) => (
                    <div key={i} className="border-b-2 border-black pb-2">
                        <div className="flex justify-between items-start">
                            <div className="flex-1 pr-1 text-base">
                                {data.thermal_show_sno ? `${item.sno}. ` : ''}
                                {item.name}
                            </div>

                            {data.thermal_show_headers ? (
                                <>
                                    <div className="w-12 text-center text-sm">{item.qty}</div>
                                    <div className="w-24 text-right text-base">{formatAmount(item.amount)}</div>
                                </>
                            ) : (
                                <div className="text-base">{formatAmount(item.amount)}</div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-x-3 text-xs mt-1">
                            {!data.thermal_show_headers ? (
                                <span>{item.qty} {data.thermal_show_units ? 'pc' : ''} x {formatAmount(item.rate)}</span>
                            ) : (
                                <span>Rate: {formatAmount(item.rate)}</span>
                            )}

                            {data.thermal_show_mrp && item.mrp > 0 && (
                                <span className="line-through">MRP: {formatAmount(item.mrp)}</span>
                            )}
                            {data.print_show_discount && (item.discount_percent > 0 || item.discount_amount > 0) && (
                                <span>
                                    {item.discount_percent > 0
                                        ? `Disc: -${item.discount_percent}% (${formatAmount(item.discount_amount)})`
                                        : `Disc: -${formatAmount(item.discount_amount)}`
                                    }
                                </span>
                            )}
                        </div>

                        {(data.thermal_show_batch || data.thermal_show_expiry || data.thermal_show_mfg_date || data.thermal_show_size || data.thermal_show_model || data.thermal_show_serial) && (item.batch || item.exp || item.mfg_date || item.size || item.model || item.serial) && (
                            <div className="text-[0.7em] font-mono mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                                {data.thermal_show_batch && item.batch && <span>BATCH: {item.batch} </span>}
                                {data.thermal_show_expiry && item.exp && <span>EXP: {item.exp} </span>}
                                {data.thermal_show_mfg_date && item.mfg_date && <span>MFG: {item.mfg_date} </span>}
                                {data.thermal_show_size && item.size && <span>SIZE: {item.size} </span>}
                                {data.thermal_show_model && item.model && <span>MODEL: {item.model} </span>}
                                {data.thermal_show_serial && item.serial && <span>S/N: {item.serial}</span>}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Calculations */}
            <div className="text-right px-1 text-sm space-y-1">
                <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatAmount(calculations.subtotal)}</span>
                </div>
                {data.print_total_quantity && (
                    <div className="flex justify-between text-xs">
                        <span>Total Qty:</span>
                        <span>{calculations.qty}</span>
                    </div>
                )}
                {data.print_tax_details && calculations.gst > 0 && (
                    <div className="flex justify-between text-xs">
                        <span>Tax Amount:</span>
                        <span>{formatAmount(calculations.gst)}</span>
                    </div>
                )}
                {calculations.invoiceDiscount > 0 && (
                    <div className="flex justify-between text-xs text-red-600 font-bold">
                        <span>Discount:</span>
                        <span>-{formatAmount(calculations.invoiceDiscount)}</span>
                    </div>
                )}
                {data.print_show_delivery_charge !== false && calculations.delivery_charge > 0 && (
                    <div className="flex justify-between text-xs">
                        <span>Delivery:</span>
                        <span>{formatAmount(calculations.delivery_charge)}</span>
                    </div>
                )}
                {data.print_show_extra_charge !== false && getExtraChargesList(calculations).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                        <span>{item.label}:</span>
                        <span>{formatAmount(item.value)}</span>
                    </div>
                ))}
            </div>

            <div className="bg-black text-white p-2 mt-2 flex justify-between items-center text-lg">
                <span>TOTAL PAYABLE</span>
                <span>{formatAmount(calculations.total)}</span>
            </div>

            <div className="px-1 mt-2 text-right text-xs space-y-0.5">
                {data.print_received_amount && (
                    <div>Received: {formatAmount(calculations.paid)}</div>
                )}
                {data.print_balance_amount && (
                    <div>Balance Due: {formatAmount(calculations.balance)}</div>
                )}
                {data.print_show_previous_balance && (
                    <>
                        <div>Prev Balance: {formatAmount(calculations.prev_balance)}</div>
                        <div className="font-bold border-t border-black pt-1">Net Balance: {formatAmount(calculations.net_balance)}</div>
                    </>
                )}
                {(data.print_party_balance && !data.print_show_previous_balance) && (
                    <div className="font-bold">Party Balance: {formatAmount(calculations.net_balance)}</div>
                )}
                {data.print_you_saved && calculations.discount > 0 && (
                    <div className="mt-1 font-black text-sm">
                        SAVINGS: {formatAmount(calculations.discount)}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="text-center mt-6 px-1">
                {data.print_amount_words !== '0' && (
                    <div className="text-xs italic mb-4 border-b border-black pb-2">
                        {getAmountInWords(calculations.total)}
                    </div>
                )}

                {(data.print_description !== false && data.print_description !== '0' && data.print_description !== 0) && (
                    <div className="text-xs whitespace-pre-wrap">
                        {data.print_terms || ''}
                        {data.thermal_custom_footer && <div className="mt-2 text-base">{data.thermal_custom_footer}</div>}
                        {!data.print_terms && !data.thermal_custom_footer && 'THANK YOU FOR VISITING'}
                    </div>
                )}

                <div className="text-[0.7em] opacity-60 mt-2">
                    Powered by{' '}
                    <a href="https://venqore.com?utm_source=invoice_footer" target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5', fontWeight: 'bold' }}>VenQore</a>
                </div>

                {/* Received / Delivered / Acknowledgement / Payment Mode */}
                {(data.print_received_by || data.print_delivered_by || data.print_acknowledgement || data.print_payment_mode) && (
                    <div className="flex flex-col text-xs font-bold gap-1 border-t-2 border-black pt-2 mt-2">
                        {data.print_payment_mode && (
                            <div>
                                <span>PAYMENT: </span>
                                <span>{sale ? (sale.payment_method || 'Cash').toUpperCase() : 'CASH'}</span>
                            </div>
                        )}
                        <div className="flex flex-col gap-2 w-full mt-1">
                            {data.print_received_by && (
                                <div className="flex justify-between">
                                    <span>RECEIVED BY:</span>
                                    <span>_________________</span>
                                </div>
                            )}
                            {data.print_delivered_by && (
                                <div className="flex justify-between">
                                    <span>DELIVERED BY:</span>
                                    <span>_________________</span>
                                </div>
                            )}
                            {data.print_acknowledgement && (
                                <div className="flex justify-between">
                                    <span>CUSTOMER SIGN:</span>
                                    <span>_________________</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {data.print_signature_text && (
                    <div className="mt-6">
                        <div className="border-t-2 border-black w-24 mx-auto mb-1"></div>
                        <div className="text-xs">{data.print_signature_text}</div>
                    </div>
                )}

                {(data.thermal_show_barcode === true || data.thermal_show_barcode === 1 || (data.thermal_show_barcode !== false && data.thermal_show_barcode !== '0' && data.thermal_show_barcode !== 0)) && (
                    <div className="flex flex-col items-center mt-2">
                        <div className="mt-2 h-8 w-2/3 mx-auto opacity-70" style={{
                            backgroundImage: `repeating-linear-gradient(90deg, 
                                #000 0px, #000 1px, 
                                transparent 1px, transparent 2px,
                                #000 2px, #000 4px,
                                transparent 4px, transparent 5px)`
                        }}></div>
                        <div className="text-[0.6em] font-mono mt-1 tracking-widest opacity-50 uppercase">
                            *{sale ? (sale.invoice_no || sale.invoice_number || sale.reference_number || sale.id) : `${data.sale_prefix}1001`}*
                        </div>
                    </div>
                )}

                {/* Extra Feed Lines */}
                {(parseInt(data.thermal_extra_lines ?? data.print_feed_lines) > 0) && (
                    <div style={{ height: (parseInt(data.thermal_extra_lines ?? data.print_feed_lines) * 12) + 'px' }}></div>
                )}
            </div>
        </div>
    );
};
