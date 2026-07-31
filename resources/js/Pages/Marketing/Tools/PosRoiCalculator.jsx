import React, { useState, useMemo } from 'react';
import { Calculator, TrendingUp, DollarSign, Clock, AlertTriangle, ShieldCheck, Download, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import ToolShell from './Shared/ToolShell';
import Select from './Shared/Select';

const CURRENCIES = {
    USD: '$', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'AU$',
    PKR: 'Rs', INR: '₹', AED: 'AED', SAR: 'SAR', JPY: '¥',
};

const FAQS = [
    {
        q: "How do I calculate ROI on a POS system?",
        a: "Add up what the new system actually saves you each month — typically reduced inventory shrinkage/leakage from better stock tracking, plus staff or owner hours saved on manual checkout, stock counting, and reconciliation — then subtract the software subscription fee. Divide your upfront hardware/setup cost by that net monthly benefit to get your payback period in months."
    },
    {
        q: "What hidden costs does a POS system eliminate?",
        a: "The two biggest eliminated costs are inventory shrinkage (theft, spoilage, vendor short-ships, and unrecorded cashier mistakes) and wasted labor hours spent manually reconciling registers, taking physical stock counts with pencil and paper, and building spreadsheets."
    },
    {
        q: "How long does it take a POS system to pay for itself?",
        a: "Most retail and food businesses recover their hardware and software investment within 2 to 6 months. High-volume businesses with high inventory shrinkage often achieve full hardware payback in under 60 days."
    },
    {
        q: "Is this calculator biased toward showing a positive result?",
        a: "No — it is built with fully transparent, editable formulas. If your monthly revenue or staff hourly rate is set low, or your hardware cost is set high, the calculator will accurately show a negative ROI or a longer payback period."
    },
    {
        q: "Is this calculator free?",
        a: "Yes. Every calculation runs 100% in your browser. No registration, no email address, and no server roundtrips required."
    }
];

function fmtMoney(amount, sym) {
    if (!Number.isFinite(amount)) return `${sym}0.00`;
    const isNeg = amount < 0;
    const absVal = Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return isNeg ? `-${sym}${absVal}` : `${sym}${absVal}`;
}

export default function PosRoiCalculator({ toolGroups = [] }) {
    const [currency, setCurrency] = useState('USD');
    const sym = CURRENCIES[currency] || '$';

    // Inputs
    const [monthlyRevenue, setMonthlyRevenue] = useState('45000');
    const [checkoutHoursPerWeek, setCheckoutHoursPerWeek] = useState('25');
    const [stockCountHoursPerMonth, setStockCountHoursPerMonth] = useState('16');
    const [hourlyStaffRate, setHourlyStaffRate] = useState('18');
    const [hardwareCost, setHardwareCost] = useState('1200');
    const [softwareSubMonthly, setSoftwareSubMonthly] = useState('79');
    const [shrinkageRatePercent, setShrinkageRatePercent] = useState('2.5');
    const [shrinkageReductionPercent, setShrinkageReductionPercent] = useState('45');
    const [timeSavingsPercent, setTimeSavingsPercent] = useState('35');

    const numRev = parseFloat(monthlyRevenue) || 0;
    const numCheckoutHrs = parseFloat(checkoutHoursPerWeek) || 0;
    const numStockHrs = parseFloat(stockCountHoursPerMonth) || 0;
    const numHourlyRate = parseFloat(hourlyStaffRate) || 0;
    const numHwCost = parseFloat(hardwareCost) || 0;
    const numSwSub = parseFloat(softwareSubMonthly) || 0;
    const numShrinkPct = parseFloat(shrinkageRatePercent) || 0;
    const numShrinkRedPct = parseFloat(shrinkageReductionPercent) || 0;
    const numTimeSavePct = parseFloat(timeSavingsPercent) || 0;

    const metrics = useMemo(() => {
        // Monthly staff hours spent on manual ops
        const monthlyCheckoutHrs = numCheckoutHrs * 4.3333;
        const totalMonthlyManualHrs = monthlyCheckoutHrs + numStockHrs;

        // Monthly labor time saved (hrs & $ value)
        const monthlyHrsSaved = totalMonthlyManualHrs * (numTimeSavePct / 100);
        const monthlyLaborSavings = monthlyHrsSaved * numHourlyRate;

        // Stock shrinkage / leakage calculation
        const currentMonthlyShrinkage = numRev * (numShrinkPct / 100);
        const monthlyShrinkageSavings = currentMonthlyShrinkage * (numShrinkRedPct / 100);

        // Gross monthly savings vs Net monthly savings
        const grossMonthlySavings = monthlyLaborSavings + monthlyShrinkageSavings;
        const netMonthlySavings = grossMonthlySavings - numSwSub;

        // Payback Period on Hardware (Months)
        let paybackMonths = null;
        if (numHwCost <= 0) {
            paybackMonths = 0;
        } else if (netMonthlySavings > 0) {
            paybackMonths = numHwCost / netMonthlySavings;
        }

        // 1-Year (12 Months) Net ROI ($ & %)
        const totalInvestmentY1 = numHwCost + (numSwSub * 12);
        const grossSavingsY1 = grossMonthlySavings * 12;
        const netSavingsY1 = grossSavingsY1 - totalInvestmentY1;
        const roiPercentY1 = totalInvestmentY1 > 0 ? (netSavingsY1 / totalInvestmentY1) * 100 : 0;

        // 3-Year Total Net Savings ($)
        const totalInvestmentY3 = numHwCost + (numSwSub * 36);
        const grossSavingsY3 = grossMonthlySavings * 36;
        const netSavingsY3 = grossSavingsY3 - totalInvestmentY3;
        const roiPercentY3 = totalInvestmentY3 > 0 ? (netSavingsY3 / totalInvestmentY3) * 100 : 0;

        return {
            totalMonthlyManualHrs,
            monthlyHrsSaved,
            monthlyLaborSavings,
            currentMonthlyShrinkage,
            monthlyShrinkageSavings,
            grossMonthlySavings,
            netMonthlySavings,
            paybackMonths,
            totalInvestmentY1,
            netSavingsY1,
            roiPercentY1,
            totalInvestmentY3,
            netSavingsY3,
            roiPercentY3,
        };
    }, [numRev, numCheckoutHrs, numStockHrs, numHourlyRate, numHwCost, numSwSub, numShrinkPct, numShrinkRedPct, numTimeSavePct]);

    // Export CSV Summary
    const handleDownloadCsv = () => {
        const rows = [
            ['Metric', 'Value'],
            ['Currency', currency],
            ['Monthly Revenue', `${sym}${numRev}`],
            ['Checkout & Register Hours / Week', numCheckoutHrs],
            ['Stock Count & Admin Hours / Month', numStockHrs],
            ['Hourly Staff / Owner Rate', `${sym}${numHourlyRate}`],
            ['Hardware & Setup Upfront Cost', `${sym}${numHwCost}`],
            ['Monthly Software Fee', `${sym}${numSwSub}`],
            ['Estimated Stock Shrinkage %', `${numShrinkPct}%`],
            ['Estimated Shrinkage Reduction %', `${numShrinkRedPct}%`],
            ['Estimated Time Savings %', `${numTimeSavePct}%`],
            ['--- OUTPUTS ---', '---'],
            ['Monthly Time Saved (Hours)', metrics.monthlyHrsSaved.toFixed(1)],
            ['Monthly Labor Savings ($)', metrics.monthlyLaborSavings.toFixed(2)],
            ['Monthly Stock Leakage Saved ($)', metrics.monthlyShrinkageSavings.toFixed(2)],
            ['Gross Monthly Savings ($)', metrics.grossMonthlySavings.toFixed(2)],
            ['Net Monthly Savings ($)', metrics.netMonthlySavings.toFixed(2)],
            ['Hardware Payback Period (Months)', metrics.paybackMonths === null ? 'Never' : metrics.paybackMonths.toFixed(1)],
            ['1-Year Net ROI ($)', metrics.netSavingsY1.toFixed(2)],
            ['1-Year Net ROI (%)', `${metrics.roiPercentY1.toFixed(1)}%`],
            ['3-Year Total Savings ($)', metrics.netSavingsY3.toFixed(2)],
            ['3-Year Net ROI (%)', `${metrics.roiPercentY3.toFixed(1)}%`],
        ];

        const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `POS_ROI_Summary_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Print / Save PDF
    const handleDownloadPdf = () => {
        window.print();
    };

    return (
        <ToolShell
            title="POS ROI & Payback Period Calculator"
            subtitle="Calculate how quickly a smart Point-of-Sale system pays for itself through labor efficiency and stock leakage reduction."
            slug="pos-roi-calculator"
            groupKey="calculators"
            toolGroups={toolGroups}
            faqs={FAQS}
        >
            <div className="space-y-8">
                {/* Header Controls */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                            <Calculator className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">POS ROI & Payback Calculator</h2>
                            <p className="text-sm text-slate-400">Interactive financial modeling for retail & food businesses</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Currency</label>
                        <Select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            options={Object.keys(CURRENCIES).map((c) => ({ value: c, label: `${c} (${CURRENCIES[c]})` }))}
                            className="w-36 bg-slate-800 border-slate-700 text-white rounded-lg text-sm"
                        />
                    </div>
                </div>

                {/* Main Content Grid: Inputs vs Outputs */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Input Controls Panel (5 cols) */}
                    <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                        <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-emerald-400" /> Business Inputs
                        </h3>

                        {/* Monthly Revenue */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                Average Monthly Revenue ({sym})
                            </label>
                            <input
                                type="number"
                                value={monthlyRevenue}
                                onChange={(e) => setMonthlyRevenue(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                                placeholder="45000"
                            />
                        </div>

                        {/* Hours spent on checkout */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                Manual Checkout & Register Hours / Week
                            </label>
                            <input
                                type="number"
                                value={checkoutHoursPerWeek}
                                onChange={(e) => setCheckoutHoursPerWeek(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                                placeholder="25"
                            />
                        </div>

                        {/* Hours spent on stock counting & admin */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                Stock Count & Admin Hours / Month
                            </label>
                            <input
                                type="number"
                                value={stockCountHoursPerMonth}
                                onChange={(e) => setStockCountHoursPerMonth(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                                placeholder="16"
                            />
                        </div>

                        {/* Hourly Staff / Owner Rate */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                Hourly Labor Cost / Owner Rate ({sym})
                            </label>
                            <input
                                type="number"
                                value={hourlyStaffRate}
                                onChange={(e) => setHourlyStaffRate(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                                placeholder="18"
                            />
                        </div>

                        {/* Hardware & Setup Cost */}
                        <div className="pt-2 border-t border-slate-800">
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                One-Time Hardware & Setup Cost ({sym})
                            </label>
                            <input
                                type="number"
                                value={hardwareCost}
                                onChange={(e) => setHardwareCost(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                                placeholder="1200"
                            />
                        </div>

                        {/* Software Sub Fee */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                Monthly POS Software Subscription ({sym})
                            </label>
                            <input
                                type="number"
                                value={softwareSubMonthly}
                                onChange={(e) => setSoftwareSubMonthly(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                                placeholder="79"
                            />
                        </div>

                        {/* Stock Shrinkage % */}
                        <div className="pt-2 border-t border-slate-800">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-sm font-medium text-slate-300">
                                    Current Estimated Shrinkage / Loss %
                                </label>
                                <span className="text-xs font-semibold text-amber-400">{numShrinkPct}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="10"
                                step="0.1"
                                value={shrinkageRatePercent}
                                onChange={(e) => setShrinkageRatePercent(e.target.value)}
                                className="w-full accent-emerald-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
                            />
                            <p className="text-xs text-slate-500 mt-1">Retail average: 1.5% - 3.5% of gross revenue</p>
                        </div>

                        {/* Shrinkage Reduction % */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-sm font-medium text-slate-300">
                                    Expected Shrinkage Reduction %
                                </label>
                                <span className="text-xs font-semibold text-emerald-400">{numShrinkRedPct}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="80"
                                step="5"
                                value={shrinkageReductionPercent}
                                onChange={(e) => setShrinkageReductionPercent(e.target.value)}
                                className="w-full accent-emerald-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
                            />
                        </div>

                        {/* Time Savings % */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-sm font-medium text-slate-300">
                                    Expected Staff Time Saved %
                                </label>
                                <span className="text-xs font-semibold text-emerald-400">{numTimeSavePct}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="70"
                                step="5"
                                value={timeSavingsPercent}
                                onChange={(e) => setTimeSavingsPercent(e.target.value)}
                                className="w-full accent-emerald-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Output Cards & Breakdown Panel (7 cols) */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* Summary KPI Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Payback Period Card */}
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Hardware Payback</span>
                                    <Clock className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div className="text-3xl font-extrabold text-white">
                                    {metrics.paybackMonths === null ? (
                                        <span className="text-rose-400">No Breakeven</span>
                                    ) : (
                                        <span>{metrics.paybackMonths.toFixed(1)} <span className="text-lg font-normal text-slate-400">Months</span></span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 mt-2">
                                    {metrics.paybackMonths !== null && metrics.paybackMonths <= 6 ? (
                                        <span className="text-emerald-400 font-medium">★ Exceptional payback period</span>
                                    ) : (
                                        'Time required to recover upfront hardware'
                                    )}
                                </p>
                            </div>

                            {/* Monthly Time Saved Card */}
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Monthly Time Saved</span>
                                    <ShieldCheck className="w-5 h-5 text-sky-400" />
                                </div>
                                <div className="text-3xl font-extrabold text-white">
                                    {metrics.monthlyHrsSaved.toFixed(1)} <span className="text-lg font-normal text-slate-400">hrs/mo</span>
                                </div>
                                <p className="text-xs text-emerald-400 font-medium mt-2">
                                    Valued at {fmtMoney(metrics.monthlyLaborSavings, sym)} / month
                                </p>
                            </div>

                            {/* 1-Year Net ROI */}
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">1-Year Net ROI</span>
                                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div className={`text-3xl font-extrabold ${metrics.netSavingsY1 >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {fmtMoney(metrics.netSavingsY1, sym)}
                                </div>
                                <div className="text-xs font-semibold mt-2 text-slate-300">
                                    {metrics.roiPercentY1 >= 0 ? '+' : ''}{metrics.roiPercentY1.toFixed(1)}% return on investment
                                </div>
                            </div>

                            {/* 3-Year Total Savings */}
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">3-Year Net Profit</span>
                                    <DollarSign className="w-5 h-5 text-amber-400" />
                                </div>
                                <div className={`text-3xl font-extrabold ${metrics.netSavingsY3 >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {fmtMoney(metrics.netSavingsY3, sym)}
                                </div>
                                <div className="text-xs font-semibold mt-2 text-slate-300">
                                    {metrics.roiPercentY3 >= 0 ? '+' : ''}{metrics.roiPercentY3.toFixed(1)}% total 36-month return
                                </div>
                            </div>
                        </div>

                        {/* Detailed Financial Breakdown Card */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                            <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
                                <span>Monthly Savings Breakdown</span>
                                <span className="text-xs font-normal text-slate-400">Calculated per month</span>
                            </h3>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                                    <span className="text-slate-300">Labor Time Savings ({metrics.monthlyHrsSaved.toFixed(1)} hrs @ {sym}{numHourlyRate}/hr)</span>
                                    <span className="font-semibold text-emerald-400">+{fmtMoney(metrics.monthlyLaborSavings, sym)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                                    <span className="text-slate-300">Stock Shrinkage Reduction ({numShrinkRedPct}% of {fmtMoney(metrics.currentMonthlyShrinkage, sym)})</span>
                                    <span className="font-semibold text-emerald-400">+{fmtMoney(metrics.monthlyShrinkageSavings, sym)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                                    <span className="text-slate-200 font-medium">Gross Monthly Financial Gain</span>
                                    <span className="font-bold text-white">{fmtMoney(metrics.grossMonthlySavings, sym)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                                    <span className="text-slate-300">Less POS Software Monthly Subscription</span>
                                    <span className="font-semibold text-rose-400">-{fmtMoney(numSwSub, sym)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 text-base">
                                    <span className="font-bold text-white">Net Monthly Benefit</span>
                                    <span className={`font-extrabold ${metrics.netMonthlySavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {fmtMoney(metrics.netMonthlySavings, sym)} / mo
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action buttons (Download CSV / PDF) */}
                        <div className="flex flex-wrap items-center gap-4 pt-2">
                            <button
                                onClick={handleDownloadCsv}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium px-4 py-3 rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 text-sm"
                            >
                                <Download className="w-4 h-4 text-emerald-400" /> Export CSV Summary
                            </button>
                            <button
                                onClick={handleDownloadPdf}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-900/30"
                            >
                                <FileText className="w-4 h-4" /> Print / Save PDF
                            </button>
                        </div>
                    </div>
                </div>

                {/* Educational ROI Deep Dive Section */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
                    <h3 className="text-2xl font-bold text-white">Understanding Your POS Return on Investment</h3>
                    <p className="text-slate-300 leading-relaxed">
                        A modern Point-of-Sale system is not just an expense — it is an automated operational asset. 
                        While traditional legacy cash registers only record financial totals, an integrated POS like <strong>VenQore</strong> eliminates repetitive labor and protects inventory margins.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 space-y-2">
                            <div className="text-emerald-400 font-bold flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5" /> 1. Stock Leakage Prevention
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                Real-time FIFO batch tracking and barcode verification prevent theft, unrecorded cashier discounts, and undetected supplier shortages.
                            </p>
                        </div>

                        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 space-y-2">
                            <div className="text-emerald-400 font-bold flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5" /> 2. Automated Double-Entry
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                Every checkout auto-posts balanced journal entries and inventory updates. No more late nights re-keying end-of-day register tallies.
                            </p>
                        </div>

                        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 space-y-2">
                            <div className="text-emerald-400 font-bold flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5" /> 3. Offline Resilience
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                Offline-first architecture ensures internet outages never stop checkouts or lost sales during peak business hours.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </ToolShell>
    );
}
