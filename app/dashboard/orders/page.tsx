"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardList, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
type OrderRow = {
  _id: string;
  requestId: string;
  countryName: string;
  projectName: string;
  number: string;
  smsCode?: string;
  status: "pending" | "completed" | "cancelled" | "expired";
  createdAt: string;
};

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(d));
}

function truncateId(id: string) {
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

function statusBadgeClass(status: OrderRow["status"]) {
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
      return "";
  }
}

export default function OrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/orders?page=${page}&limit=${limit}`
      );
      if (!res.ok) {
        toast.error("Could not load orders");
        return;
      }
      const json = (await res.json()) as {
        data?: { items?: OrderRow[]; total?: number };
      };
      setOrders(json.data?.items ?? []);
      setTotal(json.data?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    void load();
  }, [load]);

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Order History
        </h1>
        <p className="text-sm text-slate-600">
          Every number, code, and status in one ledger.
        </p>
      </div>

      <Card className="border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
        <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-4 space-y-0">
          <div className="space-y-1.5">
            <CardTitle className="text-lg text-slate-900">All orders</CardTitle>
            <CardDescription className="text-slate-500">
              {total === 0 && !loading
                ? "No orders yet"
                : `${total} order${total === 1 ? "" : "s"} total`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Per page</span>
            <Select
              value={String(limit)}
              onValueChange={(v) => {
                setLimit(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[4.75rem] rounded-lg border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {loading ? (
            <div className="space-y-3 px-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8">
                <ClipboardList className="mx-auto size-12 text-slate-400" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Nothing here yet</p>
                <p className="mt-1 max-w-sm text-sm text-slate-600">
                  When you buy a number, it shows up here with live status and
                  SMS codes.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="whitespace-nowrap text-slate-700">
                      Order ID
                    </TableHead>
                    <TableHead className="text-slate-700">Country</TableHead>
                    <TableHead className="text-slate-700">Service</TableHead>
                    <TableHead className="text-slate-700">Number</TableHead>
                    <TableHead className="text-slate-700">SMS</TableHead>
                    <TableHead className="text-slate-700">Status</TableHead>
                    <TableHead className="text-slate-700">Date</TableHead>
                    <TableHead className="text-right text-slate-700">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((o) => (
                    <TableRow
                      key={o._id}
                      className="border-slate-100 transition-colors hover:bg-slate-50"
                    >
                      <TableCell className="font-mono text-xs text-slate-700">
                        {truncateId(o._id)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-slate-600">
                        {o.countryName}
                      </TableCell>
                      <TableCell className="max-w-[10rem] truncate text-slate-600">
                        {o.projectName}
                      </TableCell>
                      <TableCell className="font-mono text-sm whitespace-nowrap text-slate-700">
                        {o.number}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-slate-700">
                        {o.smsCode ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("capitalize", statusBadgeClass(o.status))}
                        >
                          {o.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-slate-500">
                        {formatDate(o.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          onClick={() => void copy(o._id, "Order ID")}
                        >
                          <Copy className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && orders.length > 0 && (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 px-6 py-4 sm:flex-row">
              <p className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-slate-200 bg-white hover:bg-slate-50"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-slate-200 bg-white hover:bg-slate-50"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
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
