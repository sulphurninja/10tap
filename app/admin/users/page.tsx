"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Users, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type AdminUserRow = {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  walletBalance: number;
  createdAt: string;
};

const PAGE_SIZE = 20;

function formatInr(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function AdminUsersPage() {
  const [allUsers, setAllUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [walletUser, setWalletUser] = useState<AdminUserRow | null>(null);
  const [walletAmount, setWalletAmount] = useState("");
  const [walletReason, setWalletReason] = useState("");
  const [walletSaving, setWalletSaving] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const limit = 100;
      let p = 1;
      const acc: AdminUserRow[] = [];
      let total = 0;
      for (;;) {
        const res = await fetch(`/api/admin/users?page=${p}&limit=${limit}`);
        const json = (await res.json()) as {
          success?: boolean;
          data?: { items: AdminUserRow[]; total: number };
          error?: string;
        };
        if (!res.ok || !json.success || !json.data) throw new Error(json.error ?? "Failed to load users");
        total = json.data.total;
        acc.push(...json.data.items);
        if (acc.length >= total || json.data.items.length < limit) break;
        p += 1;
        if (p > 50) break;
      }
      setAllUsers(acc);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [allUsers, search]);

  useEffect(() => { setPage(1); }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const openWallet = (u: AdminUserRow) => {
    setWalletUser(u);
    setWalletAmount("");
    setWalletReason("");
  };

  const saveWallet = async () => {
    if (!walletUser) return;
    const amt = Number(walletAmount);
    if (!Number.isFinite(amt) || amt === 0) {
      toast.error("Enter a non-zero amount (positive to add, negative to deduct)");
      return;
    }
    setWalletSaving(true);
    try {
      const res = await fetch("/api/admin/users/wallet", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: walletUser._id, amount: amt, reason: walletReason }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed");
        return;
      }
      toast.success(`Wallet updated — new balance: ${formatInr(json.data?.newBalance ?? 0)}`);
      setWalletUser(null);
      setAllUsers((prev) =>
        prev.map((u) =>
          u._id === walletUser._id ? { ...u, walletBalance: json.data?.newBalance ?? u.walletBalance } : u
        )
      );
    } finally {
      setWalletSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-slate-500">
          <Users className="size-5 text-sky-600" aria-hidden />
          <span className="text-sm font-medium uppercase tracking-wider">Directory</span>
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">User management</h1>
        <p className="mt-1 text-slate-600">Search accounts, manage roles, and adjust wallet balances.</p>
      </div>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="text-lg text-slate-900">All users</CardTitle>
            <p className="text-sm text-slate-500">
              {loading
                ? "Loading…"
                : `${filtered.length} shown${search ? ` (filtered from ${allUsers.length})` : ` of ${allUsers.length}`}`}
            </p>
          </div>
          <div className="w-full sm:max-w-sm">
            <Label htmlFor="user-search" className="sr-only">Search users</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="user-search"
                placeholder="Filter by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-slate-200 bg-white pl-9 text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <div className="border-b border-slate-100 px-6 py-4 text-sm text-red-700">{error}</div>
          )}
          <div className="relative overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="min-w-35 font-semibold text-slate-900">Name</TableHead>
                  <TableHead className="min-w-50 font-semibold text-slate-900">Email</TableHead>
                  <TableHead className="min-w-20 font-semibold text-slate-900">Role</TableHead>
                  <TableHead className="min-w-30 text-right font-semibold text-slate-900">Wallet</TableHead>
                  <TableHead className="min-w-40 font-semibold text-slate-900">Joined</TableHead>
                  <TableHead className="min-w-25 font-semibold text-slate-900 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i} className="border-slate-100">
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="ml-auto h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : pageItems.length === 0 ? (
                  <TableRow className="border-slate-100">
                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                      {allUsers.length === 0 ? "No users found." : "No users match your search."}
                    </TableCell>
                  </TableRow>
                ) : (
                  pageItems.map((u) => (
                    <TableRow key={u._id} className="border-slate-100 transition-colors hover:bg-slate-50">
                      <TableCell className="font-medium text-slate-900">{u.name}</TableCell>
                      <TableCell className="text-slate-600">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "font-normal capitalize",
                          u.role === "admin"
                            ? "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50"
                            : "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-100"
                        )}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums text-slate-900">
                        {formatInr(u.walletBalance ?? 0)}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">{formatDate(u.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openWallet(u)}>
                          <Wallet className="size-3.5" />Wallet
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {!loading && filtered.length > 0 && (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 px-4 py-4 sm:flex-row sm:px-6">
              <p className="text-sm text-slate-500">Page {currentPage} of {totalPages}</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="border-slate-200">Previous</Button>
                <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="border-slate-200">Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wallet adjust dialog */}
      <Dialog open={!!walletUser} onOpenChange={(o) => !o && setWalletUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust wallet</DialogTitle>
            <DialogDescription>
              {walletUser?.name} ({walletUser?.email}) — current balance:{" "}
              <strong className="text-slate-900">{formatInr(walletUser?.walletBalance ?? 0)}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                step={0.01}
                placeholder="+500 to add, -200 to deduct"
                value={walletAmount}
                onChange={(e) => setWalletAmount(e.target.value)}
                className="mt-1 font-mono"
              />
              <p className="mt-1 text-xs text-slate-400">Positive = credit, negative = deduction</p>
            </div>
            <div>
              <Label>Reason (optional)</Label>
              <Input
                placeholder="e.g. Manual refund, bonus credit"
                value={walletReason}
                onChange={(e) => setWalletReason(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWalletUser(null)}>Cancel</Button>
            <Button
              className="bg-sky-600 text-white hover:bg-sky-700"
              disabled={walletSaving || !walletAmount || Number(walletAmount) === 0}
              onClick={() => void saveWallet()}
            >
              {walletSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Update wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
