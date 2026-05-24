import re

file_path = 'resources/js/Pages/Expenses/ExpensesList.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# We will apply styling updates to PartySearchField and CustomSelect
content = content.replace(
    '''className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${selectedParty ? 'border-emerald-500/60' : 'border-white/10 focus-within:border-emerald-500/50'
                }`} style={{ background: 'rgba(255,255,255,0.06)' }}''',
    '''className={`flex items-center gap-3 px-4 h-12 rounded-xl border transition-all focus-within:ring-4 focus-within:ring-indigo-500/10 shadow-sm ${selectedParty ? 'border-emerald-500/60 bg-white dark:bg-slate-800' : 'border-slate-200 dark:border-slate-700 focus-within:border-indigo-500 bg-white dark:bg-slate-800'}
                }`}'''
)

content = content.replace(
    '''className="flex-1 bg-transparent border-none outline-none text-sm font-semibold text-white placeholder-slate-600"''',
    '''className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:ring-0"'''
)

content = content.replace(
    '''className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold flex justify-between items-center border transition-all ${open ? 'border-indigo-500 ring-2 ring-indigo-500/30' :
                    error ? 'border-rose-500/50' : 'border-white/10 hover:border-white/30'
                    } outline-none cursor-pointer`}
                style={{ background: 'rgba(255,255,255,0.06)' }}''',
    '''className={`w-full h-12 px-4 rounded-xl text-sm font-bold flex justify-between items-center border transition-all shadow-sm outline-none cursor-pointer bg-white dark:bg-slate-800 ${open ? 'border-indigo-500 ring-4 ring-indigo-500/10' :
                        error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}'''
)
content = content.replace(
    '''<span className={selected ? 'text-white' : 'text-slate-500'}>''',
    '''<span className={selected ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-500'}>'''
)

# Replace the modal definition
split_marker = '{/* ── Premium Expense Modal ── */}'
if split_marker in content:
    header_content, _ = content.split(split_marker, 1)
else:
    header_content = content.split('isModalOpen && (')[0]
    header_content = header_content.rsplit('{', 1)[0] # remove { before isModalOpen

