import { SC } from "../constants.js";
import { gc, cCol, tCol } from "../helpers.js";

// Bug 4 fix: D box always scales with dw (not just when hasI), and S/W sub-labels shown.
export default function UViz({ s, n, mx, phase, cfg }) {
  const sc = SC[cfg.scenario];
  const hasI = sc.hasI;
  const showExit = sc.isLoop;
  const bW = 44, bH = 38, gap = 8;
  const lx = 26;
  const ix = hasI ? lx + bW + 24 : 0;
  const rx = hasI ? ix + bW + 24 : lx + bW + 38;
  const sy = showExit ? 36 : 22;
  const svgH = sy + n * (bH + gap) + 36;
  const svgW = rx + bW + 36;
  const exitConc = showExit ? gc(s.as[0], s.aw[0]) : 0;

  return (
    <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{ maxWidth: hasI ? 330 : 260, margin: "0 auto", display: "block" }}>
      <text x={lx + bW / 2} y={12} textAnchor="middle" fill="#c0392b" fontSize="9" fontWeight="700">D ↓</text>
      {hasI && <text x={ix + bW / 2} y={12} textAnchor="middle" fill="#5dade2" fontSize="8" fontWeight="600">I (tissue)</text>}
      <text x={rx + bW / 2} y={12} textAnchor="middle" fill="#2471a3" fontSize="9" fontWeight="700">A ↑</text>

      {showExit && (
        <g>
          <text x={rx + bW / 2} y={23} textAnchor="middle" fill="#1a6fa3" fontSize="7" fontWeight="700">
            {`↑ Exit ≈ ${Math.round(exitConc)} mOsm`}
          </text>
          {exitConc < 280 && (
            <text x={rx + bW / 2} y={31} textAnchor="middle" fill="#5dade2" fontSize="6" fontStyle="italic">
              hypoosmotic
            </text>
          )}
        </g>
      )}

      {Array.from({ length: n }).map((_, i) => {
        const y = sy + i * (bH + gap);
        const dc = gc(s.ds[i], s.dw[i]);
        const ac = gc(s.as[i], s.aw[i]);
        const ic = hasI ? gc(s.is[i], s.iw[i]) : 0;
        const isP  = phase === "pump"     && i >= Math.floor(n / 2);
        const isO  = phase === "osmosis";
        const isInj = phase === "inject"  && i >= Math.floor(n / 2);
        const isEx = phase === "exchange";
        const isFl = phase === "flow";
        const isFd = phase === "feed"     && i === 0;

        // Bug 4 fix: always scale D box width by water volume.
        const dScale = Math.max(0.45, Math.min(1, s.dw[i]));
        const dW = bW * dScale;
        const dX = lx + (bW - dW) / 2;

        return (
          <g key={i}>
            {/* D column: full outline always; water-scaled fill shows how much water remains */}
            <rect x={lx} y={y} width={bW} height={bH} rx={3} fill="#0a0a1a" fillOpacity={0.05}
              stroke={isFd ? "#27ae60" : isFl ? "#3498db" : "#c0392b"} strokeWidth={isFd || isFl ? 2 : 1.2} />
            <rect x={dX} y={y} width={dW} height={bH} rx={3} fill={cCol(dc, mx)} stroke="none" />
            <text x={lx + bW / 2} y={y + bH / 2} textAnchor="middle" fill={tCol(dc, mx)} fontSize="10" fontWeight="700">{Math.round(dc)}</text>
            {/* Bug 4: S/W labels */}
            <text x={lx + bW / 2} y={y + bH / 2 + 9} textAnchor="middle" fill={tCol(dc, mx)} fontSize="6" opacity={0.75}>
              {`S:${Math.round(s.ds[i])} W:${s.dw[i].toFixed(2)}`}
            </text>
            <text x={lx - 2} y={y + bH / 2 + 3} textAnchor="end" fill="#444" fontSize="7">D{i + 1}</text>

            {/* I column */}
            {hasI && (
              <>
                <rect x={ix} y={y} width={bW} height={bH} rx={3} fill={cCol(ic, mx)}
                  stroke={isP ? "#8e44ad" : isO ? "#2980b9" : "#3a3a4a"} strokeWidth={isP || isO ? 2 : 1}
                  strokeDasharray={isP || isO ? "none" : "3,2"} />
                <text x={ix + bW / 2} y={y + bH / 2} textAnchor="middle" fill={tCol(ic, mx)} fontSize="10" fontWeight="700">{Math.round(ic)}</text>
                <text x={ix + bW / 2} y={y + bH / 2 + 9} textAnchor="middle" fill={tCol(ic, mx)} fontSize="6" opacity={0.75}>
                  {`S:${Math.round(s.is[i])} W:${s.iw[i].toFixed(2)}`}
                </text>
              </>
            )}

            {/* A column */}
            <rect x={rx} y={y} width={bW} height={bH} rx={3} fill={cCol(ac, mx)}
              stroke={isP ? "#8e44ad" : isInj ? "#c0392b" : isEx ? "#e67e22" : isFl ? "#3498db" : "#2471a3"}
              strokeWidth={isP || isInj || isEx || isFl ? 2 : 1.2} />
            <text x={rx + bW / 2} y={y + bH / 2} textAnchor="middle" fill={tCol(ac, mx)} fontSize="10" fontWeight="700">{Math.round(ac)}</text>
            <text x={rx + bW / 2} y={y + bH / 2 + 9} textAnchor="middle" fill={tCol(ac, mx)} fontSize="6" opacity={0.75}>
              {`S:${Math.round(s.as[i])} W:${s.aw[i].toFixed(2)}`}
            </text>
            <text x={rx + bW + 2} y={y + bH / 2 + 3} textAnchor="start" fill="#444" fontSize="7">A{i + 1}</text>

            {/* Connectors */}
            {hasI ? (
              <>
                <line x1={lx + bW + 1} y1={y + bH / 2} x2={ix - 1} y2={y + bH / 2}
                  stroke={isO ? "#2980b9" : "#2a2a3a"} strokeWidth={isO ? 1.5 : 0.7} strokeDasharray={isO ? "none" : "2,2"} />
                {isO && <text x={(lx + bW + ix) / 2} y={y + bH / 2 - 3} textAnchor="middle" fill="#2980b9" fontSize="6">H₂O→</text>}
                <line x1={ix + bW + 1} y1={y + bH / 2} x2={rx - 1} y2={y + bH / 2}
                  stroke={isP ? "#8e44ad" : "#2a2a3a"} strokeWidth={isP ? 1.5 : 0.7} strokeDasharray={isP ? "none" : "2,2"} />
                {isP && <text x={(ix + bW + rx) / 2} y={y + bH / 2 - 3} textAnchor="middle" fill="#8e44ad" fontSize="6">←NaCl</text>}
                {/* Single-effect delta badge: I−A gradient at each medullary box */}
                {i >= Math.floor(n / 2) && (() => {
                  const delta = Math.round(ic - ac);
                  const bColor = delta < 50 ? "#888" : delta <= 250 ? "#e67e22" : "#c0392b";
                  const midX = (ix + bW + rx) / 2;
                  const bY = y + bH / 2;
                  return (
                    <g>
                      <rect x={midX - 13} y={bY + 3} width={26} height={11} rx={2}
                        fill={bColor} fillOpacity={0.15} stroke={bColor} strokeWidth={0.8} />
                      <text x={midX} y={bY + 11} textAnchor="middle"
                        fill={bColor} fontSize="6" fontWeight="700">
                        {delta > 0 ? `+${delta}` : `${delta}`}
                      </text>
                    </g>
                  );
                })()}
              </>
            ) : (
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

            {/* Flow arrows between rows */}
            {i < n - 1 && (
              <>
                <text x={lx + bW / 2} y={y + bH + gap / 2 + 3} textAnchor="middle" fill={isFl ? "#3498db" : "#333"} fontSize={isFl ? 11 : 9}>↓</text>
                <text x={rx + bW / 2} y={y + bH + gap / 2 + 3} textAnchor="middle" fill={isFl ? "#3498db" : "#333"} fontSize={isFl ? 11 : 9}>↑</text>
              </>
            )}
          </g>
        );
      })}

      {/* U-bend at tip */}
      {(() => {
        const tipY = sy + (n - 1) * (bH + gap) + bH;
        const midX = (lx + bW / 2 + rx + bW / 2) / 2;
        return (
          <path d={`M ${lx + bW / 2} ${tipY} Q ${lx + bW / 2} ${tipY + 16} ${midX} ${tipY + 16} Q ${rx + bW / 2} ${tipY + 16} ${rx + bW / 2} ${tipY}`}
            fill="none" stroke={phase === "flow" ? "#3498db" : "#444"} strokeWidth={1.5} strokeDasharray="3,3" />
        );
      })()}

      <text x={svgW - 2} y={sy + 4} textAnchor="end" fill="#444" fontSize="7">cortex</text>
      <text x={svgW - 2} y={sy + (n - 1) * (bH + gap) + bH - 2} textAnchor="end" fill="#444" fontSize="7">medulla</text>
    </svg>
  );
}
