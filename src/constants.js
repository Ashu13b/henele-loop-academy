export const SC = {
  "open": {
    label: "Open Passive", short: "Open",
    desc: "Two antiparallel streams, no pump, no tip connection. Shows opposing gradients — tip never exceeds input.",
    hasActive: false, isLoop: false, hasI: false,
  },
  "open-inj": {
    label: "Open + Injection", short: "Open+Inj",
    desc: "Pump INJECTS solute from A directly into D. ⚠ Fabricates solute. No tip connection = no feedback = additive stacking, NOT multiplication.",
    hasActive: true, isLoop: false, hasI: false,
  },
  "open-i": {
    label: "Open + Interstitium", short: "Open+I",
    desc: "Pump moves A→I (solute). Water leaves D→I (osmosis). Set B Input > 0 so A has solute for the pump. No U-turn — can it multiply?",
    hasActive: true, isLoop: false, hasI: true,
  },
  "loop": {
    label: "Loop Passive", short: "Loop",
    desc: "Connected at tip. No pump. Everything → input concentration. Proves geometry alone can't concentrate.",
    hasActive: false, isLoop: true, hasI: false,
  },
  "loop-inj": {
    label: "Loop + Injection", short: "Loop+Inj",
    desc: "U-turn + pump INJECTS into D. Real multiplication (feedback!) but ⚠ conservation violated — solute fabricated/destroyed each cycle.",
    hasActive: true, isLoop: true, hasI: false,
  },
  "henle": {
    label: "Real Henle", short: "Henle",
    desc: "U-turn + pump→I + osmosis D→I. Real multiplication with conservation. D concentrates by LOSING WATER, not gaining solute. I is the battery.",
    hasActive: true, isLoop: true, hasI: true,
  },
};

export const PI = {
  idle:     { icon: "⏸", color: "#555",    label: "Ready" },
  feed:     { icon: "①", color: "#27ae60", label: "FEED" },
  exchange: { icon: "②", color: "#e67e22", label: "EXCHANGE" },
  inject:   { icon: "③", color: "#c0392b", label: "INJECT ⚠" },
  pump:     { icon: "③", color: "#8e44ad", label: "PUMP → I" },
  osmosis:  { icon: "②", color: "#2980b9", label: "OSMOSIS" },
  flow:     { icon: "④", color: "#3498db", label: "FLOW" },
};

export const SPEEDS = [
  { label: "Slow", ms: 1200 },
  { label: "Med",  ms: 500 },
  { label: "Fast", ms: 150 },
];
