"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { getCategories, createMateriel, uploadMaterielImage, type Category } from "@/lib/api";
import { ArrowLeft, ImageIcon, Package } from "lucide-react";
import { DashCard, Alert, FormField, DashInput, FIELD_CLASS } from "@/components/dashboard/DashboardUI";
import { PhotoUploader } from "./PhotoUploader";

const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const ITEM = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const ETAT_OPTIONS = [
  { value: "neuf",     label: "Neuf",     bg: "#F0FDF4", color: "#16A34A", border: "#16A34A" },
  { value: "bon_etat", label: "Bon état", bg: "#EFF6FF", color: "#2563EB", border: "#2563EB" },
  { value: "usage",    label: "Usagé",    bg: "#FFF7ED", color: "#EA580C", border: "#EA580C" },
];

export default function AjouterMaterielPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  const [form, setForm] = useState({
    nom: "",
    description: "",
    categorieId: "",
    prixParJour: "",
    caution: "",
    localisation: "",
    etat: "bon_etat" as "neuf" | "bon_etat" | "usage",
  });

  const [photos, setPhotos] = useState<{ url: string; preview: string }[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || (user.role !== "proprietaire" && user.role !== "both" && user.role !== "admin")) {
      router.push("/auth/login");
      return;
    }
    getCategories().then(setCategories).catch(() => {}).finally(() => setLoading(false));
  }, [authLoading, user, router]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = 6 - photos.length;
    const toProcess = Array.from(files).slice(0, remaining);

    for (const file of toProcess) {
      if (!file.type.startsWith("image/")) continue;
      const preview = URL.createObjectURL(file);
      const idx = photos.length;
      setPhotos((prev) => [...prev, { url: "", preview }]);
      setUploadingIdx(idx);
      try {
        const url = await uploadMaterielImage(file);
        setPhotos((prev) => prev.map((p, i) => (i === idx ? { url, preview } : p)));
      } catch {
        setPhotos((prev) => prev.filter((_, i) => i !== idx));
        setError("Erreur lors de l'upload d'une photo");
      }
      setUploadingIdx(null);
    }
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      URL.revokeObjectURL(prev[idx].preview);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.categorieId) return setError("Veuillez sélectionner une catégorie");
    if (photos.some((p) => !p.url)) return setError("Attendez que les photos finissent de s'uploader");

    setSaving(true);
    try {
      await createMateriel({
        nom: form.nom,
        description: form.description,
        categorieId: form.categorieId,
        prixParJour: Number(form.prixParJour),
        caution: Number(form.caution) || 0,
        localisation: form.localisation,
        etat: form.etat,
        photos: photos.map((p) => ({ url: p.url })),
      });
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/proprietaire/materiels"), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#F97316] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <motion.div variants={STAGGER} initial="hidden" animate="show" className="mx-auto max-w-3xl space-y-5">

        <motion.div variants={ITEM}>
          <Link
            href="/dashboard/proprietaire/materiels"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-[#0F172A]"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à mes matériels
          </Link>
        </motion.div>

        <motion.div variants={ITEM} className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "#FFF7ED" }}>
            <Package className="h-6 w-6" style={{ color: "#F97316" }} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#0F172A] lg:text-3xl">Ajouter un matériel</h1>
            <p className="mt-1 text-sm text-slate-400">Renseignez les informations de votre équipement</p>
          </div>
        </motion.div>

        {success && <motion.div variants={ITEM}><Alert type="success">Matériel créé avec succès ! Redirection en cours…</Alert></motion.div>}
        {error && <motion.div variants={ITEM}><Alert type="error">{error}</Alert></motion.div>}

        <motion.div variants={ITEM}>
          <DashCard>
            <form onSubmit={handleSubmit} className="space-y-5">

              <FormField label="Nom du matériel">
                <DashInput
                  required
                  type="text"
                  placeholder="Ex: Perceuse à percussion Makita 800W"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                />
              </FormField>

              <FormField label="Catégorie">
                <select
                  required
                  className={`${FIELD_CLASS} cursor-pointer`}
                  value={form.categorieId}
                  onChange={(e) => setForm({ ...form, categorieId: e.target.value })}
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.nom}</option>
                  ))}
                </select>
              </FormField>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField label="Prix / jour (DH)">
                  <DashInput
                    required
                    type="number"
                    min="1"
                    placeholder="150"
                    value={form.prixParJour}
                    onChange={(e) => setForm({ ...form, prixParJour: e.target.value })}
                  />
                </FormField>
                <FormField label="Caution (DH)">
                  <DashInput
                    type="number"
                    min="0"
                    placeholder="500"
                    value={form.caution}
                    onChange={(e) => setForm({ ...form, caution: e.target.value })}
                  />
                </FormField>
              </div>

              <FormField label="État du matériel">
                <div className="flex gap-2.5">
                  {ETAT_OPTIONS.map((opt) => {
                    const active = form.etat === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className="flex flex-1 cursor-pointer items-center justify-center rounded-xl py-2.5 text-[13px] font-bold transition-all"
                        style={{
                          border: `2px solid ${active ? opt.border : "#E2E8F0"}`,
                          background: active ? opt.bg : "transparent",
                          color: active ? opt.color : "#64748B",
                        }}
                      >
                        <input
                          type="radio"
                          name="etat"
                          value={opt.value}
                          checked={active}
                          onChange={() => setForm({ ...form, etat: opt.value as "neuf" | "bon_etat" | "usage" })}
                          className="hidden"
                        />
                        {opt.label}
                      </label>
                    );
                  })}
                </div>
              </FormField>

              <FormField label="Localisation">
                <DashInput
                  type="text"
                  placeholder="Ex: Agadir, Centre-ville"
                  value={form.localisation}
                  onChange={(e) => setForm({ ...form, localisation: e.target.value })}
                />
              </FormField>

              <FormField label="Description">
                <textarea
                  rows={4}
                  className={`${FIELD_CLASS} resize-y`}
                  placeholder="Décrivez votre matériel, ses caractéristiques, les conditions de location…"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </FormField>

              <FormField label="Photos" hint="max 6 · JPG, PNG, WebP">
                <PhotoUploader
                  photos={photos}
                  uploadingIdx={uploadingIdx}
                  onFiles={handleFiles}
                  onRemove={removePhoto}
                />
              </FormField>

              <button
                type="submit"
                disabled={saving || success}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: "#F97316", boxShadow: "0 4px 14px rgba(249,115,22,0.25)" }}
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Création en cours…
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4" />
                    Publier le matériel
                  </>
                )}
              </button>
            </form>
          </DashCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
