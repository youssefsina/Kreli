"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/api";
import { Inbox, Check, X } from "lucide-react";
import { DashCard, StatusPill } from "@/components/dashboard/DashboardUI";
import { formatDayMonth } from "@/lib/format";

type DemandeLocation = {
  _id: string;
  materielId: { nom: string };
  locataireId: { nom: string };
  dateDebut: string;
  dateFinPrevue: string;
  nbJours?: number;
  statut: string;
  montantLocation: number;
};

export function DemandesCard({
  locations,
  pending,
  acting,
  onAct,
}: {
  locations: DemandeLocation[];
  pending: number;
  acting: string | null;
  onAct: (id: string, action: "accept" | "reject") => void;
}) {
  return (
    <DashCard noPad className="flex flex-col">
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #F1F5F9" }}>
        <div className="flex items-center gap-2.5">
          <h2 className="font-bold text-[#0F172A]">Demandes</h2>
          {pending > 0 && (
            <span
              className="grid min-w-[20px] place-items-center rounded-full px-1.5 text-[10px] font-bold text-white"
              style={{ height: 18, background: "#F8812B" }}
            >
              {pending}
            </span>
          )}
        </div>
        <Link href="/dashboard/proprietaire/locations" className="text-xs font-semibold text-[#F97316] hover:underline">
          Tout voir
        </Link>
      </div>

      {locations.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50">
            <Inbox className="h-5 w-5 text-slate-300" />
          </div>
          <p className="text-sm text-slate-500">Aucune demande en attente</p>
        </div>
      ) : (
        locations.map((loc, i) => {
          const start = formatDayMonth(loc.dateDebut);
          const end = formatDayMonth(loc.dateFinPrevue);
          const days = loc.nbJours ?? Math.ceil((new Date(loc.dateFinPrevue).getTime() - new Date(loc.dateDebut).getTime()) / 86400000);
          return (
            <div key={loc._id} className="px-6 py-4" style={{ borderTop: i > 0 ? "1px solid #F1F5F9" : "none" }}>
              <div className="flex items-start justify-between gap-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[#0F172A]">{loc.locataireId?.nom}</p>
                  <p className="mt-0.5 truncate text-[13px] text-slate-500">{loc.materielId?.nom}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {start} → {end} · {days}j · {formatPrice(loc.montantLocation)}
                  </p>
                </div>
                <StatusPill statut={loc.statut} />
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => onAct(loc._id, "accept")}
                  disabled={acting === loc._id}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: "#F97316" }}
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Accepter
                </button>
                <button
                  onClick={() => onAct(loc._id, "reject")}
                  disabled={acting === loc._id}
                  className="flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold text-slate-500 transition-all hover:bg-slate-50 disabled:opacity-60"
                  style={{ borderColor: "#E2E8F0" }}
                >
                  <X className="h-3.5 w-3.5" />
                  Refuser
                </button>
              </div>
            </div>
          );
        })
      )}
    </DashCard>
  );
}
