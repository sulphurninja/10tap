"use client";

import { useCallback, useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type OrderStatus = "pending" | "completed" | "cancelled" | "expired";

type PopulatedUser = {
  _id: string;
  name: string;
  email: string;
};

type AdminOrderRow = {
  _id: string;
  requestId: string;
  userId: PopulatedUser | string;
  countryName: string;
  projectName: string;
  number: string;
  smsCode?: string;
  status: OrderStatus;
  cost: number;
  createdAt: string;
};

type OrdersPayload = {
  items: AdminOrderRow[];
  page: number;
  limit: number;
  total: number;
};

const PAGE_LIMIT = 20;

function formatInr(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function getOrderUser(row: AdminOrderRow): PopulatedUser | null {
  const u = row.userId;
  if (u && typeof u === "object" && "name" in u && "email" in u) {
    return u as PopulatedUser;
  }
  return null;
}

function statusClass(status: OrderStatus) {
  switch (status) {
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "cancelled":
      return "border-slate-200 bg-slate-100 text-slate-500";
    case "expired":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-500";
  }
}

export default function AdminOrdersPage() {
  const [data, setData] = useState<OrdersPayload | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/orders?page=${p}&limit=${PAGE_LIMIT}`
      );
      const json = (await res.json()) as {
        success?: boolean;
        data?: OrdersPayload;
        error?: string;
      };
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error ?? "Failed to load orders");
      }
      setData(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(page);
  }, [page, fetchOrders]);

  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / data.limit))
    : 1;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-slate-500">
          <ShoppingCart className="size-5 text-sky-600" aria-hidden />
          <span className="text-sm font-medium uppercase tracking-wider">
            Fulfillment
          </span>
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          All orders
        </h1>
        <p className="mt-1 text-slate-600">
          Monitor numbers, SMS codes, and order status across the platform.
        </p>
      </div>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-6">
          <CardTitle className="text-lg text-slate-900">Orders</CardTitle>
          <p className="text-sm text-slate-500">
            {loading
              ? "Loading…"
              : data
                ? `${data.total} total`
                : "—"}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <div className="border-b border-slate-100 px-6 py-4 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="relative overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="min-w-[120px] font-semibold text-slate-900">
                    Order ID
                  </TableHead>
                  <TableHead className="min-w-[200px] font-semibold text-slate-900">
                    User
                  </TableHead>
                  <TableHead className="min-w-[120px] font-semibold text-slate-900">
                    Country
                  </TableHead>
                  <TableHead className="min-w-[140px] font-semibold text-slate-900">
                    Service
                  </TableHead>
                  <TableHead className="min-w-[120px] font-semibold text-slate-900">
                    Number
                  </TableHead>
                  <TableHead className="min-w-[100px] font-semibold text-slate-900">
                    SMS
                  </TableHead>
                  <TableHead className="min-w-[110px] font-semibold text-slate-900">
                    Status
                  </TableHead>
                  <TableHead className="min-w-[100px] text-right font-semibold text-slate-900">
                    Cost
                  </TableHead>
                  <TableHead className="min-w-[180px] font-semibold text-slate-900">
                    Date
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i} className="border-slate-100">
                      {Array.from({ length: 9 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full max-w-[8rem]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !data || data.items.length === 0 ? (
                  <TableRow className="border-slate-100">
                    <TableCell
                      colSpan={9}
                      className="h-32 text-center text-slate-500"
                    >
                      No orders yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((row) => {
                    const u = getOrderUser(row);
                    return (
                      <TableRow
                        key={String(row._id)}
                        className="border-slate-100 transition-colors hover:bg-slate-50"
                      >
                        <TableCell className="font-mono text-xs text-slate-500">
                          {row.requestId}
                        </TableCell>
                        <TableCell>
                          {u ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium text-slate-900">
                                {u.name}
                              </span>
                              <span className="text-xs text-slate-500">
                                {u.email}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-900">
                          {row.countryName}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-slate-900">
                          {row.projectName}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-slate-900">
                          {row.number}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-slate-900">
                          {row.smsCode ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-normal capitalize",
                              statusClass(row.status)
                            )}
                          >
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm tabular-nums text-slate-900">
                          {formatInr(row.cost)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-slate-600">
                          {formatDate(row.createdAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {!loading && data && data.total > 0 && (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 px-4 py-4 sm:flex-row sm:px-6">
              <p className="text-sm text-slate-500">
                Page {data.page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="border-slate-200"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                  className="border-slate-200"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
