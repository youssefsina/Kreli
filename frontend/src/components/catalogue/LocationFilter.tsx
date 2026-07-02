"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { MapPin, X, Navigation, Loader2, LocateFixed } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import {
  MOROCCAN_CITIES,
  MIN_RADIUS_KM,
  MAX_RADIUS_KM,
  DEFAULT_RADIUS_KM,
  haversineKm,
  type CityCoord,
} from "@/lib/cities";
import { useI18n } from "@/context/I18nContext";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useNominatim } from "@/hooks/useNominatim";


const MapPickerLeaflet = dynamic(() => import("./MapPickerLeaflet"), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-full w-full items-center justify-center rounded-xl"
      style={{ background: "linear-gradient(135deg, #f1f5f9, #e2e8f0)" }}
    >
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#ff6700" }} />
    </div>
  ),
});

const CASABLANCA_FALLBACK: CityCoord = { name: "Casablanca", lat: 33.5731, lng: -7.5898 };

function findNearestCity(lat: number, lng: number): CityCoord {
  return MOROCCAN_CITIES.reduce<CityCoord>((nearest, city) => {
    const d = haversineKm({ lat, lng, name: "" }, city);
    const dn = haversineKm({ lat, lng, name: "" }, nearest);
    return d < dn ? city : nearest;
  }, MOROCCAN_CITIES[0] ?? CASABLANCA_FALLBACK);
}

export interface LocationFilterProps {
  ville: string;
  rayon: number;
  lat?: number;
  lng?: number;
  onApply: (
    ville: string | null,
    rayon: number | null,
    lat: number | null,
    lng: number | null
  ) => void;
}

