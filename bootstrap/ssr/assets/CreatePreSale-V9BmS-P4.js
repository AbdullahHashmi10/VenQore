import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { usePage, Head, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-KMWHwZqK.js";
import { X, Plus, Zap, ScanBarcode, User, CreditCard, Banknote, Wallet, ChevronRight, CheckCircle2, TrendingUp, Type, Settings, GripVertical, Trash2, Printer, Package, ArrowLeftRight } from "lucide-react";
import { f as formatCurrency, g as getCurrencySymbol } from "./format-B_ph0Qec.js";
import { f as useWorkspace, u as useAlert, F as FormModal } from "../ssr.js";
import axios from "axios";
import { P as ProductModal } from "./ProductModal-ChKYFNm4.js";
import { Q as QuickPartyModal } from "./QuickPartyModal-fEhN51o-.js";
import { A as AsyncProductCombobox } from "./AsyncProductCombobox-C-Y4x1DU.js";
import { A as AsyncPartyCombobox } from "./AsyncPartyCombobox-ByeG86uG.js";
import "driver.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
import "./PremiumButton-BcHxfadR.js";
import "./PremiumSelect-BdCYeyr5.js";
import "use-debounce";
import "./SmartCombobox-D6m7UWTk.js";
const CreatePreSale = ({ sale }) => {
  const {
    activeInvoices,
    currentInvoiceId,
    setCurrentInvoiceId,
    addInvoice,
    removeInvoice,
    updateInvoice
  } = useWorkspace();
  const { settings, auth, store } = usePage().props;
  const isSeniorMode = settings?.senior_mode === "1";
  settings?.show_margin_percentage === "1";
  const isAdmin = auth.user?.role === "admin" || auth.user?.role === "owner";
  const isEditMode = !!sale;
  const [editState, setEditState] = useState(null);
  useEffect(() => {
    if (sale) {
      setEditState({
        id: sale.id,
        // Real DB ID
        invoiceNumber: sale.reference_number,
        customer: sale.customer,
        items: (sale.items || []).map((i) => ({
          id: i.id,
          // Real Item ID
          product: i.product,
          name: i.product?.name || i.name || "Unknown Item",
          quantity: parseFloat(i.quantity) || 1,
          // Default to 1 if unknown
          originalQuantity: parseFloat(i.quantity) || 0,
          // Track original for stock validation
          price: parseFloat(i.unit_price) || parseFloat(i.price) || parseFloat(i.product?.price) || 0,
          cost: parseFloat(i.product?.cost || i.product?.cost_price || 0),
          discount: parseFloat(i.discount_amount || i.discount || 0),
          discountType: i.discount_type || "fixed"
        })),
        date: sale.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        notes: sale.notes || "",
        amountPaid: (sale.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0),
        originalPaidAmount: (sale.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0),
        paymentMethod: sale.method || "cash",
        discount: parseFloat(sale.discount) || 0,
        tax: parseFloat(sale.tax) || 0,
        delivery_charge: parseFloat(sale.delivery_charge) || 0,
        extra_charge_value: parseFloat(sale.extra_charge_value) || 0,
        status: sale.status,
        originalTotal: parseFloat(sale.total) || 0,
        overpaymentAction: sale.overpayment_action
      });
    }
  }, [sale]);
  const currentInvoice = isEditMode ? editState || {
    items: [],
    customer: null,
    discount: 0,
    tax: 0,
    amountPaid: 0,
    delivery_charge: 0,
    extra_charge_value: 0
  } : activeInvoices.find((inv) => inv.id === currentInvoiceId) || activeInvoices[0];
  const patchInvoice = (data) => {
    if (isEditMode) {
      setEditState((prev) => ({ ...prev, ...data }));
    } else {
      updateInvoice(currentInvoice.id, data);
    }
  };
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productModalMode, setProductModalMode] = useState("create");
  const [editingProduct, setEditingProduct] = useState(null);
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState(null);
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, wareRes, accRes, banksRes] = await Promise.all([
          axios.get(route("store.api.categories", { store_slug: store?.slug })),
          axios.get(route("store.api.warehouses", { store_slug: store?.slug })),
          axios.get(route("store.accounting.accounts.api", { store_slug: store?.slug, type: "asset" })),
          axios.get(route("store.api.bank-accounts", { store_slug: store?.slug }))
        ]);
        setCategories(catRes.data);
        setWarehouses(wareRes.data);
        const rawAccounts = accRes.data?.data || accRes.data || [];
        const bankAccounts = banksRes.data || [];
        const cashAccount = { id: 1, name: "Cash in Hand", type: "cash" };
        const chequeAccount = { id: "CHEQUE", name: "Cheque", type: "cheque" };
        const generalBankAccount = rawAccounts.find((a) => a.name === "Bank Account" || a.code === "1010");
        const bankGLId = generalBankAccount?.id || 2;
        const mappedBankAccounts = bankAccounts.map((b) => ({
          id: `BANK_${b.id}`,
          // Unique ID for Dropdown Key
          isBank: true,
          realAccountId: bankGLId,
          // The ID to send to backend (GL Account)
          bankReferenceId: b.id,
          // The specific bank ID
          name: `${b.name} ${b.bank_name ? `(${b.bank_name})` : ""}`,
          type: "bank"
        }));
        const otherAccounts = rawAccounts.filter(
          (a) => a.id !== 1 && // Not Cash
          a.id !== bankGLId && // Not generic Bank GL
          a.name !== "Cash on Hand" && a.name !== "Cheques in Hand" && a.name !== "Inventory" && a.name !== "Accounts Receivable"
        );
        const finalAccounts = [
          cashAccount,
          chequeAccount,
          ...mappedBankAccounts,
          ...otherAccounts
        ];
        setAccounts(finalAccounts);
      } catch (error) {
        console.error("Failed to fetch modal data", error);
        setAccounts([
          { id: 1, name: "Cash in Hand", type: "cash" },
          { id: "CHEQUE", name: "Cheque", type: "cheque" }
        ]);
      }
    };
    fetchData();
  }, []);
  const handleProductSubmit = async (data, onError) => {
    try {
      const url = productModalMode === "create" ? route("store.inventory.store", { store_slug: store?.slug }) : editingProduct?.id ? route("store.inventory.update", { store_slug: store?.slug, id: editingProduct.id }) : "";
      const response = await axios.post(url, data);
      if (response.data) {
        setIsProductModalOpen(false);
        showAlert({
          title: "Success",
          message: `Product ${productModalMode === "create" ? "created" : "updated"} successfully.`,
          type: "success"
        });
        if (productModalMode === "create" && showQuickEntry) {
          setQuickEntry((prev) => ({ ...prev, name: data.name }));
        }
      }
    } catch (error) {
      console.error(error);
      if (onError && error.response?.data?.errors) {
        onError(error.response.data.errors);
      } else {
        showAlert({
          title: "Error",
          message: "Failed to save product.",
          type: "error"
        });
      }
    }
  };
  const [customerSearch, setCustomerSearch] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [quickResults, setQuickResults] = useState([]);
  const [activeItemIndex, setActiveItemIndex] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [quickEntry, setQuickEntry] = useState({
    product: null,
    name: "",
    quantity: 1,
    freeQuantity: 0,
    price: 0,
    discount: 0,
    discountType: "fixed"
  });
  const [isScanning, setIsScanning] = useState(false);
  const [scanBuffer, setScanBuffer] = useState("");
  const [scannedItems, setScannedItems] = useState([]);
  const [showProfit, setShowProfit] = useState(false);
  const [profitLocked, setProfitLocked] = useState(false);
  const [showProfitModal, setShowProfitModal] = useState(false);
  const [quickSelectedIndex, setQuickSelectedIndex] = useState(-1);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSaleId, setLastSaleId] = useState(null);
  const [itemTotalModes, setItemTotalModes] = useState({});
  const getItemTotalMode = (id) => itemTotalModes[id] || "price";
  const toggleItemTotalMode = (id) => setItemTotalModes((prev) => ({ ...prev, [id]: prev[id] === "qty" ? "price" : "qty" }));
  const [textSize, setTextSize] = useState(1);
  const [showTextSizeMenu, setShowTextSizeMenu] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [defaultDelivery, setDefaultDelivery] = useState(() => parseFloat(localStorage.getItem("amd_default_delivery")) || 0);
  const [defaultExtraLabel, setDefaultExtraLabel] = useState(() => localStorage.getItem("amd_default_extra_label") || "Extra");
  const [defaultExtraValue, setDefaultExtraValue] = useState(() => parseFloat(localStorage.getItem("amd_default_extra_value")) || 0);
  const [enableMultipleExtras, setEnableMultipleExtras] = useState(() => localStorage.getItem("amd_enable_multiple_extras") === "1");
  const [showDeliveryCharges, setShowDeliveryCharges] = useState(() => localStorage.getItem("amd_show_delivery") !== "0");
  const [showExtraField, setShowExtraField] = useState(() => localStorage.getItem("amd_show_extra") !== "0");
  useEffect(() => {
    localStorage.setItem("amd_default_delivery", defaultDelivery.toString());
  }, [defaultDelivery]);
  useEffect(() => {
    localStorage.setItem("amd_default_extra_label", defaultExtraLabel);
  }, [defaultExtraLabel]);
  useEffect(() => {
    localStorage.setItem("amd_default_extra_value", defaultExtraValue.toString());
  }, [defaultExtraValue]);
  useEffect(() => {
    localStorage.setItem("amd_enable_multiple_extras", enableMultipleExtras ? "1" : "0");
  }, [enableMultipleExtras]);
  useEffect(() => {
    localStorage.setItem("amd_show_delivery", showDeliveryCharges ? "1" : "0");
  }, [showDeliveryCharges]);
  useEffect(() => {
    localStorage.setItem("amd_show_extra", showExtraField ? "1" : "0");
  }, [showExtraField]);
  const quantityRef = useRef(null);
  const discountRef = useRef(null);
  const startY = useRef(0);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === "q") {
        e.preventDefault();
        document.getElementById("quick-entry-input")?.focus();
      }
      if (isSeniorMode) {
        if (e.key === "F1") {
          e.preventDefault();
          document.getElementById("quick-entry-input")?.focus();
        }
        if (e.key === " ") {
          if (document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
            e.preventDefault();
            handleSave();
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSeniorMode, currentInvoice]);
  const addItem = () => {
    const newItems = [...currentInvoice.items, { id: Date.now(), product: null, quantity: 1, price: 0, discount: 0, discountType: "fixed" }];
    patchInvoice({ items: newItems });
  };
  const removeItem = (id) => {
    const newItems = currentInvoice.items.filter((item) => item.id !== id);
    patchInvoice({ items: newItems.length ? newItems : [{ id: Date.now(), product: null, quantity: 1, price: 0, discount: 0, discountType: "fixed" }] });
  };
  const updateItem = (id, field, value) => {
    const newItems = currentInvoice.items.map(
      (item) => item.id === id ? { ...item, [field]: value } : item
    );
    patchInvoice({ items: newItems });
  };
  const selectProduct = (product, itemId) => {
    const updatedItems = currentInvoice.items.map(
      (item) => item.id === itemId ? {
        ...item,
        product,
        price: parseFloat(product.price || product.selling_price || 0),
        name: product.name,
        cost: parseFloat(product.cost || product.cost_price || 0),
        available_stock: parseFloat(product.available_stock || 0),
        originalQuantity: 0
        // Reset original quantity as this is a new product selection
      } : item
    );
    const lastItem = updatedItems[updatedItems.length - 1];
    if (lastItem.id === itemId) {
      updatedItems.push({ id: Date.now(), product: null, quantity: 1, price: 0, discount: 0, discountType: "fixed" });
    }
    patchInvoice({ items: updatedItems });
    setProductResults([]);
    setActiveItemIndex(null);
  };
  const selectQuickProduct = (product) => {
    setQuickEntry((prev) => ({
      ...prev,
      product,
      name: product.name,
      price: product.price || product.selling_price || 0,
      cost: product.cost || product.cost_price || 0
    }));
    setQuickResults([]);
    setQuickSelectedIndex(-1);
    setTimeout(() => quantityRef.current?.focus(), 50);
  };
  const addQuickItem = () => {
    if (!quickEntry.product && !quickEntry.name) return;
    const newItem = {
      id: Date.now(),
      product: quickEntry.product,
      name: quickEntry.name,
      quantity: quickEntry.quantity || 1,
      freeQuantity: quickEntry.freeQuantity || 0,
      price: quickEntry.price || 0,
      discount: quickEntry.discount || 0,
      discountType: quickEntry.discountType,
      cost: quickEntry.product?.cost || quickEntry.product?.cost_price || 0
    };
    const firstItem = currentInvoice.items[0];
    let newItems;
    if (currentInvoice.items.length === 1 && !firstItem.product && !firstItem.name) {
      newItems = [newItem];
    } else {
      newItems = [...currentInvoice.items, newItem];
    }
    patchInvoice({ items: newItems });
    setQuickEntry({
      product: null,
      name: "",
      quantity: 1,
      freeQuantity: 0,
      price: 0,
      discount: 0,
      discountType: "fixed"
    });
    setQuickResults([]);
    setQuickSelectedIndex(-1);
    document.getElementById("quick-entry-input")?.focus();
  };
  const handleScan = async (e) => {
    if (e.key === "Enter" && scanBuffer) {
      const isNumeric = /^\d+$/.test(scanBuffer);
      const isShort = scanBuffer.length <= 3;
      if (isNumeric && isShort && scannedItems.length > 0) {
        const qty = parseInt(scanBuffer);
        if (qty > 0) {
          setScannedItems((prev) => {
            const newItems = [...prev];
            const lastIdx = newItems.length - 1;
            newItems[lastIdx] = { ...newItems[lastIdx], quantity: qty };
            return newItems;
          });
          setScanBuffer("");
          return;
        }
      }
      try {
        const response = await axios.get(route("store.inventory.search", { store_slug: store?.slug }), { params: { query: scanBuffer } });
        const results = response.data;
        const product = results && results.length > 0 ? results[0] : null;
        if (product) {
          setScannedItems((prev) => {
            const existingIndex = prev.findIndex((item) => item.product.id === product.id);
            if (existingIndex >= 0) {
              const newItems = [...prev];
              const existingItem = newItems[existingIndex];
              newItems.splice(existingIndex, 1);
              newItems.push({
                ...existingItem,
                quantity: existingItem.quantity + 1
                // Add 1 (Scan again behavior)
              });
              return newItems;
            } else {
              return [...prev, {
                id: Date.now(),
                product,
                name: product.name,
                quantity: 1,
                price: product.price || product.selling_price || 0,
                discount: 0,
                discountType: "fixed",
                cost: product.cost || product.cost_price || 0
              }];
            }
          });
        } else {
          console.log("Unknown barcode.");
        }
        setScanBuffer("");
      } catch (error) {
        console.error("Scan error:", error);
        setScanBuffer("");
      }
    }
  };
  const confirmScan = () => {
    patchInvoice({ items: [...currentInvoice.items, ...scannedItems] });
    setScannedItems([]);
    setIsScanning(false);
  };
  const handleProfitDown = (e) => {
    setShowProfit(true);
    startY.current = e.clientY;
    const onMove = (moveEvent) => {
      const diff = moveEvent.clientY - startY.current;
      if (diff > 50) {
        setProfitLocked(true);
        setShowProfitModal(true);
        window.removeEventListener("mousemove", onMove);
      }
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
  const handleProfitUp = () => {
    if (!profitLocked) {
      setShowProfit(false);
    }
  };
  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    const items = [...currentInvoice.items];
    const draggedItem = items[draggedItemIndex];
    items.splice(draggedItemIndex, 1);
    items.splice(index, 0, draggedItem);
    patchInvoice({ items });
    setDraggedItemIndex(index);
  };
  const handleDragEnd = () => {
    setDraggedItemIndex(null);
  };
  const calculateLineTotal = (item) => {
    const sub = item.quantity * item.price;
    const disc = item.discountType === "percent" ? sub * (item.discount / 100) : item.discount || 0;
    return sub - disc;
  };
  const handleTotalChange = (item, newTotalStr) => {
    const newTotal = parseFloat(newTotalStr);
    if (isNaN(newTotal) || newTotal < 0) return;
    const mode = getItemTotalMode(item.id);
    const qty = parseFloat(item.quantity) || 1;
    const disc = item.discount || 0;
    const discType = item.discountType;
    if (mode === "price") {
      const newPrice = discType === "percent" ? newTotal / (qty * (1 - disc / 100)) : (newTotal + disc) / qty;
      updateItem(item.id, "price", Math.max(0, parseFloat(newPrice.toFixed(4))));
    } else {
      const price = parseFloat(item.price) || 0;
      const effectivePrice = discType === "percent" ? price * (1 - disc / 100) : price;
      const newQty = effectivePrice > 0 ? newTotal / effectivePrice : 0;
      updateItem(item.id, "quantity", Math.max(0, parseFloat(newQty.toFixed(4))));
    }
  };
  const subtotal = currentInvoice.items.reduce((sum, item) => sum + (item.quantity + (item.freeQuantity || 0)) * item.price, 0);
  const totalCost = currentInvoice.items.reduce((sum, item) => sum + (item.quantity + (item.freeQuantity || 0)) * (item.cost || 0), 0);
  const itemDiscounts = currentInvoice.items.reduce((sum, item) => {
    const sub = item.quantity * item.price;
    const discountVal = item.discountType === "percent" ? sub * (item.discount / 100) : item.discount || 0;
    const freeItemValue = (item.freeQuantity || 0) * item.price;
    return sum + discountVal + freeItemValue;
  }, 0);
  const afterItemDiscounts = subtotal - itemDiscounts;
  const invoiceDiscount = parseFloat(currentInvoice.discount) || 0;
  const afterDiscount = afterItemDiscounts - invoiceDiscount;
  const taxAmount = afterDiscount * ((parseFloat(currentInvoice.tax) || 0) / 100);
  const deliveryCharge = parseFloat(currentInvoice.delivery_charge) || 0;
  const extraCharge = parseFloat(currentInvoice.extra_charge_value) || 0;
  const grandTotal = afterDiscount + taxAmount + deliveryCharge + extraCharge;
  const balanceDue = grandTotal - (parseFloat(currentInvoice.amountPaid) || 0);
  const profit = grandTotal - totalCost;
  const { showAlert, showConfirm } = useAlert();
  const [customerError, setCustomerError] = useState(false);
  const [invalidItems, setInvalidItems] = useState([]);
  const [showOverpaymentModal, setShowOverpaymentModal] = useState(false);
  const [overpaymentDetails, setOverpaymentDetails] = useState({ amount: 0, customerName: "" });
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const validateInputs = () => {
    let isValid = true;
    let newInvalidItems = [];
    if (!currentInvoice.customer || typeof currentInvoice.customer === "string" || !currentInvoice.customer.id) {
      setCustomerError(true);
      isValid = false;
    } else {
      setCustomerError(false);
    }
    currentInvoice.items.forEach((item, index) => {
      if (item.name && !item.product || item.name && item.product && !item.product.id) {
        newInvalidItems.push(index);
        isValid = false;
      }
    });
    setInvalidItems(newInvalidItems);
    return isValid;
  };
  const handleSave = async (shouldPrint = false) => {
    const isInputValid = validateInputs();
    if (!isInputValid) {
      showAlert({
        title: "Validation Error",
        message: "Please resolve the highlighted errors before processing (Unregistered Customer or Products).",
        type: "error"
      });
      return;
    }
    if (!currentInvoice.customer) {
      showAlert({
        title: "Customer Required",
        message: "Please select a customer before processing the sale.",
        type: "warning"
      });
      return;
    }
    parseFloat(currentInvoice.amountPaid) || 0;
  };
  const processSale = async (addToLedger = false, shouldPrint = false) => {
    const validItems = currentInvoice.items.filter((item) => item.product);
    setSaving(true);
    try {
      const payload = {
        customer_id: currentInvoice.customer.id,
        items: validItems.map((item) => {
          const disc = item.discountType === "percent" ? item.quantity * item.price * ((item.discount || 0) / 100) : item.discount || 0;
          return {
            product_id: item.product.id,
            variant_id: item.variant?.id || null,
            quantity: item.quantity,
            price: item.price,
            discount: disc,
            discount_type: item.discountType || "fixed"
          };
        }),
        payment_method: currentInvoice.paymentMethod,
        amount_paid: 0,
        // Pre-sales: No payment required
        discount: invoiceDiscount,
        tax: taxAmount,
        notes: currentInvoice.notes,
        reference: currentInvoice.invoiceNumber,
        date: currentInvoice.date,
        due_date: currentInvoice.dueDate,
        add_to_ledger: addToLedger,
        payment_account_id: currentInvoice.paymentAccountId || 1,
        // Default to 1 (Cash)
        cheque_date: currentInvoice.chequeDate,
        payment_reference: currentInvoice.paymentReference
      };
      let response;
      if (isEditMode) {
        response = await axios.put(route("store.sales.orders.update", { store_slug: store?.slug, order: currentInvoice.id }), payload);
      } else {
        response = await axios.post(route("store.pre-sales.store", { store_slug: store?.slug }), payload);
      }
      if (response.data.success || isEditMode) {
        setLastSaleId(isEditMode ? currentInvoice.id : response.data.sale_id);
        if (isEditMode) {
          showAlert({ title: "Success", message: "Sale updated successfully.", type: "success" });
          if (shouldPrint) {
            window.open(route("store.pre-sales.print", { store_slug: store?.slug, order: currentInvoice.id }), "_blank");
          }
          if (!shouldPrint) router.visit(route("store.pre-sales.index", { store_slug: store?.slug }));
        } else {
          if (shouldPrint) {
            setPrintPreviewOpen(true);
          } else {
            setShowSuccessModal(true);
          }
        }
      } else {
        showAlert({
          title: "Transaction Failed",
          message: response.data.message || "Unknown error",
          type: "error"
        });
      }
    } catch (error) {
      console.error(error);
      showAlert({
        title: "System Error",
        message: error.response?.data?.message || "Failed to save sale.",
        type: "error"
      });
    } finally {
      setSaving(false);
    }
  };
  const initiateSave = (print = false) => {
    const isInputValid = validateInputs();
    if (!isInputValid) {
      showAlert({ title: "Validation Error", message: "Please fix highlighted errors.", type: "error" });
      return;
    }
    const paid = parseFloat(currentInvoice.amountPaid) || 0;
    const excess = paid - grandTotal;
    if (excess > 0) {
      if (isEditMode && editState?.overpaymentAction) {
        const autoLedger = editState.overpaymentAction === "ledger";
        processSale(autoLedger, print);
        return;
      }
      if (isEditMode && !editState?.overpaymentAction) {
        const wasOverpaid = (editState.originalPaidAmount || 0) > (editState.originalTotal || 0) + 1;
        if (wasOverpaid) {
          processSale(false, print);
          return;
        }
      }
      setOverpaymentDetails({
        amount: excess,
        customerName: currentInvoice.customer?.name || "Customer"
      });
      setShowOverpaymentModal(true);
      setTempPrintIntent(print);
      return;
    }
    processSale(false, print);
  };
  const [tempPrintIntent, setTempPrintIntent] = useState(false);
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: isEditMode ? `Edit Quotation #${editState?.invoiceNumber || ""}` : "Create Pre-Sale", activeMenu: "Sales", fullScreen: false, hideHeader: true, noPadding: true, children: [
    /* @__PURE__ */ jsx(Head, { title: isEditMode ? "Edit Quotation" : "New Quotation" }),
    /* @__PURE__ */ jsxs("div", { className: `h-full flex-1 flex flex-col bg-slate-50 dark:bg-[#0f121d] transition-all duration-500 ${isSeniorMode ? "text-[20px] senior-mode" : ""}`, children: [
      /* @__PURE__ */ jsxs("div", { className: "px-4 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "w-3 h-3 rounded-full bg-amber-500 animate-pulse" }),
        /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider", children: "⚠️ Pre-Sale Mode — Stock validation DISABLED, no payment required" })
      ] }),
      /* @__PURE__ */ jsx("style", { children: `
                    .senior-mode input, .senior-mode button, .senior-mode p, .senior-mode span, .senior-mode td, .senior-mode th {
                        font-size: 1.25rem !important;
                    }
                    .senior-mode .text-emerald-400, .senior-mode .text-emerald-500 {
                        color: #059669 !important;
                        font-weight: 900 !important;
                    }
                    .senior-mode .text-indigo-400, .senior-mode .text-indigo-500 {
                        color: #2563eb !important;
                        font-weight: 900 !important;
                    }
                    .senior-mode .bg-slate-900, .senior-mode .bg-[#1a1f2e] {
                        background-color: #ffffff !important;
                        color: #000000 !important;
                        border: 2px solid #000000 !important;
                    }
                    .hide-scrollbar::-webkit-scrollbar { display: none; }
                    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

                    /* Hide number input spinner arrows — scroll-wheel still works */
                    input[type="number"]::-webkit-outer-spin-button,
                    input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
                    input[type="number"] { -moz-appearance: textfield; }
                    
                    /* Text Scaling System */
                    .text-scale-2 { font-size: 1.05em !important; }
                    .text-scale-3 { font-size: 1.15em !important; }
                    .text-scale-4 { font-size: 1.25em !important; }
                    .text-scale-5 { font-size: 1.4em !important; }
                    
                    [class*="text-scale-"] input, 
                    [class*="text-scale-"] select, 
                    [class*="text-scale-"] button:not(.w-7) { 
                        height: auto !important;
                        padding-top: 0.6em !important;
                        padding-bottom: 0.6em !important;
                    }
                    
                    .text-scale-2 .text-xs { font-size: 0.85rem !important; }
                    .text-scale-3 .text-xs { font-size: 0.95rem !important; }
                    .text-scale-4 .text-xs { font-size: 1.05rem !important; }
                    .text-scale-5 .text-xs { font-size: 1.15rem !important; }
                ` }),
      /* @__PURE__ */ jsxs("div", { className: `flex-1 flex gap-2 min-h-0 px-2 pb-0 pt-2 overflow-hidden text-scale-${textSize}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden min-h-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 px-3 pt-2 pb-0 overflow-x-auto hide-scrollbar border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 shrink-0", children: [
            activeInvoices.map((inv, idx) => /* @__PURE__ */ jsxs(
              "div",
              {
                onClick: () => setCurrentInvoiceId(inv.id),
                className: `
                                    flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer transition-all min-w-[100px] max-w-[160px] relative group text-xs
                                    ${currentInvoiceId === inv.id ? "bg-white dark:bg-slate-900 text-indigo-600" : "bg-slate-200/50 dark:bg-slate-800/50 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"}
                                `,
                children: [
                  /* @__PURE__ */ jsx("div", { className: `w-2 h-2 rounded-full ${currentInvoiceId === inv.id ? "bg-indigo-500 animate-pulse" : "bg-slate-400"}` }),
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-bold truncate", children: inv.customer?.name || `Sale #${idx + 1}` }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: (e) => {
                        e.stopPropagation();
                        const proceed = () => {
                          removeInvoice(inv.id);
                          if (activeInvoices.length === 1) router.visit(route("store.pre-sales.index", { store_slug: store?.slug }));
                        };
                        if (activeInvoices.length === 1 && inv.items.length > 1) {
                          showConfirm({
                            title: "Discard Sale?",
                            message: "You have unsaved items. Discarding will lose this data.",
                            type: "error",
                            confirmLabel: "Discard",
                            onConfirm: proceed
                          });
                        } else {
                          proceed();
                        }
                      },
                      className: "ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 transition-all",
                      children: /* @__PURE__ */ jsx(X, { size: 12 })
                    }
                  )
                ]
              },
              inv.id
            )),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => addInvoice({
                  delivery_charge: defaultDelivery,
                  extra_charge_value: defaultExtraValue,
                  extra_charge_label: defaultExtraLabel
                }),
                className: "px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 shrink-0",
                title: "New Tab",
                children: /* @__PURE__ */ jsx(Plus, { size: 12 })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-800/30 shrink-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => {
                    setShowQuickEntry(!showQuickEntry);
                    if (!showQuickEntry) {
                      setTimeout(() => document.getElementById("quick-entry-input")?.focus(), 50);
                    }
                  },
                  className: `flex items-center justify-center w-12 h-12 rounded-2xl transition-all border ${showQuickEntry ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20" : "bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50"}`,
                  title: "Toggle Quick Add (Alt+Q)",
                  children: /* @__PURE__ */ jsx(Zap, { size: 20, className: showQuickEntry ? "fill-current" : "" })
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setIsScanning(true),
                  className: "flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-50 transition-all border border-slate-200 dark:border-slate-700 shadow-sm",
                  title: "Scanning Mode",
                  children: [
                    /* @__PURE__ */ jsx(ScanBarcode, { size: 20 }),
                    /* @__PURE__ */ jsx("span", { className: "text-sm font-bold", children: "Scan" })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "relative flex-1 max-w-xl", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400", children: /* @__PURE__ */ jsx(User, { size: 18 }) }),
              currentInvoice.customer ? /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsxs("div", { className: "w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-10 py-3.5 flex items-center justify-between shadow-sm", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white text-sm", children: currentInvoice.customer.name }),
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: currentInvoice.customer.phone || "No Phone" })
                  ] }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => {
                        patchInvoice({ customer: null });
                        setCustomerSearch("");
                      },
                      className: "absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors",
                      children: /* @__PURE__ */ jsx(X, { size: 18 })
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx("div", { className: "absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500", children: /* @__PURE__ */ jsx(User, { size: 18 }) })
              ] }) : /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(
                  AsyncPartyCombobox,
                  {
                    type: "all",
                    selectedItem: currentInvoice.customer,
                    onSelect: (customer) => {
                      patchInvoice({ customer });
                      setCustomerError(false);
                    },
                    onCreateNew: () => setIsPartyModalOpen(true),
                    onEdit: (customer) => {
                      setEditingParty(customer);
                      setIsPartyModalOpen(true);
                    },
                    placeholder: "Search Party (Name/Phone)...",
                    addNewLabel: "Create New Party"
                  }
                ),
                customerError && /* @__PURE__ */ jsx("p", { className: "absolute -bottom-5 left-2 text-[10px] font-bold text-red-500 animate-pulse", children: "Please select a registered customer" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => patchInvoice({ paymentMethod: "credit" }),
                    className: `px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1.5 transition-all ${currentInvoice.paymentMethod === "credit" ? "bg-emerald-500 text-white shadow shadow-emerald-500/20" : "text-slate-500 hover:text-slate-700"}`,
                    children: [
                      /* @__PURE__ */ jsx(CreditCard, { size: 12 }),
                      " CREDIT"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => patchInvoice({ paymentMethod: "cash" }),
                    className: `px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1.5 transition-all ${currentInvoice.paymentMethod === "cash" ? "bg-orange-500 text-white shadow shadow-orange-500/20" : "text-slate-500 hover:text-slate-700"}`,
                    children: [
                      /* @__PURE__ */ jsx(Banknote, { size: 12 }),
                      " CASH"
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "relative group/accounts", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    className: "flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 text-[10px] font-black min-w-[120px] justify-between",
                    children: [
                      /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 truncate", children: [
                        /* @__PURE__ */ jsx(Wallet, { size: 12, className: "text-indigo-500" }),
                        currentInvoice.selectedBankName || accounts.find((a) => a.id === (currentInvoice.paymentAccountId || 1))?.name || "Cash in Hand"
                      ] }),
                      /* @__PURE__ */ jsx(ChevronRight, { size: 12, className: "rotate-90 text-slate-400" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsx("div", { className: "absolute top-full pt-2 right-0 w-48 z-50 overflow-hidden hidden group-hover/accounts:block animate-in fade-in slide-in-from-top-2", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden", children: [
                  /* @__PURE__ */ jsx("div", { className: "p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50", children: /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-slate-400 uppercase", children: "Deposit To" }) }),
                  /* @__PURE__ */ jsx("div", { className: "max-h-48 overflow-y-auto custom-scrollbar p-1", children: accounts.map((acc) => /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => {
                        if (acc.isBank) {
                          patchInvoice({
                            paymentAccountId: acc.realAccountId,
                            selectedBankName: acc.name,
                            paymentReference: `Deposited to: ${acc.name}`
                          });
                        } else {
                          patchInvoice({
                            paymentAccountId: acc.id,
                            selectedBankName: null,
                            // Clear explicit bank name
                            paymentReference: ""
                          });
                        }
                      },
                      className: `w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-between ${(currentInvoice.paymentAccountId || 1) === acc.id ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`,
                      children: [
                        /* @__PURE__ */ jsx("span", { children: acc.name }),
                        (currentInvoice.paymentAccountId || 1) === acc.id && /* @__PURE__ */ jsx(CheckCircle2, { size: 12 })
                      ]
                    },
                    acc.id
                  )) })
                ] }) })
              ] }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onMouseDown: handleProfitDown,
                  onMouseUp: handleProfitUp,
                  onMouseLeave: handleProfitUp,
                  className: "flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all border border-emerald-200 dark:border-emerald-800 text-[10px] font-black select-none",
                  children: [
                    /* @__PURE__ */ jsx(TrendingUp, { size: 12 }),
                    " MARGIN"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => setShowTextSizeMenu(!showTextSizeMenu),
                    className: `flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all border text-[10px] font-black ${textSize > 1 ? "bg-purple-500 text-white border-purple-500 shadow shadow-purple-500/20" : "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30"}`,
                    title: "Change Text Size",
                    children: [
                      /* @__PURE__ */ jsx(Type, { size: 12 }),
                      " Aa+ ",
                      textSize > 1 && `(${textSize})`
                    ]
                  }
                ),
                showTextSizeMenu && /* @__PURE__ */ jsx("div", { className: "absolute top-full mt-2 right-0 w-32 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2", children: [1, 2, 3, 4, 5].map((size) => /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => {
                      setTextSize(size);
                      setShowTextSizeMenu(false);
                    },
                    className: `w-full text-left px-4 py-3 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${textSize === size ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600" : "text-slate-600 dark:text-slate-300"}`,
                    children: size === 1 ? "Normal" : size === 2 ? "Large" : size === 3 ? "Larger" : size === 4 ? "Senior" : "Max"
                  },
                  size
                )) })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setShowSettingsDrawer(true),
                  className: "flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 text-[10px] font-black",
                  title: "Quick Settings",
                  children: /* @__PURE__ */ jsx(Settings, { size: 12 })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto hide-scrollbar px-4 py-3", children: /* @__PURE__ */ jsxs("table", { className: "w-full border-separate border-spacing-y-1.5", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-left text-xs font-bold text-slate-400 uppercase tracking-wide", children: [
              /* @__PURE__ */ jsx("th", { className: "pb-2 w-8" }),
              /* @__PURE__ */ jsx("th", { className: "pb-2 pl-3 w-10 text-center", children: "#" }),
              /* @__PURE__ */ jsx("th", { className: "pb-2", children: "Item Description" }),
              /* @__PURE__ */ jsx("th", { className: "pb-2 w-20 text-center", children: "Qty" }),
              /* @__PURE__ */ jsx("th", { className: "pb-2 w-20 text-center text-xs text-emerald-600", children: "Free" }),
              /* @__PURE__ */ jsx("th", { className: "pb-2 w-28 text-right", children: "Price" }),
              /* @__PURE__ */ jsx("th", { className: "pb-2 w-32 text-right", children: "Discount" }),
              /* @__PURE__ */ jsx("th", { className: "pb-2 w-28 text-right", children: "Total" }),
              /* @__PURE__ */ jsx("th", { className: "pb-2 w-10" })
            ] }) }),
            /* @__PURE__ */ jsxs("tbody", { children: [
              showQuickEntry && /* @__PURE__ */ jsxs("tr", { className: "bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/10 border border-indigo-200 dark:border-indigo-800/50 rounded-xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200", children: [
                /* @__PURE__ */ jsx("td", { className: "py-3" }),
                /* @__PURE__ */ jsx("td", { className: "py-3 pl-3", children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center", children: /* @__PURE__ */ jsx(Zap, { size: 16, className: "text-indigo-600" }) }) }),
                /* @__PURE__ */ jsx("td", { className: "py-3 relative", children: /* @__PURE__ */ jsx(
                  AsyncProductCombobox,
                  {
                    selectedItem: quickEntry.product,
                    onSelect: selectQuickProduct,
                    onCreateNew: (name) => {
                      setProductModalMode("create");
                      setEditingProduct({ name });
                      setIsProductModalOpen(true);
                    },
                    onEdit: (product) => {
                      setEditingProduct(product);
                      setProductModalMode("edit");
                      setIsProductModalOpen(true);
                    },
                    placeholder: "Quick Add Product...",
                    addNewLabel: "Add New Product",
                    hideCostAndMargin: !isAdmin
                  }
                ) }),
                /* @__PURE__ */ jsx("td", { className: "py-3 text-center", children: /* @__PURE__ */ jsx(
                  "input",
                  {
                    ref: quantityRef,
                    type: "number",
                    value: quickEntry.quantity,
                    onChange: (e) => setQuickEntry((prev) => ({ ...prev, quantity: parseFloat(e.target.value) || 0 })),
                    onKeyDown: (e) => {
                      if (e.key === "Enter") discountRef.current?.focus();
                    },
                    onFocus: () => setQuickResults([]),
                    className: "w-16 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900/30 rounded-lg text-center text-sm font-bold py-2 focus:ring-2 ring-indigo-500/20 outline-none"
                  }
                ) }),
                /* @__PURE__ */ jsx("td", { className: "py-3 text-center", children: /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    value: quickEntry.freeQuantity || "",
                    placeholder: "0",
                    onChange: (e) => setQuickEntry((prev) => ({ ...prev, freeQuantity: parseFloat(e.target.value) || 0 })),
                    onFocus: () => setQuickResults([]),
                    className: "w-16 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-lg text-center text-sm font-bold text-emerald-600 dark:text-emerald-400 py-2 focus:ring-2 ring-emerald-500/20 outline-none placeholder-emerald-300"
                  }
                ) }),
                /* @__PURE__ */ jsx("td", { className: "py-3 text-right", children: /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    value: quickEntry.price,
                    onChange: (e) => setQuickEntry((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 })),
                    onFocus: () => setQuickResults([]),
                    onKeyDown: (e) => e.key === "Enter" && addQuickItem(),
                    className: "w-24 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900/30 rounded-lg text-right text-sm font-bold py-2 px-3 focus:ring-2 ring-indigo-500/20 outline-none"
                  }
                ) }),
                /* @__PURE__ */ jsx("td", { className: "py-3 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      ref: discountRef,
                      type: "number",
                      value: quickEntry.discount,
                      onChange: (e) => setQuickEntry((prev) => ({ ...prev, discount: parseFloat(e.target.value) || 0 })),
                      onFocus: () => setQuickResults([]),
                      onKeyDown: (e) => e.key === "Enter" && addQuickItem(),
                      className: "w-20 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900/30 rounded-lg text-right text-sm font-bold py-2 px-3 focus:ring-2 ring-indigo-500/20 outline-none"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => {
                        setQuickResults([]);
                        setQuickEntry((prev) => ({ ...prev, discountType: prev.discountType === "fixed" ? "percent" : "fixed" }));
                      },
                      className: `w-8 h-8 rounded-lg text-xs font-black transition-all ${quickEntry.discountType === "percent" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`,
                      children: quickEntry.discountType === "percent" ? "%" : "Rs"
                    }
                  )
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "py-3 text-right", children: /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: addQuickItem,
                    className: "w-8 h-8 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow shadow-indigo-500/30 flex items-center justify-center active:scale-90",
                    children: /* @__PURE__ */ jsx(Plus, { size: 18 })
                  }
                ) }),
                /* @__PURE__ */ jsx("td", { className: "py-3 pr-3" })
              ] }),
              currentInvoice.items.map((item, idx) => /* @__PURE__ */ jsxs(
                "tr",
                {
                  className: `group animate-in fade-in duration-200 ${draggedItemIndex === idx ? "opacity-50" : ""}`,
                  draggable: true,
                  onDragStart: (e) => {
                  },
                  onDragOver: (e) => handleDragOver(e, idx),
                  onDragEnd: handleDragEnd,
                  children: [
                    /* @__PURE__ */ jsx(
                      "td",
                      {
                        className: "bg-slate-50 dark:bg-slate-800/50 rounded-l-xl py-3 pl-2 cursor-ns-resize group-active:cursor-grabbing",
                        onMouseDown: (e) => {
                          e.currentTarget.parentElement.setAttribute("draggable", "true");
                        },
                        onMouseUp: (e) => {
                          e.currentTarget.parentElement.setAttribute("draggable", "false");
                        },
                        children: /* @__PURE__ */ jsx(GripVertical, { size: 16, className: "text-slate-300 hover:text-slate-500 transition-colors" })
                      }
                    ),
                    /* @__PURE__ */ jsx("td", { className: "bg-slate-50 dark:bg-slate-800/50 py-3 text-sm font-bold text-slate-400 text-center", children: idx + 1 }),
                    /* @__PURE__ */ jsx("td", { className: "bg-slate-50 dark:bg-slate-800/50 py-3 relative px-2", children: /* @__PURE__ */ jsx(
                      AsyncProductCombobox,
                      {
                        selectedItem: item.product,
                        onSelect: (product) => selectProduct(product, item.id),
                        onCreateNew: (name) => {
                          setEditingProduct({ name });
                          setProductModalMode("create");
                          setIsProductModalOpen(true);
                        },
                        onEdit: (product) => {
                          setEditingProduct(product);
                          setProductModalMode("edit");
                          setIsProductModalOpen(true);
                        },
                        placeholder: "Search item...",
                        addNewLabel: "Create New Product",
                        hideCostAndMargin: !isAdmin
                      }
                    ) }),
                    /* @__PURE__ */ jsx("td", { className: "bg-slate-50 dark:bg-slate-800/50 py-3 text-center", children: /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "number",
                        value: item.quantity ?? 1,
                        onChange: (e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0),
                        onFocus: (e) => {
                          e.target.select();
                          setActiveItemIndex(null);
                          setProductResults([]);
                        },
                        className: "w-16 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-center text-sm font-bold py-2 focus:ring-2 ring-indigo-500/20 transition-all"
                      }
                    ) }),
                    /* @__PURE__ */ jsx("td", { className: "bg-slate-50 dark:bg-slate-800/50 py-3 text-center", children: /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "number",
                        value: item.freeQuantity || "",
                        placeholder: "0",
                        onChange: (e) => updateItem(item.id, "freeQuantity", parseFloat(e.target.value) || 0),
                        className: "w-16 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200/50 dark:border-emerald-800/30 rounded-lg text-center text-sm font-bold text-emerald-600 dark:text-emerald-400 py-2 focus:ring-2 ring-emerald-500/20 transition-all placeholder-emerald-300/50"
                      }
                    ) }),
                    /* @__PURE__ */ jsx("td", { className: "bg-slate-50 dark:bg-slate-800/50 py-3 text-right", children: /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "number",
                        value: item.price ?? 0,
                        onChange: (e) => updateItem(item.id, "price", parseFloat(e.target.value) || 0),
                        onFocus: (e) => {
                          e.target.select();
                          setActiveItemIndex(null);
                          setProductResults([]);
                        },
                        className: "w-24 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-right text-sm font-bold py-2 px-3 focus:ring-2 ring-indigo-500/20 transition-all"
                      }
                    ) }),
                    /* @__PURE__ */ jsx("td", { className: "bg-slate-50 dark:bg-slate-800/50 py-3 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2", children: [
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "number",
                          value: item.discount ?? 0,
                          onChange: (e) => updateItem(item.id, "discount", parseFloat(e.target.value) || 0),
                          className: "w-20 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-right text-sm font-bold py-2 px-3 focus:ring-2 ring-indigo-500/20 transition-all"
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          onClick: () => updateItem(item.id, "discountType", item.discountType === "fixed" ? "percent" : "fixed"),
                          className: `w-8 h-8 rounded-lg text-xs font-black transition-all ${item.discountType === "percent" ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-600"}`,
                          children: item.discountType === "percent" ? "%" : window.amdSettings?.currency_symbol || "Rs"
                        }
                      )
                    ] }) }),
                    /* @__PURE__ */ jsx("td", { className: "bg-slate-50 dark:bg-slate-800/50 py-3 pr-3 align-middle", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1.5", children: [
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          onClick: () => toggleItemTotalMode(item.id),
                          title: getItemTotalMode(item.id) === "price" ? "Recalculates: Price  (click → Qty mode)" : "Recalculates: Qty  (click → Price mode)",
                          className: `w-7 h-7 rounded-md text-[10px] font-black transition-all shrink-0 border flex items-center justify-center ${getItemTotalMode(item.id) === "price" ? "bg-indigo-600 text-white border-indigo-500 shadow shadow-indigo-500/30" : "bg-emerald-600 text-white border-emerald-500 shadow shadow-emerald-500/30"}`,
                          children: getItemTotalMode(item.id) === "price" ? store?.currency_symbol || "₨" : "#"
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "number",
                          value: parseFloat(calculateLineTotal(item).toFixed(2)),
                          onChange: (e) => handleTotalChange(item, e.target.value),
                          onFocus: (e) => e.target.select(),
                          className: "w-24 bg-white dark:bg-slate-700 border border-indigo-300 dark:border-indigo-600 rounded-lg text-right text-sm font-bold py-2 px-3 focus:ring-2 ring-indigo-500/30 transition-all text-slate-800 dark:text-white"
                        }
                      )
                    ] }) }),
                    /* @__PURE__ */ jsx("td", { className: "bg-slate-50 dark:bg-slate-800/50 rounded-r-xl py-3 pr-3", children: /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => removeItem(item.id),
                        className: "p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all",
                        children: /* @__PURE__ */ jsx(Trash2, { size: 16 })
                      }
                    ) })
                  ]
                },
                item.id
              ))
            ] })
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "shrink-0 px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900", children: /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: addItem,
              className: "w-full flex items-center justify-center gap-2 text-indigo-600 font-bold text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 py-3 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-800 transition-all",
              children: [
                /* @__PURE__ */ jsx(Plus, { size: 18 }),
                " ADD NEW ITEM"
              ]
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "w-80 bg-[#1a1d2e] flex flex-col overflow-hidden rounded-2xl shadow-2xl border border-slate-800", children: [
          /* @__PURE__ */ jsx("div", { className: "p-4 border-b border-slate-800/50 bg-slate-900/30 shrink-0", children: currentInvoice.customer ? /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: `rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0 ${textSize >= 4 ? "w-16 h-16 text-xl" : textSize >= 3 ? "w-14 h-14 text-lg" : "w-12 h-12 text-lg"}`, children: currentInvoice.customer.name.charAt(0) }),
              /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsx("p", { className: `text-white font-bold truncate ${textSize >= 4 ? "text-lg" : textSize >= 3 ? "text-base" : "text-sm"}`, children: currentInvoice.customer.name }),
                /* @__PURE__ */ jsx("p", { className: `text-slate-400 font-medium ${textSize >= 4 ? "text-sm" : textSize >= 3 ? "text-xs" : "text-[10px]"}`, children: currentInvoice.customer.phone || "No Phone" })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => {
                    patchInvoice({ customer: null });
                    setCustomerSearch("");
                  },
                  className: "text-slate-600 hover:text-red-400 p-1.5 hover:bg-red-400/10 rounded-lg transition-all shrink-0",
                  children: /* @__PURE__ */ jsx(X, { size: 16 })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: `space-y-1 bg-slate-800/30 rounded-lg p-2 ${textSize >= 3 ? "text-sm" : "text-xs"}`, children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-500 font-medium", children: "Balance:" }),
                /* @__PURE__ */ jsx("span", { className: `font-black ${currentInvoice.customer.current_balance >= 0 ? "text-emerald-400" : "text-red-400"}`, children: currentInvoice.customer.current_balance >= 0 ? formatCurrency(Math.abs(currentInvoice.customer.current_balance || 0), store || settings) : "-" + formatCurrency(Math.abs(currentInvoice.customer.current_balance || 0), store || settings) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-500 font-medium shrink-0", children: "Address:" }),
                /* @__PURE__ */ jsx("span", { className: `text-right ${currentInvoice.customer.address ? "text-slate-300" : "text-slate-600 italic"}`, children: currentInvoice.customer.address || "Not set" })
              ] })
            ] })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "text-center py-4 border border-dashed border-slate-700 rounded-xl", children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-2 text-slate-500", children: /* @__PURE__ */ jsx(User, { size: 20 }) }),
            /* @__PURE__ */ jsx("p", { className: `text-slate-400 font-bold ${textSize >= 3 ? "text-sm" : "text-xs"}`, children: "No Customer Selected" })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 p-3 space-y-3 overflow-y-auto hide-scrollbar", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "text-[9px] text-slate-500 font-bold uppercase block mb-1", children: "Invoice #" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: currentInvoice.invoiceNumber || "",
                    onChange: (e) => patchInvoice({ invoiceNumber: e.target.value }),
                    className: "w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-1.5 text-white text-[10px] font-bold focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all",
                    placeholder: "INV-000001"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "text-[9px] text-slate-500 font-bold uppercase block mb-1", children: "Date" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "date",
                    value: currentInvoice.date || "",
                    onChange: (e) => patchInvoice({ date: e.target.value }),
                    className: "w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-1.5 text-white text-[10px] font-bold focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-[9px] text-slate-500 font-bold uppercase block mb-1", children: "Terms" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: currentInvoice.paymentTerms || "net30",
                  onChange: (e) => patchInvoice({ paymentTerms: e.target.value }),
                  className: "w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-1.5 text-white text-[10px] font-bold focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "immediate", children: "Immediate" }),
                    /* @__PURE__ */ jsx("option", { value: "net7", children: "Net 7" }),
                    /* @__PURE__ */ jsx("option", { value: "net15", children: "Net 15" }),
                    /* @__PURE__ */ jsx("option", { value: "net30", children: "Net 30" }),
                    /* @__PURE__ */ jsx("option", { value: "net60", children: "Net 60" })
                  ]
                }
              )
            ] }),
            currentInvoice.paymentAccountId === "CHEQUE" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/30 animate-in slide-in-from-top-2", children: [
              /* @__PURE__ */ jsx("div", { className: "col-span-2", children: /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-indigo-400 font-black uppercase mb-2 flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(Wallet, { size: 12 }),
                " CHEQUE DETAILS"
              ] }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "text-[9px] text-slate-500 font-bold uppercase block mb-1", children: "Cheque No" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: currentInvoice.paymentReference || "",
                    onChange: (e) => patchInvoice({ paymentReference: e.target.value }),
                    className: "w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-1.5 text-white text-[10px] font-bold focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-slate-600",
                    placeholder: "XXXXXX"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "text-[9px] text-slate-500 font-bold uppercase block mb-1", children: "Cheque Date" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "date",
                    value: currentInvoice.chequeDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
                    onChange: (e) => patchInvoice({ chequeDate: e.target.value }),
                    className: "w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-1.5 text-white text-[10px] font-bold focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 pt-3 border-t border-slate-800/50", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400 font-bold", children: "Subtotal" }),
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold text-base", children: formatCurrency(subtotal, store || settings) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400 font-bold", children: "Item Discounts" }),
                /* @__PURE__ */ jsxs("span", { className: "text-red-400 font-bold text-sm", children: [
                  "- ",
                  formatCurrency(itemDiscounts, store || settings)
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between bg-slate-800/30 rounded-xl p-3 border border-slate-700/50", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400 font-bold", children: "Invoice Discount" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-500 text-xs", children: getCurrencySymbol(store || settings) }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    value: currentInvoice.discount ?? 0,
                    onChange: (e) => patchInvoice({ discount: parseFloat(e.target.value) || 0 }),
                    className: "w-20 bg-slate-700/50 border border-slate-600/50 rounded-lg px-2 py-1.5 text-white font-bold text-sm text-right focus:ring-2 ring-indigo-500/20 transition-all",
                    placeholder: "0"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between bg-slate-800/30 rounded-xl p-3 border border-slate-700/50", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400 font-bold", children: "Tax" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    value: currentInvoice.tax ?? 0,
                    onChange: (e) => patchInvoice({ tax: parseFloat(e.target.value) || 0 }),
                    className: "w-16 bg-slate-700/50 border border-slate-600/50 rounded-lg px-2 py-1.5 text-white font-bold text-sm text-right focus:ring-2 ring-indigo-500/20 transition-all",
                    placeholder: "0"
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "text-slate-500 text-xs", children: "%" })
              ] })
            ] }),
            showDeliveryCharges && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-2 hover:bg-slate-800/20 rounded-lg transition-colors group", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500 font-bold group-hover:text-slate-400", children: "Delivery Charges" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-600 text-[10px]", children: getCurrencySymbol(store || settings) }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    value: currentInvoice.delivery_charge ?? 0,
                    onChange: (e) => patchInvoice({ delivery_charge: parseFloat(e.target.value) || 0 }),
                    className: "w-20 bg-transparent border-b border-dashed border-slate-700 hover:border-indigo-500 transition-all text-xs font-bold text-slate-300 text-right focus:ring-0 focus:border-indigo-500",
                    placeholder: "0"
                  }
                )
              ] })
            ] }),
            showExtraField && /* @__PURE__ */ jsx(Fragment, { children: !enableMultipleExtras ? (
              /* Single Extra Field Mode */
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-2 hover:bg-slate-800/20 rounded-lg transition-colors group", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      value: currentInvoice.extra_charge_label ?? "",
                      onChange: (e) => patchInvoice({ extra_charge_label: e.target.value }),
                      className: "bg-transparent border-none p-0 text-xs text-slate-500 font-bold w-20 group-hover:text-slate-400 focus:ring-0",
                      placeholder: "Extra"
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] text-slate-700", children: "✎" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-slate-600 text-[10px]", children: getCurrencySymbol(store || settings) }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      value: currentInvoice.extra_charge_value ?? 0,
                      onChange: (e) => patchInvoice({ extra_charge_value: parseFloat(e.target.value) || 0 }),
                      className: "w-20 bg-transparent border-b border-dashed border-slate-700 hover:border-indigo-500 transition-all text-xs font-bold text-slate-300 text-right focus:ring-0 focus:border-indigo-500",
                      placeholder: "0"
                    }
                  )
                ] })
              ] })
            ) : (
              /* Multiple Extra Fields Mode */
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                (currentInvoice.extraFields || [{ id: 1, label: "", value: 0 }]).map((field, idx) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-2 hover:bg-slate-800/20 rounded-lg transition-colors group", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        value: field.label ?? "",
                        onChange: (e) => {
                          const updated = [...currentInvoice.extraFields || [{ id: 1, label: "", value: 0 }]];
                          updated[idx] = { ...updated[idx], label: e.target.value };
                          patchInvoice({ extraFields: updated });
                        },
                        className: "bg-transparent border-none p-0 text-xs text-slate-500 font-bold w-20 group-hover:text-slate-400 focus:ring-0",
                        placeholder: `Extra ${idx + 1}`
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { className: "text-[10px] text-slate-700", children: "✎" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-slate-600 text-[10px]", children: getCurrencySymbol(store || settings) }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "number",
                        value: field.value ?? 0,
                        onChange: (e) => {
                          const updated = [...currentInvoice.extraFields || [{ id: 1, label: "", value: 0 }]];
                          updated[idx] = { ...updated[idx], value: parseFloat(e.target.value) || 0 };
                          patchInvoice({ extraFields: updated });
                        },
                        className: "w-16 bg-transparent border-b border-dashed border-slate-700 hover:border-indigo-500 transition-all text-xs font-bold text-slate-300 text-right focus:ring-0 focus:border-indigo-500",
                        placeholder: "0"
                      }
                    ),
                    (currentInvoice.extraFields || []).length > 1 && /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => {
                          const updated = (currentInvoice.extraFields || []).filter((_, i) => i !== idx);
                          patchInvoice({ extraFields: updated });
                        },
                        className: "text-slate-600 hover:text-red-400 p-0.5 opacity-0 group-hover:opacity-100 transition-all",
                        children: /* @__PURE__ */ jsx(X, { size: 12 })
                      }
                    )
                  ] })
                ] }, field.id || idx)),
                (currentInvoice.extraFields || []).length < 10 && /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => {
                      const current = currentInvoice.extraFields || [{ id: 1, label: "", value: 0 }];
                      patchInvoice({ extraFields: [...current, { id: Date.now(), label: "", value: 0 }] });
                    },
                    className: "w-full text-center text-[10px] text-indigo-400 hover:text-indigo-300 font-bold py-1 hover:bg-indigo-900/20 rounded-lg transition-all",
                    children: "+ Add Extra Field"
                  }
                )
              ] })
            ) }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between bg-emerald-900/20 rounded-xl p-3 border border-emerald-800/30", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs text-emerald-400 font-bold", children: "Amount Paid" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-emerald-600 text-xs", children: getCurrencySymbol(store || settings) }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    value: currentInvoice.amountPaid ?? 0,
                    onChange: (e) => patchInvoice({ amountPaid: parseFloat(e.target.value) || 0 }),
                    onFocus: (e) => e.target.select(),
                    className: "w-24 bg-emerald-800/30 border border-emerald-700/50 rounded-lg px-2 py-1.5 text-emerald-400 font-bold text-sm text-right focus:ring-2 ring-emerald-500/20 transition-all",
                    placeholder: "0"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: `flex items-center justify-between rounded-xl p-3 border ${balanceDue > 0 ? "bg-red-900/20 border-red-800/30" : "bg-emerald-900/20 border-emerald-800/30"}`, children: [
              /* @__PURE__ */ jsx("span", { className: `text-xs font-bold ${balanceDue > 0 ? "text-red-400" : "text-emerald-400"}`, children: "Balance Due" }),
              /* @__PURE__ */ jsx("span", { className: `font-bold text-base ${balanceDue > 0 ? "text-red-400" : "text-emerald-400"}`, children: formatCurrency(balanceDue, store || settings) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-3 bg-slate-900 space-y-2 shrink-0 border-t border-slate-800", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[10px] text-slate-500 font-bold uppercase", children: "Total" }),
              /* @__PURE__ */ jsx("span", { className: "text-2xl font-black text-white", children: formatCurrency(grandTotal, store || settings) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => initiateSave(false),
                  disabled: saving,
                  className: "w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50",
                  children: [
                    /* @__PURE__ */ jsx(CheckCircle2, { size: 16 }),
                    saving ? "SAVING..." : isEditMode ? "UPDATE QUOTATION" : "SAVE QUOTATION"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => initiateSave(true),
                    disabled: saving,
                    className: "flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50",
                    children: [
                      /* @__PURE__ */ jsx(Printer, { size: 16 }),
                      saving ? "..." : "PRINT QUOTATION"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => {
                      if (isEditMode) {
                        router.visit(route("store.pre-sales.index", { store_slug: store?.slug }));
                        return;
                      }
                      showConfirm({
                        title: "Cancel Sale?",
                        message: "Discard this sale? Items will be lost.",
                        type: "warning",
                        confirmLabel: "Yes, Discard",
                        onConfirm: () => {
                          removeInvoice(currentInvoice.id);
                          router.visit(route("store.pre-sales.index", { store_slug: store?.slug }));
                        }
                      });
                    },
                    className: "flex-1 py-3 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border border-red-500/20 active:scale-95",
                    children: [
                      /* @__PURE__ */ jsx(X, { size: 16 }),
                      " CANCEL"
                    ]
                  }
                )
              ] })
            ] })
          ] })
        ] })
      ] })
    ] }),
    showProfit && !showProfitModal && /* @__PURE__ */ jsx("div", { className: "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-200", children: /* @__PURE__ */ jsxs("div", { className: "bg-slate-900/95 backdrop-blur-lg rounded-2xl px-8 py-4 shadow-2xl border border-slate-700 flex items-center gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: `w-12 h-12 rounded-xl flex items-center justify-center ${profit >= 0 ? "bg-emerald-500/20" : "bg-red-500/20"}`, children: /* @__PURE__ */ jsx(TrendingUp, { size: 24, className: profit >= 0 ? "text-emerald-400" : "text-red-400" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 font-bold uppercase", children: "Profit Margin" }),
          /* @__PURE__ */ jsx("p", { className: `text-2xl font-black ${profit >= 0 ? "text-emerald-400" : "text-red-400"}`, children: formatCurrency(profit, store || settings) })
        ] })
      ] }),
      grandTotal > 0 && /* @__PURE__ */ jsxs("div", { className: "border-l border-slate-700 pl-6", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 font-bold uppercase", children: "Margin %" }),
        /* @__PURE__ */ jsxs("p", { className: `text-xl font-black ${profit >= 0 ? "text-emerald-400" : "text-red-400"}`, children: [
          (profit / grandTotal * 100).toFixed(1),
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 italic", children: "↓ Drag down for details" })
    ] }) }),
    /* @__PURE__ */ jsx(
      FormModal,
      {
        isOpen: showSuccessModal,
        onClose: () => {
          setShowSuccessModal(false);
          removeInvoice(currentInvoice.id);
        },
        title: "Sale Completed!",
        subtitle: "Your invoice has been saved successfully",
        size: "md",
        children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center py-6 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mb-6 animate-bounce", children: /* @__PURE__ */ jsx(CheckCircle2, { size: 48, className: "text-emerald-500" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-black text-slate-800 dark:text-white mb-2", children: "Transaction Successful" }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 dark:text-slate-400 text-sm mb-8", children: "The receipt has been generated and stock updated." }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-3 w-full", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => {
                  window.open(route("store.sales.print", { store_slug: store?.slug, sale: lastSaleId }), "_blank");
                },
                className: "w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/20",
                children: [
                  /* @__PURE__ */ jsx(Printer, { size: 20 }),
                  " PRINT RECEIPT"
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setShowSuccessModal(false);
                  removeInvoice(currentInvoice.id);
                },
                className: "w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black hover:bg-slate-200 transition-all",
                children: "NEW TRANSACTION"
              }
            )
          ] })
        ] })
      }
    ),
    isScanning && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-5", children: [
          /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-500/20", children: /* @__PURE__ */ jsx(ScanBarcode, { size: 28 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black text-slate-800 dark:text-white", children: "Scanning Mode" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 font-bold", children: "Scan items one after another" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => setIsScanning(false), className: "p-4 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all", children: /* @__PURE__ */ jsx(X, { size: 28, className: "text-slate-400" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-8 space-y-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              autoFocus: true,
              type: "text",
              placeholder: "Scan Barcode Now...",
              value: scanBuffer,
              onChange: (e) => setScanBuffer(e.target.value),
              onKeyDown: handleScan,
              className: "w-full py-8 px-10 bg-slate-50 dark:bg-slate-800 border-4 border-indigo-100 dark:border-indigo-900/30 rounded-[32px] text-3xl font-black text-center focus:ring-8 ring-indigo-500/10 placeholder-slate-200 transition-all"
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "absolute right-8 top-1/2 -translate-y-1/2", children: /* @__PURE__ */ jsx("div", { className: "w-4 h-4 bg-red-500 rounded-full animate-ping" }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "max-h-80 overflow-y-auto space-y-4 custom-scrollbar pr-2", children: scannedItems.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-16 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[40px]", children: [
          /* @__PURE__ */ jsx(Package, { size: 64, className: "mx-auto text-slate-200 mb-4" }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-400 font-black text-lg", children: "No items scanned yet" })
        ] }) : scannedItems.map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-2 duration-200", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-5", children: [
            /* @__PURE__ */ jsx("span", { className: "w-10 h-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-xs font-black text-slate-400 shadow-sm", children: idx + 1 }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("p", { className: "font-black text-slate-800 dark:text-white text-lg", children: [
                item.name,
                item.quantity > 1 && /* @__PURE__ */ jsxs("span", { className: "ml-2 text-emerald-500 text-base", children: [
                  "x",
                  item.quantity
                ] })
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-sm text-indigo-500 font-black", children: [
                item.quantity,
                " @ ",
                formatCurrency(item.price, store || settings),
                " = ",
                formatCurrency(item.quantity * item.price, store || settings)
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: () => setScannedItems((prev) => prev.filter((i) => i.id !== item.id)), className: "p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all", children: /* @__PURE__ */ jsx(Trash2, { size: 24 }) })
        ] }, item.id)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-8 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between border-t border-slate-100 dark:border-slate-800", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-base font-black text-slate-500 uppercase tracking-widest", children: [
          "Total: ",
          /* @__PURE__ */ jsxs("span", { className: "text-indigo-600", children: [
            scannedItems.length,
            " items"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => setScannedItems([]), className: "px-8 py-4 text-sm font-black text-slate-500 hover:text-red-500 transition-colors uppercase tracking-widest", children: "Clear All" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: confirmScan,
              className: "bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95 uppercase tracking-widest",
              children: "Add to Invoice"
            }
          )
        ] })
      ] })
    ] }) }),
    showProfitModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center", children: /* @__PURE__ */ jsx(TrendingUp, { className: "text-emerald-600", size: 20 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-800 dark:text-white", children: "Profit Analysis" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Per-item breakdown" })
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => {
              setShowProfitModal(false);
              setProfitLocked(false);
              setShowProfit(false);
            },
            className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all",
            children: /* @__PURE__ */ jsx(X, { size: 20, className: "text-slate-400" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-4", children: [
        /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-left text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800", children: [
            /* @__PURE__ */ jsx("th", { className: "pb-2 pl-2", children: "#" }),
            /* @__PURE__ */ jsx("th", { className: "pb-2", children: "Product" }),
            /* @__PURE__ */ jsx("th", { className: "pb-2 text-center", children: "Qty" }),
            /* @__PURE__ */ jsx("th", { className: "pb-2 text-right", children: "Cost" }),
            /* @__PURE__ */ jsx("th", { className: "pb-2 text-right", children: "Price" }),
            /* @__PURE__ */ jsx("th", { className: "pb-2 text-right", children: "Margin" }),
            /* @__PURE__ */ jsx("th", { className: "pb-2 text-right pr-2", children: "Profit" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: currentInvoice.items.filter((item) => item.product).map((item, idx) => {
            const cost = item.cost || item.product?.cost || item.product?.cost_price || 0;
            const lineTotal = calculateLineTotal(item);
            const lineCost = cost * item.quantity;
            const lineProfit = lineTotal - lineCost;
            const marginPercent = lineTotal > 0 ? (lineProfit / lineTotal * 100).toFixed(1) : 0;
            return /* @__PURE__ */ jsxs("tr", { className: "border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30", children: [
              /* @__PURE__ */ jsx("td", { className: "py-2 pl-2 text-slate-400 text-xs", children: idx + 1 }),
              /* @__PURE__ */ jsxs("td", { className: "py-2", children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white text-xs", children: item.product?.name || item.name }),
                /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400", children: item.product?.sku || "N/A" })
              ] }),
              /* @__PURE__ */ jsx("td", { className: "py-2 text-center text-xs", children: item.quantity }),
              /* @__PURE__ */ jsx("td", { className: "py-2 text-right text-xs text-slate-500", children: formatCurrency(cost, store || settings) }),
              /* @__PURE__ */ jsx("td", { className: "py-2 text-right text-xs", children: formatCurrency(item.price, store || settings) }),
              /* @__PURE__ */ jsx("td", { className: "py-2 text-right", children: /* @__PURE__ */ jsxs("span", { className: `text-xs font-bold ${parseFloat(marginPercent) >= 0 ? "text-emerald-500" : "text-red-500"}`, children: [
                marginPercent,
                "%"
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "py-2 text-right pr-2", children: /* @__PURE__ */ jsx("span", { className: `text-xs font-bold ${lineProfit >= 0 ? "text-emerald-600" : "text-red-600"}`, children: formatCurrency(lineProfit, store || settings) }) })
            ] }, item.id);
          }) })
        ] }),
        currentInvoice.items.filter((item) => item.product).length === 0 && /* @__PURE__ */ jsx("div", { className: "text-center py-8 text-slate-400", children: /* @__PURE__ */ jsx("p", { className: "text-sm", children: "No products added yet" }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 shrink-0", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-700", children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 font-bold uppercase mb-1", children: "Total Cost" }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-slate-600", children: formatCurrency(totalCost, store || settings) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-700", children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 font-bold uppercase mb-1", children: "Total Revenue" }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-slate-800 dark:text-white", children: formatCurrency(grandTotal, store || settings) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800", children: [
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-emerald-600 font-bold uppercase mb-1", children: "Net Profit" }),
          /* @__PURE__ */ jsxs("p", { className: `text-lg font-bold ${profit >= 0 ? "text-emerald-600" : "text-red-600"}`, children: [
            formatCurrency(profit, store || settings),
            grandTotal > 0 && /* @__PURE__ */ jsxs("span", { className: "text-xs ml-1 opacity-70", children: [
              "(",
              (profit / grandTotal * 100).toFixed(1),
              "%)"
            ] })
          ] })
        ] })
      ] }) })
    ] }) }),
    showSettingsDrawer && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "fixed inset-0 bg-black/30 backdrop-blur-sm z-[90] animate-in fade-in duration-200",
          onClick: () => setShowSettingsDrawer(false)
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "fixed top-0 right-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl z-[100] animate-in slide-in-from-right duration-300 flex flex-col", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center", children: /* @__PURE__ */ jsx(Settings, { size: 20, className: "text-slate-600 dark:text-slate-400" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-800 dark:text-white", children: "Quick Settings" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Invoice preferences" })
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setShowSettingsDrawer(false),
              className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all",
              children: /* @__PURE__ */ jsx(X, { size: 20, className: "text-slate-400" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 p-4 space-y-4 overflow-y-auto", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold text-slate-400 uppercase tracking-wide", children: "Display" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx(Type, { size: 18, className: "text-purple-500" }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-white", children: "Large Text" }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Bigger fonts for better visibility" })
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1", children: [1, 2, 3, 4, 5].map((s) => /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setTextSize(s),
                  className: `w-7 h-6 rounded-md text-xs font-bold transition-all ${textSize === s ? "bg-purple-500 text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`,
                  children: s
                },
                s
              )) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx(Zap, { size: 18, className: "text-indigo-500" }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-white", children: "Quick Entry" }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Fast product entry row" })
                ] })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setShowQuickEntry(!showQuickEntry),
                  className: `w-12 h-6 rounded-full transition-all ${showQuickEntry ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"}`,
                  children: /* @__PURE__ */ jsx("div", { className: `w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${showQuickEntry ? "translate-x-6" : "translate-x-0.5"}` })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold text-slate-400 uppercase tracking-wide", children: "Permanent Defaults" }),
            /* @__PURE__ */ jsxs("div", { className: "p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl space-y-2 border border-indigo-100 dark:border-indigo-800/50", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase", children: "Default Delivery" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-400 text-xs font-bold", children: window.amdSettings?.currency_symbol || "Rs" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    value: defaultDelivery,
                    onChange: (e) => setDefaultDelivery(parseFloat(e.target.value) || 0),
                    className: "w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-700 dark:text-white",
                    placeholder: "0"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl space-y-2 border border-purple-100 dark:border-purple-800/50", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-purple-600 dark:text-purple-400 uppercase", children: "Default Extra Field" }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: defaultExtraLabel,
                    onChange: (e) => setDefaultExtraLabel(e.target.value),
                    className: "w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 dark:text-white",
                    placeholder: "Field Name (e.g. Service)"
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-slate-400 text-xs font-bold", children: window.amdSettings?.currency_symbol || "Rs" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      value: defaultExtraValue,
                      onChange: (e) => setDefaultExtraValue(parseFloat(e.target.value) || 0),
                      className: "w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-700 dark:text-white",
                      placeholder: "0"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/50", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center", children: /* @__PURE__ */ jsx(Plus, { size: 16, className: "text-amber-600" }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-white", children: "Multiple Extra Fields" }),
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-500", children: "Add up to 10 custom charges" })
                  ] })
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => setEnableMultipleExtras(!enableMultipleExtras),
                    className: `w-12 h-6 rounded-full transition-all ${enableMultipleExtras ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-700"}`,
                    children: /* @__PURE__ */ jsx("div", { className: `w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${enableMultipleExtras ? "translate-x-6" : "translate-x-0.5"}` })
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold text-slate-400 uppercase tracking-wide", children: "Show/Hide Fields" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-white", children: "Delivery Charges" }),
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-500", children: "Show delivery charges field" })
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => setShowDeliveryCharges(!showDeliveryCharges),
                    className: `w-12 h-6 rounded-full transition-all ${showDeliveryCharges ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"}`,
                    children: /* @__PURE__ */ jsx("div", { className: `w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${showDeliveryCharges ? "translate-x-6" : "translate-x-0.5"}` })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-white", children: "Extra Field" }),
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-500", children: "Show extra charge field(s)" })
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => setShowExtraField(!showExtraField),
                    className: `w-12 h-6 rounded-full transition-all ${showExtraField ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"}`,
                    children: /* @__PURE__ */ jsx("div", { className: `w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${showExtraField ? "translate-x-6" : "translate-x-0.5"}` })
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold text-slate-400 uppercase tracking-wide", children: "Invoice Logic" }),
              /* @__PURE__ */ jsxs("div", { className: "p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2", children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-white", children: "Payment Method" }),
                /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => patchInvoice({ paymentMethod: "credit" }),
                      className: `flex-1 py-2 rounded-lg text-xs font-bold transition-all ${currentInvoice.paymentMethod === "credit" ? "bg-emerald-500 text-white" : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600"}`,
                      children: "Credit"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => patchInvoice({ paymentMethod: "cash" }),
                      className: `flex-1 py-2 rounded-lg text-xs font-bold transition-all ${currentInvoice.paymentMethod === "cash" ? "bg-orange-500 text-white" : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600"}`,
                      children: "Cash"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2", children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-white", children: "Default Tax Rate" }),
                /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: [0, 5, 10, 17].map((rate) => /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => patchInvoice({ tax: rate }),
                    className: `flex-1 py-2 rounded-lg text-xs font-bold transition-all ${currentInvoice.tax === rate ? "bg-indigo-500 text-white" : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600"}`,
                    children: [
                      rate,
                      "%"
                    ]
                  },
                  rate
                )) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2", children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-white", children: "Payment Terms" }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: currentInvoice.paymentTerms || "net30",
                    onChange: (e) => patchInvoice({ paymentTerms: e.target.value }),
                    className: "w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 ring-indigo-500/20",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "immediate", children: "Immediate" }),
                      /* @__PURE__ */ jsx("option", { value: "net7", children: "Net 7 Days" }),
                      /* @__PURE__ */ jsx("option", { value: "net15", children: "Net 15 Days" }),
                      /* @__PURE__ */ jsx("option", { value: "net30", children: "Net 30 Days" }),
                      /* @__PURE__ */ jsx("option", { value: "net60", children: "Net 60 Days" })
                    ]
                  }
                )
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50", children: /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setShowSettingsDrawer(false),
            className: "w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:opacity-90 transition-all",
            children: "Done"
          }
        ) })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      QuickPartyModal,
      {
        isOpen: isPartyModalOpen,
        onClose: () => {
          setIsPartyModalOpen(false);
          setEditingParty(null);
        },
        type: "all",
        initialName: customerSearch,
        editingParty,
        onSuccess: (newParty) => {
          patchInvoice({ customer: newParty });
          setCustomerSearch("");
          setEditingParty(null);
        }
      }
    ),
    /* @__PURE__ */ jsx(
      ProductModal,
      {
        isOpen: isProductModalOpen,
        onClose: () => setIsProductModalOpen(false),
        mode: productModalMode,
        product: editingProduct,
        initialName: productModalMode === "create" ? showQuickEntry ? quickEntry.name : activeItemIndex !== null ? currentInvoice.items[activeItemIndex]?.name : "" : "",
        categories,
        warehouses,
        onSubmit: handleProductSubmit
      }
    ),
    showOverpaymentModal && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]",
          onClick: () => setShowOverpaymentModal(false)
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "fixed inset-0 flex items-center justify-center z-[210] p-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-[#1a1d2e] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700/50", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 dark:from-amber-600 dark:via-orange-700 dark:to-orange-900 p-6 overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-yellow-300/20 via-transparent to-red-500/20" }),
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-40 h-40 bg-yellow-400/40 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/4" }),
          /* @__PURE__ */ jsx("div", { className: "absolute bottom-0 right-0 w-32 h-32 bg-red-500/30 rounded-full blur-3xl translate-y-1/2 translate-x-1/4" }),
          /* @__PURE__ */ jsxs("div", { className: "relative flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl", children: /* @__PURE__ */ jsx(CreditCard, { size: 26, className: "text-white drop-shadow-lg" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-white drop-shadow-sm", children: "Overpayment Detected" }),
              /* @__PURE__ */ jsx("p", { className: "text-white/80 text-sm font-medium", children: "Customer paid extra" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-5 bg-gradient-to-b from-white to-slate-50 dark:from-[#1a1d2e] dark:to-[#0f121d]", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-center py-2", children: [
            /* @__PURE__ */ jsxs("p", { className: "text-slate-500 dark:text-slate-400 text-sm mb-2 font-medium", children: [
              overpaymentDetails.customerName,
              " paid"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-indigo-400 font-black text-xl leading-none", children: formatCurrency(overpaymentDetails.amount, store || settings) }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-400 dark:text-slate-500 text-sm mt-2 font-medium", children: "more than the total" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 border border-amber-100 dark:border-amber-800/30", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-amber-700 dark:text-amber-300 text-center font-medium", children: "What would you like to do with this extra amount?" }) }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => {
                  setShowOverpaymentModal(false);
                  processSale(false, tempPrintIntent);
                },
                className: "w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700/50 hover:border-amber-500 dark:hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-all group text-left flex items-center gap-4",
                children: [
                  /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform border border-amber-200 dark:border-amber-800/50", children: /* @__PURE__ */ jsx(ArrowLeftRight, { size: 24 }) }),
                  /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                    /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white", children: "Give Change" }),
                    /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: [
                      "Return ",
                      formatCurrency(overpaymentDetails.amount, store || settings),
                      " to customer"
                    ] })
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => {
                  setShowOverpaymentModal(false);
                  processSale(true, tempPrintIntent);
                },
                className: "w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700/50 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all group text-left flex items-center gap-4",
                children: [
                  /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform border border-emerald-200 dark:border-emerald-800/50", children: /* @__PURE__ */ jsx(Wallet, { size: 24 }) }),
                  /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                    /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white", children: "Credit to Ledger" }),
                    /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: [
                      "Save ",
                      formatCurrency(overpaymentDetails.amount, store || settings),
                      " to ",
                      overpaymentDetails.customerName,
                      "'s account"
                    ] })
                  ] })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-4 bg-slate-100/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700/50", children: /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setShowOverpaymentModal(false),
            className: "w-full py-2.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold text-sm transition-colors hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-lg",
            children: "Cancel"
          }
        ) })
      ] }) })
    ] })
  ] });
};
export {
  CreatePreSale as default
};
