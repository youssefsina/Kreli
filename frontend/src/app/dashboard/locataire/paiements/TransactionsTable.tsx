"use client";

import { motion } from "framer-motion";
import { CreditCard, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { formatPrice } from "@/lib/api";
import { StatusPill } from "@/components/dashboard/DashboardUI";
import type { PayRow } from "@/lib/pdf";
import { useI18n } from "@/context/I18nContext";

const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const ITEM = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

const COLS = "120px 1fr 130px 120px 110px 56px";

export function TransactionsTable({
  rows,
  totalCount,
  page,
  totalPages,
  pageSize,
  onPageChange,
  onExportRow,
}: {
  rows: PayRow[];
  totalCount: number;
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onExportRow: (row: PayRow) => void;
}) {
  const { t } = useI18n();
  if (totalCount === 0) {
    return (
      <div className="py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] bg-slate-50">
          <CreditCard className="h-8 w-8 text-slate-300" />
        </div>
        <p className="font-semibold text-slate-500">Aucune transaction pour l&apos;instant</p>
        <p className="mt-1 text-sm text-slate-400">
          Vos paiements apparaîtront ici après votre première location.
        </p>
      </div>
    );
  }

  return (
    <>

      <div
        className="grid gap-4 px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]"
        style={{ gridTemplateColumns: COLS, borderBottom: "1px solid #F1F5F9", background: "#FAFAFA" }}
      >
        <span>{t("table.date")}</span>
        <span>{t("table.materiel")}</span>
        <span className="text-right">{t("table.amount")}</span>
        <span className="text-right">{t("catalogue.deposit_label")}</span>
        <span className="text-center">{t("table.status")}</span>
        <span className="text-center">{t("table.action")}</span>
      </div>

      <motion.div variants={STAGGER} initial="hidden" animate="show">
        {rows.map((row) => (
          <motion.div
            key={row.id}
            variants={ITEM}
            className="grid gap-4 items-center px-6 py-4 transition-colors last:border-0"
            style={{ gridTemplateColumns: COLS, borderBottom: "1px solid #F8FAFC" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "#FAFAFA"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
          >

            <p className="text-sm text-slate-500">
              {row.date
                ? new Date(row.date).toLocaleDateString("fr-MA", { day: "numeric", month: "short", year: "numeric" })
                : "—"}
            </p>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#0F172A]">{row.materielNom}</p>
              <p className="text-xs text-slate-400">{row.materielRef}</p>
            </div>

            <p className="text-right text-sm font-bold text-[#0F172A]">{formatPrice(row.montant)}</p>

            <p className="text-right text-sm text-slate-400">{formatPrice(row.caution)}</p>

            <div className="flex justify-center">
              <StatusPill statut={row.statut} />
            </div>

            <div className="flex justify-center">
              <button
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                title="Voir le détail"
                onClick={() => onExportRow(row)}
              >
                <FileText className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: "1px solid #F1F5F9" }}>
          <p className="text-sm text-slate-400">
            Affichage de{" "}
            <strong className="text-[#0F172A]">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)}
            </strong>{" "}
            sur <strong className="text-[#0F172A]">{totalCount}</strong> transactions
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white text-slate-500 transition-all hover:border-slate-300 disabled:opacity-40"
              style={{ borderColor: "#E2E8F0" }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold transition-all"
                  style={
                    page === p
                      ? { background: "#F97316", color: "#fff", border: "1px solid #F97316" }
                      : { border: "1px solid #E2E8F0", color: "#475569", background: "#fff" }
                  }
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border bg-white text-slate-500 transition-all hover:border-slate-300 disabled:opacity-40"
              style={{ borderColor: "#E2E8F0" }}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
