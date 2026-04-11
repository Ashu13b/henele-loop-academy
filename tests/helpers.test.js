import { describe, it, expect } from "vitest";
import { cCol, tCol, gc } from "../src/helpers.js";

describe("cCol", () => {
  it("returns an rgb string", () => {
    expect(cCol(0, 300)).toMatch(/^rgb\(/);
    expect(cCol(300, 300)).toMatch(/^rgb\(/);
  });

  it("low value is blue-ish (low red component)", () => {
    const col = cCol(0, 300);
    const r = parseInt(col.match(/rgb\((\d+)/)[1]);
    expect(r).toBeLessThan(80);
  });

  it("high value is red-ish (high red component)", () => {
    const col = cCol(300, 300);
    const r = parseInt(col.match(/rgb\((\d+)/)[1]);
    expect(r).toBeGreaterThan(200);
  });

  it("handles mx=0 without NaN/error", () => {
    expect(() => cCol(0, 0)).not.toThrow();
    expect(cCol(0, 0)).toMatch(/^rgb\(/);
  });
});

describe("tCol", () => {
  it("returns white for high concentration ratio", () => {
    expect(tCol(300, 300)).toBe("#fff");
  });

  it("returns dark for low concentration ratio", () => {
    expect(tCol(0, 300)).toBe("#1a1a2e");
  });

  it("threshold is at 0.55", () => {
    expect(tCol(54, 100)).toBe("#1a1a2e");
    expect(tCol(56, 100)).toBe("#fff");
  });
});

describe("gc", () => {
  it("returns solute/water concentration", () => {
    expect(gc(300, 1)).toBe(300);
    expect(gc(150, 0.5)).toBe(300);
  });

  it("returns 0 when water is near zero", () => {
    expect(gc(100, 0)).toBe(0);
    expect(gc(100, 0.005)).toBe(0);
  });

  it("returns 0 for zero solute", () => {
    expect(gc(0, 1)).toBe(0);
  });
});
