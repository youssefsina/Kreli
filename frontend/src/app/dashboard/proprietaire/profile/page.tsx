"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  getMyProfile, updateMyProfile, getOwnerStats,
  uploadMaterielImage, type AuthUser,
} from "@/lib/api";
import {
  Save, Package, Wallet, ClipboardList, TrendingUp, User, Mail, Phone, MapPin,
} from "lucide-react";
import { DashCard, Alert, FormField, DashInput, StatChip } from "@/components/dashboard/DashboardUI";
import { formatMonthYear } from "@/lib/format";
import { ProfileHeader } from "./ProfileHeader";
import { SecurityForm } from "./SecurityForm";
import { DeleteAccountCard } from "@/components/dashboard/DeleteAccountCard";
import { useI18n } from "@/context/I18nContext";

const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const ITEM = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.32 } } };

export default function ProprietaireProfilePage() {
  const { t } = useI18n();
  const { user, isLoading: authLoading, updateUser } = useAuth();
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [stats, setStats] = useState<{
    totalMateriels: number; disponibiles: number;
    locations: { enAttente: number; enCours: number; terminees: number; total: number };
    revenus: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ nom: "", telephone: "", adresse: "" });

  useEffect(() => {
    if (authLoading) return;
    Promise.all([getMyProfile(), getOwnerStats()])
      .then(([data, st]) => {
        setProfile(data);
        setStats(st);
        setForm({ nom: data.nom ?? "", telephone: data.telephone ?? "", adresse: data.adresse ?? "" });
      })
      .catch(() => setError(t("auth.err_profile_load")))
      .finally(() => setLoading(false));
  }, [authLoading]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError("");
    try {
      const updated = await updateMyProfile(form);
      setProfile(updated);
      updateUser(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.err_profile_update"));
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadMaterielImage(file);
      const updated = await updateMyProfile({ photo: url });
      setProfile(updated);
      updateUser(updated);
    } catch {
      setError(t("auth.err_photo_upload"));
    }
  }

  const initials = profile?.nom
    ? profile.nom.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : user?.nom?.charAt(0).toUpperCase() ?? "P";

  const roleBadge = profile?.role === "both" ? t("dashboard.owner_tenant_badge") : t("auth.role_proprietaire");

  const memberSince = profile?.createdAt ? formatMonthYear(profile.createdAt) : "—";

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#F97316] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <ProfileHeader
        photo={profile?.photo}
        nom={profile?.nom}
        email={profile?.email}
        initials={initials}
        roleBadge={roleBadge}
        memberSince={memberSince}
        statut={profile?.statut ?? "actif"}
        onPhotoChange={handlePhotoFile}
      />

      {stats && (
        <motion.div variants={STAGGER} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <motion.div variants={ITEM}>
            <StatChip icon={Package} label={t("dashboard.materials_published")} value={String(stats.totalMateriels)} color="#F97316" bg="#FFF7ED" />
          </motion.div>
          <motion.div variants={ITEM}>
            <StatChip icon={ClipboardList} label={t("dashboard.requests_received")} value={String(stats.locations.total)} color="#2563EB" bg="#EFF6FF" />
          </motion.div>
          <motion.div variants={ITEM}>
            <StatChip icon={TrendingUp} label={t("dashboard.in_progress")} value={String(stats.locations.enCours)} color="#16A34A" bg="#F0FDF4" />
          </motion.div>
          <motion.div variants={ITEM}>
            <StatChip
              icon={Wallet}
              label={t("dashboard.net_revenue")}
              value={`${new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(stats.revenus)} MAD`}
              color="#F97316"
              bg="#FFF7ED"
            />
          </motion.div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <DashCard>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50">
              <User className="h-4 w-4 text-slate-500" />
            </div>
            <div>
              <h2 className="font-bold text-[#0F172A]">{t("dashboard.personal_info")}</h2>
              <p className="text-xs text-slate-400">{t("dashboard.personal_info_subtitle")}</p>
            </div>
          </div>

          {success && <div className="mb-5"><Alert type="success">{t("dashboard.profile_updated")}</Alert></div>}
          {error && <div className="mb-5"><Alert type="error">{error}</Alert></div>}

          <form onSubmit={handleSave} className="space-y-5">
            <FormField label={t("auth.full_name")}>
              <DashInput
                icon={User}
                type="text"
                required
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder={t("auth.full_name")}
              />
            </FormField>

            <FormField label={t("auth.email")} hint={t("common.not_editable")}>
              <DashInput icon={Mail} type="email" value={profile?.email || ""} disabled placeholder="—" />
            </FormField>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField label={t("auth.phone")}>
                <DashInput
                  icon={Phone}
                  type="tel"
                  value={form.telephone}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  placeholder="+212 6 00 00 00 00"
                />
              </FormField>
              <FormField label={t("auth.address")}>
                <DashInput
                  icon={MapPin}
                  type="text"
                  value={form.adresse}
                  onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                  placeholder={t("auth.address")}
                />
              </FormField>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: "#F97316", boxShadow: "0 4px 14px rgba(249,115,22,0.25)" }}
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t("dashboard.saving")}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {t("dashboard.save_changes")}
                </>
              )}
            </button>
          </form>
        </DashCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <SecurityForm />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <DashCard>
          <h2 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">{t("dashboard.account_section")}</h2>
          <div className="space-y-3">
            {[
              { label: t("table.role"), value: roleBadge },
              { label: t("table.status"), value: profile?.statut ?? "actif" },
              { label: t("hero.stat_materials"), value: `${stats?.disponibiles ?? 0} / ${stats?.totalMateriels ?? 0}` },
              { label: t("dashboard.completed_rentals"), value: String(stats?.locations.terminees ?? 0) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-slate-500">{label}</span>
                <span className="text-sm font-semibold text-[#0F172A]">{value}</span>
              </div>
            ))}
          </div>
        </DashCard>
      </motion.div>

      <DeleteAccountCard />
    </div>
  );
}
