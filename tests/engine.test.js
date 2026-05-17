import { describe, it, expect } from "vitest";
import { mkState, cloneS, getPhases, runPhase, runCycle, computeSteady } from "../src/engine.js";

const BASE_CFG = {
  scenario: "s2-multiplier",
  numBoxes: 5,
  initialA: 300,
  initialB: 300,
  exchangeRate: 30,
  activeAmount: 20,
};

describe("mkState", () => {
  it("creates arrays of length n for all compartments", () => {
    const s = mkState(5);
    expect(s.ds).toHaveLength(5);
    expect(s.as).toHaveLength(5);
    expect(s.is).toHaveLength(5);
    expect(s.vds).toHaveLength(5);
    expect(s.vas).toHaveLength(5);
    expect(s.cds).toHaveLength(5);
    expect(s.ius).toHaveLength(5);
    expect(s.cdus).toHaveLength(5);
  });

  it("ius and cdus start at 0 (no urea at rest)", () => {
    const s = mkState(4);
    expect(s.ius.every(v => v === 0)).toBe(true);
    expect(s.cdus.every(v => v === 0)).toBe(true);
  });

  it("Bug 2 fix: interstitium starts at 300 baseline, not 0", () => {
    const s = mkState(5);
    expect(s.is.every(v => v === 300)).toBe(true);
  });

  it("water compartments start at 1", () => {
    const s = mkState(4);
    expect(s.dw.every(v => v === 1)).toBe(true);
    expect(s.aw.every(v => v === 1)).toBe(true);
    expect(s.iw.every(v => v === 1)).toBe(true);
    expect(s.vdw.every(v => v === 1)).toBe(true);
    expect(s.vaw.every(v => v === 1)).toBe(true);
    expect(s.cdw.every(v => v === 1)).toBe(true);
  });

  it("Bug 7 fix: ds and as start at 300 (isotonic baseline, not 0)", () => {
    const s = mkState(3);
    expect(s.ds.every(v => v === 300)).toBe(true);
    expect(s.as.every(v => v === 300)).toBe(true);
  });
});

describe("cloneS", () => {
  it("returns a deep copy — mutations don't affect original", () => {
    const s = mkState(3);
    const c = cloneS(s);
    c.ds[0] = 999;
    expect(s.ds[0]).toBe(300); // Bug 7: ds starts at 300
  });

  it("preserves fabricated/destroyed counters", () => {
    const s = mkState(3);
    s.fabricated = 42; s.destroyed = 7;
    const c = cloneS(s);
    expect(c.fabricated).toBe(42);
    expect(c.destroyed).toBe(7);
  });
});

describe("getPhases", () => {
  it("s2-multiplier has pump, osmosis, flow", () => {
    const p = getPhases("s2-multiplier");
    expect(p).toContain("pump");
    expect(p).toContain("osmosis");
    expect(p).toContain("flow");
  });

  it("s1-exchange has exchange and flow, no pump/osmosis", () => {
    const p = getPhases("s1-exchange");
    expect(p).toContain("exchange");
    expect(p).toContain("flow");
    expect(p).not.toContain("pump");
    expect(p).not.toContain("osmosis");
  });
});

describe("runPhase - feed", () => {
  it("sets D[0] to initialA", () => {
    const s = mkState(5);
    const r = runPhase(s, "feed", BASE_CFG);
    expect(r.ds[0]).toBe(BASE_CFG.initialA);
  });

  it("loop scenario: does not overwrite A[n-1] — stays at isotonic baseline", () => {
    const s = mkState(5);
    const r = runPhase(s, "feed", BASE_CFG); // henle is isLoop
    expect(r.as[4]).toBe(300); // Bug 7: as starts at 300; feed doesn't touch it in loop
  });

  it("open scenario: sets A[n-1] to initialB", () => {
    const cfg = { ...BASE_CFG, scenario: "s1-exchange" };
    const s = mkState(5);
    const r = runPhase(s, "feed", cfg);
    expect(r.as[4]).toBe(cfg.initialB);
  });
});

describe("runPhase - osmosis (Bug 10b: full equilibration)", () => {
  it("D loses water until DC = IC when I is more concentrated", () => {
    const s = mkState(3);
    s.ds[0] = 300; s.dw[0] = 1;   // DC = 300
    s.is[0] = 600; s.iw[0] = 1;   // IC = 600
    const cfg = { ...BASE_CFG, numBoxes: 3 };
    const r = runPhase(s, "osmosis", cfg);
    // Full equilibration: dw = ds/ic = 300/600 = 0.5
    expect(r.dw[0]).toBeCloseTo(0.5, 2);
    // Water drains to vasa recta — IW stays near 1, not inflated
    expect(r.iw[0]).toBeLessThanOrEqual(1.05);
  });

  it("Bug 8 fix: water enters D when DC > IC (bidirectional equilibration)", () => {
    const s = mkState(3);
    s.ds[0] = 600; s.dw[0] = 1;   // DC = 600
    s.is[0] = 300; s.iw[0] = 1;   // IC = 300
    const cfg = { ...BASE_CFG, numBoxes: 3 };
    const r = runPhase(s, "osmosis", cfg);
    // Full equilibration: dw = ds/ic = 600/300 = 2
    expect(r.dw[0]).toBeCloseTo(2, 2);
  });
});

