"use client";

import { HardHat, Wrench } from "lucide-react";

export type Role = "proprietaire" | "locataire" | "both";

export function RoleSelector({ value, onChange }: { value: Role; onChange: (role: Role) => void }) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-ink dark:text-slate-200">Je souhaite être</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange("proprietaire")}
          className="flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-semibold transition"
          style={{
            borderColor: value === "proprietaire" ? "#ff6700" : "#e2e8f0",
            backgroundColor: value === "proprietaire" ? "rgba(255,103,0,0.05)" : "transparent",
            color: value === "proprietaire" ? "#ff6700" : "#64748b",
          }}
        >
          <HardHat className="h-6 w-6" />
          Propriétaire
          <span className="text-[10px] font-normal text-muted">
            Je propose du matériel à la location
          </span>
        </button>
        <button
          type="button"
          onClick={() => onChange("locataire")}
          className="flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-semibold transition"
          style={{
            borderColor: value === "locataire" ? "#ff6700" : "#e2e8f0",
            backgroundColor: value === "locataire" ? "rgba(255,103,0,0.05)" : "transparent",
            color: value === "locataire" ? "#ff6700" : "#64748b",
          }}
        >
          <Wrench className="h-6 w-6" />
          Locataire
          <span className="text-[10px] font-normal text-muted">
            Je recherche du matériel spécifique
          </span>
        </button>
      </div>
    </div>
  );
}

