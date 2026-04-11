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
- Bug 6: Descending limb dw increases going down instead of decreasing → fixed (blocked I→D in hasI scenarios)
- Bug 7: mkState initialises ds/as to 0 — osmosis fires immediately at step 0 before the pump has run, because IC=300 >> DC=0. Fix: initialise ds and as to 300 so all compartments start isotonic; osmosis only begins after pump raises IC above 300.
- Bug 8: Bug 6 fix (hard-block I→D in hasI) is a patch that hides the real cause. After Bug 7 fix, D never starts at 0 so false I→D firing should not occur. Revert the !sc.hasI guard and let bidirectional physics run — I→D is valid if DC genuinely exceeds IC (edge case). Remove the guard; Bug 7 is the true root cause.
- Bug 9: A→I passive diffusion fires on ALL boxes in osmosis phase, including upper cortex where the pump never runs. Upper A boxes slowly leak solute into upper I, pushing IC above 300 in the cortex where it should stay at 300. Fix: restrict A→I passive diffusion to medullary boxes only (i >= Math.floor(n/2)), matching where the pump is active.
- Bug 10: Two compounding problems — (A) Pump fires on all lower-half boxes simultaneously creating a 300→1115 mOsm step function in I instead of a smooth gradient. (B) Fractional osmosis only moves ~5% of D water per box per cycle — reaching 1200 mOsm from 300 would require ~27 boxes. Fix both together: (1) change pump to "single effect" model — at each lower-half box push I to (A_concentration + activeAmount), not a fixed removal; (2) change osmosis to full equilibration — D loses water until DC = IC at that level (dw = ds / ic), which gives the correct 300→1200 gradient in 5-8 boxes. A should be modelled symmetrically: A concentration at tip = D concentration at tip, then decreases as pump removes NaCl going upward.

## Tasks
[x] package.json + vite.config.js + index.html — Vite+React scaffold — depends on: none
[x] src/constants.js — SC, PI, SPEEDS — depends on: none
[x] src/helpers.js — cCol, tCol, gc — depends on: none
[x] src/engine.js — mkState(fix Bug2), cloneS, getPhases, runPhase(fix Bug3), runCycle, computeSteady — depends on: constants.js.sig, helpers.js.sig
[x] src/explainer.js — explain() with better text (fix Bug5) — depends on: constants.js.sig, helpers.js.sig, engine.js.sig
[x] src/components/UViz.jsx — U-shape SVG viz, D box scales with dw (fix Bug4) — depends on: constants.js.sig, helpers.js.sig
[x] src/components/LinearViz.jsx — linear open viz, same Bug4 fix — depends on: constants.js.sig, helpers.js.sig
[x] src/components/Controls.jsx — scenario tabs, speed, step/run/reset — depends on: constants.js.sig
[x] src/components/Chart.jsx — Recharts convergence chart — depends on: none
[x] src/App.jsx — main app, all state, wires everything — depends on: all .sig files above
[x] src/engine.js — Bug 6: fix descending limb dw increasing instead of decreasing — in osmosis phase, skip the I→D water branch when sc.hasI is true (loop scenarios); descending limb must only lose water to interstitium, never gain it — depends on: constants.js.sig, helpers.js.sig
[x] src/engine.js — Bugs 7+8+9+10 together: (1) mkState ds/as → 300 isotonic start; (2) remove !sc.hasI I→D guard (Bug 7 is the true fix); (3) restrict A→I diffusion to medullary boxes only; (4) pump becomes "single effect" — push I to A+activeAmount per box instead of fixed removal; (5) osmosis becomes full equilibration — dw = ds/ic so D reaches IC in one pass, giving 300→1200 gradient in 5-8 boxes — depends on: constants.js.sig, helpers.js.sig

## New Tasks — Physiology Pedagogy Sprint

[x] src/constants.js — Task A: Add two new scenarios to SC: (1) "Short Loop" — cortical nephron, numBoxes: 4, activeAmount: 200, hasI: true, label "Short Loop (Cortical)" — peaks ~400–600 mOsm tip; (2) "Kangaroo Rat" — long loop, numBoxes: 16, activeAmount: 300, hasI: true, label "Kangaroo Rat" — peaks ~3000–5000 mOsm, demonstrates that loop length × single-effect = extreme concentration. Both scenarios must pass existing constants.test.js and the new scenario keys must be accepted by getPhases/runCycle without engine changes — depends on: constants.js.sig, engine.js.sig

[x] src/components/UViz.jsx — Task B: Ascending limb exit label — add a visible annotation at the top of the A (ascending) column showing its current concentration with the label "Exit ≈ X mOsm — hypoosmotic" in a distinct color (blue/cool tone). Only render when phase === 'steady' or cycle count > 0. This makes the dilute-exit payoff of the whole mechanism visible to the learner — depends on: UViz.jsx.sig, constants.js.sig

[x] src/components/UViz.jsx — Task C: Single-effect delta badges
[x] src/engine.js + src/App.jsx + src/components/Controls.jsx — Task D: Damping factor — cfg.damping (0.1–1.0, default 0.4) applied to pump (rem × d) and osmosis (partial equilibration toward target dw); computeSteady always uses d=1; range slider in Controls; Segments max raised to 20 — at each medullary box (i >= Math.floor(n/2)), render a small badge between the A and I compartments showing the solute difference (I concentration − A concentration) formatted as "+X mOsm". Badge is grey when Δ < 50, amber when 50–250, red when > 250. This makes the ~200 mOsm pump gradient tangible at every level — depends on: UViz.jsx.sig (after Task B is committed)

## New Tasks — TAL Exit Fix

Root cause: pump removes a fixed AMOUNT (min(as[i], activeAmount) * d), ignoring aw. When D concentrates heavily at the tip (dw ≈ 0.25), A inherits that tiny water volume via the hairpin. Even removing 4 × 50 = 200 solute units leaves 100 solute / 0.25 water = 400 mOsm at exit — still hyperosmotic. The fix: concentration-based single-effect pump that drives I − A = activeAmount at each medullary box, so A exits the pump zone at I[n/2] − activeAmount ≈ 100–200 mOsm regardless of aw.

[x] src/constants.js — Task E: Add `defaultNumBoxes: 8, defaultActiveAmount: 200` to the `henle` scenario. The App default of numBoxes:3 / activeAmount:50 is too sparse and too weak for the fix to produce a visible hypoosmotic exit. With 8 boxes (4 medullary) and activeAmount:200 the I gradient runs 300→1200 and exit lands near 100 mOsm. No other scenario changes — depends on: constants.js.sig

[x] src/engine.js — Task F: Replace amount-based pump with concentration-based single-effect. Current code: `rem = min(as[i], activeAmount) * d`. New model: at each medullary box compute `ac = gc(as[i], aw[i]); ic = gc(is[i], iw[i]); target = max(0, ic − activeAmount); if ac > target { rem = min((ac − target) * aw[i], as[i]) * d; as[i] -= rem; is[i] += rem; }`. At steady state each pumped box holds A = I − activeAmount. A exits the pump zone at I[n/2] − activeAmount ≈ 100–200 mOsm (clearly hypoosmotic). inject / osmosis / flow phases unchanged — depends on: engine.js.sig, constants.js.sig
