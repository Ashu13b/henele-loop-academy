import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import LinearViz from "../src/components/LinearViz.jsx";
import { mkState } from "../src/engine.js";

const CFG = {
  scenario: "s2-multiplier",
  numBoxes: 5,
  initialA: 300,
  initialB: 300,
  exchangeRate: 30,
  activeAmount: 20,
};

describe("LinearViz", () => {
  it("renders without crashing", () => {
    const s = mkState(5);
    const { container } = render(<LinearViz s={s} n={5} mx={600} phase="idle" cfg={CFG} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("renders I row for multiplier scenario", () => {
    const s = mkState(5);
    const { container } = render(<LinearViz s={s} n={5} mx={600} phase="idle" cfg={CFG} />);
    const texts = Array.from(container.querySelectorAll("text")).map(t => t.textContent);
    expect(texts.some(t => t === "I")).toBe(true);
  });

  it("does not render I row for exchange scenario", () => {
    const cfg = { ...CFG, scenario: "s1-exchange" };
    const s = mkState(5);
    const { container } = render(<LinearViz s={s} n={5} mx={600} phase="idle" cfg={cfg} />);
    const texts = Array.from(container.querySelectorAll("text")).map(t => t.textContent);
    expect(texts.some(t => t === "I")).toBe(false);
  });

  it("Bug 4 fix: S/W labels are rendered", () => {
    const s = mkState(5);
    const { container } = render(<LinearViz s={s} n={5} mx={600} phase="idle" cfg={CFG} />);
    const texts = Array.from(container.querySelectorAll("text")).map(t => t.textContent);
    expect(texts.some(t => t.includes("S:"))).toBe(true);
    expect(texts.some(t => t.includes("W:"))).toBe(true);
  });

  it("renders D→ and A← labels", () => {
    const s = mkState(5);
    const { container } = render(<LinearViz s={s} n={5} mx={600} phase="idle" cfg={CFG} />);
    const texts = Array.from(container.querySelectorAll("text")).map(t => t.textContent);
    expect(texts.some(t => t.includes("D→"))).toBe(true);
    expect(texts.some(t => t.includes("A←"))).toBe(true);
  });
});
