import { describe, it, expect } from "vitest";
import { explain } from "../src/explainer.js";
import { mkState } from "../src/engine.js";

const CFG = {
  scenario: "s2-multiplier",
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

  it("feed for loop mentions glomerular filtrate", () => {
    const s = mkState(5);
    const t = explain("feed", s, null, CFG, 0);
    expect(t.toLowerCase()).toContain("filtrate");
  });

  it("feed for non-loop mentions B input", () => {
    const cfg = { ...CFG, scenario: "s1-exchange" };
    const s = mkState(5);
    const t = explain("feed", s, null, cfg, 0);
    expect(t).toContain(`A${cfg.numBoxes}`);
  });

  it("exchange mentions passive exchange", () => {
    const s = mkState(5);
    const t = explain("exchange", s, null, CFG, 1);
    expect(t.toLowerCase()).toContain("passive");
  });

  it("pump mentions A to I", () => {
    const s = mkState(5);
    const t = explain("pump", s, null, CFG, 1);
    expect(t).toContain("A to I");
  });

  it("osmosis explains water loss", () => {
    const s = mkState(5);
    const t = explain("osmosis", s, null, CFG, 1);
    expect(t.toLowerCase()).toContain("water");
  });

  it("flow mentions U-turn for loop", () => {
    const s = mkState(5);
    const t = explain("flow", s, null, CFG, 1);
    expect(t.toLowerCase()).toContain("u-turn");
  });

  it("unknown phase returns empty string", () => {
    const s = mkState(5);
    expect(explain("unknown", s, null, CFG, 0)).toBe("");
  });
});
