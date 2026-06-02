"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Loader2, MessageSquare, Phone, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useCurrency } from "@/lib/currency-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { countryFlagCode } from "@/lib/countries-display";

type RentalArea = {
  area_code: string;
  area_title: string;
  unit_price: number;
  min_month: number;
  total: number;
  unit_price_inr: number;
};

type RentedRow = {
  area_code: string;
  area_name: string;
  dialing_code: string;
  mobile_number: string;
  expire_at: string;
  keep_at: string;
  sms_link: string;
  allow_link: boolean;
};

type OrderRow = {
  order_id: string;
  area_code: string;
  area_name: string;
  mobile_number: string;
  rent_month: number;
  amount: number;
  status: string;
  order_at: string;
  expire_at: string;
};

function Flag({ code }: { code: string }) {
  const lc = countryFlagCode(code);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/${lc}.svg`}
      alt={code}
      width={28}
      height={21}
      className="rounded-sm"
    />
  );
}

function fmtDate(s: string) {
  try {
    return new Date(s).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return s;
  }
}

export default function RentPage() {
  const { refreshUser } = useAuth();
  const { format: fmtUsdt } = useCurrency();
  const [tab, setTab] = useState("browse");

  const [areas, setAreas] = useState<RentalArea[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [q, setQ] = useState("");

  const [numbers, setNumbers] = useState<RentedRow[]>([]);
  const [loadingNums, setLoadingNums] = useState(false);

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loadingOrd, setLoadingOrd] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<RentalArea | null>(null);
  const [months, setMonths] = useState(1);
  const [booking, setBooking] = useState(false);

  const [smsOpen, setSmsOpen] = useState(false);
  const [smsArea, setSmsArea] = useState("");
  const [smsNum, setSmsNum] = useState("");
  const [smsBody, setSmsBody] = useState<{ content: string; receive_at: string } | null>(null);
  const [smsLoading, setSmsLoading] = useState(false);

  const [renewOpen, setRenewOpen] = useState(false);
  const [renewArea, setRenewArea] = useState("");
  const [renewNum, setRenewNum] = useState("");
  const [renewMonths, setRenewMonths] = useState(1);
  const [renewing, setRenewing] = useState(false);

  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const [bookQuote, setBookQuote] = useState<{ amountInr: number; totalUsd: number } | null>(null);
  const [bookQuoteLoading, setBookQuoteLoading] = useState(false);
  const [renewQuote, setRenewQuote] = useState<{ amountInr: number; totalUsd: number } | null>(null);
  const [renewQuoteLoading, setRenewQuoteLoading] = useState(false);

  useEffect(() => {
    if (!dialogOpen || !selected) {
      setBookQuote(null);
      return;
    }
    const m = Math.max(months, selected.min_month);
    let cancelled = false;
    setBookQuoteLoading(true);
    void (async () => {
      try {
        const res = await fetch(
          `/api/rent/quote?area_code=${encodeURIComponent(selected.area_code)}&months=${m}`
        );
        const json = await res.json();
        if (cancelled) return;
        if (json.success && json.data?.amountInr != null) {
          setBookQuote({ amountInr: json.data.amountInr, totalUsd: json.data.totalUsd });
        } else {
          setBookQuote(null);
        }
      } finally {
        if (!cancelled) setBookQuoteLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dialogOpen, selected, months]);

  useEffect(() => {
    if (!renewOpen || !renewArea || !renewNum) {
      setRenewQuote(null);
      return;
    }
    let cancelled = false;
    setRenewQuoteLoading(true);
    void (async () => {
      try {
        const res = await fetch(
          `/api/rent/quote?area_code=${encodeURIComponent(renewArea)}&months=${renewMonths}`
        );
        const json = await res.json();
        if (cancelled) return;
        if (json.success && json.data?.amountInr != null) {
          setRenewQuote({ amountInr: json.data.amountInr, totalUsd: json.data.totalUsd });
        } else {
          setRenewQuote(null);
        }
      } finally {
        if (!cancelled) setRenewQuoteLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [renewOpen, renewArea, renewNum, renewMonths]);

  const loadAreas = useCallback(async () => {
    setLoadingAreas(true);
    try {
      const res = await fetch("/api/rent/areas");
      const json = await res.json();
      const data = json.data?.data as RentalArea[] | undefined;
      if (!res.ok || !Array.isArray(data)) {
        toast.error(json.error ?? "Could not load areas");
        return;
      }
      setAreas(data);
    } finally {
      setLoadingAreas(false);
    }
  }, []);

  const loadNumbers = useCallback(async () => {
    setLoadingNums(true);
    try {
      const res = await fetch("/api/rent/numbers?page_size=50");
      const json = await res.json();
      const outer = json.data as { code?: number; message?: string; data?: { list?: RentedRow[] } } | undefined;
      const d = outer?.data;
      if (outer?.code === 200 && d?.list) setNumbers(d.list);
      else toast.error(outer?.message ?? "Could not load numbers");
    } finally {
      setLoadingNums(false);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    setLoadingOrd(true);
    try {
      const res = await fetch("/api/rent/order-history?page_size=50");
      const json = await res.json();
      const outer = json.data as { code?: number; message?: string; data?: { list?: OrderRow[] } } | undefined;
      const d = outer?.data;
      if (outer?.code === 200 && d?.list) setOrders(d.list);
      else toast.error(outer?.message ?? "Could not load orders");
    } finally {
      setLoadingOrd(false);
    }
  }, []);

  useEffect(() => {
    void loadAreas();
  }, [loadAreas]);

  useEffect(() => {
    if (tab === "mine") void loadNumbers();
  }, [tab, loadNumbers]);

  useEffect(() => {
    if (tab === "history") void loadOrders();
  }, [tab, loadOrders]);

  const filtered = areas.filter(
    (a) =>
      a.area_title.toLowerCase().includes(q.toLowerCase()) ||
      a.area_code.toLowerCase().includes(q.toLowerCase())
  );

  const openBook = (a: RentalArea) => {
    setSelected(a);
    setMonths(Math.max(a.min_month, 1));
    setDialogOpen(true);
  };

  const onBook = async () => {
    if (!selected) return;
    const m = Math.max(months, selected.min_month);
    setBooking(true);
    try {
      const res = await fetch("/api/rent/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area_code: selected.area_code, months: m }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Booking failed");
        return;
      }
      toast.success("Number rented");
      setDialogOpen(false);
      await refreshUser();
      setTab("mine");
      void loadNumbers();
    } finally {
      setBooking(false);
    }
  };

  const openRenew = (area: string, num: string) => {
    setRenewArea(area);
    setRenewNum(num);
    setRenewMonths(1);
    setRenewOpen(true);
  };

  const onRenew = async () => {
    setRenewing(true);
    try {
      const res = await fetch("/api/rent/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          area_code: renewArea,
          mobile_number: renewNum,
          months: renewMonths,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Renewal failed");
        return;
      }
      toast.success("Renewed");
      setRenewOpen(false);
      await refreshUser();
      void loadNumbers();
      void loadOrders();
    } finally {
      setRenewing(false);
    }
  };

  const onCancelOrder = async (orderId: string) => {
    setCancelling(true);
    try {
      const res = await fetch("/api/rent/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not cancel");
        return;
      }
      toast.success("Order cancelled — refunded to wallet if applicable");
      setCancelId(null);
      await refreshUser();
      void loadOrders();
      void loadNumbers();
    } finally {
      setCancelling(false);
    }
  };

  const openSms = async (area: string, num: string) => {
    setSmsArea(area);
    setSmsNum(num);
    setSmsBody(null);
    setSmsOpen(true);
    setSmsLoading(true);
    try {
      const res = await fetch(
        `/api/rent/sms?area_code=${encodeURIComponent(area)}&mobile_number=${encodeURIComponent(num)}`
      );
      const json = await res.json();
      const outer = json.data as { code?: number; message?: string; data?: { content?: string; receive_at?: string } };
      const d = outer?.data;
      if (outer?.code === 200 && d?.content) setSmsBody(d as { content: string; receive_at: string });
      else toast.message(outer?.message ?? "No SMS yet");
    } finally {
      setSmsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Long-term rentals</h1>
        <p className="mt-1 text-sm text-slate-500">
          Dedicated virtual numbers by the month — renew, receive SMS, and manage from one place. All prices are shown
          in USDT and charged from your USDT wallet.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="browse">Browse areas</TabsTrigger>
          <TabsTrigger value="mine">My numbers</TabsTrigger>
          <TabsTrigger value="history">Rental orders</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-6 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search regions…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="border-slate-200 pl-10"
            />
          </div>
          {loadingAreas ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((a) => (
                <Card key={a.area_code} className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <Flag code={a.area_code} />
                      <div>
                        <CardTitle className="text-base">{a.area_title}</CardTitle>
                        <CardDescription className="font-mono text-xs">{a.area_code}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      <Badge variant="secondary">{a.total.toLocaleString()} available</Badge>
                      <span>Min. {a.min_month} mo</span>
                    </div>
                    <p className="text-sm">
                      <span className="font-semibold text-slate-900">{fmtUsdt(a.unit_price_inr)}</span>
                      <span className="text-slate-500"> / month</span>
                    </p>
                    <Button className="w-full bg-sky-600 text-white hover:bg-sky-700" onClick={() => openBook(a)}>
                      <Building2 className="mr-2 size-4" />
                      Rent here
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mine" className="mt-6">
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Active & recent rentals</CardTitle>
                <CardDescription>From SMS-BUS long-term rental API</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => void loadNumbers()}>
                <RefreshCw className="mr-1 size-3.5" /> Refresh
              </Button>
            </CardHeader>
            <CardContent className="px-0">
              {loadingNums ? (
                <div className="px-6 py-8 text-center text-slate-500">Loading…</div>
              ) : numbers.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-slate-500">No rented numbers yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Region</TableHead>
                      <TableHead>Number</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {numbers.map((n) => (
                      <TableRow key={`${n.area_code}-${n.mobile_number}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Flag code={n.area_code} />
                            <span className="text-sm">{n.area_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          +{n.dialing_code} {n.mobile_number}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">{fmtDate(n.expire_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => void openSms(n.area_code, n.mobile_number)}
                            >
                              <MessageSquare className="size-3.5" />
                              SMS
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openRenew(n.area_code, n.mobile_number)}
                            >
                              Renew
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Order history</CardTitle>
              <CardDescription>All rental orders on your SMS-BUS account</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              {loadingOrd ? (
                <div className="px-6 py-8 text-center">Loading…</div>
              ) : orders.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-slate-500">No orders yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>Number</TableHead>
                      <TableHead>Months</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>When</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((o) => (
                      <TableRow key={o.order_id}>
                        <TableCell className="font-mono text-xs">{o.order_id}</TableCell>
                        <TableCell>{o.area_name}</TableCell>
                        <TableCell className="font-mono text-sm">{o.mobile_number}</TableCell>
                        <TableCell>{o.rent_month}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{o.status}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">{fmtDate(o.order_at)}</TableCell>
                        <TableCell className="text-right">
                          {o.status !== "CANCEL" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600"
                              onClick={() => setCancelId(o.order_id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rent {selected?.area_title}</DialogTitle>
            <DialogDescription>
              Minimum {selected?.min_month} month(s). Total is charged in USDT from your wallet.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 text-sm">
                <Flag code={selected.area_code} />
                <span>{selected.area_title}</span>
              </div>
              <div>
                <Label>Months</Label>
                <Input
                  type="number"
                  min={selected.min_month}
                  max={24}
                  value={months}
                  onChange={(e) => setMonths(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <p className="text-sm text-slate-600">
                Estimated:{" "}
                {bookQuoteLoading ? (
                  <span className="text-slate-400">Calculating…</span>
                ) : bookQuote ? (
                  <>
                    <strong>{fmtUsdt(bookQuote.amountInr)}</strong>
                  </>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-sky-600 text-white hover:bg-sky-700" disabled={booking} onClick={() => void onBook()}>
              {booking ? <Loader2 className="size-4 animate-spin" /> : <Phone className="size-4" />}
              Confirm rental
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renewOpen} onOpenChange={setRenewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renew rental</DialogTitle>
            <DialogDescription>
              Extend subscription for +{renewArea} {renewNum}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Additional months</Label>
              <Input
                type="number"
                min={1}
                max={24}
                value={renewMonths}
                onChange={(e) => setRenewMonths(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <p className="text-sm text-slate-600">
              Estimated:{" "}
              {renewQuoteLoading ? (
                <span className="text-slate-400">Calculating…</span>
              ) : renewQuote ? (
                <>
                  <strong>{fmtUsdt(renewQuote.amountInr)}</strong>
                </>
              ) : (
                <span className="text-slate-400">—</span>
              )}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenewOpen(false)}>
              Close
            </Button>
            <Button className="bg-sky-600 text-white hover:bg-sky-700" disabled={renewing} onClick={() => void onRenew()}>
              {renewing ? <Loader2 className="size-4 animate-spin" /> : null}
              Pay & renew
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!cancelId} onOpenChange={(o) => !o && setCancelId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel rental order?</DialogTitle>
            <DialogDescription>
              Only works within SMS-BUS rules (e.g. ~20 min, no SMS received). Your wallet may be refunded if we
              recorded this order.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelId(null)}>
              Back
            </Button>
            <Button
              variant="destructive"
              disabled={cancelling}
              onClick={() => cancelId && void onCancelOrder(cancelId)}
            >
              {cancelling ? <Loader2 className="size-4 animate-spin" /> : "Confirm cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={smsOpen} onOpenChange={setSmsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Latest SMS</DialogTitle>
            <DialogDescription>
              +{smsArea} {smsNum}
            </DialogDescription>
          </DialogHeader>
          {smsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-8 animate-spin text-sky-600" />
            </div>
          ) : smsBody ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="whitespace-pre-wrap text-slate-800">{smsBody.content}</p>
              <p className="mt-2 text-xs text-slate-400">{fmtDate(smsBody.receive_at)}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No message loaded.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
