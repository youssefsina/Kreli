"use client";

import { formatPrice } from "@/lib/api";
import { DashCard } from "@/components/dashboard/DashboardUI";

const CHART_BARS = [38, 52, 46, 64, 58, 72, 68, 80, 76, 88, 94, 84];

export function RevenueChartCard({
  revenus,
  totalMateriels,
  enLocation,
  pending,
  acceptanceRate,
  locationsTotal,
}: {
  revenus: number;
  totalMateriels: number;
  enLocation: number;
  pending: number;
  acceptanceRate: number;
  locationsTotal: number;
}) {
  return (
    <DashCard noPad>
      <div className="flex items-start justify-between px-6 py-4" style={{ borderBottom: "1px solid #F1F5F9" }}>
        <div>
          <h2 className="font-bold text-[#0F172A]">Revenus &amp; volume</h2>
          <p className="mt-0.5 text-xs text-slate-400">12 dernières semaines</p>
        </div>
      </div>

      <div className="p-6">
        <div className="relative h-52 pr-12">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute left-0 right-0"
              style={{ top: `${(i / 3) * 100}%`, height: 1, background: "#F1F5F9" }}
            >
              <span className="absolute right-0 top-[-8px] text-[10px] text-slate-400">
                {[12000, 8000, 4000, 0][i].toLocaleString("fr-FR")}
              </span>
            </div>
          ))}
          <div className="absolute inset-0 flex items-end gap-1.5 pr-12">
            {CHART_BARS.map((v, i) => {
              const isCurrent = i === CHART_BARS.length - 1;
              return (
                <div key={i} className="relative flex h-full flex-1 flex-col justify-end">
                  <div
                    className="relative rounded-t-md"
                    style={{ height: `${v}%`, background: isCurrent ? "#F97316" : "#0F172A" }}
                  >
                    {isCurrent && (
                      <div
                        className="absolute left-1/2 top-[-30px] -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-semibold text-white"
                        style={{ background: "#0F172A" }}
                      >
                        {formatPrice(revenus)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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
