"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  getOwnerLocations,
  acceptLocation,
  rejectLocation,
  startLocation,
  returnMateriel,
  getStatutLabel,
  type Location,
} from "@/lib/api";
import { Clock, X, ChevronLeft, ChevronRight } from "lucide-react";
import { DashCard, Alert } from "@/components/dashboard/DashboardUI";
import { OwnerLocationRow } from "./OwnerLocationRow";
import { StatusTabs } from "@/components/dashboard/StatusTabs";
import { useI18n } from "@/context/I18nContext";

const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const ITEM = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.28 } } };

const TABS = [
  { key: "",           label: "Toutes" },
  { key: "en_attente", label: "En attente" },
  { key: "acceptee",   label: "Acceptées" },
  { key: "en_cours",   label: "En cours" },
  { key: "terminee",   label: "Terminées" },
  { key: "refusee",    label: "Refusées" },
];

const GRID_COLS = "minmax(0,1.6fr) minmax(0,1.4fr) 150px 130px 150px";

const PAGE_SIZE = 10;
const VALID_TABS = TABS.map((tb) => tb.key);

function ProprietaireLocationsContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const statutParam = searchParams.get("statut");
  const { user, isLoading: authLoading } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(
    statutParam !== null && VALID_TABS.includes(statutParam) ? statutParam : ""
  );
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [acting, setActing] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmReturn, setConfirmReturn] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || (user.role !== "proprietaire" && user.role !== "both" && user.role !== "admin")) return;
    load();

  }, [authLoading, user, tab, page]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || (user.role !== "proprietaire" && user.role !== "both" && user.role !== "admin")) return;
    loadCounts();

  }, [authLoading, user]);

  async function load() {
    setLoading(true);
    try {
      const res = await getOwnerLocations({ statut: tab || undefined, page, limit: PAGE_SIZE });
      setLocations(res.data);
      setTotal(res.total);
      setPages(res.pages);
    } catch {
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadCounts() {
    try {
      const results = await Promise.all(
        TABS.map((tb) => getOwnerLocations({ statut: tb.key || undefined, page: 1, limit: 1 }))
      );
      const next: Record<string, number> = {};
      TABS.forEach((tb, i) => { next[tb.key] = results[i].total; });
      setCounts(next);
    } catch {
      // Keep previous counts on failure — badges just won't update this time.
    }
  }

  async function act(id: string, action: "accept" | "reject" | "start" | "return") {
    setActing(id);
    setActionError(null);
    try {
      if (action === "accept")      await acceptLocation(id);
      else if (action === "reject") await rejectLocation(id);
      else if (action === "start")  await startLocation(id);
      else                          await returnMateriel(id);
      await Promise.all([load(), loadCounts()]);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erreur lors de l'action");
    } finally {
      setActing(null);
    }
  }

  function changeTab(key: string) {
    setTab(key);
    setPage(1);
    setActionError(null);
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#F97316] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-5">

        <motion.div variants={ITEM}>
          <h1 className="text-2xl font-black text-[#0F172A] lg:text-3xl">Demandes de location</h1>
          <p className="mt-1 text-sm text-slate-400">{total} demande{total !== 1 ? "s" : ""} au total</p>
        </motion.div>

        {actionError && (
          <motion.div variants={ITEM}>
            <Alert type="error">
              <span className="flex-1">{actionError}</span>
              <button onClick={() => setActionError(null)} className="ml-auto grid place-items-center">
                <X className="h-4 w-4" />
              </button>
            </Alert>
          </motion.div>
        )}

        <motion.div variants={ITEM}>
          <StatusTabs tabs={TABS} active={tab} counts={counts} onChange={changeTab} />
        </motion.div>

        <motion.div variants={ITEM}>
          <DashCard noPad>

            <div
              className="hidden items-center gap-4 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] md:grid"
              style={{ gridTemplateColumns: GRID_COLS, borderBottom: "1px solid #F1F5F9", background: "#FAFAFA" }}
            >
              <span>{t("table.materiel")}</span>
              <span>{t("auth.role_locataire")}</span>
              <span>{t("table.period")}</span>
              <span>{t("table.amount")}</span>
              <span className="text-right">{t("table.action")}</span>
            </div>

            {loading ? (
              <div className="space-y-2.5 p-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : locations.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
                  <Clock className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-600">
                  Aucune demande{tab ? ` — ${getStatutLabel(tab)}` : ""}
                </p>
                <p className="mt-1 text-xs text-slate-400">Rien à afficher pour ce filtre</p>
              </div>
            ) : (
              locations.map((loc, rowIdx) => (
                <OwnerLocationRow
                  key={loc._id}
                  loc={loc}
                  index={rowIdx}
                  gridCols={GRID_COLS}
                  acting={acting}
                  confirmReturn={confirmReturn}
                  onAct={act}
                  onConfirmReturn={setConfirmReturn}
                />
              ))
            )}

            {pages > 1 && (
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{ borderTop: "1px solid #F1F5F9", background: "#FAFAFA" }}
              >
                <p className="text-sm text-slate-400">
                  Page <strong className="text-[#0F172A]">{page}</strong> / {pages} · {total} demande{total !== 1 ? "s" : ""}
                </p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="grid h-8 w-8 place-items-center rounded-lg border bg-white text-slate-500 transition-all hover:border-slate-300 disabled:opacity-40"
                    style={{ borderColor: "#E2E8F0" }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page === pages}
                    className="grid h-8 w-8 place-items-center rounded-lg border bg-white text-slate-500 transition-all hover:border-slate-300 disabled:opacity-40"
                    style={{ borderColor: "#E2E8F0" }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </DashCard>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function ProprietaireLocationsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#F97316] border-t-transparent" /></div>}>
      <ProprietaireLocationsContent />
    </Suspense>
  );
}
