import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import MarketingLayout from "./MarketingLayout-cwTDSbNB.js";
import { Loader2, CheckCircle2, ExternalLink, User, ArrowLeft, Send, Upload, Shield } from "lucide-react";
import axios from "axios";
import { u as useTurnstile } from "./useTurnstile-4WiJ80s8.js";
import "@inertiajs/react";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "./CookieConsent-DgIWvNoO.js";
import "motion/react";
import "./SiteChrome-CBP-bGRL.js";
function PartnerSupport() {
  const getTurnstileToken = useTurnstile();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [purchaseSource, setPurchaseSource] = useState("");
  const [trialStatus, setTrialStatus] = useState("not_started");
  const [attachment, setAttachment] = useState(null);
  const [attachmentName, setAttachmentName] = useState("");
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [replying, setReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [error, setError] = useState(null);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const chatEndRef = useRef(null);
  useEffect(() => {
    const savedTicketId = localStorage.getItem("vq_partner_ticket_id");
    if (savedTicketId) {
      fetchTicket(savedTicketId);
    }
  }, []);
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [ticket?.replies]);
  useEffect(() => {
    if (!ticket) return;
    const interval = setInterval(() => {
      fetchTicketQuiet(ticket.id);
    }, 5e3);
    return () => clearInterval(interval);
  }, [ticket?.id]);
  const fetchTicket = async (id) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/partner-support/chat/${id}`);
      if (res.data.success) {
        setTicket(res.data.ticket);
      } else {
        localStorage.removeItem("vq_partner_ticket_id");
      }
    } catch (err) {
      localStorage.removeItem("vq_partner_ticket_id");
    } finally {
      setLoading(false);
    }
  };
  const fetchTicketQuiet = async (id) => {
    try {
      const res = await axios.get(`/api/partner-support/chat/${id}`);
      if (res.data.success) {
        setTicket(res.data.ticket);
      }
    } catch (err) {
    }
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachment(file);
      setAttachmentName(file.name);
    }
  };
  const handleStartChat = async (e) => {
    e.preventDefault();
    if (!attachment) {
      setError("Please upload a proof of purchase (invoice screenshot, PDF, etc.).");
      return;
    }
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("message", message);
    formData.append("purchase_source", purchaseSource);
    formData.append("trial_status", trialStatus);
    formData.append("attachment", attachment);
    try {
      const tt = await getTurnstileToken();
      if (tt) formData.append("cf-turnstile-response", tt);
      const res = await axios.post("/api/partner-support/chat", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      if (res.data.success) {
        setTicket(res.data.ticket);
        localStorage.setItem("vq_partner_ticket_id", res.data.ticket.id);
        setShowSuccessScreen(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit verification request. Please verify file types and fields.");
    } finally {
      setLoading(false);
    }
  };
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    setReplying(true);
    try {
      const res = await axios.post(`/api/partner-support/chat/${ticket.id}/reply`, {
        body: replyBody
      });
      if (res.data.success) {
        setTicket((prev) => ({
          ...prev,
          replies: [...prev.replies, res.data.reply]
        }));
        setReplyBody("");
      }
    } catch (err) {
    } finally {
      setReplying(false);
    }
  };
  const handleReset = () => {
    localStorage.removeItem("vq_partner_ticket_id");
    setTicket(null);
    setName("");
    setEmail("");
    setMessage("");
    setPurchaseSource("");
    setAttachment(null);
    setAttachmentName("");
    setShowSuccessScreen(false);
  };
  return /* @__PURE__ */ jsx(
    MarketingLayout,
    {
      title: "VIP Partner Support Desk — VenQore",
      description: "Verification & licensing support desk for operators using offline digital package solutions.",
      children: /* @__PURE__ */ jsx("section", { className: "vq-section vq-mkt-hero vq-psd", children: /* @__PURE__ */ jsxs("div", { className: "vq-container", style: { maxWidth: 920 }, children: [
        /* @__PURE__ */ jsxs("div", { className: "vq-section-head vq-section-head--center", style: { marginBottom: "var(--vq-space-10)" }, children: [
          /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot", children: "VIP partner desk" }),
          /* @__PURE__ */ jsx("h1", { className: "vq-display vq-mt-4", children: "Partner & owner support desk" }),
          /* @__PURE__ */ jsx("p", { className: "vq-lede", children: "Submit your digital product purchase details below. We manually verify details on our backend and credit your cloud store dashboard automatically." })
        ] }),
        loading ? /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-center", style: { paddingBlock: "var(--vq-space-16)" }, children: [
          /* @__PURE__ */ jsx(Loader2, { className: "animate-spin vq-accent-text", size: 40, style: { margin: "0 auto var(--vq-space-4)" }, "aria-hidden": "true" }),
          /* @__PURE__ */ jsx("p", { className: "vq-body vq-text-2", style: { marginInline: "auto" }, children: "Uploading details and securing communication link..." })
        ] }) : showSuccessScreen ? /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-mkt-form vq-center", children: [
          /* @__PURE__ */ jsx("span", { className: "vq-lead__icon vq-lead__icon--ok", children: /* @__PURE__ */ jsx(CheckCircle2, { size: 32, "aria-hidden": "true" }) }),
          /* @__PURE__ */ jsx("h2", { className: "vq-h2 vq-mt-6", children: "Thank you for your purchase!" }),
          /* @__PURE__ */ jsxs("p", { className: "vq-body vq-text-2 vq-mt-3", style: { marginInline: "auto" }, children: [
            "We have received your verification request. Our systems will manually review your uploaded invoice and confirm your account eligibility. This verification process typically takes ",
            /* @__PURE__ */ jsx("strong", { children: "1 to 2 business days" }),
            "."
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-psd__next vq-mt-8", children: [
            /* @__PURE__ */ jsx("span", { className: "vq-eyebrow vq-eyebrow--accent", children: "Next action required" }),
            /* @__PURE__ */ jsxs("p", { className: "vq-small vq-text-2 vq-mt-2", style: { lineHeight: 1.65 }, children: [
              "Please make sure you register your store on the cloud website using the ",
              /* @__PURE__ */ jsx("strong", { children: "EXACT SAME EMAIL" }),
              " address (",
              ticket?.requester_email,
              ") you provided in this form. Once verified, we will automatically credit the bonus trial days to your dashboard."
            ] }),
            /* @__PURE__ */ jsxs("a", { href: "/register", target: "_blank", className: "vq-link vq-mt-3", children: [
              "Create / register your new store ",
              /* @__PURE__ */ jsx(ExternalLink, { size: 14, "aria-hidden": "true" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "vq-row vq-wrap vq-gap-3 vq-mt-8", style: { justifyContent: "center" }, children: [
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setShowSuccessScreen(false), className: "vq-btn vq-btn--primary vq-btn--lg", children: "Go to active chat thread" }),
            /* @__PURE__ */ jsx("button", { type: "button", onClick: handleReset, className: "vq-btn vq-btn--secondary vq-btn--lg", children: "Submit another verification" })
          ] })
        ] }) : ticket ? (
          // ── CHAT SCREEN ──
          /* @__PURE__ */ jsxs("div", { className: "vq-card vq-card--xl vq-mkt-form", children: [
            /* @__PURE__ */ jsxs("div", { className: "vq-psd__chat-head", children: [
              /* @__PURE__ */ jsxs("div", { className: "vq-row vq-gap-3", children: [
                /* @__PURE__ */ jsx("span", { className: "vq-tile__icon", style: { marginBottom: 0 }, children: /* @__PURE__ */ jsx(User, { "aria-hidden": "true" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h2", { className: "vq-psd__who", children: ticket.requester_name }),
                  /* @__PURE__ */ jsx("p", { className: "vq-caption", children: ticket.requester_email })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("button", { type: "button", onClick: handleReset, className: "vq-btn vq-btn--ghost vq-btn--sm", children: [
                /* @__PURE__ */ jsx(ArrowLeft, { size: 14, "aria-hidden": "true" }),
                " New session"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-psd__thread custom-scrollbar", children: [
              ticket.replies && ticket.replies.map((reply, idx) => /* @__PURE__ */ jsx("div", { className: `vq-psd__msg ${reply.is_platform_owner ? "vq-psd__msg--them" : "vq-psd__msg--me"}`, children: /* @__PURE__ */ jsxs("div", { className: "vq-psd__bubble", children: [
                /* @__PURE__ */ jsx("span", { className: "vq-psd__from", children: reply.is_platform_owner ? "Engineering team (owner)" : "You (partner)" }),
                /* @__PURE__ */ jsx("p", { className: "whitespace-pre-wrap", children: reply.body })
              ] }) }, idx)),
              /* @__PURE__ */ jsx("div", { ref: chatEndRef })
            ] }),
            /* @__PURE__ */ jsxs("form", { onSubmit: handleSendReply, className: "vq-row vq-gap-3", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "psd-reply", className: "vq-sr", children: "Reply" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  id: "psd-reply",
                  type: "text",
                  value: replyBody,
                  onChange: (e) => setReplyBody(e.target.value),
                  placeholder: "Type support reply message...",
                  className: "vq-input",
                  style: { flex: 1 }
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "submit",
                  disabled: replying || !replyBody.trim(),
                  className: "vq-btn vq-btn--primary vq-btn--lg",
                  "aria-label": "Send reply",
                  children: replying ? /* @__PURE__ */ jsx(Loader2, { size: 18, className: "animate-spin" }) : /* @__PURE__ */ jsx(Send, { size: 18 })
                }
              )
            ] })
          ] })
        ) : (
          // ── FORM SCREEN ──
          /* @__PURE__ */ jsx("div", { className: "vq-card vq-card--xl vq-mkt-form", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleStartChat, className: "vq-mkt-form__grid", children: [
            error && /* @__PURE__ */ jsx("div", { className: "vq-mkt-form__full vq-psd__alert", role: "alert", children: error }),
            /* @__PURE__ */ jsxs("div", { className: "vq-field", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "psd-name", className: "vq-label", children: "Purchase roster name" }),
              /* @__PURE__ */ jsx("input", { id: "psd-name", type: "text", required: true, value: name, onChange: (e) => setName(e.target.value), placeholder: "Exact name used during check-out", className: "vq-input" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-field", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "psd-email", className: "vq-label", children: "Purchase email address" }),
              /* @__PURE__ */ jsx("input", { id: "psd-email", type: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value), placeholder: "Email used during check-out", className: "vq-input" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-field", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "psd-source", className: "vq-label", children: "Purchased from (platform)" }),
              /* @__PURE__ */ jsx("input", { id: "psd-source", type: "text", required: true, value: purchaseSource, onChange: (e) => setPurchaseSource(e.target.value), placeholder: "e.g. Etsy, VIP Partner Marketplace", className: "vq-input" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-field", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "psd-file", className: "vq-label", children: "Upload purchase invoice (JPG/PNG/PDF)" }),
              /* @__PURE__ */ jsxs("div", { className: "vq-psd__file", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    id: "psd-file",
                    type: "file",
                    required: true,
                    onChange: handleFileChange,
                    accept: ".jpg,.jpeg,.png,.pdf,.zip,.txt,.doc,.docx"
                  }
                ),
                /* @__PURE__ */ jsx("span", { children: attachmentName || "Select invoice file..." }),
                /* @__PURE__ */ jsx(Upload, { size: 18, "aria-hidden": "true" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("fieldset", { className: "vq-mkt-form__full vq-psd__choices", children: [
              /* @__PURE__ */ jsx("legend", { className: "vq-label", children: "Trial status option" }),
              /* @__PURE__ */ jsxs("div", { className: "vq-grid vq-grid--2 vq-mt-2", style: { gap: "var(--vq-space-4)" }, children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => setTrialStatus("started"),
                    "aria-pressed": trialStatus === "started",
                    className: "vq-psd__choice",
                    children: [
                      /* @__PURE__ */ jsx("span", { className: "vq-psd__choice-title", children: "Started 14-day trial" }),
                      /* @__PURE__ */ jsx("span", { className: "vq-psd__choice-body", children: "Get extra 30 days added onto your existing account." })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => setTrialStatus("not_started"),
                    "aria-pressed": trialStatus === "not_started",
                    className: "vq-psd__choice",
                    children: [
                      /* @__PURE__ */ jsx("span", { className: "vq-psd__choice-title", children: "I haven't started trial yet" }),
                      /* @__PURE__ */ jsx("span", { className: "vq-psd__choice-body", children: "Get a brand new store loaded with 45 full days of access." })
                    ]
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-mkt-form__full vq-psd__warn", children: [
              /* @__PURE__ */ jsx(Shield, { size: 20, "aria-hidden": "true" }),
              /* @__PURE__ */ jsxs("p", { children: [
                /* @__PURE__ */ jsx("strong", { children: "Verification check guarantee:" }),
                " Every request is manually matched against platform transaction ledgers. False entries or billing logs will trigger security rejection and platform access bans."
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "vq-field vq-mkt-form__full", children: [
              /* @__PURE__ */ jsxs("label", { htmlFor: "psd-msg", className: "vq-label", children: [
                "Additional comments ",
                /* @__PURE__ */ jsx("span", { className: "vq-text-3", children: "(optional)" })
              ] }),
              /* @__PURE__ */ jsx("textarea", { id: "psd-msg", rows: 3, value: message, onChange: (e) => setMessage(e.target.value), placeholder: "Any comments, requests or license numbers you want to include...", className: "vq-textarea" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "vq-mkt-form__full", children: /* @__PURE__ */ jsx("button", { type: "submit", disabled: loading, className: "vq-btn vq-btn--primary vq-btn--lg vq-btn--block", children: "Submit license details" }) })
          ] }) })
        )
      ] }) })
    }
  );
}
export {
  PartnerSupport as default
};
