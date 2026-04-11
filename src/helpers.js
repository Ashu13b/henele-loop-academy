/** Concentration colour — blue (low) to red (high). */
export function cCol(v, mx) {
  const t = Math.min(v / (mx || 1), 1);
  return `rgb(${Math.round(30 + 210 * t)},${Math.round(100 + 80 * (1 - t))},${Math.round(200 - 160 * t)})`;
}

/** Text colour for contrast on a concentration background. */
export function tCol(v, mx) {
  return v / (mx || 1) > 0.55 ? "#fff" : "#1a1a2e";
}

/** Get concentration from solute + water. */
export function gc(s, w) {
  return w > 0.01 ? s / w : 0;
}
