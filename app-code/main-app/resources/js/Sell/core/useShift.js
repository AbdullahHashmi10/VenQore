/**
 * Sale Core — the register shift (cash drawer) state.
 *
 * Moved out of Pos.jsx unchanged: restricted POS staff work inside a shift,
 * everyone else never loads one. The modal flags live here too because every
 * screen that sells (counter register, FOH) opens the same shift dialogs.
 */
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function useShift({ storeSlug, isPosStaff }) {
    const [registerShift, setRegisterShift] = useState(null);
    const [shiftMetrics, setShiftMetrics] = useState(null);
    const [isShiftLoading, setIsShiftLoading] = useState(isPosStaff);
    const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
    const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
    const [showCashMovementModal, setShowCashMovementModal] = useState(false);
    const [showZReportModal, setShowZReportModal] = useState(false);
    const [activeZReport, setActiveZReport] = useState(null);
    const [shiftMenuOpen, setShiftMenuOpen] = useState(false);

    const fetchCurrentShift = React.useCallback(async () => {
        if (!isPosStaff) {
            setIsShiftLoading(false);
            setRegisterShift(null);
            setShiftMetrics(null);
            return;
        }
        try {
            const res = await axios.get(route('store.shifts.current', { store_slug: storeSlug }));
            if (res.data?.has_open_shift && res.data?.shift) {
                setRegisterShift(res.data.shift);
                setShiftMetrics(res.data.metrics);
            } else {
                setRegisterShift(null);
                setShiftMetrics(null);
            }
        } catch (err) {
            console.error('Error fetching register shift:', err);
        } finally {
            setIsShiftLoading(false);
        }
    }, [storeSlug, isPosStaff]);

    useEffect(() => {
        fetchCurrentShift();
    }, [fetchCurrentShift]);

    return {
        registerShift, setRegisterShift,
        shiftMetrics, setShiftMetrics,
        isShiftLoading, setIsShiftLoading,
        showOpenShiftModal, setShowOpenShiftModal,
        showCloseShiftModal, setShowCloseShiftModal,
        showCashMovementModal, setShowCashMovementModal,
        showZReportModal, setShowZReportModal,
        activeZReport, setActiveZReport,
        shiftMenuOpen, setShiftMenuOpen,
        fetchCurrentShift,
    };
}
