"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft, CreditCard, LayoutDashboard, LogOut, Menu,
  Shield, ShoppingCart, User, Users, X, ChevronRight, Percent,
} from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const adminNav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, desc: "Stats & analytics" },
  { href: "/admin/pricing", label: "Pricing", icon: Percent, desc: "FX & markups" },
  { href: "/admin/users", label: "Users", icon: Users, desc: "Manage accounts" },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, desc: "All purchases" },
  { href: "/admin/transactions", label: "Transactions", icon: CreditCard, desc: "Payment history" },
] as const;

function AdminNavLinks({ onNav, compact }: { onNav?: () => void; compact?: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) => href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="flex flex-col gap-6">
      <div>
        {!compact && <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Admin Panel</p>}
        <nav className="flex flex-col gap-0.5">
          {adminNav.map(({ href, label, icon: Icon, desc }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} onClick={onNav}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                  active ? "bg-sky-50 text-sky-700 font-semibold" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium"
                )}>
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                  active ? "bg-sky-100 text-sky-600" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600"
                )}>
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate">{label}</p>
                  {!compact && <p className="truncate text-[11px] font-normal text-slate-400">{desc}</p>}
                </div>
                {active && <ChevronRight className="size-3.5 text-sky-400" />}
              </Link>
            );
          })}
        </nav>
      </div>
      <div>
        <Separator />
        <p className="mb-2 mt-4 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Navigation</p>
        <Link href="/dashboard" onClick={onNav}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400"><ArrowLeft className="size-4" /></div>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    if (user.role !== "admin") router.replace("/dashboard");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <aside className="hidden w-70 border-r border-slate-200 bg-white p-5 lg:block">
          <Skeleton className="mb-6 h-10 w-32" />
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
        </aside>
        <div className="flex flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
            <Skeleton className="h-8 w-40" /><Skeleton className="size-9 rounded-full" />
          </header>
          <main className="flex-1 p-6"><Skeleton className="h-64 w-full rounded-xl" /></main>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  const initials = user.name.split(/\s+/).map(s => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen bg-slate-50/80">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-70 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/10tap.png" alt="10tap" className="h-8" />
          <Badge className="bg-sky-100 text-[10px] font-semibold text-sky-700 hover:bg-sky-100">Admin</Badge>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4"><AdminNavLinks /></div>
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
              <div className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/10tap.png" alt="10tap" className="h-7" />
                <Badge className="bg-sky-100 text-[10px] font-semibold text-sky-700 hover:bg-sky-100">Admin</Badge>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}><X className="size-5" /></Button>
            </div>
            <div className="px-3 py-4"><AdminNavLinks onNav={() => setMobileOpen(false)} compact /></div>
          </aside>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md lg:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden text-slate-500" onClick={() => setMobileOpen(true)}><Menu className="size-5" /></Button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/10tap.png" alt="10tap" className="h-7 lg:hidden" />
          </div>
          <div className="flex items-center gap-2">
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
                    <Badge className="mt-2 bg-sky-100 text-[10px] font-semibold text-sky-700 hover:bg-sky-100">Admin</Badge>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => router.push("/dashboard")} className="gap-2"><LayoutDashboard className="size-4" />Dashboard</DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => logout()} className="gap-2 text-red-600 focus:text-red-600"><LogOut className="size-4" />Sign Out</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-7xl">{children}</div></main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider><AdminShell>{children}</AdminShell></AuthProvider>;
}
