"use client";

import { useCallback, useEffect, useState } from "react";
import Script from "next/script";
import { Landmark, Receipt, Wallet as WalletIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
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

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(d));
}

export default function WalletPage() {
  const { user, refreshUser } = useAuth();
  const [scriptReady, setScriptReady] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [amountStr, setAmountStr] = useState("500");
  const [paying, setPaying] = useState(false);

  const [txLoading, setTxLoading] = useState(true);
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;
  const totalPages = Math.max(1, Math.ceil(total / limit));

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

  const amountNum = Number(amountStr);
  const validAmount = Number.isFinite(amountNum) && amountNum >= 50;

  const pay = async () => {
    if (!validAmount || !scriptReady) {
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
        body: JSON.stringify({ amount: amountNum }),
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
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
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

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onLoad={() => setScriptReady(true)}
      />

      <div className="space-y-8">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Wallet
          </h1>
          <p className="text-sm text-slate-600">
            Credits, debits, and top-ups in one place.
          </p>
        </div>

        <Card className="overflow-hidden border border-sky-200 bg-linear-to-br from-sky-50 to-white transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardDescription className="text-sky-600">
                Available balance
              </CardDescription>
              <CardTitle className="mt-2 font-mono text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                {user ? formatINR(user.walletBalance) : "—"}
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
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-slate-700">
                      Amount (min ₹50)
                    </Label>
                    <Input
                      id="amount"
                      inputMode="decimal"
                      value={amountStr}
                      onChange={(e) => setAmountStr(e.target.value)}
                      className="rounded-xl border-slate-200 font-mono text-lg"
                      placeholder="500"
                    />
                    {!validAmount && (
                      <p className="text-xs text-amber-600">
                        Enter ₹50 or more.
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    className="w-full rounded-xl bg-sky-600 text-white hover:bg-sky-700"
                    disabled={!validAmount || paying || !scriptReady}
                    onClick={() => void pay()}
                  >
                    {paying
                      ? "Opening…"
                      : scriptReady
                        ? `Pay ${validAmount ? formatINR(amountNum) : ""}`
                        : "Loading checkout…"}
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
                          {formatINR(t.amount)}
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
