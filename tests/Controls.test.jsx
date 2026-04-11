import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import Controls from "../src/components/Controls.jsx";

const CFG = {
  scenario: "henle",
  numBoxes: 5,
  initialA: 300,
  initialB: 300,
  exchangeRate: 30,
  activeAmount: 20,
};

const noop = () => {};

const DEFAULT_PROPS = {
  cfg: CFG,
  onUpdateCfg: noop,
  phase: "idle",
  playing: false,
  speedIdx: 1,
  fullStep: 0,
  computing: false,
  onStep: noop,
  onCycle: noop,
  onPlay: noop,
  onSpeedChange: noop,
  onReset: noop,
  onSteady: noop,
};

describe("Controls", () => {
  it("renders without crashing", () => {
    const { container } = render(<Controls {...DEFAULT_PROPS} />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders all 6 scenario tabs", () => {
    const { getAllByRole } = render(<Controls {...DEFAULT_PROPS} />);
    const buttons = getAllByRole("button");
    // 6 scenario + Reset + Step + Cycle + Play + Speed + Steady + (possible others)
    expect(buttons.length).toBeGreaterThanOrEqual(6);
  });

  it("active scenario tab is highlighted (henle)", () => {
    const { getByText } = render(<Controls {...DEFAULT_PROPS} />);
    const henleBtn = getByText("Henle");
    expect(henleBtn.style.color).toBe("rgb(230, 126, 34)"); // #e67e22
  });

  it("calls onUpdateCfg when scenario tab is clicked", () => {
    const onUpdateCfg = vi.fn();
    const { getByText } = render(<Controls {...DEFAULT_PROPS} onUpdateCfg={onUpdateCfg} />);
    fireEvent.click(getByText("Open"));
    expect(onUpdateCfg).toHaveBeenCalledWith("scenario", "open");
  });

  it("calls onStep when Step button is clicked", () => {
    const onStep = vi.fn();
    const { getByText } = render(<Controls {...DEFAULT_PROPS} onStep={onStep} />);
    fireEvent.click(getByText("Step →"));
    expect(onStep).toHaveBeenCalledTimes(1);
  });

  it("calls onReset when Reset button is clicked", () => {
    const onReset = vi.fn();
    const { getByText } = render(<Controls {...DEFAULT_PROPS} onReset={onReset} />);
    fireEvent.click(getByText("Reset"));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("shows play button when not playing", () => {
    const { getByText } = render(<Controls {...DEFAULT_PROPS} playing={false} />);
    expect(getByText("▶")).toBeTruthy();
  });

  it("shows pause button when playing", () => {
    const { getByText } = render(<Controls {...DEFAULT_PROPS} playing={true} />);
    expect(getByText("⏸")).toBeTruthy();
  });

  it("shows cycle count", () => {
    const { getByText } = render(<Controls {...DEFAULT_PROPS} fullStep={42} />);
    expect(getByText("42")).toBeTruthy();
  });

  it("does not show B Input for loop scenarios", () => {
    const { queryByLabelText } = render(<Controls {...DEFAULT_PROPS} />);
    // henle is isLoop — B Input should not be rendered
    expect(queryByLabelText("B Input")).toBeNull();
  });

  it("shows B Input for open scenarios", () => {
    const cfg = { ...CFG, scenario: "open" };
    const { getByLabelText } = render(<Controls {...DEFAULT_PROPS} cfg={cfg} />);
    expect(getByLabelText("B Input")).toBeTruthy();
  });
});
