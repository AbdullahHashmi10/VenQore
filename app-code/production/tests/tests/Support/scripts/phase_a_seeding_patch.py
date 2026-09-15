#!/usr/bin/env python3
"""Phase A seeding-architecture patch (audit F-03/F-04/FC-5).

Removes in-test DB::commit()/beginTransaction() seeding surgery and the
DatabaseTransactions double-stack from the Golden suite; marks each class
RequiresGoldenCompany so VenQoreTestCase::refreshTestDatabase() seeds via
GoldenSeedManager outside the per-test transaction.

Idempotent; prints a per-file action log. Run from anywhere:
    python3 Tester/tests/Support/scripts/phase_a_seeding_patch.py
"""
import re
import sys
from pathlib import Path

GOLDEN = Path(__file__).resolve().parents[3] / "tests" / "Feature" / "Golden"

FILES = [
    "OutputVerificationTestCase.php",
    "AdversarialCorruptionTest.php",
    "ClockPositionConsistencyTest.php",
    "CogsReconciliationTest.php",
    "CrossSurfaceConsistencyTest.php",
    "EdgeCasesTimeConcurrencyTest.php",
    "FifoBatchVerificationTest.php",
    "FinancialCoreVerificationTest.php",
    "FormattingConsistencyTest.php",
    "LaunchGateTest.php",
    "GoldenCompanyTest.php",
]

SEED_METHODS = ("ensureSeeded", "ensureGoldenCompanySeeded", "ensureGoldenCompanyExists")


def remove_method(text: str, name: str) -> tuple[str, bool]:
    """Remove an entire method by brace counting, including a preceding docblock."""
    sig = re.search(
        rf"\n(?P<doc>[ \t]*/\*\*(?:[^*]|\*(?!/))*\*/\n)?[ \t]*(private|protected|public)\s+function\s+{name}\s*\([^)]*\)\s*:\s*\w+\s*\n[ \t]*\{{",
        text,
    )
    if not sig:
        return text, False
    start = sig.start()  # keep the leading newline of the previous line? start at \n
    # find matching close brace from the opening brace
    open_idx = text.index("{", sig.end() - 1) if text[sig.end() - 1] != "{" else sig.end() - 1
    depth = 0
    i = open_idx
    while i < len(text):
        c = text[i]
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                break
        i += 1
    end = i + 1
    # also swallow one trailing newline
    while end < len(text) and text[end] == "\n":
        end += 1
        break
    return text[:start] + "\n" + text[end:], True


def patch(path: Path) -> list[str]:
    log = []
    text = path.read_text(encoding="utf-8")
    orig = text

    # 1. Drop DatabaseTransactions import + trait use
    n1 = len(re.findall(r"^use Illuminate\\Foundation\\Testing\\DatabaseTransactions;\n", text, re.M))
    text = re.sub(r"^use Illuminate\\Foundation\\Testing\\DatabaseTransactions;\n", "", text, flags=re.M)
    n2 = len(re.findall(r"^[ \t]*use DatabaseTransactions;\n+", text, re.M))
    text = re.sub(r"^[ \t]*use DatabaseTransactions;\n+", "", text, flags=re.M)
    if n1 or n2:
        log.append(f"removed DatabaseTransactions (import={n1}, trait-use={n2})")

    # 2. Drop $seeded property
    text, n = re.subn(r"^[ \t]*(private|protected)\s+static\s+bool\s+\$seeded\s*=\s*false;\n", "", text, flags=re.M)
    if n:
        log.append("removed $seeded property")

    # 3. Drop seeding-call lines in setUp
    text, n = re.subn(r"^[ \t]*\$this->(ensureSeeded|ensureGoldenCompanySeeded)\(\);\n", "", text, flags=re.M)
    if n:
        log.append(f"removed {n} seeding call(s)")

    # 4. Remove the seeding methods themselves
    for m in SEED_METHODS:
        if path.name == "GoldenCompanyTest.php" and m == "ensureGoldenCompanyExists":
            continue  # handled specially below
        text, removed = remove_method(text, m)
        if removed:
            log.append(f"removed method {m}()")

    # 5. Class declaration: implements RequiresGoldenCompany
    if "RequiresGoldenCompany" not in text:
        if path.name == "GoldenCompanyTest.php":
            text = text.replace("use Tests\\TestCase;", "use Tests\\Feature\\VenQoreTestCase;", 1)
            text = text.replace(
                "class GoldenCompanyTest extends TestCase",
                "class GoldenCompanyTest extends VenQoreTestCase implements RequiresGoldenCompany",
                1,
            )
            # replace surgery method with plain tenant binding
            text = text.replace(
                "        $this->ensureGoldenCompanyExists();",
                "        app()->instance('current.tenant', Tenant::findOrFail(self::$tenantId));",
                1,
            )
            text, removed = remove_method(text, "ensureGoldenCompanyExists")
            if removed:
                log.append("removed method ensureGoldenCompanyExists() (binding kept in setUp)")
        else:
            text = re.sub(
                r"(class\s+\w+\s+extends\s+VenQoreTestCase)(\s*\n\{)",
                r"\1 implements RequiresGoldenCompany\2",
                text,
                count=1,
            )
        # add import after the last existing use in header block
        anchor = re.search(r"^(use [^\n]+;\n)(?!use )", text, re.M)
        if anchor:
            text = text[: anchor.end(1)] + "use Tests\\Support\\RequiresGoldenCompany;\n" + text[anchor.end(1):]
        log.append("marked RequiresGoldenCompany")

    if text != orig:
        path.write_text(text, encoding="utf-8")
    return log or ["(no changes)"]


def main() -> int:
    fail = False
    for name in FILES:
        p = GOLDEN / name
        if not p.exists():
            print(f"!! MISSING {name}")
            fail = True
            continue
        for line in patch(p):
            print(f"{name}: {line}")
    # verification pass
    print("\n── verification ──")
    for name in FILES:
        t = (GOLDEN / name).read_text(encoding="utf-8")
        bad = []
        if "DB::commit()" in t:
            bad.append("DB::commit remains")
        if re.search(r"function ensure(Seeded|GoldenCompanySeeded|GoldenCompanyExists)", t):
            bad.append("seed method remains")
        if "RequiresGoldenCompany" not in t:
            bad.append("marker missing")
        if "use DatabaseTransactions;" in t:
            bad.append("trait double-stack remains")
        if t.count("{") != t.count("}"):
            bad.append(f"brace imbalance {t.count('{')}/{t.count('}')}")
        print(f"{name}: {'OK' if not bad else 'FAIL: ' + ', '.join(bad)}")
        fail = fail or bool(bad)
    return 1 if fail else 0


if __name__ == "__main__":
    sys.exit(main())
