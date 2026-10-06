/**
 * Taking the money in FOH.
 *
 * One flow for every order type: build the sale body with the SAME pure Sale
 * Core the counter register uses (cartMath + salePayload), tag it
 * channel=foh + occupancy_id + order_type, post it to the same endpoint, then
 * tell the floor the order is settled (whole or one split part).
 *
 * The floor owns the order, so unlike the counter there is no offline sale
 * queue here: a payment that cannot reach the server is reported, never
 * silently parked (an offline tab would let two devices bill one table).
 */
import { useCallback, useRef, useState } from 'react';
import axios from 'axios';
import { buildSalePayload } from '@/Sell/core/salePayload';
import useShift from '@/Sell/core/useShift';
import { parseApprovalRequired, withApproval } from '@/Domain/pos/approval';
import PrintService from '@/Utils/PrintService';

const newKey = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `foh-${Date.now()}-${Math.random().toString(16).slice(2)}`);

export default function useFohCheckout({ storeSlug, settings, warehouses = [], isPosStaff, tables, onToast }) {
    const shift = useShift({ storeSlug, isPosStaff });
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [seedSplit, setSeedSplit] = useState(null);
    const [approval, setApproval] = useState(null);   // { info, paymentData, ctx }
    const [processing, setProcessing] = useState(false);
    const attempt = useRef(null);                     // idempotency key, stable until the sale lands

    const warehouseId = (warehouses.find((w) => w.is_default) || warehouses[0])?.id || null;

    /** Open the tender panel (after making sure restricted staff have a shift open). */
    const begin = useCallback((seed = null) => {
        if (isPosStaff && !shift.registerShift) {
            shift.setShowOpenShiftModal(true);
            onToast?.('Open your register shift before taking payment', 'warning');
            return false;
        }
        setSeedSplit(seed);
        setPaymentOpen(true);
        return true;
    }, [isPosStaff, shift, onToast]);

    const close = useCallback(() => { setPaymentOpen(false); setSeedSplit(null); }, []);

    /**
     * @param ctx { card, sale, totals, partId }  everything the sale needs, captured when Pay was pressed
     */
    const complete = useCallback(async (paymentData, ctx, approvalStamp = null) => {
        const { card, sale, totals, partId } = ctx;
        setProcessing(true);
        if (!attempt.current) attempt.current = newKey();
        const base = {
            ...buildSalePayload({ sale, totals, paymentData, addToLedger: false, registerShift: shift.registerShift, settings, warehouseId }),
            channel: 'foh',
            occupancy_id: card?.occupancy_id || null,
            order_type: card?.order_type || 'dine_in',
        };
        const payload = withApproval(base, approvalStamp);

        try {
            const { data } = await axios.post(route('store.pos.sales.store', { store_slug: storeSlug }), payload, {
                headers: { 'Idempotency-Key': attempt.current },
            });
            if (!data?.success) return false;
            attempt.current = null;
            setApproval(null);
            setPaymentOpen(false);
            setSeedSplit(null);

            let settled = null;
            if (card?.occupancy_id) {
                settled = await tables.markSettled(card.occupancy_id, data.sale_id || data.id, partId || null);
            }
            shift.fetchCurrentShift?.();

            if (paymentData.printReceipt) {
                const saleForPrint = {
                    ...data,
                    id: data.sale_id || data.id,
                    items: sale.cart,
                    total: totals.cartTotal,
                    amount_paid: paymentData.totalPaid,
                    change: paymentData.change,
                    tax: totals.taxAmount,
                };
                setTimeout(() => PrintService.quickPrint(saleForPrint, null, settings), 400);
            }
            return { sale: data, settled, paymentData };
        } catch (error) {
            const info = parseApprovalRequired(error);
            if (info) {
                setApproval({ info, paymentData, ctx });
                return false;
            }
            const status = error?.response?.status;
            const msg = status && status >= 400 && status < 500
                ? (error.response.data?.message || error.response.data?.error || 'This payment was refused.')
                : 'No connection. The payment was NOT recorded: check the network and try again.';
            setApproval(null);
            onToast?.(msg, 'error');
            return false;
        } finally {
            setProcessing(false);
        }
    }, [shift, settings, warehouseId, storeSlug, tables, onToast]);

    return { shift, paymentOpen, seedSplit, approval, setApproval, processing, begin, close, complete };
}
