import os, re

tables = ['products', 'sales', 'sale_items', 'purchases', 'purchase_items', 'parties', 'accounts', 'journal_entries', 'journal_items', 'categories', 'warehouses', 'stocks', 'stock_movements', 'expenses', 'invoices', 'invoice_items', 'batches', 'serials']

dirs = ['app/Http/Controllers', 'app/Services', 'app/Console/Commands', 'app/Jobs']

issues = []

for d in dirs:
    if not os.path.exists(d): continue
    for root, _, files in os.walk(d):
        for file in files:
            if not file.endswith('.php'): continue
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # Check a) DB::table without where tenant_id
                # This matches DB::table('table') or DB::table('table as t')
                pattern = r"DB::table\(\s*['\"]([a-zA-Z_]+)(?:\s+as\s+[a-zA-Z_]+)?['\"]\s*\)"
                for m in re.finditer(pattern, content):
                    table = m.group(1)
                    if table in tables:
                        # Grab next 150 chars to check if tenant_id is appended
                        context = content[m.end():m.end()+150]
                        if "tenant_id" not in context:
                            issues.append(f"{path}: DB::table('{table}') missing tenant_id filter")

                # Check b) Model::all()
                for m in re.finditer(r"([A-Z][a-zA-Z]+)::all\(\)", content):
                    issues.append(f"{path}: Model::all() on {m.group(1)} (check HasTenant)")

                # Check c) Jobs without current.tenant
                if 'app\\Jobs' in path or 'app/Jobs' in path: 
                    if "app()->instance('current.tenant" not in content and "app('current.tenant')" not in content:
                        issues.append(f"{path}: Background job might not set tenant")

print("\n".join(issues))
