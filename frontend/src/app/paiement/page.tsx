"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Banknote, CreditCard, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { createLocation, formatPrice } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type PendingBooking = {
  materielId: string;
  materielNom: string;
  startDate: string;
  endDate: string;
  days: number;
  prixParJour: number;
  rentalCost: number;
  total: number;
  caution: number;
};

function readPendingBooking(): PendingBooking | null {
  try {
    const raw = sessionStorage.getItem("kreli_pending_booking");
    return raw ? (JSON.parse(raw) as PendingBooking) : null;
  } catch {
    return null;
  }
}

export default function PaiementPage() {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const [booking, setBooking] = useState<PendingBooking | null>(null);
  const [ready, setReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.replace("/auth/login?redirect=/paiement");
      return;
    }
    setBooking(readPendingBooking());
    setReady(true);
  }, [authLoading, router, token]);

  async function handlePayment(event: FormEvent) {
    event.preventDefault();
    if (!booking || paying) return;

    setPaying(true);
    setError(null);
    try {
      const location = await createLocation({
        materielId: booking.materielId,
        dateDebut: booking.startDate,
        dateFinPrevue: booking.endDate,
      });
      sessionStorage.removeItem("kreli_pending_booking");
      router.replace(`/reservation/confirmation?locationId=${location._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Le paiement n’a pas pu être traité.");
      setPaying(false);
    }
  }

  if (!ready) {
    return <div className="min-h-screen bg-[#f5f5f4]" />;
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#f5f5f4]">
        <Navbar />
        <main className="mx-auto max-w-xl px-4 py-24 text-center">
          <h1 className="text-2xl font-black text-slate-950">Aucune réservation à payer</h1>
          <p className="mt-3 text-slate-500">Sélectionnez d’abord un matériel et vos dates de location.</p>
          <Link
            href="/catalogue"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-[#ff6700] px-4 text-sm font-bold text-white hover:bg-[#e85d00]"
          >
            Voir le catalogue
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f4]">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Link
          href={`/materiel/${booking.materielId}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au matériel
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <form onSubmit={handlePayment} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff6700]">Mode de paiement</p>
                <h1 className="mt-2 text-2xl font-black text-slate-950">Comment souhaitez-vous payer ?</h1>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                <Banknote className="h-5 w-5 text-[#ff6700]" />
              </div>
            </div>

            <div className="mt-8 grid gap-4">
              <button
                type="button"
                disabled
                className="relative cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left opacity-60"
              >
                <div className="flex items-center justify-between gap-3">
                  <CreditCard className="h-6 w-6 text-slate-500" />
                  <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">
                    Bientôt disponible
                  </span>
                </div>
                <p className="mt-5 font-black text-slate-800">Carte bancaire</p>
                <p className="mt-1 text-xs text-slate-500">Visa, Mastercard</p>
              </button>
            </div>

            {error && (
              <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            )}

            <Button
              type="submit"
              disabled={paying}
              className="mt-7 h-12 w-full bg-[#ff6700] text-base font-bold hover:bg-[#e85d00]"
            >
              {paying ? "Création de la demande…" : "Confirmer la réservation"}
            </Button>
            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Banknote className="h-3.5 w-3.5" />
              Aucun paiement n’est demandé maintenant
            </p>
          </form>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-black text-slate-950">Votre réservation</h2>
            <p className="mt-2 font-semibold text-slate-700">{booking.materielNom}</p>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Période</span>
                <span className="text-right font-semibold">{booking.startDate} → {booking.endDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Durée</span>
                <span className="font-semibold">{booking.days} jour{booking.days > 1 ? "s" : ""}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Location</span>
                <span className="font-semibold">{formatPrice(booking.rentalCost)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-black">
                <span>Total</span>
                <span>{formatPrice(booking.total)}</span>
              </div>
            </div>
            {booking.caution > 0 && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Caution de {formatPrice(booking.caution)} enregistrée, non débitée.
              </div>
            )}
            <div className="mt-5 flex gap-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
              La demande sera envoyée au propriétaire pour validation.
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
