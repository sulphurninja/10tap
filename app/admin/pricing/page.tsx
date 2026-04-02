"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Percent, IndianRupee, Save } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

type MarkupRule = { type: "percent" | "fixed_inr"; value: number };

type Project = { id: number; title: string; code: string };

type SettingsPayload = {
  usdInrRate: number;
  globalOtpMarkup: MarkupRule;
  globalRentalMarkup: MarkupRule;
  otpServiceMarkups: { projectId: number; markup: MarkupRule }[];
  rentalAreaMarkups: { areaCode: string; markup: MarkupRule }[];
};

export default function AdminPricingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState<SettingsPayload | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pricing");
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to load");
        return;
      }
      const s = json.data?.settings;
      if (!s) return;
      setProjects(json.data?.projects ?? []);
      setForm({
        usdInrRate: s.usdInrRate,
        globalOtpMarkup: s.globalOtpMarkup ?? { type: "percent", value: 0 },
        globalRentalMarkup: s.globalRentalMarkup ?? { type: "percent", value: 0 },
        otpServiceMarkups: s.otpServiceMarkups ?? [],
        rentalAreaMarkups: s.rentalAreaMarkups ?? [],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Save failed");
        return;
      }
      toast.success("Pricing updated");
      await load();
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-sky-600" />
      </div>
    );
  }

  const updateGlobal = (which: "otp" | "rental", patch: Partial<MarkupRule>) => {
    setForm((f) => {
      if (!f) return f;
      const key = which === "otp" ? "globalOtpMarkup" : "globalRentalMarkup";
      return { ...f, [key]: { ...f[key], ...patch } };
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pricing &amp; markups</h1>
        <p className="mt-1 text-sm text-slate-500">
          SMS-BUS quotes prices in <strong>USD</strong>. We convert with <strong>USD → INR</strong>, then apply your
          markups. OTP and long-term rentals can use different global rules; you can add per-service (OTP) and
          per-area (rental) markups on top.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Base FX rate</CardTitle>
          <CardDescription>How many INR for 1 USD before markups (stored in database).</CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="rate">USD → INR</Label>
          <Input
            id="rate"
            type="number"
            min={1}
            step={0.01}
            className="mt-1 max-w-xs"
            value={form.usdInrRate}
            onChange={(e) => setForm({ ...form, usdInrRate: Number(e.target.value) })}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="size-4 text-sky-600" />
              Global OTP markup
            </CardTitle>
            <CardDescription>Applies to every one-time activation price after FX.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Type</Label>
              <select
                className={cn(
                  "mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm",
                  "focus-visible:ring-2 focus-visible:ring-sky-500/30 focus-visible:outline-none"
                )}
                value={form.globalOtpMarkup.type}
                onChange={(e) =>
                  updateGlobal("otp", { type: e.target.value as "percent" | "fixed_inr" })
                }
              >
                <option value="percent">Percent (%)</option>
                <option value="fixed_inr">Fixed (₹)</option>
              </select>
            </div>
            <div>
              <Label>{form.globalOtpMarkup.type === "percent" ? "Percent added" : "Rupees added"}</Label>
              <Input
                type="number"
                step={0.01}
                className="mt-1"
                value={form.globalOtpMarkup.value}
                onChange={(e) => updateGlobal("otp", { value: Number(e.target.value) })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="size-4 text-cyan-600" />
              Global rental markup
            </CardTitle>
            <CardDescription>Applies to long-term rental amounts after FX.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Type</Label>
              <select
                className={cn(
                  "mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm",
                  "focus-visible:ring-2 focus-visible:ring-sky-500/30 focus-visible:outline-none"
                )}
                value={form.globalRentalMarkup.type}
                onChange={(e) =>
                  updateGlobal("rental", { type: e.target.value as "percent" | "fixed_inr" })
                }
              >
                <option value="percent">Percent (%)</option>
                <option value="fixed_inr">Fixed (₹)</option>
              </select>
            </div>
            <div>
              <Label>{form.globalRentalMarkup.type === "percent" ? "Percent added" : "Rupees added"}</Label>
              <Input
                type="number"
                step={0.01}
                className="mt-1"
                value={form.globalRentalMarkup.value}
                onChange={(e) => updateGlobal("rental", { value: Number(e.target.value) })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Per-service OTP markups</CardTitle>
          <CardDescription>
            Stacked <strong>after</strong> global OTP markup. Match by SMS-BUS project id (same as in their dashboard).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {form.otpServiceMarkups.map((row, idx) => (
                <TableRow key={`${row.projectId}-${idx}`}>
                  <TableCell>
                    <select
                      className="w-full max-w-xs rounded-md border border-slate-200 px-2 py-1 text-sm"
                      value={row.projectId}
                      onChange={(e) => {
                        const next = [...form.otpServiceMarkups];
                        next[idx] = { ...next[idx], projectId: Number(e.target.value) };
                        setForm({ ...form, otpServiceMarkups: next });
                      }}
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.code}) · #{p.id}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>
                    <select
                      className="rounded-md border border-slate-200 px-2 py-1 text-sm"
                      value={row.markup.type}
                      onChange={(e) => {
                        const next = [...form.otpServiceMarkups];
                        next[idx] = {
                          ...next[idx],
                          markup: { ...next[idx].markup, type: e.target.value as "percent" | "fixed_inr" },
                        };
                        setForm({ ...form, otpServiceMarkups: next });
                      }}
                    >
                      <option value="percent">%</option>
                      <option value="fixed_inr">₹</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step={0.01}
                      className="h-8 w-24"
                      value={row.markup.value}
                      onChange={(e) => {
                        const next = [...form.otpServiceMarkups];
                        next[idx] = {
                          ...next[idx],
                          markup: { ...next[idx].markup, value: Number(e.target.value) },
                        };
                        setForm({ ...form, otpServiceMarkups: next });
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() =>
                        setForm({
                          ...form,
                          otpServiceMarkups: form.otpServiceMarkups.filter((_, i) => i !== idx),
                        })
                      }
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setForm({
                ...form,
                otpServiceMarkups: [
                  ...form.otpServiceMarkups,
                  { projectId: projects[0]?.id ?? 1, markup: { type: "percent", value: 0 } },
                ],
              })
            }
            disabled={projects.length === 0}
          >
            Add service rule
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Per-area rental markups</CardTitle>
          <CardDescription>
            Stacked <strong>after</strong> global rental markup. Use area codes like US, CA, GB.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Area code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {form.rentalAreaMarkups.map((row, idx) => (
                <TableRow key={`${row.areaCode}-${idx}`}>
                  <TableCell>
                    <Input
                      className="h-8 max-w-30 font-mono uppercase"
                      value={row.areaCode}
                      onChange={(e) => {
                        const next = [...form.rentalAreaMarkups];
                        next[idx] = { ...next[idx], areaCode: e.target.value.toUpperCase() };
                        setForm({ ...form, rentalAreaMarkups: next });
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <select
                      className="rounded-md border border-slate-200 px-2 py-1 text-sm"
                      value={row.markup.type}
                      onChange={(e) => {
                        const next = [...form.rentalAreaMarkups];
                        next[idx] = {
                          ...next[idx],
                          markup: { ...next[idx].markup, type: e.target.value as "percent" | "fixed_inr" },
                        };
                        setForm({ ...form, rentalAreaMarkups: next });
                      }}
                    >
                      <option value="percent">%</option>
                      <option value="fixed_inr">₹</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step={0.01}
                      className="h-8 w-24"
                      value={row.markup.value}
                      onChange={(e) => {
                        const next = [...form.rentalAreaMarkups];
                        next[idx] = {
                          ...next[idx],
                          markup: { ...next[idx].markup, value: Number(e.target.value) },
                        };
                        setForm({ ...form, rentalAreaMarkups: next });
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() =>
                        setForm({
                          ...form,
                          rentalAreaMarkups: form.rentalAreaMarkups.filter((_, i) => i !== idx),
                        })
                      }
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setForm({
                ...form,
                rentalAreaMarkups: [
                  ...form.rentalAreaMarkups,
                  { areaCode: "US", markup: { type: "percent", value: 0 } },
                ],
              })
            }
          >
            Add area rule
          </Button>
        </CardContent>
      </Card>

      <Separator />

      <Button className="bg-sky-600 text-white hover:bg-sky-700" disabled={saving} onClick={() => void save()}>
        {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
        Save pricing
      </Button>
    </div>
  );
}
