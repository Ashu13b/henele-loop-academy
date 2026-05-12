import { describe, it, expect } from "vitest";
import { SC, PI, SPEEDS } from "../src/constants.js";

describe("SC", () => {
  it("has 9 academy scenarios", () => {
    expect(Object.keys(SC)).toHaveLength(9);
  });

  it("each scenario has required shape and stage", () => {
    for (const [key, s] of Object.entries(SC)) {
      expect(typeof s.label, key).toBe("string");
      expect(typeof s.short, key).toBe("string");
      expect(typeof s.desc, key).toBe("string");
      expect(typeof s.hasActive, key).toBe("boolean");
      expect(typeof s.isLoop, key).toBe("boolean");
      expect(typeof s.hasI, key).toBe("boolean");
      expect(typeof s.stage, key).toBe("number");
    }
  });

  it("s2-multiplier has core features active", () => {
    expect(SC["s2-multiplier"].hasActive).toBe(true);
    expect(SC["s2-multiplier"].isLoop).toBe(true);
    expect(SC["s2-multiplier"].hasI).toBe(true);
  });

  it("s1-exchange has no features active", () => {
    expect(SC["s1-exchange"].hasActive).toBe(false);
    expect(SC["s1-exchange"].isLoop).toBe(false);
    expect(SC["s1-exchange"].hasI).toBe(false);
  });
});

describe("PI", () => {
  it("has required phases", () => {
    const required = ["idle", "feed", "exchange", "pump", "osmosis", "vr", "cd", "flow"];
    for (const p of required) {
      expect(PI[p], p).toBeDefined();
    }
  });

  it("each phase has icon, color, label", () => {
    for (const [key, p] of Object.entries(PI)) {
      expect(typeof p.icon, key).toBe("string");
      expect(typeof p.color, key).toBe("string");
      expect(typeof p.label, key).toBe("string");
    }
  });
});

describe("SPEEDS", () => {
  it("has 3 speeds", () => {
    expect(SPEEDS).toHaveLength(3);
  });

  it("each speed has label and ms", () => {
    for (const s of SPEEDS) {
      expect(typeof s.label).toBe("string");
      expect(typeof s.ms).toBe("number");
      expect(s.ms).toBeGreaterThan(0);
    }
  });

  it("speeds are in descending order (slowest first)", () => {
    expect(SPEEDS[0].ms).toBeGreaterThan(SPEEDS[1].ms);
    expect(SPEEDS[1].ms).toBeGreaterThan(SPEEDS[2].ms);
  });
});
