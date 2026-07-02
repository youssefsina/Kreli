"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  getMyLocations,
  cancelLocation,
  returnMateriel,
  createLitige,
  type Location,
} from "@/lib/api";
import { Package, AlertCircle, CheckCircle2, Clock, Plus } from "lucide-react";
import { LitigeModal } from "./LitigeModal";
import { LocationRow } from "./LocationRow";
import { StatusTabs } from "@/components/dashboard/StatusTabs";
import { useI18n } from "@/context/I18nContext";

const TABS = [
  { key: "en_attente", label: "En attente", icon: Clock,          color: "#F59E0B" },
  { key: "acceptee",   label: "Acceptées",  icon: CheckCircle2,   color: "#10B981" },
  { key: "en_cours",   label: "En cours",   icon: Package,        color: "#3B82F6" },
  { key: "terminee",   label: "Terminées",  icon: CheckCircle2,   color: "#22C55E" },
  { key: "en_retard",  label: "En retard",  icon: AlertCircle,    color: "#EF4444" },
  { key: "en_litige",  label: "En litige",  icon: AlertCircle,    color: "#D97706" },
  { key: "",           label: "Toutes",     icon: Package,        color: "#64748B" },
];

const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const VALID_TABS = TABS.map((t) => t.key);

function LocationsPageContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const statutParam = searchParams.get("statut");
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(
    statutParam !== null && VALID_TABS.includes(statutParam) ? statutParam : "en_attente"
  );
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [litigeModal, setLitigeModal] = useState<{ id: string } | null>(null);
  const [litigeDesc, setLitigeDesc] = useState("");
  const [litigeLoading, setLitigeLoading] = useState(false);
  const [litigeError, setLitigeError] = useState<string | null>(null);

  useEffect(() => {
    getMyLocations({ limit: 200 })
      .then((locsRes) => setLocations(locsRes.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(
    () => ({
      en_attente: locations.filter((l) => l.statut === "en_attente").length,
      acceptee:   locations.filter((l) => l.statut === "acceptee").length,
      en_cours:   locations.filter((l) => l.statut === "en_cours").length,
      terminee:   locations.filter((l) => l.statut === "terminee").length,
      en_retard:  locations.filter((l) => l.statut === "en_retard").length,
      en_litige:  locations.filter((l) => l.statut === "en_litige").length,
      "":         locations.length,
    }),
    [locations]
  );

  const displayed = useMemo(
    () => (activeTab ? locations.filter((l) => l.statut === activeTab) : locations),
    [locations, activeTab]
  );

  async function handleCancel(id: string) {
    if (!confirm("Voulez-vous vraiment annuler cette location ?")) return;
    setActionLoading(id);
    try {
      const updated = await cancelLocation(id);
      setLocations((prev) => prev.map((l) => (l._id === id ? updated : l)));
    } catch {
      alert("Impossible d'annuler cette location.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReturn(id: string) {
    if (!confirm("Confirmez-vous le retour du matériel ?")) return;
    setActionLoading(id);
    try {
      const updated = await returnMateriel(id);
      setLocations((prev) => prev.map((l) => (l._id === id ? updated : l)));
    } catch {
      alert("Impossible de signaler le retour.");
    } finally {
      setActionLoading(null);
    }
  }

  function handleOpenLitige(id: string) {
    setLitigeModal({ id });
    setLitigeDesc("");
    setLitigeError(null);
  }

  async function handleSubmitLitige() {
    if (!litigeModal) return;
    if (litigeDesc.trim().length < 10) {
      setLitigeError("Description trop courte (10 caractères min)");
      return;
    }
    setLitigeLoading(true);
    setLitigeError(null);
    try {
      await createLitige(litigeModal.id, litigeDesc.trim());
      setLitigeModal(null);
      setLitigeDesc("");
    } catch (err) {
      setLitigeError(err instanceof Error ? err.message : "Erreur lors de l'ouverture du litige");
    } finally {
      setLitigeLoading(false);
    }
  }

  return (
    <div className="space-y-5 p-6 lg:p-8">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] lg:text-3xl">{t("dashboard.my_rentals")}</h1>

        </div>
          <Link
            href="/catalogue"
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            style={{ background: "#F8812B" }}
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            {t("dashboard.new_rental")}
          </Link>
      </div>

      <StatusTabs tabs={TABS} active={activeTab} counts={counts} onChange={setActiveTab} />

      <div
        className="overflow-x-auto rounded-[20px] bg-white"
        style={{ border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}
      >

        <div
          className="grid min-w-[840px] grid-cols-[56px_minmax(0,1fr)_200px_120px_220px] gap-4 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]"
          style={{ borderBottom: "1px solid #F1F5F9", background: "#FAFAFA" }}
        >
          <span />
          <span>{t("table.materiel")}</span>
          <span>{t("table.rental_period")}</span>
          <span className="text-right pr-7">{t("table.status")}</span>
          <span className="text-right">{t("table.action")}</span>
        </div>

        {loading ? (
          <div className="min-w-[840px] space-y-px">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="h-14 w-14 shrink-0 animate-pulse rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                </div>
                <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
                <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
                <div className="h-8 w-36 animate-pulse rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] bg-slate-50">
              <Package className="h-8 w-8 text-slate-200" />
            </div>
            <p className="font-semibold text-slate-500">Aucune location dans cette catégorie</p>

          </div>
        ) : (
          <motion.div variants={STAGGER} initial="hidden" animate="show">
            {displayed.map((loc, i) => (
              <LocationRow
                key={loc._id}
                loc={loc}
                index={i}
                onCancel={handleCancel}
                onReturn={handleReturn}
                onLitige={handleOpenLitige}
                actionLoading={actionLoading}
              />
            ))}
          </motion.div>
        )}

      </div>

      {litigeModal && (
        <LitigeModal
          desc={litigeDesc}
          error={litigeError}
          loading={litigeLoading}
          onDescChange={setLitigeDesc}
          onCancel={() => setLitigeModal(null)}
          onSubmit={handleSubmitLitige}
        />
      )}
    </div>
  );
}

export default function LocationsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#F97316] border-t-transparent" /></div>}>
      <LocationsPageContent />
    </Suspense>
  );
}
