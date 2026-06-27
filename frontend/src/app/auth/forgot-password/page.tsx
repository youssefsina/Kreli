"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, Key, CheckCircle } from "lucide-react";
import { forgotPassword } from "@/lib/api";
import { useI18n } from "@/context/I18nContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  
  return (
    <div className="flex min-h-screen flex-col bg-[#f5f5f4]">
      <Navbar />

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div
          className="w-full max-w-[460px] rounded-2xl bg-white px-8 py-10"
          style={{ boxShadow: "0 4px 32px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)" }}
        >
          {sent ? (
            
            <div className="flex flex-col items-center gap-5 text-center py-4">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ backgroundColor: "rgba(34,197,94,0.1)" }}
              >
                <CheckCircle className="h-8 w-8" style={{ color: "#22c55e" }} />
              </div>
              <div>
                <h1 className="text-[22px] font-black" style={{ color: "#0f172a" }}>
                  {t("auth.email_sent_title")}
                </h1>
                <p className="mt-2 text-[14px] leading-relaxed" style={{ color: "#64748b" }}>
                  {t("auth.email_sent_body_a")} <strong>{email}</strong>{" "}
                  {t("auth.email_sent_body_b")}
                </p>
              </div>
              <Link
                href="/auth/login"
                className="mt-2 inline-flex rounded-full px-7 py-3 text-[14px] font-bold text-white transition-all hover:scale-[1.02]"
                style={{ backgroundColor: "#004e98" }}
              >
                {t("auth.back_to_login")}
              </Link>
            </div>
          ) : (
            
            <>
              
              <div className="mb-8 flex flex-col items-center gap-4 text-center">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: "rgba(255,103,0,0.1)" }}
                >
                  <Key className="h-8 w-8" style={{ color: "#ff6700" }} />
                </div>
                <div>
                  <h1 className="text-[24px] font-black" style={{ color: "#0f172a" }}>
                    {t("auth.forgot_title")}
                  </h1>
                  <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: "#64748b" }}>
                    {t("auth.forgot_subtitle")}
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    className="mb-1.5 block text-[11px] font-black uppercase tracking-[1.5px]"
                    style={{ color: "#94a3b8" }}
                  >
                    {t("auth.email")}
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
                      style={{ color: "#94a3b8" }}
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("auth.email_placeholder")}
                      className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] py-3 pl-10 pr-4 text-[14px] outline-none transition focus:border-[#ff6700] focus:bg-white focus:ring-2 focus:ring-[#ff6700]/10"
                      style={{ color: "#0f172a" }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full py-3.5 text-[15px] font-black text-white transition-all hover:scale-[1.02] hover:shadow-lg disabled:opacity-60"
                  style={{ backgroundColor: "#ff6700", boxShadow: "0 4px 14px rgba(255,103,0,0.3)" }}
                >
                  {loading ? t("auth.sending") : t("auth.send_link")}
                </button>
              </form>

              <p className="mt-6 text-center text-[14px]" style={{ color: "#64748b" }}>
                {t("auth.back_to_login_prefix")}{" "}
                <Link
                  href="/auth/login"
                  className="font-semibold transition-colors hover:opacity-70"
                  style={{ color: "#ff6700" }}
                >
                  {t("auth.back_to_login_link")}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
