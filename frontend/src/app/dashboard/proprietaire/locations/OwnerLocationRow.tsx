"use client";

import Image from "next/image";
import { formatPrice, getMaterielImage, type Location } from "@/lib/api";
import { Package, Phone, Mail, Check, X, Play, RotateCcw } from "lucide-react";
import { StatusPill } from "@/components/dashboard/DashboardUI";
import { formatDayMonth } from "@/lib/format";

type Action = "accept" | "reject" | "start" | "return";

export function OwnerLocationRow({
  loc,
  index,
  gridCols,
  acting,
  confirmReturn,
  onAct,
  onConfirmReturn,
}: {
  loc: Location;
  index: number;
  gridCols: string;
  acting: string | null;
  confirmReturn: string | null;
  onAct: (id: string, action: Action) => void;
  onConfirmReturn: (id: string | null) => void;
}) {
  const img = getMaterielImage(loc.materielId as unknown as Parameters<typeof getMaterielImage>[0]);
  const start = formatDayMonth(loc.dateDebut);
  const end = new Date(loc.dateFinPrevue).toLocaleDateString("fr-MA", { day: "numeric", month: "short", year: "2-digit" });
  const locataire = loc.locataireId as unknown as { nom: string; email?: string; telephone?: string };
  const isActing = acting === loc._id;

  return (
    <div
      className="flex flex-col gap-4 px-6 py-4 transition-opacity md:grid md:items-center"
      style={{
        gridTemplateColumns: gridCols,
        borderTop: index > 0 ? "1px solid #F1F5F9" : "none",
        opacity: isActing ? 0.6 : 1,
      }}
    >

      <div className="flex min-w-0 items-center gap-3">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-slate-100">
          {img ? (
            <Image src={img} alt={loc.materielId.nom} fill className="object-cover" sizes="44px" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Package className="h-5 w-5 text-slate-300" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#0F172A]">{loc.materielId.nom}</p>
          <div className="mt-1">
            <StatusPill statut={loc.statut} />
          </div>
        </div>
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[#0F172A]">{locataire.nom}</p>
        <div className="mt-1 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[11px] text-slate-400">
          {locataire.telephone && (
            <span className="flex items-center gap-1">
              <Phone className="h-2.5 w-2.5" />
              {locataire.telephone}
            </span>
          )}
          {locataire.email && (
            <span className="flex max-w-[160px] items-center gap-1 truncate">
              <Mail className="h-2.5 w-2.5" />
              {locataire.email}
            </span>
          )}
        </div>
      </div>

      <div>
        <p className="text-[13px] text-[#0F172A]">{start} → {end}</p>
        <p className="mt-0.5 text-xs text-slate-400">{loc.nbJours} jour{loc.nbJours !== 1 ? "s" : ""}</p>
      </div>

      <div>
        <p className="text-sm font-bold text-[#0F172A]">{formatPrice(loc.montantLocation)}</p>
        {loc.montantNetProprio !== undefined && (
          <p className="mt-0.5 text-[11px] font-semibold text-emerald-600">
            Net : {formatPrice(loc.montantNetProprio)}
          </p>
        )}
      </div>

      <div className="flex justify-start gap-2 md:justify-end">
        {loc.statut === "en_attente" && (
          <>
            <button
              onClick={() => onAct(loc._id, "accept")}
              disabled={isActing}
              title="Accepter"
              className="grid h-9 w-9 place-items-center rounded-xl transition-opacity hover:opacity-85 disabled:opacity-60"
              style={{ background: "#F0FDF4", color: "#16A34A" }}
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => onAct(loc._id, "reject")}
              disabled={isActing}
              title="Refuser"
              className="grid h-9 w-9 place-items-center rounded-xl transition-opacity hover:opacity-85 disabled:opacity-60"
              style={{ background: "#FEF2F2", color: "#DC2626" }}
            >
              <X className="h-4 w-4" />
            </button>
          </>
        )}

        {loc.statut === "acceptee" && (
          <button
            onClick={() => onAct(loc._id, "start")}
            disabled={isActing}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-opacity hover:opacity-85 disabled:opacity-60"
            style={{ background: "#EFF6FF", color: "#2563EB" }}
          >
            <Play className="h-3 w-3" /> Démarrer
          </button>
        )}

        {loc.statut === "en_cours" && (
          confirmReturn === loc._id ? (
            <div className="flex gap-2">
              <button
                onClick={() => { onConfirmReturn(null); onAct(loc._id, "return"); }}
                disabled={isActing}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: "#F97316" }}
              >
                {isActing ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <RotateCcw className="h-3 w-3" />
                )}
                Confirmer
              </button>
              <button
                onClick={() => onConfirmReturn(null)}
                className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onConfirmReturn(loc._id)}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: "#0F172A" }}
            >
              <RotateCcw className="h-3 w-3" /> Retour
            </button>
          )
        )}
      </div>
    </div>
  );
}
