import { SC } from "../constants.js";
import { gc, cCol, tCol } from "../helpers.js";

export default function UViz({ s, n, mx, phase, cfg }) {
  const sc = SC[cfg.scenario];
  const hasI = sc.hasI;
  const hasVR = sc.hasVR;
  const hasCD = sc.hasCD;
  const hasUrea = sc.hasUrea;
  const showExit = sc.isLoop;
  
  // High-fidelity spacing for Pro View
  const bW = 38, bH = 34, cGap = 16, rowGap = 16;
  const lx = 20;
  const ix = hasI ? lx + bW + cGap : 0; // Center area for Tissue/Connectors
  const rx = hasI ? ix + bW + cGap : lx + bW + 30;
  
  // Incremental Logic: Only assign X coordinates if the scenario has these features
  const cdx = hasCD ? rx + bW + cGap : 0;
  const vdx = hasVR ? (hasCD ? cdx + bW + cGap : rx + bW + cGap) : 0;
  const vax = hasVR ? vdx + bW + cGap : 0;

  const sy = showExit ? 36 : 22;
  const svgH = sy + n * (bH + rowGap) + 36;
  
  // Dynamic Width based on visible columns
  let svgW = rx + bW + 30;
  if (hasCD) svgW = cdx + bW + 30;
  if (hasVR) svgW = vax + bW + 30;

  const exitConc = showExit ? gc(s.as[0], s.aw[0]) : 0;
  const iConcs = hasI ? Array.from({ length: n }).map((_, i) => gc(s.is[i], s.iw[i]) + (hasUrea ? gc(s.ius[i], s.iw[i]) : 0)) : [];
  const isFl = phase === "flow";

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ maxWidth: svgW * 1.5, margin: "0 auto", display: "block", background: "#0b0b14", borderRadius: 8 }}>
      <defs>
        <linearGradient id="interGradient" x1="0" y1="0" x2="0" y2="1">
          {iConcs.map((c, i) => (
            <stop key={i} offset={`${(i / (n - 1)) * 100}%`} stopColor={cCol(c, mx)} stopOpacity="0.3" />
          ))}
        </linearGradient>
      </defs>

      {/* Interstitium Heatmap Background */}
      {hasI && (
        <rect x={lx - 10} y={sy - 10} width={svgW - lx} height={n * (bH + rowGap) + 20} fill="url(#interGradient)" rx={10} />
      )}

      {/* Header Labels */}
      <text x={lx + bW / 2} y={12} textAnchor="middle" fill="#c0392b" fontSize="8" fontWeight="700">DESC ↓</text>
      <text x={rx + bW / 2} y={12} textAnchor="middle" fill="#2471a3" fontSize="8" fontWeight="700">ASC ↑</text>
      
      {hasCD && <text x={cdx + bW / 2} y={12} textAnchor="middle" fill="#a855f7" fontSize="8" fontWeight="700">CD ↓</text>}
      
      {hasVR && (
        <>
          <text x={vdx + bW / 2} y={12} textAnchor="middle" fill="#e74c3c" fontSize="7" fontWeight="600">VR ↓</text>
          <text x={vax + bW / 2} y={12} textAnchor="middle" fill="#e74c3c" fontSize="7" fontWeight="600">VR ↑</text>
        </>
      )}

      {hasI && (
        <>
          <text x={ix + bW / 2} y={sy - 4} textAnchor="middle" fill="#888" fontSize="6" fontWeight="700">TISSUE: {Math.round(iConcs[0])} mOsm</text>
          <text x={ix + bW / 2} y={sy + n * (bH + rowGap)} textAnchor="middle" fill="#888" fontSize="6" fontWeight="700">{Math.round(iConcs[n-1])} mOsm</text>
        </>
      )}

      {showExit && (
        <g>
          <text x={rx + bW / 2} y={23} textAnchor="middle" fill="#5dade2" fontSize="7" fontWeight="700">
            {`↑ Exit ≈ ${Math.round(exitConc)} mOsm`}
          </text>
        </g>
      )}

      {Array.from({ length: n }).map((_, i) => {
        const y = sy + i * (bH + rowGap);
        const dc = gc(s.ds[i], s.dw[i]);
        const ac = gc(s.as[i], s.aw[i]);
        
        const isP  = phase === "pump"     && i >= Math.floor(n / 2);
        const isO  = phase === "osmosis";
        const isOCD = phase === "osmosis_cd";
        const isEVR = phase === "exchange_vr";
        const isFd = phase === "feed"     && i === 0;

        return (
          <g key={i}>
            {/* D column */}
            <rect x={lx} y={y} width={bW} height={bH} rx={4} fill={cCol(dc, mx)} fillOpacity="0.9"
              stroke={isFd ? "#27ae60" : isFl ? "#3498db" : "#ffffff44"} strokeWidth={isFd || isFl ? 2 : 0.5} />
            <text x={lx + bW / 2} y={y + bH / 2} textAnchor="middle" fill={tCol(dc, mx)} fontSize="9" fontWeight="700">{Math.round(dc)}</text>
            <text x={lx + bW / 2} y={y + bH / 2 + 8} textAnchor="middle" fill={tCol(dc, mx)} fontSize="5" opacity={0.8}>
              {`S:${Math.round(s.ds[i])} W:${s.dw[i].toFixed(2)}`}
            </text>

            {/* A column */}
            <rect x={rx} y={y} width={bW} height={bH} rx={4} fill={cCol(ac, mx)} fillOpacity="0.9"
              stroke={isP ? "#8e44ad" : isFl ? "#3498db" : "#ffffff44"} strokeWidth={isP || isFl ? 2 : 0.5} />
            <text x={rx + bW / 2} y={y + bH / 2} textAnchor="middle" fill={tCol(ac, mx)} fontSize="9" fontWeight="700">{Math.round(ac)}</text>
            <text x={rx + bW / 2} y={y + bH / 2 + 8} textAnchor="middle" fill={tCol(ac, mx)} fontSize="5" opacity={0.8}>
              {`S:${Math.round(s.as[i])} W:${s.aw[i].toFixed(2)}`}
            </text>

            {/* CD column */}
            {hasCD && (
              <>
                <rect x={cdx} y={y} width={bW} height={bH} rx={4} fill={cCol(gc(s.cds[i], s.cdw[i]), mx)} fillOpacity="0.9"
                  stroke={isOCD ? "#a855f7" : "#ffffff44"} strokeWidth={isOCD ? 2 : 0.5} />
                <text x={cdx + bW / 2} y={y + bH / 2} textAnchor="middle" fill={tCol(gc(s.cds[i], s.cdw[i]), mx)} fontSize="9" fontWeight="700">{Math.round(gc(s.cds[i], s.cdw[i]))}</text>
                <text x={cdx + bW / 2} y={y + bH / 2 + 8} textAnchor="middle" fill={tCol(gc(s.cds[i], s.cdw[i]), mx)} fontSize="5" opacity={0.8}>
                  {`S:${Math.round(s.cds[i])} W:${s.cdw[i].toFixed(2)}`}
                </text>
              </>
            )}

            {/* VR columns */}
            {hasVR && (
              <>
                <rect x={vdx} y={y} width={bW} height={bH} rx={4} fill={cCol(gc(s.vds[i], s.vdw[i]), mx)} fillOpacity="0.9"
                  stroke={isEVR ? "#e74c3c" : "#ffffff22"} strokeWidth={isEVR ? 2 : 0.5} />
                <text x={vdx + bW / 2} y={y + bH / 2} textAnchor="middle" fill={tCol(gc(s.vds[i], s.vdw[i]), mx)} fontSize="9" fontWeight="700">{Math.round(gc(s.vds[i], s.vdw[i]))}</text>
                
                <rect x={vax} y={y} width={bW} height={bH} rx={4} fill={cCol(gc(s.vas[i], s.vaw[i]), mx)} fillOpacity="0.9"
                  stroke={isEVR ? "#e74c3c" : "#ffffff22"} strokeWidth={isEVR ? 2 : 0.5} />
                <text x={vax + bW / 2} y={y + bH / 2} textAnchor="middle" fill={tCol(gc(s.vas[i], s.vaw[i]), mx)} fontSize="9" fontWeight="700">{Math.round(gc(s.vas[i], s.vaw[i]))}</text>
              </>
            )}

            {/* Dynamic Markers */}
            {hasI && isO && <text x={lx + bW + 8} y={y + bH/2 + 2} fill="#3498db" fontSize="10" fontWeight="bold">→💧</text>}
            {hasI && isP && <text x={rx - 12} y={y + bH/2 + 2} textAnchor="end" fill="#8e44ad" fontSize="10" fontWeight="bold">←🧂</text>}
            {hasCD && isOCD && <text x={cdx - 12} y={y + bH/2 + 2} fill="#a855f7" fontSize="10" fontWeight="bold">←💧</text>}
            {hasCD && hasUrea && phase === "urea_recycle" && i >= Math.floor(n / 2) && (
              <text x={cdx - 14} y={y + bH/2 + 2} fill="#f39c12" fontSize="9" fontWeight="bold">←U</text>
            )}

            {/* Urea / NaCl breakdown in tissue area */}
            {hasI && hasUrea && (
              <>
                <text x={ix + bW / 2} y={y + bH / 2 - 3} textAnchor="middle" fill="#aaaacc" fontSize="5" fontWeight="600">
                  {`Na: ${Math.round(gc(s.is[i], s.iw[i]))}`}
                </text>
                <text x={ix + bW / 2} y={y + bH / 2 + 5} textAnchor="middle" fill="#f39c12" fontSize="5" fontWeight="600">
                  {`U: ${Math.round(gc(s.ius[i], s.iw[i]))}`}
                </text>
              </>
            )}

            {/* Thick Flow Arrows in the Gaps */}
            {i < n - 1 && (
              <>
                <text x={lx + bW / 2} y={y + bH + rowGap / 2 + 5} textAnchor="middle" fill={isFl ? "#3498db" : "#333"} fontSize="12" fontWeight="900">↓</text>
                <text x={rx + bW / 2} y={y + bH + rowGap / 2 + 5} textAnchor="middle" fill={isFl ? "#3498db" : "#333"} fontSize="12" fontWeight="900">↑</text>
                {hasCD && <text x={cdx + bW / 2} y={y + bH + rowGap / 2 + 5} textAnchor="middle" fill={isFl ? "#3498db" : "#333"} fontSize="12" fontWeight="900">↓</text>}
                {hasVR && (
                  <>
                    <text x={vdx + bW / 2} y={y + bH + rowGap / 2 + 5} textAnchor="middle" fill={isFl ? "#3498db" : "#333"} fontSize="12" fontWeight="900">↓</text>
                    <text x={vax + bW / 2} y={y + bH + rowGap / 2 + 5} textAnchor="middle" fill={isFl ? "#3498db" : "#333"} fontSize="12" fontWeight="900">↑</text>
                  </>
                )}
              </>
            )}
          </g>
        );
      })}

      {/* Hairpins */}
      {(() => {
        const tipY = sy + (n - 1) * (bH + rowGap) + bH;
        const midX = (lx + bW / 2 + rx + bW / 2) / 2;
        const vrMidX = (vdx + bW / 2 + vax + bW / 2) / 2;
        return (
          <g>
            <path d={`M ${lx + bW / 2} ${tipY} Q ${lx + bW / 2} ${tipY + 12} ${midX} ${tipY + 12} Q ${rx + bW / 2} ${tipY + 12} ${rx + bW / 2} ${tipY}`}
              fill="none" stroke="#444" strokeWidth="1.5" strokeDasharray="3,2" />
            {hasVR && (
              <path d={`M ${vdx + bW / 2} ${tipY} Q ${vdx + bW / 2} ${tipY + 8} ${vrMidX} ${tipY + 8} Q ${vax + bW / 2} ${tipY + 8} ${vax + bW / 2} ${tipY}`}
                fill="none" stroke="#444" strokeWidth="1" strokeDasharray="2,2" />
            )}
          </g>
        );
      })()}
    </svg>
  );
}
