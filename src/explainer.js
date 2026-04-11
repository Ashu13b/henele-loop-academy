import { SC } from "./constants.js";
import { gc } from "./helpers.js";

// Bug 5 fix: injection-vs-real language, specific numbers, mechanism clarity.
export function explain(phase, s, prev, cfg, step) {
  const sc = SC[cfg.scenario];
  const n = cfg.numBoxes;

  if (phase === "idle") {
    return "Press Step to begin. Each press does ONE operation — watch one mechanism at a time.";
  }

  if (phase === "feed") {
    let t = `Fresh fluid enters D1 at ${cfg.initialA} mOsm (kidney input from glomerulus).`;
    if (!sc.isLoop) t += ` A${n} receives ${cfg.initialB} mOsm (counter-flow input).`;
    if (sc.isLoop && step === 0) t += " The loop means fluid will U-turn at the tip into the ascending limb.";
    return t;
  }

  if (phase === "exchange") {
    return `Passive D↔A exchange at ${cfg.exchangeRate}% rate. Solute diffuses down its gradient at each position — no energy used, no net concentration.`;
  }

  if (phase === "inject") {
    let fab = 0;
    for (let i = n - 1; i >= Math.floor(n / 2); i--) {
      fab += Math.min(prev ? gc(prev.as[i], prev.aw[i]) : 0, cfg.activeAmount);
    }
    return `⚠ INJECTION (not real physiology): ~${Math.round(fab)} stripped from A, half fabricated into D, half destroyed. Solute is created/destroyed each cycle — conservation is violated. This is why injection ≠ real multiplication.`;
  }

  if (phase === "pump") {
    let moved = 0;
    for (let i = n - 1; i >= Math.floor(n / 2); i--) {
      moved += Math.min(prev ? prev.as[i] : 0, cfg.activeAmount);
    }
    return `Active pump (Na⁺/K⁺-ATPase): ~${Math.round(moved)} solute moved A→I. Nothing is created or destroyed — the single effect. D concentrates because interstitium I gets salty, pulling water out next step.`;
  }

  if (phase === "osmosis") {
    const tipIc = gc(s.is[n - 1], s.iw[n - 1]);
    const tipDc = gc(s.ds[n - 1], s.dw[n - 1]);
    let t = `Osmosis: water follows the osmotic gradient. Salty I pulls water out of D (descending limb is water-permeable). D concentrates by losing water — no solute added.`;
    if (tipIc > 10) t += ` Tip: I=${Math.round(tipIc)}, D=${Math.round(tipDc)} mOsm (D water volume: ${s.dw[n - 1].toFixed(2)}).`;
    return t;
  }

  if (phase === "flow") {
    let t = "Tubular flow: D advances down↓, A advances up↑.";
    if (sc.isLoop) t += " U-turn: D tip fluid becomes A tip — fresh low-concentration fluid enters the pump zone.";
    else t += " No tip connection — concentrated D exits as urine.";
    if (sc.hasI) t += " Interstitium (I) stays in tissue — it is the gradient battery.";
    const tipD = gc(s.ds[n - 1], s.dw[n - 1]);
    const tipA = gc(s.as[n - 1], s.aw[n - 1]);
    const tipMax = Math.max(tipD, tipA);
    if (tipMax > cfg.initialA * 1.1 && sc.isLoop) {
      t += ` Tip=${Math.round(tipMax)} mOsm (D=${Math.round(tipD)}, A=${Math.round(tipA)}) — countercurrent multiplication in action.`;
    }
    return t;
  }

  return "";
}
