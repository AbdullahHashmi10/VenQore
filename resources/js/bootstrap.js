import axios from 'axios';
window.axios = axios;


window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true;

/**
 * Sync the CSRF token from the page's meta tag into axios defaults.
 * This must be called:
 *   1. On initial page load (below)
 *   2. After every Inertia navigation — because Laravel regenerates the token
 *      on login/logout, and Inertia puts the new token in the new page's meta tag.
 *      Without this, the first axios call after login (e.g. AttendanceContext check-in)
 *      would use the old token and get a 419.
 */
const syncCsrfToken = () => {
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) {
        const token = meta.getAttribute('content');
        if (token) {
            window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
        }
    }
};

// Sync on initial load
syncCsrfToken();

// Sync on every Inertia page navigation (covers login, logout, any page change).
// 'inertia:finish' fires after the new page's DOM is ready, so the meta tag is updated.
document.addEventListener('inertia:finish', syncCsrfToken);


// Global Response Handler - Dispatch toast events for all AJAX responses
window.axios.interceptors.response.use(
    response => {
        // Check if response has success message - dispatch toast event
        if (response.data && response.data.success && response.data.message) {
            window.dispatchEvent(new CustomEvent('amd:toast', {
                detail: { message: response.data.message, type: 'success' }
            }));
        }
        return response;
    },
    async error => {
        // Handle 419 Token Mismatch — Silently repair and retry.
        // This is the "invisible shield": we handle this immediately and silently.
        if (error.response && error.response.status === 419) {
            if (error.config && error.config._csrfRetry) {
                window.dispatchEvent(new CustomEvent('amd:session-expired'));
                return Promise.reject(error);
            }

            try {
                const refreshResponse = await axios.create().get('/refresh-csrf');
                const newToken = refreshResponse.data.token;

                if (newToken) {
                    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = newToken;
                    const meta = document.querySelector('meta[name="csrf-token"]');
                    if (meta) meta.setAttribute('content', newToken);

                    const retryConfig = {
                        ...error.config,
                        _csrfRetry: true,
                        headers: {
                            ...error.config.headers,
                            'X-CSRF-TOKEN': newToken,
                        },
                    };
                    return window.axios(retryConfig);
                }
            } catch (refreshError) {
                window.dispatchEvent(new CustomEvent('amd:session-expired'));
                return Promise.reject(error);
            }
        }

        // Ignore cancelled requests (navigating away)
        if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
            return Promise.reject(error);
        }

        // Allow requests to opt-out of global error handling (e.g. background sync)
        if (error.config && error.config._skipGlobalErrorHandler) {
            return Promise.reject(error);
        }

        // ── Phase 4.4: Plan Limit Gate ─────────────────────────────────────
        // When any API call returns a 403 with type === 'plan_limit', the backend
        // is telling us the tenant has exceeded their subscription limits.
        // Fire the custom event to open the UpgradeModal — do NOT show a generic
        // error toast, as PlanLimitException has its own structured response.
        if (error.response && error.response.status === 403 && error.response.data?.type === 'plan_limit') {
            window.dispatchEvent(new CustomEvent('amd:plan-limit', {
                detail: {
                    feature:      error.response.data.feature,
                    message:      error.response.data.message,
                    current_plan: error.response.data.current_plan,
                    upgrade_url:  error.response.data.upgrade_url,
                    current_count:error.response.data.current_count,
                    limit:        error.response.data.limit,
                }
            }));
            return Promise.reject(error); // Stop propagation — modal handles it
        }

        // Handle 503 System Update Soft Lock
        if (error.response && error.response.status === 503) {
            const errorMsg = error.response.data?.message || error.response.data?.error || '';
            if (errorMsg.includes('smooth update') || errorMsg.includes('Update in Progress')) {
                window.dispatchEvent(new CustomEvent('amd:system-update-in-progress'));
                return Promise.reject(error); // Reject without showing a toast
            }
        }

        // Dispatch error toast for failed requests with error messages (EXCLUDING 419)
        if (error.response && error.response.data && error.response.status !== 419) {

            const errorMsg = error.response.data.message || error.response.data.error;
            if (errorMsg) {
                window.dispatchEvent(new CustomEvent('amd:toast', {
                    detail: { message: errorMsg, type: 'error' }
                }));
            }
        }

        // Check for Network Error (Offline) or Server Error (500)
        const hasSpecificError = error.response && (error.response.data?.message || error.response.data?.error);

        if (!error.response || (error.response.status >= 500 && error.response.status !== 503 && !hasSpecificError)) {
            const isOffline = !error.response || error.code === 'ERR_NETWORK';

            window.dispatchEvent(new CustomEvent('amd:network-error', {
                detail: {
                    message: isOffline
                        ? 'Connection lost. Please check your internet.'
                        : 'Server encountered an unexpected error.'
                }
            }));
        }

        return Promise.reject(error);
    }
);
