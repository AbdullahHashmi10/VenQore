/**
 * useCart.js
 *
 * Headless hook containing cart operations for POS.
 * Stateless helper that operates on activeSale session and delegates updates back.
 */

import { useCallback } from 'react';
import { getProductPrice, shouldStopNegativeStock } from '@/Utils/settings';

export function useCart(activeSale, updateActiveSale, settings = {}, showAlert = () => {}, addToast = () => {}) {
    
    const addToCart = useCallback((product, variant = null) => {
        if (!activeSale) return;
        const currentCart = activeSale.cart || [];
        const cartItemId = variant ? `${product.id}-${variant.id}` : `${product.id}`;
        const existing = currentCart.find(item => item.cartItemId === cartItemId);
        let newCart;

        const price = variant ? getProductPrice(variant, 1, settings) : getProductPrice(product, 1, settings);
        const name = variant ? `${product.name} (${variant.sku})` : product.name;
        const stock = variant ? variant.stock_quantity : product.stock_quantity;

        // Bypass manufacturing rule checks
        const canAutoManufacture = product.has_manufacturing_rule === true;

        if (existing) {
            const newQty = existing.qty + 1;
            if (newQty > stock && !canAutoManufacture) {
                const allowNegative = !shouldStopNegativeStock(settings);
                if (!allowNegative) {
                    showAlert(
                        'Not Enough Stock',
                        `Cannot add more "${name}" — available stock is ${stock} unit(s). Negative stocking is disabled.`,
                        'warning'
                    );
                    return;
                } else {
                    addToast(`Warning: ${name} stock will be negative!`, 'warning');
                }
            } else if (newQty > stock && canAutoManufacture) {
                addToast(`🏭 ${name} will be auto-manufactured`, 'info');
            }
            newCart = currentCart.map(item => item.cartItemId === cartItemId ? { ...item, qty: newQty } : item);
        } else {
            if (stock < 1 && !canAutoManufacture) {
                const allowNegative = !shouldStopNegativeStock(settings);
                if (!allowNegative) {
                    showAlert(
                        'Out of Stock',
                        `"${name}" has no remaining stock. Negative stocking is disabled.`,
                        'warning'
                    );
                    return;
                } else {
                    addToast(`Warning: ${name} stock is out (Qty: ${stock})!`, 'warning');
                }
            } else if (stock < 1 && canAutoManufacture) {
                addToast(`🏭 ${name} will be auto-manufactured from ingredients`, 'info');
            }
            newCart = [...currentCart, {
                cartItemId,
                id: product.id,
                variant_id: variant ? variant.id : null,
                name,
                price,
                original_price: price,
                discount: 0,
                qty: 1,
                freeQuantity: 0,
                stock: stock,
                has_manufacturing_rule: product.has_manufacturing_rule || false,
                image: product.image_url || product.image_path || null,
                category: product.category?.name || 'General',
                wholesale_price: product.wholesale_price,
                wholesale_min_quantity: product.wholesale_min_quantity
            }];
        }

        updateActiveSale({ cart: newCart });
    }, [activeSale, updateActiveSale, settings, showAlert, addToast]);

    const updateQty = useCallback((cartItemId, newQty) => {
        if (!activeSale) return;
        const item = activeSale.cart.find(i => i.cartItemId === cartItemId);
        if (!item) return;

        if (newQty <= 0) {
            removeFromCart(cartItemId);
            return;
        }

        const canAutoManufacture = item.has_manufacturing_rule === true;
        if (newQty > item.stock && !canAutoManufacture) {
            const allowNegative = !shouldStopNegativeStock(settings);
            if (!allowNegative) {
                showAlert(
                    'Not Enough Stock',
                    `Cannot set quantity to ${newQty} for "${item.name}" — available stock is ${item.stock}.`,
                    'warning'
                );
                return;
            }
        }

        const newCart = activeSale.cart.map(i =>
            i.cartItemId === cartItemId ? { ...i, qty: newQty } : i
        );
        updateActiveSale({ cart: newCart });
    }, [activeSale, updateActiveSale, settings, showAlert]);

    const updateFreeQty = useCallback((cartItemId, freeQty) => {
        if (!activeSale) return;
        const newCart = activeSale.cart.map(i =>
            i.cartItemId === cartItemId ? { ...i, freeQuantity: Math.max(0, freeQty) } : i
        );
        updateActiveSale({ cart: newCart });
    }, [activeSale, updateActiveSale]);

    const removeFromCart = useCallback((cartItemId) => {
        if (!activeSale) return;
        const newCart = activeSale.cart.filter(i => i.cartItemId !== cartItemId);
        updateActiveSale({ cart: newCart });
    }, [activeSale, updateActiveSale]);

    const updateRowDiscount = useCallback((cartItemId, discountAmount, discountType = 'fixed') => {
        if (!activeSale) return;
        const newCart = activeSale.cart.map(i => {
            if (i.cartItemId === cartItemId) {
                const originalPrice = i.original_price || i.price;
                let finalPrice = originalPrice;
                let disc = parseFloat(discountAmount) || 0;

                if (discountType === 'percent') {
                    finalPrice = originalPrice - (originalPrice * (disc / 100));
                } else {
                    finalPrice = originalPrice - disc;
                }

                return {
                    ...i,
                    discount: disc,
                    discountType,
                    price: Math.max(0, finalPrice)
                };
            }
            return i;
        });
        updateActiveSale({ cart: newCart });
    }, [activeSale, updateActiveSale]);

    const clearCart = useCallback(() => {
        updateActiveSale({ cart: [], discountValue: 0, customer: null, cashReceived: '' });
    }, [updateActiveSale]);

    return {
        addToCart,
        updateQty,
        updateFreeQty,
        removeFromCart,
        updateRowDiscount,
        clearCart
    };
}
