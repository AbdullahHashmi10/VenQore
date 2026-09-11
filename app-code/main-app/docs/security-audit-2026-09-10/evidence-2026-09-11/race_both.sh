#!/bin/bash
# Two concurrent POST /sales for the last unit, real HTTP, 2 PHP workers.
cd /tmp/e2e
TID=$(mysql -uroot -N amd_pos_e2e -e "select id from tenants where slug='e2e-mart'")
echo "== mode: stop_sale_negative_stock = ON (3 runs)"
mysql -uroot amd_pos_e2e -e "delete from settings where tenant_id='$TID' and \`key\`='stop_sale_negative_stock'; insert into settings (id,tenant_id,\`key\`,value,\`group\`,created_at,updated_at) values (uuid(),'$TID','stop_sale_negative_stock','1','inventory',now(),now())"
(cd /home/claude/vq/main && DB_DATABASE=amd_pos_e2e php artisan cache:clear >/dev/null 2>&1)
for i in 1 2 3; do python3 race.py; done
echo "== mode: stop_sale_negative_stock = OFF (store allows selling below zero) (1 run)"
mysql -uroot amd_pos_e2e -e "delete from settings where tenant_id='$TID' and \`key\`='stop_sale_negative_stock'"
(cd /home/claude/vq/main && DB_DATABASE=amd_pos_e2e php artisan cache:clear >/dev/null 2>&1)
python3 race.py
