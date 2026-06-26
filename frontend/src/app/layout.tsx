import type { Metadata } from 'next';
import { Inter, Inter_Tight, JetBrains_Mono, Cairo, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import './animations.css';
import { Providers } from '@/components/Providers';

const bodyFont = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-body', weight: ['400', '500', '600'] });
const displayFont = Inter_Tight({ subsets: ['latin'], display: 'swap', variable: '--font-display', weight: ['600', '700', '800', '900'] });
const monoFont = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono', weight: ['400', '500', '600'] });
const jakartaFont = Plus_Jakarta_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-jakarta', weight: ['400', '500', '600', '700', '800'] });
const arabicFont = Cairo({ subsets: ['arabic', 'latin'], display: 'swap', variable: '--font-arabic', weight: ['400', '500', '600', '700', '800', '900'] });

const SITE_NAME = 'Kreli';
const SITE_DESCRIPTION = 'La référence marocaine pour la location de matériels professionnels. Louez des engins BTP, outils, équipements événementiels au Maroc.';

export const metadata: Metadata = {
  title: { default: 'Kreli | Location de matériels professionnels au Maroc', template: '%s | Kreli' },
  description: SITE_DESCRIPTION,
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  keywords: ['location matériel Maroc', 'location engins BTP', 'location outils professionnels', 'matériel chantier Maroc', 'location équipement Casablanca', 'location nacelle Maroc', 'location grue Maroc', 'location compresseur Maroc'],
  authors: [{ name: 'Kreli' }],
  creator: 'Kreli',
  publisher: 'Kreli',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'fr_MA',
    siteName: SITE_NAME,
    title: 'Kreli | Location de matériels professionnels au Maroc',
    description: SITE_DESCRIPTION,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Kreli — Location de matériels professionnels au Maroc' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kreli | Location de matériels professionnels au Maroc',
    description: SITE_DESCRIPTION,
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
  other: { 'geo.region': 'MA', 'geo.placename': 'Casablanca, Maroc', 'geo.position': '33.5731;-7.5898', 'ICBM': '33.5731, -7.5898' },
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

const jsonLd = [
  {
    '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, description: SITE_DESCRIPTION, inLanguage: 'fr-MA',
    potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: siteUrl + '/catalogue?q={search_term_string}' }, 'query-input': 'required name=search_term_string' },
  },
  {
    '@context': 'https://schema.org', '@type': 'Organization', name: SITE_NAME, description: SITE_DESCRIPTION, inLanguage: 'fr-MA',
    address: { '@type': 'PostalAddress', addressLocality: 'Casablanca', addressRegion: 'Grand Casablanca', addressCountry: 'MA' },
    areaServed: { '@type': 'Country', name: 'Maroc' },
    contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', availableLanguage: ['French', 'Arabic'] },
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='fr'>
      <head>
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />
        <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} ${arabicFont.variable} ${jakartaFont.variable} bg-slate-50 text-slate-900 antialiased font-sans`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
