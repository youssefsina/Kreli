"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { getMyProfile, updateMyProfile, getLocataireStats, uploadMaterielImage, type AuthUser } from "@/lib/api";
import { User, Mail, Phone, MapPin, Save, Package, Wallet, Shield } from "lucide-react";
import { DashCard, Alert, FormField, DashInput, StatChip } from "@/components/dashboard/DashboardUI";
import { formatMonthYear } from "@/lib/format";
import { ProfileHeader } from "./ProfileHeader";
import { SecurityForm } from "./SecurityForm";
import { DeleteAccountCard } from "@/components/dashboard/DeleteAccountCard";
import { useI18n } from "@/context/I18nContext";

const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const ITEM = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function LocataireProfilePage() {
  const { t } = useI18n();
  const { user, isLoading: authLoading, updateUser } = useAuth();
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [stats, setStats] = useState<{ locations: { total: number }; totalDepenses: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ nom: "", telephone: "", adresse: "" });

  useEffect(() => {
    if (authLoading) return;
    Promise.all([getMyProfile(), getLocataireStats()])
      .then(([data, st]) => {
        setProfile(data);
        setStats(st);
        setForm({ nom: data.nom || "", telephone: data.telephone || "", adresse: data.adresse || "" });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authLoading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const updated = await updateMyProfile(form);
      setProfile(updated);
      updateUser(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.err_profile_update"));
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadMaterielImage(file);
      const updated = await updateMyProfile({ photo: url });
      setProfile(updated);
      updateUser(updated);
    } catch {}
  }

  const initials = profile?.nom
    ? profile.nom.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : user?.nom?.charAt(0).toUpperCase() ?? "U";

  const roleBadge =
    profile?.role === "both"
      ? t("dashboard.tenant_owner_badge")
      : profile?.role === "locataire"
      ? t("auth.role_locataire")
      : t("auth.role_proprietaire");

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
        onPhotoChange={handlePhotoChange}
      />

      {stats && (
        <motion.div variants={STAGGER} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <motion.div variants={ITEM}>
            <StatChip icon={Package} label={t("dashboard.total_rentals")} value={String(stats.locations.total)} color="#F97316" bg="#FFF7ED" />
          </motion.div>
          <motion.div variants={ITEM}>
            <StatChip
              icon={Wallet}
              label={t("dashboard.total_spent")}
              value={`${new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(stats.totalDepenses)} MAD`}
              color="#F97316"
              bg="#FFF7ED"
            />
          </motion.div>
          <motion.div variants={ITEM} className="col-span-2 sm:col-span-1">
            <StatChip
              icon={Shield}
              label={t("dashboard.account_status")}
              value={profile?.statut === "actif" ? t("common.active") : t("common.inactive")}
              color="#22C55E"
              bg="#F0FDF4"
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <FormField label={t("auth.full_name")}>
              <DashInput
                icon={User}
                type="text"
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
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all disabled:opacity-60 hover:opacity-90"
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

      <DeleteAccountCard />
    </div>
  );
}
