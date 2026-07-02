"use client";

import { cn } from "@/lib/utils";

export type StatusTab = { key: string; label: string };

export function StatusTabs({
  tabs,
  active,
  counts,
  onChange,
}: {
  tabs: StatusTab[];
  active: string;
  counts: Record<string, number>;
  onChange: (key: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <div className="flex w-fit gap-0" style={{ borderBottom: "1px solid #E2E8F0" }}>
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          const count = counts[tab.key] ?? 0;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap border-b-2 px-5 py-3 text-sm font-semibold transition-all duration-150",
                isActive
                  ? "border-[#F97316] text-[#F97316]"
                  : "border-transparent text-slate-500 hover:text-[#0F172A]"
              )}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-black",
                    isActive ? "bg-orange-50 text-[#F97316]" : "bg-slate-100 text-slate-500"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
