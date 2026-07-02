"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getCategories, createCategory, updateCategory, deleteCategory, type Category } from "@/lib/api";
import { Plus } from "lucide-react";
import { DashCard, Alert, DashInput } from "@/components/dashboard/DashboardUI";
import { useI18n } from "@/context/I18nContext";

const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const ITEM = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const GRID_COLS = "minmax(0,1fr) minmax(0,2fr) 170px";

function Modal({ title, onClose, onSubmit, loading, children }: {
  title: string; onClose: () => void; onSubmit: () => void; loading: boolean; children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(15,23,42,0.45)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[20px] bg-white p-7"
        style={{ boxShadow: "0 24px 64px rgba(15,23,42,0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-6 text-xl font-black text-[#0F172A]">{title}</h3>
        {children}
        <div className="mt-6 flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border bg-white py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
            style={{ borderColor: "#E2E8F0" }}
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="flex-1 rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
            style={{ background: "#F97316" }}
          >
            {loading ? t("auth.sending") : t("common.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCategoriesPage() {
  const { t } = useI18n();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [form, setForm] = useState({ nom: "", description: "", image: "" });

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function openAdd() { setForm({ nom: "", description: "", image: "" }); setShowAdd(true); }
  function openEdit(cat: Category) { setForm({ nom: cat.nom, description: cat.description ?? "", image: cat.image ?? "" }); setEditTarget(cat); }

  async function handleAdd() {
    if (!form.nom.trim()) return;
    setSaving(true); setError("");
    try {
      const created = await createCategory({ nom: form.nom.trim(), description: form.description, image: form.image });
      setCategories((prev) => [...prev, created]);
      setShowAdd(false);
    } catch (err) { setError(err instanceof Error ? err.message : "Erreur"); }
    finally { setSaving(false); }
  }

  async function handleEdit() {
    if (!editTarget || !form.nom.trim()) return;
    setSaving(true); setError("");
    try {
      const updated = await updateCategory(editTarget._id, { nom: form.nom.trim(), description: form.description, image: form.image });
      setCategories((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
      setEditTarget(null);
    } catch (err) { setError(err instanceof Error ? err.message : "Erreur"); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true); setError("");
    try {
      await deleteCategory(deleteTarget._id);
      setCategories((prev) => prev.filter((c) => c._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) { setError(err instanceof Error ? err.message : "Erreur"); }
    finally { setSaving(false); }
  }

  return (
    <>
      <div className="p-6 lg:p-8">
        <motion.div variants={STAGGER} initial="hidden" animate="show" className="space-y-5">
          <motion.div variants={ITEM} className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-[#0F172A] lg:text-3xl">{t("nav.categories")}</h1>
              <p className="mt-1 text-sm text-slate-400">{categories.length} catégorie{categories.length !== 1 ? "s" : ""}</p>
            </div>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              style={{ background: "#F8812B" }}
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Nouvelle catégorie
            </button>
          </motion.div>

          {error && <motion.div variants={ITEM}><Alert type="error">{error}</Alert></motion.div>}

          <motion.div variants={ITEM}>
            <DashCard noPad>
              <div
                className="hidden items-center px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] sm:grid"
                style={{ gridTemplateColumns: GRID_COLS, borderBottom: "1px solid #F1F5F9", background: "#FAFAFA" }}
              >
                <span>Nom</span><span>Description</span><span className="text-right">Actions</span>
              </div>
              {loading ? (
                <div className="space-y-3 p-6">
                  {[...Array(4)].map((_, i) => <div key={i} className="animate-pulse rounded-xl bg-slate-100" style={{ height: 44 }} />)}
                </div>
              ) : categories.length === 0 ? (
                <div className="px-6 py-14 text-center"><p className="text-sm text-slate-500">Aucune catégorie</p></div>
              ) : categories.map((cat, i) => (
                <div
                  key={cat._id}
                  className="flex flex-col gap-2 px-6 py-4 sm:grid sm:items-center"
                  style={{ gridTemplateColumns: GRID_COLS, borderTop: i > 0 ? "1px solid #F1F5F9" : "none" }}
                >
                  <span className="text-sm font-semibold text-[#0F172A]">{cat.nom}</span>
                  <span className="truncate text-sm text-slate-500">{cat.description ?? "—"}</span>
                  <div className="flex gap-2 sm:justify-end">
                    <button
                      onClick={() => openEdit(cat)}
                      className="rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold text-[#0F172A] transition hover:bg-slate-50"
                      style={{ borderColor: "#E2E8F0" }}
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => setDeleteTarget(cat)}
                      className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                      style={{ borderColor: "#FECACA" }}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </DashCard>
          </motion.div>
        </motion.div>
      </div>

      {showAdd && (
        <Modal title="Nouvelle catégorie" onClose={() => setShowAdd(false)} onSubmit={handleAdd} loading={saving}>
          <div className="flex flex-col gap-3.5">
            <DashInput placeholder="Nom *" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            <DashInput placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <DashInput placeholder="URL image (optionnel)" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
          </div>
        </Modal>
      )}
      {editTarget && (
        <Modal title="Modifier la catégorie" onClose={() => setEditTarget(null)} onSubmit={handleEdit} loading={saving}>
          <div className="flex flex-col gap-3.5">
            <DashInput placeholder="Nom *" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
            <DashInput placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <DashInput placeholder="URL image (optionnel)" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
          </div>
        </Modal>
      )}
      {deleteTarget && (
        <Modal title="Supprimer la catégorie" onClose={() => setDeleteTarget(null)} onSubmit={handleDelete} loading={saving}>
          <p className="text-sm text-slate-500">
            Êtes-vous sûr de vouloir supprimer <strong className="text-[#0F172A]">{deleteTarget.nom}</strong> ? Cette action est irréversible.
          </p>
        </Modal>
      )}
    </>
  );
}
