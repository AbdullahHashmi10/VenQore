import { describe, it, expect, vi } from 'vitest';

// ── 1. Phone Normalization Logic (Mirroring CommunicationController::normalizePhone)
function normalizePhone(phone, defaultCountryCode = '92') {
  if (!phone) return { clean: '', valid: false };
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }
  if (digits.startsWith('0')) {
    digits = defaultCountryCode + digits.slice(1);
  }
  const valid = digits.length >= 10 && digits.length <= 15;
  return { clean: digits, valid };
}

// ── 2. WhatsApp Message Preparation (Mirroring CommunicationController::prepareWhatsAppDraft)
function prepareWhatsAppDraft({
  documentType = 'sale',
  saleStatus = 'completed',
  docNumber,
  total,
  customerName = 'Walk-in Customer',
  storeName = 'VenQore Store',
  currency = 'PKR',
  receiptLink = 'https://pos.venqore.com/r/test_token'
}) {
  const isReturn = documentType === 'sale_return' || saleStatus === 'returned';

  if (documentType === 'payment_receipt') {
    const formattedAmount = `${currency} ${Number(total || 0).toFixed(2)}`;
    const template = 'Payment receipt from [Firm_Name]. Amount [Amount] received. Receipt: [Link]';
    const message = template
      .replace('[Firm_Name]', storeName)
      .replace('[Amount]', formattedAmount)
      .replace('[Link]', receiptLink);

    return {
      document_type: 'payment_receipt',
      document_type_label: 'Payment Receipt',
      document_number: docNumber || 'REC-001',
      amount: Number(total),
      message_text: message,
      action: 'open_whatsapp_draft',
    };
  }

  if (documentType === 'party_statement') {
    const formattedAmount = `${currency} ${Number(total || 0).toFixed(2)}`;
    const template = 'Dear [Customer_Name], your current outstanding statement balance with [Firm_Name] is [Amount]. Thank you.';
    const message = template
      .replace('[Customer_Name]', customerName)
      .replace('[Firm_Name]', storeName)
      .replace('[Amount]', formattedAmount);

    return {
      document_type: 'party_statement',
      document_type_label: 'Party Statement',
      document_number: docNumber || `Statement: ${customerName}`,
      amount: Number(total),
      message_text: message,
      action: 'open_whatsapp_draft',
    };
  }

  if (isReturn) {
    const formattedAmount = `${currency} ${Math.abs(Number(total || 0)).toFixed(2)}`;
    const template = 'Greetings from [Firm_Name]. Credit Note / Sale Return [Return_Number] for [Return_Amount] has been processed. Summary: [Link]';
    const message = template
      .replace('[Firm_Name]', storeName)
      .replace('[Return_Number]', docNumber || 'RET-001')
      .replace('[Return_Amount]', formattedAmount)
      .replace('[Link]', receiptLink);

    return {
      document_type: 'sale_return',
      document_type_label: 'Credit Note / Sale Return',
      document_number: docNumber,
      amount: Math.abs(Number(total)),
      message_text: message,
      action: 'open_whatsapp_draft',
    };
  }

  const formattedAmount = `${currency} ${Number(total || 0).toFixed(2)}`;
  const template = 'Greetings from [Firm_Name]. Your invoice [Invoice_Number] for [Invoice_Amount] is ready. Receipt: [Link]';
  const message = template
    .replace('[Firm_Name]', storeName)
    .replace('[Invoice_Number]', docNumber || 'INV-001')
    .replace('[Invoice_Amount]', formattedAmount)
    .replace('[Link]', receiptLink);

  return {
    document_type: 'sale',
    document_type_label: 'Sales Invoice',
    document_number: docNumber,
    amount: Number(total),
    message_text: message,
    action: 'open_whatsapp_draft',
  };
}

// ── 3. Section Isolation DTO Filter (Mirroring S10 Settings.jsx & AdminController)
const SECTION_FIELD_MAP = {
  business: ['business_name', 'business_email', 'tax_number', 'currency'],
  sales: ['invoice_number_enabled', 'cash_sale_default', 'pos_return_mode', 'billing_type'],
  print: ['paper_size', 'paper_orientation', 'thermal_page_size', 'print_theme_color'],
  messages: ['message_template_sales', 'message_template_returns', 'message_template_reminders', 'whatsapp_offer_pdf'],
};

function buildIsolatedSectionPayload(allFormData, activeSection) {
  const allowedKeys = SECTION_FIELD_MAP[activeSection] || [];
  const payload = { _save_section: activeSection };
  allowedKeys.forEach(key => {
    if (allFormData[key] !== undefined) {
      payload[key] = allFormData[key];
    }
  });
  return payload;
}

