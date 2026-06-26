"use client";

import { useState } from "react";
import { changePassword } from "@/lib/api";
import { Shield, Eye, EyeOff, Lock } from "lucide-react";
import { DashCard, Alert, FormField, DashInput } from "@/components/dashboard/DashboardUI";

export function SecurityForm() {
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState("");

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      setPwError("Les mots de passe ne correspondent pas");
      return;
    }
    setPwSaving(true);
    setPwError("");
    setPwSuccess(false);
    try {
      await changePassword({ currentPassword: pwForm.current, newPassword: pwForm.next });
      setPwSuccess(true);
      setPwForm({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwSuccess(false), 4000);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <DashCard>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50">
          <Shield className="h-4 w-4 text-slate-500" />
        </div>
        <div>
          <h2 className="font-bold text-[#0F172A]">Sécurité</h2>
          <p className="text-xs text-slate-400">Modifiez votre mot de passe</p>
        </div>
      </div>

      {pwSuccess && <div className="mb-5"><Alert type="success">Mot de passe mis à jour !</Alert></div>}
      {pwError && <div className="mb-5"><Alert type="error">{pwError}</Alert></div>}

      <form onSubmit={handlePasswordChange} className="space-y-4">
        <FormField label="Mot de passe actuel">
          <DashInput
            icon={Lock}
            type={showCurrent ? "text" : "password"}
            required
            value={pwForm.current}
            onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
            placeholder="••••••••"
            suffix={
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} tabIndex={-1}>
                {showCurrent ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
              </button>
            }
          />
        </FormField>

        <FormField label="Nouveau mot de passe">
          <DashInput
            icon={Lock}
            type={showNext ? "text" : "password"}
            required
            value={pwForm.next}
            onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
            placeholder="Min. 8 car., 1 majuscule, 1 chiffre"
            suffix={
              <button type="button" onClick={() => setShowNext(!showNext)} tabIndex={-1}>
                {showNext ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
              </button>
            }
          />
        </FormField>

        <FormField label="Confirmer le mot de passe">
          <DashInput
            icon={Lock}
            type="password"
            required
            value={pwForm.confirm}
            onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
            placeholder="••••••••"
          />
        </FormField>

        <button
          type="submit"
          disabled={pwSaving}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-60 hover:opacity-90"
          style={{ background: "#0F172A" }}
        >
          {pwSaving ? (
            <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />Mise à jour…</>
          ) : (
            <><Lock className="h-3.5 w-3.5" />Mettre à jour le mot de passe</>
          )}
        </button>
      </form>
    </DashCard>
  );
}