modal_content = """{/* ── Modern Pro Expense Modal ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style={{ backdropFilter: 'blur(16px)', backgroundColor: 'rgba(15, 23, 42, 0.85)' }}>
                    <div className="relative w-full max-w-[95vw] 2xl:max-w-[1500px] bg-slate-50 dark:bg-slate-900 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-500" style={{ maxHeight: '96vh' }}>

                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                        {/* ── Header ── */}
                        <div className="relative z-10 px-8 py-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900/90 backdrop-blur-xl">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 flex items-center justify-center shadow-xl shadow-indigo-500/30 transform transition-transform hover:rotate-3 duration-300">
                                    <Receipt size={28} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {editingExpense ? 'Refine Record' : 'Record New Expense'}
                                    </h2>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Active V3 Sync</span>
                                        </div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-80">Verified Ledger Entry</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                {grandTotal > 0 && (
                                    <div className="hidden lg:block text-right px-6 py-2.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 shadow-inner">
                                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1.5">Grand Total Impact</p>
                                        <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                                            {formatCurrency(grandTotal)}
                                        </p>
                                    </div>
                                )}
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-12 h-12 flex items-center justify-center rounded-2xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all border border-transparent hover:border-rose-200 dark:hover:border-rose-900 group"
                                >
                                    <X size={24} className="group-hover:scale-110 transition-transform" />
                                </button>
                            </div>
                        </div>

                        {/* ── Body ── */}
                        <div className="relative z-10 flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
                            <form encType="multipart/form-data">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">

                                    {/* Primary Logistics */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                                <Layers size={20} />
                                            </div>
                                            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Basic Details</h3>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="group">
                                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-indigo-500 transition-colors">Expense Category <span className="text-rose-500">*</span></label>
                                                {isCreatingCategory && isModalOpen ? (
                                                    <div className="flex items-center gap-2 animate-in zoom-in-95 duration-200">
                                                        <div className="relative flex-1">
                                                            <Tag size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                                            <input
                                                                autoFocus
                                                                type="text"
                                                                value={newCategoryName}
                                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleCreateCategory();
                                                                    if (e.key === 'Escape') setIsCreatingCategory(false);
                                                                }}
                                                                placeholder="New Category Name..."
                                                                className="w-full h-12 pl-9 pr-4 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 border border-indigo-500 text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
                                                            />
                                                        </div>
                                                        <button type="button" onClick={() => handleCreateCategory()} className="w-12 h-12 flex items-center justify-center bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 active:scale-95 transition-all"><Check size={18} /></button>
                                                        <button type="button" onClick={() => setIsCreatingCategory(false)} className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-xl hover:text-rose-500 hover:border-rose-500 active:scale-95 transition-all"><X size={18} /></button>
                                                    </div>
                                                ) : (
                                                    <CustomSelect
                                                        value={formData.expense_category_id}
                                                        onChange={(val) => setFormData({ ...formData, expense_category_id: val })}
                                                        placeholder="— Select Category —"
                                                        error={errors.expense_category_id}
                                                        options={categories.map(c => ({ value: c.id, label: c.name }))}
                                                        onAddNew={() => setIsCreatingCategory(true)}
                                                    />
                                                )}
                                                {errors.expense_category_id?.[0] && !isCreatingCategory && <p className="text-rose-500 text-[10px] font-bold mt-2 ml-1 flex items-center gap-1"><X size={10} /> {errors.expense_category_id[0]}</p>}
                                            </div>

                                            <div className="group">
                                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-indigo-500 transition-colors">Date of Expense <span className="text-rose-500">*</span></label>
                                                <input
                                                    type="date"
                                                    value={formData.date}
                                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                    className="w-full h-12 px-4 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none shadow-sm"
                                                />
                                            </div>

                                            <div className="group p-6 rounded-[2rem] bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                                                <label className="block text-[9px] font-black text-indigo-200 uppercase tracking-widest mb-3">Amount (Excl. Tax) <span className="text-white">*</span></label>
                                                <div className="relative flex items-center">
                                                    <span className="text-3xl font-black text-indigo-300/40 mr-3 select-none">Rs</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={formData.amount}
                                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                        placeholder="0.00"
                                                        className="w-full bg-transparent text-4xl font-black text-white border-none focus:ring-0 placeholder-indigo-400/50 p-0"
                                                    />
                                                </div>
                                                {errors.amount?.[0] && <div className="mt-3 bg-rose-500/30 backdrop-blur-sm border border-rose-500/30 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5"><X size={10} /> <span className="text-[9px] font-bold">{errors.amount[0]}</span></div>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Financial Routing */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-emerald-500">
                                                <CreditCard size={20} />
                                            </div>
                                            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Payment & Tax</h3>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="group">
                                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Payee / Vendor</label>
                                                <PartySearchField
                                                    value={formData.payee}
                                                    selectedParty={selectedParty}
                                                    onSelect={(party) => {
                                                        setSelectedParty(party);
                                                        setFormData(f => ({ ...f, payee: party.name, party_id: party.id }));
                                                    }}
                                                    onClear={() => {
                                                        setSelectedParty(null);
                                                        setFormData(f => ({ ...f, payee: '', party_id: '' }));
                                                    }}
                                                />
                                            </div>

                                            <div className="group">
                                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Payment Method</label>
                                                <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, payment_method: 'cash' })}
                                                        className={`h-11 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${formData.payment_method === 'cash' ? 'bg-white dark:bg-slate-700 shadow text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                                    >
                                                        <DollarSign size={14} /> CASH
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, payment_method: 'bank' })}
                                                        className={`h-11 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${formData.payment_method === 'bank' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                                    >
                                                        <Monitor size={14} /> BANK
                                                    </button>
                                                </div>
                                            </div>

                                            {formData.payment_method === 'bank' && (
                                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <label className="block text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest mb-2 ml-1">Bank Account <span className="text-rose-500">*</span></label>
                                                    <CustomSelect
                                                        value={formData.bank_account_id}
                                                        onChange={(val) => setFormData({ ...formData, bank_account_id: val })}
                                                        placeholder="Choose Bank Account"
                                                        error={errors.bank_account_id}
                                                        options={bankAccounts.map(b => ({
                                                            value: b.id,
                                                            label: (
                                                                <div className="flex items-center justify-between gap-2 w-full">
                                                                    <span className="truncate">
                                                                        {b.name || b.bank_name} {b.account_number && <span className="text-slate-500 text-[10px] ml-1">({b.account_number})</span>}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-slate-400 shrink-0">Rs {b.current_balance?.toLocaleString() || 0}</span>
                                                                </div>
                                                            )
                                                        }))}
                                                    />
                                                    {errors.bank_account_id?.[0] && <p className="text-rose-500 text-[10px] font-bold mt-2 ml-1"><X size={10} className="inline" /> {errors.bank_account_id[0]}</p>}
                                                </div>
                                            )}

                                            <div className="group">
                                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Tax Amount</label>
                                                <div className="relative flex items-center">
                                                    <span className="absolute left-4 text-slate-400 dark:text-slate-500 font-bold text-xs">PKR</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={formData.tax_amount}
                                                        onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
                                                        placeholder="0.00"
                                                        className="w-full h-12 pl-12 px-4 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Context & Proof */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sky-500">
                                                <FileText size={20} />
                                            </div>
                                            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Context & Proof</h3>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="group">
                                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Reference No.</label>
                                                <input
                                                    type="text"
                                                    value={formData.reference}
                                                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                                    placeholder="Receipt # or Bill Code"
                                                    className="w-full h-12 px-4 rounded-xl text-sm font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none shadow-sm"
                                                />
                                            </div>
                                            
                                            <div className="group">
                                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Description <span className="text-rose-500">*</span></label>
                                                <textarea
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    placeholder="Specify the operational purpose..."
                                                    rows={3}
                                                    className={`w-full px-4 py-3 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border ${errors.description ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} text-slate-800 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none resize-none placeholder-slate-400 dark:placeholder-slate-500 shadow-sm`}
                                                />
                                                {errors.description?.[0] && <p className="text-rose-500 text-[10px] font-bold mt-2 ml-1"><X size={10} className="inline" /> {errors.description[0]}</p>}
                                            </div>

                                            <div className="group">
                                                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Physical Evidence</label>
                                                <label
                                                    className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all p-6 text-center cursor-pointer ${formData.attachment ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-400 shadow-sm' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500'}`}
                                                >
                                                    <input type="file" className="sr-only" onChange={(e) => setFormData({ ...formData, attachment: e.target.files[0] })} accept="image/*,.pdf" />
                                                    {formData.attachment ? (
                                                        <>
                                                            <div className="w-14 h-14 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg animate-in zoom-in-75 duration-300">
                                                                <Check size={28} />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[200px] px-2">{formData.attachment.name}</p>
                                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Captured Successfully</p>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 shadow-sm group-hover:scale-105 transition-transform duration-300">
                                                                <Upload size={24} />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-indigo-500 transition-colors uppercase tracking-widest">SECURE RECEIPT</p>
                                                                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">PDF or Image Transfer</p>
                                                            </div>
                                                        </>
                                                    )}
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </form>
                        </div>

                        {/* ── Footer ── */}
                        <div className="relative z-20 px-8 py-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-8">
                                <div className="flex flex-col">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Total Payable</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                            {formatCurrency(grandTotal)}
                                        </p>
                                        <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest px-1.5 py-0.5 bg-rose-500/10 rounded-md border border-rose-500/20">OUT</span>
                                    </div>
                                </div>
                                <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />
                                <div className="hidden md:flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${formData.payment_method === 'cash' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`} />
                                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                            {formData.payment_method === 'cash' ? 'Direct Liquidity Reduction' : 'Bank Reconciliation Pending'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Automatic V3 Ledger Sync</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 sm:flex-none px-6 h-12 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all uppercase tracking-widest border border-transparent hover:border-slate-300 dark:hover:border-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex-1 sm:flex-none px-10 h-12 rounded-xl bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/30 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            <span>Saving...</span>
                                        </div>
                                    ) : (
                                        <span>{editingExpense ? 'Update Record' : 'Save Record'}</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </OneGlanceLayout>
    );
}
"""

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(header_content + modal_content)
