"use client";

import { useEffect, useState } from "react";
import { Percent, Pencil } from "lucide-react";
import { getCommission, updateCommission } from "@/lib/api";
import { DashCard, CardHeader, Btn, DashInput, Alert } from "@/components/dashboard/DashboardUI";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export function CommissionCard() {
  const [taux, setTaux] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCommission()
      .then((res) => setTaux(res.taux))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function openModal() {
    setValue(taux !== null ? String(taux) : "");
    setError(null);
    setOpen(true);
  }

  async function handleSave() {
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
      setError("Entrez un pourcentage valide entre 0 et 100.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await updateCommission(parsed);
      setTaux(updated.taux);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <DashCard noPad>
        <CardHeader
          title="Commission de la plateforme"
          sub="Appliquée automatiquement à chaque nouvelle location"
          right={
            <Btn variant="secondary" size="sm" onClick={openModal}>
              <Pencil className="h-3.5 w-3.5" />
              Modifier
            </Btn>
          }
        />
        <div className="flex items-center gap-3 px-6 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: "#FFF7ED" }}>
            <Percent className="h-5 w-5" style={{ color: "#F97316" }} strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Taux actuel</p>
            <p className="mt-1 text-[22px] font-black leading-none text-[#0F172A]">
              {loading ? "…" : taux !== null ? `${taux}%` : "—"}
            </p>
          </div>
        </div>
      </DashCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Modifier la commission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-500">
              Ce taux s&apos;appliquera uniquement aux nouvelles locations créées après l&apos;enregistrement. Les locations existantes conservent leur commission d&apos;origine.
            </p>
            <DashInput
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              suffix={<span className="text-sm text-slate-400">%</span>}
              autoFocus
            />
            {error && <Alert type="error">{error}</Alert>}
          </div>
          <DialogFooter>
            <Btn variant="secondary" onClick={() => setOpen(false)} disabled={saving}>
              Annuler
            </Btn>
            <Btn variant="primary" onClick={handleSave} loading={saving} disabled={saving}>
              Enregistrer
            </Btn>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
