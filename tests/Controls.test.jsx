import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import Controls from "../src/components/Controls.jsx";

const CFG = {
  scenario: "s2-multiplier",
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

  it("renders all scenario stages", () => {
    const { getByText } = render(<Controls {...DEFAULT_PROPS} />);
    expect(getByText(/Stage 1/i)).toBeTruthy();
    expect(getByText(/Stage 2/i)).toBeTruthy();
    expect(getByText(/Stage 3/i)).toBeTruthy();
    expect(getByText(/Stage 4/i)).toBeTruthy();
  });

  it("active scenario tab is highlighted (s2-multiplier)", () => {
    const { getByText } = render(<Controls {...DEFAULT_PROPS} />);
    const btn = getByText("Multiplier");
    expect(btn.style.color).toBe("rgb(230, 126, 34)"); // #e67e22
  });

  it("calls onUpdateCfg when scenario tab is clicked", () => {
    const onUpdateCfg = vi.fn();
    const { getByText } = render(<Controls {...DEFAULT_PROPS} onUpdateCfg={onUpdateCfg} />);
    fireEvent.click(getByText("Exchange"));
    expect(onUpdateCfg).toHaveBeenCalledWith("scenario", "s1-exchange");
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
    // multiplier is isLoop — B Input should not be rendered
    expect(queryByLabelText("B Input")).toBeNull();
  });

  it("shows B Input for open scenarios", () => {
    const cfg = { ...CFG, scenario: "s1-exchange" };
    const { getByLabelText } = render(<Controls {...DEFAULT_PROPS} cfg={cfg} />);
    expect(getByLabelText("B Input")).toBeTruthy();
  });
});
