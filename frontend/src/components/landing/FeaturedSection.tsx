
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { MapPin, Star, ArrowRight, Heart } from 'lucide-react'
import { formatPrice, getMaterielImage, type Materiel } from '@/lib/api'
import { useI18n } from '@/context/I18nContext'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }
const card = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show:   { opacity: 1, y: 0,  scale: 1,    transition: { duration: 0.55 } },
}

export default function FeaturedSection({ materiels }: { materiels: Materiel[] }) {
  const { t } = useI18n()
  return (
    <section className="py-20" style={{ background: 'linear-gradient(180deg, #fdf2f8 0%, #f8fafc 100%)' }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6, ease: "easeOut" as const }}
          className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold uppercase tracking-widest"
              style={{ background: 'rgba(244,63,94,0.08)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.15)' }}
            >
              💎 {t('featured_section.label')}
            </span>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl" style={{ color: '#1a1a2e' }}>
              {t('featured_section.title')}
            </h2>
          </div>
          <Link href="/catalogue"
            className="group inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all"
            style={{
              border: '1px solid rgba(244,63,94,0.25)',
              color: '#f43f5e',
              background: 'rgba(244,63,94,0.05)',
            }}
          >
            {t('featured_section.view_all')} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        <motion.div
          variants={container} initial="hidden"
          whileInView="show" viewport={{ once: true, margin: '-40px' }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {materiels.map(item => (
            <motion.div key={item._id} variants={card}>
              <Link href={`/materiel/${item._id}`} className="group block">
                <div className="overflow-hidden rounded-3xl transition-all duration-500 hover:-translate-y-1"
                  style={{
                    border: '1px solid rgba(244,114,182,0.15)',
                    background: 'white',
                    boxShadow: '0 2px 12px -2px rgba(244,63,94,0.06)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px -8px rgba(244,63,94,0.2)'
                    ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(244,63,94,0.25)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px -2px rgba(244,63,94,0.06)'
                    ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(244,114,182,0.15)'
                  }}
                >
                  <div className="relative h-48 overflow-hidden" style={{ background: 'linear-gradient(135deg, #fce7f3, #f3e8ff)' }}>
                    <Image
                      src={getMaterielImage(item) ?? '/placeholder.jpg'} alt={item.nom} fill
                      className="object-cover transition-transform duration-700 group-hover:scale-108"
                      style={{ transform: 'scale(1)' }}
                      sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,25vw"
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
                      onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder.jpg' }}
                    />
                    
                    <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      item.disponible
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {item.disponible ? t('catalogue.available') : t('catalogue.rented')}
                    </span>
                    
                    <button
                      className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full transition-all"
                      style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)' }}
                      onClick={e => e.preventDefault()}
                    >
                      <Heart className="h-4 w-4 transition-colors hover:fill-current hover:text-[#f43f5e]"
                        style={{ color: '#f43f5e' }}
                      />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="mb-1 line-clamp-1 font-semibold transition-colors group-hover:text-[#f43f5e]"
                      style={{ color: '#1a1a2e' }}
                    >
                      {item.nom}
                    </h3>
                    <div className="mb-3 flex items-center gap-1 text-xs" style={{ color: '#64748b' }}>
                      <MapPin className="h-3.5 w-3.5" />
                      {item.localisation ?? 'Maroc'}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>
                        <span className="text-lg font-bold" style={{ color: '#f43f5e' }}>
                          {formatPrice(item.prixParJour)}
                        </span>
                        <span className="ml-1 text-xs" style={{ color: '#94a3b8' }}>{t('catalogue.per_day')}</span>
                      </span>
                      <div className="flex items-center gap-1 text-xs" style={{ color: '#64748b' }}>
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        4.8
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
