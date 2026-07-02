"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  getAdminAllPaiements, updateAdminPaiement, formatPrice,
  type Paiement,
} from "@/lib/api";
import { DashCard, Alert, StatusPill, Pagination } from "@/components/dashboard/DashboardUI";
import { formatShortDate } from "@/lib/format";
import { CommissionCard } from "./CommissionCard";

const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const ITEM = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.28 } } };

const GRID_COLS = "minmax(0,2fr) minmax(0,1.2fr) 100px 110px 100px 130px";

const SELECT_CLASS =
  "rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-xs text-[#0F172A] outline-none transition focus:border-[#F97316] focus:bg-white cursor-pointer";

const TYPE_LABEL: Record<string, string> = {
  location:              "Location",
  caution:               "Caution",
  remboursement:         "Remboursement",
  remboursement_partiel: "Remb. partiel",
  penalite:              "Pénalité",
  annulation:            "Annulation",
};

function AdminPaiementsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [statutFilter, setStatutFilter] = useState(searchParams.get("statut") ?? "");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") ?? "");
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const page = Number(searchParams.get("page")) || 1;

  useEffect(() => {
    setLoading(true);
    getAdminAllPaiements({ statut: statutFilter || undefined, type: typeFilter || undefined, page, limit: 20 })
      .then((res) => {
        setPaiements(res.data);
        setPagination({ page: res.page, pages: res.pages, total: res.total });
      })
      .catch(() => setError("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [page, statutFilter, typeFilter]);

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/dashboard/admin/paiements?${params}`);
  }

  async function handleStatutChange(id: string, statut: string) {
    setActionId(id);
    try {
      const updated = await updateAdminPaiement(id, { statut });
      setPaiements((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-5">
        <motion.div variants={ITEM} className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#0F172A] lg:text-3xl">Paiements</h1>
            <p className="mt-1 text-sm text-slate-400">{pagination.total} transactions</p>
          </div>
          <div className="flex gap-2.5">
            <select className={SELECT_CLASS} value={statutFilter} onChange={(e) => { setStatutFilter(e.target.value); router.push("/dashboard/admin/paiements?page=1"); }}>
              <option value="">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="paye">Payé</option>
              <option value="rembourse">Remboursé</option>
              <option value="partiellement_rembourse">Part. remboursé</option>
              <option value="retenu">Retenu</option>
              <option value="annule">Annulé</option>
            </select>
            <select className={SELECT_CLASS} value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); router.push("/dashboard/admin/paiements?page=1"); }}>
              <option value="">Tous les types</option>
              <option value="location">Location</option>
              <option value="caution">Caution</option>
              <option value="remboursement">Remboursement</option>
              <option value="remboursement_partiel">Remb. partiel</option>
              <option value="penalite">Pénalité</option>
              <option value="annulation">Annulation</option>
            </select>
          </div>
        </motion.div>

        <motion.div variants={ITEM}>
          <CommissionCard />
        </motion.div>

        {error && <motion.div variants={ITEM}><Alert type="error">{error}</Alert></motion.div>}

        <motion.div variants={ITEM}>
          <DashCard noPad>
            <div
              className="hidden items-center gap-3 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] md:grid"
              style={{ gridTemplateColumns: GRID_COLS, borderBottom: "1px solid #F1F5F9", background: "#FAFAFA" }}
            >
              <span>Locataire / Matériel</span><span>Type</span><span>Montant</span><span>Statut</span><span>Date</span>
              <span className="text-right">Action</span>
            </div>

            {loading ? (
              <div className="space-y-2.5 p-6">
                {[...Array(6)].map((_, i) => <div key={i} className="animate-pulse rounded-xl bg-slate-100" style={{ height: 52 }} />)}
              </div>
            ) : paiements.length === 0 ? (
              <div className="px-6 py-14 text-center"><p className="text-sm text-slate-500">Aucun paiement</p></div>
            ) : paiements.map((p, i) => {
              const loc = p.locationId;
              const isActing = actionId === p._id;
              return (
                <div
                  key={p._id}
                  className="flex flex-col gap-3 px-6 py-3.5 transition-opacity md:grid md:items-center md:gap-3"
                  style={{ gridTemplateColumns: GRID_COLS, borderTop: i > 0 ? "1px solid #F1F5F9" : "none", opacity: isActing ? 0.5 : 1 }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#0F172A]">{loc?.locataireId?.nom ?? "—"}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">{loc?.materielId?.nom ?? "—"}</p>
                  </div>
                  <span className="text-xs text-slate-500">{TYPE_LABEL[p.type] ?? p.type}</span>
                  <span className="text-sm font-bold text-[#0F172A]">{formatPrice(p.montant)}</span>
                  <StatusPill statut={p.statut} />
                  <span className="text-xs text-slate-400">
                    {p.createdAt ? formatShortDate(p.createdAt) : "—"}
                  </span>
                  <div className="md:flex md:justify-end">
                    <select
                      value={p.statut}
                      onChange={(e) => handleStatutChange(p._id, e.target.value)}
                      disabled={isActing}
                      className={SELECT_CLASS}
                    >
                      <option value="en_attente">En attente</option>
                      <option value="paye">Payé</option>
                      <option value="rembourse">Remboursé</option>
                      <option value="partiellement_rembourse">Part. remb.</option>
                      <option value="retenu">Retenu</option>
                      <option value="annule">Annulé</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </DashCard>
        </motion.div>

        {pagination.pages > 1 && (
          <motion.div variants={ITEM}>
            <Pagination page={page} pages={pagination.pages} onPage={goToPage} />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default function AdminPaiementsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#F97316] border-t-transparent" /></div>}>
      <AdminPaiementsContent />
    </Suspense>
  );
}
