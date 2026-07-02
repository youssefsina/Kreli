'use client'

import { Quote, Star } from 'lucide-react'
import { useI18n } from '@/context/I18nContext'

const TESTIMONIALS = [
  {
    name: 'Karim Alaoui',
    role: 'Entrepreneur BTP, Casablanca',
    avatar: 'KA',
    color: '#f59e0b',
    text: "Kreli m'a permis de louer une mini-pelle en moins de 2 heures. Le processus est simple, rapide, et le matériel était en parfait état.",
  },
  {
    name: 'Sara Moussaoui',
    role: 'Cheffe de chantier, Marrakech',
    avatar: 'SM',
    color: '#22c55e',
    text: 'Je recommande Kreli à tous les professionnels du secteur. La sélection de matériel est variée et les prix sont très compétitifs.',
  },
  {
    name: 'Omar Tahiri',
    role: 'Directeur de travaux, Rabat',
    avatar: 'OT',
    color: '#0d9488',
    text: "Grâce à Kreli, j'ai pu équiper mon chantier rapidement sans immobiliser du capital. La livraison le jour même est un vrai avantage.",
  },
]

export function StaggerTestimonials() {
  const { t } = useI18n()
  return (
    <section className="bg-[#f5f5f4] py-24">
      <div className="mx-auto max-w-[1280px] px-4">
        <div className="mb-12 flex flex-col items-center gap-4 text-center">
          <span
            className="rounded-full px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.18em]"
            style={{ backgroundColor: 'rgba(255,103,0,0.1)', color: '#ff6700' }}
          >
            {t('testimonials.label')}
          </span>
          <h2
            className="font-display font-black tracking-tight"
            style={{
              color: '#0f172a',
              fontSize: 'clamp(2rem, 4vw, 2.75rem)',
            }}
          >
            {t('testimonials.title')}
          </h2>
          <p className="max-w-md text-[16px] leading-relaxed text-[#64748b]">
            {t('testimonials.subtitle')}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <article
              key={item.name}
              className="rounded-2xl border p-8"
              style={{
                background: '#ffffff',
                borderColor: '#e2e8f0',
              }}
            >
              <div className="mb-5 flex items-center justify-between">
                <Quote className="h-6 w-6 text-[#ff6700]" />
                <div className="flex gap-0.5" aria-label={t('testimonials.stars_label')}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-[#ff6700] text-[#ff6700]" />
                  ))}
                </div>
              </div>
              <p className="text-[15px] font-medium leading-7 text-[#374151]">
                {item.text}
              </p>
              <div className="mt-6 flex items-center gap-3 border-t border-[#e2e8f0] pt-5">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-black text-white"
                  style={{ backgroundColor: item.color }}
                >
                  {item.avatar}
                </div>
                <div>
                  <p className="text-[14px] font-bold text-[#111827]">
                    {item.name}
                  </p>
                  <p className="text-[12px] text-[#6b7280]">
                    {item.role}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
