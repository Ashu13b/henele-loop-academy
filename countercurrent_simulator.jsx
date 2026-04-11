import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

/* ═══ HELPERS ═══ */
function cCol(v, mx) {
  const t = Math.min(v / (mx || 1), 1);
  return `rgb(${Math.round(30 + 210 * t)},${Math.round(100 + 80 * (1 - t))},${Math.round(200 - 160 * t)})`;
}
function tCol(v, mx) { return v / (mx || 1) > 0.55 ? "#fff" : "#1a1a2e"; }
function gc(s, w) { return w > 0.01 ? s / w : 0; }

/* ═══ SCENARIOS ═══ */
const SC = {
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

const PI = {
  idle:     { icon: "⏸", color: "#555",    label: "Ready" },
  feed:     { icon: "①", color: "#27ae60", label: "FEED" },
  exchange: { icon: "②", color: "#e67e22", label: "EXCHANGE" },
  inject:   { icon: "③", color: "#c0392b", label: "INJECT ⚠" },
  pump:     { icon: "③", color: "#8e44ad", label: "PUMP → I" },
  osmosis:  { icon: "②", color: "#2980b9", label: "OSMOSIS" },
  flow:     { icon: "④", color: "#3498db", label: "FLOW" },
};

const SPEEDS = [
  { label: "Slow", ms: 1200 },
  { label: "Med",  ms: 500 },
  { label: "Fast", ms: 150 },
];

/* ═══ STATE ═══ */
function mkState(n) {
  return {
    ds: Array(n).fill(0), dw: Array(n).fill(1),
    as: Array(n).fill(0), aw: Array(n).fill(1),
    is: Array(n).fill(0), iw: Array(n).fill(1),
    fabricated: 0, destroyed: 0,
  };
}
function cloneS(s) {
  return {
    ds: [...s.ds], dw: [...s.dw],
    as: [...s.as], aw: [...s.aw],
    is: [...s.is], iw: [...s.iw],
    fabricated: s.fabricated, destroyed: s.destroyed,
  };
}

/* ═══ ENGINE ═══ */
function getPhases(scKey) {
  const s = SC[scKey];
  if (s.hasI) {
    const p = ["feed"];
    if (s.hasActive) p.push("pump");
    p.push("osmosis", "flow");
    return p;
  }
  const p = ["feed", "exchange"];
  if (s.hasActive) p.push("inject");
  p.push("flow");
  return p;
}

function runPhase(st, phase, cfg) {
  const sc = SC[cfg.scenario];
  const n = cfg.numBoxes;
  const s = cloneS(st);
  const r = cfg.exchangeRate / 100;

  if (phase === "feed") {
    s.ds[0] = cfg.initialA; s.dw[0] = 1;
    if (!sc.isLoop) { s.as[n - 1] = cfg.initialB; s.aw[n - 1] = 1; }
  }

  else if (phase === "exchange") {
    for (let i = 0; i < n; i++) {
      const dc = gc(s.ds[i], s.dw[i]), ac = gc(s.as[i], s.aw[i]);
      const tr = (dc - ac) * r;
      s.ds[i] -= tr; s.as[i] += tr;
    }
  }

  else if (phase === "inject") {
    let fab = 0, dest = 0;
    for (let i = n - 1; i >= Math.floor(n / 2); i--) {
      const rem = Math.min(s.as[i], cfg.activeAmount);
      s.as[i] -= rem;
      s.ds[i] += rem * 0.5;
      fab += rem * 0.5;
      dest += rem * 0.5;
    }
    s.fabricated += fab;
    s.destroyed += dest;
  }

  else if (phase === "pump") {
    for (let i = n - 1; i >= Math.floor(n / 2); i--) {
      const rem = Math.min(s.as[i], cfg.activeAmount);
      s.as[i] -= rem;
      s.is[i] += rem;
    }
  }

  else if (phase === "osmosis") {
    for (let i = 0; i < n; i++) {
      const dc = gc(s.ds[i], s.dw[i]);
      const ic = gc(s.is[i], s.iw[i]);
      if (ic > dc && s.dw[i] > 0.05) {
        const grad = (ic - dc) / Math.max(ic, 1);
        let wm = grad * r * 0.25 * s.dw[i];
        wm = Math.min(wm, s.dw[i] * 0.4);
        s.dw[i] -= wm; s.iw[i] += wm;
      }
      const ac2 = gc(s.as[i], s.aw[i]);
      const ic2 = gc(s.is[i], s.iw[i]);
      if (ac2 > ic2) {
        let sm = (ac2 - ic2) * r * 0.05;
        sm = Math.min(sm, s.as[i] * 0.15);
        s.as[i] -= sm; s.is[i] += sm;
      }
      s.is[i] *= 0.99; s.iw[i] *= 0.99;
      s.iw[i] += 0.01;
    }
  }

  else if (phase === "flow") {
    const nds = [...s.ds], ndw = [...s.dw];
    const nas = [...s.as], naw = [...s.aw];
    if (sc.isLoop) {
      for (let i = n - 1; i > 0; i--) { nds[i] = s.ds[i - 1]; ndw[i] = s.dw[i - 1]; }
      nas[n - 1] = s.ds[n - 1]; naw[n - 1] = s.dw[n - 1];
      for (let i = 0; i < n - 1; i++) { nas[i] = s.as[i + 1]; naw[i] = s.aw[i + 1]; }
      nds[0] = cfg.initialA; ndw[0] = 1;
    } else {
      for (let i = n - 1; i > 0; i--) { nds[i] = s.ds[i - 1]; ndw[i] = s.dw[i - 1]; }
      for (let i = 0; i < n - 1; i++) { nas[i] = s.as[i + 1]; naw[i] = s.aw[i + 1]; }
      nds[0] = cfg.initialA; ndw[0] = 1;
      nas[n - 1] = cfg.initialB; naw[n - 1] = 1;
    }
    s.ds = nds; s.dw = ndw; s.as = nas; s.aw = naw;
  }

  return s;
}

function runCycle(st, cfg) {
  const order = getPhases(cfg.scenario);
  let s = st;
  for (const p of order) s = runPhase(s, p, cfg);
  return s;
}

/* ═══ STEADY STATE ═══ */
const MIN_C = 10000, MAX_C = 100000;
function computeSteady(cfg) {
  const n = cfg.numBoxes;
  const hasI = SC[cfg.scenario].hasI;
  let s = mkState(n);
  let conv = -1;
  const snaps = [];
  for (let c = 0; c < MAX_C; c++) {
    const p = cloneS(s);
    s = runCycle(s, cfg);
    if (c < 20 || (c % 10 === 0 && c < 200) || (c % 100 === 0 && c < 2000) || c % 1000 === 0) {
      snaps.push({
        step: c + 1,
        tipD: Math.round(gc(s.ds[n - 1], s.dw[n - 1]) * 10) / 10,
        tipA: Math.round(gc(s.as[n - 1], s.aw[n - 1]) * 10) / 10,
        exit: Math.round(gc(s.as[0], s.aw[0]) * 10) / 10,
        ...(hasI ? { tipI: Math.round(gc(s.is[n - 1], s.iw[n - 1]) * 10) / 10 } : {}),
      });
    }
    let md = 0;
    for (let i = 0; i < n; i++) {
      md = Math.max(md,
        Math.abs(gc(s.ds[i], s.dw[i]) - gc(p.ds[i], p.dw[i])),
        Math.abs(gc(s.as[i], s.aw[i]) - gc(p.as[i], p.aw[i])),
      );
      if (hasI) md = Math.max(md, Math.abs(gc(s.is[i], s.iw[i]) - gc(p.is[i], p.iw[i])));
    }
    if (md < 0.001 && c >= MIN_C) { conv = c + 1; break; }
  }
  return { state: s, convergedAt: conv, snapshots: snaps };
}

/* ═══ EXPLAINER ═══ */
function explain(phase, s, prev, cfg, step) {
  const sc = SC[cfg.scenario];
  const n = cfg.numBoxes;
  if (phase === "idle") return "Press Step to begin. Each press does ONE operation.";
  if (phase === "feed") {
    let t = `Fresh fluid (${cfg.initialA} mOsm) enters D1.`;
    if (!sc.isLoop) t += ` A${n} receives ${cfg.initialB}.`;
    if (sc.isLoop && step === 0) t += " Same fluid will U-turn at bottom into ascending.";
    return t;
  }
  if (phase === "exchange") return `Direct D↔A exchange at ${cfg.exchangeRate}%. Solute moves high→low at each position.`;
  if (phase === "inject") {
    let fab = 0;
    for (let i = n - 1; i >= Math.floor(n / 2); i--) fab += Math.min(prev ? gc(prev.as[i], prev.aw[i]) : 0, cfg.activeAmount);
    return `⚠ INJECTION: ~${Math.round(fab)} stripped from A. Half fabricated into D. Half destroyed. Conservation violated.`;
  }
  if (phase === "pump") {
    let moved = 0;
    for (let i = n - 1; i >= Math.floor(n / 2); i--) moved += Math.min(prev ? prev.as[i] : 0, cfg.activeAmount);
    return `Pump: ~${Math.round(moved)} solute A→I. Nothing created, nothing lost. The single effect.`;
  }
  if (phase === "osmosis") {
    const tipIc = gc(s.is[n - 1], s.iw[n - 1]);
    const tipDc = gc(s.ds[n - 1], s.dw[n - 1]);
    let t = `Water leaves D→I (osmosis). D concentrates by losing water.`;
    if (tipIc > 10) t += ` Tip I=${Math.round(tipIc)}, D=${Math.round(tipDc)} (vol ${s.dw[n - 1].toFixed(2)}).`;
    return t;
  }
  if (phase === "flow") {
    let t = "D↓ A↑.";
    if (sc.isLoop) t += " U-turn: D bottom→A bottom.";
    else t += " No tip link — enriched D exits.";
    if (sc.hasI) t += " I stays (tissue).";
    const tipD = gc(s.ds[n - 1], s.dw[n - 1]);
    const tipA = gc(s.as[n - 1], s.aw[n - 1]);
    const tipMax = Math.max(tipD, tipA);
    if (tipMax > cfg.initialA * 1.1 && sc.isLoop) t += ` 🔑 Tip=${Math.round(tipMax)} (D=${Math.round(tipD)}, A=${Math.round(tipA)}) — multiplying!`;
    return t;
  }
  return "";
}

/* ═══ U-SHAPE VIZ (loop) ═══ */
function UViz({ s, n, mx, phase, cfg }) {
  const hasI = SC[cfg.scenario].hasI;
  const bW = 44, bH = 34, gap = 8;
  const lx = 26;
  const ix = hasI ? lx + bW + 24 : 0;
  const rx = hasI ? ix + bW + 24 : lx + bW + 38;
  const sy = 22;
  const svgH = sy + n * (bH + gap) + 36;
  const svgW = rx + bW + 36;

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ maxWidth: hasI ? 330 : 260, margin: "0 auto", display: "block" }}>
      <text x={lx + bW / 2} y={12} textAnchor="middle" fill="#c0392b" fontSize="9" fontWeight="700">D ↓</text>
      {hasI && <text x={ix + bW / 2} y={12} textAnchor="middle" fill="#5dade2" fontSize="8" fontWeight="600">I (tissue)</text>}
      <text x={rx + bW / 2} y={12} textAnchor="middle" fill="#2471a3" fontSize="9" fontWeight="700">A ↑</text>

      {Array.from({ length: n }).map((_, i) => {
        const y = sy + i * (bH + gap);
        const dc = gc(s.ds[i], s.dw[i]), ac = gc(s.as[i], s.aw[i]);
        const ic = hasI ? gc(s.is[i], s.iw[i]) : 0;
        const isP = phase === "pump" && i >= Math.floor(n / 2);
        const isO = phase === "osmosis";
        const isInj = phase === "inject" && i >= Math.floor(n / 2);
        const isEx = phase === "exchange";
        const isFl = phase === "flow";
        const isFd = phase === "feed" && i === 0;

        const dScale = hasI ? Math.max(0.45, Math.min(1, s.dw[i])) : 1;
        const dW = bW * dScale;
        const dX = lx + (bW - dW) / 2;

        return (
          <g key={i}>
            <rect x={dX} y={y} width={dW} height={bH} rx={3} fill={cCol(dc, mx)}
              stroke={isFd ? "#27ae60" : isFl ? "#3498db" : "#c0392b"} strokeWidth={isFd || isFl ? 2 : 1.2} />
            <text x={lx + bW / 2} y={y + bH / 2 + 4} textAnchor="middle" fill={tCol(dc, mx)} fontSize="11" fontWeight="700">{Math.round(dc)}</text>
            <text x={lx - 2} y={y + bH / 2 + 3} textAnchor="end" fill="#444" fontSize="7">D{i + 1}</text>

            {hasI && (<>
              <rect x={ix} y={y} width={bW} height={bH} rx={3} fill={cCol(ic, mx)}
                stroke={isP ? "#8e44ad" : isO ? "#2980b9" : "#3a3a4a"} strokeWidth={isP || isO ? 2 : 1}
                strokeDasharray={isP || isO ? "none" : "3,2"} />
              <text x={ix + bW / 2} y={y + bH / 2 + 4} textAnchor="middle" fill={tCol(ic, mx)} fontSize="11" fontWeight="700">{Math.round(ic)}</text>
              <text x={ix + bW / 2} y={y + bH - 1} textAnchor="middle" fill={tCol(ic, mx)} fontSize="6" opacity={0.6}>w:{s.iw[i].toFixed(1)}</text>
            </>)}

            <rect x={rx} y={y} width={bW} height={bH} rx={3} fill={cCol(ac, mx)}
              stroke={isP ? "#8e44ad" : isInj ? "#c0392b" : isEx ? "#e67e22" : isFl ? "#3498db" : "#2471a3"}
              strokeWidth={isP || isInj || isEx || isFl ? 2 : 1.2} />
            <text x={rx + bW / 2} y={y + bH / 2 + 4} textAnchor="middle" fill={tCol(ac, mx)} fontSize="11" fontWeight="700">{Math.round(ac)}</text>
            <text x={rx + bW + 2} y={y + bH / 2 + 3} textAnchor="start" fill="#444" fontSize="7">A{i + 1}</text>

            {hasI ? (<>
              <line x1={lx + bW + 1} y1={y + bH / 2} x2={ix - 1} y2={y + bH / 2}
                stroke={isO ? "#2980b9" : "#2a2a3a"} strokeWidth={isO ? 1.5 : 0.7} strokeDasharray={isO ? "none" : "2,2"} />
              {isO && <text x={(lx + bW + ix) / 2} y={y + bH / 2 - 3} textAnchor="middle" fill="#2980b9" fontSize="6">H₂O→</text>}
              <line x1={ix + bW + 1} y1={y + bH / 2} x2={rx - 1} y2={y + bH / 2}
                stroke={isP ? "#8e44ad" : "#2a2a3a"} strokeWidth={isP ? 1.5 : 0.7} strokeDasharray={isP ? "none" : "2,2"} />
              {isP && <text x={(ix + bW + rx) / 2} y={y + bH / 2 - 3} textAnchor="middle" fill="#8e44ad" fontSize="6">←NaCl</text>}
            </>) : (
              <>
                <line x1={lx + bW + 2} y1={y + bH / 2} x2={rx - 2} y2={y + bH / 2}
                  stroke={isEx || isInj ? (isInj ? "#c0392b" : "#e67e22") : "#2a2a3a"}
                  strokeWidth={isEx || isInj ? 1.5 : 0.7} strokeDasharray={isEx || isInj ? "none" : "3,3"} />
                <text x={(lx + bW + rx) / 2} y={y + bH / 2 + 3} textAnchor="middle"
                  fill={isInj ? "#c0392b" : isEx ? "#e67e22" : "#333"} fontSize={isEx || isInj ? 9 : 7}>
                  {isInj ? "⚠→" : "⇌"}
                </text>
              </>
            )}

            {i < n - 1 && (<>
              <text x={lx + bW / 2} y={y + bH + gap / 2 + 3} textAnchor="middle" fill={isFl ? "#3498db" : "#333"} fontSize={isFl ? 11 : 9}>↓</text>
              <text x={rx + bW / 2} y={y + bH + gap / 2 + 3} textAnchor="middle" fill={isFl ? "#3498db" : "#333"} fontSize={isFl ? 11 : 9}>↑</text>
            </>)}
          </g>
        );
      })}

      {(() => {
        const tipY = sy + (n - 1) * (bH + gap) + bH;
        const midX = (lx + bW / 2 + rx + bW / 2) / 2;
        return <path d={`M ${lx + bW / 2} ${tipY} Q ${lx + bW / 2} ${tipY + 16} ${midX} ${tipY + 16} Q ${rx + bW / 2} ${tipY + 16} ${rx + bW / 2} ${tipY}`}
          fill="none" stroke={phase === "flow" ? "#3498db" : "#444"} strokeWidth={1.5} strokeDasharray="3,3" />;
      })()}

      <text x={svgW - 2} y={sy + 4} textAnchor="end" fill="#444" fontSize="7">cortex</text>
      <text x={svgW - 2} y={sy + (n - 1) * (bH + gap) + bH - 2} textAnchor="end" fill="#444" fontSize="7">medulla</text>
    </svg>
  );
}

