import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import UViz from "../src/components/UViz.jsx";
import { mkState } from "../src/engine.js";

// Need @testing-library/react — install via vitest jsdom environment
// Using a minimal render check since full SVG testing is complex.

const CFG = {
  scenario: "henle",
  numBoxes: 5,
  initialA: 300,
  initialB: 300,
  exchangeRate: 30,
  activeAmount: 20,
};

describe("UViz", () => {
  it("renders without crashing", () => {
    const s = mkState(5);
    const { container } = render(<UViz s={s} n={5} mx={600} phase="idle" cfg={CFG} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("renders D, I, and A columns for henle scenario", () => {
    const s = mkState(5);
    const { container } = render(<UViz s={s} n={5} mx={600} phase="idle" cfg={CFG} />);
    const texts = Array.from(container.querySelectorAll("text")).map(t => t.textContent);
    expect(texts.some(t => t.includes("D ↓"))).toBe(true);
    expect(texts.some(t => t.includes("A ↑"))).toBe(true);
    expect(texts.some(t => t.includes("I (tissue)"))).toBe(true);
  });

  it("does not render I column for loop-inj scenario", () => {
    const cfg = { ...CFG, scenario: "loop-inj" };
    const s = mkState(5);
    const { container } = render(<UViz s={s} n={5} mx={600} phase="idle" cfg={cfg} />);
    const texts = Array.from(container.querySelectorAll("text")).map(t => t.textContent);
    expect(texts.some(t => t.includes("I (tissue)"))).toBe(false);
  });

  it("Bug 4 fix: S/W labels are rendered", () => {
    const s = mkState(5);
    const { container } = render(<UViz s={s} n={5} mx={600} phase="idle" cfg={CFG} />);
    const texts = Array.from(container.querySelectorAll("text")).map(t => t.textContent);
    expect(texts.some(t => t.startsWith("S:"))).toBe(true);
    expect(texts.some(t => t.includes("W:"))).toBe(true);
  });

  it("renders n rows of boxes", () => {
    const s = mkState(4);
    const cfg = { ...CFG, numBoxes: 4 };
    const { container } = render(<UViz s={s} n={4} mx={600} phase="idle" cfg={cfg} />);
    const rects = container.querySelectorAll("rect");
    // 4 rows × 3 columns (D, I, A for henle) = 12 rects
    expect(rects.length).toBe(12);
  });
});
