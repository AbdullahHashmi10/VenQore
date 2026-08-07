const fs = require('fs');

let content = fs.readFileSync('resources/js/Pages/Expenses/ExpensesList.jsx', 'utf8');

// Replace CustomSelect styles
content = content.replace(
    'className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold flex justify-between items-center border transition-all ${open ? \'border-indigo-500 ring-2 ring-indigo-500/30\' :\n                    error ? \'border-rose-500/50\' : \'border-white/10 hover:border-white/30\'\n                    } outline-none cursor-pointer`}\n                style={{ background: \'rgba(255,255,255,0.06)\' }}',
    'className={`w-full h-16 px-6 rounded-2xl text-base font-bold flex justify-between items-center border transition-all shadow-sm outline-none cursor-pointer bg-white dark:bg-slate-800 ${open ? \'border-indigo-500 ring-[6px] ring-indigo-500/10\' :\n                        error ? \'border-rose-500\' : \'border-slate-200 dark:border-slate-700 hover:border-slate-400\'\n                    }`}'
);

// Replace span
content = content.replace(
    "<span className={selected ? 'text-white' : 'text-slate-500'}>",
    "<span className={selected ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-500'}>"
);

// Replace PartySearchField styles
content = content.replace(
    'className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${selectedParty ? \'border-emerald-500/60\' : \'border-white/10 focus-within:border-emerald-500/50\'\n                }`} style={{ background: \'rgba(255,255,255,0.06)\' }}',
    'className={`flex items-center gap-4 px-6 h-16 rounded-2xl border transition-all focus-within:ring-[6px] focus-within:ring-indigo-500/10 shadow-sm ${selectedParty ? \'border-emerald-500/60 bg-white dark:bg-slate-800\' : \'border-slate-200 dark:border-slate-700 focus-within:border-indigo-500 bg-white dark:bg-slate-800\'}\n                }`}'
);

content = content.replace(
    'className="flex-1 bg-transparent border-none outline-none text-sm font-semibold text-white placeholder-slate-600"',
    'className="flex-1 bg-transparent border-none outline-none text-base font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:ring-0"'
);

const updateModalPy = fs.readFileSync('update_modal.py', 'utf8');
const modalContent = updateModalPy.split('modal_content = """')[1].split('"""')[0];

let headerContent = content.split('{/* ── Premium Expense Modal ── */}')[0];
if (!headerContent || headerContent === content) {
    // try to split by the new name if already done
    headerContent = content.split('{/* ── Modern Pro Expense Modal ── */}')[0];
}

fs.writeFileSync('resources/js/Pages/Expenses/ExpensesList.jsx', headerContent + modalContent);
console.log('Update Complete!');
