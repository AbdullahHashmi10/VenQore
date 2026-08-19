import re

file_path = r"E:\AMD POS\AMD POS\extras\AUDIT_2026-08-13\AI_BUILDER_MASTER_MAP.md"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Regex to match each capability block in the PHP array
pattern = r"'([a-z0-9_]+)'\s*=>\s*\[\s*'group'\s*=>\s*'([^']+)',\s*'label'\s*=>\s*'([^']+)',\s*'description'\s*=>\s*'([^']+)',(.*?)\s*\],"

matches = re.findall(pattern, content, re.DOTALL)

modules_by_group = {}
count = 0
for match in matches:
    key, group, label, desc, rest = match
    group = group.title()
    
    # Extract optional sub-features if present
    opt_match = re.search(r"'optional'\s*=>\s*\[(.*?)\]", rest)
    optional = []
    if opt_match:
        opt_str = opt_match.group(1)
        optional = [x.strip(" '\"") for x in opt_str.split(",") if x.strip()]
        
    if group not in modules_by_group:
        modules_by_group[group] = []
        
    modules_by_group[group].append({
        "key": key,
        "label": label,
        "desc": desc,
        "optional": optional
    })
    count += 1

artifact_path = r"C:\Users\PC\.gemini\antigravity\brain\e83589a7-1a0f-435e-a99d-a54bb24a08b9\ai_builder_modules.md"
with open(artifact_path, "w", encoding="utf-8") as out:
    out.write("# VenQore AI Builder Modules & Subcategories\n\n")
    out.write("Based on the audit file `AI_BUILDER_MASTER_MAP.md`, here is the breakdown of the Tier 1 Surface Modules. These are the main categories and the specific module subcategories/features that fall under them.\n\n")
    
    for group, mods in modules_by_group.items():
        out.write(f"## Category: {group}\n\n")
        for m in mods:
            out.write(f"- **{m['label']}**\n")
            out.write(f"  - **Description**: {m['desc']}\n")
            out.write(f"  - **System Key**: `{m['key']}`\n")
            if m['optional']:
                out.write(f"  - **Sub-features / Add-ons**: {', '.join(m['optional'])}\n")
        out.write("\n")

print(f"Extracted {count} modules to ai_builder_modules.md")
