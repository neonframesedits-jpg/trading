import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import type { FinancialYear } from "../api";

export function HistoryChart({ history }: { history: FinancialYear[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={history}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2e3a" />
          <XAxis dataKey="year" stroke="#8a8f9c" />
          <YAxis yAxisId="price" stroke="#8a8f9c" />
          <YAxis yAxisId="div" orientation="right" stroke="#8a8f9c" />
          <Tooltip contentStyle={{ background: "#16171d", border: "1px solid #2a2e3a", borderRadius: 8 }} />
          <Legend />
          <Line yAxisId="price" type="monotone" dataKey="price" name="Share price (₦)" stroke="#38bdf8" strokeWidth={2} />
          <Line yAxisId="div" type="monotone" dataKey="dividend_per_share" name="Dividend/share (₦)" stroke="#22c55e" strokeWidth={2} />
          <Line yAxisId="div" type="monotone" dataKey="eps" name="EPS (₦)" stroke="#f97316" strokeWidth={1.5} strokeDasharray="4 4" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
