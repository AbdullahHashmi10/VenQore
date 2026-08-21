import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import './NewDashboard.css';

// React Bits Components
import Folder from '@/Components/ReactBits/Folder';
import GlassIcons from '@/Components/ReactBits/GlassIcons';
import StarBorder from '@/Components/ReactBits/StarBorder';
import Stepper from '@/Components/ReactBits/Stepper';

function runCardBuilder() {

const READINGS = [{"key":"accounting.assets","label":"Assets","shape":"SCALAR","unit":"currency","area":"Finance","module":"Accounting","short":"Assets","extra":false,"rowNames":["Rent","Salaries","Utilities","Transport","Marketing","Other"],"sliceNames":["Rent","Salaries","Utilities","Transport","Other"]},{"key":"accounting.liabilities","label":"Liabilities","shape":"SCALAR","unit":"currency","area":"Finance","module":"Accounting","short":"Liabilities","extra":false,"rowNames":["Rent","Salaries","Utilities","Transport","Marketing","Other"],"sliceNames":["Rent","Salaries","Utilities","Transport","Other"]},{"key":"accounting.income_ytd","label":"Income (YTD)","shape":"SCALAR","unit":"currency","area":"Finance","module":"Accounting","short":"Income (YTD)","extra":false,"rowNames":["Rent","Salaries","Utilities","Transport","Marketing","Other"],"sliceNames":["Rent","Salaries","Utilities","Transport","Other"]},{"key":"accounting.expense_ytd","label":"Expense (YTD)","shape":"SCALAR","unit":"currency","area":"Finance","module":"Accounting","short":"Expense (YTD)","extra":false,"rowNames":["Rent","Salaries","Utilities","Transport","Marketing","Other"],"sliceNames":["Rent","Salaries","Utilities","Transport","Other"]},{"key":"bank_accounts.total_balance","label":"Total Balance","shape":"SCALAR","unit":"currency","area":"Finance","module":"BankAccounts","short":"Total Balance","extra":false,"rowNames":["Rent","Salaries","Utilities","Transport","Marketing","Other"],"sliceNames":["Rent","Salaries","Utilities","Transport","Other"]},{"key":"bank_accounts.cash_on_hand","label":"Cash on Hand","shape":"SCALAR","unit":"currency","area":"Finance","module":"BankAccounts","short":"Cash on Hand","extra":false,"rowNames":["Rent","Salaries","Utilities","Transport","Marketing","Other"],"sliceNames":["Rent","Salaries","Utilities","Transport","Other"]},{"key":"bank_accounts.money_in_today","label":"Money In (Today)","shape":"SCALAR","unit":"currency","area":"Finance","module":"BankAccounts","short":"Money In (Today)","extra":false,"rowNames":["Rent","Salaries","Utilities","Transport","Marketing","Other"],"sliceNames":["Rent","Salaries","Utilities","Transport","Other"]},{"key":"bank_accounts.money_out_today","label":"Money Out (Today)","shape":"SCALAR","unit":"currency","area":"Finance","module":"BankAccounts","short":"Money Out (Today","extra":false,"rowNames":["Rent","Salaries","Utilities","Transport","Marketing","Other"],"sliceNames":["Rent","Salaries","Utilities","Transport","Other"]},{"key":"bank_reconciliation.total_txns","label":"Total Txns","shape":"SCALAR","unit":"count","area":"Finance","module":"BankReconciliation","short":"Total Txns","extra":false,"rowNames":["Rent","Salaries","Utilities","Transport","Marketing","Other"],"sliceNames":["Rent","Salaries","Utilities","Transport","Other"]},{"key":"bank_reconciliation.matched","label":"Matched","shape":"SCALAR","unit":"count","area":"Finance","module":"BankReconciliation","short":"Matched","extra":false,"rowNames":["Rent","Salaries","Utilities","Transport","Marketing","Other"],"sliceNames":["Rent","Salaries","Utilities","Transport","Other"]},{"key":"bank_reconciliation.unmatched","label":"Unmatched","shape":"SCALAR","unit":"count","area":"Finance","module":"BankReconciliation","short":"Unmatched","extra":false,"rowNames":["Rent","Salaries","Utilities","Transport","Marketing","Other"],"sliceNames":["Rent","Salaries","Utilities","Transport","Other"]},{"key":"batch_tracking.total_batches","label":"Total Batches","shape":"SCALAR","unit":"count","area":"Inventory","module":"BatchTracking","short":"Total Batches","extra":false,"rowNames":["Basmati 5kg","Cumfrey 500g","BMC Tonic 200ml","Vitamix 40g","Surf Excel 1kg","Tapal Danedar"],"sliceNames":["Main store","Warehouse A","Warehouse B","In transit"]},{"key":"batch_tracking.expiring_soon","label":"Expiring Soon","shape":"SCALAR","unit":"count","area":"Inventory","module":"BatchTracking","short":"Expiring Soon","extra":false,"rowNames":["Basmati 5kg","Cumfrey 500g","BMC Tonic 200ml","Vitamix 40g","Surf Excel 1kg","Tapal Danedar"],"sliceNames":["Main store","Warehouse A","Warehouse B","In transit"]},{"key":"batch_tracking.expired","label":"Expired","shape":"SCALAR","unit":"count","area":"Inventory","module":"BatchTracking","short":"Expired","extra":false,"rowNames":["Basmati 5kg","Cumfrey 500g","BMC Tonic 200ml","Vitamix 40g","Surf Excel 1kg","Tapal Danedar"],"sliceNames":["Main store","Warehouse A","Warehouse B","In transit"]},{"key":"batch_tracking.total_qty","label":"Total Qty","shape":"SCALAR","unit":"count","area":"Inventory","module":"BatchTracking","short":"Total Qty","extra":false,"rowNames":["Basmati 5kg","Cumfrey 500g","BMC Tonic 200ml","Vitamix 40g","Surf Excel 1kg","Tapal Danedar"],"sliceNames":["Main store","Warehouse A","Warehouse B","In transit"]},{"key":"debit_notes.total_notes","label":"Total Notes","shape":"SCALAR","unit":"count","area":"Purchasing","module":"DebitNotes","short":"Total Notes","extra":false,"rowNames":["Metro Supply","Karim Bros","Lahore Foods","Indus Traders","Bahria Wholesale","Ravi Depot"],"sliceNames":["Metro Supply","Karim Bros","Lahore Foods","Indus Traders"]},{"key":"purchasing.spend","label":"Total Value","shape":"SCALAR","unit":"currency","area":"Purchasing","module":"DebitNotes","short":"Total Value","extra":false,"rowNames":["Metro Supply","Karim Bros","Lahore Foods","Indus Traders","Bahria Wholesale","Ravi Depot"],"sliceNames":["Metro Supply","Karim Bros","Lahore Foods","Indus Traders"]},{"key":"debit_notes.open_credits","label":"Open Credits","shape":"SCALAR","unit":"currency","area":"Purchasing","module":"DebitNotes","short":"Open Credits","extra":false,"rowNames":["Metro Supply","Karim Bros","Lahore Foods","Indus Traders","Bahria Wholesale","Ravi Depot"],"sliceNames":["Metro Supply","Karim Bros","Lahore Foods","Indus Traders"]},{"key":"finance.expenses_total","label":"Today's Expenses","shape":"SCALAR","unit":"currency","area":"Finance","module":"Expenses","short":"Today's Expenses","extra":false,"rowNames":["Rent","Salaries","Utilities","Transport","Marketing","Other"],"sliceNames":["Rent","Salaries","Utilities","Transport","Other"]},{"key":"finance.payables","label":"Total Payable","shape":"SCALAR","unit":"currency","area":"Finance","module":"Finance","short":"Total Payable","extra":false,"rowNames":["Rent","Salaries","Utilities","Transport","Marketing","Other"],"sliceNames":["Rent","Salaries","Utilities","Transport","Other"]},{"key":"party.supplier_count","label":"Active Creditors","shape":"SCALAR","unit":"count","area":"Finance","module":"Finance","short":"Active Creditors","extra":false,"rowNames":["Rent","Salaries","Utilities","Transport","Marketing","Other"],"sliceNames":["Rent","Salaries","Utilities","Transport","Other"]},{"key":"finance.avg_balance","label":"Avg Balance","shape":"SCALAR","unit":"currency","area":"Finance","module":"Finance","short":"Avg Balance","extra":false,"rowNames":["Rent","Salaries","Utilities","Transport","Marketing","Other"],"sliceNames":["Rent","Salaries","Utilities","Transport","Other"]},{"key":"finance.receivables","label":"Total Receivable","shape":"SCALAR","unit":"currency","area":"Finance","module":"Finance","short":"Total Receivable","extra":false,"rowNames":["Rent","Salaries","Utilities","Transport","Marketing","Other"],"sliceNames":["Rent","Salaries","Utilities","Transport","Other"]},{"key":"party.customer_count","label":"Active Debtors","shape":"SCALAR","unit":"count","area":"Finance","module":"Finance","short":"Active Debtors","extra":false,"rowNames":["Rent","Salaries","Utilities","Transport","Marketing","Other"],"sliceNames":["Rent","Salaries","Utilities","Transport","Other"]},{"key":"inventory.total_categories","label":"Total Categories","shape":"SCALAR","unit":"count","area":"Inventory","module":"Inventory","short":"Total Categories","extra":false,"rowNames":["Basmati 5kg","Cumfrey 500g","BMC Tonic 200ml","Vitamix 40g","Surf Excel 1kg","Tapal Danedar"],"sliceNames":["Main store","Warehouse A","Warehouse B","In transit"]},{"key":"inventory.main_categories","label":"Main Categories","shape":"SCALAR","unit":"count","area":"Inventory","module":"Inventory","short":"Main Categories","extra":false,"rowNames":["Basmati 5kg","Cumfrey 500g","BMC Tonic 200ml","Vitamix 40g","Surf Excel 1kg","Tapal Danedar"],"sliceNames":["Main store","Warehouse A","Warehouse B","In transit"]},{"key":"inventory.products_linked","label":"Products Linked","shape":"SCALAR","unit":"count","area":"Inventory","module":"Inventory","short":"Products Linked","extra":false,"rowNames":["Basmati 5kg","Cumfrey 500g","BMC Tonic 200ml","Vitamix 40g","Surf Excel 1kg","Tapal Danedar"],"sliceNames":["Main store","Warehouse A","Warehouse B","In transit"]},{"key":"inventory.product_count","label":"Total Products","shape":"SCALAR","unit":"count","area":"Inventory","module":"Inventory","short":"Total Products","extra":false,"rowNames":["Basmati 5kg","Cumfrey 500g","BMC Tonic 200ml","Vitamix 40g","Surf Excel 1kg","Tapal Danedar"],"sliceNames":["Main store","Warehouse A","Warehouse B","In transit"]},{"key":"inventory.low_stock_count","label":"Low Stock","shape":"SCALAR","unit":"count","area":"Inventory","module":"Inventory","short":"Low Stock","extra":false,"rowNames":["Basmati 5kg","Cumfrey 500g","BMC Tonic 200ml","Vitamix 40g","Surf Excel 1kg","Tapal Danedar"],"sliceNames":["Main store","Warehouse A","Warehouse B","In transit"]},{"key":"inventory.stock_value","label":"Inventory Value","shape":"SCALAR","unit":"currency","area":"Inventory","module":"Inventory","short":"Inventory Value","extra":false,"rowNames":["Basmati 5kg","Cumfrey 500g","BMC Tonic 200ml","Vitamix 40g","Surf Excel 1kg","Tapal Danedar"],"sliceNames":["Main store","Warehouse A","Warehouse B","In transit"]},{"key":"production.run_count","label":"Active Runs","shape":"SCALAR","unit":"count","area":"Inventory","module":"Inventory","short":"Active Runs","extra":false,"rowNames":["Basmati 5kg","Cumfrey 500g","BMC Tonic 200ml","Vitamix 40g","Surf Excel 1kg","Tapal Danedar"],"sliceNames":["Main store","Warehouse A","Warehouse B","In transit"]},{"key":"inventory.completed_today","label":"Completed Today","shape":"SCALAR","unit":"count","area":"Inventory","module":"Inventory","short":"Completed Today","extra":false,"rowNames":["Basmati 5kg","Cumfrey 500g","BMC Tonic 200ml","Vitamix 40g","Surf Excel 1kg","Tapal Danedar"],"sliceNames":["Main store","Warehouse A","Warehouse B","In transit"]},{"key":"production.total_cost","label":"Cost (Month)","shape":"SCALAR","unit":"currency","area":"Inventory","module":"Inventory","short":"Cost (Month)","extra":false,"rowNames":["Basmati 5kg","Cumfrey 500g","BMC Tonic 200ml","Vitamix 40g","Surf Excel 1kg","Tapal Danedar"],"sliceNames":["Main store","Warehouse A","Warehouse B","In transit"]},{"key":"inventory.out_of_stock_count","label":"Out of Stock","shape":"SCALAR","unit":"count","area":"Inventory","module":"Inventory","short":"Out of Stock","extra":false,"rowNames":["Basmati 5kg","Cumfrey 500g","BMC Tonic 200ml","Vitamix 40g","Surf Excel 1kg","Tapal Danedar"],"sliceNames":["Main store","Warehouse A","Warehouse B","In transit"]},{"key":"pre_sales.total_quotes","label":"Total Quotes","shape":"SCALAR","unit":"count","area":"Sales","module":"PreSales","short":"Total Quotes","extra":false,"rowNames":["Rana Traders","Bilal Pharmacy","Zoya Retail","Ahmad Stores","Noor Kiryana","Sana Mart"],"sliceNames":["Cash","Card","Credit","Bank","Wallet"]},{"key":"pre_sales.pending","label":"Pending","shape":"SCALAR","unit":"count","area":"Sales","module":"PreSales","short":"Pending","extra":false,"rowNames":["Rana Traders","Bilal Pharmacy","Zoya Retail","Ahmad Stores","Noor Kiryana","Sana Mart"],"sliceNames":["Cash","Card","Credit","Bank","Wallet"]},{"key":"proposals.total_proposals","label":"Total Proposals","shape":"SCALAR","unit":"count","area":"Sales","module":"Proposals","short":"Total Proposals","extra":false,"rowNames":["Rana Traders","Bilal Pharmacy","Zoya Retail","Ahmad Stores","Noor Kiryana","Sana Mart"],"sliceNames":["Cash","Card","Credit","Bank","Wallet"]},{"key":"proposals.accepted","label":"Accepted","shape":"SCALAR","unit":"count","area":"Sales","module":"Proposals","short":"Accepted","extra":false,"rowNames":["Rana Traders","Bilal Pharmacy","Zoya Retail","Ahmad Stores","Noor Kiryana","Sana Mart"],"sliceNames":["Cash","Card","Credit","Bank","Wallet"]},{"key":"proposals.pending","label":"Pending","shape":"SCALAR","unit":"count","area":"Sales","module":"Proposals","short":"Pending","extra":false,"rowNames":["Rana Traders","Bilal Pharmacy","Zoya Retail","Ahmad Stores","Noor Kiryana","Sana Mart"],"sliceNames":["Cash","Card","Credit","Bank","Wallet"]},{"key":"purchasing.count","label":"Total Orders","shape":"SCALAR","unit":"count","area":"Purchasing","module":"PurchaseOrders","short":"Total Orders","extra":false,"rowNames":["Metro Supply","Karim Bros","Lahore Foods","Indus Traders","Bahria Wholesale","Ravi Depot"],"sliceNames":["Metro Supply","Karim Bros","Lahore Foods","Indus Traders"]},{"key":"purchase_orders.pending","label":"Pending","shape":"SCALAR","unit":"count","area":"Purchasing","module":"PurchaseOrders","short":"Pending","extra":false,"rowNames":["Metro Supply","Karim Bros","Lahore Foods","Indus Traders","Bahria Wholesale","Ravi Depot"],"sliceNames":["Metro Supply","Karim Bros","Lahore Foods","Indus Traders"]},{"key":"purchase_orders.received","label":"Received","shape":"SCALAR","unit":"count","area":"Purchasing","module":"PurchaseOrders","short":"Received","extra":false,"rowNames":["Metro Supply","Karim Bros","Lahore Foods","Indus Traders","Bahria Wholesale","Ravi Depot"],"sliceNames":["Metro Supply","Karim Bros","Lahore Foods","Indus Traders"]},{"key":"recurring_invoices.total","label":"Total","shape":"SCALAR","unit":"count","area":"Sales","module":"RecurringInvoices","short":"Total","extra":false,"rowNames":["Rana Traders","Bilal Pharmacy","Zoya Retail","Ahmad Stores","Noor Kiryana","Sana Mart"],"sliceNames":["Cash","Card","Credit","Bank","Wallet"]},{"key":"recurring_invoices.active","label":"Active","shape":"SCALAR","unit":"count","area":"Sales","module":"RecurringInvoices","short":"Active","extra":false,"rowNames":["Rana Traders","Bilal Pharmacy","Zoya Retail","Ahmad Stores","Noor Kiryana","Sana Mart"],"sliceNames":["Cash","Card","Credit","Bank","Wallet"]},{"key":"recurring_invoices.paused","label":"Paused","shape":"SCALAR","unit":"count","area":"Sales","module":"RecurringInvoices","short":"Paused","extra":false,"rowNames":["Rana Traders","Bilal Pharmacy","Zoya Retail","Ahmad Stores","Noor Kiryana","Sana Mart"],"sliceNames":["Cash","Card","Credit","Bank","Wallet"]},{"key":"recurring_invoices.monthly_revenue","label":"Monthly Revenue","shape":"SCALAR","unit":"currency","area":"Sales","module":"RecurringInvoices","short":"Monthly Revenue","extra":false,"rowNames":["Rana Traders","Bilal Pharmacy","Zoya Retail","Ahmad Stores","Noor Kiryana","Sana Mart"],"sliceNames":["Cash","Card","Credit","Bank","Wallet"]},{"key":"reminders.total_scheduled","label":"Total Scheduled","shape":"SCALAR","unit":"count","area":"Sales","module":"Reminders","short":"Total Scheduled","extra":false,"rowNames":["Rana Traders","Bilal Pharmacy","Zoya Retail","Ahmad Stores","Noor Kiryana","Sana Mart"],"sliceNames":["Cash","Card","Credit","Bank","Wallet"]},{"key":"reminders.pending","label":"Pending","shape":"SCALAR","unit":"count","area":"Sales","module":"Reminders","short":"Pending","extra":false,"rowNames":["Rana Traders","Bilal Pharmacy","Zoya Retail","Ahmad Stores","Noor Kiryana","Sana Mart"],"sliceNames":["Cash","Card","Credit","Bank","Wallet"]},{"key":"reminders.sent","label":"Sent","shape":"SCALAR","unit":"count","area":"Sales","module":"Reminders","short":"Sent","extra":false,"rowNames":["Rana Traders","Bilal Pharmacy","Zoya Retail","Ahmad Stores","Noor Kiryana","Sana Mart"],"sliceNames":["Cash","Card","Credit","Bank","Wallet"]},{"key":"reminders.overdue","label":"Overdue","shape":"SCALAR","unit":"count","area":"Sales","module":"Reminders","short":"Overdue","extra":false,"rowNames":["Rana Traders","Bilal Pharmacy","Zoya Retail","Ahmad Stores","Noor Kiryana","Sana Mart"],"sliceNames":["Cash","Card","Credit","Bank","Wallet"]},{"key":"returns.total_returns","label":"Total Returns","shape":"SCALAR","unit":"count","area":"Sales","module":"Returns","short":"Total Returns","extra":false,"rowNames":["Rana Traders","Bilal Pharmacy","Zoya Retail","Ahmad Stores","Noor Kiryana","Sana Mart"],"sliceNames":["Cash","Card","Credit","Bank","Wallet"]},{"key":"returns.items_returned","label":"Items Returned","shape":"SCALAR","unit":"count","area":"Sales","module":"Returns","short":"Items Returned","extra":false,"rowNames":["Rana Traders","Bilal Pharmacy","Zoya Retail","Ahmad Stores","Noor Kiryana","Sana Mart"],"sliceNames":["Cash","Card","Credit","Bank","Wallet"]},{"key":"returns.total_refunded","label":"Total Refunded","shape":"SCALAR","unit":"currency","area":"Sales","module":"Returns","short":"Total Refunded","extra":false,"rowNames":["Rana Traders","Bilal Pharmacy","Zoya Retail","Ahmad Stores","Noor Kiryana","Sana Mart"],"sliceNames":["Cash","Card","Credit","Bank","Wallet"]},{"key":"sales.revenue","label":"Total Sale","shape":"SCALAR","unit":"currency","area":"Sales","module":"Sales","short":"Total Sale","extra":false,"rowNames":["Rana Traders","Bilal Pharmacy","Zoya Retail","Ahmad Stores","Noor Kiryana","Sana Mart"],"sliceNames":["Cash","Card","Credit","Bank","Wallet"]},{"key":"sales_orders.confirmed","label":"Confirmed","shape":"SCALAR","unit":"count","area":"Sales","module":"SalesOrders","short":"Confirmed","extra":false,"rowNames":["Rana Traders","Bilal Pharmacy","Zoya Retail","Ahmad Stores","Noor Kiryana","Sana Mart"],"sliceNames":["Cash","Card","Credit","Bank","Wallet"]},{"key":"sales_orders.pending","label":"Pending","shape":"SCALAR","unit":"count","area":"Sales","module":"SalesOrders","short":"Pending","extra":false,"rowNames":["Rana Traders","Bilal Pharmacy","Zoya Retail","Ahmad Stores","Noor Kiryana","Sana Mart"],"sliceNames":["Cash","Card","Credit","Bank","Wallet"]},{"key":"serial_tracking.total_serials","label":"Total Serials","shape":"SCALAR","unit":"count","area":"Inventory","module":"SerialTracking","short":"Total Serials","extra":false,"rowNames":["Basmati 5kg","Cumfrey 500g","BMC Tonic 200ml","Vitamix 40g","Surf Excel 1kg","Tapal Danedar"],"sliceNames":["Main store","Warehouse A","Warehouse B","In transit"]},{"key":"serial_tracking.in_stock","label":"In Stock","shape":"SCALAR","unit":"count","area":"Inventory","module":"SerialTracking","short":"In Stock","extra":false,"rowNames":["Basmati 5kg","Cumfrey 500g","BMC Tonic 200ml","Vitamix 40g","Surf Excel 1kg","Tapal Danedar"],"sliceNames":["Main store","Warehouse A","Warehouse B","In transit"]},{"key":"serial_tracking.sold","label":"Sold","shape":"SCALAR","unit":"count","area":"Inventory","module":"SerialTracking","short":"Sold","extra":false,"rowNames":["Basmati 5kg","Cumfrey 500g","BMC Tonic 200ml","Vitamix 40g","Surf Excel 1kg","Tapal Danedar"],"sliceNames":["Main store","Warehouse A","Warehouse B","In transit"]},{"key":"serial_tracking.returned","label":"Returned","shape":"SCALAR","unit":"count","area":"Inventory","module":"SerialTracking","short":"Returned","extra":false,"rowNames":["Basmati 5kg","Cumfrey 500g","BMC Tonic 200ml","Vitamix 40g","Surf Excel 1kg","Tapal Danedar"],"sliceNames":["Main store","Warehouse A","Warehouse B","In transit"]},{"key":"staff.member_count","label":"Total Staff","shape":"SCALAR","unit":"count","area":"Operations","module":"StaffAttendance","short":"Total Staff","extra":false,"rowNames":["Bilal Ahmed","Sana Iqbal","Hamza Raza","Noor Fatima","Ayesha Khan","Usman Ali"],"sliceNames":["New","Returning","Dormant"]},{"key":"staff.on_shift_count","label":"Present","shape":"SCALAR","unit":"count","area":"Operations","module":"StaffAttendance","short":"Present","extra":false,"rowNames":["Bilal Ahmed","Sana Iqbal","Hamza Raza","Noor Fatima","Ayesha Khan","Usman Ali"],"sliceNames":["New","Returning","Dormant"]},{"key":"staff_attendance.absent","label":"Absent","shape":"SCALAR","unit":"count","area":"Operations","module":"StaffAttendance","short":"Absent","extra":false,"rowNames":["Bilal Ahmed","Sana Iqbal","Hamza Raza","Noor Fatima","Ayesha Khan","Usman Ali"],"sliceNames":["New","Returning","Dormant"]},{"key":"staff_attendance.pending_gaps","label":"Pending Gaps","shape":"SCALAR","unit":"count","area":"Operations","module":"StaffAttendance","short":"Pending Gaps","extra":false,"rowNames":["Bilal Ahmed","Sana Iqbal","Hamza Raza","Noor Fatima","Ayesha Khan","Usman Ali"],"sliceNames":["New","Returning","Dormant"]},{"key":"staff_attendance.hours_today","label":"Hours Today","shape":"SCALAR","unit":"count","area":"Operations","module":"StaffAttendance","short":"Hours Today","extra":false,"rowNames":["Bilal Ahmed","Sana Iqbal","Hamza Raza","Noor Fatima","Ayesha Khan","Usman Ali"],"sliceNames":["New","Returning","Dormant"]},{"key":"sales.revenue_trend","label":"Revenue trend","shape":"SERIES","unit":"currency","area":"Sales","module":"Extra","short":"Revenue trend","extra":true,"rowNames":["Rana Traders","Bilal Pharmacy","Zoya Retail","Ahmad Stores","Noor Kiryana","Sana Mart"],"sliceNames":["Cash","Card","Credit","Bank","Wallet"]},{"key":"sales.payment_breakdown","label":"Payment breakdown","shape":"BREAKDOWN","unit":"currency","area":"Sales","module":"Extra","short":"Payment breakdow","extra":true,"rowNames":["Rana Traders","Bilal Pharmacy","Zoya Retail","Ahmad Stores","Noor Kiryana","Sana Mart"],"sliceNames":["Cash","Card","Credit","Bank","Wallet"]},{"key":"sales.top_products","label":"Top products","shape":"RANKING","unit":"currency","area":"Sales","module":"Extra","short":"Top products","extra":true,"rowNames":["Rana Traders","Bilal Pharmacy","Zoya Retail","Ahmad Stores","Noor Kiryana","Sana Mart"],"sliceNames":["Cash","Card","Credit","Bank","Wallet"]},{"key":"sales.top_customers","label":"Top customers","shape":"RANKING","unit":"currency","area":"Sales","module":"Extra","short":"Top customers","extra":true,"rowNames":["Rana Traders","Bilal Pharmacy","Zoya Retail","Ahmad Stores","Noor Kiryana","Sana Mart"],"sliceNames":["Cash","Card","Credit","Bank","Wallet"]},{"key":"sales.hourly_heatmap","label":"Sales by hour and day","shape":"TABLE","unit":"count","area":"Sales","module":"Extra","short":"Sales by hour an","extra":true,"rowNames":["Rana Traders","Bilal Pharmacy","Zoya Retail","Ahmad Stores","Noor Kiryana","Sana Mart"],"sliceNames":["Cash","Card","Credit","Bank","Wallet"]},{"key":"sales.live_feed","label":"Live sales feed","shape":"FEED","unit":"currency","area":"Sales","module":"Extra","short":"Live sales feed","extra":true,"rowNames":["Rana Traders","Bilal Pharmacy","Zoya Retail","Ahmad Stores","Noor Kiryana","Sana Mart"],"sliceNames":["Cash","Card","Credit","Bank","Wallet"]},{"key":"sales.avg_order_value","label":"Average order value","shape":"SCALAR","unit":"currency","area":"Sales","module":"Extra","short":"Average order va","extra":true,"rowNames":["Rana Traders","Bilal Pharmacy","Zoya Retail","Ahmad Stores","Noor Kiryana","Sana Mart"],"sliceNames":["Cash","Card","Credit","Bank","Wallet"]},{"key":"sales.basket_size","label":"Average basket size","shape":"SCALAR","unit":"count","area":"Sales","module":"Extra","short":"Average basket s","extra":true,"rowNames":["Rana Traders","Bilal Pharmacy","Zoya Retail","Ahmad Stores","Noor Kiryana","Sana Mart"],"sliceNames":["Cash","Card","Credit","Bank","Wallet"]},{"key":"sales.discount_given","label":"Discount given","shape":"SCALAR","unit":"currency","area":"Sales","module":"Extra","short":"Discount given","extra":true,"rowNames":["Rana Traders","Bilal Pharmacy","Zoya Retail","Ahmad Stores","Noor Kiryana","Sana Mart"],"sliceNames":["Cash","Card","Credit","Bank","Wallet"]},{"key":"sales.return_rate","label":"Return rate","shape":"SCALAR","unit":"percent","area":"Sales","module":"Extra","short":"Return rate","extra":true,"rowNames":["Rana Traders","Bilal Pharmacy","Zoya Retail","Ahmad Stores","Noor Kiryana","Sana Mart"],"sliceNames":["Cash","Card","Credit","Bank","Wallet"]},{"key":"sales.conversion_funnel","label":"Sales funnel","shape":"RANKING","unit":"count","area":"Sales","module":"Extra","short":"Sales funnel","extra":true,"rowNames":["Rana Traders","Bilal Pharmacy","Zoya Retail","Ahmad Stores","Noor Kiryana","Sana Mart"],"sliceNames":["Cash","Card","Credit","Bank","Wallet"]},{"key":"sales.channel_split","label":"Sales by channel","shape":"BREAKDOWN","unit":"currency","area":"Sales","module":"Extra","short":"Sales by channel","extra":true,"rowNames":["Rana Traders","Bilal Pharmacy","Zoya Retail","Ahmad Stores","Noor Kiryana","Sana Mart"],"sliceNames":["Cash","Card","Credit","Bank","Wallet"]},{"key":"sales.region_split","label":"Sales by region","shape":"BREAKDOWN","unit":"currency","area":"Sales","module":"Extra","short":"Sales by region","extra":true,"rowNames":["Rana Traders","Bilal Pharmacy","Zoya Retail","Ahmad Stores","Noor Kiryana","Sana Mart"],"sliceNames":["Cash","Card","Credit","Bank","Wallet"]},{"key":"finance.profit_trend","label":"Profit trend","shape":"SERIES","unit":"currency","area":"Finance","module":"Extra","short":"Profit trend","extra":true,"rowNames":["Rent","Salaries","Utilities","Transport","Marketing","Other"],"sliceNames":["Rent","Salaries","Utilities","Transport","Other"]},{"key":"finance.cash_flow_trend","label":"Cash in vs out","shape":"MULTI_SERIES","unit":"currency","area":"Finance","module":"Extra","short":"Cash in vs out","extra":true,"rowNames":["Rent","Salaries","Utilities","Transport","Marketing","Other"],"sliceNames":["Rent","Salaries","Utilities","Transport","Other"]},{"key":"finance.expenses_by_category","label":"Expenses by category","shape":"BREAKDOWN","unit":"currency","area":"Finance","module":"Extra","short":"Expenses by cate","extra":true,"rowNames":["Rent","Salaries","Utilities","Transport","Marketing","Other"],"sliceNames":["Rent","Salaries","Utilities","Transport","Other"]},{"key":"finance.receivables_aging","label":"Receivables ageing","shape":"BREAKDOWN","unit":"currency","area":"Finance","module":"Extra","short":"Receivables agei","extra":true,"rowNames":["Rent","Salaries","Utilities","Transport","Marketing","Other"],"sliceNames":["Rent","Salaries","Utilities","Transport","Other"]},{"key":"finance.balance_sheet_ok","label":"Books balanced","shape":"STATUS","unit":"count","area":"Finance","module":"Extra","short":"Books balanced","extra":true,"rowNames":["Rent","Salaries","Utilities","Transport","Marketing","Other"],"sliceNames":["Rent","Salaries","Utilities","Transport","Other"]},{"key":"finance.cash_runway","label":"Cash runway","shape":"SCALAR","unit":"count","area":"Finance","module":"Extra","short":"Cash runway","extra":true,"rowNames":["Rent","Salaries","Utilities","Transport","Marketing","Other"],"sliceNames":["Rent","Salaries","Utilities","Transport","Other"]},{"key":"finance.dso","label":"Days sales outstanding","shape":"SCALAR","unit":"count","area":"Finance","module":"Extra","short":"Days sales outst","extra":true,"rowNames":["Rent","Salaries","Utilities","Transport","Marketing","Other"],"sliceNames":["Rent","Salaries","Utilities","Transport","Other"]},{"key":"finance.dpo","label":"Days payable outstanding","shape":"SCALAR","unit":"count","area":"Finance","module":"Extra","short":"Days payable out","extra":true,"rowNames":["Rent","Salaries","Utilities","Transport","Marketing","Other"],"sliceNames":["Rent","Salaries","Utilities","Transport","Other"]},{"key":"finance.quick_ratio","label":"Quick ratio","shape":"SCALAR","unit":"percent","area":"Finance","module":"Extra","short":"Quick ratio","extra":true,"rowNames":["Rent","Salaries","Utilities","Transport","Marketing","Other"],"sliceNames":["Rent","Salaries","Utilities","Transport","Other"]},{"key":"finance.expense_ratio","label":"Expense ratio","shape":"SCALAR","unit":"percent","area":"Finance","module":"Extra","short":"Expense ratio","extra":true,"rowNames":["Rent","Salaries","Utilities","Transport","Marketing","Other"],"sliceNames":["Rent","Salaries","Utilities","Transport","Other"]},{"key":"finance.tax_liability","label":"Tax liability","shape":"SCALAR","unit":"currency","area":"Finance","module":"Extra","short":"Tax liability","extra":true,"rowNames":["Rent","Salaries","Utilities","Transport","Marketing","Other"],"sliceNames":["Rent","Salaries","Utilities","Transport","Other"]},{"key":"inventory.low_stock_list","label":"Low stock list","shape":"TABLE","unit":"count","area":"Inventory","module":"Extra","short":"Low stock list","extra":true,"rowNames":["Basmati 5kg","Cumfrey 500g","BMC Tonic 200ml","Vitamix 40g","Surf Excel 1kg","Tapal Danedar"],"sliceNames":["Main store","Warehouse A","Warehouse B","In transit"]},{"key":"inventory.turnover","label":"Inventory turnover","shape":"SCALAR","unit":"percent","area":"Inventory","module":"Extra","short":"Inventory turnov","extra":true,"rowNames":["Basmati 5kg","Cumfrey 500g","BMC Tonic 200ml","Vitamix 40g","Surf Excel 1kg","Tapal Danedar"],"sliceNames":["Main store","Warehouse A","Warehouse B","In transit"]},{"key":"inventory.days_of_cover","label":"Days of cover","shape":"SCALAR","unit":"count","area":"Inventory","module":"Extra","short":"Days of cover","extra":true,"rowNames":["Basmati 5kg","Cumfrey 500g","BMC Tonic 200ml","Vitamix 40g","Surf Excel 1kg","Tapal Danedar"],"sliceNames":["Main store","Warehouse A","Warehouse B","In transit"]},{"key":"inventory.sell_through","label":"Sell-through rate","shape":"SCALAR","unit":"percent","area":"Inventory","module":"Extra","short":"Sell-through rat","extra":true,"rowNames":["Basmati 5kg","Cumfrey 500g","BMC Tonic 200ml","Vitamix 40g","Surf Excel 1kg","Tapal Danedar"],"sliceNames":["Main store","Warehouse A","Warehouse B","In transit"]},{"key":"inventory.dead_stock_value","label":"Dead stock value","shape":"SCALAR","unit":"currency","area":"Inventory","module":"Extra","short":"Dead stock value","extra":true,"rowNames":["Basmati 5kg","Cumfrey 500g","BMC Tonic 200ml","Vitamix 40g","Surf Excel 1kg","Tapal Danedar"],"sliceNames":["Main store","Warehouse A","Warehouse B","In transit"]},{"key":"inventory.value_trend","label":"Stock value trend","shape":"SERIES","unit":"currency","area":"Inventory","module":"Extra","short":"Stock value tren","extra":true,"rowNames":["Basmati 5kg","Cumfrey 500g","BMC Tonic 200ml","Vitamix 40g","Surf Excel 1kg","Tapal Danedar"],"sliceNames":["Main store","Warehouse A","Warehouse B","In transit"]},{"key":"inventory.by_warehouse","label":"Stock by warehouse","shape":"BREAKDOWN","unit":"currency","area":"Inventory","module":"Extra","short":"Stock by warehou","extra":true,"rowNames":["Basmati 5kg","Cumfrey 500g","BMC Tonic 200ml","Vitamix 40g","Surf Excel 1kg","Tapal Danedar"],"sliceNames":["Main store","Warehouse A","Warehouse B","In transit"]},{"key":"inventory.expiry_window","label":"Expiring in 30 days","shape":"RANKING","unit":"count","area":"Inventory","module":"Extra","short":"Expiring in 30 d","extra":true,"rowNames":["Basmati 5kg","Cumfrey 500g","BMC Tonic 200ml","Vitamix 40g","Surf Excel 1kg","Tapal Danedar"],"sliceNames":["Main store","Warehouse A","Warehouse B","In transit"]},{"key":"purchasing.spend_trend","label":"Purchase spend trend","shape":"SERIES","unit":"currency","area":"Purchasing","module":"Extra","short":"Purchase spend t","extra":true,"rowNames":["Metro Supply","Karim Bros","Lahore Foods","Indus Traders","Bahria Wholesale","Ravi Depot"],"sliceNames":["Metro Supply","Karim Bros","Lahore Foods","Indus Traders"]},{"key":"purchasing.by_supplier","label":"Spend by supplier","shape":"BREAKDOWN","unit":"currency","area":"Purchasing","module":"Extra","short":"Spend by supplie","extra":true,"rowNames":["Metro Supply","Karim Bros","Lahore Foods","Indus Traders","Bahria Wholesale","Ravi Depot"],"sliceNames":["Metro Supply","Karim Bros","Lahore Foods","Indus Traders"]},{"key":"purchasing.supplier_concentration","label":"Supplier concentration","shape":"SCALAR","unit":"percent","area":"Purchasing","module":"Extra","short":"Supplier concent","extra":true,"rowNames":["Metro Supply","Karim Bros","Lahore Foods","Indus Traders","Bahria Wholesale","Ravi Depot"],"sliceNames":["Metro Supply","Karim Bros","Lahore Foods","Indus Traders"]},{"key":"purchasing.lead_time","label":"Average lead time","shape":"SCALAR","unit":"count","area":"Purchasing","module":"Extra","short":"Average lead tim","extra":true,"rowNames":["Metro Supply","Karim Bros","Lahore Foods","Indus Traders","Bahria Wholesale","Ravi Depot"],"sliceNames":["Metro Supply","Karim Bros","Lahore Foods","Indus Traders"]},{"key":"purchasing.on_time_rate","label":"On-time delivery","shape":"SCALAR","unit":"percent","area":"Purchasing","module":"Extra","short":"On-time delivery","extra":true,"rowNames":["Metro Supply","Karim Bros","Lahore Foods","Indus Traders","Bahria Wholesale","Ravi Depot"],"sliceNames":["Metro Supply","Karim Bros","Lahore Foods","Indus Traders"]},{"key":"operations.plan_usage","label":"Plan usage","shape":"GAUGE","unit":"percent","area":"Operations","module":"Extra","short":"Plan usage","extra":true,"rowNames":["Bilal Ahmed","Sana Iqbal","Hamza Raza","Noor Fatima","Ayesha Khan","Usman Ali"],"sliceNames":["New","Returning","Dormant"]},{"key":"staff.sales_per_head","label":"Sales per staff member","shape":"SCALAR","unit":"currency","area":"Operations","module":"Extra","short":"Sales per staff ","extra":true,"rowNames":["Bilal Ahmed","Sana Iqbal","Hamza Raza","Noor Fatima","Ayesha Khan","Usman Ali"],"sliceNames":["New","Returning","Dormant"]},{"key":"staff.attendance_rate","label":"Attendance rate","shape":"SCALAR","unit":"percent","area":"Operations","module":"Extra","short":"Attendance rate","extra":true,"rowNames":["Bilal Ahmed","Sana Iqbal","Hamza Raza","Noor Fatima","Ayesha Khan","Usman Ali"],"sliceNames":["New","Returning","Dormant"]},{"key":"operations.open_tickets","label":"Open tickets","shape":"SCALAR","unit":"count","area":"Operations","module":"Extra","short":"Open tickets","extra":true,"rowNames":["Bilal Ahmed","Sana Iqbal","Hamza Raza","Noor Fatima","Ayesha Khan","Usman Ali"],"sliceNames":["New","Returning","Dormant"]},{"key":"party.new_vs_returning","label":"New vs returning","shape":"BREAKDOWN","unit":"count","area":"Operations","module":"Extra","short":"New vs returning","extra":true,"rowNames":["Bilal Ahmed","Sana Iqbal","Hamza Raza","Noor Fatima","Ayesha Khan","Usman Ali"],"sliceNames":["New","Returning","Dormant"]},{"key":"party.retention_rate","label":"Customer retention","shape":"SCALAR","unit":"percent","area":"Operations","module":"Extra","short":"Customer retenti","extra":true,"rowNames":["Bilal Ahmed","Sana Iqbal","Hamza Raza","Noor Fatima","Ayesha Khan","Usman Ali"],"sliceNames":["New","Returning","Dormant"]}];
/* ══ time, scales, formatting ══════════════════════════════════════════════
   Every chart is anchored to real dates so a card can always answer
   "what day is this, and what period am I looking at?"
   ═════════════════════════════════════════════════════════════════════════ */

const MS_H = 3600e3, MS_D = 864e5;
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

/* period → how many points, how far apart, and how each axis tick reads */
const PERIOD = {
  Today:   { n: 12, step: MS_H,     grain: "hour"  },
  Week:    { n: 7,  step: MS_D,     grain: "day"   },
  Month:   { n: 30, step: MS_D,     grain: "day"   },
  Quarter: { n: 13, step: 7 * MS_D, grain: "week"  },
  Year:    { n: 12, step: 30 * MS_D,grain: "month" },
};
const PERIODS = Object.keys(PERIOD);

function anchorNow(){ const d = new Date(); d.setMinutes(0,0,0); return d; }

/** Real timestamps ending now, one per point, spaced by the period's step. */
function timeline(period){
  const { n, step, grain } = PERIOD[period];
  const end = anchorNow();
  if (grain !== "hour") end.setHours(0,0,0,0);
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push(new Date(end.getTime() - i * step));
  return out;
}

/* axis tick label — short, and never ambiguous about which month it is */
function tickLabel(d, grain){
  if (grain === "hour")  return String(d.getHours()).padStart(2,"0") + ":00";
  if (grain === "month") return MON[d.getMonth()];
  return MON[d.getMonth()] + " " + d.getDate();
}
/* tooltip header — the full answer */
function fullLabel(d, grain){
  if (grain === "hour")  return DOW[d.getDay()] + " " + String(d.getHours()).padStart(2,"0") + ":00";
  if (grain === "month") return MON[d.getMonth()] + " " + d.getFullYear();
  if (grain === "week")  return "Week of " + MON[d.getMonth()] + " " + d.getDate();
  return DOW[d.getDay()] + ", " + MON[d.getMonth()] + " " + d.getDate();
}
/* the rolling pill under the axis — split into two stacks */
function tickerParts(d, grain){
  if (grain === "hour")  return { a: DOW[d.getDay()], b: String(d.getHours()).padStart(2,"0") + ":00" };
  if (grain === "month") return { a: String(d.getFullYear()), b: MON[d.getMonth()] };
  return { a: MON[d.getMonth()], b: String(d.getDate()) };
}

/* ── d3-style nice ticks, so the Y axis lands on round numbers ─────────── */
function niceStep(raw){
  const mag = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / mag;
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
}
function niceTicks(min, max, count = 5){
  if (!isFinite(min) || !isFinite(max) || min === max) { max = (max || 1) * 1.2; min = 0; }
  const step = niceStep((max - min) / Math.max(1, count - 1));
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
  const out = [];
  for (let v = lo; v <= hi + step * 1e-9; v += step) out.push(+v.toFixed(10));
  return { ticks: out, lo, hi };
}

/* ── value formatting, by unit ─────────────────────────────────────────── */
function fmtValue(v, unit, compact){
  if (unit === "percent")  return (Math.round(v * 10) / 10) + "%";
  if (unit === "currency") return (compact ? abbrNum(v) : groupNum(Math.round(v)));
  return compact ? abbrNum(v) : groupNum(Math.round(v));
}
function groupNum(n){ return Math.round(n).toLocaleString("en-US"); }
function abbrNum(n){
  const a = Math.abs(n);
  if (a >= 1e9) return (n/1e9).toFixed(1).replace(/\.0$/,"") + "B";
  if (a >= 1e6) return (n/1e6).toFixed(1).replace(/\.0$/,"") + "M";
  if (a >= 1e3) return (n/1e3).toFixed(a >= 1e5 ? 0 : 1).replace(/\.0$/,"") + "K";
  return groupNum(n);
}
function unitPrefix(unit){ return unit === "currency" ? "Rs " : ""; }
function unitSuffix(unit){ return unit === "percent" ? "%" : ""; }

/* ── deterministic demo values, seeded from the reading key ────────────── */
function seed(str){
  let h = 2166136261;
  for (let i = 0; i < str.length; i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
}
/* readings that genuinely swing either side of zero — a profit/loss chart
   is meaningless if the data can only ever be positive */
const SIGNED = /profit|net_|cash_flow|margin|variance/;

/** A plausible business series: a base level, a trend, weekly seasonality, noise. */
function valuesFor(key, period, unit){
  const { n, grain } = PERIOD[period];
  const r = seed(key + "|" + period);
  const base = unit === "percent" ? 20 + r() * 45
             : unit === "currency" ? 40000 + r() * 900000
             : 40 + r() * 900;
  const trend = (r() - 0.4) * 0.5;
  const signed = unit === "currency" && SIGNED.test(key);
  const times = timeline(period);
  const out = [];
  for (let i = 0; i < n; i++){
    const t = times[i];
    const season = grain === "day" ? (t.getDay() === 0 ? -0.22 : t.getDay() === 6 ? 0.16 : 0)
                 : grain === "hour" ? Math.sin((t.getHours() - 8) / 11 * Math.PI) * 0.3 : 0;
    const drift = trend * (i / n);
    const noise = (r() - 0.5) * 0.24;
    let v = base * (1 + drift + season + noise);
    if (unit === "percent") v = Math.max(1, Math.min(99, v));
    else if (signed) v -= base * 0.72;          /* let it cross zero */
    else v = Math.max(0, v);
    out.push(v);
  }
  return out;
}

/** Everything a cartesian card needs: real times, one array per series. */
function buildSeries(keys, period){
  const times = timeline(period), grain = PERIOD[period].grain;
  const series = keys.map((k, i) => {
    const rd = readingOf(k);
    return { key: k, name: rd.label, unit: rd.unit, color: `var(--vq-series-${(i%8)+1})`,
             values: valuesFor(k, period, rd.unit) };
  });
  return { times, grain, series, period,
           tickLabels: times.map(t => tickLabel(t, grain)),
           fullLabels: times.map(t => fullLabel(t, grain)),
           ticker:     times.map(t => tickerParts(t, grain)) };
}

/** Category breakdown for pie / ring / funnel / bar-ranking. */
function buildParts(key, period, names){
  const r = seed(key + "|parts|" + period);
  const rd = readingOf(key);
  const list = (names || ["Cash","Card","Credit","Bank"]).map((n, i) => ({
    name: n, value: Math.round((unitBase(rd.unit)) * (0.3 + r())), color: `var(--vq-series-${(i%8)+1})`
  }));
  list.sort((a,b) => b.value - a.value);
  return { parts: list, total: list.reduce((s,x) => s + x.value, 0), unit: rd.unit };
}
function unitBase(unit){ return unit === "currency" ? 180000 : unit === "percent" ? 22 : 320; }

function readingOf(key){ return READINGS.find(r => r.key === key) || READINGS[0]; }

/* ══ animated numerals + the date ticker ═══════════════════════════════════
   Digits live in a 0-9 column that slides; only the digits that actually
   changed move. Separators and units swap without motion. This is what makes
   a value feel like it *changed* rather than was replaced.
   ═════════════════════════════════════════════════════════════════════════ */

const DIGITS = "0123456789";

/** Shape of a string with every digit flattened — used to detect a rebuild. */
function shapeOf(s){ return String(s).replace(/\d/g, "D"); }

function buildRoller(el, text){
  const s = String(text);
  el.dataset.shape = shapeOf(s);
  el.dataset.value = s;
  let html = "", di = 0;
  for (const ch of s){
    if (DIGITS.includes(ch)){
      html += `<span class="nf-c nf-d"><span class="nf-col" style="transform:translateY(${-ch * 10}%);`
            + `transition-delay:${di * 22}ms">`
            + `<i>0</i><i>1</i><i>2</i><i>3</i><i>4</i><i>5</i><i>6</i><i>7</i><i>8</i><i>9</i>`
            + `</span></span>`;
      di++;
    } else {
      html += `<span class="nf-c nf-s">${ch === " " ? "&nbsp;" : ch}</span>`;
    }
  }
  el.innerHTML = html;
}

/** Set a roller's value. Same shape → digits slide. New shape → rebuild. */
function setRoller(el, text){
  if (!el) return;
  const s = String(text);
  if (el.dataset.value === s) return;
  if (el.dataset.shape !== shapeOf(s)){ buildRoller(el, s); return; }
  el.dataset.value = s;
  const cols = el.querySelectorAll(".nf-d .nf-col");
  let i = 0;
  for (const ch of s){
    if (DIGITS.includes(ch)){
      const col = cols[i++];
      if (col) col.style.transform = `translateY(${-ch * 10}%)`;
    }
  }
}

/** Markup for a roller that some later call will drive. */
function rollerHTML(text, cls = ""){
  const tmp = document.createElement("span");
  tmp.className = "nf " + cls;
  buildRoller(tmp, text);
  return tmp.outerHTML;
}

/* ── date ticker — month and day stacks that scroll to the hovered point ── */
function tickerHTML(parts){
  const stack = (items, key) =>
    `<span class="dt-win"><span class="dt-col" data-k="${key}">`
    + items.map(t => `<i>${t}</i>`).join("") + `</span></span>`;
  /* De-duplicated runs for the coarse stack, one entry per point for the fine one */
  const coarse = [], coarseIndex = [];
  parts.forEach(p => {
    if (!coarse.length || coarse[coarse.length - 1] !== p.a) coarse.push(p.a);
    coarseIndex.push(coarse.length - 1);
  });
  return `<span class="dt" data-coarse="${coarseIndex.join(",")}">`
       + stack(coarse, "a") + stack(parts.map(p => p.b), "b") + `</span>`;
}
const TICK_H = 20;   /* must match .dt-win / .dt-col i in the stylesheet */
function setTicker(el, index){
  if (!el) return;
  const map = (el.dataset.coarse || "").split(",").map(Number);
  const a = el.querySelector('.dt-col[data-k="a"]'), b = el.querySelector('.dt-col[data-k="b"]');
  /* translate in pixels — the column is N items tall, so a percentage here
     would scroll by the whole stack instead of one row */
  if (a) a.style.transform = `translateY(${-(map[index] || 0) * TICK_H}px)`;
  if (b) b.style.transform = `translateY(${-index * TICK_H}px)`;
}

/* ══ chart engine ══════════════════════════════════════════════════════════
   Charts mount into a measured host so text and dots are drawn in real
   pixels. Every cartesian chart gets: a Y axis with round numbers, a dated X
   axis, a crosshair that snaps to the nearest point, a tooltip carrying every
   series' value, and a headline that re-reads to the hovered point.
   ═════════════════════════════════════════════════════════════════════════ */

let CHART_UID = 0;

/* ── variants, per chart type ──────────────────────────────────────────── */
const VARIANTS = {
  area:     [["gradient","Gradient fill"],["solid","Solid fill"],["pattern","Pattern fill"],
             ["step","Stepped"],["stacked","Stacked"],["nofill","Line only"]],
  line:     [["smooth","Smooth"],["linear","Linear"],["step","Stepped"],
             ["dots","With points"],["dashtail","Dashed tail"],["thick","Heavy stroke"]],
  bar:      [["rounded","Rounded"],["square","Square"],["thin","Thin columns"],
             ["grouped","Grouped"],["stacked","Stacked"],["pattern","Pattern fill"]],
  composed: [["bar-trend","Bar + trend line"],["bar-line-area","Bar + line + area"],["bar-two-lines","Bar + two lines"],
             ["stacked-line","Stacked bars + line"],["pattern","Pattern fills"],
             ["thin-columns","Thin columns"],["area-bar","Area + bar"]],
  pl:       [["split","Split fill"],["bars","Diverging bars"],["line","Line only"]],
  live:     [["pulse","Pulsing head"],["trail","Fading trail"],["dots","With points"]],
  pie:      [["solid","Solid"],["donut","Donut"],["exploded","Exploded"],["pattern","Pattern"]],
  ring:     [["concentric","Concentric rings"],["single","Single ring"],["thick","Heavy stroke"]],
  sunburst: [["two-level","Two level"],["three-level","Three level"]],
  gauge:    [["arc","Arc"],["notch","Notched"],["full","Full circle"]],
  funnel:   [["centered","Centered"],["left","Left aligned"],["stepped","Stepped"]],
  radar:    [["filled","Filled"],["outline","Outline"],["dots","With points"]],
  scatter:  [["dots","Dots"],["bubble","Bubble"],["trend","With trend line"]],
  heatmap:  [["square","Square cells"],["rounded","Rounded cells"],["dots","Dot scale"]],
  table:    [["rows","Rows"],["bars","With bars"],["rank","Ranked"]],
  feed:     [["dots","Dots"],["bars","With bars"]],
  stat:     [["number","Number only"],["spark","Sparkline"],["delta","Period comparison"],["plain","Min / avg / max"]],
  sparkline:[["area","Area"],["line","Line"],["bars","Bars"]],
  status:   [["chip","Chip"],["dot","Dot"]],
  treemap:  [["nested","Nested"]],
  sankey:   [["flow","Flow"],["thin","Thin links"]],
  choropleth:[["grid","Region grid"],["list","Ranked list"]],
};
const variantsOf = c => VARIANTS[c] || [["default","Default"]];
const defaultVariant = c => variantsOf(c)[0][0];

/* which charts are cartesian (share the axis + crosshair engine) */
const CARTESIAN = new Set(["area","line","bar","composed","pl","live"]);
const RADIAL    = new Set(["pie","ring","sunburst"]);

/* ── path builders ─────────────────────────────────────────────────────── */
const P = (x,y) => `${x.toFixed(1)} ${y.toFixed(1)}`;
function pathLinear(pts){ return "M" + pts.map(p => P(p[0],p[1])).join(" L"); }
function pathStep(pts){
  let d = "M" + P(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++){
    const mx = (pts[i-1][0] + pts[i][0]) / 2;
    d += ` L${P(mx, pts[i-1][1])} L${P(mx, pts[i][1])} L${P(pts[i][0], pts[i][1])}`;
  }
  return d;
}
/* Catmull-Rom → cubic bezier, alpha ≈ 0.42 like the reference */
function pathSmooth(pts, t = 0.42){
  if (pts.length < 3) return pathLinear(pts);
  let d = "M" + P(pts[0][0], pts[0][1]);
  for (let i = 0; i < pts.length - 1; i++){
    const p0 = pts[i-1] || pts[i], p1 = pts[i], p2 = pts[i+1], p3 = pts[i+2] || p2;
    const c1 = [p1[0] + (p2[0]-p0[0]) * t/3, p1[1] + (p2[1]-p0[1]) * t/3];
    const c2 = [p2[0] - (p3[0]-p1[0]) * t/3, p2[1] - (p3[1]-p1[1]) * t/3];
    d += ` C${P(c1[0],c1[1])} ${P(c2[0],c2[1])} ${P(p2[0],p2[1])}`;
  }
  return d;
}
function curveFor(variant){
  return variant === "step" ? pathStep : variant === "linear" ? pathLinear : pathSmooth;
}

/* ── the cartesian engine ──────────────────────────────────────────────── */
function mountCartesian(host, card){
  const { W, H } = hostDimensions(host, card);
  const keys = [card.key, ...(card.extraKeys || [])];
  const ds = buildSeries(keys, card.period);
  const uid = "ck" + (++CHART_UID);
  const variant = card.variant || defaultVariant(card.chart);

  /* split series across a left and right axis when units disagree, so a
     rupee series and a percentage series can share one card honestly */
  const units = [...new Set(ds.series.map(s => s.unit))];
  const rightUnit = units.length > 1 ? units[1] : null;
  const axisOf = s => (rightUnit && s.unit === rightUnit) ? "right" : "left";

  const m = { l: 48, r: rightUnit ? 48 : 12, t: 12, b: 30 };
  const pw = Math.max(20, W - m.l - m.r), ph = Math.max(20, H - m.t - m.b);

  const domainFor = side => {
    const vals = ds.series.filter(s => axisOf(s) === side).flatMap(s => s.values);
    if (!vals.length) return null;
    const stacked = /stacked/.test(variant) && ds.series.length > 1;
    const hi = stacked
      ? Math.max(...ds.times.map((_,i) => ds.series.reduce((a,s) => a + s.values[i], 0)))
      : Math.max(...vals);
    return niceTicks(Math.min(0, Math.min(...vals)), hi, 5);
  };
  const L = domainFor("left"), Rt = rightUnit ? domainFor("right") : null;
  const yOf = (v, side) => {
    const D = side === "right" ? Rt : L;
    return m.t + ph - ((v - D.lo) / (D.hi - D.lo || 1)) * ph;
  };
  const n = ds.times.length;
  const xOf = i => m.l + (n === 1 ? pw/2 : (i * pw) / (n - 1));
  const bandW = pw / n;

  /* ── axes ── */
  const yLabels = (D, side) => D.ticks.map(v =>
    `<text class="ck-lab" x="${side === "right" ? W - m.r + 8 : m.l - 8}" y="${(yOf(v, side) + 4).toFixed(1)}"
      text-anchor="${side === "right" ? "start" : "end"}">${fmtValue(v, side === "right" ? rightUnit : ds.series[0].unit, true)}</text>`).join("");
  const grid = L.ticks.map(v =>
    `<line class="ck-grid" x1="${m.l}" x2="${W - m.r}" y1="${yOf(v,"left").toFixed(1)}" y2="${yOf(v,"left").toFixed(1)}"/>`).join("");

  const maxXT = Math.max(2, Math.floor(pw / 66));
  const stepXT = Math.max(1, Math.ceil(n / maxXT));
  const keep = new Set();
  for (let i = 0; i < n; i += stepXT) keep.add(i);
  keep.add(n - 1);
  /* the stepped run can land right next to the final tick — drop it if so */
  const sorted = [...keep].sort((a,b) => a-b);
  if (sorted.length > 1 && (n - 1 - sorted[sorted.length - 2]) < stepXT) keep.delete(sorted[sorted.length - 2]);
  const xLabels = ds.tickLabels.map((t, i) => keep.has(i)
    ? `<text class="ck-lab" x="${xOf(i).toFixed(1)}" y="${H - 8}" text-anchor="${i === 0 ? "start" : i === n-1 ? "end" : "middle"}">${t}</text>`
    : "").join("");

  /* ── series marks ── */
  const defs = [], marks = [];
  const stackTop = new Array(n).fill(0);
  const isStacked = /stacked/.test(variant) && ds.series.length > 1;

  /* z-order: areas wash underneath, bars sit on them, lines read on top —
     otherwise a later area fill paints over earlier columns */
  const Z = { area: 0, bar: 1, line: 2 };
  const order = ds.series.map((s, si) => si)
    .sort((a, b) => Z[roleFor(card.chart, variant, a)] - Z[roleFor(card.chart, variant, b)]);

  order.forEach(si => {
    const s = ds.series[si];
    const side = axisOf(s);
    const pts = s.values.map((v, i) => [xOf(i), yOf(isStacked ? (stackTop[i] += v) : v, side)]);
    const role = roleFor(card.chart, variant, si);
    const gid = `${uid}-g${si}`;

    if (role === "bar"){
      const groupN = card.chart === "bar" && variant === "grouped" ? ds.series.length : 1;
      const bw = Math.min(22, Math.max(3, bandW * (variant === "thin" ? 0.22 : variant === "thin-columns" ? 0.3 : 0.55) / groupN));
      const rx = variant === "square" ? 0 : Math.min(4, bw / 2);
      const off = groupN > 1 ? (si - (groupN - 1) / 2) * bw : 0;
      const fill = variant === "pattern" && si === 0 ? `url(#${uid}-pat)` : s.color;
      if (variant === "pattern" && si === 0) defs.push(patternDef(`${uid}-pat`, s.color));
      marks.push(`<g class="ck-s ck-s--bar" data-i="${si}">` + s.values.map((v, i) => {
        const y0 = isStacked ? yOf(stackTop[i], side) : yOf(v, side);
        const base = yOf(Math.max(0, L.lo), side);
        const yTop = Math.min(y0, base), hgt = Math.max(1.5, Math.abs(base - y0));
        return `<rect class="ck-bar" data-x="${i}" x="${(xOf(i) - bw/2 + off).toFixed(1)}" y="${yTop.toFixed(1)}"
          width="${bw.toFixed(1)}" height="${hgt.toFixed(1)}" rx="${rx}" fill="${fill}"/>`;
      }).join("") + `</g>`);
    }
    else if (role === "area"){
      const curve = curveFor(variant === "step" ? "step" : "smooth");
      const base = yOf(Math.max(0, L.lo), side);
      const solid = variant === "solid", pat = variant === "pattern";
      if (pat) defs.push(patternDef(`${uid}-pa${si}`, s.color));
      else defs.push(`<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${s.color}" stop-opacity="${solid ? .45 : .3}"/>
        <stop offset="100%" stop-color="${s.color}" stop-opacity="${solid ? .28 : 0}"/></linearGradient>`);
      const fill = pat ? `url(#${uid}-pa${si})` : `url(#${gid})`;
      const areaPath = variant === "nofill" ? ""
        : `<path class="ck-area" d="${curve(pts)} L${P(pts[n-1][0], base)} L${P(pts[0][0], base)} Z" fill="${fill}"/>`;
      marks.push(`<g class="ck-s" data-i="${si}">${areaPath}
        <path class="ck-line" d="${curve(pts)}" stroke="${s.color}"/></g>`);
    }
    else { /* line */
      const curve = curveFor(variant === "step" ? "step" : variant === "linear" ? "linear" : "smooth");
      const dash = variant === "dashtail" ? ` stroke-dasharray="6 5"` : "";
      const sw = variant === "thick" ? 3.5 : 2.5;
      const dots = (variant === "dots" || variant === "trend")
        ? pts.map(p => `<circle class="ck-pt" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" fill="${s.color}"/>`).join("") : "";
      /* the trail fades the history out behind the head instead of pulsing it */
      let body;
      if (card.chart === "live" && variant === "trail"){
        const seg = [];
        for (let k = 1; k < n; k++){
          seg.push(`<path class="ck-line" d="${pathLinear([pts[k-1], pts[k]])}" stroke="${s.color}"
            stroke-width="${sw}" opacity="${(0.08 + 0.92 * (k / (n-1))).toFixed(2)}"/>`);
        }
        body = seg.join("");
      } else {
        body = `<path class="ck-line" d="${curve(pts)}" stroke="${s.color}" stroke-width="${sw}"${dash}/>`;
      }
      const head = card.chart === "live" && si === 0
        ? `<circle class="${variant === "trail" ? "ck-cap" : "ck-pulse"}" cx="${pts[n-1][0].toFixed(1)}"
             cy="${pts[n-1][1].toFixed(1)}" r="4.5" fill="${s.color}"/>` : "";
      marks.push(`<g class="ck-s" data-i="${si}">${body}${dots}${head}</g>`);
    }
  });

  /* bar + trend: the same series drawn twice — columns for the level, a
     smoothed line for the direction. Works with a single reading. */
  if (card.chart === "composed" && variant === "bar-trend" && ds.series.length === 1){
    const s0 = ds.series[0], side = axisOf(s0);
    const pts = s0.values.map((v,i) => [xOf(i), yOf(v, side)]);
    marks.push(`<g class="ck-s" data-i="${ds.series.length}">
      <path class="ck-line" d="${pathSmooth(pts)}" stroke="var(--vq-series-3)" stroke-width="2.5"/></g>`);
  }

  /* profit / loss gets a diverging split around zero */
  if (card.chart === "pl"){
    marks.length = 0;
    const s = ds.series[0], zero = yOf(0, "left");
    const pts = s.values.map((v,i) => [xOf(i), yOf(v, "left")]);
    const d = pathSmooth(pts);
    if (variant === "bars"){
      const bw = Math.max(2, bandW * 0.6);
      marks.push(`<g class="ck-s" data-i="0">` + s.values.map((v,i) => {
        const y = yOf(v, "left"), up = v >= 0;
        return `<rect class="ck-bar" data-x="${i}" x="${(xOf(i) - bw/2).toFixed(1)}"
          y="${Math.min(y, zero).toFixed(1)}" width="${bw.toFixed(1)}"
          height="${Math.max(1.5, Math.abs(zero - y)).toFixed(1)}" rx="3"
          fill="var(--vq-div-${up ? "pos" : "neg"}-2)"/>`;
      }).join("")
      + `<line class="ck-zero" x1="${m.l}" x2="${W-m.r}" y1="${zero.toFixed(1)}" y2="${zero.toFixed(1)}"/></g>`);
    } else if (variant === "line"){
      marks.push(`<g class="ck-s" data-i="0">
        <line class="ck-zero" x1="${m.l}" x2="${W-m.r}" y1="${zero.toFixed(1)}" y2="${zero.toFixed(1)}"/>
        <path class="ck-line" d="${d}" stroke="var(--vq-series-1-ink)" stroke-width="2.5"/>
        ${s.values.map((v,i) => `<circle class="ck-pt" cx="${xOf(i).toFixed(1)}" cy="${yOf(v,"left").toFixed(1)}"
          r="3.5" fill="var(--vq-div-${v >= 0 ? "pos" : "neg"}-2)"/>`).join("")}</g>`);
    } else {
    defs.push(`<clipPath id="${uid}-up"><rect x="0" y="0" width="${W}" height="${zero.toFixed(1)}"/></clipPath>
               <clipPath id="${uid}-dn"><rect x="0" y="${zero.toFixed(1)}" width="${W}" height="${(H-zero).toFixed(1)}"/></clipPath>`);
    const areaD = `${d} L${P(pts[n-1][0], zero)} L${P(pts[0][0], zero)} Z`;
    marks.push(`<g class="ck-s" data-i="0">
      <path d="${areaD}" fill="var(--vq-div-pos-1)" opacity=".5" clip-path="url(#${uid}-up)"/>
      <path d="${areaD}" fill="var(--vq-div-neg-1)" opacity=".5" clip-path="url(#${uid}-dn)"/>
      <line class="ck-zero" x1="${m.l}" x2="${W-m.r}" y1="${zero.toFixed(1)}" y2="${zero.toFixed(1)}"/>
      <path class="ck-line" d="${d}" stroke="var(--vq-series-1-ink)"/></g>`);
    }
  }

  /* ── hover furniture ── */
  const dots = ds.series.map((s, si) =>
    `<circle class="ck-hd" data-i="${si}" r="4.5" fill="var(--vq-surface)" stroke="${s.color}" stroke-width="2.5"/>`).join("");

  host.innerHTML = `
    <svg class="ck" width="${W}" height="${H}" role="img">
      <defs>${defs.join("")}</defs>
      <g class="ck-grids">${grid}</g>
      <g class="ck-axis">${yLabels(L, "left")}${Rt ? yLabels(Rt, "right") : ""}${xLabels}</g>
      <g class="ck-plot" style="clip-path:inset(0 100% 0 0)">${marks.join("")}</g>
      <g class="ck-hover" style="opacity:0">
        <line class="ck-cross" y1="${m.t}" y2="${m.t + ph}"/>
        ${dots}
      </g>
      <rect class="ck-cap" x="${m.l}" y="${m.t}" width="${pw}" height="${ph}" fill="transparent"/>
    </svg>
    <div class="ck-tip" hidden></div>
    <div class="ck-ticker" hidden>${tickerHTML(ds.ticker)}</div>`;

  requestAnimationFrame(() => {
    const plot = host.querySelector(".ck-plot");
    if (plot) plot.style.clipPath = "inset(0 0% 0 0)";
  });

  wireCartesian(host, card, ds, { xOf, yOf, axisOf, m, pw, ph, W, H, bandW, n });
}

function roleFor(chart, variant, si){
  if (chart === "bar") return "bar";
  if (chart === "area") return si === 0 ? "area" : (variant === "stacked" ? "area" : "line");
  if (chart === "line" || chart === "live" || chart === "pl") return "line";
  if (chart === "composed"){
    if (variant === "bar-trend")      return si === 0 ? "bar" : "line";
    if (variant === "bar-two-lines")  return si === 0 ? "bar"  : "line";
    if (variant === "area-bar")       return si === 0 ? "area" : "bar";
    if (variant === "stacked-line")   return si < 2 ? "bar" : "line";
    return si === 0 ? "bar" : si === 1 ? "area" : "line";
  }
  return "line";
}
function patternDef(id, color){
  return `<pattern id="${id}" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="7" height="7" fill="${color}" opacity=".22"/>
    <line x1="0" y1="0" x2="0" y2="7" stroke="${color}" stroke-width="3"/></pattern>`;
}

/* ── interaction: snap to nearest point, report every series ───────────── */
function wireCartesian(host, card, ds, g){
  const svg   = host.querySelector(".ck");
  const cap   = host.querySelector(".ck-cap");
  const hover = host.querySelector(".ck-hover");
  const cross = host.querySelector(".ck-cross");
  const tip   = host.querySelector(".ck-tip");
  const tick  = host.querySelector(".ck-ticker");
  const tickEl= host.querySelector(".dt");
  const plot  = host.querySelector(".ck-plot");
  const head  = host.closest(".vqc")?.querySelector(".vqc-head-val .nf");
  const headSub = host.closest(".vqc")?.querySelector(".vqc-head-when");
  const hds   = [...host.querySelectorAll(".ck-hd")];
  const bars  = [...host.querySelectorAll(".ck-bar")];
  let active = -1;

  const restText = () => {
    const s0 = ds.series[0], last = s0.values[s0.values.length - 1];
    return { v: unitPrefix(s0.unit) + fmtValue(last, s0.unit) , when: rangeLabel(ds) };
  };

  function show(i){
    if (i === active) return;
    active = i;
    hover.style.opacity = "1";
    plot.classList.add("is-hovering");
    const x = g.xOf(i);
    cross.style.transform = `translateX(${x.toFixed(1)}px)`;
    ds.series.forEach((s, si) => {
      const d = hds[si]; if (!d) return;
      d.style.transform = `translate(${x.toFixed(1)}px, ${g.yOf(s.values[i], g.axisOf(s)).toFixed(1)}px)`;
    });
    bars.forEach(b => b.classList.toggle("is-on", +b.dataset.x === i));
    tip.hidden = false;
    tip.innerHTML = `<p class="ck-tip-h">${ds.fullLabels[i]}</p>`
      + ds.series.map(s => `<span class="ck-tip-r"><span class="ck-tip-d" style="background:${s.color}"></span>
          <span class="ck-tip-n">${s.name}</span>
          <b class="ck-tip-v">${unitPrefix(s.unit)}${fmtValue(s.values[i], s.unit)}</b></span>`).join("");
    const tw = tip.offsetWidth || 150;
    tip.style.left = Math.max(4, Math.min(g.W - tw - 4, x - tw / 2)) + "px";
    tick.hidden = false;
    tick.style.left = x.toFixed(1) + "px";
    setTicker(tickEl, i);
    if (head) setRoller(head, unitPrefix(ds.series[0].unit) + fmtValue(ds.series[0].values[i], ds.series[0].unit));
    if (headSub) headSub.textContent = ds.fullLabels[i];
  }
  function clear(){
    active = -1;
    hover.style.opacity = "0";
    plot.classList.remove("is-hovering");
    bars.forEach(b => b.classList.remove("is-on"));
    tip.hidden = true; tick.hidden = true;
    const r = restText();
    if (head) setRoller(head, r.v);
    if (headSub) headSub.textContent = r.when;
  }
  const idxFrom = ev => {
    const r = svg.getBoundingClientRect();
    const x = ev.clientX - r.left;
    return Math.max(0, Math.min(g.n - 1, Math.round((x - g.m.l) / (g.pw / Math.max(1, g.n - 1)))));
  };
  cap.addEventListener("mousemove", e => show(idxFrom(e)));
  cap.addEventListener("mouseleave", clear);
  cap.addEventListener("touchmove", e => { e.preventDefault(); show(idxFrom(e.touches[0])); }, { passive:false });
  cap.addEventListener("touchend", clear);
}

function rangeLabel(ds){
  const a = ds.times[0], b = ds.times[ds.times.length - 1];
  const f = d => tickLabel(d, ds.grain);
  return ds.period === "Today" ? `Today · ${f(a)}–${f(b)}` : `${ds.period} · ${f(a)} – ${f(b)}`;
}

/* ── radial: legend hover swaps the centre, other slices dim ───────────── */
function mountRadial(host, card){
  const { W: HW, H: HH } = hostDimensions(host, card);
  const pd0 = buildParts(card.key, card.period, readingOf(card.key).sliceNames);
  const legH = Math.min(HH * 0.5, pd0.parts.length * 30 + 6);
  const size = Math.max(84, Math.min(HW, HH - legH - 8, 210));
  const pd = pd0;
  const variant = card.variant || defaultVariant(card.chart);
  const cx = size/2, cy = size/2, R = size/2 - 4;
  const inner = card.chart === "pie"
    ? (variant === "donut" ? R * 0.58 : 0)
    : R * 0.56;

  let arcs = "", pdefs = "";
  if (card.chart === "ring" && variant === "thick"){
    /* one heavy ring carrying the leading share, not a stack of thin ones */
    const frac = pd.parts[0].value / pd.total;
    arcs = `<path class="ck-track" d="${arcPath(cx,cy,R*0.44,R,0,1)}" fill="var(--vq-chart-track-data)"/>`
         + `<path class="ck-seg" data-i="0" d="${arcPath(cx,cy,R*0.44,R,0,frac)}" fill="${pd.parts[0].color}"/>`;
  } else if (card.chart === "sunburst" && variant === "three-level"){
    const band = (R - R*0.3) / 3;
    for (let lvl = 0; lvl < 3; lvl++){
      const r1 = R - lvl*band, r0 = r1 - band*0.86;
      const set = pd.parts.slice(0, 4 - lvl);
      const tot = set.reduce((a,b)=>a+b.value,0) || 1;
      let a = 0;
      set.forEach((p, i) => { const f = p.value / tot;
        arcs += `<path class="ck-seg" data-i="${i}" d="${arcPath(cx,cy,r0,r1,a,a+f)}" fill="${p.color}"
                  stroke="var(--vq-chart-surface)" stroke-width="1.5" opacity="${(1 - lvl*0.18).toFixed(2)}"/>`;
        a += f; });
    }
  } else if (card.chart === "ring" && variant !== "single"){
    /* concentric rings — one track + one value arc per part */
    const band = (R - inner) / pd.parts.length;
    pd.parts.forEach((p, i) => {
      const r1 = R - i * band, r0 = r1 - band * 0.72;
      const frac = p.value / pd.parts[0].value;
      arcs += `<path class="ck-track" d="${arcPath(cx,cy,r0,r1,0,1)}" fill="var(--vq-chart-track-data)"/>`
           +  `<path class="ck-seg" data-i="${i}" d="${arcPath(cx,cy,r0,r1,0,Math.min(1,frac))}" fill="${p.color}"/>`;
    });
  } else {
    let a = 0;
    pd.parts.forEach((p, i) => {
      const f = p.value / pd.total;
      const pop = variant === "exploded" ? 4 : 0;
      let fill = p.color;
      if (variant === "pattern"){
        const pid = `${"pt" + (++CHART_UID)}`;
        pdefs += patternDef(pid, p.color);
        fill = `url(#${pid})`;
      }
      arcs += `<path class="ck-seg" data-i="${i}" d="${arcPath(cx,cy,inner,R - (i%2?pop:0),a,a+f)}" fill="${fill}"
                stroke="var(--vq-chart-surface)" stroke-width="2"/>`;
      a += f;
    });
  }

  const centreV = unitPrefix(pd.unit) + fmtValue(pd.total, pd.unit, true);
  host.innerHTML = `
    <div class="ck-radial">
      <div class="ck-dial" style="width:${size}px;height:${size}px">
        <svg width="${size}" height="${size}" class="ck-rsvg"><defs>${pdefs}</defs>${arcs}</svg>
        ${inner > 0 || card.chart === "ring" ? `<span class="ck-centre">
          <span class="ck-centre-v">${rollerHTML(centreV)}</span>
          <span class="ck-centre-k">${centreLabel(card)}</span></span>` : ""}
      </div>
      <div class="ck-leg">${pd.parts.map((p,i) => `
        <button class="ck-leg-r" data-i="${i}">
          <span class="ck-leg-d" style="background:${p.color}"></span>
          <span class="ck-leg-n">${p.name}</span>
          <span class="ck-leg-v">${unitPrefix(pd.unit)}${fmtValue(p.value, pd.unit, true)}</span>
          <span class="ck-leg-p">${Math.round(p.value / pd.total * 100)}%</span>
          <span class="ck-leg-bar"><i style="width:${(p.value/pd.parts[0].value*100).toFixed(0)}%;background:${p.color}"></i></span>
        </button>`).join("")}</div>
    </div>`;

  const dial = host.querySelector(".ck-dial");
  const nf   = host.querySelector(".ck-centre-v .nf");
  const lab  = host.querySelector(".ck-centre-k");
  const segs = [...host.querySelectorAll(".ck-seg")];
  host.querySelectorAll(".ck-leg-r").forEach(btn => {
    const i = +btn.dataset.i;
    const on = () => {
      dial.classList.add("is-focus");
      segs.forEach(s => s.classList.toggle("is-dim", +s.dataset.i !== i));
      host.querySelectorAll(".ck-leg-r").forEach(r => r.classList.toggle("is-dim", +r.dataset.i !== i));
      btn.classList.add("is-on");
      setRoller(nf, unitPrefix(pd.unit) + fmtValue(pd.parts[i].value, pd.unit, true));
      if (lab) lab.textContent = pd.parts[i].name;
    };
    const off = () => {
      dial.classList.remove("is-focus");
      segs.forEach(s => s.classList.remove("is-dim"));
      host.querySelectorAll(".ck-leg-r").forEach(r => r.classList.remove("is-dim","is-on"));
      setRoller(nf, centreV);
      if (lab) lab.textContent = centreLabel(card);
    };
    btn.addEventListener("mouseenter", on);
    btn.addEventListener("focus", on);
    btn.addEventListener("mouseleave", off);
    btn.addEventListener("blur", off);
  });
  segs.forEach(s => {
    s.addEventListener("mouseenter", () =>
      host.querySelector(`.ck-leg-r[data-i="${s.dataset.i}"]`)?.dispatchEvent(new Event("mouseenter")));
    s.addEventListener("mouseleave", () =>
      host.querySelector(`.ck-leg-r[data-i="${s.dataset.i}"]`)?.dispatchEvent(new Event("mouseleave")));
  });
}
/* the centre has room for about a dozen characters — say "Total", not a
   truncated copy of the card title that is already above it */
function centreLabel(card){
  const rd = readingOf(card.key);
  return rd.unit === "currency" ? "Total" : rd.unit === "percent" ? "Share" : "All";
}
function arcPath(cx, cy, r0, r1, f0, f1){
  const TAU = Math.PI * 2, a0 = -Math.PI/2 + f0*TAU, a1 = -Math.PI/2 + f1*TAU;
  const big = (f1 - f0) > 0.5 ? 1 : 0;
  if (f1 - f0 >= 0.9999){
    return `M${P(cx-r1,cy)}A${r1} ${r1} 0 1 1 ${P(cx+r1,cy)}A${r1} ${r1} 0 1 1 ${P(cx-r1,cy)}Z`
         + (r0 > 0 ? `M${P(cx-r0,cy)}A${r0} ${r0} 0 1 0 ${P(cx+r0,cy)}A${r0} ${r0} 0 1 0 ${P(cx-r0,cy)}Z` : "");
  }
  const x = (r,a) => cx + r*Math.cos(a), y = (r,a) => cy + r*Math.sin(a);
  return `M${P(x(r1,a0),y(r1,a0))}A${r1} ${r1} 0 ${big} 1 ${P(x(r1,a1),y(r1,a1))}`
       + `L${P(x(r0,a1),y(r0,a1))}A${r0} ${r0} 0 ${big} 0 ${P(x(r0,a0),y(r0,a0))}Z`;
}

/* ══ the remaining chart families ══════════════════════════════════════════ */

function mountGauge(host, card){
  const { W, H } = hostDimensions(host, card);
  const S = Math.min(W, H);
  const size = Math.max(90, Math.min(S - 16, 250));
  const rd = readingOf(card.key);
  const vals = valuesFor(card.key, card.period, rd.unit);
  const v = vals[vals.length - 1];
  const max = rd.unit === "percent" ? 100 : Math.ceil(Math.max(...vals) * 1.25);
  const frac = Math.max(0, Math.min(1, v / max));
  const variant = card.variant || "arc";
  const cx = size/2, cy = size/2, R = size/2 - 6, w = Math.max(9, size * 0.075);
  const span = variant === "full" ? 1 : 0.75;
  const rot = variant === "full" ? 0 : 0.625;
  const arc = (f, cls, col) => `<path class="${cls}" d="${arcPath(cx,cy,R-w,R, rot, rot + span*f)}" fill="${col}"/>`;
  let notches = "";
  if (variant === "notch"){
    notches = Array.from({length: 28}, (_, i) => {
      const f = i / 27, on = f <= frac;
      const a = (rot + span * f) * Math.PI * 2 - Math.PI/2;
      const x1 = cx + (R-w)*Math.cos(a), y1 = cy + (R-w)*Math.sin(a);
      const x2 = cx + R*Math.cos(a),     y2 = cy + R*Math.sin(a);
      return `<line class="ck-notch${on?" is-on":""}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}"
        x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" style="--d:${i*22}ms"/>`;
    }).join("");
  }
  host.innerHTML = `<div class="ck-radial">
    <div class="ck-dial" style="width:${size}px;height:${size}px">
      <svg width="${size}" height="${size}" class="ck-rsvg">
        ${variant === "notch" ? notches
          : arc(1,"ck-track","var(--vq-chart-track-data)") + arc(frac,"ck-seg","var(--vq-series-1-ink)")}
      </svg>
      <span class="ck-centre">
        <span class="ck-centre-v">${rollerHTML(unitPrefix(rd.unit) + fmtValue(v, rd.unit, true))}</span>
        <span class="ck-centre-k">of ${fmtValue(max, rd.unit, true)}</span></span>
    </div></div>`;
}

function mountFunnel(host, card){
  const H = Math.max(90, host.clientHeight);
  const LAB = 150;                                  /* the label column, in px */
  const W = Math.max(80, host.clientWidth - LAB - 16);
  const pd = buildParts(card.key, card.period, readingOf(card.key).rowNames);
  const rows = pd.parts.slice(0, 5), mx = rows[0].value, rh = H / rows.length;
  const variant = card.variant || "centered";
  const shapes = rows.map((p, i) => {
    const bw = (p.value / mx) * W * 0.94;
    const x = variant === "left" ? 0 : (W - bw) / 2;
    return `<rect class="ck-fn" data-i="${i}" x="${x.toFixed(1)}" y="${(i*rh+3).toFixed(1)}"
      width="${bw.toFixed(1)}" height="${(rh-6).toFixed(1)}" rx="${variant==="stepped"?2:6}" fill="${p.color}" style="--d:${i*70}ms"/>`;
  }).join("");
  host.innerHTML = `<div class="ck-fnw">
    <svg width="${W}" height="${H}" class="ck-fsvg" viewBox="0 0 ${W} ${H}">${shapes}</svg>
    <div class="ck-fnl" style="width:${LAB}px">${rows.map((p,i) => `<div class="ck-fnr" data-i="${i}">
      <span>${p.name}</span><b>${unitPrefix(pd.unit)}${fmtValue(p.value, pd.unit, true)}</b>
      <em>${Math.round(p.value/mx*100)}%</em></div>`).join("")}</div></div>`;
  linkRows(host, ".ck-fn", ".ck-fnr");
}

function mountRadar(host, card){
  const { W, H } = hostDimensions(host, card);
  const S = Math.max(120, Math.min(W - 20, H - 20));
  const pd = buildParts(card.key, card.period, (readingOf(card.key).rowNames || []).slice(0,6));
  const ax = pd.parts.slice(0,6), n = ax.length, mx = Math.max(...ax.map(p=>p.value));
  const cx = S/2, cy = S/2, R = S/2 - 38;
  const variant = card.variant || "filled";
  const pt = (i,f) => { const a = -Math.PI/2 + 2*Math.PI*i/n; return [cx + R*f*Math.cos(a), cy + R*f*Math.sin(a)]; };
  const rings = [0.25,0.5,0.75,1].map(k =>
    `<polygon class="ck-rgrid" points="${ax.map((_,i)=>pt(i,k).map(v=>v.toFixed(1)).join(",")).join(" ")}"/>`).join("");
  const spokes = ax.map((_,i)=>{ const [x,y]=pt(i,1);
    return `<line class="ck-rgrid" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`; }).join("");
  const poly = ax.map((p,i)=>pt(i,p.value/mx).map(v=>v.toFixed(1)).join(",")).join(" ");
  const dots = variant === "dots" ? ax.map((p,i)=>{ const [x,y]=pt(i,p.value/mx);
    return `<circle class="ck-pt" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="var(--vq-series-1-ink)"/>`; }).join("") : "";
  const labs = ax.map((p,i)=>{ const [x,y]=pt(i,1.17);
    return `<text class="ck-lab" x="${x.toFixed(1)}" y="${(y+4).toFixed(1)}" text-anchor="middle">${p.name.slice(0,10)}</text>`; }).join("");
  host.innerHTML = `<div class="ck-radial"><svg width="${S}" height="${S}" class="ck-rsvg">
    ${rings}${spokes}
    <polygon class="ck-rpoly" points="${poly}" fill="${variant==="outline"?"none":"var(--vq-series-1-ink)"}"
      fill-opacity="${variant==="outline"?0:.22}" stroke="var(--vq-series-1-ink)" stroke-width="2"/>
    ${dots}${labs}</svg></div>`;
}

function mountScatter(host, card){
  const { W, H } = hostDimensions(host, card);
  const m = { l:44, r:12, t:10, b:26 }, pw = W-m.l-m.r, ph = H-m.t-m.b;
  const r = seed(card.key + "|sc" + card.period);
  const rd = readingOf(card.key);
  const pts = Array.from({length: 34}, () => { const x = r(), y = Math.min(1, Math.max(0, x*0.6 + r()*0.5));
    return { x, y, w: 4 + r()*9 }; });
  const xs = niceTicks(0, 100, 5), ys = niceTicks(0, 100, 5);
  const grid = ys.ticks.map(v => { const y = m.t+ph-(v/100)*ph;
    return `<line class="ck-grid" x1="${m.l}" x2="${W-m.r}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"/>
            <text class="ck-lab" x="${m.l-8}" y="${(y+4).toFixed(1)}" text-anchor="end">${v}</text>`; }).join("");
  const xlab = xs.ticks.map(v => { const x = m.l+(v/100)*pw;
    return `<text class="ck-lab" x="${x.toFixed(1)}" y="${H-8}" text-anchor="middle">${v}</text>`; }).join("");
  const variant = card.variant || "dots";
  const dots = pts.map((p,i) => `<circle class="ck-sc" data-i="${i}" cx="${(m.l+p.x*pw).toFixed(1)}"
    cy="${(m.t+ph-p.y*ph).toFixed(1)}" r="${variant==="bubble"?p.w.toFixed(1):4.5}"
    fill="var(--vq-series-1-ink)" fill-opacity=".55" style="--d:${i*14}ms"><title>${rd.label}</title></circle>`).join("");
  const trend = variant === "trend"
    ? `<line class="ck-trend" x1="${m.l}" y1="${(m.t+ph*0.78).toFixed(1)}" x2="${W-m.r}" y2="${(m.t+ph*0.2).toFixed(1)}"/>` : "";
  host.innerHTML = `<svg class="ck" width="${W}" height="${H}">${grid}${xlab}${trend}
    <g class="ck-plot" style="clip-path:inset(0 100% 0 0)">${dots}</g></svg>`;
  requestAnimationFrame(() => { const p = host.querySelector(".ck-plot"); if (p) p.style.clipPath = "inset(0 0% 0 0)"; });
}

function mountHeatmap(host, card){
  const { W: HW, H: HH } = hostDimensions(host, card);
  const rd = readingOf(card.key);
  const r = seed(card.key + "|hm" + card.period);
  const cols = card.period === "Today"
    ? ["09","11","13","15","17","19"] : ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const rows = card.period === "Today" ? ["Mon","Tue","Wed","Thu"] : ["09h","12h","15h","18h"];
  const grid = rows.map(() => cols.map(() => Math.round(r()*100)));
  const mx = Math.max(...grid.flat()) || 1;
  const variant = card.variant || "square";
  const cells = grid.flatMap((row, ri) => row.map((v, ci) => {
    const lvl = Math.min(4, Math.floor(v/mx*5));
    const d = (ri*cols.length+ci)*11;
    if (variant === "dots") return `<span class="ck-hd2" style="--d:${d}ms"><i style="transform:scale(${(0.3+v/mx*0.7).toFixed(2)});background:var(--vq-seq-${lvl+1})"></i>
      <span class="ck-hint">${rows[ri]} · ${cols[ci]} — ${fmtValue(v, rd.unit)}</span></span>`;
    return `<span class="ck-hc ${variant==="rounded"?"is-round":""}" style="background:var(--vq-seq-${lvl+1});--d:${d}ms">
      <span class="ck-hint">${rows[ri]} · ${cols[ci]} — ${fmtValue(v, rd.unit)}</span></span>`;
  })).join("");
  host.innerHTML = `<div class="ck-hm" style="--c:${cols.length}">
    <div class="ck-hm-x"><span></span>${cols.map(c=>`<b>${c}</b>`).join("")}</div>
    <div class="ck-hm-b"><div class="ck-hm-y">${rows.map(x=>`<b>${x}</b>`).join("")}</div>
    <div class="ck-hm-g">${cells}</div></div>
    <div class="ck-hm-l"><span>Low</span>${[1,2,3,4,5].map(i=>`<i style="background:var(--vq-seq-${i})"></i>`).join("")}<span>High</span></div></div>`;
}

function mountTable(host, card){
  const { H } = hostDimensions(host, card);
  const pd = buildParts(card.key, card.period, readingOf(card.key).rowNames);
  const capacity = Math.max(3, Math.floor((H - 4) / 32));
  const rows = pd.parts.slice(0, Math.min(7, capacity)), mx = rows[0].value;
  const variant = card.variant || "rows";
  host.innerHTML = `<div class="ck-tb">${rows.map((p,i) => `
    <div class="ck-tr" style="--d:${i*45}ms">
      ${variant === "rank" ? `<span class="ck-rank">${i+1}</span>` : ""}
      <span class="ck-tn">${p.name}</span>
      ${variant === "bars" ? `<span class="ck-tbar"><i style="width:${(p.value/mx*100).toFixed(0)}%;background:${p.color}"></i></span>` : ""}
      <b class="ck-tv">${unitPrefix(pd.unit)}${fmtValue(p.value, pd.unit, true)}</b>
    </div>`).join("")}</div>`;
}

function mountFeed(host, card){
  const { H } = hostDimensions(host, card);
  const pd = buildParts(card.key, card.period, readingOf(card.key).rowNames);
  const times = timeline(card.period).slice(-6).reverse();
  const capacity = Math.max(3, Math.floor((H - 4) / 32));
  const rows = pd.parts.slice(0, Math.min(6, capacity)), mx = pd.parts[0].value || 1;
  const bars = card.variant === "bars";
  host.innerHTML = `<div class="ck-tb ${bars ? "is-bars" : ""}">${rows.map((p,i) => `
    <div class="ck-tr" style="--d:${i*45}ms">
      ${bars ? "" : `<span class="ck-fd" style="background:${p.color}"></span>`}
      <span class="ck-tn">${p.name}</span>
      ${bars ? `<span class="ck-tbar"><i style="width:${(p.value/mx*100).toFixed(0)}%;background:${p.color}"></i></span>`
             : `<span class="ck-tt">${fullLabel(times[i] || times[0], PERIOD[card.period].grain)}</span>`}
      <b class="ck-tv">${unitPrefix(pd.unit)}${fmtValue(p.value, pd.unit, true)}</b>
    </div>`).join("")}</div>`;
}

function mountSankey(host, card){
  const { W, H } = hostDimensions(host, card);
  const pd = buildParts(card.key, card.period, readingOf(card.key).sliceNames);
  const parts = pd.parts.slice(0,4), tot = parts.reduce((a,b)=>a+b.value,0);
  const thin = (card.variant === "thin");
  let y = 6, links = "", nodes = "";
  parts.forEach((p, i) => {
    const h = (p.value / tot) * (H - 12) * (thin ? 0.7 : 1);
    nodes += `<rect x="20" y="${y.toFixed(1)}" width="11" height="${h.toFixed(1)}" rx="3" fill="${p.color}"/>`;
    const ty = 10 + i * ((H - 20) / parts.length);
    links += `<path class="ck-lk" style="--d:${i*90}ms" d="M31 ${y.toFixed(1)} C${W*0.45} ${y.toFixed(1)} ${W*0.55} ${ty.toFixed(1)} ${(W-32).toFixed(1)} ${ty.toFixed(1)}
      L${(W-32).toFixed(1)} ${(ty + h*0.72).toFixed(1)} C${W*0.55} ${(ty+h*0.72).toFixed(1)} ${W*0.45} ${(y+h).toFixed(1)} 31 ${(y+h).toFixed(1)} Z"
      fill="${p.color}" fill-opacity=".3"><title>${p.name} — ${fmtValue(p.value, pd.unit, true)}</title></path>`;
    y += h + 5;
  });
  nodes += `<rect x="${W-31}" y="6" width="11" height="${H-12}" rx="3" fill="var(--vq-chart-track-data)"/>`;
  host.innerHTML = `<svg class="ck" width="${W}" height="${H}">${links}${nodes}</svg>`;
}

function mountChoropleth(host, card){
  const rd = readingOf(card.key);
  const r = seed(card.key + "|geo" + card.period);
  const regs = ["Punjab","Sindh","KPK","Balochistan","Islamabad","Gilgit-Baltistan"]
    .map(n => ({ n, v: Math.round(unitBase(rd.unit) * (0.2 + r())) }));
  regs.sort((a,b) => b.v - a.v);
  const mx = regs[0].v;
  if (card.variant === "list"){
    const capacity = Math.max(3, Math.floor((host.clientHeight - 4) / 31));
    host.innerHTML = `<div class="ck-tb">${regs.slice(0, capacity).map((g,i)=>`<div class="ck-tr" style="--d:${i*45}ms">
      <span class="ck-rank">${i+1}</span><span class="ck-tn">${g.n}</span>
      <span class="ck-tbar"><i style="width:${(g.v/mx*100).toFixed(0)}%;background:var(--vq-seq-${Math.min(4,Math.floor(g.v/mx*5))+1})"></i></span>
      <b class="ck-tv">${unitPrefix(rd.unit)}${fmtValue(g.v, rd.unit, true)}</b></div>`).join("")}</div>`;
    return;
  }
  /* a tinted fill behind normal text, rather than text on a saturated tile —
     the sequential scale inverts between themes and would strand the label */
  host.innerHTML = `<div class="ck-geo">${regs.map((g,i)=>`
    <div class="ck-geo-c" style="--d:${i*55}ms">
      <i class="ck-geo-f" style="width:${(g.v/mx*100).toFixed(0)}%;background:var(--vq-seq-${Math.min(4,Math.floor(g.v/mx*5))+1})"></i>
      <span>${g.n}</span><b>${unitPrefix(rd.unit)}${fmtValue(g.v, rd.unit, true)}</b></div>`).join("")}</div>`;
}

function mountSparkline(host, card){
  const { W, H } = hostDimensions(host, card);
  const rd = readingOf(card.key);
  const vals = valuesFor(card.key, card.period, rd.unit);
  const times = timeline(card.period), grain = PERIOD[card.period].grain;
  const mn = Math.min(...vals), mx = Math.max(...vals), rg = (mx-mn)||1;
  const n = vals.length;
  const pts = vals.map((v,i) => [ (i*(W-6))/(n-1) + 3, H - 4 - ((v-mn)/rg)*(H-10) ]);
  const variant = card.variant || "area";
  const uid = "sp" + (++CHART_UID);
  let body;
  if (variant === "bars"){
    const bw = (W/n)*0.62;
    body = vals.map((v,i) => `<rect class="ck-bar" data-x="${i}" x="${(pts[i][0]-bw/2).toFixed(1)}"
      y="${pts[i][1].toFixed(1)}" width="${bw.toFixed(1)}" height="${(H-4-pts[i][1]).toFixed(1)}" rx="2"
      fill="var(--vq-series-1-ink)"/>`).join("");
  } else {
    const d = pathSmooth(pts);
    body = (variant === "area"
      ? `<defs><linearGradient id="${uid}" x1="0" y1="0" x2="0" y2="1">
         <stop offset="0%" stop-color="var(--vq-series-1-ink)" stop-opacity=".3"/>
         <stop offset="100%" stop-color="var(--vq-series-1-ink)" stop-opacity="0"/></linearGradient></defs>
         <path d="${d} L${P(pts[n-1][0],H)} L${P(pts[0][0],H)} Z" fill="url(#${uid})"/>` : "")
      + `<path class="ck-line" d="${d}" stroke="var(--vq-series-1-ink)"/>`;
  }
  host.innerHTML = `<svg class="ck ck--spark" width="${W}" height="${H}">
    <g class="ck-plot" style="clip-path:inset(0 100% 0 0)">${body}</g>
    <g class="ck-hover" style="opacity:0"><line class="ck-cross" y1="0" y2="${H}"/>
      <circle class="ck-hd" r="3.5" fill="var(--vq-surface)" stroke="var(--vq-series-1-ink)" stroke-width="2"/></g>
    <rect class="ck-cap" x="0" y="0" width="${W}" height="${H}" fill="transparent"/></svg>
    <div class="ck-tip ck-tip--sm" hidden></div>`;
  requestAnimationFrame(() => { const p = host.querySelector(".ck-plot"); if (p) p.style.clipPath = "inset(0 0% 0 0)"; });

  const cap = host.querySelector(".ck-cap"), hov = host.querySelector(".ck-hover");
  const cross = host.querySelector(".ck-cross"), dot = host.querySelector(".ck-hd");
  const tip = host.querySelector(".ck-tip");
  const head = host.closest(".vqc")?.querySelector(".vqc-head-val .nf");
  const sub  = host.closest(".vqc")?.querySelector(".vqc-head-when");
  const rest = () => { if (head) setRoller(head, unitPrefix(rd.unit) + fmtValue(vals[n-1], rd.unit));
                       if (sub) sub.textContent = card.period + " · " + tickLabel(times[0],grain) + " – " + tickLabel(times[n-1],grain); };
  cap.addEventListener("mousemove", e => {
    const r0 = cap.getBoundingClientRect();
    const i = Math.max(0, Math.min(n-1, Math.round(((e.clientX - r0.left) - 3) / ((W-6)/(n-1)))));
    hov.style.opacity = "1";
    cross.style.transform = `translateX(${pts[i][0].toFixed(1)}px)`;
    dot.style.transform = `translate(${pts[i][0].toFixed(1)}px, ${pts[i][1].toFixed(1)}px)`;
    tip.hidden = false;
    tip.innerHTML = `<p class="ck-tip-h">${fullLabel(times[i], grain)}</p>
      <span class="ck-tip-r"><b class="ck-tip-v">${unitPrefix(rd.unit)}${fmtValue(vals[i], rd.unit)}</b></span>`;
    const tw = tip.offsetWidth || 110;
    tip.style.left = Math.max(0, Math.min(W - tw, pts[i][0] - tw/2)) + "px";
    if (head) setRoller(head, unitPrefix(rd.unit) + fmtValue(vals[i], rd.unit));
    if (sub) sub.textContent = fullLabel(times[i], grain);
  });
  cap.addEventListener("mouseleave", () => { hov.style.opacity = "0"; tip.hidden = true; rest(); });
}

/* A single number with no context is the complaint. Every stat card now
   carries either a sparkline, a period comparison, or a min/avg/max read. */
function mountStat(host, card){
  const variant = card.variant || "spark";
  if (variant === "spark") return mountSparkline(host, card);
  const rd = readingOf(card.key);
  const vals = valuesFor(card.key, card.period, rd.unit);
  const now = vals[vals.length - 1];
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const avg = vals.reduce((a,b) => a+b, 0) / vals.length;
  const times = timeline(card.period), grain = PERIOD[card.period].grain;
  const at = i => tickLabel(times[i], grain);

  if (variant === "delta"){
    const half = Math.floor(vals.length / 2);
    const prev = vals.slice(0, half).reduce((a,b)=>a+b,0) / half;
    const curr = vals.slice(half).reduce((a,b)=>a+b,0) / (vals.length - half);
    const mx = Math.max(prev, curr) || 1;
    const row = (lab, v, col) => `<div class="ck-cmp">
      <span class="ck-cmp-l">${lab}</span>
      <span class="ck-cmp-t"><i style="width:${(v/mx*100).toFixed(0)}%;background:${col}"></i></span>
      <b class="ck-cmp-v">${unitPrefix(rd.unit)}${fmtValue(v, rd.unit, true)}</b></div>`;
    host.innerHTML = `<div class="ck-stat">
      ${row("This " + card.period.toLowerCase(), curr, "var(--vq-series-1)")}
      ${row("Previous", prev, "var(--vq-chart-track-data)")}
      <p class="ck-stat-n">${curr >= prev ? "Up" : "Down"}
        ${Math.abs((curr-prev)/(prev||1)*100).toFixed(1)}% on the first half of the period.</p></div>`;
    return;
  }
  const cell = (k, v, when) => `<div class="ck-fact"><span>${k}</span>
    <b>${unitPrefix(rd.unit)}${fmtValue(v, rd.unit, true)}</b>${when ? `<em>${when}</em>` : ""}</div>`;
  host.innerHTML = `<div class="ck-stat ck-stat--facts">
    ${cell("Lowest", lo, at(vals.indexOf(lo)))}
    ${cell("Average", avg, card.period.toLowerCase())}
    ${cell("Highest", hi, at(vals.indexOf(hi)))}
    ${cell("Latest", now, at(vals.length - 1))}</div>`;
}

function mountStatus(host, card){
  const rd = readingOf(card.key);
  const times = timeline(card.period), grain = PERIOD[card.period].grain;
  const ok = seed(card.key + "|st")() > 0.25;
  const state = ok ? "Balanced" : "Needs review";
  const body = (card.variant === "dot")
    ? `<span class="ck-dotstate ${ok ? "is-ok" : "is-warn"}"><i></i><b>${state}</b></span>`
    : `<span class="ck-badge ${ok ? "is-ok" : "is-warn"}"><i></i>${state}</span>`;
  host.innerHTML = `<div class="ck-stat ck-stat--status">${body}
    <p class="ck-stat-n">${rd.label} · checked ${fullLabel(times[times.length-1], grain)}</p></div>`;
}

function linkRows(host, shapeSel, rowSel){
  const shapes = [...host.querySelectorAll(shapeSel)], rows = [...host.querySelectorAll(rowSel)];
  const set = (i, on) => {
    shapes.forEach(s => s.classList.toggle("is-dim", on && +s.dataset.i !== i));
    rows.forEach(r => { r.classList.toggle("is-dim", on && +r.dataset.i !== i);
                        r.classList.toggle("is-on", on && +r.dataset.i === i); });
  };
  [...shapes, ...rows].forEach(el => {
    el.addEventListener("mouseenter", () => set(+el.dataset.i, true));
    el.addEventListener("mouseleave", () => set(-1, false));
  });
}

/* ── dispatcher ────────────────────────────────────────────────────────── */
const MOUNT = {
  gauge: mountGauge, funnel: mountFunnel, radar: mountRadar, scatter: mountScatter,
  heatmap: mountHeatmap, table: mountTable, feed: mountFeed, sankey: mountSankey,
  choropleth: mountChoropleth, sparkline: mountSparkline,
  stat: mountStat, status: mountStatus,
};
function mountChart(host, card){
  if (!host) return;
  if (CARTESIAN.has(card.chart)) return mountCartesian(host, card);
  if (RADIAL.has(card.chart))    return mountRadial(host, card);
  const fn = MOUNT[card.chart];
  if (fn) return fn(host, card);
}

/* ══ board, editor, library, builder ═══════════════════════════════════════ */

/* Every reading carries a value over time, so every reading can take a time
   chart. Shape decides what is *natural*, not what is permitted. */
const TIME_CHARTS = ["stat","sparkline","area","line","bar","composed","pl","live","gauge","ring"];
const LEGAL = {
  SCALAR:       TIME_CHARTS.concat(["heatmap","scatter","table"]),
  STATUS:       ["status","stat","sparkline","area","line","bar"],
  SERIES:       TIME_CHARTS.concat(["heatmap","scatter","table"]),
  MULTI_SERIES: ["composed","line","area","bar","pl","live","stat","sparkline"],
  BREAKDOWN:    ["pie","ring","sunburst","funnel","bar","radar","sankey","choropleth","table","stat","treemap"]
                  .filter(c => c !== "treemap"),
  RANKING:      ["bar","table","funnel","choropleth","pie","ring","radar","stat"],
  TABLE:        ["table","heatmap","scatter","bar","line","area","stat"],
  GAUGE:        ["gauge","ring","stat","sparkline","area","line","bar"],
  FEED:         ["feed","table","bar","stat"],
};
const CHART_NAME = {
  stat:"Stat", sparkline:"Sparkline", gauge:"Gauge", ring:"Ring", status:"Status",
  area:"Area", line:"Line", bar:"Bar", pl:"Profit / loss", live:"Live line",
  composed:"Composed", pie:"Pie", sunburst:"Sunburst", funnel:"Funnel", radar:"Radar",
  sankey:"Sankey", choropleth:"Regions", table:"Table", heatmap:"Heatmap",
  scatter:"Scatter", feed:"Feed",
};
const MIN_CAT = {
  stat:"C2", status:"C2", sparkline:"C3", feed:"C4", table:"C4", gauge:"C4", ring:"C4",
  bar:"C4", funnel:"C4", pie:"C4", radar:"C4",
  area:"C5", line:"C5", pl:"C5", live:"C5", composed:"C5", scatter:"C5",
  heatmap:"C5", sunburst:"C5", sankey:"C5", choropleth:"C5",
};
const CATS = ["C1","C2","C3","C4","C5","C6"];
const CAT_NAME = { C1:"Tile", C2:"Strip", C3:"Metric", C4:"Panel", C5:"Board", C6:"Canvas" };
const FITS = {
  C1: [[2,1,"icon+label"],[1,1,"icon"]],
  C2: [[4,1,"inline"],[3,2,"stacked"]],
  C3: [[4,3,"full"],[3,2,"standard"],[2,2,"compact"],[2,3,"stacked"]],
  C4: [[4,4,"full"],[3,4,"standard"],[3,5,"compact"],[2,6,"list"]],
  C5: [[6,6,"full"],[5,7,"narrow"],[4,8,"min"]],
  C6: [[8,8,"full"],[6,10,"narrow"],[4,12,"min"]],
};
const DEFAULT_FIT = { C1:0, C2:0, C3:0, C4:0, C5:2, C6:1 };

/* The smallest [cols, rows] a chart can be drawn in and still be read.
   Nothing may be placed below this — it is a property of the card, not a
   suggestion, so no card can ever clip its own content. */
const MIN_SIZE = {
  stat:[2,1], status:[2,1], sparkline:[3,3],
  gauge:[3,4], ring:[4,6], pie:[4,6], sunburst:[4,6],
  bar:[4,4], table:[3,4], funnel:[5,4], radar:[4,5], feed:[3,4],
  area:[4,4], line:[4,4], pl:[4,4], live:[4,4], composed:[5,5],
  scatter:[4,4], heatmap:[4,4], sankey:[5,5], choropleth:[4,4],
};
/* legend-bearing charts grow with how much they have to list */
/* A card in C1 or C2 has no chart host — only a stat or a status can live
   there. Everything else needs a body, so it starts at C3. */
const HOSTLESS = new Set(["stat","status"]);
/** A stat showing only its number — no chart body to make room for. */
const isBare = c => c.chart === "stat" && c.variant === "number";
function minSizeFor(card){
  let [w, h] = MIN_SIZE[card.chart] || [3,3];
  if (!HOSTLESS.has(card.chart) && !isBare(card)) h = Math.max(h, 3);
  if (card.chart === "stat"){
    const v = card.variant || "spark";
    if (v === "number")      [w,h] = [3,1];   /* value + delta + period, one row */
    else if (v === "spark")  [w,h] = [3,3];
    else if (v === "delta")  [w,h] = [3,3];
    else                     [w,h] = [3,4];
  }
  if (card.chart === "status") [w,h] = [3,3];
  let rows = h;
  const parts = () => (readingOf(card.key).sliceNames || ["a","b","c","d"]).length;
  /* header ~60px + dial ~200px + ~47px per legend row, over an 88px pitch */
  if (RADIAL.has(card.chart)) rows = Math.max(rows, 2 + Math.ceil(parts() * 0.75));
  /* a funnel is just stacked rows — it needs height per stage, not a dial */
  if (card.chart === "funnel") rows = Math.max(rows, parts() + 1);
  if (CARTESIAN.has(card.chart) && card.extraKeys.length) rows = Math.max(rows, h + 1);
  return [w, rows];
}
/* the fits a chart is allowed to take, as [index, cols, rows, name] */
function fitsFor(card, cat){
  const [mw, mh] = minSizeFor(card);
  return FITS[cat].map((f,i) => [i, f[0], f[1], f[2]]).filter(([,w,h]) => w >= mw && h >= mh);
}
function catsFor(card){ return CATS.filter(k => fitsFor(card, k).length); }
/* smallest category that can actually hold this chart */
function fitCat(card){ return catsFor(card)[0] || "C6"; }
/* dial charts need a legend under the dial; the rest are fine in a panel */
const TALL = new Set(["pie","ring","sunburst","gauge"]);
const MULTI_OK = new Set(["line","area","bar","composed"]);

/* Variants that only differ once a card carries more than one series.
   Offering them on a single-series card is a fake choice — it renders the
   same picture — so they are shown disabled with the reason. */
const NEEDS_SERIES = {
  area:     { stacked: 2 },
  bar:      { grouped: 2, stacked: 2 },
  composed: { "bar-line-area": 2, "bar-two-lines": 3, "stacked-line": 3,
              pattern: 2, "thin-columns": 2, "area-bar": 2 },
};
/* And the reverse: variants that only make sense on their own, because with
   more series they collapse into another variant's rule. */
const ONLY_SINGLE = { composed: ["bar-trend"] };

/** [id, name, enabled, why] for the variants of this card, in context. */
function variantsFor(card){
  const need = NEEDS_SERIES[card.chart] || {};
  const solo = ONLY_SINGLE[card.chart] || [];
  const have = 1 + card.extraKeys.length;
  return variantsOf(card.chart).map(([id, name]) => {
    if (solo.includes(id)) return [id, name, have === 1, "single series only"];
    const want = need[id] || 0;
    return [id, name, have >= want, want ? `needs ${want} series` : ""];
  });
}
/** Fall back to something renderable when the series count drops. */
function fixVariant(card){
  const v = variantsFor(card);
  if (!v.some(([id, , ok]) => id === card.variant && ok)){
    const first = v.find(([, , ok]) => ok);
    if (first) card.variant = first[0];
  }
}

const IC = {
  up:'<path d="m3 17 6-6 4 4 8-8"/><path d="M17 7h4v4"/>',
  down:'<path d="m3 7 6 6 4-4 8 8"/><path d="M17 17h4v-4"/>',
  plus:'<path d="M5 12h14"/><path d="M12 5v14"/>',
  x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  pencil:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash:'<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>',
  grip:'<circle cx="9" cy="6" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="18" r="1.4"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',
  moon:'<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
};
const ic = (n, s=14) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]||""}</svg>`;

/* ── state ─────────────────────────────────────────────────────────────── */
let CARDS = [], EDIT = null, SEQ = 0, LIB_AREA = "All", LIB_Q = "";
/* Board-wide preferences — set once in the editor, applied to every card. */
const PREFS = { periodPicker: true };
const newId = () => "c" + (++SEQ);
const cardOf = id => CARDS.find(c => c.id === id);

function catFor(chart){ return MIN_CAT[chart] || "C3"; }
/* Snap a card onto a legal size. Called after anything that changes what the
   card has to draw — chart type, added series, new category. */
/* Switching chart or variant re-sizes the card to that chart's natural size
   straight away — including dropping any hand-resize, which was measured for
   the old chart and means nothing for the new one. */
function resizeForChart(c){
  c.w = c.h = null;
  c.cat = fitCat(c);
  c.fit = DEFAULT_FIT[c.cat];
  clampFit(c);
}
function clampFit(c, wanted){
  if (c.w && c.h){
    const [mw, mh] = minSizeFor(c);
    c.w = Math.max(c.w, mw); c.h = Math.max(c.h, mh);
    return;
  }
  let legal = fitsFor(c, c.cat);
  if (!legal.length){ c.cat = fitCat(c); legal = fitsFor(c, c.cat); }
  const want = wanted ?? DEFAULT_FIT[c.cat];
  c.fit = legal.some(([i]) => i === want) ? want : legal[0][0];
}
function legalFor(key){ const rd = readingOf(key); return LEGAL[rd.shape] || ["stat"]; }

function addCard(key, opts = {}){
  const rd = readingOf(key); if (!rd) return null;
  const chart = opts.chart || legalFor(key)[0];
  const c = { id:newId(), key, extraKeys: opts.extraKeys || [], chart,
              variant: opts.variant || defaultVariant(chart), cat:"C3", fit:0,
              period: opts.period || "Month",
              title: opts.title || null, accent: !!opts.accent };
  /* the card decides its own smallest honest size — never the caller */
  c.cat = opts.cat && fitsFor(c, opts.cat).length ? opts.cat : fitCat(c);
  clampFit(c, opts.fit);
  CARDS.push(c);
  draw();
  return c;
}

/* ── card face ─────────────────────────────────────────────────────────── */
function headlineOf(card){
  const rd = readingOf(card.key);
  const vals = valuesFor(card.key, card.period, rd.unit);
  const last = vals[vals.length - 1], prev = vals[vals.length - 2] ?? last;
  const pct = prev ? ((last - prev) / prev) * 100 : 0;
  const times = timeline(card.period), grain = PERIOD[card.period].grain;
  return {
    value: unitPrefix(rd.unit) + fmtValue(last, rd.unit),
    dir: pct >= 0 ? "up" : "down", pct: Math.abs(pct).toFixed(1) + "%",
    when: card.period + " · " + tickLabel(times[0], grain) + " – " + tickLabel(times[times.length-1], grain),
  };
}

/* Day / Week / Month / Quarter / Year, switchable from the card face. */
function periodPicker(c){
  return `<span class="vqc-per">
    <button class="vqc-per-b" aria-haspopup="true" aria-expanded="false">${c.period}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="3" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg></button>
    <span class="vqc-per-m" hidden>${PERIODS.map(x =>
      `<button class="vqc-per-i ${x === c.period ? "is-on" : ""}" data-p="${x}">${x}</button>`).join("")}</span>
  </span>`;
}

function tools(){
  return `<span class="vqc-tools">
    <button class="vqc-act vqc-grip" title="Drag to reorder" aria-label="Drag to reorder">${ic("grip",13)}</button>
    <button class="vqc-act vqc-edit" title="Edit card" aria-label="Edit card">${ic("pencil",12)}</button>
    <button class="vqc-act vqc-del" title="Remove card" aria-label="Remove card">${ic("trash",12)}</button></span>`;
}

/* The grid's own geometry — resize snaps to this, nothing else. */
const GRID = { cols: 12, unit: 64, gutter: 24 };
function sizeOf(c){
  if (c.w && c.h) return [c.w, c.h];              /* hand-resized */
  const f = FITS[c.cat][Math.min(c.fit, FITS[c.cat].length - 1)];
  return [f[0], f[1]];
}

function hostDimensions(host, card) {
  const cardEl = host ? host.closest(".vqc") : null;
  const isPreview = host && host.closest(".vq-preview-stage");
  
  // Measure direct client dimensions if already rendered in DOM
  const clientW = host ? host.clientWidth : 0;
  const clientH = host ? host.clientHeight : 0;

  if (clientW > 40 && clientH > 40) {
    return { W: Math.round(clientW), H: Math.round(clientH) };
  }

  // Calculate from card / grid bounds
  let [wCols, hRows] = sizeOf(card);
  const board = (host && host.closest(".vq-preview-stage")) || (host && host.closest(".vq-grid")) || document.getElementById("board") || document.body;
  let colW = 140;
  if (board && board.clientWidth > 0) {
    const computedCols = getComputedStyle(board).getPropertyValue("--vq-cols") || 12;
    const cols = parseInt(computedCols, 10) || 12;
    colW = Math.max(36, (board.clientWidth - 24 * (cols - 1)) / cols);
  }
  
  let cardW = Math.round(wCols * colW + (wCols - 1) * 24);
  let cardH = Math.round(hRows * 64 + (hRows - 1) * 24);

  if (isPreview && cardEl) {
    const cardRect = cardEl.getBoundingClientRect();
    if (cardRect.width > 30) cardW = cardRect.width;
    if (cardRect.height > 30) cardH = cardRect.height;
  }

  const selfLabelled = card.chart === "gauge" || card.chart === "ring" || card.chart === "sunburst";
  const showHead = card.chart !== "status" && !selfLabelled;
  const headerDeduction = showHead ? 134 : 48;
  const extraKeysDeduction = (card.extraKeys && card.extraKeys.length > 0) ? 36 : 0;
  
  const calcW = Math.max(80, Math.round(cardW - 40));
  const calcH = Math.max(50, Math.round(cardH - 40 - headerDeduction - extraKeysDeduction));

  const W = Math.max(80, clientW > 40 ? clientW : calcW);
  const H = Math.max(50, clientH > 40 ? clientH : calcH);
  return { W: Math.round(W), H: Math.round(H) };
}

function getDeepLinkForCard(key) {
  if (!key) return '/pos';
  if (key.startsWith('sales')) return '/s/my-business-store-353/sales';
  if (key.startsWith('purchase')) return '/s/my-business-store-353/purchase-orders';
  if (key.startsWith('inventory')) return '/s/my-business-store-353/inventory';
  if (key.startsWith('accounting') || key.startsWith('finance') || key.startsWith('bank')) return '/s/my-business-store-353/finance';
  if (key.startsWith('parties') || key.startsWith('contacts')) return '/s/my-business-store-353/parties';
  return '/s/my-business-store-353/reports';
}

function renderCard(c){
  const tone = c.tone || (c.accent ? "accent" : "surface");
  const toneClass = tone === "accent" ? "vqc--tone-accent vqc--accent" : tone === "ink" ? "vqc--tone-ink" : tone === "mesh" ? "vqc--tone-mesh" : "vqc--tone-surface";
  const [w, h] = sizeOf(c);
  const deepLink = c.link || getDeepLinkForCard(c.key);

  // 1. Quick Actions Hub Card
  if (c.type === 'action_hub') {
    return `<article class="vqc vqc--action-hub vq-w${w} vq-h${h} vqc--tone-ink" data-id="${c.id}" style="grid-column: span ${w}; grid-row: span ${h};">
      <div class="vqc-hd">
        <span class="vqc-eyebrow">OPERATIONS HUB</span>
        <div class="vqc-acts">
          <a href="${deepLink}" class="vqc-nav-link" title="Open Operations Hub" target="_self">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
          </a>
          <button class="vqc-act vqc-edit" title="Edit"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></button>
          <button class="vqc-act vqc-del" title="Remove"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
        </div>
      </div>
      <div class="vqc-action-hub-title">${c.title || 'Quick Operations'}</div>
      <div class="vqc-action-hub-sub">Point of sale, purchases & quick dispatch</div>
      <div class="vqc-action-hub-grid">
        <a href="/pos" class="vqc-hub-btn vqc-hub-btn--sales">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          <span>Point of Sale</span>
        </a>
        <a href="/s/my-business-store-353/purchase-orders" class="vqc-hub-btn vqc-hub-btn--purchase">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          <span>Purchase Order</span>
        </a>
        <button type="button" class="vqc-hub-btn vqc-hub-btn--actions" onclick="window.VenQoreCards?.openGlassActions?.()">
          <span class="vqc-hub-plus">+</span>
          <span>Quick Actions</span>
        </button>
      </div>
      <div class="vqc-grip"></div>
    </article>`;
  }

  // 2. Bank Accounts & Cash in Hand Liquidity Card
  if (c.type === 'bank_liquidity') {
    return `<article class="vqc vqc--bank-liquidity vq-w${w} vq-h${h} ${toneClass}" data-id="${c.id}" style="grid-column: span ${w}; grid-row: span ${h};">
      <div class="vqc-hd">
        <span class="vqc-eyebrow">LIQUIDITY & BALANCES</span>
        <div class="vqc-acts">
          <a href="/s/my-business-store-353/finance" class="vqc-nav-link" title="Open Finance" target="_self">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
          </a>
          <button class="vqc-act vqc-edit" title="Edit"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></button>
          <button class="vqc-act vqc-del" title="Remove"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
        </div>
      </div>
      <div class="vqc-bank-grid">
        <div class="vqc-bank-box">
          <span class="vqc-bank-label">Bank Accounts</span>
          <span class="vqc-bank-val">Rs 4,820,400</span>
          <span class="vqc-bank-sub">3 accounts active</span>
        </div>
        <div class="vqc-bank-box">
          <span class="vqc-bank-label">Cash on Hand</span>
          <span class="vqc-bank-val">Rs 1,816,149</span>
          <span class="vqc-bank-sub">Drawer & safe</span>
        </div>
        <div class="vqc-bank-box is-total">
          <span class="vqc-bank-label">Total Liquid Net</span>
          <span class="vqc-bank-val">Rs 6,636,549</span>
          <span class="vqc-bank-sub" style="color:var(--vq-teal-600)">+8.2% vs last mo</span>
        </div>
      </div>
      <div class="vqc-grip"></div>
    </article>`;
  }

  // 3. Alerts & Action Required Card
  if (c.type === 'alerts_hub') {
    return `<article class="vqc vqc--alerts-hub vq-w${w} vq-h${h} ${toneClass}" data-id="${c.id}" style="grid-column: span ${w}; grid-row: span ${h};">
      <div class="vqc-hd">
        <span class="vqc-eyebrow">ACTIONS REQUIRED</span>
        <div class="vqc-acts">
          <a href="/s/my-business-store-353/reports" class="vqc-nav-link" title="Open Alerts" target="_self">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
          </a>
          <button class="vqc-act vqc-edit" title="Edit"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></button>
          <button class="vqc-act vqc-del" title="Remove"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
        </div>
      </div>
      <div class="vqc-alerts-list">
        <a href="/s/my-business-store-353/inventory" class="vqc-alert-item vqc-alert-item--warning">
          <span class="vqc-alert-dot"></span>
          <span class="vqc-alert-msg"><strong>4 products</strong> reached safety reorder limit</span>
          <span class="vqc-alert-btn">Reorder →</span>
        </a>
        <a href="/s/my-business-store-353/finance" class="vqc-alert-item vqc-alert-item--danger">
          <span class="vqc-alert-dot"></span>
          <span class="vqc-alert-msg"><strong>Rs 10,260</strong> customer dues overdue (>30 days)</span>
          <span class="vqc-alert-btn">Follow up →</span>
        </a>
        <a href="/s/my-business-store-353/purchase-orders" class="vqc-alert-item vqc-alert-item--info">
          <span class="vqc-alert-dot"></span>
          <span class="vqc-alert-msg"><strong>2 purchase orders</strong> awaiting warehouse receipt</span>
          <span class="vqc-alert-btn">Receive →</span>
        </a>
      </div>
      <div class="vqc-grip"></div>
    </article>`;
  }

  // 4. Growth Engine Card
  if (c.type === 'growth_engine') {
    return `<article class="vqc vqc--growth-engine vq-w${w} vq-h${h} ${toneClass}" data-id="${c.id}" style="grid-column: span ${w}; grid-row: span ${h};">
      <div class="vqc-hd">
        <span class="vqc-eyebrow">GROWTH ENGINE</span>
        <div class="vqc-acts">
          <a href="/s/my-business-store-353/reports" class="vqc-nav-link" title="Open Growth Engine" target="_self">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
          </a>
          <button class="vqc-act vqc-edit" title="Edit"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></button>
          <button class="vqc-act vqc-del" title="Remove"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
        </div>
      </div>
      <div class="vqc-growth-grid">
        <div class="vqc-growth-stat">
          <span class="vqc-growth-label">Revenue Velocity</span>
          <span class="vqc-growth-val">+18.4%</span>
          <span class="vqc-growth-sub">Pace vs prev month</span>
        </div>
        <div class="vqc-growth-stat">
          <span class="vqc-growth-label">Target On-Track</span>
          <span class="vqc-growth-val">94.2%</span>
          <span class="vqc-growth-sub">Rs 2.8M / 3.0M Goal</span>
        </div>
        <div class="vqc-growth-stat">
          <span class="vqc-growth-label">Customer Retention</span>
          <span class="vqc-growth-val">68.5%</span>
          <span class="vqc-growth-sub">Repeat shoppers</span>
        </div>
      </div>
      <div class="vqc-grip"></div>
    </article>`;
  }

  // 5. Custom Button Card
  if (c.type === 'custom_button') {
    return `<article class="vqc vqc--custom-btn vq-w${w} vq-h${h} ${toneClass}" data-id="${c.id}" style="grid-column: span ${w}; grid-row: span ${h};">
      <div class="vqc-hd">
        <span class="vqc-eyebrow">CUSTOM SHORTCUT</span>
        <div class="vqc-acts">
          <a href="${c.targetUrl || '/pos'}" class="vqc-nav-link" title="Open Shortcut" target="_self">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
          </a>
          <button class="vqc-act vqc-edit" title="Edit"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></button>
          <button class="vqc-act vqc-del" title="Remove"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
        </div>
      </div>
      <a href="${c.targetUrl || '/pos'}" class="vqc-custom-action-anchor">
        <div class="vqc-custom-icon-ring" style="background: ${c.btnColor || 'var(--vq-teal-500)'}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <span class="vqc-custom-btn-title">${c.title || 'Launch Action'}</span>
        <span class="vqc-custom-btn-sub">${c.sub || 'Instant one-click dispatch'}</span>
      </a>
      <div class="vqc-grip"></div>
    </article>`;
  }

  const rd = readingOf(c.key);
  const title = c.title || rd.label;
  const hl = headlineOf(c);
  const keys = [c.key, ...c.extraKeys];
  const legend = (keys.length > 1 && CARTESIAN.has(c.chart))
    ? `<div class="vqc-leg">${keys.map((k,i) => `<button class="vqc-leg-i" data-i="${i}">
        <span class="vqc-leg-d" style="background:var(--vq-series-${(i%8)+1})"></span>${readingOf(k).label}</button>`).join("")}</div>`
    : "";

  let body;
  if (c.cat === "C1" && c.chart === "stat"){
    body = `${tools()}<div class="vqc-bd vqc-bd--tile">
      <span class="vqc-label">${title}</span>
      <span class="vqc-value vqc-value--xs">${rollerHTML(hl.value)}</span></div>`;
  } else if (c.cat === "C2" && c.chart === "stat"){
    const [cw] = sizeOf(c);
    const inline = c.fit === 0 && !c.h;
    /* even the one-row strip says what it is and over what window */
    body = `${tools()}<div class="vqc-bd vqc-bd--strip ${inline ? "is-inline" : ""}">
      <span class="vqc-eyebrow" title="${title}">${title}</span>
      <span class="vqc-head">
        <span class="vqc-head-val vqc-value vqc-value--sm">${rollerHTML(hl.value)}</span>
        <span class="vqc-delta vqc-delta--${hl.dir}">${ic(hl.dir,10)}${hl.pct}</span></span>
      <span class="vqc-head-when vqc-when">${cw >= 6 ? hl.when : c.period}</span></div>`;
  } else {
    /* only suppress the headline when the chart draws the number in its centre */
    const selfLabelled = c.chart === "gauge" || c.chart === "ring" || c.chart === "sunburst"
      || (c.chart === "pie" && c.variant === "donut");
    const showHead = c.chart !== "status" && !selfLabelled;
    body = `<div class="vqc-hd"><span class="vqc-eyebrow">${title}</span>
      <span class="vqc-hd-r">${PREFS.periodPicker ? periodPicker(c) : ""}${tools()}</span></div>
      ${showHead ? `<div class="vqc-head">
        <span class="vqc-head-val vqc-value">${rollerHTML(hl.value)}</span>
        <span class="vqc-delta vqc-delta--${hl.dir}">${ic(hl.dir,10)}${hl.pct}</span>
      </div>` : ""}
      ${c.chart === "status" ? "" : `<p class="vqc-head-when vqc-when">${hl.when}</p>`}
      ${isBare(c) ? "" : `<div class="vqc-host" data-chart="${c.chart}"></div>${legend}`}`;
  }
  return `<article class="vqc vqc--${c.cat.toLowerCase()} vq-w${w} vq-h${h} ${toneClass}"
    data-id="${c.id}" tabindex="0" draggable="false" style="--i:${CARDS.indexOf(c)}">${body}
    <span class="vqc-glare" aria-hidden="true"></span>
    <button class="vqc-resize" aria-label="Resize card" title="Drag to resize"></button></article>`;
}

/* ── draw ──────────────────────────────────────────────────────────────── */
let RESIZE_T = null;
function draw(){
  const board = document.getElementById("board");
  board.innerHTML = CARDS.map(renderCard).join("")
    || `<p class="board-empty">No cards yet — open <strong>Add cards</strong> and pick what you want to see.</p>`;
  document.getElementById("count").textContent = CARDS.length;

  board.querySelectorAll(".vqc").forEach(el => {
    const c = cardOf(el.dataset.id); if (!c) return;
    const host = el.querySelector(".vqc-host");
    if (host) mountChart(host, c);
    el.querySelector(".vqc-edit")?.addEventListener("click", e => { e.stopPropagation(); openEdit(c.id); });
    el.querySelector(".vqc-del") ?.addEventListener("click", e => {
      e.stopPropagation();
      el.classList.add("is-going");
      setTimeout(() => { CARDS = CARDS.filter(x => x.id !== c.id); if (EDIT === c.id) closeEdit(); draw(); }, 200);
    });
    /* legend hover dims the other series, same as the reference */
    el.querySelectorAll(".vqc-leg-i").forEach(btn => {
      const i = +btn.dataset.i;
      const set = on => {
        el.querySelectorAll(".ck-s").forEach(s => s.classList.toggle("is-dim", on && +s.dataset.i !== i));
        el.querySelectorAll(".vqc-leg-i").forEach(b => b.classList.toggle("is-dim", on && +b.dataset.i !== i));
      };
      btn.addEventListener("mouseenter", () => set(true));
      btn.addEventListener("mouseleave", () => set(false));
    });
    wireDrag(el, c);
    wireResize(el, c);
    wirePeriod(el, c);
  });
  renderLibrary();
}
addEventListener("resize", () => { clearTimeout(RESIZE_T); RESIZE_T = setTimeout(() => {
  document.querySelectorAll(".vqc").forEach(el => {
    const c = cardOf(el.dataset.id), host = el.querySelector(".vqc-host");
    if (c && host) mountChart(host, c);
  });
}, 180); });

/* ── on-card period menu ───────────────────────────────────────────────── */
function wirePeriod(el, c){
  const box = el.querySelector(".vqc-per"); if (!box) return;
  const btn = box.querySelector(".vqc-per-b"), menu = box.querySelector(".vqc-per-m");
  const close = () => { menu.hidden = true; btn.setAttribute("aria-expanded","false"); };
  btn.addEventListener("click", e => {
    e.stopPropagation();
    document.querySelectorAll(".vqc-per-m").forEach(m => { if (m !== menu) m.hidden = true; });
    menu.hidden = !menu.hidden;
    btn.setAttribute("aria-expanded", String(!menu.hidden));
  });
  menu.querySelectorAll(".vqc-per-i").forEach(b => b.addEventListener("click", e => {
    e.stopPropagation();
    c.period = b.dataset.p;
    close();
    /* redraw just this card so the rest of the board stays put */
    const host = el.querySelector(".vqc-host");
    el.querySelector(".vqc-per-b").childNodes[0].nodeValue = c.period + " ";
    const hl = headlineOf(c);
    setRoller(el.querySelector(".vqc-head-val .nf"), hl.value);
    const when = el.querySelector(".vqc-head-when"); if (when) when.textContent = hl.when;
    menu.querySelectorAll(".vqc-per-i").forEach(x => x.classList.toggle("is-on", x.dataset.p === c.period));
    if (host){ host.classList.add("is-swapping");
      setTimeout(() => { mountChart(host, c); host.classList.remove("is-swapping"); }, 180); }
    if (EDIT === c.id) openEdit(c.id);
  }));
}
document.addEventListener("click", () =>
  document.querySelectorAll(".vqc-per-m").forEach(m => m.hidden = true));

/* ── resize from the bottom-right corner, snapped to the grid ──────────── */
function wireResize(el, c){
  const grip = el.querySelector(".vqc-resize"); if (!grip) return;
  grip.addEventListener("pointerdown", e => {
    e.preventDefault(); e.stopPropagation();
    const board = document.getElementById("board");
    const cols = getComputedStyle(board).gridTemplateColumns.split(" ").length;
    const colW = (board.clientWidth - GRID.gutter * (cols - 1)) / cols;
    const pitchX = colW + GRID.gutter, pitchY = GRID.unit + GRID.gutter;
    const start = el.getBoundingClientRect();
    const [minW, minH] = minSizeFor(c);
    el.classList.add("is-resizing");
    document.body.classList.add("is-reordering");
    const hint = document.createElement("span");
    hint.className = "vqc-size-hint"; el.appendChild(hint);

    const move = ev => {
      const w = Math.round((ev.clientX - start.left + GRID.gutter) / pitchX);
      const h = Math.round((ev.clientY - start.top + GRID.gutter) / pitchY);
      c.w = Math.max(minW, Math.min(cols, w));
      c.h = Math.max(minH, Math.min(16, h));
      el.className = el.className.replace(/vq-w\d+/, "vq-w" + c.w).replace(/vq-h\d+/, "vq-h" + c.h);
      hint.textContent = `${c.w} × ${c.h}`;
      const host = el.querySelector(".vqc-host"); if (host) mountChart(host, c);
    };
    const up = () => {
      removeEventListener("pointermove", move); removeEventListener("pointerup", up);
      el.classList.remove("is-resizing");
      document.body.classList.remove("is-reordering");
      hint.remove();
      if (EDIT === c.id) openEdit(c.id);
    };
    addEventListener("pointermove", move); addEventListener("pointerup", up);
  });
}

/* ── drag to reposition ────────────────────────────────────────────────── */
let DRAG = null;
function wireDrag(el, c){
  const grip = el.querySelector(".vqc-grip"); if (!grip) return;
  grip.addEventListener("pointerdown", e => {
    e.preventDefault(); e.stopPropagation();
    DRAG = c.id; el.classList.add("is-dragging");
    document.body.classList.add("is-reordering");
  });
}
document.addEventListener("pointerup", () => {
  if (!DRAG) return;
  DRAG = null;
  document.body.classList.remove("is-reordering");
  document.querySelectorAll(".vqc").forEach(x => x.classList.remove("is-dragging","is-over"));
  draw();
});
document.addEventListener("pointermove", e => {
  if (!DRAG) return;
  const over = document.elementFromPoint(e.clientX, e.clientY)?.closest(".vqc");
  document.querySelectorAll(".vqc").forEach(x => x.classList.toggle("is-over", x === over && x.dataset.id !== DRAG));
  if (!over || over.dataset.id === DRAG) return;
  const from = CARDS.findIndex(x => x.id === DRAG), to = CARDS.findIndex(x => x.id === over.dataset.id);
  if (from < 0 || to < 0) return;
  CARDS.splice(to, 0, CARDS.splice(from, 1)[0]);
  const board = document.getElementById("board");
  const nodes = [...board.children];
  board.insertBefore(nodes[from], nodes[to] || null);   /* cheap live shuffle */
});

/* ── editor ────────────────────────────────────────────────────────────── */
function openEdit(id){
  EDIT = id;
  const c = cardOf(id); if (!c) return;
  const rd = readingOf(c.key);
  const legal = legalFor(c.key);
  const vars = variantsFor(c);
  const p = document.getElementById("edit");
  p.classList.add("is-on");
  const seriesRows = [c.key, ...c.extraKeys].map((k, i) => `
    <div class="ed-ser">
      <span class="ed-ser-d" style="background:var(--vq-series-${(i%8)+1})"></span>
      <span class="ed-ser-n">${readingOf(k).label}</span>
      <span class="ed-ser-u">${readingOf(k).unit}</span>
      ${i === 0 ? `<span class="ed-ser-b">primary</span>`
                : `<button class="ed-ser-x" data-drop="${k}" title="Remove series">${ic("x",12)}</button>`}
    </div>`).join("");

  p.innerHTML = `
    <div class="ed-h"><div>
      <p class="ed-eyebrow">Editing</p>
      <h3 class="ed-t">${c.title || rd.label}</h3>
      <code class="ed-k">${rd.key} · ${rd.shape}</code></div>
      <button class="vqc-act" id="ed-close" aria-label="Close">${ic("x",13)}</button></div>

    <p class="ed-lab">Name</p>
    <input class="ed-in" id="ed-title" value="${(c.title || rd.label).replace(/"/g,"&quot;")}">

    <p class="ed-lab">Period</p>
    <div class="ed-seg" id="ed-period">${PERIODS.map(x =>
      `<button class="ed-seg-i" aria-pressed="${x === c.period}" data-p="${x}">${x}</button>`).join("")}</div>

    <p class="ed-lab">Chart</p>
    <div class="ed-chips" id="ed-charts">${legal.map(ch =>
      `<button class="ed-chip ${ch === c.chart ? "is-on":""}" data-ch="${ch}">${CHART_NAME[ch]}</button>`).join("")}</div>

    <p class="ed-lab">Look <span class="ed-sub">${CHART_NAME[c.chart]} variants</span></p>
    <div class="ed-chips" id="ed-vars">${vars.map(([v,n,ok,why]) =>
      `<button class="ed-chip ${v === c.variant ? "is-on":""} ${ok?"":"is-off"}" ${ok?"":"disabled"}
        data-v="${v}" ${ok?"":`title="${why}"`}>${n}${ok?"":` · ${why}`}</button>`).join("")}</div>

    <p class="ed-lab">Series ${MULTI_OK.has(c.chart) ? `<span class="ed-sub">compare up to 4</span>` : ""}</p>
    <div class="ed-sers">${seriesRows}</div>
    ${MULTI_OK.has(c.chart) && c.extraKeys.length < 3 ? `
      <div class="ed-add">
        <input class="ed-in ed-in--sm" id="ed-sq" placeholder="Add a series to compare…" autocomplete="off">
        <div class="ed-sug" id="ed-sug" hidden></div>
      </div>` : MULTI_OK.has(c.chart) ? "" : `<p class="ed-note">Switch to a line, area, bar or composed chart to compare more than one reading.</p>`}

    <p class="ed-lab">Size <span class="ed-sub">minimum ${minSizeFor(c)[0]}×${minSizeFor(c)[1]} for a ${CHART_NAME[c.chart].toLowerCase()}</span></p>
    <div class="ed-chips" id="ed-cats">${CATS.map(k => {
      const ok = fitsFor(c, k).length;
      return `<button class="ed-size ${k === c.cat?"is-on":""} ${ok?"":"is-off"}" ${ok?"":"disabled"}
        data-cat="${k}" ${ok?"":'title="Too small for this chart"'}>${k} ${CAT_NAME[k]}</button>`; }).join("")}</div>
    <div class="ed-chips" id="ed-fits">${fitsFor(c, c.cat).map(([i,w,h,nm]) =>
      `<button class="ed-size ${(!c.w && i === c.fit)?"is-on":""}" data-fit="${i}">${w}×${h} ${nm}</button>`).join("")}
      ${c.w ? `<button class="ed-size is-on" data-fit="custom">${c.w}×${c.h} custom</button>` : ""}</div>
    <p class="ed-note">Drag a card's bottom-right corner to size it freely — it snaps to the
      grid and stops at the ${minSizeFor(c)[0]}×${minSizeFor(c)[1]} floor.</p>

    <p class="ed-lab">Period control <span class="ed-sub">applies to every card</span></p>
    <div class="ed-chips" id="ed-perpref">
      <button class="ed-chip ${PREFS.periodPicker?"is-on":""}" data-pp="1">Show on cards</button>
      <button class="ed-chip ${PREFS.periodPicker?"":"is-on"}" data-pp="0">Hide — set it here</button></div>

    <p class="ed-lab">Emphasis</p>
    <div class="ed-chips" id="ed-acc">
      <button class="ed-chip ${!c.accent?"is-on":""}" data-a="0">Plain</button>
      <button class="ed-chip ${c.accent?"is-on":""}" data-a="1">Accent fill</button></div>
    <p class="ed-note">One accent card per board — setting this clears the others.</p>`;

  const again = fn => { fn(); draw(); openEdit(id); };
  p.querySelector("#ed-close").onclick = closeEdit;
  p.querySelector("#ed-title").oninput = e => { c.title = e.target.value || null; draw(); };
  p.querySelectorAll("#ed-period .ed-seg-i").forEach(b => b.onclick = () => again(() => c.period = b.dataset.p));
  p.querySelectorAll("#ed-charts .ed-chip").forEach(b => b.onclick = () => again(() => {
    c.chart = b.dataset.ch;
    c.variant = defaultVariant(c.chart);
    if (!MULTI_OK.has(c.chart)) c.extraKeys = [];
    fixVariant(c);
    resizeForChart(c);
  }));
  p.querySelectorAll("#ed-vars .ed-chip").forEach(b => b.onclick = () => again(() => {
    c.variant = b.dataset.v;
    resizeForChart(c); }));
  p.querySelectorAll("#ed-cats .ed-size").forEach(b => b.onclick = () => again(() => {
    c.cat = b.dataset.cat; c.w = c.h = null; clampFit(c); }));
  p.querySelectorAll("#ed-fits .ed-size").forEach(b => b.onclick = () => again(() => {
    if (b.dataset.fit === "custom") return;
    c.w = c.h = null; c.fit = +b.dataset.fit; }));
  p.querySelectorAll("#ed-perpref .ed-chip").forEach(b => b.onclick = () => again(() => {
    PREFS.periodPicker = b.dataset.pp === "1"; }));
  p.querySelectorAll("#ed-acc .ed-chip").forEach(b => b.onclick = () => again(() => {
    const on = b.dataset.a === "1"; if (on) CARDS.forEach(x => x.accent = false); c.accent = on; }));
  p.querySelectorAll(".ed-ser-x").forEach(b => b.onclick = () => again(() => {
    c.extraKeys = c.extraKeys.filter(k => k !== b.dataset.drop); fixVariant(c); clampFit(c, c.fit); }));

  const q = p.querySelector("#ed-sq"), sug = p.querySelector("#ed-sug");
  if (q){
    q.oninput = () => {
      const t = q.value.trim().toLowerCase();
      if (!t){ sug.hidden = true; return; }
      const hits = READINGS.filter(r => r.key !== c.key && !c.extraKeys.includes(r.key)
        && (r.label.toLowerCase().includes(t) || r.key.includes(t))).slice(0, 6);
      sug.hidden = !hits.length;
      sug.innerHTML = hits.map(r => `<button class="ed-sug-i" data-k="${r.key}">
        <span>${r.label}</span><code>${r.unit}</code></button>`).join("");
      sug.querySelectorAll(".ed-sug-i").forEach(b => b.onclick = () => again(() => {
        c.extraKeys.push(b.dataset.k); clampFit(c, c.fit); }));
    };
  }
}
function closeEdit(){ EDIT = null; document.getElementById("edit").classList.remove("is-on"); }

/* ── library ───────────────────────────────────────────────────────────── */
function renderLibrary(){
  const box = document.getElementById("lib-body"); if (!box) return;
  const on = new Set(CARDS.map(c => c.key));
  const areas = ["All", ...new Set(READINGS.map(r => r.area))];
  const q = LIB_Q.trim().toLowerCase();
  const list = READINGS.filter(r =>
    (LIB_AREA === "All" || r.area === LIB_AREA) &&
    (!q || r.label.toLowerCase().includes(q) || r.key.includes(q)));
  box.innerHTML = `
    <div class="lib-find">${ic("search",14)}<input id="lib-q" placeholder="Search ${READINGS.length} readings…" value="${LIB_Q.replace(/"/g,"&quot;")}"></div>
    <div class="lib-tabs">${areas.map(a =>
      `<button class="lib-tab ${a === LIB_AREA?"is-on":""}" data-a="${a}">${a}</button>`).join("")}</div>
    <div class="lib-list">${list.length ? list.map(r => `
      <div class="lib-row ${on.has(r.key)?"is-added":""}">
        <span class="lib-row-n">${r.label}</span>
        <code class="lib-row-k">${r.key}</code>
        <span class="lib-shape">${r.shape}</span>
        ${r.extra ? '<span class="lib-badge">extra</span>' : ''}
        <button class="lib-add" data-k="${r.key}" title="Add card">${on.has(r.key)?ic("check",13):ic("plus",13)}</button>
      </div>`).join("") : `<p class="lib-none">Nothing matches “${LIB_Q}”.</p>`}</div>`;
  const qi = box.querySelector("#lib-q");
  qi.oninput = () => { LIB_Q = qi.value; renderLibrary();
    const el = document.getElementById("lib-q"); el.focus(); el.setSelectionRange(el.value.length, el.value.length); };
  box.querySelectorAll(".lib-tab").forEach(b => b.onclick = () => { LIB_AREA = b.dataset.a; renderLibrary(); });
  box.querySelectorAll(".lib-add").forEach(b => b.onclick = () => {
    const c = addCard(b.dataset.k); if (c) openEdit(c.id); });
}

/* ── boot ──────────────────────────────────────────────────────────────── */
function boot(){
  const has = k => READINGS.some(r => r.key === k);
  const pick = (...ks) => ks.find(has);
  const rev  = pick("sales.revenue_trend","sales.revenue");
  const prof = pick("finance.profit_trend","finance.net_profit");

  if (rev)  addCard(rev,  { chart:"area", cat:"C5", fit:0, period:"Month", accent:false });
  if (prof) addCard(prof, { chart:"composed", cat:"C5", fit:1, period:"Month",
                            extraKeys:[pick("sales.revenue_trend"), pick("finance.cash_flow_trend")].filter(Boolean).slice(0,2) });
  [pick("sales.payment_breakdown"), pick("sales.top_products"), pick("inventory.low_stock_count"),
   pick("operations.plan_usage"), pick("sales.avg_order_value")].filter(Boolean)
    .forEach(k => addCard(k));

  /* light → dark → mesh. Mesh keeps the dark token set and swaps only the
     page ground, so contrast rules carry over untouched. */
  const THEMES = [["light",null], ["dark",null], ["dark","mesh"]];
  let themeAt = 0;
  const themeBtn = document.getElementById("vq-theme");
  if (themeBtn) {
    themeBtn.onclick = () => {
      themeAt = (themeAt + 1) % THEMES.length;
      const [t, bg] = THEMES[themeAt];
      const r = document.documentElement;
      r.setAttribute("data-theme", t);
      if (bg) r.setAttribute("data-bg", bg); else r.removeAttribute("data-bg");
      themeBtn.setAttribute("data-mode", bg || t);
      draw();
    };
  }
  const libOpenBtn = document.getElementById("lib-open");
  if (libOpenBtn) {
    libOpenBtn.onclick = () => {
      document.getElementById("lib")?.classList.add("is-on");
      document.getElementById("lib-q")?.focus();
    };
  }
  const libCloseBtn = document.getElementById("lib-close");
  if (libCloseBtn) {
    libCloseBtn.onclick = () => document.getElementById("lib")?.classList.remove("is-on");
  }
  draw();
}



// Expose engines and chart constraint helpers to React component
window.VenQoreCards = {
  getCards: () => CARDS,
  setCards: (newCards) => { CARDS = newCards; draw(); },
  getReadings: () => READINGS,
  getFits: () => FITS,
  getCharts: () => CHARTS,
  getLegalCharts: () => LEGAL,
  getChartNames: () => CHART_NAME,
  getVariants: () => VARIANTS,
  minSizeFor: minSizeFor,
  fitCat: fitCat,
  sizeOf: sizeOf,
  getReadingOf: readingOf,
  getHeadlineOf: headlineOf,
  renderCard: renderCard,
  mountChart: mountChart,
  draw: draw,
  openEdit: openEdit,
  closeEdit: closeEdit,
  addCard: addCard,
  boot: boot,
  openGlassActions: () => {
    if (window._vqOpenGlassActions) window._vqOpenGlassActions();
  }
};


  // Boot the engine
  if (typeof boot === 'function') {
    boot();
  }

  // Set up resize observer to keep charts responsive
  const board = document.getElementById("board");
  if (board && typeof ResizeObserver !== "undefined") {
    let timer = null;
    const ro = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        board.querySelectorAll(".vqc").forEach(el => {
          const c = cardOf(el.dataset.id); if (!c) return;
          const host = el.querySelector(".vqc-host");
          if (host) mountChart(host, c);
        });
      }, 80);
    });
    ro.observe(board);
  }
}

// User-friendly card sizes mapped to Layout Law specs
const CARD_SIZES = [
  { id: 'compact', label: 'Compact Stat', sub: '2 × 1 cols', cat: 'C2', fit: 0, w: 2, h: 1, previewClass: 'preview-size-compact' },
  { id: 'square', label: 'Medium Box', sub: '3 × 3 cols', cat: 'C3', fit: 0, w: 3, h: 3, previewClass: 'preview-size-square' },
  { id: 'standard', label: 'Standard Chart', sub: '6 × 4 cols', cat: 'C5', fit: 0, w: 6, h: 4, previewClass: 'preview-size-standard' },
  { id: 'wide', label: 'Wide Trend', sub: '8 × 4 cols', cat: 'C5', fit: 1, w: 8, h: 4, previewClass: 'preview-size-wide' },
  { id: 'full', label: 'Full Width Hub', sub: '12 × 4 cols', cat: 'C6', fit: 0, w: 12, h: 4, previewClass: 'preview-size-full' }
];

// 4 V6 Design System Card Background Tones
const CARD_TONES = [
  { id: 'surface', name: 'Default Surface', desc: 'Adapts to theme', swatchBg: 'var(--vq-surface, #ffffff)' },
  { id: 'accent', name: 'Mint Accent', desc: 'Teal brand gradient', swatchBg: 'linear-gradient(135deg, #0baa8f, #076b5e)' },
  { id: 'ink', name: 'Obsidian Ink', desc: 'Always dark obsidian', swatchBg: '#0d1412' },
  { id: 'mesh', name: 'Aurora Mesh', desc: 'Teal / sky gradient mesh', swatchBg: 'radial-gradient(circle at 100% 0%, #93ebd6 0%, #8fd9f5 100%)' }
];

// Pre-packaged Operations & Command Cards
const OPERATIONAL_TEMPLATES = [
  {
    type: 'action_hub',
    title: 'Quick Operations Hub',
    desc: '3-button fast lane: Point of Sale (Green), Purchase Orders (Red), and Quick Actions (+).',
    category: 'Operations',
    defaultSize: { w: 6, h: 2, cat: 'C4', label: 'Wide Hub (6 × 2)' },
    tone: 'ink'
  },
  {
    type: 'bank_liquidity',
    title: 'Bank & Liquid Net Balances',
    desc: 'Live breakdown of active bank accounts, cash drawer holdings, and total liquid net balance.',
    category: 'Finance',
    defaultSize: { w: 6, h: 2, cat: 'C4', label: 'Wide Tile (6 × 2)' },
    tone: 'surface'
  },
  {
    type: 'alerts_hub',
    title: 'Actions Required & Alerts',
    desc: 'Live operational alerts: low stock reorders, overdue receivables, and warehouse shipments.',
    category: 'Operations',
    defaultSize: { w: 6, h: 3, cat: 'C4', label: 'Alert Box (6 × 3)' },
    tone: 'surface'
  },
  {
    type: 'growth_engine',
    title: 'Growth Engine & Target Pace',
    desc: 'Revenue velocity, target progress on-track indicator, and repeat customer retention rate.',
    category: 'Sales',
    defaultSize: { w: 6, h: 2, cat: 'C4', label: 'Growth Strip (6 × 2)' },
    tone: 'surface'
  }
];

// Shortcut Action targets for Custom Button Builder
const SHORTCUT_TARGETS = [
  { label: 'Point of Sale (POS)', url: '/pos', icon: 'cart', color: '#0baa8f' },
  { label: 'Create New Invoice', url: '/s/my-business-store-353/sales', icon: 'file', color: '#2ba5d1' },
  { label: 'Inventory & Stock List', url: '/s/my-business-store-353/inventory', icon: 'box', color: '#8ccb2e' },
  { label: 'Create Purchase Order', url: '/s/my-business-store-353/purchase-orders', icon: 'truck', color: '#f26a47' },
  { label: 'Financial Accounts & Ledgers', url: '/s/my-business-store-353/finance', icon: 'dollar', color: '#5227ff' },
  { label: 'Parties & Customers CRM', url: '/s/my-business-store-353/parties', icon: 'users', color: '#e0b4e0' },
  { label: 'Business Intel Reports', url: '/s/my-business-store-353/reports', icon: 'chart', color: '#f5b32e' }
];

export default function NewDashboard(props) {
  const containerRef = useRef(null);
  const previewRef = useRef(null);
  
  // Dashboard & Navigation State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // 1. Center 3D Floating Folder Stage State
  const [folderLauncherOpen, setFolderLauncherOpen] = useState(false);

  // 2. Stepper Modal Dialog State
  const [stepperModalOpen, setStepperModalOpen] = useState(false);
  const [categoryFolderIndex, setCategoryFolderIndex] = useState(0); // 0: Metric Readings, 1: Operations Hubs, 2: Custom Shortcuts
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('All');
  
  // 3. Quick Actions GlassIcons Popup State
  const [glassModalOpen, setGlassModalOpen] = useState(false);

  // Expose global opener for GlassIcons popup
  useEffect(() => {
    window._vqOpenGlassActions = () => setGlassModalOpen(true);
    return () => { window._vqOpenGlassActions = null; };
  }, []);

  // Selected Card Draft
  const [selectedReading, setSelectedReading] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customBtnTarget, setCustomBtnTarget] = useState(SHORTCUT_TARGETS[0]);

  // Card Customization Draft State
  const [selectedSizeId, setSelectedSizeId] = useState('standard');
  const [draftChart, setDraftChart] = useState('area');
  const [draftVariant, setDraftVariant] = useState('gradient');
  const [draftTone, setDraftTone] = useState('surface');
  const [draftPeriod, setDraftPeriod] = useState('Month');
  const [draftAccent, setDraftAccent] = useState(false);
  const [draftStarBorder, setDraftStarBorder] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');

  const store = props?.store || { name: 'VenQore Main Outlet', currency_symbol: 'Rs' };
  const user = props?.auth?.user || { name: 'Store Owner', email: 'business@venqore.com' };

  useEffect(() => {
    runCardBuilder();
  }, []);

  // Launch Category Choice from 3D Floating Folder
  const launchCategoryModal = (catIndex) => {
    setCategoryFolderIndex(catIndex);
    setFolderLauncherOpen(false);
    setStep(1);
    setSelectedReading(null);
    setSelectedTemplate(null);
    setStepperModalOpen(true);
  };

  // Update preview in Step 2 whenever configuration changes
  useEffect(() => {
    if (stepperModalOpen && step === 2 && previewRef.current && window.VenQoreCards) {
      const targetSize = CARD_SIZES.find(s => s.id === selectedSizeId) || CARD_SIZES[2];
      
      let cardDraft = null;

      if (categoryFolderIndex === 0 && selectedReading) {
        cardDraft = {
          id: 'preview-card',
          key: selectedReading.key,
          cat: targetSize.cat,
          chart: draftChart,
          variant: draftVariant,
          period: draftPeriod,
          fit: targetSize.fit,
          tone: draftTone,
          accent: draftTone === 'accent' || draftAccent,
          starBorder: draftStarBorder,
          title: draftTitle || selectedReading.label,
          w: targetSize.w,
          h: targetSize.h,
          extraKeys: []
        };
      } else if (categoryFolderIndex === 1 && selectedTemplate) {
        cardDraft = {
          id: 'preview-card',
          type: selectedTemplate.type,
          title: draftTitle || selectedTemplate.title,
          tone: draftTone || selectedTemplate.tone,
          cat: selectedTemplate.defaultSize.cat,
          w: selectedTemplate.defaultSize.w,
          h: selectedTemplate.defaultSize.h
        };
      } else if (categoryFolderIndex === 2) {
        cardDraft = {
          id: 'preview-card',
          type: 'custom_button',
          title: draftTitle || customBtnTarget.label,
          targetUrl: customBtnTarget.url,
          btnColor: customBtnTarget.color,
          tone: draftTone,
          cat: 'C2',
          w: 3,
          h: 2
        };
      }

      if (cardDraft) {
        const cardHtml = window.VenQoreCards.renderCard(cardDraft);
        previewRef.current.innerHTML = cardHtml;
        
        const cardEl = previewRef.current.querySelector(".vqc");
        if (cardEl) {
          cardEl.classList.add(targetSize.previewClass);
        }
        
        requestAnimationFrame(() => {
          const host = previewRef.current?.querySelector(".vqc-host");
          if (host) {
            window.VenQoreCards.mountChart(host, cardDraft);
          }
        });
      }
    }
  }, [stepperModalOpen, step, categoryFolderIndex, selectedReading, selectedTemplate, customBtnTarget, selectedSizeId, draftChart, draftVariant, draftTone, draftPeriod, draftAccent, draftStarBorder, draftTitle]);

  // Open Step 2 for a selected reading
  const selectMetricForStep2 = (rd) => {
    setSelectedReading(rd);
    setSelectedTemplate(null);
    const shape = rd.shape;
    
    let defaultChart = 'area';
    let defaultVar = 'gradient';
    let initialSize = 'standard';

    if (shape === 'SCALAR') {
      defaultChart = 'stat';
      defaultVar = 'spark';
      initialSize = 'compact';
    } else if (shape === 'GAUGE') {
      defaultChart = 'gauge';
      defaultVar = 'standard';
      initialSize = 'square';
    } else if (shape === 'TABLE') {
      defaultChart = 'table';
      defaultVar = 'standard';
      initialSize = 'full';
    } else if (shape === 'FEED') {
      defaultChart = 'feed';
      defaultVar = 'live';
      initialSize = 'full';
    } else if (shape === 'BREAKDOWN') {
      defaultChart = 'bar';
      defaultVar = 'grouped';
      initialSize = 'standard';
    } else if (shape === 'RANKING') {
      defaultChart = 'funnel';
      defaultVar = 'solid';
      initialSize = 'standard';
    } else {
      defaultChart = 'area';
      defaultVar = 'gradient';
      initialSize = 'standard';
    }
    
    setDraftChart(defaultChart);
    setDraftVariant(defaultVar);
    setSelectedSizeId(initialSize);
    setDraftTone('surface');
    setDraftPeriod('Month');
    setDraftTitle(rd.label);
    setDraftAccent(false);
    setDraftStarBorder(false);
    setStep(2);
  };

  // Open Step 2 for an Operational Template
  const selectTemplateForStep2 = (tmpl) => {
    setSelectedTemplate(tmpl);
    setSelectedReading(null);
    setDraftTone(tmpl.tone || 'surface');
    setDraftTitle(tmpl.title);
    setStep(2);
  };

  // Open Step 2 for Custom Button
  const selectCustomBtnForStep2 = (target) => {
    setCustomBtnTarget(target);
    setSelectedReading(null);
    setSelectedTemplate(null);
    setDraftTone('surface');
    setDraftTitle(target.label);
    setStep(2);
  };

  // Helper: auto-resize card when chart type changes
  const handleChartSelect = (chartType) => {
    setDraftChart(chartType);
    
    const engine = window.VenQoreCards;
    if (engine && typeof engine.minSizeFor === 'function') {
      const mockCard = { chart: chartType, key: selectedReading?.key || 'sales.revenue', extraKeys: [], period: draftPeriod };
      const [minW, minH] = engine.minSizeFor(mockCard);
      
      const currentSize = CARD_SIZES.find(s => s.id === selectedSizeId) || CARD_SIZES[2];
      
      if (currentSize.w < minW || currentSize.h < minH) {
        const fittingSize = CARD_SIZES.find(s => s.w >= minW && s.h >= minH) || CARD_SIZES[4];
        setSelectedSizeId(fittingSize.id);
      }
    }

    const variants = window.VenQoreCards?.getVariants?.() || {};
    const chartVars = variants[chartType];
    if (chartVars && chartVars.length > 0) {
      setDraftVariant(chartVars[0][0]);
    }
  };

  // Handle user explicitly selecting a size
  const handleSizeSelect = (sizeId) => {
    const s = CARD_SIZES.find(x => x.id === sizeId);
    if (!s) return;
    
    const engine = window.VenQoreCards;
    if (engine && typeof engine.minSizeFor === 'function') {
      const mockCard = { chart: draftChart, key: selectedReading?.key || 'sales.revenue', extraKeys: [], period: draftPeriod };
      const [minW, minH] = engine.minSizeFor(mockCard);
      
      if (s.w < minW || s.h < minH) {
        if (sizeId === 'compact') {
          setDraftChart('stat');
          setDraftVariant('spark');
        } else if (sizeId === 'square') {
          setDraftChart('gauge');
          setDraftVariant('standard');
        } else {
          setDraftChart('area');
          setDraftVariant('gradient');
        }
      }
    }

    setSelectedSizeId(sizeId);
  };

  // Add customized card to dashboard
  const handleAddCardConfirm = () => {
    if (!window.VenQoreCards) return;
    
    let newCard = null;

    if (categoryFolderIndex === 0 && selectedReading) {
      const targetSize = CARD_SIZES.find(s => s.id === selectedSizeId) || CARD_SIZES[2];
      newCard = {
        id: 'c-' + Math.random().toString(36).substring(2, 9),
        key: selectedReading.key,
        cat: targetSize.cat,
        chart: draftChart,
        variant: draftVariant,
        period: draftPeriod,
        fit: targetSize.fit,
        tone: draftTone,
        accent: draftTone === 'accent' || draftAccent,
        starBorder: draftStarBorder,
        title: draftTitle || selectedReading.label,
        w: targetSize.w,
        h: targetSize.h,
        extraKeys: []
      };
    } else if (categoryFolderIndex === 1 && selectedTemplate) {
      newCard = {
        id: 'c-' + Math.random().toString(36).substring(2, 9),
        type: selectedTemplate.type,
        title: draftTitle || selectedTemplate.title,
        tone: draftTone || selectedTemplate.tone,
        cat: selectedTemplate.defaultSize.cat,
        w: selectedTemplate.defaultSize.w,
        h: selectedTemplate.defaultSize.h
      };
    } else if (categoryFolderIndex === 2) {
      newCard = {
        id: 'c-' + Math.random().toString(36).substring(2, 9),
        type: 'custom_button',
        title: draftTitle || customBtnTarget.label,
        targetUrl: customBtnTarget.url,
        btnColor: customBtnTarget.color,
        tone: draftTone,
        cat: 'C2',
        w: 3,
        h: 2
      };
    }

    if (newCard) {
      const current = window.VenQoreCards.getCards();
      window.VenQoreCards.setCards([...current, newCard]);
      setStepperModalOpen(false);
      setStep(1);
    }
  };

  // Reset to initial cards
  const handleResetLayout = () => {
    if (window.VenQoreCards && typeof window.VenQoreCards.boot === 'function') {
      window.VenQoreCards.boot();
    }
    setMenuOpen(false);
  };

  // Catalog data
  const readings = window.VenQoreCards?.getReadings() || [];
  
  // Dynamically derive populated areas from readings so no empty chips ever appear
  const availableAreas = useMemo(() => {
    const rawAreas = Array.from(new Set(readings.map(r => r.area).filter(Boolean)));
    return ['All', ...rawAreas];
  }, [readings]);
  
  const filteredReadings = useMemo(() => {
    return readings.filter(r => {
      const matchesArea = selectedArea === 'All' || r.area === selectedArea;
      const matchesQuery = !searchQuery || 
        r.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.key.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesArea && matchesQuery;
    });
  }, [readings, selectedArea, searchQuery]);

  // Group filtered readings by area (only populated sections)
  const groupedSections = useMemo(() => {
    const groups = {};
    filteredReadings.forEach(r => {
      const area = r.area || 'General';
      if (!groups[area]) groups[area] = [];
      groups[area].push(r);
    });
    return groups;
  }, [filteredReadings]);

  // Legal chart types for current reading
  const legalMap = window.VenQoreCards?.getLegalCharts?.() || {};
  const legalCharts = (selectedReading ? legalMap[selectedReading.shape] : null) || ['area', 'bar', 'line', 'stat', 'gauge', 'funnel', 'table', 'feed', 'heatmap'];
  const chartNames = window.VenQoreCards?.getChartNames?.() || {};

  // Variants for current chart
  const variantsMap = window.VenQoreCards?.getVariants?.() || {};
  const currentVariants = variantsMap[draftChart] || [['standard', 'Standard']];

  // GlassIcons items for the center action popup
  const glassActionItems = [
    {
      label: 'POS Register',
      color: 'teal',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>,
      href: '/pos'
    },
    {
      label: 'New Invoice',
      color: 'blue',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>,
      href: '/s/my-business-store-353/sales'
    },
    {
      label: 'Add Product',
      color: 'orange',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/></svg>,
      href: '/s/my-business-store-353/inventory'
    },
    {
      label: 'Stock Intake',
      color: 'purple',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/></svg>,
      href: '/s/my-business-store-353/purchase-orders'
    },
    {
      label: 'New Customer',
      color: 'sky',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
      href: '/s/my-business-store-353/parties'
    },
    {
      label: 'Add Expense',
      color: 'coral',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
      href: '/s/my-business-store-353/finance'
    }
  ];

  return (
    <div ref={containerRef} className={`vq-shell ${isEditMode ? 'is-editing' : ''}`} style={{ minHeight: '100vh', background: 'var(--vq-bg)' }}>
      <Head title="Command Center — New Dashboard" />

      {/* Slide-over scrim */}
      <div id="vq-scrim" className="vq-scrim" onClick={() => {
        document.getElementById("lib")?.classList.remove("is-on");
        document.getElementById("edit")?.classList.remove("is-on");
        document.getElementById("vq-scrim")?.classList.remove("is-on");
      }}></div>

      {/* Enterprise Sidebar */}
      <aside className={`vq-sidebar ${sidebarCollapsed ? 'is-collapsed' : ''}`} style={sidebarCollapsed ? { width: '72px' } : {}}>
        <div className="vq-sidebar-top">
          <div className="vq-brand-badge">V</div>
          {!sidebarCollapsed && (
            <div className="vq-brand-info">
              <div className="vq-brand-name">
                VenQore <span style={{ fontSize: '10px', background: 'var(--vq-teal-500)', color: '#fff', padding: '1px 5px', borderRadius: '4px' }}>v6</span>
              </div>
              <div className="vq-brand-sub">Enterprise POS</div>
            </div>
          )}
        </div>

        {!sidebarCollapsed && (
          <div className="vq-store-switcher" title="Switch Store Location">
            <div className="vq-store-details">
              <span className="vq-store-dot"></span>
              <span className="vq-store-name">{store?.name || 'Main Showroom'}</span>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        )}

        <div className="vq-nav-scroll">
          <div className="vq-nav-group">
            {!sidebarCollapsed && <div className="vq-nav-group-title">Main</div>}
            <div className="vq-nav-list">
              <a href="/new-dashboard" className="vq-nav-item is-active">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
                {!sidebarCollapsed && <span>Dashboard v6</span>}
                {!sidebarCollapsed && <span className="vq-nav-badge">Live</span>}
              </a>

              <a href="/pos" className="vq-nav-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                {!sidebarCollapsed && <span>Point of Sale</span>}
              </a>
            </div>
          </div>

          <div className="vq-nav-group">
            {!sidebarCollapsed && <div className="vq-nav-group-title">Operations</div>}
            <div className="vq-nav-list">
              <a href="/s/my-business-store-353/inventory" className="vq-nav-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                {!sidebarCollapsed && <span>Inventory & Stock</span>}
              </a>

              <a href="/s/my-business-store-353/sales" className="vq-nav-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                {!sidebarCollapsed && <span>Sales & Invoices</span>}
              </a>

              <a href="/s/my-business-store-353/purchase-orders" className="vq-nav-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                {!sidebarCollapsed && <span>Purchasing</span>}
              </a>
            </div>
          </div>

          <div className="vq-nav-group">
            {!sidebarCollapsed && <div className="vq-nav-group-title">Financials</div>}
            <div className="vq-nav-list">
              <a href="/s/my-business-store-353/finance" className="vq-nav-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                {!sidebarCollapsed && <span>Finance & Accounts</span>}
              </a>

              <a href="/s/my-business-store-353/reports" className="vq-nav-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                {!sidebarCollapsed && <span>Reports & Intel</span>}
              </a>

              <a href="/s/my-business-store-353/parties" className="vq-nav-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                {!sidebarCollapsed && <span>Parties & CRM</span>}
              </a>
            </div>
          </div>

          <div className="vq-nav-group">
            {!sidebarCollapsed && <div className="vq-nav-group-title">System</div>}
            <div className="vq-nav-list">
              <a href="/s/my-business-store-353/settings" className="vq-nav-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                {!sidebarCollapsed && <span>Settings</span>}
              </a>
            </div>
          </div>
        </div>

        <div className="vq-sidebar-footer">
          <div className="vq-user-avatar">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'SO'}
          </div>
          {!sidebarCollapsed && (
            <div className="vq-user-info">
              <span className="vq-user-name">{user?.name || 'Store Owner'}</span>
              <span className="vq-user-role">{user?.email || 'business@venqore.com'}</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="vq-main-stage">
        <header className="vq-main-header">
          <div className="vq-header-left">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--vq-text-2)', padding: '6px', borderRadius: '6px' }}
              title="Toggle Sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div className="vq-breadcrumbs">
              <span>VenQore</span>
              <span>/</span>
              <span className="active">Command Center</span>
            </div>
            <div className={`vq-status-pill ${isEditMode ? 'is-editing' : ''}`}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isEditMode ? 'var(--vq-butter-500)' : 'var(--vq-teal-500)' }}></span>
              <span>{isEditMode ? 'Edit Mode Active' : 'Live System'}</span>
            </div>
          </div>

          <div className="vq-header-right">
            <button
              onClick={() => setGlassModalOpen(true)}
              className="vq-choice-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}
            >
              <span style={{ color: 'var(--vq-teal-500)', fontSize: '15px' }}>⚡</span>
              <span>Quick Actions</span>
            </button>

            {/* Desktop / Windows Style Add Card Folder Trigger */}
            <button
              onClick={() => setFolderLauncherOpen(true)}
              className="vq-desktop-folder-btn"
              title="Add New Card"
            >
              <div className="vq-desktop-folder-icon">
                <div className="vq-desktop-folder-papers"></div>
                <div className="vq-desktop-folder-front"></div>
              </div>
              <span className="vq-desktop-folder-label">Add Card</span>
            </button>

            <button id="vq-theme" className="pg-theme" aria-label="Toggle light and dark theme">
              <span className="pg-theme-l">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/></svg>
              </span>
              <span className="pg-theme-d">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              </span>
            </button>

            <div className="vq-menu-container">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="vq-dots-btn"
                title="Dashboard Options"
                aria-label="Dashboard Options"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
              </button>

              {menuOpen && (
                <div className="vq-dropdown-menu">
                  <button
                    className="vq-dropdown-item"
                    onClick={() => {
                      setIsEditMode(!isEditMode);
                      setMenuOpen(false);
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                    <span>{isEditMode ? 'Done Editing' : 'Edit Layout'}</span>
                  </button>

                  <button
                    className="vq-dropdown-item"
                    onClick={() => {
                      setFolderLauncherOpen(true);
                      setMenuOpen(false);
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    <span>Add New Card</span>
                  </button>

                  <div className="vq-dropdown-divider"></div>

                  <button
                    className="vq-dropdown-item"
                    onClick={handleResetLayout}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                    <span>Reset Layout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {isEditMode && (
          <div className="vq-edit-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
              <span>Edit Mode Active — Drag cards to rearrange, drag corner to resize, or click pencil to edit.</span>
            </div>
            <button className="vq-edit-banner-btn" onClick={() => setIsEditMode(false)}>
              Done Editing
            </button>
          </div>
        )}

        <main className="app">
          <div className="vq-canvas">
            <div className="board-h">
              <div>
                <h1>Your dashboard</h1>
                <p className="board-sub">
                  <span id="count" className="pill-n">0</span> cards.
                  Hover a chart to read any point — the crosshair snaps to the nearest one and the
                  headline re-reads to it.
                </p>
              </div>
              <div className="board-actions">
                <button
                  onClick={() => setFolderLauncherOpen(true)}
                  className="vq-desktop-folder-btn"
                  title="Add New Card"
                >
                  <div className="vq-desktop-folder-icon">
                    <div className="vq-desktop-folder-papers"></div>
                    <div className="vq-desktop-folder-front"></div>
                  </div>
                  <span className="vq-desktop-folder-label">Add Card</span>
                </button>
              </div>
            </div>

            <div className="vq-grid" id="board"></div>
          </div>
        </main>
      </div>

      {/* ── 1. CENTER 3D FLOATING FOLDER CATEGORY LAUNCHER (NO CARD CONTAINER) ── */}
      {folderLauncherOpen && (
        <div className="vq-folder-portal-overlay" onClick={() => setFolderLauncherOpen(false)}>
          <button
            className="vq-folder-portal-floating-close"
            onClick={() => setFolderLauncherOpen(false)}
            aria-label="Close"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>

          <Folder
            size={1.75}
            color="#0baa8f"
            selectedIndex={categoryFolderIndex}
            autoAnimateOpen={true}
            onSelectCategory={(i) => launchCategoryModal(i)}
            items={[
              <div className="vq-folder-paper-content">
                <span className="vq-folder-paper-icon">📊</span>
                <span className="vq-folder-paper-title">Readings</span>
                <span className="vq-folder-paper-sub">108 Metrics</span>
              </div>,
              <div className="vq-folder-paper-content">
                <span className="vq-folder-paper-icon">⚡</span>
                <span className="vq-folder-paper-title">Operations</span>
                <span className="vq-folder-paper-sub">Hubs & Live</span>
              </div>,
              <div className="vq-folder-paper-content">
                <span className="vq-folder-paper-icon">🚀</span>
                <span className="vq-folder-paper-title">Shortcuts</span>
                <span className="vq-folder-paper-sub">1-Click Jump</span>
              </div>
            ]}
          />
        </div>
      )}

      {/* ── 2. STEPPER MODAL DIALOG (STRICT V6 DESIGN SYSTEM) ── */}
      {stepperModalOpen && (
        <div className="vq-modal-overlay" onClick={() => setStepperModalOpen(false)}>
          <div className="vq-modal-card" onClick={e => e.stopPropagation()}>
            {/* Top Bar with Stepper */}
            <div className="vq-modal-top-bar">
              <div>
                <div className="vq-modal-step-sub">
                  {categoryFolderIndex === 0 ? 'ANALYTICS READINGS' : categoryFolderIndex === 1 ? 'OPERATIONS & HUBS' : 'CUSTOM SHORTCUT'} · STEP {step} OF 3
                </div>
                <div className="vq-modal-heading">
                  {step === 1 ? 'Select Card' : step === 2 ? 'Visual Styling & Theme' : 'Preview & Add'}
                </div>
              </div>
              <button
                className="vq-modal-close-x"
                onClick={() => setStepperModalOpen(false)}
                aria-label="Close modal"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            {/* Stepper Navigation Bar */}
            <div style={{ padding: '0 32px 12px' }}>
              <Stepper
                steps={[
                  { label: 'Select Card' },
                  { label: 'Visual Styling' },
                  { label: 'Preview & Place' }
                ]}
                currentStep={step}
                onStepClick={(s) => {
                  if (s <= step || (s === 2 && (selectedReading || selectedTemplate || customBtnTarget))) {
                    setStep(s);
                  }
                }}
              />
            </div>

            {/* Step 1 Filters for Metrics */}
            {step === 1 && categoryFolderIndex === 0 && (
              <div className="vq-modal-filter-zone">
                <div className="vq-modal-search-wrapper">
                  <svg className="vq-modal-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                  <input
                    type="text"
                    className="vq-modal-search-input"
                    placeholder={`Search ${readings.length} readings...`}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="vq-modal-chips-row">
                  {availableAreas.map(a => (
                    <button
                      key={a}
                      className={`vq-modal-chip ${selectedArea === a ? 'is-active' : ''}`}
                      onClick={() => setSelectedArea(a)}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Scrollable Content Body */}
            <div className="vq-modal-scroll-area">
              {step === 1 ? (
                categoryFolderIndex === 0 ? (
                  /* 1. Metric Readings */
                  Object.keys(groupedSections).map(area => (
                    <div key={area} className="vq-modal-section-group">
                      <div className="vq-modal-section-title">{area}</div>
                      <div className="vq-modal-cards-grid">
                        {groupedSections[area].map(r => (
                          <div
                            key={r.key}
                            className="vq-item-card"
                            onClick={() => selectMetricForStep2(r)}
                          >
                            <div className="vq-item-card-top">
                              <span className="vq-item-card-title">{r.label}</span>
                              {r.extra && (
                                <span className="vq-item-new-badge">✨ NEW</span>
                              )}
                            </div>
                            
                            <p className="vq-item-card-desc">
                              Real-time metric monitoring for {r.label.toLowerCase()}.
                            </p>

                            <div className="vq-item-card-foot">
                              <span className="vq-item-shape-tag">
                                {r.shape || 'NUMBER'}
                              </span>
                              <span className="vq-item-card-key">{r.key}</span>
                              <svg className="vq-item-card-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : categoryFolderIndex === 1 ? (
                  /* 2. Operational & Command Hub Cards */
                  <div className="vq-modal-section-group">
                    <div className="vq-modal-section-title">OPERATIONAL & COMMAND CARDS</div>
                    <div className="vq-modal-cards-grid">
                      {OPERATIONAL_TEMPLATES.map(tmpl => (
                        <div
                          key={tmpl.type}
                          className="vq-item-card"
                          onClick={() => selectTemplateForStep2(tmpl)}
                        >
                          <div className="vq-item-card-top">
                            <span className="vq-item-card-title">{tmpl.title}</span>
                            <span className="vq-item-new-badge">⚡ Interactive</span>
                          </div>
                          
                          <p className="vq-item-card-desc">{tmpl.desc}</p>

                          <div className="vq-item-card-foot">
                            <span className="vq-item-shape-tag">{tmpl.defaultSize.label}</span>
                            <span className="vq-item-card-key">{tmpl.category}</span>
                            <svg className="vq-item-card-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* 3. Custom Action Button Shortcuts */
                  <div className="vq-modal-section-group">
                    <div className="vq-modal-section-title">CREATE YOUR OWN ACTION SHORTCUT</div>
                    <div className="vq-modal-cards-grid">
                      {SHORTCUT_TARGETS.map(target => (
                        <div
                          key={target.url}
                          className="vq-item-card"
                          onClick={() => selectCustomBtnForStep2(target)}
                        >
                          <div className="vq-item-card-top">
                            <span className="vq-item-card-title">{target.label}</span>
                            <span className="vq-item-new-badge" style={{ background: 'var(--vq-teal-50)', color: 'var(--vq-teal-700)' }}>1-Click</span>
                          </div>
                          
                          <p className="vq-item-card-desc">Direct jump shortcut to {target.label} workflow.</p>

                          <div className="vq-item-card-foot">
                            <span className="vq-item-shape-tag" style={{ background: target.color, color: '#fff' }}>SHORTCUT</span>
                            <span className="vq-item-card-key">{target.url}</span>
                            <svg className="vq-item-card-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ) : (
                /* Step 2: Visual Styling & Controls Pane with Live Preview */
                <div className="vq-step2-layout">
                  {/* Left Controls Pane */}
                  <div className="vq-controls-pane">
                    {/* Title */}
                    <div className="vq-form-group">
                      <label className="vq-form-label">CUSTOM CARD TITLE</label>
                      <input
                        type="text"
                        className="vq-modal-search-input"
                        style={{ height: '38px', padding: '0 14px' }}
                        value={draftTitle}
                        onChange={e => setDraftTitle(e.target.value)}
                        placeholder="Enter card display title..."
                      />
                    </div>

                    {categoryFolderIndex === 0 && (
                      <>
                        {/* Card Size Selector */}
                        <div className="vq-form-group">
                          <label className="vq-form-label">
                            <span>CARD SIZE</span>
                            <span className="vq-form-sublabel">Auto-scales layout</span>
                          </label>
                          <div className="vq-size-grid">
                            {CARD_SIZES.map(s => (
                              <div
                                key={s.id}
                                className={`vq-size-card ${selectedSizeId === s.id ? 'is-active' : ''}`}
                                onClick={() => handleSizeSelect(s.id)}
                              >
                                <div className="vq-size-card-title">{s.label}</div>
                                <div className="vq-size-card-desc">{s.sub}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Chart Type Selector */}
                        <div className="vq-form-group">
                          <label className="vq-form-label">
                            <span>CHART TYPE</span>
                            <span className="vq-form-sublabel">Auto-resizes card if needed</span>
                          </label>
                          <div className="vq-select-btn-group">
                            {legalCharts.map(ch => (
                              <button
                                key={ch}
                                className={`vq-choice-btn ${draftChart === ch ? 'is-active' : ''}`}
                                onClick={() => handleChartSelect(ch)}
                              >
                                {chartNames[ch] || ch}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Visual Variant Selector */}
                        <div className="vq-form-group">
                          <label className="vq-form-label">VISUAL VARIANT</label>
                          <div className="vq-select-btn-group">
                            {currentVariants.map(([v, n]) => (
                              <button
                                key={v}
                                className={`vq-choice-btn ${draftVariant === v ? 'is-active' : ''}`}
                                onClick={() => setDraftVariant(v)}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Card Background Tone Selector (V6 Design System) */}
                    <div className="vq-form-group">
                      <label className="vq-form-label">CARD BACKGROUND TONE</label>
                      <div className="vq-tone-grid">
                        {CARD_TONES.map(t => (
                          <div
                            key={t.id}
                            className={`vq-tone-card ${draftTone === t.id ? 'is-active' : ''}`}
                            onClick={() => setDraftTone(t.id)}
                          >
                            <div className="vq-tone-swatch" style={{ background: t.swatchBg }}></div>
                            <div className="vq-tone-info">
                              <span className="vq-tone-name">{t.name}</span>
                              <span className="vq-tone-desc">{t.desc}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Default Timeframe */}
                    {categoryFolderIndex === 0 && (
                      <div className="vq-form-group">
                        <label className="vq-form-label">DEFAULT TIMEFRAME</label>
                        <div className="vq-select-btn-group">
                          {['Today', 'Week', 'Month', 'Quarter', 'Year'].map(p => (
                            <button
                              key={p}
                              className={`vq-choice-btn ${draftPeriod === p ? 'is-active' : ''}`}
                              onClick={() => setDraftPeriod(p)}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* StarBorder Glowing Edge Option */}
                    <div
                      className="vq-v6-switch-wrapper"
                      onClick={() => setDraftStarBorder(!draftStarBorder)}
                      role="switch"
                      aria-checked={draftStarBorder}
                    >
                      <div className="vq-v6-switch-label">
                        <span className="vq-v6-switch-title">Animated Star Border</span>
                        <span className="vq-v6-switch-sub">High-priority highlighted card glow</span>
                      </div>
                      <div className={`vq-v6-switch-track ${draftStarBorder ? 'is-on' : ''}`}>
                        <div className="vq-v6-switch-knob"></div>
                      </div>
                    </div>

                    {/* Glare Shine Switch */}
                    <div
                      className="vq-v6-switch-wrapper"
                      onClick={() => setDraftAccent(!draftAccent)}
                      role="switch"
                      aria-checked={draftAccent}
                    >
                      <div className="vq-v6-switch-label">
                        <span className="vq-v6-switch-title">Animated Glare Reflex</span>
                        <span className="vq-v6-switch-sub">Holographic light reflection</span>
                      </div>
                      <div className={`vq-v6-switch-track ${draftAccent ? 'is-on' : ''}`}>
                        <div className="vq-v6-switch-knob"></div>
                      </div>
                    </div>
                  </div>

                  {/* Right Live Dashboard Preview */}
                  <div className="vq-preview-stage">
                    <div style={{ position: 'absolute', top: '14px', left: '18px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--vq-text-3)', letterSpacing: '0.06em' }}>
                      LIVE PREVIEW
                    </div>
                    {draftStarBorder ? (
                      <StarBorder color="rgba(11, 170, 143, 0.95)" speed="4s">
                        <div ref={previewRef} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '340px' }}></div>
                      </StarBorder>
                    ) : (
                      <div ref={previewRef} style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '340px' }}></div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Bar */}
            <div className="vq-modal-bottom-bar">
              {step === 1 ? (
                <button
                  className="vq-choice-btn"
                  onClick={() => {
                    setStepperModalOpen(false);
                    setFolderLauncherOpen(true);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
                  <span>Change Category</span>
                </button>
              ) : (
                <button
                  className="vq-choice-btn"
                  onClick={() => setStep(1)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
                  <span>Change Card</span>
                </button>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="vq-modal-close-btn"
                  onClick={() => setStepperModalOpen(false)}
                >
                  Close
                </button>
                {step === 2 && (
                  <button
                    className="vqb vqb--primary"
                    onClick={handleAddCardConfirm}
                    style={{ padding: '9px 24px', borderRadius: 'var(--vq-r-full)', fontSize: '13px', fontWeight: 700 }}
                  >
                    Add to Dashboard
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. REACT BITS GLASS ICONS CENTER POPUP ── */}
      {glassModalOpen && (
        <div className="vq-glass-modal-overlay" onClick={() => setGlassModalOpen(false)}>
          <div className="vq-glass-modal-card" onClick={e => e.stopPropagation()}>
            <div className="vq-glass-modal-header">
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--vq-teal-600)' }}>
                  COMMAND CENTER FAST LANE
                </div>
                <div className="vq-glass-modal-title">Quick Actions</div>
              </div>
              <button
                className="vq-modal-close-x"
                onClick={() => setGlassModalOpen(false)}
                aria-label="Close Quick Actions"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <GlassIcons
              items={glassActionItems}
              onActionClick={(item) => {
                setGlassModalOpen(false);
                if (item.href) window.location.href = item.href;
              }}
            />
          </div>
        </div>
      )}

      {/* Slide-over Drawer Layer */}
      <aside className="side">
        <div id="edit"></div>
        <div className="panel" id="lib">
          <div className="panel-h">
            <h2 className="panel-t">Card library</h2>
            <button className="vqc-act" id="lib-close" aria-label="Close library">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
          <div className="panel-b" id="lib-body"></div>
        </div>
      </aside>
    </div>
  );
}

NewDashboard.layout = (page) => page;
