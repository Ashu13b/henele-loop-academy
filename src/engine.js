import { SC } from "./constants.js";
import { gc } from "./helpers.js";

/* ═══ STATE ═══ */

// Bug 7 fix: all compartments start isotonic (300 mOsm). Previously ds/as
// were 0, so osmosis fired immediately before the pump had run — water was
// pulled from D by IC=300 >> DC=0 on the very first step.
export function mkState(n) {
  return {
    ds: Array(n).fill(300), dw: Array(n).fill(1),
    as: Array(n).fill(300), aw: Array(n).fill(1),
    is: Array(n).fill(300), iw: Array(n).fill(1),
    fabricated: 0, destroyed: 0,
  };
}

export function cloneS(s) {
  return {
    ds: [...s.ds], dw: [...s.dw],
    as: [...s.as], aw: [...s.aw],
    is: [...s.is], iw: [...s.iw],
    fabricated: s.fabricated, destroyed: s.destroyed,
  };
}

/* ═══ ENGINE ═══ */

export function getPhases(scKey) {
  const s = SC[scKey];
  if (s.hasI) {
    const p = ["feed"];
    if (s.hasActive) p.push("pump");
    p.push("osmosis", "flow");
    return p;
  }
  const p = ["feed", "exchange"];
  if (s.hasActive) p.push("inject");
  p.push("flow");
  return p;
}

export function runPhase(st, phase, cfg) {
  const sc = SC[cfg.scenario];
  const n = cfg.numBoxes;
  const s = cloneS(st);
  const r = cfg.exchangeRate / 100;

  if (phase === "feed") {
    s.ds[0] = cfg.initialA; s.dw[0] = 1;
    if (!sc.isLoop) { s.as[n - 1] = cfg.initialB; s.aw[n - 1] = 1; }
  }

  else if (phase === "exchange") {
    for (let i = 0; i < n; i++) {
      const dc = gc(s.ds[i], s.dw[i]), ac = gc(s.as[i], s.aw[i]);
      const tr = (dc - ac) * r;
      s.ds[i] -= tr; s.as[i] += tr;
    }
  }

  else if (phase === "inject") {
    let fab = 0, dest = 0;
    for (let i = n - 1; i >= Math.floor(n / 2); i--) {
      const rem = Math.min(s.as[i], cfg.activeAmount);
      s.as[i] -= rem;
      s.ds[i] += rem * 0.5;
      fab += rem * 0.5;
      dest += rem * 0.5;
    }
    s.fabricated += fab;
    s.destroyed += dest;
  }

  else if (phase === "pump") {
    for (let i = n - 1; i >= Math.floor(n / 2); i--) {
      const rem = Math.min(s.as[i], cfg.activeAmount);
      s.as[i] -= rem;
      s.is[i] += rem;
    }
  }

  else if (phase === "osmosis") {
    for (let i = 0; i < n; i++) {
      const dc = gc(s.ds[i], s.dw[i]);
      const ic = gc(s.is[i], s.iw[i]);

      // Bug 8+10b fix: full osmotic equilibration — D water adjusts until DC = IC.
      // Water drains immediately to vasa recta (not stored in IW), so IW stays ≈ 1.
      // Works in both directions (Bug 8: remove !sc.hasI guard; after Bug 7 fix the
      // isotonic start means DC never incorrectly exceeds IC at startup).
      if (ic > 0.1 && Math.abs(dc - ic) > 0.1) {
        s.dw[i] = Math.max(s.ds[i] / ic, 0.01);
      }

      // A→I passive diffusion — thin ascending limb leaks a small amount of NaCl
      // to I at all levels. Coefficient kept small (0.008) so upper I rises only
      // slightly above 300 (cortex baseline ~350 mOsm), not to the medullary range.
      const ac2 = gc(s.as[i], s.aw[i]);
      const ic2 = gc(s.is[i], s.iw[i]);
      if (ac2 > ic2) {
        let sm = (ac2 - ic2) * r * 0.008;
        sm = Math.min(sm, s.as[i] * 0.15);
        s.as[i] -= sm; s.is[i] += sm;
      }

      // Vasa recta restore I toward cortex baseline (300 mOsm, volume 1).
      // is * 0.98 + 6 → equilibrium 300 without pump; with pump adding 20/cycle
      //   equilibrium ≈ 1300 mOsm (physiological medullary tip).
      // iw * 0.95 + 0.05 → fast drain keeps iw ≈ 1.
      s.is[i] = s.is[i] * 0.98 + 6; s.iw[i] = s.iw[i] * 0.95 + 0.05;
    }
  }

  else if (phase === "flow") {
    const nds = [...s.ds], ndw = [...s.dw];
    const nas = [...s.as], naw = [...s.aw];
    if (sc.isLoop) {
      for (let i = n - 1; i > 0; i--) { nds[i] = s.ds[i - 1]; ndw[i] = s.dw[i - 1]; }
      nas[n - 1] = s.ds[n - 1]; naw[n - 1] = s.dw[n - 1];
      for (let i = 0; i < n - 1; i++) { nas[i] = s.as[i + 1]; naw[i] = s.aw[i + 1]; }
      nds[0] = cfg.initialA; ndw[0] = 1;
    } else {
      for (let i = n - 1; i > 0; i--) { nds[i] = s.ds[i - 1]; ndw[i] = s.dw[i - 1]; }
      for (let i = 0; i < n - 1; i++) { nas[i] = s.as[i + 1]; naw[i] = s.aw[i + 1]; }
      nds[0] = cfg.initialA; ndw[0] = 1;
      nas[n - 1] = cfg.initialB; naw[n - 1] = 1;
    }
    s.ds = nds; s.dw = ndw; s.as = nas; s.aw = naw;
  }

  return s;
}

export function runCycle(st, cfg) {
  const order = getPhases(cfg.scenario);
  let s = st;
  for (const p of order) s = runPhase(s, p, cfg);
  return s;
}

/* ═══ STEADY STATE ═══ */
const MIN_C = 10000, MAX_C = 100000;

export function computeSteady(cfg) {
  const n = cfg.numBoxes;
  const hasI = SC[cfg.scenario].hasI;
  let s = mkState(n);
  let conv = -1;
  const snaps = [];
  for (let c = 0; c < MAX_C; c++) {
    const p = cloneS(s);
    s = runCycle(s, cfg);
    if (c < 20 || (c % 10 === 0 && c < 200) || (c % 100 === 0 && c < 2000) || c % 1000 === 0) {
      snaps.push({
        step: c + 1,
        tipD: Math.round(gc(s.ds[n - 1], s.dw[n - 1]) * 10) / 10,
        tipA: Math.round(gc(s.as[n - 1], s.aw[n - 1]) * 10) / 10,
        exit: Math.round(gc(s.as[0], s.aw[0]) * 10) / 10,
        ...(hasI ? { tipI: Math.round(gc(s.is[n - 1], s.iw[n - 1]) * 10) / 10 } : {}),
      });
    }
    let md = 0;
    for (let i = 0; i < n; i++) {
      md = Math.max(md,
        Math.abs(gc(s.ds[i], s.dw[i]) - gc(p.ds[i], p.dw[i])),
        Math.abs(gc(s.as[i], s.aw[i]) - gc(p.as[i], p.aw[i])),
      );
      if (hasI) md = Math.max(md, Math.abs(gc(s.is[i], s.iw[i]) - gc(p.is[i], p.iw[i])));
    }
    if (md < 0.001 && c >= MIN_C) { conv = c + 1; break; }
  }
  return { state: s, convergedAt: conv, snapshots: snaps };
}
