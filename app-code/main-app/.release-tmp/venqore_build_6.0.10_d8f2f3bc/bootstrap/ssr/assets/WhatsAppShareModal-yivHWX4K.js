import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import { MessageSquare, X, Loader2, AlertCircle, CheckCircle2, ExternalLink, Share2, Download } from "lucide-react";
import { f as formatCurrency } from "./format-Dor_DYzH.js";
function WhatsAppShareModal({
  isOpen,
  onClose,
  documentType = "sale",
  documentId,
  initialPartyName = "",
  initialPhone = "",
  initialDocNumber = "",
  initialAmount = 0
}) {
  const { store } = usePage().props;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [draftData, setDraftData] = useState(null);
  const [phone, setPhone] = useState(initialPhone || "");
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [openedSuccess, setOpenedSuccess] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  useEffect(() => {
    if (isOpen && documentId) {
      setPopupBlocked(false);
      setOpenedSuccess(false);
      setError(null);
      fetchDraft(phone || initialPhone);
    } else {
      setDraftData(null);
    }
  }, [isOpen, documentId, documentType]);
  const fetchDraft = async (phoneToUse) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        route("store.communication.whatsapp.prepare", { store_slug: store?.slug }),
        {
          document_type: documentType,
          document_id: documentId,
          phone: phoneToUse || void 0
        }
      );
      if (res.data.success) {
        setDraftData(res.data);
        if (!phone && res.data.phone) {
          setPhone(res.data.phone);
        }
      } else {
        setError(res.data.message || "Unable to prepare WhatsApp draft.");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };
  const handlePhoneChange = (newPhone) => {
    setPhone(newPhone);
    if (draftData) {
      const cleanDigits = newPhone.replace(/\D/g, "");
      let normalized = cleanDigits;
      if (normalized.startsWith("00")) normalized = normalized.slice(2);
      else if (normalized.startsWith("0")) normalized = (store?.country_code || "92") + normalized.slice(1);
      const isValid = normalized.length >= 10 && normalized.length <= 15;
      const newWaUrl = isValid ? `https://wa.me/${normalized}?text=${encodeURIComponent(draftData.message_text)}` : "";
      setDraftData((prev) => ({
        ...prev,
        phone: newPhone,
        normalized_phone: normalized,
        phone_valid: isValid,
        wa_url: newWaUrl
      }));
    }
  };
  const sendOpenedRecord = async () => {
    try {
      await axios.post(
        route("store.communication.whatsapp.opened", { store_slug: store?.slug }),
        {
          document_type: draftData.document_type,
          document_id: documentId,
          phone: draftData.normalized_phone
        }
      );
    } catch (e) {
      console.warn("[WhatsApp opened status record failed]", e);
    }
  };
  const handleOpenDraft = () => {
    if (!draftData?.wa_url) return;
    const newWin = window.open(draftData.wa_url, "_blank", "noopener,noreferrer");
    if (!newWin || newWin.closed || typeof newWin.closed === "undefined") {
      setPopupBlocked(true);
    } else {
      sendOpenedRecord();
      setOpenedSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2500);
    }
  };
  const handleDownloadPdf = async () => {
    if (!draftData?.pdf_url) return;
    try {
      setDownloadingPdf(true);
      const res = await fetch(draftData.pdf_url, { credentials: "same-origin" });
      if (!res.ok) throw new Error("PDF download failed");
      const blob = await res.blob();
      const filename = `${draftData.document_type || "document"}-${draftData.document_number || "download"}.pdf`;
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.warn("PDF blob download failed, falling back to direct navigation", e);
      window.open(draftData.pdf_url, "_blank");
    } finally {
      setDownloadingPdf(false);
    }
  };
  const handleNativeShare = async () => {
    if (!draftData?.pdf_url) return;
    try {
      setDownloadingPdf(true);
      const res = await fetch(draftData.pdf_url, { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to fetch PDF for sharing");
      const blob = await res.blob();
      const filename = `${draftData.document_type || "document"}-${draftData.document_number || "receipt"}.pdf`;
      const file = new File([blob], filename, { type: "application/pdf" });
      if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${draftData?.document_type_label || "Document"} #${draftData?.document_number || ""}`,
          text: draftData?.message_text
        });
      } else {
        await handleDownloadPdf();
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        console.warn("Native file share failed, falling back to PDF download", e);
        await handleDownloadPdf();
      }
    } finally {
      setDownloadingPdf(false);
    }
  };
  if (!isOpen) return null;
  const isReturn = documentType === "sale_return";
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-normal",
      onClick: onClose,
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          className: "w-full max-w-xl bg-surface rounded-2xl shadow-2xl border border-line overflow-hidden flex flex-col animate-in zoom-in-95 duration-normal",
          onClick: (e) => e.stopPropagation(),
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-5 border-b border-line bg-app", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: `w-10 h-10 rounded-xl flex items-center justify-center text-white ${isReturn ? "bg-amber-600" : "bg-emerald-600"}`, children: /* @__PURE__ */ jsx(MessageSquare, { size: 20 }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("h3", { className: "text-base font-bold text-ink", children: "Share on WhatsApp" }),
                    /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider ${isReturn ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"}`, children: isReturn ? "Credit Note / Return" : "Sales Invoice" })
                  ] }),
                  /* @__PURE__ */ jsxs("p", { className: "text-xs text-ink-muted mt-0.5", children: [
                    draftData?.document_number || initialDocNumber,
                    " • ",
                    draftData?.party_name || initialPartyName || "Customer"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: onClose,
                  className: "p-2 text-ink-muted hover:text-ink hover:bg-interactive-hover rounded-xl transition-colors",
                  children: /* @__PURE__ */ jsx(X, { size: 18 })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar", children: [
              loading && /* @__PURE__ */ jsxs("div", { className: "py-12 flex flex-col items-center justify-center gap-3 text-ink-muted", children: [
                /* @__PURE__ */ jsx(Loader2, { className: "animate-spin text-emerald-600", size: 32 }),
                /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "Resolving document & preparing WhatsApp draft..." })
              ] }),
              error && /* @__PURE__ */ jsxs("div", { className: "p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3", children: [
                /* @__PURE__ */ jsx(AlertCircle, { className: "text-red-600 dark:text-red-400 shrink-0 mt-0.5", size: 18 }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-red-800 dark:text-red-300", children: "Cannot prepare WhatsApp share" }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-red-700 dark:text-red-400 mt-0.5", children: error })
                ] })
              ] }),
              !loading && !error && draftData && /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsxs("div", { className: "p-4 bg-sunken rounded-xl border border-line grid grid-cols-2 gap-4", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted block", children: "Recipient Party" }),
                    /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-ink truncate block mt-0.5", children: draftData.party_name })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold uppercase tracking-wider text-ink-muted block", children: "Transaction Amount" }),
                    /* @__PURE__ */ jsxs("span", { className: `text-base font-bold block mt-0.5 ${isReturn ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`, children: [
                      draftData.currency,
                      " ",
                      formatCurrency(draftData.amount, store)
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase tracking-wider text-ink block", children: "WhatsApp Phone Number (International Format)" }),
                  /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "tel",
                        value: phone,
                        onChange: (e) => handlePhoneChange(e.target.value),
                        placeholder: "e.g. 03001234567 or +923001234567",
                        className: `w-full px-4 py-2.5 bg-sunken text-ink border rounded-xl text-sm outline-none transition-colors ${draftData.phone_valid ? "border-emerald-500 focus:ring-2 focus:ring-emerald-500/20" : "border-amber-500 focus:ring-2 focus:ring-amber-500/20"}`
                      }
                    ),
                    draftData.phone_valid ? /* @__PURE__ */ jsxs("span", { className: "absolute right-3 top-2.5 text-emerald-600 flex items-center gap-1 text-xs font-medium", children: [
                      /* @__PURE__ */ jsx(CheckCircle2, { size: 16 }),
                      " Valid: ",
                      draftData.normalized_phone
                    ] }) : /* @__PURE__ */ jsxs("span", { className: "absolute right-3 top-2.5 text-amber-600 flex items-center gap-1 text-xs font-medium", children: [
                      /* @__PURE__ */ jsx(AlertCircle, { size: 16 }),
                      " Enter 10-15 digits"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("p", { className: "text-2xs text-ink-muted", children: [
                    "Normalized international format: ",
                    /* @__PURE__ */ jsx("code", { className: "font-mono", children: draftData.normalized_phone || "None" }),
                    ". Local zero prefixes (e.g. 03...) are automatically converted."
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase tracking-wider text-ink block", children: "Proposed Message Text" }),
                    /* @__PURE__ */ jsx("span", { className: "text-3xs text-ink-muted", children: "Read-only preview" })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "p-3.5 bg-sunken border border-line rounded-xl text-xs text-ink font-sans leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto", children: draftData.message_text })
                ] }),
                popupBlocked && /* @__PURE__ */ jsxs("div", { className: "p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-xl space-y-2", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-amber-800 dark:text-amber-300", children: "Browser Pop-Up Was Blocked" }),
                  /* @__PURE__ */ jsx("p", { className: "text-2xs text-amber-700 dark:text-amber-400", children: "Your browser prevented WhatsApp from opening automatically. Click the link below to open the draft directly:" }),
                  /* @__PURE__ */ jsxs(
                    "a",
                    {
                      href: draftData.wa_url,
                      target: "_blank",
                      rel: "noopener noreferrer",
                      onClick: () => {
                        sendOpenedRecord();
                        setOpenedSuccess(true);
                      },
                      className: "inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold",
                      children: [
                        /* @__PURE__ */ jsx(ExternalLink, { size: 14 }),
                        " Open WhatsApp Draft Now"
                      ]
                    }
                  )
                ] }),
                openedSuccess && /* @__PURE__ */ jsxs("div", { className: "p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-700 rounded-xl flex items-center gap-2 text-xs font-medium text-emerald-800 dark:text-emerald-300", children: [
                  /* @__PURE__ */ jsx(CheckCircle2, { size: 16 }),
                  "WhatsApp draft opened in a new tab. Please press Send in your WhatsApp app."
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "p-3 bg-sunken rounded-xl border border-line text-2xs text-ink-muted leading-relaxed", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-bold text-ink", children: "PDF Attachment Note: " }),
                  "WhatsApp Click-to-Chat links (",
                  /* @__PURE__ */ jsx("code", { className: "font-mono", children: "wa.me" }),
                  ") cannot attach files automatically. Use ",
                  /* @__PURE__ */ jsx("strong", { children: "Download PDF" }),
                  " and manually attach it in WhatsApp, or use ",
                  /* @__PURE__ */ jsx("strong", { children: "Native Share" }),
                  " on mobile."
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-4 border-t border-line bg-app flex flex-wrap items-center justify-between gap-3", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: onClose,
                  className: "px-4 py-2 border border-line bg-surface hover:bg-interactive-hover text-ink-secondary rounded-xl text-xs font-bold transition-colors",
                  children: "Cancel"
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                draftData?.offer_pdf && draftData?.pdf_url && /* @__PURE__ */ jsxs(Fragment, { children: [
                  typeof navigator !== "undefined" && navigator.canShare ? /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "button",
                      disabled: downloadingPdf,
                      onClick: handleNativeShare,
                      className: "px-3.5 py-2 bg-surface hover:bg-interactive-hover border border-line text-ink font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50",
                      title: "Share PDF file via Native Device Sheet",
                      children: [
                        /* @__PURE__ */ jsx(Share2, { size: 14 }),
                        " ",
                        downloadingPdf ? "Preparing PDF..." : "Share PDF"
                      ]
                    }
                  ) : null,
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "button",
                      disabled: downloadingPdf,
                      onClick: handleDownloadPdf,
                      className: "px-3.5 py-2 bg-surface hover:bg-interactive-hover border border-line text-ink font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50",
                      title: "Download PDF file to attach manually",
                      children: [
                        /* @__PURE__ */ jsx(Download, { size: 14 }),
                        " ",
                        downloadingPdf ? "Downloading..." : "Download PDF"
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    disabled: !draftData?.phone_valid || loading,
                    onClick: handleOpenDraft,
                    className: `px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 text-white shadow-md transition-all active:scale-95 ${draftData?.phone_valid && !loading ? "bg-emerald-600 hover:bg-emerald-700 cursor-pointer" : "bg-emerald-600/50 cursor-not-allowed opacity-60"}`,
                    children: [
                      /* @__PURE__ */ jsx(MessageSquare, { size: 16 }),
                      " Open WhatsApp Draft"
                    ]
                  }
                )
              ] })
            ] })
          ]
        }
      )
    }
  );
}
export {
  WhatsAppShareModal as W
};
