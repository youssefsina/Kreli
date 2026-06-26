"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

export default function ProprietaireDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#0F172A]">Tableau de bord</h1>
          <p className="text-sm text-slate-500">Gérez votre parc et vos locations</p>
        </div>
        <Link
          href="/dashboard/proprietaire/ajouter"
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white"
          style={{ background: "#F8812B" }}
        >
          <Plus className="h-4 w-4" />
          Mettre en location
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-400">
        Tableau de bord en construction…
      </div>
    </div>
  );
}
