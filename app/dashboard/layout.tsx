"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Menu, Phone, ShoppingCart, Wallet, Shield,
  LogOut, User, X, CreditCard,
  ChevronRight, Zap, Building2,
  HelpCircle,
} from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { CurrencyProvider, useCurrency } from "@/lib/currency-context";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mainNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, desc: "Dashboard home" },
  { href: "/dashboard/buy", label: "OTP Number", icon: Phone, desc: "One-time verification" },
  { href: "/dashboard/rent", label: "Long-term Rent", icon: Building2, desc: "Monthly dedicated numbers" },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart, desc: "Order history" },
  { href: "/dashboard/wallet", label: "Wallet", icon: Wallet, desc: "Balance & transactions" },
] as const;

function NavLinks({ onNav, compact }: { onNav?: () => void; compact?: boolean }) {
  const path = usePathname();
  const { user } = useAuth();
  const active = (h: string) => h === "/dashboard" ? path === "/dashboard" : path.startsWith(h);

  return (
    <div className="flex flex-col gap-6">
      <div>
        {!compact && <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Main</p>}
        <nav className="flex flex-col gap-0.5">
          {mainNav.map(({ href, label, icon: Icon, desc }) => (
            <Link key={href} href={href} onClick={onNav}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                active(href)
                  ? "bg-sky-50 text-sky-700 font-semibold"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium"
              )}>
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                active(href) ? "bg-sky-100 text-sky-600" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600"
              )}>
                <Icon className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate">{label}</p>
                {!compact && <p className="truncate text-[11px] font-normal text-slate-400">{desc}</p>}
              </div>
              {active(href) && <ChevronRight className="size-3.5 text-sky-400" />}
            </Link>
          ))}
        </nav>
      </div>

      {user?.role === "admin" && (
        <div>
          <Separator />
          <p className="mb-2 mt-4 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Admin</p>
          <Link href="/admin" onClick={onNav}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <Shield className="size-4" />
            </div>
            Admin Panel
          </Link>
        </div>
      )}

      <div>
        <Separator />
        <p className="mb-2 mt-4 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Support</p>
        <nav className="flex flex-col gap-0.5">
          <a href="mailto:support@10tap.io" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400"><HelpCircle className="size-4" /></div>
            Help & Support
          </a>
        </nav>
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { format: formatAmount } = useCurrency();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <aside className="hidden w-70 border-r border-slate-200 bg-white p-5 lg:block">
          <Skeleton className="mb-6 h-10 w-32" />
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
        </aside>
        <div className="flex flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
            <Skeleton className="h-8 w-40" />
            <div className="flex gap-3"><Skeleton className="h-9 w-28 rounded-full" /><Skeleton className="size-9 rounded-full" /></div>
          </header>
          <main className="flex-1 p-6"><Skeleton className="h-64 w-full rounded-xl" /></main>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = user.name.split(/\s+/).map(s => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen bg-slate-50/80">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-70 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-slate-100 px-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/10tap.png" alt="10tap" className="h-8" />
        </div>

        {/* Quick action */}
        <div className="px-4 pt-4">
          <Link href="/dashboard/buy">
            <Button className="w-full gap-2 bg-sky-600 text-white hover:bg-sky-700 shadow-sm">
              <Zap className="size-4" />Get a Number
            </Button>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4"><NavLinks /></div>

        {/* User footer */}
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
            <Avatar className="size-9 border border-slate-200">
              <AvatarFallback className="bg-sky-50 text-xs font-semibold text-sky-700">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-slate-800">{user.name}</p>
              <p className="truncate text-[11px] text-slate-400">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-75 bg-white shadow-xl animate-in slide-in-from-left duration-200">
            <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/10tap.png" alt="10tap" className="h-7" />
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}><X className="size-5" /></Button>
            </div>
            <div className="px-3 pt-3">
              <Link href="/dashboard/buy" onClick={() => setMobileOpen(false)}>
                <Button className="w-full gap-2 bg-sky-600 text-white hover:bg-sky-700 shadow-sm">
                  <Zap className="size-4" />Get a Number
                </Button>
              </Link>
            </div>
            <div className="px-3 py-4"><NavLinks onNav={() => setMobileOpen(false)} compact /></div>
          </aside>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md lg:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden text-slate-500" onClick={() => setMobileOpen(true)}>
              <Menu className="size-5" />
            </Button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/10tap.png" alt="10tap" className="h-7 lg:hidden" />
          </div>

          <div className="flex items-center gap-2">
            {/* Currency switcher */}
            <CurrencySwitcher />

            {/* Wallet pill */}
            <Link href="/dashboard/wallet" className="hidden sm:block">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm transition-colors hover:border-sky-200 hover:bg-sky-50/50">
                <CreditCard className="size-3.5 text-sky-600" />
                <span className="font-mono text-xs font-semibold text-slate-700">{formatAmount(user.walletBalance ?? 0)}</span>
                <Badge className="h-5 bg-sky-100 text-[10px] font-semibold text-sky-700 hover:bg-sky-100">Top Up</Badge>
              </div>
            </Link>

            <Separator orientation="vertical" className="hidden h-6 sm:block" />

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" className="relative gap-2 rounded-full px-2 py-1.5">
                    <Avatar className="size-8 border border-slate-200">
                      <AvatarFallback className="bg-sky-50 text-xs font-semibold text-sky-700">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="hidden text-sm font-medium text-slate-700 md:block">{user.name.split(" ")[0]}</span>
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" className="border-sky-200 bg-sky-50 text-[10px] font-semibold text-sky-700">{user.role === "admin" ? "Admin" : "Member"}</Badge>
                      <span className="font-mono text-[11px] text-slate-500">{formatAmount(user.walletBalance)}</span>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => router.push("/dashboard")} className="gap-2"><LayoutDashboard className="size-4" />Dashboard</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/dashboard/wallet")} className="gap-2"><Wallet className="size-4" />Wallet</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/dashboard/orders")} className="gap-2"><ShoppingCart className="size-4" />Orders</DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => logout()} className="gap-2 text-red-600 focus:text-red-600"><LogOut className="size-4" />Sign Out</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-6xl">{children}</div></main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <Shell>{children}</Shell>
      </CurrencyProvider>
    </AuthProvider>
  );
}
