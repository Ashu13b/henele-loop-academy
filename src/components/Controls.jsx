import { SC, PI, SPEEDS } from "../constants.js";

function NI({ label, value, min, max, step = 1, onChange }) {
  const id = `ni-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <label htmlFor={id} style={{ fontSize: 9, color: "#666", fontWeight: 600 }}>{label}</label>
      <input id={id} type="number" value={value} min={min} max={max} step={step}
        onChange={e => onChange(parseInt(e.target.value) || 0)}
        style={{ background: "#0b0b14", border: "1px solid #333", borderRadius: 4, padding: "4px 6px", color: "#ddd", fontSize: 12, fontFamily: "monospace", width: "100%" }} />
    </div>
  );
}

function Btn({ label, bg, onClick, style: ex }) {
  return (
    <button onClick={onClick} style={{ padding: "7px 12px", borderRadius: 6, border: "none", background: bg, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", ...ex }}>
      {label}
    </button>
  );
}

export default function Controls({
  cfg, onUpdateCfg,
  phase, playing, speedIdx, fullStep, computing,
  onStep, onCycle, onPlay, onSpeedChange, onReset, onSteady,
}) {
  const sc = SC[cfg.scenario];
  const pi = PI[phase] || PI.idle;
  const phases = Object.values(PI).filter(p => p !== PI.idle);

  return (
    <>
      {/* Scenario tabs */}
      <div style={{ display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "center", marginBottom: 6 }}>
        {Object.entries(SC).map(([k, v]) => (
          <button key={k} onClick={() => onUpdateCfg("scenario", k)} style={{
            padding: "5px 8px", borderRadius: 5, fontSize: 9, fontWeight: 600, cursor: "pointer",
            border: cfg.scenario === k ? "2px solid #e67e22" : "1px solid #2a2a3a",
            background: cfg.scenario === k ? "#2a1f0e" : v.hasI ? "#0f1525" : "#14142a",
            color: cfg.scenario === k ? "#e67e22" : v.hasI ? "#5dade2" : "#777",
          }}>{v.short}</button>
        ))}
      </div>

      {/* Scenario description */}
      <div style={{ background: "#14142a", border: `1px solid ${sc.hasI ? "#1a3a5c" : "#252540"}`, borderRadius: 5, padding: "6px 8px", marginBottom: 6, fontSize: 10, color: "#888", lineHeight: 1.5 }}>
        {sc.desc}
      </div>

      {/* Config inputs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: 5, background: "#14142a", padding: 6, borderRadius: 5, border: "1px solid #222240", marginBottom: 6 }}>
        <NI label="Segments" value={cfg.numBoxes} min={2} max={10} onChange={v => onUpdateCfg("numBoxes", v)} />
        <NI label="Input" value={cfg.initialA} min={0} max={2000} step={50} onChange={v => onUpdateCfg("initialA", v)} />
        {!sc.isLoop && <NI label="B Input" value={cfg.initialB} min={0} max={2000} step={50} onChange={v => onUpdateCfg("initialB", v)} />}
        <NI label={sc.hasI ? "Perm %" : "Exch %"} value={cfg.exchangeRate} min={0} max={100} step={5} onChange={v => onUpdateCfg("exchangeRate", v)} />
        {sc.hasActive && <NI label={sc.hasI ? "Pump" : "Inject"} value={cfg.activeAmount} min={0} max={500} step={10} onChange={v => onUpdateCfg("activeAmount", v)} />}
      </div>

      {/* Phase indicator */}
      <div style={{ background: pi.color + "12", border: `2px solid ${pi.color}`, borderRadius: 6, padding: "6px 8px", marginBottom: 6, height: 72, minHeight: 72, maxHeight: 72, display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: pi.color, marginBottom: 3, flexShrink: 0 }}>
          {pi.icon} {pi.label}
        </div>
        {/* Phase sequence hint */}
        <div style={{ fontSize: 9, color: "#555", marginTop: "auto" }}>
          {phases.map(p => p.label).join(" → ")}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap", marginBottom: 8 }}>
        <Btn label="Reset" bg="#444" onClick={onReset} />
        <Btn label="Step →" bg={pi.color} onClick={onStep} />
        <Btn label="Cycle ⟳" bg="#2471a3" onClick={onCycle} />
        <Btn label={playing ? "⏸" : "▶"} bg={playing ? "#c0392b" : "#27ae60"} onClick={onPlay} />
        <button
          onClick={onSpeedChange}
          style={{ padding: "6px 10px", borderRadius: 5, border: "1px solid #444", background: "#1a1a30", color: "#aaa", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
          🏎 {SPEEDS[speedIdx].label}
        </button>
        <Btn
          label={computing ? "⏳" : "∞"}
          bg="#6c3483"
          onClick={computing ? undefined : onSteady}
          style={{ fontSize: 15, padding: "4px 14px", opacity: computing ? 0.6 : 1 }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 3, background: "#14142a", padding: "3px 8px", borderRadius: 5, border: "1px solid #333" }}>
          <span style={{ color: "#e67e22", fontFamily: "monospace", fontSize: 13, fontWeight: 700 }}>{fullStep}</span>
          <span style={{ color: "#555", fontSize: 8 }}>cyc</span>
        </div>
      </div>
    </>
  );
}
