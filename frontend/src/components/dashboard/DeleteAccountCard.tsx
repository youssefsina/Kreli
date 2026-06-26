"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, Lock, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { deleteMyAccount } from "@/lib/api";

export function DeleteAccountCard() {
  const { logout } = useAuth();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setDeleting(true);
    try {
      await deleteMyAccount(password);
      logout();
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression");
      setDeleting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="rounded-[20px] border border-red-200 bg-red-50 p-6"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100">
          <AlertCircle className="h-4 w-4 text-red-500" />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-red-800">Zone de danger</h2>
          <p className="mt-1 text-xs text-red-600">
            La suppression de votre compte est irréversible. Toutes vos données seront perdues.
          </p>

          {confirming && (
            <form onSubmit={handleDelete} className="mt-4 space-y-3">
              <p className="text-xs font-medium text-red-700">
                Confirmez avec votre mot de passe pour supprimer définitivement votre compte.
              </p>
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2.5">
                <Lock className="h-4 w-4 text-red-400" />
                <input
                  type="password"
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  className="w-full bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-slate-400"
                />
              </div>
              {error && <p className="text-xs font-medium text-red-600">{error}</p>}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  disabled={deleting || !password}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                >
                  {deleting ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Suppression…
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Confirmer la suppression
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirming(false);
                    setPassword("");
                    setError("");
                  }}
                  disabled={deleting}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-slate-50 disabled:opacity-60"
                >
                  Annuler
                </button>
              </div>
            </form>
          )}
        </div>

        {!confirming && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer mon compte
          </button>
        )}
      </div>
    </motion.div>
  );
}
