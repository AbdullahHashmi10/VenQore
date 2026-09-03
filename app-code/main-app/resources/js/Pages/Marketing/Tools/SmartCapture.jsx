import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from '@inertiajs/react';
import ToolShell from './Shared/ToolShell';
import Select from './Shared/Select';
import EditableText from './Shared/EditableText';
import {
  Store, Truck, Cpu, FileText, Database, Shield, Zap, Sparkles, Plus, Trash2,
  Download, RefreshCw, CheckCircle2, Play, Upload, AlertCircle, Loader2,
  ScanLine, Brain, FileSearch, ArrowRight, Check, Star, Layers, Clock,
  Globe, Lock, FlaskConical, BarChart3, ChevronRight, Fingerprint
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT_PRESETS = ['#4f46e5', '#0ea5e9', '#059669', '#d97706', '#dc2626', '#7c3aed'];

const TEMPLATES = {
  clean:   { name: 'Clean', description: 'Minimalist white template' },
  modern:  { name: 'Modern', description: 'Accent color band at top' },
  classic: { name: 'Classic', description: 'Bordered table format' },
  compact: { name: 'Compact', description: 'Dense layout for many items'},
};

const CURRENCIES = {
  USD: '$', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'A$',
  PKR: 'Rs', INR: '₹', AED: 'AED', SAR: 'SAR', JPY: '¥',
};

const emptyItem = () => ({ description: '', quantity: 1, unit_price: 0, tax_rate: 0, discount_pct: 0 });

// ─── FAQs (15 questions — expanded for SEO) ───────────────────────────────────

const FAQS = [
  {
    q: 'What is Smart Capture AI and how does it work?',
    a: 'Smart Capture AI is a document intelligence tool powered by Google Gemini that automatically reads and extracts structured data from physical and digital documents — invoices, receipts, purchase orders, handwritten bills, credit notes, and more. You upload the file; the AI identifies line items, quantities, pricing, vendor details, tax amounts, and totals, then populates an editable invoice workspace you can download as a professional PDF.',
  },
  {
    q: 'What types of documents can Smart Capture parse?',
    a: 'Smart Capture handles a wide variety of business documents: vendor purchase invoices, customer invoices, thermal POS receipts, handwritten cash memos and order slips, digital PDF supplier bills, quotations, packing slips, credit notes, and purchase orders. It works with typed text, printed text, and handwritten content across all of these formats.',
  },
  {
    q: 'Does Smart Capture work on handwritten documents?',
    a: 'Yes. Smart Capture AI can extract data from handwritten invoices, cash memos, and order notes with high accuracy. The underlying Gemini model is trained across millions of document types and handles varied handwriting styles in English and several other languages. Results are always shown in an editable workspace so you can correct any extraction before downloading.',
  },
  {
    q: 'What file formats are accepted for upload?',
    a: 'Smart Capture accepts JPEG and PNG image files (photographs of documents, scanned pages) and PDF files. A single page of a PDF or a single image counts as one scan. Multi-page PDFs are parsed page-by-page up to a maximum of 5 pages per upload. Files larger than 20 MB are rejected — compress or split large PDFs before uploading.',
  },
  {
    q: 'How are pages and scans counted against my monthly allowance?',
    a: 'One scan credit equals one page. A single-image upload = 1 credit. A two-page PDF = 2 credits. A 5-page PDF = 5 credits (the maximum per submission). The free public tier gives you 5 pages per month. Paid tiers start from 500 pages/month. Inside the VenQore ERP integrated plan, scans are included in your platform subscription without page counting.',
  },
  {
    q: 'What is the difference between Standalone and ERP-Integrated Smart Capture?',
    a: 'Standalone Smart Capture extracts raw data into an editable PDF workspace — ideal for individuals and businesses that need quick document digitization. ERP-Integrated Smart Capture goes further: it matches extracted line items to your live product catalog and SKUs, validates vendor details against your supplier accounts, posts confirmed bills directly to your FIFO double-entry ledger, and adjusts stock levels automatically — with zero manual data entry.',
  },
  {
    q: 'Is my uploaded document data stored or used to train AI models?',
    a: 'Documents processed through the free public tier use Google Gemini\'s free-tier API, which may be used to improve Google\'s AI systems in accordance with Google\'s standard API terms — this is industry-standard practice shared across most free AI-powered tools. Documents processed through the VenQore ERP integrated plan use a private, enterprise-grade API endpoint with data processing agreements (DPA) that explicitly prohibit training use. Your data is never stored on VenQore servers beyond the single request processing window.',
  },
  {
    q: 'What accuracy can I expect from AI extraction?',
    a: 'Accuracy varies by document quality and type. Clean digital PDFs typically achieve 95–99% field-level accuracy. Printed thermal receipts: 90–97%. Clear handwritten documents: 80–93%. Damaged, low-resolution, or heavily stylized documents may extract with lower accuracy. The editable workspace is specifically designed to make correction fast — you review, click to fix any field, then download. The AI handles 90%+ of the data entry so you only correct the edge cases.',
  },
  {
    q: 'Can Smart Capture handle documents in multiple languages?',
    a: 'Smart Capture processes documents in English, Urdu, Arabic, Hindi, French, Spanish, German, and several other widely-used languages for field extraction. Currency symbol and number format detection is universal. For non-Latin scripts, accuracy is highest when the document is clearly printed (digital or laser-printed) rather than handwritten.',
  },
  {
    q: 'How many free scans do I get per month?',
    a: 'The free public tier provides 5 scan pages per month — no credit card required, no signup needed for the test/demo mode. If you create a VenQore account, your 5 free pages reset automatically on the 1st of each month. If you need more volume, paid standalone scan credit tiers start from 500 pages/month at $3.00. Inside the VenQore ERP subscription, scans are included with no separate page count.',
  },
  {
    q: 'Can I download the extracted document as a PDF?',
    a: 'Yes — once Smart Capture has populated the document workspace, you can select a template (Clean, Modern, Classic, or Compact), pick your currency, adjust any field inline, and then click Download PDF. The PDF is generated server-side and streamed directly to your browser. There is no watermark on any downloaded file, and no data is retained on our servers after the PDF is generated.',
  },
  {
    q: 'Does Smart Capture integrate with my existing accounting software?',
    a: 'Standalone Smart Capture produces a downloadable PDF only — it does not connect to third-party accounting systems. VenQore ERP Integrated Smart Capture, however, connects directly to VenQore\'s double-entry accounting engine, posting validated purchase bills to your payables ledger and crediting the correct expense or inventory accounts automatically. Integration with QuickBooks, Xero, and other platforms is available through VenQore\'s sync module.',
  },
  {
    q: 'Is Smart Capture available on mobile devices?',
    a: 'Yes. The Smart Capture interface is fully responsive and works on smartphones and tablets. You can photograph a paper receipt with your phone camera, upload it directly through the mobile browser, and receive extracted data in the editable workspace within seconds. For best results, ensure good lighting and that the entire document is in frame before photographing.',
  },
  {
    q: 'What security measures protect my documents during upload?',
    a: 'All uploads are transmitted over HTTPS/TLS 1.3 encrypted connections. Files are processed in memory only and are not written to persistent storage. The free tier uses Google\'s Gemini API over an encrypted channel. The ERP integrated tier uses a private API endpoint covered by a Data Processing Agreement (DPA). VenQore does not share uploaded document data with any third party beyond the designated AI processing endpoint.',
  },
  {
    q: 'How does Smart Capture compare to manual data entry or OCR tools?',
    a: 'Traditional OCR tools extract raw text — they don\'t understand the semantic structure of a document. Smart Capture uses a large multimodal language model that understands context: it knows that a number next to "Qty" means quantity, that a string like "2026-08-10" is a date, and that a line item table has descriptions, units, and prices. This delivers structured, ready-to-use data — not a raw text dump you then have to parse yourself. Compared to manual data entry, Smart Capture is typically 10–20x faster for multi-line invoices.',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function SmartCapture({ turnstileSiteKey, toolGroups = [] }) {
  // ── Mode / flow state ──────────────────────────────────────────────────────
  const [testMode,       setTestMode]       = useState(false);
  const [email,          setEmail]          = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [file,           setFile]           = useState(null);
  const [logoUrl,        setLogoUrl]        = useState(null);
  const [docType,        setDocType]        = useState('purchase');
  const [loading,        setLoading]        = useState(false);
  const [generatingPdf,  setGeneratingPdf]  = useState(false);
  const [resultLoaded,   setResultLoaded]   = useState(false);
  const [errors,         setErrors]         = useState([]);
  const [scanTriggered,  setScanTriggered]  = useState(false);

  // ── Test-mode selections ───────────────────────────────────────────────────
  const [selectedSample, setSelectedSample] = useState('handwritten');
  const [selectedLogo,   setSelectedLogo]   = useState('apex');

  const logoInputRef = useRef(null);

  // ── Branding logos ─────────────────────────────────────────────────────────
  const LOGOS = [
    { id: 'apex', name: 'Apex Retail', color: 'rgb(var(--vq-emerald-500))', symbol: <Store className="w-5 h-5 text-emerald-500" /> },
    { id: 'nova', name: 'Nova Logistics', color: 'rgb(var(--vq-amber-500))', symbol: <Truck className="w-5 h-5 text-amber-500" /> },
    { id: 'quantum', name: 'Quantum Tech', color: 'rgb(var(--vq-violet-500))', symbol: <Cpu className="w-5 h-5 text-brand-500" /> },
  ];

  // ── Document state ─────────────────────────────────────────────────────────
  const [company, setCompany] = useState({ name: '', address: '', email: '', phone: '', tax_id: '', logo_base64: null });
  const [client,  setClient]  = useState({ name: '', address: '', email: '' });
  const [items,   setItems]   = useState([
    { description: 'Wireless Optical Mouse', quantity: 3, unit_price: 15.00, tax_rate: 5,  discount_pct: 0  },
    { description: 'USB-C Fast Charger Hub', quantity: 2, unit_price: 29.90, tax_rate: 5,  discount_pct: 10 },
  ]);
  const [meta, setMeta] = useState({
    invoice_number: 'INV-2026-8849',
    issue_date:     new Date().toISOString().slice(0, 10),
    due_date:       new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    currency:       'USD',
    notes:          'Generated via Smart Capture AI workspace. Click any field to edit.',
    terms:          'Payment is due within 14 days of issue date.',
    template:       'clean',
    accent_color:   'rgb(var(--vq-indigo-600))',
    orientation:    'portrait',
  });
  const [headers, setHeaders] = useState({
    description: 'Description', quantity: 'Qty', unit_price: 'Unit Price',
    discount: 'Disc.', tax: 'Tax', amount: 'Amount',
  });

  // ── Computed totals ────────────────────────────────────────────────────────
  const symbol   = CURRENCIES[meta.currency] || meta.currency;
  const fmtMoney = (n) => `${symbol}${(parseFloat(n) || 0).toFixed(2)}`;

  const lineTotals = useMemo(() => items.map((it) => {
    const qty      = parseFloat(it.quantity)     || 0;
    const price    = parseFloat(it.unit_price)   || 0;
    const discPct  = Math.min(100, Math.max(0, parseFloat(it.discount_pct) || 0));
    const taxPct   = Math.max(0,   parseFloat(it.tax_rate)   || 0);
    const gross    = qty * price;
    const discAmt  = gross * (discPct / 100);
    const net      = gross - discAmt;
    const taxAmt   = net   * (taxPct  / 100);
    return { net, taxAmt, discAmt, lineTotal: net + taxAmt };
  }), [items]);

  const totals = useMemo(() => lineTotals.reduce((acc, l) => ({
    subtotal: acc.subtotal + l.net,
    tax:      acc.tax      + l.taxAmt,
    discount: acc.discount + l.discAmt,
  }), { subtotal: 0, tax: 0, discount: 0 }), [lineTotals]);
  const grandTotal = totals.subtotal + totals.tax;

  // ── Item helpers ───────────────────────────────────────────────────────────
  const updateItem = (idx, field, val) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: val } : it)));
  const addItem    = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (idx) => setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  // ── Logo handlers ──────────────────────────────────────────────────────────
  const handleLiveModeLogoChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 1_500_000) { setErrors(['Logo too large — please use a file under 1.5 MB.']); return; }
    const reader = new FileReader();
    reader.onload = () => setLogoUrl(reader.result);
    reader.readAsDataURL(f);
  };

  const handleLogoChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 1_500_000) { setErrors(['Logo too large — please use a file under 1.5 MB.']); return; }
    const reader = new FileReader();
    reader.onload = () => setCompany((c) => ({ ...c, logo_base64: reader.result }));
    reader.readAsDataURL(f);
  };

  // ── Populate workspace from scanned / simulated data ──────────────────────
  const populateScannedDocument = (data) => {
    const logoObj  = LOGOS.find((l) => l.id === selectedLogo);
    const logoName = logoObj?.name ?? 'Apex Retail Ltd';

    setCompany({
      name:        data.vendor_name    || logoName,
      address:     data.vendor_address || '100 Retail Plaza, Suite 4A, NY 10001',
      email:       data.vendor_email   || `contact@${logoName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      phone:       data.vendor_phone   || '+1 (555) 403-9210',
      tax_id:      data.vendor_tax_id  || 'TX-4401-99',
      logo_base64: logoUrl             || null,
    });
    setClient({
      name:    data.client_name    || 'Quantum Logistics',
      address: data.client_address || '450 Enterprise Way, Industrial Zone, CA 90210',
      email:   data.client_email   || 'billing@quantumnodes.com',
    });

    const parsedItems = (data.items || []).map((it) => ({
      description:  it.item_name    || it.description || 'Extracted Product Item',
      quantity:     parseFloat(it.quantity  || it.qty)         || 1,
      unit_price:   parseFloat(it.unit_price || it.price)      || 0,
      tax_rate:     parseFloat(it.tax_rate  || 0)              || 0,
      discount_pct: parseFloat(it.discount_pct || 0)           || 0,
    }));

    setItems(parsedItems.length > 0 ? parsedItems : [
      { description: 'Extracted Product Item', quantity: 1, unit_price: 49.99, tax_rate: 5, discount_pct: 0 },
    ]);
    setMeta((prev) => ({
      ...prev,
      invoice_number: data.invoice_no   || data.invoice_number || 'INV-AI-8849',
      issue_date:     data.date         || data.issue_date      || new Date().toISOString().slice(0, 10),
      due_date:       data.due_date     || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      notes:  data.notes || 'Parsed and populated by Smart Capture AI. Click any text to edit.',
      terms:  data.terms || 'Payment due within 14 days of issue date.',
    }));
    setResultLoaded(true);
  };

  // ── Mock data per sample ───────────────────────────────────────────────────
  const getMockDataForSample = (type, sample) => {
    const today      = new Date().toISOString().slice(0, 10);
    const dueDateStr = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    if (sample === 'handwritten') return {
      vendor_name: 'Al-Madina Grocers', invoice_no: 'HW-9921', date: today, due_date: dueDateStr,
      items: [
        { description: 'Premium Basmati Rice (5 kg)', quantity: 2, unit_price: 18.50, tax_rate: 0, discount_pct: 0 },
        { description: 'Cooking Oil (3 Litres)', quantity: 1,  unit_price: 22.00, tax_rate: 8, discount_pct: 0 },
        { description: 'Brown Sugar (1 kg)', quantity: 5,  unit_price: 3.20,  tax_rate: 0, discount_pct: 0 },
      ],
    };
    if (sample === 'printed') return {
      vendor_name: 'Metro Hypermarket', invoice_no: 'POS-774921', date: today, due_date: dueDateStr,
      items: [
        { description: 'Wireless Optical Mouse', quantity: 3, unit_price: 15.00, tax_rate: 5, discount_pct: 0  },
        { description: 'USB-C Fast Charger Hub', quantity: 2, unit_price: 29.90, tax_rate: 5, discount_pct: 10 },
        { description: 'Bluetooth Earbuds Pro', quantity: 1, unit_price: 89.00, tax_rate: 8, discount_pct: 0  },
      ],
    };
    return {
      vendor_name: 'Global Tech Supplies', invoice_no: 'INV-88490', date: today, due_date: dueDateStr,
      items: [
        { description: 'Enterprise Server Rack 12U', quantity: 1, unit_price: 499.00, tax_rate: 10, discount_pct: 5 },
        { description: 'Cat6 Ethernet Cable (300 m)', quantity: 2, unit_price: 125.00, tax_rate: 10, discount_pct: 0 },
        { description: 'Gigabit Switch 24-Port', quantity: 1, unit_price: 180.00, tax_rate: 10, discount_pct: 0 },
      ],
    };
  };

  // ── Scan handlers ──────────────────────────────────────────────────────────
  const handleInitialScan = (e) => {
    e.preventDefault();
    setErrors([]);
    if (testMode) {
      setLoading(true);
      setScanTriggered(true);
      setTimeout(() => {
        populateScannedDocument(getMockDataForSample(docType, selectedSample));
        setLoading(false);
      }, 1400);
    } else {
      if (!file) { setErrors(['Please select a document file first.']); return; }
      setScanTriggered(true);
    }
  };

  const handleRevealResults = async (e) => {
    e.preventDefault();
    if (!email) { setErrors(['Please enter a valid work email to unlock the results.']); return; }
    setLoading(true); setErrors([]);
    const fd = new FormData();
    fd.append('email', email); fd.append('file', file); fd.append('type', docType);
    try {
      const res  = await fetch('/tools/smart-capture', {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) setErrors([data.error || 'Failed to scan document.']);
      else { populateScannedDocument(data.data); setEmailSubmitted(true); }
    } catch { setErrors(['An error occurred while uploading. Please try again.']); }
    finally { setLoading(false); }
  };

  const handleReset = () => {
    setFile(null); setResultLoaded(false); setScanTriggered(false);
    setErrors([]); setEmailSubmitted(false);
  };

  const generatePdf = async () => {
    setErrors([]); setGeneratingPdf(true);
    try {
      const res = await fetch(route('tools.invoice.render'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
          Accept: 'application/json',
        },
        body: JSON.stringify({ company, client, items, meta: { ...meta, orientation: 'portrait' } }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrors(body.errors || ['Could not generate PDF. Please check your entries and try again.']);
        return;
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `document-${(meta.invoice_number || 'draft').replace(/[^A-Za-z0-9-]/g, '')}.pdf`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch { setErrors(['Something went wrong generating the PDF. Please try again.']); }
    finally { setGeneratingPdf(false); }
  };

  const templateOptions = Object.entries(TEMPLATES).map(([key, t]) => ({ value: key, label: t.name, hint: t.description }));
  const currencyOptions  = Object.entries(CURRENCIES).map(([code, sym]) => ({ value: code, label: `${code} (${sym})` }));
  const accent    = meta.template === 'modern' ? meta.accent_color : '#0f172a';
  const isModern  = meta.template === 'modern';
  const isClassic = meta.template === 'classic';
  const isCompact = meta.template === 'compact';

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <ToolShell
      title="Smart Capture AI — Extract Invoice & Receipt Data with AI | VenQore"
      metaDescription="Smart Capture AI uses Gemini to extract line items, quantities, prices, and totals from invoices, receipts, purchase orders, and handwritten bills. Free: 5 pages/month. No signup required."
      eyebrow="Premium AI Feature"
      h1="Smart Capture AI"
      answer="Stop typing what's already printed. Smart Capture AI reads your invoices, receipts, purchase orders, and even handwritten bills — extracting every line item, price, tax, and total into an editable document workspace in seconds. Powered by Google Gemini. Free: 5 pages per month."
      toolGroups={toolGroups}
      currentSlug="smart-capture"
      faqs={FAQS}
      cta={{
        headline: 'Smart Capture inside your ERP is a different world entirely.',
        subtext:  'When Smart Capture connects to your live VenQore inventory and ledger, every scanned bill auto-posts to your accounts payable and adjusts stock — zero manual entry from receipt to reconciliation.',
      }}
      related={[
        { href: '/tools/invoice-generator', label: 'Invoice Generator' },
        { href: '/tools/receipt-generator', label: 'Receipt Generator' },
        { href: '/tools/purchase-order-generator', label: 'Purchase Order Generator' },
      ]}
      wide
    >
      <div className="space-y-10">

        {/* ── PREMIUM HERO BANNER ───────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-hero border border-brand-500/20 p-8 md:p-12">
          {/* glow blobs */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-8">
            <div className="flex-1">
              {/* badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-1xs font-bold uppercase tracking-widest mb-5">
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-500" />
                </span>
                Powered by Google Gemini AI
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-4">
                Turn any invoice, receipt, or handwritten bill<br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-400"> into a structured document in seconds.</span>
              </h2>

              <p className="text-neutral-300 text-sm leading-relaxed max-w-lg mb-6">
                Upload a photo, scan, or PDF. Our AI reads it — line items, quantities, prices, taxes — and fills in a fully editable invoice workspace for you to review and download.
              </p>

              {/* capability pills */}
              <div className="flex flex-wrap gap-2">
                {['Handwritten Bills','Thermal Receipts','PDF Invoices','Purchase Orders','Credit Notes','Quotations'].map((tag) => (
                  <span key={tag} className="px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-neutral-300 text-1xs font-bold">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* stats cluster */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              {[
                { icon: <ScanLine className="w-4 h-4 text-brand-400" />, val: '95%+', label: 'Avg. Accuracy' },
                { icon: <Clock    className="w-4 h-4 text-brand-400" />, val: '<3s', label: 'Extraction Time' },
                { icon: <FileText className="w-4 h-4 text-emerald-400"/>, val: '15+', label: 'Doc Types' },
                { icon: <Globe    className="w-4 h-4 text-amber-400" />, val: '10+', label: 'Languages' },
              ].map((s) => (
                <div key={s.label} className="p-3.5 rounded-2xl bg-white/[0.07] border border-white/[0.12] text-center min-w-[100px]">
                  <div className="flex justify-center mb-1">{s.icon}</div>
                  <div className="text-xl font-bold text-white">{s.val}</div>
                  <div className="text-2xs text-neutral-300 font-bold uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* how it works steps */}
          <div className="relative z-10 mt-10 pt-8 border-t border-white/[0.06] grid sm:grid-cols-3 gap-6">
            {[
              { n: '01', icon: <Upload className="w-5 h-5" />, title: 'Upload Your Document', desc: 'Drag a photo, PDF, or scanned image — up to 5 pages per submission.' },
              { n: '02', icon: <Brain className="w-5 h-5" />, title: 'AI Extracts Everything', desc: 'Reads vendor, client, items, quantities, prices, tax and totals automatically.' },
              { n: '03', icon: <Download className="w-5 h-5" />, title: 'Edit & Download PDF', desc: 'Review in the live workspace, click to fix anything, then download a clean PDF.' },
            ].map((step, i) => (
              <div key={step.n} className="flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-300">
                  {step.icon}
                </div>
                <div>
                  <div className="text-3xs font-bold text-brand-400 uppercase tracking-widest mb-0.5">Step {step.n}</div>
                  <div className="text-sm font-bold text-white mb-1">{step.title}</div>
                  <div className="text-1xs text-neutral-300 leading-relaxed">{step.desc}</div>
                </div>
                {i < 2 && <ChevronRight className="hidden sm:block shrink-0 w-4 h-4 text-ink-secondary mt-3 ml-auto" />}
              </div>
            ))}
          </div>
        </div>

        {/* ── MODE TOGGLE ───────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-sunken dark:bg-white/[0.02] border border-line dark:border-white/10">
          <div>
            <h4 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${testMode ? 'bg-brand-400' : 'bg-emerald-400'}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${testMode ? 'bg-brand-500' : 'bg-emerald-500'}`} />
              </span>
              {testMode ? 'Demo Mode Active' : 'Live Mode Active'}
            </h4>
            <p className="text-2xs text-ink-muted mt-0.5">
              {testMode
                ? 'Process simulated documents free — no API credit used. Perfect for evaluating Smart Capture.'
                : 'Live mode scans your actual uploaded files through Gemini API and uses your monthly page allowance.'}
            </p>
          </div>
          <div className="flex bg-surface p-1 rounded-xl border border-line dark:border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => { setTestMode(true); handleReset(); }}
              className={`px-4 py-2 rounded-lg text-2xs font-bold uppercase tracking-wider transition-all ${
                testMode
                  ? 'bg-brand-600 text-white shadow-md '
                  : 'text-brand-500 dark:text-brand-400 ring-2 ring-brand-400/60 ring-offset-1 ring-offset-white dark:ring-offset-slate-950 animate-pulse'
              }`}>
              ✦ Try Free Demo
            </button>
            <button
              type="button"
              onClick={() => { setTestMode(false); handleReset(); }}
              className={`px-4 py-2 rounded-lg text-2xs font-bold uppercase tracking-wider transition-all ${
                !testMode
                  ? 'bg-emerald-600 text-white shadow-md '
                  : 'text-ink-muted hover:text-ink-secondary'
              }`}>
              Live Mode
            </button>
          </div>
        </div>

        {/* ── INPUT FORM ────────────────────────────────────────────────────── */}
        {!scanTriggered && (
          <div className="bg-surface border border-line dark:border-white/[0.04] rounded-2xl p-6 md:p-8 shadow-xl shadow-neutral-900/5">
            <form onSubmit={handleInitialScan} className="space-y-7">

              {/* 1. Document Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">
                  1 — Select Document Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {[
                    { value: 'invoice', label: 'Invoice' },
                    { value: 'purchase', label: 'Purchase' },
                    { value: 'expense', label: 'Receipt' },
                    { value: 'quotation', label: 'Quote' },
                    { value: 'packing_slip', label: 'Packing' },
                    { value: 'credit_note', label: 'Credit Note' },
                    { value: 'purchase_order',label: 'PO' },
                  ].map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setDocType(opt.value)}
                      className={`p-3 rounded-xl border text-center transition-all duration-normal focus:outline-none text-2xs font-bold uppercase tracking-wider ${
                        docType === opt.value
                          ? 'border-brand-500 bg-brand-500/[0.06] text-brand-600 dark:text-brand-400 shadow-sm '
                          : 'border-line dark:border-white/[0.04] text-ink-secondary hover:border-line dark:hover:border-white/10'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* LIVE MODE inputs */}
              {!testMode && (
                <div className="space-y-5">
                  <div>
                    <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                      <span>2 — Upload Document (PDF or Image)</span>
                      <span className="text-2xs font-semibold text-ink-muted normal-case">Max 5 pages • PDF, PNG, JPG</span>
                    </label>
                    <input type="file" required accept="image/*,.pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="w-full px-4 py-3 bg-app border border-line dark:border-white/10 rounded-xl text-ink-secondary text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:uppercase file:bg-brand-500/10 file:text-brand-600 dark:file:text-brand-400 hover:file:bg-brand-500/20" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
                      3 — Apply Branding Logo (Optional)
                    </label>
                    <input type="file" accept="image/*" onChange={handleLiveModeLogoChange}
                      className="w-full px-4 py-3 bg-app border border-line dark:border-white/10 rounded-xl text-ink-secondary text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:uppercase file:bg-brand-500/10 file:text-brand-600 dark:file:text-brand-400 hover:file:bg-brand-500/20" />
                  </div>
                </div>
              )}

              {/* TEST MODE — Sample cards */}
              {testMode && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">
                      2 — Select Sample Document
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Handwritten */}
                      <div onClick={() => setSelectedSample('handwritten')}
                        className={`relative p-4 rounded-2xl border cursor-pointer transition-all duration-slow group overflow-hidden ${
                          selectedSample === 'handwritten'
                            ? 'border-brand-500 bg-brand-500/[0.03] ring-2 ring-brand-500/20 shadow-xl '
                            : 'border-line dark:border-white/[0.06] hover:border-line dark:hover:border-white/20'
                        }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className={`text-xs font-bold uppercase tracking-wide mb-0.5 ${selectedSample === 'handwritten' ? 'text-brand-600 dark:text-brand-400' : 'text-ink'}`}>
                              Handwritten Cash Bill
                            </div>
                            <p className="text-2xs text-ink-muted">Scribbled paper order note with ink pen text</p>
                          </div>
                          {selectedSample === 'handwritten' && <CheckCircle2 size={15} className="text-brand-500 shrink-0 animate-bounce mt-0.5" />}
                        </div>
                        {/* paper preview */}
                        <div className="relative mt-2 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/50 shadow-md font-serif italic text-blue-900 dark:text-blue-200 text-3xs select-none">
                          <div className="absolute left-3 top-0 bottom-0 w-px bg-red-300/60 dark:bg-red-900/50" />
                          <div className="pl-2 space-y-1">
                            <div className="flex justify-between font-bold border-b border-amber-200 dark:border-amber-900 pb-1">
                              <span>Cash Memo #9921</span>
                              <span className="not-italic text-4xs font-sans text-red-600 border border-red-500 px-1 rounded uppercase">PAID</span>
                            </div>
                            <div className="space-y-0.5 pt-1">
                              <div className="flex justify-between"><span>2× Basmati Rice 5kg</span><span>$37.00</span></div>
                              <div className="flex justify-between"><span>1× Cooking Oil 3L</span><span>$22.00</span></div>
                              <div className="flex justify-between"><span>5× Brown Sugar 1kg</span><span>$16.00</span></div>
                            </div>
                            <div className="border-t border-amber-300 dark:border-amber-800 pt-1 text-right font-bold text-2xs text-blue-950 dark:text-blue-100">Total: $75.00</div>
                          </div>
                        </div>
                      </div>

                      {/* Printed POS */}
                      <div onClick={() => setSelectedSample('printed')}
                        className={`relative p-4 rounded-2xl border cursor-pointer transition-all duration-slow group overflow-hidden ${
                          selectedSample === 'printed'
                            ? 'border-brand-500 bg-brand-500/[0.03] ring-2 ring-brand-500/20 shadow-xl '
                            : 'border-line dark:border-white/[0.06] hover:border-line dark:hover:border-white/20'
                        }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className={`text-xs font-bold uppercase tracking-wide mb-0.5 ${selectedSample === 'printed' ? 'text-brand-600 dark:text-brand-400' : 'text-ink'}`}>
                              Printed POS Receipt
                            </div>
                            <p className="text-2xs text-ink-muted">Thermal cash register slip with barcode</p>
                          </div>
                          {selectedSample === 'printed' && <CheckCircle2 size={15} className="text-brand-500 shrink-0 animate-bounce mt-0.5" />}
                        </div>
                        <div className="mt-2 p-3 bg-white dark:bg-raised text-ink rounded-lg border border-line shadow-md font-mono text-4xs select-none">
                          <div className="text-center font-bold border-b border-dashed border-line pb-1">
                            METRO HYPERMARKET
                            <div className="text-[7px] font-normal text-ink-muted">Reg #04 • {new Date().toISOString().slice(0,10)}</div>
                          </div>
                          <div className="space-y-0.5 py-1">
                            <div className="flex justify-between"><span>3× OPTICAL MOUSE</span><span>$45.00</span></div>
                            <div className="flex justify-between"><span>2× USBC CHARGER</span><span>$59.80</span></div>
                            <div className="flex justify-between"><span>1× BT EARBUDS</span><span>$89.00</span></div>
                          </div>
                          <div className="border-t border-dashed border-line pt-1 flex justify-between font-bold">
                            <span>SUBTOTAL:</span><span>$193.80</span>
                          </div>
                          <div className="text-center text-[6px] text-ink-muted mt-1 tracking-widest">|||| | ||||| |||| | ||</div>
                        </div>
                      </div>

                      {/* Digital PDF */}
                      <div onClick={() => setSelectedSample('digital')}
                        className={`relative p-4 rounded-2xl border cursor-pointer transition-all duration-slow group overflow-hidden ${
                          selectedSample === 'digital'
                            ? 'border-brand-500 bg-brand-500/[0.03] ring-2 ring-brand-500/20 shadow-xl '
                            : 'border-line dark:border-white/[0.06] hover:border-line dark:hover:border-white/20'
                        }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className={`text-xs font-bold uppercase tracking-wide mb-0.5 ${selectedSample === 'digital' ? 'text-brand-600 dark:text-brand-400' : 'text-ink'}`}>
                              Digital PDF Invoice
                            </div>
                            <p className="text-2xs text-ink-muted">Structured vector PDF supplier invoice</p>
                          </div>
                          {selectedSample === 'digital' && <CheckCircle2 size={15} className="text-brand-500 shrink-0 animate-bounce mt-0.5" />}
                        </div>
                        <div className="mt-2 p-3 bg-surface text-ink rounded-lg border border-line shadow-md text-4xs select-none">
                          <div className="flex justify-between items-start border-b border-brand-500/30 pb-1.5 mb-1.5">
                            <div>
                              <div className="font-bold text-brand-600 dark:text-brand-400 text-3xs">GLOBAL TECH SUPPLIES</div>
                              <div className="text-[7px] text-ink-muted">INV-88490</div>
                            </div>
                            <span className="bg-brand-500/10 text-brand-600 dark:text-brand-300 text-[6px] font-bold px-1.5 py-0.5 rounded">PDF/A</span>
                          </div>
                          <div className="space-y-0.5 text-ink-secondary">
                            <div className="flex justify-between"><span>Enterprise Server Rack 12U</span><span>$499</span></div>
                            <div className="flex justify-between"><span>Cat6 Ethernet Cable (300m)</span><span>$250</span></div>
                            <div className="flex justify-between"><span>Gigabit Switch 24-Port</span><span>$180</span></div>
                          </div>
                          <div className="border-t border-line mt-1.5 pt-1 flex justify-between font-bold text-brand-600 dark:text-brand-400">
                            <span>GRAND TOTAL:</span><span>$929</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Logo selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">
                      3 — Select Sample Branding Logo
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {LOGOS.map((logo) => (
                        <div key={logo.id} onClick={() => setSelectedLogo(logo.id)}
                          className={`p-3.5 rounded-xl border text-center cursor-pointer transition-all duration-normal flex flex-col items-center justify-center gap-1.5 ${
                            selectedLogo === logo.id
                              ? 'border-brand-500 bg-brand-500/[0.04] shadow-md ring-1 ring-brand-500/30'
                              : 'border-line dark:border-white/[0.04] hover:border-line dark:hover:border-white/10'
                          }`}>
                          <div className="p-2 rounded-lg bg-surface dark:bg-white/5 border border-line dark:border-white/5">
                            {logo.symbol}
                          </div>
                          <span className={`text-2xs font-bold uppercase tracking-wider ${selectedLogo === logo.id ? 'text-brand-600 dark:text-brand-400' : 'text-ink-secondary'}`}>
                            {logo.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {errors.length > 0 && (
                <div className="p-4 bg-red-500/5 border border-red-500/20 text-red-600 dark:text-red-300 text-xs font-bold rounded-xl space-y-1">
                  {errors.map((err, i) => <p key={i}>{err}</p>)}
                </div>
              )}

              <button type="submit"
                className={`w-full py-4 font-bold rounded-2xl transition text-white shadow-xl flex items-center justify-center gap-2.5 text-sm uppercase tracking-wider ${
                  testMode
                    ? 'bg-gradient-to-r from-brand-600 to-brand-600 hover:from-brand-500 hover:to-brand-500 '
                    : 'bg-gradient-brand hover:opacity-90 '
                }`}>
                <Sparkles size={15} />
                <span>{testMode ? 'Run AI Demo Scan (Free)' : 'Upload & Scan with AI'}</span>
                <ArrowRight size={14} />
              </button>

              {testMode && (
                <p className="text-center text-2xs text-ink-muted -mt-3">
                  Demo mode is 100% free — no account needed, no API credits consumed.
                  {''}<span className="text-brand-500 font-bold">5 free live scans/month</span> when you sign up.
                </p>
              )}
            </form>
          </div>
        )}

        {/* ── LOADING ───────────────────────────────────────────────────────── */}
        {loading && (
          <div className="relative rounded-2xl border border-brand-500/20 bg-gradient-hero p-10 overflow-hidden flex flex-col items-center justify-center gap-5 min-h-[260px]">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent animate-[shimmer_2s_linear_infinite]" />
            </div>
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                <ScanLine className="w-7 h-7 text-brand-400 animate-pulse" />
              </div>
              <div className="absolute -inset-2 rounded-2xl border border-brand-500/20 animate-ping opacity-30" />
            </div>
            <div className="text-center">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">AI Scanning Document…</h4>
              <p className="text-xs text-ink-muted">Extracting line items, prices, quantities and totals</p>
            </div>
          </div>
        )}

        {/* ── EMAIL GATE (live mode) ────────────────────────────────────────── */}
        {scanTriggered && !testMode && !emailSubmitted && !resultLoaded && !loading && (
          <div className="relative rounded-2xl overflow-hidden border border-line dark:border-white/10 bg-surface p-6 md:p-8">
            <div className="filter blur-sm opacity-25 select-none pointer-events-none space-y-4 mb-4">
              <div className="flex justify-between">
                <div className="w-24 h-8 bg-sunken rounded" />
                <div className="w-32 h-6 bg-sunken rounded" />
              </div>
              <div className="h-px bg-sunken dark:bg-surface" />
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-4 bg-sunken rounded w-full" />)}
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="w-full max-w-md bg-surface border border-line dark:border-white/10 rounded-2xl p-8 shadow-2xl text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-ink mb-2">Unlock Your Scan Results</h3>
                <p className="text-xs text-ink-muted leading-relaxed mb-6">
                  Your document has been prepared. Enter your work email to trigger the AI extraction and reveal the full structured data.
                </p>
                <form onSubmit={handleRevealResults} className="space-y-3">
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-4 py-3 bg-app border border-line dark:border-white/10 rounded-xl text-ink focus:outline-none focus:border-emerald-500 transition-all text-sm text-center" />
                  {errors.length > 0 && (
                    <div className="p-3 bg-red-500/5 border border-red-500/20 text-red-600 dark:text-red-300 text-2xs font-bold rounded-lg">
                      {errors.map((e, i) => <p key={i}>{e}</p>)}
                    </div>
                  )}
                  <button type="submit"
                    className="w-full py-3.5 bg-gradient-brand hover:opacity-90 font-bold rounded-xl transition text-white shadow-lg flex items-center justify-center gap-2 text-xs uppercase tracking-wider">
                    <Sparkles size={13} /> Trigger AI Scan & Reveal
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ── RESULT WORKSPACE ─────────────────────────────────────────────── */}
        {resultLoaded && !loading && (
          <div className="space-y-5">

            {/* status bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-brand-500/10 to-brand-500/10 border border-brand-500/20">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                  <Sparkles size={13} className="text-brand-500 animate-pulse" />
                </div>
                <div>
                  <div className="text-xs font-bold text-ink">
                    {testMode ? 'Smart Capture Demo — Editable Workspace' : `AI Scan Complete · ${email}`}
                  </div>
                  <div className="text-2xs text-ink-muted">Click any field below to edit it. What you see is exactly what downloads.</div>
                </div>
              </div>
              <button type="button" onClick={handleReset}
                className="px-3 py-1.5 rounded-lg text-2xs font-bold uppercase tracking-wider text-ink-secondary hover:bg-white/10 border border-line dark:border-white/10 transition-colors">
                ↺ Scan Another
              </button>
            </div>

            {/* Slim control bar */}
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-sunken dark:bg-white/[0.03] border border-line dark:border-white/10">
              <div className="w-40"><Select value={meta.template} onChange={(v) => setMeta((m) => ({ ...m, template: v }))} options={templateOptions} /></div>
              <div className="w-36"><Select value={meta.currency} onChange={(v) => setMeta((m) => ({ ...m, currency: v }))} options={currencyOptions} /></div>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-white/[0.04] border border-line dark:border-white/10">
                <button type="button" onClick={() => setMeta((m) => ({ ...m, orientation: 'portrait' }))}
                  className={`px-2.5 py-1.5 rounded-lg text-1xs font-bold transition-colors ${meta.orientation === 'portrait' ? 'bg-accent-fill text-accent-on' : 'text-ink-muted'}`}>Portrait</button>
                <button type="button" onClick={() => setMeta((m) => ({ ...m, orientation: 'landscape' }))}
                  className={`px-2.5 py-1.5 rounded-lg text-1xs font-bold transition-colors ${meta.orientation === 'landscape' ? 'bg-accent-fill text-accent-on' : 'text-ink-muted'}`}>Landscape</button>
              </div>
              {isModern && (
                <div className="flex items-center gap-1.5">
                  {ACCENT_PRESETS.map((c) => (
                    <button key={c} type="button" onClick={() => setMeta((m) => ({ ...m, accent_color: c }))}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${meta.accent_color === c ? 'scale-110 border-neutral-900 dark:border-white' : 'border-transparent'}`}
                      style={{ background: c }} />
                  ))}
                </div>
              )}
              <button type="button" onClick={() => logoInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-line dark:border-white/10 text-xs font-bold text-ink-secondary hover:border-brand-400/40 transition-colors">
                <Upload size={13} /> {company.logo_base64 ? 'Change logo' : 'Add logo'}
              </button>
              {company.logo_base64 && (
                <button type="button" onClick={() => setCompany((c) => ({ ...c, logo_base64: null }))}
                  className="text-xs font-bold text-ink-muted hover:text-red-500 transition-colors">Remove logo</button>
              )}
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              <div className="ml-auto">
                <button type="button" onClick={generatePdf} disabled={generatingPdf}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-accent-fill text-accent-on hover:bg-accent-fill-hover rounded-xl text-xs font-bold uppercase tracking-wide transition-transform disabled:opacity-50">
                  {generatingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  {generatingPdf ? 'Generating…' : 'Download PDF'}
                </button>
              </div>
            </div>

            {errors.length > 0 && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5">
                <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                <div className="text-sm text-red-600 dark:text-red-400">{errors.map((e, i) => <p key={i}>{e}</p>)}</div>
              </div>
            )}

            {/* THE DOCUMENT — identical to Invoice.jsx */}
            <div className={`rounded-2xl overflow-hidden shadow-xl shadow-neutral-900/10 dark:shadow-black/40 border border-line dark:border-white/10 bg-white mx-auto transition-[max-width] ${meta.orientation === 'landscape' ? 'max-w-4xl' : 'max-w-2xl'}`}>
              {isModern && <div className="h-3 w-full" style={{ background: accent }} />}
              <div className={`p-6 sm:p-10 text-ink ${isCompact ? 'text-[13px]' : 'text-sm'}`} style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>

                {/* Header */}
                <div className={`flex flex-col sm:flex-row justify-between gap-6 mb-8 ${isClassic ? 'border-b-2 border-neutral-900 pb-4' : ''}`}>
                  <div>
                    {company.logo_base64 && <img src={company.logo_base64} alt="Logo" className="h-12 max-w-[160px] object-contain mb-2" />}
                    <EditableText value={company.name} onChange={(v) => setCompany((c) => ({ ...c, name: v }))} placeholder="Your business name" inline={false} className="text-lg font-bold mb-0.5" />
                    <EditableText value={company.address} onChange={(v) => setCompany((c) => ({ ...c, address: v }))} placeholder="Business address" as="textarea" rows={2} inline={false} className="text-ink-muted text-xs mt-1 mb-0.5 max-w-xs" />
                    <div className="flex flex-wrap gap-x-3 text-xs text-ink-muted mt-1">
                      <EditableText value={company.email} onChange={(v) => setCompany((c) => ({ ...c, email: v }))} placeholder="email@business.com" />
                      <EditableText value={company.phone} onChange={(v) => setCompany((c) => ({ ...c, phone: v }))} placeholder="Phone number" />
                    </div>
                    <div className="text-xs text-ink-muted mt-0.5">
                      Tax ID: <EditableText value={company.tax_id} onChange={(v) => setCompany((c) => ({ ...c, tax_id: v }))} placeholder="optional" />
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-2xl font-bold tracking-tight" style={{ color: isModern ? accent : 'rgb(var(--vq-slate-900))' }}>INVOICE</div>
                    <div className="mt-2 text-xs space-y-0.5">
                      <div className="flex sm:justify-end gap-2"><span className="text-ink-muted">Invoice #</span><EditableText value={meta.invoice_number} onChange={(v) => setMeta((m) => ({ ...m, invoice_number: v }))} className="font-bold" /></div>
                      <div className="flex sm:justify-end gap-2"><span className="text-ink-muted">Issue date</span><EditableText as="date" value={meta.issue_date} onChange={(v) => setMeta((m) => ({ ...m, issue_date: v }))} /></div>
                      <div className="flex sm:justify-end gap-2"><span className="text-ink-muted">Due date</span><EditableText as="date" value={meta.due_date} onChange={(v) => setMeta((m) => ({ ...m, due_date: v }))} emptyLabel="—" /></div>
                    </div>
                  </div>
                </div>

                {/* Bill to */}
                <div className="mb-6">
                  <p className="text-2xs font-bold uppercase tracking-widest text-ink-muted mb-1">Bill To</p>
                  <EditableText value={client.name} onChange={(v) => setClient((c) => ({ ...c, name: v }))} placeholder="Client name" inline={false} className="font-bold mb-0.5" />
                  <EditableText value={client.address} onChange={(v) => setClient((c) => ({ ...c, address: v }))} placeholder="Client address" as="textarea" rows={2} inline={false} className="text-ink-muted text-xs mb-0.5" />
                  <EditableText value={client.email} onChange={(v) => setClient((c) => ({ ...c, email: v }))} placeholder="Client email (optional)" inline={false} className="text-ink-muted text-xs" />
                </div>

                {/* Line items */}
                <table className="w-full mb-2">
                  <thead>
                    <tr className={`text-left text-2xs font-bold uppercase tracking-wide text-ink-muted ${isClassic ? 'border-b-2 border-neutral-900' : 'border-b border-neutral-900'}`}>
                      <th className="pb-2 pr-2"><EditableText value={headers.description} onChange={(v) => setHeaders((h) => ({ ...h, description: v }))} pulse={false} className="text-2xs font-bold uppercase tracking-wide text-ink-muted" /></th>
                      <th className="pb-2 px-2 text-right w-16"><EditableText value={headers.quantity} onChange={(v) => setHeaders((h) => ({ ...h, quantity: v }))}   pulse={false} className="text-2xs font-bold uppercase tracking-wide text-ink-muted text-right" /></th>
                      <th className="pb-2 px-2 text-right w-24"><EditableText value={headers.unit_price} onChange={(v) => setHeaders((h) => ({ ...h, unit_price: v }))} pulse={false} className="text-2xs font-bold uppercase tracking-wide text-ink-muted text-right" /></th>
                      <th className="pb-2 px-2 text-right w-16"><EditableText value={headers.discount} onChange={(v) => setHeaders((h) => ({ ...h, discount: v }))}   pulse={false} className="text-2xs font-bold uppercase tracking-wide text-ink-muted text-right" /></th>
                      <th className="pb-2 px-2 text-right w-16"><EditableText value={headers.tax} onChange={(v) => setHeaders((h) => ({ ...h, tax: v }))}        pulse={false} className="text-2xs font-bold uppercase tracking-wide text-ink-muted text-right" /></th>
                      <th className="pb-2 pl-2 text-right w-24"><EditableText value={headers.amount} onChange={(v) => setHeaders((h) => ({ ...h, amount: v }))}     pulse={false} className="text-2xs font-bold uppercase tracking-wide text-ink-muted text-right" /></th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className="border-b border-line group">
                        <td className="py-2 pr-2"><EditableText value={item.description} onChange={(v) => updateItem(idx, 'description', v)} placeholder="Item description" className="block" /></td>
                        <td className="py-2 px-2 text-right"><EditableText as="number" min="0" value={item.quantity} onChange={(v) => updateItem(idx, 'quantity', v)} className="text-right w-12" /></td>
                        <td className="py-2 px-2 text-right"><EditableText as="number" min="0" value={item.unit_price} onChange={(v) => updateItem(idx, 'unit_price', v)} formatDisplay={fmtMoney} className="text-right w-16" /></td>
                        <td className="py-2 px-2 text-right"><EditableText as="number" min="0" max="100" value={item.discount_pct} onChange={(v) => updateItem(idx, 'discount_pct', v)} formatDisplay={(v) => (v > 0 ? `${v}%` : '—')} className="text-right w-12" /></td>
                        <td className="py-2 px-2 text-right"><EditableText as="number" min="0" value={item.tax_rate} onChange={(v) => updateItem(idx, 'tax_rate', v)} formatDisplay={(v) => (v > 0 ? `${v}%` : '—')} className="text-right w-12" /></td>
                        <td className="py-2 pl-2 text-right font-bold">{fmtMoney(lineTotals[idx]?.lineTotal)}</td>
                        <td className="py-2 pl-1 text-right">
                          <button type="button" onClick={() => removeItem(idx)} disabled={items.length === 1}
                            className="opacity-0 group-hover:opacity-100 text-ink-muted hover:text-red-500 disabled:opacity-0 transition-opacity"><Trash2 size={13} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <button type="button" onClick={addItem}
                  className="flex items-center gap-1 text-xs font-bold text-ink-muted hover:text-brand-500 transition-colors mb-6">
                  <Plus size={12} /> Add line item
                </button>

                {/* Totals */}
                <div className="flex justify-end mb-8">
                  <div className="w-56 space-y-1 text-sm">
                    <div className="flex justify-between text-ink-muted"><span>Subtotal</span><span>{fmtMoney(totals.subtotal)}</span></div>
                    {totals.discount > 0 && <div className="flex justify-between text-ink-muted"><span>Discount</span><span>-{fmtMoney(totals.discount)}</span></div>}
                    {totals.tax > 0 && <div className="flex justify-between text-ink-muted"><span>Tax</span><span>{fmtMoney(totals.tax)}</span></div>}
                    <div className="flex justify-between font-bold text-base pt-1.5 border-t-2 border-neutral-900" style={{ color: isModern ? accent : 'rgb(var(--vq-slate-900))' }}>
                      <span>Total Due</span><span>{fmtMoney(grandTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes / terms */}
                <div className="grid sm:grid-cols-2 gap-6 text-xs text-ink-muted">
                  <div>
                    <p className="font-bold text-ink-secondary mb-1">Notes</p>
                    <EditableText value={meta.notes} onChange={(v) => setMeta((m) => ({ ...m, notes: v }))} placeholder="Add a note (optional)" as="textarea" rows={2} className="block" />
                  </div>
                  <div>
                    <p className="font-bold text-ink-secondary mb-1">Payment Terms</p>
                    <EditableText value={meta.terms} onChange={(v) => setMeta((m) => ({ ...m, terms: v }))} placeholder="e.g. Net 14" as="textarea" rows={2} className="block" />
                  </div>
                </div>

                <p className="text-center text-2xs text-ink-muted mt-10">Generated via Smart Capture AI at venqore.com — no signup, no watermark.</p>
              </div>
            </div>

            <p className="text-center text-xs text-ink-muted">
              This preview matches your downloaded PDF — click anything above to edit it.
            </p>
          </div>
        )}

        {/* ── ERP COMPARISON ────────────────────────────────────────────────── */}
        <div className="space-y-5 pt-6 border-t border-line dark:border-white/[0.04]">
          <div className="text-center">
            <span className="inline-block px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-2xs font-bold uppercase tracking-wider mb-3">
              Standalone vs. ERP Integrated
            </span>
            <h3 className="text-xl font-bold text-ink">
              Why use Smart Capture inside VenQore ERP?
            </h3>
            <p className="text-xs text-ink-muted mt-2 max-w-xl mx-auto leading-relaxed">
              The standalone tool digitizes your documents. The integrated version connects every scan to your live inventory, accounts, and suppliers — automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Standalone */}
            <div className="p-6 rounded-2xl border border-line dark:border-white/[0.05] bg-neutral-500/[0.01]">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-sunken dark:bg-white/5 flex items-center justify-center">
                  <FileSearch className="w-4 h-4 text-ink-muted" />
                </div>
                <h4 className="text-xs font-bold text-ink-secondary uppercase tracking-wide">Standalone (This Tool)</h4>
              </div>
              <ul className="space-y-2.5 text-xs text-ink-muted">
                {[
                  'Extracts data into an editable PDF workspace',
                  'Download professional invoice/receipt PDF',
                  'No live database matching or SKU linking',
                  'Does not post to ledgers or adjust stock',
                  '5 free pages per month — no account needed',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-sunken dark:bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sunken" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Integrated */}
            <div className="relative p-6 rounded-2xl border border-brand-500/30 bg-gradient-to-br from-brand-500/[0.03] to-brand-500/[0.03] overflow-hidden">
              <div className="absolute top-0 right-0 px-2.5 py-1 bg-brand-500/10 text-brand-600 dark:text-brand-400 text-3xs font-bold uppercase tracking-widest rounded-bl-xl">
                ✦ Recommended
              </div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                  <Database className="w-4 h-4 text-brand-500" />
                </div>
                <h4 className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wide">VenQore ERP Integrated</h4>
              </div>
              <ul className="space-y-2.5 text-xs text-ink-secondary">
                {[
                  ['Live SKU Autocomplete — matches items to your product catalog & barcodes', true],
                  ['Supplier Account Validation — checks credit terms, tax schemes, vendor IDs', true],
                  ['One-Click Ledger Posting — directly credits payables and debits inventory', true],
                  ['Private API — enterprise DPA, zero training on your data, GDPR compliant', true],
                  ['Unlimited scans included in your VenQore subscription', true],
                ].map(([item, check], i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                    <span><strong className="font-bold">{String(item).split('—')[0]}</strong>{String(item).includes('—') ? `— ${String(item).split('—')[1]}` : ''}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register"
                className="mt-5 flex items-center justify-center gap-2 w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-md ">
                Get Smart Capture in your ERP <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* ── PRICING TIERS ─────────────────────────────────────────────────── */}
        <div className="space-y-5 pt-6 border-t border-line dark:border-white/[0.04]">
          <div className="text-center max-w-xl mx-auto">
            <span className="inline-block px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-2xs font-bold uppercase tracking-wider mb-3">
              Standalone Scan Credit Plans
            </span>
            <h3 className="text-xl font-bold text-ink">Need more than 5 pages a month?</h3>
            <p className="text-xs text-ink-muted mt-2 leading-relaxed">
              Buy standalone scan credits. All paid tiers use a private, non-training API endpoint with your data fully protected.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Spark', pages: 500,  price: '$3', desc: 'Perfect for small stores', popular: false },
              { name: 'Shop', pages: 1000, price: '$6', desc: 'Most popular — growing businesses', popular: true  },
              { name: 'Pro', pages: 2000, price: '$12', desc: 'For scaling multi-location operations', popular: false },
              { name: 'Max', pages: 4000, price: '$24', desc: 'Enterprise-volume processing', popular: false },
            ].map((plan) => (
              <div key={plan.name}
                className={`relative p-5 rounded-2xl border flex flex-col justify-between transition-all ${
                  plan.popular
                    ? 'border-brand-500 bg-gradient-to-b from-brand-500/[0.04] to-transparent shadow-[0_0_40px_rgba(139,92,246,0.08)]'
                    : 'border-line dark:border-white/[0.05] bg-neutral-500/[0.01] hover:border-line dark:hover:border-white/10'
                }`}>
                {plan.popular && (
                  <div className="absolute -top-px inset-x-4 h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent" />
                )}
                <div>
                  {plan.popular && (
                    <div className="inline-block mb-3 px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-3xs font-bold uppercase tracking-wider">
                      ★ Most Popular
                    </div>
                  )}
                  <h4 className="text-sm font-bold text-ink uppercase tracking-wide">{plan.name}</h4>
                  <p className="text-2xs text-ink-muted mt-0.5">{plan.desc}</p>
                  <div className="my-4">
                    <span className="text-3xl font-bold text-ink">{plan.price}</span>
                    <span className="text-xs text-ink-muted">/month</span>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-sunken/50 dark:bg-black/20 text-center">
                    <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{plan.pages.toLocaleString()} pages</span>
                    <span className="text-2xs text-ink-muted ml-1">per month</span>
                  </div>
                </div>
                <Link href="/register"
                  className={`mt-5 block w-full py-2.5 rounded-xl text-2xs font-bold uppercase tracking-wider text-center transition ${
                    plan.popular
                      ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-md '
                      : 'bg-sunken dark:bg-white/10 hover:bg-interactive-hover dark:hover:bg-white/20 text-ink-secondary dark:text-white'
                  }`}>
                  Get Started
                </Link>
              </div>
            ))}
          </div>

          {/* top-up strip */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-neutral-950 border border-white/[0.06]">
            <div className="flex items-center gap-3 text-sm text-ink-muted">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Ran out of pages mid-month? Get a <strong className="text-white">200-page top-up for just $2.00</strong> — no plan change needed.
              </span>
            </div>
            <Link href="/register" className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-2xs font-bold uppercase tracking-wider rounded-xl transition">
              Get Top-Up
            </Link>
          </div>
        </div>

      </div>
    </ToolShell>
  );
}
