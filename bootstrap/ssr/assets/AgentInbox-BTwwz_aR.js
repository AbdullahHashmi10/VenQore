import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { O as OneGlanceLayout } from "./marketing-pages-CTBAvetE.js";
import { usePage, Head } from "@inertiajs/react";
import { MessageSquare, Loader2, CheckCircle2, ChevronRight, ChevronDown, AlertCircle, Sparkles, LogOut, Trash2, ShieldAlert, Send } from "lucide-react";
import axios from "axios";
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import "marked";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
window.Pusher = Pusher;
function AgentInbox() {
  const { store, auth, my_role } = usePage().props;
  const currentUser = auth.user;
  const isOwner = my_role === "owner" || auth.user.is_platform_admin;
  const storeId = store?.id;
  const storeSlug = store?.slug;
  const getRoute = (name, params = {}) => {
    if (storeSlug) {
      return route(`store.admin.chatbot.${name}`, { store_slug: storeSlug, ...params });
    }
    return route(`platform.chatbot.${name}`, params);
  };
  const [sessions, setSessions] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [cannedResponses, setCannedResponses] = useState([]);
  const [slashSuggestions, setSlashSuggestions] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sending, setSending] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const toggleGroup = (groupName) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };
  const [visitorTyping, setVisitorTyping] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [showCopilot, setShowCopilot] = useState(true);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotSuggestion, setCopilotSuggestion] = useState("");
  const [copilotSimilarKb, setCopilotSimilarKb] = useState([]);
  const [copilotConfidence, setCopilotConfidence] = useState("medium");
  const [editableSuggestion, setEditableSuggestion] = useState("");
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveCategory, setResolveCategory] = useState("general");
  const [resolveProblem, setResolveProblem] = useState("");
  const [resolveSolution, setResolveSolution] = useState("");
  const [submittingResolve, setSubmittingResolve] = useState(false);
  const chatScrollRef = useRef(null);
  const echoInstance = useRef(null);
  const activeChannel = useRef(null);
  const typingTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  useEffect(() => {
    if (!selectedSession || !showCopilot) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.sender_type === "visitor") {
      fetchSuggestion();
    } else {
      setCopilotSuggestion("");
      setCopilotSimilarKb([]);
      setCopilotConfidence("medium");
    }
  }, [selectedSession?.session_uuid, messages?.length, showCopilot]);
  useEffect(() => {
    setEditableSuggestion(copilotSuggestion || "");
  }, [copilotSuggestion]);
  const fetchSuggestion = async () => {
    if (!selectedSession) return;
    setCopilotLoading(true);
    try {
      const res = await axios.post(getRoute("assist", { uuid: selectedSession.session_uuid }), {
        session_uuid: selectedSession.session_uuid
      });
      if (res.data.success) {
        setCopilotSuggestion(res.data.suggestion);
        setCopilotSimilarKb(res.data.similar_kb || []);
        setCopilotConfidence(res.data.confidence || "medium");
      }
    } catch (err) {
      console.error("Failed to fetch assist suggestion", err);
    } finally {
      setCopilotLoading(false);
    }
  };
  useEffect(() => {
    fetchSessions();
    fetchCannedResponses();
    const host = window.location.hostname;
    echoInstance.current = new Echo({
      broadcaster: "reverb",
      key: "venqore_chat",
      wsHost: host,
      wsPort: 8080,
      wssPort: 8080,
      forceTLS: false,
      enabledTransports: ["ws", "wss"]
    });
    const channelName = storeId ? `agent.inbox.${storeId}` : "agent.inbox.global";
    const inboxChannel = echoInstance.current.private(channelName).listen(".SessionStatusChanged", (e) => {
      fetchSessions();
    }).listen(".MessageSent", (e) => {
      fetchSessions();
    });
    return () => {
      inboxChannel.stopListening(".SessionStatusChanged");
      if (activeChannel.current) {
        activeChannel.current.stopListening(".MessageSent").stopListening(".TypingStarted").stopListening(".TypingStopped").stopListening(".SessionStatusChanged");
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [storeId]);
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, visitorTyping]);
  useEffect(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    if (!selectedSession) {
      setMessages([]);
      setVisitorTyping(false);
      return;
    }
    setMessages(selectedSession.messages || []);
    setReplyText("");
    setVisitorTyping(false);
    if (activeChannel.current) {
      activeChannel.current.stopListening(".MessageSent").stopListening(".TypingStarted").stopListening(".TypingStopped").stopListening(".SessionStatusChanged");
    }
    activeChannel.current = echoInstance.current.channel(`chat.${selectedSession.session_uuid}`);
    activeChannel.current.listen(".MessageSent", (e) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === e.id)) return prev;
        return [...prev, e];
      });
    }).listen(".TypingStarted", (e) => {
      if (e.sender_type === "visitor") {
        setTypingText(`${e.sender_name} is typing...`);
        setVisitorTyping(true);
      }
    }).listen(".TypingStopped", (e) => {
      if (e.sender_type === "visitor") {
        setVisitorTyping(false);
      }
    }).listen(".SessionStatusChanged", (e) => {
      setSelectedSession((prev) => {
        if (!prev || prev.session_uuid !== e.session_uuid) return prev;
        return { ...prev, status: e.status, claimed_by: e.claimed_by };
      });
    });
    if (selectedSession.claimed_by === currentUser.id && selectedSession.status === "agent_active") {
      heartbeatIntervalRef.current = setInterval(() => {
        renewClaimLock(selectedSession.session_uuid);
      }, 15e3);
    }
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [selectedSession?.session_uuid, selectedSession?.claimed_by, selectedSession?.status]);
  const fetchSessions = async () => {
    try {
      const res = await axios.get(getRoute("sessions"));
      setSessions(res.data.sessions);
      setStaffMembers(res.data.staff || []);
      if (selectedSession) {
        const updated = res.data.sessions.find((s) => s.session_uuid === selectedSession.session_uuid);
        if (updated) {
          setSelectedSession(updated);
        }
      }
    } catch (err) {
      console.error("Failed to fetch chat sessions", err);
    } finally {
      setLoadingSessions(false);
    }
  };
  const fetchCannedResponses = async () => {
    try {
      const res = await axios.get(getRoute("canned-responses"));
      setCannedResponses(res.data.canned_responses);
    } catch (err) {
      console.error("Failed to fetch canned responses", err);
    }
  };
  const renewClaimLock = async (uuid) => {
    try {
      await axios.post(getRoute("claim", { uuid }));
    } catch (err) {
      console.error("Failed to renew claim lock", err);
    }
  };
  const handleGiveToAi = async (uuid) => {
    try {
      const res = await axios.post(getRoute("handoff-to-ai", { uuid }));
      if (res.data.success) {
        fetchSessions();
        window.dispatchEvent(new CustomEvent("amd:toast", {
          detail: { message: "Conversation handed back to Vena (AI).", type: "success" }
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };
  const handleRefer = async (uuid, userId) => {
    try {
      const res = await axios.post(getRoute("refer", { uuid }), { user_id: userId });
      if (res.data.success) {
        fetchSessions();
        window.dispatchEvent(new CustomEvent("amd:toast", {
          detail: { message: "Conversation successfully referred.", type: "success" }
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };
  const handleSetStatus = async (uuid, subStatus) => {
    try {
      const res = await axios.post(getRoute("set-status", { uuid }), { sub_status: subStatus });
      if (res.data.success) {
        fetchSessions();
        window.dispatchEvent(new CustomEvent("amd:toast", {
          detail: { message: `Status updated to: ${subStatus}`, type: "success" }
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };
  const handleClaim = async (uuid) => {
    try {
      const res = await axios.post(getRoute("claim", { uuid }));
      if (res.data.success) {
        fetchSessions();
        window.dispatchEvent(new CustomEvent("amd:toast", {
          detail: { message: "Chat claimed successfully!", type: "success" }
        }));
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to claim chat session.";
      window.dispatchEvent(new CustomEvent("amd:toast", {
        detail: { message: msg, type: "error" }
      }));
      fetchSessions();
    }
  };
  const handleRelease = async (uuid) => {
    try {
      await axios.post(getRoute("release", { uuid }));
      fetchSessions();
      setSelectedSession(null);
      window.dispatchEvent(new CustomEvent("amd:toast", {
        detail: { message: "Returned chat session to the queue.", type: "info" }
      }));
    } catch (err) {
      console.error(err);
    }
  };
  const handleDeleteSession = async (uuid) => {
    if (!window.confirm("Are you sure you want to permanently delete this chat session? This will remove all messages and cannot be undone.")) {
      return;
    }
    try {
      const res = await axios.delete(getRoute("destroy", { uuid }));
      if (res.data.success) {
        setSelectedSession(null);
        fetchSessions();
        window.dispatchEvent(new CustomEvent("amd:toast", {
          detail: { message: "Chat session permanently deleted.", type: "success" }
        }));
      }
    } catch (err) {
      console.error("Failed to delete chat session", err);
      window.dispatchEvent(new CustomEvent("amd:toast", {
        detail: { message: "Failed to delete session.", type: "error" }
      }));
    }
  };
  const handleResolve = (uuid) => {
    setResolveProblem("");
    setResolveSolution("");
    setResolveCategory("general");
    setShowResolveModal(true);
  };
  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolveProblem.trim() || !resolveSolution.trim()) {
      window.dispatchEvent(new CustomEvent("amd:toast", {
        detail: { message: "Please outline the problem and verified solution.", type: "warning" }
      }));
      return;
    }
    setSubmittingResolve(true);
    try {
      const res = await axios.post(getRoute("log-learning", { uuid: selectedSession.session_uuid }), {
        category: resolveCategory,
        problem: resolveProblem,
        solution: resolveSolution
      });
      if (res.data.success) {
        setShowResolveModal(false);
        setSelectedSession(null);
        fetchSessions();
        window.dispatchEvent(new CustomEvent("amd:toast", {
          detail: { message: "Session resolved and logged to AI learning successfully!", type: "success" }
        }));
      }
    } catch (err) {
      console.error("Failed to log learning & resolve session", err);
      window.dispatchEvent(new CustomEvent("amd:toast", {
        detail: { message: "Failed to resolve session.", type: "error" }
      }));
    } finally {
      setSubmittingResolve(false);
    }
  };
  const handleReplyDirect = async (textToSubmit) => {
    if (!textToSubmit.trim() || sending) return;
    setSending(true);
    try {
      const res = await axios.post(
        getRoute("reply", { uuid: selectedSession.session_uuid }),
        { body: textToSubmit, vena_suggestion: copilotSuggestion }
      );
      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.message]);
        setReplyText("");
        setCopilotSuggestion("");
        setEditableSuggestion("");
        window.dispatchEvent(new CustomEvent("amd:toast", {
          detail: { message: "Reply sent successfully!", type: "success" }
        }));
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Failed to send reply.";
      window.dispatchEvent(new CustomEvent("amd:toast", {
        detail: { message: msg, type: "error" }
      }));
    } finally {
      setSending(false);
    }
  };
  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || sending) return;
    setSending(true);
    try {
      const res = await axios.post(
        getRoute("reply", { uuid: selectedSession.session_uuid }),
        { body: replyText, vena_suggestion: copilotSuggestion }
      );
      if (res.data.success) {
        setReplyText("");
        setMessages((prev) => [...prev, res.data.message]);
        setCopilotSuggestion("");
        setEditableSuggestion("");
        handleTypingBroadcast(false);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send reply.";
      window.dispatchEvent(new CustomEvent("amd:toast", {
        detail: { message: msg, type: "error" }
      }));
    } finally {
      setSending(false);
    }
  };
  const handleInputChange = (e) => {
    const value = e.target.value;
    setReplyText(value);
    handleTypingBroadcast(value.length > 0);
    if (value.startsWith("/")) {
      const query = value.slice(1).toLowerCase();
      const filtered = cannedResponses.filter(
        (r) => r.shortcode.toLowerCase().includes(query) || r.title.toLowerCase().includes(query)
      );
      setSlashSuggestions(filtered);
    } else {
      setSlashSuggestions([]);
    }
  };
  const selectCannedResponse = (response) => {
    setReplyText(response.body);
    setSlashSuggestions([]);
  };
  const handleTypingBroadcast = (typing) => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    axios.post(
      getRoute("typing.agent", { uuid: selectedSession.session_uuid }),
      { typing }
    );
    if (typing) {
      typingTimeoutRef.current = setTimeout(() => {
        handleTypingBroadcast(false);
      }, 5e3);
    }
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { mode: "admin", title: "Agent Inbox", activeMenu: storeSlug ? "Store Settings" : "Agent Inbox", noPadding: true, children: [
    /* @__PURE__ */ jsx(Head, { title: "Agent Inbox" }),
    /* @__PURE__ */ jsxs("div", { className: "h-full w-full flex gap-6 overflow-hidden p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "w-80 h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-xl flex flex-col overflow-hidden relative shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50", children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(MessageSquare, { className: "text-indigo-500", size: 20 }),
            "Support Queue"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mt-1", children: "Real-time customer inquiries" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex gap-1 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto shrink-0 scrollbar-none", children: [
          { id: "all", label: "All Active" },
          { id: "referred", label: "Referred" },
          { id: "ai", label: "AI Active" },
          { id: "resolved", label: "Resolved" }
        ].map((tab) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setActiveTab(tab.id),
            className: `px-2.5 py-1.5 rounded-full text-3xs font-black uppercase tracking-wider transition-all shrink-0 ${activeTab === tab.id ? "bg-indigo-600 text-white shadow-md" : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"}`,
            children: tab.label
          },
          tab.id
        )) }),
        /* @__PURE__ */ jsx("div", { className: "flex-1 chat-scroll p-3 space-y-2", children: loadingSessions ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-48 text-slate-400", children: [
          /* @__PURE__ */ jsx(Loader2, { className: "animate-spin mb-2", size: 24 }),
          /* @__PURE__ */ jsx("span", { className: "text-xs", children: "Loading queue..." })
        ] }) : (() => {
          const filteredSessions = sessions.filter((s) => {
            if (activeTab === "referred") return s.referred_to === currentUser.id;
            if (activeTab === "ai") return s.status === "bot_active";
            if (activeTab === "resolved") return s.status === "resolved";
            return s.status !== "resolved";
          });
          if (filteredSessions.length === 0) {
            return /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-48 text-slate-400 text-center px-4", children: [
              /* @__PURE__ */ jsx(CheckCircle2, { className: "text-emerald-400 mb-2", size: 32 }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-700 dark:text-slate-300", children: "All clear!" }),
              /* @__PURE__ */ jsx("span", { className: "text-2xs text-slate-400 mt-1", children: "No chats in this category" })
            ] });
          }
          const grouped = {};
          filteredSessions.forEach((s) => {
            const groupName = s.tenant_name || "General / Platform";
            if (!grouped[groupName]) {
              grouped[groupName] = [];
            }
            grouped[groupName].push(s);
          });
          return Object.keys(grouped).map((groupName) => {
            const groupSessions = grouped[groupName];
            const isCollapsed = !!collapsedGroups[groupName];
            return /* @__PURE__ */ jsxs("div", { className: "space-y-2 mb-3", children: [
              /* @__PURE__ */ jsxs(
                "div",
                {
                  onClick: () => toggleGroup(groupName),
                  className: "flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/60 rounded-xl cursor-pointer select-none transition-all text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800/50 shadow-sm",
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                      isCollapsed ? /* @__PURE__ */ jsx(ChevronRight, { size: 14, className: "text-slate-400" }) : /* @__PURE__ */ jsx(ChevronDown, { size: 14, className: "text-slate-400" }),
                      /* @__PURE__ */ jsx("span", { className: "text-2xs font-black uppercase tracking-wider", children: groupName })
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-3xs font-black rounded-full", children: groupSessions.length })
                  ]
                }
              ),
              !isCollapsed && /* @__PURE__ */ jsx("div", { className: "space-y-2 pl-1.5 border-l border-slate-100 dark:border-slate-800/60 ml-2 animate-in fade-in slide-in-from-top-1 duration-150", children: groupSessions.map((s) => {
                const isSelected = selectedSession?.session_uuid === s.session_uuid;
                const isUnclaimed = s.status === "human_requested";
                const isClaimedByMe = s.claimed_by === currentUser.id;
                const isClaimedByOther = s.claimed_by && s.claimed_by !== currentUser.id;
                return /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => setSelectedSession(s),
                    className: `w-full text-left p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden group flex flex-col gap-1.5 ${isSelected ? "bg-slate-900 border-slate-900 dark:bg-slate-800 dark:border-slate-700 text-white shadow-lg" : "bg-slate-50/60 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800/80 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300"}`,
                    children: [
                      /* @__PURE__ */ jsx("div", { className: `absolute top-0 left-0 bottom-0 w-1.5 ${isUnclaimed ? "bg-rose-500 animate-pulse" : isClaimedByMe ? "bg-emerald-500" : isClaimedByOther ? "bg-amber-500" : "bg-slate-300"}` }),
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between w-full", children: [
                        /* @__PURE__ */ jsx("span", { className: `text-xs font-bold truncate ${isSelected ? "text-white" : "text-slate-900 dark:text-slate-100"}`, children: s.visitor_name || "Website Guest" }),
                        /* @__PURE__ */ jsx("span", { className: "text-3xs text-slate-400 font-medium", children: s.last_message_at ? new Date(s.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "" })
                      ] }),
                      s.messages?.length > 0 && /* @__PURE__ */ jsx("p", { className: `text-2xs truncate ${isSelected ? "text-slate-300" : "text-slate-400"}`, children: s.messages[s.messages.length - 1].body }),
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mt-1 flex-wrap gap-1", children: [
                        isUnclaimed && /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-4xs font-black uppercase tracking-wider rounded-full", children: "Action Required" }),
                        isClaimedByMe && /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-4xs font-black uppercase tracking-wider rounded-full", children: "Claimed by me" }),
                        isClaimedByOther && /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-4xs font-black uppercase tracking-wider rounded-full max-w-[120px] truncate", children: s.claimed_by_name || "Other" }),
                        s.referred_to === currentUser.id && /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 text-4xs font-black uppercase tracking-wider rounded-full", children: "Referred to me" }),
                        s.sub_status && /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 text-4xs font-black uppercase tracking-wider rounded-full ${s.sub_status === "fixed" ? "bg-emerald-100 dark:bg-emerald-950/20 text-emerald-600" : "bg-amber-100 dark:bg-amber-950/20 text-amber-600"}`, children: s.sub_status }),
                        s.status === "resolved" && /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 text-4xs font-black uppercase tracking-wider rounded-full", children: "Resolved" })
                      ] })
                    ]
                  },
                  s.session_uuid
                );
              }) })
            ] }, groupName);
          });
        })() })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-xl flex flex-col overflow-hidden relative", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none" }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full -ml-48 -mb-48 blur-[100px] pointer-events-none" }),
        selectedSession ? /* @__PURE__ */ jsxs("div", { className: "flex-1 flex overflow-hidden relative z-10", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col overflow-hidden border-r border-slate-100 dark:border-slate-800/80", children: [
            /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shrink-0", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx("h3", { className: "text-base font-black text-slate-900 dark:text-white tracking-tight", children: selectedSession.visitor_name || "Website Guest" }),
                  selectedSession.visitor_email && /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-400", children: [
                    "(",
                    selectedSession.visitor_email,
                    ")"
                  ] })
                ] }),
                selectedSession.escalation_reason && /* @__PURE__ */ jsxs("p", { className: "text-2xs text-rose-500 font-bold uppercase tracking-wider mt-1 flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(AlertCircle, { size: 10 }),
                  "Escalation Reason: ",
                  selectedSession.escalation_reason.replace("_", " ")
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => setShowCopilot(!showCopilot),
                    className: `px-3 py-1.5 rounded-xl text-2xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border active:scale-95 shrink-0 ${showCopilot ? "bg-purple-600/10 border-purple-500/30 text-purple-600 dark:text-purple-400 shadow-sm" : "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`,
                    children: [
                      /* @__PURE__ */ jsx(Sparkles, { size: 11, className: showCopilot ? "animate-pulse text-purple-500" : "" }),
                      /* @__PURE__ */ jsx("span", { children: "AI Co-Pilot" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsx("div", { className: "flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 gap-2 shrink-0", children: selectedSession.status === "bot_active" ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsxs("span", { className: "px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-2xs font-black uppercase tracking-wider rounded-lg flex items-center gap-1", children: [
                    /* @__PURE__ */ jsx(Sparkles, { size: 11, className: "animate-pulse" }),
                    "Vena AI Active"
                  ] }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => handleClaim(selectedSession.session_uuid),
                      className: "px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-2xs font-bold active:scale-95 transition-all shrink-0",
                      children: "Take Charge"
                    }
                  )
                ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx("span", { className: "px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-2xs font-black uppercase tracking-wider rounded-lg", children: "Human Active" }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => handleGiveToAi(selectedSession.session_uuid),
                      className: "px-3 py-1 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-2xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all shrink-0",
                      children: "Give to AI"
                    }
                  )
                ] }) }),
                staffMembers.length > 0 && /* @__PURE__ */ jsx("div", { className: "relative shrink-0", children: /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: selectedSession.referred_to || "",
                    onChange: (e) => handleRefer(selectedSession.session_uuid, e.target.value || null),
                    className: "px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none outline-none cursor-pointer",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "", children: "Refer to Staff..." }),
                      staffMembers.map((member) => /* @__PURE__ */ jsxs("option", { value: member.id, children: [
                        member.name,
                        " (",
                        member.role.toUpperCase(),
                        ")"
                      ] }, member.id))
                    ]
                  }
                ) }),
                /* @__PURE__ */ jsx("div", { className: "flex bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-0.5 shrink-0", children: [
                  { id: "active", label: "Active" },
                  { id: "fixed", label: "Fixed" },
                  { id: "pending", label: "Pending" }
                ].map((tag) => /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => handleSetStatus(selectedSession.session_uuid, tag.id),
                    className: `px-3 py-1.5 rounded-lg text-2xs font-black uppercase tracking-wider transition-all ${selectedSession.sub_status === tag.id || !selectedSession.sub_status && tag.id === "active" ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`,
                    children: tag.label
                  },
                  tag.id
                )) }),
                selectedSession.status === "human_requested" && /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => handleClaim(selectedSession.session_uuid),
                    className: "px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-500/20 shrink-0",
                    children: "Claim Session"
                  }
                ),
                selectedSession.status === "bot_active" && /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => handleSetStatus(selectedSession.session_uuid, "resolved"),
                    className: "px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1 shrink-0",
                    children: [
                      /* @__PURE__ */ jsx(CheckCircle2, { size: 13 }),
                      "Resolve"
                    ]
                  }
                ),
                selectedSession.claimed_by === currentUser.id && selectedSession.status === "agent_active" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 shrink-0", children: [
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => handleRelease(selectedSession.session_uuid),
                      className: "px-3.5 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-1 shrink-0",
                      children: [
                        /* @__PURE__ */ jsx(LogOut, { size: 13, className: "rotate-180" }),
                        "Release"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => handleResolve(selectedSession.session_uuid),
                      className: "px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1 shrink-0",
                      children: [
                        /* @__PURE__ */ jsx(CheckCircle2, { size: 13 }),
                        "Resolve"
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => handleDeleteSession(selectedSession.session_uuid),
                    title: "Delete Session",
                    className: "px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold active:scale-95 transition-all shadow-md shadow-rose-500/20 flex items-center gap-1.5 shrink-0",
                    children: [
                      /* @__PURE__ */ jsx(Trash2, { size: 13 }),
                      "Delete"
                    ]
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { ref: chatScrollRef, className: "flex-1 chat-scroll p-8 space-y-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto space-y-4", children: [
              messages.map((m) => {
                const isVisitor = m.sender_type === "visitor";
                const isBot = m.sender_type === "bot";
                m.sender_type === "agent";
                const isSystem = m.sender_type === "system";
                if (isSystem) {
                  return /* @__PURE__ */ jsx("div", { className: "flex justify-center my-2", children: /* @__PURE__ */ jsx("span", { className: "px-4 py-1.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-700/40 rounded-full text-2xs text-slate-500 font-bold uppercase tracking-wider text-center max-w-md", children: m.body }) }, m.id);
                }
                return /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: `flex ${isVisitor ? "justify-start" : "justify-end"} animate-in fade-in slide-in-from-bottom-1 duration-200`,
                    children: /* @__PURE__ */ jsxs("div", { className: `max-w-md rounded-2xl px-5 py-3.5 shadow-sm text-sm ${isVisitor ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none" : isBot ? "bg-purple-600 text-white rounded-br-none font-medium" : "bg-indigo-600 text-white rounded-br-none font-medium"}`, children: [
                      /* @__PURE__ */ jsx("div", { className: "text-2xs font-black uppercase tracking-wider mb-1 opacity-70", children: m.sender_name || (isVisitor ? "Guest" : isBot ? "Vena (AI)" : "Agent") }),
                      /* @__PURE__ */ jsx("p", { className: "leading-relaxed whitespace-pre-wrap", children: m.body }),
                      /* @__PURE__ */ jsx("div", { className: "text-3xs mt-1.5 opacity-60 text-right", children: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })
                    ] })
                  },
                  m.id
                );
              }),
              visitorTyping && /* @__PURE__ */ jsxs("div", { className: "flex justify-start items-center gap-2 text-xs text-slate-400 font-medium py-2 animate-pulse", children: [
                /* @__PURE__ */ jsx(Loader2, { size: 12, className: "animate-spin text-slate-300" }),
                /* @__PURE__ */ jsx("span", { children: typingText })
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "p-6 border-t border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl", children: /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto relative", children: [
              slashSuggestions.length > 0 && /* @__PURE__ */ jsxs("div", { className: "absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2 z-50 max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-2", children: [
                /* @__PURE__ */ jsx("div", { className: "px-3 py-1.5 text-2xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700/60 mb-1", children: "Canned Responses (Tap to insert)" }),
                slashSuggestions.map((r, i) => /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => selectCannedResponse(r),
                    className: "w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center justify-between group",
                    children: [
                      /* @__PURE__ */ jsxs("span", { className: "font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-500", children: [
                        "/",
                        r.shortcode
                      ] }),
                      /* @__PURE__ */ jsx("span", { className: "text-slate-400 text-2xs truncate max-w-[300px]", children: r.title })
                    ]
                  },
                  i
                ))
              ] }),
              selectedSession.status === "resolved" ? /* @__PURE__ */ jsxs("div", { className: "p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 flex items-center gap-3 text-xs font-semibold", children: [
                /* @__PURE__ */ jsx(CheckCircle2, { size: 16, className: "text-slate-400 shrink-0" }),
                /* @__PURE__ */ jsx("span", { children: "This session has been resolved and closed." })
              ] }) : selectedSession.claimed_by && selectedSession.claimed_by !== currentUser.id && !isOwner ? /* @__PURE__ */ jsxs("div", { className: "p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-2xl text-amber-800 dark:text-amber-300 flex items-center gap-3 text-xs font-semibold", children: [
                /* @__PURE__ */ jsx(ShieldAlert, { size: 16, className: "text-amber-500 shrink-0" }),
                /* @__PURE__ */ jsxs("span", { children: [
                  "This chat is currently owned by ",
                  selectedSession.claimed_by_name || "another agent",
                  ". You cannot reply."
                ] })
              ] }) : selectedSession.claimed_by !== currentUser.id ? (
                // Unclaimed / Bot Active / Supervision Read-Only state
                /* @__PURE__ */ jsxs("div", { className: "p-5 bg-slate-50/50 dark:bg-slate-850/20 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-400", children: [
                    /* @__PURE__ */ jsx(ShieldAlert, { size: 16, className: "text-indigo-500 shrink-0 animate-pulse" }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-slate-200", children: "Supervision Mode (Read-Only)" }),
                      /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 mt-0.5", children: selectedSession.status === "bot_active" ? "Vena AI is currently handling the thread." : selectedSession.claimed_by ? `Owned by ${selectedSession.claimed_by_name || "another agent"}.` : "This session is waiting in the queue." })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5 shrink-0", children: [
                    selectedSession.status === "bot_active" && /* @__PURE__ */ jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: () => handleSetStatus(selectedSession.session_uuid, "resolved"),
                        className: "px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20 active:scale-95 shrink-0 flex items-center gap-1.5",
                        children: [
                          /* @__PURE__ */ jsx(CheckCircle2, { size: 13 }),
                          "Resolve Session"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => handleClaim(selectedSession.session_uuid),
                        className: "px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-indigo-500/20 active:scale-95 shrink-0",
                        children: "Take Over Session"
                      }
                    )
                  ] })
                ] })
              ) : (
                // Active Claimed (isClaimedByMe === true) Form
                /* @__PURE__ */ jsxs("form", { onSubmit: handleReply, className: "flex gap-3", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      value: replyText,
                      onChange: handleInputChange,
                      className: "flex-1 px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-800 dark:text-white",
                      placeholder: "Type message... (type '/' for canned responses)"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "submit",
                      disabled: !replyText.trim() || sending,
                      className: "p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 shrink-0 shadow-lg shadow-indigo-500/20",
                      children: /* @__PURE__ */ jsx(Send, { size: 18 })
                    }
                  )
                ] })
              )
            ] }) })
          ] }),
          showCopilot && /* @__PURE__ */ jsxs("div", { className: "w-96 h-full flex flex-col bg-slate-50/20 dark:bg-slate-900/10 overflow-hidden shrink-0 animate-in slide-in-from-right duration-300 border-l border-slate-100 dark:border-slate-800/80", children: [
            /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0", children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-sm font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Sparkles, { className: "text-purple-500 animate-pulse", size: 16 }),
                "Vena Assist Co-Pilot"
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 mt-1", children: "Real-time co-pilot assist drawer" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 chat-scroll p-4 space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-purple-500/10 bg-purple-500/[0.02] p-4 relative overflow-hidden flex flex-col gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsx("h4", { className: "text-2xs font-black text-purple-400 uppercase tracking-wider flex items-center gap-1.5", children: "Suggested Draft" }),
                  copilotSuggestion && /* @__PURE__ */ jsxs("span", { className: `px-2 py-0.5 rounded-full text-4xs font-black uppercase tracking-wider border ${copilotConfidence === "high" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : copilotConfidence === "medium" ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`, children: [
                    "Confidence: ",
                    copilotConfidence
                  ] })
                ] }),
                copilotLoading ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-6 text-slate-400 gap-2", children: [
                  /* @__PURE__ */ jsx(Loader2, { className: "animate-spin text-purple-400", size: 18 }),
                  /* @__PURE__ */ jsx("span", { className: "text-2xs font-medium animate-pulse", children: "Analyzing context..." })
                ] }) : copilotSuggestion ? /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                  /* @__PURE__ */ jsx(
                    "textarea",
                    {
                      value: editableSuggestion,
                      onChange: (e) => setEditableSuggestion(e.target.value),
                      rows: 4,
                      className: "w-full text-xs leading-relaxed text-slate-700 dark:text-slate-200 bg-white/40 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 outline-none focus:border-purple-500/40 transition-all resize-none"
                    }
                  ),
                  /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => handleReplyDirect(copilotSuggestion),
                        className: "py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-3xs font-black uppercase tracking-wider transition-all",
                        children: "Send As-Is"
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => handleReplyDirect(editableSuggestion),
                        className: "py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-3xs font-black uppercase tracking-wider transition-all",
                        children: "Edit & Send"
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => {
                          setReplyText(editableSuggestion);
                          window.dispatchEvent(new CustomEvent("amd:toast", {
                            detail: { message: "Injected into reply box!", type: "info" }
                          }));
                        },
                        className: "py-2 border border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-3xs font-black uppercase tracking-wider transition-all",
                        children: "Inject"
                      }
                    )
                  ] })
                ] }) : /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 py-4 text-center", children: "Waiting for next customer message..." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/10 p-4", children: [
                /* @__PURE__ */ jsx("h4", { className: "text-2xs font-black text-slate-400 uppercase tracking-wider mb-3", children: copilotSimilarKb.length > 0 ? "Verified KB Matches" : "Support Cheat Sheet" }),
                /* @__PURE__ */ jsx("div", { className: "space-y-3.5", children: copilotSimilarKb.length > 0 ? copilotSimilarKb.map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "border-b border-slate-100 dark:border-slate-800/60 pb-2.5 last:border-b-0 last:pb-0 flex flex-col gap-1", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                    /* @__PURE__ */ jsxs("span", { className: "text-3xs font-black text-slate-850 dark:text-slate-200 truncate max-w-[200px]", children: [
                      "Q: ",
                      item.question
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: "text-4xs bg-slate-100 dark:bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-black", children: [
                      "Seen ",
                      item.times_seen,
                      "x"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-3xs text-slate-500 dark:text-slate-400 leading-relaxed bg-white/[0.02] p-2 rounded-lg border border-white/[0.02]", children: item.agent_answer })
                ] }, idx)) : [
                  { q: "How to handle refunds?", a: "Direct the user to email billing@venqore.com with their tenant name and transaction ID." },
                  { q: "Resetting store passcode?", a: "Go to Store Settings -> Staff -> select user -> Edit PIN. Only Owners can change this." },
                  { q: "Adding a new cashier?", a: "Cashiers are store-specific. Invite them at Store Admin -> Staff -> Invite Staff." }
                ].map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "border-b border-slate-100 dark:border-slate-800/60 pb-2 last:border-b-0 last:pb-0", children: [
                  /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-slate-800 dark:text-slate-200", children: item.q }),
                  /* @__PURE__ */ jsx("p", { className: "text-3xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed", children: item.a })
                ] }, idx)) })
              ] })
            ] })
          ] })
        ] }) : /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col items-center justify-center text-slate-400 text-center px-6", children: [
          /* @__PURE__ */ jsx(MessageSquare, { className: "text-slate-300 dark:text-slate-800 mb-3", size: 64 }),
          /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-slate-700 dark:text-slate-300", children: "No Chat Selected" }),
          /* @__PURE__ */ jsx("p", { className: "text-1xs text-slate-400 mt-1 max-w-[280px]", children: "Click on a support session from the queue on the left to start conversing in real-time." })
        ] })
      ] })
    ] }),
    showResolveModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl p-8 relative overflow-hidden flex flex-col gap-6 animate-in zoom-in-95 duration-300", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-[80px] pointer-events-none -mt-32 -mr-32" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 border-b border-slate-800 pb-4 shrink-0", children: [
        /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center border border-violet-500/20 text-violet-400", children: /* @__PURE__ */ jsx(Sparkles, { size: 18, className: "animate-pulse" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-base font-black text-white tracking-tight", children: "AI Learning Engine Log" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Teach Vena by documenting your verified resolution" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleResolveSubmit, className: "flex-1 flex flex-col gap-5 overflow-y-auto custom-scrollbar", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-2xs font-black uppercase tracking-[0.25em] text-slate-500 mb-2.5", children: "Ticket Category" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: resolveCategory,
              onChange: (e) => setResolveCategory(e.target.value),
              className: "w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:ring-2 focus:ring-violet-500 outline-none transition-all cursor-pointer animate-in fade-in",
              children: [
                /* @__PURE__ */ jsx("option", { value: "general", children: "General Support / FAQ" }),
                /* @__PURE__ */ jsx("option", { value: "billing", children: "Billing & Subscriptions" }),
                /* @__PURE__ */ jsx("option", { value: "checkout", children: "Checkout & Orders" }),
                /* @__PURE__ */ jsx("option", { value: "features", children: "Feature Requests & Products" }),
                /* @__PURE__ */ jsx("option", { value: "bug", children: "Technical Bug / Issue" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-2xs font-black uppercase tracking-[0.25em] text-slate-500 mb-2.5", children: "Core Problem Encountered" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              required: true,
              value: resolveProblem,
              onChange: (e) => setResolveProblem(e.target.value),
              rows: 3,
              placeholder: "Explain the specific issue the customer had...",
              className: "w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs leading-relaxed focus:ring-2 focus:ring-violet-500 outline-none transition-all placeholder:text-slate-700 resize-none"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-2xs font-black uppercase tracking-[0.25em] text-slate-500 mb-2.5", children: "Verified Solution Provided" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              required: true,
              value: resolveSolution,
              onChange: (e) => setResolveSolution(e.target.value),
              rows: 3,
              placeholder: "Outline the exact steps or correct answer that resolved it...",
              className: "w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs leading-relaxed focus:ring-2 focus:ring-violet-500 outline-none transition-all placeholder:text-slate-700 resize-none"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 border-t border-slate-800 pt-6 mt-4", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setShowResolveModal(false),
              className: "flex-1 py-3 text-center border border-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-400 active:scale-95 transition-all",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: submittingResolve,
              className: "flex-1 py-3 text-center bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-violet-500/20 active:scale-95 transition-all flex items-center justify-center gap-2",
              children: submittingResolve ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader2, { size: 13, className: "animate-spin" }),
                "Resolving..."
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(CheckCircle2, { size: 13 }),
                "Resolve & Log"
              ] })
            }
          )
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("style", { children: `
                main {
                    overflow: hidden !important;
                    height: 100vh !important;
                }
                main > .overflow-y-auto {
                    overflow: hidden !important;
                    height: 100% !important;
                    flex: 1 !important;
                    min-height: 0 !important;
                    padding: 0 !important;
                }
                .chat-scroll {
                    overflow-y: auto;
                    scrollbar-width: thin;
                }
                .chat-scroll::-webkit-scrollbar {
                    width: 6px;
                }
                .chat-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }
                .chat-scroll::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                .chat-scroll::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
                .dark .chat-scroll::-webkit-scrollbar-thumb {
                    background: #334155;
                    border-radius: 10px;
                }
                .dark .chat-scroll::-webkit-scrollbar-thumb:hover {
                    background: #475569;
                }
            ` })
  ] });
}
export {
  AgentInbox as default
};
