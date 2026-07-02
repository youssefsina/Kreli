"use client";

import Image from "next/image";
import Link from "next/link";
import type { SyntheticEvent } from "react";
import { MapPin } from "lucide-react";
import { formatPrice, getMaterielImage, type Materiel } from "@/lib/api";

type ViewMode = "grid" | "list";

function onImageError(e: SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.onerror = null;
  e.currentTarget.src = "/placeholder.jpg";
}

export function ProductCard({ product, view }: { product: Materiel; view: ViewMode }) {
  const categorieNom = typeof product.categorieId === "object" ? product.categorieId?.nom : "Équipement";
  const imageUrl = getMaterielImage(product) ?? "/placeholder.jpg";
  const localisation = product.localisation || "Non spécifiée";

  if (view === "list") {
    return (
      <Link
        href={`/materiel/${product._id}`}
        className="group flex overflow-hidden rounded-2xl bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
      >
        <div className="relative h-auto min-h-[168px] w-[192px] shrink-0 overflow-hidden" style={{ backgroundColor: "var(--lm-bone)" }}>
          <Image
            src={imageUrl}
            alt={product.nom}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="192px"
            onError={onImageError}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span
            className="absolute left-3 top-3 rounded-md border border-white/70 bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-700"
            style={{
              boxShadow: "0 1px 3px rgba(15,23,42,0.08)",
            }}
          >
            {categorieNom}
          </span>
        </div>
        <div className="flex flex-1 flex-col justify-between p-5">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#94a3b8] ">
              <div
                className="flex h-5 w-5 items-center justify-center rounded-full"
                style={{ backgroundColor: "rgba(255,103,0,0.1)" }}
              >
                <MapPin className="h-2.5 w-2.5 shrink-0" style={{ color: "#ff6700" }} />
              </div>
              {localisation}
            </div>
            <h3 className="mt-2.5 text-lg font-black leading-snug text-[#0f172a] ">
              {product.nom}
            </h3>
          </div>
          <div>
            <div className="my-3 h-px" style={{ background: "linear-gradient(90deg, var(--lm-line) 0%, transparent 100%)" }} />
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-[#94a3b8] ">Caution : </span>
                <span className="text-sm font-bold text-[#334155] ">
                  {formatPrice(product.caution || 0)}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black" style={{ color: "#ff6700" }}>
                  {formatPrice(product.prixParJour)}
                </span>
                <span className="text-xs text-[#94a3b8] ">/ jour</span>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <span
                className="rounded-xl px-4 py-2 text-xs font-bold transition-all group-hover:shadow-md"
                style={{
                  background: "linear-gradient(135deg, #ff6700 0%, #ff8c38 100%)",
                  color: "#ffffff",
                  boxShadow: "0 2px 8px rgba(255,103,0,0.25)",
                }}
              >
                Voir les détails →
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/materiel/${product._id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
    >

      <div className="relative h-[200px] overflow-hidden" style={{ backgroundColor: "var(--lm-bone)" }}>
        <Image
          src={imageUrl}
          alt={product.nom}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          onError={onImageError}
        />

        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 60%)" }}
        />

        <span
          className="absolute left-3 top-3 rounded-md border border-white/70 bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-700"
          style={{
            boxShadow: "0 1px 3px rgba(15,23,42,0.08)",
          }}
        >
          {categorieNom}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-5 pt-4 pb-5">
        <div className="flex items-center gap-1.5 text-xs text-[#94a3b8] ">
          <div
            className="flex h-5 w-5 items-center justify-center rounded-full shrink-0"
            style={{ backgroundColor: "rgba(255,103,0,0.1)" }}
          >
            <MapPin className="h-2.5 w-2.5" style={{ color: "#ff6700" }} />
          </div>
          <span className="truncate">{localisation}</span>
        </div>
        <h3 className="mt-2.5 line-clamp-2 text-base font-black leading-snug text-[#0f172a] ">
          {product.nom}
        </h3>

        <div className="my-3 h-px" style={{ background: "linear-gradient(90deg, #f1f5f9 0%, transparent 100%)" }} />

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-[#94a3b8] ">Caution :</span>
          <span className="text-sm font-semibold text-[#334155] ">
            {formatPrice(product.caution || 0)}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black" style={{ color: "#ff6700" }}>
              {formatPrice(product.prixParJour)}
            </span>
            <span className="text-xs text-[#94a3b8] ">/ jour</span>
          </div>
          <span
            className="rounded-xl px-3 py-2 text-xs font-bold transition-all group-hover:shadow-md"
            style={{
              background: "linear-gradient(135deg, #ff6700 0%, #ff8c38 100%)",
              color: "#ffffff",
              boxShadow: "0 2px 6px rgba(255,103,0,0.2)",
            }}
          >
            Voir →
          </span>
        </div>
      </div>
    </Link>
  );
}
