import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useRef, useMemo } from "react";
import { Link } from "@inertiajs/react";
import ToolShell from "./ToolShell-zAP3LLHC.js";
import Select from "./Select-BvHKwZfu.js";
import EditableText from "./EditableText-CAR9rgbH.js";
import { ScanLine, Clock, FileText, Globe, Upload, Brain, Download, ChevronRight, CheckCircle2, Sparkles, ArrowRight, Lock, Loader2, AlertCircle, Trash2, Plus, FileSearch, Database, Check, Zap, Store, Truck, Cpu } from "lucide-react";
import "./MarketingLayout-cwTDSbNB.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "axios";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "./CookieConsent-DgIWvNoO.js";
import "motion/react";
import "./SiteChrome-CBP-bGRL.js";
import "./ToolsSidebar-UoByrcvz.js";
import "./HousePromo-DidRidkH.js";
const ACCENT_PRESETS = ["#4f46e5", "#0ea5e9", "#059669", "#d97706", "#dc2626", "#7c3aed"];
const TEMPLATES = {
  clean: { name: "Clean", description: "Minimalist white template" },
  modern: { name: "Modern", description: "Accent color band at top" },
  classic: { name: "Classic", description: "Bordered table format" },
  compact: { name: "Compact", description: "Dense layout for many items" }
};
const CURRENCIES = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "CA$",
  AUD: "A$",
  PKR: "Rs",
  INR: "₹",
  AED: "AED",
  SAR: "SAR",
  JPY: "¥"
};
const emptyItem = () => ({ description: "", quantity: 1, unit_price: 0, tax_rate: 0, discount_pct: 0 });
const FAQS = [
  {
    q: "What is Smart Capture AI and how does it work?",
    a: "Smart Capture AI is a document intelligence tool powered by Google Gemini that automatically reads and extracts structured data from physical and digital documents — invoices, receipts, purchase orders, handwritten bills, credit notes, and more. You upload the file; the AI identifies line items, quantities, pricing, vendor details, tax amounts, and totals, then populates an editable invoice workspace you can download as a professional PDF."
  },
  {
    q: "What types of documents can Smart Capture parse?",
    a: "Smart Capture handles a wide variety of business documents: vendor purchase invoices, customer invoices, thermal POS receipts, handwritten cash memos and order slips, digital PDF supplier bills, quotations, packing slips, credit notes, and purchase orders. It works with typed text, printed text, and handwritten content across all of these formats."
  },
  {
    q: "Does Smart Capture work on handwritten documents?",
    a: "Yes. Smart Capture AI can extract data from handwritten invoices, cash memos, and order notes with high accuracy. The underlying Gemini model is trained across millions of document types and handles varied handwriting styles in English and several other languages. Results are always shown in an editable workspace so you can correct any extraction before downloading."
  },
  {
    q: "What file formats are accepted for upload?",
    a: "Smart Capture accepts JPEG and PNG image files (photographs of documents, scanned pages) and PDF files. A single page of a PDF or a single image counts as one scan. Multi-page PDFs are parsed page-by-page up to a maximum of 5 pages per upload. Files larger than 20 MB are rejected — compress or split large PDFs before uploading."
  },
  {
    q: "How are pages and scans counted against my monthly allowance?",
    a: "One scan credit equals one page. A single-image upload = 1 credit. A two-page PDF = 2 credits. A 5-page PDF = 5 credits (the maximum per submission). The free public tier gives you 5 pages per month. Paid tiers start from 500 pages/month. Inside the VenQore ERP integrated plan, scans are included in your platform subscription without page counting."
  },
  {
    q: "What is the difference between Standalone and ERP-Integrated Smart Capture?",
    a: "Standalone Smart Capture extracts raw data into an editable PDF workspace — ideal for individuals and businesses that need quick document digitization. ERP-Integrated Smart Capture goes further: it matches extracted line items to your live product catalog and SKUs, validates vendor details against your supplier accounts, posts confirmed bills directly to your FIFO double-entry ledger, and adjusts stock levels automatically — with zero manual data entry."
  },
  {
    q: "Is my uploaded document data stored or used to train AI models?",
    a: "Documents processed through the free public tier use Google Gemini's free-tier API, which may be used to improve Google's AI systems in accordance with Google's standard API terms — this is industry-standard practice shared across most free AI-powered tools. Documents processed through the VenQore ERP integrated plan use a private, enterprise-grade API endpoint with data processing agreements (DPA) that explicitly prohibit training use. Your data is never stored on VenQore servers beyond the single request processing window."
  },
  {
    q: "What accuracy can I expect from AI extraction?",
    a: "Accuracy varies by document quality and type. Clean digital PDFs typically achieve 95–99% field-level accuracy. Printed thermal receipts: 90–97%. Clear handwritten documents: 80–93%. Damaged, low-resolution, or heavily stylized documents may extract with lower accuracy. The editable workspace is specifically designed to make correction fast — you review, click to fix any field, then download. The AI handles 90%+ of the data entry so you only correct the edge cases."
  },
  {
    q: "Can Smart Capture handle documents in multiple languages?",
    a: "Smart Capture processes documents in English, Urdu, Arabic, Hindi, French, Spanish, German, and several other widely-used languages for field extraction. Currency symbol and number format detection is universal. For non-Latin scripts, accuracy is highest when the document is clearly printed (digital or laser-printed) rather than handwritten."
  },
  {
    q: "How many free scans do I get per month?",
    a: "The free public tier provides 5 scan pages per month — completely free to try, no signup needed for the test/demo mode. If you create a VenQore account, your 5 free pages reset automatically on the 1st of each month. If you need more volume, paid standalone scan credit tiers start from 500 pages/month at $3.00. Inside the VenQore ERP subscription, scans are included with no separate page count."
  },
  {
    q: "Can I download the extracted document as a PDF?",
    a: "Yes — once Smart Capture has populated the document workspace, you can select a template (Clean, Modern, Classic, or Compact), pick your currency, adjust any field inline, and then click Download PDF. The PDF is generated server-side and streamed directly to your browser. There is no watermark on any downloaded file, and no data is retained on our servers after the PDF is generated."
  },
  {
    q: "Does Smart Capture integrate with my existing accounting software?",
    a: "Standalone Smart Capture produces a downloadable PDF only — it does not connect to third-party accounting systems. VenQore ERP Integrated Smart Capture, however, connects directly to VenQore's double-entry accounting engine, posting validated purchase bills to your payables ledger and crediting the correct expense or inventory accounts automatically. Integration with QuickBooks, Xero, and other platforms is available through VenQore's sync module."
  },
  {
    q: "Is Smart Capture available on mobile devices?",
    a: "Yes. The Smart Capture interface is fully responsive and works on smartphones and tablets. You can photograph a paper receipt with your phone camera, upload it directly through the mobile browser, and receive extracted data in the editable workspace within seconds. For best results, ensure good lighting and that the entire document is in frame before photographing."
  },
  {
    q: "What security measures protect my documents during upload?",
    a: "All uploads are transmitted over HTTPS/TLS 1.3 encrypted connections. Files are processed in memory only and are not written to persistent storage. The free tier uses Google's Gemini API over an encrypted channel. The ERP integrated tier uses a private API endpoint covered by a Data Processing Agreement (DPA). VenQore does not share uploaded document data with any third party beyond the designated AI processing endpoint."
  },
  {
    q: "How does Smart Capture compare to manual data entry or OCR tools?",
    a: `Traditional OCR tools extract raw text — they don't understand the semantic structure of a document. Smart Capture uses a large multimodal language model that understands context: it knows that a number next to "Qty" means quantity, that a string like "2026-08-10" is a date, and that a line item table has descriptions, units, and prices. This delivers structured, ready-to-use data — not a raw text dump you then have to parse yourself. Compared to manual data entry, Smart Capture is typically 10–20x faster for multi-line invoices.`
  }
];
function SmartCapture({ turnstileSiteKey, toolGroups = [] }) {
  const [testMode, setTestMode] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [file, setFile] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [docType, setDocType] = useState("purchase");
  const [loading, setLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [resultLoaded, setResultLoaded] = useState(false);
  const [errors, setErrors] = useState([]);
  const [scanTriggered, setScanTriggered] = useState(false);
  const [selectedSample, setSelectedSample] = useState("handwritten");
  const [selectedLogo, setSelectedLogo] = useState("apex");
  const logoInputRef = useRef(null);
  const LOGOS = [
    { id: "apex", name: "Apex Retail", color: "rgb(var(--vq-emerald-500))", symbol: /* @__PURE__ */ jsx(Store, { className: "w-5 h-5 text-emerald-500" }) },
    { id: "nova", name: "Nova Logistics", color: "rgb(var(--vq-amber-500))", symbol: /* @__PURE__ */ jsx(Truck, { className: "w-5 h-5 text-amber-500" }) },
    { id: "quantum", name: "Quantum Tech", color: "rgb(var(--vq-violet-500))", symbol: /* @__PURE__ */ jsx(Cpu, { className: "w-5 h-5 text-brand-500" }) }
  ];
  const [company, setCompany] = useState({ name: "", address: "", email: "", phone: "", tax_id: "", logo_base64: null });
  const [client, setClient] = useState({ name: "", address: "", email: "" });
  const [items, setItems] = useState([
    { description: "Wireless Optical Mouse", quantity: 3, unit_price: 15, tax_rate: 5, discount_pct: 0 },
    { description: "USB-C Fast Charger Hub", quantity: 2, unit_price: 29.9, tax_rate: 5, discount_pct: 10 }
  ]);
  const [meta, setMeta] = useState({
    invoice_number: "INV-2026-8849",
    issue_date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
    due_date: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10),
    currency: "USD",
    notes: "Generated via Smart Capture AI workspace. Click any field to edit.",
    terms: "Payment is due within 14 days of issue date.",
    template: "clean",
    accent_color: "rgb(var(--vq-indigo-600))",
    orientation: "portrait"
  });
  const [headers, setHeaders] = useState({
    description: "Description",
    quantity: "Qty",
    unit_price: "Unit Price",
    discount: "Disc.",
    tax: "Tax",
    amount: "Amount"
  });
  const symbol = CURRENCIES[meta.currency] || meta.currency;
  const fmtMoney = (n) => `${symbol}${(parseFloat(n) || 0).toFixed(2)}`;
  const lineTotals = useMemo(() => items.map((it) => {
    const qty = parseFloat(it.quantity) || 0;
    const price = parseFloat(it.unit_price) || 0;
    const discPct = Math.min(100, Math.max(0, parseFloat(it.discount_pct) || 0));
    const taxPct = Math.max(0, parseFloat(it.tax_rate) || 0);
    const gross = qty * price;
    const discAmt = gross * (discPct / 100);
    const net = gross - discAmt;
    const taxAmt = net * (taxPct / 100);
    return { net, taxAmt, discAmt, lineTotal: net + taxAmt };
  }), [items]);
  const totals = useMemo(() => lineTotals.reduce((acc, l) => ({
    subtotal: acc.subtotal + l.net,
    tax: acc.tax + l.taxAmt,
    discount: acc.discount + l.discAmt
  }), { subtotal: 0, tax: 0, discount: 0 }), [lineTotals]);
  const grandTotal = totals.subtotal + totals.tax;
  const updateItem = (idx, field, val) => setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it));
  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (idx) => setItems((prev) => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
  const handleLiveModeLogoChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 15e5) {
      setErrors(["Logo too large — please use a file under 1.5 MB."]);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoUrl(reader.result);
    reader.readAsDataURL(f);
  };
  const handleLogoChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 15e5) {
      setErrors(["Logo too large — please use a file under 1.5 MB."]);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCompany((c) => ({ ...c, logo_base64: reader.result }));
    reader.readAsDataURL(f);
  };
  const populateScannedDocument = (data) => {
    const logoObj = LOGOS.find((l) => l.id === selectedLogo);
    const logoName = logoObj?.name ?? "Apex Retail Ltd";
    setCompany({
      name: data.vendor_name || logoName,
      address: data.vendor_address || "100 Retail Plaza, Suite 4A, NY 10001",
      email: data.vendor_email || `contact@${logoName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
      phone: data.vendor_phone || "+1 (555) 403-9210",
      tax_id: data.vendor_tax_id || "TX-4401-99",
      logo_base64: logoUrl || null
    });
    setClient({
      name: data.client_name || "Quantum Logistics",
      address: data.client_address || "450 Enterprise Way, Industrial Zone, CA 90210",
      email: data.client_email || "billing@quantumnodes.com"
    });
    const parsedItems = (data.items || []).map((it) => ({
      description: it.item_name || it.description || "Extracted Product Item",
      quantity: parseFloat(it.quantity || it.qty) || 1,
      unit_price: parseFloat(it.unit_price || it.price) || 0,
      tax_rate: parseFloat(it.tax_rate || 0) || 0,
      discount_pct: parseFloat(it.discount_pct || 0) || 0
    }));
    setItems(parsedItems.length > 0 ? parsedItems : [
      { description: "Extracted Product Item", quantity: 1, unit_price: 49.99, tax_rate: 5, discount_pct: 0 }
    ]);
    setMeta((prev) => ({
      ...prev,
      invoice_number: data.invoice_no || data.invoice_number || "INV-AI-8849",
      issue_date: data.date || data.issue_date || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
      due_date: data.due_date || new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10),
      notes: data.notes || "Parsed and populated by Smart Capture AI. Click any text to edit.",
      terms: data.terms || "Payment due within 14 days of issue date."
    }));
    setResultLoaded(true);
  };
  const getMockDataForSample = (type, sample) => {
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const dueDateStr = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);
    if (sample === "handwritten") return {
      vendor_name: "Al-Madina Grocers",
      invoice_no: "HW-9921",
      date: today,
      due_date: dueDateStr,
      items: [
        { description: "Premium Basmati Rice (5 kg)", quantity: 2, unit_price: 18.5, tax_rate: 0, discount_pct: 0 },
        { description: "Cooking Oil (3 Litres)", quantity: 1, unit_price: 22, tax_rate: 8, discount_pct: 0 },
        { description: "Brown Sugar (1 kg)", quantity: 5, unit_price: 3.2, tax_rate: 0, discount_pct: 0 }
      ]
    };
    if (sample === "printed") return {
      vendor_name: "Metro Hypermarket",
      invoice_no: "POS-774921",
      date: today,
      due_date: dueDateStr,
      items: [
        { description: "Wireless Optical Mouse", quantity: 3, unit_price: 15, tax_rate: 5, discount_pct: 0 },
        { description: "USB-C Fast Charger Hub", quantity: 2, unit_price: 29.9, tax_rate: 5, discount_pct: 10 },
        { description: "Bluetooth Earbuds Pro", quantity: 1, unit_price: 89, tax_rate: 8, discount_pct: 0 }
      ]
    };
    return {
      vendor_name: "Global Tech Supplies",
      invoice_no: "INV-88490",
      date: today,
      due_date: dueDateStr,
      items: [
        { description: "Enterprise Server Rack 12U", quantity: 1, unit_price: 499, tax_rate: 10, discount_pct: 5 },
        { description: "Cat6 Ethernet Cable (300 m)", quantity: 2, unit_price: 125, tax_rate: 10, discount_pct: 0 },
        { description: "Gigabit Switch 24-Port", quantity: 1, unit_price: 180, tax_rate: 10, discount_pct: 0 }
      ]
    };
  };
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
      if (!file) {
        setErrors(["Please select a document file first."]);
        return;
      }
      setScanTriggered(true);
    }
  };
  const handleRevealResults = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrors(["Please enter a valid work email to unlock the results."]);
      return;
    }
    setLoading(true);
    setErrors([]);
    const fd = new FormData();
    fd.append("email", email);
    fd.append("file", file);
    fd.append("type", docType);
    try {
      const res = await fetch("/tools/smart-capture", {
        method: "POST",
        headers: { "X-Requested-With": "XMLHttpRequest", Accept: "application/json" },
        body: fd
      });
      const data = await res.json();
      if (!res.ok) setErrors([data.error || "Failed to scan document."]);
      else {
        populateScannedDocument(data.data);
        setEmailSubmitted(true);
      }
    } catch {
      setErrors(["An error occurred while uploading. Please try again."]);
    } finally {
      setLoading(false);
    }
  };
  const handleReset = () => {
    setFile(null);
    setResultLoaded(false);
    setScanTriggered(false);
    setErrors([]);
    setEmailSubmitted(false);
  };
  const generatePdf = async () => {
    setErrors([]);
    setGeneratingPdf(true);
    try {
      const res = await fetch(route("tools.invoice.render"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.content || "",
          Accept: "application/json"
        },
        body: JSON.stringify({ company, client, items, meta: { ...meta, orientation: "portrait" } })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrors(body.errors || ["Could not generate PDF. Please check your entries and try again."]);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `document-${(meta.invoice_number || "draft").replace(/[^A-Za-z0-9-]/g, "")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setErrors(["Something went wrong generating the PDF. Please try again."]);
    } finally {
      setGeneratingPdf(false);
    }
  };
  const templateOptions = Object.entries(TEMPLATES).map(([key, t]) => ({ value: key, label: t.name, hint: t.description }));
  const currencyOptions = Object.entries(CURRENCIES).map(([code, sym]) => ({ value: code, label: `${code} (${sym})` }));
  const accent = meta.template === "modern" ? meta.accent_color : "#0f172a";
  const isModern = meta.template === "modern";
  const isClassic = meta.template === "classic";
  const isCompact = meta.template === "compact";
  return /* @__PURE__ */ jsx(
    ToolShell,
    {
      title: "Smart Capture AI — Extract Invoice & Receipt Data with AI | VenQore",
      metaDescription: "Smart Capture AI uses Gemini to extract line items, quantities, prices, and totals from invoices, receipts, purchase orders, and handwritten bills. Free: 5 pages/month. No signup required.",
      eyebrow: "Premium AI Feature",
      h1: "Smart Capture AI",
      answer: "Stop typing what's already printed. Smart Capture AI reads your invoices, receipts, purchase orders, and even handwritten bills — extracting every line item, price, tax, and total into an editable document workspace in seconds. Powered by Google Gemini. Free: 5 pages per month.",
      toolGroups,
      currentSlug: "smart-capture",
      faqs: FAQS,
      cta: {
        headline: "SmartCapture is one of the 46 modules VenQore assembles for you.",
        subtext: "Inside the system it builds, a photographed bill posts to accounts payable and adjusts stock on its own — no manual entry from receipt to reconciliation."
      },
      related: [
        { href: "/tools/invoice-generator", label: "Invoice Generator" },
        { href: "/tools/receipt-generator", label: "Receipt Generator" },
        { href: "/tools/purchase-order-generator", label: "Purchase Order Generator" }
      ],
      wide: true,
      children: /* @__PURE__ */ jsxs("div", { className: "space-y-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "vq-sc-hero relative overflow-hidden rounded-[20px] border border-brand-500/20 p-8 md:p-12", "data-tone": "dark", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute -top-24 -left-24 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" }),
          /* @__PURE__ */ jsx("div", { className: "absolute -bottom-24 -right-24 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" }),
          /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-1xs font-bold uppercase tracking-widest mb-5", children: [
                /* @__PURE__ */ jsxs("span", { className: "flex h-1.5 w-1.5 relative", children: [
                  /* @__PURE__ */ jsx("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" }),
                  /* @__PURE__ */ jsx("span", { className: "relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-500" })
                ] }),
                "Powered by Google Gemini AI"
              ] }),
              /* @__PURE__ */ jsxs("h2", { className: "text-2xl md:text-3xl font-bold text-white leading-tight mb-4", children: [
                "Turn any invoice, receipt, or handwritten bill",
                /* @__PURE__ */ jsx("br", { className: "hidden sm:block" }),
                /* @__PURE__ */ jsx("span", { className: "text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-400", children: " into a structured document in seconds." })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-neutral-300 text-sm leading-relaxed max-w-lg mb-6", children: "Upload a photo, scan, or PDF. Our AI reads it — line items, quantities, prices, taxes — and fills in a fully editable invoice workspace for you to review and download." }),
              /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: ["Handwritten Bills", "Thermal Receipts", "PDF Invoices", "Purchase Orders", "Credit Notes", "Quotations"].map((tag) => /* @__PURE__ */ jsx("span", { className: "px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-neutral-300 text-1xs font-bold", children: tag }, tag)) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-3 shrink-0", children: [
              { icon: /* @__PURE__ */ jsx(ScanLine, { className: "w-4 h-4 text-brand-400" }), val: "95%+", label: "Avg. Accuracy" },
              { icon: /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4 text-brand-400" }), val: "<3s", label: "Extraction Time" },
              { icon: /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4 text-emerald-400" }), val: "15+", label: "Doc Types" },
              { icon: /* @__PURE__ */ jsx(Globe, { className: "w-4 h-4 text-amber-400" }), val: "10+", label: "Languages" }
            ].map((s) => /* @__PURE__ */ jsxs("div", { className: "p-3.5 rounded-2xl bg-white/[0.07] border border-white/[0.12] text-center min-w-[100px]", children: [
              /* @__PURE__ */ jsx("div", { className: "flex justify-center mb-1", children: s.icon }),
              /* @__PURE__ */ jsx("div", { className: "text-xl font-bold text-white", children: s.val }),
              /* @__PURE__ */ jsx("div", { className: "text-2xs text-neutral-300 font-bold uppercase tracking-wider", children: s.label })
            ] }, s.label)) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "relative z-10 mt-10 pt-8 border-t border-white/[0.06] grid sm:grid-cols-3 gap-6", children: [
            { n: "01", icon: /* @__PURE__ */ jsx(Upload, { className: "w-5 h-5" }), title: "Upload Your Document", desc: "Drag a photo, PDF, or scanned image — up to 5 pages per submission." },
            { n: "02", icon: /* @__PURE__ */ jsx(Brain, { className: "w-5 h-5" }), title: "AI Extracts Everything", desc: "Reads vendor, client, items, quantities, prices, tax and totals automatically." },
            { n: "03", icon: /* @__PURE__ */ jsx(Download, { className: "w-5 h-5" }), title: "Edit & Download PDF", desc: "Review in the live workspace, click to fix anything, then download a clean PDF." }
          ].map((step, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "shrink-0 w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-300", children: step.icon }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "text-3xs font-bold text-brand-400 uppercase tracking-widest mb-0.5", children: [
                "Step ",
                step.n
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-sm font-bold text-white mb-1", children: step.title }),
              /* @__PURE__ */ jsx("div", { className: "text-1xs text-neutral-300 leading-relaxed", children: step.desc })
            ] }),
            i < 2 && /* @__PURE__ */ jsx(ChevronRight, { className: "hidden sm:block shrink-0 w-4 h-4 text-white/40 mt-3 ml-auto" })
          ] }, step.n)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl vq-tool-well", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h4", { className: "text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2", children: [
              /* @__PURE__ */ jsxs("span", { className: "flex h-2 w-2 relative", children: [
                /* @__PURE__ */ jsx("span", { className: `animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${testMode ? "bg-brand-400" : "bg-emerald-400"}` }),
                /* @__PURE__ */ jsx("span", { className: `relative inline-flex rounded-full h-2 w-2 ${testMode ? "bg-brand-500" : "bg-emerald-500"}` })
              ] }),
              testMode ? "Demo Mode Active" : "Live Mode Active"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted mt-0.5", children: testMode ? "Process simulated documents free — no API credit used. Perfect for evaluating Smart Capture." : "Live mode scans your actual uploaded files through Gemini API and uses your monthly page allowance." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex bg-surface p-1 rounded-xl border border-line shrink-0", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => {
                  setTestMode(true);
                  handleReset();
                },
                className: `px-4 py-2 rounded-lg text-2xs font-bold uppercase tracking-wider transition-all ${testMode ? "bg-accent-fill text-accent-on shadow-md" : "text-brand-500 dark:text-brand-400 ring-2 ring-brand-400/60 ring-offset-1 ring-offset-surface animate-pulse"}`,
                children: "✦ Try Free Demo"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => {
                  setTestMode(false);
                  handleReset();
                },
                className: `px-4 py-2 rounded-lg text-2xs font-bold uppercase tracking-wider transition-all ${!testMode ? "bg-emerald-600 text-white shadow-md " : "text-ink-muted hover:text-ink-secondary"}`,
                children: "Live Mode"
              }
            )
          ] })
        ] }),
        !scanTriggered && /* @__PURE__ */ jsx("div", { className: "bg-surface border border-line rounded-2xl p-6 md:p-8 shadow-xl shadow-neutral-900/5", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleInitialScan, className: "space-y-7", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold uppercase tracking-wider text-ink-muted mb-3", children: "1 — Select Document Type" }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2", children: [
              { value: "invoice", label: "Invoice" },
              { value: "purchase", label: "Purchase" },
              { value: "expense", label: "Receipt" },
              { value: "quotation", label: "Quote" },
              { value: "packing_slip", label: "Packing" },
              { value: "credit_note", label: "Credit Note" },
              { value: "purchase_order", label: "PO" }
            ].map((opt) => /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setDocType(opt.value),
                className: `p-3 rounded-xl border text-center transition-all duration-normal focus:outline-none text-2xs font-bold uppercase tracking-wider ${docType === opt.value ? "border-brand-500 bg-brand-500/[0.06] text-brand-600 dark:text-brand-400 shadow-sm " : "border-line text-ink-secondary hover:border-line dark:hover:border-white/10"}`,
                children: opt.label
              },
              opt.value
            )) })
          ] }),
          !testMode && /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("label", { className: "flex items-center justify-between text-xs font-bold uppercase tracking-wider text-ink-muted mb-2", children: [
                /* @__PURE__ */ jsx("span", { children: "2 — Upload Document (PDF or Image)" }),
                /* @__PURE__ */ jsx("span", { className: "text-2xs font-semibold text-ink-muted normal-case", children: "Max 5 pages • PDF, PNG, JPG" })
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "file",
                  required: true,
                  accept: "image/*,.pdf",
                  onChange: (e) => setFile(e.target.files?.[0] || null),
                  className: "w-full px-4 py-3 bg-app border border-line rounded-xl text-ink-secondary text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:uppercase file:bg-brand-500/10 file:text-brand-600 dark:file:text-brand-400 hover:file:bg-brand-500/20"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2", children: "3 — Apply Branding Logo (Optional)" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "file",
                  accept: "image/*",
                  onChange: handleLiveModeLogoChange,
                  className: "w-full px-4 py-3 bg-app border border-line rounded-xl text-ink-secondary text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:uppercase file:bg-brand-500/10 file:text-brand-600 dark:file:text-brand-400 hover:file:bg-brand-500/20"
                }
              )
            ] })
          ] }),
          testMode && /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold uppercase tracking-wider text-ink-muted mb-3", children: "2 — Select Sample Document" }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
                /* @__PURE__ */ jsxs(
                  "div",
                  {
                    onClick: () => setSelectedSample("handwritten"),
                    className: `relative p-4 rounded-2xl border cursor-pointer transition-all duration-slow group overflow-hidden ${selectedSample === "handwritten" ? "border-brand-500 bg-brand-500/[0.03] ring-2 ring-brand-500/20 shadow-xl " : "border-line hover:border-line dark:hover:border-white/20"}`,
                    children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-2", children: [
                        /* @__PURE__ */ jsxs("div", { children: [
                          /* @__PURE__ */ jsx("div", { className: `text-xs font-bold uppercase tracking-wide mb-0.5 ${selectedSample === "handwritten" ? "text-brand-600 dark:text-brand-400" : "text-ink"}`, children: "Handwritten Cash Bill" }),
                          /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted", children: "Scribbled paper order note with ink pen text" })
                        ] }),
                        selectedSample === "handwritten" && /* @__PURE__ */ jsx(CheckCircle2, { size: 15, className: "text-brand-500 shrink-0 animate-bounce mt-0.5" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "relative mt-2 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/50 shadow-md font-serif italic text-blue-900 dark:text-blue-200 text-3xs select-none", children: [
                        /* @__PURE__ */ jsx("div", { className: "absolute left-3 top-0 bottom-0 w-px bg-red-300/60 dark:bg-red-900/50" }),
                        /* @__PURE__ */ jsxs("div", { className: "pl-2 space-y-1", children: [
                          /* @__PURE__ */ jsxs("div", { className: "flex justify-between font-bold border-b border-amber-200 dark:border-amber-900 pb-1", children: [
                            /* @__PURE__ */ jsx("span", { children: "Cash Memo #9921" }),
                            /* @__PURE__ */ jsx("span", { className: "not-italic text-4xs font-sans text-red-600 border border-red-500 px-1 rounded uppercase", children: "PAID" })
                          ] }),
                          /* @__PURE__ */ jsxs("div", { className: "space-y-0.5 pt-1", children: [
                            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                              /* @__PURE__ */ jsx("span", { children: "2× Basmati Rice 5kg" }),
                              /* @__PURE__ */ jsx("span", { children: "$37.00" })
                            ] }),
                            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                              /* @__PURE__ */ jsx("span", { children: "1× Cooking Oil 3L" }),
                              /* @__PURE__ */ jsx("span", { children: "$22.00" })
                            ] }),
                            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                              /* @__PURE__ */ jsx("span", { children: "5× Brown Sugar 1kg" }),
                              /* @__PURE__ */ jsx("span", { children: "$16.00" })
                            ] })
                          ] }),
                          /* @__PURE__ */ jsx("div", { className: "border-t border-amber-300 dark:border-amber-800 pt-1 text-right font-bold text-2xs text-blue-950 dark:text-blue-100", children: "Total: $75.00" })
                        ] })
                      ] })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "div",
                  {
                    onClick: () => setSelectedSample("printed"),
                    className: `relative p-4 rounded-2xl border cursor-pointer transition-all duration-slow group overflow-hidden ${selectedSample === "printed" ? "border-brand-500 bg-brand-500/[0.03] ring-2 ring-brand-500/20 shadow-xl " : "border-line hover:border-line dark:hover:border-white/20"}`,
                    children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-2", children: [
                        /* @__PURE__ */ jsxs("div", { children: [
                          /* @__PURE__ */ jsx("div", { className: `text-xs font-bold uppercase tracking-wide mb-0.5 ${selectedSample === "printed" ? "text-brand-600 dark:text-brand-400" : "text-ink"}`, children: "Printed POS Receipt" }),
                          /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted", children: "Thermal cash register slip with barcode" })
                        ] }),
                        selectedSample === "printed" && /* @__PURE__ */ jsx(CheckCircle2, { size: 15, className: "text-brand-500 shrink-0 animate-bounce mt-0.5" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "mt-2 p-3 bg-white dark:bg-raised text-ink rounded-lg border border-line shadow-md font-mono text-4xs select-none", children: [
                        /* @__PURE__ */ jsxs("div", { className: "text-center font-bold border-b border-dashed border-line pb-1", children: [
                          "METRO HYPERMARKET",
                          /* @__PURE__ */ jsxs("div", { className: "text-[7px] font-normal text-ink-muted", children: [
                            "Reg #04 • ",
                            (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "space-y-0.5 py-1", children: [
                          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                            /* @__PURE__ */ jsx("span", { children: "3× OPTICAL MOUSE" }),
                            /* @__PURE__ */ jsx("span", { children: "$45.00" })
                          ] }),
                          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                            /* @__PURE__ */ jsx("span", { children: "2× USBC CHARGER" }),
                            /* @__PURE__ */ jsx("span", { children: "$59.80" })
                          ] }),
                          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                            /* @__PURE__ */ jsx("span", { children: "1× BT EARBUDS" }),
                            /* @__PURE__ */ jsx("span", { children: "$89.00" })
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "border-t border-dashed border-line pt-1 flex justify-between font-bold", children: [
                          /* @__PURE__ */ jsx("span", { children: "SUBTOTAL:" }),
                          /* @__PURE__ */ jsx("span", { children: "$193.80" })
                        ] }),
                        /* @__PURE__ */ jsx("div", { className: "text-center text-[6px] text-ink-muted mt-1 tracking-widest", children: "|||| | ||||| |||| | ||" })
                      ] })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "div",
                  {
                    onClick: () => setSelectedSample("digital"),
                    className: `relative p-4 rounded-2xl border cursor-pointer transition-all duration-slow group overflow-hidden ${selectedSample === "digital" ? "border-brand-500 bg-brand-500/[0.03] ring-2 ring-brand-500/20 shadow-xl " : "border-line hover:border-line dark:hover:border-white/20"}`,
                    children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-2", children: [
                        /* @__PURE__ */ jsxs("div", { children: [
                          /* @__PURE__ */ jsx("div", { className: `text-xs font-bold uppercase tracking-wide mb-0.5 ${selectedSample === "digital" ? "text-brand-600 dark:text-brand-400" : "text-ink"}`, children: "Digital PDF Invoice" }),
                          /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted", children: "Structured vector PDF supplier invoice" })
                        ] }),
                        selectedSample === "digital" && /* @__PURE__ */ jsx(CheckCircle2, { size: 15, className: "text-brand-500 shrink-0 animate-bounce mt-0.5" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "mt-2 p-3 bg-surface text-ink rounded-lg border border-line shadow-md text-4xs select-none", children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start border-b border-brand-500/30 pb-1.5 mb-1.5", children: [
                          /* @__PURE__ */ jsxs("div", { children: [
                            /* @__PURE__ */ jsx("div", { className: "font-bold text-brand-600 dark:text-brand-400 text-3xs", children: "GLOBAL TECH SUPPLIES" }),
                            /* @__PURE__ */ jsx("div", { className: "text-[7px] text-ink-muted", children: "INV-88490" })
                          ] }),
                          /* @__PURE__ */ jsx("span", { className: "bg-brand-500/10 text-brand-600 dark:text-brand-300 text-[6px] font-bold px-1.5 py-0.5 rounded", children: "PDF/A" })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "space-y-0.5 text-ink-secondary", children: [
                          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                            /* @__PURE__ */ jsx("span", { children: "Enterprise Server Rack 12U" }),
                            /* @__PURE__ */ jsx("span", { children: "$499" })
                          ] }),
                          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                            /* @__PURE__ */ jsx("span", { children: "Cat6 Ethernet Cable (300m)" }),
                            /* @__PURE__ */ jsx("span", { children: "$250" })
                          ] }),
                          /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
                            /* @__PURE__ */ jsx("span", { children: "Gigabit Switch 24-Port" }),
                            /* @__PURE__ */ jsx("span", { children: "$180" })
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "border-t border-line mt-1.5 pt-1 flex justify-between font-bold text-brand-600 dark:text-brand-400", children: [
                          /* @__PURE__ */ jsx("span", { children: "GRAND TOTAL:" }),
                          /* @__PURE__ */ jsx("span", { children: "$929" })
                        ] })
                      ] })
                    ]
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold uppercase tracking-wider text-ink-muted mb-3", children: "3 — Select Sample Branding Logo" }),
              /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-3", children: LOGOS.map((logo) => /* @__PURE__ */ jsxs(
                "div",
                {
                  onClick: () => setSelectedLogo(logo.id),
                  className: `p-3.5 rounded-xl border text-center cursor-pointer transition-all duration-normal flex flex-col items-center justify-center gap-1.5 ${selectedLogo === logo.id ? "border-brand-500 bg-brand-500/[0.04] shadow-md ring-1 ring-brand-500/30" : "border-line hover:border-line dark:hover:border-white/10"}`,
                  children: [
                    /* @__PURE__ */ jsx("div", { className: "p-2 rounded-lg bg-surface dark:bg-white/5 border border-line dark:border-white/5", children: logo.symbol }),
                    /* @__PURE__ */ jsx("span", { className: `text-2xs font-bold uppercase tracking-wider ${selectedLogo === logo.id ? "text-brand-600 dark:text-brand-400" : "text-ink-secondary"}`, children: logo.name })
                  ]
                },
                logo.id
              )) })
            ] })
          ] }),
          errors.length > 0 && /* @__PURE__ */ jsx("div", { className: "p-4 bg-red-500/5 border border-red-500/20 text-red-600 dark:text-red-300 text-xs font-bold rounded-xl space-y-1", children: errors.map((err, i) => /* @__PURE__ */ jsx("p", { children: err }, i)) }),
          /* @__PURE__ */ jsxs("button", { type: "submit", className: "vq-btn vq-btn--primary vq-btn--lg vq-btn--block", children: [
            /* @__PURE__ */ jsx(Sparkles, { size: 15 }),
            /* @__PURE__ */ jsx("span", { children: testMode ? "Run AI Demo Scan (Free)" : "Upload & Scan with AI" }),
            /* @__PURE__ */ jsx(ArrowRight, { size: 14 })
          ] }),
          testMode && /* @__PURE__ */ jsxs("p", { className: "text-center text-2xs text-ink-muted -mt-3", children: [
            "Demo mode is 100% free — no account needed, no API credits consumed.",
            "",
            /* @__PURE__ */ jsx("span", { className: "text-brand-500 font-bold", children: "5 free live scans/month" }),
            " when you sign up."
          ] })
        ] }) }),
        loading && /* @__PURE__ */ jsxs("div", { className: "relative rounded-2xl border border-brand-500/20 bg-gradient-hero p-10 overflow-hidden flex flex-col items-center justify-center gap-5 min-h-[260px]", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent animate-[shimmer_2s_linear_infinite]" }) }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(ScanLine, { className: "w-7 h-7 text-brand-400 animate-pulse" }) }),
            /* @__PURE__ */ jsx("div", { className: "absolute -inset-2 rounded-2xl border border-brand-500/20 animate-ping opacity-30" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
            /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-white uppercase tracking-wider mb-1", children: "AI Scanning Document…" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "Extracting line items, prices, quantities and totals" })
          ] })
        ] }),
        scanTriggered && !testMode && !emailSubmitted && !resultLoaded && !loading && /* @__PURE__ */ jsxs("div", { className: "relative rounded-2xl overflow-hidden border border-line bg-surface p-6 md:p-8", children: [
          /* @__PURE__ */ jsxs("div", { className: "filter blur-sm opacity-25 select-none pointer-events-none space-y-4 mb-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("div", { className: "w-24 h-8 bg-sunken rounded" }),
              /* @__PURE__ */ jsx("div", { className: "w-32 h-6 bg-sunken rounded" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "h-px bg-sunken dark:bg-surface" }),
            /* @__PURE__ */ jsx("div", { className: "space-y-2", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsx("div", { className: "h-4 bg-sunken rounded w-full" }, i)) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center p-6", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md bg-surface border border-line rounded-2xl p-8 shadow-2xl text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsx(Lock, { className: "w-5 h-5 text-emerald-500" }) }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-ink mb-2", children: "Unlock Your Scan Results" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted leading-relaxed mb-6", children: "Your document has been prepared. Enter your work email to trigger the AI extraction and reveal the full structured data." }),
            /* @__PURE__ */ jsxs("form", { onSubmit: handleRevealResults, className: "space-y-3", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "email",
                  required: true,
                  value: email,
                  onChange: (e) => setEmail(e.target.value),
                  placeholder: "you@company.com",
                  className: "w-full px-4 py-3 bg-app border border-line rounded-xl text-ink focus:outline-none focus:border-emerald-500 transition-all text-sm text-center"
                }
              ),
              errors.length > 0 && /* @__PURE__ */ jsx("div", { className: "p-3 bg-red-500/5 border border-red-500/20 text-red-600 dark:text-red-300 text-2xs font-bold rounded-lg", children: errors.map((e, i) => /* @__PURE__ */ jsx("p", { children: e }, i)) }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "submit",
                  className: "vq-btn vq-btn--primary vq-btn--lg w-full",
                  children: [
                    /* @__PURE__ */ jsx(Sparkles, { size: 13 }),
                    " Trigger AI Scan & Reveal"
                  ]
                }
              )
            ] })
          ] }) })
        ] }),
        resultLoaded && !loading && /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-brand-500/10 to-brand-500/10 border border-brand-500/20", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
              /* @__PURE__ */ jsx("div", { className: "w-7 h-7 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(Sparkles, { size: 13, className: "text-brand-500 animate-pulse" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "text-xs font-bold text-ink", children: testMode ? "Smart Capture Demo — Editable Workspace" : `AI Scan Complete · ${email}` }),
                /* @__PURE__ */ jsx("div", { className: "text-2xs text-ink-muted", children: "Click any field below to edit it. What you see is exactly what downloads." })
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: handleReset,
                className: "px-3 py-1.5 rounded-lg text-2xs font-bold uppercase tracking-wider text-ink-secondary hover:bg-white/10 border border-line transition-colors",
                children: "↺ Scan Another"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 p-3 vq-tool-panel", children: [
            /* @__PURE__ */ jsx("div", { className: "w-40", children: /* @__PURE__ */ jsx(Select, { value: meta.template, onChange: (v) => setMeta((m) => ({ ...m, template: v })), options: templateOptions }) }),
            /* @__PURE__ */ jsx("div", { className: "w-36", children: /* @__PURE__ */ jsx(Select, { value: meta.currency, onChange: (v) => setMeta((m) => ({ ...m, currency: v })), options: currencyOptions }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 p-1 rounded-xl vq-tool-inset", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setMeta((m) => ({ ...m, orientation: "portrait" })),
                  className: `px-2.5 py-1.5 rounded-lg text-1xs font-bold transition-colors ${meta.orientation === "portrait" ? "bg-accent-fill text-accent-on" : "text-ink-muted"}`,
                  children: "Portrait"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setMeta((m) => ({ ...m, orientation: "landscape" })),
                  className: `px-2.5 py-1.5 rounded-lg text-1xs font-bold transition-colors ${meta.orientation === "landscape" ? "bg-accent-fill text-accent-on" : "text-ink-muted"}`,
                  children: "Landscape"
                }
              )
            ] }),
            isModern && /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1.5", children: ACCENT_PRESETS.map((c) => /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setMeta((m) => ({ ...m, accent_color: c })),
                className: `w-6 h-6 rounded-full border-2 transition-transform ${meta.accent_color === c ? "scale-110 border-neutral-900 dark:border-white" : "border-transparent"}`,
                style: { background: c }
              },
              c
            )) }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => logoInputRef.current?.click(),
                className: "flex items-center gap-1.5 px-3 py-2 rounded-xl vq-tool-inset text-xs font-bold text-ink-secondary hover:border-brand-400/40 transition-colors",
                children: [
                  /* @__PURE__ */ jsx(Upload, { size: 13 }),
                  " ",
                  company.logo_base64 ? "Change logo" : "Add logo"
                ]
              }
            ),
            company.logo_base64 && /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setCompany((c) => ({ ...c, logo_base64: null })),
                className: "text-xs font-bold text-ink-muted hover:text-red-500 transition-colors",
                children: "Remove logo"
              }
            ),
            /* @__PURE__ */ jsx("input", { ref: logoInputRef, type: "file", accept: "image/*", className: "hidden", onChange: handleLogoChange }),
            /* @__PURE__ */ jsx("div", { className: "ml-auto", children: /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: generatePdf,
                disabled: generatingPdf,
                className: "vq-btn vq-btn--primary",
                children: [
                  generatingPdf ? /* @__PURE__ */ jsx(Loader2, { size: 14, className: "animate-spin" }) : /* @__PURE__ */ jsx(Download, { size: 14 }),
                  generatingPdf ? "Generating…" : "Download PDF"
                ]
              }
            ) })
          ] }),
          errors.length > 0 && /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5", children: [
            /* @__PURE__ */ jsx(AlertCircle, { size: 16, className: "text-red-500 mt-0.5 shrink-0" }),
            /* @__PURE__ */ jsx("div", { className: "text-sm text-red-600 dark:text-red-400", children: errors.map((e, i) => /* @__PURE__ */ jsx("p", { children: e }, i)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: `vq-paper rounded-2xl overflow-hidden shadow-xl shadow-neutral-900/10 dark:shadow-black/40 border border-line bg-white mx-auto transition-[max-width] ${meta.orientation === "landscape" ? "max-w-4xl" : "max-w-2xl"}`, children: [
            isModern && /* @__PURE__ */ jsx("div", { className: "h-3 w-full", style: { background: accent } }),
            /* @__PURE__ */ jsxs("div", { className: `p-6 sm:p-10 text-ink ${isCompact ? "text-[13px]" : "text-sm"}`, style: { fontFamily: "Helvetica, Arial, sans-serif" }, children: [
              /* @__PURE__ */ jsxs("div", { className: `flex flex-col sm:flex-row justify-between gap-6 mb-8 ${isClassic ? "border-b-2 border-neutral-900 pb-4" : ""}`, children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  company.logo_base64 && /* @__PURE__ */ jsx("img", { src: company.logo_base64, alt: "Logo", className: "h-12 max-w-[160px] object-contain mb-2" }),
                  /* @__PURE__ */ jsx(EditableText, { value: company.name, onChange: (v) => setCompany((c) => ({ ...c, name: v })), placeholder: "Your business name", inline: false, className: "text-lg font-bold mb-0.5" }),
                  /* @__PURE__ */ jsx(EditableText, { value: company.address, onChange: (v) => setCompany((c) => ({ ...c, address: v })), placeholder: "Business address", as: "textarea", rows: 2, inline: false, className: "text-ink-muted text-xs mt-1 mb-0.5 max-w-xs" }),
                  /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-x-3 text-xs text-ink-muted mt-1", children: [
                    /* @__PURE__ */ jsx(EditableText, { value: company.email, onChange: (v) => setCompany((c) => ({ ...c, email: v })), placeholder: "email@business.com" }),
                    /* @__PURE__ */ jsx(EditableText, { value: company.phone, onChange: (v) => setCompany((c) => ({ ...c, phone: v })), placeholder: "Phone number" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "text-xs text-ink-muted mt-0.5", children: [
                    "Tax ID: ",
                    /* @__PURE__ */ jsx(EditableText, { value: company.tax_id, onChange: (v) => setCompany((c) => ({ ...c, tax_id: v })), placeholder: "optional" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-left sm:text-right", children: [
                  /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold tracking-tight", style: { color: isModern ? accent : "rgb(var(--vq-slate-900))" }, children: "INVOICE" }),
                  /* @__PURE__ */ jsxs("div", { className: "mt-2 text-xs space-y-0.5", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex sm:justify-end gap-2", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-ink-muted", children: "Invoice #" }),
                      /* @__PURE__ */ jsx(EditableText, { value: meta.invoice_number, onChange: (v) => setMeta((m) => ({ ...m, invoice_number: v })), className: "font-bold" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex sm:justify-end gap-2", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-ink-muted", children: "Issue date" }),
                      /* @__PURE__ */ jsx(EditableText, { as: "date", value: meta.issue_date, onChange: (v) => setMeta((m) => ({ ...m, issue_date: v })) })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex sm:justify-end gap-2", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-ink-muted", children: "Due date" }),
                      /* @__PURE__ */ jsx(EditableText, { as: "date", value: meta.due_date, onChange: (v) => setMeta((m) => ({ ...m, due_date: v })), emptyLabel: "—" })
                    ] })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
                /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold uppercase tracking-widest text-ink-muted mb-1", children: "Bill To" }),
                /* @__PURE__ */ jsx(EditableText, { value: client.name, onChange: (v) => setClient((c) => ({ ...c, name: v })), placeholder: "Client name", inline: false, className: "font-bold mb-0.5" }),
                /* @__PURE__ */ jsx(EditableText, { value: client.address, onChange: (v) => setClient((c) => ({ ...c, address: v })), placeholder: "Client address", as: "textarea", rows: 2, inline: false, className: "text-ink-muted text-xs mb-0.5" }),
                /* @__PURE__ */ jsx(EditableText, { value: client.email, onChange: (v) => setClient((c) => ({ ...c, email: v })), placeholder: "Client email (optional)", inline: false, className: "text-ink-muted text-xs" })
              ] }),
              /* @__PURE__ */ jsxs("table", { className: "w-full mb-2", children: [
                /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: `text-left text-2xs font-bold uppercase tracking-wide text-ink-muted ${isClassic ? "border-b-2 border-neutral-900" : "border-b border-neutral-900"}`, children: [
                  /* @__PURE__ */ jsx("th", { className: "pb-2 pr-2", children: /* @__PURE__ */ jsx(EditableText, { value: headers.description, onChange: (v) => setHeaders((h) => ({ ...h, description: v })), pulse: false, className: "text-2xs font-bold uppercase tracking-wide text-ink-muted" }) }),
                  /* @__PURE__ */ jsx("th", { className: "pb-2 px-2 text-right w-16", children: /* @__PURE__ */ jsx(EditableText, { value: headers.quantity, onChange: (v) => setHeaders((h) => ({ ...h, quantity: v })), pulse: false, className: "text-2xs font-bold uppercase tracking-wide text-ink-muted text-right" }) }),
                  /* @__PURE__ */ jsx("th", { className: "pb-2 px-2 text-right w-24", children: /* @__PURE__ */ jsx(EditableText, { value: headers.unit_price, onChange: (v) => setHeaders((h) => ({ ...h, unit_price: v })), pulse: false, className: "text-2xs font-bold uppercase tracking-wide text-ink-muted text-right" }) }),
                  /* @__PURE__ */ jsx("th", { className: "pb-2 px-2 text-right w-16", children: /* @__PURE__ */ jsx(EditableText, { value: headers.discount, onChange: (v) => setHeaders((h) => ({ ...h, discount: v })), pulse: false, className: "text-2xs font-bold uppercase tracking-wide text-ink-muted text-right" }) }),
                  /* @__PURE__ */ jsx("th", { className: "pb-2 px-2 text-right w-16", children: /* @__PURE__ */ jsx(EditableText, { value: headers.tax, onChange: (v) => setHeaders((h) => ({ ...h, tax: v })), pulse: false, className: "text-2xs font-bold uppercase tracking-wide text-ink-muted text-right" }) }),
                  /* @__PURE__ */ jsx("th", { className: "pb-2 pl-2 text-right w-24", children: /* @__PURE__ */ jsx(EditableText, { value: headers.amount, onChange: (v) => setHeaders((h) => ({ ...h, amount: v })), pulse: false, className: "text-2xs font-bold uppercase tracking-wide text-ink-muted text-right" }) }),
                  /* @__PURE__ */ jsx("th", { className: "w-8" })
                ] }) }),
                /* @__PURE__ */ jsx("tbody", { children: items.map((item, idx) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-line group", children: [
                  /* @__PURE__ */ jsx("td", { className: "py-2 pr-2", children: /* @__PURE__ */ jsx(EditableText, { value: item.description, onChange: (v) => updateItem(idx, "description", v), placeholder: "Item description", className: "block" }) }),
                  /* @__PURE__ */ jsx("td", { className: "py-2 px-2 text-right", children: /* @__PURE__ */ jsx(EditableText, { as: "number", min: "0", value: item.quantity, onChange: (v) => updateItem(idx, "quantity", v), className: "text-right w-12" }) }),
                  /* @__PURE__ */ jsx("td", { className: "py-2 px-2 text-right", children: /* @__PURE__ */ jsx(EditableText, { as: "number", min: "0", value: item.unit_price, onChange: (v) => updateItem(idx, "unit_price", v), formatDisplay: fmtMoney, className: "text-right w-16" }) }),
                  /* @__PURE__ */ jsx("td", { className: "py-2 px-2 text-right", children: /* @__PURE__ */ jsx(EditableText, { as: "number", min: "0", max: "100", value: item.discount_pct, onChange: (v) => updateItem(idx, "discount_pct", v), formatDisplay: (v) => v > 0 ? `${v}%` : "—", className: "text-right w-12" }) }),
                  /* @__PURE__ */ jsx("td", { className: "py-2 px-2 text-right", children: /* @__PURE__ */ jsx(EditableText, { as: "number", min: "0", value: item.tax_rate, onChange: (v) => updateItem(idx, "tax_rate", v), formatDisplay: (v) => v > 0 ? `${v}%` : "—", className: "text-right w-12" }) }),
                  /* @__PURE__ */ jsx("td", { className: "py-2 pl-2 text-right font-bold", children: fmtMoney(lineTotals[idx]?.lineTotal) }),
                  /* @__PURE__ */ jsx("td", { className: "py-2 pl-1 text-right", children: /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => removeItem(idx),
                      disabled: items.length === 1,
                      className: "opacity-0 group-hover:opacity-100 text-ink-muted hover:text-red-500 disabled:opacity-0 transition-opacity",
                      children: /* @__PURE__ */ jsx(Trash2, { size: 13 })
                    }
                  ) })
                ] }, idx)) })
              ] }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: addItem,
                  className: "flex items-center gap-1 text-xs font-bold text-ink-muted hover:text-brand-500 transition-colors mb-6",
                  children: [
                    /* @__PURE__ */ jsx(Plus, { size: 12 }),
                    " Add line item"
                  ]
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "flex justify-end mb-8", children: /* @__PURE__ */ jsxs("div", { className: "w-56 space-y-1 text-sm", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-ink-muted", children: [
                  /* @__PURE__ */ jsx("span", { children: "Subtotal" }),
                  /* @__PURE__ */ jsx("span", { children: fmtMoney(totals.subtotal) })
                ] }),
                totals.discount > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-ink-muted", children: [
                  /* @__PURE__ */ jsx("span", { children: "Discount" }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    "-",
                    fmtMoney(totals.discount)
                  ] })
                ] }),
                totals.tax > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-ink-muted", children: [
                  /* @__PURE__ */ jsx("span", { children: "Tax" }),
                  /* @__PURE__ */ jsx("span", { children: fmtMoney(totals.tax) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between font-bold text-base pt-1.5 border-t-2 border-neutral-900", style: { color: isModern ? accent : "rgb(var(--vq-slate-900))" }, children: [
                  /* @__PURE__ */ jsx("span", { children: "Total Due" }),
                  /* @__PURE__ */ jsx("span", { children: fmtMoney(grandTotal) })
                ] })
              ] }) }),
              /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-6 text-xs text-ink-muted", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-ink-secondary mb-1", children: "Notes" }),
                  /* @__PURE__ */ jsx(EditableText, { value: meta.notes, onChange: (v) => setMeta((m) => ({ ...m, notes: v })), placeholder: "Add a note (optional)", as: "textarea", rows: 2, className: "block" })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-ink-secondary mb-1", children: "Payment Terms" }),
                  /* @__PURE__ */ jsx(EditableText, { value: meta.terms, onChange: (v) => setMeta((m) => ({ ...m, terms: v })), placeholder: "e.g. Net 14", as: "textarea", rows: 2, className: "block" })
                ] })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-center text-2xs text-ink-muted mt-10", children: "Generated via Smart Capture AI at venqore.com — no signup, no watermark." })
            ] })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-center text-xs text-ink-muted", children: "This preview matches your downloaded PDF — click anything above to edit it." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-5 pt-6 border-t border-line", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
            /* @__PURE__ */ jsx("span", { className: "inline-block px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-2xs font-bold uppercase tracking-wider mb-3", children: "Standalone vs. ERP Integrated" }),
            /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-ink", children: "Why use Smart Capture inside VenQore ERP?" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-2 max-w-xl mx-auto leading-relaxed", children: "The standalone tool digitizes your documents. The integrated version connects every scan to your live inventory, accounts, and suppliers — automatically." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-2xl vq-tool-inset", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
                /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-xl bg-sunken dark:bg-white/5 flex items-center justify-center", children: /* @__PURE__ */ jsx(FileSearch, { className: "w-4 h-4 text-ink-muted" }) }),
                /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold text-ink-secondary uppercase tracking-wide", children: "Standalone (This Tool)" })
              ] }),
              /* @__PURE__ */ jsx("ul", { className: "space-y-2.5 text-xs text-ink-muted", children: [
                "Extracts data into an editable PDF workspace",
                "Download professional invoice/receipt PDF",
                "No live database matching or SKU linking",
                "Does not post to ledgers or adjust stock",
                "5 free pages per month — no account needed"
              ].map((item, i) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "w-4 h-4 rounded-full bg-sunken dark:bg-white/5 flex items-center justify-center shrink-0 mt-0.5", children: /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-sunken" }) }),
                item
              ] }, i)) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "relative p-6 rounded-2xl border border-brand-500/30 bg-gradient-to-br from-brand-500/[0.03] to-brand-500/[0.03] overflow-hidden", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 px-2.5 py-1 bg-brand-500/10 text-brand-600 dark:text-brand-400 text-3xs font-bold uppercase tracking-widest rounded-bl-xl", children: "✦ Recommended" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
                /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(Database, { className: "w-4 h-4 text-brand-500" }) }),
                /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wide", children: "VenQore ERP Integrated" })
              ] }),
              /* @__PURE__ */ jsx("ul", { className: "space-y-2.5 text-xs text-ink-secondary", children: [
                ["Live SKU Autocomplete — matches items to your product catalog & barcodes", true],
                ["Supplier Account Validation — checks credit terms, tax schemes, vendor IDs", true],
                ["One-Click Ledger Posting — directly credits payables and debits inventory", true],
                ["Private API — enterprise DPA, zero training on your data, GDPR compliant", true],
                ["Unlimited scans included in your VenQore subscription", true]
              ].map(([item, check], i) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
                /* @__PURE__ */ jsx(Check, { className: "w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  /* @__PURE__ */ jsx("strong", { className: "font-bold", children: String(item).split("—")[0] }),
                  String(item).includes("—") ? `— ${String(item).split("—")[1]}` : ""
                ] })
              ] }, i)) }),
              /* @__PURE__ */ jsxs(
                Link,
                {
                  href: "/register",
                  className: "vq-btn vq-btn--primary mt-5 w-full",
                  children: [
                    "Get Smart Capture in your ERP ",
                    /* @__PURE__ */ jsx(ArrowRight, { size: 13 })
                  ]
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-5 pt-6 border-t border-line", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-center max-w-xl mx-auto", children: [
            /* @__PURE__ */ jsx("span", { className: "inline-block px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-2xs font-bold uppercase tracking-wider mb-3", children: "Standalone Scan Credit Plans" }),
            /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-ink", children: "Need more than 5 pages a month?" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-2 leading-relaxed", children: "Buy standalone scan credits. All paid tiers use a private, non-training API endpoint with your data fully protected." })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", children: [
            { name: "Spark", pages: 500, price: "$3", desc: "Perfect for small stores", popular: false },
            { name: "Shop", pages: 1e3, price: "$6", desc: "Most popular — growing businesses", popular: true },
            { name: "Pro", pages: 2e3, price: "$12", desc: "For scaling multi-location operations", popular: false },
            { name: "Max", pages: 4e3, price: "$24", desc: "Enterprise-volume processing", popular: false }
          ].map((plan) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: `relative p-5 rounded-2xl border flex flex-col justify-between transition-all ${plan.popular ? "border-brand-500 bg-gradient-to-b from-brand-500/[0.04] to-transparent shadow-[0_0_40px_rgba(139,92,246,0.08)]" : "vq-tool-inset hover:border-line-strong"}`,
              children: [
                plan.popular && /* @__PURE__ */ jsx("div", { className: "absolute -top-px inset-x-4 h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent" }),
                /* @__PURE__ */ jsxs("div", { children: [
                  plan.popular && /* @__PURE__ */ jsx("div", { className: "inline-block mb-3 px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-3xs font-bold uppercase tracking-wider", children: "★ Most Popular" }),
                  /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-ink uppercase tracking-wide", children: plan.name }),
                  /* @__PURE__ */ jsx("p", { className: "text-2xs text-ink-muted mt-0.5", children: plan.desc }),
                  /* @__PURE__ */ jsxs("div", { className: "my-4", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-3xl font-bold text-ink", children: plan.price }),
                    /* @__PURE__ */ jsx("span", { className: "text-xs text-ink-muted", children: "/month" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "px-3 py-2 rounded-xl bg-sunken text-center", children: [
                    /* @__PURE__ */ jsxs("span", { className: "text-sm font-bold text-brand-600 dark:text-brand-400", children: [
                      plan.pages.toLocaleString(),
                      " pages"
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "text-2xs text-ink-muted ml-1", children: "per month" })
                  ] })
                ] }),
                /* @__PURE__ */ jsx(
                  Link,
                  {
                    href: "/register",
                    className: `vq-btn ${plan.popular ? "vq-btn--primary" : "vq-btn--secondary"} vq-btn--block mt-5`,
                    children: "Get Started"
                  }
                )
              ]
            },
            plan.name
          )) }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl vq-tool-well", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-sm text-ink-secondary", children: [
              /* @__PURE__ */ jsx(Zap, { className: "w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" }),
              /* @__PURE__ */ jsxs("span", { children: [
                "Ran out of pages mid-month? Get a ",
                /* @__PURE__ */ jsx("strong", { className: "text-ink", children: "200-page top-up for just $2.00" }),
                " — no plan change needed."
              ] })
            ] }),
            /* @__PURE__ */ jsx(Link, { href: "/register", className: "vq-btn vq-btn--secondary shrink-0", children: "Get Top-Up" })
          ] })
        ] })
      ] })
    }
  );
}
export {
  SmartCapture as default
};
