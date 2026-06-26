
'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface DataPoint { month: string; revenue: number }

export default function RevenusChart({ data }: { data: DataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-[#64748b]">
        Pas encore de données
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false}
          tickFormatter={v => `${Math.round(v / 1000)}k`}
        />
        <Tooltip
          formatter={(v) => [`${Number(v).toLocaleString('fr-MA')} MAD`, 'Revenus nets']}
          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }}
        />
        <Bar dataKey="revenue" fill="#F97316" radius={[6, 6, 0, 0]} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  )
}
