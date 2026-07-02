"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { loginUser } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { requestAndSaveLocation } from "@/lib/userLocation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function LoginForm() {
  const { login } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token, user } = await loginUser(email, password);
      requestAndSaveLocation();
      login(token, user, rememberMe);
      const redirect = searchParams.get("redirect");
      if (redirect?.startsWith("/dashboard")) {
        router.push(redirect);
      } else if (user.role === "admin") {
        router.push("/dashboard/admin");
      } else if (user.role === "proprietaire" || user.role === "both") {
        router.push("/dashboard/proprietaire");
      } else {
        router.push("/dashboard/locataire");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.err_invalid_credentials"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f5f4]">
      <Navbar />

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div
          className="w-full max-w-[480px] rounded-2xl bg-white dark:bg-slate-800 px-8 py-10"
          style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)" }}
        >
          
          <div className="mb-8 text-center">
            <h1 className="text-[26px] font-black text-[#0f172a] dark:text-white">
              {t("auth.login_title")}
            </h1>
            <p className="mt-1.5 text-[14px] text-[#64748b] dark:text-slate-400">
              {t("auth.login_subtitle")}
            </p>
          </div>

          
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div>
              <label className="mb-1.5 block text-[14px] font-semibold text-[#0f172a] dark:text-slate-300">
                {t("auth.email")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "#94a3b8" }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.email_placeholder")}
                  className="w-full rounded-xl border border-[#e2e8f0] dark:border-slate-600 bg-[#f8fafc] dark:bg-slate-700 py-3 pl-10 pr-4 text-[14px] text-[#0f172a] outline-none transition focus:border-[#004e98] focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-[#004e98]/10 dark:placeholder:text-slate-500 dark:text-slate-100"
                />
              </div>
            </div>

            
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[14px] font-semibold text-[#0f172a] dark:text-slate-300">
                  {t("auth.password")}
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-[13px] font-semibold transition-colors hover:opacity-70"
                  style={{ color: "#ff6700" }}
                >
                  {t("auth.forgot_password")}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "#94a3b8" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.password_placeholder")}
                  className="w-full rounded-xl border border-[#e2e8f0] dark:border-slate-600 bg-[#f8fafc] dark:bg-slate-700 py-3 pl-10 pr-10 text-[14px] text-[#0f172a] outline-none transition focus:border-[#004e98] focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-[#004e98]/10 dark:placeholder:text-slate-500 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#94a3b8" }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-[#cbd5e1] accent-[#004e98]"
              />
              <span className="text-[14px] text-[#475569] dark:text-slate-400">
                {t("auth.remember_me")}
              </span>
            </label>

            
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full py-3.5 text-[15px] font-black text-white transition-all hover:scale-[1.02] hover:shadow-lg disabled:opacity-60"
              style={{ backgroundColor: "#ff6700", boxShadow: "0 4px 14px rgba(255,103,0,0.3)" }}
            >
              {loading ? t("auth.login_loading") : t("auth.login_button")}
            </button>
          </form>

          
          <p className="mt-6 text-center text-[14px] text-[#64748b] dark:text-slate-400">
            {t("auth.no_account")}{" "}
            <Link href="/auth/signup" className="font-bold transition-colors hover:opacity-70" style={{ color: "#ff6700" }}>
              {t("auth.signup_link")}
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f5f5f4]" />}>
      <LoginForm />
    </Suspense>
  );
}

