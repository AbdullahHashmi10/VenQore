import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { usePage } from '@inertiajs/react';

const AttendanceContext = createContext();

export const useAttendance = () => useContext(AttendanceContext);

export const AttendanceProvider = ({ children }) => {
    const { props } = usePage();
    const auth = props.auth;
    const store = props.store;
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [attendance, setAttendance] = useState(null);

    const lastActivityRef = useRef(Date.now());
    const heartbeatIntervalRef = useRef(null);
    const INACTIVITY_LIMIT = 60 * 60 * 1000; // 1 hour

    useEffect(() => {
        if (!auth?.user || !props.tenant) {
            setIsCheckedIn(false);
            setAttendance(null);
            return;
        }

        // Auto Check-in on mount
        checkIn();

        const handleActivity = () => {
            const now = Date.now();
            const diff = now - lastActivityRef.current;

            // If user was inactive for > 1 hour and now moves mouse
            if (diff >= INACTIVITY_LIMIT) {
                // Log the gap silently
                logGapSilently(new Date(lastActivityRef.current), new Date(now));
            }

            lastActivityRef.current = now;
        };

        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('click', handleActivity);

        // Heartbeat every 5 minutes to update "last_active_at"
        heartbeatIntervalRef.current = setInterval(sendHeartbeat, 5 * 60 * 1000);

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('click', handleActivity);
            if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
        };
    }, [auth?.user]);

    const checkIn = async (isRetry = false) => {
        // Safety: If this is the very first check-in after login, we MUST wait for the page to finish loading.
        // This ensures bootstrap.js has had time to sync the new CSRF token from the new page's meta tags.
        if (!isRetry && !window.__attendanceFirstCheckInvoked) {
            window.__attendanceFirstCheckInvoked = true;
            
            // Wait for Inertia to finish the navigation sequence
            await new Promise(resolve => {
                const finishHandler = () => {
                    document.removeEventListener('inertia:finish', finishHandler);
                    resolve();
                };
                document.addEventListener('inertia:finish', finishHandler);
                // Safety timeout: if inertia:finish never fires for some reason, proceed after 500ms
                setTimeout(resolve, 500);
            });
        }

        try {
            const response = await axios.post(route('store.attendance.check-in', { store_slug: store.slug }));
            if (response.data.success) {
                setIsCheckedIn(true);
                setAttendance(response.data.attendance);
                lastActivityRef.current = Date.now();
            }
        } catch (error) {
            // Handled by global interceptor, but we catch here to prevent console noise
            if (error.response?.status === 419 && !isRetry) {
                // If we STILL get a 419, the interceptor will try to fix the token.
                // We'll wait 200ms for the interceptor's fix to settle, then retry once.
                await new Promise(r => setTimeout(r, 200));
                return checkIn(true);
            }
            console.error('Check-in error handled.');
        }
    };

    const sendHeartbeat = async () => {
        try {
            await axios.post(route('store.attendance.heartbeat', { store_slug: store.slug }));
        } catch (error) {
            console.error('Heartbeat error:', error);
        }
    };

    const logGapSilently = async (start, end) => {
        try {
            await axios.post(route('store.attendance.log-gap', { store_slug: store.slug }), {
                start_time: start.toISOString(),
                end_time: end.toISOString(),
                reason: 'Silent Inactivity (>1hr)',
                description: 'User was inactive for more than 1 hour.'
            });
        } catch (error) {
            console.error('Log gap error:', error);
        }
    };

    return (
        <AttendanceContext.Provider value={{
            isCheckedIn,
            attendance,
        }}>
            {children}
        </AttendanceContext.Provider>
    );
};
