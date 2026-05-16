import { describe, it, expect } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import App from "../src/App.jsx";

describe("App", () => {
  it("renders without crashing", () => {
    const { container } = render(<App />);
    expect(container.firstChild).toBeTruthy();
  });

  it("shows the title", () => {
    const { getByText } = render(<App />);
    expect(getByText("Countercurrent Simulator")).toBeTruthy();
  });

  it("renders scenario stages", () => {
    const { getByText } = render(<App />);
    // App starts on stage 1; both stage-1 scenario buttons must be visible
    expect(getByText("Exchange")).toBeTruthy();
    expect(getByText("Hairpin")).toBeTruthy();
  });

  it("Step button advances phase", () => {
    const { getByText } = render(<App />);
    // Initially idle
    expect(getByText("⏸")).toBeTruthy(); // PI.idle icon
    fireEvent.click(getByText("Step →"));
    // After step, should no longer be idle icon — phase changed
    expect(getByText("①")).toBeTruthy(); // FEED icon
  });

  it("Reset button resets cycle count to 0", () => {
    const { getByText } = render(<App />);
    // Step a few times
    fireEvent.click(getByText("Step →"));
    fireEvent.click(getByText("Step →"));
    fireEvent.click(getByText("Reset"));
    expect(getByText("0")).toBeTruthy(); // cycle counter
  });

  it("switching scenario resets state", () => {
    const { getByText } = render(<App />);
    fireEvent.click(getByText("Step →"));
    expect(getByText("①")).toBeTruthy();
    fireEvent.click(getByText("Hairpin"));
    // After scenario switch, should be back to idle
    expect(getByText("⏸")).toBeTruthy();
  });

  it("renders SVG visualization", () => {
    const { container } = render(<App />);
    expect(container.querySelector("svg")).toBeTruthy();
  });
});
