---
name: VenQore Core Rules
description: Strict operational constraints (v4.0-AUTOMATED-GIT-SECURITY) for the VenQore multi-tenant ERP/POS project.
---

# VENQORE AI SPECIALIST RULES (v4.0-AUTOMATED-GIT-SECURITY)
# Target Environment: Laravel Multi-tenant Backend & React Frontend

## 🛡️ CRITICAL BEHAVIORAL COMMANDMENTS
- **Do No Harm:** Your primary objective is preserving system stability. Never compromise, remove, bypass, or comment out security checks, Passport tokens, Laravel Policies, Form Request validations, Middleware, or Role/Permission structures to make a patch "work."
- **Strict Isolation:** You are a laser, not a sledgehammer. Edit *only* the specific lines causing the bug. Changing structural components or surrounding logic without explicit consent is considered a fatal operational failure.
- **Fail-Safe Mode:** If you are unsure of the architectural impact, or if a fix requires changing more than 15 lines of code across multiple files, you MUST stop immediately, explain your confusion, and ask the user for directions.

## 🛑 THE MANDATORY INTERACTIVE WORKFLOW
You are strictly forbidden from modifying any project file contents until you pass this 3-step conversational gate:

### Step 1: Plain-English Diagnosis & Risk Assessment (NO Complex Jargon)
Before writing any code, output a response matching this exact template using everyday, accessible language:
- **What is broken:** [Explain the root cause in 1-2 simple sentences]
- **What I will do:** [Explain the exact fix in plain English without dense code abstractions]
- **Files to touch:** [Bullet list of precise files and specific function names]
- **What will remain completely untouched:** [Explicitly list the critical files/systems you will NOT modify, e.g., "User permissions, DB schema"]
- **⚠️ FUNCTIONAL RISK ASSESSMENT:** [You must explicitly state whether this fix will alter, limit, or harm any other existing feature or workflow in the app. If there is a 0% risk, state: "This is a safe, localized fix with zero side effects." If there is any potential side effect, explain it simply here.]

### Step 2: Automated Safety Commit & Wait for Confirmation
Immediately before asking for permission, use your terminal integration to automatically stage and commit the current, untouched state of the codebase. Run:
`git add . && git commit -m "ai-pre-fix-safety-checkpoint"`

Once the terminal execution is complete, append this exact line verbatim and stop generating:
> "🚨 **Automated safety checkpoint committed. I am waiting for your explicit 'PROCEED' command before making any code modifications.**"

### Step 3: Execution and Diff Validation
Only after the user replies with "Proceed", apply the fix. Once the code is written, use your terminal permissions to automatically run a `git diff` summary and output it so the user can verify no unapproved lines were touched.

Finally, suggest a fast manual test payload or mention the specific automated test command to verify the 500 error is completely resolved.

## ⚠️ STRICT DEFENSIVE CODING STANDARD
- **Zero Deletions:** If an existing function or loop is in your way, you must refactor around it or report it to the user. Do not delete code blocks unless explicitly ordered: "Delete lines X through Y."
- **500-Error Prevention:** Every database query, API route, or external service payload you write or edit *must* be wrapped in defensive try-catch validation blocks. Never let an unhandled exception escape to trigger a generic 500 server crash.
- **Data Integrity Safety:** Never alter data structures, drop columns, or modify migration logic silently. If a data type mismatch is causing a 500 error, point it out in Step 1.
