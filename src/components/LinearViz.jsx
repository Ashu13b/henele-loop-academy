import { SC } from "../constants.js";
import { gc, cCol, tCol } from "../helpers.js";

// Bug 4 fix: D box always scales with dw, and S/W sub-labels shown.
export default function LinearViz({ s, n, mx, phase, cfg }) {
  const sc = SC[cfg.scenario];
  const hasI = sc.hasI;
  const bW = 46, bH = 38, gap = 16;
  const sx = 36;
  const topY = 26;
  const midY = hasI ? topY + bH + 18 : 0;
  const botY = hasI ? midY + bH + 18 : topY + bH + 26;
  const w = sx + n * (bW + gap) + 50;
  const h = botY + bH + 14;

  const isFl = phase === "flow";

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
        const isFdD = phase === "feed"     && i === 0;
        const isFdA = phase === "feed"     && i === n - 1;

        return (
          <g key={i}>
            {/* D row: full-width box */}
            <rect x={x} y={topY} width={bW} height={bH} rx={3} fill={cCol(dc, mx)}
              stroke={isFdD ? "#27ae60" : isFl ? "#3498db" : "#ffffff22"} strokeWidth={isFdD || isFl ? 2 : 0.5} />
            <text x={x + bW / 2} y={topY + bH / 2} textAnchor="middle" fill={tCol(dc, mx)} fontSize="10" fontWeight="700">{Math.round(dc)}</text>
            <text x={x + bW / 2} y={topY + bH / 2 + 9} textAnchor="middle" fill={tCol(dc, mx)} fontSize="6" opacity={0.75}>
              {`S:${Math.round(s.ds[i])} W:${s.dw[i].toFixed(2)}`}
            </text>

            {/* I row */}
            {hasI && (
              <>
                <rect x={x} y={midY} width={bW} height={bH} rx={3} fill={cCol(ic, mx)}
                  stroke={isP ? "#8e44ad" : isO ? "#2980b9" : "#ffffff11"} strokeWidth={isP || isO ? 2 : 0.5} />
                <text x={x + bW / 2} y={midY + bH / 2} textAnchor="middle" fill={tCol(ic, mx)} fontSize="10" fontWeight="700">{Math.round(ic)}</text>
                <text x={x + bW / 2} y={midY + bH / 2 + 9} textAnchor="middle" fill={tCol(ic, mx)} fontSize="6" opacity={0.75}>
                  {`S:${Math.round(s.is[i])} W:${s.iw[i].toFixed(2)}`}
                </text>
              </>
            )}

            {/* A row */}
            <rect x={x} y={botY} width={bW} height={bH} rx={3} fill={cCol(ac, mx)}
              stroke={isFdA ? "#27ae60" : isP ? "#8e44ad" : isInj ? "#c0392b" : isEx ? "#e67e22" : isFl ? "#3498db" : "#ffffff22"}
              strokeWidth={isFdA || isP || isInj || isEx || isFl ? 2 : 0.5} />
            <text x={x + bW / 2} y={botY + bH / 2} textAnchor="middle" fill={tCol(ac, mx)} fontSize="10" fontWeight="700">{Math.round(ac)}</text>
            <text x={x + bW / 2} y={botY + bH / 2 + 9} textAnchor="middle" fill={tCol(ac, mx)} fontSize="6" opacity={0.75}>
              {`S:${Math.round(s.as[i])} W:${s.aw[i].toFixed(2)}`}
            </text>

            {/* Flow arrows between columns */}
            {i < n - 1 && (
              <>
                <text x={x + bW + gap / 2} y={topY + bH / 2 + 5} textAnchor="middle" fill={isFl ? "#3498db" : "#444"} fontSize="12" fontWeight="900">→</text>
                <text x={x + bW + gap / 2} y={botY + bH / 2 + 5} textAnchor="middle" fill={isFl ? "#3498db" : "#444"} fontSize="12" fontWeight="900">←</text>
              </>
            )}

            {/* Dynamic Markers */}
            {hasI && isO && <text x={x + bW / 2} y={topY + bH + 12} textAnchor="middle" fill="#3498db" fontSize="10" fontWeight="bold">↓💧</text>}
            {hasI && isP && <text x={x + bW / 2} y={botY - 4} textAnchor="middle" fill="#8e44ad" fontSize="10" fontWeight="bold">↑🧂</text>}
          </g>
        );
      })}
    </svg>
  );
}
