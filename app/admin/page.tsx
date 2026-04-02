"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  IndianRupee,
  LayoutDashboard,
  ShoppingCart,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type AdminStats = {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalActiveOrders: number;
};

function formatInr(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/stats");
        const json = (await res.json()) as {
          success?: boolean;
          data?: AdminStats;
          error?: string;
        };
        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.error ?? "Failed to load stats");
        }
        if (!cancelled) setStats(json.data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Something went wrong");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = [
    {
      title: "Total Users",
      value: stats ? String(stats.totalUsers) : "—",
      icon: Users,
      gradient: "bg-gradient-to-br from-blue-50 to-white",
      iconWrap: "bg-blue-50 text-blue-600",
    },
    {
      title: "Total Orders",
      value: stats ? String(stats.totalOrders) : "—",
      icon: ShoppingCart,
      gradient: "bg-gradient-to-br from-emerald-50 to-white",
      iconWrap: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Revenue",
      value: stats ? formatInr(stats.totalRevenue) : "—",
      icon: IndianRupee,
      gradient: "bg-gradient-to-br from-sky-50 to-white",
      iconWrap: "bg-sky-50 text-sky-600",
    },
    {
      title: "Active Orders",
      value: stats ? String(stats.totalActiveOrders) : "—",
      icon: Clock,
      gradient: "bg-gradient-to-br from-amber-50 to-white",
      iconWrap: "bg-amber-50 text-amber-600",
    },
  ] as const;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-slate-500">
          <LayoutDashboard className="size-5 text-sky-600" aria-hidden />
          <span className="text-sm font-medium uppercase tracking-wider">
            Control center
          </span>
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          Admin overview
        </h1>
        <p className="mt-1 text-slate-600">
          Platform health, revenue, and operational metrics at a glance.
        </p>
      </div>

      {error && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card
                key={i}
                className="overflow-hidden border-slate-200 bg-white shadow-sm"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="size-11 rounded-xl" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="mt-2 h-3 w-20" />
                </CardContent>
              </Card>
            ))
          : cards.map((c) => {
              const Icon = c.icon;
              return (
                <Card
                  key={c.title}
                  className={cn(
                    "overflow-hidden border-slate-200 shadow-sm transition-shadow hover:shadow-md",
                    c.gradient
                  )}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <span className="text-sm font-medium text-slate-600">
                      {c.title}
                    </span>
                    <div
                      className={cn(
                        "flex size-11 items-center justify-center rounded-xl",
                        c.iconWrap
                      )}
                    >
                      <Icon className="size-5" aria-hidden />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
                      {c.value}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Live from database
                    </p>
                  </CardContent>
                </Card>
              );
            })}
      </div>
    </div>
  );
}
