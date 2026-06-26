"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getOwnerStats,
  getOwnerLocations,
  formatPrice,
  getMyMateriels,
  acceptLocation,
  rejectLocation,
} from "@/lib/api";
import { Package, Download, Plus, Wallet, Boxes, Inbox } from "lucide-react";
import { StatCard } from "@/components/dashboard/DashboardUI";
import { RevenueChartCard } from "./RevenueChartCard";
import { DemandesCard } from "./DemandesCard";
import { ParcTable } from "./ParcTable";

interface OwnerStats {
  totalMateriels: number;
  disponibiles: number;
  locations: { enAttente: number; acceptees: number; enCours: number; terminees: number; total: number };
  revenus: number;
}

interface Location {
  _id: string;
  materielId: { _id: string; nom: string; photos?: { url: string }[]; localisation?: string };
  locataireId: { _id: string; nom: string; email?: string; telephone?: string };
  dateDebut: string;
  dateFinPrevue: string;
  nbJours?: number;
  statut: string;
  montantLocation: number;
}

interface Materiel {
  _id: string;
  nom: string;
  photos?: { url: string }[];
  disponible?: boolean;
  prixParJour?: number;
  localisation?: string;
  statut?: string;
  nombreLocations?: number;
}

export default function ProprietaireDashboardPage() {
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [materiels, setMateriels] = useState<Materiel[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, locationsData, materielsData] = await Promise.all([
          getOwnerStats(),
          getOwnerLocations({ statut: "en_attente", limit: 4 }),
          getMyMateriels({ limit: 4 }),
        ]);
        setStats(statsData);
        setLocations(locationsData.data);
        setMateriels(materielsData.data);
      } catch {

      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleAct(id: string, action: "accept" | "reject") {
    setActing(id);
    try {
      if (action === "accept") await acceptLocation(id);
      else await rejectLocation(id);
      const fresh = await getOwnerLocations({ statut: "en_attente", limit: 4 });
      setLocations(fresh.data);
      const freshStats = await getOwnerStats();
      setStats(freshStats);
    } catch {

    } finally {
      setActing(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-6 h-8 w-64 animate-pulse rounded-xl bg-white" style={{ border: "1px solid #E2E8F0" }} />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-[20px] bg-white" style={{ border: "1px solid #E2E8F0" }} />
          ))}
        </div>
        <div className="mt-5 h-80 animate-pulse rounded-[20px] bg-white" style={{ border: "1px solid #E2E8F0" }} />
      </div>
    );
  }

  const pending = stats?.locations.enAttente ?? 0;
  const totalMateriels = stats?.totalMateriels ?? 0;
  const disponibles = stats?.disponibiles ?? 0;
  const enLocation = (stats?.locations.acceptees ?? 0) + (stats?.locations.enCours ?? 0);
  const acceptanceRate = stats?.locations.total
    ? Math.round(((stats.locations.acceptees + stats.locations.enCours + stats.locations.terminees) / stats.locations.total) * 100)
    : 0;

  return (
    <div className="p-6 lg:p-8">

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] lg:text-3xl">Tableau de bord</h1>
          <p className="mt-1 text-sm text-slate-400">
            {pending > 0
              ? `${pending} demande${pending > 1 ? "s" : ""} en attente de validation`
              : "Aucune demande en attente"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="hidden items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-[#0F172A] shadow-sm transition hover:shadow-md sm:flex"
            style={{ borderColor: "#E2E8F0" }}
          >
            <Download className="h-4 w-4" />
            Rapport
          </button>
          <Link
            href="/dashboard/proprietaire/ajouter"
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            style={{ background: "#F8812B" }}
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Mettre en location
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Revenu net"
          value={formatPrice(stats?.revenus ?? 0)}
          sub={`${stats?.locations.terminees ?? 0} location${(stats?.locations.terminees ?? 0) !== 1 ? "s" : ""} terminée${(stats?.locations.terminees ?? 0) !== 1 ? "s" : ""}`}
          accent
        />
        <StatCard
          icon={Boxes}
          label="Matériels"
          value={totalMateriels}
          sub={`${disponibles} disponible${disponibles !== 1 ? "s" : ""}`}
        />
        <StatCard
          icon={Package}
          label="En location"
          value={enLocation}
          sub={`${pending} en attente`}
          accent={pending > 0}
        />
        <StatCard
          icon={Inbox}
          label="Total demandes"
          value={stats?.locations.total ?? 0}
          sub={`${acceptanceRate}% acceptées`}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_380px]">
        <RevenueChartCard
          revenus={stats?.revenus ?? 0}
          totalMateriels={totalMateriels}
          enLocation={enLocation}
          pending={pending}
          acceptanceRate={acceptanceRate}
          locationsTotal={stats?.locations.total ?? 0}
        />
        <DemandesCard locations={locations} pending={pending} acting={acting} onAct={handleAct} />
      </div>

      <div className="mt-5">
        <ParcTable
          materiels={materiels}
          totalMateriels={totalMateriels}
          disponibles={disponibles}
          enLocation={enLocation}
        />
      </div>
    </div>
  );
}