/* ═══ H-VIZ (open) ═══ */
function HViz({ s, n, mx, phase, cfg }) {
  const hasI = SC[cfg.scenario].hasI;
  const bW = 46, bH = 34, gap = 6;
  const sx = 36;
  const topY = 26;
  const midY = hasI ? topY + bH + 18 : 0;
  const botY = hasI ? midY + bH + 18 : topY + bH + 26;
  const w = sx + n * (bW + gap) + 50;
  const h = botY + bH + 14;

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ maxWidth: 500, margin: "0 auto", display: "block" }}>
      <text x={4} y={topY + bH / 2 + 3} fill="#c0392b" fontSize="8" fontWeight="700">D→</text>
      {hasI && <text x={4} y={midY + bH / 2 + 3} fill="#5dade2" fontSize="7" fontWeight="600">I</text>}
      <text x={4} y={botY + bH / 2 + 3} fill="#2471a3" fontSize="8" fontWeight="700">A←</text>

      {Array.from({ length: n }).map((_, i) => {
        const x = sx + i * (bW + gap);
        const dc = gc(s.ds[i], s.dw[i]), ac = gc(s.as[i], s.aw[i]);
        const ic = hasI ? gc(s.is[i], s.iw[i]) : 0;
        const isP = phase === "pump" && i >= Math.floor(n / 2);
        const isO = phase === "osmosis";
        const isInj = phase === "inject" && i >= Math.floor(n / 2);
        const isEx = phase === "exchange";
        const isFl = phase === "flow";
        const isFdD = phase === "feed" && i === 0;
        const isFdA = phase === "feed" && i === n - 1;

        return (
          <g key={i}>
            <rect x={x} y={topY} width={bW} height={bH} rx={3} fill={cCol(dc, mx)}
              stroke={isFdD ? "#27ae60" : isFl ? "#3498db" : "#c0392b"} strokeWidth={isFdD || isFl ? 2 : 1.2} />
            <text x={x + bW / 2} y={topY + bH / 2 + 4} textAnchor="middle" fill={tCol(dc, mx)} fontSize="11" fontWeight="700">{Math.round(dc)}</text>

            {hasI && (<>
              <rect x={x} y={midY} width={bW} height={bH} rx={3} fill={cCol(ic, mx)}
                stroke={isP ? "#8e44ad" : isO ? "#2980b9" : "#3a3a4a"} strokeWidth={isP || isO ? 2 : 1}
                strokeDasharray={isP || isO ? "none" : "3,2"} />
              <text x={x + bW / 2} y={midY + bH / 2 + 4} textAnchor="middle" fill={tCol(ic, mx)} fontSize="11" fontWeight="700">{Math.round(ic)}</text>
            </>)}

            <rect x={x} y={botY} width={bW} height={bH} rx={3} fill={cCol(ac, mx)}
              stroke={isFdA ? "#27ae60" : isP ? "#8e44ad" : isInj ? "#c0392b" : isEx ? "#e67e22" : isFl ? "#3498db" : "#2471a3"}
              strokeWidth={isFdA || isP || isInj || isEx || isFl ? 2 : 1.2} />
            <text x={x + bW / 2} y={botY + bH / 2 + 4} textAnchor="middle" fill={tCol(ac, mx)} fontSize="11" fontWeight="700">{Math.round(ac)}</text>

            {hasI ? (<>
              <line x1={x + bW / 2} y1={topY + bH + 1} x2={x + bW / 2} y2={midY - 1}
                stroke={isO ? "#2980b9" : "#2a2a3a"} strokeWidth={isO ? 1.5 : 0.7} strokeDasharray={isO ? "none" : "2,2"} />
              <line x1={x + bW / 2} y1={midY + bH + 1} x2={x + bW / 2} y2={botY - 1}
                stroke={isP ? "#8e44ad" : "#2a2a3a"} strokeWidth={isP ? 1.5 : 0.7} strokeDasharray={isP ? "none" : "2,2"} />
            </>) : (
              <line x1={x + bW / 2} y1={topY + bH + 1} x2={x + bW / 2} y2={botY - 1}
                stroke={isEx || isInj ? (isInj ? "#c0392b" : "#e67e22") : "#2a2a3a"}
                strokeWidth={isEx || isInj ? 1.5 : 0.7} strokeDasharray={isEx || isInj ? "none" : "3,3"} />
            )}

            {i < n - 1 && (<>
              <text x={x + bW + gap / 2} y={topY + bH / 2 + 3} textAnchor="middle" fill={isFl ? "#3498db" : "#333"} fontSize={isFl ? 11 : 8}>→</text>
              <text x={x + bW + gap / 2} y={botY + bH / 2 + 3} textAnchor="middle" fill={isFl ? "#3498db" : "#333"} fontSize={isFl ? 11 : 8}>←</text>
            </>)}
          </g>
        );
      })}
    </svg>
  );
}