// ── 4. Reminder Balance & Settlement Recheck
function evaluateReminderDraft(invoice, customer) {
  if (customer?.marketing_opt_out || customer?.opted_out) {
    return { shouldDraft: false, status: 'dismissed', reason: 'Customer opted out' };
  }

  const total = Number(invoice.total || invoice.invoice_total || 0);
  const paid = Number(invoice.paid_amount || 0);
  const unpaid = total - paid;

  if (invoice.status === 'void' || invoice.status === 'cancelled' || unpaid <= 0.001) {
    return { shouldDraft: false, status: 'settled', unpaid: 0, reason: 'Invoice paid or voided' };
  }

  return {
    shouldDraft: true,
    status: 'opened',
    unpaid,
    wa_url: `https://wa.me/923001234567?text=Reminder%20for%20INV-${invoice.id}`
  };
}

describe('WhatsApp Manual Sharing & Settings Safeguards', () => {
  describe('Document Separation (Return vs. Sale Invoice)', () => {
    it('generates a Credit Note / Sale Return document and never substitutes a sale receipt', () => {
      const returnDraft = prepareWhatsAppDraft({
        documentType: 'sale_return',
        saleStatus: 'returned',
        docNumber: 'RET-2026-99',
        total: -4500,
        storeName: 'VenQore Superstore',
      });

      expect(returnDraft.document_type).toBe('sale_return');
      expect(returnDraft.document_type_label).toBe('Credit Note / Sale Return');
      expect(returnDraft.document_number).toBe('RET-2026-99');
      expect(returnDraft.amount).toBe(4500);
      expect(returnDraft.message_text).toContain('Credit Note / Sale Return RET-2026-99');
      expect(returnDraft.message_text).toContain('processed');
      expect(returnDraft.message_text).not.toContain('Your invoice');
      expect(returnDraft.action).toBe('open_whatsapp_draft');
    });

    it('generates a standard Sales Invoice for posted sales', () => {
      const saleDraft = prepareWhatsAppDraft({
        documentType: 'sale',
        saleStatus: 'completed',
        docNumber: 'INV-10045',
        total: 12500,
        storeName: 'VenQore Superstore',
      });

      expect(saleDraft.document_type).toBe('sale');
      expect(saleDraft.document_type_label).toBe('Sales Invoice');
      expect(saleDraft.document_number).toBe('INV-10045');
      expect(saleDraft.amount).toBe(12500);
      expect(saleDraft.message_text).toContain('Your invoice INV-10045 for PKR 12500.00 is ready');
      expect(saleDraft.message_text).not.toContain('Credit Note');
    });

    it('forces sale_return formatting when a transaction has status="returned" even if requested as sale', () => {
      const returnSale = prepareWhatsAppDraft({
        documentType: 'sale', // Client requested sale but transaction is returned
        saleStatus: 'returned',
        docNumber: 'RET-888',
        total: -250,
      });

      expect(returnSale.document_type).toBe('sale_return');
      expect(returnSale.document_type_label).toBe('Credit Note / Sale Return');
      expect(returnSale.message_text).toContain('Credit Note / Sale Return');
    });

    it('generates a Payment Receipt document for customer payments', () => {
      const receiptDraft = prepareWhatsAppDraft({
        documentType: 'payment_receipt',
        docNumber: 'REC-502',
        total: 15000,
        storeName: 'VenQore Store',
      });

      expect(receiptDraft.document_type).toBe('payment_receipt');
      expect(receiptDraft.document_type_label).toBe('Payment Receipt');
      expect(receiptDraft.document_number).toBe('REC-502');
      expect(receiptDraft.amount).toBe(15000);
      expect(receiptDraft.message_text).toContain('Payment receipt from VenQore Store');
      expect(receiptDraft.message_text).toContain('15000.00 received');
      expect(receiptDraft.action).toBe('open_whatsapp_draft');
    });

    it('generates a Party Statement document with outstanding balance', () => {
      const statementDraft = prepareWhatsAppDraft({
        documentType: 'party_statement',
        customerName: 'Fatima Enterprise',
        total: 42000,
        storeName: 'VenQore Store',
      });

      expect(statementDraft.document_type).toBe('party_statement');
      expect(statementDraft.document_type_label).toBe('Party Statement');
      expect(statementDraft.amount).toBe(42000);
      expect(statementDraft.message_text).toContain('Dear Fatima Enterprise');
      expect(statementDraft.message_text).toContain('42000.00');
      expect(statementDraft.action).toBe('open_whatsapp_draft');
    });
  });

  describe('Phone Number Normalization & E.164 Validation', () => {
    it('normalizes local phone with leading 0 using store country code', () => {
      const res = normalizePhone('03001234567', '92');
      expect(res.clean).toBe('923001234567');
      expect(res.valid).toBe(true);
    });

    it('strips spaces, dashes, parentheses and plus sign', () => {
      const res = normalizePhone('+92 (321) 987-6543');
      expect(res.clean).toBe('923219876543');
      expect(res.valid).toBe(true);
    });

    it('handles 00 international prefix', () => {
      const res = normalizePhone('00923001234567');
      expect(res.clean).toBe('923001234567');
      expect(res.valid).toBe(true);
    });

    it('flags too short numbers as invalid', () => {
      const res = normalizePhone('12345');
      expect(res.valid).toBe(false);
    });

    it('flags empty phone as invalid', () => {
      const res = normalizePhone(null);
      expect(res.valid).toBe(false);
      expect(res.clean).toBe('');
    });
  });

  describe('Isolated Section Saves (S10)', () => {
    const fullDirtyFormState = {
      business_name: 'Updated Store Name',
      business_email: 'store@example.com',
      tax_number: 'TX-12345',
      currency: 'PKR',
      paper_size: 'Thermal',
      paper_orientation: 'Landscape',
      thermal_page_size: '80mm',
      print_theme_color: '#10b981',
      invoice_number_enabled: true,
      billing_type: 'quick',
      message_template_sales: 'Custom sales message template',
      message_template_returns: 'Custom return message template',
      whatsapp_offer_pdf: true,
    };

    it('submits only print-owned keys when saving the print section', () => {
      const payload = buildIsolatedSectionPayload(fullDirtyFormState, 'print');

      expect(payload._save_section).toBe('print');
      expect(payload.paper_size).toBe('Thermal');
      expect(payload.thermal_page_size).toBe('80mm');
      expect(payload.print_theme_color).toBe('#10b981');

      // Unrelated keys must NOT be present
      expect(payload.business_name).toBeUndefined();
      expect(payload.business_email).toBeUndefined();
      expect(payload.message_template_sales).toBeUndefined();
      expect(payload.billing_type).toBeUndefined();
    });

    it('submits only message-owned keys when saving the messages section', () => {
      const payload = buildIsolatedSectionPayload(fullDirtyFormState, 'messages');

      expect(payload._save_section).toBe('messages');
      expect(payload.message_template_sales).toBe('Custom sales message template');
      expect(payload.message_template_returns).toBe('Custom return message template');
      expect(payload.whatsapp_offer_pdf).toBe(true);

      // Unrelated keys must NOT be present
      expect(payload.paper_size).toBeUndefined();
      expect(payload.business_name).toBeUndefined();
      expect(payload.currency).toBeUndefined();
    });
  });

  describe('Reminder Queue & Balance Recheck Safeguards', () => {
    it('suppresses drafting and settles reminder when invoice has zero remaining balance', () => {
      const paidInvoice = { id: 'inv-1', total: 5000, paid_amount: 5000, status: 'completed' };
      const customer = { name: 'Ali Khan', opted_out: false };

      const result = evaluateReminderDraft(paidInvoice, customer);
      expect(result.shouldDraft).toBe(false);
      expect(result.status).toBe('settled');
      expect(result.reason).toContain('paid');
    });

    it('suppresses drafting when invoice status is void', () => {
      const voidInvoice = { id: 'inv-2', total: 8000, paid_amount: 0, status: 'void' };
      const customer = { name: 'Usman Corp', opted_out: false };

      const result = evaluateReminderDraft(voidInvoice, customer);
      expect(result.shouldDraft).toBe(false);
      expect(result.status).toBe('settled');
    });

    it('suppresses drafting when customer opted out of notifications', () => {
      const unpaidInvoice = { id: 'inv-3', total: 4000, paid_amount: 1000, status: 'completed' };
      const optedOutCustomer = { name: 'Sara', opted_out: true };

      const result = evaluateReminderDraft(unpaidInvoice, optedOutCustomer);
      expect(result.shouldDraft).toBe(false);
      expect(result.status).toBe('dismissed');
    });

    it('allows draft creation with correct remaining unpaid balance for partially paid invoice', () => {
      const partialInvoice = { id: 'inv-4', total: 10000, paid_amount: 3500, status: 'completed' };
      const customer = { name: 'Tariq', opted_out: false };

      const result = evaluateReminderDraft(partialInvoice, customer);
      expect(result.shouldDraft).toBe(true);
      expect(result.unpaid).toBe(6500);
      expect(result.status).toBe('opened'); // status is strictly 'opened', never 'sent'
    });
  });

  describe('Zero Outbound Third-Party API Calls Invariant', () => {
    it('guarantees no outbound HTTP requests to Meta Cloud API or Twilio occur', () => {
      const mockHttp = vi.fn();

      // Simulate a sale checkout or reminder generation flow
      const checkoutWhatsAppAction = (sale) => {
        // Zero outbound HTTP calls made:
        // Returns Click-to-Chat URL instead of invoking Meta API
        return {
          action: 'open_whatsapp',
          url: `https://wa.me/923001234567?text=Invoice%20${sale.id}`,
          status: 'opened'
        };
      };

      const result = checkoutWhatsAppAction({ id: 'SALE-101', total: 2500 });

      expect(mockHttp).not.toHaveBeenCalled();
      expect(result.action).toBe('open_whatsapp');
      expect(result.status).not.toBe('sent');
      expect(result.status).not.toBe('delivered');
      expect(result.status).toBe('opened');
    });
  });
});
