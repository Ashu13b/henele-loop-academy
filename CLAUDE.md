# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
linter:     npm run lint
tests:      npm run test
build:      npm run build
dev:        npm run dev
signatures: grep -E "^export (function|const|default)" src/$FILE | head -40 > signatures/$FILE.sig
```

Single test file: `npx vitest run tests/engine.test.js`

## Verification
Run after every file.

```
Step 1: npm run lint
Step 2: npm run test
Step 3: npm run build
```

If step fails → fix source file, never the test → re-run from step 1
If same failure after 3 attempts → STOP → print "⚠ Stuck. Your call."

---

## Signature Extraction
Run after verification passes.
Command: `grep -E "^export (function|const|default)" src/FILENAME | head -40 > signatures/FILENAME.sig`
Always write to /signatures/filename.sig

---

## Architecture

```
src/
  constants.js        — SC (8 scenarios in 4 stages), PI (phase icons), SPEEDS
  helpers.js          — gc(s,w)=s/w, cCol, tCol (pure math/color utilities)
  engine.js           — mkState, cloneS, getPhases, runPhase, runCycle, computeSteady
  explainer.js        — explain(phase, s, prev, cfg, step) → string
  components/
    UViz.jsx          — U-shape SVG viz (sc.isLoop === true)
    LinearViz.jsx     — Linear SVG viz (open scenarios)
    SimulationCanvas.jsx — Canvas gradient heatmap (ported from myapp)
    Controls.jsx      — stage tabs, scenario selector, speed/damping/ADH sliders, step/run/reset
    Chart.jsx         — Recharts convergence line chart
  App.jsx             — all state, layout, wires all components
index.html            — HTML shell
vite.config.js        — Vite config
```

### State arrays (length = numBoxes)
Each compartment is two parallel arrays: `xs` (solute mass) and `xw` (water volume).
Concentration = `gc(xs[i], xw[i])` = `xs[i] / xw[i]`.

| Prefix | Compartment |
|---|---|
| `ds/dw` | Descending limb |
| `as/aw` | Ascending limb |
| `is/iw` | Interstitium |
| `vds/vdw`, `vas/vaw` | Vasa Recta descending/ascending |
| `cds/cdw` | Collecting Duct |

### Scenario flags (SC)
- `hasI` — interstitium active; enables pump + osmosis phases
- `hasVR` / `hasCD` — enables Vasa Recta / Collecting Duct phases
- `isLoop` — hairpin tip connection (D→A at bottom)
- `isStatic` — disables flow phase
- `activeAmountOverride` / `adhOverride` — override sliders regardless of cfg

### Engine invariants
- `computeSteady` always uses `damping: 1`; cfg.damping only affects animation speed
- Pump is concentration-based: drives `I − A = activeAmount` per medullary box (`i >= Math.floor(n/2)`)
- A→I passive diffusion restricted to medullary boxes only
- All compartments initialise at 300 mOsm (isotonic) — osmosis cannot fire before pump

---

## Rules
- Never read a file already in signatures
- Never write more than one source file per task
- Never modify a file the user has marked STABLE in PLAN.md
- Never fix a failing test by changing the test
- Never proceed without user confirmation
- Always commit after each file
- Always update PLAN.md tasks after each commit
- `engine.js` must stay pure JS — no browser/Node APIs, no new imports
- Validate engine changes against `s4-diabetes-insipidus` (ADH=0 → dilute CD output)
