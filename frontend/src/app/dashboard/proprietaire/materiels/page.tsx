'use client'

import { Package } from 'lucide-react'

export default function MesMaterielsPage() {
  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50">
          <Package className="h-4 w-4 text-slate-500" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-[#0F172A]">Mes matériels</h1>
      </div>
      <div className="rounded-[20px] border border-slate-200 bg-white p-10 text-center text-slate-400">
        Mes matériels en construction…
      </div>
    </div>
  )
}
