"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import {
  Bitcoin,
  CreditCard,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type RazorpayConstructor = new (options: {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name?: string;
  description?: string;
  theme?: { color?: string };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
}) => { open: () => void };

declare global {
  interface Window {
    Razorpay: RazorpayConstructor;
  }
}

type TxRow = {
  _id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  status: "pending" | "completed" | "failed";
  createdAt: string;
};

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-IN", {
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
  const { format, pricing, currency } = useCurrency();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [scriptReady, setScriptReady] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inrAmountStr, setInrAmountStr] = useState("500");
  const [usdAmountStr, setUsdAmountStr] = useState("10");
  const [payMethod, setPayMethod] = useState<"razorpay" | "cloudpaya">(
    "razorpay"
  );
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

  const inrAmountNum = Number(inrAmountStr);
  const validInr = Number.isFinite(inrAmountNum) && inrAmountNum >= 50;

  const usdAmountNum = Number(usdAmountStr);
  const validUsd = Number.isFinite(usdAmountNum) && usdAmountNum >= 1;

  const rate = pricing.usdInrRate;
  const cryptoMarkup = pricing.cryptoTopupMarkupPercent;
  const cryptoChargeUsd = validUsd
    ? Math.round(usdAmountNum * (1 + cryptoMarkup / 100) * 100) / 100
    : 0;
  const cryptoCreditInr = validUsd
    ? Math.round(usdAmountNum * rate * 100) / 100
    : 0;

  // Open the dialog on the tab that matches the user's preferred display currency.
  useEffect(() => {
    if (!dialogOpen) return;
    // If user prefers USD/USDT and Razorpay (INR-only) is selected, nudge to crypto.
    // Otherwise leave whatever they last picked.
    setPayMethod((prev) => {
      if (prev === "razorpay" && currency !== "INR") return "cloudpaya";
      return prev;
    });
  }, [dialogOpen, currency]);

  const payWithRazorpay = async () => {
    if (!validInr || !scriptReady) {
      toast.error("Enter at least ₹50 and wait for checkout to load");
      return;
    }
    const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!key) {
      toast.error("Razorpay key missing — set NEXT_PUBLIC_RAZORPAY_KEY_ID");
      return;
    }

    setPaying(true);
    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: inrAmountNum }),
      });
      const json = (await res.json()) as {
        data?: {
          razorpayOrder?: {
            id: string;
            amount: number;
            currency: string;
          };
          transaction?: { _id: string };
        };
        error?: string;
      };
      if (!res.ok) {
        toast.error(json.error ?? "Could not start payment");
        return;
      }
      const order = json.data?.razorpayOrder;
      const tx = json.data?.transaction;
      if (!order?.id || !tx?._id) {
        toast.error("Invalid top-up response");
        return;
      }

      const rzp = new window.Razorpay({
        key,
        amount: order.amount,
        currency: order.currency ?? "INR",
        order_id: order.id,
        name: "10tap",
        description: "Wallet top-up",
        theme: { color: "#0284c7" },
        handler: async (response) => {
          const verify = await fetch("/api/wallet/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              transaction_id: tx._id,
            }),
          });
          const vjson = (await verify.json()) as { error?: string };
          if (!verify.ok) {
            toast.error(vjson.error ?? "Verification failed");
            return;
          }
          toast.success("Wallet topped up");
          setDialogOpen(false);
          await refreshUser();
          await loadTx();
        },
      });
      rzp.open();
    } finally {
      setPaying(false);
    }
  };

  const payWithCrypto = async () => {
    if (!validUsd) {
      toast.error("Enter at least $1 USD");
      return;
    }
    setPaying(true);
    try {
      const res = await fetch("/api/wallet/cloudpaya/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_usd: usdAmountNum }),
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
        description: `Pay $${json.data?.chargedUsd?.toFixed(2)} · credit $${json.data?.baseUsd?.toFixed(2)}`,
      });
      setDialogOpen(false);
      window.location.href = url;
    } finally {
      setPaying(false);
    }
  };

  const onPay = () => {
    if (payMethod === "razorpay") void payWithRazorpay();
    else void payWithCrypto();
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onLoad={() => setScriptReady(true)}
      />

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
            Credits, debits, and top-ups in one place. Prices shown in{" "}
            <strong>{currency}</strong>; internal accounting is in INR.
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
              {user && currency !== "INR" && (
                <p className="mt-1 text-xs text-slate-500">
                  ≈ {format(user.walletBalance, { currency: "INR" })}
                </p>
              )}
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
                  <Tabs
                    value={payMethod}
                    onValueChange={(v) =>
                      setPayMethod(v as "razorpay" | "cloudpaya")
                    }
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2 bg-slate-100">
                      <TabsTrigger value="razorpay" className="gap-1.5 text-sm">
                        <CreditCard className="size-4" /> Card / UPI
                      </TabsTrigger>
                      <TabsTrigger value="cloudpaya" className="gap-1.5 text-sm">
                        <Bitcoin className="size-4" /> USDT
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="razorpay" className="mt-4 space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="inr-amount" className="text-slate-700">
                          Amount in INR (min ₹50)
                        </Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-400">
                            ₹
                          </span>
                          <Input
                            id="inr-amount"
                            inputMode="decimal"
                            value={inrAmountStr}
                            onChange={(e) => setInrAmountStr(e.target.value)}
                            className="rounded-xl border-slate-200 pl-7 font-mono text-lg"
                            placeholder="500"
                          />
                        </div>
                        {!validInr && (
                          <p className="text-xs text-amber-600">
                            Enter ₹50 or more.
                          </p>
                        )}
                        {validInr && currency !== "INR" && (
                          <p className="text-xs text-slate-500">
                            ≈ {format(inrAmountNum, { currency })}
                          </p>
                        )}
                      </div>
                      <p className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-600">
                        Secure checkout with cards, UPI, net-banking and
                        wallets via Razorpay. Processed in INR.
                      </p>
                    </TabsContent>

                    <TabsContent value="cloudpaya" className="mt-4 space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="usd-amount" className="text-slate-700">
                          Credit amount in USD (min $1)
                        </Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-400">
                            $
                          </span>
                          <Input
                            id="usd-amount"
                            inputMode="decimal"
                            value={usdAmountStr}
                            onChange={(e) => setUsdAmountStr(e.target.value)}
                            className="rounded-xl border-slate-200 pl-7 font-mono text-lg"
                            placeholder="10"
                          />
                        </div>
                        {!validUsd && (
                          <p className="text-xs text-amber-600">
                            Enter $1 or more.
                          </p>
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
                            Cheapest fees, fastest confirmation. Send USDT on
                            the Tron network only.
                          </p>
                        </div>
                      </div>

                      {validUsd && (
                        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs">
                          <div className="flex items-center justify-between text-slate-600">
                            <span>Credit to wallet</span>
                            <span className="font-mono font-semibold text-slate-900">
                              {format(cryptoCreditInr)}
                            </span>
                          </div>
                          {cryptoMarkup > 0 && (
                            <div className="flex items-center justify-between text-slate-500">
                              <span>Crypto fee ({cryptoMarkup.toFixed(2)}%)</span>
                              <span className="font-mono">
                                +${(cryptoChargeUsd - usdAmountNum).toFixed(2)}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-slate-700">
                            <span className="font-semibold">
                              You&apos;ll pay on CloudPaya
                            </span>
                            <span className="font-mono font-semibold text-slate-900">
                              ${cryptoChargeUsd.toFixed(2)}
                            </span>
                          </div>
                          <p className="pt-1 text-[11px] text-slate-400">
                            Pick any coin (BTC, ETH, USDT, SOL…) on the next
                            page. Rate: 1 USD = ₹{rate.toFixed(2)}.
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>

                  <Button
                    type="button"
                    className="w-full rounded-xl bg-sky-600 text-white hover:bg-sky-700"
                    disabled={
                      paying ||
                      (payMethod === "razorpay"
                        ? !validInr || !scriptReady
                        : !validUsd)
                    }
                    onClick={onPay}
                  >
                    {paying ? (
                      <>
                        <Loader2 className="mr-1.5 size-4 animate-spin" />
                        {payMethod === "razorpay" ? "Opening…" : "Redirecting…"}
                      </>
                    ) : payMethod === "razorpay" ? (
                      scriptReady ? (
                        `Pay ${validInr ? format(inrAmountNum, { currency: "INR" }) : ""}`
                      ) : (
                        "Loading checkout…"
                      )
                    ) : (
                      `Pay with USDT${
                        validUsd ? ` · $${cryptoChargeUsd.toFixed(2)}` : ""
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
