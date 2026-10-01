import React, { useState } from 'react';
import { Printer, Check, X, Download, FileText, ArrowRight, DollarSign, Calendar, Clock, User, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { ZReportPrintService } from '@/Utils/ZReportPrintService';

export default function ZReportModal({
    isOpen,
    onClose,
    zReport,
}) {
    const [printing, setPrinting] = useState(false);
    const [paperWidth, setPaperWidth] = useState('80mm');

    if (!isOpen || !zReport) return null;

    const { store = {}, shift = {}, sales = {}, tenders = {}, cash_reconciliation: recon = {}, movements = [] } = zReport;

    const handlePrint = async () => {
        setPrinting(true);
        try {
            await ZReportPrintService.printZReport(zReport, { paperWidth });
        } catch (err) {
            console.error('Failed to print Z-report:', err);
        } finally {
            setPrinting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl my-auto animate-in fade-in zoom-in duration-200">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 p-5 border-b border-slate-800 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-wide">
                                Official Z-Report (End of Shift)
                            </h2>
                            <p className="text-xs text-slate-400">
                                Shift #{shift.id} • Closed at {shift.closed_at || new Date().toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Printable Preview Body */}
                <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto bg-slate-950/60">
                    {/* Thermal Receipt Style Preview Card */}
                    <div className="bg-white text-slate-900 p-6 rounded-xl shadow-inner font-mono text-xs border border-slate-300 max-w-md mx-auto space-y-3">
                        <div className="text-center border-b border-dashed border-slate-300 pb-3">
                            <h3 className="font-bold text-base tracking-wider uppercase text-slate-950">
                                {store.name || 'VENQORE POS'}
                            </h3>
                            {store.address && <p className="text-[11px] text-slate-600">{store.address}</p>}
                            {store.phone && <p className="text-[11px] text-slate-600">Tel: {store.phone}</p>}
                            {store.tax_number && <p className="text-[11px] text-slate-600">TRN: {store.tax_number}</p>}
                            <div className="mt-2 font-bold text-xs uppercase bg-slate-100 py-1 rounded">
                                *** REGISTER Z-REPORT ***
                            </div>
                        </div>

                        {/* Shift Info */}
                        <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
                            <div className="flex justify-between"><span>Shift ID:</span><span className="font-bold">#{shift.id}</span></div>
                            <div className="flex justify-between"><span>Register:</span><span>{shift.register_id || 'REG-1'}</span></div>
                            <div className="flex justify-between"><span>Cashier:</span><span>{shift.opened_by || '-'}</span></div>
                            <div className="flex justify-between"><span>Closed By:</span><span>{shift.closed_by || '-'}</span></div>
                            <div className="flex justify-between"><span>Opened:</span><span>{shift.opened_at || '-'}</span></div>
                            <div className="flex justify-between"><span>Closed:</span><span>{shift.closed_at || '-'}</span></div>
                        </div>

                        {/* Sales Summary */}
                        <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
                            <div className="font-bold uppercase text-[10px] text-slate-500 mb-1">Sales Breakdown</div>
                            <div className="flex justify-between"><span>Total Invoices:</span><span>{sales.count || 0}</span></div>
                            <div className="flex justify-between"><span>Gross Sales:</span><span>{formatCurrency(sales.gross_sales || 0)}</span></div>
                            <div className="flex justify-between"><span>Total Discounts:</span><span>-{formatCurrency(sales.discounts || 0)}</span></div>
                            <div className="flex justify-between"><span>Net Sales:</span><span>{formatCurrency(sales.net_sales || 0)}</span></div>
                            <div className="flex justify-between"><span>Tax Collected:</span><span>{formatCurrency(sales.tax || 0)}</span></div>
                            {sales.tips > 0 && <div className="flex justify-between"><span>Tips:</span><span>{formatCurrency(sales.tips)}</span></div>}
                            {sales.service_charges > 0 && <div className="flex justify-between"><span>Service Charges:</span><span>{formatCurrency(sales.service_charges)}</span></div>}
                            <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-200 mt-1">
                                <span>TOTAL REVENUE:</span>
                                <span>{formatCurrency(sales.grand_total || 0)}</span>
                            </div>
                        </div>

                        {/* Payment Breakdown */}
                        <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
                            <div className="font-bold uppercase text-[10px] text-slate-500 mb-1">Tenders Breakdown</div>
                            <div className="flex justify-between"><span>Cash:</span><span>{formatCurrency(tenders.cash || 0)}</span></div>
                            <div className="flex justify-between"><span>Card / Digital:</span><span>{formatCurrency(tenders.card || 0)}</span></div>
                            <div className="flex justify-between"><span>Credit (A/R):</span><span>{formatCurrency(tenders.credit || 0)}</span></div>
                            {tenders.other > 0 && <div className="flex justify-between"><span>Other:</span><span>{formatCurrency(tenders.other)}</span></div>}
                        </div>

                        {/* Cash Reconciliation */}
                        <div className="space-y-1 text-[11px]">
                            <div className="font-bold uppercase text-[10px] text-slate-500 mb-1">Cash Drawer Reconciliation</div>
                            <div className="flex justify-between"><span>Opening Float:</span><span>{formatCurrency(recon.opening_float || 0)}</span></div>
                            <div className="flex justify-between"><span>+ Cash Sales:</span><span>{formatCurrency(recon.cash_sales || 0)}</span></div>
                            <div className="flex justify-between"><span>+ Cash In (Pay-ins):</span><span>{formatCurrency(recon.cash_in || 0)}</span></div>
                            <div className="flex justify-between"><span>- Cash Out (Drops/Petty):</span><span>-{formatCurrency(recon.cash_out || 0)}</span></div>
                            <div className="flex justify-between pt-1 border-t border-slate-200">
                                <span>Expected Cash:</span>
                                <span className="font-bold">{formatCurrency(recon.expected_cash || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Actual Counted:</span>
                                <span className="font-bold">{formatCurrency(recon.counted_cash || 0)}</span>
                            </div>
                            <div className={`flex justify-between font-bold text-xs p-1.5 rounded mt-1 ${
                                recon.variance === 0 ? 'bg-emerald-50 text-emerald-800' : recon.variance > 0 ? 'bg-blue-50 text-blue-800' : 'bg-rose-50 text-rose-800'
                            }`}>
                                <span>VARIANCE ({recon.variance_type?.toUpperCase()}):</span>
                                <span>{recon.variance > 0 ? '+' : ''}{formatCurrency(recon.variance || 0)}</span>
                            </div>
                        </div>

                        {shift.notes && (
                            <div className="pt-2 border-t border-dashed border-slate-300 text-[10px] text-slate-600 italic">
                                <span className="font-bold not-italic">Notes: </span>{shift.notes}
                            </div>
                        )}

                        <div className="text-center pt-2 text-[9px] text-slate-400">
                            Printed at {zReport.printed_at || new Date().toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-400 font-medium">Paper Size:</span>
                        <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
                            <button
                                type="button"
                                onClick={() => setPaperWidth('80mm')}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                                    paperWidth === '80mm' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                80mm
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaperWidth('58mm')}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                                    paperWidth === '58mm' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                58mm
                            </button>
                        </div>
                    </div>

                    <div className="flex space-x-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
                        >
                            Done / Close
                        </button>
                        <button
                            type="button"
                            onClick={handlePrint}
                            disabled={printing}
                            className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition disabled:opacity-50"
                        >
                            <Printer className="w-4 h-4" />
                            <span>{printing ? 'Printing...' : 'Print Thermal Z-Report'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
