import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import SteadyWorker from './steadyWorker.js?worker';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { SC, PI, SPEEDS } from "./constants.js";
import { gc, cCol, tCol } from "./helpers.js";
import { mkState, cloneS, getPhases, runPhase } from "./engine.js";
import { explain } from "./explainer.js";
import UViz from "./components/UViz.jsx";
import LinearViz from "./components/LinearViz.jsx";
import Controls from "./components/Controls.jsx";
import Chart from "./components/Chart.jsx";

const MAX_C = 100000;

export default function App() {
  const [cfg, setCfg] = useState({
    scenario: "s1-exchange",
    numBoxes: 8,
    initialA: 300,
    initialB: 0,
    exchangeRate: 50,
    activeAmount: 200,
    damping: 0.4,
    adh: 0.6,
    flowRate: 0.5,
  });
  const [s, setS] = useState(() => mkState(8));
  const [prev, setPrev] = useState(null);
  const [phase, setPhase] = useState("idle");
  const [fullStep, setFullStep] = useState(0);
  const [history, setHistory] = useState([]);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);
  const [activeStage, setActiveStage] = useState(1);
  const [showSteady, setShowSteady] = useState(false);
  const [steadyResult, setSteadyResult] = useState(null);
  const [computing, setComputing] = useState(false);
  const timerRef = useRef(null);
  const workerRef = useRef(null);

  const sc = SC[cfg.scenario];
  // Always derive n from the live state arrays, not cfg.numBoxes.
  // cfg.numBoxes updates synchronously but setS(mkState(...)) fires
  // one render later — using cfg here causes out-of-bounds SVG crashes.
  const n = s.ds.length;

  const reset = useCallback(() => {
    setS(mkState(cfg.numBoxes));
    setPrev(null);
    setPhase("idle");
    setFullStep(0);
    setHistory([]);
    setPlaying(false);
    setShowSteady(false);
    setSteadyResult(null);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [cfg.numBoxes]);

  useEffect(() => { reset(); }, [cfg.scenario, cfg.numBoxes]); // eslint-disable-line react-hooks/exhaustive-deps

  const sr = useRef({});
  useEffect(() => { sr.current = { s, phase, fullStep, history }; }, [s, phase, fullStep, history]);

  const advance = useCallback(() => {
    const { s: cs, phase: cp, fullStep: fs, history: h } = sr.current;
    const order = getPhases(cfg.scenario);
    let np;
    if (cp === "idle" || cp === "flow") np = order[0];
    else { const idx = order.indexOf(cp); np = order[(idx + 1) % order.length]; }
    const ns = runPhase(cs, np, cfg);
    setPrev(cloneS(cs));
    setS(ns);
    setPhase(np);
    if (np === "flow") {
      const nfs = fs + 1;
      setFullStep(nfs);
      setHistory([...h, {
        step: nfs,
        tipD: Math.round(gc(ns.ds[cfg.numBoxes - 1], ns.dw[cfg.numBoxes - 1])),
        tipA: Math.round(gc(ns.as[cfg.numBoxes - 1], ns.aw[cfg.numBoxes - 1])),
        exit: Math.round(gc(ns.as[0], ns.aw[0])),
        urine: Math.round(gc(ns.cds[cfg.numBoxes - 1], ns.cdw[cfg.numBoxes - 1])),
        ...(SC[cfg.scenario].hasI ? { tipI: Math.round(gc(ns.is[cfg.numBoxes - 1], ns.iw[cfg.numBoxes - 1])) } : {}),
      }]);
    }
  }, [cfg]);

  const fullCycle = useCallback(() => {
    const order = getPhases(cfg.scenario);
    let i = 0;
    const iv = setInterval(() => { advance(); i++; if (i >= order.length) clearInterval(iv); }, SPEEDS[speedIdx].ms);
  }, [advance, cfg.scenario, speedIdx]);

  useEffect(() => {
    if (playing) timerRef.current = setInterval(advance, SPEEDS[speedIdx].ms);
    else if (timerRef.current) clearInterval(timerRef.current);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, advance, speedIdx]);

  useEffect(() => {
    const w = new SteadyWorker();
    w.onmessage = (e) => {
      setSteadyResult(e.data);
      setShowSteady(true);
      setComputing(false);
    };
    workerRef.current = w;
    return () => w.terminate();
  }, []);

  const calcSteady = useCallback(() => {
    setComputing(true);
    workerRef.current.postMessage(cfg);
  }, [cfg]);

  const upd = useCallback((k, v) => setCfg(p => {
    if (k === "scenario") {
      const sc2 = SC[v];
      return {
        ...p,
        scenario: v,
        ...(sc2.defaultNumBoxes    != null ? { numBoxes:     sc2.defaultNumBoxes    } : {}),
        ...(sc2.defaultActiveAmount != null ? { activeAmount: sc2.defaultActiveAmount } : {}),
      };
    }
    return { ...p, [k]: v };
  }), []);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        
        if (e.key === "ArrowUp") setActiveStage(p => Math.max(1, p - 1));
        if (e.key === "ArrowDown") setActiveStage(p => Math.min(4, p + 1));
        if (e.key === "ArrowRight") advance();
        
        if (e.key === "ArrowLeft") {
          const stageScenarios = Object.entries(SC).filter(([, v]) => v.stage === activeStage);
          const currentIdx = stageScenarios.findIndex(([k]) => k === cfg.scenario);
          if (currentIdx > 0) upd("scenario", stageScenarios[currentIdx - 1][0]);
          else if (currentIdx === 0 && activeStage > 1) {
             const prevStage = activeStage - 1;
             const prevScenarios = Object.entries(SC).filter(([, v]) => v.stage === prevStage);
             setActiveStage(prevStage);
             upd("scenario", prevScenarios[prevScenarios.length - 1][0]);
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeStage, cfg.scenario, advance, upd]);

  const dConcs = s.ds.map((_, i) => gc(s.ds[i], s.dw[i]));
  const aConcs = s.as.map((_, i) => gc(s.as[i], s.aw[i]));
  const cdConcs = s.cds.map((_, i) => gc(s.cds[i], s.cdw[i]));
  const iConcs = sc.hasI ? s.is.map((_, i) => gc(s.is[i], s.iw[i]) + (sc.hasUrea ? gc(s.ius[i], s.iw[i]) : 0)) : [];

  const sC = useMemo(() => steadyResult ? {
    d: steadyResult.state.ds.map((_, i) => gc(steadyResult.state.ds[i], steadyResult.state.dw[i])),
    a: steadyResult.state.as.map((_, i) => gc(steadyResult.state.as[i], steadyResult.state.aw[i])),
    cd: steadyResult.state.cds.map((_, i) => gc(steadyResult.state.cds[i], steadyResult.state.cdw[i])),
    i: sc.hasI ? steadyResult.state.is.map((_, i) => gc(steadyResult.state.is[i], steadyResult.state.iw[i])) : [],
  } : null, [steadyResult, sc.hasI]);

  const allC = [...dConcs, ...aConcs, ...cdConcs, ...iConcs, ...(sC?.d || []), ...(sC?.a || []), ...(sC?.cd || []), ...(sC?.i || [])];
  const mx = Math.max(1, ...allC);
  const pi = PI[phase] || PI.idle;
  const expl = explain(phase, s, prev, cfg);
  const totalS = s.ds.reduce((a, v) => a + v, 0) + s.as.reduce((a, v) => a + v, 0) + s.is.reduce((a, v) => a + v, 0);

  return (
    <div style={{ fontFamily: "'Segoe UI',sans-serif", background: "#0b0b14", color: "#ddd", minHeight: "100vh", padding: 8 }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0}button{font-family:inherit;border:none}
        .esc::-webkit-scrollbar{width:3px}.esc::-webkit-scrollbar-thumb{background:#444;border-radius:2px}`}</style>

      <h1 style={{ fontSize: 16, fontWeight: 700, color: "#f5f5f5", textAlign: "center", marginBottom: 6 }}>
        Countercurrent Simulator
      </h1>

      <Controls
        cfg={cfg}
        onUpdateCfg={upd}
        activeStage={activeStage}
        setActiveStage={setActiveStage}
        phase={phase}
        playing={playing}
        speedIdx={speedIdx}
        fullStep={fullStep}
        computing={computing}
        onStep={advance}
        onCycle={fullCycle}
        onPlay={() => setPlaying(p => !p)}
        onSpeedChange={() => setSpeedIdx(i => (i + 1) % SPEEDS.length)}
        onReset={reset}
        onSteady={calcSteady}
      />

      {/* Explainer panel */}
      <div style={{ background: pi.color + "12", border: `2px solid ${pi.color}`, borderRadius: 6, padding: "6px 8px", marginBottom: 6, height: 72, minHeight: 72, maxHeight: 72, display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: pi.color, marginBottom: 3, flexShrink: 0 }}><span>{pi.icon}</span> {pi.label}</div>
        <div className="esc" style={{ fontSize: 10, color: "#ccc", lineHeight: 1.5, overflow: "auto", flex: 1, minHeight: 0 }}>{expl}</div>
      </div>

      {/* Conservation badge */}
      {fullStep > 0 && (
        <div style={{ textAlign: "center", fontSize: 9, marginBottom: 6, padding: "3px 6px", borderRadius: 4,
          background: !sc.hasActive ? "#111" : sc.hasI ? "#0a1520" : "#1a0f0f",
          color: sc.hasI ? "#5dade2" : sc.hasActive ? "#e74c3c" : "#555",
          border: `1px solid ${sc.hasI ? "#1a3a5c" : sc.hasActive ? "#3a1a1a" : "#222"}`,
        }}>
          {sc.hasI
            ? `✓ Conserved · pump→I · water D→I · total solute: ${Math.round(totalS)}`
            : sc.hasActive
              ? `⚠ Injection: ${Math.round(s.fabricated)} fabricated · ${Math.round(s.destroyed)} destroyed`
              : `Passive · total solute: ${Math.round(totalS)}`}
        </div>
      )}

      {/* Viz panel */}
      <div style={{ background: "#0f0f1c", borderRadius: 6, padding: 8, border: `1px solid ${sc.hasI ? "#1a3050" : "#222240"}`, marginBottom: 6 }}>
        {sc.isLoop
          ? <UViz s={s} n={n} mx={mx} phase={phase} cfg={cfg} />
          : <LinearViz s={s} n={n} mx={mx} phase={phase} cfg={cfg} />}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 4, fontSize: 8, color: "#444", flexWrap: "wrap" }}>
          <span>🔵Low</span>
          <span style={{ background: "linear-gradient(90deg,rgb(30,100,200),rgb(240,180,40))", padding: "1px 10px", borderRadius: 3, color: "transparent" }}>.</span>
          <span>🔴High</span>
          {sc.hasI && <span style={{ color: "#5dade2" }}>┊dashed=tissue</span>}
          {sc.hasActive && !sc.hasI && <span style={{ color: "#c0392b" }}>⚠=injection</span>}
          <span style={{ color: "#333" }}>┊</span>
          <span style={{ color: "#555" }}>big number = S÷W (mOsm)</span>
          <span style={{ color: "#444" }}>· S=solute mass</span>
          <span style={{ color: "#444" }}>· W=water vol</span>
        </div>
      </div>

      {/* Watch / Insight panel */}
      {(() => {
        const tipD = gc(s.ds[n - 1], s.dw[n - 1]);
        const tipA = gc(s.as[n - 1], s.aw[n - 1]);
        const tipI = sc.hasI ? gc(s.is[n - 1], s.iw[n - 1]) : 0;
        const tipMax = Math.max(tipD, tipA, tipI);
        const factor = cfg.initialA > 0 ? tipMax / cfg.initialA : 0;
        const tipDwater = s.dw[n - 1];
        const waterLostPct = Math.round((1 - tipDwater) * 100);
        const exceeded = tipMax > cfg.initialA * 1.05;
        const isSettled = fullStep >= 15;

        if (!isSettled) {
          // Before enough cycles: show "what to watch"
          return (
            <div style={{ background: "#0d1020", border: "1px solid #1e2a40", borderRadius: 6, padding: "7px 10px", marginBottom: 6, fontSize: 10, color: "#7a8aaa", lineHeight: 1.6 }}>
              <span style={{ color: "#3a6ea8", fontWeight: 700, marginRight: 6 }}>👁 Watch</span>
              {sc.watch}
            </div>
          );
        }

        // After enough cycles: show computed insight + key
        return (
          <div style={{ background: "#0d1a14", border: `1px solid ${exceeded ? "#1e5c2a" : "#1e3a20"}`, borderRadius: 6, padding: "8px 10px", marginBottom: 6 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 6, fontSize: 10, fontFamily: "monospace" }}>
              <span style={{ color: exceeded ? "#2ecc71" : "#888" }}>
                📊 Factor: <strong style={{ fontSize: 12 }}>{factor.toFixed(2)}×</strong>
                {exceeded ? " ✓ amplified" : " — no amplification"}
              </span>
              <span style={{ color: "#c0392b" }}>Tip D: {Math.round(tipD)}</span>
              <span style={{ color: "#2471a3" }}>Tip A: {Math.round(tipA)}</span>
              {sc.hasI && <span style={{ color: "#5dade2" }}>Tip I: {Math.round(tipI)}</span>}
              {sc.hasI && (
                <span style={{ color: waterLostPct > 5 ? "#e67e22" : "#666" }}>
                  💧 D tip water: {(tipDwater * 100).toFixed(0)}% left ({waterLostPct > 0 ? `-${waterLostPct}%` : "no loss"})
                </span>
              )}
              {!sc.hasI && sc.hasActive && (
                <span style={{ color: "#e74c3c" }}>⚠ Fabricated: {Math.round(s.fabricated)}</span>
              )}
            </div>
            <div style={{ fontSize: 10, color: "#99b899", lineHeight: 1.6, borderTop: "1px solid #1a3020", paddingTop: 5 }}>
              <span style={{ color: exceeded ? "#27ae60" : "#e67e22", fontWeight: 700, marginRight: 6 }}>
                {exceeded ? "✓ Key" : "⚠ Key"}
              </span>
              {sc.key}
            </div>
          </div>
        );
      })()}

      {/* Gradient build-up chart */}
      <Chart history={history} scenario={cfg.scenario} />

      {/* Steady-state panel */}
      {showSteady && steadyResult && sC && (
        <div style={{ background: "#1a0f2e", borderRadius: 6, padding: 10, border: "2px solid #6c3483", marginBottom: 6 }}>
          <h3 style={{ fontSize: 12, color: "#bb8fce", marginBottom: 6 }}>
            ∞ {steadyResult.convergedAt > 0
              ? `Converged @ ${steadyResult.convergedAt.toLocaleString()}`
              : `Did not converge (${MAX_C.toLocaleString()})`}
          </h3>
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 6 }}>
            {sC.d.map((v, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                <div style={{ width: 38, height: 26, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", background: cCol(v, mx), color: tCol(v, mx), fontSize: 9, fontWeight: 700, border: "1px solid #c0392b" }}>{Math.round(v)}</div>
                <div style={{ fontSize: 6, color: "#777" }}>D{i + 1}</div>
                {sc.hasI && (
                  <>
                    <div style={{ width: 38, height: 26, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", background: cCol(sC.i[i], mx), color: tCol(sC.i[i], mx), fontSize: 9, fontWeight: 700, border: "1px dashed #2980b9" }}>{Math.round(sC.i[i])}</div>
                    <div style={{ fontSize: 6, color: "#5dade2" }}>I{i + 1}</div>
                  </>
                )}
                <div style={{ width: 38, height: 26, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", background: cCol(sC.a[i], mx), color: tCol(sC.a[i], mx), fontSize: 9, fontWeight: 700, border: "1px solid #2471a3" }}>{Math.round(sC.a[i])}</div>
                <div style={{ fontSize: 6, color: "#777" }}>A{i + 1}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#ccc", lineHeight: 1.6 }}>
            <div>🔺 Tip D:{Math.round(sC.d[n - 1])} A:{Math.round(sC.a[n - 1])}{sc.hasI && ` I:${Math.round(sC.i[n - 1])}`}</div>
            <div>🔻 Exit: {Math.round(sC.a[0])} mOsm</div>
            <div>📊 Factor: {(Math.max(sC.d[n - 1], sC.a[n - 1], ...(sC.i.length ? sC.i : [0])) / cfg.initialA).toFixed(2)}×</div>
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
          <button
            onClick={() => { setS(cloneS(steadyResult.state)); setPhase("idle"); setShowSteady(false); setFullStep(steadyResult.convergedAt || MAX_C); }}
            style={{ marginTop: 6, padding: "5px 12px", borderRadius: 4, border: "1px solid #6c3483", background: "#2a1545", color: "#bb8fce", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
            Load ∞ →
          </button>
        </div>
      )}
    </div>
  );
}
