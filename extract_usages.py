import os
import re
from collections import defaultdict

routes_dir = r"E:\AMD POS\AMD POS\app-code\main-app\routes"

usages = defaultdict(list)

# Regex to find plan.feature:KEY or feature:KEY
# Typical line: Route::get('/reports/purchases', [...])->middleware('plan.feature:purchase_orders')->name('reports.purchases');
# We will match the route path (e.g. '/reports/purchases') and the feature key.

for filename in os.listdir(routes_dir):
    if not filename.endswith(".php"): continue
    
    filepath = os.path.join(routes_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    for idx, line in enumerate(lines):
        if 'plan.feature:' in line or 'feature:' in line:
            # Extract the feature key
            key_match = re.search(r"['\"](?:plan\.)?feature:([^'\"]+)['\"]", line)
            if not key_match:
                continue
            key = key_match.group(1)
            
            # Try to extract the route method and path
            # Route::get('path', ...
            route_match = re.search(r"Route::([a-zA-Z]+)\s*\(\s*['\"]([^'\"]+)['\"]", line)
            
            # Try to extract resource route
            resource_match = re.search(r"Route::resource\s*\(\s*['\"]([^'\"]+)['\"]", line)
            
            # Try to extract group
            group_match = re.search(r"group\s*\(", line)
            
            # Name match
            name_match = re.search(r"->name\s*\(\s*['\"]([^'\"]+)['\"]", line)
            name = name_match.group(1) if name_match else ""
            
            usage_str = ""
            if route_match:
                method = route_match.group(1).upper()
                path = route_match.group(2)
                usage_str = f"[{method}] {path}"
            elif resource_match:
                path = resource_match.group(1)
                usage_str = f"[RESOURCE] {path}"
            elif group_match:
                usage_str = f"[GROUP MIDDLEWARE] Line {idx+1} in {filename}"
            else:
                usage_str = f"[OTHER] Line {idx+1} in {filename} ({line.strip()[:50]}...)"
                
            if name:
                usage_str += f" (name: {name})"
                
            usages[key].append(usage_str)

# Generate Markdown
artifact_path = r"C:\Users\PC\.gemini\antigravity\brain\e83589a7-1a0f-435e-a99d-a54bb24a08b9\38_feature_gates_usages.md"

# Sort keys by number of usages descending
sorted_keys = sorted(usages.keys(), key=lambda k: len(usages[k]), reverse=True)

with open(artifact_path, 'w', encoding='utf-8') as f:
    f.write("# Feature Gates & Their Usages (Routes)\n\n")
    f.write("This document lists each of the 38 feature gate keys and the exact routes (usages) that fall under them as subcategories.\n\n")
    
    for key in sorted_keys:
        f.write(f"## {key} ({len(usages[key])} usages)\n\n")
        for usage in usages[key]:
            f.write(f"- `{usage}`\n")
        f.write("\n")

print(f"Extracted {len(usages)} feature keys and their usages.")
