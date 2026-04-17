"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const canSubmit =
    name.trim().length >= 2 &&
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) &&
    message.trim().length >= 10 &&
    !submitting;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        toast.error(json.error ?? "Could not send message");
        return;
      }
      toast.success("Message sent — we'll be in touch");
      setSent(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch {
      toast.error("Network error — try again in a moment");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
        <p className="text-sm font-semibold text-emerald-800">
          Thanks — your message is on its way.
        </p>
        <p className="mt-1 text-xs text-emerald-700">
          We&apos;ll reply to the email address you provided, usually within a
          business day.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 rounded-lg border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50"
          onClick={() => setSent(false)}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contact-name" className="text-slate-700">
            Name
          </Label>
          <Input
            id="contact-name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="rounded-lg border-slate-200"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-email" className="text-slate-700">
            Email
          </Label>
          <Input
            id="contact-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded-lg border-slate-200"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-subject" className="text-slate-700">
          Subject <span className="font-normal text-slate-400">(optional)</span>
        </Label>
        <Input
          id="contact-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Wallet top-up issue"
          className="rounded-lg border-slate-200"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-message" className="text-slate-700">
          Message
        </Label>
        <textarea
          id="contact-message"
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what you need help with…"
          className="flex w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-slate-400 focus-visible:border-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/30"
          required
          minLength={10}
        />
        <p className="text-xs text-slate-400">
          Minimum 10 characters. Please include any order IDs that help us
          investigate.
        </p>
      </div>

      <Button
        type="submit"
        disabled={!canSubmit}
        className="h-11 w-full rounded-lg bg-sky-600 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
      >
        {submitting ? (
          <>
            <Loader2 className="mr-1.5 size-4 animate-spin" /> Sending…
          </>
        ) : (
          <>
            <Send className="mr-1.5 size-4" /> Send message
          </>
        )}
      </Button>
    </form>
  );
}
