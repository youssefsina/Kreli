
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Package, Grid, List } from 'lucide-react'
import { getMyMateriels, deleteMateriel, updateMateriel, formatPrice, getMaterielImage, type Materiel } from '@/lib/api'

const ETAT: Record<string, string> = { neuf: 'Neuf', bon_etat: 'Bon état', usage: 'Usagé' }

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const card      = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

export default function MesMaterielsPage() {
  const [items,    setItems]    = useState<Materiel[]>([])
  const [loading,  setLoading]  = useState(true)
  const [view,     setView]     = useState<'grid' | 'list'>('grid')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  useEffect(() => {
    getMyMateriels()
      .then(d => setItems(d.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  async function toggle(m: Materiel) {
    setToggling(m._id)
    try {
      await updateMateriel(m._id, { disponible: !m.disponible } as Partial<Materiel>)
      setItems(prev => prev.map(x => x._id === m._id ? { ...x, disponible: !x.disponible } : x))
    } catch {}
    setToggling(null)
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce matériel ? Cette action est irréversible.')) return
    setDeleting(id)
    try {
      await deleteMateriel(id)
      setItems(prev => prev.filter(x => x._id !== id))
    } catch {}
    setDeleting(null)
  }

  const imgSrc = (m: Materiel) => getMaterielImage(m) ?? '/placeholder.jpg'

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3 lg:p-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-[20px] bg-white" style={{ border: '1px solid #E2E8F0' }} />
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] lg:text-3xl">Mes Matériels</h1>
          <p className="mt-1 text-sm text-slate-400">
            {items.length} annonce{items.length !== 1 ? 's' : ''} publiée{items.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1 rounded-xl p-1 sm:flex" style={{ background: '#F1F5F9' }}>
            {(['grid', 'list'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`rounded-lg p-1.5 transition-colors ${view === v ? 'bg-white text-[#F97316] shadow-sm' : 'text-slate-500 hover:text-[#0F172A]'}`}
              >
                {v === 'grid' ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />}
              </button>
            ))}
          </div>
          <Link href="/dashboard/proprietaire/ajouter"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            style={{ background: '#F8812B' }}
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} /> Ajouter
          </Link>
        </div>
      </motion.div>

      {items.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-[20px] bg-white py-20 text-center"
          style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: '#FFF7ED' }}>
            <Package className="h-8 w-8 text-[#F97316] opacity-60" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-black text-[#0F172A]">Aucun matériel publié</h2>
          <p className="mb-6 mt-2 max-w-sm text-sm text-slate-500">Commencez à gagner de l&apos;argent en louant votre matériel</p>
          <Link href="/dashboard/proprietaire/ajouter"
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
            style={{ background: '#F8812B' }}
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} /> Ajouter un matériel
          </Link>
        </motion.div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show"
          className={view === 'grid'
            ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'space-y-3'
          }
        >
          {items.map(m => (
            <motion.div key={m._id} variants={card}
              className={`overflow-hidden rounded-[20px] bg-white transition-shadow hover:shadow-md ${view === 'list' ? 'flex items-center gap-4 p-4' : ''}`}
              style={{ border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}
            >
              {view === 'grid' ? (
                <>
                  <div className="relative h-40 bg-slate-100">
                    <Image src={imgSrc(m)} alt={m.nom} fill className="object-cover"
                      sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,25vw" />
                    <span
                      className="absolute right-2.5 top-2.5 rounded-lg px-2 py-0.5 text-[10px] font-bold"
                      style={m.disponible ? { background: '#F0FDF4', color: '#16A34A' } : { background: '#FFF7ED', color: '#EA580C' }}
                    >
                      {m.disponible ? 'Disponible' : 'Indisponible'}
                    </span>
                  </div>
                  <div className="px-3.5 py-3">
                    <h3 className="truncate text-[13px] font-bold text-[#0F172A]">{m.nom}</h3>
                    <p className="mt-1 truncate text-[11px] text-slate-400">{m.localisation} · {ETAT[m.etat ?? ''] ?? m.etat}</p>
                    <div className="mt-2.5 mb-3 flex items-center justify-between">
                      <span className="text-[15px] font-black text-[#F97316]">
                        {formatPrice(m.prixParJour)}<span className="ml-0.5 text-[10px] font-medium text-slate-400">/j</span>
                      </span>
                      {(m.caution ?? 0) > 0 && <span className="text-[11px] text-slate-400">Caution {formatPrice(m.caution!)}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggle(m)} disabled={toggling === m._id}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-85 disabled:opacity-60"
                        style={m.disponible ? { background: '#F0FDF4', color: '#16A34A' } : { background: '#F1F5F9', color: '#64748B' }}
                      >
                        {m.disponible ? <><ToggleRight className="h-4 w-4" /> Dispo</> : <><ToggleLeft className="h-4 w-4" /> Indispo</>}
                      </button>
                      <Link href={`/dashboard/proprietaire/materiels/${m._id}/edit`}
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:text-[#F97316]"
                        style={{ background: '#F1F5F9' }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Link>
                      <button onClick={() => remove(m._id)} disabled={deleting === m._id}
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                        style={{ background: '#F1F5F9' }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    <Image src={imgSrc(m)} alt={m.nom} fill className="object-cover" sizes="80px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-[#0F172A]">{m.nom}</h3>
                    <p className="text-xs text-slate-400">{m.localisation} · {ETAT[m.etat ?? ''] ?? m.etat}</p>
                    <span className="text-sm font-black text-[#F97316]">{formatPrice(m.prixParJour)}/j</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button onClick={() => toggle(m)} disabled={toggling === m._id}
                      className="flex h-9 w-9 items-center justify-center rounded-lg transition-opacity hover:opacity-85 disabled:opacity-60"
                      style={m.disponible ? { background: '#F0FDF4', color: '#16A34A' } : { background: '#F1F5F9', color: '#64748B' }}
                    >
                      {m.disponible ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    </button>
                    <Link href={`/dashboard/proprietaire/materiels/${m._id}/edit`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:text-[#F97316]"
                      style={{ background: '#F1F5F9' }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Link>
                    <button onClick={() => remove(m._id)} disabled={deleting === m._id}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                      style={{ background: '#F1F5F9' }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
