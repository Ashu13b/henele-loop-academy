import { useEffect, useRef } from "react";
import { gc, cCol } from "../helpers.js";

const CORTEX_H = 50;
const SEG_H = 22;
const LIMB_W = 40;
const LIMB_GAP = 50;
const CD_GAP = 70;
const VR_W = 28;
const VR_GAP = 8;

const X_DESC = 70;
const X_ASC = X_DESC + LIMB_W + LIMB_GAP;
const X_CD = X_ASC + LIMB_W + CD_GAP;
const X_VRD = X_CD + LIMB_W + 50;
const X_VRA = X_VRD + VR_W + VR_GAP;

export default function SimulationCanvas({ s, n, mx, showLabels }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const canvasW = X_VRA + VR_W + 50;
    const canvasH = CORTEX_H + n * SEG_H + 60;

    canvas.width = canvasW;
    canvas.height = canvasH;

    // Draw Background
    ctx.fillStyle = "#0b0b14";
    ctx.fillRect(0, 0, canvasW, canvasH);
    
    // Cortex band
    ctx.fillStyle = "#161625";
    ctx.fillRect(0, 0, canvasW, CORTEX_H);

    // Labels
    ctx.font = "bold 11px sans-serif";
    ctx.fillStyle = "#888";
    ctx.fillText("CORTEX", 10, 20);
    ctx.save();
    ctx.translate(15, CORTEX_H + (n * SEG_H) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("MEDULLA", -30, 0);
    ctx.restore();

    const drawLimb = (dataSolute, dataWater, xCentre, label, color) => {
      const x = xCentre - LIMB_W / 2;
      for (let i = 0; i < n; i++) {
        const y = CORTEX_H + i * SEG_H;
        const conc = gc(dataSolute[i], dataWater[i]);
        ctx.fillStyle = cCol(conc, mx);
        ctx.fillRect(x, y, LIMB_W, SEG_H - 2);
        if (showLabels) {
          ctx.fillStyle = "rgba(255,255,255,0.7)";
          ctx.font = "8px monospace";
          ctx.textAlign = "center";
          ctx.fillText(Math.round(conc), xCentre, y + SEG_H - 8);
        }
      }
      ctx.fillStyle = color;
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, xCentre, CORTEX_H - 10);
    };

    const drawInterstitium = () => {
      for (let i = 0; i < n; i++) {
        const y = CORTEX_H + i * SEG_H;
        const conc = gc(s.is[i], s.iw[i]);
        ctx.fillStyle = cCol(conc, mx);
        ctx.globalAlpha = 0.2;
        ctx.fillRect(35, y, canvasW - 70, SEG_H - 2);
        ctx.globalAlpha = 1.0;
      }
    };

    drawInterstitium();
    drawLimb(s.ds, s.dw, X_DESC, "DESC ↓", "#c0392b");
    drawLimb(s.as, s.aw, X_ASC, "ASC ↑", "#2471a3");
    drawLimb(s.cds, s.cdw, X_CD, "CD ↓", "#a855f7");
    
    // Vasa Recta
    drawLimb(s.vds, s.vdw, X_VRD, "VR-D ↓", "#e74c3c");
    drawLimb(s.vas, s.vaw, X_VRA, "VR-A ↑", "#e74c3c");

    // Hairpins
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 2;
    const tipY = CORTEX_H + n * SEG_H;
    
    // Loop Hairpin
    ctx.beginPath();
    ctx.moveTo(X_DESC, tipY - 2);
    ctx.quadraticCurveTo((X_DESC + X_ASC) / 2, tipY + 15, X_ASC, tipY - 2);
    ctx.stroke();

    // VR Hairpin
    ctx.beginPath();
    ctx.moveTo(X_VRD, tipY - 2);
    ctx.quadraticCurveTo((X_VRD + X_VRA) / 2, tipY + 10, X_VRA, tipY - 2);
    ctx.stroke();

  }, [s, n, mx, showLabels]);

  return (
    <div style={{ width: "100%", overflowX: "auto", background: "#0b0b14", borderRadius: 8, border: "1px solid #222", padding: 10 }}>
      <canvas ref={canvasRef} style={{ display: "block", margin: "0 auto" }} />
    </div>
  );
}
