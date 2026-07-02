"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { getAdminStats, getAdminLitigesStats, getAdminPaiementsStats, formatPrice } from "@/lib/api";
import {
  Wallet, Users, Package, Inbox, Tag, DollarSign, AlertTriangle, ArrowRight,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/DashboardUI";
import { useI18n } from "@/context/I18nContext";

const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const ITEM = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

interface AdminStats {
  totalUsers: number;
  totalMateriels: number;
  totalLocations: number;
  locationsActives: number;
  totalRevenus: number;
}

const QUICK_LINKS = [
  { href: "/dashboard/admin/categories", label: "Catégories", desc: "Gérer les catégories", icon: Tag },
  { href: "/dashboard/admin/materiels", label: "Matériels", desc: "Modérer les équipements", icon: Package },
  { href: "/dashboard/admin/paiements", label: "Paiements", desc: "Suivi des transactions", icon: DollarSign },
  { href: "/dashboard/admin/litiges", label: "Litiges", desc: "Résoudre les conflits", icon: AlertTriangle },
  { href: "/dashboard/admin/users", label: "Utilisateurs", desc: "Gérer les comptes", icon: Users },
];

export default function AdminDashboardPage() {
  const { t } = useI18n();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [litigesOuverts, setLitigesOuverts] = useState(0);
  const [paiementsEnAttente, setPaiementsEnAttente] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAdminStats(), getAdminLitigesStats(), getAdminPaiementsStats()])
      .then(([s, l, p]) => {
        setStats(s);
        setLitigesOuverts(l.ouverts);
        setPaiementsEnAttente(p.enAttente);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const dateLabel = now.toLocaleDateString("fr-MA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-6 h-8 w-64 animate-pulse rounded-xl bg-white" style={{ border: "1px solid #E2E8F0" }} />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-[20px] bg-white" style={{ border: "1px solid #E2E8F0" }} />
          ))}
        </div>
      </div>
    );
  }

  const alerts = [
    litigesOuverts > 0 && {
      href: "/dashboard/admin/litiges",
      label: `${litigesOuverts} litige${litigesOuverts > 1 ? "s" : ""} ouvert${litigesOuverts > 1 ? "s" : ""}`,
      desc: "Nécessite votre attention",
      color: "#DC2626",
      bg: "#FEF2F2",
      border: "#FECACA",
    },
    paiementsEnAttente > 0 && {
      href: "/dashboard/admin/paiements",
      label: `${paiementsEnAttente} paiement${paiementsEnAttente > 1 ? "s" : ""} en attente`,
      desc: "À valider ou rembourser",
      color: "#B45309",
      bg: "#FFFBEB",
      border: "#FDE68A",
    },
  ].filter(Boolean) as { href: string; label: string; desc: string; color: string; bg: string; border: string }[];

  return (
    <div className="p-6 lg:p-8">
      <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-5">

        <motion.div variants={ITEM}>
          <h1 className="text-2xl font-black text-[#0F172A] lg:text-3xl">{t("dashboard.administration")}</h1>
          <p className="mt-1 text-sm capitalize text-slate-400">{dateLabel}</p>
        </motion.div>

        {alerts.length > 0 && (
          <motion.div variants={ITEM} className="flex flex-col gap-2.5">
            {alerts.map((a) => (
              <Link key={a.href} href={a.href}>
                <div
                  className="flex items-center gap-3.5 rounded-[20px] px-5 py-3.5"
                  style={{ border: `1px solid ${a.border}`, background: a.bg }}
                >
                  <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: a.color }} />
                  <div className="flex-1">
                    <p className="text-sm font-bold" style={{ color: a.color }}>{a.label}</p>
                    <p className="mt-0.5 text-xs" style={{ color: a.color, opacity: 0.7 }}>{a.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4" style={{ color: a.color }} />
                </div>
              </Link>
            ))}
          </motion.div>
        )}

        <motion.div variants={ITEM} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={Wallet} label="Revenus totaux" value={formatPrice(stats?.totalRevenus ?? 0)} sub="Paiements confirmés" accent />
          <StatCard icon={Users} label="Utilisateurs" value={stats?.totalUsers ?? 0} sub="Comptes actifs" />
          <StatCard icon={Package} label="Matériels" value={stats?.totalMateriels ?? 0} sub="Équipements listés" />
          <StatCard icon={Inbox} label="Locations actives" value={stats?.locationsActives ?? 0} sub={`${stats?.totalLocations ?? 0} au total`} />
        </motion.div>

        <motion.div variants={ITEM}>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Accès rapide</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {QUICK_LINKS.map(({ href, label, desc, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col gap-3 rounded-[20px] bg-white p-5 transition-shadow hover:shadow-md"
                style={{ border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "#F8FAFC" }}>
                  <Icon className="h-5 w-5 text-[#64748B]" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0F172A]">{label}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
