"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, getMaterielImage, type Location, type Materiel } from "@/lib/api";
import { Package, MapPin, Eye, RotateCcw, X, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/dashboard/DashboardUI";

const ITEM = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.35 } }),
};

function daysRemaining(dateStr: string): { days: number; overdue: boolean } {
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.ceil(diff / 86400000);
  return { days: Math.abs(days), overdue: days < 0 };
}

function formatDateRange(start: string, end: string) {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("fr-MA", { day: "numeric", month: "short", year: "numeric" });
  return `${fmt(start)} → ${fmt(end)}`;
}

export function LocationRow({
  loc,
  index,
  onCancel,
  onReturn,
  onLitige,
  actionLoading,
}: {
  loc: Location;
  index: number;
  onCancel: (id: string) => void;
  onReturn: (id: string) => void;
  onLitige: (id: string) => void;
  actionLoading: string | null;
}) {
  const img = getMaterielImage(loc.materielId as unknown as Materiel);
  const ref = `LOC-${loc._id.slice(-5).toUpperCase()}`;
  const canCancel = loc.statut === "en_attente" || loc.statut === "acceptee";
  const canReturn = loc.statut === "en_cours" || loc.statut === "en_retard" || loc.statut === "acceptee";
  const canLitige = ["acceptee", "en_cours", "terminee", "en_retard"].includes(loc.statut);
  const { days, overdue } = daysRemaining(loc.dateFinPrevue);
  const isLoading = actionLoading === loc._id;

  return (
    <motion.div
      custom={index}
      variants={ITEM}
      initial="hidden"
      animate="show"
      className="group grid min-w-[840px] grid-cols-[56px_minmax(0,1fr)_200px_120px_220px] items-center gap-4 px-5 py-4 transition-colors last:border-0"
      style={{ borderBottom: "1px solid #F8FAFC" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#FAFAFA"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
    >

      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
        {img ? (
          <Image src={img} alt={loc.materielId.nom} fill className="object-cover" sizes="56px" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-6 w-6 text-slate-300" />
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate font-semibold text-[#0F172A]">{loc.materielId.nom}</p>
        <p className="text-xs text-slate-400">Réf : {ref}</p>
        {loc.materielId.localisation && (
          <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
            <MapPin className="h-3 w-3" />
            {loc.materielId.localisation}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm text-[#0F172A]">{formatDateRange(loc.dateDebut, loc.dateFinPrevue)}</p>
        {(loc.statut === "en_cours" || loc.statut === "en_retard") && (
          <p
            className={cn(
              "mt-0.5 text-xs font-semibold",
              overdue ? "text-red-500" : days === 0 ? "text-amber-500" : "text-slate-400"
            )}
          >
            {overdue
              ? `${days} jour${days > 1 ? "s" : ""} de retard`
              : days === 0
              ? "Retour aujourd'hui"
              : `${days} jour${days > 1 ? "s" : ""} restant${days > 1 ? "s" : ""}`}
          </p>
        )}
      </div>

      <div className="text-right">
        <StatusPill statut={loc.statut} />
        <p className="mt-1.5 text-sm font-bold text-[#F97316]">{formatPrice(loc.montantLocation)}</p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {canReturn && (
          <button
            onClick={() => onReturn(loc._id)}
            disabled={isLoading}
            className="flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-xs font-bold text-white transition-all disabled:opacity-60 hover:opacity-90"
            style={{ background: "#0F172A" }}
          >
            {isLoading ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
            Signaler le retour
          </button>
        )}
        {canCancel && (
          <button
            onClick={() => onCancel(loc._id)}
            disabled={isLoading}
            className="flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-red-200 px-3 text-xs font-semibold text-red-500 transition-all hover:bg-red-50 disabled:opacity-60"
          >
            <X className="h-3.5 w-3.5" />
            Annuler
          </button>
        )}
        {canLitige && (
          <button
            onClick={() => onLitige(loc._id)}
            disabled={isLoading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-200 text-amber-500 transition-all hover:bg-amber-50 disabled:opacity-60"
            title="Ouvrir un litige"
          >
            <Flag className="h-4 w-4" />
          </button>
        )}
        <Link
          href={`/materiel/${loc.materielId._id}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-all hover:border-slate-300 hover:text-[#0F172A]"
        >
          <Eye className="h-4 w-4" />
        </Link>
      </div>
    </motion.div>
  );
}
