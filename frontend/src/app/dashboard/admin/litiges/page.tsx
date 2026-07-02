"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  getAdminAllLitiges, updateAdminLitige,
  type Litige,
} from "@/lib/api";
import { DashCard, Alert, Pagination, FIELD_CLASS } from "@/components/dashboard/DashboardUI";
import { formatShortDate } from "@/lib/format";
import { useI18n } from "@/context/I18nContext";

const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const ITEM = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.28 } } };

const GRID_COLS = "minmax(0,1.8fr) minmax(0,1.8fr) 110px 100px 100px 90px";

const STATUT_CHIP: Record<string, { bg: string; color: string; label: string }> = {
  ouvert:   { bg: "#FEF2F2", color: "#DC2626", label: "Ouvert" },
  en_cours: { bg: "#FFF7ED", color: "#EA580C", label: "En cours" },
  cloture:  { bg: "#F0FDF4", color: "#16A34A", label: "Clôturé" },
};

const SELECT_CLASS =
  "rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-xs text-[#0F172A] outline-none transition focus:border-[#F97316] focus:bg-white cursor-pointer";

function DecisionModal({
  litige,
  onClose,
  onSubmit,
}: {
  litige: Litige;
  onClose: () => void;
  onSubmit: (statut: string, decision: string) => void;
}) {
  const [statut, setStatut] = useState<string>(litige.statut);
  const [decision, setDecision] = useState(litige.decisionAdmin ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setSaving(true);
    try {
      await onSubmit(statut, decision);
    } finally {
      setSaving(false);
    }
  }

  const loc = litige.locationId;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(15,23,42,0.45)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-[20px] bg-white p-7"
        style={{ boxShadow: "0 24px 64px rgba(15,23,42,0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-black text-[#0F172A]">Gérer le litige</h3>
        <p className="mb-6 mt-1 text-[13px] text-slate-500">
          {loc?.materielId?.nom ?? "—"} · {loc?.locataireId?.nom ?? "—"}
        </p>

        <div className="mb-5 rounded-xl p-4" style={{ background: "#F8FAFC", border: "1px solid #F1F5F9" }}>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Description</p>
          <p className="text-[13px] leading-relaxed text-[#0F172A]">{litige.description}</p>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-[13px] font-semibold text-[#0F172A]">Statut</label>
            <select className={`${FIELD_CLASS} cursor-pointer`} value={statut} onChange={(e) => setStatut(e.target.value)}>
              <option value="ouvert">Ouvert</option>
              <option value="en_cours">En cours</option>
              <option value="cloture">Clôturé</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-[13px] font-semibold text-[#0F172A]">Décision / Note admin</label>
            <textarea
              rows={4}
              className={`${FIELD_CLASS} resize-y`}
              placeholder="Saisissez votre décision ou note…"
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border bg-white py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
            style={{ borderColor: "#E2E8F0" }}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
            style={{ background: "#F97316" }}
          >
            {saving ? "En cours…" : "Confirmer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminLitigesContent() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [litiges, setLitiges] = useState<Litige[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [statutFilter, setStatutFilter] = useState(searchParams.get("statut") ?? "");
  const [selected, setSelected] = useState<Litige | null>(null);
  const [error, setError] = useState("");

  const page = Number(searchParams.get("page")) || 1;

  useEffect(() => {
    setLoading(true);
    getAdminAllLitiges({ statut: statutFilter || undefined, page, limit: 20 })
      .then((res) => {
        setLitiges(res.data);
        setPagination({ page: res.page, pages: res.pages, total: res.total });
      })
      .catch(() => setError("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [page, statutFilter]);

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/dashboard/admin/litiges?${params}`);
  }

  async function handleUpdate(statut: string, decisionAdmin: string) {
    if (!selected) return;
    try {
      const updated = await updateAdminLitige(selected._id, { statut, decisionAdmin });
      setLitiges((prev) => prev.map((l) => (l._id === updated._id ? updated : l)));
      setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  return (
    <>
      <div className="p-6 lg:p-8">
        <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-5">
          <motion.div variants={ITEM} className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-[#0F172A] lg:text-3xl">{t("dashboard.disputes")}</h1>
              <p className="mt-1 text-sm text-slate-400">{pagination.total} dossier{pagination.total !== 1 ? "s" : ""}</p>
            </div>
            <select className={SELECT_CLASS} value={statutFilter} onChange={(e) => { setStatutFilter(e.target.value); router.push("/dashboard/admin/litiges?page=1"); }}>
              <option value="">Tous les statuts</option>
              <option value="ouvert">Ouvert</option>
              <option value="en_cours">En cours</option>
              <option value="cloture">Clôturé</option>
            </select>
          </motion.div>

          {error && <motion.div variants={ITEM}><Alert type="error">{error}</Alert></motion.div>}

          <motion.div variants={ITEM}>
            <DashCard noPad>
              <div
                className="hidden items-center gap-3 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] md:grid"
                style={{ gridTemplateColumns: GRID_COLS, borderBottom: "1px solid #F1F5F9", background: "#FAFAFA" }}
              >
                <span>{t("table.materiel")}</span><span>{t("table.opened_by")}</span><span>{t("table.status")}</span><span>{t("table.opened_on")}</span><span>{t("table.closed_on")}</span>
                <span className="text-right">{t("table.action")}</span>
              </div>

              {loading ? (
                <div className="space-y-2.5 p-6">
                  {[...Array(5)].map((_, i) => <div key={i} className="animate-pulse rounded-xl bg-slate-100" style={{ height: 52 }} />)}
                </div>
              ) : litiges.length === 0 ? (
                <div className="px-6 py-14 text-center"><p className="text-sm text-slate-500">Aucun litige</p></div>
              ) : litiges.map((l, i) => {
                const chip = STATUT_CHIP[l.statut] ?? { bg: "#F1F5F9", color: "#64748B", label: l.statut };
                const loc = l.locationId;
                return (
                  <div
                    key={l._id}
                    className="flex flex-col gap-3 px-6 py-3.5 md:grid md:items-center md:gap-3"
                    style={{ gridTemplateColumns: GRID_COLS, borderTop: i > 0 ? "1px solid #F1F5F9" : "none" }}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#0F172A]">{loc?.materielId?.nom ?? "—"}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-400">{loc?.locataireId?.nom ?? "—"}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#0F172A]">{l.ouvertPar?.nom ?? "—"}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-400">{l.ouvertPar?.email ?? ""}</p>
                    </div>
                    <span className="w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: chip.bg, color: chip.color }}>
                      {chip.label}
                    </span>
                    <span className="text-xs text-slate-400">
                      {l.openedAt ? formatShortDate(l.openedAt) : "—"}
                    </span>
                    <span className="text-xs text-slate-400">
                      {l.closedAt ? formatShortDate(l.closedAt) : "—"}
                    </span>
                    <div className="md:flex md:justify-end">
                      <button
                        onClick={() => setSelected(l)}
                        className="rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold text-[#0F172A] transition hover:bg-slate-50"
                        style={{ borderColor: "#E2E8F0" }}
                      >
                        Gérer
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

      {selected && (
        <DecisionModal
          litige={selected}
          onClose={() => setSelected(null)}
          onSubmit={handleUpdate}
        />
      )}
    </>
  );
}

export default function AdminLitigesPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#F97316] border-t-transparent" /></div>}>
      <AdminLitigesContent />
    </Suspense>
  );
}
