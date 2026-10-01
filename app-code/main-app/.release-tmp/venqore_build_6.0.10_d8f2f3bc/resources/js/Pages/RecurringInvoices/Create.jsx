import React from 'react';
import RecurringForm from './RecurringForm';

/**
 * A new template. Everything about it is in RecurringForm — this file exists
 * because the router names two pages, not because they differ.
 */
export default function CreateRecurringInvoice(props) {
    return <RecurringForm {...props} />;
}