describe("runPhase - osmosis_cd", () => {
  it("papillary tip (deep box) loses water at full ADH", () => {
    const s = mkState(3);
    // Test the innermost medullary box (i=n-1): depth = 1 → full AQP2 effect
    s.cds[2] = 300; s.cdw[2] = 1;
    s.is[2] = 600; s.iw[2] = 1;
    const cfg = { ...BASE_CFG, numBoxes: 3, adh: 1.0, damping: 1 };
    const r = runPhase(s, "osmosis_cd", cfg);
    // depth=1, adh=1, d=1 → full equilibration: cdw = 300/600 = 0.5
    expect(r.cdw[2]).toBeCloseTo(0.5, 2);
  });

  it("cortical box (i=0) has no AQP2 effect — depth=0", () => {
    const s = mkState(3);
    s.cds[0] = 300; s.cdw[0] = 1;
    s.is[0] = 600; s.iw[0] = 1;
    const cfg = { ...BASE_CFG, numBoxes: 3, adh: 1.0, damping: 1 };
    const r = runPhase(s, "osmosis_cd", cfg);
    // depth = 0/(3-1) = 0 → no water reabsorption regardless of ADH
    expect(r.cdw[0]).toBe(1);
  });

  it("deep box reabsorbs more water than shallow box (gradient)", () => {
    const s = mkState(3);
    s.cds[1] = 300; s.cdw[1] = 1; s.is[1] = 600; s.iw[1] = 1;
    s.cds[2] = 300; s.cdw[2] = 1; s.is[2] = 600; s.iw[2] = 1;
    const cfg = { ...BASE_CFG, numBoxes: 3, adh: 1.0, damping: 1 };
    const r = runPhase(s, "osmosis_cd", cfg);
    // Box 2 (depth=1) should reabsorb more than box 1 (depth=0.5)
    expect(r.cdw[2]).toBeLessThan(r.cdw[1]);
  });

  it("CD reabsorbs no water when ADH is 0", () => {
    const s = mkState(3);
    s.cds[2] = 300; s.cdw[2] = 1;
    s.is[2] = 600; s.iw[2] = 1;
    const cfg = { ...BASE_CFG, numBoxes: 3, adh: 0 };
    const r = runPhase(s, "osmosis_cd", cfg);
    expect(r.cdw[2]).toBe(1);
  });
});

describe("runCycle", () => {
  it("returns a state object with correct shape", () => {
    const s = mkState(5);
    const r = runCycle(s, BASE_CFG);
    expect(r.ds).toHaveLength(5);
    expect(r.as).toHaveLength(5);
    expect(r.is).toHaveLength(5);
  });

  it("henle scenario accumulates concentration over cycles", () => {
    const cfg = { ...BASE_CFG, numBoxes: 5, initialA: 300, activeAmount: 30 };
    let s = mkState(5);
    for (let i = 0; i < 100; i++) s = runCycle(s, cfg);
    // After many cycles, tip D should exceed input in henle
    const tipD = s.ds[4] / s.dw[4];
    expect(tipD).toBeGreaterThan(300);
  });
});

describe("runPhase - urea_recycle", () => {
  const UREA_CFG = { ...BASE_CFG, scenario: "s4-urea-trap", numBoxes: 4, adh: 1.0, damping: 1 };

  it("urea transfers from CD into IMI in inner medullary boxes at full ADH", () => {
    const s = mkState(4);
    s.cdus[3] = 150; s.cdw[3] = 1;  // 150 mOsm urea in deepest CD box
    s.ius[3] = 0;    s.iw[3] = 1;   // empty IMI urea
    const r = runPhase(s, "urea_recycle", UREA_CFG);
    expect(r.ius[3]).toBeGreaterThan(0);
    expect(r.cdus[3]).toBeLessThan(150);
  });

  it("no urea transfer in cortical box (i < halfN)", () => {
    const s = mkState(4);
    s.cdus[0] = 150; s.cdw[0] = 1;
    s.ius[0] = 0;    s.iw[0] = 1;
    const r = runPhase(s, "urea_recycle", UREA_CFG);
    expect(r.ius[0]).toBe(0);
    expect(r.cdus[0]).toBe(150);
  });

  it("no urea transfer when ADH is 0 (UT-A1/3 closed)", () => {
    const s = mkState(4);
    s.cdus[3] = 150; s.cdw[3] = 1;
    s.ius[3] = 0;    s.iw[3] = 1;
    const r = runPhase(s, "urea_recycle", { ...UREA_CFG, adh: 0 });
    expect(r.ius[3]).toBe(0);
    expect(r.cdus[3]).toBe(150);
  });

  it("no transfer when CD urea equals IMI urea (equilibrium)", () => {
    const s = mkState(4);
    s.cdus[3] = 100; s.cdw[3] = 1;
    s.ius[3] = 100;  s.iw[3] = 1;
    const r = runPhase(s, "urea_recycle", UREA_CFG);
    expect(r.ius[3]).toBeCloseTo(100, 3);
    expect(r.cdus[3]).toBeCloseTo(100, 3);
  });
});

describe("computeSteady", () => {
  it("returns state, convergedAt, snapshots", () => {
    const cfg = { ...BASE_CFG, numBoxes: 3, exchangeRate: 50 };
    const result = computeSteady(cfg);
    expect(result.state).toBeDefined();
    expect(result.snapshots.length).toBeGreaterThan(0);
  });

  it("s1-exchange scenario runs without crashing", () => {
    const cfg = { ...BASE_CFG, scenario: "s1-exchange", numBoxes: 3 };
    expect(() => computeSteady(cfg)).not.toThrow();
  });
});
