import React from 'react';
import { Shield, Lock, Users, Key, AlertTriangle, ExternalLink } from 'lucide-react';
import Toggle from '@/Components/Toggle';

export default function SecuritySection({ data, setData }) {
    const isPasscodeActive = data.enable_passcode === '1' || data.enable_passcode === true;
    const isSsoActive = data.sso_enabled === '1' || data.sso_enabled === true;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-slow">
            {/* Security Overview & Admin Passcode */}
            <div className="p-6 bg-surface rounded-2xl border border-line shadow-xs space-y-6">
                <div className="flex items-center gap-3.5 pb-4 border-b border-line">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Shield size={20} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-ink leading-tight">Protect important actions</h3>
                        <p className="text-xs text-ink-muted">Protect sensitive POS cashier operations and terminal sessions</p>
                    </div>
                </div>

                <div className="divide-y divide-line">
                    <Toggle
                        label="Require a manager's passcode"
                        description="Ask for a six-digit code before refunds, cancelled invoices, price changes, and store resets."
                        enabled={isPasscodeActive}
                        onChange={(v) => setData('enable_passcode', v)}
                        icon={Lock}
                    />

                    {/* Passcode Input */}
                    {isPasscodeActive && (
                        <div className="py-4 pl-12 animate-in fade-in slide-in-from-top-2 duration-normal">
                            <div className="p-4 bg-app rounded-xl border border-line space-y-2.5 max-w-md">
                                <label className="block text-2xs font-bold uppercase tracking-wider text-ink-muted">
                                    Admin 6-Digit PIN
                                </label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        maxLength="6"
                                        value={data.admin_passcode || ''}
                                        onChange={(e) => setData('admin_passcode', e.target.value.replace(/\D/g, ''))}
                                        className="w-full pl-4 pr-10 py-2.5 bg-surface border border-line rounded-xl text-lg font-bold tracking-[0.4em] focus:ring-2 focus:ring-brand-500 text-ink shadow-xs outline-none transition-all"
                                        placeholder="••••••"
                                    />
                                    <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
                                </div>
                                <p className="text-3xs text-ink-muted">Leave blank to retain current active passcode.</p>
                            </div>
                        </div>
                    )}

                    {/* Auto-Logout Timer */}
                    <div className="py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3.5 pr-4">
                            <div className="w-9 h-9 rounded-xl bg-app text-ink-muted flex items-center justify-center shrink-0">
                                <Lock size={18} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-ink">Sign out after inactivity</h4>
                                <p className="text-xs text-ink-muted">Automatically lock the workstation session after idle time (set 0 to disable)</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="0"
                                max="480"
                                value={data.auto_logout !== undefined && data.auto_logout !== null ? data.auto_logout : 30}
                                onChange={(e) => setData('auto_logout', Math.max(0, parseInt(e.target.value, 10) || 0))}
                                className="w-20 px-3 py-1.5 bg-app border border-line rounded-xl text-sm font-bold text-ink text-center focus:ring-2 focus:ring-brand-500 outline-none"
                            />
                            <span className="text-xs font-bold text-ink-muted">{Number(data.auto_logout) === 0 ? 'off' : 'min'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Account Security & Staff Management Shortcuts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 2FA Card */}
                <div className="p-6 bg-surface rounded-2xl border border-line shadow-xs flex flex-col justify-between">
                    <div className="space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                            <Key size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-ink">Extra sign-in protection</h4>
                            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                                Pair an Authenticator App (Google Authenticator, Microsoft Authenticator) with your personal login.
                            </p>
                        </div>
                    </div>
                    <div className="pt-4 mt-4 border-t border-line">
                        <a
                            href="/profile#security"
                            className="inline-flex items-center gap-2 px-3.5 py-2 bg-app hover:bg-sunken text-ink text-xs font-bold rounded-xl border border-line transition-all active:scale-95"
                        >
                            <span>Manage in Profile</span>
                            <ExternalLink size={13} />
                        </a>
                    </div>
                </div>

                {/* Staff & Discount Authority Card */}
                <div className="p-6 bg-surface rounded-2xl border border-line shadow-xs flex flex-col justify-between">
                    <div className="space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Users size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-ink">Staff Roles &amp; Max Discounts</h4>
                            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                                Grant cashier, manager, and auditor role permissions and set maximum allowable manual invoice discounts.
                            </p>
                        </div>
                    </div>
                    <div className="pt-4 mt-4 border-t border-line">
                        <a
                            href="/users"
                            className="inline-flex items-center gap-2 px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs active:scale-95"
                        >
                            <span>Manage Staff &amp; Roles</span>
                            <ExternalLink size={13} />
                        </a>
                    </div>
                </div>
            </div>

            {/* SSO / SAML Enterprise Configuration */}
            <div className="p-6 bg-surface rounded-2xl border border-line shadow-xs space-y-5">
                <div className="flex items-center gap-3.5 pb-4 border-b border-line">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <Lock size={20} />
                    </div>
                    <div>
                        <h4 className="text-base font-bold text-ink leading-tight">Sign in with your company's account</h4>
                        <p className="text-xs text-ink-muted">Connect corporate Okta, Azure AD, or Google Workspace Single Sign-On</p>
                    </div>
                </div>

                {/* Notice */}
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                    <div>
                        <p className="font-bold">Enterprise SSO (In Development)</p>
                        <p className="mt-0.5 text-amber-700 dark:text-amber-400 leading-relaxed">
                            Single Sign-On (SAML 2.0 / Azure AD / Okta) connection is in progress and will be available in an upcoming update. Currently, staff authenticate using their credentials.
                        </p>
                    </div>
                </div>

                <Toggle
                    label="Allow company account sign-in"
                    description="Connect your company's sign-in service (Upcoming feature)."
                    enabled={false}
                    disabled={true}
                    upcoming={true}
                    onChange={() => {}}
                />

                {isSsoActive && (
                    <div className="pt-3 border-t border-line space-y-4 animate-in fade-in slide-in-from-top-2 duration-normal">
                        <div className="space-y-1.5">
                            <label className="block text-2xs font-bold uppercase tracking-wider text-ink-muted">IdP Entity ID</label>
                            <input
                                type="text"
                                value={data.sso_idp_entity_id || ''}
                                onChange={(e) => setData('sso_idp_entity_id', e.target.value)}
                                className="w-full px-4 py-2.5 bg-app border border-line rounded-xl text-xs font-bold text-ink focus:ring-2 focus:ring-brand-500 outline-none"
                                placeholder="https://identity-provider.com/metadata"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-2xs font-bold uppercase tracking-wider text-ink-muted">Single Sign-On Service URL</label>
                            <input
                                type="text"
                                value={data.sso_url || ''}
                                onChange={(e) => setData('sso_url', e.target.value)}
                                className="w-full px-4 py-2.5 bg-app border border-line rounded-xl text-xs font-bold text-ink focus:ring-2 focus:ring-brand-500 outline-none"
                                placeholder="https://identity-provider.com/sso"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-2xs font-bold uppercase tracking-wider text-ink-muted">X.509 Public Certificate</label>
                            <textarea
                                value={data.sso_certificate || ''}
                                onChange={(e) => setData('sso_certificate', e.target.value)}
                                className="w-full px-4 py-2.5 bg-app border border-line rounded-xl text-xs font-mono text-ink focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                                rows={4}
                                placeholder="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
