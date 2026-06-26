"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DashCard } from "@/components/dashboard/DashboardUI";

interface MonthPoint {
  month: string;
  revenue: number;
}

// Minimal shape of the props recharts injects into a custom tooltip.
interface ChartTooltipProps {
  active?: boolean;
  payload?: { value?: number }[];
  label?: string | number;
}

function CustomTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value ?? 0;
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #E2E8F0",
        borderRadius: 12,
        padding: "10px 16px",
        boxShadow: "0 4px 24px rgba(15,23,42,0.10)",
        minWidth: 140,
      }}
    >
      <p
        style={{
          fontSize: 10,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: "#94A3B8",
          marginBottom: 4,
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", color: "#0F172A", margin: 0 }}>
        {value.toLocaleString("fr-MA")}
        <span style={{ fontSize: 11, fontWeight: 500, color: "#94A3B8", marginLeft: 4 }}>MAD</span>
      </p>
    </div>
  );
}

function EmptyChart() {
  const mockData = [0, 0.2, 0.1, 0.35, 0.25, 0.45].map((v, i) => ({
    month: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"][i],
    revenue: v * 5000,
  }));
  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", margin: 0 }}>Aucune donnée disponible</p>
        <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>Vos revenus apparaîtront ici</p>
      </div>
      <div style={{ opacity: 0.12, pointerEvents: "none" }}>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={mockData} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="dashEmptyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff6700" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#ff6700" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="revenue" stroke="#ff6700" strokeWidth={2} fill="url(#dashEmptyGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function RevenueChartCard({
  monthly,
  totalMateriels,
  enLocation,
  pending,
  acceptanceRate,
  locationsTotal,
}: {
  monthly: MonthPoint[];
  totalMateriels: number;
  enLocation: number;
  pending: number;
  acceptanceRate: number;
  locationsTotal: number;
}) {
  const max = monthly.length ? Math.max(...monthly.map((d) => d.revenue)) : 0;
  const yMax = Math.ceil(max / 1000) * 1000 + 1000;

  return (
    <DashCard noPad>
      <div className="flex items-start justify-between px-6 py-4" style={{ borderBottom: "1px solid #F1F5F9" }}>
        <div>
          <h2 className="font-bold text-[#0F172A]">Revenus &amp; volume</h2>
          <p className="mt-0.5 text-xs text-slate-400">Évolution des revenus nets — 6 derniers mois</p>
        </div>
      </div>

      <div className="p-6">
        {monthly.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthly} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="dashRevenusGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff6700" stopOpacity={0.18} />
                  <stop offset="75%" stopColor="#ff6700" stopOpacity={0.04} />
                  <stop offset="100%" stopColor="#ff6700" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.05)" vertical={false} />

              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
                dy={6}
              />

              <YAxis
                domain={[0, yMax]}
                tick={{ fontSize: 10, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : String(v)
                }
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: "rgba(255,103,0,0.15)", strokeWidth: 1.5, strokeDasharray: "4 4" }}
              />

              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#ff6700"
                strokeWidth={2.5}
                fill="url(#dashRevenusGrad)"
                dot={false}
                activeDot={{ r: 5, fill: "#ff6700", stroke: "#ffffff", strokeWidth: 2.5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        <div className="mt-7 grid grid-cols-3 gap-6 border-t pt-6" style={{ borderColor: "#F1F5F9" }}>
          {[
            ["Parc total", `${totalMateriels} matériel${totalMateriels !== 1 ? "s" : ""}`, `${enLocation} actif${enLocation !== 1 ? "s" : ""}`],
            ["En attente", `${pending} demande${pending !== 1 ? "s" : ""}`, pending > 0 ? "À traiter" : "Aucune"],
            ["Taux acceptation", locationsTotal ? `${acceptanceRate}%` : "—", "des demandes"],
          ].map(([k, v, n]) => (
            <div key={k}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">{k}</p>
              <p className="mt-1.5 text-[15px] font-bold text-[#0F172A]">{v}</p>
              <p className="mt-0.5 text-xs font-semibold text-[#F97316]">{n}</p>
            </div>
          ))}
        </div>
      </div>
    </DashCard>
  );
}
