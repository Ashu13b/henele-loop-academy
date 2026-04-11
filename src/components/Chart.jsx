import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { SC } from "../constants.js";

export default function Chart({ history, scenario }) {
  const hasI = SC[scenario]?.hasI ?? false;
  if (history.length < 2) return null;

  return (
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
          {hasI && <Line type="monotone" dataKey="tipI" name="Tip I" stroke="#2980b9" strokeWidth={1.5} dot={false} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
