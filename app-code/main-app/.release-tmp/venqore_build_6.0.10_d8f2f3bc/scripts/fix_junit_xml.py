#!/usr/bin/env python3
"""
Robust JUnit XML merger for parallel-Pest output where workers race-write
to the same file, causing the second document to start mid-element.

Strategy:
1. Parse doc 1 fully (clean split at </testsuites>).
2. For doc 2: find the first COMPLETE <testsuite or <testsuites or <testcase
   opening tag, and prepend a synthetic wrapper, then parse.
3. Merge all testcase/testsuite elements into one <testsuites> root.
"""

import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


def clean(data: bytes) -> bytes:
    return re.sub(rb'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', b'', data)


def try_parse(data: bytes) -> ET.Element | None:
    try:
        return ET.fromstring(clean(data))
    except ET.ParseError as e:
        return None


def recover_second_doc(fragment: bytes) -> ET.Element | None:
    """
    The fragment may start mid-element. Find first complete <tag> opening.
    Prepend a synthetic <testsuites><testsuite tests="0"> wrapper, append </testsuite></testsuites>.
    """
    # Find the first < that starts a complete tag
    first_lt = fragment.find(b'<')
    if first_lt == -1:
        return None

    # Try: use from first_lt onward, wrap in testsuites
    tail = fragment[first_lt:]
    wrapped = b'<?xml version="1.0" encoding="UTF-8"?>\n<testsuites>\n' + tail + b'\n</testsuites>'
    result = try_parse(wrapped)
    if result is not None:
        return result

    # If that fails, find first <testcase or <testsuite at start of a line/tag
    for m in re.finditer(rb'<(testcase|testsuite|testsuites)\b', fragment):
        tail = fragment[m.start():]
        wrapped = b'<?xml version="1.0" encoding="UTF-8"?>\n<testsuites>\n' + tail + b'\n</testsuites>'
        result = try_parse(wrapped)
        if result is not None:
            print(f"  Recovered second doc starting at byte offset {m.start()} (tag: {m.group(0).decode()})")
            return result
    return None


def main():
    src = Path(sys.argv[1])
    dst = Path(sys.argv[2]) if len(sys.argv) > 2 else src.with_suffix('.merged.xml')

    data = src.read_bytes()
    print(f"Read {len(data):,} bytes")

    # Split on </testsuites>
    sep = b'</testsuites>'
    idx = data.find(sep)
    if idx == -1:
        print("No </testsuites> found — treating as single document")
        doc1_bytes = data
        doc2_bytes = b''
    else:
        doc1_bytes = data[:idx + len(sep)]
        doc2_bytes = data[idx + len(sep):]

    print(f"Doc 1: {len(doc1_bytes):,} bytes | Doc 2 fragment: {len(doc2_bytes):,} bytes")

    roots = []

    root1 = try_parse(doc1_bytes)
    if root1 is not None:
        print(f"Doc 1 parsed OK — children: {len(list(root1))}")
        roots.append(root1)
    else:
        print("Doc 1 parse FAILED")

    if doc2_bytes.strip():
        root2 = recover_second_doc(doc2_bytes)
        if root2 is not None:
            print(f"Doc 2 recovered — children: {len(list(root2))}")
            roots.append(root2)
        else:
            print("Doc 2 recovery FAILED — second fragment is too corrupted")

    if not roots:
        print("ERROR: no valid XML")
        sys.exit(1)

    # Merge into single <testsuites>
    merged = ET.Element('testsuites')
    for root in roots:
        if root.tag == 'testsuites':
            for child in root:
                merged.append(child)
        elif root.tag == 'testsuite':
            merged.append(root)
        else:
            merged.append(root)

    # Stats
    total_tests = sum(int(s.get('tests', 0)) for s in merged.iter('testsuite') if s.get('tests'))
    total_fails = sum(int(s.get('failures', 0)) for s in merged.iter('testsuite') if s.get('failures'))
    total_errors = sum(int(s.get('errors', 0)) for s in merged.iter('testsuite') if s.get('errors'))
    all_cases = list(merged.iter('testcase'))
    fail_cases = [c for c in all_cases if c.find('failure') is not None or c.find('error') is not None]
    print(f"\nMerged stats from XML attributes: tests={total_tests} failures={total_fails} errors={total_errors}")
    print(f"Testcase elements in tree: {len(all_cases)} (with failure/error elements: {len(fail_cases)})")

    tree = ET.ElementTree(merged)
    ET.indent(tree, space='  ')
    tree.write(dst, encoding='utf-8', xml_declaration=True)
    print(f"Written: {dst}")


if __name__ == '__main__':
    main()
