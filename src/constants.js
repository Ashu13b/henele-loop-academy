export const SC = {
  "open": {
    label: "Open Passive", short: "Open",
    desc: "Two antiparallel streams, no pump, no tip connection. Shows opposing gradients — tip never exceeds input.",
    hasActive: false, isLoop: false, hasI: false,
    watch: "Watch D and A build opposing gradients — D rises toward the tip, A rises toward the base. Try increasing Segments: the gradient becomes steeper but the ceiling stays fixed at input. The two tips never cross each other's starting value.",
    key: "Passive exchange alone cannot amplify. No matter how many segments, both tips converge to ≈ input concentration (factor ≈ 1×). A gradient forms — but within the input range, not beyond it. This is the baseline: geometry + diffusion = redistribution only.",
  },
  "open-inj": {
    label: "Open + Injection", short: "Open+Inj",
    desc: "Pump INJECTS solute from A directly into D. ⚠ Fabricates solute. No tip connection = no feedback = additive stacking, NOT multiplication.",
    hasActive: true, isLoop: false, hasI: false,
    watch: "Watch Tip D climb above input — it looks like multiplication. Now check the ⚠ conservation badge: fabricated solute grows each cycle. Raise Inject amount and watch both the tip and the fabrication counter rise together.",
    key: "Without a U-turn, injected solute just stacks onto D with no feedback. Fresh fluid washes it away next cycle, so it never truly multiplies — it just adds. And it cheats: solute is created from nothing. Real kidneys cannot do this.",
  },
  "open-i": {
    label: "Open + Interstitium", short: "Open+I",
    desc: "Pump moves A→I (solute). Water leaves D→I (osmosis). Set B Input > 0 so A has solute for the pump. No U-turn — can it multiply?",
    hasActive: true, isLoop: false, hasI: true,
    watch: "Set B Input > 0 so A has solute to pump. Watch I build up (the interstitium gains solute). Watch W in D segments drop as osmosis pulls water into I — D concentrates. Then check Exit A[1]: does it ever climb above input?",
    key: "All three real mechanisms fire (pump, osmosis, interstitium) but without a loop there is no feedback. The exit never climbs past input (factor ≈ 1×). This proves the U-turn is the missing ingredient — not the pump, not osmosis alone.",
  },
  "loop": {
    label: "Loop Passive", short: "Loop",
    desc: "Connected at tip. No pump. Everything → input concentration. Proves geometry alone can't concentrate.",
    hasActive: false, isLoop: true, hasI: false,
    watch: "Watch every D and A segment converge to the same value — the input concentration. No gradient forms tip-to-base; instead everything equalises. More segments doesn't help: all of them settle to the same flat value.",
    key: "The U-turn alone does nothing. Without a pump, both limbs equilibrate to input concentration everywhere (factor ≈ 1×). Geometry is necessary for multiplication but not sufficient. You need something to break the symmetry.",
  },
  "loop-inj": {
    label: "Loop + Injection", short: "Loop+Inj",
    desc: "U-turn + pump INJECTS into D. Real multiplication (feedback!) but ⚠ conservation violated — solute fabricated/destroyed each cycle.",
    hasActive: true, isLoop: true, hasI: false,
    watch: "Watch Tip D climb well above input — that's real feedback. The U-turn recirculates concentrated fluid into the pump zone, amplifying each cycle. Now check the ⚠ badge: fabricated solute grows every cycle. Conservation is broken.",
    key: "The U-turn creates genuine multiplication (factor > 1×) — that's the feedback the open scenario lacked. But solute is fabricated from nothing each cycle. This shows the loop is essential for multiplication, but injection is not how real kidneys do it.",
  },
  "henle": {
    label: "Real Henle", short: "Henle",
    desc: "U-turn + pump→I + osmosis D→I. Real multiplication with conservation. D concentrates by LOSING WATER, not gaining solute. I is the battery.",
    hasActive: true, isLoop: true, hasI: true,
    watch: "Watch the W value inside D segments fall below 1.0 — water is leaving via osmosis into I. S (solute mass) in D stays nearly constant. Concentration rises only because water left. Check conservation: total solute stays stable. I is the gradient battery that makes this work.",
    key: "Real multiplication with conservation intact. D concentrates by LOSING WATER, not gaining solute — the pump charges I, osmosis drains D, the U-turn feeds dilute fluid back to the pump. Factor > 1×, nothing fabricated. This is how your kidneys work right now.",
  },
  "short-loop": {
    label: "Short Loop (Cortical)", short: "S.Loop",
    desc: "Cortical nephron: only 4 segments. Same single-effect pump (~200 mOsm per level) as Real Henle — but fewer levels means weak multiplication. Tip barely reaches 400–600 mOsm.",
    hasActive: true, isLoop: true, hasI: true,
    defaultNumBoxes: 4, defaultActiveAmount: 200,
    watch: "Watch the tip concentration — it plateaus well below 1200 mOsm. Each level adds the same ~200 mOsm single effect, but with only 4 segments there are not enough rungs on the ladder. Compare with Real Henle to see how loop length sets the ceiling.",
    key: "Multiplication = single-effect × number of levels. A short cortical loop can only reach ~400–600 mOsm. Most human nephrons are cortical; only the juxtamedullary ones reach 1200. This is why humans can concentrate urine to 1200 but not higher.",
  },
  "kangaroo-rat": {
    label: "Kangaroo Rat", short: "K.Rat",
    desc: "Desert survival: 16-segment loop with a stronger pump (~300 mOsm single effect). Models the kangaroo rat kidney that can concentrate urine above 9000 mOsm — nearly 8× human maximum.",
    hasActive: true, isLoop: true, hasI: true,
    defaultNumBoxes: 16, defaultActiveAmount: 300,
    watch: "Watch the tip concentration keep climbing — far past 1200 mOsm. Every extra segment multiplies the gradient one more time. The interstitium at the tip becomes extraordinarily concentrated. Notice how long it takes to reach steady state with 16 segments.",
    key: "The kangaroo rat never needs to drink water — it survives entirely on metabolic water from seeds. Its secret is a very long Loop of Henle. Loop length is the primary evolutionary lever for urine concentration: more segments, higher ceiling. Physics is identical to Real Henle — only the geometry differs.",
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
