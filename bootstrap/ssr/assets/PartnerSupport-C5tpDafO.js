import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import MarketingLayout, { RevealOnScroll, SectionLabel, GlassCard, MagneticButton } from "./MarketingLayout-CMiC1Bik.js";
import { MessageSquare, Loader2, CheckCircle2, ExternalLink, User, ArrowLeft, Send, Upload, Shield } from "lucide-react";
import axios from "axios";
import "@inertiajs/react";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
function PartnerSupport() {
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
      children: /* @__PURE__ */ jsxs("section", { className: "relative pt-40 pb-24 px-6 min-h-screen flex items-center justify-center", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" }),
        /* @__PURE__ */ jsxs("div", { className: "max-w-4xl w-full mx-auto relative z-10", children: [
          /* @__PURE__ */ jsx(RevealOnScroll, { children: /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
            /* @__PURE__ */ jsx(SectionLabel, { icon: MessageSquare, children: "VIP Partner Desk" }),
            /* @__PURE__ */ jsxs("h1", { className: "text-4xl md:text-5xl font-black tracking-tighter leading-tight mt-4 mb-4 font-display", children: [
              /* @__PURE__ */ jsx("span", { className: "bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent", children: "Partner & Owner" }),
              " ",
              /* @__PURE__ */ jsx("span", { className: "bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-300 bg-clip-text text-transparent vq-text-glow", children: "Support Desk." })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed", children: "Submit your digital product purchase details below. We manually verify details on our backend and credit your cloud store dashboard automatically." })
          ] }) }),
          loading ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-20", children: [
            /* @__PURE__ */ jsx(Loader2, { className: "animate-spin text-indigo-500 mb-4", size: 40 }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm", children: "Uploading details and securing communication link..." })
          ] }) : showSuccessScreen ? /* @__PURE__ */ jsx(RevealOnScroll, { children: /* @__PURE__ */ jsxs(GlassCard, { className: "p-8 border border-emerald-500/20 bg-slate-900/60 backdrop-blur-xl rounded-[2rem] shadow-2xl text-center space-y-6", children: [
            /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto", children: /* @__PURE__ */ jsx(CheckCircle2, { size: 40 }) }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black text-white", children: "Thank you for your purchase!" }),
              /* @__PURE__ */ jsxs("p", { className: "text-slate-400 text-sm max-w-lg mx-auto leading-relaxed", children: [
                "We have received your verification request. Our systems will manually review your uploaded invoice and confirm your account eligibility. This verification process typically takes ",
                /* @__PURE__ */ jsx("strong", { children: "1 to 2 business days" }),
                "."
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-2xl bg-indigo-950/20 border border-indigo-500/10 text-left max-w-xl mx-auto space-y-3", children: [
              /* @__PURE__ */ jsx("span", { className: "block text-xs font-black uppercase tracking-wider text-indigo-400", children: "Next Action Required:" }),
              /* @__PURE__ */ jsxs("p", { className: "text-slate-300 text-xs leading-relaxed", children: [
                "Please make sure you register your store on the cloud website using the ",
                /* @__PURE__ */ jsx("strong", { children: "EXACT SAME EMAIL" }),
                " address (",
                ticket?.requester_email,
                ") you provided in this form. Once verified, we will automatically credit the bonus trial days to your dashboard."
              ] }),
              /* @__PURE__ */ jsx("div", { className: "pt-2", children: /* @__PURE__ */ jsxs(
                "a",
                {
                  href: "/register",
                  target: "_blank",
                  className: "inline-flex items-center gap-2 text-xs font-black text-indigo-400 hover:text-indigo-300 transition-colors",
                  children: [
                    "Create / Register Your New Store ",
                    /* @__PURE__ */ jsx(ExternalLink, { size: 12 })
                  ]
                }
              ) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "pt-4 flex justify-center gap-4", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setShowSuccessScreen(false),
                  className: "px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors",
                  children: "Go to Active Chat Thread"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: handleReset,
                  className: "px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-colors",
                  children: "Submit Another Verification"
                }
              )
            ] })
          ] }) }) : ticket ? (
            // ── CHAT SCREEN ──
            /* @__PURE__ */ jsx(RevealOnScroll, { delay: 0.1, children: /* @__PURE__ */ jsxs(GlassCard, { className: "p-8 border border-white/[0.06] bg-slate-900/40 backdrop-blur-xl rounded-[2rem] shadow-2xl relative", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-white/5 pb-4 mb-6", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center", children: /* @__PURE__ */ jsx(User, { size: 18 }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("h3", { className: "font-bold text-sm text-white", children: ticket.requester_name }),
                    /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-xs", children: ticket.requester_email })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: handleReset,
                    className: "text-xs text-slate-500 hover:text-white flex items-center gap-1.5 transition-colors",
                    children: [
                      /* @__PURE__ */ jsx(ArrowLeft, { size: 14 }),
                      " New Session"
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "h-96 overflow-y-auto space-y-4 pr-2 mb-6 custom-scrollbar", children: [
                ticket.replies && ticket.replies.map((reply, idx) => /* @__PURE__ */ jsx("div", { className: `flex ${reply.is_platform_owner ? "justify-start" : "justify-end"}`, children: /* @__PURE__ */ jsxs("div", { className: `max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed border ${reply.is_platform_owner ? "bg-slate-800 border-slate-700/50 text-slate-200 rounded-tl-none" : "bg-indigo-600/10 border-indigo-500/20 text-indigo-200 rounded-tr-none"}`, children: [
                  /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 mb-1.5 text-[9px] font-bold uppercase tracking-wider", children: reply.is_platform_owner ? /* @__PURE__ */ jsx("span", { className: "text-indigo-400", children: "Engineering Team (Owner)" }) : /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "You (Partner)" }) }),
                  /* @__PURE__ */ jsx("p", { className: "whitespace-pre-wrap", children: reply.body })
                ] }) }, idx)),
                /* @__PURE__ */ jsx("div", { ref: chatEndRef })
              ] }),
              /* @__PURE__ */ jsxs("form", { onSubmit: handleSendReply, className: "flex gap-3", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: replyBody,
                    onChange: (e) => setReplyBody(e.target.value),
                    placeholder: "Type support reply message...",
                    className: "flex-1 px-5 py-4 bg-white/[0.03] border border-white/[0.06] focus:border-indigo-500/40 rounded-2xl text-white text-sm outline-none transition-all duration-300"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "submit",
                    disabled: replying || !replyBody.trim(),
                    className: "w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl flex items-center justify-center transition-colors disabled:opacity-40",
                    children: replying ? /* @__PURE__ */ jsx(Loader2, { size: 18, className: "animate-spin" }) : /* @__PURE__ */ jsx(Send, { size: 18 })
                  }
                )
              ] })
            ] }) })
          ) : (
            // ── FORM SCREEN ──
            /* @__PURE__ */ jsx(RevealOnScroll, { delay: 0.1, children: /* @__PURE__ */ jsx(GlassCard, { className: "p-8 border border-white/[0.06] bg-slate-900/40 backdrop-blur-xl rounded-[2rem] shadow-2xl", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleStartChat, className: "space-y-6", children: [
              error && /* @__PURE__ */ jsx("div", { className: "p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold", children: error }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-5", children: [
                /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black uppercase tracking-[0.25em] mb-3 text-slate-500 group-focus-within:text-indigo-400 transition-colors", children: "Purchase Roster Name" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      required: true,
                      value: name,
                      onChange: (e) => setName(e.target.value),
                      placeholder: "Exact name used during check-out",
                      className: "w-full px-5 py-4 bg-white/[0.03] border border-white/[0.06] hover:border-white/10 focus:border-indigo-500/40 focus:bg-indigo-500/[0.03] rounded-2xl text-white text-sm outline-none transition-all duration-500"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black uppercase tracking-[0.25em] mb-3 text-slate-500 group-focus-within:text-indigo-400 transition-colors", children: "Purchase Email Address" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "email",
                      required: true,
                      value: email,
                      onChange: (e) => setEmail(e.target.value),
                      placeholder: "Email used during check-out",
                      className: "w-full px-5 py-4 bg-white/[0.03] border border-white/[0.06] hover:border-white/10 focus:border-indigo-500/40 focus:bg-indigo-500/[0.03] rounded-2xl text-white text-sm outline-none transition-all duration-500"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-5", children: [
                /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black uppercase tracking-[0.25em] mb-3 text-slate-500 group-focus-within:text-indigo-400 transition-colors", children: "Purchased From (Platform)" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      required: true,
                      value: purchaseSource,
                      onChange: (e) => setPurchaseSource(e.target.value),
                      placeholder: "e.g. Etsy, VIP Partner Marketplace",
                      className: "w-full px-5 py-4 bg-white/[0.03] border border-white/[0.06] hover:border-white/10 focus:border-indigo-500/40 focus:bg-indigo-500/[0.03] rounded-2xl text-white text-sm outline-none transition-all duration-500"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black uppercase tracking-[0.25em] mb-3 text-slate-500", children: "Upload Purchase Invoice (JPG/PNG/PDF)" }),
                  /* @__PURE__ */ jsxs("div", { className: "relative w-full h-14 bg-white/[0.03] border border-white/[0.06] hover:border-white/10 rounded-2xl flex items-center justify-between px-5 transition-all duration-500 cursor-pointer overflow-hidden", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "file",
                        required: true,
                        onChange: handleFileChange,
                        accept: ".jpg,.jpeg,.png,.pdf,.zip,.txt,.doc,.docx",
                        className: "absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { className: "text-slate-400 text-xs truncate max-w-[200px]", children: attachmentName || "Select invoice file..." }),
                    /* @__PURE__ */ jsx(Upload, { size: 16, className: "text-slate-500" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black uppercase tracking-[0.25em] text-slate-500", children: "Trial Status Option" }),
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: () => setTrialStatus("started"),
                      className: `w-full p-5 rounded-2xl border text-left transition-all duration-300 flex flex-col gap-1 ${trialStatus === "started" ? "bg-indigo-500/10 border-indigo-500/40 text-white shadow-lg" : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:border-white/10 hover:bg-white/[0.04]"}`,
                      children: [
                        /* @__PURE__ */ jsx("span", { className: `text-xs font-black uppercase tracking-wider ${trialStatus === "started" ? "text-indigo-400" : "text-slate-200"}`, children: "Started 14-day trial" }),
                        /* @__PURE__ */ jsx("span", { className: "text-[11px] leading-relaxed opacity-85", children: "Get extra 30 days added onto your existing account." })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: () => setTrialStatus("not_started"),
                      className: `w-full p-5 rounded-2xl border text-left transition-all duration-300 flex flex-col gap-1 ${trialStatus === "not_started" ? "bg-indigo-500/10 border-indigo-500/40 text-white shadow-lg" : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:border-white/10 hover:bg-white/[0.04]"}`,
                      children: [
                        /* @__PURE__ */ jsx("span", { className: `text-xs font-black uppercase tracking-wider ${trialStatus === "not_started" ? "text-indigo-400" : "text-slate-200"}`, children: "I haven't started trial yet" }),
                        /* @__PURE__ */ jsx("span", { className: "text-[11px] leading-relaxed opacity-85", children: "Get a brand new store loaded with 45 full days of access." })
                      ]
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-3 text-slate-400 text-xs leading-relaxed", children: [
                /* @__PURE__ */ jsx(Shield, { size: 24, className: "text-amber-400 shrink-0 mt-0.5" }),
                /* @__PURE__ */ jsxs("p", { children: [
                  /* @__PURE__ */ jsx("strong", { children: "Verification Check Guarantee:" }),
                  " Every request is manually matched against platform transaction ledgers. False entries or billing logs will trigger security rejection and platform access bans."
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
                /* @__PURE__ */ jsx("label", { className: "block text-[10px] font-black uppercase tracking-[0.25em] mb-3 text-slate-500 group-focus-within:text-indigo-400 transition-colors", children: "Additional Comments (Optional)" }),
                /* @__PURE__ */ jsx(
                  "textarea",
                  {
                    rows: 3,
                    value: message,
                    onChange: (e) => setMessage(e.target.value),
                    placeholder: "Any comments, requests or license numbers you want to include...",
                    className: "w-full px-5 py-4 bg-white/[0.03] border border-white/[0.06] hover:border-white/10 focus:border-indigo-500/40 focus:bg-indigo-500/[0.03] rounded-2xl text-white text-sm outline-none transition-all duration-500 resize-none"
                  }
                )
              ] }),
              /* @__PURE__ */ jsx(
                MagneticButton,
                {
                  type: "submit",
                  disabled: loading,
                  variant: "indigo",
                  className: "w-full h-14 rounded-2xl font-black text-sm tracking-[0.15em] uppercase flex items-center justify-center gap-3 transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50 group",
                  children: "Submit License Details"
                }
              )
            ] }) }) })
          )
        ] })
      ] })
    }
  );
}
export {
  PartnerSupport as default
};
