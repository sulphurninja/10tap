"use client";

import { ChevronDown, Check, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DISPLAY_CURRENCIES,
  useCurrency,
  type DisplayCurrency,
} from "@/lib/currency-context";

const labels: Record<DisplayCurrency, { short: string; long: string; sub: string }> = {
  USD: { short: "USD", long: "US Dollar", sub: "Default · $" },
  INR: { short: "INR", long: "Indian Rupee", sub: "Wallet storage · ₹" },
  USDT: { short: "USDT", long: "Tether USDT", sub: "Stablecoin · ≈ $1" },
};

export function CurrencySwitcher({
  className,
  align = "end",
}: {
  className?: string;
  align?: "start" | "center" | "end";
}) {
  const { currency, setCurrency, pricing } = useCurrency();
  const current = labels[currency];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className={cn(
              "flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:border-sky-200 hover:bg-sky-50/50",
              className
            )}
          >
            <Coins className="size-3.5 text-sky-600" />
            <span>{current.short}</span>
            <ChevronDown className="size-3 text-slate-400" />
          </button>
        }
      />
      <DropdownMenuContent align={align} className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Display currency
          </DropdownMenuLabel>
          {DISPLAY_CURRENCIES.map((c) => {
            const l = labels[c];
            const selected = c === currency;
            return (
              <DropdownMenuItem
                key={c}
                onClick={() => setCurrency(c)}
                className="flex items-start gap-2 py-2"
              >
                <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
                  {selected ? (
                    <Check className="size-3.5 text-sky-600" />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    {l.long}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    {l.sub}
                  </p>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-[11px] leading-relaxed text-slate-400">
          Rate: 1 USD = ₹{pricing.usdInrRate.toFixed(2)} · set by admin.
          <br />
          Wallet is stored in INR; display is a preference.
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
