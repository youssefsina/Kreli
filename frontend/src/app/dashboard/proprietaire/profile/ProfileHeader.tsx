"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Camera, CheckCircle, Calendar } from "lucide-react";

export function ProfileHeader({
  photo,
  nom,
  email,
  initials,
  roleBadge,
  memberSince,
  statut,
  onPhotoChange,
}: {
  photo?: string;
  nom?: string;
  email?: string;
  initials: string;
  roleBadge: string;
  memberSince: string;
  statut: string;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const photoRef = useRef<HTMLInputElement>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[20px]"
      style={{ border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(15,23,42,0.06)" }}
    >
      <div className="h-28" style={{ background: "linear-gradient(135deg,#0F172A 0%,#1E293B 60%,#334155 100%)" }}>
        <div
          className="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle,#F97316,transparent 70%)" }}
        />
      </div>

      <div className="relative bg-white px-8 pb-7">
        <div className="absolute -top-12 flex items-end gap-4">
          <div className="relative">
            <div
              className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-white text-3xl font-black text-white shadow-lg"
              style={{ background: "#F97316" }}
            >
              {photo ? (
                <Image src={photo} alt={nom ?? ""} fill className="object-cover" />
              ) : (
                initials
              )}
            </div>
            <button
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#F97316] text-white shadow-md transition-transform hover:scale-110"
              title="Modifier la photo"
              onClick={() => photoRef.current?.click()}
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
          </div>
        </div>

        <div className="pt-16">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-black text-[#0F172A]">{nom}</h1>
              <p className="mt-0.5 text-sm text-slate-400">{email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#FFF7ED] px-3 py-1 text-xs font-bold text-[#F97316]">{roleBadge}</span>
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                  <CheckCircle className="h-3 w-3" />
                  Compte {statut}
                </span>
              </div>
            </div>
            <div
              className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs text-slate-500"
              style={{ borderColor: "#E2E8F0", background: "#F8FAFC" }}
            >
              <Calendar className="h-3.5 w-3.5" />
              Membre depuis {memberSince}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
