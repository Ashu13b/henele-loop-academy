export const SC = {
  // --- STAGE 1: FOUNDATION ---
  "s1-exchange": {
    stage: 1, label: "Simple Exchange", short: "Exchange",
    desc: "Two parallel pipes with passive solute exchange. Proves that without energy or loops, you only get redistribution, not concentration.",
    hasActive: false, isLoop: false, hasI: false,
    watch: "Watch the D and A segments. Solute moves from high to low concentration. Notice the tips never exceed the input concentration.",
    key: "Passive exchange alone cannot amplify. Baseline: geometry + diffusion = redistribution only.",
  },
  "s1-hairpin": {
    stage: 1, label: "The Hairpin", short: "Hairpin",
    desc: "Connects the pipes at the tip (U-turn). Proves that geometry alone, without a pump, results in equilibration to input levels.",
    hasActive: false, isLoop: true, hasI: false,
    watch: "Watch the fluid U-turn. Without a pump to break symmetry, everything eventually settles to the exact same concentration (300).",
    key: "The U-turn is necessary for multiplication but not sufficient. You need an energy-consuming pump to create a gradient.",
  },

  // --- STAGE 2: MULTIPLICATION ---
  "s2-single-effect": {
    stage: 2, label: "Single Effect", short: "Single-E",
    desc: "Active transport moves salt A→I, creating a 200mOsm step. Flow is paused to show the 'atom' of the system in isolation.",
    hasActive: true, isLoop: true, hasI: true,
    defaultNumBoxes: 8, defaultActiveAmount: 200,
    isStatic: true, // Custom flag to disable flow in engine
    watch: "Watch the 'PUMP' phase. It creates a fixed 200 mOsm difference between A and I at every level. This is the Single Effect.",
    key: "The Single Effect is the horizontal gradient. By itself, it only creates a small difference. It needs flow to be 'multiplied' vertically.",
  },
  "s2-multiplier": {
    stage: 2, label: "The Multiplier", short: "Multiplier",
    desc: "Combines Single Effect with Flow. Shows how the U-turn 'multiplies' small horizontal steps into a massive vertical gradient.",
    hasActive: true, isLoop: true, hasI: true,
    defaultNumBoxes: 8, defaultActiveAmount: 200,
    watch: "Watch the tip concentration climb past 600, 900, 1200. This is the payoff: horizontal work multiplied by vertical flow.",
    key: "Countercurrent Multiplication: The loop recirculates concentrated fluid, allowing the pump to work on already-salty fluid.",
  },

  // --- STAGE 3: THE SYSTEM ---
  "s3-vasa-recta": {
    stage: 3, label: "Vasa Recta", short: "Vasa-R",
    desc: "Adds countercurrent blood vessels. Shows how blood can supply the medulla without washing away the precious salt gradient.",
    hasActive: true, isLoop: true, hasI: true,
    defaultNumBoxes: 8, defaultActiveAmount: 200,
    hasVR: true,
    watch: "Watch the VR-D and VR-A columns. They pick up salt as they descend and give it back as they ascend, preserving the gradient.",
    key: "The Vasa Recta are 'Exchangers', not 'Multipliers'. They maintain the gradient that the Loop of Henle built.",
  },
  "s3-urine-payoff": {
    stage: 3, label: "Urine Payoff", short: "CD/ADH",
    desc: "Adds the Collecting Duct and ADH control. Shows how the gradient is used to recover water and concentrate the final urine.",
    hasActive: true, isLoop: true, hasI: true,
    defaultNumBoxes: 8, defaultActiveAmount: 200,
    hasCD: true,
    watch: "Adjust the ADH slider. High ADH allows water to leave the CD into the salty tissue, concentrating the urine.",
    key: "The whole point of the gradient is the CD. Without the gradient, ADH has nothing to pull water toward.",
  },

  // --- STAGE 4: EXTREMES ---
  "s4-desert-rat": {
    stage: 4, label: "Desert Rat", short: "Desert-R",
    desc: "16-segment loop with a strong pump (~300 mOsm). Models survival in extreme heat where every drop of water counts.",
    hasActive: true, isLoop: true, hasI: true,
    defaultNumBoxes: 16, defaultActiveAmount: 300,
    watch: "Watch the tip reach 3000+ mOsm. Notice how loop length is the primary lever for the maximum concentration ceiling.",
    key: "Evolutionary Biology: Longer loops = more multiplication steps = more concentrated urine.",
  },
  "s4-furosemide": {
    stage: 4, label: "Furosemide", short: "Lasix",
    desc: "Clinical: The NKCC2 pump is blocked (Active Amount = 0). Visualizes the 'Washout' of the gradient and resulting dilute urine.",
    hasActive: true, isLoop: true, hasI: true,
    defaultNumBoxes: 8, activeAmountOverride: 0,
    watch: "Start with a gradient, then turn on Furosemide. Watch the salt get washed away until the whole medulla is 300 mOsm.",
    key: "Loop Diuretics: By blocking the pump, you destroy the gradient. No gradient means no water recovery in the CD → Polyuria.",
  },
  "s4-diabetes-insipidus": {
    stage: 4, label: "Diabetes Insipidus", short: "DI",
    desc: "Clinical: 0% ADH. The collecting duct is impermeable to water. Massive volume of very dilute urine (50 mOsm).",
    hasActive: true, isLoop: true, hasI: true,
    defaultNumBoxes: 8, defaultActiveAmount: 200,
    adhOverride: 0,
    watch: "Check the CD. Even with a perfect 1200 mOsm tissue gradient, water cannot leave. Urine remains dilute and voluminous.",
    key: "DI: A failure of the 'Receiver' (CD), not the 'Battery' (Gradient). The kidney can't use the salt it worked so hard to store.",
  },
  "s4-urea-trap": {
    stage: 4, label: "Urea Trap", short: "Urea",
    desc: "ADH opens UT-A1/3 transporters in the inner medullary CD, releasing urea into the interstitium. Watch the NaCl + Urea columns — urea adds ~200–400 mOsm to the papillary gradient.",
    hasActive: true, isLoop: true, hasI: true,
    defaultNumBoxes: 8, defaultActiveAmount: 200,
    hasCD: true, hasUrea: true,
    watch: "Watch the Urea row (amber) build from zero in the inner medullary tissue boxes. Compare the papillary tip total with a scenario that has no CD.",
    key: "Urea recycling contributes ~40% of inner medullary osmolarity at peak ADH. Without it, maximum urine concentration cannot exceed ~600 mOsm.",
  },
};

export const PI = {
  idle:     { icon: "⏸", color: "#555",    label: "Ready" },
  feed:     { icon: "①", color: "#27ae60", label: "FEED" },
  exchange: { icon: "②", color: "#e67e22", label: "EXCHANGE" },
  pump:     { icon: "③", color: "#8e44ad", label: "PUMP → I" },
  osmosis:  { icon: "②", color: "#2980b9", label: "OSMOSIS" },
  vr:       { icon: "④", color: "#e74c3c", label: "VASA RECTA" },
  cd:       { icon: "⑤", color: "#a855f7", label: "COLLECTING DUCT" },
  flow:         { icon: "⑥", color: "#3498db", label: "FLOW" },
  urea_recycle: { icon: "⑦", color: "#f39c12", label: "UREA TRAP" },
};

export const SPEEDS = [
  { label: "Slow", ms: 1200 },
  { label: "Med",  ms: 500 },
  { label: "Fast", ms: 150 },
];
