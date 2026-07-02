"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  LogOut,
  User,
  Bell,
  CheckCheck,
  Menu,
  X,
  Grid3X3,
  ArrowRight,
  Check,
  Globe,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useI18n, type Locale } from "@/context/I18nContext";
import { useNotifications } from "@/hooks/useNotifications";
import { getCategories, type Category } from "@/lib/api";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";



interface DropdownCategory {
  _id: string;
  nom: string;
  subtitle: string;
  image: string;
}

const FALLBACK_CAT_IMAGES = [
  "https://images.unsplash.com/photo-1504222490345-c075b6008014?auto=format&fit=crop&w=96&q=80",
  "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=96&q=80",
  "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=96&q=80",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=96&q=80",
];

const FALLBACK_CAT_KEYS = [
  { nom: "nav_cats.btp_nom",    sub: "nav_cats.btp_sub"    },
  { nom: "nav_cats.outils_nom", sub: "nav_cats.outils_sub" },
  { nom: "nav_cats.event_nom",  sub: "nav_cats.event_sub"  },
  { nom: "nav_cats.elec_nom",   sub: "nav_cats.elec_sub"   },
];



interface LanguageOption {
  code: Locale;
  label: string;
  native: string;
  countryCode: string;
  shortCode: string;
  dir: "ltr" | "rtl";
}

const LANGUAGES: LanguageOption[] = [
  { code: "fr",  label: "French",    native: "Français",  countryCode: "fr", shortCode: "FR", dir: "ltr" },
  { code: "en",  label: "English",   native: "English",   countryCode: "gb", shortCode: "GB", dir: "ltr" },
  { code: "ar",  label: "Arabic",    native: "العربية",   countryCode: "ma", shortCode: "AR", dir: "rtl" },
];

function flagUrl(countryCode: string): string {
  return `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`;
}



function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

const dropdownVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.18, ease: "easeOut" as const },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.97,
    transition: { duration: 0.14, ease: "easeIn" as const },
  },
};



