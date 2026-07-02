"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice, getApiBaseUrl, type Materiel } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";

function buildImgUrl(url: string) {
  if (url.startsWith("http")) return url;
  return `${getApiBaseUrl().replace("/api/v1", "")}/${url}`;
}

function getFirstPhoto(m: Materiel): string | null {
  if (m.photos && m.photos.length > 0) return buildImgUrl(m.photos[0].url);
  return null;
}

export function SimilarMateriels({ similar }: { similar: Materiel[] }) {
  const { t } = useI18n();
  if (similar.length === 0) return null;

  return (
    <section className="mt-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-bold text-ink">{t("catalogue.similar_materials")}</h2>
        <Link href="/catalogue" className="text-sm font-bold text-slate-700 hover:text-slate-950">{t("categories_section.view_all")}</Link>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {similar.map((m) => {
          const imgUrl = getFirstPhoto(m);
          const catNom = typeof m.categorieId === "object" ? m.categorieId?.nom : "";
          return (
            <Link key={m._id} href={`/materiel/${m._id}`} className="group rounded-xl bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="relative h-44 bg-gray-100">
                {imgUrl ? (
                  <Image src={imgUrl} alt={m.nom} fill className="object-contain p-4" sizes="300px" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted">{t("catalogue.no_image")}</div>
                )}
              </div>
              <div className="p-4">
                {catNom && <p className="text-xs font-bold uppercase tracking-wide text-muted mb-1">{catNom}</p>}
                <p className="font-bold text-ink text-sm line-clamp-1">{m.nom}</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-base font-black text-slate-950">{formatPrice(m.prixParJour)}</span>
                  <span className="text-xs text-muted">{t("catalogue.per_day")}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
