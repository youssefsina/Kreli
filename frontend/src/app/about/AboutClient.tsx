"use client";

import Link from "next/link";
import { MapPin, Mail, ArrowRight, CheckCircle } from "lucide-react";
import { useI18n } from "@/context/I18nContext";
import { AboutValues } from "./AboutValues";
import { AboutTeam } from "./AboutTeam";

export default function AboutClient() {
  const { t } = useI18n();

  const STATS = [
    { value: "5 000+", label: t("about.stat_refs") },
    { value: "12 000+", label: t("about.stat_contracts") },
    { value: "98 %", label: t("about.stat_satisfaction") },
    { value: "8", label: t("about.stat_cities") },
  ];

  const HOW = [
    t("about.step1"),
    t("about.step2"),
    t("about.step3"),
    t("about.step4"),
  ];

  return (
    <div className="bg-[#f5f5f4]" style={{ color: "var(--lm-ink)" }}>

      
      <section style={{ background: "var(--lm-surface-inverted)", position: "relative", overflow: "hidden" }}>
        
        <div
          style={{
            position: "absolute", inset: 0, opacity: 0.04,
            backgroundImage: "linear-gradient(var(--lm-line) 1px, transparent 1px), linear-gradient(90deg, var(--lm-line) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        
        <div style={{ position: "absolute", top: -120, right: -80, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,103,0,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-24 sm:py-32" style={{ position: "relative", zIndex: 1 }}>
          <h1
            className="ab-hero-title font-display font-black leading-none"
            style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)", color: "var(--lm-paper)" }}
          >
            {t("about.title_a")}
            <br />
            <span style={{ color: "#ff6700" }}>{t("about.title_b")}</span>
          </h1>
          <p
            className="ab-hero-body mt-6 max-w-2xl text-[17px] font-light leading-relaxed"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            {t("about.intro")}
          </p>
          <div className="ab-hero-cta mt-10 flex flex-wrap gap-3">
            <Link
              href="/catalogue"
              className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-black text-white transition-all hover:scale-105 hover:shadow-lg"
              style={{ background: "#ff6700", boxShadow: "0 4px 18px rgba(255,103,0,0.35)" }}
            >
              {t("about.cta_catalogue")} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 rounded-full border px-7 py-3.5 text-[15px] font-black transition-colors hover:bg-white/10"
              style={{ borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.85)" }}
            >
              {t("about.cta_join")}
            </Link>
          </div>
        </div>
      </section>

      
      <section style={{ background: "var(--lm-surface-card)", borderBottom: "1px solid var(--lm-line)" }}>
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 py-10">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="ab-stat flex flex-col gap-1">
                <span
                  className="font-display font-black"
                  style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", color: "#ff6700", lineHeight: 1 }}
                >
                  {s.value}
                </span>
                <span className="text-[13px] font-medium" style={{ color: "var(--lm-mid)" }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      <section className="bg-[#f5f5f4] py-20 sm:py-28">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="ab-heading mb-3 text-[11px] font-black uppercase tracking-[2px]" style={{ color: "#ff6700" }}>
                {t("about.mission_label")}
              </p>
              <h2
                className="ab-heading font-display font-black leading-tight"
                style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", color: "var(--lm-ink)" }}
              >
                {t("about.mission_title_a")}
                <br />
                {t("about.mission_title_b")}
              </h2>
              <p className="mt-6 text-[16px] leading-relaxed" style={{ color: "var(--lm-mid)" }}>
                {t("about.mission_body_a")}
              </p>
              <p className="mt-4 text-[16px] leading-relaxed" style={{ color: "var(--lm-mid)" }}>
                {t("about.mission_body_b")}
              </p>
            </div>

            <div
              className="rounded-2xl p-8"
              style={{ background: "var(--lm-surface-card)", border: "1px solid var(--lm-line)" }}
            >
              <p className="mb-6 text-[13px] font-black uppercase tracking-[1.5px]" style={{ color: "var(--lm-muted)" }}>
                {t("about.for_owners")}
              </p>
              <div className="flex flex-col gap-4">
                {HOW.map((step, i) => (
                  <div key={i} className="ab-how-item flex items-start gap-4">
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-black text-white"
                      style={{ background: "#ff6700" }}
                    >
                      {i + 1}
                    </div>
                    <p className="text-[15px] leading-relaxed" style={{ color: "var(--lm-char)" }}>
                      {step}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-8 h-px" style={{ background: "var(--lm-line)" }} />
              <div className="mt-6 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 shrink-0" style={{ color: "#ff6700" }} />
                <p className="text-[14px] font-semibold" style={{ color: "var(--lm-ink)" }}>
                  {t("about.transparent")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      
      <AboutValues />

      
      <AboutTeam />

      
      <section style={{ background: "var(--lm-surface-inverted)", position: "relative", overflow: "hidden" }} className="py-20">
        <div style={{ position: "absolute", bottom: -100, left: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,103,0,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6" style={{ position: "relative", zIndex: 1 }}>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2
                className="ab-heading font-display font-black leading-tight"
                style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", color: "var(--lm-paper)" }}
              >
                {t("about.contact_title_a")}
                <br />
                <span style={{ color: "#ff6700" }}>{t("about.contact_title_b")}</span>
              </h2>
              <p className="mt-4 text-[16px] font-light leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                {t("about.contact_body")}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="mailto:contact@kreli.ma"
                  className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-black text-white transition-all hover:scale-105"
                  style={{ background: "#ff6700", boxShadow: "0 4px 18px rgba(255,103,0,0.35)" }}
                >
                  <Mail className="h-4 w-4" />
                  contact@kreli.ma
                </Link>
              </div>
            </div>

            <div
              className="rounded-2xl p-8"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <div className="flex items-center gap-3 mb-6">
                <MapPin className="h-5 w-5 shrink-0" style={{ color: "#ff6700" }} />
                <p className="text-[15px] font-semibold" style={{ color: "var(--lm-paper)" }}>{t("about.address")}</p>
              </div>
              <p className="text-[14px] leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                {t("about.coverage_body")}
              </p>
              <div className="mt-8 flex flex-col gap-2.5">
                {["Agadir", "Casablanca", "Marrakech", "Rabat", "Fès", "Tanger"].map((v) => (
                  <div key={v} className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full" style={{ background: "#ff6700" }} />
                    <span className="text-[13px] font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
