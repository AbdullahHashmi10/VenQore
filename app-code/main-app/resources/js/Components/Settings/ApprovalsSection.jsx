import React from 'react';
import { ShieldCheck, Shield, Lock, FileText, CheckCircle2 } from 'lucide-react';
import Toggle from '@/Components/Toggle';
import SectionHeader from '@/Components/SectionHeader';
import { useTermText } from '@/lib/terms';

export default function ApprovalsSection({ data, setData, store }) {
  const tt = useTermText();
  const currencySymbol = store?.currency_symbol || '$';

  const documentTypes = [
    { key: 'customer_receipt', label: 'Customer Receipts' },
    { key: 'supplier_payment', label: 'Supplier Payments' },
    { key: 'operating_expense', label: 'Operating Expenses' },
    { key: 'sales_invoice', label: 'Sales Invoices' },
    { key: 'supplier_refund', label: 'Supplier Refunds' },
    { key: 'purchase_posting', label: 'Purchase Postings' },
    { key: 'sales_return', label: 'Sales Returns' },
    { key: 'purchase_return', label: 'Purchase Returns' },
    { key: 'capital_injection', label: 'Capital Injections' },
    { key: 'owner_drawings', label: 'Owner Drawings' },
    { key: 'fund_transfer', label: 'Fund Transfers' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-slow">
      <div className="bg-surface rounded-2xl border border-line p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-ink">Approvals & Governance</h3>
            <p className="text-sm text-ink-muted">Configure store-wide transaction maker-checker approval controls and dual authorization policies.</p>
          </div>
        </div>

        <div className="space-y-4 pt-2 border-t border-line">
          <Toggle
            enabled={Boolean(data.approval_admin_enabled)}
            onChange={v => setData('approval_admin_enabled', v)}
            label="Enable Store Approval Workflow"
            description="When enabled, transactions requiring approval are routed to the manager review queue before posting to the general ledger."
          />

          <Toggle
            enabled={Boolean(data.approval_strict_owner_separation)}
            onChange={v => setData('approval_strict_owner_separation', v)}
            label="Strict Owner Separation"
            description="Enforce dual control so store owners cannot self-approve transactions they personally submitted as maker."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-line">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-ink-secondary mb-1">Default Employee Approval Mode</label>
              <select
                value={data.approval_default_employee_mode || 'inherit'}
                onChange={e => setData('approval_default_employee_mode', e.target.value)}
                className="w-full px-4 py-3 bg-sunken border border-line rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              >
                <option value="inherit">Inherit Store Policy (Default)</option>
                <option value="required">Always Require Approval</option>
                <option value="direct">Direct Posting (Bypass Approval)</option>
              </select>
              <p className="text-2xs text-ink-muted">Default policy applied to invited staff members unless customized per-user.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-ink-secondary mb-1">Approval Amount Threshold ({currencySymbol})</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={data.approval_amount_threshold ?? '0'}
                onChange={e => setData('approval_amount_threshold', e.target.value)}
                className="w-full px-4 py-3 bg-sunken border border-line rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                placeholder="0.00"
              />
              <p className="text-2xs text-ink-muted">Transactions equal to or above this amount automatically trigger approval review.</p>
            </div>
          </div>

          {/* Per-Document Type Controls */}
          <div className="pt-6 border-t border-line space-y-4">
            <h4 className="text-sm font-bold text-ink uppercase tracking-wider">Per-Document Approval Policies & Overrides</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documentTypes.map(({ key, label }) => {
                const policyKey = `approval_policy_${key}`;
                const thresholdKey = `approval_threshold_${key}`;

                return (
                  <div key={key} className="p-4 bg-sunken/50 rounded-xl border border-line space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-ink">{label}</span>
                      <select
                        value={data[policyKey] || 'inherit'}
                        onChange={e => setData(policyKey, e.target.value)}
                        className="px-3 py-1.5 bg-surface text-ink border border-line rounded-lg text-xs font-medium focus:ring-1 focus:ring-brand-500 outline-none"
                      >
                        <option value="inherit">Inherit Policy</option>
                        <option value="required">Always Required</option>
                        <option value="disabled">Disabled (Direct)</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-ink-muted whitespace-nowrap">Threshold ({currencySymbol}):</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={data[thresholdKey] ?? ''}
                        onChange={e => setData(thresholdKey, e.target.value)}
                        placeholder="Inherit store threshold"
                        className="w-full px-3 py-1.5 bg-surface text-ink placeholder:text-ink-faint border border-line rounded-lg text-xs focus:ring-1 focus:ring-brand-500 outline-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
