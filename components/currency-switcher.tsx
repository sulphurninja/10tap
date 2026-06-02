"use client";

import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";

/** USDT-only — static badge (no currency picker). */
export function CurrencySwitcher({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm",
        className
      )}
      title="All prices and wallet balance are shown in USDT"
    >
      <Coins className="size-3.5 text-sky-600" />
      <span>USDT</span>
    </div>
  );
}
