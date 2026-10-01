import React from 'react';
import RecurringForm from './RecurringForm';

/**
 * The same template, being changed.
 *
 * The old pair were two 3,000-line files that had already drifted: the editor
 * hardcoded six money fields to zero on the way in, so opening a template and
 * saving it wiped its discount, tax and carriage. One file cannot do that to
 * itself.
 */
export default function EditRecurringInvoice(props) {
    return <RecurringForm {...props} />;
}
