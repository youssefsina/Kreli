"use client";

import { useRef, useState } from "react";
import { Upload, AlertCircle, X } from "lucide-react";

type Photo = { url: string; preview: string };

export function PhotoUploader({
  photos,
  uploadingIdx,
  onFiles,
  onRemove,
}: {
  photos: Photo[];
  uploadingIdx: number | null;
  onFiles: (files: FileList | null) => void;
  onRemove: (index: number) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <>
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); onFiles(e.dataTransfer.files); }}
        className="flex cursor-pointer flex-col items-center gap-2.5 rounded-2xl px-5 py-7 transition-colors"
        style={{
          border: `2px dashed ${dragOver ? "#F97316" : "#E2E8F0"}`,
          background: dragOver ? "#FFF7ED" : "#F8FAFC",
        }}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white" style={{ border: "1px solid #E2E8F0" }}>
          <Upload className="h-5 w-5 text-slate-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-[#0F172A]">Cliquez ou glissez vos photos ici</p>
          <p className="mt-1 text-xs text-slate-400">
            {photos.length}/6 photo{photos.length !== 1 ? "s" : ""} ajoutée{photos.length !== 1 ? "s" : ""}
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      {photos.length > 0 && (
        <div className="mt-3.5 grid grid-cols-3 gap-2.5">
          {photos.map((p, i) => (
            <div key={i} className="relative overflow-hidden rounded-xl bg-slate-100" style={{ paddingBottom: "75%" }}>

              <img src={p.preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
              {uploadingIdx === i && (
                <div className="absolute inset-0 grid place-items-center" style={{ background: "rgba(15,23,42,0.4)" }}>
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                </div>
              )}
              {!p.url && uploadingIdx !== i && (
                <div className="absolute inset-0 grid place-items-center" style={{ background: "rgba(239,68,68,0.4)" }}>
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
              )}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full text-white"
                style={{ background: "rgba(15,23,42,0.6)" }}
              >
                <X className="h-3 w-3" />
              </button>
              {i === 0 && (
                <div
                  className="absolute bottom-1.5 left-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                  style={{ background: "rgba(15,23,42,0.6)" }}
                >
                  Principale
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
