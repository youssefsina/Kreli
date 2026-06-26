"use client";

import { MessageSquare } from "lucide-react";

export default function MessagesView() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center text-slate-400">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
        <MessageSquare className="h-5 w-5 text-slate-400" />
      </div>
      <p className="text-sm font-medium">Messagerie en construction…</p>
    </div>
  );
}