/* ═══ TINY ═══ */
function NI({ label, value, min, max, step = 1, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <label style={{ fontSize: 9, color: "#666", fontWeight: 600 }}>{label}</label>
      <input type="number" value={value} min={min} max={max} step={step}
        onChange={e => onChange(parseInt(e.target.value) || 0)}
        style={{ background: "#0b0b14", border: "1px solid #333", borderRadius: 4, padding: "4px 6px", color: "#ddd", fontSize: 12, fontFamily: "monospace", width: "100%" }} />
    </div>
  );
}
function Btn({ label, bg, onClick, style: ex }) {
  return <button onClick={onClick} style={{ padding: "7px 12px", borderRadius: 6, border: "none", background: bg, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", ...ex }}>{label}</button>;
}

/* ═══════ MAIN ═══════ */
export default function App() {
  const [cfg, setCfg] = useState({ scenario: "open", numBoxes: 3, initialA: 300, initialB: 0, exchangeRate: 50, activeAmount: 50 });
  const [s, setS] = useState(() => mkState(3));
  const [prev, setPrev] = useState(null);
  const [phase, setPhase] = useState("idle");
  const [fullStep, setFullStep] = useState(0);
  const [history, setHistory] = useState([]);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);
  const [showSteady, setShowSteady] = useState(false);
  const [steadyResult, setSteadyResult] = useState(null);
  const [computing, setComputing] = useState(false);
  const timerRef = useRef(null);

  const sc = SC[cfg.scenario];
  const n = cfg.numBoxes;
  const phases = useMemo(() => getPhases(cfg.scenario), [cfg.scenario]);

  const reset = useCallback(() => {
    setS(mkState(cfg.numBoxes));
    setPrev(null); setPhase("idle"); setFullStep(0); setHistory([]);
    setPlaying(false); setShowSteady(false); setSteadyResult(null);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [cfg.numBoxes]);

  useEffect(() => { reset(); }, [cfg.scenario, cfg.numBoxes]);

  const sr = useRef({});
  useEffect(() => { sr.current = { s, phase, fullStep, history }; }, [s, phase, fullStep, history]);

  const advance = useCallback(() => {
    const { s: cs, phase: cp, fullStep: fs, history: h } = sr.current;
    const order = getPhases(cfg.scenario);
    let np;
    if (cp === "idle" || cp === "flow") np = order[0];
    else { const idx = order.indexOf(cp); np = order[(idx + 1) % order.length]; }
    const ns = runPhase(cs, np, cfg);
    setPrev(cloneS(cs)); setS(ns); setPhase(np);
    if (np === "flow") {
      const nfs = fs + 1;
      setFullStep(nfs);
      setHistory([...h, {
        step: nfs,
        tipD: Math.round(gc(ns.ds[cfg.numBoxes - 1], ns.dw[cfg.numBoxes - 1])),
        tipA: Math.round(gc(ns.as[cfg.numBoxes - 1], ns.aw[cfg.numBoxes - 1])),
        exit: Math.round(gc(ns.as[0], ns.aw[0])),
        ...(SC[cfg.scenario].hasI ? { tipI: Math.round(gc(ns.is[cfg.numBoxes - 1], ns.iw[cfg.numBoxes - 1])) } : {}),
      }]);
    }
  }, [cfg]);

  const fullCycle = useCallback(() => {
    const order = getPhases(cfg.scenario);
    let i = 0;
    const iv = setInterval(() => { advance(); i++; if (i >= order.length) clearInterval(iv); }, 350);
  }, [advance, cfg.scenario]);

  useEffect(() => {
    if (playing) timerRef.current = setInterval(advance, SPEEDS[speedIdx].ms);
    else if (timerRef.current) clearInterval(timerRef.current);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, advance, speedIdx]);

  const calcSteady = useCallback(() => {
    setComputing(true);
    setTimeout(() => {
      const r = computeSteady(cfg);
      setSteadyResult(r); setShowSteady(true); setComputing(false);
    }, 30);
  }, [cfg]);

  const upd = (k, v) => setCfg(p => ({ ...p, [k]: v }));
  const dConcs = s.ds.map((_, i) => gc(s.ds[i], s.dw[i]));
  const aConcs = s.as.map((_, i) => gc(s.as[i], s.aw[i]));
  const iConcs = sc.hasI ? s.is.map((_, i) => gc(s.is[i], s.iw[i])) : [];
  const sC = steadyResult ? {
    d: steadyResult.state.ds.map((_, i) => gc(steadyResult.state.ds[i], steadyResult.state.dw[i])),
    a: steadyResult.state.as.map((_, i) => gc(steadyResult.state.as[i], steadyResult.state.aw[i])),
    i: sc.hasI ? steadyResult.state.is.map((_, i) => gc(steadyResult.state.is[i], steadyResult.state.iw[i])) : [],
  } : null;
  const allC = [...dConcs, ...aConcs, ...iConcs, ...(sC?.d || []), ...(sC?.a || []), ...(sC?.i || [])];
  const mx = Math.max(1, ...allC);
  const pi = PI[phase];
  const expl = explain(phase, s, prev, cfg, fullStep);
  const totalS = s.ds.reduce((a, v) => a + v, 0) + s.as.reduce((a, v) => a + v, 0) + s.is.reduce((a, v) => a + v, 0);

  return (
    <div style={{ fontFamily: "'Segoe UI',sans-serif", background: "#0b0b14", color: "#ddd", minHeight: "100vh", padding: 8 }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}button{font-family:inherit}
        .esc::-webkit-scrollbar{width:3px}.esc::-webkit-scrollbar-thumb{background:#444;border-radius:2px}`}</style>

      <h1 style={{ fontSize: 16, fontWeight: 700, color: "#f5f5f5", textAlign: "center" }}>Countercurrent Simulator</h1>
      <p style={{ color: "#555", fontSize: 10, textAlign: "center", marginBottom: 6 }}>{phases.map(p => PI[p].label).join(" → ")}</p>

      <div style={{ display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "center", marginBottom: 6 }}>
        {Object.entries(SC).map(([k, v]) => (
          <button key={k} onClick={() => upd("scenario", k)} style={{
            padding: "5px 8px", borderRadius: 5, fontSize: 9, fontWeight: 600, cursor: "pointer",
            border: cfg.scenario === k ? "2px solid #e67e22" : "1px solid #2a2a3a",
            background: cfg.scenario === k ? "#2a1f0e" : v.hasI ? "#0f1525" : "#14142a",
            color: cfg.scenario === k ? "#e67e22" : v.hasI ? "#5dade2" : "#777",
          }}>{v.short}</button>
        ))}
      </div>

      <div style={{ background: "#14142a", border: `1px solid ${sc.hasI ? "#1a3a5c" : "#252540"}`, borderRadius: 5, padding: "6px 8px", marginBottom: 6, fontSize: 10, color: "#888", lineHeight: 1.5 }}>{sc.desc}</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: 5, background: "#14142a", padding: 6, borderRadius: 5, border: "1px solid #222240", marginBottom: 6 }}>
        <NI label="Segments" value={cfg.numBoxes} min={2} max={10} onChange={v => upd("numBoxes", v)} />
        <NI label="Input" value={cfg.initialA} min={0} max={2000} step={50} onChange={v => upd("initialA", v)} />
        {!sc.isLoop && <NI label="B Input" value={cfg.initialB} min={0} max={2000} step={50} onChange={v => upd("initialB", v)} />}
        <NI label={sc.hasI ? "Perm %" : "Exch %"} value={cfg.exchangeRate} min={0} max={100} step={5} onChange={v => upd("exchangeRate", v)} />
        {sc.hasActive && <NI label={sc.hasI ? "Pump" : "Inject"} value={cfg.activeAmount} min={0} max={500} step={10} onChange={v => upd("activeAmount", v)} />}
      </div>

      <div style={{ background: pi.color + "12", border: `2px solid ${pi.color}`, borderRadius: 6, padding: "6px 8px", marginBottom: 6, height: 72, minHeight: 72, maxHeight: 72, display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: pi.color, marginBottom: 3, flexShrink: 0 }}>{pi.icon} {pi.label}</div>
        <div className="esc" style={{ fontSize: 10, color: "#ccc", lineHeight: 1.5, overflow: "auto", flex: 1, minHeight: 0 }}>{expl}</div>
      </div>

      <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap", marginBottom: 8 }}>
        <Btn label="Reset" bg="#444" onClick={reset} />
        <Btn label="Step →" bg={pi.color} onClick={advance} />
        <Btn label="Cycle ⟳" bg="#2471a3" onClick={fullCycle} />
        <Btn label={playing ? "⏸" : "▶"} bg={playing ? "#c0392b" : "#27ae60"} onClick={() => setPlaying(p => !p)} />
        <button onClick={() => setSpeedIdx(i => (i + 1) % SPEEDS.length)} style={{ padding: "6px 10px", borderRadius: 5, border: "1px solid #444", background: "#1a1a30", color: "#aaa", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>🏎 {SPEEDS[speedIdx].label}</button>
        <Btn label={computing ? "⏳" : "∞"} bg="#6c3483" onClick={computing ? undefined : calcSteady} style={{ fontSize: 15, padding: "4px 14px", opacity: computing ? 0.6 : 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 3, background: "#14142a", padding: "3px 8px", borderRadius: 5, border: "1px solid #333" }}>
          <span style={{ color: "#e67e22", fontFamily: "monospace", fontSize: 13, fontWeight: 700 }}>{fullStep}</span>
          <span style={{ color: "#555", fontSize: 8 }}>cyc</span>
        </div>
      </div>

      {fullStep > 0 && (
        <div style={{ textAlign: "center", fontSize: 9, marginBottom: 6, padding: "3px 6px", borderRadius: 4,
          background: !sc.hasActive ? "#111" : sc.hasI ? "#0a1520" : "#1a0f0f",
          color: sc.hasI ? "#5dade2" : sc.hasActive ? "#e74c3c" : "#555",
          border: `1px solid ${sc.hasI ? "#1a3a5c" : sc.hasActive ? "#3a1a1a" : "#222"}`,
        }}>
          {sc.hasI ? `✓ Conserved · pump→I · water D→I · total solute: ${Math.round(totalS)}`
            : sc.hasActive ? `⚠ Injection: ${Math.round(s.fabricated)} fabricated · ${Math.round(s.destroyed)} destroyed`
            : `Passive · total solute: ${Math.round(totalS)}`}
        </div>
      )}

      <div style={{ background: "#0f0f1c", borderRadius: 6, padding: 8, border: `1px solid ${sc.hasI ? "#1a3050" : "#222240"}`, marginBottom: 6 }}>
        {sc.isLoop ? <UViz s={s} n={n} mx={mx} phase={phase} cfg={cfg} /> : <HViz s={s} n={n} mx={mx} phase={phase} cfg={cfg} />}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 4, fontSize: 8, color: "#444" }}>
          <span>🔵Low</span>
          <span style={{ background: "linear-gradient(90deg,rgb(30,100,200),rgb(240,180,40))", padding: "1px 10px", borderRadius: 3, color: "transparent" }}>.</span>
          <span>🔴High</span>
          {sc.hasI && <span style={{ color: "#5dade2" }}>┊dashed=tissue</span>}
          {sc.hasActive && !sc.hasI && <span style={{ color: "#c0392b" }}>⚠=injection</span>}
        </div>
      </div>

      {history.length > 1 && (
        <div style={{ background: "#0f0f1c", borderRadius: 6, padding: "6px 2px 2px 0", border: "1px solid #222240", marginBottom: 6 }}>
          <h3 style={{ fontSize: 10, color: "#888", textAlign: "center", marginBottom: 3 }}>Gradient Build-up</h3>
          <ResponsiveContainer width="100%" height={110}>
            <LineChart data={history} margin={{ top: 2, right: 12, left: 4, bottom: 2 }}>
              <XAxis dataKey="step" tick={{ fill: "#666", fontSize: 8 }} axisLine={{ stroke: "#333" }} />
              <YAxis tick={{ fill: "#666", fontSize: 8 }} axisLine={{ stroke: "#333" }} />
              <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #444", borderRadius: 4, fontSize: 9 }} />
              <Legend wrapperStyle={{ fontSize: 8 }} />
              <Line type="monotone" dataKey="tipD" name="Tip D" stroke="#e74c3c" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="tipA" name="Tip A" stroke="#3498db" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="exit" name="Exit" stroke="#8e44ad" strokeWidth={1.5} dot={false} />
              {sc.hasI && <Line type="monotone" dataKey="tipI" name="Tip I" stroke="#2980b9" strokeWidth={1.5} dot={false} />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {showSteady && steadyResult && sC && (
        <div style={{ background: "#1a0f2e", borderRadius: 6, padding: 10, border: "2px solid #6c3483", marginBottom: 6 }}>
          <h3 style={{ fontSize: 12, color: "#bb8fce", marginBottom: 6 }}>
            ∞ {steadyResult.convergedAt > 0 ? `Converged @ ${steadyResult.convergedAt.toLocaleString()}` : `Did not converge (${MAX_C.toLocaleString()})`}
          </h3>
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 6 }}>
            {sC.d.map((v, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                <div style={{ width: 38, height: 26, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", background: cCol(v, mx), color: tCol(v, mx), fontSize: 9, fontWeight: 700, border: "1px solid #c0392b" }}>{Math.round(v)}</div>
                <div style={{ fontSize: 6, color: "#777" }}>D{i + 1}</div>
                {sc.hasI && (<>
                  <div style={{ width: 38, height: 26, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", background: cCol(sC.i[i], mx), color: tCol(sC.i[i], mx), fontSize: 9, fontWeight: 700, border: "1px dashed #2980b9" }}>{Math.round(sC.i[i])}</div>
                  <div style={{ fontSize: 6, color: "#5dade2" }}>I{i + 1}</div>
                </>)}
                <div style={{ width: 38, height: 26, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", background: cCol(sC.a[i], mx), color: tCol(sC.a[i], mx), fontSize: 9, fontWeight: 700, border: "1px solid #2471a3" }}>{Math.round(sC.a[i])}</div>
                <div style={{ fontSize: 6, color: "#777" }}>A{i + 1}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#ccc", lineHeight: 1.6 }}>
            <div>🔺 Tip D:{Math.round(sC.d[n - 1])} A:{Math.round(sC.a[n - 1])}{sc.hasI && ` I:${Math.round(sC.i[n - 1])}`}</div>
            <div>🔻 Exit: {Math.round(sC.a[0])} mOsm</div>
            <div>📊 Factor: {(Math.max(sC.d[n - 1], sC.a[n - 1], ...(sC.i || [0])) / cfg.initialA).toFixed(2)}×</div>
            {!sc.hasI && sc.hasActive && <div style={{ color: "#e74c3c" }}>⚠ Fab: {Math.round(steadyResult.state.fabricated)} · Dest: {Math.round(steadyResult.state.destroyed)}</div>}
          </div>
          {steadyResult.snapshots.length > 2 && (
            <div style={{ marginTop: 6 }}>
              <ResponsiveContainer width="100%" height={80}>
                <LineChart data={steadyResult.snapshots.slice(0, 50)} margin={{ top: 2, right: 8, left: 2, bottom: 2 }}>
                  <XAxis dataKey="step" tick={{ fill: "#555", fontSize: 7 }} axisLine={{ stroke: "#333" }} />
                  <YAxis tick={{ fill: "#555", fontSize: 7 }} axisLine={{ stroke: "#333" }} />
                  <Line type="monotone" dataKey="tipD" stroke="#e74c3c" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="tipA" stroke="#3498db" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="exit" stroke="#8e44ad" strokeWidth={1.5} dot={false} />
                  {sc.hasI && <Line type="monotone" dataKey="tipI" stroke="#2980b9" strokeWidth={1.5} dot={false} />}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <button onClick={() => { setS(cloneS(steadyResult.state)); setPhase("idle"); setShowSteady(false); setFullStep(steadyResult.convergedAt || MAX_C); }}
            style={{ marginTop: 6, padding: "5px 12px", borderRadius: 4, border: "1px solid #6c3483", background: "#2a1545", color: "#bb8fce", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
            Load ∞ →
          </button>
        </div>
      )}
    </div>
  );
}
