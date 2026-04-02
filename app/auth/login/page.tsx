"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Sign in failed");
        return;
      }
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-slate-200 bg-white shadow-lg shadow-slate-200/50">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold text-slate-900">Welcome back</CardTitle>
        <CardDescription className="text-slate-500">Sign in to your 10tap account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700">Email</Label>
            <Input id="email" type="email" autoComplete="email" required value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com"
              className="h-11 border-slate-200 focus-visible:ring-sky-500" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" required value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
              className="h-11 border-slate-200 focus-visible:ring-sky-500" />
          </div>
          <Button type="submit" disabled={pending}
            className="mt-2 h-11 w-full bg-sky-600 font-semibold text-white hover:bg-sky-700">
            {pending ? "Signing in…" : "Sign In"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="font-medium text-sky-600 underline-offset-4 hover:underline">Sign up</Link>
        </p>
      </CardContent>
    </Card>
  );
}
