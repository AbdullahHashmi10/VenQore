/**
 * Shared utility for handling approval-routed transaction responses.
 *
 * When a transaction requires approval the backend returns HTTP 202 with:
 *   { status: 'pending_approval', approval_document_id, document_number, message }
 *
 * OR for Inertia-style redirects, the backend uses:
 *   return redirect()->back()->with('info', '...')
 * which the OneGlanceLayout flash handler already picks up automatically.
 *
 * This utility handles both the AXIOS path and global approval modal triggering.
 */

/**
 * Fire a toast notification via the global event bus that OneGlanceLayout listens to.
 * @param {string} message
 * @param {'success'|'info'|'warning'|'error'} type
 */
export function fireToast(message, type = 'info') {
    window.dispatchEvent(new CustomEvent('amd:toast', { detail: { message, type } }));
}

/**
 * Trigger the centered Approval Submission Modal via global event.
 * @param {object} options
 */
export function openApprovalModal(options = {}) {
    window.dispatchEvent(new CustomEvent('amd:approval-modal', {
        detail: {
            documentNumber: options.documentNumber || '',
            docLabel: options.docLabel || 'Transaction',
            docPlural: options.docPlural || '',
            listUrl: options.listUrl || null,
            ...options
        }
    }));
}

/**
 * Check whether an axios response indicates the transaction was routed to approval.
 * @param {import('axios').AxiosResponse} res
 * @returns {boolean}
 */
export function isApprovalPending(res) {
    return (
        res?.status === 202 ||
        res?.data?.status === 'pending_approval' ||
        res?.data?.pending_approval === true
    );
}

/**
 * Inspect an axios response after a financial transaction POST.
 * Shows the correct toast, opens the centered approval popup modal,
 * and returns true if the transaction went to approval.
 *
 * @param {import('axios').AxiosResponse} res
 * @param {string} [docLabel] - Human-readable label e.g. "Purchase", "Expense"
 * @param {object} [options] - Modal options (listUrl, docPlural)
 * @returns {boolean} true if the response is a pending_approval, false otherwise
 */
export function handleApprovalResponse(res, docLabel = 'Transaction', options = {}) {
    if (isApprovalPending(res)) {
        const docNum = res?.data?.document_number || res?.data?.approval_id || '';
        const docNumDisplay = docNum ? ` (#${docNum})` : '';
        
        fireToast(
            `Your ${docLabel}${docNumDisplay} has been submitted for approval. ` +
            `It will be posted once a manager reviews it. ` +
            `You can track it under Approvals → My Submissions.`,
            'info'
        );

        openApprovalModal({
            documentNumber: docNum,
            docLabel: docLabel,
            docPlural: options.docPlural,
            listUrl: options.listUrl,
            ...options
        });

        return true;
    }
    return false;
}
