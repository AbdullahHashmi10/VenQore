import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { usePage, Head, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./marketing-pages-CTBAvetE.js";
import { S as StockModuleTabs } from "./StockModuleTabs-K8P-WXC-.js";
import { F as FormModal, a as FormField, b as FormInput, d as FormTextarea, S as SecondaryButton, e as PrimaryButton } from "../ssr.js";
import axios from "axios";
import { Layers, FolderTree, Box, BarChart3, Search, Plus, Trash2, X, ChevronUp, ChevronDown, Tag, MoreVertical, Edit } from "lucide-react";
import "marked";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "laravel-echo";
import "pusher-js";
function Categories({ categories: serverCategories = [], stats, filters }) {
  const { flash, store } = usePage().props;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "", parent_id: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters?.search || "");
  const [allCategories, setAllCategories] = useState(serverCategories.data || []);
  const [nextPageUrl, setNextPageUrl] = useState(serverCategories.next_page_url);
  const isLoading = useRef(false);
  const observerTarget = useRef(null);
  useEffect(() => {
    if (serverCategories.data && serverCategories.current_page === 1) {
      setAllCategories(serverCategories.data);
      setNextPageUrl(serverCategories.next_page_url);
    }
  }, [serverCategories]);
  const fetchNextPage = useCallback(async () => {
    if (!nextPageUrl || isLoading.current) return;
    isLoading.current = true;
    try {
      const response = await axios.get(nextPageUrl, { headers: { "Accept": "application/json" } });
      const newItems = response.data.data;
      setAllCategories((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const uniqueNew = newItems.filter((p) => !existingIds.has(p.id));
        return [...prev, ...uniqueNew];
      });
      setNextPageUrl(response.data.next_page_url);
    } catch (error) {
      console.error(error);
    } finally {
      isLoading.current = false;
    }
  }, [nextPageUrl]);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && nextPageUrl && !isLoading.current) fetchNextPage();
    }, { threshold: 0.1, rootMargin: "800px" });
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [nextPageUrl, fetchNextPage]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [activeActionMenu, setActiveActionMenu] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "created_at", direction: "desc" });
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [tableColumns, setTableColumns] = useState([
    { key: "name", label: "Category Name", width: "30%" },
    { key: "description", label: "Description", width: "30%" },
    { key: "products_count", label: "Products", width: "15%" },
    { key: "created_at", label: "Created", width: "15%" },
    { key: "actions", label: "Actions", width: "10%" }
  ]);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeActionMenu && !e.target.closest(".action-menu-container")) {
        setActiveActionMenu(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [activeActionMenu]);
  function resolveValue(item, key) {
    if (!item) return "";
    const val = item[key];
    return val ? String(val).toLowerCase() : "";
  }
  const sortedCategories = useMemo(() => {
    const data = Array.isArray(allCategories) ? allCategories : [];
    return [...data].sort((a, b) => {
      const direction = sortConfig.direction === "asc" ? 1 : -1;
      const valA = resolveValue(a, sortConfig.key);
      const valB = resolveValue(b, sortConfig.key);
      if (valA < valB) return -1 * direction;
      if (valA > valB) return 1 * direction;
      return 0;
    });
  }, [allCategories, sortConfig]);
  const handleServerSearch = (e) => {
    if (e.key === "Enter") {
      router.get(route("store.categories.index", { store_slug: store?.slug }), {
        search: searchTerm
      }, { preserveState: true, preserveScroll: true });
    }
  };
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };
  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedCategories(sortedCategories.map((c) => c.id));
    else setSelectedCategories([]);
  };
  const handleSelectRow = (id) => {
    if (selectedCategories.includes(id)) setSelectedCategories(selectedCategories.filter((i) => i !== id));
    else setSelectedCategories([...selectedCategories, id]);
  };
  const handleBulkDelete = () => {
    if (!confirm(`Delete ${selectedCategories.length} categories? Products will be uncategorized.`)) return;
    alert("Bulk delete not yet configured for categories.");
  };
  const handleCreate = () => {
    setEditingCategory(null);
    setFormData({ name: "", description: "", parent_id: "" });
    setErrors({});
    setIsModalOpen(true);
  };
  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || "",
      description: category.description || "",
      parent_id: category.parent_id || ""
    });
    setErrors({});
    setIsModalOpen(true);
    setActiveActionMenu(null);
  };
  const handleDelete = async (category) => {
    if (!confirm(`Delete "${category.name}"?`)) return;
    try {
      await axios.delete(route("store.categories.destroy", { store_slug: store?.slug, category: category.id }));
      const remaining = allCategories.filter((c) => c.id !== category.id);
      setAllCategories(remaining);
      router.reload({ only: ["categories", "stats"] });
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete category");
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      if (editingCategory) {
        await axios.put(route("store.categories.update", { store_slug: store?.slug, category: editingCategory.id }), formData);
      } else {
        await axios.post(route("store.categories.store", { store_slug: store?.slug }), formData);
      }
      setIsModalOpen(false);
      router.reload({ only: ["categories", "stats"] });
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else {
        alert(error.response?.data?.message || "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };
  const handleDragStart = (e, index) => setDraggedColumn(index);
  const handleDragOver = (e, index) => e.preventDefault();
  const handleDrop = (e, dropIndex) => {
    if (draggedColumn === null) return;
    const newCols = [...tableColumns];
    const draggedItem = newCols[draggedColumn];
    newCols.splice(draggedColumn, 1);
    newCols.splice(dropIndex, 0, draggedItem);
    setTableColumns(newCols);
    setDraggedColumn(null);
  };
  const parentOptions = allCategories.filter((c) => !editingCategory || c.id !== editingCategory.id);
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "Categories", activeMenu: "Stock", children: [
    /* @__PURE__ */ jsx(Head, { title: "Categories" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-2 gap-1 overflow-hidden relative", children: [
      /* @__PURE__ */ jsx(StockModuleTabs, { activeTab: "categories" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-1 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg", children: /* @__PURE__ */ jsx(Layers, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Total Categories" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-slate-900 dark:text-white", children: stats?.total_categories || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg", children: /* @__PURE__ */ jsx(FolderTree, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Main Categories" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-slate-900 dark:text-white", children: stats?.parent_categories || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg", children: /* @__PURE__ */ jsx(Box, { size: 16 }) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase", children: "Products Linked" })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-base font-black text-emerald-600", children: stats?.total_products || 0 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg shrink-0", children: /* @__PURE__ */ jsx(BarChart3, { size: 16 }) }),
            /* @__PURE__ */ jsx("div", { className: "min-w-0", children: /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-500 uppercase truncate", children: "Top Category" }) })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-black text-purple-600 truncate max-w-[50%]", title: stats?.most_populated?.name, children: stats?.most_populated?.name || "-" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight shrink-0", children: [
            "Product ",
            /* @__PURE__ */ jsx("span", { className: "text-indigo-600", children: "Categories (Updated)" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" }),
          /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold uppercase rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 px-2.5 py-1", children: "List View" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "w-64 relative", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                onKeyDown: handleServerSearch,
                placeholder: "Search categories...",
                className: "w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
              }
            ),
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none", size: 16 })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex items-center gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-2", children: /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleCreate,
              className: "px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm shadow-indigo-500/20",
              children: [
                /* @__PURE__ */ jsx(Plus, { size: 14 }),
                " Add New"
              ]
            }
          ) })
        ] })
      ] }),
      selectedCategories.length > 0 && /* @__PURE__ */ jsxs("div", { className: "bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center justify-between shadow-lg animate-in slide-in-from-top-2", children: [
        /* @__PURE__ */ jsxs("span", { className: "font-bold text-sm", children: [
          selectedCategories.length,
          " Selected"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleBulkDelete,
              className: "px-3 py-1 bg-white text-indigo-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-1",
              children: [
                /* @__PURE__ */ jsx(Trash2, { size: 14 }),
                " Delete Selected"
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setSelectedCategories([]),
              className: "p-1 hover:bg-indigo-700 rounded transition-colors",
              children: /* @__PURE__ */ jsx(X, { size: 16 })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900", children: [
        /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10", children: [
            /* @__PURE__ */ jsx("th", { className: "p-4 w-10", children: /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                className: "rounded border-slate-300 text-indigo-600 focus:ring-indigo-600",
                checked: selectedCategories.length === sortedCategories.length && sortedCategories.length > 0,
                onChange: handleSelectAll
              }
            ) }),
            tableColumns.map((col, index) => /* @__PURE__ */ jsx(
              "th",
              {
                draggable: true,
                onDragStart: (e) => handleDragStart(e, index),
                onDragOver: (e) => handleDragOver(e),
                onDrop: (e) => handleDrop(e, index),
                onClick: () => col.key !== "actions" && handleSort(col.key),
                className: `
                                            p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider 
                                            cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors
                                            ${draggedColumn === index ? "opacity-50 border-2 border-dashed border-indigo-500" : ""}
                                        `,
                style: { width: col.width },
                children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  col.label,
                  col.key !== "actions" && sortConfig.key === col.key && (sortConfig.direction === "asc" ? /* @__PURE__ */ jsx(ChevronUp, { size: 14, className: "text-indigo-500" }) : /* @__PURE__ */ jsx(ChevronDown, { size: 14, className: "text-indigo-500" }))
                ] })
              },
              col.key
            ))
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: sortedCategories.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: tableColumns.length + 1, className: "p-12 text-center text-slate-500", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(Tag, { size: 32, className: "text-slate-400" }) }),
            /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-slate-700 dark:text-slate-300", children: "No categories found" })
          ] }) }) }) : sortedCategories.map((row) => /* @__PURE__ */ jsxs(
            "tr",
            {
              className: `
                                            hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all group cursor-pointer
                                            ${selectedCategories.includes(row.id) ? "bg-indigo-50 dark:bg-indigo-900/20" : ""}
                                        `,
              children: [
                /* @__PURE__ */ jsx("td", { className: "p-4 w-10", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "checkbox",
                    className: "rounded border-slate-300 text-indigo-600 focus:ring-indigo-600",
                    checked: selectedCategories.includes(row.id),
                    onChange: () => handleSelectRow(row.id)
                  }
                ) }),
                tableColumns.map((col) => /* @__PURE__ */ jsx("td", { className: "p-4 text-sm text-slate-700 dark:text-slate-300", children: (() => {
                  switch (col.key) {
                    case "name":
                      return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                        /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(Tag, { size: 14, className: "text-indigo-600 dark:text-indigo-400" }) }),
                        /* @__PURE__ */ jsxs("div", { children: [
                          /* @__PURE__ */ jsx("p", { className: "font-semibold text-slate-800 dark:text-white", children: row.name }),
                          row.parent && /* @__PURE__ */ jsxs("p", { className: "text-2xs text-slate-400 flex items-center gap-1", children: [
                            /* @__PURE__ */ jsx(FolderTree, { size: 10 }),
                            " ",
                            row.parent.name
                          ] })
                        ] })
                      ] });
                    case "description":
                      return /* @__PURE__ */ jsx("span", { className: "text-slate-500 truncate max-w-xs block", children: row.description || "-" });
                    case "products_count":
                      return /* @__PURE__ */ jsx("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300", children: row.products_count || 0 });
                    case "created_at":
                      return /* @__PURE__ */ jsx("span", { className: "text-slate-500 text-xs", children: new Date(row.created_at).toLocaleDateString() });
                    case "actions":
                      return /* @__PURE__ */ jsxs("div", { className: "relative action-menu-container", children: [
                        /* @__PURE__ */ jsx(
                          "button",
                          {
                            onClick: (e) => {
                              e.stopPropagation();
                              setActiveActionMenu(activeActionMenu === row.id ? null : row.id);
                            },
                            className: "p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors",
                            children: /* @__PURE__ */ jsx(MoreVertical, { size: 16 })
                          }
                        ),
                        activeActionMenu === row.id && /* @__PURE__ */ jsxs("div", { className: "absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 animate-in zoom-in-95 p-1", children: [
                          /* @__PURE__ */ jsxs(
                            "button",
                            {
                              onClick: () => handleEdit(row),
                              className: "w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300",
                              children: [
                                /* @__PURE__ */ jsx(Edit, { size: 14 }),
                                " Edit Category"
                              ]
                            }
                          ),
                          /* @__PURE__ */ jsx("div", { className: "h-px bg-slate-100 dark:bg-slate-700 my-1" }),
                          /* @__PURE__ */ jsxs(
                            "button",
                            {
                              onClick: () => {
                                setActiveActionMenu(null);
                                handleDelete(row);
                              },
                              className: "w-full text-left px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 text-sm text-red-600",
                              children: [
                                /* @__PURE__ */ jsx(Trash2, { size: 14 }),
                                " Delete"
                              ]
                            }
                          )
                        ] })
                      ] });
                    default:
                      return row[col.key];
                  }
                })() }, `${row.id}-${col.key}`))
              ]
            },
            row.id
          )) })
        ] }),
        /* @__PURE__ */ jsx("div", { ref: observerTarget, className: "p-4 text-center text-slate-400 text-sm border-t border-slate-100 dark:border-slate-800 opacity-0", children: nextPageUrl ? "Loading..." : sortedCategories.length > 0 ? "End of list" : "" })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      FormModal,
      {
        isOpen: isModalOpen,
        onClose: () => setIsModalOpen(false),
        title: editingCategory ? "Edit Category" : "Create Category",
        subtitle: editingCategory ? "Update category details" : "Add a new product category",
        errors,
        footer: /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-3", children: [
          /* @__PURE__ */ jsx(SecondaryButton, { onClick: () => setIsModalOpen(false), children: "Cancel" }),
          /* @__PURE__ */ jsx(PrimaryButton, { onClick: handleSubmit, loading, children: editingCategory ? "Update" : "Create" })
        ] }),
        children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsx(FormField, { label: "Category Name", required: true, error: errors.name?.[0], children: /* @__PURE__ */ jsx(
            FormInput,
            {
              value: formData.name,
              onChange: (e) => setFormData({ ...formData, name: e.target.value }),
              placeholder: "e.g., Electronics, Clothing",
              error: errors.name
            }
          ) }),
          /* @__PURE__ */ jsx(FormField, { label: "Parent Category", hint: "Leave empty for top-level category", children: /* @__PURE__ */ jsxs(
            "select",
            {
              value: formData.parent_id,
              onChange: (e) => setFormData({ ...formData, parent_id: e.target.value }),
              className: "w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white outline-none focus:ring-2 ring-indigo-500/20",
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "None (Top Level)" }),
                parentOptions.map((cat) => /* @__PURE__ */ jsx("option", { value: cat.id, children: cat.name }, cat.id))
              ]
            }
          ) }),
          /* @__PURE__ */ jsx(FormField, { label: "Description", error: errors.description?.[0], children: /* @__PURE__ */ jsx(
            FormTextarea,
            {
              value: formData.description,
              onChange: (e) => setFormData({ ...formData, description: e.target.value }),
              placeholder: "Optional description for this category",
              rows: 3
            }
          ) })
        ] })
      }
    )
  ] });
}
export {
  Categories as default
};
