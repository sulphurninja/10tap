"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight, Building2, CreditCard, Package, Phone, ShoppingBag, TrendingUp,
  ArrowUpRight, Clock, Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useCurrency } from "@/lib/currency-context";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type OrderRow = {
  _id: string;
  countryName: string;
  projectName: string;
  number: string;
  status: string;
  cost: number;
  createdAt: string;
};

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d));
}

function relativeTime(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

async function fetchAllOrders(): Promise<OrderRow[]> {
  const all: OrderRow[] = [];
  let page = 1;
  const limit = 100;
  for (;;) {
    const res = await fetch(`/api/orders?page=${page}&limit=${limit}`);
    if (!res.ok) break;
    const json = (await res.json()) as { data?: { items?: OrderRow[]; total?: number } };
    const items = json.data?.items ?? [];
    const total = json.data?.total ?? 0;
    all.push(...items);
    if (all.length >= total || items.length === 0) break;
    page += 1;
    if (page > 40) break;
  }
  return all;
}

const statusColors: Record<string, string> = {
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  cancelled: "border-slate-200 bg-slate-100 text-slate-500",
  expired: "border-red-200 bg-red-50 text-red-700",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { format } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [recent, setRecent] = useState<OrderRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [listRes, recentRes] = await Promise.all([fetchAllOrders(), fetch("/api/orders?page=1&limit=5")]);
        if (cancelled) return;
        setOrders(listRes);
        if (recentRes.ok) {
          const rj = (await recentRes.json()) as { data?: { items?: OrderRow[] } };
          setRecent(rj.data?.items ?? []);
        }
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const totalOrders = orders.length;
  const completed = orders.filter(o => o.status === "completed").length;
  const pending = orders.filter(o => o.status === "pending").length;
  const totalSpent = orders.reduce((acc, o) => acc + (o.status !== "cancelled" ? o.cost : 0), 0);

  const stats = [
    { label: "Wallet Balance", value: user ? format(user.walletBalance) : "—", sub: "Available to spend", icon: CreditCard, color: "from-sky-500 to-cyan-400", iconBg: "bg-sky-50 text-sky-600" },
    { label: "Total Orders", value: loading ? "—" : String(totalOrders), sub: `${completed} completed`, icon: ShoppingBag, color: "from-emerald-500 to-teal-400", iconBg: "bg-emerald-50 text-emerald-600" },
    { label: "Total Spent", value: loading ? "—" : format(totalSpent), sub: "Lifetime usage", icon: TrendingUp, color: "from-violet-500 to-purple-400", iconBg: "bg-violet-50 text-violet-600" },
    { label: "Active", value: loading ? "—" : String(pending), sub: "Waiting for OTP", icon: Clock, color: "from-amber-500 to-orange-400", iconBg: "bg-amber-50 text-amber-600" },
  ];

  if (loading && !user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72 rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Welcome back, <span className="text-sky-600">{user?.name?.split(" ")[0] ?? "there"}</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">Here&apos;s your account overview and recent activity.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/buy">
            <Button className="gap-2 bg-sky-600 text-white shadow-sm hover:bg-sky-700">
              <Zap className="size-4" />Get Number
            </Button>
          </Link>
          <Link href="/dashboard/wallet">
            <Button variant="outline" className="gap-2 border-slate-200">
              <CreditCard className="size-4" />Top Up
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="relative overflow-hidden border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
              <div className={cn("absolute top-0 left-0 h-1 w-full bg-linear-to-r", s.color)} />
              <CardContent className="pt-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{s.label}</p>
                    {loading ? (
                      <Skeleton className="mt-2 h-8 w-24" />
                    ) : (
                      <p className="mt-1 font-mono text-2xl font-bold tracking-tight text-slate-900">{s.value}</p>
                    )}
                    <p className="mt-1 text-[11px] text-slate-400">{s.sub}</p>
                  </div>
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", s.iconBg)}>
                    <Icon className="size-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "OTP number", desc: "One-time numbers for verification codes", href: "/dashboard/buy", icon: Phone, color: "bg-sky-50 text-sky-600 border-sky-200 hover:bg-sky-100" },
          { title: "Long-term rent", desc: "Dedicated monthly numbers (SMS-BUS rental API)", href: "/dashboard/rent", icon: Building2, color: "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100" },
          { title: "View Orders", desc: "Track all your number purchases", href: "/dashboard/orders", icon: ShoppingBag, color: "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100" },
          { title: "Manage Wallet", desc: "Top up balance and view transactions", href: "/dashboard/wallet", icon: CreditCard, color: "bg-violet-50 text-violet-600 border-violet-200 hover:bg-violet-100" },
        ].map(({ title, desc, href, icon: Icon, color }) => (
          <Link key={href} href={href} className={cn("group flex items-center gap-4 rounded-xl border p-4 transition-all", color)}>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
              <Icon className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-[11px] opacity-70">{desc}</p>
            </div>
            <ArrowUpRight className="size-4 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg text-slate-900">Recent Orders</CardTitle>
            <CardDescription className="text-slate-500">Your last 5 number purchases</CardDescription>
          </div>
          <Link href="/dashboard/orders">
            <Button variant="ghost" size="sm" className="gap-1 text-sky-600 hover:text-sky-700">
              View all <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="px-0">
          {loading ? (
            <div className="space-y-3 px-6">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
            </div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="rounded-2xl bg-slate-50 p-5">
                <Package className="size-10 text-slate-300" />
              </div>
              <p className="text-sm text-slate-500">No orders yet — get your first virtual number.</p>
              <Link href="/dashboard/buy">
                <Button size="sm" className="bg-sky-600 text-white hover:bg-sky-700">Browse Countries</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-slate-700">Service</TableHead>
                  <TableHead className="text-slate-700">Country</TableHead>
                  <TableHead className="text-slate-700">Number</TableHead>
                  <TableHead className="text-slate-700">Cost</TableHead>
                  <TableHead className="text-slate-700">Status</TableHead>
                  <TableHead className="text-right text-slate-700">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map(o => (
                  <TableRow key={o._id} className="border-slate-100 transition-colors hover:bg-slate-50/80">
                    <TableCell className="font-medium text-slate-900">{o.projectName}</TableCell>
                    <TableCell className="text-slate-600">{o.countryName}</TableCell>
                    <TableCell className="font-mono text-sm text-slate-700">{o.number || "—"}</TableCell>
                    <TableCell className="font-mono text-sm text-slate-700">{format(o.cost)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[11px]", statusColors[o.status] ?? "")}>
                        {o.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-slate-400">{relativeTime(o.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
