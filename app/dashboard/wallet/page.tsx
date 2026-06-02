"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bitcoin,
  Landmark,
  Loader2,
  Receipt,
  Wallet as WalletIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useCurrency } from "@/lib/currency-context";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
type TxRow = {
  _id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  status: "pending" | "completed" | "failed";
  createdAt: string;
};

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(d));
}

export default function WalletPage() {
  return (
    <Suspense fallback={<WalletSkeleton />}>
      <WalletContent />
    </Suspense>
  );
}

function WalletSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-80 w-full rounded-2xl" />
    </div>
  );
}

function WalletContent() {
  const { user, refreshUser } = useAuth();
  const { format, pricing } = useCurrency();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [usdtAmountStr, setUsdtAmountStr] = useState("10");
  const [paying, setPaying] = useState(false);

  const [txLoading, setTxLoading] = useState(true);
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const [pendingCryptoTx, setPendingCryptoTx] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const pollTimer = useRef<number | null>(null);
  const pollAttempts = useRef(0);

  const loadTx = useCallback(async () => {
    setTxLoading(true);
    try {
      const res = await fetch(
        `/api/wallet/transactions?page=${page}&limit=${limit}`
      );
      if (!res.ok) {
        toast.error("Could not load transactions");
        return;
      }
      const json = (await res.json()) as {
        data?: { items?: TxRow[]; total?: number };
      };
      setTransactions(json.data?.items ?? []);
      setTotal(json.data?.total ?? 0);
    } finally {
      setTxLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadTx();
  }, [loadTx]);

  // Handle return-redirect from CloudPaya checkout.
  useEffect(() => {
    const cp = searchParams.get("cp");
    const tx = searchParams.get("tx");
    if (cp === "pending" && tx) {
      setPendingCryptoTx(tx);
      router.replace("/dashboard/wallet");
    }
  }, [searchParams, router]);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      window.clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
    pollAttempts.current = 0;
    setPolling(false);
  }, []);

  const checkCryptoStatus = useCallback(
    async (txId: string, manual = false) => {
      try {
        const res = await fetch("/api/wallet/cloudpaya/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transaction_id: txId }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          data?: { status?: "pending" | "completed" | "failed" };
          error?: string;
        };
        if (!res.ok) {
          if (manual) toast.error(json.error ?? "Could not check status");
          return "pending" as const;
        }
        return json.data?.status ?? ("pending" as const);
      } catch {
        if (manual) toast.error("Network error while checking status");
        return "pending" as const;
      }
    },
    []
  );

  // Auto-poll while a crypto top-up is pending after redirect.
  useEffect(() => {
    if (!pendingCryptoTx) {
      stopPolling();
      return;
    }
    let cancelled = false;
    setPolling(true);

    const tick = async () => {
      if (cancelled) return;
      pollAttempts.current += 1;
      const status = await checkCryptoStatus(pendingCryptoTx);
      if (cancelled) return;
      if (status === "completed") {
        toast.success("Crypto payment confirmed — wallet credited");
        stopPolling();
        setPendingCryptoTx(null);
        await refreshUser();
        await loadTx();
        return;
      }
      if (status === "failed") {
        toast.error("Crypto payment was cancelled or failed");
        stopPolling();
        setPendingCryptoTx(null);
        await loadTx();
        return;
      }
      const attempt = pollAttempts.current;
      const delay =
        attempt <= 1 ? 3000
        : attempt <= 2 ? 5000
        : attempt <= 3 ? 8000
        : attempt <= 4 ? 12000
        : 20000;
      if (attempt > 18) {
        setPolling(false);
        return;
      }
      pollTimer.current = window.setTimeout(tick, delay);
    };

    void tick();
    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [pendingCryptoTx, checkCryptoStatus, stopPolling, refreshUser, loadTx]);

  const usdtAmountNum = Number(usdtAmountStr);
  const validUsdt = Number.isFinite(usdtAmountNum) && usdtAmountNum >= 1;

  const cryptoMarkup = pricing.cryptoTopupMarkupPercent;
  const cryptoChargeUsdt = validUsdt
    ? Math.round(usdtAmountNum * (1 + cryptoMarkup / 100) * 100) / 100
    : 0;
  const payWithUsdt = async () => {
    if (!validUsdt) {
      toast.error("Enter at least 1 USDT");
      return;
    }
    setPaying(true);
    try {
      const res = await fetch("/api/wallet/cloudpaya/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_usd: usdtAmountNum }),
      });
      const json = (await res.json()) as {
        data?: {
          transactionId: string;
          baseUsd: number;
          chargedUsd: number;
          creditedInr: number;
          checkoutUrl: string;
        };
        error?: string;
      };
      if (!res.ok) {
        toast.error(json.error ?? "Could not start crypto payment");
        return;
      }
      const url = json.data?.checkoutUrl;
      if (!url) {
        toast.error("Invalid crypto checkout response");
        return;
      }
      toast.message("Redirecting to CloudPaya…", {
        description: `Pay ${json.data?.chargedUsd?.toFixed(2)} USDT · credit ${json.data?.baseUsd?.toFixed(2)} USDT`,
      });
      setDialogOpen(false);
      window.location.href = url;
    } finally {
      setPaying(false);
    }
  };

  return (
    <>
      {pendingCryptoTx && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <Loader2
            className={cn(
              "mt-0.5 size-5 shrink-0 text-amber-600",
              polling && "animate-spin"
            )}
          />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">
              Waiting for blockchain confirmation
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-amber-800">
              Your wallet will be credited automatically once the network
              confirms your payment. You can safely close this page — we&apos;ll
              update your balance when the webhook arrives.
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg border-amber-300 bg-white text-amber-800 hover:bg-amber-50"
                onClick={async () => {
                  const s = await checkCryptoStatus(pendingCryptoTx, true);
                  if (s === "completed") {
                    toast.success("Payment confirmed");
                    setPendingCryptoTx(null);
                    await refreshUser();
                    await loadTx();
                  } else if (s === "failed") {
                    toast.error("Payment cancelled or failed");
                    setPendingCryptoTx(null);
                    await loadTx();
                  } else {
                    toast.message("Still pending on-chain");
                  }
                }}
              >
                Check now
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 rounded-lg text-amber-700 hover:bg-amber-100"
                onClick={() => setPendingCryptoTx(null)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Wallet
          </h1>
          <p className="text-sm text-slate-600">
            Credits, debits, and top-ups in USDT. Top up with USDT (Tron · TRC-20)
            via CloudPaya.
          </p>
        </div>

        <Card className="overflow-hidden border border-sky-200 bg-linear-to-br from-sky-50 to-white transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardDescription className="text-sky-600">
                Available balance
              </CardDescription>
              <CardTitle className="mt-2 font-mono text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                {user ? format(user.walletBalance) : "—"}
              </CardTitle>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sky-600">
              <WalletIcon className="size-10" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger
                className={cn(
                  buttonVariants(),
                  "rounded-xl bg-sky-600 text-white shadow-sm hover:bg-sky-700"
                )}
              >
                Top up
              </DialogTrigger>
              <DialogContent className="gap-6 rounded-2xl border border-slate-200 bg-white sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-heading text-xl text-slate-900">
                    Add funds
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="usdt-amount" className="text-slate-700">
                      Credit amount in USDT (min 1)
                    </Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-400">
                        ₮
                      </span>
                      <Input
                        id="usdt-amount"
                        inputMode="decimal"
                        value={usdtAmountStr}
                        onChange={(e) => setUsdtAmountStr(e.target.value)}
                        className="rounded-xl border-slate-200 pl-7 font-mono text-lg"
                        placeholder="10"
                      />
                    </div>
                    {!validUsdt && (
                      <p className="text-xs text-amber-600">Enter 1 USDT or more.</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <Bitcoin className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-emerald-900">
                        Pay in USDT (Tron · TRC-20)
                      </p>
                      <p className="text-[11px] leading-relaxed text-emerald-800/80">
                        Send USDT on the Tron network only via CloudPaya.
                      </p>
                    </div>
                  </div>

                  {validUsdt && (
                    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Credit to wallet</span>
                        <span className="font-mono font-semibold text-slate-900">
                          {usdtAmountNum.toFixed(2)} USDT
                        </span>
                      </div>
                      {cryptoMarkup > 0 && (
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Top-up fee ({cryptoMarkup.toFixed(2)}%)</span>
                          <span className="font-mono">
                            +{(cryptoChargeUsdt - usdtAmountNum).toFixed(2)} USDT
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-slate-700">
                        <span className="font-semibold">You&apos;ll pay on CloudPaya</span>
                        <span className="font-mono font-semibold text-slate-900">
                          {cryptoChargeUsdt.toFixed(2)} USDT
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    type="button"
                    className="w-full rounded-xl bg-sky-600 text-white hover:bg-sky-700"
                    disabled={paying || !validUsdt}
                    onClick={() => void payWithUsdt()}
                  >
                    {paying ? (
                      <>
                        <Loader2 className="mr-1.5 size-4 animate-spin" />
                        Redirecting…
                      </>
                    ) : (
                      `Pay with USDT${
                        validUsdt ? ` · ${cryptoChargeUsdt.toFixed(2)}` : ""
                      }`
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
              <Receipt className="size-5 text-sky-600" />
              Transactions
            </CardTitle>
            <CardDescription className="text-slate-500">
              Recent wallet movements
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {txLoading ? (
              <div className="space-y-3 px-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-full rounded-md" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20">
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8">
                  <Landmark className="mx-auto size-12 text-slate-400" />
                </div>
                <p className="text-sm text-slate-600">
                  No transactions yet — top up to see history here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-slate-700">Date</TableHead>
                      <TableHead className="text-slate-700">Type</TableHead>
                      <TableHead className="text-slate-700">Amount</TableHead>
                      <TableHead className="text-slate-700">Description</TableHead>
                      <TableHead className="text-slate-700">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((t) => (
                      <TableRow
                        key={t._id}
                        className="border-slate-100 transition-colors hover:bg-slate-50"
                      >
                        <TableCell className="whitespace-nowrap text-xs text-slate-500">
                          {formatDate(t.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              t.type === "credit"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-red-200 bg-red-50 text-red-700"
                            )}
                          >
                            {t.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-slate-900">
                          {t.type === "debit" ? "−" : "+"}
                          {format(t.amount)}
                        </TableCell>
                        <TableCell className="max-w-56 truncate text-sm text-slate-600">
                          {t.description}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              t.status === "completed" &&
                                "border-emerald-200 bg-emerald-50 text-emerald-700",
                              t.status === "pending" &&
                                "border-amber-200 bg-amber-50 text-amber-700",
                              t.status === "failed" &&
                                "border-red-200 bg-red-50 text-red-700"
                            )}
                          >
                            {t.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {!txLoading && transactions.length > 0 && (
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
    </>
  );
}
