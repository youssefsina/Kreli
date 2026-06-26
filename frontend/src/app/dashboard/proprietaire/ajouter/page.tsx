"use client";

import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";

export default function AjouterMaterielPage() {
  return (
    <div className="space-y-6 p-6 lg:p-8">
      <Link
        href="/dashboard/proprietaire/materiels"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#0F172A]"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Link>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50">
          <Package className="h-4 w-4 text-slate-500" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-[#0F172A]">Ajouter un matériel</h1>
      </div>
      <div className="rounded-[20px] border border-slate-200 bg-white p-10 text-center text-slate-400">
        Formulaire en construction…
      </div>
    </div>
  );
}
