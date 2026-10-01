import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { usePage, router } from "@inertiajs/react";
import { X, AlertCircle, RotateCcw, Loader2, Sparkles, Send, Minimize2, Maximize2, Play } from "lucide-react";
import { V as VenaLogo } from "./VenaLogo-g2utA0Kh.js";
import axios from "axios";
import "laravel-echo";
import "pusher-js";
import Dexie from "dexie";
const db = new Dexie("VenQoreChatbotDB");
db.version(1).stores({
  sessions: "session_uuid, status, visitor_name, visitor_email, updated_at",
  messages: "++id, session_uuid, sender_type, sender_name, body, created_at"
});
function ChatWidget({ embedded = false }) {
  const { store, auth, turnstile_site_key } = usePage().props;
  const { url } = usePage();
  const [turnstileToken, setTurnstileToken] = useState(null);
  const turnstileWidgetId = useRef(null);
  const turnstileContainerRef = useRef(null);
  useEffect(() => {
    if (!turnstile_site_key) return;
    const renderWidget = () => {
      if (window.turnstile && turnstileContainerRef.current && turnstileWidgetId.current === null) {
        try {
          turnstileWidgetId.current = window.turnstile.render(turnstileContainerRef.current, {
            sitekey: turnstile_site_key,
            size: "invisible",
            callback: (token) => {
              setTurnstileToken(token);
            },
            "expired-callback": () => {
              setTurnstileToken(null);
              if (turnstileWidgetId.current !== null && window.turnstile) {
                window.turnstile.reset(turnstileWidgetId.current);
              }
            },
            "error-callback": () => {
              setTurnstileToken(null);
            }
          });
        } catch (err) {
          console.warn("Turnstile render warning:", err);
        }
      }
    };
    const scriptId = "cf-turnstile-script";
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.onload = () => {
        renderWidget();
      };
      document.head.appendChild(script);
    } else {
      if (window.turnstile) {
        renderWidget();
      } else {
        script.addEventListener("load", renderWidget, { once: true });
      }
    }
    return () => {
      if (turnstileWidgetId.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(turnstileWidgetId.current);
        } catch (e) {
        }
        turnstileWidgetId.current = null;
      }
    };
  }, [turnstile_site_key]);
  const showMobileNavBar = (() => {
    if (!auth?.user) return false;
    const path = url.toLowerCase();
    const isReturnsHistoryList = path.includes("/returns-history") && !path.includes("/create") && !path.includes("/edit") && !path.includes("/return-detail");
    if (isReturnsHistoryList) return true;
    if (path.includes("/pos")) return false;
    const isCreateFlow = path.includes("/create");
    const isEditFlow = path.includes("/edit");
    const isReturnFlow = path.includes("/return") && !path.includes("/returns-history");
    const isRefundFlow = path.includes("/refund");
    const isSetupFlow = path.includes("/setup") || path.includes("/new-store") || path.includes("/start") || path.includes("/build-workspace");
    if (isCreateFlow || isEditFlow || isReturnFlow || isRefundFlow || isSetupFlow) {
      return false;
    }
    return true;
  })();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [confirmNewChat, setConfirmNewChat] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [visitorName, setVisitorName] = useState(auth?.user?.name || "Guest");
  const [visitorEmail, setVisitorEmail] = useState(auth?.user?.email || "");
  const [messageText, setMessageText] = useState("");
  const [sessionUuid, setSessionUuid] = useState(() => {
    if (!store) return null;
    return localStorage.getItem(`vq_chat_uuid_${store.id}`) || null;
  });
  const [sessionStatus, setSessionStatus] = useState("bot_active");
  const [venaContext, setVenaContext] = useState(null);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  useRef(null);
  const activeChannel = useRef(null);
  const typingTimeoutRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    if (store) {
      const cachedUuid = localStorage.getItem(`vq_chat_uuid_${store.id}`);
      if (cachedUuid && cachedUuid !== sessionUuid) {
        setSessionUuid(cachedUuid);
      }
    }
  }, [store]);
  useEffect(() => {
    if (auth?.user) {
      setVisitorName(auth.user.name || "Guest");
      setVisitorEmail(auth.user.email || "");
    }
  }, [auth]);
  useEffect(() => {
    if (sessionUuid && store) restoreSession();
  }, [sessionUuid, store]);
  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, typing, isOpen]);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && isExpanded) setIsExpanded(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isExpanded]);
  useEffect(() => {
    if ((embedded || isOpen || isExpanded) && !started && !loading && !sessionUuid && store) {
      handleStartSession();
    }
  }, [embedded, isOpen, isExpanded, started, loading, sessionUuid, store]);
  const fetchVenaContext = async () => {
    try {
      const res = await axios.get(`/api/${store.slug}/vena/context`);
      setVenaContext(res.data);
    } catch (err) {
      console.warn("Vena: Could not fetch subscription context.", err);
    }
  };
  const restoreSession = async () => {
    setLoading(true);
    setConnectionError(null);
    try {
      const cachedMsgs = await db.messages.where("session_uuid").equals(sessionUuid).sortBy("created_at");
      if (cachedMsgs.length > 0) {
        setMessages(cachedMsgs);
        setStarted(true);
      }
      const res = await axios.post(`/api/${store.slug}/chatbot/session`, { session_uuid: sessionUuid });
      const data = res.data;
      if (data.session_uuid && data.session_uuid !== sessionUuid) {
        setSessionUuid(data.session_uuid);
        localStorage.setItem(`vq_chat_uuid_${store?.id}`, data.session_uuid);
      }
      setSessionStatus(data.status);
      setVisitorName(data.visitor_name);
      setVisitorEmail(data.visitor_email);
      if (data.messages?.length > 0) {
        setMessages(data.messages);
        await db.transaction("rw", db.messages, async () => {
          await db.messages.where("session_uuid").equals(sessionUuid).delete();
          await db.messages.bulkAdd(data.messages.map((m) => ({
            session_uuid: sessionUuid,
            sender_type: m.sender_type,
            sender_name: m.sender_name,
            body: m.body,
            created_at: m.created_at
          })));
        });
      }
      setStarted(true);
      initializeEcho(data.session_uuid || sessionUuid);
      fetchVenaContext();
    } catch (err) {
      console.warn("Failed to restore chat session, auto-healing with fresh session:", err);
      localStorage.removeItem(`vq_chat_uuid_${store?.id}`);
      setSessionUuid(null);
      await handleStartSession();
    } finally {
      setLoading(false);
    }
  };
  const handleStartSession = async (e) => {
    setLoading(true);
    setConnectionError(null);
    try {
      const name = auth?.user?.name || "Guest";
      const email = auth?.user?.email || null;
      const tokenToSubmit = turnstileToken || (window.turnstile ? window.turnstile.getResponse() : null);
      const res = await axios.post(`/api/${store?.slug}/chatbot/session`, {
        visitor_name: name,
        visitor_email: email,
        turnstile_token: tokenToSubmit
      });
      const data = res.data;
      setSessionUuid(data.session_uuid);
      setSessionStatus(data.status);
      localStorage.setItem(`vq_chat_uuid_${store?.id}`, data.session_uuid);
      await db.sessions.put({
        session_uuid: data.session_uuid,
        status: data.status,
        visitor_name: name,
        visitor_email: email,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      setMessages(data.messages || []);
      setStarted(true);
      initializeEcho(data.session_uuid);
      fetchVenaContext();
    } catch (err) {
      console.error("Failed to start session:", err);
      setConnectionError(err?.response?.data?.error || err?.message || "Unable to connect to support.");
    } finally {
      setLoading(false);
    }
  };
  const handleNewChat = () => {
    setConfirmNewChat(false);
    setConnectionError(null);
    if (activeChannel.current) {
      activeChannel.current.stopListening(".MessageSent").stopListening(".TypingStarted").stopListening(".TypingStopped").stopListening(".SessionStatusChanged");
      activeChannel.current = null;
    }
    localStorage.removeItem(`vq_chat_uuid_${store.id}`);
    setSessionUuid(null);
    setMessages([]);
    setStarted(false);
    setSessionStatus("bot_active");
    setVisitorName("");
    setVisitorEmail("");
    setMessageText("");
    setTyping(false);
    setVenaContext(null);
  };
  const initializeEcho = (uuid) => {
    return;
  };
  const handleSendMessage = async (textToSend) => {
    const text = textToSend || messageText;
    if (!text.trim() || sending) return;
    if (!textToSend) setMessageText("");
    setSending(true);
    const tempId = `temp_${Date.now()}`;
    const tempMsg = {
      id: tempId,
      sender_type: "visitor",
      sender_name: visitorName || "Guest",
      body: text,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    setMessages((prev) => [...prev, tempMsg]);
    try {
      handleVisitorTyping(false);
      const res = await axios.post(`/api/${store.slug}/chatbot/session/${sessionUuid}/message`, {
        body: text,
        vena_context: venaContext || null
      });
      if (res.data.success) {
        const serverMsg = res.data.message;
        setMessages((prev) => prev.map((m) => m.id === tempId ? serverMsg : m));
        await db.messages.add({
          session_uuid: sessionUuid,
          sender_type: serverMsg.sender_type,
          sender_name: serverMsg.sender_name,
          body: serverMsg.body,
          created_at: serverMsg.created_at
        });
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        sender_type: "system",
        sender_name: "System",
        body: "We are experiencing a brief connection issue. Your message has been saved and a support team member will follow up shortly.",
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      }]);
    } finally {
      setSending(false);
    }
  };
  const handleVisitorTyping = (isTyping) => {
    if (!sessionUuid) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    axios.post(`/api/${store.slug}/chatbot/session/${sessionUuid}/typing`, { typing: isTyping });
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => handleVisitorTyping(false), 4e3);
    }
  };
  const executeAction = (actionName) => {
    const routes = {
      pos: "store.pos",
      create_invoice: "store.sales.invoice.create",
      expenses: "store.expenses.index",
      invoices: "store.sales.dashboard",
      settings: "store.settings"
    };
    if (actionName === "handoff") {
      handleSendMessage("I need to speak with a member of your support team, please.");
      return;
    }
    if (routes[actionName]) {
      setIsOpen(false);
      setIsExpanded(false);
      router.visit(route(routes[actionName], { store_slug: store.slug }));
    }
  };
  const renderMessageBody = (body) => {
    const regex = /\[([^\]]+)\]\(action:([a-zA-Z0-9_-]+)\)/g;
    let lastIndex = 0;
    const result = [];
    let match;
    while ((match = regex.exec(body)) !== null) {
      const textBefore = body.slice(lastIndex, match.index);
      if (textBefore) result.push(/* @__PURE__ */ jsx("span", { className: "whitespace-pre-wrap", children: textBefore }, lastIndex));
      result.push(
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => executeAction(match[2]),
            className: embedded ? "inline-flex items-center gap-1.5 px-3 py-1.5 my-1 mx-0.5 bg-white/10 text-[#93ebd6] border border-white/15 hover:bg-white/15 rounded-lg text-xs font-bold shadow-sm transition-all" : "inline-flex items-center gap-1.5 px-3 py-1.5 my-1 mx-0.5 bg-surface text-brand-600 dark:bg-surface dark:text-brand-400 border border-line hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg text-xs font-bold shadow-sm transition-all duration-normal",
            children: [
              /* @__PURE__ */ jsx(Play, { size: 10, className: embedded ? "fill-[#23C4A6] stroke-none" : "fill-brand-600 dark:fill-brand-400 stroke-none" }),
              match[1]
            ]
          },
          match.index
        )
      );
      lastIndex = regex.lastIndex;
    }
    const textAfter = body.slice(lastIndex);
    if (textAfter) result.push(/* @__PURE__ */ jsx("span", { className: "whitespace-pre-wrap", children: textAfter }, lastIndex));
    return result.length > 0 ? result : body;
  };
  const renderChatBody = () => /* @__PURE__ */ jsx(Fragment, { children: !started ? /* @__PURE__ */ jsx("div", { className: "flex-1 p-8 flex flex-col items-center justify-center relative z-10 text-center space-y-4", children: connectionError ? /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { className: `w-12 h-12 rounded-2xl flex items-center justify-center mb-1 ${embedded ? "bg-rose-500/15 border border-rose-500/30 text-rose-300" : "bg-rose-50 border border-rose-200 text-rose-500"}`, children: /* @__PURE__ */ jsx(AlertCircle, { size: 22 }) }),
    /* @__PURE__ */ jsx("p", { className: `text-sm font-semibold max-w-[260px] ${embedded ? "text-rose-200" : "text-rose-600"}`, children: connectionError }),
    /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => handleStartSession(),
        className: `px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${embedded ? "bg-white/10 hover:bg-white/15 text-white border border-white/10 shadow-sm" : "bg-brand-600 hover:bg-brand-700 text-white shadow-md"}`,
        children: [
          /* @__PURE__ */ jsx(RotateCcw, { size: 13 }),
          "Retry Connection"
        ]
      }
    )
  ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Loader2, { className: `animate-spin ${embedded ? "text-[#23C4A6]" : "text-brand-500"}`, size: 32 }),
    /* @__PURE__ */ jsx("p", { style: { fontSize: 15 }, className: embedded ? "text-white/70 font-medium" : "text-ink-muted font-medium", children: "Connecting to support…" })
  ] }) }) : (
    /* Message stream */
    /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col overflow-hidden relative z-10", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar", children: [
        messages.length === 0 && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-full text-center p-6 space-y-2 opacity-70", children: [
          /* @__PURE__ */ jsx(Sparkles, { size: 24, className: embedded ? "text-[#23C4A6] animate-pulse" : "text-brand-500 animate-pulse" }),
          /* @__PURE__ */ jsx("h5", { className: `text-xs font-bold ${embedded ? "text-white" : "text-ink-secondary dark:text-ink"}`, children: "Start a Conversation" }),
          /* @__PURE__ */ jsx("p", { className: `text-2xs max-w-[200px] ${embedded ? "text-white/60" : "text-ink-muted"}`, children: "Send a message and our support team will reply instantly." })
        ] }),
        messages.map((m, i) => {
          const isVisitor = m.sender_type === "visitor";
          const isBot = m.sender_type === "bot";
          const isSystem = m.sender_type === "system";
          if (isSystem) return null;
          return /* @__PURE__ */ jsx("div", { className: `flex ${isVisitor ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-1 duration-fast`, children: /* @__PURE__ */ jsxs("div", { style: { fontSize: 15, lineHeight: 1.5 }, className: `max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${isVisitor ? embedded ? "bg-gradient-to-r from-[#23C4A6] to-[#1da58c] text-[#062421] font-semibold rounded-tr-none shadow-md shadow-[#23C4A6]/20" : "bg-brand-600 text-white rounded-tr-none font-medium" : isBot ? embedded ? "bg-white/[0.08] text-white/90 border border-white/10 rounded-tl-none leading-relaxed backdrop-blur-md" : "bg-sunken text-ink rounded-tl-none leading-relaxed" : embedded ? "bg-emerald-500/15 text-emerald-200 border border-emerald-500/30 rounded-tl-none leading-relaxed" : "bg-brand-50 dark:bg-brand-950/20 text-brand-950 dark:text-brand-300 border border-brand-100 dark:border-brand-900 rounded-tl-none leading-relaxed"}`, children: [
            /* @__PURE__ */ jsxs("div", { style: { fontSize: 12, letterSpacing: "0.12em", fontWeight: 600 }, className: "uppercase mb-1.5 opacity-70 flex items-center gap-1.5", children: [
              isBot && /* @__PURE__ */ jsx(VenaLogo, { size: 12 }),
              isVisitor ? "You" : isBot ? "Vena AI" : "Support"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "whitespace-pre-line leading-relaxed", children: renderMessageBody(m.body) })
          ] }) }, i);
        }),
        typing && /* @__PURE__ */ jsxs("div", { style: { fontSize: 14 }, className: `flex items-center gap-2 font-medium py-2 animate-pulse ${embedded ? "text-white/60" : "text-ink-muted"}`, children: [
          /* @__PURE__ */ jsx(Loader2, { size: 14, className: `animate-spin ${embedded ? "text-[#23C4A6]" : "text-brand-500"}` }),
          /* @__PURE__ */ jsx("span", { children: "Support is typing…" })
        ] }),
        /* @__PURE__ */ jsx("div", { ref: messagesEndRef })
      ] }),
      !messages.some((m) => m.sender_type === "visitor") && /* @__PURE__ */ jsxs("div", { className: "px-6 py-4 shrink-0", style: { borderTop: embedded ? "1px solid rgba(255,255,255,0.08)" : "1px solid var(--vq-line-soft)" }, children: [
        /* @__PURE__ */ jsx(
          "p",
          {
            style: { fontSize: 12, letterSpacing: "0.12em", fontWeight: 600 },
            className: `uppercase mb-2.5 ${embedded ? "text-white/50" : "text-ink-muted"}`,
            children: "Jump to"
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-3", children: [["Point of Sale", "pos"], ["New invoice", "create_invoice"], ["Expenses", "expenses"]].map(([label, action]) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => executeAction(action),
            style: { fontSize: 14, fontWeight: 700, height: 44 },
            className: embedded ? "px-3 bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-[#23C4A6]/40 text-white/90 flex items-center justify-center transition-all rounded-xl shadow-sm backdrop-blur-sm" : "px-3 bg-surface border border-line hover:border-brand-300 text-ink flex items-center justify-center transition-all rounded-xl",
            children: label
          },
          action
        )) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "p-6 shrink-0", style: {
        borderTop: embedded ? "1px solid rgba(255,255,255,0.08)" : "1px solid var(--vq-line-soft)",
        background: embedded ? "transparent" : "var(--vq-surface)"
      }, children: /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
        e.preventDefault();
        handleSendMessage();
      }, className: "flex gap-2 relative items-center", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: messageText,
            onChange: (e) => {
              setMessageText(e.target.value);
              handleVisitorTyping(e.target.value.length > 0);
            },
            className: embedded ? "flex-1 pl-4 pr-12 py-3 bg-white/[0.06] border border-white/10 hover:border-white/20 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-[#23C4A6]/50 focus:border-[#23C4A6] text-white transition-all font-sans placeholder-white/30" : "flex-1 pl-4 pr-12 py-3 bg-app border border-line rounded-2xl text-xs outline-none focus:ring-2 focus:ring-brand-500 text-ink transition-all font-sans placeholder-slate-400",
            placeholder: "Type your message here...",
            disabled: sending
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            disabled: !messageText.trim() || sending,
            className: embedded ? "absolute right-1.5 p-2 bg-[#23C4A6] hover:bg-[#20b297] active:scale-90 text-[#062421] font-bold rounded-xl transition-all shadow-md disabled:opacity-30 disabled:hover:bg-[#23C4A6] disabled:active:scale-100 flex items-center justify-center" : "absolute right-1.5 p-2 bg-brand-600 hover:bg-brand-700 active:scale-90 text-white rounded-xl transition-all shadow-md disabled:opacity-30 disabled:hover:bg-brand-600 disabled:active:scale-100 flex items-center justify-center",
            children: /* @__PURE__ */ jsx(Send, { size: 14 })
          }
        )
      ] }) })
    ] })
  ) });
  const renderHeader = (closeFn) => /* @__PURE__ */ jsxs("div", { className: "px-5 py-4 bg-neutral-900 text-white shrink-0 relative flex items-center justify-between border-b border-neutral-800/80", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/images/noise.svg')] opacity-15 pointer-events-none" }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 relative z-10", children: [
      /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-brand-600/30 border border-brand-500/30 flex items-center justify-center p-2 text-brand-400 shadow-inner shrink-0", children: /* @__PURE__ */ jsx(VenaLogo, { size: 24, className: "drop-shadow-sm" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h4", { className: "text-sm font-bold tracking-tight flex items-center gap-1.5", children: [
          "Vena AI Support",
          sessionStatus === "agent_active" && /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-emerald-500 animate-ping ml-1" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-2xs text-brand-300 font-bold uppercase tracking-wider mt-0.5", children: "Online" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 relative z-10", children: [
      started && (confirmNewChat ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx("span", { className: "text-2xs text-ink-muted font-medium mr-1", children: "Start over?" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleNewChat,
            className: "px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-2xs font-bold transition-all active:scale-90",
            children: "Yes"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setConfirmNewChat(false),
            className: "px-2.5 py-1 bg-neutral-700 hover:bg-interactive-hover text-neutral-300 rounded-lg text-2xs font-bold transition-all active:scale-90",
            children: "No"
          }
        )
      ] }) : /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setConfirmNewChat(true),
          title: "Start a new chat",
          className: "w-8 h-8 rounded-xl bg-neutral-800/60 hover:bg-interactive-hover border border-neutral-700/50 flex items-center justify-center text-ink-muted hover:text-white transition-all duration-normal active:scale-90",
          children: /* @__PURE__ */ jsx(RotateCcw, { size: 13 })
        }
      )),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setIsExpanded((v) => !v),
          title: isExpanded ? "Collapse chat" : "Expand to sidebar",
          className: "w-8 h-8 rounded-xl bg-neutral-800/60 hover:bg-interactive-hover border border-neutral-700/50 flex items-center justify-center text-ink-muted hover:text-white transition-all duration-normal active:scale-90",
          children: isExpanded ? /* @__PURE__ */ jsx(Minimize2, { size: 13 }) : /* @__PURE__ */ jsx(Maximize2, { size: 13 })
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: closeFn,
          className: "w-8 h-8 rounded-xl bg-neutral-800/60 hover:bg-interactive-hover border border-neutral-700/50 flex items-center justify-center text-ink-muted hover:text-white transition-all duration-normal active:scale-90",
          children: /* @__PURE__ */ jsx(X, { size: 14 })
        }
      )
    ] })
  ] });
  if (!store) return null;
  if (embedded) {
    return /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full w-full font-sans relative overflow-hidden", children: [
      renderChatBody(),
      /* @__PURE__ */ jsx("div", { ref: turnstileContainerRef, id: "turnstile-chat-container", className: "hidden" })
    ] });
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    isExpanded && /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed inset-0 bg-black/20 backdrop-blur-[2px] z-command transition-opacity duration-slow",
        onClick: () => setIsExpanded(false)
      }
    ),
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: `fixed top-0 right-0 h-full z-command flex flex-col bg-surface border-l border-line shadow-2xl transition-all duration-slow ease-out font-sans ${isExpanded ? "translate-x-0 w-[420px]" : "translate-x-full w-[420px]"}`,
        style: { isolation: "isolate" },
        children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-[80px] pointer-events-none" }),
          /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-64 h-64 bg-brand-500/5 rounded-full blur-[80px] pointer-events-none" }),
          renderHeader(() => {
            setIsExpanded(false);
            setIsOpen(false);
          }),
          renderChatBody()
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: `fixed right-6 z-sticky font-sans transition-all duration-slow ${showMobileNavBar ? "bottom-[100px] lg:bottom-6" : "bottom-6"}`, style: { isolation: "isolate" }, children: [
      isOpen && !isExpanded && /* @__PURE__ */ jsxs("div", { className: "mb-4 w-96 h-[520px] bg-surface border border-line rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-slow relative", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-48 h-48 bg-brand-500/5 rounded-full blur-[50px] pointer-events-none" }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-48 h-48 bg-brand-500/5 rounded-full blur-[50px] pointer-events-none" }),
        renderHeader(() => setIsOpen(false)),
        renderChatBody()
      ] }),
      !isExpanded && /* @__PURE__ */ jsxs(
        "button",
        {
          id: "tour-chat-widget-btn",
          onClick: () => setIsOpen((v) => !v),
          className: "w-14 h-14 rounded-full bg-surface text-ink-secondary dark:text-white border border-line hover:text-white shadow-2xl flex items-center justify-center transform active:scale-95 transition-all duration-slow group relative overflow-hidden",
          children: [
            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-brand opacity-0 group-hover:opacity-100 transition-opacity duration-slow" }),
            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-[url('/images/noise.svg')] opacity-15 pointer-events-none" }),
            /* @__PURE__ */ jsx("div", { className: "relative z-10 flex items-center justify-center", children: isOpen ? /* @__PURE__ */ jsx(X, { size: 22, className: "animate-in spin-in-90 duration-slow" }) : /* @__PURE__ */ jsx(VenaLogo, { size: 28, className: "animate-in zoom-in duration-slow drop-shadow-sm" }) })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { ref: turnstileContainerRef, id: "turnstile-chat-container", className: "hidden" }),
    /* @__PURE__ */ jsx("style", { children: `
 .custom-scrollbar::-webkit-scrollbar { width: 4px; }
 .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
 .custom-scrollbar::-webkit-scrollbar-thumb { background: rgb(var(--vq-slate-300)); border-radius: 10px; }
 .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgb(var(--vq-slate-700)); }
 .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgb(var(--vq-slate-400)); }
 .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgb(var(--vq-slate-600)); }
` })
  ] });
}
export {
  ChatWidget as default
};
