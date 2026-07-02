"use client";

import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  getMateriels, deleteMateriel, adminToggleFeatured, formatPrice,
  getMaterielImage, getEtatLabel, type Materiel,
} from "@/lib/api";
import { Package, Star, Trash2 } from "lucide-react";
import { DashCard, Alert, Pagination } from "@/components/dashboard/DashboardUI";
import { useI18n } from "@/context/I18nContext";

const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const ITEM = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.28 } } };

const GRID_COLS = "minmax(0,2fr) 130px 90px 100px 80px 110px";

const ETAT_CHIP: Record<string, { bg: string; color: string }> = {
  neuf: { bg: "#F0FDF4", color: "#16A34A" },
  bon_etat: { bg: "#EFF6FF", color: "#2563EB" },
  usage: { bg: "#FFF7ED", color: "#EA580C" },
};

function AdminMaterielsContent() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [materiels, setMateriels] = useState<Materiel[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const page = Number(searchParams.get("page")) || 1;

  useEffect(() => {
    setLoading(true);
    getMateriels({ page, limit: 20 })
      .then((res) => {
        setMateriels(res.data);
        setPagination({ page: res.page, pages: res.pages, total: res.total });
      })
      .catch(() => setError("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [page]);

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/dashboard/admin/materiels?${params}`);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce matériel définitivement ?")) return;
    setActionId(id);
    try {
      await deleteMateriel(id);
      setMateriels((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActionId(null);
    }
  }

  async function handleToggleFeatured(m: Materiel) {
    setActionId(m._id);
    try {
      const updated = await adminToggleFeatured(m._id, !m.featured);
      setMateriels((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-5">
        <motion.div variants={ITEM}>
          <h1 className="text-2xl font-black text-[#0F172A] lg:text-3xl">{t("dashboard.materials_admin")}</h1>
          <p className="mt-1 text-sm text-slate-400">{pagination.total} équipements listés</p>
        </motion.div>

        {error && <motion.div variants={ITEM}><Alert type="error">{error}</Alert></motion.div>}

        <motion.div variants={ITEM}>
          <DashCard noPad>
            <div
              className="hidden items-center gap-3 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] md:grid"
              style={{ gridTemplateColumns: GRID_COLS, borderBottom: "1px solid #F1F5F9", background: "#FAFAFA" }}
            >
              <span>{t("table.materiel")}</span><span>{t("catalogue.category")}</span><span>{t("table.price_day")}</span><span>{t("table.state")}</span><span>{t("table.featured")}</span>
              <span className="text-right">{t("table.action")}</span>
            </div>

            {loading ? (
              <div className="space-y-2.5 p-6">
                {[...Array(5)].map((_, i) => <div key={i} className="animate-pulse rounded-xl bg-slate-100" style={{ height: 52 }} />)}
              </div>
            ) : materiels.length === 0 ? (
              <div className="px-6 py-14 text-center"><p className="text-sm text-slate-500">Aucun matériel</p></div>
            ) : materiels.map((m, i) => {
              const img = getMaterielImage(m);
              const etatChip = ETAT_CHIP[m.etat ?? ""] ?? { bg: "#F1F5F9", color: "#64748B" };
              const isActing = actionId === m._id;
              return (
                <div
                  key={m._id}
                  className="flex flex-col gap-3 px-6 py-3.5 md:grid md:items-center md:gap-3"
                  style={{ gridTemplateColumns: GRID_COLS, borderTop: i > 0 ? "1px solid #F1F5F9" : "none" }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {img ? (
                        <Image src={img} alt={m.nom} fill className="object-cover" sizes="44px" />
                      ) : (
                        <div className="flex h-full items-center justify-center"><Package className="h-5 w-5 text-slate-300" /></div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#0F172A]">{m.nom}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-400">{m.localisation ?? ""}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">{typeof m.categorieId === "object" ? m.categorieId?.nom : "—"}</span>
                  <span className="text-sm font-bold text-[#0F172A]">{formatPrice(m.prixParJour)}</span>
                  <span className="w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: etatChip.bg, color: etatChip.color }}>
                    {getEtatLabel(m.etat)}
                  </span>
                  <button
                    onClick={() => handleToggleFeatured(m)}
                    disabled={isActing}
                    title={m.featured ? "Retirer de la vedette" : "Mettre en vedette"}
                    className="grid h-8 w-8 place-items-center rounded-lg transition-opacity hover:opacity-85 disabled:opacity-60"
                    style={{ background: m.featured ? "#F97316" : "#F1F5F9" }}
                  >
                    <Star className="h-3.5 w-3.5" fill={m.featured ? "#FFFFFF" : "none"} style={{ color: m.featured ? "#FFFFFF" : "#94A3B8" }} />
                  </button>
                  <div className="md:flex md:justify-end">
                    <button
                      onClick={() => handleDelete(m._id)}
                      disabled={isActing}
                      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50 disabled:opacity-60"
                      style={{ borderColor: "#FECACA" }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Supprimer
                    </button>
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

export default function AdminMaterielsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#F97316] border-t-transparent" /></div>}>
      <AdminMaterielsContent />
    </Suspense>
  );
}
