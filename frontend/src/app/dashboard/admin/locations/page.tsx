"use client";

import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  getAdminAllLocations, getStatutLabel, formatPrice, getMaterielImage,
  type Location,
} from "@/lib/api";
import { Package } from "lucide-react";
import { DashCard, Alert, StatusPill, Pagination } from "@/components/dashboard/DashboardUI";
import { formatShortDate } from "@/lib/format";
import { useI18n } from "@/context/I18nContext";

const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const ITEM = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.28 } } };

const GRID_COLS = "minmax(0,1.8fr) minmax(0,1.1fr) minmax(0,1.1fr) 120px 110px 100px";

const SELECT_CLASS =
  "rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-xs text-[#0F172A] outline-none transition focus:border-[#F97316] focus:bg-white cursor-pointer";

function AdminLocationsContent() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [statutFilter, setStatutFilter] = useState(searchParams.get("statut") ?? "");
  const [error, setError] = useState("");

  const page = Number(searchParams.get("page")) || 1;

  useEffect(() => {
    setLoading(true);
    getAdminAllLocations({ statut: statutFilter || undefined, page, limit: 20 })
      .then((res) => {
        setLocations(res.data);
        setPagination({ page: res.page, pages: res.pages, total: res.total });
      })
      .catch(() => setError("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [page, statutFilter]);

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/dashboard/admin/locations?${params}`);
  }

  return (
    <div className="p-6 lg:p-8">
      <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-5">
        <motion.div variants={ITEM} className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#0F172A] lg:text-3xl">{t("dashboard.locations_admin")}</h1>
            <p className="mt-1 text-sm text-slate-400">{pagination.total} demandes au total</p>
          </div>
          <select
            className={SELECT_CLASS}
            value={statutFilter}
            onChange={(e) => { setStatutFilter(e.target.value); router.push("/dashboard/admin/locations?page=1"); }}
          >
            <option value="">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="acceptee">Acceptée</option>
            <option value="en_cours">En cours</option>
            <option value="terminee">Terminée</option>
            <option value="refusee">Refusée</option>
            <option value="annulee">Annulée</option>
          </select>
        </motion.div>

        {error && <motion.div variants={ITEM}><Alert type="error">{error}</Alert></motion.div>}

        <motion.div variants={ITEM}>
          <DashCard noPad>
            <div
              className="hidden items-center gap-3 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] md:grid"
              style={{ gridTemplateColumns: GRID_COLS, borderBottom: "1px solid #F1F5F9", background: "#FAFAFA" }}
            >
              <span>{t("table.materiel")}</span><span>{t("auth.role_locataire")}</span><span>{t("auth.role_proprietaire")}</span><span>{t("table.period")}</span><span>{t("table.amount")}</span><span>{t("table.status")}</span>
            </div>

            {loading ? (
              <div className="space-y-2.5 p-6">
                {[...Array(6)].map((_, i) => <div key={i} className="animate-pulse rounded-xl bg-slate-100" style={{ height: 52 }} />)}
              </div>
            ) : locations.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="text-sm text-slate-500">Aucune location{statutFilter ? ` avec le statut « ${getStatutLabel(statutFilter)} »` : ""}</p>
              </div>
            ) : locations.map((loc, i) => {
              const img = loc.materielId ? getMaterielImage(loc.materielId as Parameters<typeof getMaterielImage>[0]) : null;
              return (
                <div
                  key={loc._id}
                  className="flex flex-col gap-3 px-6 py-3.5 md:grid md:items-center md:gap-3"
                  style={{ gridTemplateColumns: GRID_COLS, borderTop: i > 0 ? "1px solid #F1F5F9" : "none" }}
                >

                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {img ? (
                        <Image src={img} alt="" fill className="object-cover" sizes="40px" />
                      ) : (
                        <div className="flex h-full items-center justify-center"><Package className="h-4 w-4 text-slate-300" /></div>
                      )}
                    </div>
                    <p className="truncate text-sm font-semibold text-[#0F172A]">
                      {typeof loc.materielId === "object" ? loc.materielId?.nom : "—"}
                    </p>
                  </div>

                  <span className="truncate text-xs text-slate-500">
                    {typeof loc.locataireId === "object" ? loc.locataireId?.nom : "—"}
                  </span>

                  <span className="truncate text-xs text-slate-500">
                    {typeof loc.materielId === "object" && typeof (loc.materielId as { proprietaireId?: { nom?: string } }).proprietaireId === "object"
                      ? (loc.materielId as { proprietaireId?: { nom?: string } }).proprietaireId?.nom ?? "—"
                      : "—"}
                  </span>

                  <div className="text-xs text-slate-400">
                    <div>{formatShortDate(loc.dateDebut)}</div>
                    <div>{formatShortDate(loc.dateFinPrevue)}</div>
                  </div>

                  <span className="text-sm font-bold text-[#0F172A]">{formatPrice(loc.montantLocation)}</span>

                  <StatusPill statut={loc.statut} />
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

export default function AdminLocationsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#F97316] border-t-transparent" /></div>}>
      <AdminLocationsContent />
    </Suspense>
  );
}
