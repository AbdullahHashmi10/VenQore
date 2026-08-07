import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head, useForm, usePage } from '@inertiajs/react'; // usePage added
import {
    Database,
    Download,
    Upload,
    FileSpreadsheet,
    FileText,
    CheckSquare,
    Square,
    AlertCircle,
    Check,
    Archive,
    Grid,
    FileType,
    ArrowRight,
    RefreshCw,
    ShieldCheck
} from 'lucide-react';
import MidnightNebula from '@/Components/MidnightNebula';
import PremiumSelect from '@/Components/PremiumSelect';

export default function DataManagement() {
    const { store } = usePage().props;
    const [activeTab, setActiveTab] = useState('export');
    const [exportFormat, setExportFormat] = useState('xlsx');
    const [selectedExports, setSelectedExports] = useState([]);

    // Import State
    const [importType, setImportType] = useState('products');
    const { data, setData, post, processing, errors, reset } = useForm({
        file: null,
        type: 'products'
    });

    const exportOptions = [
        { id: 'products', label: 'Products & Stock', description: 'Inventory, prices, levels', icon: Archive, color: 'text-blue-500' },
        { id: 'parties', label: 'Contacts', description: 'Customers & Suppliers', icon: FileText, color: 'text-emerald-500' },
        { id: 'sales', label: 'Sales History', description: 'Invoices & Transactions', icon: FileSpreadsheet, color: 'text-purple-500' },
        { id: 'purchases', label: 'Purchases', description: 'Orders & Bills', icon: Grid, color: 'text-orange-500' },
        { id: 'expenses', label: 'Expenses', description: 'Records & Categories', icon: FileText, color: 'text-rose-500' },
        { id: 'transactions', label: 'Ledger', description: 'All financial movements', icon: Database, color: 'text-indigo-500' },
    ];

    const toggleExport = (id) => {
        if (selectedExports.includes(id)) {
            setSelectedExports(prev => prev.filter(item => item !== id));
        } else {
            setSelectedExports(prev => [...prev, id]);
        }
    };

    const handleSelectAll = () => {
        if (selectedExports.length === exportOptions.length) {
            setSelectedExports([]);
        } else {
            setSelectedExports(exportOptions.map(o => o.id));
        }
    };

    const handleExport = (e) => {
        e.preventDefault();
        if (selectedExports.length === 0) return;

        if (selectedExports.length > 1) {
            alert('Bulk export coming soon. Please select one type at a time.');
            return;
        }

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = route('store.admin.data.export', { store_slug: store?.slug });

        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = '_token';
        csrfInput.value = csrfToken;
        form.appendChild(csrfInput);

        const typeInput = document.createElement('input');
        typeInput.type = 'hidden';
        typeInput.name = 'type';
        typeInput.value = selectedExports[0];
        form.appendChild(typeInput);

        const formatInput = document.createElement('input');
        formatInput.type = 'hidden';
        formatInput.name = 'format';
        formatInput.value = exportFormat;
        form.appendChild(formatInput);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    const handleImportSubmit = (e) => {
        e.preventDefault();
        post(route('store.admin.data.upload-mapping', { store_slug: store?.slug }), {
            onSuccess: () => {
                // Inertia handles redirection to the DataMapping component
            },
            onError: (err) => console.error(err)
        });
    };

    const downloadTemplate = () => {
        window.location.href = route('store.admin.data.template', { store_slug: store?.slug, type: importType, format: 'xlsx' });
    };

    return (
        <OneGlanceLayout title="System Data Center" activeMenu="Data Management" mode="admin">
            <Head title="Data Management" />

            <div className="max-w-[1600px] mx-auto h-full flex flex-col gap-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Database className="text-indigo-500" />
                            Data Operations
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Securely import, export, and manage system records</p>
                    </div>

                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        {[
                            { id: 'export', label: 'Export Data', icon: Download },
                            { id: 'import', label: 'Import Data', icon: Upload }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === tab.id
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeTab === 'export' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">

                            {/* Left: Selection Grid */}
                            <div className="lg:col-span-8 flex flex-col gap-4 min-h-0">
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col h-full shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                            <div className="w-6 h-6 rounded bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 text-xs font-bold">1</div>
                                            Select Data Entities
                                        </h3>
                                        <button onClick={handleSelectAll} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                                            {selectedExports.length === exportOptions.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar pr-2">
                                        {exportOptions.map((option) => {
                                            const isSelected = selectedExports.includes(option.id);
                                            return (
                                                <button
                                                    key={option.id}
                                                    onClick={() => toggleExport(option.id)}
                                                    className={`relative p-5 rounded-2xl border-2 text-left transition-all group ${isSelected
                                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                        : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 bg-slate-50/50 dark:bg-slate-800/20'
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 ' + option.color} shadow-sm transition-colors`}>
                                                            <option.icon size={20} />
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                                                            {isSelected && <Check size={12} strokeWidth={4} />}
                                                        </div>
                                                    </div>
                                                    <p className={`font-bold text-sm mb-1 ${isSelected ? 'text-indigo-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'}`}>{option.label}</p>
                                                    <p className={`text-xs ${isSelected ? 'text-indigo-700/80 dark:text-indigo-300/80' : 'text-slate-400'}`}>{option.description}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Actions */}
                            <div className="lg:col-span-4 flex flex-col gap-6">
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2 mb-6">
                                        <div className="w-6 h-6 rounded bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 text-xs font-bold">2</div>
                                        Format & Export
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Export Format</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {['xlsx', 'csv', 'pdf'].map(fmt => (
                                                    <button
                                                        key={fmt}
                                                        onClick={() => setExportFormat(fmt)}
                                                        className={`py-3 px-2 rounded-xl border-2 text-xs font-black uppercase transition-all flex flex-col items-center gap-1
                                                            ${exportFormat === fmt
                                                                ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                                                : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-300 dark:hover:border-indigo-700'}
                                                        `}
                                                    >
                                                        <FileType size={16} />
                                                        {fmt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="py-4"></div>

                                        <button
                                            onClick={handleExport}
                                            disabled={selectedExports.length === 0}
                                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 group"
                                        >
                                            {selectedExports.length === 0 ? 'Select Data First' : (
                                                <>
                                                    Export Now <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </button>
                                        <p className="text-center text-xs text-slate-400 mt-3 font-medium">
                                            {selectedExports.length > 0 ? `${selectedExports.length} modules selected` : 'No modules selected'}
                                        </p>
                                    </div>
                                </div>

                                <MidnightNebula className="rounded-3xl p-6" primaryColor="indigo" secondaryColor="purple">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                                            <ShieldCheck className="text-white" size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white mb-1">Secure Export</h4>
                                            <p className="text-xs text-indigo-100 leading-relaxed opacity-90">
                                                Exported files contain sensitive business data. Please ensure they are stored securely.
                                                <br /><br />
                                                <strong>Pro Tip:</strong> Use XLSX for re-importing data.
                                            </p>
                                        </div>
                                    </div>
                                </MidnightNebula>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                            {/* Left: Upload Area */}
                            <div className="lg:col-span-7 flex flex-col gap-6">
                                <form onSubmit={handleImportSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col gap-6 flex-1 shadow-sm">
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                        <div className="w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 text-xs font-bold">1</div>
                                        Upload Data File
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Target Module</label>
                                            <PremiumSelect
                                                options={exportOptions.map(opt => ({ id: opt.id, name: opt.label }))}
                                                value={data.type}
                                                onChange={(val) => { setData('type', val); setImportType(val); }}
                                                searchable={false}
                                                className="w-full text-lg"
                                            />
                                        </div>

                                        <div className="relative group cursor-pointer">
                                            <input
                                                type="file"
                                                onChange={e => setData('file', e.target.files[0])}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                accept=".csv, .xlsx, .xls"
                                            />
                                            <div className="w-full h-64 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center gap-4 group-hover:border-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/10 transition-all">
                                                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform text-indigo-500">
                                                    <Upload size={32} />
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-bold text-slate-700 dark:text-white text-lg">
                                                        {data.file ? data.file.name : 'Drag & Drop or Click to Upload'}
                                                    </p>
                                                    <p className="text-sm text-slate-400 mt-1">Supports XLSX, CSV (Max 10MB)</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {data.file && (
                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800 flex items-center gap-3 animate-in slide-in-from-top-2">
                                            <CheckCircle className="text-emerald-500" size={24} />
                                            <div>
                                                <p className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">File Ready for Processing</p>
                                                <p className="text-xs text-emerald-600 dark:text-emerald-400">The system will update existing records matching unique IDs.</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-auto">
                                        <button
                                            type="submit"
                                            disabled={!data.file || processing}
                                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                                        >
                                            {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><RefreshCw size={20} /> Start Import Process</>}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Right: Instructions */}
                            <div className="lg:col-span-5 flex flex-col gap-6">
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                                        <div className="w-6 h-6 rounded bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 text-xs font-bold">2</div>
                                        Use Correct Format
                                    </h3>

                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                                        Data integrity is critical. Start by downloading the official template for the <strong>{exportOptions.find(o => o.id === importType)?.label}</strong> module.
                                    </p>

                                    <button
                                        onClick={downloadTemplate}
                                        className="w-full py-3 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2 transition-all mb-6"
                                    >
                                        <FileSpreadsheet size={18} /> Download Excel Template
                                    </button>

                                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Checklist</h4>
                                    <ul className="space-y-3">
                                        {['Do not rename column headers', 'Use unique IDs for updates', 'Dates format: YYYY-MM-DD', 'Max 5000 rows per file'].map((item, i) => (
                                            <li key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                                <CheckSquare size={16} className="text-emerald-500" /> {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </OneGlanceLayout>
    );
}

// Helper for check circle icon
function CheckCircle({ className, size }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
    );
}
