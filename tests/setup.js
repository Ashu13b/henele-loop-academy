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

// Stub Worker for jsdom — Vite's ?worker import generates a class that calls
// new Worker(...) in its constructor; jsdom has no Worker, so it would throw.
global.Worker = class {
  constructor() {}
  postMessage() {}
  terminate() {}
  set onmessage(_) {}
};
