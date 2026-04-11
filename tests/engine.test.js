import { describe, it, expect } from "vitest";
import { mkState, cloneS, getPhases, runPhase, runCycle, computeSteady } from "../src/engine.js";

const BASE_CFG = {
  scenario: "henle",
  numBoxes: 5,
  initialA: 300,
  initialB: 300,
  exchangeRate: 30,
  activeAmount: 20,
};

describe("mkState", () => {
  it("creates arrays of length n", () => {
    const s = mkState(5);
    expect(s.ds).toHaveLength(5);
    expect(s.as).toHaveLength(5);
    expect(s.is).toHaveLength(5);
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
  it("henle has pump, osmosis, flow", () => {
    const p = getPhases("henle");
    expect(p).toContain("pump");
    expect(p).toContain("osmosis");
    expect(p).toContain("flow");
    expect(p).not.toContain("inject");
    expect(p).not.toContain("exchange");
  });

  it("loop-inj has inject and flow, no pump/osmosis", () => {
    const p = getPhases("loop-inj");
    expect(p).toContain("inject");
    expect(p).toContain("flow");
    expect(p).not.toContain("pump");
    expect(p).not.toContain("osmosis");
  });

  it("open has exchange but no inject/pump", () => {
    const p = getPhases("open");
    expect(p).toContain("exchange");
    expect(p).not.toContain("inject");
    expect(p).not.toContain("pump");
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
    const cfg = { ...BASE_CFG, scenario: "open" };
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

describe("computeSteady", () => {
  it("returns state, convergedAt, snapshots", () => {
    const cfg = { ...BASE_CFG, numBoxes: 3, exchangeRate: 50 };
    const result = computeSteady(cfg);
    expect(result.state).toBeDefined();
    expect(result.snapshots.length).toBeGreaterThan(0);
  });

  it("open-i scenario runs without crashing (Bug 1 regression)", () => {
    const cfg = { ...BASE_CFG, scenario: "open-i", numBoxes: 3 };
    expect(() => computeSteady(cfg)).not.toThrow();
  });
});
