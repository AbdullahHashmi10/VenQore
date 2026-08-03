import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { usePage, Head, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./marketing-pages-CTBAvetE.js";
import { QrCode, AlertTriangle, FileText, Truck, CheckCircle, XCircle, Search, Plus, Printer } from "lucide-react";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
function EInvoicingIndex({ invoices = [], stats = {}, fbr_enabled = false }) {
  const { store, errors } = usePage().props;
  const [activeTab, setActiveTab] = useState("e-invoice");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [selectedSale, setSelectedSale] = useState(null);
  const [transporterName, setTransporterName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [isSubmittingWaybill, setIsSubmittingWaybill] = useState(false);
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesSearch = !searchTerm || invoice.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) || invoice.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || invoice.fbr_invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) || invoice.eway_bill_number?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [invoices, searchTerm]);
  const unreportedInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      if (activeTab === "e-invoice") {
        if (invoice.is_fbr_reported) return false;
      } else {
        if (invoice.eway_bill_number) return false;
      }
      const matchesSearch = !modalSearch || invoice.reference_number?.toLowerCase().includes(modalSearch.toLowerCase()) || invoice.customer?.name?.toLowerCase().includes(modalSearch.toLowerCase());
      return matchesSearch;
    });
  }, [invoices, modalSearch, activeTab]);
  const handleReport = (saleId) => {
    router.post(route("store.e-invoicing.generate", { store_slug: store?.slug }), {
      sale_id: saleId
    }, {
      preserveScroll: true
    });
  };
  const handleWaybillSubmit = (e) => {
    e.preventDefault();
    if (!selectedSale || !transporterName || !vehicleNumber) return;
    setIsSubmittingWaybill(true);
    router.post(route("store.e-invoicing.waybill", { store_slug: store?.slug }), {
      sale_id: selectedSale.id,
      transporter_name: transporterName,
      vehicle_number: vehicleNumber
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setIsModalOpen(false);
        setSelectedSale(null);
        setTransporterName("");
        setVehicleNumber("");
        setIsSubmittingWaybill(false);
      },
      onError: () => {
        setIsSubmittingWaybill(false);
      }
    });
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSale(null);
    setTransporterName("");
    setVehicleNumber("");
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "E-Invoicing & E-Way Bill", activeMenu: "Sales", children: [
    /* @__PURE__ */ jsx(Head, { title: "E-Invoicing" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl", children: /* @__PURE__ */ jsx(QrCode, { className: "text-cyan-600 dark:text-cyan-400", size: 24 }) }),
            "E-Invoicing & E-Way Bill"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm mt-1", children: "Generate and manage government mandated electronic documents" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                setActiveTab("e-invoice");
                handleCloseModal();
              },
              className: `px-4 py-2 rounded-xl font-bold transition-colors ${activeTab === "e-invoice" ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/20" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}`,
              children: "E-Invoices"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                setActiveTab("e-way-bill");
                handleCloseModal();
              },
              className: `px-4 py-2 rounded-xl font-bold transition-colors ${activeTab === "e-way-bill" ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/20" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}`,
              children: "E-Way Bills"
            }
          )
        ] })
      ] }),
      activeTab === "e-invoice" && !fbr_enabled && /* @__PURE__ */ jsxs("div", { className: "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 flex items-start gap-3", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "text-amber-500 shrink-0 mt-0.5", size: 18 }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-amber-800 dark:text-amber-400", children: "FBR E-Invoicing Integration Disabled" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-amber-700 dark:text-amber-500 mt-1", children: "Electronic invoice reporting to the Federal Board of Revenue is currently disabled. Go to Settings in the Admin Panel to enable FBR integration and set your POS ID." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl", children: activeTab === "e-invoice" ? /* @__PURE__ */ jsx(FileText, { className: "text-cyan-600 dark:text-cyan-400", size: 20 }) : /* @__PURE__ */ jsx(Truck, { className: "text-cyan-600 dark:text-cyan-400", size: 20 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 uppercase font-bold", children: "Generated Today" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-slate-800 dark:text-white", children: activeTab === "e-invoice" ? stats.generated_today || 0 : stats.waybills_today || 0 })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl", children: /* @__PURE__ */ jsx(CheckCircle, { className: "text-emerald-600 dark:text-emerald-400", size: 20 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 uppercase font-bold", children: "Success Rate" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-emerald-600", children: stats.success_rate || "100%" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl", children: /* @__PURE__ */ jsx(AlertTriangle, { className: "text-amber-600 dark:text-amber-400", size: 20 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 uppercase font-bold", children: "Pending Generation" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-amber-600", children: activeTab === "e-invoice" ? stats.pending_generation || 0 : stats.pending_waybills || 0 })
          ] })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "p-3 bg-red-100 dark:bg-red-900/30 rounded-xl", children: /* @__PURE__ */ jsx(XCircle, { className: "text-red-600 dark:text-red-400", size: 20 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 uppercase font-bold", children: "Failed / Errors" }),
            /* @__PURE__ */ jsx("p", { className: "text-2xl font-black text-red-600", children: stats.failed_errors || 0 })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "flex-1 min-w-[200px]", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Search, { size: 18, className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: `Search ${activeTab === "e-invoice" ? "E-Invoices" : "E-Way Bills"}...`,
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              className: "w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 ring-cyan-500/20 outline-none text-slate-800 dark:text-white font-medium"
            }
          )
        ] }) }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setIsModalOpen(true),
            className: "flex items-center gap-2 px-4 py-2.5 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition-colors font-bold shadow-lg shadow-cyan-500/20",
            children: [
              /* @__PURE__ */ jsx(Plus, { size: 18 }),
              "Generate New ",
              activeTab === "e-invoice" ? "E-Invoice" : "E-Way Bill"
            ]
          }
        )
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800", children: [
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-left", children: "Date" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-left", children: "Doc Number" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-left", children: "Customer" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-right", children: "Amount" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-center", children: activeTab === "e-invoice" ? "Ack No / Bill No" : "Waybill Reference" }),
          activeTab === "e-way-bill" && /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-left", children: "Transporter / Vehicle" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-center", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "px-6 py-4 text-center", children: "Action" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: filteredInvoices.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsxs("td", { colSpan: activeTab === "e-way-bill" ? 8 : 7, className: "px-6 py-12 text-center", children: [
          /* @__PURE__ */ jsx(QrCode, { size: 48, className: "mx-auto text-slate-300 dark:text-slate-600 mb-4" }),
          /* @__PURE__ */ jsxs("p", { className: "text-slate-500 font-medium", children: [
            "No ",
            activeTab === "e-invoice" ? "E-Invoices" : "E-Way Bills",
            " found"
          ] })
        ] }) }) : filteredInvoices.map((invoice) => {
          const isWaybillGenerated = !!invoice.eway_bill_number;
          return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors", children: [
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100", children: new Date(invoice.posted_at || invoice.created_at).toLocaleDateString() }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800 dark:text-slate-200", children: invoice.reference_number }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400", children: invoice.customer?.name || "Walk-in Customer" }),
            /* @__PURE__ */ jsxs("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-slate-800 dark:text-slate-200", children: [
              "Rs ",
              new Intl.NumberFormat().format(invoice.total)
            ] }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-center text-slate-500 dark:text-slate-400 font-mono", children: activeTab === "e-invoice" ? invoice.fbr_invoice_number || "-" : invoice.eway_bill_number || "-" }),
            activeTab === "e-way-bill" && /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400", children: invoice.transporter_name ? /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "font-semibold text-slate-800 dark:text-slate-200", children: invoice.transporter_name }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 font-mono", children: invoice.vehicle_number })
            ] }) : "-" }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-center", children: activeTab === "e-invoice" ? invoice.is_fbr_reported ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", children: [
              /* @__PURE__ */ jsx(CheckCircle, { size: 12 }),
              " Reported"
            ] }) : /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", children: [
              /* @__PURE__ */ jsx(AlertTriangle, { size: 12 }),
              " Pending"
            ] }) : isWaybillGenerated ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", children: [
              /* @__PURE__ */ jsx(CheckCircle, { size: 12 }),
              " Generated"
            ] }) : /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", children: [
              /* @__PURE__ */ jsx(AlertTriangle, { size: 12 }),
              " Pending"
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-center", children: activeTab === "e-invoice" ? invoice.is_fbr_reported ? /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => {
                  if (invoice.fbr_qr_data) {
                    window.open(invoice.fbr_qr_data, "_blank");
                  } else {
                    alert("QR Code verification details not available.");
                  }
                },
                className: "inline-flex items-center gap-1 px-3 py-1 bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-900/20 dark:hover:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400 rounded-lg transition-colors font-bold text-xs",
                children: [
                  /* @__PURE__ */ jsx(QrCode, { size: 14 }),
                  " Verify QR"
                ]
              }
            ) : /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => handleReport(invoice.id),
                className: "inline-flex items-center gap-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors font-bold text-xs shadow-md shadow-cyan-500/10",
                children: "Report"
              }
            ) : isWaybillGenerated ? /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => {
                  alert(`E-Way Bill Details:

Waybill No: ${invoice.eway_bill_number}
Transporter: ${invoice.transporter_name}
Vehicle No: ${invoice.vehicle_number}`);
                },
                className: "inline-flex items-center gap-1 px-3 py-1 bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-900/20 dark:hover:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400 rounded-lg transition-colors font-bold text-xs",
                children: [
                  /* @__PURE__ */ jsx(Printer, { size: 14 }),
                  " Print Waybill"
                ]
              }
            ) : /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setSelectedSale(invoice);
                  setIsModalOpen(true);
                },
                className: "inline-flex items-center gap-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors font-bold text-xs shadow-md shadow-cyan-500/10",
                children: "Generate EWB"
              }
            ) })
          ] }, invoice.id);
        }) })
      ] }) }) })
    ] }),
    isModalOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-800 dark:text-white", children: selectedSale ? "Enter Transport Details" : `Generate New ${activeTab === "e-invoice" ? "E-Invoice" : "E-Way Bill"}` }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 mt-1", children: selectedSale ? `Provide shipping details for invoice ${selectedSale.reference_number}` : "Select a posted transaction to report electronically" })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleCloseModal,
            className: "p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors",
            children: /* @__PURE__ */ jsx(XCircle, { size: 20 })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4", children: [
        errors && Object.keys(errors).length > 0 && /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-2xl bg-rose-500/10 border-2 border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold animate-in slide-in-from-top-4 duration-300", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { size: 16, className: "text-rose-500" }),
            /* @__PURE__ */ jsx("p", { className: "font-extrabold uppercase tracking-wide", children: "Validation failed:" })
          ] }),
          /* @__PURE__ */ jsx("ul", { className: "list-disc pl-5 space-y-0.5", children: Object.entries(errors).map(([field, msg]) => /* @__PURE__ */ jsx("li", { children: msg }, field)) })
        ] }),
        selectedSale ? /* @__PURE__ */ jsxs("form", { onSubmit: handleWaybillSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2", children: "Transporter Name" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  required: true,
                  placeholder: "e.g. DHL, FedEx, Fast Logistics",
                  value: transporterName,
                  onChange: (e) => setTransporterName(e.target.value),
                  className: "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 ring-cyan-500/20 outline-none text-sm text-slate-800 dark:text-white font-medium"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2", children: "Vehicle Number" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  required: true,
                  placeholder: "e.g. ABC-1234, LH-5544",
                  value: vehicleNumber,
                  onChange: (e) => setVehicleNumber(e.target.value),
                  className: "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 ring-cyan-500/20 outline-none text-sm text-slate-800 dark:text-white font-medium"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-850", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setSelectedSale(null),
                className: "px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm",
                children: "Back"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                disabled: isSubmittingWaybill,
                className: "px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-cyan-500/20 flex items-center gap-2",
                children: isSubmittingWaybill ? "Generating..." : "Generate E-Way Bill"
              }
            )
          ] })
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Search, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Search by invoice number or customer name...",
                value: modalSearch,
                onChange: (e) => setModalSearch(e.target.value),
                className: "w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 ring-cyan-500/20 outline-none text-sm text-slate-800 dark:text-white font-medium"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "space-y-2", children: unreportedInvoices.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-center text-sm text-slate-500 py-8", children: "No pending unreported transactions found." }) : unreportedInvoices.map((sale) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white text-sm", children: sale.reference_number }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500 mt-0.5", children: [
                sale.customer?.name || "Walk-in Customer",
                " • ",
                new Date(sale.posted_at || sale.created_at).toLocaleDateString()
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-sm font-bold text-slate-800 dark:text-white", children: [
                "Rs ",
                new Intl.NumberFormat().format(sale.total)
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => {
                    if (activeTab === "e-invoice") {
                      handleReport(sale.id);
                      setIsModalOpen(false);
                    } else {
                      setSelectedSale(sale);
                    }
                  },
                  className: "px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-cyan-500/10",
                  children: activeTab === "e-invoice" ? "Report" : "Select"
                }
              )
            ] })
          ] }, sale.id)) })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  EInvoicingIndex as default
};
