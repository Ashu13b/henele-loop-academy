import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import UViz from "../src/components/UViz.jsx";
import { mkState } from "../src/engine.js";

// Need @testing-library/react — install via vitest jsdom environment
// Using a minimal render check since full SVG testing is complex.

const CFG = {
  scenario: "s2-multiplier",
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

  it("renders D, I, and A columns for multiplier scenario", () => {
    const s = mkState(5);
    const { container } = render(<UViz s={s} n={5} mx={600} phase="idle" cfg={CFG} />);
    const texts = Array.from(container.querySelectorAll("text")).map(t => t.textContent);
    expect(texts.some(t => t.includes("DESC ↓"))).toBe(true);
    expect(texts.some(t => t.includes("ASC ↑"))).toBe(true);
    expect(texts.some(t => t.includes("TISSUE"))).toBe(true);
  });

  it("does not render Tissue labels for simple exchange", () => {
    const cfg = { ...CFG, scenario: "s1-exchange" };
    const s = mkState(5);
    const { container } = render(<UViz s={s} n={5} mx={600} phase="idle" cfg={cfg} />);
    const texts = Array.from(container.querySelectorAll("text")).map(t => t.textContent);
    expect(texts.some(t => t.includes("TISSUE"))).toBe(false);
  });

  it("Bug 4 fix: S/W labels are rendered", () => {
    const s = mkState(5);
    const { container } = render(<UViz s={s} n={5} mx={600} phase="idle" cfg={CFG} />);
    const texts = Array.from(container.querySelectorAll("text")).map(t => t.textContent);
    expect(texts.some(t => t.includes("S:"))).toBe(true);
    expect(texts.some(t => t.includes("W:"))).toBe(true);
  });

  it("renders n rows of boxes", () => {
    const s = mkState(4);
    const cfg = { ...CFG, numBoxes: 4 };
    const { container } = render(<UViz s={s} n={4} mx={600} phase="idle" cfg={cfg} />);
    const rects = container.querySelectorAll("rect");
    // 4 rows × 5 tubule columns (D, A, CD, VR-D, VR-A) = 20
    // + 1 background gradient rect = 21 total
    expect(rects.length).toBe(21);
  });
});
