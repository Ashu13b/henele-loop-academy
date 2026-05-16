import { computeSteady } from './engine.js';

self.onmessage = (e) => {
  self.postMessage(computeSteady(e.data));
};
