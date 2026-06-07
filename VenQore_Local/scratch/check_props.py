import os
import re

def check_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if this is a React component (export default function ... or similar)
    if 'export default function' not in content:
        return

    # Find the main component function and its arguments
    match = re.search(r'export default function\s+(\w+)\s*\((.*?)\)', content)
    if not match:
        return
    
    func_name = match.group(1)
    args = match.group(2)
    
    # If props is in args, it's defined
    if 'props' in args:
        return
    
    # Check if props is defined via usePage()
    if 'const { props } = usePage()' in content or 'const {props} = usePage()' in content:
        return

    # Check for usage of props. (not page.props or data.props etc)
    # Match props.something but not something.props.anything or something.props
    # Also exclude comments
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if '//' in line:
            line = line.split('//')[0]
        
        # Look for "props." that isn't preceded by something else (like page. or res.data.)
        # We use a negative lookbehind if possible, or just check the character before
        # In Python regex, we can use (?<!\.)props\.
        matches = re.finditer(r'(?<![\w\.])props\.', line)
        for m in matches:
            print(f"Potential ReferenceError in {filepath}:{i+1} - Usage: {line.strip()}")

for root, dirs, files in os.walk('resources/js'):
    for file in files:
        if file.endswith('.jsx'):
            check_file(os.path.join(root, file))
