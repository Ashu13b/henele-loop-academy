// Polyfill ResizeObserver for jsdom (used by Recharts ResponsiveContainer).
// Fire callback immediately with fake dimensions so charts actually render.
global.ResizeObserver = class ResizeObserver {
  constructor(cb) { this._cb = cb; }
  observe(el) {
    this._cb([{ contentRect: { width: 400, height: 200 } }]);
  }
  unobserve() {}
  disconnect() {}
};
