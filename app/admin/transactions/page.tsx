"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
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

type TxType = "credit" | "debit";
type TxStatus = "pending" | "completed" | "failed";

type PopulatedUser = {
  _id: string;
  name: string;
  email: string;
};

type AdminTransactionRow = {
  _id: string;
  userId: PopulatedUser | string;
  type: TxType;
  amount: number;
  description: string;
  status: TxStatus;
  createdAt: string;
};

type TransactionsPayload = {
  items: AdminTransactionRow[];
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

function getTxUser(row: AdminTransactionRow): PopulatedUser | null {
  const u = row.userId;
  if (u && typeof u === "object" && "name" in u && "email" in u) {
    return u as PopulatedUser;
  }
  return null;
}

function typeBadgeClass(t: TxType) {
  return t === "credit"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-red-200 bg-red-50 text-red-700";
}

function statusBadgeClass(s: TxStatus) {
  switch (s) {
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "failed":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-500";
  }
}

export default function AdminTransactionsPage() {
  const [data, setData] = useState<TransactionsPayload | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTx = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/transactions?page=${p}&limit=${PAGE_LIMIT}`
      );
      const json = (await res.json()) as {
        success?: boolean;
        data?: TransactionsPayload;
        error?: string;
      };
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error ?? "Failed to load transactions");
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
    fetchTx(page);
  }, [page, fetchTx]);

  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / data.limit))
    : 1;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-slate-500">
          <CreditCard className="size-5 text-sky-600" aria-hidden />
          <span className="text-sm font-medium uppercase tracking-wider">
            Ledger
          </span>
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          All transactions
        </h1>
        <p className="mt-1 text-slate-600">
          Credits, debits, and payment status across wallets.
        </p>
      </div>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-6">
          <CardTitle className="text-lg text-slate-900">Transactions</CardTitle>
          <p className="text-sm text-slate-500">
            {loading ? "Loading…" : data ? `${data.total} total` : "—"}
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
                    ID
                  </TableHead>
                  <TableHead className="min-w-[200px] font-semibold text-slate-900">
                    User
                  </TableHead>
                  <TableHead className="min-w-[90px] font-semibold text-slate-900">
                    Type
                  </TableHead>
                  <TableHead className="min-w-[110px] text-right font-semibold text-slate-900">
                    Amount
                  </TableHead>
                  <TableHead className="min-w-[220px] font-semibold text-slate-900">
                    Description
                  </TableHead>
                  <TableHead className="min-w-[100px] font-semibold text-slate-900">
                    Status
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
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full max-w-[10rem]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !data || data.items.length === 0 ? (
                  <TableRow className="border-slate-100">
                    <TableCell
                      colSpan={7}
                      className="h-32 text-center text-slate-500"
                    >
                      No transactions yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((row) => {
                    const u = getTxUser(row);
                    return (
                      <TableRow
                        key={String(row._id)}
                        className="border-slate-100 transition-colors hover:bg-slate-50"
                      >
                        <TableCell className="font-mono text-xs text-slate-500">
                          {String(row._id)}
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
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-medium capitalize",
                              typeBadgeClass(row.type)
                            )}
                          >
                            {row.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold tabular-nums text-slate-900">
                          {formatInr(row.amount)}
                        </TableCell>
                        <TableCell className="max-w-[280px] truncate text-sm text-slate-600">
                          {row.description}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-normal capitalize",
                              statusBadgeClass(row.status)
                            )}
                          >
                            {row.status}
                          </Badge>
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
