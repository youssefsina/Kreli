"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { useMessagesContext } from "@/context/MessagesContext";
import { useNotifications } from "@/hooks/useNotifications";
import { Menu, Bell } from "lucide-react";
import Link from "next/link";
import LocataireSidebar from "@/components/dashboard/LocataireSidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function LocataireLayout({ children }: { children: React.ReactNode }) {
  const { user, token, isLoading } = useAuth();
  const { t } = useI18n();
  const { totalUnread } = useMessagesContext();
  const { unreadCount } = useNotifications(token);
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
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
        <LocataireSidebar unreadMessages={totalUnread} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[240px] p-0 border-0" showCloseButton={false}>
          <LocataireSidebar onClose={() => setMobileOpen(false)} unreadMessages={totalUnread} />
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
            href="/dashboard/locataire"
            className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100"
            aria-label={t("notifications.title")}
          >
            <Bell className="h-5 w-5" strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full px-1 text-[9px] font-bold text-white"
                style={{ background: "#F97316" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden" style={{ background: "#F8FAFC" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
