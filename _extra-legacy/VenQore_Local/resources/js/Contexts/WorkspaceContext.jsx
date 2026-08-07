import React, { createContext, useContext, useState, useEffect } from 'react';

const WorkspaceContext = createContext();



export const WorkspaceProvider = ({ children, settings = {} }) => {
    // Helper to generate invoice number
    const generateInvoiceNumber = (counter) => {
        const prefix = settings?.sale_prefix || 'INV-';
        return `${prefix}${String(counter).padStart(6, '0')}`;
    };
    // Invoice counter for sequential numbering
    const [invoiceCounter, setInvoiceCounter] = useState(() => {
        const saved = localStorage.getItem('amd_invoice_counter');
        return saved ? parseInt(saved, 10) : 1;
    });

    const [activeInvoices, setActiveInvoices] = useState(() => {
        const saved = sessionStorage.getItem('amd_active_invoices_v2');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }

        const counter = parseInt(localStorage.getItem('amd_invoice_counter') || '1', 10);
        return [{
            id: Date.now(),
            type: 'invoice',
            invoiceNumber: generateInvoiceNumber(counter),
            customer: null,
            items: [{ id: Date.now(), product: null, quantity: 1, price: 0, discount: 0, discountType: 'fixed' }],
            paymentMethod: 'credit',
            paymentTerms: 'net30',
            amountPaid: 0,
            discount: 0,
            globalDiscount: 0,
            globalDiscountType: 'fixed',
            tax: 0,
            delivery_charge: 0,
            extra_charge_value: 0,
            extra_charge_label: 'Extra',
            notes: '',
            reference: '',
            date: new Date().toISOString().split('T')[0],
            dueDate: ''
        }];
    });

    // --- PRE-SALE INVOICE STATE (Isolated from regular invoices) ---
    const [activePreSaleInvoices, setActivePreSaleInvoices] = useState(() => {
        const saved = sessionStorage.getItem('amd_active_presales_v2');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
        const counter = parseInt(localStorage.getItem('amd_invoice_counter') || '1', 10);
        return [{
            id: Date.now() + 1, // offset to avoid collision with invoice id
            type: 'presale',
            invoiceNumber: generateInvoiceNumber(counter),
            customer: null,
            items: [{ id: Date.now(), product: null, quantity: 1, price: 0, discount: 0, discountType: 'fixed' }],
            paymentMethod: 'credit',
            paymentTerms: 'net30',
            amountPaid: 0,
            discount: 0,
            globalDiscount: 0,
            globalDiscountType: 'fixed',
            tax: 0,
            delivery_charge: 0,
            extra_charge_value: 0,
            extra_charge_label: 'Extra',
            notes: '',
            reference: '',
            date: new Date().toISOString().split('T')[0],
            dueDate: ''
        }];
    });

    const [posSessions, setPosSessions] = useState(() => {
        const saved = sessionStorage.getItem('venqore_sessions_v2');
        return saved ? JSON.parse(saved) : [];
    });

    // --- PURCHASE STATE ---
    const [activePurchases, setActivePurchases] = useState(() => {
        const saved = sessionStorage.getItem('amd_active_purchases_v2');
        if (saved) return JSON.parse(saved);
        // Default empty, user must explicitly create one or page logic handles it
        return [];
    });

    const [currentPurchaseId, setCurrentPurchaseId] = useState(activePurchases?.[0]?.id || null);

    useEffect(() => {
        sessionStorage.setItem('amd_active_purchases_v2', JSON.stringify(activePurchases));
    }, [activePurchases]);

    const addPurchase = (initialData = {}) => {
        const newId = Date.now();
        const newPurchase = {
            id: newId,
            items: [{ id: Date.now(), product: null, quantity: 1, price: 0, discount: 0, discountType: 'fixed' }],
            supplier: null,
            paymentMethod: 'credit',
            amountPaid: 0,
            discount: 0,
            tax: 0,
            delivery_charge: 0,
            extra_charge_value: 0,
            date: new Date().toISOString().split('T')[0],
            invoiceNumber: '',
            notes: '',
            ...initialData
        };
        setActivePurchases([...activePurchases, newPurchase]);
        setCurrentPurchaseId(newId);
        return newPurchase;
    };

    const updatePurchase = (id, data) => {
        setActivePurchases(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    };

    const removePurchaseTab = (id) => {
        // If it's the only one, we might want to reset it or remove it depending on logic.
        // For consistent sidebar behavior (empty when clear), we allow removing the last one.
        // BUT page logic often expects at least one. We'll handle "Reset" at page level if needed.
        // Here we just remove.
        const newArr = activePurchases.filter(p => p.id !== id);
        setActivePurchases(newArr);
        if (currentPurchaseId === id) {
            setCurrentPurchaseId(newArr[newArr.length - 1]?.id || null);
        }
    };

    const [currentInvoiceId, setCurrentInvoiceId] = useState(activeInvoices[0]?.id || null);
    const [currentPreSaleId, setCurrentPreSaleId] = useState(activePreSaleInvoices[0]?.id || null);
    const [currentPosId, setCurrentPosId] = useState(null);

    // ---- Pre-Sale Invoice CRUD ----
    const addPreSaleInvoice = (initialData = {}) => {
        const nextCounter = invoiceCounter + 1;
        const newInvoice = {
            id: Date.now(),
            type: 'presale',
            invoiceNumber: generateInvoiceNumber(nextCounter),
            customer: null,
            items: [{ id: Date.now(), product: null, quantity: 1, price: 0, discount: 0, discountType: 'fixed' }],
            paymentMethod: 'credit',
            paymentTerms: 'net30',
            amountPaid: 0,
            discount: 0,
            globalDiscount: 0,
            globalDiscountType: 'fixed',
            tax: 0,
            delivery_charge: 0,
            extra_charge_value: 0,
            extra_charge_label: 'Extra',
            notes: '',
            reference: '',
            date: new Date().toISOString().split('T')[0],
            dueDate: '',
            ...initialData
        };
        setInvoiceCounter(nextCounter);
        setActivePreSaleInvoices(prev => [...prev, newInvoice]);
        setCurrentPreSaleId(newInvoice.id);
    };

    const removePreSaleInvoice = (id) => {
        if (activePreSaleInvoices.length === 1) {
            const nextCounter = invoiceCounter + 1;
            const resetInvoice = {
                id: Date.now(),
                type: 'presale',
                invoiceNumber: generateInvoiceNumber(nextCounter),
                customer: null,
                items: [{ id: Date.now(), product: null, quantity: 1, price: 0, discount: 0, discountType: 'fixed' }],
                paymentMethod: 'credit',
                paymentTerms: 'net30',
                amountPaid: 0,
                discount: 0,
                globalDiscount: 0,
                globalDiscountType: 'fixed',
                tax: 0,
                delivery_charge: 0,
                extra_charge_value: 0,
                extra_charge_label: 'Extra',
                notes: '',
                reference: '',
                date: new Date().toISOString().split('T')[0],
                dueDate: ''
            };
            setInvoiceCounter(nextCounter);
            setActivePreSaleInvoices([resetInvoice]);
            setCurrentPreSaleId(resetInvoice.id);
            return;
        }
        const remaining = activePreSaleInvoices.filter(inv => inv.id !== id);
        setActivePreSaleInvoices(remaining);
        if (currentPreSaleId === id) {
            setCurrentPreSaleId(remaining[0]?.id || null);
        }
    };

    const updatePreSaleInvoice = (id, data) => {
        setActivePreSaleInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...data } : inv));
    };

    useEffect(() => {
        try {
            // Sanitize invoices to remove any non-serializable data (like DOM elements)
            const sanitizedInvoices = activeInvoices.map(invoice => ({
                ...invoice,
                items: invoice.items?.map(item => ({
                    id: item.id,
                    product: item.product ? {
                        id: item.product.id,
                        name: item.product.name,
                        sku: item.product.sku,
                        price: item.product.price,
                        selling_price: item.product.selling_price,
                        cost: item.product.cost,
                        cost_price: item.product.cost_price,
                        stock_quantity: item.product.stock_quantity
                    } : null,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    cost: item.cost,
                    discount: item.discount,
                    discountType: item.discountType,
                    variant: item.variant
                })) || []
            }));
            sessionStorage.setItem('amd_active_invoices_v2', JSON.stringify(sanitizedInvoices));
        } catch (error) {
            console.error('Failed to save invoices to sessionStorage:', error);
            // If serialization fails, clear the corrupted data
            sessionStorage.removeItem('amd_active_invoices_v2');
        }
    }, [activeInvoices]);

    // Persist pre-sale invoices to their own isolated key
    useEffect(() => {
        try {
            const sanitized = activePreSaleInvoices.map(invoice => ({
                ...invoice,
                items: invoice.items?.map(item => ({
                    id: item.id,
                    product: item.product ? {
                        id: item.product.id,
                        name: item.product.name,
                        sku: item.product.sku,
                        price: item.product.price,
                        selling_price: item.product.selling_price,
                        cost: item.product.cost,
                        cost_price: item.product.cost_price,
                        stock_quantity: item.product.stock_quantity
                    } : null,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    cost: item.cost,
                    discount: item.discount,
                    discountType: item.discountType,
                    variant: item.variant
                })) || []
            }));
            sessionStorage.setItem('amd_active_presales_v2', JSON.stringify(sanitized));
        } catch (error) {
            console.error('Failed to save pre-sale invoices to sessionStorage:', error);
            sessionStorage.removeItem('amd_active_presales_v2');
        }
    }, [activePreSaleInvoices]);

    useEffect(() => {
        sessionStorage.setItem('venqore_sessions_v2', JSON.stringify(posSessions));
    }, [posSessions]);

    useEffect(() => {
        localStorage.setItem('amd_invoice_counter', invoiceCounter.toString());
    }, [invoiceCounter]);

    const addInvoice = (initialData = {}) => {
        const nextCounter = invoiceCounter + 1;
        const newInvoice = {
            id: Date.now(),
            type: 'invoice',
            invoiceNumber: generateInvoiceNumber(nextCounter),
            customer: null,
            items: [{ id: Date.now(), product: null, quantity: 1, price: 0, discount: 0, discountType: 'fixed' }],
            paymentMethod: 'credit',
            paymentTerms: 'net30',
            amountPaid: 0,
            discount: 0,
            globalDiscount: 0,
            globalDiscountType: 'fixed',
            tax: 0,
            delivery_charge: 0,
            extra_charge_value: 0,
            extra_charge_label: 'Extra',
            notes: '',
            reference: '',
            date: new Date().toISOString().split('T')[0],
            dueDate: '',
            ...initialData
        };
        setInvoiceCounter(nextCounter);
        setActiveInvoices([...activeInvoices, newInvoice]);
        setCurrentInvoiceId(newInvoice.id);
    };

    const removeInvoice = (id) => {
        if (activeInvoices.length === 1 && posSessions.length === 0) {
            const nextCounter = invoiceCounter + 1;
            const resetInvoice = {
                id: Date.now(),
                type: 'invoice',
                invoiceNumber: generateInvoiceNumber(nextCounter),
                customer: null,
                items: [{ id: Date.now(), product: null, quantity: 1, price: 0, discount: 0, discountType: 'fixed' }],
                paymentMethod: 'credit',
                paymentTerms: 'net30',
                amountPaid: 0,
                discount: 0,
                globalDiscount: 0,
                globalDiscountType: 'fixed',
                tax: 0,
                delivery_charge: 0,
                extra_charge_value: 0,
                extra_charge_label: 'Extra',
                notes: '',
                reference: '',
                date: new Date().toISOString().split('T')[0],
                dueDate: ''
            };
            setInvoiceCounter(nextCounter);
            setActiveInvoices([resetInvoice]);
            setCurrentInvoiceId(resetInvoice.id);
            return;
        }
        const newInvoices = activeInvoices.filter(inv => inv.id !== id);
        setActiveInvoices(newInvoices);
        if (currentInvoiceId === id) {
            setCurrentInvoiceId(newInvoices[0]?.id || null);
        }
    };

    const updateInvoice = (id, data) => {
        setActiveInvoices(activeInvoices.map(inv =>
            inv.id === id ? { ...inv, ...data } : inv
        ));
    };

    const addPosSession = (data = {}) => {
        const newSession = {
            id: Date.now(),
            type: 'pos',
            cart: [],
            customer: null,
            cashReceived: '',
            ...data
        };
        setPosSessions([...posSessions, newSession]);
        setCurrentPosId(newSession.id);
        return newSession;
    };

    const updatePosSession = (id, data) => {
        setPosSessions(posSessions.map(s => s.id === id ? { ...s, ...data } : s));
    };

    const removePosSession = (id) => {
        setPosSessions(posSessions.filter(s => s.id !== id));
        if (currentPosId === id) setCurrentPosId(null);
    };

    return (
        <WorkspaceContext.Provider value={{
            activeInvoices,
            currentInvoiceId,
            setCurrentInvoiceId,
            addInvoice,
            removeInvoice,
            updateInvoice,

            // Pre-Sale Workspace (isolated)
            activePreSaleInvoices,
            currentPreSaleId,
            setCurrentPreSaleId,
            addPreSaleInvoice,
            removePreSaleInvoice,
            updatePreSaleInvoice,

            posSessions,
            currentPosId,
            setCurrentPosId,
            addPosSession,
            updatePosSession,
            removePosSession,

            // Purchase Context
            activePurchases,
            currentPurchaseId,
            setCurrentPurchaseId,
            addPurchase,
            removePurchase: removePurchaseTab,
            updatePurchase
        }}>
            {children}
        </WorkspaceContext.Provider>
    );
};

export const useWorkspace = () => useContext(WorkspaceContext);