export default function Navbar() {
  const { user, token, logout } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [rawApiCats, setRawApiCats] = useState<Category[]>([]);
  const [scrolled, setScrolled] = useState(false);

  
  useEffect(() => {
    let frame = 0;
    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setScrolled(window.scrollY > 40));
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const fallbackCats = useMemo<DropdownCategory[]>(
    () =>
      FALLBACK_CAT_KEYS.map((k, i) => ({
        _id: String(i + 1),
        nom: t(k.nom),
        subtitle: t(k.sub),
        image: FALLBACK_CAT_IMAGES[i] ?? "",
      })),
    [t]
  );

  const dropdownCats = useMemo<DropdownCategory[]>(() => {
    if (rawApiCats.length === 0) return fallbackCats;
    return rawApiCats.slice(0, 6).map((c, i) => ({
      _id: c._id,
      nom: c.nom,
      subtitle: fallbackCats[i % fallbackCats.length]?.subtitle ?? c.nom,
      image: c.image ?? (FALLBACK_CAT_IMAGES[i % FALLBACK_CAT_IMAGES.length] ?? ""),
    }));
  }, [rawApiCats, fallbackCats]);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  const { notifications, unreadCount, markRead, markAllRead } =
    useNotifications(token);

  useEffect(() => {
    getCategories()
      .then((cats: Category[]) => { if (cats.length > 0) setRawApiCats(cats); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        notifRef.current &&
        !notifRef.current.contains(e.target as Node)
      )
        setNotifOpen(false);
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      )
        setUserMenuOpen(false);
      if (catRef.current && !catRef.current.contains(e.target as Node))
        setCatOpen(false);
      if (langRef.current && !langRef.current.contains(e.target as Node))
        setLangOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setLangOpen(false);
        setNotifOpen(false);
        setUserMenuOpen(false);
        setCatOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function handleLogout() {
    logout();
    setUserMenuOpen(false);
    setSheetOpen(false);
    router.push("/");
  }

  const handleNotifClick = useCallback(
    async (notif: { _id: string; lu: boolean; lienRedirection: string | null }) => {
      if (!notif.lu) await markRead(notif._id);
      
      
      if (notif.lienRedirection) {
        setNotifOpen(false);
        router.push(notif.lienRedirection);
      }
    },
    [markRead, router]
  );

  const currentLang = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[padding,background] duration-300 ease-out",
        scrolled ? "px-3 pt-3 lg:px-6" : "px-0 pt-0",
      )}
      style={{ background: scrolled ? "transparent" : undefined }}
    >
      
      <div
        className={cn(
          "relative mx-auto transition-all duration-300 ease-out",
          scrolled
            ? "max-w-[1100px] rounded-xl border border-slate-200 !bg-white shadow-[0_10px_40px_-12px_rgba(15,23,42,0.18)]"
            : "max-w-none rounded-none border-b border-slate-200 !bg-white",
        )}
      >
      <nav
        className={cn(
          "relative mx-auto flex items-center justify-between gap-6 transition-[height,padding,max-width] duration-300 ease-out",
          scrolled
            ? "h-[58px] max-w-[1100px] px-5 lg:px-6"
            : "h-[68px] max-w-[1280px] px-4 lg:px-8",
        )}
      >
        
        <Link href="/" className="flex shrink-0 items-center leading-none" aria-label="Kreli">
          <Image
            src="/logo.png"
            alt="Kreli"
            width={600}
            height={300}
            priority
            className="h-10 w-auto object-contain"
          />
        </Link>

        
        <div className="ml-2 hidden items-center gap-7 lg:flex">
          <Link
            href="/"
            className="group flex flex-col items-center gap-[3px]"
          >
            <span className="text-[14px] font-semibold text-slate-600 group-hover:text-[#004e98] transition-colors duration-200">
              {t("nav.home")}
            </span>
            <span className="h-[2px] w-0 rounded-full bg-[#ff6700] transition-all duration-300 group-hover:w-full" />
          </Link>

          
          <div
            className="relative"
            ref={catRef}
            onMouseEnter={() => setCatOpen(true)}
            onMouseLeave={() => setCatOpen(false)}
          >
            <button
              onClick={() => setCatOpen((o) => !o)}
              className="group flex flex-col items-center gap-[3px]"
              aria-expanded={catOpen}
              aria-haspopup="true"
            >
              <span className="flex items-center gap-1 text-[14px] font-semibold text-slate-600 group-hover:text-[#004e98] transition-colors duration-200">
                {t("nav.categories")}
                <motion.span
                  animate={{ rotate: catOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </motion.span>
              </span>
              <span className="h-[2px] w-0 rounded-full bg-[#ff6700] transition-all duration-300 group-hover:w-full" />
            </button>

            <AnimatePresence>
              {catOpen && (
                <motion.div
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute left-0 top-full mt-2 min-w-[520px] rounded-xl border border-slate-200 bg-white shadow-lg z-50 overflow-hidden"
                >
                  <div className="p-4">
                    <p className="mb-3 text-[11px] font-black uppercase tracking-[1.5px] text-slate-400 ">
                      {t("nav.browse_categories")}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {dropdownCats.map((cat) => (
                        <Link
                          key={cat._id}
                          href={`/catalogue?categorie=${cat._id}`}
                          onClick={() => setCatOpen(false)}
                          className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50 "
                        >
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 ">
                            <img
                              src={cat.image}
                              alt={cat.nom}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.jpg"; }}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[14px] font-bold text-slate-900 ">
                              {cat.nom}
                            </p>
                            <p className="truncate text-[12px] text-slate-500 ">
                              {cat.subtitle}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 ">
                    <Link
                      href="/catalogue"
                      onClick={() => setCatOpen(false)}
                      className="flex items-center gap-2 text-[13px] font-bold text-slate-700 transition-colors hover:text-[#ff6700]"
                    >
                      <Grid3X3 className="h-4 w-4" />
                      {t("nav.view_catalogue")}
                      <ArrowRight className="ml-auto h-4 w-4" />
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link href="/about" className="group flex flex-col items-center gap-[3px]">
            <span className="text-[14px] font-semibold text-slate-600 group-hover:text-[#004e98] transition-colors duration-200">
              {t("nav.about")}
            </span>
            <span className="h-[2px] w-0 rounded-full bg-[#ff6700] transition-all duration-300 group-hover:w-full" />
          </Link>
        </div>

        
        <div className="flex items-center gap-2 shrink-0">
          
          <div className="relative" ref={langRef}>
            <button
              type="button"
              onClick={() => setLangOpen((o) => !o)}
              className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-slate-600 transition-colors ${
                langOpen
                  ? "border-[#ff6700]/50 bg-orange-50 "
                  : "border-slate-200 hover:border-slate-300 "
              }`}
              aria-label={t("lang.label")}
              aria-expanded={langOpen}
              aria-haspopup="listbox"
            >
              <img
                src={flagUrl(currentLang.countryCode)}
                alt={currentLang.label}
                width={20}
                height={14}
                className="h-3.5 w-5 shrink-0 rounded-sm object-cover"
                loading="eager"
              />
              <span className="hidden text-[11px] font-bold tracking-wide text-slate-700 sm:inline">
                {currentLang.shortCode}
              </span>
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${langOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {langOpen && (
                <motion.div
                  role="listbox"
                  aria-label={t("lang.label")}
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 top-full z-50 mt-2 w-[220px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg "
                >
                  
                  <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 ">
                    <Globe className="h-3.5 w-3.5" style={{ color: "#ff6700" }} />
                    <p className="text-[10px] font-black uppercase tracking-[1.5px] text-slate-500 ">
                      {t("lang.label")}
                    </p>
                  </div>

                  
                  <ul className="py-1.5">
                    {LANGUAGES.map((lang, i) => {
                      const active = locale === lang.code;
                      return (
                        <motion.li
                          key={lang.code}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04, duration: 0.18 }}
                        >
                          <button
                            type="button"
                            role="option"
                            aria-selected={active}
                            onClick={() => {
                              setLocale(lang.code);
                              setLangOpen(false);
                            }}
                            className="group flex w-full items-center gap-3 px-3 py-2.5 transition-colors hover:bg-slate-50 "
                            style={{
                              backgroundColor: active
                                ? "rgba(255,103,0,0.06)"
                                : undefined,
                            }}
                          >
                            
                            <span
                              className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl"
                              style={{
                                backgroundColor: active
                                  ? "rgba(255,103,0,0.1)"
                                  : "#f8fafc",
                              }}
                            >
                              <img
                                src={flagUrl(lang.countryCode)}
                                alt={lang.label}
                                width={28}
                                height={20}
                                className="h-5 w-7 rounded-[3px] object-cover shadow-sm ring-1 ring-black/5"
                                loading="lazy"
                              />
                            </span>
                            
                            <div className="flex min-w-0 flex-1 items-center">
                              <span
                                className="text-[14px] font-bold"
                                style={{ color: active ? "#ff6700" : "#0f172a" }}
                                dir={lang.dir}
                              >
                                {lang.native}
                              </span>
                            </div>
                            
                            {active ? (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex h-5 w-5 items-center justify-center rounded-full"
                                style={{ backgroundColor: "#ff6700" }}
                              >
                                <Check className="h-3 w-3 text-white" />
                              </motion.span>
                            ) : (
                              <span className="h-5 w-5 rounded-full border-2 border-slate-200 " />
                            )}
                          </button>
                        </motion.li>
                      );
                    })}
                  </ul>

                  
                  <div className="border-t border-slate-100 px-4 py-2.5 ">
                    <p className="text-[10px] text-slate-400 ">
                      {currentLang.dir === "rtl" ? "↩ " : ""}
                      {t("lang.saved_hint")}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {user ? (
            <>
              
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => {
                    setNotifOpen((o) => !o);
                    setUserMenuOpen(false);
                  }}
                  className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white transition-colors"
                  aria-label={t("notifications.title")}
                >
                  <Bell className="text-slate-600 " style={{ height: 18, width: 18 }} />
                  {unreadCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white leading-none"
                      style={{
                        background: "linear-gradient(135deg, #f43f5e, #ec4899)",
                      }}
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.16 }}
                      className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 ">
                        <span className="text-sm font-bold text-slate-900 ">
                          {t("notifications.title")}
                        </span>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAllRead()}
                            className="flex items-center gap-1 text-xs font-medium text-[#004e98] hover:opacity-70"
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                            {t("notifications.mark_all_read")}
                          </button>
                        )}
                      </div>
                      <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-50 ">
                        {notifications.length === 0 ? (
                          <p className="py-8 text-center text-sm text-slate-400 ">
                            {t("notifications.empty")}
                          </p>
                        ) : (
                          notifications.slice(0, 15).map((n) => (
                            <button
                              key={n._id}
                              onClick={() => handleNotifClick(n)}
                              className={`w-full text-left px-4 py-3 transition-colors ${
                                n.lienRedirection ? "cursor-pointer hover:bg-slate-50" : "cursor-default"
                              } ${!n.lu ? "bg-blue-50 " : ""}`}
                            >
                              <div className="flex items-start gap-2">
                                {!n.lu && (
                                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#004e98]" />
                                )}
                                <div className={!n.lu ? "" : "pl-4"}>
                                  <p className="text-sm font-semibold text-slate-900 leading-snug">
                                    {n.titre}
                                  </p>
                                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                    {n.contenu}
                                  </p>
                                  <p className="text-[11px] text-slate-400 mt-1">
                                    {timeAgo(n.createdAt)}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => {
                    setUserMenuOpen((o) => !o);
                    setNotifOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium transition-colors"
                  style={{
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    color: "#0f172a",
                  }}
                >
                  <div className="h-7 w-7 rounded-full overflow-hidden flex items-center justify-center shrink-0"
                    style={{ background: user.photo ? "transparent" : "rgba(0,78,152,0.1)" }}
                  >
                    {user.photo ? (
                      <img
                        src={user.photo}
                        alt={user.nom}
                        className="h-7 w-7 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/avatar-placeholder.svg"; }}
                      />
                    ) : (
                      <span className="text-[11px] font-black text-[#004e98]">
                        {user.nom.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="hidden md:inline text-[14px] font-semibold">
                    {user.nom.split(" ")[0]}
                  </span>
                  <motion.span
                    animate={{ rotate: userMenuOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="inline-flex"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </motion.span>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.16 }}
                      className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-slate-200 bg-white shadow-lg py-1 z-50"
                    >
                      <div className="px-4 py-2.5 border-b border-slate-100 ">
                        <p className="text-sm font-semibold text-slate-900 ">
                          {user.nom}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        href={
                          user.role === "admin"
                            ? "/dashboard/admin"
                            : user.role === "proprietaire"
                            ? "/dashboard/proprietaire"
                            : "/dashboard/locataire"
                        }
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <User className="h-4 w-4" />
                        {t("nav.dashboard")}
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        {t("nav.logout")}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="hidden items-center rounded-lg border border-slate-200 px-4 py-[7px] text-[13px] font-bold text-slate-700 transition-colors hover:border-[#004e98] hover:text-[#004e98] sm:inline-flex"
              >
                {t("nav.login")}
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center rounded-lg px-5 py-[7px] text-[13px] font-bold text-white transition-colors hover:bg-[#e85d00]"
                style={{
                  background: "linear-gradient(135deg, #ff6700 0%, #ff8a3c 100%)",
                  boxShadow: "0 4px 14px -3px rgba(255,103,0,0.45)",
                }}
              >
                {t("nav.register")}
              </Link>
            </>
          )}

          
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white transition-colors hover:border-[#004e98] lg:hidden"
              aria-label={t("nav.menu")}
            >
              <AnimatePresence mode="wait" initial={false}>
                {sheetOpen ? (
                  <motion.span
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="inline-flex"
                  >
                    <X className="h-[18px] w-[18px] text-slate-600 " />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="inline-flex"
                  >
                    <Menu className="h-[18px] w-[18px] text-slate-600 " />
                  </motion.span>
                )}
              </AnimatePresence>
            </SheetTrigger>

            <SheetContent
              side="right"
              showCloseButton={false}
              className="w-[320px] overflow-y-auto border-l border-slate-200 !bg-white p-0 sm:max-w-[320px]"
            >
              <div className="flex flex-col min-h-full">
                
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <Link
                    href="/"
                    onClick={() => setSheetOpen(false)}
                    className="flex items-center leading-none"
                    aria-label="Kreli"
                  >
                    <Image
                      src="/logo.png"
                      alt="Kreli"
                      width={600}
                      height={300}
                      className="h-9 w-auto object-contain"
                    />
                  </Link>
                  <button
                    onClick={() => setSheetOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 transition-colors hover:border-[#004e98]"
                    aria-label={t("nav.close")}
                  >
                    <X className="h-4 w-4 text-slate-600 " />
                  </button>
                </div>

                
                <div className="flex flex-col px-3 py-3">
                  <Link
                    href="/"
                    onClick={() => setSheetOpen(false)}
                    className="flex items-center rounded-lg px-3 py-3 text-[15px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    {t("nav.home")}
                  </Link>
                  <Link
                    href="/about"
                    onClick={() => setSheetOpen(false)}
                    className="flex items-center rounded-lg px-3 py-3 text-[15px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    {t("nav.about")}
                  </Link>

                  <div className="mt-1">
                    <p className="px-3 pt-2 pb-1 text-[11px] font-black uppercase tracking-[1.5px] text-slate-400 ">
                      {t("nav.categories")}
                    </p>
                    <div className="space-y-1">
                      {dropdownCats.map((cat) => (
                        <Link
                          key={cat._id}
                          href={`/catalogue?categorie=${cat._id}`}
                          onClick={() => setSheetOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50 transition-colors"
                        >
                          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-slate-100 ">
                            <img
                              src={cat.image}
                              alt={cat.nom}
                              className="h-full w-full object-cover"
                              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.jpg"; }}
                            />
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-slate-900 ">
                              {cat.nom}
                            </p>
                            <p className="text-[11px] text-slate-500 ">
                              {cat.subtitle}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  
                  <div className="mt-4 border-t border-slate-100 px-3 pt-3 ">
                    <div className="mb-2 flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5" style={{ color: "#ff6700" }} />
                      <p className="text-[10px] font-black uppercase tracking-[1.5px] text-slate-400 ">
                        {t("lang.label")}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {LANGUAGES.map((lang) => {
                        const active = locale === lang.code;
                        return (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => setLocale(lang.code)}
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-bold transition-all"
                            style={{
                              backgroundColor: active
                                ? "rgba(255,103,0,0.08)"
                                : "transparent",
                              border: `1px solid ${active ? "rgba(255,103,0,0.3)" : "transparent"}`,
                              color: active ? "#ff6700" : "#475569",
                            }}
                          >
                            <img
                              src={flagUrl(lang.countryCode)}
                              alt={lang.label}
                              width={20}
                              height={14}
                              className="h-3.5 w-5 shrink-0 rounded-[3px] object-cover shadow-sm ring-1 ring-black/5"
                              loading="lazy"
                            />
                            <span className="truncate" dir={lang.dir}>
                              {lang.native}
                            </span>
                            {active && (
                              <Check className="ml-auto h-3.5 w-3.5 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                
                <div className="mt-auto border-t border-slate-100 px-5 py-5">
                  {user ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                        <div className="h-9 w-9 rounded-full bg-[#004e98]/10 flex items-center justify-center overflow-hidden shrink-0">
                          {user.photo ? (
                            <img
                              src={user.photo}
                              alt={user.nom}
                              className="h-9 w-9 rounded-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/avatar-placeholder.svg"; }}
                            />
                          ) : (
                            <User className="h-5 w-5 text-[#004e98]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {user.nom}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={
                          user.role === "admin"
                            ? "/dashboard/admin"
                            : user.role === "proprietaire"
                            ? "/dashboard/proprietaire"
                            : "/dashboard/locataire"
                        }
                        onClick={() => setSheetOpen(false)}
                        className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-[14px] font-bold text-slate-700 transition-colors hover:border-[#004e98]"
                      >
                        <User className="h-4 w-4" />
                        {t("nav.dashboard")}
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 rounded-lg bg-red-50 py-2.5 text-[14px] font-bold text-red-600 transition-colors hover:bg-red-100"
                      >
                        <LogOut className="h-4 w-4" />
                        {t("nav.logout")}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <Link
                        href="/auth/login"
                        onClick={() => setSheetOpen(false)}
                        className="flex items-center justify-center rounded-lg border border-[#004e98]/30 py-3 text-[15px] font-bold text-[#004e98] transition-colors hover:border-[#004e98] hover:bg-[#004e98]/5"
                      >
                        {t("nav.login")}
                      </Link>
                      <Link
                        href="/auth/signup"
                        onClick={() => setSheetOpen(false)}
                        className="flex items-center justify-center rounded-lg py-3 text-[15px] font-bold text-white transition-colors hover:bg-[#e85d00]"
                        style={{
                          background: "linear-gradient(135deg, #ff6700 0%, #ff8a3c 100%)",
                          boxShadow: "0 4px 20px -4px rgba(255,103,0,0.5)",
                        }}
                      >
                        {t("nav.register")}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
      </div>
    </header>
  );
}
