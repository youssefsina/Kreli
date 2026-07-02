"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { useMessagesContext } from "@/context/MessagesContext";
import { Menu, Plus } from "lucide-react";
import Link from "next/link";
import ProprietaireSidebar from "@/components/dashboard/ProprietaireSidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function ProprietaireLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const { t } = useI18n();
  const { totalUnread } = useMessagesContext();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
      return;
    }
    if (!isLoading && user && user.role !== "proprietaire" && user.role !== "both" && user.role !== "admin") {
      router.push("/dashboard/locataire");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#F8FAFC" }}>
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#F97316] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F8FAFC" }}>

      <aside className="hidden w-[240px] shrink-0 overflow-y-auto lg:block">
        <ProprietaireSidebar unreadMessages={totalUnread} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[240px] p-0 border-0" showCloseButton={false}>
          <ProprietaireSidebar onClose={() => setMobileOpen(false)} unreadMessages={totalUnread} />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">

        <header
          className="flex items-center justify-between bg-white px-4 py-3 lg:hidden"
          style={{ borderBottom: "1px solid #e2e8f0" }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100"
            aria-label={t("nav.menu")}
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>

          <Link href="/" className="flex items-center gap-1.5">
            <div
              className="grid h-6 w-6 place-items-center rounded-[6px] text-[12px] font-black text-white"
              style={{ background: "#0F172A" }}
            >
              K
            </div>
            <span className="text-[16px] font-extrabold text-[#0F172A]">
              Kreli<span style={{ color: "#F97316" }}>.</span>
            </span>
          </Link>

          <Link
            href="/dashboard/proprietaire/ajouter"
            className="grid h-9 w-9 place-items-center rounded-lg text-white"
            style={{ background: "#F97316" }}
            aria-label={t("dashboard.add_materiel")}
          >
            <Plus className="h-5 w-5" strokeWidth={2.25} />
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden" style={{ background: "#F8FAFC" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
