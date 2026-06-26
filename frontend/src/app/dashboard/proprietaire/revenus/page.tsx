"use client";

import { useEffect, useState, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { getOwnerLocations, getOwnerStats, formatPrice, type Location } from "@/lib/api";
import { DollarSign, Clock, TrendingUp, BarChart2, Package, ArrowUpRight } from "lucide-react";
import { DashCard, StatCard } from "@/components/dashboard/DashboardUI";
import { formatDayMonth } from "@/lib/format";

const RevenusChart = lazy(() => import("@/components/dashboard/RevenusChart"));

const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const ITEM = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const TABLE_COLS = "minmax(0,1fr) 110px 110px 110px";

function buildMonthly(locs: Location[]) {
  const map: Record<string, number> = {};
  for (const l of locs) {
    if (l.statut !== "terminee" && l.statut !== "en_cours") continue;
    const d = new Date(l.createdAt ?? "");
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const net = (l as unknown as { montantNetProprio?: number }).montantNetProprio ?? 0;
    map[k] = (map[k] ?? 0) + net;
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, revenue]) => ({
      month: new Date(`${month}-01`).toLocaleDateString("fr-MA", {
        month: "short",
        year: "2-digit",
      }),
      revenue,
    }));
}

export default function RevenusPage() {
  const [locs, setLocs] = useState<Location[]>([]);
  const [, setStats] = useState<{ revenus: number; locations: { terminees: number; total: number } } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getOwnerLocations({ limit: 200 }),
      getOwnerStats(),
    ])
      .then(([locsData, statsData]) => {
        setLocs(locsData.data ?? []);
        setStats(statsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const done = locs.filter((l) => l.statut === "terminee");
  const pending = locs.filter((l) => l.statut === "acceptee" || l.statut === "en_cours");

  const totalNet = done.reduce(
    (s, l) => s + ((l as unknown as { montantNetProprio?: number }).montantNetProprio ?? 0),
    0
  );
  const totalBrut = done.reduce((s, l) => s + (l.montantLocation ?? 0), 0);
  const totalCommission = totalBrut - totalNet;
  const totalPending = pending.reduce(
    (s, l) => s + ((l as unknown as { montantNetProprio?: number }).montantNetProprio ?? 0),
    0
  );
  const monthly = buildMonthly(locs);

  const avgPerLocation = done.length > 0 ? totalNet / done.length : 0;

  if (loading) {
    return (
      <div className="space-y-4 p-6 lg:p-8">
        <div className="h-8 w-52 animate-pulse rounded-xl bg-white" style={{ border: "1px solid #E2E8F0" }} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-[20px] bg-white" style={{ border: "1px solid #E2E8F0" }} />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-[20px] bg-white" style={{ border: "1px solid #E2E8F0" }} />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-5">

        <motion.div variants={ITEM}>
          <h1 className="text-2xl font-black text-[#0F172A] lg:text-3xl">Mes Revenus</h1>
          <p className="mt-1 text-sm text-slate-400">Suivi de vos gains et détail des commissions</p>
        </motion.div>

        <motion.div variants={ITEM} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={DollarSign}
            label="Revenus nets"
            value={formatPrice(totalNet)}
            sub={`${done.length} location${done.length !== 1 ? "s" : ""} terminée${done.length !== 1 ? "s" : ""}`}
            accent
          />
          <StatCard
            icon={Clock}
            label="En attente"
            value={formatPrice(totalPending)}
            sub={`${pending.length} location${pending.length !== 1 ? "s" : ""} en cours`}
          />
          <StatCard
            icon={TrendingUp}
            label="Revenu brut"
            value={formatPrice(totalBrut)}
            sub="Avant commission plateforme"
          />
          <StatCard
            icon={Package}
            label="Commission"
            value={formatPrice(totalCommission)}
            sub="Frais de service Kreli"
          />
        </motion.div>

        <motion.div variants={ITEM}>
          <DashCard>
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="font-bold text-[#0F172A]">Évolution mensuelle</h2>
                <p className="mt-0.5 text-xs text-slate-400">Revenus nets — 6 derniers mois</p>
              </div>
              {monthly.length > 0 && (
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Moy. / location</p>
                  <p className="mt-1 text-lg font-black text-[#0F172A]">{formatPrice(avgPerLocation)}</p>
                </div>
              )}
            </div>
            <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl bg-slate-100" />}>
              {monthly.length > 0 ? (
                <RevenusChart data={monthly} />
              ) : (
                <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
                  <BarChart2 className="h-8 w-8 text-slate-200" />
                  <p className="text-sm text-slate-500">Aucune donnée à afficher</p>
                  <p className="text-xs text-slate-400">Vos revenus apparaîtront ici après vos premières locations</p>
                </div>
              )}
            </Suspense>
          </DashCard>
        </motion.div>

        <motion.div variants={ITEM}>
          <DashCard noPad>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #F1F5F9" }}>
              <h2 className="font-bold text-[#0F172A]">Historique des locations</h2>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">
                {done.length} terminée{done.length !== 1 ? "s" : ""}
              </span>
            </div>

            {done.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50">
                  <Package className="h-5 w-5 text-slate-300" />
                </div>
                <p className="text-sm text-slate-500">Aucune location terminée pour l&apos;instant</p>
              </div>
            ) : (
              <>
                <div
                  className="hidden items-center gap-4 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] sm:grid"
                  style={{ gridTemplateColumns: TABLE_COLS, borderBottom: "1px solid #F1F5F9", background: "#FAFAFA" }}
                >
                  <span>Matériel / Date</span>
                  <span className="text-center">Durée</span>
                  <span className="text-right">Brut</span>
                  <span className="text-right">Net</span>
                </div>

                {done.slice(0, 15).map((l, i) => {
                  const nom = (l.materielId as unknown as { nom?: string })?.nom ?? "Matériel";
                  const net = (l as unknown as { montantNetProprio?: number }).montantNetProprio ?? 0;
                  const pct = l.montantLocation > 0 ? Math.round((net / l.montantLocation) * 100) : 0;
                  return (
                    <div
                      key={l._id}
                      className="flex flex-col gap-2 px-6 py-4 sm:grid sm:items-center sm:gap-4"
                      style={{ gridTemplateColumns: TABLE_COLS, borderTop: i > 0 ? "1px solid #F1F5F9" : "none" }}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#0F172A]">{nom}</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {formatDayMonth(l.dateDebut)}
                          {" → "}
                          {new Date(l.dateFinPrevue).toLocaleDateString("fr-MA", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div className="sm:text-center">
                        <span className="text-sm font-semibold text-[#0F172A]">{l.nbJours}j</span>
                      </div>
                      <div className="sm:text-right">
                        <span className="text-sm text-slate-500">{formatPrice(l.montantLocation)}</span>
                      </div>
                      <div className="sm:text-right">
                        <div className="text-sm font-bold text-emerald-600">{formatPrice(net)}</div>
                        <div className="text-[10px] text-slate-400">{pct}%</div>
                      </div>
                    </div>
                  );
                })}

                {done.length > 15 && (
                  <div className="px-6 py-3 text-center" style={{ borderTop: "1px solid #F1F5F9", background: "#FAFAFA" }}>
                    <p className="text-xs text-slate-400">
                      15 sur {done.length} · Total net : {formatPrice(totalNet)}
                    </p>
                  </div>
                )}
              </>
            )}
          </DashCard>
        </motion.div>

        {pending.length > 0 && (
          <motion.div
            variants={ITEM}
            className="rounded-[20px] p-5"
            style={{ border: "1px solid #FDE68A", background: "#FFFBEB" }}
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: "#FEF3C7" }}>
                <Clock className="h-5 w-5" style={{ color: "#B45309" }} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-[#78350F]">Revenus en cours</p>
                <p className="mt-0.5 text-[13px] text-[#92400E]">
                  {formatPrice(totalPending)} attendus pour {pending.length} location{pending.length !== 1 ? "s" : ""} en cours
                </p>
              </div>
              <div className="flex items-center gap-1 text-[13px] font-bold" style={{ color: "#B45309" }}>
                <ArrowUpRight className="h-4 w-4" />
                Potentiel
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
