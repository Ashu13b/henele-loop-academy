import { SC } from "../constants.js";
import { gc, cCol, tCol } from "../helpers.js";

// Bug 4 fix: D box always scales with dw, and S/W sub-labels shown.
export default function LinearViz({ s, n, mx, phase, cfg }) {
  const hasI = SC[cfg.scenario].hasI;
  const bW = 46, bH = 38, gap = 6;
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
        const dc = gc(s.ds[i], s.dw[i]);
        const ac = gc(s.as[i], s.aw[i]);
        const ic = hasI ? gc(s.is[i], s.iw[i]) : 0;
        const isP   = phase === "pump"     && i >= Math.floor(n / 2);
        const isO   = phase === "osmosis";
        const isInj = phase === "inject"   && i >= Math.floor(n / 2);
        const isEx  = phase === "exchange";
        const isFl  = phase === "flow";
        const isFdD = phase === "feed"     && i === 0;
        const isFdA = phase === "feed"     && i === n - 1;

        return (
          <g key={i}>
            {/* D row: full-width box */}
            <rect x={x} y={topY} width={bW} height={bH} rx={3} fill={cCol(dc, mx)}
              stroke={isFdD ? "#27ae60" : isFl ? "#3498db" : "#c0392b"} strokeWidth={isFdD || isFl ? 2 : 1.2} />
            <text x={x + bW / 2} y={topY + bH / 2} textAnchor="middle" fill={tCol(dc, mx)} fontSize="10" fontWeight="700">{Math.round(dc)}</text>
            {/* Bug 4: S/W labels */}
            <text x={x + bW / 2} y={topY + bH / 2 + 9} textAnchor="middle" fill={tCol(dc, mx)} fontSize="6" opacity={0.75}>
              {`S:${Math.round(s.ds[i])} W:${s.dw[i].toFixed(2)}`}
            </text>

            {/* I row */}
            {hasI && (
              <>
                <rect x={x} y={midY} width={bW} height={bH} rx={3} fill={cCol(ic, mx)}
                  stroke={isP ? "#8e44ad" : isO ? "#2980b9" : "#3a3a4a"} strokeWidth={isP || isO ? 2 : 1}
                  strokeDasharray={isP || isO ? "none" : "3,2"} />
                <text x={x + bW / 2} y={midY + bH / 2} textAnchor="middle" fill={tCol(ic, mx)} fontSize="10" fontWeight="700">{Math.round(ic)}</text>
                <text x={x + bW / 2} y={midY + bH / 2 + 9} textAnchor="middle" fill={tCol(ic, mx)} fontSize="6" opacity={0.75}>
                  {`S:${Math.round(s.is[i])} W:${s.iw[i].toFixed(2)}`}
                </text>
              </>
            )}

            {/* A row */}
            <rect x={x} y={botY} width={bW} height={bH} rx={3} fill={cCol(ac, mx)}
              stroke={isFdA ? "#27ae60" : isP ? "#8e44ad" : isInj ? "#c0392b" : isEx ? "#e67e22" : isFl ? "#3498db" : "#2471a3"}
              strokeWidth={isFdA || isP || isInj || isEx || isFl ? 2 : 1.2} />
            <text x={x + bW / 2} y={botY + bH / 2} textAnchor="middle" fill={tCol(ac, mx)} fontSize="10" fontWeight="700">{Math.round(ac)}</text>
            <text x={x + bW / 2} y={botY + bH / 2 + 9} textAnchor="middle" fill={tCol(ac, mx)} fontSize="6" opacity={0.75}>
              {`S:${Math.round(s.as[i])} W:${s.aw[i].toFixed(2)}`}
            </text>

            {/* Connectors */}
            {hasI ? (
              <>
                <line x1={x + bW / 2} y1={topY + bH + 1} x2={x + bW / 2} y2={midY - 1}
                  stroke={isO ? "#2980b9" : "#2a2a3a"} strokeWidth={isO ? 1.5 : 0.7} strokeDasharray={isO ? "none" : "2,2"} />
                <line x1={x + bW / 2} y1={midY + bH + 1} x2={x + bW / 2} y2={botY - 1}
                  stroke={isP ? "#8e44ad" : "#2a2a3a"} strokeWidth={isP ? 1.5 : 0.7} strokeDasharray={isP ? "none" : "2,2"} />
              </>
            ) : (
              <line x1={x + bW / 2} y1={topY + bH + 1} x2={x + bW / 2} y2={botY - 1}
                stroke={isEx || isInj ? (isInj ? "#c0392b" : "#e67e22") : "#2a2a3a"}
                strokeWidth={isEx || isInj ? 1.5 : 0.7} strokeDasharray={isEx || isInj ? "none" : "3,3"} />
            )}

            {/* Flow arrows between columns */}
            {i < n - 1 && (
              <>
                <text x={x + bW + gap / 2} y={topY + bH / 2 + 3} textAnchor="middle" fill={isFl ? "#3498db" : "#333"} fontSize={isFl ? 11 : 8}>→</text>
                <text x={x + bW + gap / 2} y={botY + bH / 2 + 3} textAnchor="middle" fill={isFl ? "#3498db" : "#333"} fontSize={isFl ? 11 : 8}>←</text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
