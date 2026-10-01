import React, { useState, useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import {
  MessageSquare,
  FileText,
  Download,
  Share2,
  X,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Smartphone
} from 'lucide-react';
import { formatCurrency } from '@/Utils/format';

export default function WhatsAppShareModal({
  isOpen,
  onClose,
  documentType = 'sale',
  documentId,
  initialPartyName = '',
  initialPhone = '',
  initialDocNumber = '',
  initialAmount = 0
}) {
  const { store } = usePage().props;

  const draftRequest = useRef(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [draftData, setDraftData] = useState(null);
  const [phone, setPhone] = useState(initialPhone || '');
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [openedSuccess, setOpenedSuccess] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    if (isOpen && documentId) {
      setPopupBlocked(false);
      setOpenedSuccess(false);
      setError(null);
      setPhone(initialPhone || '');
      setDraftData(null);
      fetchDraft(initialPhone);
    } else {
      setDraftData(null);
    }
    return () => { draftRequest.current += 1; };
  }, [isOpen, documentId, documentType, initialPhone]);

  const fetchDraft = async (phoneToUse) => {
    const request = ++draftRequest.current;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        route('store.communication.whatsapp.prepare', { store_slug: store?.slug }),
        {
          document_type: documentType,
          document_id: documentId,
          phone: phoneToUse || undefined,
        }
      );

      if (request !== draftRequest.current) return;
      if (res.data.success) {
        setDraftData(res.data);
        if (!phoneToUse && res.data.phone) {
          setPhone(res.data.phone);
        }
      } else {
        setError(res.data.message || 'Unable to prepare WhatsApp draft.');
      }
    } catch (err) {
      if (request !== draftRequest.current) return;
      setError(err.response?.data?.message || err.message || 'Failed to connect to server.');
    } finally {
      if (request === draftRequest.current) setLoading(false);
    }
  };

  const handlePhoneChange = (newPhone) => {
    setPhone(newPhone);
    if (draftData) {
      // Re-normalize locally for instant responsiveness
      const cleanDigits = newPhone.replace(/\D/g, '');
      let normalized = cleanDigits;
      if (normalized.startsWith('00')) normalized = normalized.slice(2);
      else if (normalized.startsWith('0')) normalized = (store?.country_code || '92') + normalized.slice(1);

      const isValid = normalized.length >= 10 && normalized.length <= 15;
      const newWaUrl = isValid
        ? `https://wa.me/${normalized}?text=${encodeURIComponent(draftData.message_text)}`
        : '';

      setDraftData(prev => ({
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
        route('store.communication.whatsapp.opened', { store_slug: store?.slug }),
        {
          document_type: draftData.document_type,
          document_id: documentId,
          phone: draftData.normalized_phone,
        }
      );
    } catch (e) {
      console.warn('[WhatsApp opened status record failed]', e);
    }
  };

  const handleOpenDraft = () => {
    if (!draftData?.wa_url) return;

    // Synchronously open WhatsApp Click-to-Chat in new tab/app on user gesture
    const newWin = window.open('about:blank', '_blank');
    if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
      // Pop-up blocker triggered: DO NOT record opened status yet!
      setPopupBlocked(true);
    } else {
      newWin.opener = null;
      newWin.location.replace(draftData.wa_url);
      // Window opened successfully: record opened status now
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
      const res = await fetch(draftData.pdf_url, { credentials: 'same-origin' });
      if (!res.ok) throw new Error('PDF download failed');
      const blob = await res.blob();
      if (!res.headers.get('content-type')?.toLowerCase().includes('application/pdf') ||
          await blob.slice(0, 5).text() !== '%PDF-') {
        throw new Error('The server did not return a PDF. Sign in again and retry.');
      }
      const filename = `${draftData.document_type || 'document'}-${draftData.document_number || 'download'}.pdf`;
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 30000);
    } catch (e) {
      setError(e.message || 'PDF download failed. Please retry.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleNativeShare = async () => {
    if (!draftData?.pdf_url) return;
    try {
      setDownloadingPdf(true);
      const res = await fetch(draftData.pdf_url, { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Failed to fetch PDF for sharing');
      const blob = await res.blob();
      if (!res.headers.get('content-type')?.toLowerCase().includes('application/pdf') ||
          await blob.slice(0, 5).text() !== '%PDF-') {
        throw new Error('The server did not return a PDF. Sign in again and retry.');
      }
      const filename = `${draftData.document_type || 'document'}-${draftData.document_number || 'receipt'}.pdf`;
      const file = new File([blob], filename, { type: 'application/pdf' });

      // Check if browser/device supports sharing actual files via Web Share API
      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${draftData?.document_type_label || 'Document'} #${draftData?.document_number || ''}`,
          text: draftData?.message_text,
        });
      } else {
        // Fall back to downloading the PDF file so user can attach it in WhatsApp
        await handleDownloadPdf();
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.warn('Native file share failed, falling back to PDF download', e);
        await handleDownloadPdf();
      }
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (!isOpen) return null;

  const isReturn = documentType === 'sale_return';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-normal"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-surface rounded-2xl shadow-2xl border border-line overflow-hidden flex flex-col animate-in zoom-in-95 duration-normal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-line bg-app">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${isReturn ? 'bg-amber-600' : 'bg-emerald-600'}`}>
              <MessageSquare size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-ink">Share on WhatsApp</h3>
                <span className={`px-2 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider ${
                  isReturn
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                }`}>
                  {isReturn ? 'Credit Note / Return' : 'Sales Invoice'}
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-0.5">
                {draftData?.document_number || initialDocNumber} • {draftData?.party_name || initialPartyName || 'Customer'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-ink-muted hover:text-ink hover:bg-interactive-hover rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-ink-muted">
              <Loader2 className="animate-spin text-emerald-600" size={32} />
              <p className="text-sm font-medium">Resolving document &amp; preparing WhatsApp draft...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
              <AlertCircle className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-bold text-red-800 dark:text-red-300">Cannot prepare WhatsApp share</p>
                <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && draftData && (
            <>
              {/* Document Overview Strip */}
              <div className="p-4 bg-sunken rounded-xl border border-line grid grid-cols-2 gap-4">
                <div>
                  <span className="text-2xs font-bold uppercase tracking-wider text-ink-muted block">Recipient Party</span>
                  <span className="text-sm font-bold text-ink truncate block mt-0.5">{draftData.party_name}</span>
                </div>
                <div className="text-right">
                  <span className="text-2xs font-bold uppercase tracking-wider text-ink-muted block">Transaction Amount</span>
                  <span className={`text-base font-bold block mt-0.5 ${isReturn ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {draftData.currency} {formatCurrency(draftData.amount, store)}
                  </span>
                </div>
              </div>

              {/* Recipient Phone with Live Validation */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-ink block">
                  WhatsApp Phone Number (International Format)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="e.g. 03001234567 or +923001234567"
                    className={`w-full px-4 py-2.5 bg-sunken text-ink border rounded-xl text-sm outline-none transition-colors ${
                      draftData.phone_valid
                        ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                        : 'border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                    }`}
                  />
                  {draftData.phone_valid ? (
                    <span className="absolute right-3 top-2.5 text-emerald-600 flex items-center gap-1 text-xs font-medium">
                      <CheckCircle2 size={16} /> Valid: {draftData.normalized_phone}
                    </span>
                  ) : (
                    <span className="absolute right-3 top-2.5 text-amber-600 flex items-center gap-1 text-xs font-medium">
                      <AlertCircle size={16} /> Enter 10-15 digits
                    </span>
                  )}
                </div>
                <p className="text-2xs text-ink-muted">
                  Normalized international format: <code className="font-mono">{draftData.normalized_phone || 'None'}</code>. Local zero prefixes (e.g. 03...) are automatically converted.
                </p>
              </div>

              {/* Message Draft Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-ink block">Proposed Message Text</label>
                  <span className="text-3xs text-ink-muted">Read-only preview</span>
                </div>
                <div className="p-3.5 bg-sunken border border-line rounded-xl text-xs text-ink font-sans leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {draftData.message_text}
                </div>
              </div>

              {/* Pop-up Blocker Fallback */}
              {popupBlocked && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-xl space-y-2">
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                    Browser Pop-Up Was Blocked
                  </p>
                  <p className="text-2xs text-amber-700 dark:text-amber-400">
                    Your browser prevented WhatsApp from opening automatically. Click the link below to open the draft directly:
                  </p>
                  <a
                    href={draftData.wa_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      sendOpenedRecord();
                      setOpenedSuccess(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                  >
                    <ExternalLink size={14} /> Open WhatsApp Draft Now
                  </a>
                </div>
              )}

              {/* Opened Success Feedback */}
              {openedSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-700 rounded-xl flex items-center gap-2 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 size={16} />
                  WhatsApp draft opened in a new tab. Please press Send in your WhatsApp app.
                </div>
              )}

              {/* PDF Manual Attachment Disclaimer */}
              <div className="p-3 bg-sunken rounded-xl border border-line text-2xs text-ink-muted leading-relaxed">
                <span className="font-bold text-ink">PDF Attachment Note: </span>
                WhatsApp Click-to-Chat links (<code className="font-mono">wa.me</code>) cannot attach files automatically. Use <strong>Download PDF</strong> and manually attach it in WhatsApp, or use <strong>Native Share</strong> on mobile.
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-line bg-app flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-line bg-surface hover:bg-interactive-hover text-ink-secondary rounded-xl text-xs font-bold transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {draftData?.offer_pdf && draftData?.pdf_url && (
              <>
                {typeof navigator !== 'undefined' && navigator.canShare ? (
                  <button
                    type="button"
                    disabled={downloadingPdf}
                    onClick={handleNativeShare}
                    className="px-3.5 py-2 bg-surface hover:bg-interactive-hover border border-line text-ink font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    title="Share PDF file via Native Device Sheet"
                  >
                    <Share2 size={14} /> {downloadingPdf ? 'Preparing PDF...' : 'Share PDF'}
                  </button>
                ) : null}

                <button
                  type="button"
                  disabled={downloadingPdf}
                  onClick={handleDownloadPdf}
                  className="px-3.5 py-2 bg-surface hover:bg-interactive-hover border border-line text-ink font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  title="Download PDF file to attach manually"
                >
                  <Download size={14} /> {downloadingPdf ? 'Downloading...' : 'Download PDF'}
                </button>
              </>
            )}

            <button
              type="button"
              disabled={!draftData?.phone_valid || loading}
              onClick={handleOpenDraft}
              className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 text-white shadow-md transition-all active:scale-95 ${
                draftData?.phone_valid && !loading
                  ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                  : 'bg-emerald-600/50 cursor-not-allowed opacity-60'
              }`}
            >
              <MessageSquare size={16} /> Open WhatsApp Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
