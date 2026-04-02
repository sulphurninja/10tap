"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Copy, Loader2, Search, Phone, Globe, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ServiceIcon } from "@/components/service-icon";

type Country = { id: number; title: string; code: string };

type EnrichedPrice = {
  country_id: number;
  project_id: number;
  /** INR (from SMS-BUS USD × rate) */
  cost: number;
  cost_usd?: number;
  total_count: number;
  country_title: string;
  country_code: string;
  project_title: string;
  project_code: string;
};

type Step = 1 | 2 | 3 | 4;

function FlagImg({ code, size = 24 }: { code: string; size?: number }) {
  const lc = code.toLowerCase();
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/${lc}.svg`}
      alt={code.toUpperCase()}
      width={size}
      height={Math.round(size * 0.75)}
      className="inline-block rounded-sm object-cover"
      loading="lazy"
    />
  );
}

function fmtINR(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
}

export default function BuyNumberPage() {
  const { refreshUser } = useAuth();
  const [step, setStep] = useState<Step>(1);

  const [countryQuery, setCountryQuery] = useState("");
  const [countries, setCountries] = useState<Country[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  const [serviceQuery, setServiceQuery] = useState("");
  const [prices, setPrices] = useState<EnrichedPrice[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [selectedService, setSelectedService] = useState<EnrichedPrice | null>(null);

  const [buying, setBuying] = useState(false);
  const [activeNumber, setActiveNumber] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [smsCode, setSmsCode] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clearPoll = useCallback(() => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } }, []);

  useEffect(() => {
    let dead = false;
    (async () => {
      setLoadingCountries(true);
      try {
        const res = await fetch("/api/numbers/countries");
        const json = await res.json();
        const record = json.data?.data;
        if (!res.ok || !record) { toast.error("Could not load countries"); return; }
        if (!dead) setCountries(Object.values(record as Record<string, Country>));
      } finally { if (!dead) setLoadingCountries(false); }
    })();
    return () => { dead = true; };
  }, []);

  useEffect(() => () => clearPoll(), [clearPoll]);

  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(c => c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }, [countries, countryQuery]);

  const filteredServices = useMemo(() => {
    const q = serviceQuery.trim().toLowerCase();
    if (!q) return prices;
    return prices.filter(p => p.project_title.toLowerCase().includes(q) || p.project_code.toLowerCase().includes(q));
  }, [prices, serviceQuery]);

  const loadPrices = async (country: Country) => {
    setLoadingPrices(true);
    setPrices([]);
    setSelectedService(null);
    setServiceQuery("");
    try {
      const res = await fetch(`/api/numbers/prices?country_id=${country.id}`);
      const json = await res.json();
      const record = json.data?.data;
      if (!res.ok || !record) { toast.error("No services available for this country"); return; }
      setPrices(Object.values(record as Record<string, EnrichedPrice>));
      setStep(2);
    } finally { setLoadingPrices(false); }
  };

  const onSelectCountry = (c: Country) => { setSelectedCountry(c); void loadPrices(c); };

  const onBuy = async () => {
    if (!selectedCountry || !selectedService) return;
    setBuying(true);
    try {
      const res = await fetch("/api/numbers/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country_id: selectedCountry.id,
          project_id: selectedService.project_id,
          country_name: selectedCountry.title,
          country_code: selectedCountry.code,
          project_name: selectedService.project_title,
          cost: selectedService.cost,
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Purchase failed"); return; }
      const order = json.data?.order;
      if (!order?.requestId || !order.number) { toast.error("Unexpected response"); return; }
      setRequestId(String(order.requestId));
      setActiveNumber(order.number);
      setSmsCode(null);
      setWaiting(true);
      setStep(4);
      await refreshUser();
      toast.success("Number reserved — waiting for SMS");
    } finally { setBuying(false); }
  };

  useEffect(() => {
    if (step !== 4 || !requestId || !waiting || smsCode) { clearPoll(); return; }
    const tick = async () => {
      try {
        const res = await fetch(`/api/numbers/sms?request_id=${encodeURIComponent(requestId)}`);
        const json = await res.json();
        if (!res.ok) return;
        const payload = json.data;
        if (payload?.code === 200 && payload.data != null && payload.data !== "") {
          setSmsCode(String(payload.data));
          setWaiting(false);
          clearPoll();
          await refreshUser();
          toast.success("SMS received!");
        }
      } catch { /* keep polling */ }
    };
    void tick();
    pollRef.current = setInterval(() => void tick(), 5000);
    return () => clearPoll();
  }, [step, requestId, waiting, smsCode, clearPoll, refreshUser]);

  const onCancel = async () => {
    if (!requestId) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/numbers/cancel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ request_id: requestId }) });
      if (!res.ok) { const j = await res.json(); toast.error(j.error ?? "Could not cancel"); return; }
      clearPoll();
      setWaiting(false); setStep(1); setSelectedCountry(null); setSelectedService(null);
      setRequestId(null); setActiveNumber(null); setSmsCode(null);
      await refreshUser();
      toast.message("Order cancelled — wallet refunded");
    } finally { setCancelling(false); }
  };

  const goBack = () => {
    if (step === 1) return;
    if (step === 4 && waiting) { toast.message("Cancel the order first"); return; }
    if (step === 2) { setStep(1); setSelectedCountry(null); setPrices([]); setSelectedService(null); return; }
    if (step === 3) { setStep(2); setSelectedService(null); return; }
    if (step === 4) { setStep(1); setSelectedCountry(null); setSelectedService(null); setRequestId(null); setActiveNumber(null); setSmsCode(null); setWaiting(false); clearPoll(); }
  };

  const stepLabels = ["Country", "Service", "Confirm", "Receive"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Get a Number</h1>
          <p className="mt-1 text-sm text-slate-500">Select a country, pick a service, receive your OTP instantly.</p>
        </div>
        {step > 1 && (
          <Button variant="outline" size="sm" onClick={goBack} className="w-fit gap-2 border-slate-200">
            <ArrowLeft className="size-4" />Back
          </Button>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {stepLabels.map((label, i) => {
          const s = (i + 1) as Step;
          const done = step >= s;
          return (
            <div key={label} className="flex flex-1 flex-col gap-1.5">
              <div className={cn("h-1.5 rounded-full transition-all duration-500", done ? "bg-sky-500" : "bg-slate-200")} />
              <span className={cn("text-[10px] font-medium uppercase tracking-wider", done ? "text-sky-600" : "text-slate-400")}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Step 1 — Country */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search countries…" value={countryQuery} onChange={e => setCountryQuery(e.target.value)}
              className="h-10 border-slate-200 pl-10 shadow-sm" />
          </div>
          {loadingCountries ? (
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 16 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : filteredCountries.length === 0 ? (
            <div className="py-20 text-center">
              <Globe className="mx-auto size-10 text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">No countries match &ldquo;{countryQuery}&rdquo;</p>
            </div>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCountries.map(c => (
                <button key={c.id} type="button" onClick={() => onSelectCountry(c)}
                  className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-left shadow-sm transition-all hover:border-sky-300 hover:bg-sky-50/40 hover:shadow active:scale-[0.98]">
                  <FlagImg code={c.code} size={28} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800 group-hover:text-sky-700">{c.title}</p>
                    <p className="font-mono text-[11px] text-slate-400 uppercase">{c.code}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2 — Service */}
      {step === 2 && selectedCountry && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <FlagImg code={selectedCountry.code} size={32} />
            <div>
              <p className="text-sm font-semibold text-slate-800">{selectedCountry.title}</p>
              <p className="text-xs text-slate-500">Select a service below</p>
            </div>
          </div>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search services… (WhatsApp, Telegram…)" value={serviceQuery}
              onChange={e => setServiceQuery(e.target.value)} className="h-10 border-slate-200 pl-10 shadow-sm" />
          </div>
          {loadingPrices ? (
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="py-20 text-center">
              <ShoppingBag className="mx-auto size-10 text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">
                {prices.length === 0 ? "No services available for this country." : `No services match "${serviceQuery}"`}
              </p>
            </div>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredServices.map(p => (
                <button key={p.project_id} type="button"
                  onClick={() => { setSelectedService(p); setStep(3); }}
                  className="group flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-left shadow-sm transition-all hover:border-sky-300 hover:bg-sky-50/40 hover:shadow active:scale-[0.98]">
                  <ServiceIcon projectCode={p.project_code} projectTitle={p.project_title} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-sky-700">{p.project_title}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      <span className="font-mono">{p.total_count.toLocaleString()}</span> numbers ·{" "}
                      {p.cost_usd != null ? (
                        <span className="text-slate-500">${p.cost_usd.toFixed(2)} USD → </span>
                      ) : null}
                      INR
                    </p>
                  </div>
                  <Badge className="shrink-0 bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700">{fmtINR(p.cost)}</Badge>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3 — Confirm */}
      {step === 3 && selectedCountry && selectedService && (
        <Card className="border-sky-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Confirm Purchase</CardTitle>
            <CardDescription>Review your order before we reserve the number.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-3">
              <div>
                <Label className="text-[11px] text-slate-500 uppercase tracking-wider">Country</Label>
                <div className="mt-2 flex items-center gap-2">
                  <FlagImg code={selectedCountry.code} size={24} />
                  <span className="text-sm font-medium text-slate-800">{selectedCountry.title}</span>
                </div>
              </div>
              <div>
                <Label className="text-[11px] text-slate-500 uppercase tracking-wider">Service</Label>
                <p className="mt-2 text-sm font-medium text-slate-800">{selectedService.project_title}</p>
              </div>
              <div>
                <Label className="text-[11px] text-slate-500 uppercase tracking-wider">Price (wallet)</Label>
                <p className="mt-2 font-mono text-2xl font-bold text-sky-700">{fmtINR(selectedService.cost)}</p>
                {selectedService.cost_usd != null && (
                  <p className="mt-1 text-xs text-slate-400">
                    Supplier: ${selectedService.cost_usd.toFixed(2)} USD → your INR (admin FX + markups)
                  </p>
                )}
              </div>
            </div>
            <Button className="w-full bg-sky-600 text-white hover:bg-sky-700 sm:w-auto" disabled={buying} onClick={() => void onBuy()}>
              {buying ? <><Loader2 className="size-4 animate-spin" />Processing…</> : "Confirm & Buy"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 4 — Waiting / Received */}
      {step === 4 && activeNumber && requestId && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">{smsCode ? "OTP Received" : "Waiting for SMS"}</CardTitle>
            <CardDescription>{smsCode ? "Your verification code is ready." : "Polling every 5 seconds. Hang tight."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-100">
                <Phone className="size-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider">Your Number</p>
                <p className="mt-0.5 font-mono text-xl font-semibold text-slate-900 tracking-wide">{activeNumber}</p>
              </div>
            </div>

            {!smsCode && waiting && (
              <div className="flex flex-col items-center gap-5 py-8">
                <div className="relative">
                  <div className="absolute inset-0 animate-ping rounded-full bg-sky-100" />
                  <Loader2 className="relative size-12 animate-spin text-sky-600" />
                </div>
                <p className="text-sm text-slate-500">Waiting for verification code…</p>
                <Button variant="outline" disabled={cancelling} onClick={() => void onCancel()} className="border-slate-200">
                  {cancelling ? <><Loader2 className="size-4 animate-spin" />Cancelling…</> : "Cancel Order"}
                </Button>
              </div>
            )}

            {smsCode && (
              <div className="space-y-4 rounded-2xl border border-sky-200 bg-linear-to-br from-sky-50 to-white p-8 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">Verification Code</p>
                <p className="font-mono text-4xl font-extrabold tracking-[0.2em] text-slate-900 sm:text-5xl">{smsCode}</p>
                <Button variant="secondary" className="gap-2" onClick={async () => { await navigator.clipboard.writeText(smsCode); toast.success("Copied!"); }}>
                  <Copy className="size-4" />Copy Code
                </Button>
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-600">
                  <Check className="size-4" />Done — paste this code where you need it.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
