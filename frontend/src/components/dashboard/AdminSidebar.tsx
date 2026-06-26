"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutGrid,
  Tag,
  Package,
  Inbox,
  DollarSign,
  AlertTriangle,
  Users,
  LogOut,
  Home,
  Shield,
  X,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Package;
  exact?: boolean;
};

const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard/admin",            label: "Tableau de bord", icon: LayoutGrid, exact: true },
  { href: "/dashboard/admin/categories", label: "Catégories",      icon: Tag },
  { href: "/dashboard/admin/materiels",  label: "Matériels",       icon: Package },
  { href: "/dashboard/admin/locations",  label: "Locations",       icon: Inbox },
  { href: "/dashboard/admin/paiements",  label: "Paiements",       icon: DollarSign },
  { href: "/dashboard/admin/litiges",    label: "Litiges",         icon: AlertTriangle },
  { href: "/dashboard/admin/users",      label: "Utilisateurs",    icon: Users },
];

interface Props {
  onClose?: () => void;
}

export default function AdminSidebar({ onClose }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    router.push("/");
  }

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  const initials = user?.nom
    ? user.nom.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "AD";

  return (
    <aside
      className="flex h-full flex-col bg-white"
      style={{ borderRight: "1px solid #E2E8F0" }}
    >

      <div className="flex items-center justify-between px-5 pt-6 pb-5">
        <Link href="/" onClick={onClose} className="flex shrink-0 items-center leading-none" aria-label="Kreli">
          <Image
            src="/logo.png"
            alt="Kreli"
            width={600}
            height={300}
            priority
            className="h-9 w-auto object-contain"
          />
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mx-5 mb-5">
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ background: "#FFF7ED", border: "1px solid rgba(248,129,43,0.2)" }}
        >
          <Shield className="h-3.5 w-3.5" style={{ color: "#F97316" }} strokeWidth={2} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#F97316]">
            Administration
          </span>
        </div>
      </div>

      <p className="px-5 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-300">
        Navigation
      </p>

      <nav className="flex flex-col gap-0.5 px-3">
        {PRIMARY_NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors"
              style={
                active
                  ? { background: "rgba(248,129,43,0.1)", color: "#F8812B" }
                  : { color: "#64748B" }
              }
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(248,129,43,0.07)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#F8812B";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#64748B";
                }
              }}
            >
              <Icon
                className="h-[17px] w-[17px] shrink-0"
                strokeWidth={active ? 2.25 : 1.75}
                style={{ color: active ? "#F8812B" : undefined }}
              />
              <span className="flex-1 truncate">{label}</span>
            </Link>
          );
        })}

        <div className="my-2 mx-1 border-t border-slate-100" />

        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-slate-400 transition-colors"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "#F8FAFC";
            (e.currentTarget as HTMLAnchorElement).style.color = "#0F172A";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
            (e.currentTarget as HTMLAnchorElement).style.color = "#94A3B8";
          }}
        >
          <Home className="h-[17px] w-[17px] shrink-0" strokeWidth={1.75} />
          <span className="flex-1 truncate">Retour à l&apos;accueil</span>
        </Link>
      </nav>

      <div className="flex-1" />

      <div className="px-3 pb-4">
        <div
          className="flex items-center gap-3 rounded-2xl p-3"
          style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
        >

          <div
            className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full text-[12px] font-bold text-white"
            style={{ background: "#0F172A" }}
          >
            {user?.photo ? (

              <img src={user.photo} alt={user.nom} className="h-9 w-9 object-cover" />
            ) : (
              initials
            )}
            <span
              className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white"
              style={{ background: "#22C55E" }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-[#0F172A]">{user?.nom}</p>
            <p className="text-[11px] font-semibold" style={{ color: "#F97316" }}>Administrateur</p>
          </div>

          <button
            onClick={handleLogout}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
            aria-label="Se déconnecter"
          >
            <LogOut className="h-[15px] w-[15px]" />
          </button>
        </div>
      </div>
    </aside>
  );
}
