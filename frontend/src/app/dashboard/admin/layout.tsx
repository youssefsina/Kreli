"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { Menu } from "lucide-react";
import Link from "next/link";
import AdminSidebar from "@/components/dashboard/AdminSidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push("/auth/login");
      return;
    }
    if (user.role !== "admin") {
      router.push("/dashboard");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#F8FAFC" }}>
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#F97316] border-t-transparent" />
      </div>
    );
  }

  if (user.role !== "admin") return null;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#F8FAFC" }}>

      <aside className="hidden w-[240px] shrink-0 overflow-y-auto lg:block">
        <AdminSidebar />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[240px] p-0 border-0" showCloseButton={false}>
          <AdminSidebar onClose={() => setMobileOpen(false)} />
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

          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden" style={{ background: "#F8FAFC" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
