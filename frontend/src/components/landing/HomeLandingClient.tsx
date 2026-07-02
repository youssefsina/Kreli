"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

import MoroccoHeroSection from "@/components/landing/MoroccoHeroSection";
import { StaggerTestimonials } from "@/components/ui/stagger-testimonials";
import { useI18n } from "@/context/I18nContext";

export interface CategoryItem {
  _id: string;
  nom: string;
  slug: string;
  subtitle: string;
  image: string;
}

export interface FeaturedItem {
  _id: string;
  nom: string;
  localisation: string;
  prixParJour: number;
  caution: number;
  categorie: string;
  image: string;
}

interface Props {
  categories: CategoryItem[];
  featured: FeaturedItem[];
}

export default function HomeLandingClient({ categories, featured }: Props) {
  const { t } = useI18n();

  const STATS = [
    { value: 5, suffix: "k+", label: t("hero.stat_materials") },
    { value: 12, suffix: "k+", label: t("hero.stat_clients") },
    { value: 98, suffix: "%", label: t("hero.stat_cities") },
  ];

  return (
    <div>
      
      <MoroccoHeroSection />

      
      <section className="bg-[#f5f5f4] py-24">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-12 px-4">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex flex-col gap-4">
              <h2
                className="font-display font-black text-[36px] tracking-[-0.9px]"
                style={{ color: "#0f172a" }}
              >
                {t("categories_section.title")}
              </h2>
              <div
                className="h-[6px] w-24 rounded-full"
                style={{ backgroundColor: "#ff6700" }}
              />
            </div>
            <p
              className="max-w-[448px] text-[16px] font-medium leading-[24px]"
              style={{ color: "#64748b" }}
            >
              {t("categories_section.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                href={`/catalogue?categorie=${cat._id}`}
                className="group relative block h-[400px] overflow-hidden rounded-[16px] shadow-[0px_20px_25px_-5px_rgba(0,0,0,0.1),0px_8px_10px_-6px_rgba(0,0,0,0.1)]"
              >
                <Image
                  src={cat.image}
                  alt={cat.nom}
                  fill
                  className="object-cover"
                  sizes="(max-width:640px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-2 px-8 pb-[52px] pt-8">
                  <span
                    className="text-[14px] font-bold uppercase tracking-[1.4px]"
                    style={{ color: "#ff6700" }}
                  >
                    {cat.subtitle}
                  </span>
                  <span className="text-[24px] font-black leading-[32px] text-white">
                    {cat.nom}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      
      <section
        className="relative overflow-hidden bg-[#f5f5f4] py-24"
      >
        <div className="relative mx-auto flex max-w-[1280px] flex-col gap-12 px-4">
          
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex flex-col gap-4">
              <h2
                className="font-display font-black tracking-[-0.9px]"
                style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", color: "#0f172a" }}
              >
                {t("featured_section.title")}
              </h2>
              <div className="h-[6px] w-24 rounded-full" style={{ backgroundColor: "#ff6700" }} />
              <p className="max-w-[520px] text-[16px] font-medium text-[#64748b]">
                {t("featured_section.subtitle")}
              </p>
            </div>
            <Link
              href="/catalogue"
              className="flex shrink-0 items-center gap-2 rounded-full border px-5 py-2.5 text-[14px] font-bold"
              style={{
                borderColor: "rgba(0,0,0,0.12)",
                background: "rgba(0,0,0,0.04)",
                color: "#0f172a",
              }}
            >
              {t("featured_section.view_all")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((item) => (
              <Link
                key={item._id}
                href={`/materiel/${item._id}`}
                className="overflow-hidden rounded-2xl border"
                style={{
                  background: "#ffffff",
                  borderColor: "#e2e8f0",
                }}
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={item.image}
                    alt={item.nom}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <div className="space-y-3 p-5">
                  <p className="text-[11px] font-black uppercase tracking-wider text-[#ff6700]">
                    {item.categorie}
                  </p>
                  <h3 className="text-lg font-black text-[#0f172a]">
                    {item.nom}
                  </h3>
                  <div className="flex items-center gap-1.5 text-sm text-[#64748b]">
                    <MapPin className="h-4 w-4" />
                    {item.localisation}
                  </div>
                  <p className="font-black text-[#0f172a]">
                    {item.prixParJour} MAD
                    <span className="ml-1 text-xs font-medium text-[#64748b]">
                      {t("catalogue.per_day")}
                    </span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      
      <StaggerTestimonials />

      
      <section style={{ backgroundColor: "#ff6700" }} className="py-20">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-16 px-4">
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <h2 className="font-display font-black text-[36px] leading-[40px] text-white">
              {t("cta_section.title")}{" "}
              <span style={{ color: "rgba(255,255,255,0.75)" }}>Kreli</span>
            </h2>
            <p
              className="max-w-[512px] text-[18px] font-light leading-[29.25px]"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              {t("cta_section.subtitle")}
            </p>
          </div>

          <div className="flex shrink-0 gap-16">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-2">
                <span className="text-[48px] font-black leading-[48px] text-white">
                  {s.value}
                  {s.suffix}
                </span>
                <span
                  className="text-[12px] font-black uppercase tracking-[2.4px]"
                  style={{ color: "rgba(255,255,255,0.75)" }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
