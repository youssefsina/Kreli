"use client";

import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/context/I18nContext";

const FacebookIcon = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
  </svg>
);

const TwitterIcon = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  const columns = [
    {
      heading: t("footer.col_platform"),
      links: [
        { label: t("footer.link_catalogue"), href: "/catalogue" },
        { label: t("footer.link_how"), href: "/about#how" },
        { label: t("footer.link_about"), href: "/about" },
      ],
    },
    {
      heading: t("footer.col_owners"),
      links: [
        { label: t("footer.link_publish"), href: "/dashboard/proprietaire/ajouter" },
        { label: t("nav.dashboard"), href: "/dashboard/proprietaire" },
      ],
    },
    {
      heading: t("footer.col_support"),
      links: [
        { label: t("footer.link_contact"), href: "mailto:support@Kreli.ma" },
        { label: t("footer.link_privacy"), href: "#" },
        { label: t("footer.link_terms"), href: "#" },
      ],
    },
  ];

  const socials = [
    { icon: <FacebookIcon />, href: "https://facebook.com", label: t("footer.social_facebook") },
    { icon: <TwitterIcon />, href: "https://twitter.com", label: t("footer.social_twitter") },
    { icon: <LinkedInIcon />, href: "https://linkedin.com", label: t("footer.social_linkedin") },
  ];

  return (
    <footer style={{ background: "#EDEDE8", padding: "48px 32px 32px" }}>
        
        <div
          style={{
            position: "relative",
            background: "#FFFFFF",
            borderRadius: 24,
            padding: "48px 52px 40px",
            boxShadow: "0 1px 3px rgba(10,10,9,0.06), 0 8px 32px rgba(10,10,9,0.04)",
            border: "1px solid rgba(10,10,9,0.07)",
          }}
        >
          
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 64,
              alignItems: "start",
            }}
          >
            
            <div style={{ maxWidth: 320 }}>
              <Link
                href="/"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  textDecoration: "none",
                  marginBottom: 16,
                }}
                aria-label="Kreli"
              >
                <Image
                  src="/logo.png"
                  alt="Kreli"
                  width={600}
                  height={300}
                  style={{ width: "120px", height: "auto", objectFit: "contain" }}
                />
              </Link>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: "#5C5C5A",
                  margin: 0,
                }}
              >
                {t("footer.description")}
              </p>

            </div>

            
            <div style={{ display: "flex", gap: 56, paddingTop: 4 }}>
              {columns.map(col => (
                <div key={col.heading}>
                  <p
                    style={{
                      fontFamily: "var(--lm-f-mono, monospace)",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "#0A0A09",
                      margin: "0 0 14px",
                    }}
                  >
                    {col.heading}
                  </p>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                    {col.links.map(link => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          style={{
                            fontSize: 13.5,
                            color: "#5C5C5A",
                            textDecoration: "none",
                            fontWeight: 450,
                            transition: "color 0.15s",
                          }}
                          onMouseEnter={e => ((e.target as HTMLElement).style.color = "#0A0A09")}
                          onMouseLeave={e => ((e.target as HTMLElement).style.color = "#5C5C5A")}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          
          <div style={{ height: 1, background: "rgba(10,10,9,0.07)", margin: "36px 0 24px" }} />

          
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <p style={{ fontSize: 12.5, color: "#8C8C8A", margin: 0 }}>
              © {year} Kreli · {t("footer.rights")}
            </p>

            
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {socials.map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "grid",
                    placeItems: "center",
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    color: "#8C8C8A",
                    textDecoration: "none",
                    transition: "color 0.15s, background 0.15s",
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.color = "#0A0A09";
                    el.style.background = "rgba(10,10,9,0.06)";
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.color = "#8C8C8A";
                    el.style.background = "transparent";
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
    </footer>
  );
}
