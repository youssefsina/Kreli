"use client";

import Link from "next/link";
import Image from "next/image";
import { getMaterielImage } from "@/lib/api";
import { Package, Plus, ArrowRight } from "lucide-react";
import { DashCard } from "@/components/dashboard/DashboardUI";

type ParcMateriel = {
  _id: string;
  nom: string;
  photos?: { url: string }[];
  disponible?: boolean;
  prixParJour?: number;
  localisation?: string;
  nombreLocations?: number;
};

const TABLE_COLS = "64px minmax(0,1fr) 140px 100px 120px 100px";

export function ParcTable({
  materiels,
  totalMateriels,
  disponibles,
  enLocation,
}: {
  materiels: ParcMateriel[];
  totalMateriels: number;
  disponibles: number;
  enLocation: number;
}) {
  return (
    <DashCard noPad>
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #F1F5F9" }}>
        <div>
          <h2 className="font-bold text-[#0F172A]">Mon parc · {totalMateriels} matériel{totalMateriels !== 1 ? "s" : ""}</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            {disponibles} disponible{disponibles !== 1 ? "s" : ""} · {enLocation} en location
          </p>
        </div>
        <Link
          href="/dashboard/proprietaire/materiels"
          className="flex items-center gap-1.5 text-sm font-semibold text-[#F97316] hover:underline"
        >
          Gérer <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {materiels.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
            <Package className="h-6 w-6 text-slate-300" />
          </div>
          <p className="text-sm text-slate-500">Aucun matériel publié</p>
          <Link
            href="/dashboard/proprietaire/ajouter"
            className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            style={{ background: "#F97316" }}
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Ajouter un matériel
          </Link>
        </div>
      ) : (
        <>

          <div
            className="hidden items-center gap-4 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] sm:grid"
            style={{ gridTemplateColumns: TABLE_COLS, borderBottom: "1px solid #F1F5F9", background: "#FAFAFA" }}
          >
            <span />
            <span>Matériel</span>
            <span>Localisation</span>
            <span>Prix / j</span>
            <span>Statut</span>
            <span className="text-right">Action</span>
          </div>

          {materiels.map((m, i) => {
            const img = getMaterielImage(m as Parameters<typeof getMaterielImage>[0]);
            const isDisponible = m.disponible !== false;
            return (
              <div
                key={m._id}
                className="flex items-center gap-4 px-6 py-4 sm:grid sm:gap-4"
                style={{ borderTop: i > 0 ? "1px solid #F1F5F9" : "none", gridTemplateColumns: TABLE_COLS }}
              >

                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  {img ? (
                    <Image src={img} alt={m.nom} fill className="object-cover" sizes="56px" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package className="h-6 w-6 text-slate-300" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 sm:flex-none">
                  <p className="truncate text-sm font-semibold text-[#0F172A]">{m.nom}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {m.nombreLocations !== undefined ? `${m.nombreLocations}× loué` : "—"}
                  </p>
                </div>

                <p className="hidden truncate text-sm text-slate-500 sm:block">{m.localisation ?? "—"}</p>

                <p className="hidden text-sm font-bold text-[#0F172A] sm:block">
                  {m.prixParJour ?? "—"}
                  <span className="ml-0.5 text-xs font-medium text-slate-400">DH</span>
                </p>

                <span className="hidden sm:block">
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={isDisponible ? { background: "#F0FDF4", color: "#16A34A" } : { background: "#FFF7ED", color: "#EA580C" }}
                  >
                    {isDisponible ? "Disponible" : "Loué"}
                  </span>
                </span>

                <Link
                  href={`/dashboard/proprietaire/materiels/${m._id}/edit`}
                  className="shrink-0 text-right text-sm font-semibold text-[#F97316] hover:underline sm:block"
                >
                  Modifier
                </Link>
              </div>
            );
          })}
        </>
      )}
    </DashCard>
  );
}
