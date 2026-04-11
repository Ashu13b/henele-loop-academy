import { describe, it, expect } from "vitest";
import { explain } from "../src/explainer.js";
import { mkState } from "../src/engine.js";

const CFG = {
  scenario: "henle",
  numBoxes: 5,
  initialA: 300,
  initialB: 300,
  exchangeRate: 30,
  activeAmount: 20,
};

describe("explain", () => {
  it("idle returns non-empty string", () => {
    const s = mkState(5);
    expect(explain("idle", s, null, CFG, 0).length).toBeGreaterThan(0);
  });

  it("feed mentions initialA value", () => {
    const s = mkState(5);
    const t = explain("feed", s, null, CFG, 0);
    expect(t).toContain("300");
  });

  it("feed for loop mentions U-turn on step 0", () => {
    const s = mkState(5);
    const t = explain("feed", s, null, CFG, 0);
    expect(t.toLowerCase()).toContain("u-turn");
  });

  it("feed for non-loop mentions B input", () => {
    const cfg = { ...CFG, scenario: "open" };
    const s = mkState(5);
    const t = explain("feed", s, null, cfg, 0);
    expect(t).toContain(`A${cfg.numBoxes}`);
  });

  it("exchange mentions exchange rate", () => {
    const s = mkState(5);
    const t = explain("exchange", s, null, CFG, 1);
    expect(t).toContain("30%");
  });

  it("inject contains conservation-violated language (Bug 5 fix)", () => {
    const cfg = { ...CFG, scenario: "loop-inj" };
    const s = mkState(5);
    const t = explain("inject", s, null, cfg, 1);
    expect(t.toLowerCase()).toContain("conservation");
    expect(t).toContain("⚠");
  });

  it("pump mentions A→I and nothing created", () => {
    const s = mkState(5);
    const t = explain("pump", s, null, CFG, 1);
    expect(t).toContain("A→I");
    expect(t.toLowerCase()).toMatch(/nothing.*created|created.*nothing/);
  });

  it("osmosis explains water loss not solute gain", () => {
    const s = mkState(5);
    const t = explain("osmosis", s, null, CFG, 1);
    expect(t.toLowerCase()).toContain("water");
    expect(t.toLowerCase()).toMatch(/losing water|water.*out/);
  });

  it("flow mentions D↓ A↑", () => {
    const s = mkState(5);
    const t = explain("flow", s, null, CFG, 1);
    expect(t).toContain("D");
    expect(t).toContain("A");
  });

  it("unknown phase returns empty string", () => {
    const s = mkState(5);
    expect(explain("unknown", s, null, CFG, 0)).toBe("");
  });
});
