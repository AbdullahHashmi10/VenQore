#!/bin/bash
cd /tmp/e2e
mysql -uroot amd_pos_e2e -e "update users set two_factor_secret=null,two_factor_confirmed_at=null,two_factor_recovery_codes=null; update inventory_batches set remaining_qty=10 where purchase_invoice_id='opening-e2e'; update stocks set quantity=10; delete from settings where \`key\`='stop_sale_negative_stock'"
echo "== public pages, signup, login (email code)"; timeout 600 python3 e2e1.py 2>&1 | grep -E "^(PASS|FAIL|SUMMARY)"
echo "== 2FA + contact"; timeout 400 python3 tfa.py 2>&1 | grep -E "^(PASS|FAIL|SUMMARY)"
echo "== POS checkout"; timeout 300 python3 pos2.py 2>&1 | grep -E "^(PASS|FAIL|SUMMARY)"
echo "== terminal pairing"; timeout 120 python3 pair.py 2>&1 | grep -E "^(PASS|FAIL|SUMMARY)"
echo "== cashier approval"; timeout 400 python3 approval.py 2>&1 | grep -E "^(PASS|FAIL|SUMMARY)"
