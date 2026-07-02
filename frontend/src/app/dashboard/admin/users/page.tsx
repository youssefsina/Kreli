"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { getAdminAllUsers, updateUserStatus, type AuthUser } from "@/lib/api";
import { DashCard, Alert, Pagination } from "@/components/dashboard/DashboardUI";
import { formatShortDate } from "@/lib/format";
import { useI18n } from "@/context/I18nContext";

const SELECT_CLASS =
  "rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-xs text-[#0F172A] outline-none transition focus:border-[#F97316] focus:bg-white";

const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const ITEM = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.28 } } };

const GRID_COLS = "minmax(0,1.6fr) minmax(0,2fr) 110px 100px 100px 130px";

const ROLE_CHIP: Record<string, { bg: string; color: string; label: string }> = {
  admin:        { bg: "#F1F5F9", color: "#0F172A", label: "Admin" },
  proprietaire: { bg: "#EFF6FF", color: "#2563EB", label: "Propriétaire" },
  locataire:    { bg: "#F0FDF4", color: "#16A34A", label: "Locataire" },
  both:         { bg: "#FFF7ED", color: "#EA580C", label: "Les deux" },
};

const STATUT_CHIP: Record<string, { bg: string; color: string; label: string }> = {
  actif:    { bg: "#F0FDF4", color: "#16A34A", label: "Actif" },
  suspendu: { bg: "#FFF7ED", color: "#EA580C", label: "Suspendu" },
  bloque:   { bg: "#FEF2F2", color: "#DC2626", label: "Bloqué" },
};

function AdminUsersContent() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [roleFilter, setRoleFilter] = useState(searchParams.get("role") ?? "");
  const [statutFilter, setStatutFilter] = useState(searchParams.get("statut") ?? "");
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const page = Number(searchParams.get("page")) || 1;

  useEffect(() => {
    setLoading(true);
    getAdminAllUsers({ role: roleFilter || undefined, statut: statutFilter || undefined, page, limit: 20 })
      .then((res) => {
        setUsers(res.data);
        setPagination({ page: res.page, pages: res.pages, total: res.total });
      })
      .catch(() => setError("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [page, roleFilter, statutFilter]);

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/dashboard/admin/users?${params}`);
  }

  async function handleStatusChange(id: string, statut: "actif" | "suspendu" | "bloque") {
    setActionId(id);
    try {
      const updated = await updateUserStatus(id, statut);
      setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-5">
        <motion.div variants={ITEM} className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#0F172A] lg:text-3xl">{t("dashboard.users")}</h1>
            <p className="mt-1 text-sm text-slate-400">{pagination.total} comptes</p>
          </div>
          <div className="flex gap-2.5">
            <select
              className={SELECT_CLASS + " cursor-pointer"}
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); router.push("/dashboard/admin/users?page=1"); }}
            >
              <option value="">Tous les rôles</option>
              <option value="locataire">Locataire</option>
              <option value="proprietaire">Propriétaire</option>
              <option value="both">Les deux</option>
              <option value="admin">Admin</option>
            </select>
            <select
              className={SELECT_CLASS + " cursor-pointer"}
              value={statutFilter}
              onChange={(e) => { setStatutFilter(e.target.value); router.push("/dashboard/admin/users?page=1"); }}
            >
              <option value="">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="suspendu">Suspendu</option>
              <option value="bloque">Bloqué</option>
            </select>
          </div>
        </motion.div>

        {error && <motion.div variants={ITEM}><Alert type="error">{error}</Alert></motion.div>}

        <motion.div variants={ITEM}>
          <DashCard noPad>
            <div
              className="hidden items-center gap-3 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] md:grid"
              style={{ gridTemplateColumns: GRID_COLS, borderBottom: "1px solid #F1F5F9", background: "#FAFAFA" }}
            >
              <span>{t("table.name")}</span><span>{t("auth.email")}</span><span>{t("table.role")}</span><span>{t("table.status")}</span><span>{t("table.registration")}</span>
              <span className="text-right">{t("table.action")}</span>
            </div>

            {loading ? (
              <div className="space-y-2.5 p-6">
                {[...Array(6)].map((_, i) => <div key={i} className="h-13 animate-pulse rounded-xl bg-slate-100" style={{ height: 52 }} />)}
              </div>
            ) : users.length === 0 ? (
              <div className="px-6 py-14 text-center"><p className="text-sm text-slate-500">Aucun utilisateur</p></div>
            ) : users.map((u, i) => {
              const role = ROLE_CHIP[u.role] ?? { bg: "#F1F5F9", color: "#64748B", label: u.role };
              const statut = STATUT_CHIP[u.statut] ?? { bg: "#F1F5F9", color: "#64748B", label: u.statut };
              const ini = u.nom?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() ?? "?";
              return (
                <div
                  key={u._id}
                  className="flex flex-col gap-3 px-6 py-3.5 transition-opacity md:grid md:items-center md:gap-3"
                  style={{ gridTemplateColumns: GRID_COLS, borderTop: i > 0 ? "1px solid #F1F5F9" : "none", opacity: actionId === u._id ? 0.5 : 1 }}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: "#0F172A" }}>{ini}</div>
                    <span className="truncate text-sm font-semibold text-[#0F172A]">{u.nom}</span>
                  </div>
                  <span className="truncate text-xs text-slate-500">{u.email}</span>
                  <span className="w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: role.bg, color: role.color }}>
                    {role.label}
                  </span>
                  <span className="w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: statut.bg, color: statut.color }}>
                    {statut.label}
                  </span>
                  <span className="text-xs text-slate-400">
                    {u.createdAt ? formatShortDate(u.createdAt) : "—"}
                  </span>
                  {u.role !== "admin" ? (
                    <div className="md:flex md:justify-end">
                      <select
                        value={u.statut}
                        onChange={(e) => handleStatusChange(u._id, e.target.value as "actif" | "suspendu" | "bloque")}
                        disabled={actionId === u._id}
                        className={SELECT_CLASS + " cursor-pointer"}
                      >
                        <option value="actif">Actif</option>
                        <option value="suspendu">Suspendu</option>
                        <option value="bloque">Bloqué</option>
                      </select>
                    </div>
                  ) : (
                    <div />
                  )}
                </div>
              );
            })}
          </DashCard>
        </motion.div>

        {pagination.pages > 1 && (
          <motion.div variants={ITEM}>
            <Pagination page={page} pages={pagination.pages} onPage={goToPage} />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#F97316] border-t-transparent" /></div>}>
      <AdminUsersContent />
    </Suspense>
  );
}
