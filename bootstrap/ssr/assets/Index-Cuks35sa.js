import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { P as PlatformShell } from "./PlatformShell-VlY6tyr6.js";
import { Head } from "@inertiajs/react";
import { MessageSquare, Package, Search, RefreshCw, Clock, CheckCircle, Upload, Loader2, Send, Plus, Trash2, Layers, Edit2 } from "lucide-react";
import axios from "axios";
import "./PlatformLayout-Bffb0vmW.js";
import "./marketing-pages-DYgr6x02.js";
import "marked";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
import "./ui-Bi1AXgyR.js";
function Index({ stats }) {
  const [activeTab, setActiveTab] = useState("chats");
  const [chats, setChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [replyBody, setReplyBody] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [chatSearch, setChatSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProductName, setNewProductName] = useState("");
  const [newProductDesc, setNewProductDesc] = useState("");
  const [newProductVersion, setNewProductVersion] = useState("v1.0.0");
  const [newProductStatus, setNewProductStatus] = useState("active");
  const [platformsList, setPlatformsList] = useState([{ name: "", label: "", link: "" }]);
  const chatEndRef = useRef(null);
  useEffect(() => {
    loadChats();
    loadProducts();
  }, []);
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedChat?.replies]);
  useEffect(() => {
    if (!selectedChat) return;
    const interval = setInterval(() => {
      refreshSelectedChat(selectedChat.id);
    }, 5e3);
    return () => clearInterval(interval);
  }, [selectedChat?.id]);
  const loadChats = async () => {
    setLoadingChats(true);
    try {
      const res = await axios.get("/VenQore/digital-hub/chats");
      if (res.data.success) {
        setChats(res.data.chats);
        if (selectedChat) {
          const updated = res.data.chats.find((c) => c.id === selectedChat.id);
          if (updated) setSelectedChat(updated);
        }
      }
    } catch (err) {
      console.error("Failed loading chats", err);
    } finally {
      setLoadingChats(false);
    }
  };
  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await axios.get("/VenQore/digital-hub/products");
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch (err) {
      console.error("Failed loading products", err);
    } finally {
      setLoadingProducts(false);
    }
  };
  const refreshSelectedChat = async (id) => {
    try {
      const res = await axios.get("/VenQore/digital-hub/chats");
      if (res.data.success) {
        setChats(res.data.chats);
        const updated = res.data.chats.find((c) => c.id === id);
        if (updated) setSelectedChat(updated);
      }
    } catch (err) {
    }
  };
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyBody.trim() || !selectedChat) return;
    setSendingReply(true);
    try {
      const res = await axios.post(`/VenQore/digital-hub/chats/${selectedChat.id}/reply`, {
        body: replyBody
      });
      if (res.data.success) {
        const newReply = res.data.reply;
        setSelectedChat((prev) => ({
          ...prev,
          replies: [...prev.replies, newReply]
        }));
        setReplyBody("");
        loadChats();
      }
    } catch (err) {
      console.error("Reply failed", err);
    } finally {
      setSendingReply(false);
    }
  };
  const handleUpdateStatus = async (ticket_id, status) => {
    try {
      const res = await axios.post(`/VenQore/digital-hub/chats/${ticket_id}/status`, { status });
      if (res.data.success) {
        loadChats();
        if (selectedChat && selectedChat.id === ticket_id) {
          setSelectedChat((prev) => ({ ...prev, status }));
        }
      }
    } catch (err) {
      console.error("Failed status update", err);
    }
  };
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProductName.trim()) return;
    const filteredPlatforms = platformsList.filter((p) => p.name.trim() !== "" && p.link.trim() !== "");
    try {
      let res;
      if (editingProduct) {
        res = await axios.post(`/VenQore/digital-hub/products/${editingProduct.id}/update`, {
          name: newProductName,
          description: newProductDesc,
          version: newProductVersion,
          status: newProductStatus,
          platforms: filteredPlatforms
        });
      } else {
        res = await axios.post("/VenQore/digital-hub/products", {
          name: newProductName,
          description: newProductDesc,
          version: newProductVersion,
          status: newProductStatus,
          platforms: filteredPlatforms
        });
      }
      if (res.data.success) {
        resetForm();
        loadProducts();
      }
    } catch (err) {
      console.error("Product saving failed", err);
    }
  };
  const handleStartEdit = (prod) => {
    setEditingProduct(prod);
    setNewProductName(prod.name);
    setNewProductDesc(prod.description || "");
    setNewProductVersion(prod.version || "v1.0.0");
    setNewProductStatus(prod.status || "soon");
    if (prod.platforms && prod.platforms.length > 0) {
      setPlatformsList(prod.platforms);
    } else {
      setPlatformsList([{ name: "", label: "", link: "" }]);
    }
  };
  const resetForm = () => {
    setEditingProduct(null);
    setNewProductName("");
    setNewProductDesc("");
    setNewProductVersion("v1.0.0");
    setNewProductStatus("active");
    setPlatformsList([{ name: "", label: "", link: "" }]);
  };
  const handleDeleteProduct = async (id) => {
    if (!confirm("Are you sure you want to delete this digital product?")) return;
    try {
      const res = await axios.delete(`/VenQore/digital-hub/products/${id}`);
      if (res.data.success) {
        loadProducts();
        if (editingProduct && editingProduct.id === id) {
          resetForm();
        }
      }
    } catch (err) {
      console.error("Failed deleting product", err);
    }
  };
  const addPlatformField = () => {
    setPlatformsList([...platformsList, { name: "", label: "", link: "" }]);
  };
  const updatePlatformItem = (index, key, val) => {
    const updated = [...platformsList];
    updated[index][key] = val;
    setPlatformsList(updated);
  };
  const removePlatformField = (index) => {
    const updated = [...platformsList];
    updated.splice(index, 1);
    setPlatformsList(updated);
  };
  const filteredChats = chats.filter(
    (c) => c.requester_name.toLowerCase().includes(chatSearch.toLowerCase()) || c.requester_email.toLowerCase().includes(chatSearch.toLowerCase()) || c.message.toLowerCase().includes(chatSearch.toLowerCase())
  );
  return /* @__PURE__ */ jsxs(PlatformShell, { mode: "admin", activeMenu: "Digital Products", title: "Digital Products & Registry Hub", children: [
    /* @__PURE__ */ jsx(Head, { title: "Digital Products Hub" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black text-white mb-2", children: "VenQore Master Registry Control" }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm max-w-xl", children: "Communicate directly with offline license buyers using the Etsy Partner Support desk or manage listings on the public digital catalog catalog." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-4 self-stretch md:self-auto", children: [
          /* @__PURE__ */ jsxs("div", { className: "px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl flex-1 md:flex-none text-center", children: [
            /* @__PURE__ */ jsx("span", { className: "block text-2xs font-bold text-slate-500 uppercase tracking-widest mb-1", children: "Active Chats" }),
            /* @__PURE__ */ jsx("span", { className: "text-xl font-black text-indigo-400", children: stats.open_chats })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl flex-1 md:flex-none text-center", children: [
            /* @__PURE__ */ jsx("span", { className: "block text-2xs font-bold text-slate-500 uppercase tracking-widest mb-1", children: "Total Products" }),
            /* @__PURE__ */ jsx("span", { className: "text-xl font-black text-emerald-400", children: products.length })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex border-b border-slate-800 gap-6", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setActiveTab("chats"),
            className: `pb-4 text-sm font-black tracking-wider uppercase flex items-center gap-2 border-b-2 transition-all ${activeTab === "chats" ? "border-indigo-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`,
            children: [
              /* @__PURE__ */ jsx(MessageSquare, { size: 16 }),
              "Partner Chats"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setActiveTab("products"),
            className: `pb-4 text-sm font-black tracking-wider uppercase flex items-center gap-2 border-b-2 transition-all ${activeTab === "products" ? "border-indigo-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`,
            children: [
              /* @__PURE__ */ jsx(Package, { size: 16 }),
              "Manage Digital Catalog"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden min-h-[500px]", children: [
        activeTab === "chats" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 h-[600px] divide-y lg:divide-y-0 lg:divide-x divide-slate-800", children: [
          /* @__PURE__ */ jsxs("div", { className: "lg:col-span-4 flex flex-col h-full overflow-hidden", children: [
            /* @__PURE__ */ jsxs("div", { className: "p-4 bg-slate-950/20 border-b border-slate-800 flex items-center gap-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
                /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-3.5 text-slate-600", size: 16 }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: chatSearch,
                    onChange: (e) => setChatSearch(e.target.value),
                    placeholder: "Search partner chats...",
                    className: "w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/50"
                  }
                )
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: loadChats,
                  disabled: loadingChats,
                  className: "p-3 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white",
                  children: /* @__PURE__ */ jsx(RefreshCw, { size: 14, className: loadingChats ? "animate-spin" : "" })
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto divide-y divide-slate-800/40 custom-scrollbar", children: loadingChats ? /* @__PURE__ */ jsx("div", { className: "p-8 text-center text-slate-500 text-xs", children: "Loading active channels..." }) : filteredChats.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-8 text-center text-slate-500 text-xs", children: "No active chat requests found." }) : filteredChats.map((chat) => /* @__PURE__ */ jsxs(
              "div",
              {
                onClick: () => setSelectedChat(chat),
                className: `p-4 cursor-pointer hover:bg-slate-800/40 transition-colors flex flex-col gap-2 ${selectedChat?.id === chat.id ? "bg-slate-800/60" : ""}`,
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                    /* @__PURE__ */ jsx("span", { className: "font-bold text-sm text-slate-200", children: chat.requester_name }),
                    /* @__PURE__ */ jsx("span", { className: `text-3xs px-2 py-0.5 rounded-full border font-black uppercase tracking-wider ${chat.status === "open" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : chat.status === "in_progress" ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`, children: chat.status })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "text-slate-400 text-xs truncate", children: chat.message }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center text-2xs text-slate-500 gap-1.5 mt-1", children: [
                    /* @__PURE__ */ jsx(Clock, { size: 10 }),
                    /* @__PURE__ */ jsxs("span", { children: [
                      "Updated ",
                      new Date(chat.updated_at).toLocaleString()
                    ] })
                  ] })
                ]
              },
              chat.id
            )) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "lg:col-span-8 flex flex-col h-full overflow-hidden bg-slate-950/20", children: selectedChat ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: "font-black text-white text-base", children: selectedChat.requester_name }),
                /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-xs", children: selectedChat.requester_email })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3", children: selectedChat.status !== "resolved" && selectedChat.status !== "closed" ? /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => handleUpdateStatus(selectedChat.id, "resolved"),
                  className: "px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors",
                  children: [
                    /* @__PURE__ */ jsx(CheckCircle, { size: 14 }),
                    "Mark Resolved"
                  ]
                }
              ) : /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handleUpdateStatus(selectedChat.id, "in_progress"),
                  className: "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors",
                  children: "Reopen Ticket"
                }
              ) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "px-6 py-4 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-6", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "text-slate-500 block text-3xs font-bold uppercase tracking-wider mb-0.5", children: "Purchase Platform Source" }),
                  /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: selectedChat.purchase_source || "Unknown / General" })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "text-slate-500 block text-3xs font-bold uppercase tracking-wider mb-0.5", children: "Trial Selection Preference" }),
                  /* @__PURE__ */ jsx("span", { className: `font-bold uppercase text-2xs ${selectedChat.trial_status === "started" ? "text-indigo-400" : "text-emerald-400"}`, children: selectedChat.trial_status === "started" ? "Already Started Trial (+30 days credit)" : "Not Started Trial (Full 45 days store)" })
                ] })
              ] }),
              selectedChat.attachment_path && /* @__PURE__ */ jsxs(
                "a",
                {
                  href: selectedChat.attachment_path,
                  target: "_blank",
                  className: "px-3.5 py-1.5 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all",
                  children: [
                    /* @__PURE__ */ jsx(Upload, { size: 12 }),
                    "View Invoice Attachment"
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/40 custom-scrollbar", children: [
              selectedChat.replies && selectedChat.replies.map((reply, idx) => /* @__PURE__ */ jsx(
                "div",
                {
                  className: `flex ${reply.is_platform_owner ? "justify-end" : "justify-start"}`,
                  children: /* @__PURE__ */ jsxs("div", { className: `max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed border ${reply.is_platform_owner ? "bg-indigo-600/10 border-indigo-500/20 text-indigo-200 rounded-tr-none" : "bg-slate-800/60 border-slate-700/50 text-slate-300 rounded-tl-none"}`, children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 mb-1 text-2xs", children: [
                      reply.is_platform_owner ? /* @__PURE__ */ jsx("span", { className: "font-black text-indigo-400 uppercase tracking-widest", children: "Hashmi Dashboard" }) : /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-400", children: "Partner Operator" }),
                      /* @__PURE__ */ jsx("span", { className: "text-3xs text-slate-500 ml-auto", children: new Date(reply.created_at).toLocaleTimeString() })
                    ] }),
                    /* @__PURE__ */ jsx("p", { className: "whitespace-pre-wrap", children: reply.body })
                  ] })
                },
                idx
              )),
              /* @__PURE__ */ jsx("div", { ref: chatEndRef })
            ] }),
            /* @__PURE__ */ jsxs("form", { onSubmit: handleSendReply, className: "p-4 border-t border-slate-800 bg-slate-900 flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: replyBody,
                  onChange: (e) => setReplyBody(e.target.value),
                  placeholder: "Type partner message response...",
                  disabled: sendingReply || selectedChat.status === "closed",
                  className: "flex-1 px-5 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-indigo-500/50 transition-colors"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "submit",
                  disabled: sendingReply || !replyBody.trim(),
                  className: "w-12 h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-40",
                  children: sendingReply ? /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }) : /* @__PURE__ */ jsx(Send, { size: 16 })
                }
              )
            ] })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-full text-slate-500 text-xs", children: [
            /* @__PURE__ */ jsx(MessageSquare, { size: 32, className: "text-slate-700 mb-3" }),
            /* @__PURE__ */ jsx("span", { children: "Select a chat thread from the column list to start messaging" })
          ] }) })
        ] }),
        activeTab === "products" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 min-h-[500px]", children: [
          /* @__PURE__ */ jsxs("div", { className: "lg:col-span-5 p-6 space-y-6", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Plus, { size: 16, className: "text-indigo-400" }),
                editingProduct ? `Edit Digital Product` : `Add New Digital Product`
              ] }),
              editingProduct && /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: resetForm,
                  className: "text-2xs text-slate-500 hover:text-white uppercase tracking-wider font-bold",
                  children: "Cancel Edit"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("form", { onSubmit: handleCreateProduct, className: "space-y-4 text-xs", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsx("label", { className: "text-slate-400 font-bold block", children: "Product Name" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    required: true,
                    value: newProductName,
                    onChange: (e) => setNewProductName(e.target.value),
                    placeholder: "e.g. Cafe Quick POS station",
                    className: "w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500/50"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsx("label", { className: "text-slate-400 font-bold block", children: "Product Description" }),
                /* @__PURE__ */ jsx(
                  "textarea",
                  {
                    rows: 3,
                    value: newProductDesc,
                    onChange: (e) => setNewProductDesc(e.target.value),
                    placeholder: "Detailed description of functionalities...",
                    className: "w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500/50 resize-none"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-slate-400 font-bold block", children: "Version / Tag" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      value: newProductVersion,
                      onChange: (e) => setNewProductVersion(e.target.value),
                      placeholder: "v1.0.0 or Coming Soon",
                      className: "w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500/50"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-slate-400 font-bold block", children: "Development Status" }),
                  /* @__PURE__ */ jsxs(
                    "select",
                    {
                      value: newProductStatus,
                      onChange: (e) => setNewProductStatus(e.target.value),
                      className: "w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none cursor-pointer focus:border-indigo-500/50",
                      children: [
                        /* @__PURE__ */ jsx("option", { value: "active", children: "Done / Operational" }),
                        /* @__PURE__ */ jsx("option", { value: "dev", children: "In Development" }),
                        /* @__PURE__ */ jsx("option", { value: "soon", children: "Coming Soon" })
                      ]
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-3 pt-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-slate-400 font-bold", children: "Platform Purchase Links" }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: addPlatformField,
                      className: "text-2xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider",
                      children: "+ Add Platform"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx("div", { className: "space-y-2", children: platformsList.map((plat, idx) => /* @__PURE__ */ jsxs("div", { className: "flex gap-2 items-center flex-wrap sm:flex-nowrap", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      value: plat.name,
                      onChange: (e) => updatePlatformItem(idx, "name", e.target.value),
                      placeholder: "Platform (e.g. Etsy)",
                      className: "w-full sm:w-1/4 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500/50 text-xs"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      value: plat.label || "",
                      onChange: (e) => updatePlatformItem(idx, "label", e.target.value),
                      placeholder: "Button Label (e.g. Buy it on Etsy)",
                      className: "w-full sm:w-1/3 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500/50 text-xs"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      value: plat.link,
                      onChange: (e) => updatePlatformItem(idx, "link", e.target.value),
                      placeholder: "Purchase URL link...",
                      className: "flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500/50 text-xs"
                    }
                  ),
                  platformsList.length > 1 && /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => removePlatformField(idx),
                      className: "text-red-400 hover:text-red-300 p-1",
                      children: /* @__PURE__ */ jsx(Trash2, { size: 14 })
                    }
                  )
                ] }, idx)) })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "submit",
                  className: "w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-indigo-600/10 uppercase tracking-wider text-xs",
                  children: editingProduct ? "Update Product Listing" : "Save Product Listing"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "lg:col-span-7 p-6 flex flex-col h-full overflow-hidden", children: [
            /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4", children: [
              /* @__PURE__ */ jsx(Layers, { size: 16, className: "text-indigo-400" }),
              "Active Digital Catalog (",
              products.length,
              ")"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "space-y-3 overflow-y-auto max-h-[420px] custom-scrollbar pr-2", children: loadingProducts ? /* @__PURE__ */ jsx("div", { className: "p-8 text-center text-slate-500 text-xs", children: "Loading products catalog..." }) : products.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-8 text-center text-slate-500 text-xs", children: "No products cataloged. Add your first listing using the left panel." }) : products.map((prod) => /* @__PURE__ */ jsxs(
              "div",
              {
                className: `p-4 border rounded-2xl flex items-center justify-between gap-4 transition-all ${editingProduct?.id === prod.id ? "bg-indigo-500/5 border-indigo-500/30" : "bg-slate-950/40 border-slate-850"}`,
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1 text-xs flex-1 cursor-pointer", onClick: () => handleStartEdit(prod), children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxs("h4", { className: "font-bold text-white text-sm hover:text-indigo-400 transition-colors flex items-center gap-1.5", children: [
                        prod.name,
                        /* @__PURE__ */ jsx(Edit2, { size: 12, className: "text-slate-500" })
                      ] }),
                      /* @__PURE__ */ jsx("span", { className: "text-2xs font-mono text-slate-500", children: prod.version })
                    ] }),
                    /* @__PURE__ */ jsx("p", { className: "text-slate-400 line-clamp-2 leading-relaxed", children: prod.description }),
                    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1.5 pt-1.5", children: [
                      /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider border ${prod.status === "active" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : prod.status === "dev" ? "bg-indigo-500/10 border-indigo-500/25 text-indigo-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"}`, children: prod.status === "active" ? "Operational" : prod.status === "dev" ? "In Dev" : "Coming Soon" }),
                      prod.platforms && prod.platforms.map((plat, i) => /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-3xs", children: plat.name }, i))
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => handleDeleteProduct(prod.id),
                      className: "text-red-400 hover:text-red-300 p-2.5 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-xl transition-all",
                      children: /* @__PURE__ */ jsx(Trash2, { size: 14 })
                    }
                  )
                ]
              },
              prod.id
            )) })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  Index as default
};
