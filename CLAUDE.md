# CLAUDE.md

## First Thing Every Session
Read SESSION.md. It has everything you need to orient.
Do not read any source files until SESSION.md tells you what exists.
Do not write any code until you know the mode.

---

## Two Modes

### PLANNING MODE
Triggered when SESSION.md says `mode: planning`

1. Read PLAN.md if it exists
2. Ask user focused questions about what is unclear
3. Update PLAN.md with all decisions — stack, architecture, module list
4. Write a `## Tasks` section in PLAN.md — ordered list of files to build
5. Run: `git add -A && git commit -q -m "plan: updated"`
6. **STOP. Do not write a single line of code.**

### BUILDING MODE
Triggered when SESSION.md says `mode: building`

1. Read SESSION.md — project type, existing files, next task
2. Read PLAN.md — architecture and current task only
3. Read only the signatures listed as dependencies for this task
4. Write the source file
5. Write its test file in /tests/
6. Run verification (see below)
7. Extract signatures (see below)
8. Run: `git add -A && git commit -q -m "feat: <filename>"`
9. Update next task in PLAN.md ## Tasks — mark done, identify next
10. **STOP. Print: "✓ <filename> done. Type continue or give feedback."**
11. Wait. Do not proceed until user responds.

---

## Stack Commands (Vite + React 18 + Vitest)
```
linter:     npx eslint src --ext .js,.jsx --max-warnings 0
tests:      npx vitest run
build:      npx vite build
dev:        npx vite
signatures: grep -E "^export (function|const|default)" src/$FILE | head -40 > signatures/$FILE.sig
```

## Verification
Run after every file.

```
Step 1: npx eslint src --ext .js,.jsx --max-warnings 0
Step 2: npx vitest run
Step 3: npx vite build
```

If step fails → fix source file, never the test → re-run from step 1
If same failure after 3 attempts → STOP → print "⚠ Stuck. Your call."

---

## Signature Extraction
Run after verification passes.
Command: `grep -E "^export (function|const|default)" src/FILENAME | head -40 > signatures/FILENAME.sig`
Always write to /signatures/filename.sig

---

## Rules
- Never read a file already in signatures
- Never write more than one source file per task
- Never modify a file the user has marked STABLE in PLAN.md
- Never fix a failing test by changing the test
- Never proceed without user confirmation
- Always commit after each file
- Always update PLAN.md tasks after each commit
