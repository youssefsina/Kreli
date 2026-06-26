"use client";

import { BarChart2 } from "lucide-react";

export default function RevenusPage() {
  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50">
          <BarChart2 className="h-4 w-4 text-slate-500" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-[#0F172A]">Mes revenus</h1>
      </div>
      <div className="rounded-[20px] border border-slate-200 bg-white p-10 text-center text-slate-400">
        Revenus en construction…
      </div>
    </div>
  );
}