export default function LocationFilter({ ville, rayon, lat, lng, onApply }: LocationFilterProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  
  const [draftCity, setDraftCity] = useState(ville);
  const [draftRadius, setDraftRadius] = useState<number>(rayon || DEFAULT_RADIUS_KM);
  const [draftLat, setDraftLat] = useState<number>(lat ?? CASABLANCA_FALLBACK.lat);
  const [draftLng, setDraftLng] = useState<number>(lng ?? CASABLANCA_FALLBACK.lng);

  const [search, setSearch] = useState("");
  const geo = useGeolocation();

  
  const { results: nominatimResults, loading: nominatimLoading } = useNominatim(
    search,
    search.trim().length >= 2
  );

  
  useEffect(() => {
    if (open) {
      setDraftCity(ville);
      setDraftRadius(rayon || DEFAULT_RADIUS_KM);
      const city = MOROCCAN_CITIES.find((c) => c.name === ville);
      if (city) {
        setDraftLat(city.lat);
        setDraftLng(city.lng);
      } else if (lat && lng) {
        setDraftLat(lat);
        setDraftLng(lng);
      } else {
        setDraftLat(CASABLANCA_FALLBACK.lat);
        setDraftLng(CASABLANCA_FALLBACK.lng);
      }
      setSearch("");
    }
  }, [open, ville, rayon, lat, lng]);

  
  useEffect(() => {
    if (geo.lat !== null && geo.lng !== null) {
      setDraftLat(geo.lat);
      setDraftLng(geo.lng);
      const nearest = findNearestCity(geo.lat, geo.lng);
      setDraftCity(nearest.name);
    }
  }, [geo.lat, geo.lng]);

  
  const staticFiltered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return MOROCCAN_CITIES;
    return MOROCCAN_CITIES.filter((c) => c.name.toLowerCase().includes(term));
  }, [search]);

  
  const showNominatim = search.trim().length >= 2 && staticFiltered.length === 0;
  const listItems: Array<{ name: string; lat: number; lng: number }> = showNominatim
    ? nominatimResults
    : staticFiltered;

  function selectCity(name: string, cityLat: number, cityLng: number) {
    setDraftCity(name);
    setDraftLat(cityLat);
    setDraftLng(cityLng);
    setSearch("");
  }

  function handlePositionChange(newLat: number, newLng: number) {
    setDraftLat(newLat);
    setDraftLng(newLng);
    
    const nearest = findNearestCity(newLat, newLng);
    const dist = haversineKm({ lat: newLat, lng: newLng, name: "" }, nearest);
    
    setDraftCity(dist <= 80 ? nearest.name : "");
  }

  function handleApply() {
    if (!draftCity && !draftLat) {
      onApply(null, null, null, null);
    } else {
      onApply(draftCity || "Position choisie", draftRadius, draftLat, draftLng);
    }
    setOpen(false);
  }

  function handleClear() {
    setDraftCity("");
    setDraftRadius(DEFAULT_RADIUS_KM);
    setDraftLat(CASABLANCA_FALLBACK.lat);
    setDraftLng(CASABLANCA_FALLBACK.lng);
    onApply(null, null, null, null);
    setOpen(false);
  }

  
  const hasSelection = true;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      
      <PopoverTrigger
        className="flex w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 text-left transition-colors hover:border-[#ff6700]"
        style={{ borderColor: ville ? "#ff6700" : "#e2e8f0" }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: ville ? "rgba(255,103,0,0.1)" : "#f8fafc" }}
          >
            <MapPin className="h-4 w-4" style={{ color: ville ? "#ff6700" : "#94a3b8" }} />
          </div>
          <div className="min-w-0">
            {ville ? (
              <>
                <p className="truncate text-[13px] font-bold" style={{ color: "#0f172a" }}>
                  {ville}
                </p>
                <p className="text-[11px]" style={{ color: "#64748b" }}>
                  {t("location_filter.trigger_radius_prefix")} {rayon || DEFAULT_RADIUS_KM}{" "}
                  {t("location_filter.trigger_radius_suffix")}
                </p>
              </>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                
                <img
                  src="/ma-orange.svg"
                  alt=""
                  aria-hidden="true"
                  style={{ width: 28, height: 28, opacity: 0.55, flexShrink: 0 }}
                />
                <div>
                  <p className="text-[13px] font-bold" style={{ color: "#0f172a" }}>
                    {t("location_filter.trigger_label_empty")}
                  </p>
                  <p className="text-[11px]" style={{ color: "#94a3b8" }}>
                    {t("location_filter.trigger_hint_empty")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        {ville && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Réinitialiser le filtre ville"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleClear();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                handleClear();
              }
            }}
            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200"
          >
            <X className="h-3.5 w-3.5" style={{ color: "#64748b" }} />
          </span>
        )}
      </PopoverTrigger>

      
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[380px] rounded-2xl border-0 p-0 shadow-2xl"
        style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.18)" }}
      >
        <div className="flex flex-col gap-4 p-5">
          
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-black" style={{ color: "#0f172a" }}>
              {t("location_filter.modal_title")}
            </h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-slate-100"
              aria-label={t("nav.close")}
            >
              <X className="h-4 w-4" style={{ color: "#64748b" }} />
            </button>
          </div>

          
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label
                className="text-[10px] font-black uppercase tracking-[1.5px]"
                style={{ color: "#94a3b8" }}
              >
                {t("location_filter.city_label")}
              </label>

              
              <button
                type="button"
                onClick={geo.request}
                disabled={geo.loading}
                title="Utiliser ma position"
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all hover:opacity-80 disabled:opacity-50"
                style={{ backgroundColor: "rgba(255,103,0,0.1)", color: "#ff6700" }}
              >
                {geo.loading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <LocateFixed className="h-3 w-3" />
                )}
                Ma position
              </button>
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={draftCity || t("location_filter.city_search_placeholder")}
              className="w-full rounded-xl border bg-[#f8fafc] px-4 py-2.5 text-[14px] outline-none transition focus:border-[#ff6700] focus:bg-white"
              style={{ borderColor: "#e2e8f0", color: "#0f172a" }}
            />

            <div
              className="max-h-[140px] overflow-y-auto rounded-xl border"
              style={{ borderColor: "#e2e8f0" }}
            >
              {nominatimLoading && showNominatim ? (
                <p className="flex items-center gap-2 px-4 py-3 text-[13px]" style={{ color: "#94a3b8" }}>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Recherche…
                </p>
              ) : listItems.length === 0 ? (
                <p className="px-4 py-3 text-[13px]" style={{ color: "#94a3b8" }}>
                  {t("location_filter.no_city")}
                </p>
              ) : (
                listItems.map((c) => {
                  const active = draftCity === c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => selectCity(c.name, c.lat, c.lng)}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-[13px] transition-colors hover:bg-slate-50"
                      style={{
                        backgroundColor: active ? "rgba(255,103,0,0.08)" : "transparent",
                        color: active ? "#ff6700" : "#0f172a",
                        fontWeight: active ? 800 : 500,
                      }}
                    >
                      <span>{c.name}</span>
                      {active && <Navigation className="h-3.5 w-3.5" />}
                    </button>
                  );
                })
              )}
            </div>

            {geo.error && (
              <p className="text-[11px]" style={{ color: "#ef4444" }}>
                {geo.error}
              </p>
            )}
          </div>

          
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[1.5px]" style={{ color: "#94a3b8" }}>
                Zone de recherche
              </p>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: "rgba(255,103,0,0.1)", color: "#ff6700" }}
              >
                {draftRadius} km autour
              </span>
            </div>
            <div
              className="relative overflow-hidden rounded-xl border"
              style={{ height: "280px", borderColor: "#ff6700", borderWidth: 1.5 }}
            >
              <MapPickerLeaflet
                lat={draftLat}
                lng={draftLng}
                radiusKm={draftRadius}
                onPositionChange={handlePositionChange}
              />
              
              <div
                className="pointer-events-none absolute bottom-1 right-1 rounded px-1.5 py-0.5 text-[9px]"
                style={{ backgroundColor: "rgba(255,255,255,0.75)", color: "#64748b" }}
              >
                © OpenStreetMap
              </div>
            </div>
            <p className="text-[10px]" style={{ color: "#94a3b8" }}>
              Faites glisser le marqueur ou cliquez sur la carte pour ajuster.
            </p>
          </div>

          
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label
                className="text-[10px] font-black uppercase tracking-[1.5px]"
                style={{ color: "#94a3b8" }}
              >
                {t("location_filter.radius_label")}
              </label>
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-black"
                style={{ backgroundColor: "rgba(255,103,0,0.1)", color: "#ff6700" }}
              >
                {draftRadius} km
              </span>
            </div>

            <Slider
              dir="ltr"
              min={MIN_RADIUS_KM}
              max={MAX_RADIUS_KM}
              step={5}
              value={[draftRadius]}
              onValueChange={(v) => {
                const next = Array.isArray(v) ? v[0] : v;
                if (typeof next === "number") setDraftRadius(next);
              }}
              className="[&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-thumb]]:border-2 [&_[data-slot=slider-thumb]]:border-[#ff6700] [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:ring-[#ff6700]/20"
            />
            <div className="flex justify-between text-[10px] font-bold" style={{ color: "#94a3b8" }}>
              <span>{MIN_RADIUS_KM} km</span>
              <span>{MAX_RADIUS_KM} km</span>
            </div>
          </div>

          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 rounded-xl border px-4 py-2.5 text-[13px] font-bold transition-colors hover:bg-slate-50"
              style={{ borderColor: "#e2e8f0", color: "#64748b" }}
            >
              {t("location_filter.reset")}
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!hasSelection}
              className="flex-1 rounded-xl px-4 py-2.5 text-[13px] font-black text-white transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              style={{
                backgroundColor: "#ff6700",
                boxShadow: "0 4px 14px rgba(255,103,0,0.35)",
              }}
            >
              {t("location_filter.apply")}
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
