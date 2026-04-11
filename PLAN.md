# PLAN.md

## What We Are Building
Countercurrent multiplier simulator — 6-scenario interactive React app teaching the Loop of Henle.
Split the monolithic `countercurrent_simulator.jsx` (~700 lines) into focused modules.
Run locally via Vite dev server. Fix known bugs during the split.

## Stack
Vite + React 18 (JSX) + Recharts
- Dev: `npm run dev`
- Lint: `npm run lint`
- Test: `npm run test` (Vitest)
- Build: `npm run build`
- Signatures: `grep -E "^export (function|const|default)" src/$FILE | head -40 > signatures/$FILE.sig`

## Architecture
```
countercurrent_simulator.jsx   ← STABLE: source of truth during split, delete after App.jsx done
src/
  constants.js        — SC (6 scenarios), PI (phase icons), SPEEDS
  helpers.js          — cCol, tCol, gc (pure math/color utilities)
  engine.js           — mkState, cloneS, getPhases, runPhase, runCycle, computeSteady
  explainer.js        — explain(phase, s, prev, cfg, step) → string
  components/
    UViz.jsx          — U-shape SVG visualization (loop scenarios)
    LinearViz.jsx     — Linear SVG visualization (open scenarios)
    Controls.jsx      — scenario tab bar, speed selector, step/run/reset buttons
    Chart.jsx         — Recharts convergence line chart
  App.jsx             — main state, layout, wires all components
index.html            — HTML shell
vite.config.js        — Vite config
package.json          — deps: react, react-dom, recharts, vite
```

## Stable Files
countercurrent_simulator.jsx — source of truth during split, do NOT modify

## Bugs to Fix (from Notion — "Steady State Truths")
- Bug 1: Open+I scenario dead at default settings (downstream of Bug 2+3)
- Bug 2: I starts at 0 instead of 300 baseline → fix in engine.js mkState
- Bug 3: Osmosis is unidirectional (D→I only) → fix in engine.js runPhase("osmosis") to handle both directions
- Bug 4: Only concentration shown, not S+W separately → fix in UViz + LinearViz (show S/W labels, scale D box width by dw)
- Bug 5: Explainer text too generic → fix in explainer.js with injection-vs-real language

## Tasks
[x] package.json + vite.config.js + index.html — Vite+React scaffold — depends on: none
[x] src/constants.js — SC, PI, SPEEDS — depends on: none
[x] src/helpers.js — cCol, tCol, gc — depends on: none
[ ] src/engine.js — mkState(fix Bug2), cloneS, getPhases, runPhase(fix Bug3), runCycle, computeSteady — depends on: constants.js.sig, helpers.js.sig
[ ] src/explainer.js — explain() with better text (fix Bug5) — depends on: constants.js.sig, helpers.js.sig, engine.js.sig
[ ] src/components/UViz.jsx — U-shape SVG viz, D box scales with dw (fix Bug4) — depends on: constants.js.sig, helpers.js.sig
[ ] src/components/LinearViz.jsx — linear open viz, same Bug4 fix — depends on: constants.js.sig, helpers.js.sig
[ ] src/components/Controls.jsx — scenario tabs, speed, step/run/reset — depends on: constants.js.sig
[ ] src/components/Chart.jsx — Recharts convergence chart — depends on: none
[ ] src/App.jsx — main app, all state, wires everything — depends on: all .sig files above
