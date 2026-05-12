import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import Chart from "../src/components/Chart.jsx";

const HISTORY = [
  { step: 1, tipD: 310, tipA: 290, exit: 280 },
  { step: 2, tipD: 320, tipA: 295, exit: 285 },
  { step: 3, tipD: 330, tipA: 300, exit: 290 },
];

describe("Chart", () => {
  it("renders nothing when history has fewer than 2 entries", () => {
    const { container } = render(<Chart history={[HISTORY[0]]} scenario="s2-multiplier" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a chart when history has 2+ entries", () => {
    const { container } = render(<Chart history={HISTORY} scenario="s2-multiplier" />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders without crashing for empty history", () => {
    const { container } = render(<Chart history={[]} scenario="s1-exchange" />);
    expect(container.firstChild).toBeNull();
  });

  it("shows title text", () => {
    const { getByText } = render(<Chart history={HISTORY} scenario="s1-exchange" />);
    expect(getByText("Gradient Build-up")).toBeTruthy();
  });

  it("renders Tip I line for hasI scenarios", () => {
    const historyWithI = HISTORY.map(h => ({ ...h, tipI: h.tipD + 50 }));
    const { container } = render(<Chart history={historyWithI} scenario="s2-multiplier" />);
    // Recharts renders legend items — check for Tip I text
    expect(container.textContent).toContain("Tip I");
  });

  it("does not render Tip I line for non-hasI scenarios", () => {
    const { container } = render(<Chart history={HISTORY} scenario="s1-hairpin" />);
    expect(container.textContent).not.toContain("Tip I");
  });
});
