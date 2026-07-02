"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatPrice } from "@/lib/api";

export function ReservationModal({
  open,
  onOpenChange,
  materielNom,
  prixParJour,
  caution,
  startDate,
  endDate,
  days,
  rentalCost,
  total,
  loading,
  error,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materielNom: string;
  prixParJour: number;
  caution?: number;
  startDate: string;
  endDate: string;
  days: number;
  rentalCost: number;
  total: number;
  loading: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmer la réservation</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {(!startDate || !endDate) && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Veuillez sélectionner les dates de début et de fin avant de confirmer.
            </p>
          )}
          <div className="rounded-lg bg-gray-50 p-4">
            <h3 className="font-bold text-ink mb-2">{materielNom}</h3>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Période</span>
              <span className="font-medium">{startDate || "—"} → {endDate || "—"}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-muted">Durée</span>
              <span className="font-medium">{days > 0 ? `${days} jour${days > 1 ? "s" : ""}` : "—"}</span>
            </div>
          </div>
          {days > 0 && (
            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Location ({formatPrice(prixParJour)} x {days}j)</span>
                <span className="font-medium">{formatPrice(rentalCost)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Total</span>
                <span className="text-slate-950">{formatPrice(total)}</span>
              </div>
            </div>
          )}
          {caution && caution > 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              Caution requise : {formatPrice(caution)}
            </div>
          )}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading || !startDate || !endDate}
            className="bg-[#ff6700] hover:bg-[#e85d00]"
          >
            {loading ? "Envoi en cours…" : "Confirmer la réservation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
