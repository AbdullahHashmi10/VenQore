import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { g as getCurrencySymbol } from "./format-B_ph0Qec.js";
import { Head, Link, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-C-94hBqK.js";
import { P as PageHeader } from "./PageHeader-CyOCUwIe.js";
import { S as StockModuleTabs } from "./StockModuleTabs-n32iv0yk.js";
import { M as MidnightNebula } from "./MidnightNebula-BEpU-4M8.js";
import { M as Modal } from "../ssr.js";
import { BookOpen, Plus, ChefHat, Package, DollarSign, Flame, Users, PlayCircle, Edit, Trash2, XCircle, CheckCircle } from "lucide-react";
import axios from "axios";
import "driver.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
function CookbookIndex({ recipes = [], store }) {
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [simQty, setSimQty] = useState(1);
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [trainingOpen, setTrainingOpen] = useState(false);
  const handleDelete = (id, name) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      router.delete(route("store.cookbook.destroy", id));
    }
  };
  const openSimulator = (recipe) => {
    setSelectedRecipe(recipe);
    setSimQty(parseFloat(recipe.yield_quantity) || 1);
    setSimResult(null);
    setSimulatorOpen(true);
  };
  const runSimulation = async () => {
    setSimLoading(true);
    try {
      const { data } = await axios.post(route("store.cookbook.simulate", { store_slug: store.slug }), {
        recipe_id: selectedRecipe.id,
        quantity: simQty
      });
      setSimResult(data);
    } catch (error) {
      console.error(error);
      alert("Simulation failed. Please try again.");
    }
    setSimLoading(false);
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Cookbook", activeMenu: "Stock", children: [
    /* @__PURE__ */ jsx(Head, { title: "Cookbook" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full", children: [
      /* @__PURE__ */ jsx(StockModuleTabs, { activeTab: "cookbook" }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col gap-6 overflow-auto pb-6 p-6", children: [
        /* @__PURE__ */ jsx(
          PageHeader,
          {
            title: "Cookbook",
            subtitle: "Recipe management with full COGM (Cost of Goods Manufactured) tracking",
            icon: BookOpen,
            breadcrumbs: [{ label: "Cookbook" }],
            actions: /* @__PURE__ */ jsxs(
              Link,
              {
                href: route("store.cookbook.create", { store_slug: store.slug }),
                className: "flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md font-medium",
                children: [
                  /* @__PURE__ */ jsx(Plus, { size: 18 }),
                  /* @__PURE__ */ jsx("span", { children: "New Recipe" })
                ]
              }
            )
          }
        ),
        recipes.length === 0 ? /* @__PURE__ */ jsx(MidnightNebula, { className: "rounded-2xl p-12 text-center", primaryColor: "indigo", secondaryColor: "purple", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center max-w-md mx-auto", children: [
          /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6", children: /* @__PURE__ */ jsx(ChefHat, { size: 40, className: "text-white/70" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-white mb-2", children: "Your Cookbook is Empty" }),
          /* @__PURE__ */ jsx("p", { className: "text-indigo-200 mb-8", children: "Start by creating your first recipe to track manufacturing costs, wastage, and profit margins." }),
          /* @__PURE__ */ jsxs(
            Link,
            {
              href: route("store.cookbook.create", { store_slug: store.slug }),
              className: "flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl hover:bg-indigo-50 transition-colors font-bold shadow-lg",
              children: [
                /* @__PURE__ */ jsx(Plus, { size: 20 }),
                "Create First Recipe"
              ]
            }
          )
        ] }) }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: recipes.map((recipe) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all group overflow-hidden",
            children: [
              /* @__PURE__ */ jsx("div", { className: "bg-gradient-to-r from-orange-500 to-amber-500 p-4", children: /* @__PURE__ */ jsx("div", { className: "flex items-start justify-between", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center", children: /* @__PURE__ */ jsx(ChefHat, { size: 24, className: "text-white" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h3", { className: "font-bold text-white text-lg", children: recipe.name }),
                  /* @__PURE__ */ jsx("p", { className: "text-orange-100 text-sm", children: recipe.product?.name || "No product linked" })
                ] })
              ] }) }) }),
              /* @__PURE__ */ jsxs("div", { className: "p-4 space-y-4", children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400 line-clamp-2", children: recipe.description || "No description provided" }),
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-3", children: [
                  /* @__PURE__ */ jsxs("div", { className: "text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-xl", children: [
                    /* @__PURE__ */ jsx(Package, { size: 16, className: "mx-auto text-slate-400 mb-1" }),
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Ingredients" }),
                    /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-700 dark:text-slate-200", children: recipe.ingredients_count })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-xl", children: [
                    /* @__PURE__ */ jsx(DollarSign, { size: 16, className: "mx-auto text-emerald-500 mb-1" }),
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "COGM" }),
                    /* @__PURE__ */ jsxs("p", { className: "font-bold text-emerald-600 dark:text-emerald-400", children: [
                      getCurrencySymbol(),
                      " ",
                      parseFloat(recipe.total_cost || 0).toLocaleString()
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-xl", children: [
                    /* @__PURE__ */ jsx(Flame, { size: 16, className: "mx-auto text-orange-500 mb-1" }),
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Yield" }),
                    /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-700 dark:text-slate-200", children: recipe.yield_quantity })
                  ] })
                ] }),
                (recipe.labor_cost > 0 || recipe.overhead_cost > 0) && /* @__PURE__ */ jsxs("div", { className: "flex gap-2 text-xs", children: [
                  recipe.labor_cost > 0 && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg", children: [
                    /* @__PURE__ */ jsx(Users, { size: 12 }),
                    "Labor: ",
                    getCurrencySymbol(),
                    " ",
                    parseFloat(recipe.labor_cost).toLocaleString()
                  ] }),
                  recipe.overhead_cost > 0 && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg", children: [
                    /* @__PURE__ */ jsx(Flame, { size: 12 }),
                    "Overhead: ",
                    getCurrencySymbol(),
                    " ",
                    parseFloat(recipe.overhead_cost).toLocaleString()
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "border-t border-slate-100 dark:border-slate-800 p-3 flex justify-end gap-2", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => openSimulator(recipe),
                    className: "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800",
                    title: "Simulate Production",
                    children: [
                      /* @__PURE__ */ jsx(PlayCircle, { size: 14 }),
                      "Simulate"
                    ]
                  }
                ),
                recipe.media && recipe.media.length > 0 && /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => {
                      setSelectedRecipe(recipe);
                      setTrainingOpen(true);
                    },
                    className: "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-blue-200 dark:border-blue-800",
                    title: "View Training",
                    children: [
                      /* @__PURE__ */ jsx(BookOpen, { size: 14 }),
                      "Train Me"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  Link,
                  {
                    href: route("store.cookbook.edit", recipe.id),
                    className: "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors",
                    children: [
                      /* @__PURE__ */ jsx(Edit, { size: 14 }),
                      "Edit"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => handleDelete(recipe.id, recipe.name),
                    className: "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors",
                    children: [
                      /* @__PURE__ */ jsx(Trash2, { size: 14 }),
                      "Delete"
                    ]
                  }
                )
              ] })
            ]
          },
          recipe.id
        )) })
      ] }),
      /* @__PURE__ */ jsx(Modal, { show: simulatorOpen, onClose: () => setSimulatorOpen(false), maxWidth: "2xl", children: /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(PlayCircle, { className: "text-indigo-600" }),
            "Pre-Production Simulator"
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: () => setSimulatorOpen(false), className: "text-slate-400 hover:text-slate-600", children: /* @__PURE__ */ jsx(XCircle, { size: 24 }) })
        ] }),
        selectedRecipe && /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800 p-4 rounded-xl space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg dark:text-white", children: selectedRecipe.name }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: "How much do you want to produce?" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    value: simQty,
                    onChange: (e) => setSimQty(parseFloat(e.target.value) || 0),
                    className: "w-24 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 font-bold",
                    min: "1"
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "font-medium text-slate-600 dark:text-slate-400", children: "Units" })
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: runSimulation,
                disabled: simLoading || simQty <= 0,
                className: "w-full py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors",
                children: simLoading ? "Checking Stock..." : "Can I Make This?"
              }
            )
          ] }),
          simResult && /* @__PURE__ */ jsxs("div", { className: "space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300", children: [
            /* @__PURE__ */ jsxs("div", { className: `p-4 rounded-xl border flex items-start gap-3 ${simResult.can_make ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800" : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"}`, children: [
              simResult.can_make ? /* @__PURE__ */ jsx(CheckCircle, { className: "text-emerald-600 shrink-0 mt-0.5", size: 24 }) : /* @__PURE__ */ jsx(XCircle, { className: "text-red-600 shrink-0 mt-0.5", size: 24 }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: `font-bold text-lg ${simResult.can_make ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`, children: simResult.can_make ? "Production Possible!" : "Insufficient Stock" }),
                /* @__PURE__ */ jsx("p", { className: simResult.can_make ? "text-emerald-600" : "text-red-600", children: simResult.can_make ? "You have enough ingredients to fulfill this order." : "One or more ingredients are missing or low in stock." })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm text-left", children: [
              /* @__PURE__ */ jsx("thead", { className: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold", children: /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Ingredient" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right", children: "Required" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-right", children: "Available" }),
                /* @__PURE__ */ jsx("th", { className: "px-4 py-3 text-center", children: "Status" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: simResult.ingredients.map((ing, idx) => /* @__PURE__ */ jsxs("tr", { className: "bg-white dark:bg-slate-900", children: [
                /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-medium dark:text-white", children: ing.name }),
                /* @__PURE__ */ jsxs("td", { className: "px-4 py-3 text-right text-slate-600 dark:text-slate-400", children: [
                  parseFloat(ing.required).toFixed(2),
                  " ",
                  ing.unit
                ] }),
                /* @__PURE__ */ jsxs("td", { className: "px-4 py-3 text-right text-slate-600 dark:text-slate-400", children: [
                  parseFloat(ing.available).toFixed(2),
                  " ",
                  ing.unit
                ] }),
                /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-center", children: ing.status === "ok" ? /* @__PURE__ */ jsx("span", { className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200", children: "OK" }) : /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", children: [
                  "SHORT: ",
                  parseFloat(ing.shortfall).toFixed(2)
                ] }) })
              ] }, idx)) })
            ] }) })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(Modal, { show: trainingOpen, onClose: () => setTrainingOpen(false), maxWidth: "4xl", children: /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(BookOpen, { className: "text-blue-600" }),
            "Training Resources: ",
            selectedRecipe?.name
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: () => setTrainingOpen(false), className: "text-slate-400 hover:text-slate-600", children: /* @__PURE__ */ jsx(XCircle, { size: 24 }) })
        ] }),
        selectedRecipe && selectedRecipe.media && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: selectedRecipe.media.map((media, idx) => /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700", children: [
          media.type === "youtube" && /* @__PURE__ */ jsx("div", { className: "aspect-video", children: /* @__PURE__ */ jsx(
            "iframe",
            {
              src: media.embed_url || media.url.replace("watch?v=", "embed/"),
              className: "w-full h-full",
              allowFullScreen: true,
              title: media.title || "Video"
            }
          ) }),
          media.type === "image" && /* @__PURE__ */ jsx("div", { className: "aspect-video bg-slate-200 dark:bg-slate-700", children: /* @__PURE__ */ jsx("img", { src: media.url, alt: media.title, className: "w-full h-full object-cover" }) }),
          /* @__PURE__ */ jsxs("div", { className: "p-3", children: [
            /* @__PURE__ */ jsx("h4", { className: "font-bold text-slate-800 dark:text-white", children: media.title || `Resource #${idx + 1}` }),
            /* @__PURE__ */ jsx("a", { href: media.url, target: "_blank", rel: "noopener noreferrer", className: "text-xs text-blue-500 hover:underline", children: "Open Original Link" })
          ] })
        ] }, idx)) }),
        (!selectedRecipe?.media || selectedRecipe.media.length === 0) && /* @__PURE__ */ jsxs("div", { className: "text-center py-12 text-slate-500", children: [
          /* @__PURE__ */ jsx(BookOpen, { size: 48, className: "mx-auto mb-4 opacity-20" }),
          /* @__PURE__ */ jsx("p", { children: "No training resources attached to this recipe." })
        ] })
      ] }) })
    ] })
  ] });
}
export {
  CookbookIndex as default
};
