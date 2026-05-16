import { SC, PI, SPEEDS } from "../constants.js";

function NI({ label, value, min, max, step = 1, onChange }) {
  const id = `ni-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <label htmlFor={id} style={{ fontSize: 9, color: "#666", fontWeight: 600 }}>{label}</label>
      <input id={id} type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: "#e67e22", cursor: "pointer" }} />
    </div>
  );
}

export default function Controls({
  cfg, onUpdateCfg, activeStage, setActiveStage,
  phase, playing, speedIdx, fullStep, computing,
  onStep, onCycle, onPlay, onSpeedChange, onReset, onSteady,
}) {
  const sc = SC[cfg.scenario];
  const pi = PI[phase] || PI.idle;
  const stages = [1, 2, 3, 4];

  return (
    <>
      {/* Academy Curriculum Stages: Horizontal Tabs */}
      <div style={{ background: "#14142a", borderRadius: 6, padding: 3, border: "1px solid #222", marginBottom: 6 }}>
        <div style={{ display: "flex", gap: 3 }}>
          {stages.map(st => (
            <button key={st} onClick={() => setActiveStage(st)} style={{
              flex: 1, padding: "5px 2px", borderRadius: 4, fontSize: 9, fontWeight: 800, cursor: "pointer", border: "none",
              background: activeStage === st ? "#2471a3" : "transparent",
              color: activeStage === st ? "#fff" : "#555",
              transition: "all 0.2s"
            }}>STAGE {st}</button>
          ))}
        </div>
      </div>

      {/* Sub-scenarios for Active Stage */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
        {Object.entries(SC).filter(([, v]) => v.stage === activeStage).map(([k, v]) => (
          <button key={k} onClick={() => onUpdateCfg("scenario", k)} style={{
            padding: "6px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: "pointer",
            border: cfg.scenario === k ? "1px solid #e67e22" : "1px solid #2a2a3a",
            background: cfg.scenario === k ? "#2a1f0e" : "#0b0b14",
            color: cfg.scenario === k ? "#e67e22" : "#777",
            flex: 1, minWidth: "80px", textAlign: "center"
          }}>{v.short}</button>
        ))}
      </div>

      {/* Scenario description */}
      <div style={{ background: "#14142a", border: `1px solid ${sc.hasI ? "#1a3a5c" : "#252540"}`, borderRadius: 5, padding: "6px 8px", marginBottom: 6, fontSize: 10, color: "#888", lineHeight: 1.5 }}>
        {sc.desc}
      </div>

      {/* Main Simulation Sliders */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: 5, background: "#14142a", padding: 6, borderRadius: 5, border: "1px solid #222240", marginBottom: 6 }}>
        <NI label="Segments" value={cfg.numBoxes} min={1} max={20} onChange={v => onUpdateCfg("numBoxes", v)} />
        <NI label="D Input" value={cfg.initialA} min={0} max={2000} step={50} onChange={v => onUpdateCfg("initialA", v)} />
        {!sc.isLoop && <NI label="B Input" value={cfg.initialB} min={0} max={2000} step={50} onChange={v => onUpdateCfg("initialB", v)} />}
        <NI label="Exch %" value={cfg.exchangeRate} min={0} max={100} step={5} onChange={v => onUpdateCfg("exchangeRate", v)} />
        {sc.hasActive && <NI label={sc.hasI ? "Pump" : "Inject"} value={cfg.activeAmount} min={0} max={500} step={10} onChange={v => onUpdateCfg("activeAmount", v)} />}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <label style={{ fontSize: 9, color: "#666", fontWeight: 600 }}>
            ADH <span style={{ color: "#a855f7", fontFamily: "monospace" }}>{Math.round((cfg.adh ?? 0.6) * 100)}%</span>
          </label>
          <input type="range" min="0" max="1" step="0.05" value={cfg.adh ?? 0.6}
            onChange={e => onUpdateCfg("adh", parseFloat(e.target.value))}
            style={{ width: "100%", accentColor: "#a855f7", cursor: "pointer" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <label style={{ fontSize: 9, color: "#666", fontWeight: 600 }}>
            Flow <span style={{ color: "#3a8ef6", fontFamily: "monospace" }}>{Math.round((cfg.flowRate ?? 0.5) * 100)}%</span>
          </label>
          <input type="range" min="0.1" max="1" step="0.1" value={cfg.flowRate ?? 0.5}
            onChange={e => onUpdateCfg("flowRate", parseFloat(e.target.value))}
            style={{ width: "100%", accentColor: "#3a8ef6", cursor: "pointer" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <label style={{ fontSize: 9, color: "#666", fontWeight: 600 }}>
            Damp <span style={{ color: "#e67e22", fontFamily: "monospace" }}>{(cfg.damping ?? 1).toFixed(1)}</span>
          </label>
          <input type="range" min="0.1" max="1" step="0.1" value={cfg.damping ?? 1}
            onChange={e => onUpdateCfg("damping", parseFloat(e.target.value))}
            style={{ width: "100%", accentColor: "#e67e22", cursor: "pointer" }} />
        </div>
      </div>

      {/* Control Buttons */}
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        <button onClick={onReset} style={{ flex: 1, padding: "7px", background: "#333", color: "#eee", borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Reset</button>
        <button onClick={onStep} disabled={playing || computing} style={{ flex: 2, padding: "7px", background: "#27ae60", color: "#fff", borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: "pointer", opacity: (playing || computing) ? 0.5 : 1 }}>Step →</button>
        <button onClick={onCycle} disabled={playing || computing} style={{ flex: 2, padding: "7px", background: "#2980b9", color: "#fff", borderRadius: 4, fontSize: 10, fontWeight: 700, cursor: "pointer", opacity: (playing || computing) ? 0.5 : 1 }}>Cycle ↻</button>
        <button onClick={onPlay} style={{ flex: 1, padding: "7px", background: playing ? "#c0392b" : "#2471a3", color: "#fff", borderRadius: 4, fontSize: 13, cursor: "pointer" }}>{playing ? "⏸" : "▶"}</button>
        <button onClick={onSpeedChange} style={{ flex: 1.5, padding: "7px", background: "#444", color: "#eee", borderRadius: 4, fontSize: 9, fontWeight: 700, cursor: "pointer" }}>{SPEEDS[speedIdx].label}</button>
        <button onClick={onSteady} disabled={computing} style={{ flex: 2, padding: "7px", background: "#8e44ad", color: "#fff", borderRadius: 4, fontSize: 9, fontWeight: 700, cursor: "pointer", opacity: computing ? 0.5 : 1 }}>{computing ? "..." : "Steady SS"}</button>
      </div>

      {/* Playback Progress Indicator */}
      <div style={{ background: "#14142a", borderRadius: 5, padding: "5px 10px", border: "1px solid #222", display: "flex", alignItems: "center", gap: 8, height: 26 }}>
        <div style={{ display: "flex", gap: 2, flex: 1 }}>
          {Object.values(PI).filter(p => p !== PI.idle).map(p => (
            <div key={p.label} style={{ height: 4, flex: 1, borderRadius: 2, background: pi.label === p.label ? p.color : "#222", transition: "background 0.3s" }} title={p.label} />
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
          <span style={{ color: "#e67e22", fontFamily: "monospace", fontSize: 13, fontWeight: 700 }}>{fullStep}</span>
          <span style={{ color: "#555", fontSize: 8 }}>cyc</span>
        </div>
      </div>
    </>
  );
}
