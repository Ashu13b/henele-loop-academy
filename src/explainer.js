import { SC } from "./constants.js";
import { gc } from "./helpers.js";

export function explain(phase, s, prev, cfg) {
  const sc = SC[cfg.scenario];
  const n = cfg.numBoxes;

  if (phase === "idle") {
    return `[Stage ${sc.stage}] Press Step to begin. Learn how ${sc.label} works.`;
  }

  if (phase === "feed") {
    let t = `Fresh fluid enters D1 at ${cfg.initialA} mOsm (glomerular filtrate).`;
    if (!sc.isLoop) t += ` A${n} receives ${cfg.initialB} mOsm.`;
    return t;
  }

  if (phase === "exchange") {
    return `Passive Exchange: Solute diffuses between tubes until they match. This cannot concentrate fluid, it only redistributes it.`;
  }

  if (phase === "inject") {
    return `Injection: Solute is manually moved into the descending limb. This mimics a pump but violates conservation of mass.`;
  }

  if (phase === "pump") {
    const activeAmount = sc.activeAmountOverride !== undefined ? sc.activeAmountOverride : cfg.activeAmount;
    if (activeAmount === 0) return "Furosemide Active: The NKCC2 pump is BLOCKED. No solute moves from A to I. The gradient will eventually wash out.";
    return `Active Pump: Salt is moved from A to I. The 'Single Effect' is creating a ~${activeAmount} mOsm difference at this level.`;
  }

  if (phase === "osmosis") {
    const tipIc = gc(s.is[n - 1], s.iw[n - 1]);
    const tipDc = gc(s.ds[n - 1], s.dw[n - 1]);
    let t = `Osmosis: The salty tissue (I) pulls water out of the descending limb (D).`;
    if (tipIc > 10) t += ` Tip Tissue=${Math.round(tipIc)}, Tip Tubule=${Math.round(tipDc)} mOsm.`;
    return t;
  }

  if (phase === "exchange_vr") {
    return "Vasa Recta: Countercurrent blood flow supplies the medulla with oxygen while preserving the gradient through passive exchange.";
  }

  if (phase === "osmosis_cd") {
    const urineConc = gc(s.cds[n - 1], s.cdw[n - 1]);
    const adh = sc.adhOverride !== undefined ? sc.adhOverride : (cfg.adh ?? 0.6);
    const adhPct = Math.round(adh * 100);
    if (adhPct === 0) return "Diabetes Insipidus: 0% ADH means the CD is impermeable to water. Urine remains dilute despite the gradient.";
    return `Collecting Duct: ${adhPct}% ADH recovery. Urine equilibrates with the tissue gradient. Final: ${Math.round(urineConc)} mOsm.`;
  }

  if (phase === "flow") {
    let t = "Flow: Fluid moves down↓ and up↑.";
    if (sc.isLoop) t += " The U-turn recirculates concentrated fluid back to the pump zone, multiplying the effect.";
    const tipD = gc(s.ds[n - 1], s.dw[n - 1]);
    if (tipD > cfg.initialA * 1.1) t += ` Multiplication Active: Tip is now ${Math.round(tipD)} mOsm!`;
    return t;
  }

  return "";
}
