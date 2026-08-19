import re
import json

file_path = r"E:\AMD POS\AMD POS\app-code\main-app\resources\js\Pages\Marketing\Features.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Try to find all feature objects like { n: 'Name', d: 'Desc', status: 'soon' }
# Some might not have status.
pattern = r"\{\s*n:\s*['\"](.*?)['\"],\s*d:\s*['\"](.*?)['\"](?:,\s*status:\s*['\"](.*?)['\"])?\s*\}"
matches = re.findall(pattern, content)

results = {"missing_or_soon": [], "active": [], "beta": []}
for match in matches:
    name, desc, status = match
    if status == "soon":
        results["missing_or_soon"].append(name)
    elif status == "beta":
        results["beta"].append(name)
    elif desc.lower().find("coming soon") != -1 or desc.lower().find("planned") != -1:
        results["missing_or_soon"].append(name)
    else:
        results["active"].append(name)

artifact_path = r"C:\Users\PC\.gemini\antigravity\brain\e83589a7-1a0f-435e-a99d-a54bb24a08b9\missing_features_extracted.json"
with open(artifact_path, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=4)

print(f"Total parsed: {len(matches)}")
print(f"Missing/Soon: {len(results['missing_or_soon'])}")
print(f"Beta: {len(results['beta'])}")
print(f"Active: {len(results['active'])}")
